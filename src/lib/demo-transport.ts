import type { Player, Transport, TransportCallbacks } from "./types";
import { isPlayer } from "./transport";
import { createChatGate, normalizeChat } from "./chat";
export function createDemoTransport(
  initial: Player,
  callbacks: TransportCallbacks,
): Transport {
  const channel = new BroadcastChannel(`teamworld:demo:${initial.world_id}`);
  let self = { ...initial };
  let closed = false;
  const chatGate = createChatGate();
  const peers = new Map<string, { player: Player; seen: number }>();
  const publish = () =>
    callbacks.players([...peers.values()].map((p) => p.player));
  const send = (type: string) => {
    if (!closed) channel.postMessage({ type, player: self });
  };
  channel.onmessage = (event) => {
    const message = event.data;
    if (message?.type === "chat") {
      const chat = chatGate.receive(
        message.packet,
        self.world_id,
        [...peers.values()].map((p) => p.player),
      );
      if (chat && !closed) callbacks.chat?.(chat);
      return;
    }
    if (
      !message ||
      !isPlayer(message.player) ||
      message.player.world_id !== self.world_id ||
      message.player.session_id === self.session_id
    )
      return;
    if (message.type === "leave") peers.delete(message.player.session_id);
    else if (["hello", "state"].includes(message.type)) {
      peers.set(message.player.session_id, {
        player: message.player,
        seen: Date.now(),
      });
      if (message.type === "hello") send("state");
    } else return;
    publish();
  };
  const heartbeat = setInterval(() => {
    send("state");
    let changed = false;
    for (const [id, peer] of peers)
      if (Date.now() - peer.seen > 9000) {
        peers.delete(id);
        changed = true;
      }
    if (changed) publish();
  }, 2000);
  function close() {
    if (closed) return;
    send("leave");
    closed = true;
    clearInterval(heartbeat);
    channel.close();
    window.removeEventListener("pagehide", close);
    callbacks.connection("disconnected");
  }
  window.addEventListener("pagehide", close);
  callbacks.connection("connected");
  send("hello");
  return {
    async chat(value) {
      const text = normalizeChat(value);
      if (closed) throw new Error("연결이 끊겨 메시지를 보내지 못했어요.");
      if (!text) throw new Error("메시지는 1~200자로 입력해 주세요.");
      if (!chatGate.send())
        throw new Error("잠시 후 다시 보내 주세요. (1초 간격)");
      const packet = {
        id: crypto.randomUUID(),
        session_id: self.session_id,
        world_id: self.world_id,
        text,
      };
      channel.postMessage({ type: "chat", packet });
      callbacks.chat?.({
        ...packet,
        nickname: self.nickname,
        receivedAt: Date.now(),
      });
    },
    move(position, room_id) {
      self = { ...self, ...position, room_id };
      send("state");
    },
    update(profile) {
      self = { ...self, ...profile };
      send("state");
    },
    close,
  };
}
