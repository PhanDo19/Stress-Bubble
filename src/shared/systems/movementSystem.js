const DEFAULT_SPEED = 60;
const CALM_DRIFT = 10;
const ACTIVE_DRIFT = 28;
const MAX_ACTIVE_VX = 60;
const DAMPING = 0.995;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function ensureSpeed(v, fallback) {
  if (Number.isFinite(v) && v !== 0) return v;
  return fallback;
}

function applyBounds(x, y, vx, vy, radius, width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return { x, y, vx, vy };
  }

  let nextX = x;
  let nextY = y;
  let nextVx = vx;
  let nextVy = vy;

  if (nextX - radius < 0) {
    nextX = radius;
    nextVx = Math.abs(nextVx);
  } else if (nextX + radius > width) {
    nextX = width - radius;
    nextVx = -Math.abs(nextVx);
  }

  if (nextY - radius < 0) {
    nextY = radius;
    nextVy = Math.abs(nextVy);
  } else if (nextY + radius > height) {
    nextY = height - radius;
    nextVy = -Math.abs(nextVy);
  }

  return { x: nextX, y: nextY, vx: nextVx, vy: nextVy };
}

export function updateMovement(
  bubbles,
  deltaTimeMs,
  movementState,
  canvasWidth,
  canvasHeight
) {
  if (!Array.isArray(bubbles) || bubbles.length === 0) return [];
  const dt = Number.isFinite(deltaTimeMs) ? deltaTimeMs / 1000 : 0;
  if (dt <= 0) return bubbles.slice();

  const state = (movementState || 'calm').toLowerCase();

  return bubbles.map((bubble) => {
    const radius = bubble.radius || 0;
    let vx = bubble.vx ?? 0;
    let vy = bubble.vy ?? -DEFAULT_SPEED;

    if (state === 'calm') {
      vy = -Math.abs(ensureSpeed(vy, DEFAULT_SPEED));
      const drift = (Math.random() - 0.5) * CALM_DRIFT;
      vx = clamp(vx + drift, -MAX_ACTIVE_VX, MAX_ACTIVE_VX);
    } else if (state === 'active') {
      vy = -Math.abs(ensureSpeed(vy, DEFAULT_SPEED));
      const drift = (Math.random() - 0.5) * ACTIVE_DRIFT;
      vx = clamp(vx + drift, -MAX_ACTIVE_VX, MAX_ACTIVE_VX);
    } else if (state === 'chaos') {
      vx = ensureSpeed(vx, (Math.random() - 0.5) * DEFAULT_SPEED);
      vy = ensureSpeed(vy, (Math.random() - 0.5) * DEFAULT_SPEED);
    }

    let x = bubble.x + vx * dt;
    let y = bubble.y + vy * dt;

    if (state === 'chaos') {
      const bounded = applyBounds(x, y, vx, vy, radius, canvasWidth, canvasHeight);
      x = bounded.x;
      y = bounded.y;
      vx = bounded.vx * DAMPING;
      vy = bounded.vy * DAMPING;
    } else {
      const bounded = applyBounds(x, y, vx, vy, radius, canvasWidth, canvasHeight);
      x = bounded.x;
      y = bounded.y;
      vx = bounded.vx;
      vy = bounded.vy;
    }

    return {
      ...bubble,
      x,
      y,
      vx,
      vy,
    };
  });
}
