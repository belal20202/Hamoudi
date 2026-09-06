import Phaser from "phaser";

const FONT_FAMILY = "Tahoma, 'Segoe UI', 'Geeza Pro', Arial, sans-serif";

export const UiStyle = {
  title: (): Phaser.Types.GameObjects.Text.TextStyle => ({
    fontFamily: FONT_FAMILY,
    fontSize: "34px",
    color: "#ffd76b",
    fontStyle: "bold",
    align: "center"
  }),
  heading: (): Phaser.Types.GameObjects.Text.TextStyle => ({
    fontFamily: FONT_FAMILY,
    fontSize: "24px",
    color: "#ffffff",
    fontStyle: "bold",
    align: "center"
  }),
  body: (): Phaser.Types.GameObjects.Text.TextStyle => ({
    fontFamily: FONT_FAMILY,
    fontSize: "18px",
    color: "#e8e0ff",
    align: "center"
  }),
  small: (): Phaser.Types.GameObjects.Text.TextStyle => ({
    fontFamily: FONT_FAMILY,
    fontSize: "14px",
    color: "#cbb7ff",
    align: "center"
  }),
  button: (): Phaser.Types.GameObjects.Text.TextStyle => ({
    fontFamily: FONT_FAMILY,
    fontSize: "20px",
    color: "#ffffff",
    fontStyle: "bold",
    align: "center"
  }),
  currency: (): Phaser.Types.GameObjects.Text.TextStyle => ({
    fontFamily: FONT_FAMILY,
    fontSize: "18px",
    color: "#ffffff",
    fontStyle: "bold"
  })
};

export function makeMenuButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void
): Phaser.GameObjects.Container {
  const bg = scene.add.image(0, 0, "ui_button");
  const text = scene.add.text(0, 0, label, UiStyle.button()).setOrigin(0.5);
  const container = scene.add.container(x, y, [bg, text]);
  container.setSize(264, 66);
  container.setInteractive({ useHandCursor: true });
  container.on("pointerover", () => bg.setTint(0xf5c542));
  container.on("pointerout", () => bg.clearTint());
  container.on("pointerdown", () => bg.setTint(0xd4af37));
  container.on("pointerup", () => {
    bg.clearTint();
    onClick();
  });
  return container;
}
