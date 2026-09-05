import { AVATAR_INFO } from "@/lib/data";
import type { Avatar as AvatarType } from "@/lib/types";
export function Avatar({
  type,
  size = 48,
}: {
  type: AvatarType;
  size?: number;
}) {
  const color = AVATAR_INFO[type].color;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 36"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <ellipse cx="16" cy="33" rx="10" ry="2" fill="#263829" opacity=".15" />
      <path d="M10 25h5v7h-6v-3h1m8-4h5v7h-6v-3h1" fill="#344345" />
      <path d="M9 17h14v11H9zM6 19h3v7H6m17-7h3v7h-3" fill={color} />
      <path d="M10 7h12v12H10zM8 10h3v6H8m13-6h3v6h-3" fill="#efc497" />
      <path d="M11 12h2v2h-2m6-2h2v2h-2" fill="#293c3e" />
      <path d="M13 17h6v2h-6" fill="#cd976f" />
      {type === "mage" ? (
        <path d="M6 8h20v3H6m4-7h12v4H10m3-7h6v4h-6" fill={color} />
      ) : (
        <path
          d="M8 6h16v5h-4V9h-8v2H8m3-7h10v3H11"
          fill={type === "engineer" ? "#c48752" : color}
        />
      )}
      <path d="M15 20h3v7h-3" fill="#f3dc96" />
      {type === "ranger" && <path d="M22 3h3v8h-3" fill="#dcb871" />}
      {type === "engineer" && (
        <path d="M10 9h5v4h-5m7-4h5v4h-5" fill="#53696b" />
      )}
    </svg>
  );
}
