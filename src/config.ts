export const GAME_TITLE = "حمودي";
export const GAME_SUBTITLE = "رحلة البطل العربي";
export const GAME_VERSION = "1.0";
export const GAME_YEAR = "2026";
export const DEVELOPER_NAME = "بلال النعيمي";
export const MADE_IN = "صنع في العراق";

// The virtual resolution is computed to match the device's actual viewport
// aspect ratio at boot time, instead of a fixed 800x450. This is what fixes
// "black bars" / incomplete-looking screens on phones with a different
// aspect ratio than 16:9 -- Phaser's Scale.FIT mode only avoids letterboxing
// when the design resolution's aspect ratio already matches the viewport's.
// Height is pinned at 450 (our whole UI/gameplay layout was tuned against
// it) and width stretches/shrinks to match, so every existing `DESIGN_WIDTH`
// reference throughout the codebase keeps working with zero other changes.
const FALLBACK_ASPECT = 16 / 9; // used if window is unavailable (SSR/build time)
function computeDesignWidth(height: number): number {
  if (typeof window === "undefined" || !window.innerWidth || !window.innerHeight) {
    return Math.round(height * FALLBACK_ASPECT);
  }
  const aspect = window.innerWidth / window.innerHeight;
  // clamp so extremely narrow/ultra-wide windows (e.g. a resized desktop
  // browser tab) don't distort gameplay into an unplayable sliver
  const clampedAspect = Math.max(1.4, Math.min(2.6, aspect));
  return Math.round(height * clampedAspect);
}

export const DESIGN_HEIGHT = 450;
export const DESIGN_WIDTH = computeDesignWidth(DESIGN_HEIGHT);

export const WORLDS_COUNT = 10;
export const LEVELS_PER_WORLD = 5;
export const TOTAL_LEVELS = WORLDS_COUNT * LEVELS_PER_WORLD;

export const STORAGE_KEY = "hamoudi_save_v1_0";

export const PHYSICS = {
  gravityY: 1400,
  playerSpeed: 210,
  playerRunSpeed: 300,
  jumpVelocity: -560,
  wallJumpVelocityX: 380,
  wallSlideMaxSpeed: 120,
  abilityDashSpeed: 620,
  // --- Movement feel tuning (acceleration-based instead of instant-snap) ---
  groundAcceleration: 2200, // px/s^2 while a direction is held
  groundFriction: 2600, // px/s^2 pull-back toward 0 when no direction is held
  airAcceleration: 1400, // slightly floatier control while airborne, like most platformers
  // --- Jump forgiveness windows (standard "game feel" techniques) ---
  coyoteTimeMs: 110, // grace period to still jump just after walking off a ledge
  jumpBufferMs: 130 // a jump press slightly before landing still fires on landing
};

export const STARTING_LIVES = 5;
export const MAX_LIVES = 9;
export const LIFE_REGEN_MINUTES = 20;
