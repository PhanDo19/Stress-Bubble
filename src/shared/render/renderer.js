import { renderBubbles } from './bubbleRenderer.js';
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

  ctx.clearRect(0, 0, width, height);
  ensureBackground(ctx, width, height, assets);

  renderBubbles(ctx, state.bubbles, state?.selectedSkin);

  if (Array.isArray(state.particles)) {
    ctx.fillStyle = '#ffffff';
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  renderHud(ctx, canvas, state);
}
