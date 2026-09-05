export const NPC = { x: 720, y: 660, name: "마을지기 루미" };
export const CHEST = { x: 1060, y: 725, name: "오래된 보물상자" };
export const LANDMARKS = [
  {
    id: "garden",
    x: 500,
    y: 450,
    name: "바람꽃 정원",
    icon: "❀",
    hint: "숲의 길드 오른쪽, 꽃이 피어난 작은 정원",
  },
  {
    id: "market",
    x: 1050,
    y: 395,
    name: "별빛 시장",
    icon: "⚑",
    hint: "광장 북동쪽, 줄무늬 천막이 있는 시장",
  },
  {
    id: "pond",
    x: 780,
    y: 870,
    name: "달빛 연못",
    icon: "≈",
    hint: "광장 남쪽, 작은 나무다리가 있는 연못",
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
  if (!s.accepted) return "광장의 마을지기 루미와 이야기하기";
  if (s.visited.length < 3) return `마을 명소 둘러보기 · ${s.visited.length}/3`;
  if (!s.treasure) return "시장 남쪽의 보물상자 열기";
  if (!s.rewarded) return "루미에게 돌아가 탐험 보고하기";
  return "첫 모험 완료! 배낭에서 보상 모자를 써 보세요";
}
