"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { WorldController } from "@/game/create-world";
import type { Player, Position, Profile, Team } from "@/lib/types";
export interface GameHandle {
  travel(room: string): void;
  zoom(amount: number): void;
}
export const GameCanvas = forwardRef<
  GameHandle,
  {
    player: Player;
    peers: Player[];
    teams: Team[];
    profile: Profile;
    onMove(position: Position, room: string): void;
  }
>(function GameCanvas({ player, peers, teams, profile, onMove }, ref) {
  const parent = useRef<HTMLDivElement>(null);
  const controller = useRef<WorldController | null>(null);
  const lastPosition = useRef<Position>(player);
  const lastRoom = useRef(player.room_id);
  const latest = useRef({ peers, profile, onMove });
  latest.current = { peers, profile, onMove };
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 601px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useImperativeHandle(
    ref,
    () => ({
      travel: (room) => controller.current?.travel(room),
      zoom: (amount) => controller.current?.zoom(amount),
    }),
    [],
  );
  useEffect(() => {
    if (!desktop) return;
    setReady(false);
    let disposed = false;
    void import("@/game/create-world")
      .then(({ createWorld }) => {
        if (disposed || !parent.current) return;
        controller.current = createWorld({
          parent: parent.current,
          player: {
            ...player,
            ...lastPosition.current,
            room_id: lastRoom.current,
          },
          teams,
          onMove: (position, room) => {
            lastPosition.current = position;
            lastRoom.current = room;
            latest.current.onMove(position, room);
          },
          onReady: () => {
            if (!disposed) setReady(true);
          },
        });
        controller.current.players(latest.current.peers);
        controller.current.profile(latest.current.profile);
      })
      .catch(() => {
        if (!disposed)
          setError("월드를 그리지 못했어요. 브라우저를 새로고침해 주세요.");
      });
    return () => {
      disposed = true;
      controller.current?.destroy();
      controller.current = null;
    };
    // The scene is created once per world session; profile/peer changes use the controller below.
  }, [player, teams, desktop]);
  useEffect(() => {
    controller.current?.players(peers);
  }, [peers]);
  useEffect(() => {
    controller.current?.profile(profile);
  }, [profile]);
  return (
    <div className="game-container">
      <div className="game-mount" ref={parent} />
      {(!ready || error) && (
        <div className="game-loading" role="status">
          <span className="large-spark">✦</span>
          {error || "우리의 작은 세계를 펼치는 중…"}
        </div>
      )}
    </div>
  );
});
