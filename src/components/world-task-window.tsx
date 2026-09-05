"use client";
import { useEffect, useRef, type ReactNode } from "react";

// Non-modal: the dock stays available for switching tasks, while gameplay pauses.
// Keep children mounted so drafts and form state survive closing a window.
export function WorldTaskWindow({
  id,
  title,
  active,
  onClose,
  children,
}: {
  id: string;
  title: string;
  active: boolean;
  onClose(): void;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (active) root.current?.focus({ preventScroll: true });
  }, [active]);
  return (
    <section
      ref={root}
      id={`task-${id}`}
      hidden={!active}
      role="dialog"
      aria-labelledby={`task-title-${id}`}
      tabIndex={-1}
      className={`world-task-window task-${id}`}
    >
      <header className="task-window-heading">
        <div>
          <span>WORLD WORKSPACE</span>
          <h2 id={`task-title-${id}`}>{title}</h2>
        </div>
        <button type="button" aria-label={`${title} 닫기`} onClick={onClose}>
          ×
        </button>
      </header>
      <div className="task-window-body">{children}</div>
      <footer className="task-window-footer">
        <kbd>Esc</kbd> 닫고 월드로 돌아가기 <span>이동 일시정지</span>
      </footer>
    </section>
  );
}
