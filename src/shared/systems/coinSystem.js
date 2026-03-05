export function coinsForRun(score) {
  const value = Number(score) || 0;
  if (value < 2000) return 80;
  if (value < 3200) return 110;
  if (value < 4200) return 140;
  return 160;
}
