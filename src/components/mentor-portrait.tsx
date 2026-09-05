import type { Mentor } from "@/game/mentors";

export function MentorPortrait({
  mentor,
  size = 64,
}: {
  mentor: Mentor;
  size?: number;
}) {
  return (
    <img
      src={mentor.image}
      alt={`${mentor.name} 멘토 NPC`}
      width={size}
      height={size}
      className="mentor-portrait"
    />
  );
}
