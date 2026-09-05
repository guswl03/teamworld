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
      aria-label={inventoryOnly ? "배낭" : "모험 수첩"}
    >
      <div className="journal-heading">
        <span>CHAPTER 01</span>
        <span>✦</span>
      </div>
      <h2>작은 마을의 첫 모험</h2>
      <p className="journal-subtitle">길을 걷고, 이야기를 발견하세요.</p>
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
            <strong>마을의 세 가지 풍경</strong>
            <small>
              {state.accepted
                ? `${state.visited.length}/3 명소 발견`
                : "루미에게 퀘스트 받기"}
            </small>
          </div>
        </li>
        <li className={state.treasure ? "done" : ""}>
          <span>02</span>
          <div>
            <strong>잊혀진 여행자의 보물</strong>
            <small>
              {state.treasure ? "보물 획득 완료" : "시장 남쪽에서 상자 찾기"}
            </small>
          </div>
        </li>
        <li className={state.rewarded ? "done" : ""}>
          <span>03</span>
          <div>
            <strong>모험의 첫 페이지</strong>
            <small>
              {state.rewarded
                ? "탐험가의 모자 획득"
                : "루미에게 돌아와 보고하기"}
            </small>
          </div>
        </li>
      </ol>
      <div className="journal-actions">
        <button onClick={onGuide}>⌖ 탐험 안내</button>
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
              ? "첫 모험을 마친 당신에게. 내 화면에 표시되는 외형 보상이에요."
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
        ? "어서 와요, 모험가! 바람꽃 정원, 별빛 시장, 달빛 연못을 찾아가 볼래요? 세 풍경을 발견하면 시장 남쪽의 오래된 보물상자가 열릴 거예요."
        : state.rewarded
          ? "마을에 당신의 첫 이야기가 남았어요. 배낭에서 바람깃 모자를 써 보세요. 다음에는 동료들과 함께 걸어볼까요?"
          : state.treasure
            ? "이 작은 별 조각을 찾았군요! 마을을 돌아본 기념으로 바람깃 탐험가 모자를 드릴게요."
            : "서두르지 않아도 괜찮아요. 모험 수첩을 따라 세 명소를 둘러보고 보물상자를 찾아보세요."
      : state.treasure
        ? "상자는 비어 있어요. 루미에게 돌아가 발견한 보물을 보여주세요."
        : state.visited.length === 3
          ? "세 풍경의 기억이 모여 자물쇠가 풀렸어요. 뚜껑 사이로 작은 별빛이 새어 나옵니다."
          : "상자에 세 가지 문양이 새겨져 있어요. 루미에게 퀘스트를 받고 마을의 세 명소를 먼저 둘러보세요.";
  return (
    <dialog ref={dialog} className="adventure-dialog" onCancel={onClose}>
      <button className="dialog-close" aria-label="대화 닫기" onClick={onClose}>
        ×
      </button>
      <span className="dialog-eyebrow">
        {kind === "guide"
          ? "FIELD NOTES"
          : kind === "npc"
            ? "VILLAGE GUIDE · NPC"
            : "DISCOVERY"}
      </span>
      <h2>
        {kind === "guide"
          ? "길 위에서 만나는 작은 발견"
          : kind === "npc"
            ? NPC.name
            : CHEST.name}
      </h2>
      {kind === "guide" ? (
        <>
          <p>
            중앙 광장으로 이동한 뒤 분수 아래의 루미에게 다가가 <kbd>E</kbd>를
            눌러 주세요. 명소는 가까이 걸어가면 발견됩니다.
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
            세 명소를 찾았다면 시장 남쪽 보물상자 앞에서 E → 루미에게 돌아와
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
                : "좋아요, 탐험할게요"
              : "보물상자 열기"}
          </button>
        )}
        <button className="button" onClick={onClose}>
          {" "}
          {kind === "guide" ? "산책하러 가기" : "다음에 또 만나요"}{" "}
        </button>
      </div>
    </dialog>
  );
}
