export interface ChatPacket {
  id: string;
  session_id: string;
  world_id: string;
  text: string;
}
export interface ChatMessage extends ChatPacket {
  nickname: string;
  receivedAt: number;
}
export function normalizeChat(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 &&
    text.length <= 200 &&
    !/[\x00-\x08\x0B-\x1F\x7F]/.test(text)
    ? text
    : null;
}
export function appendChat(messages: ChatMessage[], message: ChatMessage) {
  return messages.some(
    (m) => m.id === message.id && m.session_id === message.session_id,
  )
    ? messages
    : [...messages, message].slice(-100);
}
export function createChatGate() {
  let lastSent = -Infinity;
  const seen = new Set<string>();
  const lastReceived = new Map<string, number>();
  return {
    send(now = Date.now()) {
      if (now - lastSent < 1000) return false;
      lastSent = now;
      return true;
    },
    receive(
      value: unknown,
      worldId: string,
      peers: { session_id: string; nickname: string }[],
      now = Date.now(),
    ): ChatMessage | null {
      if (!value || typeof value !== "object") return null;
      const p = value as ChatPacket;
      if (
        typeof p.id !== "string" ||
        !p.id ||
        p.id.length > 80 ||
        p.world_id !== worldId ||
        typeof p.session_id !== "string"
      )
        return null;
      const peer = peers.find((v) => v.session_id === p.session_id);
      const text = normalizeChat(p.text);
      const key = `${p.session_id}:${p.id}`;
      if (
        !peer ||
        !text ||
        seen.has(key) ||
        now - (lastReceived.get(p.session_id) ?? -Infinity) < 1000
      )
        return null;
      seen.add(key);
      if (seen.size > 300) seen.delete(seen.values().next().value!);
      for (const id of lastReceived.keys())
        if (!peers.some((v) => v.session_id === id)) lastReceived.delete(id);
      lastReceived.set(p.session_id, now);
      return {
        id: p.id,
        session_id: p.session_id,
        world_id: worldId,
        text,
        nickname: peer.nickname,
        receivedAt: now,
      };
    },
  };
}
