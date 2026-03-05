import { createBubble, BUBBLE_TYPES } from './bubbleFactory.js';

const DEFAULT_MAX_BUBBLES = 12;
const DEFAULT_RATES = {
  normal: 0.7,
  fast: 0.15,
  golden: 0.05,
  bomb: 0.1,
};

const DEFAULT_INTERVALS = {
  classic: { min: 450, max: 900 },
  rage: { min: 250, max: 550 },
  zen: { min: 600, max: 1100 },
};

const DEFAULT_BOUNDS = { width: 800, height: 600 };

function getBounds(state) {
  if (state && Number.isFinite(state.worldWidth) && Number.isFinite(state.worldHeight)) {
    return { width: state.worldWidth, height: state.worldHeight };
  }
  if (state && state.bounds && Number.isFinite(state.bounds.width)) {
    return state.bounds;
  }
  if (state && state.viewport && Number.isFinite(state.viewport.width)) {
    return state.viewport;
  }
  if (state && state.canvas && Number.isFinite(state.canvas.width)) {
    return state.canvas;
  }
  if (state && state.config && state.config.bounds) return state.config.bounds;
  return DEFAULT_BOUNDS;
}

function normalizeMode(state) {
  const mode = state && state.mode ? String(state.mode).toLowerCase() : 'classic';
  if (mode === 'rage' || mode === 'zen') return mode;
  return 'classic';
}

function resolveIntervals(config) {
  if (!config || !config.spawnInterval) return DEFAULT_INTERVALS;
  const value = config.spawnInterval;
  if (typeof value.min === 'number' && typeof value.max === 'number') {
    return {
      classic: { min: value.min, max: value.max },
      rage: { min: value.min, max: value.max },
      zen: { min: value.min, max: value.max },
    };
  }
  return {
    classic: value.classic || DEFAULT_INTERVALS.classic,
    rage: value.rage || DEFAULT_INTERVALS.rage,
    zen: value.zen || DEFAULT_INTERVALS.zen,
  };
}

function resolveRates(config) {
  if (config && config.spawnRates) return config.spawnRates;
  return DEFAULT_RATES;
}

function selectType(rates, rng) {
  const roll = rng();
  let total = 0;
  for (const type of BUBBLE_TYPES) {
    const weight = Number(rates[type]) || 0;
    total += weight;
    if (roll <= total) return type;
  }
  return 'normal';
}

function nextIntervalMs(intervals, mode, rng) {
  const range = intervals[mode] || intervals.classic || DEFAULT_INTERVALS.classic;
  const min = Number(range.min) || DEFAULT_INTERVALS.classic.min;
  const max = Number(range.max) || DEFAULT_INTERVALS.classic.max;
  if (max <= min) return min;
  return min + rng() * (max - min);
}

function distanceSq(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function findSpawnPosition(bubbles, bounds, radius, rng) {
  const attempts = 12;
  for (let i = 0; i < attempts; i += 1) {
    const x = radius + rng() * (bounds.width - radius * 2);
    const y = bounds.height + radius;
    let overlaps = false;
    for (const bubble of bubbles) {
      const minDist = radius + bubble.radius + 6;
      if (distanceSq(x, y, bubble.x, bubble.y) < minDist * minDist) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps) return { x, y };
  }
  return null;
}

function getSpawnState(state) {
  if (state && state.spawn && typeof state.spawn === 'object') return state.spawn;
  return { nextIntervalMs: 0 };
}

export function spawnBubble(gameState, deltaTimeMs = 0) {
  if (!gameState) return gameState;
  const deltaMs = Number.isFinite(deltaTimeMs) ? deltaTimeMs : 0;

  const rng = typeof gameState.rng === 'function' ? gameState.rng : Math.random;
  const config = gameState.config || null;
  const maxBubbles =
    typeof config?.maxBubbles === 'number' ? config.maxBubbles : DEFAULT_MAX_BUBBLES;

  const bubbles = Array.isArray(gameState.bubbles) ? gameState.bubbles : [];
  if (bubbles.length >= maxBubbles) return gameState;

  const spawnState = getSpawnState(gameState);
  const intervals = resolveIntervals(config);
  const mode = normalizeMode(gameState);

  let nextIntervalMsValue = spawnState.nextIntervalMs;
  if (!Number.isFinite(nextIntervalMsValue) || nextIntervalMsValue <= 0) {
    nextIntervalMsValue = nextIntervalMs(intervals, mode, rng);
  }

  const currentTimer = Number.isFinite(gameState.spawnTimer)
    ? gameState.spawnTimer
    : 0;
  const updatedTimer = currentTimer + deltaMs;
  if (updatedTimer < nextIntervalMsValue) {
    return {
      ...gameState,
      spawnTimer: updatedTimer,
      spawn: {
        ...spawnState,
        nextIntervalMs: nextIntervalMsValue,
      },
    };
  }

  const rates = resolveRates(config);
  const type = selectType(rates, rng);
  const bounds = getBounds(gameState);
  const probe = createBubble(type, { config });
  const position = findSpawnPosition(bubbles, bounds, probe.radius, rng);
  if (!position) return gameState;

  const bubble = createBubble(type, {
    x: position.x,
    y: position.y,
    config,
    rng,
    now: gameState.now,
  });

  return {
    ...gameState,
    bubbles: [...bubbles, bubble],
    spawnTimer: 0,
    spawn: {
      nextIntervalMs: nextIntervalMs(intervals, mode, rng),
    },
  };
}
