import * as Phaser from "phaser";
import { createWorldInput } from "./world-input";
import { freshAdventure, type Adventure } from "./adventure-model";
import { drawWorldDetails } from "./world-details";
import { preloadWorldArt, drawArtMap } from "./world-art";
import { avatarFrame } from "./world-art-model";
import {
  STATUSES,
  type Player,
  type Position,
  type Profile,
  type Team,
} from "../lib/types";
import { WORLD, regionsFor, obstaclesFor, roomAt, step } from "./world-model";

export interface WorldController {
  adventure(state: Adventure): void;
  focus(): void;
  controls(enabled: boolean): void;
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
  onInteract(position: Position): void;
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
  const input = createWorldInput();
  let controlsEnabled = true;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ready = false;
  let lastSend = 0;
  let wasMoving = false;
  let mine: Actor;
  let adventure = freshAdventure();
  let details: ReturnType<typeof drawWorldDetails>;
  let hat: Phaser.GameObjects.Graphics;
  const actors = new Map<string, Actor>();
  const typing = () => {
    const el = document.activeElement;
    return (
      !!document.querySelector("dialog[open]") ||
      (el instanceof HTMLElement &&
        !!el.closest(
          "input, textarea, select, [contenteditable]:not([contenteditable=false]), [role=dialog]",
        ))
    );
  };
  const focusWorld = () => {
    if (ready && controlsEnabled && !typing())
      game.canvas.focus({ preventScroll: true });
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (!ready || e.defaultPrevented || document.hidden) return;
    const action = input.down(e.key, {
      typing: typing(),
      composing: e.isComposing || e.keyCode === 229,
      modified: e.ctrlKey || e.metaKey || e.altKey,
      repeat: e.repeat,
    });
    if (!action) return;
    e.preventDefault();
    if (action === "interact") options.onInteract(position);
  };
  const onKeyUp = (e: KeyboardEvent) => input.up(e.key);
  const clearKeys = () => input.clear();
  class WorldScene extends Phaser.Scene {
    preload() {
      preloadWorldArt(this);
    }
    create() {
      drawArtMap(this, regions);
      details = drawWorldDetails(this);
      mine = createActor(this, profile, true);
      hat = this.add.graphics().setVisible(false);
      hat
        .fillStyle(0xdec68c)
        .fillRect(-19, -45, 38, 6)
        .fillRect(-11, -57, 23, 12);
      hat.fillStyle(0x61795d).fillRect(-11, -48, 23, 4);
      hat.fillStyle(0xfaf1ca).fillTriangle(7, -54, 21, -70, 16, -51);
      mine.container.add(hat);
      this.cameras.main
        .setBounds(0, 0, WORLD.width, WORLD.height)
        .setZoom(0.95);
      this.cameras.main.startFollow(mine.container, true, 0.12, 0.12);
      game.canvas.setAttribute("tabindex", "0");
      game.canvas.setAttribute(
        "aria-label",
        "TeamWorld 월드. WASD 또는 방향키로 바로 이동하고 E로 대화하세요.",
      );
      game.canvas.addEventListener("pointerdown", () => game.canvas.focus());
      game.canvas.addEventListener("blur", clearKeys);
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      window.addEventListener("blur", clearKeys);
      document.addEventListener("focusin", clearKeys);
      document.addEventListener("visibilitychange", clearKeys);
      ready = true;
      options.onReady();
      focusWorld();
    }
    update(time: number, delta: number) {
      if (!ready) return;
      const { dx, dy, buffered } = input.read();
      position = step(position, dx, dy, buffered ? 16 : delta, obstacles);
      paintActor(mine, { ...profile, ...position }, time, reduced);
      hat
        .setVisible(adventure.equipped)
        .setY(!reduced && position.moving ? Math.sin(time / 85) * 2 : 0);
      details.update(adventure);
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
        paintActor(actor, player, time, reduced);
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
    adventure(next) {
      adventure = next;
    },
    focus() {
      if (ready && controlsEnabled) game.canvas.focus({ preventScroll: true });
    },
    controls(enabled) {
      controlsEnabled = enabled;
      input.enable(enabled);
      if (enabled) focusWorld();
    },
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
      clearKeys();
      options.onMove(position, roomAt(position, regions));
      focusWorld();
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
      document.removeEventListener("focusin", clearKeys);
      document.removeEventListener("visibilitychange", clearKeys);
      game.destroy(true);
    },
  };
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
  const sprite = scene.add
    .image(0, -24, "art-" + player.avatar_type, 0)
    .setScale(0.85);
  const name = scene.add
    .text(0, -84, player.nickname + (self ? " · 나" : ""), {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#f8f5e8",
      backgroundColor: self ? "#344e40" : "#536354",
      padding: { x: 8, y: 4 },
    })
    .setOrigin(0.5);
  const status = scene.add
    .text(0, -106, STATUSES[player.status], {
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
function paintActor(
  actor: Actor,
  player: Player,
  time: number,
  reduced: boolean,
) {
  const texture = "art-" + player.avatar_type;
  if (actor.sprite.texture.key !== texture) actor.sprite.setTexture(texture);
  actor.sprite.setFrame(
    avatarFrame(player.avatar_type, player.moving, time, reduced),
  );
  actor.name.setText(
    player.nickname + (actor.container.getData("self") ? " · 나" : ""),
  );
  actor.status.setText(STATUSES[player.status]);
  actor.sprite.setFlipX(player.direction === "left").setY(-24);
}
