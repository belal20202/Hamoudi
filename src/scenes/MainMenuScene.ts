import Phaser from "phaser";
import { DESIGN_WIDTH, DESIGN_HEIGHT, GAME_TITLE, GAME_SUBTITLE, TOTAL_LEVELS, WORLDS_COUNT, THEME } from "@/config";
import { Hud } from "@/ui/Hud";
import { UiStyle, makeMenuButton } from "@/ui/UiStyle";
import { AudioService } from "@/services/AudioService";
import { AdService } from "@/services/AdService";
import { SaveService } from "@/services/SaveService";
import { Player } from "@/objects/Player";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  create(): void {
    void AdService.notifyPageView();

    const g = this.add.graphics();
    g.fillGradientStyle(THEME.skyTop, THEME.skyTop, THEME.skyBottom, THEME.skyBottom, 1);
    g.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    const glow = this.add.graphics().setDepth(-5);
    glow.fillStyle(0xfff0c2, 0.35);
    glow.fillCircle(DESIGN_WIDTH / 2, 100, 160);

    const stars = this.add.particles(0, 0, "particle_star", {
      x: { min: 0, max: DESIGN_WIDTH },
      y: { min: -10, max: DESIGN_HEIGHT - 120 },
      lifespan: 4000,
      speedY: { min: 4, max: 12 },
      scale: { min: 0.12, max: 0.4 },
      alpha: { start: 0, end: 0.5 },
      quantity: 1,
      frequency: 260,
      tint: [0xffffff, 0xf5c542]
    });
    stars.setDepth(-4);

    new Hud(this);

    const centerX = DESIGN_WIDTH / 2;

    // Shows whatever outfit the player currently has equipped (not always
    // the default) via the same shared helper Player.ts itself uses.
    const equippedOutfitId = SaveService.get().equippedOutfit;
    const { idleKey, runAnimKey } = Player.ensureOutfitAnimation(this, equippedOutfitId);
    const hero = this.add.sprite(centerX - 78, 96, idleKey).setScale(1.2).setDepth(5);
    hero.play(runAnimKey);
    this.tweens.add({
      targets: hero,
      y: hero.y - 4,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    const title = this.add
      .text(centerX + 18, 86, GAME_TITLE, { ...UiStyle.title(), fontSize: "46px" })
      .setOrigin(0.5)
      .setShadow(2, 2, "#000000", 4, true, true);
    this.tweens.add({
      targets: title,
      scale: 1.03,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.add.text(centerX, 128, GAME_SUBTITLE, { ...UiStyle.small(), color: "#5a2f0f" }).setOrigin(0.5);
    this.add
      .text(centerX, 146, `عبر ${WORLDS_COUNT} عوالم و${TOTAL_LEVELS} مرحلة`, { ...UiStyle.small(), fontSize: "12px", color: "#6a3a15" })
      .setOrigin(0.5);

    const items: { label: string; action: () => void }[] = [
      { label: "▶ ابدأ اللعبة", action: () => this.scene.start("LevelSelect") },
      { label: "المتجر 🛍️", action: () => this.scene.start("Shop") },
      { label: "عن اللعبة ℹ️", action: () => this.scene.start("About") }
    ];

    items.forEach((item, i) => {
      const btn = makeMenuButton(this, centerX, 200 + i * 68, item.label, () => {
        AudioService.click();
        item.action();
      });
      const targetY = btn.y;
      btn.setY(targetY + 24);
      btn.setAlpha(0);
      this.tweens.add({
        targets: btn,
        y: targetY,
        alpha: 1,
        duration: 320,
        delay: 120 + i * 100,
        ease: "Back.easeOut"
      });
    });

    this.buildMadeInIraqBadge();

    AudioService.startMusicLoop();
  }

  /**
   * Plain "صنع بالعراق" on a gold badge -- no flag-colored bands (the
   * previous version), no developer credit line, both removed by request.
   */
  private buildMadeInIraqBadge(): void {
    const y = DESIGN_HEIGHT - 34;
    const w = 190;
    const h = 34;
    const cx = DESIGN_WIDTH / 2;

    const badge = this.add.graphics().setDepth(6);
    badge.fillStyle(0x000000, 0.3);
    badge.fillRoundedRect(cx - w / 2 + 2, y - h / 2 + 3, w, h, 10);
    badge.fillGradientStyle(0xffd76b, 0xffd76b, 0xd4a017, 0xd4a017, 1);
    badge.fillRoundedRect(cx - w / 2, y - h / 2, w, h, 10);
    badge.lineStyle(2, 0x8a5424, 0.6);
    badge.strokeRoundedRect(cx - w / 2, y - h / 2, w, h, 10);

    this.add
      .text(cx, y, "صنع بالعراق", {
        fontFamily: "Tahoma",
        fontSize: "16px",
        color: "#3a1f0a",
        fontStyle: "bold"
      })
      .setOrigin(0.5)
      .setDepth(7);
  }
}
