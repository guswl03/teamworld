"use client";
import { useEffect, useRef } from "react";
import { MentorPortrait } from "./mentor-portrait";
import type { Mentor } from "@/game/mentors";

export function MentorDialog({
  mentor,
  onClose,
}: {
  mentor: Mentor;
  onClose(): void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="adventure-dialog mentor-dialog"
      aria-labelledby="mentor-title"
      aria-describedby="mentor-disclaimer"
      onCancel={onClose}
    >
      <button
        className="dialog-close"
        aria-label="멘토 안내 닫기"
        onClick={onClose}
      >
        ×
      </button>
      <span className="dialog-eyebrow">CURRICULUM GUIDE · NPC</span>
      <div className="mentor-card">
        <MentorPortrait mentor={mentor} size={96} />
        <h2 id="mentor-title">{mentor.name} · 멘토 안내</h2>
      </div>
      <p id="mentor-disclaimer" className="mentor-notice">
        제공된 커리큘럼 기반 게임 안내 · 실제 멘토의 발언이나 실시간 상담이
        아닙니다
      </p>
      <div className="mentor-topics">
        {mentor.topics.map((topic) => (
          <section className="mentor-topic" key={topic.title}>
            <h3>{topic.title}</h3>
            <p className="mentor-keywords">{topic.keywords}</p>
            <p>{topic.summary}</p>
            <h4>학습 준비 체크리스트 · 이 창에서만 유지</h4>
            <ul className="mentor-preparation">
              {topic.preparation.map((item) => (
                <li key={item}>
                  <label>
                    <input type="checkbox" />
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="dialog-actions">
        <button className="button primary" onClick={onClose}>
          센터로 돌아가기
        </button>
      </div>
    </dialog>
  );
}
