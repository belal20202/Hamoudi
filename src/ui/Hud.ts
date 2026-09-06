import Phaser from "phaser";
import { SaveService } from "@/services/SaveService";
import { UiStyle } from "@/ui/UiStyle";
import { DESIGN_WIDTH } from "@/config";

export class Hud {
  private goldText: Phaser.GameObjects.Text;
  private gemsText: Phaser.GameObjects.Text;
  private livesText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const bar = scene.add.rectangle(DESIGN_WIDTH / 2, 22, DESIGN_WIDTH, 44, 0x0f0620, 0.6).setScrollFactor(0).setDepth(999);
    bar.setStrokeStyle(1, 0xf5c542, 0.4);

    this.goldText = scene.add
      .text(DESIGN_WIDTH - 16, 22, "", UiStyle.currency())
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(1000);
    this.gemsText = scene.add
      .text(DESIGN_WIDTH / 2, 22, "", UiStyle.currency())
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);
    this.livesText = scene.add
      .text(16, 22, "", UiStyle.currency())
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    this.refresh();
  }

  refresh(): void {
    const s = SaveService.get();
    this.goldText.setText(`🪙 ${s.gold}`);
    this.gemsText.setText(`💎 ${s.gems}`);
    this.livesText.setText(`❤️ ${s.lives}`);
  }
}
