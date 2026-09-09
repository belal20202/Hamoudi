import Phaser from "phaser";
import { DESIGN_WIDTH, DESIGN_HEIGHT, LEVELS_PER_WORLD, WORLDS_COUNT, TOTAL_LEVELS } from "@/config";
import { BIOMES } from "@/services/GameData";
import { SaveService } from "@/services/SaveService";
import { UiStyle } from "@/ui/UiStyle";
import { AudioService } from "@/services/AudioService";
import { Hud } from "@/ui/Hud";
import { AdService } from "@/services/AdService";

export class LevelSelectScene extends Phaser.Scene {
  private worldIndex = 0;
  private levelsContainer!: Phaser.GameObjects.Container;
  private bgGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super("LevelSelect");
  }

  create(): void {
    void AdService.notifyPageView();
    this.worldIndex = 0;
    this.bgGraphics = this.add.graphics().setDepth(-10);

    new Hud(this);

    this.add
      .text(DESIGN_WIDTH / 2, 60, "اختر المرحلة", UiStyle.heading())
      .setOrigin(0.5)
      .setDepth(10)
      .setShadow(1, 1, "#000000", 3, true, true);

    const backBtn = this.add
      .text(20, 55, "◀ رجوع", UiStyle.body())
      .setOrigin(0, 0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    backBtn.on("pointerup", () => {
      AudioService.click();
      this.scene.start("MainMenu");
    });

    const prevBtn = this.add
      .text(DESIGN_WIDTH - 90, 60, "▶", UiStyle.heading())
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    const nextBtn = this.add
      .text(DESIGN_WIDTH - 30, 60, "◀", UiStyle.heading())
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    prevBtn.on("pointerup", () => this.changeWorld(-1));
    nextBtn.on("pointerup", () => this.changeWorld(1));

    this.levelsContainer = this.add.container(0, 0).setDepth(5);
    this.renderWorld();
  }

  private changeWorld(delta: number): void {
    AudioService.click();
    this.worldIndex = Phaser.Math.Wrap(this.worldIndex + delta, 0, WORLDS_COUNT);
    this.renderWorld();
  }

  private paintBackground(biome: (typeof BIOMES)[number]): void {
    this.bgGraphics.clear();
    this.bgGraphics.fillGradientStyle(biome.skyTop, biome.skyTop, 0x150a2a, 0x150a2a, 1);
    this.bgGraphics.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    // faint themed dome silhouettes so each world tab feels distinct
    this.bgGraphics.fillStyle(0x000000, 0.18);
    for (let i = 0; i < 6; i++) {
      const x = (i + 0.5) * (DESIGN_WIDTH / 6);
      this.bgGraphics.fillCircle(x, DESIGN_HEIGHT - 30, 30);
      this.bgGraphics.fillRect(x - 30, DESIGN_HEIGHT - 30, 60, 40);
    }
  }

  private renderWorld(): void {
    this.levelsContainer.removeAll(true);
    const biome = BIOMES[this.worldIndex];
    this.paintBackground(biome);

    // World title card
    const titleCard = this.add.graphics();
    titleCard.fillStyle(0x000000, 0.3);
    titleCard.fillRoundedRect(DESIGN_WIDTH / 2 - 150, 80, 300, 34, 14);
    titleCard.fillGradientStyle(biome.platformColor, biome.platformColor, biome.groundAccent, biome.groundAccent, 0.9);
    titleCard.fillRoundedRect(DESIGN_WIDTH / 2 - 150, 78, 300, 34, 14);
    this.levelsContainer.add(titleCard);
    this.levelsContainer.add(
      this.add
        .text(DESIGN_WIDTH / 2, 95, `عالم ${this.worldIndex + 1}: ${biome.nameAr}`, { ...UiStyle.body(), fontSize: "16px", color: "#150a2a" })
        .setOrigin(0.5)
    );

    const cols = 5;
    const cellW = 70;
    const cellH = 70;
    const startX = DESIGN_WIDTH / 2 - ((cols - 1) * cellW) / 2;
    const startY = 150;

    for (let i = 0; i < LEVELS_PER_WORLD; i++) {
      const levelId = this.worldIndex * LEVELS_PER_WORLD + i + 1;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH;
      const isBoss = levelId === TOTAL_LEVELS;

      const unlocked = SaveService.isLevelUnlocked(levelId);
      const result = SaveService.get().levelResults[levelId];
      const stars = result?.bestStars ?? 0;

      const cardContainer = this.add.container(x, y);

      // drop shadow for a "raised card" feel
      const shadow = this.add.rectangle(2, 4, 54, 54, 0x000000, 0.3).setOrigin(0.5);

      const box = this.add.graphics();
      if (unlocked) {
        const topColor = isBoss ? 0xffe27a : biome.platformColor;
        const bottomColor = isBoss ? 0xd4af37 : biome.groundAccent;
        box.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
      } else {
        box.fillStyle(0x2a2438, 1);
      }
      box.fillRoundedRect(-27, -27, 54, 54, 12);
      box.lineStyle(isBoss ? 3 : 2, unlocked ? 0xf5c542 : 0x4a4258, 1);
      box.strokeRoundedRect(-27, -27, 54, 54, 12);

      const label = isBoss ? "👑" : unlocked ? String(levelId) : "🔒";
      const numText = this.add
        .text(0, -6, label, {
          fontFamily: "Tahoma",
          fontSize: unlocked ? "18px" : "16px",
          color: "#150a2a",
          fontStyle: "bold"
        })
        .setOrigin(0.5);

      const starText = this.add
        .text(0, 16, unlocked ? "★".repeat(stars) + "☆".repeat(3 - stars) : "", {
          fontFamily: "Tahoma",
          fontSize: "11px",
          color: "#8a6f1a"
        })
        .setOrigin(0.5);

      cardContainer.add([shadow, box, numText, starText]);
      cardContainer.setScale(0);
      this.levelsContainer.add(cardContainer);

      // staggered pop-in per level tile
      this.tweens.add({
        targets: cardContainer,
        scale: 1,
        duration: 220,
        delay: i * 35,
        ease: "Back.easeOut"
      });

      if (unlocked) {
        box.setInteractive(new Phaser.Geom.Rectangle(-27, -27, 54, 54), Phaser.Geom.Rectangle.Contains);
        box.on("pointerover", () => cardContainer.setScale(1.08));
        box.on("pointerout", () => cardContainer.setScale(1));
        box.on("pointerup", () => {
          AudioService.click();
          this.scene.start("Game", { levelId });
        });
      }
    }

    const completed = Array.from({ length: LEVELS_PER_WORLD }, (_, i) => this.worldIndex * LEVELS_PER_WORLD + i + 1).filter(
      (id) => (SaveService.get().levelResults[id]?.bestStars ?? 0) > 0
    ).length;

    // Progress bar instead of plain text
    const barY = DESIGN_HEIGHT - 30;
    const barW = 220;
    const barBg = this.add.rectangle(DESIGN_WIDTH / 2, barY, barW, 12, 0x150a2a, 0.6).setStrokeStyle(1, 0x4a4258);
    const ratio = completed / LEVELS_PER_WORLD;
    const barFg = this.add
      .rectangle(DESIGN_WIDTH / 2 - barW / 2, barY, Math.max(4, barW * ratio), 12, 0xf5c542)
      .setOrigin(0, 0.5);
    this.levelsContainer.add([barBg, barFg]);
    this.levelsContainer.add(
      this.add.text(DESIGN_WIDTH / 2, barY - 16, `مكتمل: ${completed} / ${LEVELS_PER_WORLD}`, UiStyle.small()).setOrigin(0.5)
    );
  }
}
