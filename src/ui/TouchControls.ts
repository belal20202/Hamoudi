import Phaser from "phaser";
import { DESIGN_WIDTH, DESIGN_HEIGHT } from "@/config";

export interface ControlState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean; // edge-triggered, consumed each frame
  abilityPressed: boolean;
}

/**
 * On-screen touch controls, tuned to avoid the most common cause of "choppy"
 * mobile controls: small circular hit zones that silently drop input the
 * instant a thumb drifts a few pixels off-center (Phaser's default
 * `pointerout` firing the moment the pointer leaves the shape's exact
 * geometry). Two changes fix that:
 *   1. Zones are large, generously-padded rectangles instead of small
 *      circles — much easier to hit and stay on with a thumb.
 *   2. Each zone tracks pointer IDs directly (down/up/global-move) rather
 *      than relying on `pointerout`, so a finger that drifts slightly
 *      outside the visual button — but hasn't actually lifted — keeps the
 *      input held, exactly like native mobile game controls behave.
 */
export class TouchControls {
  state: ControlState = { left: false, right: false, jumpPressed: false, abilityPressed: false };

  constructor(scene: Phaser.Scene) {
    const y = DESIGN_HEIGHT - 66;

    const makeZone = (
      x: number,
      w: number,
      h: number,
      label: string,
      fontSize: string,
      onDown: () => void,
      onUp?: () => void
    ) => {
      const bg = scene.add
        .rectangle(x, y, w, h, 0x150a2a, 0.35)
        .setScrollFactor(0)
        .setDepth(1000)
        .setStrokeStyle(2, 0xf5c542, 0.55);
      const text = scene.add
        .text(x, y, label, { fontSize, color: "#ffffff" })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1001)
        .setAlpha(0.9);

      const zone = scene.add
        .zone(x, y, w, h)
        .setScrollFactor(0)
        .setDepth(1002)
        .setInteractive({ useHandCursor: false });

      let activePointerId: number | null = null;

      const press = (pointerId: number) => {
        if (activePointerId !== null) return;
        activePointerId = pointerId;
        bg.setFillStyle(0xf5c542, 0.3);
        text.setAlpha(1);
        onDown();
      };
      const release = (pointerId: number) => {
        if (activePointerId !== pointerId) return;
        activePointerId = null;
        bg.setFillStyle(0x150a2a, 0.35);
        text.setAlpha(0.9);
        onUp?.();
      };

      zone.on("pointerdown", (p: Phaser.Input.Pointer) => press(p.id));
      // Bound to the whole scene (not just this zone) so lifting/moving the
      // finger anywhere still correctly releases the button — this is what
      // makes it forgiving instead of only working with pixel-perfect aim.
      scene.input.on("pointerup", (p: Phaser.Input.Pointer) => release(p.id));
      scene.input.on("pointerupoutside", (p: Phaser.Input.Pointer) => release(p.id));

      return { bg, text, zone };
    };

    // D-Pad (bottom-left) — wide rectangles, easy to keep a thumb on
    makeZone(
      64,
      88,
      88,
      "◀",
      "30px",
      () => (this.state.left = true),
      () => (this.state.left = false)
    );
    makeZone(
      158,
      88,
      88,
      "▶",
      "30px",
      () => (this.state.right = true),
      () => (this.state.right = false)
    );

    // Action buttons (bottom-right)
    makeZone(DESIGN_WIDTH - 64, 92, 92, "⤒", "34px", () => {
      this.state.jumpPressed = true;
    });
    makeZone(DESIGN_WIDTH - 166, 76, 76, "✦", "26px", () => {
      this.state.abilityPressed = true;
    });
  }

  /** Call once per frame after reading jump/ability edges */
  consumeEdges(): void {
    this.state.jumpPressed = false;
    this.state.abilityPressed = false;
  }
}
