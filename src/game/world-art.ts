import * as Phaser from "phaser";
import { ART_ROOT, AVATAR_SHEETS } from "./world-art-model";
import { WORLD, type Region } from "./world-model";

const images = [
  "terrain",
  "water",
  "house-blue",
  "house-yellow",
  "castle-red",
  "castle-blue",
  "tower-purple",
  "mushroom",
  "rock",
  "bush",
  "sign",
  "scarecrow",
];

export function preloadWorldArt(scene: Phaser.Scene) {
  scene.load.tilemapTiledJSON("village", "/maps/village.tmj");
  for (const key of images)
    scene.load.image("art-" + key, ART_ROOT + key + ".png");
  for (const [key, sheet] of Object.entries(AVATAR_SHEETS)) {
    scene.load.spritesheet("art-" + key, sheet.url, {
      frameWidth: 192,
      frameHeight: 192,
    });
  }
  scene.load.spritesheet("art-tree", ART_ROOT + "tree.png", {
    frameWidth: 192,
    frameHeight: 192,
  });
  scene.load.spritesheet("art-sheep", ART_ROOT + "sheep.png", {
    frameWidth: 128,
    frameHeight: 128,
  });
}

export function drawArtMap(scene: Phaser.Scene, regions: Region[]) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  scene.add
    .tileSprite(0, 0, WORLD.width, WORLD.height, "art-water")
    .setOrigin(0)
    .setDepth(-200);
  const map = scene.make.tilemap({ key: "village" });
  const tiles = map.addTilesetImage("Tiny Swords CC0 terrain", "art-terrain")!;
  for (const [index, layer] of map.layers.entries()) {
    map
      .createLayer(layer.name, tiles)!
      .setScale(0.5)
      .setDepth(-150 + index);
  }
  const art = (key: string, x: number, y: number, scale = 1) =>
    scene.add
      .image(x, y, "art-" + key, 0)
      .setOrigin(0.5, 0.9)
      .setScale(scale)
      .setDepth(y + 90);
  const tree = (x: number, y: number, scale = 0.8) => art("tree", x, y, scale);
  // A dense forest border frames the village; the open road network stays readable.
  for (let x = 104; x < 1530; x += 73) {
    tree(x, 145 + (x % 5) * 5, 0.82);
    tree(x + 20, 1040 - (x % 3) * 9, 0.78);
  }
  for (let y = 240; y < 1010; y += 94) {
    tree(112, y, 0.95);
    tree(1490, y + 18, 0.85);
  }
  for (const [x, y, scale] of [
    [250, 555, 0.9],
    [333, 578, 0.7],
    [240, 678, 0.8],
    [1280, 581, 0.85],
    [1390, 659, 0.95],
    [571, 853, 0.7],
    [988, 952, 0.8],
    [599, 277, 0.8],
  ])
    tree(x, y, scale);

  const buildings = [
    "house-blue",
    "castle-red",
    "tower-purple",
    "house-yellow",
    "castle-blue",
  ];
  const scales = [1.2, 0.57, 1.1, 1.2, 0.57];
  for (const [i, r] of regions.entries()) {
    tree(r.x - 144, r.y - 6, 0.78);
    tree(r.x + 160, r.y + 24, 0.82);
    art(buildings[i % 5], r.x, r.y + 17, scales[i % 5]).setDepth(r.y + 109);
    art("bush", r.x - 108, r.y + 46, 1.1);
    art("bush", r.x + 101, r.y + 62, 0.85);
    art("rock", r.x + 143, r.y + 65, 0.9);
    scene.add
      .text(r.x, r.y + 127, r.name, {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#fff4cf",
        backgroundColor: "#293f42",
        padding: { x: 14, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(r.y + 250);
    scene.add
      .text(r.x, r.y + 103, "GUILD 0" + (i + 1), {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#466453",
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setDepth(r.y + 240);
  }
  // Repeatable hand-placed props, never random on each visit.
  for (const [x, y] of [
    [207, 443],
    [266, 484],
    [584, 487],
    [604, 740],
    [943, 758],
    [1258, 468],
    [1348, 740],
    [573, 951],
    [1113, 947],
    [902, 334],
  ]) {
    art("bush", x, y, 0.8);
    art("mushroom", x + 25, y + 13, 0.8);
    art("rock", x - 19, y + 20, 0.7);
  }
  art("scarecrow", 584, 418, 0.65);
  art("sign", 632, 678, 0.75);
  if (!scene.anims.exists("sheep-idle"))
    scene.anims.create({
      key: "sheep-idle",
      frames: scene.anims.generateFrameNumbers("art-sheep", {
        start: 0,
        end: 7,
      }),
      frameRate: 8,
      repeat: -1,
    });
  for (const [x, y] of [
    [382, 481],
    [409, 525],
    [304, 687],
  ]) {
    const sheep = scene.add
      .sprite(x, y, "art-sheep", 0)
      .setScale(0.65)
      .setOrigin(0.5, 0.67)
      .setDepth(y + 90);
    if (!reduced) sheep.play("sheep-idle");
  }

  // Keep the fountain footprint identical to movement collision and existing quests.
  const fountain = scene.add.graphics().setDepth(660);
  fountain.fillStyle(0x365664, 0.18).fillEllipse(804, 567, 104, 36);
  fountain.fillStyle(0x688a94).fillEllipse(800, 553, 100, 48);
  fountain.fillStyle(0xe5e7cf).fillEllipse(800, 544, 100, 44);
  fountain.fillStyle(0x49a4b1).fillEllipse(800, 544, 79, 28);
  fountain.fillStyle(0x94d4d5).fillEllipse(800, 540, 62, 15);
  fountain.fillStyle(0xa7c1be).fillRect(793, 510, 14, 35);
  fountain.fillStyle(0xecedcf).fillEllipse(800, 507, 43, 15);
  fountain.fillStyle(0x87d0d1).fillEllipse(800, 504, 33, 9);
  fountain.fillStyle(0xf1ffee).fillRect(797, 485, 5, 18);
  for (let i = 0; i < 5; i++) {
    const drop = scene.add.circle(786 + i * 7, 510, 2, 0xd5ffed).setDepth(662);
    if (!reduced)
      scene.tweens.add({
        targets: drop,
        y: 540,
        alpha: 0.1,
        duration: 900,
        delay: i * 180,
        repeat: -1,
      });
  }
  scene.add
    .text(800, 750, "THE COMMON GROUNDS", {
      fontFamily: "monospace",
      fontSize: "11px",
      letterSpacing: 3,
      color: "#45685d",
    })
    .setOrigin(0.5)
    .setDepth(0);
}
