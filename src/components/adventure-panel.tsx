"use client";
import { useEffect, useRef, useState } from "react";
import {
  advanceAdventure,
  adventureObjective,
  freshAdventure,
  restoreAdventure,
  LANDMARKS,
  NPC,
  CHEST,
  near,
  type Adventure,
} from "@/game/adventure-model";
import type { Position, Profile } from "@/lib/types";

export function useAdventure(profile: Profile, position: Position) {
  const [state, setState] = useState<Adventure>(freshAdventure);
  const [loadedKey, setLoadedKey] = useState("");
  const [warning, setWarning] = useState("");
  const key = `teamworld:adventure:v1:${profile.world_id}:${profile.id}`;
  useEffect(() => {
    try {
      setState(
        restoreAdventure(JSON.parse(localStorage.getItem(key) || "null")),
      );
    } catch {
      setState(freshAdventure());
      setWarning("저장 기록을 읽지 못했어요. 이번 탐험은 임시로 진행됩니다.");
    }
    setLoadedKey(key);
  }, [key]);
  useEffect(() => {
    if (loadedKey !== key) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      setWarning(
        "이 브라우저에 저장할 수 없어 새로고침하면 탐험 기록이 사라져요.",
      );
    }
  }, [state, key, loadedKey]);
  useEffect(() => {
    if (loadedKey === key)
      setState((s) => advanceAdventure(s, "visit", position));
  }, [position, loadedKey, key, state.accepted]);
  return {
    state,
    warning,
    loaded: loadedKey === key,
    act: (action: "interact" | "equip", point = position) => {
      if (loadedKey === key)
        setState((s) => advanceAdventure(s, action, point));
    },
  };
}

export function AdventurePanel({
  state,
  warning,
  onEquip,
  onGuide,
  inventoryOnly = false,
}: {
  state: Adventure;
  warning: string;
  onEquip(): void;
  onGuide(): void;
  inventoryOnly?: boolean;
}) {
  const [bag, setBag] = useState(false);
  const completed =
    Number(state.visited.length === 3) +
    Number(state.treasure) +
    Number(state.rewarded);
  return (
    <section
      className={`adventure-journal ${inventoryOnly ? "inventory-only" : ""}`}
      aria-label={inventoryOnly ? "배낭" : "센터 탐방 수첩"}
    >
      <div className="journal-heading">
        <span>CHAPTER 01</span>
        <span>✦</span>
      </div>
      <h2>교육센터의 첫 탐방</h2>
      <p className="journal-subtitle">
        랩과 로비를 둘러보고 센터를 알아보세요.
      </p>
      <div className="quest-progress">
        <span style={{ width: `${(completed / 3) * 100}%` }} />
      </div>
      <p className="quest-objective" aria-live="polite">
        {adventureObjective(state)}
      </p>
      <ol className="quest-list">
        <li className={state.visited.length === 3 ? "done" : ""}>
          <span>01</span>
          <div>
            <strong>센터의 세 안내존</strong>
            <small>
              {state.accepted
                ? `${state.visited.length}/3 안내존 확인`
                : "루미에게 퀘스트 받기"}
            </small>
          </div>
        </li>
        <li className={state.treasure ? "done" : ""}>
          <span>02</span>
          <div>
            <strong>신입 멤버 웰컴 키트</strong>
            <small>
              {state.treasure
                ? "키트 수령 완료"
                : "로비 북동쪽에서 보관함 찾기"}
            </small>
          </div>
        </li>
        <li className={state.rewarded ? "done" : ""}>
          <span>03</span>
          <div>
            <strong>센터 탐방 완료</strong>
            <small>
              {state.rewarded
                ? "탐험가의 모자 획득"
                : "루미에게 돌아와 보고하기"}
            </small>
          </div>
        </li>
      </ol>
      <div className="journal-actions">
        <button onClick={onGuide}>⌖ 센터 안내</button>
        <button onClick={() => setBag(!bag)} aria-expanded={bag}>
          ♧ 배낭 {state.rewarded ? "1" : "0"}
        </button>
      </div>
      {(bag || inventoryOnly) && (
        <div className="inventory">
          <div className="hat-preview">♟</div>
          <strong>
            {state.rewarded ? "바람깃 탐험가 모자" : "아직 비어 있는 배낭"}
          </strong>
          <p>
            {state.rewarded
              ? "센터 탐방을 마친 기념품. 내 화면에 표시되는 외형 보상이에요."
              : "루미의 퀘스트를 완료하면 특별한 모자를 받아요."}
          </p>
          {state.rewarded && (
            <button onClick={onEquip}>
              {state.equipped ? "모자 벗기" : "모자 착용"}
            </button>
          )}
        </div>
      )}
      <small className="local-progress-note">
        탐험·보상은 이 브라우저에만 저장됩니다.
      </small>
      {warning && (
        <p role="status" className="chat-error">
          {warning}
        </p>
      )}
    </section>
  );
}

export function AdventureDialog({
  kind,
  state,
  position,
  onAction,
  onClose,
}: {
  kind: "npc" | "chest" | "guide";
  state: Adventure;
  position: Position;
  onAction(): void;
  onClose(): void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  const inRange = kind === "npc" ? near(position, NPC) : near(position, CHEST);
  const available =
    kind === "npc"
      ? !state.accepted || (state.treasure && !state.rewarded)
      : state.visited.length === 3 && !state.treasure;
  const description =
    kind === "npc"
      ? !state.accepted
        ? "교육센터에 오신 것을 환영해요! 시스템 랩 안내존, AI 보안 랩 안내존, 리셉션 로비를 둘러보세요. 세 곳을 확인하면 로비 북동쪽 보관함에서 웰컴 키트를 받을 수 있어요."
        : state.rewarded
          ? "센터 탐방을 마쳤어요. 배낭에서 기념 모자를 써 보세요. 멘토 NPC에게 다가가면 커리큘럼 안내도 확인할 수 있어요."
          : state.treasure
            ? "웰컴 키트를 받으셨군요! 센터를 둘러본 기념으로 기존 탐험가 모자를 드릴게요."
            : "센터 탐방 수첩을 따라 세 안내존을 둘러보고 웰컴 키트를 받아보세요."
      : state.treasure
        ? "키트를 받았어요. 안내원 루미에게 돌아가 탐방을 보고해 주세요."
        : state.visited.length === 3
          ? "세 안내존을 모두 확인했어요. 웰컴 키트를 받을 수 있습니다."
          : "루미에게 센터 탐방 안내를 받고 세 안내존을 먼저 둘러보세요.";
  return (
    <dialog ref={dialog} className="adventure-dialog" onCancel={onClose}>
      <button className="dialog-close" aria-label="대화 닫기" onClick={onClose}>
        ×
      </button>
      <span className="dialog-eyebrow">
        {kind === "guide"
          ? "FIELD NOTES"
          : kind === "npc"
            ? "CENTER GUIDE · NPC"
            : "DISCOVERY"}
      </span>
      <h2>
        {kind === "guide"
          ? "처음 만나는 교육센터"
          : kind === "npc"
            ? NPC.name
            : CHEST.name}
      </h2>
      {kind === "guide" ? (
        <>
          <p>
            센터 로비로 이동한 뒤 안내원 루미에게 다가가 <kbd>E</kbd>를 눌러
            주세요. 안내존은 가까이 걸어가면 확인됩니다.
          </p>
          <ul className="landmark-guide">
            {LANDMARKS.map((p) => (
              <li key={p.id}>
                <span>{state.visited.includes(p.id) ? "✓" : p.icon}</span>
                <div>
                  <strong>{p.name}</strong>
                  <small>{p.hint}</small>
                </div>
              </li>
            ))}
          </ul>
          <p>
            세 안내존을 확인했다면 로비 북동쪽 보관함 앞에서 E → 루미에게 돌아와
            보고 → 배낭에서 모자 착용!
          </p>
        </>
      ) : (
        <p>{description}</p>
      )}
      <div className="dialog-actions">
        {kind !== "guide" && inRange && available && (
          <button
            className="button primary"
            onClick={() => {
              onAction();
              onClose();
            }}
          >
            {kind === "npc"
              ? state.treasure
                ? "보상 받기 · 바람깃 모자"
                : "센터 둘러보기 시작"
              : "웰컴 키트 받기"}
          </button>
        )}
        <button className="button" onClick={onClose}>
          {" "}
          {kind === "guide" ? "센터 둘러보기" : "안내 닫기"}{" "}
        </button>
      </div>
    </dialog>
  );
}
