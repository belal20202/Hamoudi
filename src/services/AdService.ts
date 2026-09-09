import { Capacitor } from "@capacitor/core";

/**
 * Thin wrapper around @capacitor-community/admob.
 *
 * IMPORTANT — read before shipping:
 * This was written to match that plugin's documented public API as
 * accurately as possible, but it has NOT been run against a real device or
 * a real AdMob account in this environment (no network/native runtime
 * available here). Community Capacitor plugins do change their exact
 * method/enum names between major versions, so if `npx cap sync` or a
 * build surfaces a type/name mismatch against the version that actually
 * gets installed, check that plugin's README for the exact current names
 * and adjust the calls below accordingly — the overall structure (init once,
 * show an adaptive bottom banner, preload+show interstitials on a page
 * counter) should still be the right shape.
 *
 * Every call is wrapped in try/catch: a failed or misconfigured ad must
 * never be able to crash or block the game itself.
 */

const BANNER_AD_UNIT_ID = "ca-app-pub-5228365175479710/4720564893";
const INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-5228365175479710/1027415242";
const PAGES_PER_INTERSTITIAL = 4;

class AdServiceImpl {
  private initialized = false;
  private pageViewCount = 0;
  private interstitialReady = false;

  private get isNative(): boolean {
    // Ads only make sense (and only load) on an actual native Android/iOS
    // build. Running via `npm run dev` in a plain desktop browser has no
    // Capacitor native runtime, so every ad call below is skipped there --
    // this keeps local web development free of console errors/no-ops.
    return Capacitor.isNativePlatform();
  }

  /** Call once, near app boot. */
  async initialize(): Promise<void> {
    if (!this.isNative || this.initialized) return;
    try {
      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.initialize({});
      this.initialized = true;
      await this.showBanner();
      await this.preloadInterstitial();
    } catch (err) {
      console.warn("[AdService] initialize failed — continuing without ads:", err);
    }
  }

  private async showBanner(): Promise<void> {
    try {
      const { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } = await import("@capacitor-community/admob");

      // The banner is a native view drawn ON TOP of the WebView, not inside
      // it — by default it can sit over whatever is already there. To keep
      // it from covering any gameplay/UI, we reserve real space for it
      // instead: once the plugin reports the banner's actual height, that
      // height is written to a CSS variable that #app's height subtracts
      // (see index.html), then a resize event nudges Phaser's Scale
      // Manager to re-fit into the now-smaller area above the banner.
      AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info: { width: number; height: number }) => {
        document.documentElement.style.setProperty("--admob-banner-height", `${info.height}px`);
        window.dispatchEvent(new Event("resize"));
      });

      await AdMob.showBanner({
        adId: BANNER_AD_UNIT_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: false
      });
    } catch (err) {
      console.warn("[AdService] banner failed:", err);
    }
  }

  private async preloadInterstitial(): Promise<void> {
    try {
      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.prepareInterstitial({ adId: INTERSTITIAL_AD_UNIT_ID, isTesting: false });
      this.interstitialReady = true;
    } catch (err) {
      console.warn("[AdService] interstitial preload failed:", err);
      this.interstitialReady = false;
    }
  }

  /**
   * Call once per "page" (scene) the player navigates to. Shows a
   * pre-loaded interstitial every 4th call, then immediately starts
   * preloading the next one so it's ready in time for the next cycle.
   */
  async notifyPageView(): Promise<void> {
    if (!this.isNative) return;
    this.pageViewCount += 1;
    if (this.pageViewCount % PAGES_PER_INTERSTITIAL !== 0) return;
    if (!this.interstitialReady) return;

    try {
      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.showInterstitial();
      this.interstitialReady = false;
      void this.preloadInterstitial();
    } catch (err) {
      console.warn("[AdService] interstitial show failed:", err);
    }
  }
}

export const AdService = new AdServiceImpl();
