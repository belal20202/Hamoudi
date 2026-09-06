import Phaser from "phaser";
import type { CollectibleSpawn } from "@/types";

export class Collectible extends Phaser.Physics.Arcade.Sprite {
  readonly kind: CollectibleSpawn["kind"];

  constructor(scene: Phaser.Scene, spawn: CollectibleSpawn) {
    super(scene, spawn.x, spawn.y, spawn.kind);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.kind = spawn.kind;
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.setDepth(8);

    scene.tweens.add({
      targets: this,
      y: spawn.y - 8,
      duration: 700 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 2200,
      repeat: -1
    });
  }

  collect(): void {
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      duration: 180,
      onComplete: () => this.destroy()
    });
  }
}
