function ensureRoot(rootEl) {
  if (!rootEl) return null;
  rootEl.innerHTML = '';
  return rootEl;
}

function formatDaily(daily) {
  if (!daily || !daily.challenge) {
    return { text: 'Daily: -', completed: false, canClaim: false };
  }
  const c = daily.challenge;
  const progress = Number(daily.progress) || 0;
  const target = Number(c.target) || 1;
  let label = 'Daily: -';
  if (c.type === 'popCount') label = `Daily: POP ${c.target}`;
  if (c.type === 'maxCombo') label = `Daily: COMBO x${c.target}`;
  if (c.type === 'noBomb') label = 'Daily: NO BOMB';
  if (c.type === 'score') label = `Daily: SCORE ${c.target}`;
  if (c.type === 'missMax') label = `Daily: MISS <= ${c.target}`;
  if (c.type === 'goldenCount') label = `Daily: GOLDEN ${c.target}`;

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
  const coinsEarned = result?.coinsEarned ?? 0;

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
  title.textContent = 'Run Complete';
  title.style.fontSize = 'calc(24px * var(--ui-scale, 1))';
  title.style.fontWeight = '700';

  const scoreEl = document.createElement('div');
  scoreEl.textContent = `Score: ${score}`;
  scoreEl.style.fontSize = 'calc(20px * var(--ui-scale, 1))';

  const rankEl = document.createElement('div');
  rankEl.textContent = `Rank: ${rank}`;
  rankEl.style.fontSize = 'calc(16px * var(--ui-scale, 1))';

  const nearEl = document.createElement('div');
  nearEl.textContent = nearMiss;
  nearEl.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
  nearEl.style.opacity = '0.75';

  const pbEl = document.createElement('div');
  pbEl.textContent = isPersonalBest ? 'Personal Best!' : '';
  pbEl.style.fontSize = 'calc(14px * var(--ui-scale, 1))';
  pbEl.style.color = '#6ee7b7';

  const coinsEl = document.createElement('div');
  coinsEl.textContent = `Coins: +${coinsEarned}`;
  coinsEl.style.fontSize = 'calc(15px * var(--ui-scale, 1))';

  const dailyEl = document.createElement('div');
  dailyEl.textContent = dailyInfo.text;
  dailyEl.style.fontSize = 'calc(12px * var(--ui-scale, 1))';
  dailyEl.style.opacity = '0.85';

  const claimRow = document.createElement('div');
  claimRow.style.display = dailyInfo.canClaim ? 'flex' : 'none';
  claimRow.style.justifyContent = 'center';

  const claimButton = createButton(`Claim +${dailyInfo.reward}`, 'solid');
  claimButton.addEventListener('click', () => {
    if (typeof onClaim === 'function') onClaim();
  });

  claimRow.appendChild(claimButton);

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '10px';
  actions.style.justifyContent = 'center';

  const replayButton = createButton('Replay', 'solid');
  replayButton.addEventListener('click', () => {
    if (typeof onReplay === 'function') onReplay();
  });

  const copyButton = createButton('Copy');
  copyButton.addEventListener('click', () => {
    if (typeof onCopy === 'function') onCopy();
  });

  const homeButton = createButton('Home');
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
  container.appendChild(claimRow);
  container.appendChild(actions);
  root.appendChild(container);
}
