import Phaser from "phaser";
import { DESIGN_WIDTH, DESIGN_HEIGHT, THEME } from "@/config";
import { OUTFITS } from "@/services/GameData";
import { SaveService } from "@/services/SaveService";
import { AudioService } from "@/services/AudioService";
import { UiStyle } from "@/ui/UiStyle";
import { Hud } from "@/ui/Hud";
import { AdService } from "@/services/AdService";
import { Player } from "@/objects/Player";
import type { OutfitDefinition } from "@/types";

const PAGE_SIZE = 6; // 2 columns x 3 rows

export class ShopScene extends Phaser.Scene {
  private hud!: Hud;
  private listContainer!: Phaser.GameObjects.Container;
  private previewSprite!: Phaser.GameObjects.Sprite;
  private previewNameText!: Phaser.GameObjects.Text;
  private activeTab: "gold" | "gems" = "gold";
  private page = 0;
  private tabButtons: { key: "gold" | "gems"; bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text }[] = [];

  constructor() {
    super("Shop");
  }

  private get filteredOutfits(): OutfitDefinition[] {
    if (this.activeTab === "gold") return OUTFITS.filter((o) => o.id === "default" || o.priceGold > 0);
    return OUTFITS.filter((o) => o.priceGems > 0);
  }

  create(): void {
    void AdService.notifyPageView();

    const bg = this.add.graphics().setDepth(-10);
    bg.fillGradientStyle(THEME.skyTop, THEME.skyTop, THEME.skyBottom, THEME.skyBottom, 1);
    bg.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    this.hud = new Hud(this);

    this.add
      .text(DESIGN_WIDTH / 2, 56, "المتجر", { ...UiStyle.heading(), color: "#3a1f0a" })
      .setOrigin(0.5)
      .setShadow(1, 1, "#ffffff", 2, true, true);

    const backBtn = this.add
      .text(20, 55, "◀ رجوع", { ...UiStyle.body(), color: "#3a1f0a" })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    backBtn.on("pointerup", () => {
      AudioService.click();
      this.scene.start("MainMenu");
    });

    // Live character preview -- shows exactly how the currently-highlighted
    // outfit looks on Hamoudi himself, not an abstract color swatch.
    const previewPanel = this.add.graphics();
    previewPanel.fillStyle(0x000000, 0.15);
    previewPanel.fillRoundedRect(DESIGN_WIDTH / 2 - 60, 78, 120, 92, 14);
    this.previewSprite = this.add.sprite(DESIGN_WIDTH / 2, 130, "player_idle").setScale(2.2);
    this.previewNameText = this.add
      .text(DESIGN_WIDTH / 2, 176, "", { ...UiStyle.small(), fontSize: "13px", color: "#3a1f0a" })
      .setOrigin(0.5);
    this.updatePreview(SaveService.get().equippedOutfit);

    // Tabs: gold vs gem outfits.
    const tabY = 196;
    this.buildTab("gold", DESIGN_WIDTH / 2 - 75, tabY, "🪙 ذهبية");
    this.buildTab("gems", DESIGN_WIDTH / 2 + 75, tabY, "💎 جواهر");

    this.listContainer = this.add.container(0, 0);
    this.renderPage();
  }

  private buildTab(key: "gold" | "gems", x: number, y: number, label: string): void {
    const bgGraphic = this.add.graphics();
    const text = this.add.text(x, y, label, { ...UiStyle.button(), fontSize: "15px", color: "#3a1f0a" }).setOrigin(0.5);
    const zone = this.add.zone(x, y, 130, 34).setInteractive({ useHandCursor: true });
    zone.on("pointerup", () => {
      AudioService.click();
      this.activeTab = key;
      this.page = 0;
      this.renderPage();
    });
    this.tabButtons.push({ key, bg: bgGraphic, text });
    this.redrawTabs();
  }

  private redrawTabs(): void {
    const y = 196;
    const positions = { gold: DESIGN_WIDTH / 2 - 75, gems: DESIGN_WIDTH / 2 + 75 };
    for (const tab of this.tabButtons) {
      tab.bg.clear();
      const active = tab.key === this.activeTab;
      tab.bg.fillStyle(active ? 0xf5c542 : 0x000000, active ? 1 : 0.15);
      tab.bg.fillRoundedRect(positions[tab.key] - 65, y - 17, 130, 34, 12);
      tab.text.setColor(active ? "#3a1f0a" : "#5a3a1a");
    }
  }

  private updatePreview(outfitId: string): void {
    const outfit = OUTFITS.find((o) => o.id === outfitId) ?? OUTFITS[0];
    const { idleKey, runAnimKey } = Player.ensureOutfitAnimation(this, outfit.id);
    this.previewSprite.setTexture(idleKey);
    this.previewSprite.play(runAnimKey);
    this.previewNameText.setText(outfit.nameAr);
  }

  private renderPage(): void {
    this.redrawTabs();
    this.listContainer.removeAll(true);

    const outfits = this.filteredOutfits;
    const totalPages = Math.max(1, Math.ceil(outfits.length / PAGE_SIZE));
    this.page = Phaser.Math.Clamp(this.page, 0, totalPages - 1);
    const pageItems = outfits.slice(this.page * PAGE_SIZE, this.page * PAGE_SIZE + PAGE_SIZE);

    const cols = 2;
    const cellW = 250;
    const cellH = 92;
    const startX = DESIGN_WIDTH / 2 - cellW / 2;
    const startY = 246;

    pageItems.forEach((outfit, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH;

      const owned = SaveService.ownsOutfit(outfit.id);
      const equipped = SaveService.get().equippedOutfit === outfit.id;

      const cardContainer = this.add.container(x, y);
      const shadow = this.add.rectangle(3, 4, 232, 78, 0x000000, 0.25);
      const card = this.add.graphics();
      card.fillGradientStyle(0x8a5424, 0x8a5424, 0x5a350f, 0x5a350f, 1);
      card.fillRoundedRect(-116, -39, 232, 78, 14);
      card.lineStyle(equipped ? 3 : 1.5, equipped ? 0xf5c542 : 0x4a3018, 1);
      card.strokeRoundedRect(-116, -39, 232, 78, 14);

      const swatch = this.add.circle(-84, 0, 20, outfit.tint).setStrokeStyle(2, 0xffffff, 0.5);
      const name = this.add.text(-4, -20, outfit.nameAr, { ...UiStyle.small(), fontSize: "13px", color: "#fff6e6" }).setOrigin(0.5);

      let priceLabel = "مملوك ✅";
      if (!owned) priceLabel = outfit.priceGems > 0 ? `💎 ${outfit.priceGems}` : `🪙 ${outfit.priceGold}`;
      else if (equipped) priceLabel = "مرتدى ⭐";
      const price = this.add.text(-4, 2, priceLabel, { ...UiStyle.small(), fontSize: "12px", color: "#ffe0b3" }).setOrigin(0.5);

      cardContainer.add([shadow, card, swatch, name, price]);

      const actionLabel = owned ? (equipped ? "" : "ارتداء") : "شراء";
      if (actionLabel) {
        const btn = this.add
          .text(-4, 25, actionLabel, { ...UiStyle.small(), fontSize: "12px" })
          .setOrigin(0.5)
          .setBackgroundColor("#f5c542")
          .setPadding(10, 4, 10, 4)
          .setColor("#3a1f0a")
          .setInteractive({ useHandCursor: true });

        btn.on("pointerup", () => {
          AudioService.click();
          if (owned) {
            SaveService.equipOutfit(outfit.id);
          } else {
            const canAfford = outfit.priceGems > 0 ? SaveService.get().gems >= outfit.priceGems : SaveService.get().gold >= outfit.priceGold;
            if (!canAfford) return;
            if (outfit.priceGems > 0) SaveService.spendGems(outfit.priceGems);
            else SaveService.spendGold(outfit.priceGold);
            SaveService.purchaseOutfit(outfit.id);
            SaveService.equipOutfit(outfit.id);
            AudioService.purchase();
          }
          this.hud.refresh();
          this.updatePreview(outfit.id);
          this.renderPage();
        });
        cardContainer.add(btn);
      }

      const previewZone = this.add.zone(0, -10, 232, 50).setInteractive({ useHandCursor: true });
      previewZone.on("pointerup", () => this.updatePreview(outfit.id));
      cardContainer.add(previewZone);

      cardContainer.setScale(0.9).setAlpha(0);
      this.listContainer.add(cardContainer);
      this.tweens.add({ targets: cardContainer, scale: 1, alpha: 1, duration: 220, delay: i * 40, ease: "Back.easeOut" });
    });

    const pagerY = DESIGN_HEIGHT - 22;
    const prevBtn = this.add
      .text(DESIGN_WIDTH / 2 - 60, pagerY, "◀", { ...UiStyle.body(), color: "#3a1f0a" })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const pageLabel = this.add
      .text(DESIGN_WIDTH / 2, pagerY, `${this.page + 1} / ${totalPages}`, { ...UiStyle.small(), color: "#3a1f0a" })
      .setOrigin(0.5);
    const nextBtn = this.add
      .text(DESIGN_WIDTH / 2 + 60, pagerY, "▶", { ...UiStyle.body(), color: "#3a1f0a" })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    prevBtn.on("pointerup", () => {
      if (this.page > 0) {
        AudioService.click();
        this.page -= 1;
        this.renderPage();
      }
    });
    nextBtn.on("pointerup", () => {
      if (this.page < totalPages - 1) {
        AudioService.click();
        this.page += 1;
        this.renderPage();
      }
    });
    this.listContainer.add([prevBtn, pageLabel, nextBtn]);
  }
}
