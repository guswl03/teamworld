import type { Player, Transport, TransportCallbacks } from "./types";
import { getSupabase } from "./supabase";
import { isPlayer, mergePresence } from "./transport";
export function createSupabaseTransport(
  initial: Player,
  callbacks: TransportCallbacks,
): Transport {
  const client = getSupabase();
  let self = { ...initial };
  let peers: Player[] = [];
  let ready = false;
  let closed = false;
  const channel = client.channel(`world:${self.world_id}`, {
    config: {
      private: true,
      broadcast: { self: false },
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
