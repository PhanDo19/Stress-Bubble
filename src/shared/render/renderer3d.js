import { renderHud } from './hud.js';

function shouldRenderHud(state) {
  const visibility = state?.config?.hudVisibility || 'always';
  if (visibility === 'playing-only') {
    return state?.state === 'PLAYING' || state?.state === 'PAUSED';
  }
  return true;
}

const DEFAULT_CAMERA = {
  z: 780,
  fov: 740,
};

const pointerLight = {
  x: 0.72,
  y: 0.22,
  active: false,
  initialized: false,
};

const BUBBLE_TILT = {
  maxAngle: 0.22,
  maxStretch: 0.18,
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toDepth(type) {
  if (type === 'golden') return 300;
  if (type === 'fast') return 180;
  if (type === 'bomb') return 150;
  return 240;
}

function toPalette(type) {
  if (type === 'golden') {
    return { core: '#f7c948', bright: '#fff0b2', dark: '#6f4a00', rim: '#ffd86b' };
  }
  if (type === 'fast') {
    return { core: '#8a4bff', bright: '#d7beff', dark: '#27164e', rim: '#b98eff' };
  }
  if (type === 'bomb') {
    return { core: '#e04747', bright: '#ffc0c0', dark: '#4f1010', rim: '#ff8b8b' };
  }
  return { core: '#2f7bff', bright: '#b7d2ff', dark: '#10284f', rim: '#7aa7ff' };
}

function ensurePointerLightTracking() {
  if (pointerLight.initialized) return;
  pointerLight.initialized = true;

  if (typeof window === 'undefined' || !window.addEventListener) return;
  window.addEventListener('pointermove', (event) => {
    const vw = Math.max(1, window.innerWidth || 1);
    const vh = Math.max(1, window.innerHeight || 1);
    pointerLight.x = clamp01(event.clientX / vw);
    pointerLight.y = clamp01(event.clientY / vh);
    pointerLight.active = true;
  });
}

function project3D(x, y, z, camera, width, height) {
  const safeZ = Math.max(30, camera.z - z);
  const scale = camera.fov / safeZ;
  const centerX = width * 0.5;
  const centerY = height * 0.58;
  const screenX = centerX + (x - centerX) * scale;
  const screenY = centerY + (y - centerY) * scale;
  return {
    x: screenX,
    y: screenY,
    scale,
  };
}

function drawBackground(ctx, width, height) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#090f22');
  grad.addColorStop(0.45, '#060b1a');
  grad.addColorStop(1, '#02040b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    height * 0.15,
    width * 0.5,
    height * 0.55,
    height * 0.9
  );
  vignette.addColorStop(0, 'rgba(255,255,255,0.02)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawGroundPlane(ctx, width, height, lightX, lightY) {
  const horizonY = height * 0.7;
  const floor = ctx.createLinearGradient(0, horizonY, 0, height);
  floor.addColorStop(0, 'rgba(22,32,54,0)');
  floor.addColorStop(0.35, 'rgba(19,28,47,0.28)');
  floor.addColorStop(1, 'rgba(5,8,16,0.82)');
  ctx.fillStyle = floor;
  ctx.fillRect(0, horizonY, width, height - horizonY);

  const lightPool = ctx.createRadialGradient(
    lightX,
    lerp(horizonY, height * 0.9, 0.45),
    10,
    lightX,
    height * 0.92,
    width * 0.42
  );
  lightPool.addColorStop(0, 'rgba(255,255,255,0.1)');
  lightPool.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = lightPool;
  ctx.fillRect(0, horizonY, width, height - horizonY);
}

function resolveBubbleTransform(bubble, depthRatio) {
  const vx = Number.isFinite(bubble?.vx) ? bubble.vx : 0;
  const vy = Number.isFinite(bubble?.vy) ? bubble.vy : 0;
  const speed = Math.hypot(vx, vy);
  const speedRatio = clamp(speed / 160, 0, 1);
  const tilt = clamp(vx / 160, -1, 1) * BUBBLE_TILT.maxAngle;
  const stretch = speedRatio * BUBBLE_TILT.maxStretch * lerp(0.8, 1.15, depthRatio);
  const squashX = 1 + stretch * 0.65;
  const squashY = 1 - stretch * 0.45;
  return {
    tilt,
    squashX,
    squashY,
    speedRatio,
  };
}

function drawShadow(ctx, projected, radius, depthRatio, transform) {
  const shadowOffsetX = lerp(11, 18, depthRatio);
  const shadowOffsetY = lerp(16, 24, depthRatio);
  const shadowW = radius * lerp(1.2, 1.45, depthRatio) * lerp(1, 1.14, transform.speedRatio);
  const shadowH = radius * lerp(0.34, 0.42, depthRatio) * lerp(1, 0.92, transform.speedRatio);

  ctx.save();
  ctx.globalAlpha = lerp(0.18, 0.33, depthRatio);
  ctx.fillStyle = '#000000';
  ctx.filter = `blur(${Math.round(lerp(5, 11, depthRatio))}px)`;
  ctx.beginPath();
  ctx.ellipse(
    projected.x + shadowOffsetX,
    projected.y + shadowOffsetY,
    shadowW,
    shadowH,
    transform.tilt * 0.5 - 0.15,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();
}

function drawBombCore(ctx, x, y, radius) {
  const coreR = Math.max(3, radius * 0.22);
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(x, y, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#111111';
  ctx.lineWidth = Math.max(1, radius * 0.085);
  ctx.beginPath();
  ctx.moveTo(x + coreR * 0.25, y - coreR * 0.95);
  ctx.lineTo(x + coreR * 1.05, y - coreR * 1.85);
  ctx.stroke();
}

function drawNormalMappedShading(ctx, x, y, radius, lightDx, lightDy, alpha) {
  const lightLen = Math.hypot(lightDx, lightDy) || 1;
  const nx = lightDx / lightLen;
  const ny = lightDy / lightLen;
  const tangentX = -ny;
  const tangentY = nx;

  const shade = ctx.createLinearGradient(
    x - nx * radius * 1.1 - tangentX * radius * 0.2,
    y - ny * radius * 1.1 - tangentY * radius * 0.2,
    x + nx * radius * 1.1 + tangentX * radius * 0.2,
    y + ny * radius * 1.1 + tangentY * radius * 0.2
  );
  shade.addColorStop(0, `rgba(255,255,255,${(0.18 * alpha).toFixed(3)})`);
  shade.addColorStop(0.45, `rgba(255,255,255,${(0.03 * alpha).toFixed(3)})`);
  shade.addColorStop(0.65, `rgba(0,0,0,${(0.08 * alpha).toFixed(3)})`);
  shade.addColorStop(1, `rgba(0,0,0,${(0.28 * alpha).toFixed(3)})`);

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const lobe = ctx.createRadialGradient(
    x + nx * radius * 0.22,
    y + ny * radius * 0.22,
    radius * 0.06,
    x + nx * radius * 0.22,
    y + ny * radius * 0.22,
    radius * 0.55
  );
  lobe.addColorStop(0, `rgba(255,255,255,${(0.35 * alpha).toFixed(3)})`);
  lobe.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = lobe;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawBubble3D(ctx, bubble, projected, depthRatio, lightX, lightY, transform) {
  const radius = Math.max(2, bubble.radius * projected.scale);
  const x = projected.x;
  const y = projected.y;
  const palette = toPalette(bubble.type);
  const alpha = lerp(0.72, 1, depthRatio);
  const lightDx = x - lightX;
  const lightDy = y - lightY;
  const lightLen = Math.hypot(lightDx, lightDy) || 1;
  const lx = lightDx / lightLen;
  const ly = lightDy / lightLen;
  const localLightX = x - lx * radius * 0.62;
  const localLightY = y - ly * radius * 0.62;
  const fresnelStrength = lerp(0.22, 0.5, clamp01(Math.abs(lx) * 0.45 + Math.abs(ly) * 0.55));

  const base = ctx.createRadialGradient(localLightX, localLightY, radius * 0.16, x, y, radius * 1.05);
  base.addColorStop(0, palette.bright);
  base.addColorStop(0.35, palette.core);
  base.addColorStop(1, palette.dark);

  const terminator = ctx.createLinearGradient(
    x - radius * 1.1,
    y - radius * 0.95,
    x + radius * 1.05,
    y + radius * 1.15
  );
  terminator.addColorStop(0, 'rgba(255,255,255,0.12)');
  terminator.addColorStop(0.48, 'rgba(255,255,255,0)');
  terminator.addColorStop(1, 'rgba(0,0,0,0.28)');

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(transform.tilt);
  ctx.scale(transform.squashX, transform.squashY);
  ctx.translate(-x, -y);
  ctx.globalAlpha = alpha;
  ctx.shadowColor = palette.rim;
  ctx.shadowBlur = radius * 0.7;
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = terminator;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  drawNormalMappedShading(ctx, x, y, radius, lx, ly, alpha);

  const rim = ctx.createRadialGradient(x, y, radius * 0.56, x, y, radius * 1.12);
  rim.addColorStop(0, 'rgba(255,255,255,0)');
  rim.addColorStop(0.76, 'rgba(255,255,255,0.03)');
  rim.addColorStop(1, `rgba(255,255,255,${(0.52 + fresnelStrength * 0.45).toFixed(3)})`);
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  const fresnel = ctx.createLinearGradient(
    x + lx * radius * 0.6,
    y + ly * radius * 0.6,
    x - lx * radius * 0.95,
    y - ly * radius * 0.95
  );
  fresnel.addColorStop(0, 'rgba(255,255,255,0)');
  fresnel.addColorStop(0.72, 'rgba(255,255,255,0)');
  fresnel.addColorStop(1, `rgba(255,255,255,${(0.22 + fresnelStrength * 0.28).toFixed(3)})`);
  ctx.fillStyle = fresnel;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = alpha * 0.92;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = Math.max(1, radius * 0.065);
  ctx.beginPath();
  ctx.arc(x, y, radius - ctx.lineWidth * 0.45, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.9;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.42, y - radius * 0.4, radius * 0.2, radius * 0.15, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha * 0.45;
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.22, y - radius * 0.18, radius * 0.1, radius * 0.08, -0.4, 0, Math.PI * 2);
  ctx.fill();

  if (bubble.type === 'bomb') {
    ctx.globalAlpha = alpha;
    drawBombCore(ctx, x, y, radius);
  }

  ctx.restore();
}

export function renderFrame3D(ctx, canvas, state, _assets = null) {
  if (!ctx || !canvas) return;
  ensurePointerLightTracking();

  const width = Number.isFinite(state?.worldWidth) ? state.worldWidth : canvas.width;
  const height = Number.isFinite(state?.worldHeight) ? state.worldHeight : canvas.height;

  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, width, height);

  const camera = DEFAULT_CAMERA;
  const near = 120;
  const far = camera.z - 80;
  const lightX = width * (pointerLight.active ? pointerLight.x : 0.72);
  const lightY = height * (pointerLight.active ? pointerLight.y : 0.22);
  drawGroundPlane(ctx, width, height, lightX, lightY);
  const source = Array.isArray(state?.bubbles) ? state.bubbles : [];
  const bubbles = source
    .map((bubble) => ({
      ...bubble,
      z: Number.isFinite(bubble?.z) ? bubble.z : toDepth(bubble?.type),
    }))
    .sort((a, b) => a.z - b.z);

  for (const bubble of bubbles) {
    const projected = project3D(bubble.x, bubble.y, bubble.z, camera, width, height);
    const depthRatio = clamp01((bubble.z - near) / Math.max(1, far - near));
    const transform = resolveBubbleTransform(bubble, depthRatio);
    drawShadow(ctx, projected, Math.max(2, bubble.radius * projected.scale), depthRatio, transform);
    drawBubble3D(ctx, bubble, projected, depthRatio, lightX, lightY, transform);
  }

  const haze = ctx.createLinearGradient(0, 0, 0, height);
  haze.addColorStop(0, 'rgba(255,255,255,0.01)');
  haze.addColorStop(1, 'rgba(9,14,28,0.32)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, height);

  if (shouldRenderHud(state)) {
    renderHud(ctx, canvas, state);
  }
}

export function createRenderer3D() {
  return {
    renderFrame: renderFrame3D,
  };
}
