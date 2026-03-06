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
  const comboCount = combo.count || 0;
  const multiplier = combo.multiplier || 1;
  const timeLeftMs = Number.isFinite(state.timeLeftMs) ? state.timeLeftMs : 0;
  const totalMs = Number.isFinite(state.totalDurationMs) ? state.totalDurationMs : 0;
  const stress = Number.isFinite(state.stress) ? state.stress : 0;

  const fontSize = Math.round(16 * scale);
  const pad = Math.round(16 * scale);
  const line = Math.round(22 * scale);

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = 'top';

  ctx.fillText(`Score: ${score}`, pad, pad);

  if (comboCount >= 2) {
    let tierScale = 1.05;
    let comboColor = '#a7f3d0';
    let glow = 'rgba(110,231,183,0.6)';
    if (comboCount >= 5 && comboCount <= 9) {
      tierScale = 1.12;
      comboColor = '#fde047';
      glow = 'rgba(251,191,36,0.6)';
    } else if (comboCount >= 10) {
      tierScale = 1.2;
      comboColor = '#fca5a5';
      glow = 'rgba(248,113,113,0.7)';
    }
    const pulse = 1 + 0.06 * Math.sin((combo.timeLeftMs || 0) / 80);
    ctx.save();
    ctx.fillStyle = comboColor;
    ctx.shadowColor = glow;
    ctx.shadowBlur = Math.round(10 * scale);
    ctx.font = `${Math.round(fontSize * tierScale * pulse)}px sans-serif`;
    ctx.fillText(`Combo: x${multiplier}`, pad, pad + line);
    ctx.restore();
  } else {
    ctx.fillText(`Combo: x${multiplier}`, pad, pad + line);
  }

  const timeText = `Time: ${formatTime(timeLeftMs)}`;
  const timeWidth = ctx.measureText(timeText).width;
  ctx.fillText(timeText, width - pad - timeWidth, pad);

  let timeColor = '#22c55e';
  if (totalMs > 0) {
    const ratio = timeLeftMs / totalMs;
    if (ratio <= 0.3) timeColor = '#ef4444';
    else if (ratio <= 0.6) timeColor = '#f59e0b';
  }

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

  const timeBarY = barY + barHeight + Math.round(8 * scale);
  const timeBarHeight = Math.max(4, Math.round(6 * scale));
  const timeRatio = totalMs > 0 ? Math.max(0, Math.min(1, timeLeftMs / totalMs)) : 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, timeBarY, barWidth, timeBarHeight);
  ctx.fillStyle = timeColor;
  ctx.fillRect(barX, timeBarY, barWidth * timeRatio, timeBarHeight);

  ctx.restore();
}
