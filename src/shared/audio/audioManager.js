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
    audioPack: 'audio_classic',
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

  function playToneWithTail(primary, tail = null) {
    playTone(primary);
    if (!tail || settings.muteAudio || !settings.sfx) return;
    const audio = ensureContext();
    if (!audio) return;

    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = tail.type || 'sine';
    osc.frequency.value = tail.frequency;
    const volume = Math.max(0, Math.min(1, settings.sfxVolume)) * (tail.gain || 0.04);
    const now = audio.currentTime + (tail.delay || 0.015);
    g.gain.setValueAtTime(volume, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + (tail.duration || 0.1));
    osc.connect(g);
    g.connect(audio.destination);
    osc.start(now);
    osc.stop(now + (tail.duration || 0.1) + 0.02);
  }

  function vibrate(ms) {
    if (!settings.vibe) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }

  function playPop(type, comboMultiplier = 1) {
    const combo = Math.max(1, Number(comboMultiplier) || 1);
    const audioPack = settings.audioPack || 'audio_classic';
    const packMap = {
      audio_classic: {
        normal: { frequency: 420, type: 'sine' },
        fast: { frequency: 560, type: 'triangle' },
        golden: { frequency: 760, type: 'triangle', tailFrequency: 1140, tailType: 'sine' },
        bomb: { frequency: 140, type: 'triangle' },
        accent: { low: 900, high: 1040, top: 1240, type: 'triangle' },
      },
      audio_arcade: {
        normal: { frequency: 470, type: 'square', tailFrequency: 690, tailType: 'square' },
        fast: { frequency: 620, type: 'triangle', tailFrequency: 820, tailType: 'square' },
        golden: { frequency: 760, type: 'square', tailFrequency: 1140, tailType: 'square' },
        bomb: { frequency: 140, type: 'square', tailFrequency: 92, tailType: 'square' },
        accent: { low: 920, high: 1160, top: 1280, type: 'square' },
      },
      audio_lofi: {
        normal: { frequency: 360, type: 'sine', tailFrequency: 240, tailType: 'sine', tailDuration: 0.1 },
        fast: { frequency: 480, type: 'triangle', tailFrequency: 340, tailType: 'sine', tailDuration: 0.12 },
        golden: { frequency: 640, type: 'triangle', tailFrequency: 820, tailType: 'sine', tailDuration: 0.24 },
        bomb: { frequency: 120, type: 'triangle' },
        accent: { low: 780, high: 900, top: 980, type: 'sine' },
      },
      audio_neon: {
        normal: { frequency: 420, type: 'sine', tailFrequency: 820, tailType: 'triangle' },
        fast: { frequency: 560, type: 'sawtooth', tailFrequency: 980, tailType: 'triangle' },
        golden: { frequency: 840, type: 'triangle', tailFrequency: 1440, tailType: 'triangle' },
        bomb: { frequency: 180, type: 'triangle', tailFrequency: 300, tailType: 'triangle' },
        accent: { low: 980, high: 1040, top: 1240, type: 'sawtooth' },
      },
      audio_crystal: {
        normal: { frequency: 560, type: 'sine', tailFrequency: 960, tailType: 'sine' },
        fast: { frequency: 720, type: 'triangle', tailFrequency: 1120, tailType: 'sine' },
        golden: { frequency: 920, type: 'triangle', tailFrequency: 1660, tailType: 'sine' },
        bomb: { frequency: 210, type: 'triangle', tailFrequency: 560, tailType: 'sine' },
        accent: { low: 980, high: 1280, top: 1500, type: 'triangle' },
      },
      audio_vapor: {
        normal: { frequency: 310, type: 'sine', tailFrequency: 180, tailType: 'triangle', tailDuration: 0.14 },
        fast: { frequency: 430, type: 'triangle', tailFrequency: 260, tailType: 'sine', tailDuration: 0.16 },
        golden: { frequency: 700, type: 'triangle', tailFrequency: 980, tailType: 'sine', tailDuration: 0.28 },
        bomb: { frequency: 132, type: 'triangle', tailFrequency: 220, tailType: 'sine', tailDuration: 0.18 },
        accent: { low: 760, high: 920, top: 1040, type: 'sine' },
      },
      audio_reactor: {
        normal: { frequency: 390, type: 'sawtooth', tailFrequency: 520, tailType: 'square' },
        fast: { frequency: 510, type: 'sawtooth', tailFrequency: 740, tailType: 'square' },
        golden: { frequency: 620, type: 'sawtooth', tailFrequency: 880, tailType: 'square' },
        bomb: { frequency: 96, type: 'sawtooth', tailFrequency: 72, tailType: 'square' },
        accent: { low: 820, high: 980, top: 1120, type: 'square' },
      },
    };
    const profile = packMap[audioPack] || packMap.audio_classic;
    const toneProfile =
      type === 'bomb' ? profile.bomb : type === 'golden' ? profile.golden : type === 'fast' ? profile.fast : profile.normal;

    playToneWithTail(
      {
        frequency: toneProfile.frequency,
        duration: type === 'bomb' ? 0.18 : type === 'golden' ? 0.12 : 0.12,
        gain: audioPack === 'audio_reactor' && type !== 'golden' ? 0.12 : type === 'golden' ? 0.14 : type === 'bomb' ? 0.18 : 0.1,
        type: toneProfile.type,
      },
      toneProfile.tailFrequency
        ? {
            frequency: toneProfile.tailFrequency,
            duration: toneProfile.tailDuration || (type === 'golden' ? 0.18 : 0.06),
            gain: type === 'golden' ? 0.11 : 0.035,
            type: toneProfile.tailType || 'sine',
            delay: 0.015,
          }
        : null
    );

    vibrate(type === 'bomb' ? 30 : type === 'golden' ? 20 : type === 'fast' ? 12 : 10);

    if (combo >= 4) {
      const nowMs = Date.now();
      const minGapMs = combo >= 10 ? 60 : combo >= 8 ? 80 : 120;
      if (nowMs - lastComboAccentMs >= minGapMs) {
        lastComboAccentMs = nowMs;
        playTone({
          frequency: combo >= 10 ? profile.accent.top : combo >= 8 ? profile.accent.high : profile.accent.low,
          duration: combo >= 10 ? 0.14 : combo >= 8 ? 0.12 : 0.1,
          gain: combo >= 10 ? 0.12 : combo >= 8 ? 0.1 : 0.08,
          type: profile.accent.type,
        });
        if (combo >= 10) {
          playTone({
            frequency:
              audioPack === 'audio_crystal'
                ? 920
                : audioPack === 'audio_reactor'
                  ? 480
                  : audioPack === 'audio_neon'
                    ? 760
                    : 620,
            duration: 0.08,
            gain: audioPack === 'audio_reactor' ? 0.08 : 0.06,
            type: audioPack === 'audio_reactor' ? 'sawtooth' : 'triangle',
          });
        }
      }
    }
  }

  function playMiss(count = 1) {
    if (settings.muteAudio || !settings.sfx) return;
    const audioPack = settings.audioPack || 'audio_classic';
    const baseMap = {
      audio_classic: { frequency: 180, type: 'sine' },
      audio_arcade: { frequency: 180, type: 'square' },
      audio_lofi: { frequency: 150, type: 'sine' },
      audio_neon: { frequency: 210, type: 'sine' },
      audio_crystal: { frequency: 260, type: 'triangle' },
      audio_vapor: { frequency: 130, type: 'sine' },
      audio_reactor: { frequency: 120, type: 'sawtooth' },
    };
    const miss = baseMap[audioPack] || baseMap.audio_classic;
    for (let i = 0; i < Math.min(3, count); i += 1) {
      const offset = i * 0.05;
      const audio = ensureContext();
      if (!audio) return;
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = miss.type;
      osc.frequency.value = miss.frequency;
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
    const audioPack = settings.audioPack || 'audio_classic';
    playTone({
      frequency: audioPack === 'audio_lofi' ? 560 : audioPack === 'audio_neon' ? 760 : 660,
      duration: 0.12,
      gain: 0.14,
      type: audioPack === 'audio_arcade' ? 'sawtooth' : 'square',
    });
    playTone({
      frequency: audioPack === 'audio_lofi' ? 420 : audioPack === 'audio_neon' ? 620 : 520,
      duration: 0.16,
      gain: 0.11,
      type: audioPack === 'audio_neon' ? 'sine' : 'triangle',
    });
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

