"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Brand } from "./brand";
import { Avatar } from "./avatar";
import { useSession } from "./session-provider";
import { GameCanvas, type GameHandle } from "./game-canvas";
import { createDemoTransport } from "@/lib/demo-transport";
import { createSupabaseTransport } from "@/lib/supabase-transport";
import { regionsFor, roomAt, spawnFor } from "@/game/world-model";
import {
  STATUSES,
  type ConnectionState,
  type Player,
  type Position,
  type Profile,
  type Status,
  type Team,
  type Transport,
} from "@/lib/types";
export function WorldShell() {
  const session = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!session.loading && !session.profile)
      router.replace(session.demo || session.user ? "/onboarding" : "/");
  }, [session.loading, session.profile, session.demo, session.user, router]);
  if (session.loading || !session.profile)
    return (
      <main className="centered-state">
        <span className="large-spark">✦</span>
        <p>월드로 가는 길을 찾고 있어요…</p>
      </main>
    );
  return (
    <WorldSession
      profile={session.profile}
      teams={session.teams}
      demo={session.demo}
    />
  );
}
function WorldSession({
  profile,
  teams,
  demo,
}: {
  profile: Profile;
  teams: Team[];
  demo: boolean;
}) {
  const { save } = useSession();
  const [peers, setPeers] = useState<Player[]>([]);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState("all");
  const [help, setHelp] = useState(false);
  const regions = useMemo(() => regionsFor(teams), [teams]);
  const [initial] = useState<Player>(() => ({
    ...profile,
    ...spawnFor(profile.team_id, regions),
    session_id: crypto.randomUUID(),
    room_id: roomAt(spawnFor(profile.team_id, regions), regions),
  }));
  const [position, setPosition] = useState<Position>(initial);
  const [room, setRoom] = useState(initial.room_id);
  const transport = useRef<Transport | null>(null);
  const game = useRef<GameHandle>(null);
  const current = useRef({
    ...initial,
    ...profile,
    ...position,
    room_id: room,
  });
  current.current = { ...initial, ...profile, ...position, room_id: room };
  useEffect(() => {
    setPeers([]);
    let live = true;
    const callbacks = {
      players: (players: Player[]) => {
        if (live) setPeers(players);
      },
      connection: (state: ConnectionState) => {
        if (live) setConnection(state);
      },
    };
    try {
      transport.current = (
        demo ? createDemoTransport : createSupabaseTransport
      )(current.current, callbacks);
    } catch {
      setConnection("disconnected");
      setError("실시간 연결을 시작하지 못했어요.");
    }
    return () => {
      live = false;
      transport.current?.close();
      transport.current = null;
    };
  }, [demo, initial, attempt]);
  useEffect(() => {
    transport.current?.update(profile);
  }, [profile]);
  function move(next: Position, nextRoom: string) {
    setPosition(next);
    setRoom(nextRoom);
    transport.current?.move(next, nextRoom);
  }
  async function changeStatus(status: Status) {
    setSaving(true);
    setError("");
    try {
      await save({
        nickname: profile.nickname,
        avatar_type: profile.avatar_type,
        team_id: profile.team_id,
        status,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  const all = [
    { ...initial, ...profile, ...position, room_id: room },
    ...peers,
  ];
  const uniquePlayers = [...new Map(all.map((p) => [p.id, p])).values()];
  const visiblePlayers = uniquePlayers.filter(
    (p) => filter === "all" || p.team_id === filter,
  );
  const myTeam = teams.find((t) => t.id === profile.team_id)!;
  const roomName = regions.find((r) => r.id === room)?.name || "중앙 광장";
  const online = connection === "connected";
  return (
    <div className="world-page">
      <header className="world-header">
        <Brand />
        <div className="world-title">
          <span className="world-title-divider" />
          OUR SHARED WORLD{" "}
          <span className="tag">{demo ? "LOCAL DEMO" : "EARLY ACCESS"}</span>
        </div>
        <div className="header-right">
          <span
            className={`connection-pill ${online ? "" : "offline"}`}
            role="status"
          >
            <span className="live-dot" />
            {online
              ? `${uniquePlayers.length}명 온라인`
              : connection === "connecting"
                ? "연결 중…"
                : "연결 끊김"}
          </span>
          <Link
            href="/settings"
            className="profile-button"
            aria-label={`${profile.nickname} 프로필 설정`}
          >
            <Avatar type={profile.avatar_type} size={32} />
            <span>{profile.nickname}</span>
            <span>⌄</span>
          </Link>
        </div>
      </header>
      <div className="world-layout">
        <aside className="guild-sidebar">
          <div className="sidebar-title">
            <span>나의 월드</span>
            <span className="tiny-label">WORLD 01</span>
          </div>
          <button
            className={`world-place ${room === "main-square" ? "active" : ""}`}
            onClick={() => game.current?.travel("main-square")}
          >
            <span className="place-icon">⌂</span>
            <span>
              <strong>중앙 광장</strong>
              <small>모두가 만나는 곳</small>
            </span>
            <span className="place-arrow">↗</span>
          </button>
          <div className="sidebar-section-label">
            GUILDS <span>{teams.length.toString().padStart(2, "0")}</span>
          </div>
          <nav className="guild-list" aria-label="길드 이동">
            {teams.map((t) => (
              <button
                key={t.id}
                className={`guild-item ${room === t.room_id ? "active" : ""}`}
                onClick={() => game.current?.travel(t.room_id)}
              >
                <span
                  className="guild-icon"
                  style={{
                    color: t.theme.color,
                    background: `${t.theme.color}18`,
                  }}
                >
                  {t.theme.icon}
                </span>
                <span>
                  <strong>{t.name}</strong>
                  <small>{t.theme.subtitle}</small>
                </span>
                <span className="guild-count">
                  {uniquePlayers.filter((p) => p.team_id === t.id).length}
                </span>
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <span className="small-star">✦</span>
            <h3>
              각자의 하루,
              <br />
              함께하는 모험.
            </h3>
            <p>
              잠깐의 산책이 새로운
              <br />
              아이디어가 될지도 몰라요.
            </p>
            <button onClick={() => setHelp(!help)} className="link-button">
              월드 이용 가이드 ↗
            </button>
          </div>
          <div className="sidebar-foot">
            TEAMWORLD <span>v0.1</span>
          </div>
        </aside>
        <main className="world-main">
          <div className="map-heading">
            <div>
              <span className="eyebrow">A GOOD DAY TO BE TOGETHER</span>
              <h1>
                {roomName}
                <span className="location-dot">●</span>
              </h1>
            </div>
            <div className="map-heading-note">
              <span>✦</span> 오늘도 같은 세계에서
            </div>
          </div>
          {demo && (
            <div className="world-demo-strip">
              <span>◇ 로컬 체험 월드</span>
              <span>같은 브라우저의 다른 탭과 연결돼요.</span>
              <a href="/" target="_blank" rel="noopener noreferrer">
                새 탭으로 친구 만들기 ↗
              </a>
            </div>
          )}
          {error && (
            <div role="alert" className="inline-error">
              {error}
              <button onClick={() => setError("")} aria-label="알림 닫기">
                ×
              </button>
            </div>
          )}
          {!online && (
            <div className="connection-banner" role="status">
              {connection === "connecting"
                ? "동료들과 연결하고 있어요…"
                : "연결이 끊겼어요. 동료 위치가 최신 상태가 아닐 수 있어요."}
              <button
                onClick={() => {
                  setError("");
                  setAttempt((n) => n + 1);
                }}
              >
                다시 연결
              </button>
            </div>
          )}
          <div className="map-frame">
            <GameCanvas
              ref={game}
              player={initial}
              peers={peers}
              teams={teams}
              profile={profile}
              onMove={move}
            />
            <div className="map-location">
              <span className="live-dot" />
              {roomName}
              <span className="map-coordinates" data-testid="coordinates">
                {Math.round(position.x)}, {Math.round(position.y)}
              </span>
            </div>
            <div className="map-compass">
              N<span>✧</span>
            </div>
            <div className="map-tools">
              <button
                aria-label="지도 확대"
                onClick={() => game.current?.zoom(0.15)}
              >
                +
              </button>
              <button
                aria-label="지도 축소"
                onClick={() => game.current?.zoom(-0.15)}
              >
                −
              </button>
              <span />
              <button
                aria-label="내 길드로 이동"
                onClick={() => game.current?.travel(myTeam.room_id)}
              >
                ⌂
              </button>
            </div>
            <div className="map-controls">
              <span>맵을 클릭해 이동</span>
              <kbd>W</kbd>
              <span className="key-group">
                <kbd>A</kbd>
                <kbd>S</kbd>
                <kbd>D</kbd>
              </span>
              <span>또는 방향키</span>
            </div>
            <div className="map-bottom-right">EXPLORE · CONNECT · BELONG</div>
          </div>
          <div className="mobile-world-note">
            <span>♧</span>
            <h2>지금도 함께하고 있어요.</h2>
            <p>
              월드 산책은 PC에서 즐길 수 있어요.
              <br />
              여기서는 동료들의 상태를 확인해 보세요.
            </p>
          </div>
          <div className="world-status-bar">
            <div className="status-identity">
              <Avatar type={profile.avatar_type} size={38} />
              <div>
                <strong>{profile.nickname}</strong>
                <span>{myTeam.name}</span>
              </div>
            </div>
            <span className="status-divider" />
            <label htmlFor="world-status">지금 나는</label>
            <select
              id="world-status"
              disabled={saving}
              value={profile.status}
              onChange={(e) => void changeStatus(e.target.value as Status)}
            >
              {Object.entries(STATUSES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <span className="status-saved" aria-live="polite">
              {saving ? "저장 중…" : "동료에게 내 상태가 보여요"}
            </span>
            <button
              className="help-button"
              aria-label="이동 방법 보기"
              onClick={() => setHelp(!help)}
            >
              ?
            </button>
          </div>
          {help && (
            <section className="help-panel">
              <button
                className="close-button"
                onClick={() => setHelp(false)}
                aria-label="가이드 닫기"
              >
                ×
              </button>
              <h2>우리의 세계, 이렇게 즐겨요.</h2>
              <p>
                맵을 클릭한 뒤 WASD 또는 방향키로 걸어 보세요. 왼쪽 길드 이름을
                누르면 해당 아지트로 이동해요.
              </p>
              <p>
                아래에서 업무 상태를 바꾸고, 오른쪽 목록에서 동료의 위치를
                확인할 수 있어요. 프로필 버튼에서 이름과 캐릭터도 바꿔 보세요.
              </p>
              {demo && (
                <p>
                  로컬 데모는 같은 브라우저의 탭끼리 연결됩니다. 새 탭에서 ‘월드
                  먼저 둘러보기’를 선택해 다른 모험가로 입장해 보세요.
                </p>
              )}
            </section>
          )}
        </main>
        <aside className="people-sidebar">
          <div className="people-heading">
            <h2>
              함께하는 동료<span>{uniquePlayers.length}</span>
            </h2>
            <span className="live-dot" />
          </div>
          <div className="roster-filter">
            <button
              className={filter === "all" ? "selected" : ""}
              onClick={() => setFilter("all")}
            >
              전체 길드
            </button>
            <button
              className={filter === profile.team_id ? "selected" : ""}
              onClick={() => setFilter(profile.team_id)}
            >
              우리 길드
            </button>
          </div>
          <div className="roster" aria-label="접속 동료 목록">
            {visiblePlayers.map((p) => (
              <div className="roster-person" key={p.id}>
                <div className="roster-avatar">
                  <Avatar type={p.avatar_type} size={42} />
                  <span className={`status-dot status-${p.status}`} />
                </div>
                <div>
                  <strong>
                    {p.nickname}
                    {p.id === profile.id && <small>나</small>}
                  </strong>
                  <span>
                    {STATUSES[p.status]}
                    <i>·</i>
                    {regions.find((r) => r.id === p.room_id)?.name ||
                      "중앙 광장"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {uniquePlayers.length === 1 && (
            <div className="empty-party">
              <span>♧</span>
              <p>첫 번째 모험가가 도착했어요.</p>
              <small>
                {demo
                  ? "새 탭에서 다른 캐릭터로 입장하면 여기서 만날 수 있어요."
                  : "동료가 접속하면 이곳에 나타나요."}
              </small>
            </div>
          )}
          <div className="world-postcard">
            <span className="postcard-top">
              A NOTE FOR YOUR DAY <span>✧</span>
            </span>
            <div className="postcard-art">
              ♧ <span>⌂</span> ♧
            </div>
            <h3>함께여서 더 좋은 곳.</h3>
            <p>
              큰 모험도 작은 인사에서
              <br />
              시작되니까요.
            </p>
            <span className="postcard-line" />
            <small>당신의 하루를 응원해요.</small>
          </div>
          <div className="roster-foot">
            <span className="live-dot" />
            {demo ? "이 브라우저에서 연결 중" : "실시간으로 함께하는 중"}
          </div>
        </aside>
      </div>
    </div>
  );
}
