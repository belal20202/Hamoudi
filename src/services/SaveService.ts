import { STORAGE_KEY, STARTING_LIVES, MAX_LIVES, LIFE_REGEN_MINUTES, GAME_VERSION } from "@/config";
import type { SaveState, LevelResult } from "@/types";
import { DAILY_QUESTS_POOL } from "@/services/GameData";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function pickDailyQuests(): { id: string; progress: number; claimed: boolean }[] {
  const shuffled = [...DAILY_QUESTS_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((q) => ({ id: q.id, progress: 0, claimed: false }));
}

function defaultState(): SaveState {
  return {
    version: GAME_VERSION,
    gold: 150,
    gems: 20,
    lives: STARTING_LIVES,
    lastLifeLostAt: null,
    unlockedLevel: 1,
    levelResults: {},
    ownedOutfits: ["default"],
    equippedOutfit: "default",
    powerupLevels: {},
    dailyQuests: { date: todayKey(), quests: pickDailyQuests() },
    achievementsClaimed: [],
    totals: { coinsCollectedLifetime: 0, gemsCollectedLifetime: 0, enemiesDefeatedLifetime: 0 },
    settings: { musicOn: true, sfxOn: true }
  };
}

/**
 * SaveService centralizes all persistent state (IndexedDB not required at this scale;
 * LocalStorage is synchronous, offline, and sufficient for structured JSON save data).
 * A thin async wrapper is kept so a future IndexedDB backend can be swapped in without
 * touching call sites.
 */
class SaveServiceImpl {
  private state: SaveState;

  constructor() {
    this.state = this.load();
    this.regenerateLives();
    this.refreshDailyQuestsIfNeeded();
  }

  private load(): SaveState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw) as SaveState;
      // simple forward-compat merge in case new fields were added in a later version
      return { ...defaultState(), ...parsed };
    } catch {
      return defaultState();
    }
  }

  persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // storage full or unavailable - fail silently, gameplay continues in-memory
    }
  }

  get(): SaveState {
    return this.state;
  }

  resetAll(): void {
    this.state = defaultState();
    this.persist();
  }

  // ---------- Currency ----------
  addGold(amount: number): void {
    this.state.gold = Math.max(0, this.state.gold + amount);
    this.persist();
  }

  addGems(amount: number): void {
    this.state.gems = Math.max(0, this.state.gems + amount);
    this.persist();
  }

  spendGold(amount: number): boolean {
    if (this.state.gold < amount) return false;
    this.state.gold -= amount;
    this.persist();
    return true;
  }

  spendGems(amount: number): boolean {
    if (this.state.gems < amount) return false;
    this.state.gems -= amount;
    this.persist();
    return true;
  }

  // ---------- Lives ----------
  private regenerateLives(): void {
    if (this.state.lives >= MAX_LIVES) {
      this.state.lastLifeLostAt = null;
      return;
    }
    if (this.state.lastLifeLostAt === null) return;
    const elapsedMs = Date.now() - this.state.lastLifeLostAt;
    const regenMs = LIFE_REGEN_MINUTES * 60 * 1000;
    const gained = Math.floor(elapsedMs / regenMs);
    if (gained > 0) {
      this.state.lives = Math.min(MAX_LIVES, this.state.lives + gained);
      this.state.lastLifeLostAt = this.state.lives >= MAX_LIVES ? null : Date.now() - (elapsedMs % regenMs);
      this.persist();
    }
  }

  consumeLife(): boolean {
    this.regenerateLives();
    if (this.state.lives <= 0) return false;
    this.state.lives -= 1;
    if (this.state.lastLifeLostAt === null) this.state.lastLifeLostAt = Date.now();
    this.persist();
    return true;
  }

  msUntilNextLife(): number {
    if (this.state.lives >= MAX_LIVES || this.state.lastLifeLostAt === null) return 0;
    const regenMs = LIFE_REGEN_MINUTES * 60 * 1000;
    const elapsed = (Date.now() - this.state.lastLifeLostAt) % regenMs;
    return regenMs - elapsed;
  }

  // ---------- Levels ----------
  isLevelUnlocked(levelId: number): boolean {
    return levelId <= this.state.unlockedLevel;
  }

  recordLevelResult(result: LevelResult): void {
    const prev = this.state.levelResults[result.levelId];
    const bestStars = prev ? (Math.max(prev.bestStars, result.stars) as 0 | 1 | 2 | 3) : result.stars;
    this.state.levelResults[result.levelId] = { ...result, bestStars };
    if (result.levelId === this.state.unlockedLevel && result.stars > 0) {
      this.state.unlockedLevel = Math.min(100, this.state.unlockedLevel + 1);
    }
    this.state.totals.coinsCollectedLifetime += result.coinsCollected;
    this.state.totals.enemiesDefeatedLifetime += result.enemiesDefeated;
    this.persist();
  }

  totalStars(): number {
    return Object.values(this.state.levelResults).reduce((sum, r) => sum + r.bestStars, 0);
  }

  levelsCompleted(): number {
    return Object.values(this.state.levelResults).filter((r) => r.bestStars > 0).length;
  }

  // ---------- Outfits ----------
  ownsOutfit(id: string): boolean {
    return this.state.ownedOutfits.includes(id);
  }

  purchaseOutfit(id: string): void {
    if (!this.ownsOutfit(id)) this.state.ownedOutfits.push(id);
    this.persist();
  }

  equipOutfit(id: string): void {
    if (this.ownsOutfit(id)) {
      this.state.equippedOutfit = id;
      this.persist();
    }
  }

  // ---------- Powerups ----------
  powerupLevel(id: string): number {
    return this.state.powerupLevels[id] ?? 0;
  }

  upgradePowerup(id: string): void {
    this.state.powerupLevels[id] = (this.state.powerupLevels[id] ?? 0) + 1;
    this.persist();
  }

  // ---------- Daily Quests ----------
  refreshDailyQuestsIfNeeded(): void {
    if (this.state.dailyQuests.date !== todayKey()) {
      this.state.dailyQuests = { date: todayKey(), quests: pickDailyQuests() };
      this.persist();
    }
  }

  progressDailyQuests(kind: string, amount: number): void {
    let changed = false;
    for (const q of this.state.dailyQuests.quests) {
      const def = DAILY_QUESTS_POOL.find((d) => d.id === q.id);
      if (def && def.kind === kind && !q.claimed) {
        q.progress = Math.min(def.target, q.progress + amount);
        changed = true;
      }
    }
    if (changed) this.persist();
  }

  claimDailyQuest(id: string): boolean {
    const q = this.state.dailyQuests.quests.find((x) => x.id === id);
    const def = DAILY_QUESTS_POOL.find((d) => d.id === id);
    if (!q || !def || q.claimed || q.progress < def.target) return false;
    q.claimed = true;
    this.addGold(def.rewardGold);
    this.addGems(def.rewardGems);
    this.persist();
    return true;
  }

  // ---------- Achievements ----------
  claimAchievement(id: string, rewardGold: number, rewardGems: number): void {
    if (this.state.achievementsClaimed.includes(id)) return;
    this.state.achievementsClaimed.push(id);
    this.addGold(rewardGold);
    this.addGems(rewardGems);
    this.persist();
  }

  // ---------- Settings ----------
  toggleMusic(): void {
    this.state.settings.musicOn = !this.state.settings.musicOn;
    this.persist();
  }

  toggleSfx(): void {
    this.state.settings.sfxOn = !this.state.settings.sfxOn;
    this.persist();
  }
}

export const SaveService = new SaveServiceImpl();
