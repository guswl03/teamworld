import type { Avatar, Team } from "./types";
export const WORLD_ID =
  process.env.NEXT_PUBLIC_WORLD_ID || "11111111-1111-4111-8111-111111111111";
export const AVATAR_INFO: Record<
  Avatar,
  { name: string; color: string; role: string }
> = {
  ranger: {
    name: "숲의 탐험가",
    color: "#66876b",
    role: "새로운 길을 발견하는 사람",
  },
  mage: {
    name: "별빛 마법사",
    color: "#9283ba",
    role: "작은 아이디어를 마법으로",
  },
  engineer: {
    name: "길드 엔지니어",
    color: "#c48752",
    role: "함께하는 세계를 만드는 사람",
  },
  explorer: {
    name: "바다의 모험가",
    color: "#628eaf",
    role: "가능성 너머로 항해하는 사람",
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
