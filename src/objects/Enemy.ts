import Phaser from "phaser";
import type { EnemySpawn } from "@/types";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly kind: EnemySpawn["type"];
  private patrolOriginX: number;
  private range: number;
  private dir: 1 | -1 = 1;
  private speed: number;

  constructor(scene: Phaser.Scene, spawn: EnemySpawn) {
    const key = `enemy_${spawn.type}`;
    super(scene, spawn.x, spawn.y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.kind = spawn.type;
    this.patrolOriginX = spawn.x;
    this.range = spawn.patrolRange;
    this.speed = spawn.type === "flyer" ? 70 : 55;
    this.setDepth(9);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (spawn.type === "flyer") {
      body.setAllowGravity(false);
    } else {
      body.setAllowGravity(true);
      body.setBounce(0);
    }
    body.setSize(24, 24);
  }

  update(): void {
    if (!this.active) return;
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.kind === "flyer") {
      const t = this.scene.time.now / 500;
      this.y += Math.sin(t + this.x) * 0.4;
    }

    if (this.x > this.patrolOriginX + this.range) this.dir = -1;
    if (this.x < this.patrolOriginX - this.range) this.dir = 1;
    body.setVelocityX(this.speed * this.dir);
    this.setFlipX(this.dir < 0);

    if (this.kind === "walker") {
      // turn around at ledges: handled externally via overlap checks against ground sensors
    }
  }

  defeat(): void {
    this.setActive(false);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }
}
