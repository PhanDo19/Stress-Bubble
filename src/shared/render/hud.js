function formatTime(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function renderHud(ctx, canvas, state) {
  const rect = canvas.getBoundingClientRect();
  const width = Number.isFinite(state?.worldWidth) ? state.worldWidth : rect.width;
  const height = Number.isFinite(state?.worldHeight) ? state.worldHeight : rect.height;
  const scale = Math.max(1, Math.min(width / 1200, height / 800));

  const score = Number.isFinite(state.score) ? state.score : 0;
  const combo = state.combo || { multiplier: 1 };
  const multiplier = combo.multiplier || 1;
  const timeLeftMs = Number.isFinite(state.timeLeftMs) ? state.timeLeftMs : 0;
  const stress = Number.isFinite(state.stress) ? state.stress : 0;

  const fontSize = Math.round(16 * scale);
  const pad = Math.round(16 * scale);
  const line = Math.round(22 * scale);

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = 'top';

  ctx.fillText(`Score: ${score}`, pad, pad);
  ctx.fillText(`Combo: x${multiplier}`, pad, pad + line);

  const timeText = `Time: ${formatTime(timeLeftMs)}`;
  const timeWidth = ctx.measureText(timeText).width;
  ctx.fillText(timeText, width - pad - timeWidth, pad);

  const barWidth = Math.round(180 * scale);
  const barHeight = Math.round(12 * scale);
  const barX = width - barWidth - pad;
  const barY = pad + line + Math.round(4 * scale);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, Math.round(2 * scale));
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  const fillWidth = (barWidth * Math.min(stress, 100)) / 100;
  ctx.fillStyle = stress >= 80 ? '#ff5d5d' : '#f2c94c';
  ctx.fillRect(barX, barY, fillWidth, barHeight);

  ctx.restore();
}
