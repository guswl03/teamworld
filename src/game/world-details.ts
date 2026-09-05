import * as Phaser from "phaser";
import { NPC, CHEST, LANDMARKS, type Adventure } from "./adventure-model";
import { MENTORS } from "./mentors";
export function drawWorldDetails(scene: Phaser.Scene) {
  const label = (
    x: number,
    y: number,
    value: string,
    color = "#eaf8fa",
    background = "#27556b",
  ) =>
    scene.add
      .text(x, y, value, {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        color,
        backgroundColor: background,
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(y + 110);
  for (const mentor of MENTORS) {
    const g = scene.add.graphics();
    g.fillStyle(mentor.color, 0.22).fillEllipse(0, 1, 42, 14);
    const sprite = scene.add.image(0, 0, mentor.id).setOrigin(0.5, 1);
    sprite.setScale(76 / sprite.height);
    scene.add
      .container(mentor.x, mentor.y, [g, sprite])
      .setDepth(mentor.y + 100);
    label(mentor.x, mentor.y + 20, `${mentor.name} · NPC`);
  }
  const guide = scene.add
    .image(NPC.x, NPC.y, "it-team", "explorer-1")
    .setOrigin(0.5, 1)
    .setDepth(NPC.y + 100);
  guide.setScale(64 / guide.height);
  label(NPC.x, NPC.y + 22, "루미 · 안내 NPC");
  const marker = label(NPC.x - 95, NPC.y - 52, "! · 센터 둘러보기", "#ffe5a3");
  const chest = scene.add.graphics().setDepth(CHEST.y + 100);
  chest.fillStyle(0x2d566f).fillRect(CHEST.x - 22, CHEST.y - 25, 44, 32);
  chest.fillStyle(0x8bd0d1).fillRect(CHEST.x - 19, CHEST.y - 22, 38, 7);
  chest.fillStyle(0xe6eee9).fillRect(CHEST.x - 6, CHEST.y - 13, 12, 12);
  const chestLabel = label(CHEST.x, CHEST.y + 24, "◇ 웰컴 키트");
  const landmarks = LANDMARKS.map((p) =>
    label(p.x, p.y - 34, p.name, "#315d6d", "#edf7f6"),
  );
  let previous: Adventure | undefined;
  return {
    update(state: Adventure) {
      if (previous === state) return;
      previous = state;
      marker.setText(
        state.rewarded
          ? "✓ 안내 완료"
          : state.treasure
            ? "! · 보상 받기"
            : state.accepted
              ? "센터 안내"
              : "! · 센터 둘러보기",
      );
      chestLabel.setText(
        state.treasure
          ? "✓ 받은 키트"
          : state.visited.length === 3
            ? "E · 키트 수령"
            : "◇ 웰컴 키트",
      );
      chest.setAlpha(state.treasure ? 0.6 : 1);
      landmarks.forEach((m, i) =>
        m.setText(
          `${state.visited.includes(LANDMARKS[i].id) ? "✓" : "◇"} ${LANDMARKS[i].name}`,
        ),
      );
    },
  };
}
