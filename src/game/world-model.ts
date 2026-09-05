import type { Position, Team } from "../lib/types";
export const WORLD = { width: 1600, height: 1120, speed: 185, radius: 12 };
export interface Region {
  id: string;
  teamId: string;
  x: number;
  y: number;
  color: string;
  name: string;
}
export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}
const ANCHORS = [
  [310, 330],
  [800, 210],
  [1290, 330],
  [420, 830],
  [1190, 830],
];
export function regionsFor(teams: Team[]): Region[] {
  return teams.map((t, i) => {
    const [x, y] = ANCHORS[i] || [
      800 + Math.cos(i * 2.4) * 550,
      560 + Math.sin(i * 2.4) * 350,
    ];
    return {
      id: t.room_id,
      teamId: t.id,
      x,
      y,
      color: t.theme.color,
      name: t.name,
    };
  });
}
export function obstaclesFor(regions: Region[]): Obstacle[] {
  return [
    { x: 765, y: 515, width: 70, height: 55 },
    ...regions.map((r) => ({
      x: r.x - 69,
      y: r.y - 86,
      width: 138,
      height: 95,
    })),
  ];
}
export function roomAt(
  position: Pick<Position, "x" | "y">,
  regions: Region[],
): string {
  return (
    regions.find(
      (r) =>
        Math.abs(position.x - r.x) < 185 && Math.abs(position.y - r.y) < 150,
    )?.id || "main-square"
  );
}
export function spawnFor(teamId: string, regions: Region[]): Position {
  const region = regions.find((r) => r.teamId === teamId);
  return {
    x: region?.x || 800,
    y: region ? region.y + 80 : 640,
    direction: "down",
    moving: false,
  };
}
export function canStand(x: number, y: number, obstacles: Obstacle[]): boolean {
  const r = WORLD.radius;
  return (
    x >= 60 + r &&
    x <= WORLD.width - 60 - r &&
    y >= 75 + r &&
    y <= WORLD.height - 55 - r &&
    !obstacles.some(
      (o) =>
        x + r > o.x &&
        x - r < o.x + o.width &&
        y + r > o.y &&
        y - r < o.y + o.height,
    )
  );
}
export function step(
  position: Position,
  dx: number,
  dy: number,
  deltaMs: number,
  obstacles: Obstacle[],
): Position {
  const length = Math.hypot(dx, dy);
  if (!length) return { ...position, moving: false };
  const distance = (WORLD.speed * Math.min(Math.max(deltaMs, 0), 50)) / 1000;
  const nextX = position.x + (dx / length) * distance,
    nextY = position.y + (dy / length) * distance;
  const x = canStand(nextX, position.y, obstacles) ? nextX : position.x;
  const y = canStand(x, nextY, obstacles) ? nextY : position.y;
  return {
    x,
    y,
    direction:
      Math.abs(dx) > Math.abs(dy)
        ? dx < 0
          ? "left"
          : "right"
        : dy < 0
          ? "up"
          : "down",
    moving: x !== position.x || y !== position.y,
  };
}
export function isPosition(value: unknown): value is Position {
  if (!value || typeof value !== "object") return false;
  const p = value as Position;
  return (
    Number.isFinite(p.x) &&
    Number.isFinite(p.y) &&
    p.x >= 0 &&
    p.x <= WORLD.width &&
    p.y >= 0 &&
    p.y <= WORLD.height &&
    ["up", "down", "left", "right"].includes(p.direction) &&
    typeof p.moving === "boolean"
  );
}
