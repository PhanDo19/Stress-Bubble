import { createSkinPreviewBubbles, renderBubbles } from './bubbleRenderer.js';
import { renderHud } from './hud.js';

const BACKGROUND_THEMES = {
  bg_midnight: {
    gradient: ['#0b1023', '#060b1a', '#02040b'],
    glow: 'rgba(56,189,248,0.1)',
  },
  bg_sunset: {
    gradient: ['#2f1220', '#5b1f2a', '#1f0a12'],
    glow: 'rgba(251,146,60,0.2)',
  },
  bg_aurora: {
    gradient: ['#051d25', '#0c3b47', '#06141b'],
    glow: 'rgba(45,212,191,0.22)',
  },
  bg_grid: {
    gradient: ['#11112a', '#0a0f1d', '#03050b'],
    glow: 'rgba(168,85,247,0.2)',
    grid: true,
  },
  bg_dawn: {
    gradient: ['#132b3a', '#22577a', '#0b1722'],
    glow: 'rgba(125,211,252,0.22)',
  },
  bg_void: {
    gradient: ['#050510', '#0d1020', '#010104'],
    glow: 'rgba(99,102,241,0.24)',
  },
  bg_petals: {
    gradient: ['#2b1320', '#4c1d34', '#170913'],
    glow: 'rgba(244,114,182,0.22)',
  },
};

function shouldRenderHud(state) {
  const visibility = state?.config?.hudVisibility || 'always';
  if (visibility === 'playing-only') {
    return state?.state === 'PLAYING' || state?.state === 'PAUSED';
  }
  return true;
}

function drawThemeBackground(ctx, width, height, backgroundTheme) {
  const theme = BACKGROUND_THEMES[backgroundTheme] || BACKGROUND_THEMES.bg_midnight;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, theme.gradient[0]);
  gradient.addColorStop(0.48, theme.gradient[1]);
  gradient.addColorStop(1, theme.gradient[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.42,
    Math.min(width, height) * 0.06,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.65
  );
  glow.addColorStop(0, theme.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  if (backgroundTheme === 'bg_sunset') {
    const sun = ctx.createRadialGradient(
      width * 0.5,
      height * 0.28,
      width * 0.02,
      width * 0.5,
      height * 0.28,
      width * 0.22
    );
    sun.addColorStop(0, 'rgba(254,215,170,0.9)');
    sun.addColorStop(0.45, 'rgba(251,146,60,0.42)');
    sun.addColorStop(1, 'rgba(251,146,60,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, width, height);
  }

  if (backgroundTheme === 'bg_aurora') {
    ctx.save();
    ctx.globalAlpha = 0.42;
    const bandA = ctx.createLinearGradient(width * 0.2, 0, width * 0.65, height);
    bandA.addColorStop(0, 'rgba(45,212,191,0)');
    bandA.addColorStop(0.45, 'rgba(45,212,191,0.28)');
    bandA.addColorStop(1, 'rgba(59,130,246,0)');
    ctx.fillStyle = bandA;
    ctx.fillRect(0, 0, width, height);
    const bandB = ctx.createLinearGradient(width * 0.78, 0, width * 0.3, height);
    bandB.addColorStop(0, 'rgba(34,211,238,0)');
    bandB.addColorStop(0.4, 'rgba(34,211,238,0.22)');
    bandB.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.fillStyle = bandB;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  if (backgroundTheme === 'bg_dawn') {
    const haze = ctx.createLinearGradient(0, height * 0.12, 0, height * 0.72);
    haze.addColorStop(0, 'rgba(186,230,253,0.12)');
    haze.addColorStop(0.55, 'rgba(125,211,252,0.18)');
    haze.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);
  }

  if (backgroundTheme === 'bg_void') {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    const stars = [
      [0.16, 0.22, 1.4],
      [0.28, 0.46, 1.1],
      [0.62, 0.18, 1.6],
      [0.76, 0.34, 1.2],
      [0.84, 0.56, 1.5],
    ];
    stars.forEach(([sx, sy, sr]) => {
      ctx.beginPath();
      ctx.arc(width * sx, height * sy, sr, 0, Math.PI * 2);
      ctx.fill();
    });
    const ring = ctx.createRadialGradient(width * 0.74, height * 0.26, width * 0.03, width * 0.74, height * 0.26, width * 0.13);
    ring.addColorStop(0, 'rgba(129,140,248,0.34)');
    ring.addColorStop(0.55, 'rgba(129,140,248,0.08)');
    ring.addColorStop(1, 'rgba(129,140,248,0)');
    ctx.fillStyle = ring;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  if (backgroundTheme === 'bg_petals') {
    ctx.save();
    ctx.fillStyle = 'rgba(251,207,232,0.14)';
    const petals = [
      [0.22, 0.3, 0.12],
      [0.68, 0.24, -0.18],
      [0.82, 0.62, 0.26],
      [0.42, 0.72, -0.12],
    ];
    petals.forEach(([sx, sy, rot]) => {
      ctx.save();
      ctx.translate(width * sx, height * sy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.03, height * 0.015, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  if (theme.grid) {
    ctx.save();
    ctx.strokeStyle = 'rgba(125,211,252,0.08)';
    ctx.lineWidth = 1;
    const step = Math.max(22, Math.round(Math.min(width, height) * 0.08));
    for (let x = step; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = step; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function ensureBackground(ctx, width, height, assets, backgroundTheme = 'bg_midnight') {
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

  drawThemeBackground(ctx, width, height, backgroundTheme);
}

function getComboAura(comboCount, comboMultiplier) {
  if (comboMultiplier >= 10 || comboCount >= 21) {
    return {
      colorA: 'rgba(192,132,252,0.16)',
      colorB: 'rgba(124,58,237,0.06)',
      intensity: 1,
    };
  }
  if (comboMultiplier >= 8 || comboCount >= 13) {
    return {
      colorA: 'rgba(248,113,113,0.14)',
      colorB: 'rgba(190,24,93,0.05)',
      intensity: 0.8,
    };
  }
  if (comboCount >= 5) {
    return {
      colorA: 'rgba(251,191,36,0.1)',
      colorB: 'rgba(202,138,4,0.04)',
      intensity: 0.55,
    };
  }
  return null;
}

function renderComboAura(ctx, width, height, comboCount, comboMultiplier, reducedMotion) {
  const aura = getComboAura(comboCount, comboMultiplier);
  if (!aura) return;

  const pulse = reducedMotion ? 0.9 : 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(Date.now() / 120));
  ctx.save();
  ctx.globalAlpha = aura.intensity * pulse;

  const radial = ctx.createRadialGradient(
    width * 0.5,
    height * 0.44,
    Math.min(width, height) * 0.08,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.7
  );
  radial.addColorStop(0, aura.colorA);
  radial.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  const edge = ctx.createLinearGradient(0, 0, width, 0);
  edge.addColorStop(0, aura.colorB);
  edge.addColorStop(0.5, 'rgba(0,0,0,0)');
  edge.addColorStop(1, aura.colorB);
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function renderFrame(ctx, canvas, state, assets = null) {
  if (!ctx || !canvas) return;

  const width = Number.isFinite(state?.worldWidth) ? state.worldWidth : canvas.width;
  const height = Number.isFinite(state?.worldHeight) ? state.worldHeight : canvas.height;
  const comboCount = state?.combo?.count || 0;
  const comboMultiplier = state?.combo?.multiplier || 1;
  const comboTime = state?.combo?.timeLeftMs || 0;
  const reducedMotion = !!state?.config?.reducedMotion;
  const highContrast = !!state?.config?.highContrast;
  const backgroundTheme = state?.backgroundTheme || 'bg_midnight';

  let shake = 0;
  if (!reducedMotion) {
    if (comboMultiplier >= 10 && comboTime > 900) shake = 2.6;
    else if (comboMultiplier >= 8 && comboTime > 950) shake = 2;
    else if (comboCount >= 10 && comboTime > 1000) shake = 1.6;
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
    ensureBackground(ctx, width, height, assets, backgroundTheme);
  }

  renderComboAura(ctx, width, height, comboCount, comboMultiplier, reducedMotion);

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
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of state.floatingTexts) {
      const maxLife = Number.isFinite(t.maxLife) ? t.maxLife : 1;
      const alpha = maxLife > 0 ? t.life / maxLife : t.life;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      const scale = Number.isFinite(t.scale) ? t.scale : 1;
      const fontSize = Number.isFinite(t.fontSize) ? t.fontSize : 14;
      const fontWeight = t.fontWeight || 700;
      ctx.fillStyle = t.color || '#ffffff';
      ctx.shadowColor = t.glow || 'rgba(255,255,255,0.25)';
      ctx.shadowBlur = Math.max(0, Math.round(10 * scale));
      ctx.font = `${fontWeight} ${Math.round(fontSize * scale)}px sans-serif`;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  if (shouldRenderHud(state)) {
    renderHud(ctx, canvas, state);
  }
}

export function renderSkinPreview(
  ctx,
  canvas,
  skinId = 'skin_classic',
  backgroundTheme = 'bg_midnight'
) {
  if (!ctx || !canvas) return;

  const width = Number(canvas.width) || 320;
  const height = Number(canvas.height) || 140;

  ensureBackground(ctx, width, height, null, backgroundTheme);

  const nowMs =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  const bubbles = createSkinPreviewBubbles(width, height, nowMs);
  renderBubbles(ctx, bubbles, skinId);
}
