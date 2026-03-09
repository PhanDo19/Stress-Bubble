import { renderSkinPreview } from '../../render/renderer.js';
import { getCatalog, getSkinById } from '../shopSystem.js';
import { t } from '../i18n.js';

function ensureRoot(rootEl) {
  if (!rootEl) return null;
  rootEl.innerHTML = '';
  return rootEl;
}

function formatChallenge(daily) {
  if (!daily || !daily.challenge) {
    return {
      label: t('daily.none'),
      progress: 0,
      target: 1,
      completed: false,
    };
  }

  const c = daily.challenge;
  const completed = !!daily.completed;
  let label = t('daily.none');
  let target = Number(c.target) || 1;
  let progress = Number(daily.progress) || 0;

  if (c.type === 'popCount') label = t('daily.pop_count', { target: c.target });
  if (c.type === 'maxCombo') label = t('daily.max_combo', { target: c.target });
  if (c.type === 'noBomb') {
    label = t('daily.no_bomb');
    target = 1;
    progress = completed ? 1 : 0;
  }
  if (c.type === 'score') label = t('daily.score', { target: c.target });
  if (c.type === 'missMax') label = t('daily.miss_max', { target: c.target });
  if (c.type === 'goldenCount') label = t('daily.golden_count', { target: c.target });

  return { label, progress, target, completed };
}

function formatDailyProgress({ label, progress, target }) {
  const safeTarget = Math.max(1, Number(target) || 1);
  const safeProgress = Math.max(0, Number(progress) || 0);
  return `${label} (${Math.min(safeProgress, safeTarget)}/${safeTarget})`;
}

function createButton(text, isActive = false, variant = 'ghost', options = {}) {
  const button = document.createElement('button');
  const {
    icon = null,
    iconAfter = false,
    spinIconOnHover = false,
    compact = false,
    iconOnly = false,
  } = options;
  button.title = text;
  button.setAttribute('aria-label', text);
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
  button.style.fontFamily = 'var(--font-ui)';
  button.style.letterSpacing = '0.01em';
  button.style.cursor = 'pointer';
  button.style.backdropFilter = 'blur(6px)';
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.gap = '8px';
  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  button.style.transition =
    'transform 140ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease, filter 180ms ease';
  button.style.boxShadow =
    variant === 'solid'
      ? '0 10px 26px rgba(56,189,248,0.16)'
      : compact
        ? '0 8px 18px rgba(0,0,0,0.18)'
        : 'none';

  const label = document.createElement('span');
  label.textContent = text;
  label.style.position = 'relative';
  label.style.zIndex = '1';
  if (iconOnly) {
    label.style.display = 'none';
    button.style.padding = compact ? '8px' : '10px';
    button.style.width = compact ? '40px' : '42px';
    button.style.minWidth = compact ? '40px' : '42px';
    button.style.height = compact ? '40px' : '42px';
    button.style.borderRadius = '999px';
    button.style.gap = '0';
  }

  const sheen = document.createElement('span');
  sheen.style.position = 'absolute';
  sheen.style.inset = '0';
  sheen.style.background =
    'linear-gradient(115deg, transparent 15%, rgba(255,255,255,0.12) 45%, transparent 75%)';
  sheen.style.transform = 'translateX(-140%)';
  sheen.style.transition = 'transform 320ms ease';
  sheen.style.pointerEvents = 'none';

  let iconEl = null;
  if (icon) {
    iconEl = icon;
    iconEl.style.position = 'relative';
    iconEl.style.zIndex = '1';
    iconEl.style.transition = spinIconOnHover
      ? 'transform 420ms ease, opacity 180ms ease'
      : 'transform 180ms ease, opacity 180ms ease';
  }

  if (iconEl && !iconAfter) button.appendChild(iconEl);
  button.appendChild(label);
  if (iconEl && iconAfter) button.appendChild(iconEl);
  button.appendChild(sheen);

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-1px)';
    button.style.filter = 'brightness(1.04)';
    button.style.boxShadow =
      variant === 'solid'
        ? '0 14px 30px rgba(56,189,248,0.24)'
        : compact
          ? '0 12px 24px rgba(0,0,0,0.24)'
          : '0 8px 18px rgba(0,0,0,0.16)';
    sheen.style.transform = 'translateX(140%)';
    if (iconEl && spinIconOnHover) {
      iconEl.style.transform = 'rotate(120deg) scale(1.08)';
    }
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.filter = 'none';
    button.style.boxShadow =
      variant === 'solid'
        ? '0 10px 26px rgba(56,189,248,0.16)'
        : compact
          ? '0 8px 18px rgba(0,0,0,0.18)'
          : 'none';
    sheen.style.transition = 'none';
    sheen.style.transform = 'translateX(-140%)';
    void sheen.offsetWidth;
    sheen.style.transition = 'transform 320ms ease';
    if (iconEl) {
      iconEl.style.transform = 'none';
    }
  });

  button.addEventListener('mousedown', () => {
    button.style.transform = 'translateY(1px) scale(0.99)';
  });

  button.addEventListener('mouseup', () => {
    button.style.transform = 'translateY(-1px)';
  });

  return button;
}

function createGearIcon() {
  const icon = document.createElement('span');
  icon.textContent = '\u2699';
  icon.setAttribute('aria-hidden', 'true');
  icon.style.display = 'inline-flex';
  icon.style.alignItems = 'center';
  icon.style.justifyContent = 'center';
  icon.style.width = '18px';
  icon.style.height = '18px';
  icon.style.fontSize = '15px';
  icon.style.opacity = '0.92';
  return icon;
}

function createSymbolIcon(symbol) {
  const icon = document.createElement('span');
  icon.textContent = symbol;
  icon.setAttribute('aria-hidden', 'true');
  icon.style.display = 'inline-flex';
  icon.style.alignItems = 'center';
  icon.style.justifyContent = 'center';
  icon.style.width = '18px';
  icon.style.height = '18px';
  icon.style.fontSize = '14px';
  icon.style.opacity = '0.92';
  return icon;
}

function createSlider(label, value, onChange) {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '10px';
  wrapper.style.justifyContent = 'center';

  const text = document.createElement('div');
  text.textContent = label;
  text.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
  text.style.opacity = '0.75';
  text.style.minWidth = '70px';
  text.style.textAlign = 'left';

  const range = document.createElement('input');
  range.type = 'range';
  range.min = '0';
  range.max = '100';
  range.value = String(Math.round((Number(value) || 0) * 100));
  range.style.width = '140px';

  const valueEl = document.createElement('div');
  valueEl.textContent = `${range.value}%`;
  valueEl.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
  valueEl.style.opacity = '0.75';
  valueEl.style.minWidth = '44px';

  range.addEventListener('input', () => {
    valueEl.textContent = `${range.value}%`;
    if (typeof onChange === 'function') {
      onChange(Number(range.value) / 100);
    }
  });

  wrapper.appendChild(text);
  wrapper.appendChild(range);
  wrapper.appendChild(valueEl);
  return wrapper;
}

function createCompactSlider(label, value, onChange) {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'grid';
  wrapper.style.gridTemplateColumns = '74px 1fr 36px';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '8px';

  const text = document.createElement('div');
  text.textContent = label;
  text.style.fontSize = 'calc(11px * var(--ui-scale, 1))';
  text.style.opacity = '0.78';
  text.style.textAlign = 'left';

  const range = document.createElement('input');
  range.type = 'range';
  range.min = '0';
  range.max = '100';
  range.value = String(Math.round((Number(value) || 0) * 100));
  range.style.width = '100%';

  const valueEl = document.createElement('div');
  valueEl.textContent = `${range.value}%`;
  valueEl.style.fontSize = 'calc(11px * var(--ui-scale, 1))';
  valueEl.style.opacity = '0.72';
  valueEl.style.textAlign = 'right';

  range.addEventListener('input', () => {
    valueEl.textContent = `${range.value}%`;
    if (typeof onChange === 'function') {
      onChange(Number(range.value) / 100);
    }
  });

  wrapper.appendChild(text);
  wrapper.appendChild(range);
  wrapper.appendChild(valueEl);
  return wrapper;
}

export function renderHome({
  rootEl,
  model,
  selectedMode = 'classic',
  settings,
  variant = 'default',
  compactSettingsOpen = false,
  compactSettingsSection = 'menu',
  onToggleCompactSettings,
  onSelectCompactSettingsSection,
  onBackCompactSettings,
  onModeChange,
  onPlay,
  onOpenFullscreen,
  onMinimize,
  onShop,
  onSettingsChange,
  onReset,
  showTutorial = false,
  onDismissTutorial,
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
  const isCompact = variant === 'compact';

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'stretch';
  container.style.textAlign = 'center';
  container.style.gap = isCompact ? '14px' : '18px';
  container.style.padding = isCompact ? '18px 18px 16px' : '28px 28px 24px';
  container.style.color = '#ffffff';
  container.style.minWidth = isCompact ? '0' : '320px';
  container.style.width = isCompact ? 'min(100%, 372px)' : '';
  container.style.maxWidth = isCompact ? '372px' : '400px';
  container.style.borderRadius = isCompact ? '18px' : '20px';
  container.style.background = isCompact ? 'rgba(8,12,26,0.82)' : 'rgba(10,14,26,0.7)';
  container.style.border = isCompact ? '1px solid rgba(78,116,176,0.28)' : '1px solid rgba(255,255,255,0.08)';
  container.style.boxShadow = isCompact
    ? '0 18px 44px rgba(0,0,0,0.38)'
    : '0 20px 60px rgba(0,0,0,0.45)';
  container.style.backdropFilter = 'blur(10px)';
  container.style.position = 'relative';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.flexDirection = 'column';
  header.style.gap = '6px';
  header.style.position = 'relative';

  const title = document.createElement('div');
  title.textContent = t('app.title');
  title.style.fontSize = isCompact ? 'calc(22px * var(--ui-scale, 1))' : 'calc(28px * var(--ui-scale, 1))';
  title.style.fontWeight = '700';
  title.style.fontFamily = 'var(--font-display)';
  title.style.letterSpacing = '0.02em';
  title.style.lineHeight = '1';

  const subtitle = document.createElement('div');
  subtitle.textContent = t('app.subtitle');
  subtitle.style.fontSize = isCompact ? 'calc(11px * var(--ui-scale, 1))' : 'calc(12px * var(--ui-scale, 1))';
  subtitle.style.opacity = '0.65';
  subtitle.style.letterSpacing = '0.01em';
  subtitle.style.lineHeight = '1.35';

  header.appendChild(title);
  header.appendChild(subtitle);

  const modeRow = document.createElement('div');
  modeRow.style.display = 'flex';
  modeRow.style.gap = '8px';
  modeRow.style.justifyContent = 'center';
  if (isCompact) {
    modeRow.style.flexWrap = 'wrap';
  }

  const modes = [
    { key: 'classic', label: t('mode.classic') },
    { key: 'rage', label: t('mode.rage') },
    { key: 'zen', label: t('mode.zen') },
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
  stats.style.gridTemplateColumns = isCompact ? 'repeat(3, minmax(0, 1fr))' : '1fr 1fr';
  stats.style.columnGap = isCompact ? '8px' : '20px';
  stats.style.rowGap = isCompact ? '8px' : '10px';
  stats.style.justifyItems = 'center';
  stats.style.fontSize = isCompact ? 'calc(12px * var(--ui-scale, 1))' : 'calc(14px * var(--ui-scale, 1))';
  stats.style.padding = isCompact ? '0' : '10px 0';
  if (isCompact) {
    stats.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:4px;"><span style="opacity:0.6;">Best</span><strong>${bestScore}</strong></div>
      <div style="display:flex;flex-direction:column;gap:4px;"><span style="opacity:0.6;">Coins</span><strong>${coins}</strong></div>
      <div style="display:flex;flex-direction:column;gap:4px;"><span style="opacity:0.6;">Streak</span><strong>${streak}</strong></div>
    `;
  } else {
    stats.innerHTML = `
      <div>${t('stats.best_mode', { mode: selectedMode })}</div><div>${bestScore}</div>
      <div>${t('stats.coins')}</div><div>${coins}</div>
      <div>${t('stats.streak')}</div><div>${streak}</div>
    `;
  }

  const dailyBlock = document.createElement('div');
  dailyBlock.style.display = 'flex';
  dailyBlock.style.flexDirection = 'column';
  dailyBlock.style.gap = isCompact ? '6px' : '8px';
  dailyBlock.style.padding = isCompact ? '10px 12px' : '12px 14px';
  dailyBlock.style.borderRadius = isCompact ? '12px' : '14px';
  dailyBlock.style.background = 'rgba(255,255,255,0.04)';
  dailyBlock.style.border = '1px solid rgba(255,255,255,0.08)';

  const dailyTextEl = document.createElement('div');
  dailyTextEl.textContent = dailyText;
  dailyTextEl.style.fontSize = isCompact ? 'calc(11px * var(--ui-scale, 1))' : 'calc(12px * var(--ui-scale, 1))';
  dailyTextEl.style.opacity = '0.85';

  const dailyBar = document.createElement('div');
  dailyBar.style.height = isCompact ? '8px' : '10px';
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
  actionRow.style.gap = isCompact ? '8px' : '10px';
  actionRow.style.justifyContent = 'center';
  actionRow.style.flexWrap = isCompact ? 'wrap' : 'nowrap';

  const playButton = createButton(t('action.play'), true, 'solid', {
    compact: isCompact,
  });
  playButton.style.fontSize = isCompact ? 'calc(16px * var(--ui-scale, 1))' : 'calc(15px * var(--ui-scale, 1))';
  if (isCompact) {
    playButton.style.flex = '1 1 112px';
    playButton.style.minHeight = '40px';
    playButton.style.boxShadow = '0 10px 24px rgba(68, 196, 173, 0.24)';
    playButton.style.background =
      'linear-gradient(135deg, rgba(110,231,183,0.34), rgba(56,189,248,0.28))';
  }
  playButton.addEventListener('click', () => {
    if (typeof onPlay === 'function') onPlay();
  });

  const secondaryButtonLabel =
    typeof onOpenFullscreen === 'function'
      ? t('action.open_fullscreen')
      : t('action.minimize');
  const secondaryButton = createButton(secondaryButtonLabel, false, 'ghost', {
    compact: isCompact,
  });
  if (isCompact) {
    secondaryButton.style.flex = '1 1 150px';
    secondaryButton.style.minHeight = '40px';
    secondaryButton.style.borderColor = 'rgba(123, 155, 217, 0.28)';
    secondaryButton.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))';
  }
  secondaryButton.addEventListener('click', () => {
    if (typeof onOpenFullscreen === 'function') {
      onOpenFullscreen();
      return;
    }
    if (typeof onMinimize === 'function') onMinimize();
  });

  const shopButton = createButton(t('action.shop'));
  shopButton.addEventListener('click', () => {
    if (typeof onShop === 'function') onShop();
  });

  const settingsButton = createButton(t('action.settings'), false, 'ghost', {
    icon: createGearIcon(),
    spinIconOnHover: true,
    compact: isCompact,
    iconOnly: true,
  });
  if (isCompact) {
    settingsButton.style.minHeight = '40px';
    settingsButton.style.borderColor = 'rgba(120, 143, 196, 0.24)';
    settingsButton.style.background =
      'linear-gradient(180deg, rgba(16,24,44,0.86), rgba(12,18,34,0.94))';
    settingsButton.style.position = 'absolute';
    settingsButton.style.top = '0';
    settingsButton.style.right = '0';
  }

  actionRow.appendChild(playButton);
  if (typeof onOpenFullscreen === 'function' || typeof onMinimize === 'function') {
    actionRow.appendChild(secondaryButton);
  }
  if (typeof onShop === 'function') {
    actionRow.appendChild(shopButton);
  }
  if (!isCompact) {
    actionRow.appendChild(settingsButton);
  }

  const settingsPanel = document.createElement('div');
  settingsPanel.style.display = 'none';
  settingsPanel.style.flexDirection = 'column';
  settingsPanel.style.gap = '12px';
  settingsPanel.style.paddingTop = isCompact ? '2px' : '0';
  if (isCompact) {
    const compactMenuView = compactSettingsSection === 'menu';
    settingsPanel.style.position = 'absolute';
    settingsPanel.style.top = '42px';
    settingsPanel.style.right = '12px';
    settingsPanel.style.left = '12px';
    settingsPanel.style.bottom = compactMenuView ? 'auto' : '20px';
    settingsPanel.style.padding = '12px';
    settingsPanel.style.borderRadius = '18px';
    settingsPanel.style.background = 'rgba(10,14,26,0.97)';
    settingsPanel.style.border = '1px solid rgba(120, 143, 196, 0.24)';
    settingsPanel.style.boxShadow = '0 20px 44px rgba(0,0,0,0.42)';
    settingsPanel.style.zIndex = '8';
    settingsPanel.style.justifyContent = 'flex-start';
    settingsPanel.style.alignItems = 'stretch';
    settingsPanel.style.overflow = 'hidden';
  }

  const togglesRow = document.createElement('div');
  togglesRow.style.display = 'grid';
  togglesRow.style.gridTemplateColumns = isCompact ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))';
  togglesRow.style.gap = isCompact ? '6px' : '8px';
  togglesRow.style.justifyContent = 'center';

  const sfxButton = createButton(
    isCompact ? t('settings.sfx') : `${t('settings.sfx')} ${settings?.sfx ? t('common.on') : t('common.off')}`,
    settings?.sfx,
    'ghost',
    { compact: isCompact }
  );
  const musicButton = createButton(
    isCompact ? t('settings.music') : `${t('settings.music')} ${settings?.music ? t('common.on') : t('common.off')}`,
    settings?.music,
    'ghost',
    { compact: isCompact }
  );
  const vibeButton = createButton(
    isCompact ? t('settings.vibe') : `${t('settings.vibe')} ${settings?.vibe ? t('common.on') : t('common.off')}`,
    settings?.vibe,
    'ghost',
    { compact: isCompact }
  );
  const muteButton = createButton(
    isCompact ? t('settings.mute') : `${t('settings.mute')} ${settings?.muteAudio ? t('common.on') : t('common.off')}`,
    settings?.muteAudio,
    'ghost',
    { compact: isCompact }
  );

  sfxButton.addEventListener('click', () => {
    if (typeof onSettingsChange === 'function') onSettingsChange({ sfx: !settings?.sfx });
  });
  musicButton.addEventListener('click', () => {
    if (typeof onSettingsChange === 'function') onSettingsChange({ music: !settings?.music });
  });
  vibeButton.addEventListener('click', () => {
    if (typeof onSettingsChange === 'function') onSettingsChange({ vibe: !settings?.vibe });
  });
  muteButton.addEventListener('click', () => {
    if (typeof onSettingsChange === 'function') {
      onSettingsChange({ muteAudio: !settings?.muteAudio });
    }
  });

  togglesRow.appendChild(sfxButton);
  togglesRow.appendChild(musicButton);
  togglesRow.appendChild(vibeButton);
  togglesRow.appendChild(muteButton);

  const accessibilityRow = document.createElement('div');
  accessibilityRow.style.display = 'grid';
  accessibilityRow.style.gridTemplateColumns = isCompact ? '1fr 1fr' : '1fr 1fr';
  accessibilityRow.style.gap = isCompact ? '6px' : '8px';
  accessibilityRow.style.justifyContent = 'center';

  const reducedMotionButton = createButton(
    isCompact
      ? t('settings.reduced_motion')
      : `${t('settings.reduced_motion')} ${settings?.reducedMotion ? t('common.on') : t('common.off')}`,
    settings?.reducedMotion,
    'ghost',
    { compact: isCompact }
  );
  const contrastButton = createButton(
    isCompact
      ? t('settings.high_contrast')
      : `${t('settings.high_contrast')} ${settings?.highContrast ? t('common.on') : t('common.off')}`,
    settings?.highContrast,
    'ghost',
    { compact: isCompact }
  );

  reducedMotionButton.addEventListener('click', () => {
    if (typeof onSettingsChange === 'function') {
      onSettingsChange({ reducedMotion: !settings?.reducedMotion });
    }
  });
  contrastButton.addEventListener('click', () => {
    if (typeof onSettingsChange === 'function') {
      onSettingsChange({ highContrast: !settings?.highContrast });
    }
  });

  accessibilityRow.appendChild(reducedMotionButton);
  accessibilityRow.appendChild(contrastButton);


  const difficultyBlock = document.createElement('div');
  difficultyBlock.style.display = 'flex';
  difficultyBlock.style.flexDirection = 'column';
  difficultyBlock.style.gap = isCompact ? '4px' : '8px';

  const difficultyLabel = document.createElement('div');
  difficultyLabel.textContent = t('settings.difficulty');
  difficultyLabel.style.fontSize = isCompact ? 'calc(10px * var(--ui-scale, 1))' : 'calc(12px * var(--ui-scale, 1))';
  difficultyLabel.style.opacity = '0.75';

  const difficultyRow = document.createElement('div');
  difficultyRow.style.display = 'flex';
  difficultyRow.style.gap = isCompact ? '6px' : '8px';
  difficultyRow.style.justifyContent = 'center';
  difficultyRow.style.flexWrap = isCompact ? 'wrap' : 'nowrap';

  const difficulties = [
    { key: 'easy', label: t('difficulty.easy') },
    { key: 'normal', label: t('difficulty.normal') },
    { key: 'hard', label: t('difficulty.hard') },
  ];

  difficulties.forEach((diff) => {
    const btn = createButton(diff.label, settings?.difficulty === diff.key, 'ghost', {
      compact: isCompact,
    });
    btn.addEventListener('click', () => {
      if (typeof onSettingsChange === 'function') onSettingsChange({ difficulty: diff.key });
    });
    if (isCompact) {
      btn.style.padding = '6px 10px';
      btn.style.fontSize = 'calc(13px * var(--ui-scale, 1))';
    }
    difficultyRow.appendChild(btn);
  });

  difficultyBlock.appendChild(difficultyLabel);
  difficultyBlock.appendChild(difficultyRow);

  const musicStyleBlock = document.createElement('div');
  musicStyleBlock.style.display = 'flex';
  musicStyleBlock.style.flexDirection = 'column';
  musicStyleBlock.style.gap = isCompact ? '4px' : '8px';

  const musicStyleLabel = document.createElement('div');
  musicStyleLabel.textContent = t('settings.music_style');
  musicStyleLabel.style.fontSize = isCompact ? 'calc(10px * var(--ui-scale, 1))' : 'calc(12px * var(--ui-scale, 1))';
  musicStyleLabel.style.opacity = '0.75';

  const musicStyleRow = document.createElement('div');
  musicStyleRow.style.display = 'flex';
  musicStyleRow.style.gap = isCompact ? '6px' : '8px';
  musicStyleRow.style.justifyContent = 'center';
  musicStyleRow.style.flexWrap = isCompact ? 'wrap' : 'nowrap';

  const styles = [
    { key: 'chill', label: t('music_style.chill') },
    { key: 'hiphop', label: t('music_style.hiphop') },
    { key: 'minimal', label: t('music_style.minimal') },
  ];

  styles.forEach((style) => {
    const btn = createButton(style.label, settings?.musicStyle === style.key, 'ghost', {
      compact: isCompact,
    });
    btn.addEventListener('click', () => {
      if (typeof onSettingsChange === 'function') onSettingsChange({ musicStyle: style.key });
    });
    if (isCompact) {
      btn.style.padding = '6px 10px';
      btn.style.fontSize = 'calc(13px * var(--ui-scale, 1))';
    }
    musicStyleRow.appendChild(btn);
  });

  musicStyleBlock.appendChild(musicStyleLabel);
  musicStyleBlock.appendChild(musicStyleRow);

  const resetRow = document.createElement('div');
  resetRow.style.display = 'flex';
  resetRow.style.justifyContent = 'center';

  const resetButton = createButton(t('settings.reset_data'), false, 'danger');
  resetButton.addEventListener('click', () => {
    if (typeof onReset === 'function') onReset();
  });

  if (typeof onReset === 'function') {
    resetRow.appendChild(resetButton);
  }

  const volumeBlock = document.createElement('div');
  volumeBlock.style.display = 'flex';
  volumeBlock.style.flexDirection = 'column';
  volumeBlock.style.gap = isCompact ? '4px' : '8px';
  volumeBlock.style.alignItems = 'center';
  if (isCompact) {
    volumeBlock.style.alignItems = 'stretch';
  }

  const sliderFactory = isCompact ? createCompactSlider : createSlider;
  const sfxSlider = sliderFactory(t('settings.sfx_volume'), settings?.sfxVolume ?? 0.8, (value) => {
    if (typeof onSettingsChange === 'function') onSettingsChange({ sfxVolume: value });
  });
  const musicSlider = sliderFactory(t('settings.music_volume'), settings?.musicVolume ?? 0.4, (value) => {
    if (typeof onSettingsChange === 'function') onSettingsChange({ musicVolume: value });
  });

  volumeBlock.appendChild(sfxSlider);
  volumeBlock.appendChild(musicSlider);
  if (!isCompact) {
    const settingsBody = document.createElement('div');
    settingsBody.style.display = 'flex';
    settingsBody.style.flexDirection = 'column';
    settingsBody.style.gap = '12px';
    settingsBody.style.flex = '1 1 auto';
    settingsBody.style.minHeight = '0';

    settingsBody.appendChild(togglesRow);
    settingsBody.appendChild(volumeBlock);
    settingsBody.appendChild(accessibilityRow);
    settingsBody.appendChild(difficultyBlock);
    settingsBody.appendChild(musicStyleBlock);
    if (typeof onReset === 'function') {
      settingsBody.appendChild(resetRow);
    }
    settingsPanel.appendChild(settingsBody);
  }

  let settingsOpen = false;
  if (isCompact) {
    settingsOpen = !!compactSettingsOpen;
    settingsPanel.style.display = settingsOpen ? 'flex' : 'none';
  }
  settingsButton.addEventListener('click', () => {
    if (isCompact) {
      if (typeof onToggleCompactSettings === 'function') onToggleCompactSettings();
      return;
    }
    settingsOpen = !settingsOpen;
    settingsPanel.style.display = settingsOpen ? 'flex' : 'none';
  });

  if (isCompact) {
    const settingsHeader = document.createElement('div');
    settingsHeader.style.display = 'flex';
    settingsHeader.style.alignItems = 'center';
    settingsHeader.style.justifyContent = 'space-between';
    settingsHeader.style.gap = '8px';
    settingsHeader.style.padding = '0 2px 2px';

    const headerLeft = document.createElement('div');
    headerLeft.style.display = 'flex';
    headerLeft.style.alignItems = 'center';
    headerLeft.style.gap = '10px';

    const settingsTitle = document.createElement('div');
    settingsTitle.textContent =
      compactSettingsSection === 'audio'
        ? 'Audio'
        : compactSettingsSection === 'accessibility'
          ? 'Accessibility'
          : compactSettingsSection === 'gameplay'
            ? 'Gameplay'
            : t('action.settings');
    settingsTitle.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
    settingsTitle.style.fontWeight = '700';
    settingsTitle.style.letterSpacing = '0.3px';
    settingsTitle.style.textAlign = 'left';
    settingsTitle.style.lineHeight = '1';

    const closeSettingsButton = createButton(
      compactSettingsSection === 'menu' ? t('action.home') : 'Back',
      false,
      'ghost',
      {
      icon: createSymbolIcon('\u2190'),
      compact: true,
      iconOnly: true,
      }
    );
    closeSettingsButton.style.width = '32px';
    closeSettingsButton.style.minWidth = '32px';
    closeSettingsButton.style.height = '32px';
    closeSettingsButton.style.borderColor = 'rgba(120, 143, 196, 0.24)';
    closeSettingsButton.style.background =
      'linear-gradient(180deg, rgba(18,26,46,0.86), rgba(12,18,34,0.94))';
    closeSettingsButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (compactSettingsSection !== 'menu') {
        if (typeof onBackCompactSettings === 'function') {
          onBackCompactSettings();
        }
      } else if (typeof onToggleCompactSettings === 'function') {
        onToggleCompactSettings();
      } else {
        settingsOpen = false;
        settingsPanel.style.display = 'none';
      }
    });

    headerLeft.appendChild(closeSettingsButton);
    headerLeft.appendChild(settingsTitle);
    settingsHeader.appendChild(headerLeft);
    settingsPanel.prepend(settingsHeader);
    settingsHeader.style.marginBottom = '4px';
  }

  if (isCompact) {
    const settingsBody = document.createElement('div');
    settingsBody.dataset.role = 'settings-body';
    settingsBody.style.display = 'flex';
    settingsBody.style.flexDirection = 'column';
    settingsBody.style.gap = '10px';
    settingsBody.style.flex = compactSettingsSection === 'menu' ? '0 0 auto' : '1 1 auto';

    const sectionMenu = document.createElement('div');
    sectionMenu.style.display = compactSettingsSection === 'menu' ? 'grid' : 'none';
    sectionMenu.style.gridTemplateColumns = '1fr';
    sectionMenu.style.gap = '10px';

    const makeSectionButton = (label, icon, key, description) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = label;
      btn.setAttribute('aria-label', label);
      btn.style.display = 'grid';
      btn.style.gridTemplateColumns = '28px 1fr';
      btn.style.alignItems = 'center';
      btn.style.gap = '12px';
      btn.style.width = '100%';
      btn.style.padding = '14px 14px 13px';
      btn.style.borderRadius = '14px';
      btn.style.border = '1px solid rgba(255,255,255,0.14)';
      btn.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))';
      btn.style.color = '#ffffff';
      btn.style.cursor = 'pointer';
      btn.style.textAlign = 'left';
      btn.style.transition = 'transform 140ms ease, border-color 180ms ease, box-shadow 180ms ease';

      const iconEl = createSymbolIcon(icon);
      iconEl.style.width = '24px';
      iconEl.style.height = '24px';
      iconEl.style.fontSize = '16px';

      const textWrap = document.createElement('div');
      textWrap.style.display = 'flex';
      textWrap.style.flexDirection = 'column';
      textWrap.style.gap = '2px';

      const titleEl = document.createElement('div');
      titleEl.textContent = label;
      titleEl.style.fontSize = '15px';
      titleEl.style.fontWeight = '600';
      titleEl.style.lineHeight = '1.2';

      const descEl = document.createElement('div');
      descEl.textContent = description;
      descEl.style.fontSize = '11px';
      descEl.style.opacity = '0.68';
      descEl.style.lineHeight = '1.25';

      textWrap.appendChild(titleEl);
      textWrap.appendChild(descEl);
      btn.appendChild(iconEl);
      btn.appendChild(textWrap);

      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-1px)';
        btn.style.borderColor = 'rgba(120, 143, 196, 0.28)';
        btn.style.boxShadow = '0 12px 26px rgba(0,0,0,0.24)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.borderColor = 'rgba(255,255,255,0.14)';
        btn.style.boxShadow = 'none';
      });
      btn.addEventListener('mousedown', () => {
        btn.style.transform = 'translateY(1px)';
      });
      btn.addEventListener('mouseup', () => {
        btn.style.transform = 'translateY(-1px)';
      });
      btn.addEventListener('click', () => {
        if (typeof onSelectCompactSettingsSection === 'function') {
          onSelectCompactSettingsSection(key);
        }
      });
      return btn;
    };

    sectionMenu.appendChild(makeSectionButton('Audio', '\u266b', 'audio', 'sound, mute, music style'));
    sectionMenu.appendChild(makeSectionButton('Accessibility', '\u25d0', 'accessibility', 'motion and contrast'));
    sectionMenu.appendChild(makeSectionButton('Gameplay', '\u25b6', 'gameplay', 'difficulty and pace'));

    const sectionDetail = document.createElement('div');
    sectionDetail.style.display = compactSettingsSection === 'menu' ? 'none' : 'flex';
    sectionDetail.style.flexDirection = 'column';
    sectionDetail.style.gap = '10px';
    sectionDetail.style.flex = '1 1 auto';

    if (compactSettingsSection === 'audio') {
      sectionDetail.appendChild(togglesRow);
      sectionDetail.appendChild(volumeBlock);
      sectionDetail.appendChild(musicStyleBlock);
    } else if (compactSettingsSection === 'accessibility') {
      sectionDetail.appendChild(accessibilityRow);
    } else if (compactSettingsSection === 'gameplay') {
      sectionDetail.appendChild(difficultyBlock);
    }

    settingsBody.appendChild(sectionMenu);
    settingsBody.appendChild(sectionDetail);

    const existingBody = settingsPanel.querySelector('[data-role="settings-body"]');
    if (existingBody) {
      existingBody.remove();
    }
    settingsPanel.appendChild(settingsBody);
  }

  if (isCompact) {
    header.appendChild(settingsButton);
  }

  container.appendChild(header);
  if (typeof onModeChange === 'function') {
    container.appendChild(modeRow);
  }
  container.appendChild(stats);
  container.appendChild(dailyBlock);
  container.appendChild(actionRow);
  container.appendChild(settingsPanel);
  root.appendChild(container);

  if (showTutorial) {
    const tutorialOverlay = document.createElement('div');
    tutorialOverlay.style.position = 'absolute';
    tutorialOverlay.style.inset = '0';
    tutorialOverlay.style.display = 'flex';
    tutorialOverlay.style.alignItems = 'center';
    tutorialOverlay.style.justifyContent = 'center';
    tutorialOverlay.style.background = 'rgba(6,10,22,0.7)';
    tutorialOverlay.style.backdropFilter = 'blur(4px)';
    tutorialOverlay.style.cursor = 'pointer';
    tutorialOverlay.style.zIndex = '5';

    const card = document.createElement('div');
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '12px';
    card.style.padding = '22px 22px 18px';
    card.style.borderRadius = '16px';
    card.style.background = 'rgba(15,20,32,0.9)';
    card.style.border = '1px solid rgba(255,255,255,0.12)';
    card.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';
    card.style.maxWidth = '360px';
    card.style.color = '#ffffff';

    const title = document.createElement('div');
    title.textContent = t('tutorial.quick_tips');
    title.style.fontSize = 'calc(18px * var(--ui-scale, 1))';
    title.style.fontWeight = '700';

    const tipList = document.createElement('div');
    tipList.style.display = 'flex';
    tipList.style.flexDirection = 'column';
    tipList.style.gap = '8px';
    tipList.style.fontSize = 'calc(13px * var(--ui-scale, 1))';
    tipList.style.opacity = '0.9';

    const tips = [t('tutorial.tip_1'), t('tutorial.tip_2'), t('tutorial.tip_3')];

    tips.forEach((text) => {
      const row = document.createElement('div');
      row.textContent = `• ${text}`;
      tipList.appendChild(row);
    });

    const hint = document.createElement('div');
    hint.textContent = t('tutorial.tap_anywhere');
    hint.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
    hint.style.opacity = '0.65';

    card.appendChild(title);
    card.appendChild(tipList);
    card.appendChild(hint);
    tutorialOverlay.appendChild(card);
    tutorialOverlay.addEventListener('click', (event) => {
      event.stopPropagation();
      if (typeof onDismissTutorial === 'function') onDismissTutorial();
    });

    root.appendChild(tutorialOverlay);
  }
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
  let previewSkin = selectedSkin;

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
  title.textContent = t('shop.title');
  title.style.fontSize = 'calc(24px * var(--ui-scale, 1))';
  title.style.fontWeight = '700';

  const coinsEl = document.createElement('div');
  coinsEl.textContent = `${t('stats.coins')}: ${coins}`;
  coinsEl.style.fontSize = 'calc(13px * var(--ui-scale, 1))';
  coinsEl.style.opacity = '0.85';

  const previewWrap = document.createElement('div');
  previewWrap.style.padding = '10px';
  previewWrap.style.borderRadius = '14px';
  previewWrap.style.background = 'rgba(255,255,255,0.04)';
  previewWrap.style.border = '1px solid rgba(255,255,255,0.08)';

  const previewLabel = document.createElement('div');
  previewLabel.textContent = t('shop.gameplay_preview');
  previewLabel.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
  previewLabel.style.opacity = '0.75';
  previewLabel.style.marginBottom = '8px';

  const previewCanvas = document.createElement('canvas');
  previewCanvas.style.width = '100%';
  previewCanvas.style.height = '140px';
  previewCanvas.style.borderRadius = '10px';
  previewCanvas.style.display = 'block';

  const previewCtx = previewCanvas.getContext('2d');
  previewWrap.appendChild(previewLabel);
  previewWrap.appendChild(previewCanvas);

  function drawPreview() {
    if (!previewCtx) return;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(280, Math.floor(previewCanvas.clientWidth * dpr));
    const height = Math.max(120, Math.floor(previewCanvas.clientHeight * dpr));
    if (previewCanvas.width !== width || previewCanvas.height !== height) {
      previewCanvas.width = width;
      previewCanvas.height = height;
    }
    renderSkinPreview(previewCtx, previewCanvas, previewSkin);
  }

  function startPreviewLoop() {
    if (!previewCtx) return;
    const tick = () => {
      if (!root.contains(container)) return;
      drawPreview();
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  }

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
    price.textContent = item.price === 0 ? t('common.free') : `${item.price}`;
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

    let label = t('action.buy');
    if (equipped) label = t('action.equipped');
    else if (owned) label = t('action.equip');

    const buttonIcon = equipped
      ? createSymbolIcon('\u2713')
      : owned
        ? createSymbolIcon('\u2726')
        : createSymbolIcon('+');
    const button = createButton(label, equipped, equipped ? 'solid' : 'ghost', {
      icon: buttonIcon,
      compact: true,
      iconOnly: true,
    });
    const canBuy = owned || coins >= item.price;
    if (!canBuy) {
      button.style.opacity = '0.5';
      button.style.cursor = 'not-allowed';
    }
    if (owned && !equipped) {
      button.style.borderColor = 'rgba(110,231,183,0.28)';
      button.style.background = 'rgba(110,231,183,0.08)';
    }
    if (equipped) {
      button.style.boxShadow = '0 12px 24px rgba(56,189,248,0.22)';
    }

    row.style.transition = 'transform 160ms ease, border-color 180ms ease, background 180ms ease';
    row.addEventListener('mouseenter', () => {
      row.style.transform = 'translateY(-1px)';
      row.style.borderColor = 'rgba(123, 155, 217, 0.28)';
      row.style.background = 'rgba(255,255,255,0.06)';
    });
    row.addEventListener('mouseleave', () => {
      row.style.transform = 'translateY(0)';
      row.style.borderColor = 'rgba(255,255,255,0.08)';
      row.style.background = 'rgba(255,255,255,0.04)';
    });

    button.addEventListener('click', () => {
      if (!canBuy) return;
      if (typeof onBuy === 'function') onBuy(item.id);
    });

    row.addEventListener('mouseenter', () => {
      if (!getSkinById(item.id)) return;
      previewSkin = item.id;
      drawPreview();
    });
    row.addEventListener('focusin', () => {
      if (!getSkinById(item.id)) return;
      previewSkin = item.id;
      drawPreview();
    });

    row.appendChild(swatch);
    row.appendChild(info);
    row.appendChild(button);
    list.appendChild(row);
  });

  list.addEventListener('mouseleave', () => {
    previewSkin = selectedSkin;
    drawPreview();
  });

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'center';

  const backButton = createButton(t('action.back'), false, 'ghost', {
    icon: createSymbolIcon('\u2190'),
    compact: true,
    iconOnly: true,
  });
  backButton.addEventListener('click', () => {
    if (typeof onBack === 'function') onBack();
  });

  actions.appendChild(backButton);

  container.appendChild(title);
  container.appendChild(coinsEl);
  container.appendChild(previewWrap);
  container.appendChild(list);
  container.appendChild(actions);
  root.appendChild(container);
  drawPreview();
  startPreviewLoop();
}




