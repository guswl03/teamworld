"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Brand } from "./brand";
import { ProfileForm } from "./profile-form";
import { WorldTaskWindow } from "./world-task-window";
import { Avatar } from "./avatar";
import { useSession } from "./session-provider";
import { GameCanvas, type GameHandle } from "./game-canvas";
import { WorldChat } from "./world-chat";
import {
  AdventurePanel,
  AdventureDialog,
  useAdventure,
} from "./adventure-panel";
import { NPC, CHEST, near, adventureObjective } from "@/game/adventure-model";
import { appendChat, type ChatMessage } from "@/lib/chat";
import { createDemoTransport } from "@/lib/demo-transport";
import { createSupabaseTransport } from "@/lib/supabase-transport";
import { regionsFor, roomAt, spawnFor } from "@/game/world-model";
import {
  STATUSES,
  type ConnectionState,
  type Player,
  type Position,
  type Profile,
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
  const [peers, setPeers] = useState<Player[]>([]);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState("all");
  const [panel, setPanel] = useState<
    "chat" | "people" | "quests" | "bag" | "guilds" | "settings" | null
  >(null);
  const regions = useMemo(() => regionsFor(teams), [teams]);
  const [initial] = useState<Player>(() => ({
    ...profile,
    ...spawnFor(profile.team_id, regions),
    session_id: crypto.randomUUID(),
    room_id: roomAt(spawnFor(profile.team_id, regions), regions),
  }));
  const [position, setPosition] = useState<Position>(initial);
  const adventure = useAdventure(profile, position);
  const [dialog, setDialog] = useState<"npc" | "chest" | "guide" | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  function interact(point: Position) {
    if (!adventure.loaded || panel || dialog) return;
    setPosition(point);
    if (near(point, NPC)) setDialog("npc");
    else if (near(point, CHEST)) setDialog("chest");
  }
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
      chat: (message: ChatMessage) => {
        if (live) setMessages((list) => appendChat(list, message));
      },
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
  const closePanel = () => setPanel(null);
  useEffect(() => {
    if (dialog) return;
    if (panel)
      document.getElementById(`task-${panel}`)?.focus({ preventScroll: true });
    else game.current?.focus();
  }, [panel, dialog]);
  const travel = (id: string) => {
    game.current?.travel(id);
    closePanel();
  };
  const tasks = [
    { id: "chat", icon: "◌", label: "채팅" },
    { id: "people", icon: "♧", label: "동료" },
    { id: "quests", icon: "✧", label: "퀘스트" },
    { id: "bag", icon: "♜", label: "배낭" },
    { id: "guilds", icon: "⌂", label: "길드" },
    { id: "settings", icon: "⚙", label: "설정" },
  ] as const;
  return (
    <main
      className="world-workspace"
      onKeyDownCapture={(e) => {
        if (
          e.key === "Escape" &&
          panel &&
          !dialog &&
          !e.nativeEvent.isComposing &&
          e.keyCode !== 229
        ) {
          e.preventDefault();
          e.stopPropagation();
          closePanel();
        }
      }}
    >
      <div className="workspace-stage">
        <GameCanvas
          ref={game}
          player={initial}
          peers={peers}
          teams={teams}
          profile={profile}
          onMove={move}
          adventure={adventure.state}
          onInteract={interact}
          suspended={!!panel || !!dialog}
        />
      </div>
      <div className="workspace-vignette" aria-hidden="true" />
      <header className="workspace-header">
        <div className="workspace-brand">
          <Brand />
          <span>{demo ? "LOCAL WORLD" : "OUR SHARED WORLD"}</span>
        </div>
        <div className="workspace-presence">
          <button
            className="workspace-online"
            onClick={() => setPanel("people")}
            aria-label="접속 동료 보기"
          >
            <span className={online ? "live-dot" : "live-dot offline"} />
            <span role="status">
              {online
                ? `${uniquePlayers.length}명 함께하는 중`
                : connection === "connecting"
                  ? "연결 중…"
                  : "연결 끊김"}
            </span>
          </button>
          <button
            className="workspace-profile"
            onClick={() => setPanel("settings")}
            aria-label={`${profile.nickname} 프로필 설정`}
          >
            <Avatar type={profile.avatar_type} size={36} />
            <span>
              <strong>{profile.nickname}</strong>
              <small>{STATUSES[profile.status]}</small>
            </span>
            <span>⌄</span>
          </button>
        </div>
      </header>
      <div className="workspace-location">
        <span className="tiny-label">YOUR PLACE IN THE WORLD</span>
        <h1>
          {roomName}
          <span>✦</span>
        </h1>
        <span data-testid="coordinates">
          {Math.round(position.x)}, {Math.round(position.y)}
        </span>
      </div>
      <button
        className="workspace-objective"
        onClick={() => setPanel("quests")}
      >
        <span>
          CHAPTER 01 <i>↗</i>
        </span>
        <strong>{adventureObjective(adventure.state)}</strong>
        <small>모험 수첩 펼치기</small>
      </button>
      <div className="workspace-mobile-note">
        <span>✦</span>
        <h2>언제나 같은 세계에서.</h2>
        <p>
          아래 메뉴에서 동료와 대화하고 작업하세요.
          <br />
          월드 이동은 PC에서 지원합니다.
        </p>
      </div>
      {(!online || error) && (
        <div className="workspace-alert" role="status">
          {error || "동료들과의 연결을 확인하고 있어요."}
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
      {!panel && !dialog && (near(position, NPC) || near(position, CHEST)) && (
        <button
          className="workspace-interaction"
          onClick={() => interact(position)}
        >
          <kbd>E</kbd>
          {near(position, NPC) ? "루미와 대화하기" : "보물상자 살펴보기"}
        </button>
      )}
      <div className="workspace-map-tools">
        <button aria-label="지도 확대" onClick={() => game.current?.zoom(0.15)}>
          +
        </button>
        <button
          aria-label="지도 축소"
          onClick={() => game.current?.zoom(-0.15)}
        >
          −
        </button>
        <button
          aria-label="중앙 광장으로 이동"
          onClick={() => travel("main-square")}
        >
          ⌂
        </button>
      </div>
      {!panel && messages.length > 0 && (
        <button
          className="workspace-chat-preview"
          onClick={() => setPanel("chat")}
        >
          <span>◌ {messages[messages.length - 1].nickname}</span>
          <p>{messages[messages.length - 1].text}</p>
        </button>
      )}
      <div className="workspace-control-hint">
        {panel || dialog
          ? "작업 중 · 창을 닫으면 바로 이동할 수 있어요"
          : "WASD / 방향키 이동 · E 대화"}
      </div>
      <nav className="workspace-dock" aria-label="월드 작업 메뉴">
        {tasks.map((task) => (
          <button
            key={task.id}
            aria-label={task.label}
            aria-expanded={panel === task.id}
            aria-controls={`task-${task.id}`}
            className={panel === task.id ? "active" : ""}
            onClick={() =>
              setPanel((current) => (current === task.id ? null : task.id))
            }
          >
            <span aria-hidden="true">{task.icon}</span>
            <strong>{task.label}</strong>
            {task.id === "people" && <small>{uniquePlayers.length}</small>}
          </button>
        ))}
      </nav>

      <WorldTaskWindow
        id="chat"
        title="모닥불 채팅"
        active={panel === "chat"}
        onClose={closePanel}
      >
        <WorldChat
          messages={messages}
          online={online}
          active={panel === "chat"}
          onSend={async (text) => {
            if (!transport.current)
              throw new Error("연결을 확인한 뒤 다시 보내 주세요.");
            await transport.current.chat(text);
          }}
        />
      </WorldTaskWindow>
      <WorldTaskWindow
        id="people"
        title="함께하는 동료"
        active={panel === "people"}
        onClose={closePanel}
      >
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
                  {STATUSES[p.status]} ·{" "}
                  {regions.find((r) => r.id === p.room_id)?.name || "중앙 광장"}
                </span>
              </div>
            </div>
          ))}
        </div>
        {uniquePlayers.length === 1 && (
          <p className="workspace-empty">
            아직은 조용한 마을이에요. 동료가 접속하면 이곳에 나타나요.
          </p>
        )}
        {demo && (
          <p className="workspace-demo-note">
            로컬 체험은 같은 브라우저의 탭끼리 연결됩니다.
            <a href="/" target="_blank" rel="noopener noreferrer">
              새 탭으로 친구 만들기 ↗
            </a>
          </p>
        )}
      </WorldTaskWindow>
      <WorldTaskWindow
        id="quests"
        title="모험 수첩"
        active={panel === "quests"}
        onClose={closePanel}
      >
        <AdventurePanel
          state={adventure.state}
          warning={adventure.warning}
          onEquip={() => adventure.act("equip")}
          onGuide={() => setDialog("guide")}
        />
      </WorldTaskWindow>
      <WorldTaskWindow
        id="bag"
        title="나의 배낭"
        active={panel === "bag"}
        onClose={closePanel}
      >
        <AdventurePanel
          inventoryOnly
          state={adventure.state}
          warning={adventure.warning}
          onEquip={() => adventure.act("equip")}
          onGuide={() => setDialog("guide")}
        />
      </WorldTaskWindow>
      <WorldTaskWindow
        id="guilds"
        title="길드와 장소"
        active={panel === "guilds"}
        onClose={closePanel}
      >
        <p className="workspace-empty">
          가고 싶은 장소를 고르면 바로 이동해요.
        </p>
        <button className="world-place" onClick={() => travel("main-square")}>
          <span className="place-icon">⌂</span>
          <span>
            <strong>중앙 광장</strong>
            <small>모두가 만나는 곳</small>
          </span>
          <span>↗</span>
        </button>
        <nav className="guild-list" aria-label="길드 이동">
          {teams.map((t) => (
            <button
              key={t.id}
              className={`guild-item ${room === t.room_id ? "active" : ""}`}
              onClick={() => travel(t.room_id)}
            >
              <span
                className="guild-icon"
                style={{
                  color: t.theme.color,
                  background: t.theme.color + "18",
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
        <p className="workspace-empty">내 소속: {myTeam.name}</p>
      </WorldTaskWindow>
      <WorldTaskWindow
        id="settings"
        title="나의 모험가"
        active={panel === "settings"}
        onClose={closePanel}
      >
        <ProfileForm
          settings
          embedded
          onSaved={() =>
            setPanel((current) => (current === "settings" ? null : current))
          }
        />
      </WorldTaskWindow>
      {dialog && (
        <AdventureDialog
          kind={dialog}
          state={adventure.state}
          position={position}
          onAction={() => adventure.act("interact")}
          onClose={() => setDialog(null)}
        />
      )}
    </main>
  );
}
