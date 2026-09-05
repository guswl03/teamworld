export const WORLD_TASKS = [
  { id: "chat", icon: "◌", label: "채팅", key: "Enter", code: "Enter" },
  { id: "people", icon: "♧", label: "동료", key: "P", code: "KeyP" },
  { id: "quests", icon: "✧", label: "퀘스트", key: "Q", code: "KeyQ" },
  { id: "bag", icon: "♜", label: "배낭", key: "I", code: "KeyI" },
  { id: "guilds", icon: "⌂", label: "길드", key: "G", code: "KeyG" },
  { id: "settings", icon: "⚙", label: "설정", key: "O", code: "KeyO" },
] as const;
export type WorldTask = (typeof WORLD_TASKS)[number]["id"];
export function worldShortcut(
  code: string,
  context: {
    typing?: boolean;
    composing?: boolean;
    modified?: boolean;
    repeat?: boolean;
    modal?: boolean;
    interactive?: boolean;
  } = {},
): WorldTask | "close" | null {
  if (context.composing || context.modified || context.repeat || context.modal)
    return null;
  if (code === "Escape") return "close";
  if (context.typing) return null;
  if (code === "Enter" || code === "NumpadEnter")
    return context.interactive ? null : "chat";
  return WORLD_TASKS.find((task) => task.code === code)?.id ?? null;
}
