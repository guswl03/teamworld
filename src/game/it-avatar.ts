import type { Avatar } from "../lib/types";

export const IT_ATLAS = {
  url: "/assets/it-team/team-atlas.png",
  width: 1254,
  height: 1254,
};
// Measured alpha bounds with transparent padding. Original PNG stays unmodified.
const bounds: Record<Avatar, number[][]> = {
  ranger: [
    [96, 50, 145, 246],
    [399, 50, 150, 246],
    [714, 50, 153, 247],
    [1028, 50, 152, 249],
  ],
  mage: [
    [84, 354, 160, 258],
    [398, 351, 154, 261],
    [709, 354, 152, 259],
    [1012, 354, 161, 259],
  ],
  engineer: [
    [81, 647, 168, 259],
    [392, 647, 172, 259],
    [701, 649, 167, 260],
    [1012, 649, 175, 260],
  ],
  explorer: [
    [83, 943, 173, 248],
    [394, 943, 175, 248],
    [705, 943, 163, 251],
    [1021, 943, 167, 255],
  ],
};
export const IT_FRAMES = Object.fromEntries(
  Object.entries(bounds).map(([avatar, frames]) => [
    avatar,
    frames.map(([x, y, width, height]) => ({ x, y, width, height })),
  ]),
) as Record<Avatar, { x: number; y: number; width: number; height: number }[]>;
export function itFrameIndex(moving: boolean, time: number, reduced: boolean) {
  if (reduced) return 0;
  return (moving ? 2 : 0) + (Math.floor(time / (moving ? 150 : 600)) % 2);
}
export function itFrameName(
  avatar: Avatar,
  moving: boolean,
  time: number,
  reduced: boolean,
) {
  return `${avatar}-${itFrameIndex(moving, time, reduced)}`;
}
