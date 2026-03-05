const STORAGE_KEYS = [
  'bestScores',
  'coins',
  'streak',
  'daily',
  'shop',
  'settings',
];

function hasChromeStorage() {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
}

function getLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch (err) {
    return undefined;
  }
}

function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // ignore
  }
}

function removeLocal(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    // ignore
  }
}

export async function getAll() {
  if (hasChromeStorage()) {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => resolve(items || {}));
    });
  }

  const result = {};
  for (const key of STORAGE_KEYS) {
    const value = getLocal(key);
    if (value !== undefined) result[key] = value;
  }
  return result;
}

export async function load(keys) {
  if (hasChromeStorage()) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (items) => resolve(items || {}));
    });
  }

  const list = Array.isArray(keys) ? keys : [keys];
  const result = {};
  for (const key of list) {
    const value = getLocal(key);
    if (value !== undefined) result[key] = value;
  }
  return result;
}

export async function save(patch) {
  if (!patch || typeof patch !== 'object') return;
  if (hasChromeStorage()) {
    return new Promise((resolve) => {
      chrome.storage.local.set(patch, () => resolve());
    });
  }

  for (const [key, value] of Object.entries(patch)) {
    setLocal(key, value);
  }
}

export async function clearAll() {
  if (hasChromeStorage()) {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => resolve());
    });
  }

  for (const key of STORAGE_KEYS) {
    removeLocal(key);
  }
}

export async function loadBestScores() {
  const data = await load('bestScores');
  const bestScores = data.bestScores || {};
  return {
    classic: Number(bestScores.classic) || 0,
    rage: Number(bestScores.rage) || 0,
    zen: Number(bestScores.zen) || 0,
  };
}

export async function saveBestScore(mode, score) {
  const bestScores = await loadBestScores();
  const key = mode || 'classic';
  const current = Number(bestScores[key]) || 0;
  if (score > current) {
    bestScores[key] = score;
    await save({ bestScores });
  }
  return bestScores;
}

export async function loadCoins() {
  const data = await load('coins');
  return Number(data.coins) || 0;
}

export async function saveCoins(coins) {
  await save({ coins: Math.max(0, Math.floor(coins)) });
}

export async function loadStreak() {
  const data = await load('streak');
  const streak = data.streak || {};
  return {
    count: Number(streak.count) || 0,
    lastPlayedKey: streak.lastPlayedKey || null,
  };
}

export async function saveStreak(streakObj) {
  await save({ streak: streakObj });
}

export async function loadDaily() {
  const data = await load('daily');
  return data.daily || null;
}

export async function saveDaily(dailyObj) {
  await save({ daily: dailyObj });
}

export async function loadShop() {
  const data = await load('shop');
  return data.shop || null;
}

export async function saveShop(shopObj) {
  await save({ shop: shopObj });
}

export async function loadSettings() {
  const data = await load('settings');
  return data.settings || null;
}

export async function saveSettings(settingsObj) {
  await save({ settings: settingsObj });
}
