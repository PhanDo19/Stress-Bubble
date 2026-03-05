function distanceSq(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function findHitBubbleIndex(bubbles, x, y) {
  if (!Array.isArray(bubbles) || bubbles.length === 0) return -1;
  for (let i = bubbles.length - 1; i >= 0; i -= 1) {
    const bubble = bubbles[i];
    const radius = bubble.radius ?? 0;
    if (distanceSq(x, y, bubble.x, bubble.y) < radius * radius) {
      return i;
    }
  }
  return -1;
}

export function popBubbleAt(bubbles, x, y) {
  const index = findHitBubbleIndex(bubbles, x, y);
  if (index < 0) return { bubbles: Array.isArray(bubbles) ? bubbles.slice() : [], popped: null };

  const popped = bubbles[index];
  const next = bubbles.slice(0, index).concat(bubbles.slice(index + 1));
  return { bubbles: next, popped };
}
