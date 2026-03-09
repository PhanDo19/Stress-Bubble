import { createSkinPreviewBubbles, renderBubbles } from './bubbleRenderer.js';
import { renderHud } from './hud.js';

function ensureBackground(ctx, width, height, assets) {
  if (assets && assets.backgroundGradient) {
    ctx.fillStyle = assets.backgroundGradient;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (assets && assets.backgroundColor) {
    ctx.fillStyle = assets.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  ctx.fillStyle = '#0f1020';
  ctx.fillRect(0, 0, width, height);
}

export function renderFrame(ctx, canvas, state, assets = null) {
  if (!ctx || !canvas) return;

  const width = Number.isFinite(state?.worldWidth) ? state.worldWidth : canvas.width;
  const height = Number.isFinite(state?.worldHeight) ? state.worldHeight : canvas.height;
  const comboCount = state?.combo?.count || 0;
  const comboTime = state?.combo?.timeLeftMs || 0;
  const reducedMotion = !!state?.config?.reducedMotion;
  const highContrast = !!state?.config?.highContrast;

  let shake = 0;
  if (!reducedMotion) {
    if (comboCount >= 10 && comboTime > 1000) shake = 1.6;
    else if (comboCount >= 5 && comboTime > 1000) shake = 0.8;
  }

  const shakeX = shake ? (Math.random() - 0.5) * 2 * shake : 0;
  const shakeY = shake ? (Math.random() - 0.5) * 2 * shake : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);
  ctx.clearRect(-shake, -shake, width + shake * 2, height + shake * 2);
  if (highContrast) {
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, width, height);
  } else {
    ensureBackground(ctx, width, height, assets);
  }

  renderBubbles(ctx, state.bubbles, state?.selectedSkin);

  if (Array.isArray(state.particles)) {
    ctx.fillStyle = '#ffffff';
    for (const p of state.particles) {
      const maxLife = Number.isFinite(p.maxLife) ? p.maxLife : 1;
      const alpha = maxLife > 0 ? p.life / maxLife : p.life;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  if (Array.isArray(state.floatingTexts)) {
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px sans-serif';
    for (const t of state.floatingTexts) {
      const maxLife = Number.isFinite(t.maxLife) ? t.maxLife : 1;
      const alpha = maxLife > 0 ? t.life / maxLife : t.life;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  renderHud(ctx, canvas, state);
}

export function renderSkinPreview(ctx, canvas, skinId = 'skin_classic') {
  if (!ctx || !canvas) return;

  const width = Number(canvas.width) || 320;
  const height = Number(canvas.height) || 140;

  ensureBackground(ctx, width, height, null);

  const nowMs =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  const bubbles = createSkinPreviewBubbles(width, height, nowMs);
  renderBubbles(ctx, bubbles, skinId);
}
