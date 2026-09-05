// Fictional learning center, not an official or surveyed BoB floor plan.
// Every solid object here is both rendered and used for movement collision.
export type CenterObject = {
  id: string;
  kind: "wall" | "desk" | "sofa" | "plant" | "reception" | "table";
  x: number;
  y: number;
  width: number;
  height: number;
};
export const LOBBY = { x: 800, y: 900 };
export const CENTER_ROOMS = [
  {
    x: 140,
    y: 150,
    width: 340,
    height: 300,
    name: "01 · 시스템 랩",
    doorX: 310,
  },
  {
    x: 620,
    y: 90,
    width: 360,
    height: 300,
    name: "02 · 협업 스튜디오",
    doorX: 800,
  },
  {
    x: 1120,
    y: 150,
    width: 340,
    height: 300,
    name: "03 · AI 보안 랩",
    doorX: 1290,
  },
  {
    x: 160,
    y: 700,
    width: 480,
    height: 290,
    name: "04 · 프로젝트 룸",
    doorX: 420,
  },
  {
    x: 980,
    y: 700,
    width: 480,
    height: 290,
    name: "05 · 클라우드 랩",
    doorX: 1190,
  },
];
export const CENTER_DOORS = CENTER_ROOMS.map((r) => ({
  x: r.doorX,
  y: r.y + r.height,
  name: r.name,
}));
const objects: CenterObject[] = [];
for (const [i, r] of CENTER_ROOMS.entries()) {
  const add = (
    part: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) =>
    objects.push({
      id: `room-${i}-${part}`,
      kind: "wall",
      x,
      y,
      width,
      height,
    });
  add("north", r.x, r.y, r.width, 12);
  add("west", r.x, r.y, 12, r.height);
  add("east", r.x + r.width - 12, r.y, 12, r.height);
  add("south-left", r.x, r.y + r.height - 12, r.doorX - 55 - r.x, 12);
  add(
    "south-right",
    r.doorX + 55,
    r.y + r.height - 12,
    r.x + r.width - r.doorX - 55,
    12,
  );
  for (const [j, x] of [r.x + 45, r.x + r.width - 135].entries())
    objects.push({
      id: `desk-${i}-${j}`,
      kind: "desk",
      x,
      y: r.y + 95,
      width: 90,
      height: 46,
    });
  objects.push({
    id: `plant-${i}`,
    kind: "plant",
    x: r.x + r.width - 48,
    y: r.y + 28,
    width: 26,
    height: 26,
  });
}
objects.push(
  { id: "lounge-table", kind: "table", x: 765, y: 515, width: 70, height: 55 },
  {
    id: "lounge-sofa-left",
    kind: "sofa",
    x: 680,
    y: 495,
    width: 40,
    height: 82,
  },
  {
    id: "lounge-sofa-right",
    kind: "sofa",
    x: 880,
    y: 495,
    width: 40,
    height: 82,
  },
  {
    id: "reception",
    kind: "reception",
    x: 710,
    y: 935,
    width: 180,
    height: 48,
  },
  {
    id: "window-plant-left",
    kind: "plant",
    x: 530,
    y: 180,
    width: 32,
    height: 32,
  },
  {
    id: "window-plant-right",
    kind: "plant",
    x: 1030,
    y: 180,
    width: 32,
    height: 32,
  },
);
export const CENTER_OBJECTS: readonly CenterObject[] = objects;
