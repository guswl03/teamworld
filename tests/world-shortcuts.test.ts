import test from "node:test";
import assert from "node:assert/strict";
import { worldShortcut } from "../src/game/world-shortcuts";

test("RPG shortcut keys open their tasks without changing movement keys", () => {
  for (const [key, task] of [
    ["Enter", "chat"],
    ["NumpadEnter", "chat"],
    ["KeyI", "bag"],
    ["KeyQ", "quests"],
    ["KeyG", "guilds"],
    ["KeyP", "people"],
    ["KeyO", "settings"],
  ])
    assert.equal(worldShortcut(key), task);
  for (const key of ["KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "ArrowLeft"])
    assert.equal(worldShortcut(key), null);
});
test("typing, IME, modal dialogs and modified or repeated keys cannot trigger shortcuts", () => {
  for (const context of [
    { typing: true },
    { composing: true },
    { modal: true },
    { modified: true },
    { repeat: true },
  ]) {
    assert.equal(worldShortcut("KeyQ", context), null);
    assert.equal(worldShortcut("Enter", context), null);
  }
  assert.equal(worldShortcut("Enter", { interactive: true }), null);
  assert.equal(worldShortcut("Escape", { typing: true }), "close");
  assert.equal(worldShortcut("Escape", { composing: true }), null);
  assert.equal(worldShortcut("Escape", { modal: true }), null);
});
