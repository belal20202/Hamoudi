export type BiomeId =
  | "arabian_city"
  | "golden_desert"
  | "palm_oasis"
  | "ancient_castle"
  | "heritage_town"
  | "secret_caves"
  | "night_city"
  | "snowy_mountains"
  | "ancient_ruins"
  | "hamoudi_kingdom";

export interface BiomeTheme {
  id: BiomeId;
  nameAr: string;
  skyTop: number;
  skyBottom: number;
  groundColor: number;
  groundAccent: number;
  platformColor: number;
  hazardColor: number;
  decorColor: number;
  hasSnow?: boolean;
  hasSand?: boolean;
  isNight?: boolean;
}

export type TileType = "empty" | "ground" | "platform" | "hazard" | "moving" | "brick" | "goal";

export interface LevelTile {
  x: number; // grid column
  y: number; // grid row
  type: TileType;
}

export interface EnemySpawn {
  x: number;
  y: number;
  type: "walker" | "flyer" | "spitter";
  patrolRange: number;
}

export interface CollectibleSpawn {
  x: number;
  y: number;
  kind: "coin" | "gem";
}

export interface LevelDefinition {
  id: number; // 1..100
  worldIndex: number; // 0..9
  levelInWorld: number; // 1..10
  biome: BiomeTheme;
  seed: number;
  gridWidth: number;
  gridHeight: number;
  tileSize: number;
  tiles: LevelTile[];
  enemies: EnemySpawn[];
  collectibles: CollectibleSpawn[];
  playerStart: { x: number; y: number };
  goal: { x: number; y: number };
  parTimeSeconds: number;
  totalCoins: number;
  isBossLevel: boolean;
}

export interface LevelResult {
  levelId: number;
  stars: 0 | 1 | 2 | 3;
  coinsCollected: number;
  enemiesDefeated: number;
  timeSeconds: number;
  bestStars: 0 | 1 | 2 | 3;
}

export interface OutfitDefinition {
  id: string;
  nameAr: string;
  priceGold: number;
  priceGems: number;
  tint: number;
}

export interface PowerupDefinition {
  id: string;
  nameAr: string;
  descriptionAr: string;
  priceGems: number;
  maxLevel: number;
}

export interface DailyQuestDefinition {
  id: string;
  descriptionAr: string;
  target: number;
  rewardGold: number;
  rewardGems: number;
  kind: "collect_coins" | "defeat_enemies" | "complete_levels" | "collect_gems";
}

export interface AchievementDefinition {
  id: string;
  nameAr: string;
  descriptionAr: string;
  target: number;
  kind: "total_coins" | "total_stars" | "levels_completed" | "enemies_defeated";
  rewardGold: number;
  rewardGems: number;
}

export interface SaveState {
  version: string;
  gold: number;
  gems: number;
  lives: number;
  lastLifeLostAt: number | null;
  unlockedLevel: number; // highest unlocked level id
  levelResults: Record<number, LevelResult>;
  ownedOutfits: string[];
  equippedOutfit: string;
  powerupLevels: Record<string, number>;
  dailyQuests: {
    date: string;
    quests: { id: string; progress: number; claimed: boolean }[];
  };
  achievementsClaimed: string[];
  totals: {
    coinsCollectedLifetime: number;
    gemsCollectedLifetime: number;
    enemiesDefeatedLifetime: number;
  };
  settings: {
    musicOn: boolean;
    sfxOn: boolean;
  };
}
