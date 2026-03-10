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
  maxTexts = DEFAULT_MAX_FLOATING_TEXTS,
  options = {}
) {
  const current = Array.isArray(texts) ? texts : [];
  const lifeMin = Number.isFinite(options.lifeMin) ? options.lifeMin : MIN_LIFE;
  const lifeMax = Number.isFinite(options.lifeMax) ? options.lifeMax : MAX_LIFE;
  const life = randomRange(lifeMin, lifeMax, rng);
  const drift =
    Number.isFinite(options.vx)
      ? options.vx
      : (rng() - 0.5) * (Number.isFinite(options.driftRange) ? options.driftRange : 18);
  const next = current.slice();
  const scale = Number.isFinite(options.scale) ? options.scale : 1;
  next.push({
    x,
    y,
    vx: drift,
    vy: (Number.isFinite(options.vy) ? options.vy : -35 - rng() * 20),
    life,
    maxLife: life,
    text: String(text),
    color: options.color || '#ffffff',
    glow: options.glow || 'rgba(255,255,255,0.25)',
    fontSize: Number.isFinite(options.fontSize) ? options.fontSize : 14,
    fontWeight: options.fontWeight || 700,
    scale,
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
