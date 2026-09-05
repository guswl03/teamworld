export const STATUSES = {
  online: "온라인",
  working: "집중 중",
  meeting: "회의 중",
  break: "휴식 중",
  away: "자리 비움",
} as const;
export type Status = keyof typeof STATUSES;
export const AVATARS = ["ranger", "mage", "engineer", "explorer"] as const;
export type Avatar = (typeof AVATARS)[number];
export interface Team {
  id: string;
  world_id: string;
  name: string;
  slug: string;
  room_id: string;
  theme: { color: string; icon: string; subtitle: string };
}
export interface Profile {
  id: string;
  world_id: string;
  nickname: string;
  avatar_type: Avatar;
  team_id: string;
  status: Status;
  github_username?: string;
}
export interface Position {
  x: number;
  y: number;
  direction: "up" | "down" | "left" | "right";
  moving: boolean;
}
export interface Player extends Profile, Position {
  session_id: string;
  room_id: string;
}
export type ConnectionState = "connecting" | "connected" | "disconnected";
export interface Transport {
  move(position: Position, room: string): void;
  update(profile: Profile): void;
  close(): void;
}
export interface TransportCallbacks {
  players(players: Player[]): void;
  connection(state: ConnectionState): void;
}
