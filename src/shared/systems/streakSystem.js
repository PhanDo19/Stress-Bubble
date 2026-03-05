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

export function updateStreak(prevStreak, todayKey, playedToday) {
  const prev = prevStreak || { count: 0, lastPlayedKey: null };
  const lastKey = prev.lastPlayedKey;

  if (playedToday) {
    if (lastKey === todayKey) {
      return { ...prev, lastPlayedKey: todayKey };
    }

    if (!lastKey) {
      return { count: 1, lastPlayedKey: todayKey };
    }

    const days = diffDays(lastKey, todayKey);
    if (days === 1) {
      return { count: (prev.count || 0) + 1, lastPlayedKey: todayKey };
    }

    return { count: 1, lastPlayedKey: todayKey };
  }

  if (lastKey && lastKey !== todayKey) {
    const days = diffDays(lastKey, todayKey);
    if (days && days >= 1) {
      return { count: 1, lastPlayedKey: lastKey };
    }
  }

  return prev;
}
