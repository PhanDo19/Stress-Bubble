const SKINS = {
  skin_classic: {
    normal: { inner: '#7fb3ff', outer: '#2f7bff', stroke: '#cfe3ff', glow: 'rgba(79,140,255,0.5)' },
    fast: { inner: '#c6a7ff', outer: '#8a4bff', stroke: '#e7d9ff', glow: 'rgba(138,75,255,0.5)' },
    golden: { inner: '#ffe8a3', outer: '#f4c43a', stroke: '#fff2c9', glow: 'rgba(244,196,58,0.5)' },
    bomb: { inner: '#ff9a9a', outer: '#e04747', stroke: '#ffd1d1', glow: 'rgba(224,71,71,0.5)' },
    accent: '#ffffff',
  },
  skin_ocean: {
    normal: { inner: '#7dd3fc', outer: '#38bdf8', stroke: '#dbeafe', glow: 'rgba(56,189,248,0.55)' },
    fast: { inner: '#7dd3fc', outer: '#0ea5e9', stroke: '#bae6fd', glow: 'rgba(14,165,233,0.55)' },
    golden: { inner: '#fef08a', outer: '#fcd34d', stroke: '#fef9c3', glow: 'rgba(252,211,77,0.5)' },
    bomb: { inner: '#fda4af', outer: '#fb7185', stroke: '#fecdd3', glow: 'rgba(251,113,133,0.55)' },
    accent: '#67e8f9',
  },
  skin_neon: {
    normal: { inner: '#d8b4fe', outer: '#a855f7', stroke: '#ede9fe', glow: 'rgba(168,85,247,0.6)' },
    fast: { inner: '#67e8f9', outer: '#22d3ee', stroke: '#cffafe', glow: 'rgba(34,211,238,0.6)' },
    golden: { inner: '#fef08a', outer: '#fde047', stroke: '#fef9c3', glow: 'rgba(253,224,71,0.55)' },
    bomb: { inner: '#fda4af', outer: '#f43f5e', stroke: '#fecdd3', glow: 'rgba(244,63,94,0.6)' },
    accent: '#ffffff',
  },
  skin_ember: {
    normal: { inner: '#fdba74', outer: '#f97316', stroke: '#ffedd5', glow: 'rgba(249,115,22,0.55)' },
    fast: { inner: '#fda4af', outer: '#f43f5e', stroke: '#ffe4e6', glow: 'rgba(244,63,94,0.55)' },
    golden: { inner: '#fde68a', outer: '#facc15', stroke: '#fef3c7', glow: 'rgba(250,204,21,0.5)' },
    bomb: { inner: '#fca5a5', outer: '#ef4444', stroke: '#fee2e2', glow: 'rgba(239,68,68,0.55)' },
    accent: '#fed7aa',
  },
  skin_lunar: {
    normal: { inner: '#dbeafe', outer: '#94a3b8', stroke: '#f8fafc', glow: 'rgba(226,232,240,0.45)' },
    fast: { inner: '#c4b5fd', outer: '#8b5cf6', stroke: '#ede9fe', glow: 'rgba(139,92,246,0.5)' },
    golden: { inner: '#fef3c7', outer: '#fbbf24', stroke: '#fffbeb', glow: 'rgba(251,191,36,0.45)' },
    bomb: { inner: '#e5e7eb', outer: '#9ca3af', stroke: '#f9fafb', glow: 'rgba(156,163,175,0.42)' },
    accent: '#ffffff',
  },
  skin_toxic: {
    normal: { inner: '#bef264', outer: '#65a30d', stroke: '#ecfccb', glow: 'rgba(132,204,22,0.52)' },
    fast: { inner: '#86efac', outer: '#22c55e', stroke: '#dcfce7', glow: 'rgba(34,197,94,0.5)' },
    golden: { inner: '#fef08a', outer: '#eab308', stroke: '#fef9c3', glow: 'rgba(234,179,8,0.45)' },
    bomb: { inner: '#a3e635', outer: '#3f6212', stroke: '#ecfccb', glow: 'rgba(132,204,22,0.48)' },
    accent: '#d9f99d',
  },
  skin_sakura: {
    normal: { inner: '#fbcfe8', outer: '#ec4899', stroke: '#fdf2f8', glow: 'rgba(236,72,153,0.42)' },
    fast: { inner: '#f9a8d4', outer: '#db2777', stroke: '#fdf2f8', glow: 'rgba(219,39,119,0.5)' },
    golden: { inner: '#fde68a', outer: '#f59e0b', stroke: '#fffbeb', glow: 'rgba(245,158,11,0.45)' },
    bomb: { inner: '#fecdd3', outer: '#fb7185', stroke: '#fff1f2', glow: 'rgba(251,113,133,0.48)' },
    accent: '#ffe4e6',
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

function drawSkinAccent(ctx, bubble, skinId, colors, accentColor) {
  const x = bubble.x;
  const y = bubble.y;
  const r = bubble.radius;

  if (skinId === 'skin_ocean') {
    ctx.save();
    ctx.strokeStyle = 'rgba(103,232,249,0.65)';
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.72, Math.PI * 0.2, Math.PI * 1.25);
    ctx.stroke();
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.12, y + r * 0.08, r * 0.22, r * 0.09, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (skinId === 'skin_neon') {
    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = Math.max(1, r * 0.11);
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = Math.max(8, r * 0.8);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x - r * 0.38, y - r * 0.34, Math.max(2, r * 0.12), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (skinId === 'skin_ember') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,237,213,0.68)';
    ctx.lineWidth = Math.max(1, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(x - r * 0.28, y + r * 0.1);
    ctx.lineTo(x - r * 0.02, y - r * 0.26);
    ctx.lineTo(x + r * 0.22, y + r * 0.02);
    ctx.stroke();
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x + r * 0.22, y - r * 0.18, Math.max(2, r * 0.16), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (skinId === 'skin_lunar') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.8, -Math.PI * 0.1, Math.PI * 1.15);
    ctx.stroke();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x + r * 0.18, y - r * 0.18, Math.max(2, r * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (skinId === 'skin_toxic') {
    ctx.save();
    ctx.strokeStyle = 'rgba(217,249,157,0.72)';
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.beginPath();
    ctx.moveTo(x - r * 0.24, y - r * 0.08);
    ctx.lineTo(x - r * 0.02, y - r * 0.28);
    ctx.lineTo(x + r * 0.18, y - r * 0.02);
    ctx.lineTo(x - r * 0.02, y + r * 0.2);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (skinId === 'skin_sakura') {
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x - r * 0.18, y + r * 0.02, Math.max(2, r * 0.13), 0, Math.PI * 2);
    ctx.arc(x + r * 0.04, y - r * 0.1, Math.max(2, r * 0.12), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function renderBubbles(ctx, bubbles, skinId = 'skin_classic') {
  if (!Array.isArray(bubbles) || bubbles.length === 0) return;
  const palette = getSkinColors(skinId);
  const accentColor = palette.accent || '#ffffff';

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

    drawSkinAccent(ctx, bubble, skinId, colors, accentColor);

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
