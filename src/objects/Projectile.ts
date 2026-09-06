import Phaser from "phaser";

const LIFESPAN_MS = 2500;
const SPEED = 180;

/**
 * A simple enemy-spat projectile: travels in a straight line, dies on its
 * own after a lifespan (so a missed shot never lingers forever), and is
 * removed immediately once it hits the player or the ground. Gravity is
 * intentionally light rather than zero -- a dead-straight horizontal shot
 * reads as more of a "thrown rock" than a laser, which fits the theme.
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  private readonly spawnedAt: number;

  constructor(scene: Phaser.Scene, x: number, y: number, dir: 1 | -1) {
    super(scene, x, y, "enemy_projectile");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(9);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setGravityY(-1100); // partially cancels world gravity for a gentle arc instead of a hard drop
    body.setVelocityX(SPEED * dir);
    body.setSize(10, 10);

    this.spawnedAt = scene.time.now;
  }

  /** Returns true once this projectile has outlived its lifespan and should be cleaned up. */
  isExpired(now: number): boolean {
    return now - this.spawnedAt > LIFESPAN_MS;
  }
}
