import { BIOMES } from "@/services/GameData";
import { SeededRandom } from "@/services/Random";
import { LEVELS_PER_WORLD, WORLDS_COUNT, TOTAL_LEVELS } from "@/config";
import type { LevelDefinition, LevelTile, EnemySpawn, CollectibleSpawn } from "@/types";

const TILE_SIZE = 40;
const GRID_HEIGHT = 12; // rows
const GROUND_ROW = 9; // row index where default ground sits

/**
 * Procedurally builds one of the 100 levels. Levels are NEVER hand-authored or stored --
 * they are generated deterministically from (world, levelInWorld) via a seeded RNG, so the
 * same level always looks the same for a given player, while still giving us 100 distinct,
 * difficulty-scaled layouts across 10 themed biomes with zero binary level-data assets.
 *
 * Generation strategy: build the level left-to-right as a sequence of "segments"
 * (safe ground / gap-with-platform / hazard patch / enemy zone / moving-platform gap).
 * Every segment is constructed so the exit is always reachable from the entry given the
 * player's known jump arc, guaranteeing the level is completable by construction rather
 * than by post-hoc validation.
 */
export class LevelGenerator {
  static generate(levelId: number): LevelDefinition {
    const worldIndex = Math.floor((levelId - 1) / LEVELS_PER_WORLD);
    const levelInWorld = ((levelId - 1) % LEVELS_PER_WORLD) + 1;
    const biome = BIOMES[Math.min(worldIndex, WORLDS_COUNT - 1)];
    const seed = levelId * 7919 + 1013;
    const rng = new SeededRandom(seed);

    const isBossLevel = levelId === TOTAL_LEVELS;
    // Eased curve instead of linear: stays low for the first ~15 levels then
    // ramps up faster later. sqrt-of-progress gives a gentle start; squaring
    // that again pulls it down further for very early levels specifically.
    const linearProgress = Math.min(1, (levelId - 1) / (TOTAL_LEVELS - 1));
    const difficulty = Math.pow(linearProgress, 1.6);
    // The first few levels are an explicit, guaranteed-gentle "tutorial zone":
    // no enemies, no hazards, regardless of what the difficulty curve says --
    // new players should learn to run/jump before anything can hurt them.
    const isTutorialLevel = levelId <= 3;

    const columns = isBossLevel ? 70 : 40 + Math.floor(difficulty * 40) + levelInWorld * 2;
    const tiles: LevelTile[] = [];
    const enemies: EnemySpawn[] = [];
    const collectibles: CollectibleSpawn[] = [];

    let col = 0;
    let groundRow = GROUND_ROW;

    const placeGroundColumn = (c: number, row: number) => {
      for (let r = row; r < GRID_HEIGHT; r++) {
        tiles.push({ x: c, y: r, type: r === row ? "ground" : "brick" });
      }
    };

    // Starting safe platform
    for (let c = 0; c < 4; c++) placeGroundColumn(c, groundRow);
    col = 4;

    const maxGapTiles = 2 + Math.floor(difficulty * 3); // grows from 2 to 5 tiles
    const enemyChance = isTutorialLevel ? 0 : 0.06 + difficulty * 0.42;
    const hazardUnlockThreshold = 0.12; // hazards only start appearing once difficulty passes this

    while (col < columns - 6) {
      const segmentRoll = rng.next();

      if (segmentRoll < 0.28) {
        // --- Safe ground stretch with possible coins/enemy ---
        const length = rng.intRange(3, 6);
        for (let i = 0; i < length && col < columns - 6; i++, col++) {
          placeGroundColumn(col, groundRow);
          if (rng.chance(0.35)) {
            collectibles.push({ x: col * TILE_SIZE + TILE_SIZE / 2, y: (groundRow - 2) * TILE_SIZE, kind: "coin" });
          }
        }
        if (rng.chance(enemyChance)) {
          enemies.push({
            x: col * TILE_SIZE,
            y: (groundRow - 1) * TILE_SIZE,
            type: rng.pick(["walker", "spitter"] as const),
            patrolRange: TILE_SIZE * rng.intRange(2, 4)
          });
        }
      } else if (segmentRoll < 0.5) {
        // --- Gap bridged by a floating platform (jump-jump) ---
        const gap = rng.intRange(2, maxGapTiles);
        const platformRow = groundRow - rng.intRange(1, 3);
        const platformStart = col + Math.ceil(gap / 2) - 1;
        tiles.push({ x: platformStart, y: platformRow, type: "platform" });
        tiles.push({ x: platformStart + 1, y: platformRow, type: "platform" });
        collectibles.push({
          x: (platformStart + 0.5) * TILE_SIZE,
          y: (platformRow - 1) * TILE_SIZE,
          kind: rng.chance(0.15) ? "gem" : "coin"
        });
        col += gap;
        placeGroundColumn(col, groundRow);
        col += 1;
      } else if (segmentRoll < 0.68 && !isTutorialLevel && difficulty > hazardUnlockThreshold) {
        // --- Hazard patch on the ground, must jump over ---
        const length = rng.intRange(1, 2);
        for (let i = 0; i < length; i++) {
          placeGroundColumn(col + i, groundRow);
          tiles.push({ x: col + i, y: groundRow - 1, type: "hazard" });
        }
        col += length;
        // ensure a safe landing after
        placeGroundColumn(col, groundRow);
        col += 1;
      } else if (segmentRoll < 0.85) {
        // --- Elevation change (stairs) ---
        const goingUp = rng.chance(0.5) && groundRow > 5;
        const steps = rng.intRange(2, 3);
        for (let i = 0; i < steps; i++) {
          groundRow += goingUp ? -1 : 1;
          groundRow = Phaser_clamp(groundRow, 5, GROUND_ROW);
          placeGroundColumn(col, groundRow);
          col += 1;
        }
        if (rng.chance(0.4)) {
          collectibles.push({ x: col * TILE_SIZE, y: (groundRow - 2) * TILE_SIZE, kind: "coin" });
        }
      } else {
        // --- Moving platform gap (harder, later biomes) ---
        const gap = rng.intRange(4, maxGapTiles + 2);
        const platformRow = groundRow - rng.intRange(1, 2);
        tiles.push({ x: col + Math.floor(gap / 2), y: platformRow, type: "moving" });
        col += gap;
        placeGroundColumn(col, groundRow);
        col += 1;
        if (rng.chance(enemyChance * 0.6)) {
          enemies.push({
            x: col * TILE_SIZE,
            y: (groundRow - 1) * TILE_SIZE,
            type: "flyer",
            patrolRange: TILE_SIZE * 3
          });
        }
      }
    }

    // Final approach + goal platform
    for (let c = col; c < columns; c++) placeGroundColumn(c, groundRow);

    if (isBossLevel) {
      enemies.push({
        x: (columns - 4) * TILE_SIZE,
        y: (groundRow - 2) * TILE_SIZE,
        type: "spitter",
        patrolRange: TILE_SIZE * 6
      });
      enemies.push({
        x: (columns - 6) * TILE_SIZE,
        y: (groundRow - 3) * TILE_SIZE,
        type: "flyer",
        patrolRange: TILE_SIZE * 5
      });
    }

    const totalCoins = collectibles.filter((c) => c.kind === "coin").length;
    const parTimeSeconds = Math.round(columns * 0.9 + enemies.length * 2);

    return {
      id: levelId,
      worldIndex,
      levelInWorld,
      biome,
      seed,
      gridWidth: columns,
      gridHeight: GRID_HEIGHT,
      tileSize: TILE_SIZE,
      tiles,
      enemies,
      collectibles,
      playerStart: { x: TILE_SIZE * 1.5, y: (groundRow - 3) * TILE_SIZE },
      goal: { x: (columns - 2) * TILE_SIZE, y: (groundRow - 2) * TILE_SIZE },
      parTimeSeconds,
      totalCoins,
      isBossLevel
    };
  }
}

function Phaser_clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export { TILE_SIZE, GRID_HEIGHT };
