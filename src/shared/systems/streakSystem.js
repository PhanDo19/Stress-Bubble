function parseKey(key) {
  if (!key) return null;
  const parts = key.split('-').map((v) => Number(v));
  if (parts.length !== 3) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function diffDays(aKey, bKey) {
  const a = parseKey(aKey);
  const b = parseKey(bKey);
  if (!a || !b) return null;
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / 86400000);
}

const STREAK_REWARDS = [
  { count: 3, coins: 20 },
  { count: 7, coins: 50 },
  { count: 14, coins: 100 },
];

function resolveReward(nextCount, lastRewardedCount) {
  for (const reward of STREAK_REWARDS) {
    if (nextCount >= reward.count && (lastRewardedCount || 0) < reward.count) {
      return reward;
    }
  }
  return null;
}

export function updateStreak(prevStreak, todayKey, playedToday) {
  const prev = prevStreak || { count: 0, lastPlayedKey: null, lastRewardedCount: 0 };
  const lastKey = prev.lastPlayedKey;
  const prevRewardedCount = Number(prev.lastRewardedCount) || 0;

  if (playedToday) {
    if (lastKey === todayKey) {
      return { ...prev, lastPlayedKey: todayKey, rewardCoins: 0 };
    }

    if (!lastKey) {
      return {
        count: 1,
        lastPlayedKey: todayKey,
        lastRewardedCount: 0,
        rewardCoins: 0,
      };
    }

    const days = diffDays(lastKey, todayKey);
    if (days === 1) {
      const next = {
        count: (prev.count || 0) + 1,
        lastPlayedKey: todayKey,
        lastRewardedCount: prevRewardedCount,
      };
      const reward = resolveReward(next.count, next.lastRewardedCount);
      if (reward) {
        return {
          ...next,
          lastRewardedCount: reward.count,
          rewardCoins: reward.coins,
        };
      }
      return { ...next, rewardCoins: 0 };
    }

    return {
      count: 1,
      lastPlayedKey: todayKey,
      lastRewardedCount: 0,
      rewardCoins: 0,
    };
  }

  if (lastKey && lastKey !== todayKey) {
    const days = diffDays(lastKey, todayKey);
    if (days && days >= 1) {
      return {
        count: 1,
        lastPlayedKey: lastKey,
        lastRewardedCount: 0,
        rewardCoins: 0,
      };
    }
  }

  return { ...prev, rewardCoins: 0 };
}
