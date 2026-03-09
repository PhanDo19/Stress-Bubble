import { ACHIEVEMENTS } from '../../systems/achievementSystem.js';
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

function createButton(text, variant = 'ghost') {
  const button = document.createElement('button');
  button.textContent = text;
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
  button.style.cursor = 'pointer';
  button.style.backdropFilter = 'blur(6px)';
  return button;
}

export function renderResult({
  rootEl,
  result,
  model,
  isPersonalBest = false,
  onReplay,
  onCopy,
  onHome,
  onClaim,
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

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'stretch';
  container.style.textAlign = 'center';
  container.style.gap = '12px';
  container.style.padding = '28px 28px 24px';
  container.style.color = '#ffffff';
  container.style.minWidth = '320px';
  container.style.maxWidth = '380px';
  container.style.borderRadius = '20px';
  container.style.background = 'rgba(10,14,26,0.7)';
  container.style.border = '1px solid rgba(255,255,255,0.08)';
  container.style.boxShadow = '0 20px 60px rgba(0,0,0,0.45)';
  container.style.backdropFilter = 'blur(10px)';

  const title = document.createElement('div');
  title.textContent = t('result.run_complete');
  title.style.fontSize = 'calc(24px * var(--ui-scale, 1))';
  title.style.fontWeight = '700';

  const scoreEl = document.createElement('div');
  scoreEl.textContent = t('result.score', { value: score });
  scoreEl.style.fontSize = 'calc(20px * var(--ui-scale, 1))';

  const rankEl = document.createElement('div');
  rankEl.textContent = t('result.rank', { value: rank });
  rankEl.style.fontSize = 'calc(18px * var(--ui-scale, 1))';
  rankEl.style.fontWeight = '600';
  rankEl.style.color = '#fef08a';

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

  const claimButton = createButton(t('action.claim_plus', { value: dailyInfo.reward }), 'solid');
  claimButton.addEventListener('click', () => {
    if (typeof onClaim === 'function') onClaim();
  });

  claimRow.appendChild(claimButton);

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '10px';
  actions.style.justifyContent = 'center';

  const replayButton = createButton(t('action.replay'), 'solid');
  replayButton.style.boxShadow = '0 10px 24px rgba(56,189,248,0.2)';
  replayButton.style.transition = 'transform 120ms ease, box-shadow 120ms ease, filter 120ms ease';
  replayButton.addEventListener('mouseenter', () => {
    replayButton.style.transform = 'translateY(-1px)';
    replayButton.style.boxShadow = '0 14px 30px rgba(56,189,248,0.3)';
    replayButton.style.filter = 'brightness(1.08)';
  });
  replayButton.addEventListener('mouseleave', () => {
    replayButton.style.transform = 'translateY(0)';
    replayButton.style.boxShadow = '0 10px 24px rgba(56,189,248,0.2)';
    replayButton.style.filter = 'none';
  });
  replayButton.addEventListener('mousedown', () => {
    replayButton.style.transform = 'translateY(1px)';
    replayButton.style.boxShadow = '0 6px 16px rgba(56,189,248,0.2)';
  });
  replayButton.addEventListener('mouseup', () => {
    replayButton.style.transform = 'translateY(-1px)';
    replayButton.style.boxShadow = '0 14px 30px rgba(56,189,248,0.3)';
  });
  replayButton.addEventListener('click', () => {
    if (typeof onReplay === 'function') onReplay();
  });

  const copyButton = createButton(t('action.copy'));
  copyButton.style.transition = 'transform 120ms ease, box-shadow 120ms ease, filter 120ms ease';
  copyButton.addEventListener('mouseenter', () => {
    copyButton.style.transform = 'translateY(-1px)';
    copyButton.style.boxShadow = '0 10px 22px rgba(255,255,255,0.15)';
    copyButton.style.filter = 'brightness(1.05)';
  });
  copyButton.addEventListener('mouseleave', () => {
    copyButton.style.transform = 'translateY(0)';
    copyButton.style.boxShadow = 'none';
    copyButton.style.filter = 'none';
  });
  copyButton.addEventListener('mousedown', () => {
    copyButton.style.transform = 'translateY(1px)';
  });
  copyButton.addEventListener('mouseup', () => {
    copyButton.style.transform = 'translateY(-1px)';
  });
  copyButton.addEventListener('click', () => {
    if (typeof onCopy === 'function') onCopy();
  });

  const homeButton = createButton(t('action.home'));
  homeButton.addEventListener('click', () => {
    if (typeof onHome === 'function') onHome();
  });

  actions.appendChild(replayButton);
  actions.appendChild(copyButton);
  actions.appendChild(homeButton);

  container.appendChild(title);
  container.appendChild(scoreEl);
  container.appendChild(rankEl);
  if (nearMiss) container.appendChild(nearEl);
  if (isPersonalBest) container.appendChild(pbEl);
  container.appendChild(coinsEl);
  container.appendChild(dailyEl);
  if (rankProgress) container.appendChild(rankProgressBlock);
  if (nearMiss) container.appendChild(nearEl);

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
  root.appendChild(container);
}
