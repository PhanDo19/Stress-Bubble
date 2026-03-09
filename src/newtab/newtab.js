import { createGameEngine } from '../shared/engine/gameEngine.js';
import { renderFrame } from '../shared/render/renderer.js';
import { bindInputs } from '../shared/ui/input.js';
import { renderHome, renderShop } from '../shared/ui/screens/homeScreen.js';
import { renderResult } from '../shared/ui/screens/resultScreen.js';
import {
  loadBestScores,
  loadCoins,
  loadStreak,
  loadDaily,
  loadShop,
  loadSettings,
  loadTutorial,
  loadAchievements,
  save,
  saveBestScore,
  saveShop,
  saveSettings,
  saveTutorial,
  saveAchievements,
  clearAll,
} from '../shared/storage/storage.js';
import { getTodayKey, getDailyChallenge, evaluateDailyProgress } from '../shared/systems/dailySystem.js';
import { updateStreak } from '../shared/systems/streakSystem.js';
import { coinsForRun } from '../shared/systems/coinSystem.js';
import { setupHiDPICanvas } from '../shared/render/canvasScale.js';
import { buyItem } from '../shared/ui/shopSystem.js';
import { createAudioManager } from '../shared/audio/audioManager.js';
import { evaluateAchievements } from '../shared/systems/achievementSystem.js';

const DEFAULT_SETTINGS = {
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

const CONFIG_BASE = {
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

const CONFIG = {
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

function cloneMap(map) {
  return { ...map };
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

function applyDifficulty(config, base, difficulty) {
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

function applyAccessibility(config, settings) {
  config.reducedMotion = !!settings?.reducedMotion;
  config.highContrast = !!settings?.highContrast;
}

function normalizeSettings(settings) {
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

function createLayout() {
  const root = document.createElement('div');
  root.style.display = 'flex';
  root.style.width = '100%';
  root.style.height = '100%';
  root.style.background = '#0f1020';
  root.style.position = 'relative';
  root.style.overflow = 'hidden';

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';

  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.inset = '0';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';

  root.appendChild(canvas);
  root.appendChild(overlay);
  document.documentElement.style.width = '100%';
  document.documentElement.style.height = '100%';
  document.body.style.margin = '0';
  document.body.style.width = '100%';
  document.body.style.height = '100%';
  document.body.appendChild(root);

  return { root, canvas, overlay };
}

function computeRank(score) {
  const tiers = [
    { name: 'Bronze', min: 0 },
    { name: 'Silver', min: 1800 },
    { name: 'Gold', min: 2600 },
    { name: 'Diamond', min: 3400 },
    { name: 'Master', min: 4200 },
  ];

  let rank = tiers[0];
  for (const tier of tiers) {
    if (score >= tier.min) rank = tier;
  }

  const nextTier = tiers.find((tier) => tier.min > rank.min);
  const nearMiss = nextTier
    ? `Need ${Math.max(0, nextTier.min - score)} for ${nextTier.name}`
    : 'Top rank';

  const progress = nextTier
    ? Math.max(0, Math.min(1, (score - rank.min) / (nextTier.min - rank.min)))
    : 1;

  return {
    rank: rank.name,
    nearMiss,
    rankProgress: nextTier
      ? {
          currentRank: rank.name,
          nextRank: nextTier.name,
          currentScore: score,
          nextScore: nextTier.min,
          progress,
        }
      : null,
  };
}

async function loadModel() {
  const [bestScores, coins, streak, daily, shop, settings, tutorialSeen, achievements] =
    await Promise.all([
    loadBestScores(),
    loadCoins(),
    loadStreak(),
    loadDaily(),
    loadShop(),
    loadSettings(),
    loadTutorial(),
    loadAchievements(),
  ]);

  const todayKey = getTodayKey();
  let dailyData = daily;
  if (!dailyData || dailyData.dateKey !== todayKey) {
    dailyData = getDailyChallenge(todayKey);
  }

  const ownedSkins = Array.isArray(shop?.ownedSkins) ? shop.ownedSkins : ['skin_classic'];
  const selectedSkin = shop?.selectedSkin || 'skin_classic';

  return {
    bestScores,
    coins,
    streak,
    daily: dailyData,
    ownedSkins,
    selectedSkin,
    settings: normalizeSettings(settings),
    tutorialSeen: !!tutorialSeen,
    achievements: Array.isArray(achievements) ? achievements : [],
  };
}

function buildCopyText(result) {
  return `Stress Bubble - ${result.rank} - Score ${result.score}`;
}

async function setup() {
  let model = await loadModel();
  let selectedMode = 'classic';
  let lastResult = null;
  let lastPersonalBest = false;
  const audio = createAudioManager();

  const { canvas, overlay } = createLayout();
  const { ctx } = setupHiDPICanvas(canvas);

  audio.setSettings(model.settings);

  applyDifficulty(CONFIG, CONFIG_BASE, model.settings.difficulty);
  applyAccessibility(CONFIG, model.settings);

  const engine = createGameEngine({
    renderer: { renderFrame },
    canvas,
    ctx,
    config: CONFIG,
  });

  function showHome() {
    overlay.style.pointerEvents = 'auto';
    renderHome({
      rootEl: overlay,
      model,
      selectedMode,
      settings: model.settings,
      onModeChange: (mode) => {
        selectedMode = mode;
        showHome();
      },
      onPlay: () => startGame(selectedMode),
      onShop: () => showShop(),
      showTutorial: !model.tutorialSeen,
      onDismissTutorial: async () => {
        if (model.tutorialSeen) return;
        model.tutorialSeen = true;
        await saveTutorial(true);
        showHome();
      },
      onSettingsChange: async (patch) => {
        model.settings = normalizeSettings({ ...model.settings, ...patch });
        applyDifficulty(CONFIG, CONFIG_BASE, model.settings.difficulty);
        applyAccessibility(CONFIG, model.settings);
        await saveSettings(model.settings);
        audio.setSettings(model.settings);
        showHome();
      },
      onReset: async () => {
        const ok = window.confirm('Reset all data? This cannot be undone.');
        if (!ok) return;
        await clearAll();
        model = await loadModel();
        applyDifficulty(CONFIG, CONFIG_BASE, model.settings.difficulty);
        applyAccessibility(CONFIG, model.settings);
        audio.setSettings(model.settings);
        engine.init();
        showHome();
      },
    });
  }

  function showShop() {
    overlay.style.pointerEvents = 'auto';
    renderShop({
      rootEl: overlay,
      model,
      onBuy: async (itemId) => {
        const result = buyItem(model, itemId);
        if (!result.ok) return;
        model = result.model;
        await save({ coins: model.coins });
        await saveShop({ ownedSkins: model.ownedSkins, selectedSkin: model.selectedSkin });
        showShop();
      },
      onBack: () => showHome(),
    });
  }

  function showResult(result, isPersonalBest) {
    overlay.style.pointerEvents = 'auto';
    renderResult({
      rootEl: overlay,
      result,
      model,
      isPersonalBest,
      onReplay: () => startGame(result.mode || selectedMode),
      onCopy: async () => {
        const text = buildCopyText(result);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          window.prompt('Copy result', text);
        }
      },
      onHome: () => {
        engine.init();
        showHome();
      },
      onClaim: async () => {
        if (!model.daily || !model.daily.completed || model.daily.rewardClaimed) return;
        const reward = model.daily.rewardCoins || 200;
        model.coins += reward;
        model.daily.rewardClaimed = true;
        await save({ coins: model.coins, daily: model.daily });
        if (lastResult) {
          showResult(lastResult, lastPersonalBest);
        }
      },
    });
  }

  async function finishRun(runStats) {
    const rankInfo = computeRank(runStats.score);
    const coinsEarned = coinsForRun(runStats.score);

    model.coins += coinsEarned;

    const todayKey = getTodayKey();
    model.streak = updateStreak(model.streak, todayKey, true);
    const streakReward = Number(model.streak?.rewardCoins) || 0;
    if (streakReward > 0) {
      model.coins += streakReward;
      model.streak.rewardCoins = 0;
    }

    model.daily = evaluateDailyProgress(model.daily, runStats);

    const modeKey = runStats.mode || selectedMode || 'classic';
    const previousBest = model.bestScores?.[modeKey] ?? 0;
    model.bestScores = await saveBestScore(modeKey, runStats.score);
    const isPersonalBest = runStats.score > previousBest;

    const achievementResult = evaluateAchievements(model.achievements, runStats);
    model.achievements = achievementResult.unlocked;

    await save({
      coins: model.coins,
      streak: model.streak,
      daily: model.daily,
      bestScores: model.bestScores,
    });
    await saveAchievements(model.achievements);

    const result = {
      score: runStats.score,
      rank: rankInfo.rank,
      nearMiss: rankInfo.nearMiss,
      rankProgress: rankInfo.rankProgress,
      coinsEarned,
      mode: runStats.mode,
      achievementsUnlocked: achievementResult.newlyUnlocked,
      runStats: {
        pops: runStats.pops || 0,
        misses: runStats.misses || 0,
        maxCombo: runStats.maxCombo || 0,
        goldenCount: runStats.goldenCount || 0,
        bombHits: runStats.bombHits || 0,
      },
    };

    lastResult = result;
    lastPersonalBest = isPersonalBest;
    showResult(result, isPersonalBest);
  }

  function startGame(mode = selectedMode) {
    if (!model.tutorialSeen) {
      model.tutorialSeen = true;
      saveTutorial(true);
    }
    overlay.innerHTML = '';
    overlay.style.pointerEvents = 'none';
    engine.selectedSkin = model.selectedSkin || 'skin_classic';
    audio.unlock();
    engine.start(mode);
  }

  bindInputs({
    canvas,
    onClick: (x, y) => engine.handleClick(x, y),
    onStart: () => {
      if (engine.state === 'HOME' || engine.state === 'RESULT') startGame(selectedMode);
    },
    onRestart: () => engine.restart(),
    onPauseToggle: () => engine.togglePause(),
  });

  engine.on('result', (stats) => {
    finishRun(stats);
  });

  engine.on('pop', (payload) => {
    audio.playPop(payload?.type || 'normal', payload?.comboMultiplier || 1);
  });

  engine.on('miss', (payload) => {
    audio.playMiss(payload?.count || 1);
  });

  engine.on('low-time', () => {
    audio.playLowTimeWarning();
  });

  engine.init();
  showHome();
}

setup();
