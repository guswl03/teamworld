import type { Avatar } from "../lib/types";

export const ART_ROOT = "/assets/tiny-swords/";
export const AVATAR_SHEETS = {
  ranger: { url: ART_ROOT + "ranger.png", columns: 8 },
  mage: { url: ART_ROOT + "mage.png", columns: 6 },
  engineer: { url: ART_ROOT + "engineer.png", columns: 6 },
  explorer: { url: ART_ROOT + "explorer.png", columns: 6 },
} satisfies Record<Avatar, { url: string; columns: number }>;

// Update 010 uses 192px cells: idle in row 0, running in row 1.
// The archer sheet has two extra attack columns; do not play those as idle.
export function avatarFrame(
  avatar: Avatar,
  moving: boolean,
  time: number,
  reduced: boolean,
) {
  return (
    (moving ? AVATAR_SHEETS[avatar].columns : 0) +
    (reduced ? 0 : Math.floor(time / (moving ? 100 : 160)) % 6)
  );
}
