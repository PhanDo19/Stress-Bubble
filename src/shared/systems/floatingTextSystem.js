const DEFAULT_MAX_FLOATING_TEXTS = 24;
const MIN_LIFE = 0.55;
const MAX_LIFE = 0.65;

function randomRange(min, max, rng) {
  return min + rng() * (max - min);
}

export function emitFloatingText(
  texts,
  x,
  y,
  text,
  rng = Math.random,
  maxTexts = DEFAULT_MAX_FLOATING_TEXTS
) {
  const current = Array.isArray(texts) ? texts : [];
  const life = randomRange(MIN_LIFE, MAX_LIFE, rng);
  const drift = (rng() - 0.5) * 18;
  const next = current.slice();
  next.push({
    x,
    y,
    vx: drift,
    vy: -35 - rng() * 20,
    life,
    maxLife: life,
    text: String(text),
  });
  if (next.length > maxTexts) {
    return next.slice(next.length - maxTexts);
  }
  return next;
}

export function updateFloatingTexts(texts, deltaTimeMs) {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  const dt = Number.isFinite(deltaTimeMs) ? deltaTimeMs / 1000 : 0;
  if (dt <= 0) return texts.slice();

  const next = [];
  for (const item of texts) {
    const life = item.life - dt;
    if (life <= 0) continue;
    next.push({
      ...item,
      x: item.x + item.vx * dt,
      y: item.y + item.vy * dt,
      life,
    });
  }

  return next;
}
