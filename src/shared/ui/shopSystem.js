const CATALOG = [
  { id: 'skin_classic', category: 'bubble', name: 'Classic', price: 0, tier: 'starter', description: 'clean arcade look' },
  { id: 'skin_ocean', category: 'bubble', name: 'Ocean', price: 320, tier: 'starter', description: 'cool ripple highlights' },
  { id: 'skin_neon', category: 'bubble', name: 'Neon', price: 820, tier: 'core', description: 'luminous cyber ring' },
  { id: 'skin_ember', category: 'bubble', name: 'Ember', price: 1480, tier: 'core', description: 'hot sparks and warm glow' },
  { id: 'skin_lunar', category: 'bubble', name: 'Lunar', price: 2100, tier: 'rare', description: 'moonlit silver halo', unlock: { type: 'bestScore', value: 4200, label: 'Reach 4200 best score' } },
  { id: 'skin_toxic', category: 'bubble', name: 'Toxic', price: 2850, tier: 'rare', description: 'acid core and hazard edge', unlock: { type: 'bestComboEver', value: 10, label: 'Hit combo x10' } },
  { id: 'skin_sakura', category: 'bubble', name: 'Sakura', price: 3600, tier: 'legend', description: 'soft bloom petal shine', unlock: { type: 'bestScore', value: 6500, label: 'Reach 6500 best score' } },
  { id: 'bg_midnight', category: 'background', name: 'Midnight', price: 0, tier: 'starter', description: 'deep calm navy' },
  { id: 'bg_sunset', category: 'background', name: 'Sunset', price: 420, tier: 'starter', description: 'warm dusk horizon' },
  { id: 'bg_aurora', category: 'background', name: 'Aurora', price: 980, tier: 'core', description: 'cold bands of light' },
  { id: 'bg_grid', category: 'background', name: 'Grid', price: 1540, tier: 'core', description: 'retro synth lattice' },
  { id: 'bg_dawn', category: 'background', name: 'Dawn', price: 2180, tier: 'rare', description: 'misty cyan sunrise', unlock: { type: 'runsPlayed', value: 8, label: 'Complete 8 runs' } },
  { id: 'bg_void', category: 'background', name: 'Void', price: 2980, tier: 'rare', description: 'dark space with ring glow', unlock: { type: 'bestScore', value: 5000, label: 'Reach 5000 best score' } },
  { id: 'bg_petals', category: 'background', name: 'Petals', price: 3850, tier: 'legend', description: 'rose dusk with bloom haze', unlock: { type: 'streak', value: 5, label: 'Reach 5-day streak' } },
  { id: 'audio_classic', category: 'audio', name: 'Classic', price: 0, tier: 'starter', description: 'default clean pops' },
  { id: 'audio_arcade', category: 'audio', name: 'Arcade', price: 540, tier: 'starter', description: '8-bit sharp blips' },
  { id: 'audio_lofi', category: 'audio', name: 'Lo-Fi', price: 1080, tier: 'core', description: 'soft warm taps' },
  { id: 'audio_neon', category: 'audio', name: 'Neon', price: 1620, tier: 'core', description: 'bright electric sparkle' },
  { id: 'audio_crystal', category: 'audio', name: 'Crystal', price: 2360, tier: 'rare', description: 'glass chimes and shimmer', unlock: { type: 'lifetimeGoldenCount', value: 12, label: 'Pop 12 golden bubbles total' } },
  { id: 'audio_vapor', category: 'audio', name: 'Vapor', price: 3120, tier: 'rare', description: 'washed dreamy tails', unlock: { type: 'runsPlayed', value: 15, label: 'Complete 15 runs' } },
  { id: 'audio_reactor', category: 'audio', name: 'Reactor', price: 3980, tier: 'legend', description: 'heavy pulse and charge', unlock: { type: 'bestScore', value: 7200, label: 'Reach 7200 best score' } },
];

const DEFAULT_SHOP = {
  ownedSkins: ['skin_classic'],
  selectedSkin: 'skin_classic',
  ownedBackgrounds: ['bg_midnight'],
  selectedBackground: 'bg_midnight',
  ownedAudioPacks: ['audio_classic'],
  selectedAudioPack: 'audio_classic',
};

export function getCatalog(category = null) {
  if (!category) return CATALOG.slice();
  return CATALOG.filter((entry) => entry.category === category);
}

export function getItemById(itemId) {
  return CATALOG.find((entry) => entry.id === itemId) || null;
}

export function getSkinById(itemId) {
  return getItemById(itemId);
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function normalizeShopState(source = null) {
  const model = source || {};
  return {
    ownedSkins: Array.isArray(model.ownedSkins) ? model.ownedSkins.slice() : DEFAULT_SHOP.ownedSkins.slice(),
    selectedSkin: model.selectedSkin || DEFAULT_SHOP.selectedSkin,
    ownedBackgrounds: Array.isArray(model.ownedBackgrounds)
      ? model.ownedBackgrounds.slice()
      : DEFAULT_SHOP.ownedBackgrounds.slice(),
    selectedBackground: model.selectedBackground || DEFAULT_SHOP.selectedBackground,
    ownedAudioPacks: Array.isArray(model.ownedAudioPacks)
      ? model.ownedAudioPacks.slice()
      : DEFAULT_SHOP.ownedAudioPacks.slice(),
    selectedAudioPack: model.selectedAudioPack || DEFAULT_SHOP.selectedAudioPack,
    coins: Number(model.coins) || 0,
  };
}

export function getOwnedItems(shopState, category) {
  if (category === 'background') return shopState.ownedBackgrounds;
  if (category === 'audio') return shopState.ownedAudioPacks;
  return shopState.ownedSkins;
}

export function getSelectedItem(shopState, category) {
  if (category === 'background') return shopState.selectedBackground;
  if (category === 'audio') return shopState.selectedAudioPack;
  return shopState.selectedSkin;
}

function getBestScore(model) {
  const bestScores = model?.bestScores || {};
  return Math.max(
    Number(bestScores.classic) || 0,
    Number(bestScores.rage) || 0,
    Number(bestScores.zen) || 0
  );
}

export function isItemUnlocked(model, item) {
  if (!item?.unlock) return true;
  if (item.unlock.type === 'bestScore') {
    return getBestScore(model) >= Number(item.unlock.value || 0);
  }
  if (item.unlock.type === 'streak') {
    return Number(model?.streak?.count) >= Number(item.unlock.value || 0);
  }
  if (item.unlock.type === 'runsPlayed') {
    return Number(model?.progression?.runsPlayed) >= Number(item.unlock.value || 0);
  }
  if (item.unlock.type === 'bestComboEver') {
    return Number(model?.progression?.bestComboEver) >= Number(item.unlock.value || 0);
  }
  if (item.unlock.type === 'lifetimeGoldenCount') {
    return Number(model?.progression?.lifetimeGoldenCount) >= Number(item.unlock.value || 0);
  }
  return true;
}

export function getUnlockLabel(item) {
  return item?.unlock?.label || '';
}

export function getFeaturedItem(todayKey, category = null) {
  const source = getCatalog(category).filter((entry) => entry.price > 0);
  if (!source.length) return null;
  const index = hashString(`${todayKey || 'today'}:${category || 'all'}`) % source.length;
  return source[index];
}

export function getEffectivePrice(item, todayKey) {
  if (!item) return 0;
  const featured = getFeaturedItem(todayKey, item.category);
  if (featured && featured.id === item.id && item.price > 0) {
    return Math.max(1, Math.round(item.price * 0.85));
  }
  return item.price;
}

function applyOwnedSelection(model, shopState, item) {
  if (item.category === 'background') {
    return {
      ...model,
      selectedBackground: item.id,
    };
  }
  if (item.category === 'audio') {
    return {
      ...model,
      selectedAudioPack: item.id,
    };
  }
  return {
    ...model,
    selectedSkin: item.id,
  };
}

function applyPurchase(model, shopState, item) {
  const nextCoins = shopState.coins - item.price;
  if (item.category === 'background') {
    return {
      ...model,
      coins: nextCoins,
      ownedBackgrounds: shopState.ownedBackgrounds.concat(item.id),
      selectedBackground: item.id,
    };
  }
  if (item.category === 'audio') {
    return {
      ...model,
      coins: nextCoins,
      ownedAudioPacks: shopState.ownedAudioPacks.concat(item.id),
      selectedAudioPack: item.id,
    };
  }
  return {
    ...model,
    coins: nextCoins,
    ownedSkins: shopState.ownedSkins.concat(item.id),
    selectedSkin: item.id,
  };
}

export function buyItem(model, itemId, todayKey = '') {
  const shop = normalizeShopState(model);
  const item = getItemById(itemId);
  if (!item) return { ok: false, model, error: 'Not found' };
  if (!isItemUnlocked(model, item)) {
    return { ok: false, model, error: 'Locked' };
  }

  const ownedItems = getOwnedItems(shop, item.category);
  if (ownedItems.includes(itemId)) {
    return {
      ok: true,
      model: applyOwnedSelection(model, shop, item),
      error: null,
    };
  }

  const effectivePrice = getEffectivePrice(item, todayKey);
  if (shop.coins < effectivePrice) {
    return { ok: false, model, error: 'Not enough coins' };
  }

  return {
    ok: true,
    model: applyPurchase(model, shop, { ...item, price: effectivePrice }),
    error: null,
  };
}

export function pickShopState(model) {
  const normalized = normalizeShopState(model);
  return {
    ownedSkins: normalized.ownedSkins,
    selectedSkin: normalized.selectedSkin,
    ownedBackgrounds: normalized.ownedBackgrounds,
    selectedBackground: normalized.selectedBackground,
    ownedAudioPacks: normalized.ownedAudioPacks,
    selectedAudioPack: normalized.selectedAudioPack,
  };
}
