import Phaser from "phaser";
import { TextureFactory } from "@/services/TextureFactory";
import { SaveService } from "@/services/SaveService";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    TextureFactory.generateAll(this);

    // Registered once here (Phaser's AnimationManager is global to the whole
    // Game instance, not per-scene) so it's ready for both gameplay AND the
    // main menu's animated character preview, even before any level has
    // ever been played. Player.ts also guards/re-checks this defensively.
    if (!this.anims.exists("player-run")) {
      this.anims.create({
        key: "player-run",
        frames: [{ key: "player_run_a" }, { key: "player_idle" }, { key: "player_run_b" }, { key: "player_idle" }],
        frameRate: 9,
        repeat: -1
      });
    }

    SaveService.refreshDailyQuestsIfNeeded();
    const fallback = document.getElementById("boot-fallback");
    if (fallback) fallback.remove();
    this.scene.start("MainMenu");
  }
}
