import type { Position, Team } from "../lib/types";
import { CENTER_OBJECTS, LOBBY } from "./center-model";
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
export function obstaclesFor(_regions: Region[]): Obstacle[] {
  return CENTER_OBJECTS.map(({ x, y, width, height }) => ({
    x,
    y,
    width,
    height,
  }));
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
  return safeArrival({
    x: region?.x ?? 800,
    y: region ? region.y + 80 : 640,
  });
}
// Arrival correction is shared by team spawns and scene travel. Search only a
// bounded neighbourhood; malformed/faraway targets always use the known lobby.
export function safeArrival(point: Pick<Position, "x" | "y">): Position {
  const obstacles = obstaclesFor([]);
  const arrival = (x: number, y: number): Position => ({
    x,
    y,
    direction: "down",
    moving: false,
  });
  if (canStand(point.x, point.y, obstacles)) return arrival(point.x, point.y);
  if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
    for (let distance = 10; distance <= 120; distance += 10) {
      for (let offset = -distance; offset <= distance; offset += 10) {
        for (const [dx, dy] of [
          [offset, -distance],
          [offset, distance],
          [-distance, offset],
          [distance, offset],
        ]) {
          const x = point.x + dx,
            y = point.y + dy;
          if (canStand(x, y, obstacles)) return arrival(x, y);
        }
      }
    }
  }
  return arrival(LOBBY.x, LOBBY.y);
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
