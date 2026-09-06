import Phaser from "phaser";
import { DESIGN_WIDTH, DESIGN_HEIGHT } from "@/config";
import { AudioService } from "@/services/AudioService";
import { UiStyle, makeMenuButton } from "@/ui/UiStyle";

/**
 * A lightweight overlay scene launched ON TOP of a paused GameScene (via
 * `this.scene.pause()` + `this.scene.launch("Pause", ...)`). GameScene's
 * update loop, physics world, and tweens are all frozen automatically by
 * Phaser while this scene is active, so no manual "isPaused" guards are
 * needed anywhere else in the game code.
 */
export class PauseScene extends Phaser.Scene {
  private levelId = 1;

  constructor() {
    super("Pause");
  }

  init(data: { levelId: number }): void {
    this.levelId = data.levelId;
  }

  create(): void {
    // Dim the frozen gameplay behind this overlay.
    this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x000000, 0.7).setDepth(0);

    this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 90, "⏸ إيقاف مؤقت", UiStyle.title())
      .setOrigin(0.5)
      .setDepth(1);
    this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 50, `المرحلة ${this.levelId}`, UiStyle.small())
      .setOrigin(0.5)
      .setDepth(1);

    makeMenuButton(this, DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, "استئناف ▶", () => {
      AudioService.click();
      this.resumeGame();
    }).setDepth(1);

    makeMenuButton(this, DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 70, "خريطة المراحل 🗺️", () => {
      AudioService.click();
      this.scene.stop("Game");
      this.scene.stop();
      this.scene.start("LevelSelect");
    }).setDepth(1);

    makeMenuButton(this, DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 140, "القائمة الرئيسية 🏠", () => {
      AudioService.click();
      this.scene.stop("Game");
      this.scene.stop();
      this.scene.start("MainMenu");
    }).setDepth(1);

    // Also let the hardware/ESC-style back action resume, matching what a
    // player expects from tapping outside a modal.
    this.input.keyboard?.once("keydown-ESC", () => this.resumeGame());
  }

  private resumeGame(): void {
    this.scene.resume("Game");
    this.scene.stop();
  }
}
