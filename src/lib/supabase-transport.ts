import type { Player, Transport, TransportCallbacks } from "./types";
import { getSupabase } from "./supabase";
import { isPlayer, mergePresence } from "./transport";
import { createChatGate, normalizeChat } from "./chat";
export function createSupabaseTransport(
  initial: Player,
  callbacks: TransportCallbacks,
): Transport {
  const client = getSupabase();
  let self = { ...initial };
  let peers: Player[] = [];
  let ready = false;
  let closed = false;
  const chatGate = createChatGate();
  const channel = client.channel(`world:${self.world_id}`, {
    config: {
      private: true,
      broadcast: { self: false, ack: true },
      presence: { key: self.session_id },
    },
  });
  const publish = () => callbacks.players(peers);
  const track = () => {
    if (ready && !closed)
      void channel.track(self).then((result) => {
        if (result !== "ok" && !closed) callbacks.connection("disconnected");
      });
  };
  channel
    .on("broadcast", { event: "world_chat" }, ({ payload }) => {
      if (closed || !ready) return;
      const message = chatGate.receive(payload, self.world_id, peers);
      if (message) callbacks.chat?.(message);
    })
    .on("presence", { event: "sync" }, () => {
      peers = mergePresence(
        Object.values(channel.presenceState()).flat(),
        peers,
        self.session_id,
      ).filter((p) => p.world_id === self.world_id);
      publish();
    })
    .on("broadcast", { event: "player_move" }, ({ payload }) => {
      if (
        !isPlayer(payload) ||
        payload.world_id !== self.world_id ||
        payload.session_id === self.session_id
      )
        return;
      // Accept movement only for a currently present session. Payload identity is not an authorization boundary.
      const index = peers.findIndex(
        (p) => p.session_id === payload.session_id && p.id === payload.id,
      );
      if (index >= 0) {
        peers[index] = {
          ...peers[index],
          x: payload.x,
          y: payload.y,
          direction: payload.direction,
          moving: payload.moving,
          room_id: payload.room_id,
        };
        publish();
      }
    });
  callbacks.connection("connecting");
  void client.realtime
    .setAuth()
    .then(() => {
      if (closed) return;
      channel.subscribe((state) => {
        ready = state === "SUBSCRIBED";
        if (closed) return;
        callbacks.connection(
          ready
            ? "connected"
            : state === "CLOSED" ||
                state === "CHANNEL_ERROR" ||
                state === "TIMED_OUT"
              ? "disconnected"
              : "connecting",
        );
        if (ready) track();
        else {
          peers = [];
          publish();
        }
      });
    })
    .catch(() => {
      if (!closed) callbacks.connection("disconnected");
    });
  // Low-frequency snapshots let late joiners see the current position without writing movement to the database.
  const heartbeat = setInterval(track, 5000);
  return {
    async chat(value) {
      const text = normalizeChat(value);
      if (!ready || closed)
        throw new Error("연결이 끊겨 메시지를 보내지 못했어요.");
      if (!text) throw new Error("메시지는 1~200자로 입력해 주세요.");
      if (!chatGate.send())
        throw new Error("잠시 후 다시 보내 주세요. (1초 간격)");
      const packet = {
        id: crypto.randomUUID(),
        session_id: self.session_id,
        world_id: self.world_id,
        text,
      };
      const result = await channel.send({
        type: "broadcast",
        event: "world_chat",
        payload: packet,
      });
      if (result !== "ok" || closed)
        throw new Error("전송하지 못했어요. 연결을 확인하고 다시 보내 주세요.");
      callbacks.chat?.({
        ...packet,
        nickname: self.nickname,
        receivedAt: Date.now(),
      });
    },
    move(position, room_id) {
      const changed = room_id !== self.room_id;
      self = { ...self, ...position, room_id };
      if (ready && !closed)
        void channel
          .send({ type: "broadcast", event: "player_move", payload: self })
          .then((result) => {
            if (result !== "ok" && !closed)
              callbacks.connection("disconnected");
          });
      if (changed) track();
    },
    update(profile) {
      self = { ...self, ...profile };
      track();
    },
    close() {
      closed = true;
      ready = false;
      clearInterval(heartbeat);
      void client.removeChannel(channel);
    },
  };
}
