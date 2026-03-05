export function setupHiDPICanvas(canvas) {
  if (!canvas) return { ctx: null, dpr: 1, widthCss: 0, heightCss: 0 };

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, Math.floor(rect.width));
  const cssH = Math.max(1, Math.floor(rect.height));

  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);

  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  return { ctx, dpr, widthCss: cssW, heightCss: cssH };
}
