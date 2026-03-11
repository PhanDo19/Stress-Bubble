import { ACHIEVEMENTS } from '../../systems/achievementSystem.js';
import { getCatalog, isItemUnlocked } from '../shopSystem.js';
import { t } from '../i18n.js';

function ensureRoot(rootEl) {
  if (!rootEl) return null;
  rootEl.innerHTML = '';
  return rootEl;
}

function formatDaily(daily) {
  if (!daily || !daily.challenge) {
    return { text: t('daily.none'), completed: false, canClaim: false };
  }
  const c = daily.challenge;
  const progress = Number(daily.progress) || 0;
  const target = Number(c.target) || 1;
  let label = t('daily.none');
  if (c.type === 'popCount') label = t('daily.pop_count', { target: c.target });
  if (c.type === 'maxCombo') label = t('daily.max_combo', { target: c.target });
  if (c.type === 'noBomb') label = t('daily.no_bomb');
  if (c.type === 'score') label = t('daily.score', { target: c.target });
  if (c.type === 'missMax') label = t('daily.miss_max', { target: c.target });
  if (c.type === 'goldenCount') label = t('daily.golden_count', { target: c.target });

  const displayTarget = c.type === 'noBomb' ? 1 : target;
  const displayProgress = c.type === 'noBomb' ? (daily.completed ? 1 : 0) : progress;
  const text = `${label} (${Math.min(displayProgress, displayTarget)}/${displayTarget})`;
  return {
    text,
    completed: !!daily.completed,
    canClaim: !!daily.completed && !daily.rewardClaimed,
    reward: Number(daily.rewardCoins) || 200,
  };
}

function getNextGoals(result, model) {
  const goals = [];
  const rankProgress = result?.rankProgress || null;
  if (rankProgress?.nextRank) {
    const remaining = Math.max(
      0,
      Number(rankProgress.nextScore || 0) - Number(result?.score || 0)
    );
    goals.push({
      tone: 'rank',
      text: t('result.goal_rank', {
        value: remaining,
        rank: rankProgress.nextRank,
      }),
    });
  }

  const dailyInfo = formatDaily(model?.daily);
  if (dailyInfo.completed) {
    goals.push({
      tone: 'daily',
      text: t('result.goal_daily_done'),
    });
  } else if (dailyInfo.text && dailyInfo.text !== t('daily.none')) {
    goals.push({
      tone: 'daily',
      text: t('result.goal_daily', { value: dailyInfo.text.replace(/^Daily:\s*/i, '') }),
    });
  }

  const ownedSkins = Array.isArray(model?.ownedSkins) ? model.ownedSkins : ['skin_classic'];
  const coins = Number(model?.coins) || 0;
  const nextSkin = getCatalog('bubble')
    .filter((item) => item.price > 0)
    .filter((item) => !ownedSkins.includes(item.id))
    .filter((item) => isItemUnlocked(model, item))
    .sort((a, b) => a.price - b.price)[0];

  if (nextSkin) {
    goals.push({
      tone: 'skin',
      text: t('result.goal_skin', {
        value: Math.max(0, nextSkin.price - coins),
        skin: nextSkin.name,
      }),
    });
  }

  return goals.slice(0, 3);
}

function createButton(text, variant = 'ghost', options = {}) {
  const button = document.createElement('button');
  const { icon = null, compact = false, iconOnly = false } = options;
  button.title = text;
  button.setAttribute('aria-label', text);
  button.style.padding = variant === 'solid' ? '10px 18px' : '8px 16px';
  button.style.borderRadius = '12px';
  button.style.border = '1px solid rgba(255,255,255,0.18)';
  button.style.background =
    variant === 'solid'
      ? 'linear-gradient(135deg, rgba(110,231,183,0.35), rgba(56,189,248,0.25))'
      : 'rgba(255,255,255,0.04)';
  button.style.color = '#ffffff';
  button.style.fontSize = 'calc(14px * var(--ui-scale, 1))';
  button.style.fontWeight = variant === 'solid' ? '600' : '500';
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
      ? '0 10px 24px rgba(56,189,248,0.2)'
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

  if (icon) {
    icon.style.position = 'relative';
    icon.style.zIndex = '1';
    button.appendChild(icon);
  }

  button.appendChild(label);
  button.appendChild(sheen);

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-1px)';
    button.style.filter = 'brightness(1.05)';
    button.style.boxShadow =
      variant === 'solid'
        ? '0 14px 30px rgba(56,189,248,0.28)'
        : compact
          ? '0 12px 24px rgba(0,0,0,0.24)'
          : '0 8px 18px rgba(255,255,255,0.12)';
    sheen.style.transform = 'translateX(140%)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.filter = 'none';
    button.style.boxShadow =
      variant === 'solid'
        ? '0 10px 24px rgba(56,189,248,0.2)'
        : compact
          ? '0 8px 18px rgba(0,0,0,0.18)'
          : 'none';
    sheen.style.transition = 'none';
    sheen.style.transform = 'translateX(-140%)';
    void sheen.offsetWidth;
    sheen.style.transition = 'transform 320ms ease';
  });

  button.addEventListener('mousedown', () => {
    button.style.transform = 'translateY(1px) scale(0.99)';
  });

  button.addEventListener('mouseup', () => {
    button.style.transform = 'translateY(-1px)';
  });

  return button;
}

function createIcon(symbol) {
  const icon = document.createElement('span');
  icon.textContent = symbol;
  icon.setAttribute('aria-hidden', 'true');
  icon.style.display = 'inline-flex';
  icon.style.alignItems = 'center';
  icon.style.justifyContent = 'center';
  icon.style.width = '16px';
  icon.style.height = '16px';
  icon.style.fontSize = '14px';
  icon.style.opacity = '0.92';
  return icon;
}

export function renderResult({
  rootEl,
  result,
  model,
  isPersonalBest = false,
  onReplay,
  onCopy,
  onShare,
  onHome,
  onClaim,
  actionStatus = '',
}) {
  const root = ensureRoot(rootEl);
  if (!root) return;

  const score = result?.score ?? 0;
  const rank = result?.rank ?? 'Bronze';
  const nearMiss = result?.nearMiss ?? '';
  const rankProgress = result?.rankProgress || null;
  const coinsEarned = result?.coinsEarned ?? 0;
  const runStats = result?.runStats || null;
  const achievementsUnlocked = Array.isArray(result?.achievementsUnlocked)
    ? result.achievementsUnlocked
    : [];

  const dailyInfo = formatDaily(model?.daily);
  const nextGoals = getNextGoals(result, model);

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'stretch';
  container.style.textAlign = 'center';
  container.style.gap = '12px';
  container.style.padding = '24px 20px 20px';
  container.style.color = '#ffffff';
  container.style.minWidth = 'min(320px, calc(100vw - 24px))';
  container.style.width = 'min(100%, 380px)';
  container.style.maxWidth = '380px';
  container.style.maxHeight = 'calc(100% - 20px)';
  container.style.overflowY = 'auto';
  container.style.borderRadius = '20px';
  container.style.background = 'rgba(10,14,26,0.7)';
  container.style.border = '1px solid rgba(255,255,255,0.08)';
  container.style.boxShadow = '0 20px 60px rgba(0,0,0,0.45)';
  container.style.backdropFilter = 'blur(10px)';

  const title = document.createElement('div');
  title.textContent = t('result.run_complete');
  title.style.fontSize = 'calc(24px * var(--ui-scale, 1))';
  title.style.fontWeight = '700';
  title.style.fontFamily = 'var(--font-display)';
  title.style.letterSpacing = '0.02em';
  title.style.lineHeight = '1';

  const scoreEl = document.createElement('div');
  scoreEl.textContent = t('result.score', { value: score });
  scoreEl.style.fontSize = 'calc(20px * var(--ui-scale, 1))';
  scoreEl.style.fontWeight = '600';
  scoreEl.style.letterSpacing = '0.01em';

  const rankEl = document.createElement('div');
  rankEl.textContent = t('result.rank', { value: rank });
  rankEl.style.fontSize = 'calc(18px * var(--ui-scale, 1))';
  rankEl.style.fontWeight = '600';
  rankEl.style.color = '#fef08a';
  rankEl.style.letterSpacing = '0.01em';

  const nearEl = document.createElement('div');
  nearEl.textContent = nearMiss;
  nearEl.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
  nearEl.style.opacity = '0.75';
  nearEl.style.marginTop = '-2px';
  nearEl.style.color = 'rgba(255,255,255,0.7)';

  const pbEl = document.createElement('div');
  pbEl.textContent = isPersonalBest ? t('result.personal_best') : '';
  pbEl.style.fontSize = 'calc(14px * var(--ui-scale, 1))';
  pbEl.style.color = '#6ee7b7';

  const coinsEl = document.createElement('div');
  coinsEl.textContent = t('result.coins_plus', { value: coinsEarned });
  coinsEl.style.fontSize = 'calc(15px * var(--ui-scale, 1))';

  const nextGoalsBlock = document.createElement('div');
  nextGoalsBlock.style.display = nextGoals.length > 0 ? 'flex' : 'none';
  nextGoalsBlock.style.flexDirection = 'column';
  nextGoalsBlock.style.gap = '8px';
  nextGoalsBlock.style.padding = '12px';
  nextGoalsBlock.style.borderRadius = '12px';
  nextGoalsBlock.style.background = 'rgba(255,255,255,0.04)';
  nextGoalsBlock.style.border = '1px solid rgba(255,255,255,0.08)';

  const nextGoalsTitle = document.createElement('div');
  nextGoalsTitle.textContent = t('result.next_goal_title');
  nextGoalsTitle.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
  nextGoalsTitle.style.fontWeight = '600';
  nextGoalsTitle.style.opacity = '0.88';
  nextGoalsBlock.appendChild(nextGoalsTitle);

  nextGoals.forEach((goal) => {
    const row = document.createElement('div');
    row.textContent = goal.text;
    row.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
    row.style.opacity = '0.82';
    row.style.textAlign = 'left';
    row.style.padding = '8px 10px';
    row.style.borderRadius = '10px';
    row.style.background =
      goal.tone === 'rank'
        ? 'rgba(245,158,11,0.12)'
        : goal.tone === 'daily'
          ? 'rgba(56,189,248,0.12)'
          : 'rgba(110,231,183,0.12)';
    row.style.border =
      goal.tone === 'rank'
        ? '1px solid rgba(245,158,11,0.18)'
        : goal.tone === 'daily'
          ? '1px solid rgba(56,189,248,0.18)'
          : '1px solid rgba(110,231,183,0.18)';
    nextGoalsBlock.appendChild(row);
  });

  const rankProgressBlock = document.createElement('div');
  rankProgressBlock.style.display = rankProgress ? 'flex' : 'none';
  rankProgressBlock.style.flexDirection = 'column';
  rankProgressBlock.style.gap = '6px';
  rankProgressBlock.style.padding = '10px 12px';
  rankProgressBlock.style.borderRadius = '12px';
  rankProgressBlock.style.background = 'rgba(255,255,255,0.04)';
  rankProgressBlock.style.border = '1px solid rgba(255,255,255,0.08)';

  const nextRankText = document.createElement('div');
  nextRankText.textContent = rankProgress
    ? t('result.next_rank', { rank: rankProgress.nextRank, score: rankProgress.nextScore })
    : '';
  nextRankText.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
  nextRankText.style.opacity = '0.85';

  const progressBar = document.createElement('div');
  progressBar.style.height = '8px';
  progressBar.style.borderRadius = '999px';
  progressBar.style.background = 'rgba(255,255,255,0.12)';
  progressBar.style.overflow = 'hidden';

  const progressFill = document.createElement('div');
  progressFill.style.height = '100%';
  progressFill.style.width = rankProgress
    ? `${Math.round(rankProgress.progress * 100)}%`
    : '0%';
  progressFill.style.background = 'linear-gradient(90deg, #fef08a, #f59e0b)';

  progressBar.appendChild(progressFill);
  rankProgressBlock.appendChild(nextRankText);
  rankProgressBlock.appendChild(progressBar);

  const dailyEl = document.createElement('div');
  dailyEl.textContent = dailyInfo.text;
  dailyEl.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
  dailyEl.style.opacity = '0.85';

  const claimRow = document.createElement('div');
  claimRow.style.display = dailyInfo.canClaim ? 'flex' : 'none';
  claimRow.style.justifyContent = 'center';

  const claimButton = createButton(t('action.claim_plus', { value: dailyInfo.reward }), 'solid', {
    icon: createIcon('+'),
    compact: true,
  });
  claimButton.addEventListener('click', () => {
    if (typeof onClaim === 'function') onClaim();
  });

  claimRow.appendChild(claimButton);

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '10px';
  actions.style.justifyContent = 'center';
  actions.style.flexWrap = 'wrap';

  const replayButton = createButton(t('action.replay'), 'solid', {
    icon: createIcon('\u21bb'),
    compact: true,
  });
  replayButton.style.minWidth = '112px';
  replayButton.addEventListener('click', () => {
    if (typeof onReplay === 'function') onReplay();
  });

  const copyButton = createButton(t('action.copy'), 'ghost', {
    icon: createIcon('\u2398'),
    compact: true,
  });
  copyButton.addEventListener('click', () => {
    if (typeof onCopy === 'function') onCopy();
  });

  const shareButton =
    typeof onShare === 'function'
      ? createButton(t('action.share'), 'ghost', {
          icon: createIcon('\u2197'),
          compact: true,
        })
      : null;
  if (shareButton) {
    shareButton.addEventListener('click', () => {
      onShare();
    });
  }

  const actionStatusEl = document.createElement('div');
  actionStatusEl.textContent = actionStatus ? t(actionStatus) : '';
  actionStatusEl.style.minHeight = '16px';
  actionStatusEl.style.fontSize = 'calc(11px * var(--ui-scale, 1))';
  actionStatusEl.style.opacity = actionStatus ? '0.82' : '0';
  actionStatusEl.style.color = 'rgba(255,255,255,0.82)';

  if (typeof onHome === 'function') {
    const homeButton = createButton(t('action.home'), 'ghost', {
      icon: createIcon('\u2302'),
      compact: true,
    });
    homeButton.style.minWidth = '96px';
    homeButton.addEventListener('click', () => {
      onHome();
    });
    actions.appendChild(replayButton);
    actions.appendChild(homeButton);
  } else {
    actions.appendChild(replayButton);
  }
  actions.appendChild(copyButton);
  if (shareButton) actions.appendChild(shareButton);

  container.appendChild(title);
  container.appendChild(scoreEl);
  container.appendChild(rankEl);
  if (nearMiss) container.appendChild(nearEl);
  if (isPersonalBest) container.appendChild(pbEl);
  container.appendChild(coinsEl);
  if (nextGoals.length > 0) container.appendChild(nextGoalsBlock);
  container.appendChild(dailyEl);
  if (rankProgress) container.appendChild(rankProgressBlock);

  if (runStats) {
    const statsBlock = document.createElement('div');
    statsBlock.style.display = 'grid';
    statsBlock.style.gridTemplateColumns = '1fr 1fr';
    statsBlock.style.gap = '6px 14px';
    statsBlock.style.justifyItems = 'center';
    statsBlock.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
    statsBlock.style.opacity = '0.85';
    statsBlock.innerHTML = `
      <div>${t('stats.total_pops')}</div><div>${runStats.pops ?? 0}</div>
      <div>${t('stats.best_combo')}</div><div>${runStats.maxCombo ?? 0}</div>
      <div>${t('stats.golden_hits')}</div><div>${runStats.goldenCount ?? 0}</div>
      <div>${t('stats.bomb_hits')}</div><div>${runStats.bombHits ?? 0}</div>
    `;
    container.appendChild(statsBlock);
  }

  if (achievementsUnlocked.length > 0) {
    const achievementsBlock = document.createElement('div');
    achievementsBlock.style.display = 'flex';
    achievementsBlock.style.flexDirection = 'column';
    achievementsBlock.style.gap = '6px';
    achievementsBlock.style.padding = '10px 12px';
    achievementsBlock.style.borderRadius = '12px';
    achievementsBlock.style.background = 'rgba(255,255,255,0.04)';
    achievementsBlock.style.border = '1px solid rgba(255,255,255,0.08)';

    const titleEl = document.createElement('div');
    titleEl.textContent = t('result.new_achievements');
    titleEl.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
    titleEl.style.opacity = '0.85';
    titleEl.style.fontWeight = '600';

    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '4px';
    list.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
    list.style.opacity = '0.8';

    const achievementMap = new Map(ACHIEVEMENTS.map((item) => [item.id, item.label]));
    achievementsUnlocked.forEach((id) => {
      const row = document.createElement('div');
      row.textContent = achievementMap.get(id) || id;
      list.appendChild(row);
    });

    achievementsBlock.appendChild(titleEl);
    achievementsBlock.appendChild(list);
    container.appendChild(achievementsBlock);
  }
  container.appendChild(claimRow);
  container.appendChild(actions);
  container.appendChild(actionStatusEl);
  root.appendChild(container);
}
