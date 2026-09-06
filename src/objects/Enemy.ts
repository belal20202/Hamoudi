import Phaser from "phaser";
import type { EnemySpawn } from "@/types";

const SPIT_INTERVAL_MS = 2200;
const SPIT_WARMUP_MS = 900; // grace period after spawn before the first shot

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly kind: EnemySpawn["type"];
  private patrolOriginX: number;
  private range: number;
  private dir: 1 | -1 = 1;
  private speed: number;
  private nextSpitAt: number;

  constructor(scene: Phaser.Scene, spawn: EnemySpawn) {
    const key = `enemy_${spawn.type}`;
    super(scene, spawn.x, spawn.y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.kind = spawn.type;
    this.patrolOriginX = spawn.x;
    this.range = spawn.patrolRange;
    this.speed = spawn.type === "flyer" ? 70 : 55;
    this.nextSpitAt = scene.time.now + SPIT_WARMUP_MS;
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

  get facingDir(): 1 | -1 {
    return this.dir;
  }

  /**
   * @param hasGroundAhead Optional ledge probe (walkers only): given a world
   * point just ahead of the enemy's feet, returns whether solid ground is
   * there. Passed in from GameScene, which owns the tile/ground group --
   * keeps Enemy from needing to know about level geometry directly.
   */
  update(hasGroundAhead?: (x: number, y: number) => boolean): void {
    if (!this.active) return;
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.kind === "flyer") {
      const t = this.scene.time.now / 500;
      this.y += Math.sin(t + this.x) * 0.4;
    } else if (hasGroundAhead) {
      // Ledge detection: probe a point just ahead of and below the feet in
      // the current direction of travel. No ground there -> turn around
      // before stepping off into empty space, instead of walking off cliffs.
      const probeX = this.x + this.dir * 20;
      const probeY = this.y + 22;
      if (!hasGroundAhead(probeX, probeY)) {
        this.dir = this.dir === 1 ? -1 : 1;
      }
    }

    if (this.x > this.patrolOriginX + this.range) this.dir = -1;
    if (this.x < this.patrolOriginX - this.range) this.dir = 1;
    body.setVelocityX(this.speed * this.dir);
    this.setFlipX(this.dir < 0);
  }

  /**
   * Spitters fire on a cooldown rather than being purely cosmetic re-skins
   * of walkers. Returns true (and resets the cooldown) exactly once per
   * interval when it's time for GameScene to spawn a projectile -- Enemy
   * itself doesn't own the projectile group/physics, keeping this a plain
   * yes/no check rather than Enemy reaching into scene internals.
   */
  wantsToSpit(now: number): boolean {
    if (this.kind !== "spitter" || !this.active) return false;
    if (now < this.nextSpitAt) return false;
    this.nextSpitAt = now + SPIT_INTERVAL_MS;
    return true;
  }

  defeat(): void {
    this.setActive(false);
    this.setVisible(false);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }
}
