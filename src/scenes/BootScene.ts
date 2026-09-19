import Phaser from "phaser";
import { TextureFactory } from "@/services/TextureFactory";
import { SaveService } from "@/services/SaveService";
import { AdService } from "@/services/AdService";
import { Player } from "@/objects/Player";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    TextureFactory.generateAll(this);

    // Fire-and-forget: ad init is fully wrapped in try/catch internally and
    // must never block or delay the game from starting.
    void AdService.initialize();

    // Pre-registers the "default" run animation (cheap: its textures already
    // exist from generateAll() above) so the main menu's hero preview has it
    // ready immediately. Any OTHER equipped outfit's animation/textures are
    // generated lazily the first time Player.ensureOutfitAnimation() is
    // called for it (Player itself, or a preview sprite in MainMenuScene /
    // ShopScene) -- see that method for why generating all 100 outfits'
    // frames upfront here would be wasteful.
    Player.ensureOutfitAnimation(this, "default");

    SaveService.refreshDailyQuestsIfNeeded();
    document.getElementById("boot-fallback")?.remove();
    document.getElementById("boot-iraq")?.remove();
    this.scene.start("MainMenu");
  }
}
