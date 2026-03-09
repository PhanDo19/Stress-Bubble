export function createAudioManager() {
  let ctx = null;
  let musicTimer = null;
  let lastComboAccentMs = 0;
  let lastLowTimeCueMs = 0;
  let settings = {
    sfx: true,
    music: true,
    vibe: false,
    muteAudio: false,
    sfxVolume: 0.8,
    musicVolume: 0.4,
    musicStyle: 'chill',
  };

  const arpNotes = [110, 138.59, 164.81, 196, 220, 246.94, 196, 164.81];
  const chillNotes = [110, 146.83, 174.61, 220, 196, 174.61];
  const hiphopChord = [110, 138.59, 164.81];
  let arpIndex = 0;
  let chillIndex = 0;
  let stepIndex = 0;

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
    if (settings.muteAudio || !settings.sfx) return;
    const audio = ensureContext();
    if (!audio) return;

    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = type;
    osc.frequency.value = frequency;

    const volume = Math.max(0, Math.min(1, settings.sfxVolume)) * gain;
    g.gain.value = volume;

    osc.connect(g);
    g.connect(audio.destination);

    const now = audio.currentTime;
    g.gain.setValueAtTime(volume, now);
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

  function playPop(type, comboMultiplier = 1) {
    const combo = Math.max(1, Number(comboMultiplier) || 1);
    if (type === 'bomb') {
      playTone({ frequency: 140, duration: 0.18, gain: 0.18, type: 'sawtooth' });
      vibrate(30);
      return;
    }
    if (type === 'golden') {
      playTone({ frequency: 760, duration: 0.12, gain: 0.14, type: 'triangle' });
      playTone({ frequency: 1140, duration: 0.18, gain: 0.11, type: 'sine' });
      vibrate(20);
    } else if (type === 'fast') {
      playTone({ frequency: 560, duration: 0.12, gain: 0.12, type: 'triangle' });
      vibrate(12);
    } else {
      playTone({ frequency: 420, duration: 0.12, gain: 0.1, type: 'sine' });
      vibrate(10);
    }

    if (combo >= 4) {
      const nowMs = Date.now();
      const minGapMs = combo >= 8 ? 80 : 120;
      if (nowMs - lastComboAccentMs >= minGapMs) {
        lastComboAccentMs = nowMs;
        playTone({
          frequency: combo >= 8 ? 1040 : 900,
          duration: combo >= 8 ? 0.12 : 0.1,
          gain: combo >= 8 ? 0.1 : 0.08,
          type: combo >= 8 ? 'sawtooth' : 'triangle',
        });
      }
    }
  }

  function playMiss(count = 1) {
    if (settings.muteAudio || !settings.sfx) return;
    const base = 180;
    for (let i = 0; i < Math.min(3, count); i += 1) {
      const offset = i * 0.05;
      const audio = ensureContext();
      if (!audio) return;
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = base;
      const volume = Math.max(0, Math.min(1, settings.sfxVolume)) * 0.08;
      g.gain.value = volume;
      osc.connect(g);
      g.connect(audio.destination);
      const now = audio.currentTime + offset;
      g.gain.setValueAtTime(volume, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.14);
    }
  }

  function stopMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function startMusic() {
    if (settings.muteAudio || !settings.music) return;
    const audio = ensureContext();
    if (!audio || musicTimer) return;

    let stepMs = 320;
    if (settings.musicStyle === 'chill') stepMs = 520;
    if (settings.musicStyle === 'hiphop') stepMs = 300;
    if (settings.musicStyle === 'minimal') stepMs = 360;

    stepIndex = 0;
    musicTimer = setInterval(() => {
      stepIndex += 1;
      const volume = Math.max(0, Math.min(1, settings.musicVolume));
      const now = audio.currentTime;

      if (settings.musicStyle === 'minimal') {
        const note = arpNotes[arpIndex % arpNotes.length];
        arpIndex += 1;
        const osc = audio.createOscillator();
        const g = audio.createGain();
        osc.type = 'triangle';
        osc.frequency.value = note;
        const v = volume * 0.05;
        g.gain.value = v;
        osc.connect(g);
        g.connect(audio.destination);
        g.gain.setValueAtTime(v, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
        return;
      }

      if (settings.musicStyle === 'chill') {
        const note = chillNotes[chillIndex % chillNotes.length];
        chillIndex += 1;
        const osc = audio.createOscillator();
        const g = audio.createGain();
        osc.type = 'sine';
        osc.frequency.value = note;
        const v = volume * 0.06;
        g.gain.value = v;
        osc.connect(g);
        g.connect(audio.destination);
        g.gain.setValueAtTime(v, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.65);
        return;
      }

      // hiphop
      if (stepIndex % 4 === 0) {
        const kick = audio.createOscillator();
        const gKick = audio.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(100, now);
        kick.frequency.exponentialRampToValueAtTime(50, now + 0.12);
        const vKick = volume * 0.12;
        gKick.gain.setValueAtTime(vKick, now);
        gKick.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        kick.connect(gKick);
        gKick.connect(audio.destination);
        kick.start(now);
        kick.stop(now + 0.16);
      }

      for (const freq of hiphopChord) {
        const osc = audio.createOscillator();
        const g = audio.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const v = volume * 0.035;
        g.gain.value = v;
        osc.connect(g);
        g.connect(audio.destination);
        g.gain.setValueAtTime(v, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    }, stepMs);
  }

  function setSettings(next) {
    const prevStyle = settings.musicStyle;
    settings = { ...settings, ...(next || {}) };
    if (settings.muteAudio || !settings.music) {
      stopMusic();
      return;
    }
    if (prevStyle !== settings.musicStyle) {
      stopMusic();
    }
    startMusic();
  }

  function unlock() {
    ensureContext();
    if (!settings.muteAudio && settings.music) startMusic();
  }

  function stopAll() {
    stopMusic();
  }
  function playLowTimeWarning() {
    if (!settings.sfx) return;
    const nowMs = Date.now();
    if (nowMs - lastLowTimeCueMs < 2500) return;
    lastLowTimeCueMs = nowMs;
    playTone({ frequency: 660, duration: 0.12, gain: 0.14, type: 'square' });
    playTone({ frequency: 520, duration: 0.16, gain: 0.11, type: 'triangle' });
    vibrate(18);
  }

  return {
    setSettings,
    unlock,
    playPop,
    playMiss,
    playLowTimeWarning,
    stopAll,
  };
}

