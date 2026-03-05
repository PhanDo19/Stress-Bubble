const DEFAULT_MAX_DELTA = 50;

function clampDelta(delta, maxDelta) {
  if (!Number.isFinite(delta) || delta < 0) return 0;
  return Math.min(delta, maxDelta);
}

export function createTimeLoop(options = {}) {
  const {
    update = null,
    render = null,
    now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
    requestFrame = (cb) => requestAnimationFrame(cb),
    cancelFrame = (id) => cancelAnimationFrame(id),
    maxDelta = DEFAULT_MAX_DELTA,
  } = options;

  let running = false;
  let frameId = null;
  let lastTimestamp = null;

  function tick(deltaMs, timestamp) {
    const clamped = clampDelta(deltaMs, maxDelta);
    if (typeof update === 'function') update(clamped, timestamp);
    if (typeof render === 'function') render(timestamp);
  }

  function onFrame(timestamp) {
    if (!running) return;
    if (lastTimestamp === null) lastTimestamp = timestamp;
    const deltaMs = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    tick(deltaMs, timestamp);
    frameId = requestFrame(onFrame);
  }

  function start(onTick) {
    if (running) return;
    running = true;
    lastTimestamp = null;

    if (typeof onTick === 'function') {
      const wrapped = (timestamp) => {
        if (!running) return;
        if (lastTimestamp === null) lastTimestamp = timestamp;
        const deltaMs = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        onTick(clampDelta(deltaMs, maxDelta), timestamp);
        frameId = requestFrame(wrapped);
      };
      frameId = requestFrame(wrapped);
      return;
    }

    frameId = requestFrame(onFrame);
  }

  function stop() {
    if (!running) return;
    running = false;
    if (frameId !== null) {
      cancelFrame(frameId);
      frameId = null;
    }
  }

  function reset() {
    lastTimestamp = null;
  }

  return {
    start,
    stop,
    reset,
  };
}
