import Phaser from "phaser";
import { DESIGN_WIDTH, DESIGN_HEIGHT, GAME_TITLE, GAME_SUBTITLE, TOTAL_LEVELS, WORLDS_COUNT } from "@/config";
import { Hud } from "@/ui/Hud";
import { UiStyle, makeMenuButton } from "@/ui/UiStyle";
import { AudioService } from "@/services/AudioService";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  create(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x2a1a4a, 0x2a1a4a, 0x6a2a6a, 0x6a2a6a, 1);
    g.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    // decorative dome silhouettes
    for (let i = 0; i < 5; i++) {
      const x = 60 + i * 170;
      g.fillStyle(0x1a0f30, 0.6);
      g.fillCircle(x, DESIGN_HEIGHT - 70, 40);
      g.fillRect(x - 40, DESIGN_HEIGHT - 70, 80, 70);
    }

    // Slowly drifting, twinkling star field.
    const stars = this.add.particles(0, 0, "particle_star", {
      x: { min: 0, max: DESIGN_WIDTH },
      y: { min: -10, max: DESIGN_HEIGHT - 120 },
      lifespan: 4000,
      speedY: { min: 4, max: 12 },
      scale: { min: 0.15, max: 0.5 },
      alpha: { start: 0, end: 0.85 },
      quantity: 1,
      frequency: 220,
      tint: [0xffffff, 0xf5c542, 0xcbb7ff]
    });
    stars.setDepth(-50);

    new Hud(this);

    const title = this.add
      .text(DESIGN_WIDTH / 2, 82, GAME_TITLE, { ...UiStyle.title(), fontSize: "44px" })
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

    this.add.text(DESIGN_WIDTH / 2, 116, GAME_SUBTITLE, UiStyle.small()).setOrigin(0.5);
    this.add
      .text(DESIGN_WIDTH / 2, 134, `عبر ${WORLDS_COUNT} عوالم و${TOTAL_LEVELS} مرحلة`, { ...UiStyle.small(), fontSize: "12px" })
      .setOrigin(0.5);

    // Animated hero preview next to the title.
    const hero = this.add.sprite(DESIGN_WIDTH / 2 - 130, 100, "player_idle").setScale(1.15).setDepth(5);
    if (this.anims.exists("player-run")) hero.play("player-run");
    this.tweens.add({
      targets: hero,
      y: hero.y - 4,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    // Only two entries, per the simplified menu: start playing, and about.
    const playBtn = makeMenuButton(this, DESIGN_WIDTH / 2, 210, "▶ ابدأ اللعبة", () => {
      AudioService.click();
      this.scene.start("LevelSelect");
    });
    const aboutBtn = makeMenuButton(this, DESIGN_WIDTH / 2, 285, "عن اللعبة ℹ️", () => {
      AudioService.click();
      this.scene.start("About");
    });

    [playBtn, aboutBtn].forEach((btn, i) => {
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
   * A real designed badge instead of small footer text -- Iraqi flag colors
   * drawn directly (not relying on the 🇮🇶 emoji, which several Android
   * WebView/font combinations render as plain "IQ" letters instead of an
   * actual flag), placed prominently under the menu buttons.
   */
  private buildMadeInIraqBadge(): void {
    const y = DESIGN_HEIGHT - 46;
    const w = 190;
    const h = 34;
    const cx = DESIGN_WIDTH / 2;

    const badge = this.add.graphics().setDepth(6);
    // soft shadow
    badge.fillStyle(0x000000, 0.35);
    badge.fillRoundedRect(cx - w / 2 + 2, y - h / 2 + 3, w, h, 10);
    // Iraqi flag tri-band (red / white / black) as the badge background
    const bandH = h / 3;
    badge.fillStyle(0xce1126, 1);
    badge.fillRect(cx - w / 2, y - h / 2, w, bandH);
    badge.fillStyle(0xffffff, 1);
    badge.fillRect(cx - w / 2, y - h / 2 + bandH, w, bandH);
    badge.fillStyle(0x000000, 1);
    badge.fillRect(cx - w / 2, y - h / 2 + bandH * 2, w, bandH);
    badge.lineStyle(2, 0xf5c542, 1);
    badge.strokeRoundedRect(cx - w / 2, y - h / 2, w, h, 10);

    // Mask the flag bands to rounded corners by drawing a rounded border on
    // top in the background color at the very corners is overkill here --
    // the gold stroke on top reads cleanly enough at this size in practice.

    this.add
      .text(cx, y, "🇮🇶 صنع في العراق", {
        fontFamily: "Tahoma",
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold"
      })
      .setOrigin(0.5)
      .setDepth(7)
      .setShadow(1, 1, "#000000", 3, true, true);

    // A tiny persistent shimmer draws the eye without being distracting.
    this.tweens.add({
      targets: badge,
      alpha: 0.85,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    // Footer credits stay small underneath.
    this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 12, "المطور: بلال النعيمي", { ...UiStyle.small(), fontSize: "10px" })
      .setOrigin(0.5);
  }
}
