// ---------------------------------------------------------------------------
// audio.js: the soundscape, made up as you listen with the Web Audio API.
// A low city rumble, traffic passing by at street level, wind up high, rain,
// soft lo-fi chords, glassy chimes and the odd far-away horn or siren.
// ---------------------------------------------------------------------------

class Soundscape {
  constructor() { this.ctx = null; this.enabled = true; }

  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.gain.setTargetAtTime(this.enabled ? 0.9 : 0, ctx.currentTime, 1.5);
    const comp = ctx.createDynamicsCompressor();
    this.master.connect(comp); comp.connect(ctx.destination);
    this.verb = ctx.createConvolver();
    this.verb.buffer = this.impulse(3.5);
    const wet = ctx.createGain(); wet.gain.value = 0.6;
    this.verb.connect(wet); wet.connect(this.master);
    this.white = this.noise(4, false);
    this.brownBuf = this.noise(6, true);
    this.rumble = this.bed(this.brownBuf, [['lowpass', 170, 0.7]]);
    this.traffic = this.bed(this.white, [['bandpass', 480, 0.5], ['lowpass', 1300, 0.6]]);
    this.wind = this.bed(this.white, [['bandpass', 380, 0.9]]);
    this.rain = this.bed(this.white, [['highpass', 1400, 0.5], ['lowpass', 7500, 0.5]]);
    this.timers = { chord: 0.5, chime: 4, whoosh: 1, horn: 14, siren: 45 };
    this.chord = 0;
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.ctx) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.3);
  }

  noise(sec, brown) {
    const ctx = this.ctx, n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
      }
    }
    return b;
  }
  impulse(sec) {
    const ctx = this.ctx, n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2);
    }
    return b;
  }
  // an endless noise loop through a few filters
  bed(buf, filters) {
    const ctx = this.ctx, src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    let node = src;
    const fs = filters.map(([type, f, q]) => { const bq = ctx.createBiquadFilter(); bq.type = type; bq.frequency.value = f; bq.Q.value = q; node.connect(bq); node = bq; return bq; });
    const g = ctx.createGain(); g.gain.value = 0;
    node.connect(g); g.connect(this.master);
    src.start(0, Math.random() * buf.duration);
    return { g, fs };
  }
  env(g, t, peak, attack, hold, release) {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.setValueAtTime(peak, t + attack + hold);
    g.gain.linearRampToValueAtTime(0, t + attack + hold + release);
  }
  out(node, dry, wet) {
    const d = this.ctx.createGain(); d.gain.value = dry; node.connect(d); d.connect(this.master);
    const w = this.ctx.createGain(); w.gain.value = wet; node.connect(w); w.connect(this.verb);
  }

  playChord() {
    const ctx = this.ctx, t = ctx.currentTime + 0.05;
    const prog = [[50, 62, 66, 69, 73, 76], [47, 59, 62, 66, 69, 73], [43, 55, 59, 62, 66, 71], [45, 57, 61, 64, 67, 71]];
    const notes = prog[this.chord++ % prog.length];
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.4;
    lp.frequency.setValueAtTime(400, t); lp.frequency.linearRampToValueAtTime(1100, t + 4); lp.frequency.linearRampToValueAtTime(500, t + 11);
    const g = ctx.createGain(); this.env(g, t, 1, 3.5, 3, 5.5);
    lp.connect(g); this.out(g, 0.5, 0.9);
    notes.forEach((m, i) => {
      const f = 440 * Math.pow(2, (m - 69) / 12);
      for (const det of i === 0 ? [0] : [-7, 7]) {
        const o = ctx.createOscillator();
        o.type = i === 0 ? 'sine' : 'sawtooth'; o.frequency.value = f; o.detune.value = det;
        const og = ctx.createGain(); og.gain.value = i === 0 ? 0.05 : 0.0075;
        o.connect(og); og.connect(lp);
        o.start(t); o.stop(t + 12.5);
      }
    });
  }
  playChime() {
    const ctx = this.ctx, t = ctx.currentTime + 0.02;
    const scale = [74, 76, 78, 81, 83, 86, 88, 90];
    const f = 440 * Math.pow(2, (scale[Math.floor(Math.random() * scale.length)] - 69) / 12);
    const pan = ctx.createStereoPanner(); pan.pan.value = Math.random() * 1.6 - 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
    g.connect(pan); this.out(pan, 0.4, 1.2);
    for (const [mul, a] of [[1, 1], [2.01, 0.35], [3.98, 0.12]]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * mul;
      const og = ctx.createGain(); og.gain.value = a; o.connect(og); og.connect(g);
      o.start(t); o.stop(t + 3.6);
    }
  }
  playWhoosh(level) {
    const ctx = this.ctx, t = ctx.currentTime + 0.02, dur = 1.4 + Math.random() * 1.6;
    const src = ctx.createBufferSource(); src.buffer = this.white;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.3;
    const f0 = 250 + Math.random() * 200;
    bp.frequency.setValueAtTime(f0, t); bp.frequency.linearRampToValueAtTime(f0 * 2.6, t + dur * 0.45); bp.frequency.linearRampToValueAtTime(f0 * 0.8, t + dur);
    const pan = ctx.createStereoPanner(), dir = Math.random() < 0.5 ? -1 : 1;
    pan.pan.setValueAtTime(-0.9 * dir, t); pan.pan.linearRampToValueAtTime(0.9 * dir, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16 * level, t + dur * 0.45); g.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(bp); bp.connect(pan); pan.connect(g); this.out(g, 1, 0.15);
    src.start(t, Math.random() * 3, dur + 0.1);
  }
  playHorn(level) {
    const ctx = this.ctx, t = ctx.currentTime + 0.02, dur = 0.25 + Math.random() * 0.5;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const g = ctx.createGain(); this.env(g, t, 0.02 * level, 0.02, dur, 0.08);
    lp.connect(g); this.out(g, 0.5, 1);
    for (const f of [349, 440]) { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f * (0.97 + Math.random() * 0.06); o.connect(lp); o.start(t); o.stop(t + dur + 0.2); }
  }
  playSiren() {
    const ctx = this.ctx, t = ctx.currentTime + 0.05, dur = 9;
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 720;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.35;
    const lg = ctx.createGain(); lg.gain.value = 170; lfo.connect(lg); lg.connect(o.frequency);
    o.frequency.setValueAtTime(740, t); o.frequency.linearRampToValueAtTime(680, t + dur); // slow doppler drift
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    const g = ctx.createGain(); this.env(g, t, 0.01, 3, 3, 3);
    o.connect(lp); lp.connect(g); this.out(g, 0.3, 1.4);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.2); lfo.stop(t + dur + 0.2);
  }

  update(dt, s) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const low = 1 - smooth(8, 220, s.alt), high = smooth(60, 500, s.alt);
    const set = (p, v, k = 0.6) => p.setTargetAtTime(v, now, k);
    set(this.rumble.g.gain, 0.3 * (0.35 + 0.65 * low));
    set(this.traffic.g.gain, 0.1 * low + 0.02);
    set(this.wind.g.gain, 0.015 + 0.12 * high + 0.08 * clamp(s.speed / 150, 0, 1));
    set(this.wind.fs[0].frequency, 300 + 220 * Math.sin(now * 0.13) + s.speed * 2, 0.3);
    set(this.rain.g.gain, 0.22 * s.rain, 1.5);
    const T = this.timers;
    for (const k in T) T[k] -= dt;
    if (T.chord <= 0) { this.playChord(); T.chord = 9; }
    if (T.chime <= 0) { this.playChime(); T.chime = 2.5 + Math.random() * 6; }
    if (T.whoosh <= 0) { if (low > 0.2) this.playWhoosh(low); T.whoosh = 0.7 + Math.random() * 2.2; }
    if (T.horn <= 0) { if (low > 0.3) this.playHorn(low); T.horn = 10 + Math.random() * 30; }
    if (T.siren <= 0) { this.playSiren(); T.siren = 60 + Math.random() * 80; }
  }
}
