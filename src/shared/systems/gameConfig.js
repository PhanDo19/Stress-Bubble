export const DEFAULT_SETTINGS = {
  sfx: true,
  music: true,
  vibe: false,
  muteAudio: false,
  reducedMotion: false,
  highContrast: false,
  sfxVolume: 0.8,
  musicVolume: 0.4,
  musicStyle: 'chill',
  difficulty: 'normal',
};

export const CONFIG_BASE = {
  spawnInterval: {
    classic: { min: 450, max: 900 },
    rage: { min: 250, max: 550 },
    zen: { min: 600, max: 1100 },
  },
  bubbleSpeed: {
    normal: 60,
    fast: 95,
    golden: 70,
    bomb: 80,
  },
  bubbleLifetime: {
    normal: 2.6,
    fast: 1.9,
    golden: 2.4,
    bomb: 2.2,
  },
  spawnRates: {
    normal: 0.7,
    fast: 0.15,
    golden: 0.05,
    bomb: 0.1,
  },
  comboWindowMs: 1200,
  stressValues: {
    miss: 8,
    hit: -3,
    bomb: 12,
  },
  maxBubbles: 12,
  maxParticles: 30,
  maxFloatingTexts: 24,
  reducedMotion: false,
  highContrast: false,
};

function cloneMap(map) {
  return { ...map };
}

function createEmptyConfig() {
  return {
    spawnInterval: {},
    bubbleSpeed: {},
    bubbleLifetime: {},
    spawnRates: {},
    comboWindowMs: 0,
    stressValues: {},
    maxBubbles: 0,
    maxParticles: 0,
    maxFloatingTexts: 0,
    reducedMotion: false,
    highContrast: false,
  };
}

function resetConfig(target, base) {
  target.spawnInterval = {
    classic: { ...base.spawnInterval.classic },
    rage: { ...base.spawnInterval.rage },
    zen: { ...base.spawnInterval.zen },
  };
  target.bubbleSpeed = cloneMap(base.bubbleSpeed);
  target.bubbleLifetime = cloneMap(base.bubbleLifetime);
  target.spawnRates = cloneMap(base.spawnRates);
  target.comboWindowMs = base.comboWindowMs;
  target.stressValues = cloneMap(base.stressValues);
  target.maxBubbles = base.maxBubbles;
  target.maxParticles = base.maxParticles;
  target.maxFloatingTexts = base.maxFloatingTexts;
  target.reducedMotion = !!base.reducedMotion;
  target.highContrast = !!base.highContrast;
}

function scaleMap(map, factor) {
  const next = {};
  for (const [key, value] of Object.entries(map)) {
    next[key] = Number(value) * factor;
  }
  return next;
}

export function normalizeSettings(settings) {
  const next = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  if (!['easy', 'normal', 'hard'].includes(next.difficulty)) {
    next.difficulty = 'normal';
  }
  next.sfx = !!next.sfx;
  next.music = !!next.music;
  next.vibe = !!next.vibe;
  next.muteAudio = !!next.muteAudio;
  next.reducedMotion = !!next.reducedMotion;
  next.highContrast = !!next.highContrast;
  next.sfxVolume = Math.max(0, Math.min(1, Number(next.sfxVolume)));
  next.musicVolume = Math.max(0, Math.min(1, Number(next.musicVolume)));
  if (!['chill', 'hiphop', 'minimal'].includes(next.musicStyle)) {
    next.musicStyle = 'chill';
  }
  return next;
}

export function applyDifficulty(config, base, difficulty) {
  resetConfig(config, base);

  if (difficulty === 'easy') {
    config.spawnInterval = {
      classic: {
        min: base.spawnInterval.classic.min * 1.2,
        max: base.spawnInterval.classic.max * 1.2,
      },
      rage: {
        min: base.spawnInterval.rage.min * 1.2,
        max: base.spawnInterval.rage.max * 1.2,
      },
      zen: {
        min: base.spawnInterval.zen.min * 1.2,
        max: base.spawnInterval.zen.max * 1.2,
      },
    };
    config.bubbleSpeed = scaleMap(base.bubbleSpeed, 0.85);
    config.bubbleLifetime = scaleMap(base.bubbleLifetime, 1.15);
    config.maxBubbles = Math.max(8, Math.round(base.maxBubbles * 0.85));
  } else if (difficulty === 'hard') {
    config.spawnInterval = {
      classic: {
        min: base.spawnInterval.classic.min * 0.8,
        max: base.spawnInterval.classic.max * 0.8,
      },
      rage: {
        min: base.spawnInterval.rage.min * 0.8,
        max: base.spawnInterval.rage.max * 0.8,
      },
      zen: {
        min: base.spawnInterval.zen.min * 0.8,
        max: base.spawnInterval.zen.max * 0.8,
      },
    };
    config.bubbleSpeed = scaleMap(base.bubbleSpeed, 1.2);
    config.bubbleLifetime = scaleMap(base.bubbleLifetime, 0.9);
    config.maxBubbles = Math.max(base.maxBubbles, Math.round(base.maxBubbles * 1.2));
  }
}

export function applyAccessibility(config, settings) {
  config.reducedMotion = !!settings?.reducedMotion;
  config.highContrast = !!settings?.highContrast;
}

export function createGameConfig(settings, base = CONFIG_BASE) {
  const config = createEmptyConfig();
  const normalized = normalizeSettings(settings);
  applyDifficulty(config, base, normalized.difficulty);
  applyAccessibility(config, normalized);
  return config;
}

export function syncGameConfig(config, settings, base = CONFIG_BASE) {
  const normalized = normalizeSettings(settings);
  applyDifficulty(config, base, normalized.difficulty);
  applyAccessibility(config, normalized);
  return config;
}
