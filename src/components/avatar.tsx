import { IT_ATLAS, IT_FRAMES } from "@/game/it-avatar";
import type { Avatar as AvatarType } from "@/lib/types";
import type { CSSProperties } from "react";

export function Avatar({
  type,
  size = 48,
}: {
  type: AvatarType;
  size?: number;
}) {
  const frame = IT_FRAMES[type][0];
  return (
    <span
      className="avatar-image"
      aria-hidden="true"
      style={{ "--avatar-size": `${size}px` } as CSSProperties}
    >
      <span
        style={{
          display: "block",
          flexShrink: 0,
          height: "100%",
          aspectRatio: `${frame.width} / ${frame.height}`,
          backgroundImage: `url(${IT_ATLAS.url})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${(IT_ATLAS.width / frame.width) * 100}% ${(IT_ATLAS.height / frame.height) * 100}%`,
          backgroundPosition: `${(frame.x / (IT_ATLAS.width - frame.width)) * 100}% ${(frame.y / (IT_ATLAS.height - frame.height)) * 100}%`,
          imageRendering: "pixelated",
        }}
      />
    </span>
  );
}
