import * as Phaser from "phaser";
import { NPC, CHEST, LANDMARKS, type Adventure } from "./adventure-model";

// Decorative layer is separate from movement and multiplayer state. NPCs are not players.
export function drawWorldDetails(scene: Phaser.Scene) {
  const g = scene.add.graphics();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rect = (color: number, x: number, y: number, w: number, h: number) =>
    g.fillStyle(color).fillRect(x, y, w, h);
  const label = (x: number, y: number, text: string, color = "#53694d") =>
    scene.add
      .text(x, y, text, {
        fontFamily: "Arial",
        fontSize: "12px",
        color,
        backgroundColor: "#f2ebd4",
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5);
  const animate = (
    targets: Phaser.GameObjects.GameObject,
    extra: Record<string, unknown>,
  ) => {
    if (!reduced) scene.tweens.add({ targets, repeat: -1, ...extra });
  };
  const flowers = (x: number, y: number, color: number) => {
    rect(0x70885a, x - 2, y, 3, 8);
    rect(color, x - 5, y - 4, 9, 6);
    rect(0xf9e5a7, x - 1, y - 3, 3, 3);
  };
  const crate = (x: number, y: number) => {
    rect(0x8c704b, x, y, 24, 22);
    rect(0xc2a277, x + 2, y + 2, 20, 17);
    g.lineStyle(2, 0x92734c)
      .lineBetween(x + 3, y + 3, x + 20, y + 18)
      .strokeRect(x, y, 24, 22);
  };

  // Garden: trellis, raised beds, stepping stones and drifting pollen.
  g.fillStyle(0x859d74).fillRoundedRect(440, 366, 131, 103, 18);
  g.fillStyle(0xc7c5a0).fillEllipse(497, 455, 104, 34);
  for (let row = 0; row < 3; row++) {
    rect(0x917859, 449, 381 + row * 21, 109, 16);
    for (let col = 0; col < 8; col++)
      flowers(
        456 + col * 13,
        385 + row * 21,
        (row + col) % 2 ? 0xe7b0a6 : 0xf0d487,
      );
  }
  rect(0xeee3c1, 438, 366, 5, 77);
  rect(0xeee3c1, 568, 366, 5, 77);
  rect(0xeee3c1, 436, 367, 140, 5);
  for (let i = 0; i < 7; i++) flowers(445 + i * 20, 368, 0xc1adce);
  label(500, 483, "❀ 바람꽃 정원");
  for (let i = 0; i < 7; i++) {
    const mote = scene.add.circle(
      451 + i * 17,
      391 + (i % 3) * 22,
      2,
      0xfff5c3,
      0.8,
    );
    animate(mote, {
      x: mote.x + 22,
      y: mote.y - 24,
      alpha: 0.2,
      duration: 2400 + i * 180,
      yoyo: true,
    });
  }
  // Two striped market stalls, hanging bunting and crates.
  for (let i = 0; i < 2; i++) {
    const x = 970 + i * 114,
      y = 332;
    rect(0x867054, x, y + 8, 5, 62);
    rect(0x867054, x + 89, y + 8, 5, 62);
    rect(0xb99163, x - 4, y + 42, 103, 26);
    rect(0xd7b782, x - 5, y + 40, 105, 7);
    g.fillStyle(0x725e45, 0.18).fillEllipse(x + 46, y + 74, 111, 20);
    for (let stripe = 0; stripe < 6; stripe++) {
      const color = stripe % 2 ? 0xf7e3ba : i === 0 ? 0xb97966 : 0x8589ac;
      rect(color, x - 8 + stripe * 19, y - 7, 19, 26);
      g.fillStyle(color).fillCircle(x + 1 + stripe * 19, y + 19, 9);
    }
    for (let item = 0; item < 5; item++)
      flowers(x + item * 18 + 8, y + 38, i ? 0xb5abc5 : 0xe4b24f);
    crate(x + 73, y + 77);
  }
  g.lineStyle(2, 0x86785d).lineBetween(950, 288, 1210, 303);
  for (let i = 0; i < 13; i++)
    g.fillStyle([0xd39e78, 0xe6d6a7, 0x94ad85, 0xa59ac0][i % 4]).fillTriangle(
      950 + i * 20,
      289 + i,
      964 + i * 20,
      290 + i,
      957 + i * 20,
      307 + i,
    );
  label(1050, 430, "⚑ 별빛 시장");
  // Pond and footbridge, lily pads and animated water glints.
  g.fillStyle(0x8c9e79).fillEllipse(796, 914, 212, 123);
  g.fillStyle(0xd2c7a0).fillEllipse(793, 909, 202, 111);
  g.fillStyle(0x79a7ac).fillEllipse(794, 905, 184, 96);
  g.fillStyle(0x99c0bd).fillEllipse(779, 894, 150, 62);
  for (let i = 0; i < 7; i++) {
    const x = 721 + ((i * 37) % 144),
      y = 886 + (i % 3) * 22;
    g.fillStyle(0x6e9273).fillEllipse(x, y, 19, 9);
    if (i % 2 === 0) flowers(x, y - 3, 0xe8bfbb);
    const ripple = scene.add.ellipse(x + 12, y + 13, 16, 3, 0xe4eedb, 0.6);
    animate(ripple, {
      alpha: 0.15,
      scaleX: 1.8,
      duration: 1800 + i * 100,
      yoyo: true,
    });
  }
  rect(0x7c7054, 758, 856, 50, 41);
  for (let y = 858; y < 899; y += 7) rect(0xc2a57c, 755, y, 56, 5);
  rect(0x8b7658, 752, 850, 4, 40);
  rect(0x8b7658, 811, 850, 4, 40);
  label(788, 984, "≈ 달빛 연못");

  // NPC and quest markers remain independent of the external scenery.
  const guide = scene.add.container(NPC.x, NPC.y).setDepth(NPC.y + 99);
  guide.add(scene.add.ellipse(0, 3, 33, 11, 0x445738, 0.25));
  guide.add(scene.add.image(0, -24, "art-mage", 0).setScale(0.9));
  guide.add(
    scene.add
      .text(0, 16, "루미 · NPC", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#faf0d7",
        backgroundColor: "#615675",
        padding: { x: 7, y: 4 },
      })
      .setOrigin(0.5),
  );
  const npcMarker = scene.add
    .text(NPC.x, NPC.y - 74, "!", {
      fontFamily: "Georgia",
      fontSize: "30px",
      fontStyle: "bold",
      color: "#fff1a6",
      stroke: "#7c6650",
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(NPC.y + 101);
  animate(npcMarker, { y: NPC.y - 81, duration: 900, yoyo: true });
  const chest = scene.add
    .graphics()
    .setPosition(CHEST.x, CHEST.y)
    .setDepth(CHEST.y + 99);
  chest.fillStyle(0x485c3e, 0.2).fillEllipse(0, 7, 47, 16);
  chest.fillStyle(0x876343).fillRoundedRect(-21, -20, 42, 28, 4);
  chest.fillStyle(0xc69a58).fillRoundedRect(-21, -26, 42, 18, 5);
  chest.lineStyle(3, 0xe5c684).strokeRect(-20, -19, 40, 25);
  chest.fillStyle(0xefd99c).fillRect(-4, -13, 8, 11);
  const chestMarker = label(CHEST.x, CHEST.y - 48, "◇ 봉인된 상자");
  const marks = LANDMARKS.map((p) => label(p.x, p.y - 67, "◇", "#7b775a"));
  let previous: Adventure | undefined;
  return {
    update(state: Adventure) {
      if (previous === state) return;
      previous = state;
      npcMarker.setText(
        state.rewarded
          ? "♥"
          : state.treasure
            ? "?"
            : state.accepted
              ? "···"
              : "!",
      );
      chestMarker.setText(
        state.treasure
          ? "✓ 발견한 보물"
          : state.visited.length === 3
            ? "✧ 열 수 있는 상자"
            : "◇ 봉인된 상자",
      );
      chest.setAlpha(state.treasure ? 0.65 : 1);
      marks.forEach((m, i) =>
        m.setText(
          state.visited.includes(LANDMARKS[i].id) ? "✓ 발견" : "◇ 탐험 명소",
        ),
      );
    },
  };
}
