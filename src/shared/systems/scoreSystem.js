const BASE_POINTS = {
  normal: 10,
  fast: 20,
  golden: 100,
};

export function applyScore(state, event) {
  if (!state || !event || !event.type) return state;

  let delta = 0;
  if (event.type === 'pop') {
    const base = BASE_POINTS[event.bubbleType] ?? BASE_POINTS.normal;
    const multiplier = Number.isFinite(event.multiplier) ? event.multiplier : 1;
    delta = base * multiplier;
  } else if (event.type === 'bomb') {
    delta = -150;
  } else {
    return state;
  }

  const current = Number.isFinite(state.score) ? state.score : 0;
  return {
    ...state,
    score: current + delta,
  };
}
