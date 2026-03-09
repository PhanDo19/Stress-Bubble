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
import { computeRank } from '../shared/systems/rankSystem.js';
import { createGameConfig, normalizeSettings, syncGameConfig } from '../shared/systems/gameConfig.js';

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
  const config = createGameConfig(model.settings);

  const { canvas, overlay } = createLayout();
  const { ctx } = setupHiDPICanvas(canvas);

  audio.setSettings(model.settings);

  const engine = createGameEngine({
    renderer: { renderFrame },
    canvas,
    ctx,
    config,
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
        syncGameConfig(config, model.settings);
        await saveSettings(model.settings);
        audio.setSettings(model.settings);
        showHome();
      },
      onReset: async () => {
        const ok = window.confirm('Reset all data? This cannot be undone.');
        if (!ok) return;
        await clearAll();
        model = await loadModel();
        syncGameConfig(config, model.settings);
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
