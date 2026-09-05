"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "./session-provider";
import { Brand } from "./brand";
import { Avatar } from "./avatar";
import { AVATAR_INFO } from "@/lib/data";
import {
  AVATARS,
  STATUSES,
  type Avatar as AvatarType,
  type Status,
} from "@/lib/types";
export function ProfileForm({ settings = false }: { settings?: boolean }) {
  const session = useSession();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<AvatarType>("ranger");
  const [teamId, setTeamId] = useState("");
  const [status, setStatus] = useState<Status>("online");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (session.loading) return;
    if (!session.demo && !session.user) {
      router.replace("/");
      return;
    }
    if (session.profile) {
      setNickname(session.profile.nickname);
      setAvatar(session.profile.avatar_type);
      setTeamId(session.profile.team_id);
      setStatus(session.profile.status);
    } else {
      setNickname(session.user?.user_metadata?.user_name || "");
      setTeamId(session.teams[0]?.id || "");
    }
  }, [
    session.loading,
    session.demo,
    session.user,
    session.profile,
    session.teams,
    router,
  ]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await session.save({
        nickname,
        avatar_type: avatar,
        team_id: teamId,
        status,
      });
      router.push("/world");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }
  async function leave() {
    try {
      await session.logout();
      router.replace("/");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="onboarding-page">
      <header className="landing-nav">
        <Brand />
        <Link className="back-link" href={settings ? "/world" : "/"}>
          ← {settings ? "월드로 돌아가기" : "처음으로"}
        </Link>
      </header>
      <main className="onboarding-main">
        <div className="onboarding-heading">
          <span className="eyebrow">
            {settings ? "YOUR ADVENTURER" : "A NEW CHAPTER BEGINS"}
          </span>
          <h1>{settings ? "나의 모험가 프로필" : "어떤 모습으로 만날까요?"}</h1>
          <p>
            {settings
              ? "오늘의 기분에 맞게 바꿔 보세요."
              : "캐릭터와 길드를 고르면, 우리의 세계가 시작돼요."}
          </p>
        </div>
        {session.loading ? (
          <p className="loading-state">프로필을 불러오고 있어요…</p>
        ) : (
          <form onSubmit={submit} className="profile-form">
            {session.demo && (
              <div className="demo-notice">
                <span>◇ 로컬 체험 모드</span>
                <small>이 브라우저의 다른 체험 탭과 함께할 수 있어요.</small>
              </div>
            )}
            <fieldset>
              <legend>
                <span>01</span> 나의 캐릭터
              </legend>
              <div className="character-grid">
                {AVATARS.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`character-card ${avatar === type ? "selected" : ""}`}
                    aria-pressed={avatar === type}
                    onClick={() => setAvatar(type)}
                  >
                    <span
                      className="character-portrait"
                      style={{ background: `${AVATAR_INFO[type].color}18` }}
                    >
                      <Avatar type={type} size={76} />
                    </span>
                    <strong>{AVATAR_INFO[type].name}</strong>
                    <span>{AVATAR_INFO[type].role}</span>
                    {avatar === type && <i className="selected-check">✓</i>}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="form-two-columns">
              <div>
                <label htmlFor="nickname">
                  <span>02</span> 동료들이 부를 이름
                </label>
                <input
                  id="nickname"
                  autoComplete="nickname"
                  required
                  minLength={2}
                  maxLength={20}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임을 입력해 주세요"
                />
                <small>2–20자 · 월드에서 캐릭터 위에 표시돼요.</small>
              </div>
              <div>
                <label htmlFor="team">
                  <span>03</span> 나의 길드
                </label>
                <select
                  id="team"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  required
                >
                  {session.teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.theme.icon} {t.name}
                    </option>
                  ))}
                </select>
                <small>팀과 함께 머무를 아지트를 골라 주세요.</small>
              </div>
            </div>
            {settings && (
              <div>
                <label htmlFor="profile-status">지금 나의 상태</label>
                <select
                  id="profile-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                >
                  {Object.entries(STATUSES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(error || session.error) && (
              <p role="alert" className="form-error">
                {error || session.error}
              </p>
            )}
            <div className="form-bottom">
              <span>
                함께할 준비, 완료. <span className="brand-dot">✦</span>
              </span>
              <button
                className="button primary"
                disabled={busy || !!session.error}
              >
                {busy
                  ? "저장하는 중…"
                  : settings
                    ? "변경 저장하기"
                    : "월드 입장하기"}
                <span>→</span>
              </button>
            </div>
            {settings && (
              <div className="account-details">
                <span>
                  {session.demo
                    ? "로컬 데모 · GitHub 미연결"
                    : `GitHub 연결됨 · ${session.profile?.github_username || session.user?.user_metadata?.user_name || ""}`}
                </span>
                <button type="button" onClick={leave} className="link-button">
                  로그아웃
                </button>
              </div>
            )}
            {!settings && session.error && (
              <button type="button" onClick={leave} className="link-button">
                로그아웃하고 돌아가기
              </button>
            )}
          </form>
        )}
      </main>
      <footer className="simple-footer">
        5 GUILDS <span>✦</span> 1 WORLD <span>✦</span> YOUR PARTY
      </footer>
    </div>
  );
}
