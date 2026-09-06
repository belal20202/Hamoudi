import Phaser from "phaser";
import type { BiomeTheme } from "@/types";
import { TILE_SIZE } from "@/services/LevelGenerator";

/**
 * Lightens (positive percent) or darkens (negative percent) a 0xRRGGBB color.
 * This is the one trick that does the most to make flat procedural shapes
 * read as "shaded" rather than "flat swatch" -- a highlight band, a shadow
 * edge, a darker fold in fabric -- all just a shade() call away, with zero
 * new textures or files.
 */
function shade(color: number, percent: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const adjust = (c: number) => Math.max(0, Math.min(255, Math.round(c + (percent / 100) * 255)));
  return (adjust(r) << 16) | (adjust(g) << 8) | adjust(b);
}

/**
 * All visuals in this game are generated procedurally at boot time via Phaser.Graphics
 * rendered to textures. This satisfies the "100% offline-first, no external assets"
 * requirement -- there are no .png/.jpg files to bundle, license, or have go missing
 * in a store review. Swapping in hand-drawn art later just means replacing the body
 * of these functions with `scene.load.image(...)` calls.
 */
export class TextureFactory {
  static generateAll(scene: Phaser.Scene): void {
    this.groundTile(scene, "tile_ground_arabian_city", 0xd7a866, 0xb9834a);
    for (const biomeKey of [
      "arabian_city",
      "golden_desert",
      "palm_oasis",
      "ancient_castle",
      "heritage_town",
      "secret_caves",
      "night_city",
      "snowy_mountains",
      "ancient_ruins",
      "hamoudi_kingdom"
    ]) {
      // placeholder to keep key list explicit; real generation happens in generateBiomeTiles
      void biomeKey;
    }
    this.playerFrame(scene, "player_idle", "idle");
    this.playerFrame(scene, "player_run_a", "runA");
    this.playerFrame(scene, "player_run_b", "runB");
    this.playerFrame(scene, "player_jump", "jump");
    this.enemySprite(scene, "enemy_walker", 0xcf4b3c);
    this.enemySprite(scene, "enemy_flyer", 0x7a4bcf);
    this.enemySprite(scene, "enemy_spitter", 0x2f8f6a);
    this.coin(scene);
    this.gem(scene);
    this.hazardSpike(scene);
    this.movingPlatform(scene);
    this.goalFlag(scene);
    this.particleStar(scene);
    this.uiButton(scene);
  }

  static generateBiomeTiles(scene: Phaser.Scene, biome: BiomeTheme): void {
    const groundKey = `ground_${biome.id}`;
    const platformKey = `platform_${biome.id}`;
    const brickKey = `brick_${biome.id}`;
    if (!scene.textures.exists(groundKey)) this.groundTile(scene, groundKey, biome.groundColor, biome.groundAccent);
    if (!scene.textures.exists(platformKey)) this.groundTile(scene, platformKey, biome.platformColor, biome.groundAccent);
    if (!scene.textures.exists(brickKey)) this.brickTile(scene, brickKey, biome.groundAccent);
  }

  private static groundTile(scene: Phaser.Scene, key: string, base: number, accent: number): void {
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics();
    // Subtle vertical gradient instead of a flat fill reads as "lit from
    // above" and immediately looks less like a flat colored rectangle.
    const lighter = shade(base, 18);
    const darker = shade(base, -22);
    g.fillGradientStyle(lighter, lighter, darker, darker, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // top highlight edge (grass/snow cap depending on biome)
    g.fillStyle(accent, 1);
    g.fillRect(0, 0, TILE_SIZE, 5);
    g.fillStyle(shade(accent, 20), 0.7);
    g.fillRect(0, 0, TILE_SIZE, 2);
    // scattered speckle detail so it doesn't read as a flat swatch
    g.fillStyle(darker, 0.5);
    for (let i = 0; i < 5; i++) {
      const sx = (i * 137) % (TILE_SIZE - 6);
      const sy = 10 + ((i * 53) % (TILE_SIZE - 16));
      g.fillRect(sx, sy, 4, 3);
    }
    g.lineStyle(1, 0x000000, 0.12);
    g.strokeRect(0.5, 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    g.generateTexture(key, TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  private static brickTile(scene: Phaser.Scene, key: string, base: number): void {
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics();
    const lighter = shade(base, 10);
    const darker = shade(base, -18);
    g.fillGradientStyle(lighter, lighter, darker, darker, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // brick coursing lines for texture
    g.lineStyle(1, 0x000000, 0.18);
    g.strokeRect(0.5, 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    g.lineBetween(0, TILE_SIZE / 2, TILE_SIZE, TILE_SIZE / 2);
    g.lineBetween(TILE_SIZE / 2, 0, TILE_SIZE / 2, TILE_SIZE / 2);
    g.lineBetween(0, TILE_SIZE / 2 + TILE_SIZE / 4, TILE_SIZE, TILE_SIZE / 2 + TILE_SIZE / 4);
    g.generateTexture(key, TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  /**
   * Draws one animation frame of the hero. Rather than one static pose, four
   * frames are generated (idle / run-A / run-B / jump) with the legs, arms,
   * and torso lean shifted per pose -- Player.ts swaps between these via a
   * real Phaser animation, which is what turns "a picture that slides
   * around" into something that actually reads as running and jumping.
   */
  private static playerFrame(scene: Phaser.Scene, key: string, pose: "idle" | "runA" | "runB" | "jump"): void {
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics();
    const w = 30,
      h = 44;
    const cx = w / 2;

    // Per-pose offsets: how far each leg/arm swings, and a slight torso lean
    // in the direction of travel so the run cycle doesn't look like sliding.
    const legs =
      pose === "idle"
        ? { backX: -6, backY: 30, frontX: 1, frontY: 30, lean: 0 }
        : pose === "runA"
          ? { backX: -9, backY: 28, frontX: 3, frontY: 32, lean: 2 }
          : pose === "runB"
            ? { backX: 3, backY: 32, frontX: -9, frontY: 28, lean: -2 }
            : /* jump */ { backX: -7, backY: 26, frontX: 0, frontY: 24, lean: 0 };

    const legLen = pose === "jump" ? 8 : 12;

    // legs
    g.fillStyle(0x2e2a4a, 1);
    g.fillRoundedRect(cx + legs.backX, legs.backY, 6, legLen, 2);
    g.fillRoundedRect(cx + legs.frontX, legs.frontY, 6, legLen, 2);
    // shoes
    g.fillStyle(0x1a1730, 1);
    g.fillRoundedRect(cx + legs.backX - 1, legs.backY + legLen, 8, 4, 2);
    g.fillRoundedRect(cx + legs.frontX - 1, legs.frontY + legLen, 8, 4, 2);

    // torso — a small lean value tilts the whole upper body for run poses
    g.save();
    g.translateCanvas(cx + legs.lean, 0);
    g.fillStyle(0xf5c542, 1);
    g.fillRoundedRect(-9, 14, 18, 18, 5);
    g.fillStyle(shade(0xf5c542, -25), 0.55);
    g.fillRoundedRect(1, 14, 8, 18, 5);
    g.fillStyle(0xcf4b3c, 1);
    g.fillRect(-9, 24, 18, 4);

    // arms — swing opposite to the legs for run poses, both up for jump
    g.fillStyle(0xe0ac69, 1);
    if (pose === "jump") {
      g.fillRoundedRect(-15, 6, 5, 14, 2);
      g.fillRoundedRect(10, 6, 5, 14, 2);
    } else {
      const armSwing = pose === "runA" ? 3 : pose === "runB" ? -3 : 0;
      g.fillRoundedRect(-13, 16 - armSwing, 5, 12, 2);
      g.fillRoundedRect(8, 16 + armSwing, 5, 12, 2);
    }

    // neck + head
    g.fillStyle(0xe0ac69, 1);
    g.fillRect(-3, 9, 6, 6);
    g.fillCircle(0, 8, 9);
    g.fillStyle(shade(0xe0ac69, -15), 0.5);
    g.fillCircle(4, 9, 6);

    // simple friendly face
    g.fillStyle(0x2a1a10, 1);
    g.fillCircle(-3, 7, 1.3);
    g.fillCircle(3, 7, 1.3);
    g.lineStyle(1.4, 0x2a1a10, 0.8);
    g.beginPath();
    g.arc(0, 10, 3, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
    g.strokePath();

    // headscarf (ghutra-inspired silhouette)
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(-11, 4, 11, 4, 0, -4);
    g.fillRoundedRect(-11, 0, 22, 6, 2);
    g.fillStyle(shade(0xffffff, -12), 0.5);
    g.fillTriangle(1, 4, 11, 4, 0, -4);
    g.fillStyle(0x111111, 1);
    g.fillRect(-11, 4, 22, 3);
    g.restore();

    g.generateTexture(key, w, h);
    g.destroy();
  }


  private static enemySprite(scene: Phaser.Scene, key: string, color: number): void {
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics();
    const lighter = shade(color, 15);
    const darker = shade(color, -20);
    g.fillGradientStyle(lighter, lighter, darker, darker, 1);
    g.fillRoundedRect(2, 6, 24, 20, 6);
    // little pointed ears/horns for character silhouette
    g.fillStyle(darker, 1);
    g.fillTriangle(4, 8, 8, 8, 5, 2);
    g.fillTriangle(20, 8, 24, 8, 23, 2);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(10, 14, 3);
    g.fillCircle(18, 14, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(10, 14, 1.4);
    g.fillCircle(18, 14, 1.4);
    g.generateTexture(key, 28, 28);
    g.destroy();
  }

  private static coin(scene: Phaser.Scene): void {
    if (scene.textures.exists("coin")) return;
    const g = scene.add.graphics();
    g.fillStyle(0xf5c542, 1);
    g.fillCircle(10, 10, 9);
    g.fillStyle(0xd4af37, 1);
    g.fillCircle(10, 10, 6);
    g.fillStyle(0xfff2b0, 1);
    g.fillCircle(7, 7, 2);
    g.generateTexture("coin", 20, 20);
    g.destroy();
  }

  private static gem(scene: Phaser.Scene): void {
    if (scene.textures.exists("gem")) return;
    const g = scene.add.graphics();
    g.fillStyle(0x3fd1ff, 1);
    g.fillTriangle(9, 0, 0, 8, 18, 8);
    g.fillStyle(0x1fa8e0, 1);
    g.fillTriangle(0, 8, 18, 8, 9, 18);
    g.generateTexture("gem", 18, 18);
    g.destroy();
  }

  private static hazardSpike(scene: Phaser.Scene): void {
    if (scene.textures.exists("hazard")) return;
    const g = scene.add.graphics();
    g.fillStyle(0xcf4b3c, 1);
    for (let i = 0; i < 4; i++) {
      g.fillTriangle(i * 10, TILE_SIZE, i * 10 + 5, TILE_SIZE - 22, i * 10 + 10, TILE_SIZE);
    }
    g.generateTexture("hazard", TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  private static movingPlatform(scene: Phaser.Scene): void {
    if (scene.textures.exists("moving_platform")) return;
    const g = scene.add.graphics();
    g.fillStyle(0x8a5a34, 1);
    g.fillRoundedRect(0, 0, TILE_SIZE * 2, 14, 4);
    g.fillStyle(0xd4af37, 1);
    g.fillRect(0, 0, TILE_SIZE * 2, 3);
    g.generateTexture("moving_platform", TILE_SIZE * 2, 14);
    g.destroy();
  }

  private static goalFlag(scene: Phaser.Scene): void {
    if (scene.textures.exists("goal_flag")) return;
    const g = scene.add.graphics();
    g.fillStyle(0x5a4a2a, 1);
    g.fillRect(6, 0, 4, 60);
    g.fillStyle(0x2e7d32, 1);
    g.fillTriangle(10, 4, 10, 24, 42, 14);
    g.generateTexture("goal_flag", 44, 60);
    g.destroy();
  }

  private static particleStar(scene: Phaser.Scene): void {
    if (scene.textures.exists("particle_star")) return;
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture("particle_star", 8, 8);
    g.destroy();
  }

  private static uiButton(scene: Phaser.Scene): void {
    if (scene.textures.exists("ui_button")) return;
    const g = scene.add.graphics();
    // drop shadow (offset dark rounded rect behind the button body)
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(3, 5, 260, 60, 16);
    // gradient body (lighter top -> deeper purple bottom = subtle 3D bevel)
    g.fillGradientStyle(0x4a3878, 0x4a3878, 0x2a1e48, 0x2a1e48, 1);
    g.fillRoundedRect(0, 0, 260, 60, 16);
    // top highlight sheen
    g.fillStyle(0xffffff, 0.08);
    g.fillRoundedRect(4, 4, 252, 20, 12);
    g.lineStyle(2, 0xf5c542, 1);
    g.strokeRoundedRect(1, 1, 258, 58, 16);
    g.generateTexture("ui_button", 264, 66);
    g.destroy();
  }
}
