import Phaser from "phaser";

export class MovingPlatform extends Phaser.Physics.Arcade.Sprite {
  private startY: number;
  private range = 60;
  private dir: 1 | -1 = 1;
  private speed = 40;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "moving_platform");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.startY = y;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    this.setDepth(7);
  }

  update(deltaSeconds: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const newY = this.y + this.dir * this.speed * deltaSeconds;
    if (newY > this.startY + this.range) this.dir = -1;
    if (newY < this.startY - this.range) this.dir = 1;
    body.setVelocityY(this.dir * this.speed);
  }
}
