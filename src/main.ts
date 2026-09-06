import Phaser from "phaser";
import { DESIGN_WIDTH, DESIGN_HEIGHT, PHYSICS } from "@/config";
import { BootScene } from "@/scenes/BootScene";
import { MainMenuScene } from "@/scenes/MainMenuScene";
import { LevelSelectScene } from "@/scenes/LevelSelectScene";
import { GameScene } from "@/scenes/GameScene";
import { PauseScene } from "@/scenes/PauseScene";
import { AboutScene } from "@/scenes/AboutScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#0f0620",
  scale: {
    // ENVELOP guarantees the canvas always fully covers the screen (crops a
    // sliver off the longer axis instead of ever showing a black bar) --
    // FIT only avoids letterboxing when the aspect ratio is a perfect match,
    // which isn't reliable across the huge range of real phone screens.
    // Combined with DESIGN_WIDTH already adapting to the device's aspect
    // ratio (see config.ts), the crop this introduces is negligible.
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT
  },
  render: {
    antialias: true,
    antialiasGL: true,
    // roundPixels was removed: it snaps sprite/camera rendering to whole
    // device pixels every frame, which looks crisper for STATIC objects but
    // causes a visible micro-jitter/vibration on anything that moves with a
    // smoothed camera follow (exactly the "unstable character" symptom) --
    // the two sub-pixel rounding phases (sprite vs camera) drift against
    // each other frame to frame. Smooth motion matters more than pixel-snap
    // crispness for a moving platformer character, so it stays off.
    pixelArt: false
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: PHYSICS.gravityY },
      debug: false
    }
  },
  input: {
    activePointers: 3
  },
  scene: [
    BootScene,
    MainMenuScene,
    LevelSelectScene,
    GameScene,
    PauseScene,
    AboutScene
  ]
};

new Phaser.Game(config);
