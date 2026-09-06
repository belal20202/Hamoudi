import type {
  BiomeTheme,
  OutfitDefinition,
  PowerupDefinition,
  DailyQuestDefinition,
  AchievementDefinition
} from "@/types";
import { TOTAL_LEVELS } from "@/config";

export const BIOMES: BiomeTheme[] = [
  {
    id: "arabian_city",
    nameAr: "المدينة العربية",
    skyTop: 0x8ec9ff,
    skyBottom: 0xfdf1c8,
    groundColor: 0xd7a866,
    groundAccent: 0xb9834a,
    platformColor: 0xe8c48a,
    hazardColor: 0xcf4b3c,
    decorColor: 0x7f5a3a
  },
  {
    id: "golden_desert",
    nameAr: "الصحراء الذهبية",
    skyTop: 0xffd98a,
    skyBottom: 0xffedc2,
    groundColor: 0xe8c165,
    groundAccent: 0xcf9f3f,
    platformColor: 0xf2d78b,
    hazardColor: 0xb5651d,
    decorColor: 0xcaa24a,
    hasSand: true
  },
  {
    id: "palm_oasis",
    nameAr: "واحة النخيل",
    skyTop: 0x8fe0ff,
    skyBottom: 0xd8f9ee,
    groundColor: 0x6fbf73,
    groundAccent: 0x4d9950,
    platformColor: 0x9adf8a,
    hazardColor: 0x2f8f8f,
    decorColor: 0x2e7d32
  },
  {
    id: "ancient_castle",
    nameAr: "القلعة القديمة",
    skyTop: 0x6f7fa8,
    skyBottom: 0xb8c2d8,
    groundColor: 0x8a8a92,
    groundAccent: 0x6a6a72,
    platformColor: 0xa3a3ab,
    hazardColor: 0x8b1e1e,
    decorColor: 0x5a5a62
  },
  {
    id: "heritage_town",
    nameAr: "المدينة التراثية",
    skyTop: 0xffcf9e,
    skyBottom: 0xffe8c9,
    groundColor: 0xc98a55,
    groundAccent: 0xa66b3d,
    platformColor: 0xdba876,
    hazardColor: 0xb5451f,
    decorColor: 0x8a5a34
  },
  {
    id: "secret_caves",
    nameAr: "الكهوف السرية",
    skyTop: 0x241a3a,
    skyBottom: 0x3a2a5a,
    groundColor: 0x4a3f5c,
    groundAccent: 0x362d47,
    platformColor: 0x5c4f73,
    hazardColor: 0x7ad1ff,
    decorColor: 0x8a7ba8,
    isNight: true
  },
  {
    id: "night_city",
    nameAr: "المدينة الليلية",
    skyTop: 0x0e1230,
    skyBottom: 0x261b4a,
    groundColor: 0x2c2c44,
    groundAccent: 0x1e1e33,
    platformColor: 0x3d3d5c,
    hazardColor: 0xff4fa0,
    decorColor: 0xffd54f,
    isNight: true
  },
  {
    id: "snowy_mountains",
    nameAr: "الجبال العربية",
    skyTop: 0xcfe8ff,
    skyBottom: 0xf3fbff,
    groundColor: 0xe8f4ff,
    groundAccent: 0xc3ddf2,
    platformColor: 0xffffff,
    hazardColor: 0x4a90c2,
    decorColor: 0x9db8cc,
    hasSnow: true
  },
  {
    id: "ancient_ruins",
    nameAr: "الأطلال القديمة",
    skyTop: 0xd9b98a,
    skyBottom: 0xf0dcb8,
    groundColor: 0xa68a63,
    groundAccent: 0x8a6f4d,
    platformColor: 0xc2a67d,
    hazardColor: 0x6b8e4e,
    decorColor: 0x7a6142
  },
  {
    id: "hamoudi_kingdom",
    nameAr: "مملكة حمودي",
    skyTop: 0x2a1a4a,
    skyBottom: 0x6a2a6a,
    groundColor: 0x8a3fa0,
    groundAccent: 0x6a2f80,
    platformColor: 0xd4af37,
    hazardColor: 0xff3b3b,
    decorColor: 0xf5c542,
    isNight: true
  }
];

export const OUTFITS: OutfitDefinition[] = [
  { id: "default", nameAr: "الزي التقليدي", priceGold: 0, priceGems: 0, tint: 0xffffff },
  { id: "desert_explorer", nameAr: "زي المستكشف الصحراوي", priceGold: 300, priceGems: 0, tint: 0xf2d78b },
  { id: "castle_guard", nameAr: "زي حارس القلعة", priceGold: 500, priceGems: 0, tint: 0x8a8a92 },
  { id: "night_ninja", nameAr: "زي النينجا الليلي", priceGold: 0, priceGems: 40, tint: 0x3d3d5c },
  { id: "mountain_hero", nameAr: "زي بطل الجبال", priceGold: 0, priceGems: 60, tint: 0xdff0ff },
  { id: "golden_king", nameAr: "زي الملك الذهبي", priceGold: 0, priceGems: 120, tint: 0xd4af37 }
];

export const POWERUPS: PowerupDefinition[] = [
  { id: "double_jump", nameAr: "القفزة المزدوجة", descriptionAr: "اقفز مرة إضافية في الهواء", priceGems: 30, maxLevel: 1 },
  { id: "shield", nameAr: "الدرع الواقي", descriptionAr: "امتصاص ضربة واحدة من الأعداء", priceGems: 25, maxLevel: 3 },
  { id: "speed_boost", nameAr: "زيادة السرعة", descriptionAr: "يزيد من سرعة الجري", priceGems: 20, maxLevel: 3 },
  { id: "magnet", nameAr: "مغناطيس العملات", descriptionAr: "يجذب العملات القريبة تلقائياً", priceGems: 35, maxLevel: 2 },
  { id: "dash", nameAr: "الاندفاع السريع", descriptionAr: "اندفاع أفقي سريع لتفادي الأعداء", priceGems: 40, maxLevel: 1 }
];

export const DAILY_QUESTS_POOL: DailyQuestDefinition[] = [
  { id: "dq_coins_50", descriptionAr: "اجمع 50 عملة ذهبية", target: 50, rewardGold: 40, rewardGems: 2, kind: "collect_coins" },
  { id: "dq_coins_150", descriptionAr: "اجمع 150 عملة ذهبية", target: 150, rewardGold: 100, rewardGems: 5, kind: "collect_coins" },
  { id: "dq_enemies_10", descriptionAr: "اهزم 10 أعداء", target: 10, rewardGold: 60, rewardGems: 3, kind: "defeat_enemies" },
  { id: "dq_enemies_25", descriptionAr: "اهزم 25 عدو", target: 25, rewardGold: 120, rewardGems: 6, kind: "defeat_enemies" },
  { id: "dq_levels_3", descriptionAr: "أكمل 3 مراحل", target: 3, rewardGold: 90, rewardGems: 4, kind: "complete_levels" },
  { id: "dq_gems_5", descriptionAr: "اجمع 5 جواهر", target: 5, rewardGold: 30, rewardGems: 3, kind: "collect_gems" }
];

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "ach_coins_500", nameAr: "جامع الذهب", descriptionAr: "اجمع 500 عملة إجمالاً", target: 500, kind: "total_coins", rewardGold: 100, rewardGems: 5 },
  { id: "ach_coins_5000", nameAr: "سيد الكنوز", descriptionAr: "اجمع 5000 عملة إجمالاً", target: 5000, kind: "total_coins", rewardGold: 500, rewardGems: 20 },
  { id: "ach_levels_10", nameAr: "بداية المغامرة", descriptionAr: "أكمل 10 مراحل", target: 10, kind: "levels_completed", rewardGold: 150, rewardGems: 10 },
  { id: "ach_levels_50", nameAr: "بطل منتصف الطريق", descriptionAr: "أكمل 50 مرحلة", target: 50, kind: "levels_completed", rewardGold: 400, rewardGems: 25 },
  { id: "ach_levels_100", nameAr: "بطل حمودي الأسطوري", descriptionAr: `أكمل جميع المراحل الـ ${TOTAL_LEVELS}`, target: TOTAL_LEVELS, kind: "levels_completed", rewardGold: 1000, rewardGems: 100 },
  { id: "ach_stars_100", nameAr: "صياد النجوم", descriptionAr: "احصل على 100 نجمة", target: 100, kind: "total_stars", rewardGold: 300, rewardGems: 15 },
  { id: "ach_enemies_100", nameAr: "قاهر الأعداء", descriptionAr: "اهزم 100 عدو", target: 100, kind: "enemies_defeated", rewardGold: 250, rewardGems: 15 }
];
