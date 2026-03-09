const RANK_TIERS = [
  { name: 'Bronze', min: 0 },
  { name: 'Silver', min: 1800 },
  { name: 'Gold', min: 2600 },
  { name: 'Diamond', min: 3400 },
  { name: 'Master', min: 4200 },
];

export function computeRank(score) {
  let rank = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (score >= tier.min) rank = tier;
  }

  const nextTier = RANK_TIERS.find((tier) => tier.min > rank.min);
  const nearMiss = nextTier
    ? `Need ${Math.max(0, nextTier.min - score)} for ${nextTier.name}`
    : 'Top rank';

  const progress = nextTier
    ? Math.max(0, Math.min(1, (score - rank.min) / (nextTier.min - rank.min)))
    : 1;

  return {
    rank: rank.name,
    nearMiss,
    rankProgress: nextTier
      ? {
          currentRank: rank.name,
          nextRank: nextTier.name,
          currentScore: score,
          nextScore: nextTier.min,
          progress,
        }
      : null,
  };
}
