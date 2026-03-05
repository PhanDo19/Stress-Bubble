export function updateLifetime(bubbles, deltaTimeMs, canvasHeight) {
  if (!Array.isArray(bubbles) || bubbles.length === 0) {
    return { bubbles: [], missedCount: 0 };
  }

  const dt = Number.isFinite(deltaTimeMs) ? deltaTimeMs / 1000 : 0;
  let missedCount = 0;

  const next = [];
  for (const bubble of bubbles) {
    const nextLifetime = (bubble.lifetime ?? 0) - dt;
    const offTop = Number.isFinite(canvasHeight)
      ? bubble.y + bubble.radius < 0
      : bubble.y + bubble.radius < 0;

    if (nextLifetime <= 0 || offTop) {
      missedCount += 1;
      continue;
    }

    next.push({
      ...bubble,
      lifetime: nextLifetime,
    });
  }

  return { bubbles: next, missedCount };
}
