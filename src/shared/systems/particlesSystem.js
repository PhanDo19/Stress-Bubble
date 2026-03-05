const DEFAULT_MAX_PARTICLES = 30;
const DEFAULT_LIFE = 0.6;

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
    next.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: randomRange(DEFAULT_LIFE * 0.6, DEFAULT_LIFE * 1.2, rng),
    });
  }

  if (next.length > maxParticles) {
    return next.slice(next.length - maxParticles);
  }

  return next;
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
