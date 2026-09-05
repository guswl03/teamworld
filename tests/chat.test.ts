import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeChat,
  appendChat,
  createChatGate,
  type ChatMessage,
} from "../src/lib/chat";

test("chat trims input and rejects empty or oversized messages", () => {
  assert.equal(normalizeChat("  안녕하세요  "), "안녕하세요");
  assert.equal(normalizeChat("<b>hello</b>"), "<b>hello</b>");
  for (const text of ["", "   ", "x".repeat(201), null])
    assert.equal(normalizeChat(text), null);
});
test("chat history is bounded and duplicate IDs do not appear twice", () => {
  let messages: ChatMessage[] = [];
  for (let i = 0; i < 105; i++)
    messages = appendChat(messages, {
      id: String(i),
      session_id: "s",
      world_id: "w",
      text: "hi",
      nickname: "peer",
      receivedAt: i,
    });
  assert.equal(messages.length, 100);
  assert.equal(messages[0].id, "5");
  assert.equal(appendChat(messages, messages[99]).length, 100);
});
test("chat gate enforces rate limits, known sessions, world and replay checks", () => {
  const gate = createChatGate();
  assert.equal(gate.send(1000), true);
  assert.equal(gate.send(1999), false);
  assert.equal(gate.send(2000), true);
  const packet = { id: "m1", session_id: "s", world_id: "w", text: "hello" };
  const peers = [{ session_id: "s", nickname: "친구" }];
  assert.equal(gate.receive(packet, "other", peers, 1000), null);
  assert.equal(gate.receive(packet, "w", [], 1000), null);
  assert.equal(gate.receive(packet, "w", peers, 1000)?.nickname, "친구");
  assert.equal(gate.receive(packet, "w", peers, 2000), null);
  assert.equal(gate.receive({ ...packet, id: "m2" }, "w", peers, 1500), null);
  assert.equal(
    gate.receive({ ...packet, id: "m3" }, "w", peers, 2000)?.text,
    "hello",
  );
});
