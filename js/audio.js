/* ==========================================================================
   EXPRESO DE NAVIDAD · Sonido
   Todo el audio se sintetiza en el navegador con la Web Audio API:
   no se descarga ningún archivo. La música ambiental es una versión de
   cajita musical de «Noche de paz» (Franz X. Gruber, 1818, dominio público).
   ========================================================================== */
const Sound = (() => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let bus = null;      // mezcla general (con eco suave)
  let sfxGain = null;  // volumen de efectos
  let sfxOn = true;

  /* ---------- Inicialización (siempre tras un gesto del usuario) ---------- */
  function ensure() {
    if (!AudioCtx) return null;
    if (!ctx) {
      ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);

      // Eco breve para dar calidez de "sala"
      const delay = ctx.createDelay(1);
      delay.delayTime.value = 0.27;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.22;
      const wet = ctx.createGain();
      wet.gain.value = 0.22;
      delay.connect(feedback); feedback.connect(delay);
      delay.connect(wet); wet.connect(master);

      bus = ctx.createGain();
      bus.connect(master);
      bus.connect(delay);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.8;
      sfxGain.connect(bus);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  /* ---------- Instrumentos básicos ---------- */
  // Campana / cajita musical: fundamental + armónicos con caída exponencial
  function bell(freq, t, dur = 1.2, vol = 0.12, dest = sfxGain) {
    [[1, 1], [2, 0.32], [3.01, 0.12], [4.2, 0.05]].forEach(([mult, amp]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq * mult;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol * amp, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / mult);
      osc.connect(g); g.connect(dest);
      osc.start(t); osc.stop(t + dur + 0.05);
    });
  }

  function tone(freq, t, dur, vol = 0.1, type = "triangle", dest = sfxGain, glideTo = null) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  let noiseBuffer = null;
  function noise(t, dur, vol = 0.1, filterType = "lowpass", freq = 900, dest = sfxGain) {
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter); filter.connect(g); g.connect(dest);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }

  /* ---------- Efectos de sonido ---------- */
  function play(fn) {
    if (!sfxOn || !ensure()) return;
    try { fn(ctx.currentTime + 0.01); } catch (e) { /* el audio nunca debe romper la app */ }
  }

  const sfx = {
    click: () => play((t) => tone(1400, t, 0.06, 0.05, "sine")),
    soft: () => play((t) => noise(t, 0.12, 0.05, "bandpass", 2500)),
    chime: (step = 0) => play((t) => {
      const base = [76, 79, 83][step % 3];
      bell(midi(base), t, 1.4, 0.14);
      bell(midi(base + 12), t + 0.08, 1, 0.06);
    }),
    correct: () => play((t) => { bell(midi(72), t, 0.8, 0.12); bell(midi(76), t + 0.1, 0.8, 0.12); bell(midi(79), t + 0.2, 1.2, 0.12); }),
    wrong: () => play((t) => { tone(220, t, 0.25, 0.08, "triangle", sfxGain, 170); }),
    star: () => play((t) => {
      [79, 83, 86, 91, 95].forEach((n, i) => bell(midi(n), t + i * 0.07, 1.6, 0.1));
      noise(t, 0.6, 0.03, "highpass", 6000);
    }),
    paper: () => play((t) => { noise(t, 0.35, 0.09, "bandpass", 1800); noise(t + 0.18, 0.3, 0.06, "bandpass", 3000); }),
    stamp: () => play((t) => { noise(t, 0.12, 0.25, "lowpass", 400); tone(90, t, 0.15, 0.2, "sine"); }),
    arrive: () => play((t) => { bell(midi(84), t, 1.5, 0.12); bell(midi(79), t + 0.25, 1.8, 0.1); }),
    // Silbato de vapor: dos tubos ligeramente desafinados + soplido
    whistle: (len = 0.9) => play((t) => {
      [554, 698].forEach((f) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(f * 0.94, t);
        osc.frequency.linearRampToValueAtTime(f, t + 0.12);
        filter.type = "bandpass"; filter.frequency.value = f * 2; filter.Q.value = 3;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.07, t + 0.08);
        g.gain.setValueAtTime(0.07, t + len - 0.15);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        osc.connect(filter); filter.connect(g); g.connect(sfxGain);
        osc.start(t); osc.stop(t + len + 0.05);
      });
      noise(t, len, 0.04, "bandpass", 2400);
    }),
    // "Chu-chú" rítmico mientras el tren avanza
    chug: (seconds = 2) => play((t) => {
      const beats = Math.max(2, Math.floor(seconds / 0.2));
      for (let i = 0; i < beats; i++) {
        const accent = i % 2 === 0 ? 0.13 : 0.07;
        noise(t + i * 0.2, 0.14, accent, "lowpass", 700 + (i % 4) * 120);
      }
    }),
    fanfare: () => play((t) => {
      const seq = [[67, 0], [72, 0.18], [76, 0.36], [79, 0.54], [84, 0.8]];
      seq.forEach(([n, d]) => { bell(midi(n), t + d, 1.6, 0.13); tone(midi(n - 12), t + d, 0.5, 0.04, "triangle"); });
      bell(midi(88), t + 1.1, 2, 0.08);
    })
  };

  /* ---------- Música ambiental: «Noche de paz» en 6/8 ---------- */
  // [nota MIDI, duración en corcheas]
  const MELODY = [
    [67, 3], [69, 1], [67, 2], [64, 6], [67, 3], [69, 1], [67, 2], [64, 6],
    [74, 4], [74, 2], [71, 6], [72, 4], [72, 2], [67, 6],
    [69, 4], [69, 2], [72, 3], [71, 1], [69, 2], [67, 3], [69, 1], [67, 2], [64, 6],
    [69, 4], [69, 2], [72, 3], [71, 1], [69, 2], [67, 3], [69, 1], [67, 2], [64, 6],
    [74, 4], [74, 2], [77, 3], [74, 1], [71, 2], [72, 6], [76, 6],
    [72, 3], [67, 1], [64, 2], [67, 3], [65, 1], [62, 2], [60, 12]
  ];
  // Acorde de cada compás (24 compases): C, G o F
  const CHORDS = "CCCCGGCCFFCCFFCCGGCCCGCC";
  const BASS = { C: [48, 55], G: [43, 50], F: [41, 48] };
  const EIGHTH = 0.34;           // segundos por corchea
  const LOOP_EIGHTHS = 24 * 6 + 6; // canción + un compás de silencio

  const events = (() => {
    const list = [];
    let pos = 0;
    MELODY.forEach(([n, len]) => { list.push({ at: pos, freq: midi(n), len, kind: "melody" }); pos += len; });
    [...CHORDS].forEach((c, bar) => {
      list.push({ at: bar * 6, freq: midi(BASS[c][0]), len: 3, kind: "bass" });
      list.push({ at: bar * 6 + 3, freq: midi(BASS[c][1]), len: 3, kind: "bass" });
    });
    return list.sort((a, b) => a.at - b.at);
  })();

  let musicOn = false;
  let musicGain = null;
  let timer = null;
  let loopStart = 0;
  let cursor = 0;

  function scheduler() {
    const horizon = ctx.currentTime + 0.6;
    while (true) {
      const ev = events[cursor];
      const when = loopStart + ev.at * EIGHTH;
      if (when > horizon) break;
      if (ev.kind === "melody") bell(ev.freq, when, Math.max(1.2, ev.len * EIGHTH * 1.6), 0.11, musicGain);
      else tone(ev.freq, when, ev.len * EIGHTH * 0.95, 0.045, "triangle", musicGain);
      cursor++;
      if (cursor >= events.length) { cursor = 0; loopStart += LOOP_EIGHTHS * EIGHTH; }
    }
  }

  function startMusic() {
    if (!ensure()) return false;
    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    musicGain.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 1.2);
    musicGain.connect(bus);
    loopStart = ctx.currentTime + 0.15;
    cursor = 0;
    scheduler();
    timer = setInterval(scheduler, 150);
    musicOn = true;
    return true;
  }

  function stopMusic() {
    clearInterval(timer);
    timer = null;
    if (musicGain && ctx) {
      const g = musicGain;
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      setTimeout(() => g.disconnect(), 3000);
    }
    musicGain = null;
    musicOn = false;
  }

  return {
    supported: Boolean(AudioCtx),
    ...sfx,
    setSfx(on) { sfxOn = on; },
    get sfxOn() { return sfxOn; },
    get musicOn() { return musicOn; },
    toggleMusic() { if (musicOn) stopMusic(); else startMusic(); return musicOn; },
    // Pausa la música si la pestaña se oculta (ahorra batería)
    suspend() { if (ctx && ctx.state === "running") ctx.suspend(); },
    resume() { if (ctx && ctx.state === "suspended") ctx.resume(); }
  };
})();
