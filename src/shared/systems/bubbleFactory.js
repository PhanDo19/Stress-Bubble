const DEFAULT_SPEEDS = {
  normal: 60,
  fast: 95,
  golden: 70,
  bomb: 80,
};

const DEFAULT_LIFETIMES = {
  normal: 2.6,
  fast: 1.9,
  golden: 2.4,
  bomb: 2.2,
};

const DEFAULT_RADII = {
  normal: 36,
  fast: 28,
  golden: 40,
  bomb: 34,
};

const TYPES = new Set(['normal', 'fast', 'golden', 'bomb']);

function normalizeType(type) {
  return TYPES.has(type) ? type : 'normal';
}

function getValue(map, config, key) {
  if (config && config[key] && typeof config[key] === 'object') {
    const value = config[key];
    return value;
  }
  return map;
}

function resolveSpeed(type, config) {
  const map = getValue(DEFAULT_SPEEDS, config, 'bubbleSpeed');
  return typeof map[type] === 'number' ? map[type] : DEFAULT_SPEEDS[type];
}

function resolveLifetime(type, config) {
  const map = getValue(DEFAULT_LIFETIMES, config, 'bubbleLifetime');
  return typeof map[type] === 'number' ? map[type] : DEFAULT_LIFETIMES[type];
}

function resolveRadius(type, config) {
  const map = getValue(DEFAULT_RADII, config, 'bubbleRadius');
  return typeof map[type] === 'number' ? map[type] : DEFAULT_RADII[type];
}

function defaultId(rng, now) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const stamp = Math.floor(now());
  const rand = Math.floor(rng() * 1e6);
  return `bubble_${stamp}_${rand}`;
}

export function createBubble(type, options = {}) {
  const {
    id,
    x = 0,
    y = 0,
    vx,
    vy,
    config = null,
    rng = Math.random,
    now = () => Date.now(),
  } = options;

  const resolvedType = normalizeType(type);
  const speed = resolveSpeed(resolvedType, config);
  const lifetime = resolveLifetime(resolvedType, config);
  const radius = resolveRadius(resolvedType, config);

  const bubble = {
    id: id ?? defaultId(rng, now),
    type: resolvedType,
    x,
    y,
    vx: vx ?? 0,
    vy: vy ?? -speed,
    radius,
    lifetime,
  };

  return bubble;
}

export const BUBBLE_TYPES = ['normal', 'fast', 'golden', 'bomb'];
