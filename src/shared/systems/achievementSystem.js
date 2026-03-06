const ACHIEVEMENTS = [
  {
    id: 'first_golden',
    label: 'First Golden Bubble',
    description: 'Pop a golden bubble.',
    check: (stats) => (stats?.goldenCount || 0) > 0,
  },
  {
    id: 'first_bomb',
    label: 'First Bomb Hit',
    description: 'Hit a bomb bubble.',
    check: (stats) => (stats?.bombHits || 0) > 0,
  },
  {
    id: 'combo_5',
    label: 'Combo x5',
    description: 'Reach a combo of 5.',
    check: (stats) => (stats?.maxCombo || 0) >= 5,
  },
  {
    id: 'combo_10',
    label: 'Combo x10',
    description: 'Reach a combo of 10.',
    check: (stats) => (stats?.maxCombo || 0) >= 10,
  },
  {
    id: 'score_500',
    label: 'Score 500',
    description: 'Reach a score of 500.',
    check: (stats) => (stats?.score || 0) >= 500,
  },
  {
    id: 'score_1000',
    label: 'Score 1000',
    description: 'Reach a score of 1000.',
    check: (stats) => (stats?.score || 0) >= 1000,
  },
];

export function evaluateAchievements(prevAchievements, runStats) {
  const unlocked = new Set(Array.isArray(prevAchievements) ? prevAchievements : []);
  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.has(achievement.id)) continue;
    if (!achievement.check(runStats)) continue;
    unlocked.add(achievement.id);
    newlyUnlocked.push(achievement.id);
  }

  return { unlocked: Array.from(unlocked), newlyUnlocked };
}

export { ACHIEVEMENTS };
