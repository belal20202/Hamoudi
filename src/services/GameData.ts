import type {
  BiomeTheme,
  OutfitDefinition,
  PowerupDefinition,
  DailyQuestDefinition,
  AchievementDefinition
} from "@/types";
import { TOTAL_LEVELS } from "@/config";
import { SeededRandom } from "@/services/Random";

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

/**
 * 100 outfits, generated rather than hand-typed one by one -- each is still
 * just a recolor of the same in-game character silhouette (this game draws
 * everything procedurally, there's no per-outfit garment art), but the
 * color palette and Arabic naming are systematic and deliberately varied
 * rather than random noise. Deterministic (seeded), so this list is stable
 * across app restarts and rebuilds.
 *
 * Structure: 1 free default + 54 gold-priced outfits (100 -> ~6000 gold,
 * increasing) + 45 gem-priced "special" outfits (5 -> ~180 gems, increasing).
 */
function generateOutfits(): OutfitDefinition[] {
  const outfits: OutfitDefinition[] = [
    { id: "default", nameAr: "الزي التقليدي", priceGold: 0, priceGems: 0, tint: 0xffffff }
  ];

  const titlesGold = [
    "المستكشف", "الفارس", "الحارس", "الصياد", "التاجر", "البدوي", "القائد",
    "البطل", "الراوي", "الحكيم", "الملاح", "الفلاح", "الراعي", "الرحالة",
    "الشجاع", "الوفي", "الكريم", "الأمين", "الجريء", "الصامد", "الطموح",
    "النبيل", "الشهم", "الصادق", "الوثاب", "المغوار", "الظافر"
  ];
  const titlesGem = [
    "السلطان", "الأمير", "الملك", "القائد الأعلى", "الأسطورة", "الفاتح",
    "التاج", "الماسي", "الملكي", "الإمبراطور", "النجم", "الخالد", "المعجزة",
    "الأسطوري", "الذهبي الأعظم", "البطل الخارق", "الفارس الملكي", "الحارس الأعلى"
  ];
  const colorNames: { nameAr: string; tint: number }[] = [
    { nameAr: "الذهبي", tint: 0xf5c542 },
    { nameAr: "الفضي", tint: 0xc9ccd1 },
    { nameAr: "الأزرق", tint: 0x3f7fd1 },
    { nameAr: "الأخضر", tint: 0x3f9f5c },
    { nameAr: "الأحمر", tint: 0xcf4b3c },
    { nameAr: "البنفسجي", tint: 0x8a5cc2 },
    { nameAr: "الفيروزي", tint: 0x3fc2c2 },
    { nameAr: "الوردي", tint: 0xe07fa0 },
    { nameAr: "البرتقالي", tint: 0xe0812f },
    { nameAr: "الأسود", tint: 0x3a3a42 },
    { nameAr: "الأبيض", tint: 0xf0ece0 },
    { nameAr: "الكهرماني", tint: 0xd4901a },
    { nameAr: "الزمردي", tint: 0x2f9e6e },
    { nameAr: "الياقوتي", tint: 0xb02040 },
    { nameAr: "السماوي", tint: 0x6fc2e0 },
    { nameAr: "الليلكي", tint: 0xb08fd8 },
    { nameAr: "الرملي", tint: 0xd6b877 },
    { nameAr: "الزيتي", tint: 0x7a8f3f }
  ];

  const rng = new SeededRandom(90210);

  let goldPrice = 100;
  for (let i = 0; i < 54; i++) {
    const color = colorNames[i % colorNames.length];
    const title = titlesGold[i % titlesGold.length];
    outfits.push({
      id: `gold_outfit_${i + 1}`,
      nameAr: `زي ${title} ${color.nameAr}`,
      priceGold: Math.round(goldPrice / 10) * 10,
      priceGems: 0,
      tint: shadeTint(color.tint, rng.range(-12, 12))
    });
    goldPrice += 90 + i * 8; // ramps from 100 up to roughly 6000
  }

  let gemPrice = 5;
  for (let i = 0; i < 45; i++) {
    const color = colorNames[(i + 5) % colorNames.length];
    const title = titlesGem[i % titlesGem.length];
    outfits.push({
      id: `gem_outfit_${i + 1}`,
      nameAr: `زي ${title} ${color.nameAr}`,
      priceGold: 0,
      priceGems: Math.max(5, Math.round(gemPrice)),
      tint: shadeTint(color.tint, rng.range(-15, 15))
    });
    gemPrice += 3.8; // ramps from 5 up to roughly 180
  }

  return outfits;
}

function shadeTint(color: number, percent: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const adjust = (c: number) => Math.max(0, Math.min(255, Math.round(c + (percent / 100) * 255)));
  return (adjust(r) << 16) | (adjust(g) << 8) | adjust(b);
}

export const OUTFITS: OutfitDefinition[] = generateOutfits();

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
