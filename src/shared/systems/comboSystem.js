const DEFAULT_WINDOW_MS = 1200;

function resolveWindowMs(config) {
  if (config && Number.isFinite(config.comboWindowMs)) return config.comboWindowMs;
  if (config && Number.isFinite(config.comboWindow)) return config.comboWindow * 1000;
  return DEFAULT_WINDOW_MS;
}

function resolveMultiplier(count) {
  if (count >= 13) return 8;
  if (count >= 9) return 5;
  if (count >= 6) return 3;
  if (count >= 3) return 2;
  return 1;
}

export function applyCombo(state, event, config = null) {
  if (!state || !event || !event.type) return state;

  const current = state.combo || { count: 0, multiplier: 1, timeLeftMs: 0 };
  let count = current.count || 0;
  let timeLeftMs = current.timeLeftMs || 0;

  if (event.type === 'hit') {
    count += 1;
    timeLeftMs = resolveWindowMs(config);
  } else if (event.type === 'miss' || event.type === 'bomb') {
    count = 0;
    timeLeftMs = 0;
  } else {
    return state;
  }

  const multiplier = resolveMultiplier(count);
  return {
    ...state,
    combo: {
      count,
      multiplier,
      timeLeftMs,
    },
  };
}
