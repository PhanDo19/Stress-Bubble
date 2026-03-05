const DEFAULT_VALUES = {
  miss: 8,
  hit: -3,
  bomb: 12,
};

function resolveValues(config) {
  if (config && config.stressValues) return config.stressValues;
  return DEFAULT_VALUES;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function applyStress(state, event, config = null) {
  if (!state || !event || !event.type) return state;
  const values = resolveValues(config);
  const delta = Number(values[event.type]);
  if (!Number.isFinite(delta)) return state;

  const current = Number.isFinite(state.stress) ? state.stress : 0;
  const nextStress = clamp(current + delta, 0, 100);
  const overloaded = nextStress >= 100;

  return {
    ...state,
    stress: nextStress,
    overloaded: overloaded || state.overloaded === true,
  };
}
