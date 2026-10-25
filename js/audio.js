// Sound engine: meme voice clips (mp3) + Web Audio synth effects.
const FILES = [
  'rag-korla', 'ei-dhongi', 'amar-vul', 'masud', 'bindaya-dimu', 'kar-pola',
  'tui-beshi-janos', 'maaf-koira-dilam', 'bishwas-kori-na', 'osombhob', 'baaah',
  'o-ki-lagche', 'dhoka-khaichi', 'goribera', 'shakchunni-laugh', 'koun-hai-re',
  'hae-thikase', 'unnoyon', 'helicopter-milon', 'aaho-bhatija', 'pure-debo',
  'slap1', 'slap2', 'slap3', 'slap-oh', 'slap-big', 'punch',
  'mosquito-buzz', 'mosquito-ear', 'mosquito-laugh', 'goofy-horn',
];

const pick = a => a[Math.floor(Math.random() * a.length)];
const BUZZ_F = [560, 567, 1130];

export const sound = {
  ctx: null,
  muted: false,
  buf: {},
  voiceUntil: 0,
  voicePrio: 0,
  voiceSrc: null,

  init() {
    if (this.ctx) {
      if (this.ctx.state !== 'running') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = (this.ctx = new AC());
    this.master = c.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.ratio.value = 4;
    this.master.connect(comp);
    comp.connect(c.destination);
    this.sfx = c.createGain();
    this.sfx.gain.value = 0.8;
    this.sfx.connect(this.master);
    this.vox = c.createGain();
    this.vox.gain.value = 1;
    this.vox.connect(this.master);

    const len = c.sampleRate;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    this._buzzInit();
    this._load();
  },

  _load() {
    for (const name of FILES) {
      fetch(`sounds/${name}.mp3`)
        .then(r => { if (!r.ok) throw new Error(name); return r.arrayBuffer(); })
        .then(ab => new Promise((res, rej) => this.ctx.decodeAudioData(ab, res, rej)))
        .then(b => { this.buf[name] = b; })
        .catch(() => {});
    }
  },

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.02);
  },

  clip(name, { vol = 1, rate = 1, dest, maxDur } = {}) {
    const b = this.buf[name];
    if (!this.ctx || !b) return null;
    const c = this.ctx, t = c.currentTime;
    const s = c.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = rate;
    const g = c.createGain();
    g.gain.value = vol;
    s.connect(g);
    g.connect(dest || this.sfx);
    s.start();
    if (maxDur && b.duration / rate > maxDur) {
      g.gain.setValueAtTime(vol, t + maxDur - 0.3);
      g.gain.linearRampToValueAtTime(0, t + maxDur);
      s.stop(t + maxDur + 0.05);
    }
    return s;
  },

  // Meme voice: only one at a time; higher priority may interrupt a lower one.
  voice(names, prio = 1, maxDur = 5) {
    if (!this.ctx) return false;
    const now = this.ctx.currentTime;
    const avail = (Array.isArray(names) ? names : [names]).filter(n => this.buf[n]);
    if (!avail.length) return false;
    if (now < this.voiceUntil && prio <= this.voicePrio) return false;
    if (this.voiceSrc) { try { this.voiceSrc.stop(); } catch (e) {} }
    const n = pick(avail);
    this.voiceSrc = this.clip(n, { dest: this.vox, maxDur });
    this.voiceUntil = now + Math.min(this.buf[n].duration, maxDur) + 0.35;
    this.voicePrio = prio;
    return true;
  },

  // ---------- synth helpers ----------
  _env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  },
  tone(f, dur, { type = 'sine', vol = 0.3, to = null, when = 0, a = 0.005 } = {}) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + a + dur);
    this._env(g, t, a, vol, dur);
    o.connect(g);
    g.connect(this.sfx);
    o.start(t);
    o.stop(t + a + dur + 0.05);
  },
  noise(dur, { type = 'bandpass', f = 1000, to = null, q = 1, vol = 0.3, when = 0, a = 0.002 } = {}) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + when;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    const fl = c.createBiquadFilter();
    fl.type = type;
    fl.frequency.setValueAtTime(f, t);
    if (to) fl.frequency.exponentialRampToValueAtTime(to, t + a + dur);
    fl.Q.value = q;
    const g = c.createGain();
    this._env(g, t, a, vol, dur);
    s.connect(fl);
    fl.connect(g);
    g.connect(this.sfx);
    s.start(t, Math.random() * 0.5);
    s.stop(t + a + dur + 0.05);
  },

  // ---------- game sounds ----------
  slap(big = false) {
    const ok = this.clip(big ? 'slap-big' : pick(['slap1', 'slap2', 'slap3', 'slap-big']),
      { vol: 0.95, rate: 0.9 + Math.random() * 0.25 });
    this.noise(0.08, { f: 2400, q: 0.7, vol: ok ? 0.22 : 0.6 });
    this.tone(150, 0.12, { vol: 0.5, to: 45 });
  },
  squish() {
    this.noise(0.16, { type: 'lowpass', f: 3500, to: 250, vol: 0.4, when: 0.015 });
    this.tone(1100, 0.06, { type: 'square', vol: 0.05, to: 180, when: 0.01 });
  },
  whoosh() { this.noise(0.16, { f: 450, to: 1900, q: 1.4, vol: 0.14, a: 0.04 }); },
  combo(n) {
    const base = 520 * Math.pow(1.06, Math.min(n, 14));
    [0, 4, 7].forEach((st, i) => this.tone(base * Math.pow(2, st / 12), 0.12, { type: 'triangle', vol: 0.16, when: i * 0.055 }));
  },
  power() {
    [0, 4, 7, 12, 16].forEach((st, i) => this.tone(440 * Math.pow(2, st / 12), 0.13, { type: 'square', vol: 0.07, when: i * 0.065 }));
  },
  zap() {
    for (let i = 0; i < 6; i++) this.tone(200 + Math.random() * 1800, 0.04, { type: 'sawtooth', vol: 0.09, when: i * 0.03 });
    this.noise(0.2, { type: 'highpass', f: 3000, vol: 0.18 });
  },
  hurt() { this.tone(330, 0.35, { type: 'sawtooth', vol: 0.16, to: 90 }); },
  bite() { this.tone(1500, 0.05, { type: 'square', vol: 0.04, to: 2200 }); },
  pop() { this.tone(500, 0.05, { type: 'sine', vol: 0.25, to: 1400 }); },
  click() { this.tone(700, 0.05, { type: 'triangle', vol: 0.18, to: 1300 }); },
  laugh() { this.clip(pick(['mosquito-laugh', 'shakchunni-laugh']), { vol: 0.55, rate: 1.15, maxDur: 2.2 }); },
  sadTrombone() {
    [392, 370, 349, 330].forEach((f, i) => {
      const last = i === 3;
      this.tone(f, last ? 1.0 : 0.32, { type: 'sawtooth', vol: 0.1, when: i * 0.42, a: 0.03, to: last ? 300 : null });
      this.tone(f / 2, last ? 1.0 : 0.32, { type: 'triangle', vol: 0.14, when: i * 0.42, a: 0.03 });
    });
  },

  // Continuous mosquito whine: loudness follows how many mosquitoes are around.
  _buzzInit() {
    const c = this.ctx;
    this.buzzGain = c.createGain();
    this.buzzGain.gain.value = 0;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1200;
    bp.Q.value = 0.7;
    this.buzzOsc = BUZZ_F.map((f, i) => {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.value = i === 2 ? 0.3 : 0.5;
      o.connect(g);
      g.connect(bp);
      o.start();
      return o;
    });
    const lfo = c.createOscillator();
    lfo.frequency.value = 7;
    const lg = c.createGain();
    lg.gain.value = 18;
    lfo.connect(lg);
    this.buzzOsc.forEach(o => lg.connect(o.frequency));
    lfo.start();
    bp.connect(this.buzzGain);
    if (c.createStereoPanner) {
      this.buzzPan = c.createStereoPanner();
      this.buzzGain.connect(this.buzzPan);
      this.buzzPan.connect(this.master);
    } else {
      this.buzzGain.connect(this.master);
    }
  },
  setBuzz(level, pan = 0, pitch = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.buzzGain.gain.setTargetAtTime(level * 0.05, t, 0.08);
    if (this.buzzPan) this.buzzPan.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), t, 0.1);
    this.buzzOsc.forEach((o, i) => o.frequency.setTargetAtTime(BUZZ_F[i] * pitch, t, 0.2));
  },
};
