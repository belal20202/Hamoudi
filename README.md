# حمودي - رحلة البطل العربي
### Hamoudi — Journey of the Arabic Hero | v1.0 (2026)

A 2D platformer built with **TypeScript + Phaser 3 (Vite)**, packaged natively via
**Capacitor** for Android (Uptodown / sideload-friendly APK & AAB). 100% offline-first:
every sprite, tile, and sound effect is generated procedurally at runtime — there are
no bundled binary image/audio assets, no CDN calls, and no dangerous Android permissions.

## Architecture

```
src/
  config.ts            Global constants (screen size, physics tuning, currencies)
  types.ts              Shared TS interfaces (LevelDefinition, SaveState, etc.)
  main.ts                Phaser.Game bootstrap + scene registration
  scenes/
    BootScene.ts          Generates all textures + animations, then -> MainMenu
    MainMenuScene.ts       Title, currency header, 2 nav buttons (play / about), Iraq badge
    LevelSelectScene.ts    10 worlds x 5 levels grid (50 total), lock/star state
    GameScene.ts            Core gameplay loop: physics, camera, HUD, win/lose, stars
    PauseScene.ts            Pause overlay: resume / level select / main menu
    AboutScene.ts             Game info + in-app Privacy Policy (store compliance)
  objects/
    Player.ts    Run / Jump / Wall-jump / Dash ability / 4-frame run-cycle animation
    Enemy.ts       walker / flyer / spitter patrol AI
    Collectible.ts  coin / gem pickups
    MovingPlatform.ts  vertical patrol platform
  services/
    SaveService.ts      LocalStorage-backed persistent state (progress, currencies,
                          lives). Also retains dormant outfit/powerup/quest/achievement
                          data plumbing from an earlier build in case those features
                          come back later -- currently unused by any screen.
    LevelGenerator.ts     Deterministic seeded procedural generator -> all 50 levels
    Random.ts              mulberry32 seeded PRNG (same seed = same level, every time)
    TextureFactory.ts       Procedural sprite/tile generation via Phaser.Graphics
    AudioService.ts          Procedural WebAudio SFX + generative music loop
    GameData.ts               Static data: 10 biome themes (outfit/powerup/quest/
                                 achievement definitions also live here, currently unused)
  ui/
    TouchControls.ts   On-screen D-Pad + Jump/Ability buttons (mobile touch)
    Hud.ts               Gold/Gems/Lives header component
    UiStyle.ts            Shared Arabic-first text styles + menu button factory
android-template/       Zero-permission AndroidManifest, branding, icons, MainActivity
                          (immersive edge-to-edge fullscreen included) -- overlaid onto
                          the CI-generated android/ project on every build
.github/workflows/
  build-apk.yml           Builds + packages an installable APK on every push (see below)
```

### Why no `/src/assets`?
The spec requires 100% offline-first bundling with no external CDN dependencies and a
clean Uptodown review. Rather than bundling placeholder art that would need replacing
anyway, every texture (player, enemies, tiles per biome, coins, gems, hazards, UI
buttons) is drawn at boot time with `Phaser.Graphics.generateTexture()`, and every sound
is synthesized with the Web Audio API. To swap in real hand-drawn art or music later,
replace the body of the relevant method in `TextureFactory.ts` / `AudioService.ts` with
`this.load.image(...)` / `this.load.audio(...)` calls — no other code changes needed,
since everything downstream just references texture/sound keys.

### The 50-level system
Levels are **never** hand-authored or stored as data files. `LevelGenerator.generate(id)`
takes a level id (1–50), derives the world/biome and a deterministic seed from it, and
procedurally builds the tilemap as a left-to-right sequence of segments (safe ground,
platform-bridged gaps, hazard patches, elevation changes, moving-platform gaps), with
difficulty (gap size, enemy density, hazard density) scaling smoothly from level 1 to 50.
Level 50 (مملكة حمودي) is flagged `isBossLevel` and spawns the final encounter. Because
generation is seeded, replaying level 42 always regenerates the exact same layout.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173 — desktop browser testing (keyboard: arrows/space/shift)
npm run build       # type-checks then builds dist/ for production
```

## Building the Android APK for Uptodown

### Option A — Automatic, via GitHub Actions (recommended)
This repo includes `.github/workflows/build-apk.yml`. On every push to `main`
(or a manual run from the **Actions** tab), GitHub's own servers will:

1. `npm ci` + `npm run build` — type-check and build the offline web bundle
2. `npx cap add android` — generate a fresh native Android project (Gradle
   wrapper included) — **not committed to the repo**, see below
3. `npx cap sync android` — copy the built web app into it
4. Overlay `android-template/` on top — our zero-dangerous-permissions
   `AndroidManifest.xml`, Arabic app name/strings, brand colors, `MainActivity`,
   and generated launcher icons — onto the freshly generated project
5. `./gradlew assembleDebug` — build an installable, unsigned debug APK
6. Upload it as a downloadable workflow **artifact**

Grab the APK from the finished run's Summary page (bottom, under
"Artifacts") and sideload it or upload it to Uptodown directly.

**Why `android/` isn't committed:** `npx cap add android` refuses to run if
that folder already exists, and a hand-committed copy would be missing the
binary Gradle wrapper jar. Instead, `android-template/` holds just the files
we customized (manifest, branding, icons, `MainActivity`) and the workflow
copies them onto the freshly generated project every run — so the repo stays
clean and the build stays reproducible.

**Signed release APK (optional, recommended before publishing):** add these
four repository secrets (Settings → Secrets and variables → Actions) and the
workflow will automatically also build a signed `assembleRelease` APK:
- `ANDROID_KEYSTORE_BASE64` — output of `base64 -w0 your-release.keystore`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

### Option B — Manual, locally
```bash
npm run build
npx cap add android      # first time only — generates the android/ native project
npm run cap:sync          # copies dist/ into the native project
# then manually copy android-template/app/src/main/* over android/app/src/main/*
npx cap open android       # opens Android Studio -> Build > Generate Signed Bundle/APK
```

Notes:
- `android-template/app/src/main/AndroidManifest.xml` is the reference
  manifest: no `<uses-permission>` entries, no cleartext traffic, RTL
  support enabled, landscape-locked for consistent platforming.
- Launcher icons under `android-template/app/src/main/res/mipmap-*` are
  already generated and get copied in automatically by CI (or manually per
  Option B) — replace them with real branded artwork any time before a
  store submission if you'd like something more polished than the
  procedural default.

## App icon
A designed launcher icon (Arabian palace silhouette, hero with fez + star,
warm sunset gradient) lives at `app-icon-512.png` (master) and is already
exported to every required size in `android-template/app/src/main/res/mipmap-*`
(square `ic_launcher.png` + circular-masked `ic_launcher_round.png`) and
`public/icons/` (192/512 for the web/PWA manifest and browser favicon). The
CI workflow copies the mipmap versions onto the generated Android project
automatically, same as the manifest/branding overlay — no extra steps needed.
To redesign it later, edit `icon_master.svg` at the repo root (if you keep it)
and re-export at the sizes above; source: a hand-authored SVG, not a photo or
generated image, so it's safe to keep editing freely.

## Controls
- **Touch (mobile):** on-screen D-Pad (bottom-left) + Jump (⤒) / Ability (✦) buttons (bottom-right)
- **Keyboard (desktop testing):** Arrow keys / Space to jump / Shift for ability-dash

## Save data
All progress lives in `localStorage` under the key `hamoudi_save_v2_3` as a single JSON
blob (`SaveState`) — gold, gems, lives (with real-time regeneration), unlocked level,
per-level star results, owned/equipped outfits, powerup levels, today's daily quests,
claimed achievements, lifetime totals, and settings. See `src/services/SaveService.ts`.

---
**المطور:** بلال النعيمي · **الإصدار:** 1.0 (2026) · **صنع في العراق 🇮🇶**
