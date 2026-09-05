import * as Phaser from "phaser";
import { AVATAR_INFO } from "../lib/data";
import {
  AVATARS,
  STATUSES,
  type Player,
  type Position,
  type Profile,
  type Team,
} from "../lib/types";
import {
  WORLD,
  regionsFor,
  obstaclesFor,
  roomAt,
  step,
  type Region,
} from "./world-model";

export interface WorldController {
  players(players: Player[]): void;
  profile(profile: Profile): void;
  travel(room: string): void;
  zoom(amount: number): void;
  destroy(): void;
}
interface Options {
  parent: HTMLElement;
  player: Player;
  teams: Team[];
  onMove(position: Position, room: string): void;
  onReady(): void;
}
type Actor = {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  name: Phaser.GameObjects.Text;
  status: Phaser.GameObjects.Text;
  target: Player;
};
export function createWorld(options: Options): WorldController {
  let profile = { ...options.player };
  let remotePlayers: Player[] = [];
  let position: Position = { ...options.player };
  const regions = regionsFor(options.teams);
  const obstacles = obstaclesFor(regions);
  const keys = new Set<string>();
  let tap: string | null = null;
  let ready = false;
  let lastSend = 0;
  let wasMoving = false;
  let mine: Actor;
  const actors = new Map<string, Actor>();
  const gameKeys = [
    "w",
    "a",
    "s",
    "d",
    "arrowup",
    "arrowleft",
    "arrowdown",
    "arrowright",
  ];
  const onKeyDown = (e: KeyboardEvent) => {
    if (
      document.activeElement === game.canvas &&
      gameKeys.includes(e.key.toLowerCase())
    ) {
      e.preventDefault();
      if (!keys.has(e.key.toLowerCase())) tap = e.key.toLowerCase();
      keys.add(e.key.toLowerCase());
    }
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
  const clearKeys = () => {
    keys.clear();
    tap = null;
  };
  class WorldScene extends Phaser.Scene {
    create() {
      drawMap(this, regions);
      generateCharacters(this);
      mine = createActor(this, profile, true);
      this.cameras.main
        .setBounds(0, 0, WORLD.width, WORLD.height)
        .setZoom(0.95);
      this.cameras.main.startFollow(mine.container, true, 0.12, 0.12);
      game.canvas.setAttribute("tabindex", "0");
      game.canvas.setAttribute(
        "aria-label",
        "TeamWorld 게임 맵. 클릭한 후 WASD 또는 방향키로 이동하세요.",
      );
      game.canvas.addEventListener("pointerdown", () => game.canvas.focus());
      game.canvas.addEventListener("blur", clearKeys);
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      window.addEventListener("blur", clearKeys);
      ready = true;
      options.onReady();
    }
    update(time: number, delta: number) {
      if (!ready) return;
      // Preserve short taps that begin and end between animation frames.
      const buffered = keys.size === 0 && tap !== null;
      const input = buffered ? new Set([tap!]) : keys;
      const dx =
        Number(input.has("d") || input.has("arrowright")) -
        Number(input.has("a") || input.has("arrowleft"));
      const dy =
        Number(input.has("s") || input.has("arrowdown")) -
        Number(input.has("w") || input.has("arrowup"));
      position = step(position, dx, dy, buffered ? 16 : delta, obstacles);
      tap = null;
      paintActor(mine, { ...profile, ...position }, time);
      mine.container
        .setPosition(position.x, position.y)
        .setDepth(position.y + 100);
      if (
        (position.moving && time - lastSend >= 100) ||
        (!position.moving && wasMoving)
      ) {
        options.onMove(position, roomAt(position, regions));
        lastSend = time;
      }
      wasMoving = position.moving;
      const current = new Set(remotePlayers.map((p) => p.session_id));
      for (const [id, actor] of actors)
        if (!current.has(id)) {
          actor.container.destroy();
          actors.delete(id);
        }
      for (const player of remotePlayers) {
        let actor = actors.get(player.session_id);
        if (!actor) {
          actor = createActor(this, player, false);
          actors.set(player.session_id, actor);
        }
        const blend = 1 - Math.exp(-delta / 85);
        actor.container.x = Phaser.Math.Linear(
          actor.container.x,
          player.x,
          blend,
        );
        actor.container.y = Phaser.Math.Linear(
          actor.container.y,
          player.y,
          blend,
        );
        actor.container.setDepth(actor.container.y + 100);
        paintActor(actor, player, time);
      }
    }
  }
  const scene = new WorldScene("world");
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: options.parent,
    width: options.parent.clientWidth,
    height: options.parent.clientHeight,
    backgroundColor: "#aabc98",
    pixelArt: true,
    roundPixels: true,
    scene,
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { keyboard: false },
    audio: { noAudio: true },
    render: { antialias: false },
    fps: { target: 60 },
  });
  const observer = new ResizeObserver(() =>
    game.scale.resize(options.parent.clientWidth, options.parent.clientHeight),
  );
  observer.observe(options.parent);
  return {
    players(players) {
      remotePlayers = players;
    },
    profile(next) {
      profile = { ...profile, ...next };
    },
    travel(room) {
      if (!ready) return;
      const region = regions.find((r) => r.id === room);
      position = {
        x: region?.x || 800,
        y: region ? region.y + 80 : 640,
        direction: "down",
        moving: false,
      };
      keys.clear();
      options.onMove(position, roomAt(position, regions));
      game.canvas.focus();
    },
    zoom(amount) {
      if (ready)
        scene.cameras.main.setZoom(
          Phaser.Math.Clamp(scene.cameras.main.zoom + amount, 0.55, 1.6),
        );
    },
    destroy() {
      ready = false;
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      game.destroy(true);
    },
  };
}
function generateCharacters(scene: Phaser.Scene) {
  for (const avatar of AVATARS) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const rect = (color: number, x: number, y: number, w: number, h: number) =>
      g.fillStyle(color).fillRect(x, y, w, h);
    const color = Phaser.Display.Color.HexStringToColor(
      AVATAR_INFO[avatar].color,
    ).color;
    rect(0x34443f, 5, 21, 5, 4);
    rect(0x34443f, 13, 21, 5, 4);
    rect(color, 4, 12, 15, 10);
    rect(color, 1, 14, 3, 7);
    rect(color, 19, 14, 3, 7);
    rect(0xedc39b, 5, 3, 13, 10);
    rect(0xe3ac81, 3, 6, 2, 5);
    rect(0xe3ac81, 18, 6, 2, 5);
    rect(0x263d3b, 7, 7, 2, 2);
    rect(0x263d3b, 14, 7, 2, 2);
    rect(0xd4a077, 9, 11, 5, 2);
    rect(color, 3, 1, 17, 5);
    rect(color, 6, 0, 11, 2);
    rect(0xedc39b, 7, 5, 8, 2);
    rect(0xe5d38a, 10, 14, 3, 7);
    rect(0x46564c, 4, 20, 15, 2);
    if (avatar === "mage") {
      rect(color, 0, 3, 23, 3);
      rect(color, 8, 0, 7, 3);
      rect(0xf0d28f, 13, 1, 2, 2);
    }
    if (avatar === "engineer") {
      rect(0x475959, 5, 6, 5, 4);
      rect(0x475959, 13, 6, 5, 4);
      rect(0xa8c0bc, 6, 7, 2, 1);
      rect(0xa8c0bc, 14, 7, 2, 1);
    }
    if (avatar === "ranger") rect(0xe5d38a, 18, 0, 2, 6);
    g.generateTexture(avatar, 24, 26);
    g.destroy();
  }
}
function createActor(
  scene: Phaser.Scene,
  player: Player,
  self: boolean,
): Actor {
  const shadow = scene.add.ellipse(0, 3, 30, 10, 0x334a38, 0.2);
  const ring = scene.add
    .ellipse(0, 3, 37, 15)
    .setStrokeStyle(2, self ? 0xf7f1d6 : 0xc7dcc5, 0.8);
  const sprite = scene.add.image(0, -22, player.avatar_type).setScale(1.7);
  const name = scene.add
    .text(0, -58, player.nickname + (self ? " · 나" : ""), {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#f8f5e8",
      backgroundColor: self ? "#344e40" : "#536354",
      padding: { x: 8, y: 4 },
    })
    .setOrigin(0.5);
  const status = scene.add
    .text(0, -80, STATUSES[player.status], {
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      color: "#384c3a",
      backgroundColor: "#f8f4df",
      padding: { x: 6, y: 3 },
    })
    .setOrigin(0.5);
  const container = scene.add.container(player.x, player.y, [
    shadow,
    ring,
    sprite,
    name,
    status,
  ]);
  container.setData("self", self);
  return { container, sprite, name, status, target: player };
}
function paintActor(actor: Actor, player: Player, time: number) {
  if (actor.sprite.texture.key !== player.avatar_type)
    actor.sprite.setTexture(player.avatar_type);
  actor.name.setText(
    player.nickname + (actor.container.getData("self") ? " · 나" : ""),
  );
  actor.status.setText(STATUSES[player.status]);
  actor.sprite
    .setFlipX(player.direction === "left")
    .setY(-22 + (player.moving ? Math.sin(time / 85) * 2 : 0));
}
function drawMap(scene: Phaser.Scene, regions: Region[]) {
  const g = scene.add.graphics();
  g.fillStyle(0xb3cbd0).fillRect(0, 0, WORLD.width, WORLD.height);
  for (let y = 0; y < WORLD.height; y += 32)
    for (let x = 0; x < WORLD.width; x += 48)
      g.fillStyle(0xd1e1de, 0.4).fillRect(x + ((y / 32) % 2) * 20, y, 16, 2);
  g.fillStyle(0xd2c7a0).fillRoundedRect(44, 58, 1512, 1020, 80);
  g.fillStyle(0x97ad82).fillRoundedRect(60, 75, 1480, 990, 70);
  g.fillStyle(0xa4b58e).fillRoundedRect(75, 88, 1450, 965, 65);
  const rng = Phaser.Math.RandomDataGenerator
    ? new Phaser.Math.RandomDataGenerator(["teamworld-v1"])
    : null;
  for (let i = 0; i < 2200; i++) {
    const x = rng!.between(100, 1500),
      y = rng!.between(110, 1020);
    g.fillStyle(i % 3 === 0 ? 0x8fa77d : 0xb5c49d, 0.7).fillRect(
      x,
      y,
      i % 4 === 0 ? 12 : 3,
      2,
    );
    if (i % 4 === 0) g.fillRect(x + 3, y - 3, 2, 4);
  }
  for (const r of regions) {
    g.lineStyle(48, 0xc5b894)
      .beginPath()
      .moveTo(800, 575)
      .lineTo(r.x, r.y + 40)
      .strokePath();
    g.lineStyle(39, 0xd9cda9)
      .beginPath()
      .moveTo(800, 575)
      .lineTo(r.x, r.y + 40)
      .strokePath();
    g.fillStyle(0xd9cda9).fillRoundedRect(r.x - 125, r.y - 60, 250, 185, 25);
  }
  g.fillStyle(0xc7bd9f).fillRoundedRect(652, 442, 296, 243, 30);
  g.fillStyle(0xe4d9b9).fillRoundedRect(663, 453, 274, 221, 22);
  g.lineStyle(1, 0xcbbf9d, 0.55);
  for (let x = 680; x < 930; x += 28) g.lineBetween(x, 458, x, 669);
  for (let y = 472; y < 670; y += 26) g.lineBetween(668, y, 932, y);
  // Trees along the coast and around each guild keep the walkable paths readable.
  for (let x = 115; x < 1500; x += 57) {
    tree(g, x, 132 + (x % 3) * 9, 1.1);
    tree(g, x, 1010 - (x % 4) * 9, 0.95);
  }
  for (let y = 190; y < 980; y += 64) {
    tree(g, 118 + (y % 4) * 8, y, 1);
    tree(g, 1475 - (y % 3) * 6, y, 1);
  }
  for (const r of regions) {
    for (const [dx, dy] of [
      [-165, -40],
      [-150, -92],
      [154, -66],
      [174, -15],
      [-165, 78],
    ])
      tree(g, r.x + dx, r.y + dy, 0.85);
    building(g, r);
    scene.add
      .text(r.x, r.y + 148, r.name, {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#f7f1da",
        backgroundColor: "#53644d",
        padding: { x: 15, y: 7 },
      })
      .setOrigin(0.5);
    const t = optionsTeamCaption(r.id);
    scene.add
      .text(r.x, r.y + 130, t, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#7c8065",
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    bench(g, r.x - 88, r.y + 80);
    bench(g, r.x + 88, r.y + 80);
  }
  // Central fountain, notice board, lamps, flower beds and campfire.
  g.fillStyle(0x9da58f, 0.35).fillEllipse(804, 572, 100, 30);
  g.fillStyle(0xaaa98e).fillEllipse(800, 557, 99, 47);
  g.fillStyle(0xeae3ca).fillEllipse(800, 548, 99, 43);
  g.fillStyle(0x77abb1).fillEllipse(800, 548, 77, 28);
  g.fillStyle(0xaad4d2).fillEllipse(800, 544, 62, 17);
  g.fillStyle(0xc1c0a6).fillRect(793, 510, 14, 39);
  g.fillStyle(0xede7ce).fillEllipse(800, 508, 44, 15);
  g.fillStyle(0x93c7ca).fillEllipse(800, 505, 33, 9);
  g.fillStyle(0xd5ece0).fillRect(797, 483, 5, 21);
  g.fillStyle(0xecf4e6).fillRect(794, 482, 11, 3);
  const sparkle = scene.add.circle(800, 492, 3, 0xffffff, 0.8);
  scene.tweens.add({
    targets: sparkle,
    y: 480,
    alpha: 0,
    duration: 1100,
    repeat: -1,
  });
  scene.add
    .text(800, 707, "THE COMMON GROUNDS", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#5c7456",
      letterSpacing: 3,
    })
    .setOrigin(0.5);
  bench(g, 701, 606);
  bench(g, 899, 606);
  for (const [x, y] of [
    [682, 480],
    [918, 480],
    [681, 650],
    [919, 650],
  ]) {
    g.fillStyle(0x66725a).fillRect(x - 2, y - 37, 4, 42);
    g.fillStyle(0xefe0a4).fillRect(x - 7, y - 48, 14, 14);
    g.fillStyle(0x63745a).fillRect(x - 9, y - 51, 18, 4);
  }
  for (const [x, y] of [
    [578, 439],
    [998, 710],
    [588, 720],
    [1070, 440],
    [230, 610],
    [1350, 610],
  ]) {
    g.fillStyle(0x8f9b70).fillEllipse(x, y, 35, 16);
    for (let i = 0; i < 5; i++) {
      g.fillStyle(i % 2 ? 0xefde9e : 0xd8b69c).fillRect(
        x - 13 + i * 6,
        y - 6 + (i % 2) * 4,
        4,
        4,
      );
    }
  }
  g.fillStyle(0x84765a).fillRect(575, 571, 6, 45).fillRect(626, 571, 6, 45);
  g.fillStyle(0x8d7859).fillRect(567, 561, 73, 38);
  g.fillStyle(0xdfd5b2).fillRect(573, 566, 61, 27);
  g.fillStyle(0xb5b394).fillRect(581, 572, 21, 14).fillRect(609, 571, 15, 18);
  const fireX = 991,
    fireY = 592;
  g.fillStyle(0x989783).fillEllipse(fireX, fireY + 5, 44, 18);
  g.fillStyle(0x78654d).fillRect(fireX - 12, fireY - 2, 24, 7);
  const flame = scene.add.triangle(
    fireX,
    fireY - 11,
    0,
    25,
    10,
    0,
    23,
    25,
    0xe0a362,
  );
  scene.tweens.add({
    targets: flame,
    scaleY: 0.8,
    alpha: 0.75,
    duration: 500,
    yoyo: true,
    repeat: -1,
  });
}
function optionsTeamCaption(id: string) {
  return id.replace("team-", "GUILD 0").toUpperCase();
}
function bench(g: Phaser.GameObjects.Graphics, x: number, y: number) {
  g.fillStyle(0x7f7557)
    .fillRect(x - 17, y + 5, 4, 7)
    .fillRect(x + 13, y + 5, 4, 7);
  g.fillStyle(0xb4a176).fillRect(x - 21, y - 5, 42, 11);
  g.fillStyle(0xc4b086).fillRect(x - 21, y - 10, 42, 4);
}
function tree(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
) {
  g.fillStyle(0x687b58, 0.22).fillEllipse(x + 3, y + 7, 45 * scale, 16 * scale);
  g.fillStyle(0x817351).fillRect(x - 4, y - 9, 8, 20);
  g.fillStyle(0x5c7b57)
    .fillTriangle(
      x,
      y - 65 * scale,
      x - 25 * scale,
      y - 22 * scale,
      x + 25 * scale,
      y - 22 * scale,
    )
    .fillTriangle(x, y - 45 * scale, x - 31 * scale, y, x + 31 * scale, y);
  g.fillStyle(0x739063)
    .fillTriangle(
      x,
      y - 65 * scale,
      x - 25 * scale,
      y - 22 * scale,
      x,
      y - 22 * scale,
    )
    .fillTriangle(x, y - 45 * scale, x - 31 * scale, y, x, y);
}
function building(g: Phaser.GameObjects.Graphics, r: Region) {
  const { x, y } = r;
  const color = Phaser.Display.Color.HexStringToColor(
    /^#[0-9a-f]{6}$/i.test(r.color) ? r.color : "#708d66",
  ).color;
  g.fillStyle(0x6c7b57, 0.22).fillRoundedRect(x - 78, y - 32, 168, 57, 12);
  g.fillStyle(0xd8c9a5).fillRect(x - 69, y - 90, 138, 99);
  g.fillStyle(0xc2b08a).fillRect(x - 69, y - 6, 138, 15);
  g.fillStyle(color)
    .fillTriangle(x, y - 160, x - 85, y - 79, x + 85, y - 79)
    .fillRect(x - 85, y - 80, 170, 12);
  g.lineStyle(2, 0xf3e2bc, 0.18);
  for (let row = 0; row < 5; row++)
    g.lineBetween(
      x - 70 + row * 14,
      y - 86 - row * 13,
      x + 70 - row * 14,
      y - 86 - row * 13,
    );
  g.fillStyle(0x948468).fillRect(x + 37, y - 145, 15, 47);
  g.fillStyle(0xb2a086).fillRect(x + 34, y - 148, 21, 7);
  g.fillStyle(0x6b7259).fillRoundedRect(x - 14, y - 37, 28, 46, {
    tl: 13,
    tr: 13,
    bl: 0,
    br: 0,
  });
  g.fillStyle(0xe0ca87).fillRect(x + 6, y - 13, 4, 4);
  for (const dx of [-43, 43]) {
    g.fillStyle(0x8ea8a0).fillRect(x + dx - 13, y - 48, 26, 27);
    g.lineStyle(3, 0xeee0b5)
      .strokeRect(x + dx - 13, y - 48, 26, 27)
      .lineBetween(x + dx, y - 48, x + dx, y - 21)
      .lineBetween(x + dx - 13, y - 34, x + dx + 13, y - 34);
  }
  g.fillStyle(0xe7d6af).fillRect(x - 20, y + 9, 40, 6);
  g.fillStyle(0xc5b18c).fillRect(x - 26, y + 15, 52, 5);
}
