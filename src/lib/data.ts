import type { Avatar, Team } from "./types";
export const WORLD_ID =
  process.env.NEXT_PUBLIC_WORLD_ID || "11111111-1111-4111-8111-111111111111";
export const AVATAR_INFO: Record<
  Avatar,
  { name: string; color: string; role: string }
> = {
  ranger: {
    name: "코드 개발자",
    color: "#66876b",
    role: "후드티 · 헤드셋 · 노트북 — 아이디어를 코드로 만드는 동료",
  },
  mage: {
    name: "픽셀 디자이너",
    color: "#9283ba",
    role: "베레모 · 펜 태블릿 — 더 나은 경험을 그리는 동료",
  },
  engineer: {
    name: "로봇 엔지니어",
    color: "#c48752",
    role: "작업 조끼 · 미니 로봇 — 안정적인 시스템을 만드는 동료",
  },
  explorer: {
    name: "프로덕트 기획자",
    color: "#628eaf",
    role: "태블릿 · 메모보드 — 팀의 다음 목적지를 찾는 동료",
  },
};
export const DEFAULT_TEAMS: Team[] = [
  ["1", "숲의 길드", "forest", "#708d66", "♧", "FOREST GUILD"],
  ["2", "메이커스 랩", "makers", "#c58e53", "⚒", "MAKERS LAB"],
  ["3", "별빛 타워", "starlight", "#9480ae", "✧", "STARLIGHT TOWER"],
  ["4", "모래빛 기지", "sandstone", "#bd9a63", "⌂", "SANDSTONE BASE"],
  ["5", "블루 하버", "harbor", "#679ba8", "≈", "BLUE HARBOR"],
].map(([n, name, slug, color, icon, subtitle]) => ({
  id: `22222222-2222-4222-8222-${n.padStart(12, "0")}`,
  world_id: WORLD_ID,
  name,
  slug,
  room_id: `team-${n}`,
  theme: { color, icon, subtitle },
}));
