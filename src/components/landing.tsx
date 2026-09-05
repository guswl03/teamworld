"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "./brand";
import { Avatar } from "./avatar";
import { useSession } from "./session-provider";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { IslandPreview } from "./island-preview";
export function Landing() {
  const { startDemo, profile, loading, demo } = useSession();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function login() {
    if (!isConfigured) {
      setError(
        "GitHub 연결을 준비 중이에요. 지금은 ‘월드 먼저 둘러보기’로 체험할 수 있어요.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      sessionStorage.removeItem("teamworld:demo");
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${location.origin}/auth/callback`,
          scopes: "read:user",
        },
      });
      if (error) throw error;
    } catch {
      setError(
        "GitHub 로그인에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
      setBusy(false);
    }
  }
  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand />
        <nav>
          <a href="#about">우리의 작은 세계</a>
          <span className="tag">EARLY ACCESS · v0.1</span>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" /> A LITTLE CLOSER, TOGETHER
            </div>
            <h1>
              Your team.
              <br />
              One <em>world.</em>
            </h1>
            <p className="hero-korean">
              우리는 떨어져 일하지만,
              <br />
              모험은 함께하니까.
            </p>
            <p className="hero-description">
              각자의 책상에서 하나의 길드로.
              <br />
              동료를 만나고, 함께 움직이고, 같은 세계에 머물러요.
            </p>
            <div className="hero-actions">
              {!loading && profile ? (
                <Link className="button primary" href="/world">
                  내 월드로 돌아가기 <span>↗</span>
                </Link>
              ) : (
                <button
                  className="button primary"
                  onClick={login}
                  disabled={busy}
                >
                  <GitHubIcon />
                  {busy ? "GitHub로 이동 중…" : "GitHub로 시작하기"}
                  <span>↗</span>
                </button>
              )}
              <button
                className="button text-button"
                onClick={() => {
                  startDemo();
                  router.push("/onboarding");
                }}
              >
                월드 먼저 둘러보기 <span>→</span>
              </button>
            </div>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="hero-note">
              <span>↳</span> 설치 없이, 링크 하나로 입장.
              {demo && profile ? " 로컬 데모 진행 중" : ""}
            </div>
            <div className="hero-people">
              <div className="avatar-stack">
                <Avatar type="ranger" size={35} />
                <Avatar type="mage" size={35} />
                <Avatar type="engineer" size={35} />
              </div>
              <span>
                작은 캐릭터로 만나는
                <br />
                <strong>우리 팀의 새로운 일상</strong>
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="art-label">
              <span className="live-dot" /> YOUR NEXT ADVENTURE STARTS HERE
            </div>
            <IslandPreview />
            <div className="art-caption">
              <span>01 / THE COMMON GROUNDS</span>
              <span>다섯 개의 길드, 하나의 마음 ✦</span>
            </div>
            <div className="floating-note">
              <Avatar type="mage" size={44} />
              <div>
                <strong>같이 잠깐 걸을까요?</strong>
                <span>중앙 광장에서 만나요.</span>
              </div>
              <span className="note-spark">✧</span>
            </div>
          </div>
        </section>
        <section className="features" id="about">
          <div className="feature-intro">
            <span className="eyebrow">BUILT FOR YOUR PARTY</span>
            <h2>
              일하는 곳에,
              <br />
              함께하는 기분을.
            </h2>
          </div>
          <article>
            <span className="feature-icon">⌘</span>
            <h3>클릭 한 번의 모험</h3>
            <p>
              GitHub로 로그인하고
              <br />
              나만의 캐릭터로 바로 입장해요.
            </p>
          </article>
          <article>
            <span className="feature-icon">♧</span>
            <h3>우리 팀만의 아지트</h3>
            <p>
              숲부터 바닷가까지.
              <br />
              다섯 길드가 하나의 섬을 나눠요.
            </p>
          </article>
          <article>
            <span className="feature-icon">✧</span>
            <h3>멀리 있어도, 바로 옆에</h3>
            <p>
              동료의 움직임과 상태로
              <br />
              함께 일하는 순간을 느껴요.
            </p>
          </article>
        </section>
      </main>
      <footer className="landing-footer">
        <span>© 2026 TeamWorld</span>
        <span>
          Made for teams. Built for togetherness.{" "}
          <span className="brand-dot">✦</span>
        </span>
      </footer>
    </div>
  );
}
function GitHubIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.95 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82c.85 0 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.39.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}
