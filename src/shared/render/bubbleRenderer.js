const SKINS = {
  skin_classic: {
    normal: { inner: '#7fb3ff', outer: '#2f7bff', stroke: '#cfe3ff', glow: 'rgba(79,140,255,0.5)' },
    fast: { inner: '#c6a7ff', outer: '#8a4bff', stroke: '#e7d9ff', glow: 'rgba(138,75,255,0.5)' },
    golden: { inner: '#ffe8a3', outer: '#f4c43a', stroke: '#fff2c9', glow: 'rgba(244,196,58,0.5)' },
    bomb: { inner: '#ff9a9a', outer: '#e04747', stroke: '#ffd1d1', glow: 'rgba(224,71,71,0.5)' },
  },
  skin_ocean: {
    normal: { inner: '#7dd3fc', outer: '#38bdf8', stroke: '#dbeafe', glow: 'rgba(56,189,248,0.55)' },
    fast: { inner: '#7dd3fc', outer: '#0ea5e9', stroke: '#bae6fd', glow: 'rgba(14,165,233,0.55)' },
    golden: { inner: '#fef08a', outer: '#fcd34d', stroke: '#fef9c3', glow: 'rgba(252,211,77,0.5)' },
    bomb: { inner: '#fda4af', outer: '#fb7185', stroke: '#fecdd3', glow: 'rgba(251,113,133,0.55)' },
  },
  skin_neon: {
    normal: { inner: '#d8b4fe', outer: '#a855f7', stroke: '#ede9fe', glow: 'rgba(168,85,247,0.6)' },
    fast: { inner: '#67e8f9', outer: '#22d3ee', stroke: '#cffafe', glow: 'rgba(34,211,238,0.6)' },
    golden: { inner: '#fef08a', outer: '#fde047', stroke: '#fef9c3', glow: 'rgba(253,224,71,0.55)' },
    bomb: { inner: '#fda4af', outer: '#f43f5e', stroke: '#fecdd3', glow: 'rgba(244,63,94,0.6)' },
  },
  skin_ember: {
    normal: { inner: '#fdba74', outer: '#f97316', stroke: '#ffedd5', glow: 'rgba(249,115,22,0.55)' },
    fast: { inner: '#fda4af', outer: '#f43f5e', stroke: '#ffe4e6', glow: 'rgba(244,63,94,0.55)' },
    golden: { inner: '#fde68a', outer: '#facc15', stroke: '#fef3c7', glow: 'rgba(250,204,21,0.5)' },
    bomb: { inner: '#fca5a5', outer: '#ef4444', stroke: '#fee2e2', glow: 'rgba(239,68,68,0.55)' },
  },
};

const DEFAULT_COLORS = SKINS.skin_classic;

function getSkinColors(skinId) {
  if (!skinId) return DEFAULT_COLORS;
  return SKINS[skinId] || DEFAULT_COLORS;
}

function drawBombMark(ctx, x, y, radius) {
  const core = Math.max(3, radius * 0.25);
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath();
  ctx.arc(x, y, core, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1b1b1b';
  ctx.lineWidth = Math.max(1, radius * 0.08);
  ctx.beginPath();
  ctx.moveTo(x, y - core);
  ctx.lineTo(x + core * 0.8, y - core * 1.6);
  ctx.stroke();
}

function createBubbleGradient(ctx, x, y, radius, colors) {
  const inner = Math.max(2, radius * 0.25);
  const grad = ctx.createRadialGradient(
    x - radius * 0.3,
    y - radius * 0.3,
    inner,
    x,
    y,
    radius
  );
  grad.addColorStop(0, colors.inner);
  grad.addColorStop(1, colors.outer);
  return grad;
}

export function renderBubbles(ctx, bubbles, skinId = 'skin_classic') {
  if (!Array.isArray(bubbles) || bubbles.length === 0) return;
  const palette = getSkinColors(skinId);

  for (const bubble of bubbles) {
    const colors = palette[bubble.type] || palette.normal;
    const r = bubble.radius;

    ctx.save();
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = Math.max(6, r * 0.6);

    ctx.fillStyle = createBubbleGradient(ctx, bubble.x, bubble.y, r, colors);
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.stroke();

    ctx.globalAlpha = 0.35;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(bubble.x - r * 0.35, bubble.y - r * 0.35, Math.max(2, r * 0.28), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (bubble.type === 'bomb') {
      drawBombMark(ctx, bubble.x, bubble.y, r);
    }

    ctx.restore();
  }
}

export function createSkinPreviewBubbles(width, height, timeMs = 0) {
  const w = Math.max(220, Number(width) || 320);
  const h = Math.max(120, Number(height) || 140);
  const t = Number(timeMs) || 0;
  const bob = (offset) => Math.sin((t + offset) / 360) * 2.5;

  return [
    { type: 'normal', x: w * 0.2, y: h * 0.58 + bob(0), radius: 16 },
    { type: 'fast', x: w * 0.4, y: h * 0.42 + bob(120), radius: 14 },
    { type: 'golden', x: w * 0.62, y: h * 0.56 + bob(240), radius: 18 },
    { type: 'bomb', x: w * 0.8, y: h * 0.4 + bob(360), radius: 16 },
  ];
}
