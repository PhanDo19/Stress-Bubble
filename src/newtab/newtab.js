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
  loadProgression,
  loadSettings,
  loadTutorial,
  loadAchievements,
  save,
  saveBestScore,
  saveShop,
  saveProgression,
  saveSettings,
  saveTutorial,
  saveAchievements,
  clearAll,
} from '../shared/storage/storage.js';
import { getTodayKey, getDailyChallenge, evaluateDailyProgress } from '../shared/systems/dailySystem.js';
import { updateStreak } from '../shared/systems/streakSystem.js';
import { coinsForRun } from '../shared/systems/coinSystem.js';
import { setupHiDPICanvas } from '../shared/render/canvasScale.js';
import { buyItem, normalizeShopState, pickShopState } from '../shared/ui/shopSystem.js';
import { createAudioManager } from '../shared/audio/audioManager.js';
import { evaluateAchievements } from '../shared/systems/achievementSystem.js';
import { computeRank } from '../shared/systems/rankSystem.js';
import { createGameConfig, normalizeSettings, syncGameConfig } from '../shared/systems/gameConfig.js';
import { buildResultShareText, copyResultText, shareResultText } from '../shared/ui/shareActions.js';

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
  const [bestScores, coins, streak, daily, shop, progression, settings, tutorialSeen, achievements] =
    await Promise.all([
    loadBestScores(),
    loadCoins(),
    loadStreak(),
    loadDaily(),
    loadShop(),
    loadProgression(),
    loadSettings(),
    loadTutorial(),
    loadAchievements(),
  ]);

  const todayKey = getTodayKey();
  let dailyData = daily;
  if (!dailyData || dailyData.dateKey !== todayKey) {
    dailyData = getDailyChallenge(todayKey);
  }

  const shopState = normalizeShopState(shop || {});
  const normalizedSettings = normalizeSettings({
    ...(settings || {}),
    selectedSkin: shopState.selectedSkin,
    selectedBackground: shopState.selectedBackground,
    selectedAudioPack: shopState.selectedAudioPack,
  });

  return {
    bestScores,
    coins,
    streak,
    daily: dailyData,
    ownedSkins: shopState.ownedSkins,
    selectedSkin: shopState.selectedSkin,
    ownedBackgrounds: shopState.ownedBackgrounds,
    selectedBackground: shopState.selectedBackground,
    ownedAudioPacks: shopState.ownedAudioPacks,
    selectedAudioPack: shopState.selectedAudioPack,
    progression,
    settings: normalizedSettings,
    tutorialSeen: !!tutorialSeen,
    achievements: Array.isArray(achievements) ? achievements : [],
  };
}

function syncLoadoutIntoSettings(model) {
  model.settings = normalizeSettings({
    ...(model.settings || {}),
    selectedSkin: model.selectedSkin || 'skin_classic',
    selectedBackground: model.selectedBackground || 'bg_midnight',
    selectedAudioPack: model.selectedAudioPack || 'audio_classic',
  });
}

async function setup() {
  let model = await loadModel();
  syncLoadoutIntoSettings(model);
  let selectedMode = 'classic';
  let shopCategory = 'bubble';
  let lastResult = null;
  let lastPersonalBest = false;
  let lastActionStatus = '';
  const audio = createAudioManager();
  const config = createGameConfig(model.settings);

  const { canvas, overlay } = createLayout();
  const { ctx } = setupHiDPICanvas(canvas);

  audio.setSettings({ ...model.settings, audioPack: model.selectedAudioPack });

  const engine = createGameEngine({
    renderer: { renderFrame },
    canvas,
    ctx,
    config,
  });

  function applyOwnedPresentation() {
    engine.setLoadout({
      selectedSkin: model.selectedSkin || 'skin_classic',
      backgroundTheme: model.selectedBackground || 'bg_midnight',
      selectedAudioPack: model.selectedAudioPack || 'audio_classic',
    });
    audio.setSettings({ ...model.settings, audioPack: model.selectedAudioPack });
    if (engine.state !== 'PLAYING' && engine.state !== 'PAUSED') {
      engine.init();
    }
  }

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
        audio.setSettings({ ...model.settings, audioPack: model.selectedAudioPack });
        showHome();
      },
      onReset: async () => {
        const ok = window.confirm('Reset all data? This cannot be undone.');
        if (!ok) return;
        await clearAll();
        model = await loadModel();
        syncGameConfig(config, model.settings);
        applyOwnedPresentation();
        showHome();
      },
    });
  }

  function showShop(category = shopCategory) {
    shopCategory = category;
    const todayKey = getTodayKey();
    overlay.style.pointerEvents = 'auto';
    renderShop({
      rootEl: overlay,
      model,
      activeCategory: shopCategory,
      onCategoryChange: (nextCategory) => showShop(nextCategory),
      todayKey,
      onBuy: async (itemId) => {
        const result = buyItem(model, itemId, todayKey);
        if (!result.ok) return;
        model = result.model;
        syncLoadoutIntoSettings(model);
        await save({ coins: model.coins });
        await saveShop(pickShopState(model));
        await saveSettings(model.settings);
        applyOwnedPresentation();
        showShop(shopCategory);
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
      actionStatus: lastActionStatus,
      onReplay: () => startGame(result.mode || selectedMode),
      onCopy: async () => {
        const outcome = await copyResultText(buildResultShareText(result));
        lastActionStatus =
          outcome.kind === 'copied'
            ? 'result.copy_success'
            : outcome.kind === 'manual'
              ? 'result.copy_manual'
              : 'result.copy_error';
        showResult(result, isPersonalBest);
      },
      onShare: async () => {
        const outcome = await shareResultText({
          title: 'Stress Bubble',
          text: buildResultShareText(result),
        });
        lastActionStatus =
          outcome.kind === 'shared'
            ? 'result.share_success'
            : outcome.kind === 'shared_via_copy'
              ? 'result.share_fallback_copy'
              : outcome.kind === 'manual'
                ? 'result.share_manual'
                : lastActionStatus;
        if (outcome.kind !== 'cancelled') {
          showResult(result, isPersonalBest);
        }
      },
      onHome: () => {
        lastActionStatus = '';
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
    const coinsEarned = coinsForRun(runStats.score, runStats);
    const todayKey = getTodayKey();
    const firstWinBonus = model.progression?.firstWinDateKey === todayKey ? 0 : 60;

    model.coins += coinsEarned + firstWinBonus;

    model.streak = updateStreak(model.streak, todayKey, true);
    const streakReward = Number(model.streak?.rewardCoins) || 0;
    if (streakReward > 0) {
      model.coins += streakReward;
      model.streak.rewardCoins = 0;
    }

    model.daily = evaluateDailyProgress(model.daily, runStats);
    model.progression = {
      ...(model.progression || {}),
      firstWinDateKey: todayKey,
      runsPlayed: Number(model.progression?.runsPlayed) + 1,
      totalPlayMs: Number(model.progression?.totalPlayMs) + (Number(runStats.durationMs) || 0),
      lifetimeGoldenCount: Number(model.progression?.lifetimeGoldenCount) + (Number(runStats.goldenCount) || 0),
      bestComboEver: Math.max(Number(model.progression?.bestComboEver) || 0, Number(runStats.maxCombo) || 0),
    };

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
      progression: model.progression,
    });
    await saveAchievements(model.achievements);
    await saveProgression(model.progression);

    const result = {
      score: runStats.score,
      rank: rankInfo.rank,
      nearMiss: rankInfo.nearMiss,
      rankProgress: rankInfo.rankProgress,
      coinsEarned: coinsEarned + firstWinBonus,
      mode: runStats.mode,
      firstWinBonus,
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
    lastActionStatus = '';
    showResult(result, isPersonalBest);
  }

  function startGame(mode = selectedMode) {
    lastActionStatus = '';
    if (!model.tutorialSeen) {
      model.tutorialSeen = true;
      saveTutorial(true);
    }
    overlay.innerHTML = '';
    overlay.style.pointerEvents = 'none';
    engine.setLoadout({
      selectedSkin: model.selectedSkin || 'skin_classic',
      backgroundTheme: model.selectedBackground || 'bg_midnight',
      selectedAudioPack: model.selectedAudioPack || 'audio_classic',
    });
    audio.setSettings({ ...model.settings, audioPack: model.selectedAudioPack });
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

  applyOwnedPresentation();
  showHome();
}

setup();
