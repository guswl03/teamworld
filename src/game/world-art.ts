import * as Phaser from "phaser";
import { IT_ATLAS, IT_FRAMES } from "./it-avatar";
import type { Region } from "./world-model";
import { drawCenter } from "./center-art";
import { MENTORS } from "./mentors";
export function preloadWorldArt(scene: Phaser.Scene) {
  scene.load.image("it-team", IT_ATLAS.url);
  for (const mentor of MENTORS) scene.load.image(mentor.id, mentor.image);
}
export function drawArtMap(scene: Phaser.Scene, regions: Region[]) {
  const texture = scene.textures.get("it-team");
  for (const [avatar, frames] of Object.entries(IT_FRAMES))
    frames.forEach((f, index) =>
      texture.add(`${avatar}-${index}`, 0, f.x, f.y, f.width, f.height),
    );
  drawCenter(scene, regions);
}
