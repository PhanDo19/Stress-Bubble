import { spawnBubble } from '../systems/spawnSystem.js';
import { updateMovement } from '../systems/movementSystem.js';
import { updateLifetime } from '../systems/lifetimeSystem.js';
import { popBubbleAt } from '../systems/collisionSystem.js';
import { applyScore } from '../systems/scoreSystem.js';
import { applyCombo } from '../systems/comboSystem.js';
import { applyStress } from '../systems/stressSystem.js';
import { emitPopBurst, updateParticles } from '../systems/particlesSystem.js';
import { emitFloatingText, updateFloatingTexts } from '../systems/floatingTextSystem.js';
import { setupHiDPICanvas } from '../render/canvasScale.js';

const STATES = {
  HOME: 'HOME',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  RESULT: 'RESULT',
};

const DEFAULT_MAX_DELTA_MS = 50;

function resolveMode(config, override) {
  if (override) return override;
  const mode = config && config.mode ? String(config.mode).toLowerCase() : 'classic';
  if (mode === 'rage' || mode === 'zen') return mode;
  return 'classic';
}

function resolveDurationMs(config, mode) {
  if (config && Number.isFinite(config.gameDurationMs)) return config.gameDurationMs;
  if (config && Number.isFinite(config.gameDuration)) return config.gameDuration * 1000;
  if (config && config.modeDurationsMs && Number.isFinite(config.modeDurationsMs[mode])) {
    return config.modeDurationsMs[mode];
  }
  if (config && config.modeDurations && Number.isFinite(config.modeDurations[mode])) {
    return config.modeDurations[mode] * 1000;
  }
  if (mode === 'rage') return 20000;
  return 45000;
}

function createInitialState(config, modeOverride) {
  const mode = resolveMode(config, modeOverride);
  const durationMs = resolveDurationMs(config, mode);
  return {
    state: STATES.HOME,
    score: 0,
    combo: {
      count: 0,
      multiplier: 1,
      timeLeftMs: 0,
    },
    stress: 0,
    bubbles: [],
    particles: [],
    floatingTexts: [],
    spawnTimer: 0,
    timeLeftMs: durationMs,
    totalDurationMs: durationMs,
    mode,
    movementState: 'calm',
    overloaded: false,
    lowTimeNotified: false,
    config: config || null,
    runStats: {
      pops: 0,
      misses: 0,
      maxCombo: 0,
      goldenCount: 0,
      bombHits: 0,
    },
    worldWidth: null,
    worldHeight: null,
  };
}

function clampDelta(delta, maxDelta) {
  if (!Number.isFinite(delta) || delta < 0) return 0;
  return Math.min(delta, maxDelta);
}

function applyState(target, nextState) {
  if (!nextState || nextState === target) return;
  if (nextState.state !== undefined) target.state = nextState.state;
  if (nextState.score !== undefined) target.score = nextState.score;
  if (nextState.combo !== undefined) target.combo = nextState.combo;
  if (nextState.stress !== undefined) target.stress = nextState.stress;
  if (nextState.bubbles !== undefined) target.bubbles = nextState.bubbles;
  if (nextState.particles !== undefined) target.particles = nextState.particles;
  if (nextState.floatingTexts !== undefined) target.floatingTexts = nextState.floatingTexts;
  if (nextState.spawnTimer !== undefined) target.spawnTimer = nextState.spawnTimer;
  if (nextState.timeLeftMs !== undefined) target.timeLeftMs = nextState.timeLeftMs;
  if (nextState.totalDurationMs !== undefined) target.totalDurationMs = nextState.totalDurationMs;
  if (nextState.mode !== undefined) target.mode = nextState.mode;
  if (nextState.movementState !== undefined) target.movementState = nextState.movementState;
  if (nextState.overloaded !== undefined) target.overloaded = nextState.overloaded;
  if (nextState.lowTimeNotified !== undefined) target.lowTimeNotified = nextState.lowTimeNotified;
  if (nextState.config !== undefined) target.config = nextState.config;
  if (nextState.runStats !== undefined) target.runStats = nextState.runStats;
  if (nextState.worldWidth !== undefined) target.worldWidth = nextState.worldWidth;
  if (nextState.worldHeight !== undefined) target.worldHeight = nextState.worldHeight;
}

function updateComboTimer(state, deltaTimeMs) {
  const combo = state.combo || { count: 0, multiplier: 1, timeLeftMs: 0 };
  const timeLeftMs = Number.isFinite(combo.timeLeftMs) ? combo.timeLeftMs : 0;
  if (timeLeftMs <= 0) return state;

  const nextTime = timeLeftMs - deltaTimeMs;
  if (nextTime > 0) {
    return {
      ...state,
      combo: {
        ...combo,
        timeLeftMs: nextTime,
      },
    };
  }

  return {
    ...state,
    combo: {
      count: 0,
      multiplier: 1,
      timeLeftMs: 0,
    },
  };
}

function applyMisses(state, missedCount, config) {
  if (missedCount <= 0) return state;
  let next = state;
  for (let i = 0; i < missedCount; i += 1) {
    next = applyStress(next, { type: 'miss' }, config);
  }
  next = applyCombo(next, { type: 'miss' }, config);
  return next;
}

function applySkippedBombs(state, skippedBombCount, config) {
  if (skippedBombCount <= 0) return state;
  let next = state;
  for (let i = 0; i < skippedBombCount; i += 1) {
    next = applyCombo(next, { type: 'hit' }, config);
  }
  return next;
}

function updateRunStatsMaxCombo(state) {
  const comboCount = state.combo?.count || 0;
  const currentMax = state.runStats?.maxCombo || 0;
  if (comboCount <= currentMax) return state;
  return {
    ...state,
    runStats: {
      ...state.runStats,
      maxCombo: comboCount,
    },
  };
}

export function createGameEngine(options = {}) {
  const {
    renderer = null,
    time = null,
    config = {},
    stateMachine = null,
    now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
    requestFrame = (cb) => requestAnimationFrame(cb),
    cancelFrame = (id) => cancelAnimationFrame(id),
    canvas = null,
    ctx = null,
    assets = null,
    rng = Math.random,
  } = options;

  const engine = createInitialState(config);
  engine.rng = rng;

  let ctxRef = ctx;

  function syncCanvas() {
    if (!canvas) return;
    const { ctx: nextCtx, dpr, widthCss, heightCss } = setupHiDPICanvas(canvas);
    if (nextCtx) ctxRef = nextCtx;
    engine.ctx = ctxRef;
    engine.dpr = dpr;
    engine.worldWidth = widthCss;
    engine.worldHeight = heightCss;
  }

  if (canvas && typeof window !== 'undefined' && window?.addEventListener) {
    window.addEventListener('resize', () => syncCanvas());
  }

  const listeners = new Map();
  function emit(eventName, payload) {
    const handlers = listeners.get(eventName);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(payload);
    }
  }

  function on(eventName, handler) {
    if (!listeners.has(eventName)) listeners.set(eventName, new Set());
    listeners.get(eventName).add(handler);
    return () => listeners.get(eventName)?.delete(handler);
  }

  let running = false;
  let frameId = null;
  let lastTimestamp = null;
  let smoothedFps = 60;
  let particleDetailScale = 1;

  const maxDelta =
    typeof config.maxDeltaMs === 'number' ? config.maxDeltaMs : DEFAULT_MAX_DELTA_MS;

  function setState(nextState) {
    if (stateMachine && typeof stateMachine.setState === 'function') {
      stateMachine.setState(nextState);
      if (typeof stateMachine.getState === 'function') {
        engine.state = stateMachine.getState();
      } else {
        engine.state = nextState;
      }
      return;
    }

    engine.state = nextState;
  }

  function resetState(modeOverride) {
    const base = createInitialState(config, modeOverride);
    engine.state = base.state;
    engine.score = base.score;
    engine.combo = base.combo;
    engine.stress = base.stress;
    engine.bubbles = base.bubbles;
    engine.particles = base.particles;
    engine.floatingTexts = base.floatingTexts;
    engine.spawnTimer = base.spawnTimer;
    engine.timeLeftMs = base.timeLeftMs;
    engine.totalDurationMs = base.totalDurationMs;
    engine.mode = base.mode;
    engine.movementState = base.movementState;
    engine.overloaded = base.overloaded;
    engine.lowTimeNotified = base.lowTimeNotified;
    engine.config = base.config;
    engine.runStats = base.runStats;
    engine.worldWidth = base.worldWidth;
    engine.worldHeight = base.worldHeight;
    lastTimestamp = null;

    if (time && typeof time.reset === 'function') {
      time.reset();
    }
  }

  function update(deltaMs) {
    let next = engine;

    next = spawnBubble(next, deltaMs);

    const width = Number.isFinite(engine.worldWidth) ? engine.worldWidth : null;
    const height = Number.isFinite(engine.worldHeight) ? engine.worldHeight : null;

    const moved = updateMovement(
      next.bubbles,
      deltaMs,
      next.movementState,
      width,
      height
    );
    next = { ...next, bubbles: moved };

    const lifetime = updateLifetime(next.bubbles, deltaMs, height);
    next = { ...next, bubbles: lifetime.bubbles };
    if (lifetime.missedCount > 0) {
      emit('miss', { count: lifetime.missedCount });
      next = {
        ...next,
        runStats: {
          ...next.runStats,
          misses: (next.runStats?.misses || 0) + lifetime.missedCount,
        },
      };
    }
    next = applyMisses(next, lifetime.missedCount, config);
    next = applySkippedBombs(next, lifetime.skippedBombCount || 0, config);
    next = updateRunStatsMaxCombo(next);

    next = updateComboTimer(next, deltaMs);

    next = { ...next, particles: updateParticles(next.particles, deltaMs) };
    next = { ...next, floatingTexts: updateFloatingTexts(next.floatingTexts, deltaMs) };

    if (Number.isFinite(next.timeLeftMs)) {
      next = { ...next, timeLeftMs: Math.max(0, next.timeLeftMs - deltaMs) };
    }

    const lowTimeThresholdMs = 10000;
    if (!next.lowTimeNotified && next.timeLeftMs > 0 && next.timeLeftMs <= lowTimeThresholdMs) {
      next = { ...next, lowTimeNotified: true };
      emit('low-time', { timeLeftMs: next.timeLeftMs });
    }

    applyState(engine, next);

    if (engine.overloaded || engine.timeLeftMs === 0) {
      setState(STATES.RESULT);
      stopLoop();
      emit('result', getRunStats());
    }
  }

  function render() {
    if (renderer && typeof renderer.renderFrame === 'function') {
      renderer.renderFrame(ctxRef, canvas, engine, assets);
      return;
    }
    if (renderer && typeof renderer.render === 'function') {
      renderer.render(engine, { config, now });
    }
  }

  function step(deltaMs) {
    if (!running) return;
    if (engine.state !== STATES.PLAYING) return;

    syncCanvas();
    update(deltaMs);
    render();

    if (!time) {
      frameId = requestFrame(onFrame);
    }
  }

  function onTick(deltaMs, timestamp) {
    const clamped = clampDelta(deltaMs, maxDelta);
    if (clamped > 0) {
      const instantFps = 1000 / clamped;
      smoothedFps = smoothedFps * 0.9 + instantFps * 0.1;
      if (smoothedFps < 45) particleDetailScale = 0.6;
      else if (smoothedFps > 55) particleDetailScale = 1;
    }
    step(clamped, timestamp ?? now());
  }

  function onFrame(timestamp) {
    if (!running) return;
    if (lastTimestamp === null) lastTimestamp = timestamp;
    const deltaMs = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    onTick(deltaMs, timestamp);
  }

  function startLoop() {
    if (running) return;
    running = true;
    lastTimestamp = null;

    if (time && typeof time.start === 'function') {
      time.start(onTick);
      return;
    }

    frameId = requestFrame(onFrame);
  }

  function stopLoop() {
    if (!running) return;
    running = false;

    if (time && typeof time.stop === 'function') {
      time.stop();
    }

    if (frameId !== null) {
      cancelFrame(frameId);
      frameId = null;
    }
  }

  function init() {
    resetState();
    syncCanvas();
    setState(STATES.HOME);
    render();
  }

  function start(mode) {
    resetState(mode);
    syncCanvas();
    setState(STATES.PLAYING);
    startLoop();
    emit('start', { mode: engine.mode });
  }

  function restart() {
    start(engine.mode || 'classic');
  }

  function pause() {
    if (engine.state !== STATES.PLAYING) return;
    setState(STATES.PAUSED);
    stopLoop();
    emit('pause', null);
  }

  function resume() {
    if (engine.state !== STATES.PAUSED) return;
    setState(STATES.PLAYING);
    startLoop();
    emit('resume', null);
  }

  function togglePause() {
    if (engine.state === STATES.PLAYING) {
      pause();
    } else if (engine.state === STATES.PAUSED) {
      resume();
    }
  }

  function handleClick(x, y) {
    if (engine.state !== STATES.PLAYING) return;
    const hit = popBubbleAt(engine.bubbles, x, y);
    if (!hit.popped) return;

    let next = { ...engine, bubbles: hit.bubbles };
    const isBomb = hit.popped.type === 'bomb';

    let awardedText = '-150';

    if (isBomb) {
      next = applyCombo(next, { type: 'bomb' }, config);
      next = applyStress(next, { type: 'bomb' }, config);
      next = applyScore(next, { type: 'bomb' });
      next = {
        ...next,
        runStats: {
          ...next.runStats,
          bombHits: (next.runStats?.bombHits || 0) + 1,
        },
      };
    } else {
      next = applyCombo(next, { type: 'hit' }, config);
      const multiplier = next.combo?.multiplier ?? 1;
      const basePoints =
        hit.popped.type === 'fast' ? 20 : hit.popped.type === 'golden' ? 100 : 10;
      const awarded = basePoints * multiplier;
      awardedText = `+${awarded}`;
      next = applyScore(next, {
        type: 'pop',
        bubbleType: hit.popped.type,
        multiplier,
      });
      next = applyStress(next, { type: 'hit' }, config);
      next = {
        ...next,
        runStats: {
          ...next.runStats,
          pops: (next.runStats?.pops || 0) + 1,
          goldenCount:
            hit.popped.type === 'golden'
              ? (next.runStats?.goldenCount || 0) + 1
              : (next.runStats?.goldenCount || 0),
        },
      };
    }

    next = updateRunStatsMaxCombo(next);
    emit('pop', {
      type: hit.popped.type,
      x: hit.popped.x,
      y: hit.popped.y,
      comboMultiplier: next.combo?.multiplier ?? 1,
    });

    const maxParticles =
      typeof config.maxParticles === 'number' ? config.maxParticles : 30;
    const adaptiveMaxParticles = Math.max(
      8,
      Math.round(maxParticles * particleDetailScale)
    );
    const maxFloatingTexts =
      typeof config.maxFloatingTexts === 'number' ? config.maxFloatingTexts : 24;
    next = {
      ...next,
      particles: emitPopBurst(
        next.particles,
        hit.popped.x,
        hit.popped.y,
        adaptiveMaxParticles,
        rng,
        particleDetailScale
      ),
      floatingTexts: emitFloatingText(
        next.floatingTexts,
        hit.popped.x,
        hit.popped.y,
        awardedText,
        rng,
        maxFloatingTexts
      ),
    };

    applyState(engine, next);
  }

  function getRunStats() {
    return {
      score: engine.score,
      pops: engine.runStats?.pops || 0,
      misses: engine.runStats?.misses || 0,
      maxCombo: engine.runStats?.maxCombo || 0,
      goldenCount: engine.runStats?.goldenCount || 0,
      bombHits: engine.runStats?.bombHits || 0,
      mode: engine.mode || 'classic',
      durationMs: Math.max(0, (engine.totalDurationMs || 0) - (engine.timeLeftMs || 0)),
    };
  }

  engine.init = init;
  engine.start = start;
  engine.restart = restart;
  engine.pause = pause;
  engine.resume = resume;
  engine.togglePause = togglePause;
  engine.handleClick = handleClick;
  engine.getRunStats = getRunStats;
  engine.on = on;

  return engine;
}

export { STATES };
