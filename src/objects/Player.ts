import Phaser from "phaser";
import { PHYSICS } from "@/config";
import { SaveService } from "@/services/SaveService";
import { AudioService } from "@/services/AudioService";
import { OUTFITS } from "@/services/GameData";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private hasDoubleJump = false;
  private usedDoubleJump = false;
  private isTouchingWall = 0; // -1 left, 1 right, 0 none
  private shieldCharges = 0;
  private dashCooldownUntil = 0;
  private invulnerableUntil = 0;

  // --- Movement feel state -------------------------------------------------
  // Instead of snapping straight to top speed, we track a "desired" direction
  // each frame and accelerate/decelerate the actual velocity toward it by a
  // fixed px/s^2 rate. That alone is most of what separates "floaty/stiff"
  // platformer controls from smooth ones.
  private targetDirection: -1 | 0 | 1 = 0;

  // Coyote time: a short grace window after walking off a ledge where a jump
  // still works, matching what the player's eye expects even though they're
  // technically already airborne.
  private lastGroundedAt = -Infinity;

  // Jump buffering: a jump press slightly before actually landing still
  // fires the instant you land, instead of being silently dropped.
  private jumpBufferedUntil = -Infinity;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player_idle");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // No bounce: even a small bounce value (e.g. 0.05) causes a visible
    // micro-jitter every time gravity re-collides the body with the ground
    // each frame while idle — this is what was reading as "unstable".
    this.setBounce(0);
    this.setCollideWorldBounds(false);
    (this.body as Phaser.Physics.Arcade.Body).setSize(22, 40).setOffset(4, 4);
    this.setDepth(10);

    this.registerAnimations(scene);
    this.applyOutfit();
    this.applyPowerups();
  }

  private registerAnimations(scene: Phaser.Scene): void {
    // Registered once per game (Phaser's AnimationManager is global, not
    // per-scene-instance), guarded so re-entering GameScene for a new level
    // doesn't try to redefine the same keys.
    if (!scene.anims.exists("player-run")) {
      scene.anims.create({
        key: "player-run",
        frames: [{ key: "player_run_a" }, { key: "player_idle" }, { key: "player_run_b" }, { key: "player_idle" }],
        frameRate: 9,
        repeat: -1
      });
    }
  }

  /** Call once per frame to keep the visible pose in sync with movement state. */
  updateAnimation(): void {
    if (!this.onGround) {
      if (this.anims.isPlaying) this.stop();
      this.setTexture("player_jump");
      return;
    }
    if (this.targetDirection !== 0) {
      if (this.anims.currentAnim?.key !== "player-run" || !this.anims.isPlaying) {
        this.play("player-run");
      }
    } else {
      if (this.anims.isPlaying) this.stop();
      this.setTexture("player_idle");
    }
  }

  applyOutfit(): void {
    const equipped = SaveService.get().equippedOutfit;
    const outfit = OUTFITS.find((o) => o.id === equipped) ?? OUTFITS[0];
    this.setTint(outfit.tint);
  }

  applyPowerups(): void {
    this.hasDoubleJump = SaveService.powerupLevel("double_jump") > 0;
    this.shieldCharges = SaveService.powerupLevel("shield");
  }

  get speed(): number {
    const boostLevel = SaveService.powerupLevel("speed_boost");
    return PHYSICS.playerRunSpeed + boostLevel * 25;
  }

  /** Call once per frame from the scene, regardless of input, to drive smooth acceleration. */
  applyMovement(deltaMs: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dt = deltaMs / 1000;
    const targetVelocity = this.targetDirection * this.speed;
    const rate =
      this.targetDirection !== 0
        ? this.onGround
          ? PHYSICS.groundAcceleration
          : PHYSICS.airAcceleration
        : PHYSICS.groundFriction;

    // Move velocity.x toward targetVelocity by at most `rate * dt` this frame
    // (a linear ramp, not an easing curve that never quite reaches top speed).
    const maxStep = rate * dt;
    const diff = targetVelocity - body.velocity.x;
    if (Math.abs(diff) <= maxStep) {
      body.velocity.x = targetVelocity;
    } else {
      body.velocity.x += Math.sign(diff) * maxStep;
    }

    if (this.targetDirection < 0) this.setFlipX(true);
    else if (this.targetDirection > 0) this.setFlipX(false);
  }

  moveLeft(): void {
    this.targetDirection = -1;
  }

  moveRight(): void {
    this.targetDirection = 1;
  }

  stopHorizontal(): void {
    this.targetDirection = 0;
  }

  get onGround(): boolean {
    return (this.body as Phaser.Physics.Arcade.Body).blocked.down || (this.body as Phaser.Physics.Arcade.Body).touching.down;
  }

  setWallTouch(dir: -1 | 0 | 1): void {
    this.isTouchingWall = dir;
  }

  /** Buffers a jump request; call on the input's rising edge (button press). */
  requestJump(): void {
    this.jumpBufferedUntil = this.scene.time.now + PHYSICS.jumpBufferMs;
  }

  /** Call once per frame with the current time to resolve grounded/coyote/buffered jump state. */
  updateJumpState(now: number): void {
    if (this.onGround) {
      this.lastGroundedAt = now;
      this.usedDoubleJump = false;
    }

    const hasBufferedJump = now <= this.jumpBufferedUntil;
    if (!hasBufferedJump) return;

    const withinCoyoteWindow = now - this.lastGroundedAt <= PHYSICS.coyoteTimeMs;
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.onGround || withinCoyoteWindow) {
      body.setVelocityY(PHYSICS.jumpVelocity);
      this.jumpBufferedUntil = -Infinity;
      AudioService.jump();
    } else if (this.isTouchingWall !== 0) {
      body.setVelocityY(PHYSICS.jumpVelocity * 0.95);
      body.setVelocityX(-this.isTouchingWall * PHYSICS.wallJumpVelocityX);
      this.jumpBufferedUntil = -Infinity;
      AudioService.jump();
    } else if (this.hasDoubleJump && !this.usedDoubleJump) {
      body.setVelocityY(PHYSICS.jumpVelocity * 0.85);
      this.usedDoubleJump = true;
      this.jumpBufferedUntil = -Infinity;
      AudioService.jump();
    }
  }

  tryAbility(): void {
    const now = this.scene.time.now;
    const hasDash = SaveService.powerupLevel("dash") > 0;
    if (hasDash && now > this.dashCooldownUntil) {
      const dir = this.flipX ? -1 : 1;
      this.setVelocityX(PHYSICS.abilityDashSpeed * dir);
      this.dashCooldownUntil = now + 900;
      this.invulnerableUntil = now + 300;
      AudioService.jump();
    }
  }

  updateWallSlide(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.isTouchingWall !== 0 && !this.onGround && body.velocity.y > PHYSICS.wallSlideMaxSpeed) {
      body.setVelocityY(PHYSICS.wallSlideMaxSpeed);
    }
  }

  get isInvulnerable(): boolean {
    return this.scene.time.now < this.invulnerableUntil;
  }

  absorbHit(): boolean {
    if (this.isInvulnerable) return true;
    if (this.shieldCharges > 0) {
      this.shieldCharges -= 1;
      this.invulnerableUntil = this.scene.time.now + 1200;
      this.setAlpha(0.5);
      this.scene.time.delayedCall(1200, () => this.setAlpha(1));
      AudioService.hit();
      return true;
    }
    return false;
  }
}
