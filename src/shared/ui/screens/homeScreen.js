import { renderSkinPreview } from '../../render/renderer.js';
import { getCatalog, getEffectivePrice, getFeaturedItem, getItemById, getSkinById, getUnlockLabel, isItemUnlocked } from '../shopSystem.js';
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
  wrapper.style.gridTemplateColumns = '64px 1fr 32px';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '6px';

  const text = document.createElement('div');
  text.textContent = label;
  text.style.fontSize = 'calc(10px * var(--ui-scale, 1))';
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
  valueEl.style.fontSize = 'calc(10px * var(--ui-scale, 1))';
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
  const selectedSkin = model?.selectedSkin || 'skin_classic';
  const selectedBackground = model?.selectedBackground || 'bg_midnight';
  const selectedAudioPack = model?.selectedAudioPack || 'audio_classic';

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

  const headerUtilities = document.createElement('div');
  headerUtilities.style.position = 'absolute';
  headerUtilities.style.top = '0';
  headerUtilities.style.right = '0';
  headerUtilities.style.display = 'flex';
  headerUtilities.style.alignItems = 'center';
  headerUtilities.style.gap = '8px';

  const title = document.createElement('div');
  title.textContent = t('app.title');
  title.style.fontSize = isCompact ? 'calc(22px * var(--ui-scale, 1))' : 'calc(28px * var(--ui-scale, 1))';
  title.style.fontWeight = '700';
  title.style.fontFamily = 'var(--font-display)';
  title.style.letterSpacing = '0.02em';
  title.style.lineHeight = '1';
  if (isCompact) {
    title.style.paddingRight = typeof onShop === 'function' ? '96px' : '52px';
    title.style.paddingLeft = '8px';
  }

  const subtitle = document.createElement('div');
  subtitle.textContent = t('app.subtitle');
  subtitle.style.fontSize = isCompact ? 'calc(11px * var(--ui-scale, 1))' : 'calc(12px * var(--ui-scale, 1))';
  subtitle.style.opacity = '0.65';
  subtitle.style.letterSpacing = '0.01em';
  subtitle.style.lineHeight = '1.35';
  if (isCompact) {
    subtitle.style.paddingRight = typeof onShop === 'function' ? '96px' : '52px';
    subtitle.style.paddingLeft = '8px';
  }

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

  const shopButton = createButton(
    t('action.shop'),
    false,
    'ghost',
    isCompact
      ? {
          icon: createSymbolIcon('\u25a3'),
          compact: true,
          iconOnly: true,
        }
      : {}
  );
  shopButton.addEventListener('click', () => {
    if (typeof onShop === 'function') onShop();
  });
  if (isCompact) {
    shopButton.style.minHeight = '40px';
    shopButton.style.borderColor = 'rgba(120, 143, 196, 0.24)';
    shopButton.style.background =
      'linear-gradient(180deg, rgba(16,24,44,0.86), rgba(12,18,34,0.94))';
  }

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
    settingsButton.style.position = 'relative';
  }

  actionRow.appendChild(playButton);
  if (typeof onOpenFullscreen === 'function' || typeof onMinimize === 'function') {
    actionRow.appendChild(secondaryButton);
  }
  if (!isCompact && typeof onShop === 'function') {
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
    const compactAudioDetail = compactSettingsSection === 'audio';
    settingsPanel.style.position = 'absolute';
    settingsPanel.style.top = compactAudioDetail ? '34px' : '42px';
    settingsPanel.style.right = '12px';
    settingsPanel.style.left = '12px';
    settingsPanel.style.bottom = compactMenuView ? 'auto' : compactAudioDetail ? '14px' : '20px';
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
  if (isCompact) {
    [sfxButton, musicButton, vibeButton, muteButton].forEach((button) => {
      button.style.padding = '6px 10px';
      button.style.minHeight = '34px';
      button.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
      button.style.borderRadius = '12px';
    });
  }

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
  if (isCompact) {
    musicStyleRow.style.flexWrap = 'wrap';
  }
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
      btn.style.padding = '5px 9px';
      btn.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
    }
    musicStyleRow.appendChild(btn);
  });

  musicStyleBlock.appendChild(musicStyleLabel);
  musicStyleBlock.appendChild(musicStyleRow);

  const loadoutBlock = document.createElement('div');
  loadoutBlock.style.display = 'flex';
  loadoutBlock.style.flexDirection = 'column';
  loadoutBlock.style.gap = isCompact ? '6px' : '8px';
  loadoutBlock.style.padding = isCompact ? '8px 10px' : '10px 12px';
  loadoutBlock.style.borderRadius = isCompact ? '12px' : '14px';
  loadoutBlock.style.background = 'rgba(255,255,255,0.035)';
  loadoutBlock.style.border = '1px solid rgba(255,255,255,0.08)';

  const loadoutTitle = document.createElement('div');
  loadoutTitle.textContent = 'Loadout';
  loadoutTitle.style.fontSize = isCompact ? 'calc(10px * var(--ui-scale, 1))' : 'calc(12px * var(--ui-scale, 1))';
  loadoutTitle.style.opacity = '0.72';

  const loadoutGrid = document.createElement('div');
  loadoutGrid.style.display = 'grid';
  loadoutGrid.style.gridTemplateColumns = 'auto 1fr';
  loadoutGrid.style.columnGap = '10px';
  loadoutGrid.style.rowGap = isCompact ? '4px' : '6px';
  loadoutGrid.style.fontSize = isCompact ? 'calc(11px * var(--ui-scale, 1))' : 'calc(12px * var(--ui-scale, 1))';
  loadoutGrid.style.textAlign = 'left';
  loadoutGrid.innerHTML = `
    <span style="opacity:0.62;">Bubble</span><strong>${getCosmeticName(selectedSkin)}</strong>
    <span style="opacity:0.62;">Background</span><strong>${getCosmeticName(selectedBackground)}</strong>
    <span style="opacity:0.62;">Audio</span><strong>${getCosmeticName(selectedAudioPack)}</strong>
  `;

  loadoutBlock.appendChild(loadoutTitle);
  loadoutBlock.appendChild(loadoutGrid);

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
    settingsBody.appendChild(loadoutBlock);
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
    sectionDetail.style.gap = compactSettingsSection === 'audio' ? '8px' : '10px';
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
    if (compactSettingsSection === 'menu') {
      settingsBody.appendChild(loadoutBlock);
    }
    settingsBody.appendChild(sectionDetail);

    const existingBody = settingsPanel.querySelector('[data-role="settings-body"]');
    if (existingBody) {
      existingBody.remove();
    }
    settingsPanel.appendChild(settingsBody);
  }

  if (isCompact) {
    if (typeof onShop === 'function') {
      headerUtilities.appendChild(shopButton);
    }
    headerUtilities.appendChild(settingsButton);
    header.appendChild(headerUtilities);
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
  if (id === 'skin_lunar') return 'linear-gradient(135deg, #e2e8f0, #64748b)';
  if (id === 'skin_toxic') return 'linear-gradient(135deg, #bef264, #4d7c0f)';
  if (id === 'skin_sakura') return 'linear-gradient(135deg, #f9a8d4, #db2777)';
  return 'linear-gradient(135deg, #94a3b8, #64748b)';
}

function getBackgroundSwatch(id) {
  if (id === 'bg_sunset') return 'linear-gradient(135deg, #fb923c, #7c2d12)';
  if (id === 'bg_aurora') return 'linear-gradient(135deg, #2dd4bf, #1d4ed8)';
  if (id === 'bg_grid') return 'linear-gradient(135deg, #0f172a, #312e81)';
  if (id === 'bg_dawn') return 'linear-gradient(135deg, #7dd3fc, #164e63)';
  if (id === 'bg_void') return 'linear-gradient(135deg, #0f172a, #4338ca)';
  if (id === 'bg_petals') return 'linear-gradient(135deg, #f9a8d4, #7a284f)';
  return 'linear-gradient(135deg, #0b1023, #02040b)';
}

function getAudioPackGlyph(id) {
  if (id === 'audio_arcade') return '\u25a6';
  if (id === 'audio_lofi') return '\u266b';
  if (id === 'audio_neon') return '\u2736';
  if (id === 'audio_crystal') return '\u25c7';
  if (id === 'audio_vapor') return '\u223f';
  if (id === 'audio_reactor') return '\u25c9';
  return '\u266a';
}

function getCosmeticName(id) {
  const item = getItemById(id);
  if (!item) return id || '-';
  return item.category === 'bubble' ? `${item.name} Bubble` : item.name;
}

function getTierLabel(tier) {
  if (tier === 'legend') return 'Legend';
  if (tier === 'rare') return 'Rare';
  if (tier === 'core') return 'Core';
  return 'Starter';
}

function getTierTint(tier) {
  if (tier === 'legend') return 'rgba(244,114,182,0.16)';
  if (tier === 'rare') return 'rgba(192,132,252,0.16)';
  if (tier === 'core') return 'rgba(56,189,248,0.14)';
  return 'rgba(110,231,183,0.14)';
}

function drawAudioPreview(ctx, canvas, audioPackId = 'audio_classic', backgroundTheme = 'bg_midnight') {
  renderSkinPreview(ctx, canvas, 'skin_classic', backgroundTheme);
  const width = canvas.width || 320;
  const height = canvas.height || 140;
  const titles = {
    audio_classic: 'Classic SFX',
    audio_arcade: 'Arcade Pack',
    audio_lofi: 'Lo-Fi Pack',
    audio_neon: 'Neon Pack',
    audio_crystal: 'Crystal Pack',
    audio_vapor: 'Vapor Pack',
    audio_reactor: 'Reactor Pack',
  };
  const accent = {
    audio_classic: '#cbd5e1',
    audio_arcade: '#f59e0b',
    audio_lofi: '#2dd4bf',
    audio_neon: '#c084fc',
    audio_crystal: '#e0f2fe',
    audio_vapor: '#f9a8d4',
    audio_reactor: '#fca5a5',
  };
  const color = accent[audioPackId] || '#cbd5e1';

  ctx.save();
  ctx.fillStyle = 'rgba(7,10,20,0.68)';
  ctx.fillRect(width * 0.08, height * 0.2, width * 0.84, height * 0.58);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.strokeRect(width * 0.08, height * 0.2, width * 0.84, height * 0.58);

  ctx.fillStyle = color;
  ctx.font = '700 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(titles[audioPackId] || 'Audio Pack', width * 0.5, height * 0.42);

  const bars = [0.35, 0.62, 0.48, 0.76, 0.54, 0.7];
  bars.forEach((ratio, index) => {
    const barW = width * 0.055;
    const gap = width * 0.03;
    const x = width * 0.24 + index * (barW + gap);
    const h = height * ratio * 0.34;
    const y = height * 0.68 - h;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35 + index * 0.08;
    ctx.fillRect(x, y, barW, h);
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function renderShop({
  rootEl,
  model,
  onBuy,
  onBack,
  variant = 'default',
  activeCategory = 'bubble',
  onCategoryChange,
  todayKey = '',
}) {
  const root = ensureRoot(rootEl);
  if (!root) return;

  const coins = Number(model?.coins) || 0;
  const ownedSkins = Array.isArray(model?.ownedSkins) ? model.ownedSkins : ['skin_classic'];
  const selectedSkin = model?.selectedSkin || 'skin_classic';
  const ownedBackgrounds = Array.isArray(model?.ownedBackgrounds) ? model.ownedBackgrounds : ['bg_midnight'];
  const selectedBackground = model?.selectedBackground || 'bg_midnight';
  const ownedAudioPacks = Array.isArray(model?.ownedAudioPacks) ? model.ownedAudioPacks : ['audio_classic'];
  const selectedAudioPack = model?.selectedAudioPack || 'audio_classic';
  let previewSkin = selectedSkin;
  let previewBackground = selectedBackground;
  let previewAudioPack = selectedAudioPack;
  const isCompact = variant === 'compact';
  const featuredItem = getFeaturedItem(todayKey, activeCategory);

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'stretch';
  container.style.textAlign = 'center';
  container.style.gap = isCompact ? '12px' : '16px';
  container.style.padding = isCompact ? '18px 18px 16px' : '28px 28px 24px';
  container.style.color = '#ffffff';
  container.style.minWidth = isCompact ? '0' : '340px';
  container.style.width = isCompact ? 'min(100%, 372px)' : '';
  container.style.maxWidth = isCompact ? '372px' : '420px';
  container.style.borderRadius = isCompact ? '18px' : '20px';
  container.style.background = isCompact ? 'rgba(8,12,26,0.82)' : 'rgba(10,14,26,0.7)';
  container.style.border = isCompact ? '1px solid rgba(78,116,176,0.28)' : '1px solid rgba(255,255,255,0.08)';
  container.style.boxShadow = isCompact
    ? '0 18px 44px rgba(0,0,0,0.38)'
    : '0 20px 60px rgba(0,0,0,0.45)';
  container.style.backdropFilter = 'blur(10px)';
  if (isCompact) {
    container.style.maxHeight = 'calc(100% - 36px)';
    container.style.overflowY = 'auto';
  }

  const title = document.createElement('div');
  title.textContent = t('shop.title');
  title.style.fontSize = isCompact ? 'calc(20px * var(--ui-scale, 1))' : 'calc(24px * var(--ui-scale, 1))';
  title.style.fontWeight = '700';
  title.style.fontFamily = 'var(--font-display)';

  const coinsEl = document.createElement('div');
  coinsEl.textContent = `${t('stats.coins')}: ${coins}`;
  coinsEl.style.fontSize = isCompact ? 'calc(12px * var(--ui-scale, 1))' : 'calc(13px * var(--ui-scale, 1))';
  coinsEl.style.opacity = '0.85';

  const previewWrap = document.createElement('div');
  previewWrap.style.padding = isCompact ? '8px' : '10px';
  previewWrap.style.borderRadius = isCompact ? '12px' : '14px';
  previewWrap.style.background = 'rgba(255,255,255,0.04)';
  previewWrap.style.border = '1px solid rgba(255,255,255,0.08)';

  const previewLabel = document.createElement('div');
  previewLabel.textContent = t('shop.gameplay_preview');
  previewLabel.style.fontSize = isCompact ? 'calc(11px * var(--ui-scale, 1))' : 'calc(12px * var(--ui-scale, 1))';
  previewLabel.style.opacity = '0.75';
  previewLabel.style.marginBottom = '8px';

  const previewCanvas = document.createElement('canvas');
  previewCanvas.style.width = '100%';
  previewCanvas.style.height = isCompact ? '118px' : '140px';
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
    if (activeCategory === 'audio') {
      drawAudioPreview(previewCtx, previewCanvas, previewAudioPack, previewBackground);
      return;
    }
    renderSkinPreview(previewCtx, previewCanvas, previewSkin, previewBackground);
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
  list.style.gap = isCompact ? '8px' : '10px';

  const featuredCard = document.createElement('div');
  featuredCard.style.display = featuredItem ? 'grid' : 'none';
  featuredCard.style.gridTemplateColumns = '1fr auto';
  featuredCard.style.alignItems = 'center';
  featuredCard.style.gap = '10px';
  featuredCard.style.padding = isCompact ? '9px 10px' : '11px 12px';
  featuredCard.style.borderRadius = isCompact ? '10px' : '12px';
  featuredCard.style.background = 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(244,114,182,0.12))';
  featuredCard.style.border = '1px solid rgba(255,255,255,0.1)';
  if (featuredItem) {
    const featuredInfo = document.createElement('div');
    featuredInfo.style.display = 'flex';
    featuredInfo.style.flexDirection = 'column';
    featuredInfo.style.gap = '3px';

    const featuredEyebrow = document.createElement('div');
    featuredEyebrow.textContent = 'Featured Today';
    featuredEyebrow.style.fontSize = isCompact ? 'calc(9px * var(--ui-scale, 1))' : 'calc(10px * var(--ui-scale, 1))';
    featuredEyebrow.style.opacity = '0.72';

    const featuredName = document.createElement('div');
    featuredName.textContent = `${featuredItem.name} - ${getTierLabel(featuredItem.tier)}`;
    featuredName.style.fontSize = isCompact ? 'calc(12px * var(--ui-scale, 1))' : 'calc(13px * var(--ui-scale, 1))';
    featuredName.style.fontWeight = '600';

    const featuredPrice = document.createElement('div');
    featuredPrice.textContent = `${getEffectivePrice(featuredItem, todayKey)} coins today`;
    featuredPrice.style.fontSize = isCompact ? 'calc(10px * var(--ui-scale, 1))' : 'calc(11px * var(--ui-scale, 1))';
    featuredPrice.style.opacity = '0.76';

    featuredInfo.appendChild(featuredEyebrow);
    featuredInfo.appendChild(featuredName);
    featuredInfo.appendChild(featuredPrice);
    featuredCard.appendChild(featuredInfo);

    const featuredBadge = document.createElement('div');
    featuredBadge.textContent = '-15%';
    featuredBadge.style.fontSize = isCompact ? 'calc(11px * var(--ui-scale, 1))' : 'calc(12px * var(--ui-scale, 1))';
    featuredBadge.style.fontWeight = '700';
    featuredBadge.style.padding = '6px 10px';
    featuredBadge.style.borderRadius = '999px';
    featuredBadge.style.background = 'rgba(255,255,255,0.14)';
    featuredBadge.style.border = '1px solid rgba(255,255,255,0.14)';
    featuredCard.appendChild(featuredBadge);
  }

  const categoryRow = document.createElement('div');
  categoryRow.style.display = 'flex';
  categoryRow.style.justifyContent = 'center';
  categoryRow.style.gap = '8px';
  categoryRow.style.flexWrap = 'wrap';

  const categories = [
    { key: 'bubble', label: 'Bubble' },
    { key: 'background', label: 'Background' },
    { key: 'audio', label: 'Audio' },
  ];

  categories.forEach((category) => {
    const btn = createButton(category.label, activeCategory === category.key, 'ghost', {
      compact: true,
    });
    btn.style.padding = isCompact ? '6px 10px' : '8px 12px';
    btn.addEventListener('click', () => {
      if (typeof onCategoryChange === 'function') {
        onCategoryChange(category.key);
        return;
      }
      renderShop({
        rootEl,
        model,
        onBuy,
        onBack,
        variant,
        activeCategory: category.key,
        onCategoryChange,
        todayKey,
      });
    });
    categoryRow.appendChild(btn);
  });

  getCatalog(activeCategory).forEach((item) => {
    const row = document.createElement('div');
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '36px 1fr auto';
    row.style.alignItems = 'center';
    row.style.gap = '12px';
    row.style.padding = isCompact ? '9px 10px' : '10px 12px';
    row.style.borderRadius = isCompact ? '10px' : '12px';
    row.style.background = 'rgba(255,255,255,0.04)';
    row.style.border = '1px solid rgba(255,255,255,0.08)';

    const swatch = document.createElement('div');
    swatch.style.width = '30px';
    swatch.style.height = '30px';
    swatch.style.borderRadius = item.category === 'background' ? '10px' : '50%';
    swatch.style.background =
      item.category === 'background'
        ? getBackgroundSwatch(item.id)
        : item.category === 'audio'
          ? 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))'
          : getSkinColor(item.id);
    swatch.style.border = '1px solid rgba(255,255,255,0.35)';
    if (item.category === 'audio') {
      swatch.style.display = 'flex';
      swatch.style.alignItems = 'center';
      swatch.style.justifyContent = 'center';
      swatch.style.fontSize = '14px';
      swatch.textContent = getAudioPackGlyph(item.id);
    }

    const name = document.createElement('div');
    name.textContent = item.name;
    name.style.fontSize = isCompact ? 'calc(13px * var(--ui-scale, 1))' : 'calc(14px * var(--ui-scale, 1))';
    name.style.textAlign = 'left';

    const metaRow = document.createElement('div');
    metaRow.style.display = 'flex';
    metaRow.style.alignItems = 'center';
    metaRow.style.gap = '6px';

    const tierBadge = document.createElement('span');
    tierBadge.textContent = getTierLabel(item.tier);
    tierBadge.style.fontSize = isCompact ? 'calc(9px * var(--ui-scale, 1))' : 'calc(10px * var(--ui-scale, 1))';
    tierBadge.style.padding = '2px 6px';
    tierBadge.style.borderRadius = '999px';
    tierBadge.style.background = getTierTint(item.tier);
    tierBadge.style.border = '1px solid rgba(255,255,255,0.08)';
    tierBadge.style.opacity = '0.95';

    const unlocked = isItemUnlocked(model, item);
    const effectivePrice = getEffectivePrice(item, todayKey);

    const price = document.createElement('div');
    price.textContent = item.price === 0 ? t('common.free') : `${effectivePrice} coins`;
    price.style.fontSize = isCompact ? 'calc(11px * var(--ui-scale, 1))' : 'calc(12px * var(--ui-scale, 1))';
    price.style.opacity = '0.7';

    const description = document.createElement('div');
    description.textContent = unlocked ? item.description || '' : getUnlockLabel(item);
    description.style.fontSize = isCompact ? 'calc(10px * var(--ui-scale, 1))' : 'calc(11px * var(--ui-scale, 1))';
    description.style.opacity = '0.62';
    description.style.textAlign = 'left';

    const info = document.createElement('div');
    info.style.display = 'flex';
    info.style.flexDirection = 'column';
    info.style.gap = '3px';
    metaRow.appendChild(tierBadge);
    metaRow.appendChild(price);
    info.appendChild(name);
    info.appendChild(metaRow);
    info.appendChild(description);

    const owned =
      item.category === 'background'
        ? ownedBackgrounds.includes(item.id)
        : item.category === 'audio'
          ? ownedAudioPacks.includes(item.id)
          : ownedSkins.includes(item.id);
    const equipped =
      item.category === 'background'
        ? selectedBackground === item.id
        : item.category === 'audio'
          ? selectedAudioPack === item.id
          : selectedSkin === item.id;

    let label = t('action.buy');
    if (equipped) label = t('action.equipped');
    else if (owned) label = t('action.equip');
    else if (!unlocked) label = 'Locked';

    const buttonIcon = equipped
      ? createSymbolIcon('\u2713')
      : !unlocked
        ? createSymbolIcon('\u25cf')
        : owned
        ? createSymbolIcon('\u2726')
        : createSymbolIcon('+');
    const button = createButton(label, equipped, equipped ? 'solid' : 'ghost', {
      icon: buttonIcon,
      compact: true,
      iconOnly: true,
    });
    const canBuy = unlocked && (owned || coins >= effectivePrice);
    if (!canBuy) {
      button.style.opacity = '0.5';
      button.style.cursor = 'not-allowed';
    }
    if (!unlocked) {
      row.style.opacity = '0.72';
      swatch.style.filter = 'grayscale(0.2)';
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
      if (item.category === 'background') {
        previewBackground = item.id;
      } else if (item.category === 'audio') {
        previewAudioPack = item.id;
      } else if (getSkinById(item.id)) {
        previewSkin = item.id;
      }
      drawPreview();
    });
    row.addEventListener('focusin', () => {
      if (item.category === 'background') {
        previewBackground = item.id;
      } else if (item.category === 'audio') {
        previewAudioPack = item.id;
      } else if (getSkinById(item.id)) {
        previewSkin = item.id;
      }
      drawPreview();
    });

    row.appendChild(swatch);
    row.appendChild(info);
    row.appendChild(button);
    list.appendChild(row);
  });

  list.addEventListener('mouseleave', () => {
    previewSkin = selectedSkin;
    previewBackground = selectedBackground;
    previewAudioPack = selectedAudioPack;
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
  container.appendChild(categoryRow);
  if (featuredItem) {
    container.appendChild(featuredCard);
  }
  container.appendChild(list);
  container.appendChild(actions);
  root.appendChild(container);
  drawPreview();
  startPreviewLoop();
}
