const DEFAULT_MAX_PARTICLES = 30;
const MIN_LIFE = 0.35;
const MAX_LIFE = 0.45;

function randomRange(min, max, rng) {
  return min + rng() * (max - min);
}

export function emitPopParticles(particles, x, y, intensity = 6, maxParticles = DEFAULT_MAX_PARTICLES, rng = Math.random) {
  const current = Array.isArray(particles) ? particles : [];
  const count = Math.max(1, Math.round(intensity));
  const next = current.slice();

  for (let i = 0; i < count; i += 1) {
    const angle = rng() * Math.PI * 2;
    const speed = randomRange(40, 140, rng);
    const life = randomRange(MIN_LIFE, MAX_LIFE, rng);
    next.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
    });
  }

  if (next.length > maxParticles) {
    return next.slice(next.length - maxParticles);
  }

  return next;
}

export function emitPopBurst(
  particles,
  x,
  y,
  maxParticles = DEFAULT_MAX_PARTICLES,
  rng = Math.random,
  detailScale = 1
) {
  const count = Math.max(1, Math.round((6 + Math.floor(rng() * 5)) * Math.max(0.25, detailScale)));
  return emitPopParticles(particles, x, y, count, maxParticles, rng);
}

export function updateParticles(particles, deltaTimeMs) {
  if (!Array.isArray(particles) || particles.length === 0) return [];
  const dt = Number.isFinite(deltaTimeMs) ? deltaTimeMs / 1000 : 0;
  if (dt <= 0) return particles.slice();

  const next = [];
  for (const particle of particles) {
    const life = particle.life - dt;
    if (life <= 0) continue;
    next.push({
      ...particle,
      x: particle.x + particle.vx * dt,
      y: particle.y + particle.vy * dt,
      life,
    });
  }

  return next;
}
