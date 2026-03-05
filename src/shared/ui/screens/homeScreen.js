import { getCatalog } from '../shopSystem.js';

function ensureRoot(rootEl) {
  if (!rootEl) return null;
  rootEl.innerHTML = '';
  return rootEl;
}

function formatChallenge(daily) {
  if (!daily || !daily.challenge) {
    return {
      label: 'Daily: -',
      progress: 0,
      target: 1,
      completed: false,
    };
  }

  const c = daily.challenge;
  const completed = !!daily.completed;
  let label = 'Daily: -';
  let target = Number(c.target) || 1;
  let progress = Number(daily.progress) || 0;

  if (c.type === 'popCount') label = `Daily: POP ${c.target}`;
  if (c.type === 'maxCombo') label = `Daily: COMBO x${c.target}`;
  if (c.type === 'noBomb') {
    label = 'Daily: NO BOMB';
    target = 1;
    progress = completed ? 1 : 0;
  }
  if (c.type === 'score') label = `Daily: SCORE ${c.target}`;
  if (c.type === 'missMax') label = `Daily: MISS <= ${c.target}`;
  if (c.type === 'goldenCount') label = `Daily: GOLDEN ${c.target}`;

  return { label, progress, target, completed };
}

function formatDailyProgress({ label, progress, target }) {
  const safeTarget = Math.max(1, Number(target) || 1);
  const safeProgress = Math.max(0, Number(progress) || 0);
  return `${label} (${Math.min(safeProgress, safeTarget)}/${safeTarget})`;
}

function createButton(text, isActive = false, variant = 'ghost') {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.padding = variant === 'solid' ? '10px 18px' : '8px 14px';
  button.style.borderRadius = '12px';
  button.style.border = isActive ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.18)';
  button.style.background =
    variant === 'solid'
      ? 'linear-gradient(135deg, rgba(110,231,183,0.35), rgba(56,189,248,0.25))'
      : variant === 'danger'
        ? 'rgba(239,68,68,0.2)'
        : isActive
          ? 'rgba(255,255,255,0.12)'
          : 'rgba(255,255,255,0.04)';
  button.style.color = '#ffffff';
  button.style.fontSize = 'calc(14px * var(--ui-scale, 1))';
  button.style.fontWeight = isActive || variant === 'solid' ? '600' : '500';
  button.style.cursor = 'pointer';
  button.style.backdropFilter = 'blur(6px)';
  return button;
}

export function renderHome({
  rootEl,
  model,
  selectedMode = 'classic',
  settings,
  onModeChange,
  onPlay,
  onShop,
  onSettingsChange,
  onReset,
}) {
  const root = ensureRoot(rootEl);
  if (!root) return;

  const bestScore = model?.bestScores?.[selectedMode] ?? 0;
  const coins = model?.coins ?? 0;
  const streak = model?.streak?.count ?? 0;

  const dailyInfo = formatChallenge(model?.daily);
  const dailyText = formatDailyProgress(dailyInfo);
  const dailyRatio = Math.max(
    0,
    Math.min(1, (Number(dailyInfo.progress) || 0) / Math.max(1, dailyInfo.target || 1))
  );

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'stretch';
  container.style.textAlign = 'center';
  container.style.gap = '18px';
  container.style.padding = '28px 28px 24px';
  container.style.color = '#ffffff';
  container.style.minWidth = '320px';
  container.style.maxWidth = '400px';
  container.style.borderRadius = '20px';
  container.style.background = 'rgba(10,14,26,0.7)';
  container.style.border = '1px solid rgba(255,255,255,0.08)';
  container.style.boxShadow = '0 20px 60px rgba(0,0,0,0.45)';
  container.style.backdropFilter = 'blur(10px)';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.flexDirection = 'column';
  header.style.gap = '6px';

  const title = document.createElement('div');
  title.textContent = 'Stress Bubble';
  title.style.fontSize = 'calc(28px * var(--ui-scale, 1))';
  title.style.fontWeight = '700';
  title.style.letterSpacing = '0.6px';

  const subtitle = document.createElement('div');
  subtitle.textContent = 'New tab calm, one pop at a time';
  subtitle.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
  subtitle.style.opacity = '0.65';

  header.appendChild(title);
  header.appendChild(subtitle);

  const modeRow = document.createElement('div');
  modeRow.style.display = 'flex';
  modeRow.style.gap = '8px';
  modeRow.style.justifyContent = 'center';

  const modes = [
    { key: 'classic', label: 'Classic' },
    { key: 'rage', label: 'Rage' },
    { key: 'zen', label: 'Zen' },
  ];

  modes.forEach((mode) => {
    const btn = createButton(mode.label, selectedMode === mode.key);
    btn.addEventListener('click', () => {
      if (typeof onModeChange === 'function') onModeChange(mode.key);
    });
    modeRow.appendChild(btn);
  });

  const stats = document.createElement('div');
  stats.style.display = 'grid';
  stats.style.gridTemplateColumns = '1fr 1fr';
  stats.style.columnGap = '20px';
  stats.style.rowGap = '10px';
  stats.style.justifyItems = 'center';
  stats.style.fontSize = 'calc(14px * var(--ui-scale, 1))';
  stats.style.padding = '10px 0';
  stats.innerHTML = `
    <div>Best (${selectedMode})</div><div>${bestScore}</div>
    <div>Coins</div><div>${coins}</div>
    <div>Streak</div><div>${streak}</div>
  `;

  const dailyBlock = document.createElement('div');
  dailyBlock.style.display = 'flex';
  dailyBlock.style.flexDirection = 'column';
  dailyBlock.style.gap = '8px';
  dailyBlock.style.padding = '12px 14px';
  dailyBlock.style.borderRadius = '14px';
  dailyBlock.style.background = 'rgba(255,255,255,0.04)';
  dailyBlock.style.border = '1px solid rgba(255,255,255,0.08)';

  const dailyTextEl = document.createElement('div');
  dailyTextEl.textContent = dailyText;
  dailyTextEl.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
  dailyTextEl.style.opacity = '0.85';

  const dailyBar = document.createElement('div');
  dailyBar.style.height = '10px';
  dailyBar.style.borderRadius = '999px';
  dailyBar.style.background = 'rgba(255,255,255,0.12)';
  dailyBar.style.overflow = 'hidden';

  const dailyFill = document.createElement('div');
  dailyFill.style.height = '100%';
  dailyFill.style.width = `${Math.round(dailyRatio * 100)}%`;
  dailyFill.style.background = dailyInfo.completed
    ? 'linear-gradient(90deg, #6ee7b7, #38bdf8)'
    : 'linear-gradient(90deg, #f2c94c, #f97316)';
  dailyBar.appendChild(dailyFill);

  dailyBlock.appendChild(dailyTextEl);
  dailyBlock.appendChild(dailyBar);

  const actionRow = document.createElement('div');
  actionRow.style.display = 'flex';
  actionRow.style.gap = '10px';
  actionRow.style.justifyContent = 'center';

  const playButton = createButton('Play', true, 'solid');
  playButton.style.fontSize = 'calc(15px * var(--ui-scale, 1))';
  playButton.addEventListener('click', () => {
    if (typeof onPlay === 'function') onPlay();
  });

  const shopButton = createButton('Shop');
  shopButton.addEventListener('click', () => {
    if (typeof onShop === 'function') onShop();
  });

  const settingsButton = createButton('Settings');

  actionRow.appendChild(playButton);
  actionRow.appendChild(shopButton);
  actionRow.appendChild(settingsButton);

  const settingsPanel = document.createElement('div');
  settingsPanel.style.display = 'none';
  settingsPanel.style.flexDirection = 'column';
  settingsPanel.style.gap = '12px';

  const togglesRow = document.createElement('div');
  togglesRow.style.display = 'flex';
  togglesRow.style.gap = '8px';
  togglesRow.style.justifyContent = 'center';

  const sfxButton = createButton(`SFX ${settings?.sfx ? 'On' : 'Off'}`, settings?.sfx);
  const musicButton = createButton(`Music ${settings?.music ? 'On' : 'Off'}`, settings?.music);
  const vibeButton = createButton(`Vibe ${settings?.vibe ? 'On' : 'Off'}`, settings?.vibe);

  sfxButton.addEventListener('click', () => {
    if (typeof onSettingsChange === 'function') onSettingsChange({ sfx: !settings?.sfx });
  });
  musicButton.addEventListener('click', () => {
    if (typeof onSettingsChange === 'function') onSettingsChange({ music: !settings?.music });
  });
  vibeButton.addEventListener('click', () => {
    if (typeof onSettingsChange === 'function') onSettingsChange({ vibe: !settings?.vibe });
  });

  togglesRow.appendChild(sfxButton);
  togglesRow.appendChild(musicButton);
  togglesRow.appendChild(vibeButton);

  const difficultyBlock = document.createElement('div');
  difficultyBlock.style.display = 'flex';
  difficultyBlock.style.flexDirection = 'column';
  difficultyBlock.style.gap = '8px';

  const difficultyLabel = document.createElement('div');
  difficultyLabel.textContent = 'Difficulty';
  difficultyLabel.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
  difficultyLabel.style.opacity = '0.75';

  const difficultyRow = document.createElement('div');
  difficultyRow.style.display = 'flex';
  difficultyRow.style.gap = '8px';
  difficultyRow.style.justifyContent = 'center';

  const difficulties = [
    { key: 'easy', label: 'Easy' },
    { key: 'normal', label: 'Normal' },
    { key: 'hard', label: 'Hard' },
  ];

  difficulties.forEach((diff) => {
    const btn = createButton(diff.label, settings?.difficulty === diff.key);
    btn.addEventListener('click', () => {
      if (typeof onSettingsChange === 'function') onSettingsChange({ difficulty: diff.key });
    });
    difficultyRow.appendChild(btn);
  });

  difficultyBlock.appendChild(difficultyLabel);
  difficultyBlock.appendChild(difficultyRow);

  const resetRow = document.createElement('div');
  resetRow.style.display = 'flex';
  resetRow.style.justifyContent = 'center';

  const resetButton = createButton('Reset Data', false, 'danger');
  resetButton.addEventListener('click', () => {
    if (typeof onReset === 'function') onReset();
  });

  resetRow.appendChild(resetButton);

  settingsPanel.appendChild(togglesRow);
  settingsPanel.appendChild(difficultyBlock);
  settingsPanel.appendChild(resetRow);

  let settingsOpen = false;
  settingsButton.addEventListener('click', () => {
    settingsOpen = !settingsOpen;
    settingsPanel.style.display = settingsOpen ? 'flex' : 'none';
  });

  container.appendChild(header);
  container.appendChild(modeRow);
  container.appendChild(stats);
  container.appendChild(dailyBlock);
  container.appendChild(actionRow);
  container.appendChild(settingsPanel);
  root.appendChild(container);
}

function getSkinColor(id) {
  if (id === 'skin_ocean') return 'linear-gradient(135deg, #38bdf8, #0ea5e9)';
  if (id === 'skin_neon') return 'linear-gradient(135deg, #a855f7, #22d3ee)';
  if (id === 'skin_ember') return 'linear-gradient(135deg, #f97316, #f43f5e)';
  return 'linear-gradient(135deg, #94a3b8, #64748b)';
}

export function renderShop({ rootEl, model, onBuy, onBack }) {
  const root = ensureRoot(rootEl);
  if (!root) return;

  const coins = Number(model?.coins) || 0;
  const ownedSkins = Array.isArray(model?.ownedSkins) ? model.ownedSkins : ['skin_classic'];
  const selectedSkin = model?.selectedSkin || 'skin_classic';

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'stretch';
  container.style.textAlign = 'center';
  container.style.gap = '16px';
  container.style.padding = '28px 28px 24px';
  container.style.color = '#ffffff';
  container.style.minWidth = '340px';
  container.style.maxWidth = '420px';
  container.style.borderRadius = '20px';
  container.style.background = 'rgba(10,14,26,0.7)';
  container.style.border = '1px solid rgba(255,255,255,0.08)';
  container.style.boxShadow = '0 20px 60px rgba(0,0,0,0.45)';
  container.style.backdropFilter = 'blur(10px)';

  const title = document.createElement('div');
  title.textContent = 'Shop';
  title.style.fontSize = 'calc(24px * var(--ui-scale, 1))';
  title.style.fontWeight = '700';

  const coinsEl = document.createElement('div');
  coinsEl.textContent = `Coins: ${coins}`;
  coinsEl.style.fontSize = 'calc(13px * var(--ui-scale, 1))';
  coinsEl.style.opacity = '0.85';

  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '10px';

  getCatalog().forEach((item) => {
    const row = document.createElement('div');
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '36px 1fr auto';
    row.style.alignItems = 'center';
    row.style.gap = '12px';
    row.style.padding = '10px 12px';
    row.style.borderRadius = '12px';
    row.style.background = 'rgba(255,255,255,0.04)';
    row.style.border = '1px solid rgba(255,255,255,0.08)';

    const swatch = document.createElement('div');
    swatch.style.width = '30px';
    swatch.style.height = '30px';
    swatch.style.borderRadius = '50%';
    swatch.style.background = getSkinColor(item.id);
    swatch.style.border = '1px solid rgba(255,255,255,0.35)';

    const name = document.createElement('div');
    name.textContent = item.name;
    name.style.fontSize = 'calc(14px * var(--ui-scale, 1))';
    name.style.textAlign = 'left';

    const price = document.createElement('div');
    price.textContent = item.price === 0 ? 'Free' : `${item.price}`;
    price.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
    price.style.opacity = '0.7';

    const info = document.createElement('div');
    info.style.display = 'flex';
    info.style.flexDirection = 'column';
    info.style.gap = '4px';
    info.appendChild(name);
    info.appendChild(price);

    const owned = ownedSkins.includes(item.id);
    const equipped = selectedSkin === item.id;

    let label = 'Buy';
    if (equipped) label = 'Equipped';
    else if (owned) label = 'Equip';

    const button = createButton(label, equipped, equipped ? 'solid' : 'ghost');
    const canBuy = owned || coins >= item.price;
    if (!canBuy) {
      button.style.opacity = '0.5';
      button.style.cursor = 'not-allowed';
    }

    button.addEventListener('click', () => {
      if (!canBuy) return;
      if (typeof onBuy === 'function') onBuy(item.id);
    });

    row.appendChild(swatch);
    row.appendChild(info);
    row.appendChild(button);
    list.appendChild(row);
  });

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'center';

  const backButton = createButton('Back');
  backButton.addEventListener('click', () => {
    if (typeof onBack === 'function') onBack();
  });

  actions.appendChild(backButton);

  container.appendChild(title);
  container.appendChild(coinsEl);
  container.appendChild(list);
  container.appendChild(actions);
  root.appendChild(container);
}
