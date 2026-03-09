function formatTime(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const hudAnim = {
  initialized: false,
  lastMs: 0,
  displayScore: 0,
  prevScore: 0,
  scorePop: 0,
  comboMeter: 0,
  comboPulse: 0,
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smoothStep(current, target, factor) {
  return current + (target - current) * clamp01(factor);
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
  const reducedMotion = !!state?.config?.reducedMotion;
  const highContrast = !!state?.config?.highContrast;
  const comboWindowMs =
    Number.isFinite(state?.config?.comboWindowMs) && state.config.comboWindowMs > 0
      ? state.config.comboWindowMs
      : 1200;

  const nowMs =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  if (!hudAnim.initialized || score < hudAnim.displayScore - 200) {
    hudAnim.initialized = true;
    hudAnim.displayScore = score;
    hudAnim.prevScore = score;
    hudAnim.scorePop = 0;
    hudAnim.comboMeter = 0;
    hudAnim.comboPulse = 0;
    hudAnim.lastMs = nowMs;
  }

  const dt = Math.max(0, Math.min(0.08, (nowMs - hudAnim.lastMs) / 1000));
  hudAnim.lastMs = nowMs;

  const scoreDiff = score - hudAnim.displayScore;
  hudAnim.displayScore = reducedMotion ? score : smoothStep(hudAnim.displayScore, score, dt * 10);
  if (Math.abs(scoreDiff) < 0.5 || reducedMotion) hudAnim.displayScore = score;
  if (!reducedMotion && score > hudAnim.prevScore) hudAnim.scorePop = 1;
  hudAnim.prevScore = score;
  hudAnim.scorePop = reducedMotion ? 0 : Math.max(0, hudAnim.scorePop - dt * 3.2);

  const rawComboMeter =
    comboCount >= 2 ? clamp01((combo.timeLeftMs || 0) / comboWindowMs) : 0;
  hudAnim.comboMeter = reducedMotion ? rawComboMeter : smoothStep(hudAnim.comboMeter, rawComboMeter, dt * 12);
  const comboPulseTarget = comboCount >= 2 ? 1 : 0;
  hudAnim.comboPulse = reducedMotion ? comboPulseTarget : smoothStep(hudAnim.comboPulse, comboPulseTarget, dt * 8);

  const fontSize = Math.round(16 * scale);
  const pad = Math.round(16 * scale);
  const line = Math.round(22 * scale);

  ctx.save();
  ctx.textBaseline = 'top';

  const scoreScale = reducedMotion ? 1 : 1 + 0.12 * hudAnim.scorePop;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.round(fontSize * scoreScale)}px sans-serif`;
  ctx.fillText(`Score: ${Math.round(hudAnim.displayScore)}`, pad, pad);
  ctx.restore();

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
    const wave = 0.5 + 0.5 * Math.sin(nowMs / 100);
    const pulse = reducedMotion ? 1 : 1 + 0.055 * wave * hudAnim.comboPulse;
    ctx.save();
    ctx.fillStyle = comboColor;
    ctx.shadowColor = glow;
    ctx.shadowBlur = Math.round(10 * scale);
    ctx.font = `${Math.round(fontSize * tierScale * pulse)}px sans-serif`;
    ctx.fillText(`Combo: x${multiplier}`, pad, pad + line);
    ctx.restore();

    const comboMeterX = pad;
    const comboMeterY = pad + line * 2 + Math.round(2 * scale);
    const comboMeterW = Math.round(170 * scale);
    const comboMeterH = Math.max(4, Math.round(6 * scale));
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(comboMeterX, comboMeterY, comboMeterW, comboMeterH);
    ctx.fillStyle =
      comboCount >= 10
        ? 'rgba(248,113,113,0.9)'
        : comboCount >= 5
          ? 'rgba(251,191,36,0.9)'
          : 'rgba(110,231,183,0.9)';
    ctx.fillRect(comboMeterX, comboMeterY, comboMeterW * hudAnim.comboMeter, comboMeterH);
    ctx.restore();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillText(`Combo: x${multiplier}`, pad, pad + line);
  }

  const timeText = `Time: ${formatTime(timeLeftMs)}`;
  ctx.fillStyle = '#ffffff';
  ctx.font = `${fontSize}px sans-serif`;
  const timeWidth = ctx.measureText(timeText).width;
  ctx.fillText(timeText, width - pad - timeWidth, pad);

  let timeColor = highContrast ? '#00ff84' : '#22c55e';
  if (totalMs > 0) {
    const ratio = timeLeftMs / totalMs;
    if (ratio <= 0.3) timeColor = highContrast ? '#ff2b2b' : '#ef4444';
    else if (ratio <= 0.6) timeColor = highContrast ? '#ffd400' : '#f59e0b';
  }

  const barWidth = Math.round(180 * scale);
  const barHeight = Math.round(12 * scale);
  const barX = width - barWidth - pad;
  const barY = pad + line + Math.round(4 * scale);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, Math.round(2 * scale));
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  const fillWidth = (barWidth * Math.min(stress, 100)) / 100;
  ctx.fillStyle = stress >= 80 ? (highContrast ? '#ff2b2b' : '#ff5d5d') : highContrast ? '#ffe100' : '#f2c94c';
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
