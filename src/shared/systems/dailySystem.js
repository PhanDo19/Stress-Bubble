const CHALLENGE_POOL = [
  { id: 'pop_80', type: 'popCount', target: 80 },
  { id: 'pop_120', type: 'popCount', target: 120 },
  { id: 'combo_6', type: 'maxCombo', target: 6 },
  { id: 'combo_8', type: 'maxCombo', target: 8 },
  { id: 'no_bomb', type: 'noBomb', target: 0 },
  { id: 'score_1800', type: 'score', target: 1800 },
  { id: 'score_2600', type: 'score', target: 2600 },
  { id: 'miss_5', type: 'missMax', target: 5 },
  { id: 'miss_8', type: 'missMax', target: 8 },
  { id: 'golden_2', type: 'goldenCount', target: 2 },
  { id: 'golden_3', type: 'goldenCount', target: 3 },
];

export function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getDailyChallenge(todayKey) {
  const key = todayKey || getTodayKey();
  const index = hashString(key) % CHALLENGE_POOL.length;
  const challenge = CHALLENGE_POOL[index];
  return {
    dateKey: key,
    challenge,
    progress: 0,
    completed: false,
    rewardCoins: 200,
  };
}

export function evaluateDailyProgress(daily, gameResult) {
  if (!daily || !daily.challenge || !gameResult) return daily;

  const challenge = daily.challenge;
  let progress = daily.progress || 0;
  let completed = daily.completed || false;

  if (challenge.type === 'popCount') {
    progress += gameResult.pops || 0;
    completed = progress >= challenge.target;
  } else if (challenge.type === 'maxCombo') {
    progress = Math.max(progress, gameResult.maxCombo || 0);
    completed = progress >= challenge.target;
  } else if (challenge.type === 'noBomb') {
    completed = (gameResult.bombHits || 0) === 0;
    progress = completed ? 1 : 0;
  } else if (challenge.type === 'score') {
    progress = Math.max(progress, gameResult.score || 0);
    completed = progress >= challenge.target;
  } else if (challenge.type === 'missMax') {
    progress = gameResult.misses || 0;
    completed = progress <= challenge.target;
  } else if (challenge.type === 'goldenCount') {
    progress += gameResult.goldenCount || 0;
    completed = progress >= challenge.target;
  }

  return {
    ...daily,
    progress,
    completed,
  };
}
