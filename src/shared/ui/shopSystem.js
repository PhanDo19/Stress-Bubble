const CATALOG = [
  { id: 'skin_classic', name: 'Classic', price: 0 },
  { id: 'skin_ocean', name: 'Ocean', price: 300 },
  { id: 'skin_neon', name: 'Neon', price: 800 },
  { id: 'skin_ember', name: 'Ember', price: 1500 },
];

export function getCatalog() {
  return CATALOG.slice();
}

function ensureShop(model) {
  const owned = Array.isArray(model?.ownedSkins) ? model.ownedSkins.slice() : ['skin_classic'];
  const selectedSkin = model?.selectedSkin || 'skin_classic';
  const coins = Number(model?.coins) || 0;
  return { ownedSkins: owned, selectedSkin, coins };
}

export function buyItem(model, itemId) {
  const shop = ensureShop(model);
  const item = CATALOG.find((entry) => entry.id === itemId);
  if (!item) return { ok: false, model, error: 'Not found' };

  if (shop.ownedSkins.includes(itemId)) {
    return {
      ok: true,
      model: { ...model, selectedSkin: itemId },
      error: null,
    };
  }

  if (shop.coins < item.price) {
    return { ok: false, model, error: 'Not enough coins' };
  }

  const nextOwned = shop.ownedSkins.concat(itemId);
  const nextCoins = shop.coins - item.price;
  return {
    ok: true,
    model: {
      ...model,
      coins: nextCoins,
      ownedSkins: nextOwned,
      selectedSkin: itemId,
    },
    error: null,
  };
}
