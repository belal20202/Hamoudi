import Phaser from "phaser";
import { DESIGN_WIDTH, DESIGN_HEIGHT, PHYSICS, TOTAL_LEVELS } from "@/config";
import { LevelGenerator } from "@/services/LevelGenerator";
import { TextureFactory } from "@/services/TextureFactory";
import { SaveService } from "@/services/SaveService";
import { AudioService } from "@/services/AudioService";
import { Player } from "@/objects/Player";
import { Enemy } from "@/objects/Enemy";
import { Collectible } from "@/objects/Collectible";
import { MovingPlatform } from "@/objects/MovingPlatform";
import { TouchControls } from "@/ui/TouchControls";
import { UiStyle } from "@/ui/UiStyle";
import type { LevelDefinition } from "@/types";

export class GameScene extends Phaser.Scene {
  private level!: LevelDefinition;
  private player!: Player;
  private groundGroup!: Phaser.Physics.Arcade.StaticGroup;
  private hazardGroup!: Phaser.Physics.Arcade.StaticGroup;
  private goalZone!: Phaser.GameObjects.Zone;
  private enemies: Enemy[] = [];
  private collectibles: Collectible[] = [];
  private movingPlatforms: MovingPlatform[] = [];
  private touchControls!: TouchControls;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;

  private coinsCollected = 0;
  private enemiesDefeated = 0;
  private elapsedMs = 0;
  private isLevelOver = false;

  private coinsText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;

  constructor() {
    super("Game");
  }

  init(data: { levelId: number }): void {
    this.level = LevelGenerator.generate(data.levelId);
    this.coinsCollected = 0;
    this.enemiesDefeated = 0;
    this.elapsedMs = 0;
    this.isLevelOver = false;
    this.enemies = [];
    this.collectibles = [];
    this.movingPlatforms = [];
  }

  create(): void {
    if (!SaveService.consumeLife()) {
      this.showNoLivesScreen();
      return;
    }

    TextureFactory.generateBiomeTiles(this, this.level.biome);
    this.buildBackground();
    this.buildWorld();
    this.buildPlayer();
    this.buildEnemiesAndItems();
    this.buildHud();
    this.buildInput();
    this.buildCamera();

    this.refreshLivesText();
    AudioService.startMusicLoop();

    // If a Pause overlay is still around from a previous level (e.g. after
    // "next level" from the results screen), make sure it's gone.
    this.scene.stop("Pause");
  }

  /**
   * Shown instead of silently bouncing back to the level list when the
   * player has no lives left -- a redirect with no explanation reads as a
   * bug ("why didn't the level start?"), not as "come back later".
   */
  private showNoLivesScreen(): void {
    this.cameras.main.setBackgroundColor(0x150a2a);
    const cx = DESIGN_WIDTH / 2;
    const cy = DESIGN_HEIGHT / 2;

    this.add.text(cx, cy - 60, "❤️ لا تملك حياة كافية", UiStyle.heading()).setOrigin(0.5);

    const minutesLeft = Math.max(1, Math.ceil(SaveService.msUntilNextLife() / 60000));
    this.add
      .text(cx, cy - 15, `ستحصل على حياة جديدة خلال ${minutesLeft} دقيقة`, UiStyle.body())
      .setOrigin(0.5);

    const backBtn = this.add
      .text(cx, cy + 50, "خريطة المراحل 🗺️", UiStyle.button())
      .setOrigin(0.5)
      .setBackgroundColor("#f5c542")
      .setColor("#150a2a")
      .setPadding(14, 8, 14, 8)
      .setInteractive({ useHandCursor: true });
    backBtn.on("pointerup", () => {
      AudioService.click();
      this.scene.start("LevelSelect");
    });
  }

  private buildBackground(): void {
    const g = this.add.graphics().setScrollFactor(0).setDepth(-100);
    g.fillGradientStyle(this.level.biome.skyTop, this.level.biome.skyTop, this.level.biome.skyBottom, this.level.biome.skyBottom, 1);
    g.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    // parallax decor circles (sun/moon + distant domes)
    const decor = this.add.graphics().setScrollFactor(0.2).setDepth(-90);
    decor.fillStyle(this.level.biome.isNight ? 0xf5f0d8 : 0xfff3b0, 0.9);
    decor.fillCircle(DESIGN_WIDTH - 90, 70, 30);
    decor.fillStyle(this.level.biome.decorColor, 0.5);
    for (let i = 0; i < 8; i++) {
      decor.fillCircle(i * 140 + 60, DESIGN_HEIGHT - 40, 26);
    }
  }

  private buildWorld(): void {
    this.groundGroup = this.physics.add.staticGroup();
    this.hazardGroup = this.physics.add.staticGroup();
    const groundKey = `ground_${this.level.biome.id}`;
    const platformKey = `platform_${this.level.biome.id}`;
    const brickKey = `brick_${this.level.biome.id}`;
    const size = this.level.tileSize;

    for (const tile of this.level.tiles) {
      const px = tile.x * size + size / 2;
      const py = tile.y * size + size / 2;
      switch (tile.type) {
        case "ground":
          this.groundGroup.create(px, py, groundKey).setSize(size, size).refreshBody();
          break;
        case "brick":
          this.groundGroup.create(px, py, brickKey).setSize(size, size).refreshBody();
          break;
        case "platform":
          this.groundGroup.create(px, py, platformKey).setSize(size, 12).refreshBody();
          break;
        case "hazard":
          this.hazardGroup.create(px, py, "hazard").setSize(size - 8, size - 20).refreshBody();
          break;
        case "moving": {
          const mp = new MovingPlatform(this, px, py);
          this.movingPlatforms.push(mp);
          break;
        }
      }
    }

    const world = this.level;
    this.physics.world.setBounds(0, 0, world.gridWidth * world.tileSize, world.gridHeight * world.tileSize);

    // goal flag
    this.add.image(world.goal.x, world.goal.y, "goal_flag").setOrigin(0.5, 1).setDepth(6);
    this.goalZone = this.add.zone(world.goal.x, world.goal.y - 20, 40, 60);
    this.physics.add.existing(this.goalZone, true);
  }

  private buildPlayer(): void {
    this.player = new Player(this, this.level.playerStart.x, this.level.playerStart.y);
    this.physics.world.gravity.y = PHYSICS.gravityY;

    this.physics.add.collider(this.player, this.groundGroup, undefined, undefined, this);
    this.physics.add.overlap(this.player, this.hazardGroup, () => this.onPlayerHazard(), undefined, this);
    this.physics.add.overlap(this.player, this.goalZone, () => this.onLevelComplete(), undefined, this);
  }

  private buildEnemiesAndItems(): void {
    for (const spawn of this.level.enemies) {
      const enemy = new Enemy(this, spawn);
      this.enemies.push(enemy);
      this.physics.add.collider(enemy, this.groundGroup);
      this.physics.add.overlap(this.player, enemy, () => this.onPlayerEnemyContact(enemy), undefined, this);
    }
    for (const spawn of this.level.collectibles) {
      const item = new Collectible(this, spawn);
      this.collectibles.push(item);
      this.physics.add.overlap(this.player, item, () => this.onCollect(item), undefined, this);
    }
    for (const mp of this.movingPlatforms) {
      this.physics.add.collider(this.player, mp);
    }
  }

  private buildHud(): void {
    const bar = this.add.rectangle(DESIGN_WIDTH / 2, 20, DESIGN_WIDTH, 40, 0x0f0620, 0.55).setScrollFactor(0).setDepth(999);
    bar.setStrokeStyle(1, 0xf5c542, 0.3);

    this.coinsText = this.add
      .text(16, 20, `🪙 0/${this.level.totalCoins}`, UiStyle.currency())
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(1000);
    this.timeText = this.add
      .text(DESIGN_WIDTH / 2, 20, "⏱ 0", UiStyle.currency())
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);
    this.livesText = this.add
      .text(DESIGN_WIDTH - 16, 20, "", UiStyle.currency())
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    const pauseBtn = this.add
      .text(DESIGN_WIDTH - 16, 44, "⏸", { fontSize: "18px", color: "#ffffff" })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive({ useHandCursor: true });
    pauseBtn.on("pointerup", () => this.pauseToMenu());
  }

  private refreshLivesText(): void {
    this.livesText.setText(`❤️ ${SaveService.get().lives}`);
  }

  private buildInput(): void {
    this.touchControls = new TouchControls(this);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyShift = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }

  private buildCamera(): void {
    const world = this.level;
    this.cameras.main.setBounds(0, 0, world.gridWidth * world.tileSize, world.gridHeight * world.tileSize);
    // Slightly gentler lerp than before (0.12 -> 0.08) and roundPixels
    // explicitly off on the camera too — smoother, non-jittery tracking of
    // a moving character matters more here than pixel-snap sharpness.
    this.cameras.main.setRoundPixels(false);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(140, 90);
  }

  private pauseToMenu(): void {
    if (this.isLevelOver) return;
    AudioService.click();
    this.scene.pause();
    this.scene.launch("Pause", { levelId: this.level.id });
  }

  update(time: number, delta: number): void {
    if (this.isLevelOver) return;

    this.elapsedMs += delta;
    this.timeText.setText(`⏱ ${Math.floor(this.elapsedMs / 1000)}`);

    const left = this.cursors.left.isDown || this.touchControls.state.left;
    const right = this.cursors.right.isDown || this.touchControls.state.right;
    const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keySpace) || this.touchControls.state.jumpPressed;
    const ability = Phaser.Input.Keyboard.JustDown(this.keyShift) || this.touchControls.state.abilityPressed;

    if (left && !right) this.player.moveLeft();
    else if (right && !left) this.player.moveRight();
    else this.player.stopHorizontal();

    // Smooth, frame-rate-independent acceleration toward the target speed
    // (replaces the old instant velocity snap) — this is most of what makes
    // running/stopping feel fluid instead of stiff/robotic.
    this.player.applyMovement(delta);

    if (jump) this.player.requestJump();
    this.player.updateJumpState(time);

    if (ability) this.player.tryAbility();
    this.player.updateWallSlide();
    this.player.updateAnimation();

    this.touchControls.consumeEdges();

    for (const enemy of this.enemies) enemy.update();
    for (const mp of this.movingPlatforms) mp.update(delta / 1000);

    if (this.player.y > this.level.gridHeight * this.level.tileSize + 100) {
      this.onPlayerHazard();
    }
  }

  private onCollect(item: Collectible): void {
    if (!item.active) return;
    item.collect();
    this.collectibles = this.collectibles.filter((c) => c !== item);
    if (item.kind === "coin") {
      this.coinsCollected += 1;
      SaveService.addGold(1);
      AudioService.coin();
      this.coinsText.setText(`🪙 ${this.coinsCollected}/${this.level.totalCoins}`);
    } else {
      SaveService.addGems(1);
      AudioService.gem();
    }
  }

  private onPlayerEnemyContact(enemy: Enemy): void {
    if (!enemy.active || this.isLevelOver) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const stomping = body.velocity.y > 0 && this.player.y < enemy.y - 6;
    if (stomping) {
      enemy.defeat();
      this.enemies = this.enemies.filter((e) => e !== enemy);
      this.enemiesDefeated += 1;
      body.setVelocityY(PHYSICS.jumpVelocity * 0.6);
      AudioService.defeatEnemy();
    } else {
      this.onPlayerHazard();
    }
  }

  private onPlayerHazard(): void {
    if (this.isLevelOver) return;
    if (this.player.absorbHit()) return;
    this.isLevelOver = true;
    AudioService.lose();
    this.showResultOverlay(false);
  }

  private onLevelComplete(): void {
    if (this.isLevelOver) return;
    this.isLevelOver = true;
    AudioService.win();

    const stars = this.computeStars();
    SaveService.recordLevelResult({
      levelId: this.level.id,
      stars,
      coinsCollected: this.coinsCollected,
      enemiesDefeated: this.enemiesDefeated,
      timeSeconds: Math.floor(this.elapsedMs / 1000),
      bestStars: stars
    });
    SaveService.addGold(20 + stars * 10);

    this.showResultOverlay(true, stars);
  }

  private computeStars(): 0 | 1 | 2 | 3 {
    const coinRatio = this.level.totalCoins > 0 ? this.coinsCollected / this.level.totalCoins : 1;
    const enemyRatio = this.level.enemies.length > 0 ? this.enemiesDefeated / this.level.enemies.length : 1;
    const timeSec = this.elapsedMs / 1000;
    const underPar = timeSec <= this.level.parTimeSeconds * 1.4;

    let stars = 1; // completing gives at least 1 star
    if (coinRatio >= 0.6 && underPar) stars = 2;
    if (coinRatio >= 0.9 && enemyRatio >= 0.5 && timeSec <= this.level.parTimeSeconds) stars = 3;
    return stars as 0 | 1 | 2 | 3;
  }

  private showResultOverlay(won: boolean, stars: 0 | 1 | 2 | 3 = 0): void {
    const cx = this.cameras.main.scrollX + DESIGN_WIDTH / 2;
    const cy = this.cameras.main.scrollY + DESIGN_HEIGHT / 2;

    // Dim backdrop
    this.add.rectangle(cx, cy, DESIGN_WIDTH, DESIGN_HEIGHT, 0x000000, 0.65).setScrollFactor(0).setDepth(2000);

    // A real panel instead of text floating on the dimmed backdrop -- a
    // bordered, slightly-elevated card is what makes an end screen read as
    // "designed" rather than "debug overlay".
    const panelW = Math.min(340, DESIGN_WIDTH - 40);
    const panelH = 260;
    const panel = this.add.graphics().setScrollFactor(0).setDepth(2000);
    panel.fillStyle(0x000000, 0.35);
    panel.fillRoundedRect(cx - panelW / 2 + 4, cy - panelH / 2 + 6, panelW, panelH, 20);
    panel.fillGradientStyle(0x3a2a5a, 0x3a2a5a, 0x201638, 0x201638, 1);
    panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 20);
    panel.lineStyle(3, won ? 0xf5c542 : 0xcf4b3c, 1);
    panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 20);

    const topY = cy - panelH / 2;
    this.add
      .text(cx, topY + 34, won ? "🎉 أحسنت! أكملت المرحلة" : "💥 حاول مرة أخرى", { ...UiStyle.heading(), fontSize: "21px" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001);

    if (won) {
      // Stars pop in one at a time with a little bounce -- far more
      // satisfying than all three appearing flat and simultaneously.
      const starY = topY + 78;
      for (let i = 0; i < 3; i++) {
        const filled = i < stars;
        const star = this.add
          .text(cx + (i - 1) * 42, starY, filled ? "★" : "☆", { fontSize: "44px", color: filled ? "#f5c542" : "#4a4258" })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(2001)
          .setScale(0);
        if (filled) {
          this.tweens.add({
            targets: star,
            scale: 1,
            duration: 260,
            delay: 150 + i * 160,
            ease: "Back.easeOut"
          });
        } else {
          star.setScale(1);
        }
      }

      // A small celebratory particle burst using the existing procedural
      // star particle texture -- no new assets, just Phaser's built-in
      // particle emitter for a proper "level complete" moment.
      if (stars > 0) {
        const emitter = this.add.particles(cx, topY - 10, "particle_star", {
          speed: { min: 80, max: 220 },
          angle: { min: 200, max: 340 },
          scale: { start: 1, end: 0 },
          lifespan: 900,
          quantity: 18,
          tint: [0xf5c542, 0xffffff, 0x3fd1ff],
          emitting: false
        });
        emitter.setScrollFactor(0).setDepth(2002);
        emitter.explode(18);
      }

      this.add
        .text(cx, topY + 120, `🪙 ${this.coinsCollected}   ⏱ ${Math.floor(this.elapsedMs / 1000)}ث`, { ...UiStyle.body(), fontSize: "16px" })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2001);
    } else {
      this.add
        .text(cx, topY + 90, "فقدت حياة واحدة ❤️", UiStyle.body())
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2001);
    }

    const retryLabel = won ? (this.level.id < TOTAL_LEVELS ? "المرحلة التالية ▶" : "القائمة الرئيسية") : "إعادة المحاولة 🔁";
    const btnY = topY + panelH - 36;
    const retryBtn = this.add
      .text(cx, btnY, retryLabel, { ...UiStyle.button(), fontSize: "16px" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001)
      .setBackgroundColor("#f5c542")
      .setColor("#150a2a")
      .setPadding(14, 8, 14, 8)
      .setInteractive({ useHandCursor: true });
    retryBtn.on("pointerup", () => {
      AudioService.click();
      if (won && this.level.id < TOTAL_LEVELS) this.scene.start("Game", { levelId: this.level.id + 1 });
      else if (won) this.scene.start("MainMenu");
      else this.scene.start("Game", { levelId: this.level.id });
    });

    const menuBtn = this.add
      .text(cx, btnY + 40, "خريطة المراحل 🗺️", { ...UiStyle.small(), fontSize: "14px" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001)
      .setInteractive({ useHandCursor: true });
    menuBtn.on("pointerup", () => {
      AudioService.click();
      this.scene.start("LevelSelect");
    });
  }
}
