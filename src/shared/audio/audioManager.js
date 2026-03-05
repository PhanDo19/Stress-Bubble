export function createAudioManager() {
  let ctx = null;
  let musicOsc = null;
  let musicGain = null;
  let settings = {
    sfx: true,
    music: true,
    vibe: false,
  };

  function ensureContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = AudioCtx ? new AudioCtx() : null;
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function playTone({ frequency, duration = 0.12, gain = 0.12, type = 'sine' }) {
    if (!settings.sfx) return;
    const audio = ensureContext();
    if (!audio) return;

    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    g.gain.value = gain;

    osc.connect(g);
    g.connect(audio.destination);

    const now = audio.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function vibrate(ms) {
    if (!settings.vibe) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }

  function playPop(type) {
    if (type === 'bomb') {
      playTone({ frequency: 140, duration: 0.18, gain: 0.18, type: 'sawtooth' });
      vibrate(30);
      return;
    }
    if (type === 'golden') {
      playTone({ frequency: 820, duration: 0.16, gain: 0.14, type: 'triangle' });
      vibrate(20);
      return;
    }
    if (type === 'fast') {
      playTone({ frequency: 560, duration: 0.12, gain: 0.12, type: 'triangle' });
      vibrate(12);
      return;
    }
    playTone({ frequency: 420, duration: 0.12, gain: 0.1, type: 'sine' });
    vibrate(10);
  }

  function playMiss(count = 1) {
    if (!settings.sfx) return;
    const base = 180;
    for (let i = 0; i < Math.min(3, count); i += 1) {
      const offset = i * 0.05;
      const audio = ensureContext();
      if (!audio) return;
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = base;
      g.gain.value = 0.08;
      osc.connect(g);
      g.connect(audio.destination);
      const now = audio.currentTime + offset;
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.14);
    }
  }

  function startMusic() {
    if (!settings.music) return;
    const audio = ensureContext();
    if (!audio || musicOsc) return;

    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = 110;
    g.gain.value = 0.02;
    osc.connect(g);
    g.connect(audio.destination);
    osc.start();

    musicOsc = osc;
    musicGain = g;
  }

  function stopMusic() {
    if (!musicOsc) return;
    try {
      musicOsc.stop();
    } catch (err) {
      // ignore
    }
    musicOsc.disconnect();
    if (musicGain) musicGain.disconnect();
    musicOsc = null;
    musicGain = null;
  }

  function setSettings(next) {
    settings = { ...settings, ...(next || {}) };
    if (settings.music) startMusic();
    else stopMusic();
  }

  function unlock() {
    ensureContext();
    if (settings.music) startMusic();
  }

  function stopAll() {
    stopMusic();
  }

  return {
    setSettings,
    unlock,
    playPop,
    playMiss,
    stopAll,
  };
}
