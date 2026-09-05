import { isPosition } from "../game/world-model";
import { AVATARS, STATUSES, type Player } from "./types";
import { validateNickname } from "./profile";
export function isPlayer(value: unknown): value is Player {
  if (!isPosition(value)) return false;
  const p = value as Player;
  return (
    typeof p.id === "string" &&
    p.id.length <= 80 &&
    typeof p.session_id === "string" &&
    p.session_id.length <= 80 &&
    typeof p.world_id === "string" &&
    p.world_id.length <= 80 &&
    typeof p.team_id === "string" &&
    p.team_id.length <= 80 &&
    typeof p.nickname === "string" &&
    validateNickname(p.nickname) === null &&
    AVATARS.includes(p.avatar_type) &&
    Object.hasOwn(STATUSES, p.status) &&
    typeof p.room_id === "string" &&
    p.room_id.length <= 80
  );
}
export function mergePresence(
  presence: unknown[],
  previous: Player[],
  selfId: string,
): Player[] {
  const latest = new Map(previous.map((p) => [p.session_id, p]));
  return presence
    .filter(isPlayer)
    .filter((p) => p.session_id !== selfId)
    .map((p) => {
      const old = latest.get(p.session_id);
      return old
        ? {
            ...p,
            x: old.x,
            y: old.y,
            direction: old.direction,
            moving: old.moving,
            room_id: old.room_id,
          }
        : p;
    });
}
