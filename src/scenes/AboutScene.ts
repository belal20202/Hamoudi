import Phaser from "phaser";
import { DESIGN_WIDTH, DESIGN_HEIGHT, GAME_TITLE, GAME_SUBTITLE, GAME_VERSION, GAME_YEAR, DEVELOPER_NAME, MADE_IN, TOTAL_LEVELS, WORLDS_COUNT } from "@/config";
import { AudioService } from "@/services/AudioService";
import { UiStyle } from "@/ui/UiStyle";

const PRIVACY_POLICY_AR = `سياسة الخصوصية

هذه اللعبة تعمل بالكامل دون اتصال بالإنترنت (Offline). لا نقوم بجمع أي بيانات شخصية، ولا نستخدم أي إعلانات خارجية أو أدوات تتبع، ولا نطلب أي صلاحيات خطرة على جهازك.

يتم حفظ تقدمك (العملات، الجواهر، المراحل، الأزياء) محلياً على جهازك فقط داخل التطبيق، ولا يتم إرسال أي من هذه البيانات إلى أي خادم خارجي.

عند حذف التطبيق، سيتم حذف جميع بيانات التقدم المحفوظة تلقائياً من جهازك.

لأي استفسار حول الخصوصية، يرجى التواصل مع المطور: ${DEVELOPER_NAME}.`;

export class AboutScene extends Phaser.Scene {
  private showingPolicy = false;
  private bodyText!: Phaser.GameObjects.Text;
  private toggleBtn!: Phaser.GameObjects.Text;

  constructor() {
    super("About");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x150a2a);
    this.add.text(DESIGN_WIDTH / 2, 50, "عن اللعبة", UiStyle.heading()).setOrigin(0.5);

    const backBtn = this.add.text(20, 50, "◀ رجوع", UiStyle.body()).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    backBtn.on("pointerup", () => {
      AudioService.click();
      this.scene.start("MainMenu");
    });

    this.bodyText = this.add.text(DESIGN_WIDTH / 2, 90, "", {
      ...UiStyle.body(),
      fontSize: "14px",
      wordWrap: { width: DESIGN_WIDTH - 60 },
      align: "center",
      lineSpacing: 6
    }).setOrigin(0.5, 0);

    this.toggleBtn = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 24, "", { ...UiStyle.button(), fontSize: "15px" })
      .setOrigin(0.5)
      .setBackgroundColor("#f5c542")
      .setColor("#150a2a")
      .setPadding(12, 6, 12, 6)
      .setInteractive({ useHandCursor: true });

    this.toggleBtn.on("pointerup", () => {
      AudioService.click();
      this.showingPolicy = !this.showingPolicy;
      this.render();
    });

    this.render();
  }

  private render(): void {
    if (this.showingPolicy) {
      this.bodyText.setText(PRIVACY_POLICY_AR);
      this.toggleBtn.setText("رجوع لمعلومات اللعبة");
    } else {
      this.bodyText.setText(
        [
          `${GAME_TITLE} - ${GAME_SUBTITLE}`,
          "",
          `الإصدار: ${GAME_VERSION}   |   سنة الإصدار: ${GAME_YEAR}`,
          `المطور: ${DEVELOPER_NAME}`,
          `${MADE_IN} 🇮🇶`,
          "",
          `انطلق في رحلة حمودي عبر ${WORLDS_COUNT} عوالم عربية أصيلة و${TOTAL_LEVELS} مرحلة مليئة بالتحديات، اجمع العملات والجواهر، وواجه تنين مملكة حمودي في المرحلة الأخيرة!`,
          "",
          "اللعبة تعمل بالكامل دون إنترنت ولا تحتوي على أي إعلانات أو مشتريات إجبارية."
        ].join("\n")
      );
      this.toggleBtn.setText("سياسة الخصوصية 🔒");
    }
  }
}
