import { createGameEngine } from '../shared/engine/gameEngine.js';
import { renderFrame } from '../shared/render/renderer.js';
import { bindInputs } from '../shared/ui/input.js';
import { renderHome } from '../shared/ui/screens/homeScreen.js';
import { renderResult } from '../shared/ui/screens/resultScreen.js';
import {
  loadBestScores,
  loadCoins,
  loadStreak,
  loadDaily,
  loadAchievements,
  loadSettings,
  save,
  saveBestScore,
  saveAchievements,
  saveSettings,
} from '../shared/storage/storage.js';
import { getTodayKey, getDailyChallenge, evaluateDailyProgress } from '../shared/systems/dailySystem.js';
import { updateStreak } from '../shared/systems/streakSystem.js';
import { coinsForRun } from '../shared/systems/coinSystem.js';
import { evaluateAchievements } from '../shared/systems/achievementSystem.js';
import { setupHiDPICanvas } from '../shared/render/canvasScale.js';

const CONFIG = {
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
};

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

function normalizeSettings(settings) {
  const next = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  next.sfx = !!next.sfx;
  next.music = !!next.music;
  next.vibe = !!next.vibe;
  next.muteAudio = !!next.muteAudio;
  next.reducedMotion = !!next.reducedMotion;
  next.highContrast = !!next.highContrast;
  next.sfxVolume = Math.max(0, Math.min(1, Number(next.sfxVolume)));
  next.musicVolume = Math.max(0, Math.min(1, Number(next.musicVolume)));
  if (!['chill', 'hiphop', 'minimal'].includes(next.musicStyle)) next.musicStyle = 'chill';
  if (!['easy', 'normal', 'hard'].includes(next.difficulty)) next.difficulty = 'normal';
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
  document.body.style.margin = '0';
  document.body.style.width = '420px';
  document.body.style.height = '560px';
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

  return { rank: rank.name, nearMiss };
}

async function loadModel() {
  const [bestScores, coins, streak, daily, achievements, settings] = await Promise.all([
    loadBestScores(),
    loadCoins(),
    loadStreak(),
    loadDaily(),
    loadAchievements(),
    loadSettings(),
  ]);

  const todayKey = getTodayKey();
  let dailyData = daily;
  if (!dailyData || dailyData.dateKey !== todayKey) {
    dailyData = getDailyChallenge(todayKey);
  }

  return {
    bestScores,
    coins,
    streak,
    daily: dailyData,
    achievements: Array.isArray(achievements) ? achievements : [],
    settings: normalizeSettings(settings),
  };
}

function buildCopyText(result) {
  return `Stress Bubble - ${result.rank} - Score ${result.score}`;
}

async function setup() {
  const { canvas, overlay } = createLayout();
  const { ctx } = setupHiDPICanvas(canvas);

  let model = await loadModel();

  const engine = createGameEngine({
    renderer: { renderFrame },
    canvas,
    ctx,
    config: CONFIG,
  });

  function openFullScreenGame() {
    const url = chrome?.runtime?.getURL
      ? chrome.runtime.getURL('src/newtab/newtab.html')
      : 'src/newtab/newtab.html';

    if (chrome?.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank', 'noopener');
    }

    window.close();
  }

  function showHome() {
    overlay.style.pointerEvents = 'auto';
    renderHome({
      rootEl: overlay,
      model,
      settings: model.settings,
      onPlay: () => startGame('classic'),
      onOpenFullscreen: () => openFullScreenGame(),
      onSettingsChange: async (patch) => {
        model.settings = normalizeSettings({ ...model.settings, ...patch });
        await saveSettings(model.settings);
        showHome();
      },
    });
  }

  function showResult(result) {
    overlay.style.pointerEvents = 'auto';
    renderResult({
      rootEl: overlay,
      result,
      model,
      onReplay: () => startGame(result.mode || 'classic'),
      onCopy: async () => {
        const text = buildCopyText(result);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          window.prompt('Copy result', text);
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
    if (model.daily.completed && !model.daily.rewardClaimed) {
      model.coins += model.daily.rewardCoins || 200;
      model.daily.rewardClaimed = true;
    }

    model.bestScores = await saveBestScore(runStats.mode, runStats.score);

    const achievementResult = evaluateAchievements(model.achievements, runStats);
    model.achievements = achievementResult.unlocked;

    await save({
      coins: model.coins,
      streak: model.streak,
      daily: model.daily,
      bestScores: model.bestScores,
    });
    await saveAchievements(model.achievements);

    showResult({
      score: runStats.score,
      rank: rankInfo.rank,
      nearMiss: rankInfo.nearMiss,
      coinsEarned,
      mode: runStats.mode,
      achievementsUnlocked: achievementResult.newlyUnlocked,
    });
  }

  function startGame(mode) {
    overlay.innerHTML = '';
    overlay.style.pointerEvents = 'none';
    engine.start(mode);
  }

  bindInputs({
    canvas,
    onClick: (x, y) => engine.handleClick(x, y),
    onStart: () => {
      if (engine.state === 'HOME' || engine.state === 'RESULT') startGame('classic');
    },
    onRestart: () => engine.restart(),
    onPauseToggle: () => engine.togglePause(),
  });

  engine.on('result', (stats) => {
    finishRun(stats);
  });

  engine.init();
  showHome();
}

setup();
