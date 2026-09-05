import { AVATARS, STATUSES, type Profile, type Team } from "./types";
export function validateNickname(value: string): string | null {
  const nickname = value.trim();
  if (nickname.length < 2 || nickname.length > 20)
    return "닉네임은 2–20자로 입력해 주세요.";
  if (/[\p{C}<>]/u.test(value))
    return "닉네임에 제어 문자나 < > 기호를 사용할 수 없어요.";
  return null;
}
export function validProfile(value: unknown, teams: Team[]): value is Profile {
  if (!value || typeof value !== "object") return false;
  const p = value as Profile;
  return (
    typeof p.id === "string" &&
    typeof p.nickname === "string" &&
    !validateNickname(p.nickname) &&
    AVATARS.includes(p.avatar_type) &&
    Object.hasOwn(STATUSES, p.status) &&
    teams.some((t) => t.id === p.team_id && t.world_id === p.world_id)
  );
}
