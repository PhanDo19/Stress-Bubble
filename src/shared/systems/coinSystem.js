export function coinsForRun(score, runStats = {}) {
  const value = Number(score) || 0;
  const durationMs = Number(runStats.durationMs) || 0;
  const maxCombo = Number(runStats.maxCombo) || 0;
  const goldenCount = Number(runStats.goldenCount) || 0;

  let reward = 70;
  if (value >= 1800) reward += 25;
  if (value >= 3200) reward += 30;
  if (value >= 5000) reward += 35;
  if (value >= 7000) reward += 45;

  if (durationMs >= 20000) reward += 10;
  if (durationMs >= 35000) reward += 14;
  if (durationMs >= 50000) reward += 18;

  reward += Math.min(24, goldenCount * 4);
  if (maxCombo >= 8) reward += 12;
  if (maxCombo >= 12) reward += 16;

  return reward;
}
