import { AVATAR_SHEETS } from "@/game/world-art-model";
import type { Avatar as AvatarType } from "@/lib/types";

export function Avatar({
  type,
  size = 48,
}: {
  type: AvatarType;
  size?: number;
}) {
  const sheet = AVATAR_SHEETS[type];
  const rows = type === "ranger" ? 7 : type === "explorer" ? 8 : 6;
  return (
    <svg
      width={size}
      height={size}
      viewBox="52 40 88 112"
      aria-hidden="true"
      style={{ imageRendering: "pixelated" }}
    >
      <image href={sheet.url} width={sheet.columns * 192} height={rows * 192} />
    </svg>
  );
}
