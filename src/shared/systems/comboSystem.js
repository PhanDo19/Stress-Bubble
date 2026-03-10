const DEFAULT_WINDOW_MS = 1200;

function resolveWindowMs(config, count = 0) {
  if (config && Number.isFinite(config.comboWindowMs)) return config.comboWindowMs;
  if (config && Number.isFinite(config.comboWindow)) return config.comboWindow * 1000;
  if (count >= 13) return DEFAULT_WINDOW_MS + 180;
  if (count >= 8) return DEFAULT_WINDOW_MS + 120;
  if (count >= 5) return DEFAULT_WINDOW_MS + 60;
  return DEFAULT_WINDOW_MS;
}

function resolveMultiplier(count) {
  if (count >= 13) {
    const extraSteps = Math.floor((count - 13) / 4);
    return 8 + extraSteps;
  }
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
    timeLeftMs = resolveWindowMs(config, count);
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
