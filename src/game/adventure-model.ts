export const NPC = { x: 720, y: 900, name: "센터 안내원 루미" };
export const CHEST = { x: 960, y: 750, name: "웰컴 키트 보관함" };
export const LANDMARKS = [
  {
    id: "garden",
    x: 500,
    y: 450,
    name: "시스템 랩 안내존",
    icon: "❀",
    hint: "센터 서쪽, 시스템 랩 옆 안내존",
  },
  {
    id: "market",
    x: 1050,
    y: 395,
    name: "AI 보안 랩 안내존",
    icon: "⚑",
    hint: "센터 북동쪽, AI 보안 랩 옆 안내존",
  },
  {
    id: "pond",
    x: 780,
    y: 870,
    name: "리셉션 로비",
    icon: "≈",
    hint: "센터 남쪽, 안내 데스크 앞 로비",
  },
] as const;
type Point = { x: number; y: number };
export interface Adventure {
  version: 1;
  accepted: boolean;
  visited: string[];
  treasure: boolean;
  rewarded: boolean;
  equipped: boolean;
}
export const freshAdventure = (): Adventure => ({
  version: 1,
  accepted: false,
  visited: [],
  treasure: false,
  rewarded: false,
  equipped: false,
});
export const near = (a: Point, b: Point, radius = 65) =>
  Math.hypot(a.x - b.x, a.y - b.y) <= radius;
export function advanceAdventure(
  state: Adventure,
  action: "visit" | "interact" | "equip",
  position: Point,
): Adventure {
  if (action === "equip")
    return state.rewarded ? { ...state, equipped: !state.equipped } : state;
  if (action === "visit" && state.accepted) {
    const point = LANDMARKS.find(
      (p) => near(position, p) && !state.visited.includes(p.id),
    );
    return point ? { ...state, visited: [...state.visited, point.id] } : state;
  }
  if (action === "interact") {
    if (near(position, NPC)) {
      if (!state.accepted) return { ...state, accepted: true };
      if (state.treasure && !state.rewarded)
        return { ...state, rewarded: true };
    }
    if (
      near(position, CHEST) &&
      state.accepted &&
      state.visited.length === 3 &&
      !state.treasure
    )
      return { ...state, treasure: true };
  }
  return state;
}
export function restoreAdventure(value: unknown): Adventure {
  if (!value || typeof value !== "object") return freshAdventure();
  const s = value as Adventure;
  if (
    s.version !== 1 ||
    ![s.accepted, s.treasure, s.rewarded, s.equipped].every(
      (v) => typeof v === "boolean",
    ) ||
    !Array.isArray(s.visited) ||
    s.visited.length > 3 ||
    new Set(s.visited).size !== s.visited.length ||
    s.visited.some((id) => !LANDMARKS.some((p) => p.id === id)) ||
    (!s.accepted && s.visited.length > 0) ||
    (s.treasure && (!s.accepted || s.visited.length !== 3)) ||
    (s.rewarded && !s.treasure) ||
    (s.equipped && !s.rewarded)
  )
    return freshAdventure();
  return {
    version: 1,
    accepted: s.accepted,
    visited: [...s.visited],
    treasure: s.treasure,
    rewarded: s.rewarded,
    equipped: s.equipped,
  };
}
export function adventureObjective(s: Adventure) {
  if (!s.accepted) return "리셉션의 안내원 루미와 이야기하기";
  if (s.visited.length < 3)
    return `센터 안내존 둘러보기 · ${s.visited.length}/3`;
  if (!s.treasure) return "로비 북동쪽의 웰컴 키트 받기";
  if (!s.rewarded) return "루미에게 돌아가 센터 탐방 보고하기";
  return "센터 탐방 완료! 배낭에서 보상 모자를 써 보세요";
}
