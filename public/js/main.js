import { sound } from './audio.js?v=9';
import * as art from './art.js?v=5';

const $ = id => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d');
const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

// ------------------------------------------------------------------ data
const TYPES = {
  normal: { size: 1, hp: 1, speed: 95, bite: 1.8, pts: 1, roam: [1, 3] },
  fast: { size: 0.85, hp: 1, speed: 175, bite: 1.15, pts: 2, roam: [2, 4] },
  fat: { size: 1.35, hp: 2, speed: 70, bite: 2.3, pts: 3, roam: [1, 2] },
  boss: { size: 2.6, hp: 6, speed: 55, bite: 3.4, pts: 15, roam: [2, 3] },
};
const ITEMS = {
  coil: { emoji: '🌀', name: 'কয়েল', color: '#2d6a4f' },
  cream: { emoji: '🧴', name: 'মশা-নিরোধক ক্রিম', color: '#2a9d8f' },
  bat: { emoji: '⚡', name: 'ইলেকট্রিক ব্যাট', color: '#1d70d6' },
  dab: { emoji: '🥥', name: 'ডাবের পানি', color: '#6a994e' },
};
const KILL_TEXT = ['ঠাস!', 'চ্যাপ্টা!', 'খতম!', 'আর কামড়াবি?', 'শেষ!', 'ধুম!', 'যাহ্!'];
const COMBO_VOICE = { 3: 'baaah', 5: 'hae-thikase', 8: 'bindaya-dimu', 12: 'bishwas-kori-na', 16: 'osombhob' };
const ALL_COMBO_VOICE = Object.values(COMBO_VOICE);
const TIPS = [
  'ফুলের টব, টায়ার, ডাবের খোসা, এসি-ফ্রিজের ট্রেতে ৩ দিনের বেশি পানি জমতে দেবেন না।',
  'এইডিস মশা দিনে কামড়ায়, বিশেষ করে সকালে আর সন্ধ্যার আগে। দিনে ঘুমালেও মশারি টানান।',
  'জ্বর হলে দেরি না করে ডাক্তার দেখান, NS1 / ডেঙ্গু টেস্ট করান।',
  'ডেঙ্গু সন্দেহ হলে জ্বর-ব্যথায় শুধু প্যারাসিটামল। আইবুপ্রোফেন বা অ্যাসপিরিন খাবেন না।',
  'প্রচুর তরল খান: ডাবের পানি, খাবার স্যালাইন, ফলের রস।',
  'পেটে তীব্র ব্যথা, বারবার বমি, রক্তপাত বা অতিরিক্ত দুর্বলতা হলে দ্রুত হাসপাতালে যান।',
  'জ্বর কমে যাওয়ার পরের ২-৩ দিন সবচেয়ে ঝুঁকিপূর্ণ, তখনও সতর্ক থাকুন।',
  'ফুলহাতা জামা পরুন, শরীরে মশা-নিরোধক ক্রিম লাগান। স্বাস্থ্য বাতায়ন: ১৬২৬৩',
];
const SATIRE = [
  'ঘটনা তদন্তে ৫ সদস্যের কমিটি গঠন করা হয়েছে। আগের ৪১টি কমিটির রিপোর্ট এখনো মশারির নিচে চাপা পড়ে আছে।',
  'মশক নিধন কর্মকর্তা জানান, "ফগার মেশিনের তেল শেষ, আপাতত থাপ্পড়ই ভরসা।"',
  'মশা সমিতির সভাপতি সংবাদ সম্মেলনে বলেন, "আমরা শুধু এক ফোঁটা রক্ত চেয়েছিলাম, থাপ্পড় না।"',
  'প্রত্যক্ষদর্শীরা জানান, থাপ্পড়ের শব্দে তিন বাড়ি দূরের লোকজনও ঘুম থেকে উঠে পড়েন।',
  'বিশেষজ্ঞরা বলছেন, থাপ্পড়ের চেয়ে জমা পানি ফেলা বেশি কার্যকর। থাপ্পড়বাজ তা মানতে নারাজ।',
  'ঘুমন্ত মামা ঘুম থেকে উঠে জানতে চান, "এত রাতে আমার গালে কে মারলো?" প্রশ্নের উত্তর মেলেনি।',
];

const SLEEP_TALK = ['মা... আর ৫ মিনিট...', 'বিরিয়ানি... 🍗', 'অফিস কাল থেকে...', 'কারেন্ট গেল নাকি...', 'ঈদের বোনাস...', 'মশারি... কই রাখলাম...', 'ভোঁ ভোঁ কে করে...'];
const SAY = {
  roam: ['রক্ত দে!', 'হিহিহি 😈', 'ভোঁওওও', 'মামা ঘুমাও...', 'B+ চাই!', 'আজকে ডিনার মামা!', 'ধর তো দেখি!', 'ঘ্রাণ পাইছি!'],
  bite: ['স্লার্প! 🩸', 'আহ্‌ মিষ্টি!', 'চুমুক!', 'ইয়াম্মি!'],
  leave: ['হা হা হা!', 'টাটা! 👋', 'পেট ভরছে!', 'কাল আবার আসবো!'],
  dodge: ['উফ বাঁচলাম!', 'মিস! 😜', 'অল্পের জন্য!', 'পারবা না!'],
  boss: ['আমি সর্দার!', 'এই এলাকা আমার!', 'কার পোলা?', 'থাপ্পড়? হাহ!'],
  fat: ['ঢেঁকুর!', 'আর পারি না...', 'পেট ফুলছে!'],
};
const CAL_TIPS = ['দিনেও মশারি টানান!', '৩ দিনের বেশি পানি জমাবেন না', 'জ্বর হলে ডেঙ্গু টেস্ট', 'শুধু প্যারাসিটামল', 'প্রচুর তরল খান 💧', 'ফুলহাতা জামা পরুন'];

// ------------------------------------------------------------------ layout
let W = 0, H = 0, DPR = 1, L = null, BG = null;

// real photo of the sleeping uncle; key points in image pixels
const MAN = { w: 1344, h: 576, head: [318, 140, 95], nose: [362, 92], cheek: [345, 152], arm: [560, 288], foot: [1268, 238] };
const IMG = {};
for (const k of ['sleep', 'fever']) {
  const im = new Image();
  im.onload = () => { IMG[k] = im; };
  im.src = `img/man_${k}.webp`;
}

function layout() {
  const m = Math.min(W, H), u = clamp(m / 400, 0.75, 1.9);
  // on portrait phones let the bed overflow a little (headboard off-screen) so the uncle is bigger
  const portrait = W < H;
  const mw = Math.min(W * (portrait ? 1.14 : 0.98), H * 0.5 * MAN.w / MAN.h, 1150), mh = mw * MAN.h / MAN.w, sc = mw / MAN.w;
  const man = { x: portrait ? (W - mw) * 0.92 : (W - mw) / 2, y: H * 0.95 - mh, w: mw, h: mh };
  const P = (ix, iy) => ({ x: man.x + ix * sc, y: man.y + iy * sc });
  const floorY = man.y + mh * 0.6;
  const bed = { x: man.x, y: man.y + mh * 0.55, w: mw, h: mh * 0.4 };
  const ww = clamp(W * 0.28, 105, 230);
  const win = { x: W * 0.07, y: Math.max(105, H * 0.15), w: ww, h: Math.min(ww * 1.12, man.y - Math.max(105, H * 0.15) - 40 * u) };
  const cw = clamp(W * 0.19, 68, 125);
  const cal = { x: W * 0.92 - cw, y: Math.max(130, H * 0.2), w: cw, h: cw * 1.3 };
  const fan = { x: W * 0.5, y: Math.max(80, H * 0.09), r: clamp(m * 0.3, 90, 230) };
  const clock = { x: (win.x + win.w + cal.x) / 2 + 10 * u, y: Math.max(cal.y + cal.h * 0.2, fan.y + 50 * u), r: clamp(m * 0.07, 22, 40) };
  const pot = { x: win.x + win.w * 0.22, y: win.y + win.h + 7 * u * 0.6, w: Math.min(46 * u, win.w * 0.36) };
  const beam = [[win.x, win.y + win.h], [win.x + win.w, win.y + win.h], [win.x + win.w + W * 0.3, H], [win.x + W * 0.12, H]];
  const head = { ...P(MAN.head[0], MAN.head[1]), r: MAN.head[2] * sc };
  const targets = [
    { ...P(...MAN.cheek), name: 'গালে' },
    { ...P(...MAN.arm), name: 'হাতে' },
    { ...P(...MAN.foot), name: 'পায়ে' },
  ];
  art.setWidth(W);
  return {
    W, H, u, floorY, man, bed, win, cal, fan, clock, pot, beam, head, nose: P(...MAN.nose), targets,
    slapR: clamp(m * 0.1, 42, 85),
    msize: clamp(m * 0.034, 14, 26),
    itemR: clamp(m * 0.055, 24, 40),
  };
}

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(W * DPR);
  cv.height = Math.round(H * DPR);
  cv.style.width = W + 'px';
  cv.style.height = H + 'px';
  L = layout();
  BG = art.renderBackground(L, DPR);
}

// ------------------------------------------------------------------ state
const G = {
  state: 'menu', time: 0, fanA: 0,
  mosq: [], items: [], hands: [], splats: [], parts: [], texts: [], zaps: [], souls: [],
  shake: 0, flash: 0, potClean: 0, sayCD: 2, calCD: 0,
  ptr: { x: 0, y: 0, mouse: false },
};
const S = { mood: 'sleep', moodT: 0, bites: [], scratchT: 0, scratchTgt: 0, kickT: 0, handprintT: 0, worry: false, talk: '', talkT: 0, talkCD: 3 };
const resetSleeper = () => Object.assign(S, { mood: 'sleep', moodT: 0, bites: [], scratchT: 0, kickT: 0, handprintT: 0, talkT: 0, talkCD: rand(3, 6) });
let best = store.get('dsm_best', 0);

function resetGame() {
  Object.assign(G, {
    state: 'play', t: 0, score: 0, lives: 3, combo: 0, comboT: 0, maxCombo: 0,
    kills: 0, slaps: 0, hits: 0, missStreak: 0,
    spawnT: 0.8, itemT: rand(10, 14), swarmT: 30, nextBoss: 40,
    slow: 0, shield: 0, bat: 0, hitstop: 0, dieT: 0,
    mosq: [], items: [], hands: [], splats: [], parts: [], texts: [], zaps: [], souls: [],
    shake: 0, flash: 0, potClean: 0, sayCD: 2, calCD: 0,
  });
  resetSleeper();
  updateHUD(true);
}

// ------------------------------------------------------------------ spawning
function waypoint(m) {
  m.wx = rand(W * 0.08, W * 0.92);
  m.wy = rand(Math.max(90, H * 0.14), L.floorY - H * 0.1);
}

function spawn(type = 'normal', src) {
  const T = TYPES[type], s = L.msize * T.size;
  src = src || (Math.random() < (G.potClean > 0 ? 0 : 0.25) ? 'window' : pick(['left', 'right', 'top', 'left', 'right']));
  let x, y;
  if (src === 'window') { x = L.win.x + L.win.w * rand(0.25, 0.75); y = L.win.y + L.win.h * rand(0.5, 0.9); }
  else if (src === 'left') { x = -s * 2; y = rand(H * 0.15, L.floorY - H * 0.1); }
  else if (src === 'right') { x = W + s * 2; y = rand(H * 0.15, L.floorY - H * 0.1); }
  else { x = rand(W * 0.1, W * 0.9); y = -s * 2; }
  const m = {
    x, y, vx: 0, vy: 0, size: s, type, hp: T.hp, maxHp: T.hp,
    speed: T.speed * rand(0.85, 1.15), biteDur: T.bite, pts: T.pts,
    state: 'roam', roams: Math.round(rand(...T.roam)), t: 0, seed: Math.random() * 100,
    face: x < W / 2 ? 1 : -1, tilt: 0, blood: type === 'fat' ? 0.5 : 0, biteT: 0,
    tgt: Math.floor(Math.random() * 3), offX: rand(-5, 5), offY: rand(-4, 4),
    hurtT: 0, dodgeT: 0, dvx: 0, dvy: 0, wf: rand(3, 6), pop: src === 'window' ? 0 : 1,
    say: null, sayCD: rand(1.5, 5), lookX: 0, lookY: 0, scared: false,
  };
  waypoint(m);
  G.mosq.push(m);
  return m;
}

function pickType() {
  const t = G.t, r = Math.random();
  if (t > 18 && r < Math.min(0.3, (t - 18) * 0.007)) return 'fast';
  if (t > 30 && r > 1 - Math.min(0.22, (t - 30) * 0.005)) return 'fat';
  return 'normal';
}

function spawnItem() {
  const keys = ['coil', 'cream', 'bat'];
  if (G.lives < 3) keys.push('dab', 'dab');
  const k = pick(keys);
  G.items.push({
    kind: k, ...ITEMS[k], r: L.itemR, t: 0, life: 7,
    x: rand(W * 0.15, W * 0.85), y0: rand(H * 0.25, L.floorY - H * 0.2), y: 0, vx: rand(-25, 25),
  });
}

// ------------------------------------------------------------------ effects
function addText(x, y, text, o = {}) {
  G.texts.push({ x, y, text, color: o.color || '#fff', size: (o.size || 22) * L.u, t: 0, life: o.life || 0.9, vy: o.vy ?? -70 });
}
function burst(x, y, n, colors, spd = 220) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = rand(0.3, 1) * spd * L.u;
    G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, r: rand(1.5, 4.5) * L.u, c: pick(colors), t: 0, life: rand(0.4, 0.9) });
  }
}
function say(m, kind, force) {
  if (!force && (G.sayCD > 0 || G.state === 'menu' && Math.random() < 0.5)) return;
  m.say = { text: pick(SAY[kind]), t: 0, life: 1.6 };
  G.sayCD = 1.1;
}
function popBubble() {
  if (S.mood !== 'sleep') return;
  burst(L.nose.x, L.nose.y, 7, ['rgba(170,225,255,.9)', '#fff'], 120);
  sound.pop();
}
function banner(html) {
  const b = $('banner');
  b.innerHTML = html;
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
}

// ------------------------------------------------------------------ input
function slap(px, py) {
  if (G.state !== 'play') return;
  sound.init();
  G.slaps++;
  const zap = G.bat > 0;
  const R = L.slapR * (zap ? 1.9 : 1);
  const hand = { x: px, y: py, t: 0, life: 0.45, size: L.slapR * 1.15, rot: rand(-0.45, 0.45), flip: px < W / 2 ? -1 : 1, hit: false, zap };
  G.hands.push(hand);
  sound.slap();

  // power-up pickup
  let gotItem = false;
  for (const it of G.items) {
    if (Math.hypot(it.x - px, it.y - py) < it.r * 1.4 + R * 0.3) { collect(it); gotItem = true; }
  }
  G.items = G.items.filter(i => !i.done);

  const hits = G.mosq.filter(m => !m.dead && Math.hypot(m.x - px, m.y - py) < R + m.size * 0.9);
  if (hits.length) {
    hand.hit = true;
    G.hits++;
    G.missStreak = 0;
    G.combo++;
    G.comboT = 2;
    G.maxCombo = Math.max(G.maxCombo, G.combo);
    let killed = 0;
    for (const m of hits) {
      m.hp -= zap ? 99 : 1;
      if (zap) G.zaps.push({ x1: px, y1: py, x2: m.x, y2: m.y, t: 0, life: 0.25 });
      if (m.hp <= 0) { kill(m); killed++; }
      else {
        m.hurtT = 0.3;
        m.state = m.state === 'bite' ? 'roam' : m.state;
        m.biteT = 0;
        waypoint(m);
        m.vx = (m.x - px) * 6; m.vy = (m.y - py) * 6 - 100;
        sound.clip('punch', { vol: 0.9 });
        addText(m.x, m.y - m.size, m.type === 'boss' ? `আরো ${bn(m.hp)}টা!` : 'আরেকটা!', { color: '#ffd23f', size: 20 });
      }
    }
    if (zap) sound.zap();
    if (killed >= 2) {
      addText(px, py - L.slapR * 1.2, killed >= 3 ? 'ট্রিপল থাপ্পড়!!' : 'ডাবল থাপ্পড়!', { color: '#ff9f1c', size: 30, life: 1.2 });
      G.score += killed;
    }
    // slapping a mosquito sitting on uncle's face = uncle gets slapped too
    if (hits.some(m => m.state === 'bite' && m.tgt === 0) || Math.hypot(px - L.head.x, py - L.head.y) < L.head.r * 0.9) slapUncle(false);
    G.shake = Math.min(14, 5 + killed * 3);
    G.hitstop = 0.045;
    vibrate(25);
    comboFX();
  } else if (!gotItem && tapScenery(px, py)) {
    // tapped the pot or calendar
  } else if (!gotItem) {
    G.combo = 0;
    G.missStreak++;
    sound.whoosh();
    if (Math.hypot(px - L.head.x, py - L.head.y) < L.head.r * 1.3) slapUncle(true);
    else if (G.missStreak % 4 === 0) {
      addText(px, py - 30 * L.u, pick(['নিশানা কই?', 'বাতাসে থাপ্পড়!', 'মশা হাসতেছে 😂']), { color: '#ffb4b4', size: 20 });
      if (!sound.voice(['rag-korla', 'tui-beshi-janos', 'maaf-koira-dilam', 'aayein-meme'], 1, 3)) sound.clip(pick(['goofy-horn', 'mac-quack', 'dry-fart']), { vol: 0.7 });
    }
    // near misses make mosquitoes dodge
    for (const m of G.mosq) {
      const d = Math.hypot(m.x - px, m.y - py);
      if (d < R * 2.4 && m.state !== 'bite' && m.state !== 'leave') {
        m.dodgeT = 0.35;
        m.dvx = ((m.x - px) / (d || 1)) * m.speed * 3 * L.u;
        m.dvy = ((m.y - py) / (d || 1)) * m.speed * 3 * L.u;
        if (Math.random() < 0.5) say(m, 'dodge');
      }
    }
  }
  updateHUD();
}

function tapScenery(px, py) {
  const P = L.pot, u = L.u;
  if (px > P.x - P.w && px < P.x + P.w * 2.6 && py > P.y - P.w * 1.4 && py < P.y + 14 * u) {
    if (G.potClean > 0) { addText(P.x, P.y - P.w * 1.5, 'এখন পরিষ্কার ✅', { color: '#80ffdb', size: 18 }); return true; }
    G.potClean = 18;
    G.score += 3;
    burst(P.x, P.y, 26, ['#4cc9f0', '#90e0ef', '#fff'], 260);
    sound.noise(0.35, { type: 'lowpass', f: 2500, to: 400, vol: 0.35 });
    sound.power();
    sound.voice('baaah', 2, 3);
    banner('💧 জমা পানি ফেলে দিলেন! +৩<small>জানালা দিয়ে মশা আসা বন্ধ</small>');
    addText(P.x, P.y - P.w * 1.5, 'লার্ভা খতম! 🎉', { color: '#80ffdb', size: 20, life: 1.3 });
    return true;
  }
  const C = L.cal;
  if (px > C.x && px < C.x + C.w && py > C.y && py < C.y + C.h * 1.15) {
    if (G.calCD <= 0) {
      G.calCD = 1.2;
      addText(C.x + C.w / 2, C.y + C.h + 18 * u, pick(CAL_TIPS), { color: '#ffd23f', size: 16, life: 2.2, vy: -25 });
      sound.click();
    }
    return true;
  }
  return false;
}

function slapUncle(miss) {
  popBubble();
  S.handprintT = 3;
  S.mood = 'slapped';
  S.moodT = 1.1;
  if (miss) {
    addText(L.head.x + L.head.r, L.head.y - L.head.r * 1.6, pick(['আমারে মারো ক্যান?!', 'উফ! মশা না, আমি!', 'ঘুমাইতে দাও!']), { color: '#fff', size: 18, life: 1.3 });
    sound.clip('slap-oh', { vol: 0.9 });
    setTimeout(() => sound.voice(['yamate-kudashai', 'are-baap-re-yaad-aya', 'aayein-meme'], 2, 2.6), 250);
    vibrate(60);
  } else if (Math.random() < 0.5) {
    addText(L.head.x + L.head.r, L.head.y - L.head.r * 1.6, 'মামাও খাইলো! 😵', { color: '#fff', size: 18, life: 1.2 });
  }
}

function kill(m) {
  m.dead = true;
  G.kills++;
  const mult = G.combo >= 8 ? 3 : G.combo >= 4 ? 2 : 1;
  let pts = m.pts * mult;
  const revenge = m.state === 'leave';
  if (revenge) pts += 1;
  G.score += pts;
  const heavy = m.type === 'fat' || m.type === 'boss' || m.blood > 0.5;
  G.splats.push(art.makeSplat(m.x, m.y, m.size * (heavy ? 1.1 : 0.8), heavy));
  if (G.splats.length > 40) G.splats.shift();
  burst(m.x, m.y, heavy ? 22 : 12, ['#d00000', '#9d0208', '#e5383b']);
  burst(m.x, m.y, 4, ['rgba(220,235,255,.9)', '#222'], 160);
  G.souls.push({ x: m.x, y: m.y, t: 0, life: 1.6, size: m.size });
  sound.squish();
  let txt = revenge ? 'প্রতিশোধ! রক্ত ফেরত!' : (Math.random() < 0.55 ? `+${bn(pts)} থাপ্পড়!` : `${pick(KILL_TEXT)} +${bn(pts)}`);
  if (m.type === 'boss') {
    txt = `মশা সর্দার খতম! +${bn(pts)}`;
    banner('👑 সর্দার খতম! 👑<small>এলাকা এখন আপনার</small>');
    sound.voice('osombhob', 4);
    sound.slap(true);
    G.shake = 22;
    vibrate([60, 40, 120]);
    burst(m.x, m.y, 40, ['#ffd23f', '#ff9f1c', '#d00000']);
    setTimeout(() => showMeme('king', 'সর্দার শেষ, এখন মামাই রাজা! 👑'), 600);
  }
  addText(m.x, m.y - m.size, txt, { color: m.type === 'boss' ? '#ffd23f' : '#fff', size: m.type === 'boss' ? 30 : 24 });
}

function comboFX() {
  const c = G.combo;
  if (c < 2) return;
  sound.combo(c);
  const v = COMBO_VOICE[c] || (c > 16 && c % 6 === 4 ? pick(ALL_COMBO_VOICE) : null);
  if (v) {
    sound.voice(v, 2, 3.5);
    if (c === 5 || c === 12) showMeme('thug', c === 5 ? 'থাপ্পড় মাস্টার মোড: অন 😎' : 'এই হাতের থাপ্পড় কেউ ভোলে না 😎');
    banner(`কম্বো ×${bn(c)}! 🔥${c >= 8 ? '<small>পয়েন্ট ×৩</small>' : c >= 4 ? '<small>পয়েন্ট ×২</small>' : ''}`);
  }
}

function collect(it) {
  it.done = true;
  sound.power();
  burst(it.x, it.y, 18, ['#ffd23f', '#fff', it.color], 200);
  if (it.kind === 'coil') {
    G.slow = 7;
    banner('🌀 কয়েল জ্বালানো হলো!<small>মশারা ঝিমাচ্ছে</small>');
    sound.voice('unnoyon', 2);
  } else if (it.kind === 'cream') {
    G.shield = 10;
    banner('🧴 ক্রিম মাখা হলো!<small>কামড় দিলেও কাজ হবে না</small>');
    sound.voice('unnoyon', 2);
  } else if (it.kind === 'bat') {
    G.bat = 8;
    banner('⚡ ইলেকট্রিক ব্যাট!<small>এক থাপ্পড়ে চারপাশ সাফ</small>');
    sound.voice('chalo', 2, 2.5);
  } else if (it.kind === 'dab') {
    if (G.lives < 3) { G.lives++; banner('🥥 ডাবের পানি! +১ ❤️<small>ডেঙ্গুতে প্রচুর তরল খান</small>'); }
    else { G.score += 5; banner('🥥 ডাবের পানি! +৫'); }
  }
}

function bitten(m) {
  if (G.shield > 0) {
    addText(m.x, m.y - m.size * 2, 'ক্রিমে কাজ হইছে! 🛡️', { color: '#80ffdb', size: 20 });
    sound.laugh();
  } else {
    G.lives--;
    G.flash = 0.6;
    G.shake = 12;
    G.combo = 0;
    popBubble();
    S.mood = 'ouch';
    S.moodT = 1.3;
    if (m.tgt === 2) S.kickT = 1.2; else { S.scratchT = 1.5; S.scratchTgt = m.tgt; }
    S.bites.push({ t: m.tgt, dx: rand(-6, 6) * L.u, dy: rand(-5, 5) * L.u });
    if (S.bites.length > 12) S.bites.shift();
    vibrate(200);
    sound.hurt();
    sound.voice(['ei-dhongi', 'o-ki-lagche', 'dhoka-khaichi', 'gopgopgop'], 3, 3.5);
    addText(m.x, m.y - m.size * 2, `কামড়! ${L.targets[m.tgt].name} 🩸`, { color: '#ff4d4d', size: 24, life: 1.1 });
    const lv = $('lives');
    lv.classList.remove('hurt'); void lv.offsetWidth; lv.classList.add('hurt');
    if (G.lives === 2) showMeme('dinner', 'মশাদের আজকের ডিনার রেডি 🍽️');
    else if (G.lives === 1) showMeme('shock', 'মামার জীবন এখন আপনার হাতে!');
    if (G.lives <= 0) die();
  }
  m.state = 'leave';
  m.blood = 1;
  say(m, 'leave', true);
  m.vx = rand(-1, 1) * m.speed;
  m.vy = -m.speed * 1.5;
  updateHUD();
}

function die() {
  G.state = 'dying';
  G.dieT = 1.6;
  S.mood = 'fever';
  S.moodT = 99;
  for (const m of G.mosq) if (!m.dead && m.state !== 'leave') { m.state = 'leave'; m.vy = -m.speed * 2; }
  sound.laugh();
  sound.setBuzz(0);
}

// ------------------------------------------------------------------ update
function updateMosq(m, dt, demo) {
  m.t += dt;
  m.pop = Math.min(1, m.pop + dt * 3);
  m.hurtT = Math.max(0, m.hurtT - dt);
  if (m.say) m.say.t += dt;
  // look direction + fear of the hovering hand
  const P = G.ptr;
  const near = P.mouse && G.state === 'play' && Math.hypot(P.x - m.x, P.y - m.y) < L.slapR * 1.9;
  m.scared = near || m.dodgeT > 0;
  let lx, ly;
  if (near) { lx = P.x - m.x; ly = P.y - m.y; }
  else if (m.state === 'approach' || m.state === 'bite') { const T = L.targets[m.tgt]; lx = T.x - m.x; ly = T.y - m.y; }
  else { lx = m.vx; ly = m.vy; }
  const ll = Math.hypot(lx, ly) || 1;
  m.lookX += (lx / ll - m.lookX) * Math.min(1, dt * 10);
  m.lookY += (ly / ll - m.lookY) * Math.min(1, dt * 10);
  if ((m.sayCD -= dt) <= 0 && m.state === 'roam') {
    m.sayCD = rand(3, 7);
    if (Math.random() < 0.45) say(m, m.type === 'boss' ? 'boss' : m.type === 'fat' && Math.random() < 0.5 ? 'fat' : 'roam');
  }
  const diff = demo ? 1 : 1 + Math.min(0.7, G.t * 0.007);
  const sp = m.speed * L.u * diff * (G.slow > 0 ? 0.4 : 1);

  if (m.state === 'roam' || m.state === 'approach') {
    let tx, ty;
    if (m.state === 'roam') {
      tx = m.wx; ty = m.wy;
      m.roamT = (m.roamT || 0) + dt;
      if (Math.hypot(tx - m.x, ty - m.y) < 30 * L.u || m.roamT > 2.8) {
        m.roamT = 0;
        if (--m.roams <= 0 && !demo) m.state = 'approach';
        waypoint(m);
      }
    } else {
      const T = L.targets[m.tgt];
      tx = T.x + m.offX * L.u; ty = T.y + m.offY * L.u;
      const d = Math.hypot(tx - m.x, ty - m.y);
      if (d < Math.max(5, sp * dt * 1.5)) {
        m.state = 'bite'; m.biteT = 0; m.x = tx; m.y = ty; m.vx = m.vy = 0;
        sound.bite();
        say(m, 'bite', true);
        return;
      }
    }
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy) || 1;
    // zig-zag flight, calming down near the target so it can actually land
    const wob = Math.sin(m.t * m.wf + m.seed) * sp * 0.9 * Math.min(1, d / (110 * L.u));
    let dvx = (dx / d) * sp - (dy / d) * wob;
    let dvy = (dy / d) * sp + (dx / d) * wob;
    if (m.dodgeT > 0) { m.dodgeT -= dt; dvx = m.dvx; dvy = m.dvy; }
    const k = Math.min(1, dt * 5);
    m.vx += (dvx - m.vx) * k;
    m.vy += (dvy - m.vy) * k;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
  } else if (m.state === 'bite') {
    m.biteT += dt * (G.slow > 0 ? 0.6 : 1);
    if (m.type !== 'fat') m.blood = Math.min(1, m.biteT / m.biteDur);
    m.x += Math.sin(m.t * 40) * 0.2;
    if (m.biteT >= m.biteDur) bitten(m);
  } else if (m.state === 'leave') {
    m.vy -= 300 * dt;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    if (m.y < -80 || m.x < -80 || m.x > W + 80) m.dead = true;
  }
  if (Math.abs(m.vx) > 8) m.face = m.vx > 0 ? 1 : -1;
  m.tilt = m.state === 'bite' ? 0.35 : clamp((m.vy / (sp || 1)) * 0.25, -0.4, 0.4);
}

function update(dt) {
  G.time += dt;
  G.fanA += dt * 14;
  // effects run even during hitstop so the slap feels instant
  for (const h of G.hands) h.t += dt;
  G.hands = G.hands.filter(h => h.t < h.life);
  for (const z of G.zaps) z.t += dt;
  G.zaps = G.zaps.filter(z => z.t < z.life);
  G.shake = Math.max(0, G.shake - dt * 45);
  G.flash = Math.max(0, G.flash - dt * 1.4);

  if (G.state === 'paused') return;
  if (G.hitstop > 0) { G.hitstop -= dt; return; }

  for (const s of G.splats) s.t += dt;
  G.splats = G.splats.filter(s => s.t < 6.5);
  for (const p of G.parts) { p.t += dt; p.vy += 600 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  G.parts = G.parts.filter(p => p.t < p.life);
  for (const t of G.texts) { t.t += dt; t.y += t.vy * dt; t.vy *= 1 - dt * 1.5; }
  G.texts = G.texts.filter(t => t.t < t.life);
  if (S.moodT > 0 && (S.moodT -= dt) <= 0) S.mood = 'sleep';
  S.scratchT = Math.max(0, S.scratchT - dt);
  S.kickT = Math.max(0, S.kickT - dt);
  S.handprintT = Math.max(0, S.handprintT - dt);
  S.talkT = Math.max(0, S.talkT - dt);
  for (const so of G.souls) so.t += dt;
  G.souls = G.souls.filter(so => so.t < so.life);
  G.sayCD -= dt;
  G.calCD -= dt;
  const hd = L.head;
  S.worry = G.mosq.some(m => m.state === 'bite' || (m.state === 'approach' && Math.hypot(m.x - hd.x, m.y - hd.y) < hd.r * 4));
  if (S.mood === 'sleep' && !S.worry && (S.talkCD -= dt) <= 0) { S.talkCD = rand(7, 13); S.talk = pick(SLEEP_TALK); S.talkT = 2.6; }

  if (G.state === 'menu') {
    while (G.mosq.length < 4) { const m = spawn('normal'); m.roams = 999; }
    for (const m of G.mosq) updateMosq(m, dt, true);
    return;
  }

  if (G.state === 'play') {
    G.t += dt;
    G.slow = Math.max(0, G.slow - dt);
    G.shield = Math.max(0, G.shield - dt);
    G.bat = Math.max(0, G.bat - dt);
    if (G.potClean > 0 && (G.potClean -= dt) <= 0) {
      addText(L.pot.x, L.pot.y - L.pot.w * 1.5, 'আবার পানি জমেছে! 😩', { color: '#ffb4b4', size: 18, life: 1.6 });
    }
    if (G.combo > 0 && (G.comboT -= dt) <= 0) { G.combo = 0; updateHUD(); }

    const alive = G.mosq.filter(m => !m.dead && m.state !== 'leave').length;
    const maxAlive = Math.min(13, 3 + Math.floor(G.t / 9));
    if ((G.spawnT -= dt) <= 0 && alive < maxAlive) {
      G.spawnT = Math.max(0.45, 1.7 - G.t * 0.02) * rand(0.7, 1.3);
      spawn(pickType());
    }
    if ((G.swarmT -= dt) <= 0) {
      G.swarmT = rand(28, 36);
      const n = 3 + Math.floor(G.t / 40);
      for (let i = 0; i < n; i++) spawn(i % 3 === 2 ? 'fast' : 'normal', G.potClean > 0 ? 'top' : 'window');
      banner(G.potClean > 0 ? '🦟🦟 মশার দল আসছে! 🦟🦟<small>পাশের বাসার জমা পানি থেকে</small>' : '🦟🦟 মশার দল আসছে! 🦟🦟<small>টবের জমা পানি থেকে জন্ম নিল, ফেলে দিন!</small>');
      sound.voice('aaho-bhatija', 2);
      sound.clip('mosquito-buzz', { vol: 0.5, maxDur: 2.5 });
    }
    if (G.score >= G.nextBoss && !G.mosq.some(m => m.type === 'boss' && !m.dead)) {
      G.nextBoss += 60;
      say(spawn('boss', pick(['left', 'right'])), 'boss', true);
      banner('⚠️ মশা সর্দার আসছে! ⚠️<small>৬ থাপ্পড় লাগবে</small>');
      sound.voice(['maa-tari-oo-bhai', 'koun-hai-re'], 3, 3.5);
      sound.clip('999-social-credit-siren', { vol: 0.45, maxDur: 2.8 });
    }
    if ((G.itemT -= dt) <= 0) { G.itemT = rand(14, 22); spawnItem(); }
    for (const it of G.items) {
      it.t += dt;
      it.x += it.vx * dt;
      if (it.x < it.r || it.x > W - it.r) it.vx *= -1;
      it.y = it.y0 + Math.sin(it.t * 2) * 10 * L.u;
    }
    G.items = G.items.filter(i => i.t < i.life && !i.done);
  }

  for (const m of G.mosq) if (!m.dead) updateMosq(m, dt, false);
  G.mosq = G.mosq.filter(m => !m.dead);

  if (G.state === 'dying' && (G.dieT -= dt) <= 0) gameOver();

  // buzz follows mosquito count and position
  if (G.state === 'play') {
    const live = G.mosq.filter(m => m.state !== 'leave');
    const lvl = Math.min(1, live.length * 0.16);
    const pan = live.length ? live.reduce((a, m) => a + m.x, 0) / live.length / W * 2 - 1 : 0;
    const boss = live.some(m => m.type === 'boss');
    sound.setBuzz(lvl, pan * 0.7, boss ? 0.7 : 1 + Math.min(0.15, live.length * 0.01));
    updatePowers();
  }
}

// ------------------------------------------------------------------ render
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.save();
  if (G.shake > 0) ctx.translate(rand(-1, 1) * G.shake, rand(-1, 1) * G.shake);
  ctx.drawImage(BG, 0, 0, W, H);
  art.drawFan(ctx, L, G.fanA);
  art.drawPot(ctx, L, G.potClean > 0, G.time);
  if (G.slow > 0) art.drawCoil(ctx, L, G.time);
  art.drawMan(ctx, L, S, G.time, G.shield > 0, IMG);
  art.drawDust(ctx, L, G.time);
  for (const s of G.splats) art.drawSplat(ctx, s);
  for (const it of G.items) art.drawItem(ctx, it, G.time, L.u);
  for (const so of G.souls) art.drawSoul(ctx, so, L.u);
  for (const m of G.mosq) {
    if (m.state === 'bite') art.drawBiteWarning(ctx, m, G.time, L.u);
    art.drawMosquito(ctx, m, G.time, L.u);
    if (m.type === 'boss') art.drawHpBar(ctx, m, L.u);
  }
  for (const p of G.parts) {
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = p.c;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const z of G.zaps) art.drawZap(ctx, z);
  for (const h of G.hands) art.drawHand(ctx, h);
  if (G.ptr.mouse && G.state === 'play' && !G.hands.some(h => h.t < 0.2)) art.drawCursorHand(ctx, G.ptr.x, G.ptr.y, L.slapR * 0.9, G.time, G.bat > 0);
  for (const t of G.texts) {
    const p = t.t / t.life;
    ctx.globalAlpha = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
    const sc = p < 0.12 ? 0.6 + (p / 0.12) * 0.6 : 1.2 - Math.min(0.2, (p - 0.12) * 1.5);
    art.label(ctx, t.text, t.x, t.y, t.size * sc, t.color);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // warm afternoon colour grade over the whole scene
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const cg = ctx.createRadialGradient(L.win.x + L.win.w / 2, L.win.y, 0, L.win.x + L.win.w / 2, L.win.y, Math.max(W, H));
  cg.addColorStop(0, 'rgba(255,214,150,.55)');
  cg.addColorStop(1, 'rgba(90,40,10,.35)');
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  if (G.flash > 0) {
    ctx.fillStyle = `rgba(220,0,0,${G.flash * 0.4})`;
    ctx.fillRect(0, 0, W, H);
  }
  if ((G.state === 'play' && G.lives === 1) || G.state === 'dying') {
    const a = 0.25 + Math.sin(G.time * 5) * 0.12;
    const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    gr.addColorStop(0, 'rgba(200,0,0,0)');
    gr.addColorStop(1, `rgba(200,0,0,${a})`);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }
  if (G.bat > 0) {
    ctx.strokeStyle = `rgba(122,231,255,${0.4 + Math.sin(G.time * 20) * 0.2})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, W - 6, H - 6);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ HUD / screens
let lastScore = -1;
function updateHUD(force) {
  if (G.score !== lastScore || force) {
    $('score').textContent = bn(G.score ?? 0);
    if (!force) { const sb = $('score').parentElement; sb.classList.remove('bump'); void sb.offsetWidth; sb.classList.add('bump'); }
    lastScore = G.score;
  }
  $('lives').textContent = '❤️'.repeat(Math.max(0, G.lives ?? 3)) + '🖤'.repeat(Math.max(0, 3 - (G.lives ?? 3)));
  const c = $('combo');
  if (G.combo >= 2) {
    const mult = G.combo >= 8 ? 3 : G.combo >= 4 ? 2 : 1;
    c.textContent = `কম্বো ${bn(G.combo)}` + (mult > 1 ? ` · ×${bn(mult)}` : '');
    c.classList.add('on');
    c.classList.toggle('hot', mult > 1);
    c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  } else c.classList.remove('on');
}

let powersKey = '';
function updatePowers() {
  const p = [];
  if (G.slow > 0) p.push(`🌀 ${bn(Math.ceil(G.slow))}`);
  if (G.shield > 0) p.push(`🛡️ ${bn(Math.ceil(G.shield))}`);
  if (G.bat > 0) p.push(`⚡ ${bn(Math.ceil(G.bat))}`);
  const key = p.join('|');
  if (key !== powersKey) { powersKey = key; $('powers').innerHTML = p.map(x => `<span>${x}</span>`).join(''); }
}

function show(id) {
  for (const s of ['scrStart', 'scrPause', 'scrOver', 'scrCredits', 'scrShare', 'scrName', 'scrBoard']) $(s).classList.toggle('hidden', s !== id);
  $('hud').classList.toggle('hidden', !(G.state === 'play' || G.state === 'dying' || G.state === 'paused'));
  cv.style.cursor = G.state === 'play' ? 'none' : 'default';
}

function goHome() {
  G.state = 'menu';
  G.mosq = []; G.items = []; G.texts = []; G.parts = [];
  G.souls = []; G.potClean = 0;
  resetSleeper();
  sound.setBuzz(0);
  $('bestLine').textContent = best ? `🏆 আপনার রেকর্ড: ${bn(best)} পয়েন্ট` : '';
  show('scrStart');
}

function startGame() {
  $('meme').classList.remove('show');
  sound.init();
  sound.click();
  resetGame();
  show(null);
  setTimeout(() => sound.voice(['goribera', 'helicopter-milon', 'chalo'], 2), 250);
  banner('মশা আসছে! 🦟<small>মামার ঘুম বাঁচান</small>');
}

function pause() {
  if (G.state !== 'play') return;
  G.state = 'paused';
  sound.setBuzz(0);
  show('scrPause');
  $('hud').classList.remove('hidden');
}
function resume() {
  if (G.state !== 'paused') return;
  sound.init();
  G.state = 'play';
  show(null);
}

function headlineFor(k) {
  if (k === 0) return 'থাপ্পড়বাজ একটা মশাও মারতে পারেননি; মশারা মিষ্টি বিতরণ করছে!';
  if (k < 10) return `দুর্বল থাপ্পড়! মাত্র ${bn(k)}টি মশা নিধন, এলাকার মশারা উৎসবে মাতোয়ারা`;
  if (k < 30) return `পাড়ার থাপ্পড়বাজ ${bn(k)}টি মশা নিধন করলেন; মশা সমিতির জরুরি বৈঠক`;
  if (k < 70) return `ভয়ংকর থাপ্পড়বাজের আতঙ্কে ${bn(k)}টি মশা নিহত, এইডিস পরিবার এলাকা ছাড়া!`;
  return `সিটি কর্পোরেশনের চেয়েও বেশি! এক থাপ্পড়বাজের হাতে ${bn(k)}টি মশা খতম`;
}

let lastResult = null;
function gameOver() {
  G.state = 'over';
  const newBest = G.score > best;
  if (newBest) { best = G.score; store.set('dsm_best', best); }
  sound.sadTrombone();
  setTimeout(() => sound.voice(newBest && G.score > 0 ? 'osombhob' : ['masud', 'amar-vul', 'maa-tari-oo-bhai'], 5, 6), 1500);
  const acc = G.slaps ? Math.round((G.hits / G.slaps) * 100) : 0;
  lastResult = { score: G.score, kills: G.kills, combo: G.maxCombo, acc, time: Math.round(G.t), headline: headlineFor(G.kills), newBest };
  let date = '';
  try { date = new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) {}
  $('ovDate').textContent = date;
  $('ovHeadline').textContent = lastResult.headline;
  $('ovScore').textContent = bn(G.score);
  $('ovBest').textContent = newBest && G.score > 0 ? '🏆 নতুন রেকর্ড!' : `রেকর্ড: ${bn(best)}`;
  if (G.score > CHALLENGE) $('ovBest').textContent = FRIEND_SCORE ? `🎯 বন্ধুর ${bn(CHALLENGE)} হারাইছেন!` : `🎯 ${bn(CHALLENGE)} চ্যালেঞ্জ জিতলেন!`;
  $('stKills').textContent = bn(G.kills);
  $('stCombo').textContent = bn(G.maxCombo);
  $('stAcc').textContent = bn(acc) + '%';
  $('stTime').textContent = bn(lastResult.time);
  $('ovSatire').textContent = lastResult.satire = pick(SATIRE);
  $('ovTip').textContent = pick(TIPS);
  postScore(lastResult);
  show('scrOver');
  memeLast = -Infinity;
  setTimeout(() => showMeme('fever', newBest && G.score > 0 ? 'রেকর্ড ভাঙলো, কিন্তু মামার জ্বর 🤒' : 'মামা: আমি ঠিক আছি... 🤒'), 900);
}

// ------------------------------------------------------------------ meme cards
// Built-in memes are drawn from the uncle's own photo. Extra pictures can be dropped
// into img/meme/ and listed in img/meme/memes.json: [{ "file": "x.jpg", "caption": "..." }]
const loadImg = src => { const im = new Image(); im.src = src; return im; };
const FACE = loadImg('img/mama_face.webp');
const FEVER_FACE = loadImg('img/mama_fever_face.webp');
const NEWS = loadImg('img/news_photo.webp');
// Meme frames on the wall: pictures listed in img/wall/wall.json ([{ "file", "caption" }]),
// or the uncle's own photos with funny captions until some are added.
const WALL_FALLBACK = [
  { img: FACE, caption: 'ঘুমাইতে দেন ভাই! 😴', focusY: 0.4 },
  { img: FEVER_FACE, caption: 'মশা মারেন, আমারে না!', focusY: 0.4 },
];
function refreshWall(list) {
  art.setWallPics(list);
  if (L) BG = art.renderBackground(L, DPR);
}
fetch('img/wall/wall.json')
  .then(r => (r.ok ? r.json() : []))
  .catch(() => [])
  .then(list => {
    const pics = (Array.isArray(list) ? list : []).filter(p => p && p.file)
      .map(p => ({ img: loadImg('img/wall/' + p.file), caption: p.caption || '', focusY: p.focusY ?? 0.35 }));
    // only two frames fit on the wall, so show a random pair each visit
    for (let i = pics.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pics[i], pics[j]] = [pics[j], pics[i]]; }
    const use = pics.length ? pics : WALL_FALLBACK;
    use.forEach(p => p.img.addEventListener('load', () => refreshWall(use)));
    refreshWall(use);
  });
let customMemes = [];
fetch('img/meme/memes.json')
  .then(r => (r.ok ? r.json() : []))
  .then(list => { customMemes = (Array.isArray(list) ? list : []).filter(m => m && m.file).map(m => ({ src: 'img/meme/' + m.file, caption: m.caption || '' })); customMemes.forEach(m => loadImg(m.src)); })
  .catch(() => {});

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const memeCache = {};
function memeText(g, text, x, y, size) {
  g.font = `700 ${size}px Atma, "Noto Sans Bengali", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = size * 0.22;
  g.strokeStyle = '#000';
  g.strokeText(text, x, y);
  g.fillStyle = '#fff';
  g.fillText(text, x, y);
}
function emoji(g, ch, x, y, size, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.font = `${size}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(ch, 0, 0); g.restore();
}
function makeMeme(kind) {
  if (memeCache[kind]) return memeCache[kind];
  const face = kind === 'fever' ? FEVER_FACE : FACE;
  if (!face.complete || !face.naturalWidth) return null;
  const c = document.createElement('canvas');
  c.width = 400; c.height = 300;
  const g = c.getContext('2d');
  const s = Math.max(400 / face.naturalWidth, 300 / face.naturalHeight);
  g.drawImage(face, (400 - face.naturalWidth * s) / 2, (300 - face.naturalHeight * s) / 2, face.naturalWidth * s, face.naturalHeight * s);
  if (kind === 'thug') {
    // pixel "deal with it" shades over the eye + gold chain
    g.save(); g.translate(200, 100); g.rotate(-0.42);
    const P = 9, rows = ['1111111111111111111', '1222211111222211110', '0122110001221100000', '0011100000111000000'];
    rows.forEach((row, ry) => [...row].forEach((v, rx) => {
      if (v === '0') return;
      g.fillStyle = v === '2' ? '#fff' : '#000';
      g.fillRect((rx - 9) * P, (ry - 1) * P, P, P);
    }));
    g.restore();
    g.strokeStyle = '#f5c518'; g.lineWidth = 10; g.setLineDash([12, 6]);
    g.beginPath(); g.arc(330, 150, 95, 0.55 * Math.PI, 1.05 * Math.PI); g.stroke(); g.setLineDash([]);
    memeText(g, 'THUG LIFE মামা', 200, 36, 34);
  } else if (kind === 'king') {
    emoji(g, '👑', 110, 95, 110, -1.25);
    emoji(g, '✨', 330, 50, 46);
    memeText(g, 'ঘুমের রাজা', 200, 262, 40);
  } else if (kind === 'dinner') {
    g.fillStyle = 'rgba(200,0,0,.18)'; g.fillRect(0, 0, 400, 300);
    emoji(g, '🍴', 60, 230, 70, -0.4);
    emoji(g, '🦟', 330, 70, 60, 0.3);
    emoji(g, '🦟', 270, 230, 50, -0.2);
    memeText(g, 'আজকের মেনু: মামা', 200, 36, 34);
  } else if (kind === 'shock') {
    emoji(g, '😱', 330, 230, 80);
    emoji(g, '❗', 80, 70, 70, -0.2);
    memeText(g, 'আর একটা কামড়ও না!', 200, 36, 32);
  } else if (kind === 'fever') {
    emoji(g, '🔥', 60, 240, 70);
    emoji(g, '🔥', 345, 240, 70);
    memeText(g, 'আমি ঠিক আছি 🙂', 200, 36, 36);
  }
  return (memeCache[kind] = c.toDataURL('image/jpeg', 0.85));
}

let memeTimer = 0, memeLast = -Infinity;
function showMeme(kind, caption) {
  const now = performance.now();
  if (now - memeLast < 6000) return;
  let src = null, cap = caption;
  if (customMemes.length && Math.random() < 0.5) { const m = pick(customMemes); src = m.src; cap = m.caption || caption; }
  else src = makeMeme(kind);
  if (!src) return;
  memeLast = now;
  const el = $('meme');
  el.querySelector('img').src = src;
  el.querySelector('.cap').textContent = cap;
  el.classList.add('show');
  sound.pop();
  clearTimeout(memeTimer);
  memeTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ------------------------------------------------------------------ share
const shareUrl = () => location.origin + location.pathname;
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
let shareBlob = null;

// Funny rank shown on the saved poster, by score
function rankFor(score) {
  if (score <= 0) return { title: 'থাপ্পড় দিতে ভুলে গেছি 🤡', top: 'যখন মশা মারতে গিয়া নিজেরেই থাপ্পড় দেই:', bottom: 'মশা মরে নাই, আমার ইজ্জত মরছে' };
  if (score < 20) return { title: 'নবিশ থাপ্পড়বাজ 🐣', top: 'যখন জীবনের প্রথম মশা মারি:', bottom: 'বাকি মশারা আমারে দেখে হাসতেছে 😂' };
  if (score < 60) return { title: 'পাড়ার থাপ্পড় মাস্তান 😎', top: 'যখন এক থাপ্পড়ে মশার গুষ্টি শেষ:', bottom: 'এলাকার মশারা এখন সাবধান!' };
  if (score < 150) return { title: 'থাপ্পড় সম্রাট 👑', top: 'মশারা যখন আমার নাম শুনে:', bottom: 'থাপ্পড়ের আওয়াজে ঢাকা কাঁপে!' };
  return { title: 'মশার যম 💀', top: 'এইডিস সমাজের মিটিংয়ে আমার ছবি:', bottom: 'মশা সমাজ আমারে ব্যান করছে!' };
}

// Saved / shared image: the front page of "দৈনিক মশারি" (1080×1350, the size Facebook &
// Instagram feeds show in full), lying on a desk.
function buildCard(r) {
  const W = 1080, H = 1350, INK = '#1f1b16', RED = '#b3121c';
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const name = store.get('dsm_name', '');
  const rank = r ? rankFor(r.score) : null;

  // desk + paper sheet
  let gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, '#5a3a22'); gr.addColorStop(1, '#2e1d10');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save();
  g.translate(W / 2, H / 2); g.rotate(-0.008); g.translate(-W / 2, -H / 2);
  const X = 26, Y = 22, PW = W - 52, PH = H - 44;
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 40; g.shadowOffsetY = 14;
  g.fillStyle = '#efe6cf'; g.fillRect(X, Y, PW, PH);
  g.shadowColor = 'transparent';
  // aged paper: warm edges, grain, a centre fold
  gr = g.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 900);
  gr.addColorStop(0, 'rgba(255,250,235,.55)'); gr.addColorStop(1, 'rgba(160,120,60,.22)');
  g.fillStyle = gr; g.fillRect(X, Y, PW, PH);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(90,60,20,.06)' : 'rgba(255,255,255,.08)';
    g.fillRect(X + Math.random() * PW, Y + Math.random() * PH, 1.6, 1.6);
  }
  gr = g.createLinearGradient(0, H / 2 - 40, 0, H / 2 + 40);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(90,60,20,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(X, H / 2 - 40, PW, 80);

  const L = 74, R = W - 74, CW = R - L;
  const rule = (y, h = 2) => { g.fillStyle = INK; g.fillRect(L, y, CW, h); };
  g.fillStyle = INK; g.textBaseline = 'alphabetic';

  // top strip
  let date = '';
  try { date = new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) {}
  g.font = '600 24px "Noto Sans Bengali", sans-serif';
  g.textAlign = 'left'; g.fillText(date, L, 80);
  g.textAlign = 'center'; g.fillText(r ? `বিশেষ সংস্করণ · সংখ্যা ${bn(r.score)}` : 'বিশেষ সংস্করণ', W / 2, 80);
  g.textAlign = 'right'; g.fillText('মূল্য: এক থাপ্পড়', R, 80);
  rule(94, 2);
  // masthead
  g.textAlign = 'center';
  g.font = '122px "Tiro Bangla", serif';
  g.fillText('দৈনিক মশারি', W / 2, 212);
  rule(234, 4); rule(242, 1.5);
  g.font = '500 25px "Noto Sans Bengali", sans-serif';
  g.fillText('মশা নয়, সত্য প্রকাশে আপসহীন  ·  ঢাকা থেকে প্রকাশিত', W / 2, 273);
  rule(286, 1.5); rule(292, 4);

  // breaking + headline
  g.fillStyle = RED; g.fillRect(L, 314, 236, 46);
  g.fillStyle = '#fff'; g.font = '700 28px "Noto Sans Bengali", sans-serif'; g.textAlign = 'center';
  g.fillText('🔴 ব্রেকিং নিউজ', L + 118, 346);
  g.fillStyle = INK; g.textAlign = 'left';
  const headline = r ? r.headline : 'ঘুমন্ত মামাকে বাঁচাতে এলাকায় জরুরি ভিত্তিতে থাপ্পড়বাজ খোঁজা হচ্ছে!';
  let hs = 62, lines;
  do { g.font = `${hs}px "Tiro Bangla", serif`; lines = wrapLines(g, headline, CW); hs -= 2; } while (lines.length > 2 && hs > 40);
  lines.forEach((t, i) => g.fillText(t, L, 424 + i * (hs + 18)));
  let y = 424 + (lines.length - 1) * (hs + 18) + 44;
  g.font = 'italic 500 25px "Noto Sans Bengali", sans-serif'; g.fillStyle = '#4a3f33';
  g.fillText(name ? `নিজস্ব প্রতিবেদক  ·  থাপ্পড়বাজ: ${name}` : 'নিজস্ব প্রতিবেদক  ·  ঢাকা', L, y);
  y += 22; rule(y, 1.5);

  // lead photo (sepia print) with a rubber stamp
  const py = y + 18, ph = 262;
  g.fillStyle = '#d9cdb0'; g.fillRect(L - 6, py - 6, CW + 12, ph + 12);
  if (NEWS.complete && NEWS.naturalWidth) {
    g.save(); g.beginPath(); g.rect(L, py, CW, ph); g.clip();
    g.filter = 'sepia(.45) contrast(1.12) saturate(.8)';
    const s = Math.max(CW / NEWS.naturalWidth, ph / NEWS.naturalHeight);
    g.drawImage(NEWS, L + (CW - NEWS.naturalWidth * s) / 2, py + (ph - NEWS.naturalHeight * s) * 0.45, NEWS.naturalWidth * s, NEWS.naturalHeight * s);
    g.filter = 'none';
    g.restore();
  }
  g.font = '500 22px "Noto Sans Bengali", sans-serif'; g.fillStyle = '#3b342b'; g.textAlign = 'left';
  g.fillText(r && r.kills > 0 ? 'ছবি: থাপ্পড়বাজের হাতে মশা নিধনের পর স্বস্তির ঘুমে মামা।  — নিজস্ব আলোকচিত্রী'
    : 'ছবি: থাপ্পড়বাজের অপেক্ষায় ঘুমন্ত মামা।  — নিজস্ব আলোকচিত্রী', L, py + ph + 34);
  g.save(); g.translate(R - 104, py + 96); g.rotate(-0.22);
  g.strokeStyle = 'rgba(179,18,28,.85)'; g.fillStyle = 'rgba(179,18,28,.85)';
  g.lineWidth = 7; g.beginPath(); g.arc(0, 0, 92, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 78, 0, Math.PI * 2); g.stroke();
  g.font = '700 36px Atma, sans-serif'; g.textAlign = 'center';
  g.fillText(r && r.newBest ? 'নতুন' : 'থাপ্পড়', 0, -4); g.fillText(r && r.newBest ? 'রেকর্ড!' : 'বাজ ✓', 0, 38);
  g.restore();

  // score + rank
  y = py + ph + 50; rule(y, 2);
  const ay = PH + Y - 108;
  g.textAlign = 'left';
  if (r) {
    g.fillStyle = RED; g.font = '700 112px Mina, sans-serif';
    g.fillText(bn(r.score), L, y + 114);
    const sw = g.measureText(bn(r.score)).width;
    g.fillStyle = INK; g.font = '700 34px "Noto Sans Bengali", sans-serif';
    g.fillText('পয়েন্ট', L + sw + 14, y + 108);
    const rx = L + Math.max(sw + 150, 380);
    g.fillStyle = INK; g.fillRect(rx - 26, y + 18, 2, 100);
    g.font = '600 26px "Noto Sans Bengali", sans-serif'; g.fillStyle = '#4a3f33';
    g.fillText('র‍্যাংক', rx, y + 50);
    g.font = '700 46px Atma, "Noto Sans Bengali", sans-serif'; g.fillStyle = INK;
    fitText(g, rank.title, rx, y + 102, R - rx);
    y += 134; rule(y, 1.5);
    // stats
    const stats = [[bn(r.kills), 'মশা খতম'], [bn(r.combo), 'সর্বোচ্চ কম্বো'], [bn(r.acc) + '%', 'নিশানা'], [bn(r.time), 'সেকেন্ড টিকেছেন']];
    const cw = CW / 4;
    stats.forEach(([v, l], i) => {
      const cx = L + cw * i + cw / 2;
      if (i) { g.fillStyle = 'rgba(31,27,22,.35)'; g.fillRect(L + cw * i, y + 12, 1.5, 74); }
      g.fillStyle = INK; g.textAlign = 'center';
      g.font = '700 42px Mina, sans-serif'; g.fillText(v, cx, y + 54);
      g.font = '500 22px "Noto Sans Bengali", sans-serif'; g.fillText(l, cx, y + 84);
    });
    y += 98; rule(y, 1.5);
    // a line of satire with a drop cap
    const sat = r.satire || pick(SATIRE);
    g.textAlign = 'left'; g.fillStyle = INK;
    // only as many lines as fit above the ad
    const room = Math.min(2, Math.floor((ay - 18 - (y + 40)) / 38) + 1);
    if (room > 0) {
      g.font = '60px "Tiro Bangla", serif';
      // first grapheme (keeps Bengali conjuncts like প্র whole)
      const seg = window.Intl && Intl.Segmenter ? [...new Intl.Segmenter('bn', { granularity: 'grapheme' }).segment(sat)].map(x => x.segment) : Array.from(sat);
      const cap = seg[0], capW = g.measureText(cap).width + 10;
      g.fillText(cap, L, y + 62);
      g.font = '27px "Tiro Bangla", serif';
      const body = wrapLines(g, seg.slice(1).join(''), CW - capW);
      const shown = body.slice(0, room);
      if (body.length > room) shown[room - 1] = shown[room - 1].replace(/\s*\S+$/, ' ...');
      shown.forEach((t, i) => g.fillText(t, L + capW, y + 38 + i * 38));
    }
  } else {
    g.fillStyle = INK; g.font = '48px "Tiro Bangla", serif'; g.textAlign = 'center';
    g.fillText('মশা মারতে কামান লাগে না, একটা থাপ্পড়ই যথেষ্ট!', W / 2, y + 90);
  }

  // classified-ad box at the foot of the page: challenge on the left, link on the right
  g.fillStyle = INK; g.fillRect(L, ay, CW, 84);
  g.strokeStyle = '#efe6cf'; g.lineWidth = 2; g.setLineDash([8, 6]); g.strokeRect(L + 8, ay + 8, CW - 16, 68); g.setLineDash([]);
  g.textBaseline = 'middle';
  g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = '700 36px Atma, "Noto Sans Bengali", sans-serif';
  g.fillText(r ? 'তুমি পারবা আমাকে হারাতে? 😏' : 'থাপ্পড়বাজ চাই! 👋', L + 30, ay + 44);
  g.textAlign = 'right'; g.fillStyle = '#ffd23f'; g.font = '700 28px Mina, "Noto Sans Bengali", sans-serif';
  g.fillText('👉 ' + location.host, R - 30, ay + 44);
  g.textBaseline = 'alphabetic';
  g.restore();
  return c;
}
function wrapLines(g, text, maxW) {
  const out = []; let line = '';
  for (const w of String(text).split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
function fitText(g, text, x, y, maxW) {
  const m = g.font.match(/(\d+)px/), base = m ? +m[1] : 40;
  let size = base;
  while (size > 24 && g.measureText(text).width > maxW) { size -= 2; g.font = g.font.replace(/\d+px/, size + 'px'); }
  g.fillText(text, x, y);
}

// 1200×630 link-preview card (the size Facebook / WhatsApp show best), uploaded per result
function buildOgCard(r) {
  const W = 1200, H = 630;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  let gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, '#ffe58a'); gr.addColorStop(0.55, '#ffb347'); gr.addColorStop(1, '#e8590c');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // sunburst behind the avatar
  g.save(); g.translate(905, 300);
  for (let i = 0; i < 18; i++) {
    g.rotate(Math.PI / 9);
    g.fillStyle = i % 2 ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,0)';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(700, -120); g.lineTo(700, 120); g.closePath(); g.fill();
  }
  g.restore();
  // avatar
  const face = FACE.complete && FACE.naturalWidth ? FACE : null;
  g.save();
  g.shadowColor = 'rgba(80,20,0,.45)'; g.shadowBlur = 40; g.shadowOffsetY = 14;
  g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(905, 300, 196, 0, Math.PI * 2); g.fill();
  g.restore();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(905, 300, 184, 0, Math.PI * 2); g.fill();
  if (face) {
    g.save(); g.beginPath(); g.arc(905, 300, 172, 0, Math.PI * 2); g.clip();
    const s = Math.max(344 / face.naturalWidth, 344 / face.naturalHeight) * 1.15;
    g.drawImage(face, 905 - face.naturalWidth * s * 0.6, 300 - face.naturalHeight * s * 0.42, face.naturalWidth * s, face.naturalHeight * s);
    g.restore();
  }
  emoji(g, '🖐️', 1080, 150, 120, 0.35);
  emoji(g, '🦟', 760, 470, 84, -0.3);
  g.save(); g.translate(1060, 470); g.rotate(-0.15);
  g.font = '700 64px Atma, sans-serif'; g.textAlign = 'center'; g.lineJoin = 'round';
  g.lineWidth = 12; g.strokeStyle = '#1d1a16'; g.strokeText('ঠাস!', 0, 0);
  g.fillStyle = '#e63946'; g.fillText('ঠাস!', 0, 0);
  g.restore();

  // left column
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillStyle = '#1d1a16'; rr2(g, 60, 52, 410, 58, 29); g.fill();
  g.fillStyle = '#ffd23f'; g.font = '700 32px Atma, "Noto Sans Bengali", sans-serif';
  g.fillText('ডেঙ্গু থাপ্পড় বাজ 👋', 86, 93);
  g.font = '700 34px "Noto Sans Bengali", sans-serif'; g.fillStyle = '#3b1d05';
  g.fillText(r.newBest ? '🏆 নতুন রেকর্ড! আমার স্কোর' : 'আমার থাপ্পড় স্কোর', 64, 175);
  g.font = '700 210px Mina, sans-serif'; g.lineJoin = 'round';
  g.lineWidth = 18; g.strokeStyle = '#fff'; g.strokeText(bn(r.score), 58, 368);
  g.fillStyle = '#c1121f'; g.fillText(bn(r.score), 58, 368);
  const sw = g.measureText(bn(r.score)).width;
  g.font = '700 40px "Noto Sans Bengali", sans-serif'; g.fillStyle = '#3b1d05';
  g.fillText('পয়েন্ট', 58 + sw + 18, 360);
  g.font = '600 32px "Noto Sans Bengali", sans-serif'; g.fillStyle = '#3b1d05';
  g.fillText(`🦟 ${bn(r.kills)}টা মশা খতম  ·  🔥 কম্বো ×${bn(r.combo)}`, 64, 428);
  // challenge pill
  g.fillStyle = '#c1121f'; rr2(g, 58, 470, 560, 76, 38); g.fill();
  g.fillStyle = '#fff'; g.font = '700 38px Atma, "Noto Sans Bengali", sans-serif';
  g.fillText('তুমি পারবা আমারে হারাইতে? 😏', 86, 521);
  g.font = '700 26px Mina, "Noto Sans Bengali", sans-serif'; g.fillStyle = '#1d1a16';
  g.fillText('▶ এখনই খেলো: ' + location.host, 64, 596);
  return c;
}
function rr2(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

// Upload the card once per result and get a /s/<id> link whose preview is that card.
async function makeShareLink(r) {
  if (!r) return shareUrl();
  if (r.link) return r.link;
  try {
    const blob = await new Promise(res => buildOgCard(r).toBlob(res, 'image/jpeg', 0.86));
    const q = new URLSearchParams({ score: r.score, kills: r.kills, combo: r.combo });
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch('/api/share?' + q, { method: 'POST', body: blob, headers: { 'content-type': 'image/jpeg' }, signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(res.status);
    return (r.link = (await res.json()).url);
  } catch (e) {
    return shareUrl();
  }
}

function shareText(r) {
  return r
    ? `আমি "ডেঙ্গু থাপ্পড় বাজ" গেমে ${bn(r.score)} পয়েন্ট পেয়েছি, ${bn(r.kills)}টা মশা থাপ্পড়ে মেরেছি! 👋🦟 তুমি পারবা আমারে হারাইতে?`
    : 'মশা মারতে কামান লাগে না, একটা থাপ্পড়ই যথেষ্ট! 👋🦟 ঘুমন্ত মামাকে ডেঙ্গু মশার হাত থেকে বাঁচাও:';
}

function toast(msg) {
  const t = $('shareToast');
  t.textContent = msg;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.textContent = ''), 2500);
}

async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); return true; }
  catch (e) {
    const ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {}
    ta.remove(); return ok;
  }
}

let shareFrom = 'scrOver';
async function openShare(r, from) {
  sound.click();
  shareFrom = from;
  await document.fonts.ready;
  const c = buildCard(r);
  $('sharePreview').src = c.toDataURL('image/jpeg', 0.85);
  shareBlob = await new Promise(res => c.toBlob(res, 'image/png'));
  setShareLinks(r, shareUrl());
  $('shareToast').textContent = '';
  show('scrShare');
  if (r && !r.link) {
    $('shareGrid').classList.add('busy');
    toast('স্কোর কার্ডসহ লিংক তৈরি হচ্ছে... ⏳');
  }
  const link = await makeShareLink(r);
  $('shareGrid').classList.remove('busy');
  if (shareFrom === from) {
    setShareLinks(r, link);
    if (r) toast(link !== shareUrl() ? 'লিংক রেডি! শেয়ার করলে আপনার স্কোর কার্ড দেখাবে ✅' : '');
  }
}

function setShareLinks(r, url) {
  lastShare.url = url;
  const text = shareText(r);
  const e = encodeURIComponent;
  $('shFb').href = `https://www.facebook.com/sharer/sharer.php?u=${e(url)}&quote=${e(text)}`;
  $('shWa').href = `https://wa.me/?text=${e(text + ' ' + url)}`;
  $('shX').href = `https://twitter.com/intent/tweet?text=${e(text)}&url=${e(url)}`;
  $('shTg').href = `https://t.me/share/url?url=${e(url)}&text=${e(text)}`;
  $('shMs').href = isMobile ? `fb-messenger://share/?link=${e(url)}` : 'https://www.messenger.com/';
  $('shMs').dataset.copy = isMobile ? '' : text + ' ' + url;
  $('shCopy').dataset.copy = text + ' ' + url;
  $('shNative').classList.toggle('hidden', !navigator.share);
}

async function nativeShare() {
  const r = lastShare.r, url = lastShare.url || shareUrl(), text = shareText(r);
  const file = shareBlob && new File([shareBlob], 'dengue-thappor.png', { type: 'image/png' });
  try {
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'ডেঙ্গু থাপ্পড় বাজ', text: `${text} ${url}` });
    else await navigator.share({ title: 'ডেঙ্গু থাপ্পড় বাজ', text, url });
  } catch (e) {}
}
const lastShare = { r: null, url: '' };

function downloadCard() {
  if (!shareBlob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(shareBlob);
  a.download = 'dengue-thappor.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('ছবি সেভ হয়েছে! ফেসবুকে পোস্ট করুন 📸');
}

// Game-over "save picture": the same meme poster the share sheet makes, straight to a download
async function saveResultImage() {
  if (!lastResult) return;
  sound.click();
  const btn = $('btnSaveOver');
  btn.disabled = true;
  await document.fonts.ready;
  const blob = await new Promise(res => buildCard(lastResult).toBlob(res, 'image/png'));
  btn.disabled = false;
  if (!blob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `dengue-thappor-${lastResult.score}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  btn.textContent = 'সেভ হয়েছে ✅';
  setTimeout(() => (btn.textContent = 'ছবি সেভ'), 2200);
}

function wrap(g, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); line = w; y += lh; }
    else line = t;
  }
  g.fillText(line, x, y);
}

// ------------------------------------------------------------------ wiring
cv.addEventListener('pointerdown', e => { e.preventDefault(); slap(e.clientX, e.clientY); });
cv.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { G.ptr.x = e.clientX; G.ptr.y = e.clientY; G.ptr.mouse = true; } });
cv.addEventListener('pointerleave', () => { G.ptr.mouse = false; });
$('btnStart').addEventListener('click', askName);
$('btnAgain').addEventListener('click', startGame);
$('btnSaveOver').addEventListener('click', saveResultImage);
$('btnHome2').addEventListener('click', () => { sound.click(); goHome(); });
$('btnShare').addEventListener('click', () => { lastShare.r = lastResult; openShare(lastResult, 'scrOver'); });
$('btnShareStart').addEventListener('click', e => { e.preventDefault(); lastShare.r = null; openShare(null, 'scrStart'); });
$('btnShareBack').addEventListener('click', () => { sound.click(); show(shareFrom); });
$('shCopy').addEventListener('click', async () => { toast((await copyText($('shCopy').dataset.copy)) ? 'লিংক কপি হয়েছে! যেকোনো জায়গায় পেস্ট করুন ✅' : 'কপি করা যায়নি'); });
$('shMs').addEventListener('click', async () => { if ($('shMs').dataset.copy) { await copyText($('shMs').dataset.copy); toast('লিংক কপি হয়েছে, মেসেঞ্জারে পেস্ট করুন ✅'); } });
$('shDl').addEventListener('click', downloadCard);
$('shNative').addEventListener('click', nativeShare);
$('btnPause').addEventListener('click', () => { sound.click(); pause(); });
$('btnResume').addEventListener('click', () => { sound.click(); resume(); });
$('lnkCredits').addEventListener('click', e => { e.preventDefault(); show('scrCredits'); });
$('btnCreditsBack').addEventListener('click', () => show('scrStart'));

const muteBtn = $('btnMute');
function setMute(m) { sound.setMuted(m); store.set('dsm_mute', m); muteBtn.textContent = m ? '🔇' : '🔊'; }
muteBtn.addEventListener('click', () => { sound.init(); setMute(!sound.muted); });
window.addEventListener('keydown', e => {
  if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
  if (e.key === 'm' || e.key === 'M') setMute(!sound.muted);
  if (e.key === 'Escape' || e.key === 'p') G.state === 'play' ? pause() : resume();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('resize', resize);

setMute(store.get('dsm_mute', false));
resize();
goHome();
requestAnimationFrame(frame);
if (location.search.includes('debug')) window.__dsm = { G, S, update, resume, showMeme, makeMeme, openShare, buildOgCard, get L() { return L; } };
// redraw background once Bangla fonts are ready (calendar / tag text)
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { BG = art.renderBackground(L, DPR); });

// ------------------------------------------------------------------ player name + leaderboard
// Each browser gets a private random id; the server keeps that player's best game.
const PLAYER_ID = (() => {
  let id = store.get('dsm_pid', '');
  if (!/^[a-z0-9]{16}$/.test(id)) {
    const a = new Uint8Array(16);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => (a[i] = Math.random() * 256));
    id = [...a].map(b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
    store.set('dsm_pid', id);
  }
  return id;
})();
const cleanName = v => Array.from(String(v || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim()).slice(0, 20).join('');

function askName() {
  sound.init();
  sound.click();
  $('nameInput').value = '';
  $('nameError').textContent = '';
  show('scrName');
  setTimeout(() => $('nameInput').focus(), 350);
}
$('nameForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = cleanName($('nameInput').value);
  if (!name) { $('nameError').textContent = 'নাম ছাড়া থাপ্পড় দেওয়া যাবে না! 😅'; $('nameInput').focus(); return; }
  store.set('dsm_name', name);
  $('nameInput').blur();
  startGame();
});
$('btnNameBack').addEventListener('click', () => { sound.click(); show('scrStart'); });

async function postScore(r) {
  const name = store.get('dsm_name', ''), el = $('ovRank');
  el.classList.add('hidden');
  if (!name) return;
  try {
    const res = await fetch('/api/score', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: PLAYER_ID, name, score: r.score, kills: r.kills, combo: r.combo, time: r.time }),
    });
    if (!res.ok) return;
    const d = await res.json();
    el.innerHTML = d.improved && r.kills > 0
      ? `🏆 লিডারবোর্ডে আপনি এখন <b>#${bn(d.rank)}</b>! নতুন সেরা খেলা 🎉`
      : `🏆 লিডারবোর্ডে আপনার অবস্থান <b>#${bn(d.rank)}</b> (সেরা: ${bn(d.best.kills)}টা মশা)`;
    el.classList.remove('hidden');
  } catch (e) {}
}

let boardFrom = 'scrStart', boardPage = 1;
function boardCells(el, cells) {
  el.textContent = '';
  cells.forEach(t => { const sp = document.createElement('span'); sp.textContent = t; el.appendChild(sp); });
}
function openBoard(from) {
  sound.init();
  sound.click();
  boardFrom = from;
  $('boardList').innerHTML = '';
  show('scrBoard');
  loadBoard(1);
}
// 5 players per page + your own position as the 6th row
async function loadBoard(page) {
  const list = $('boardList'), me = $('boardMe'), pager = $('boardPager');
  boardPage = page;
  // keep the current page visible (dimmed) while the next one loads, so the card doesn't jump
  if (list.querySelector('.board-row')) list.classList.add('loading');
  else list.innerHTML = '<li class="board-msg">লোড হচ্ছে... ⏳</li>';
  pager.classList.add('busy');
  try {
    const res = await fetch(`/api/leaderboard?page=${page}&me=${PLAYER_ID}`);
    if (!res.ok) throw new Error(res.status);
    const d = await res.json();
    if (boardPage !== page) return;
    list.innerHTML = '';
    if (!d.top.length) list.innerHTML = '<li class="board-msg">এখনো কেউ খেলেনি, প্রথম হওয়ার সুযোগ! 🥇</li>';
    for (const row of d.top) {
      const li = document.createElement('li');
      li.className = 'board-row' + (row.me ? ' me' : '') + (row.rank <= 3 ? ' top' + row.rank : '');
      boardCells(li, [row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : bn(row.rank), (row.me ? '👉 ' : '') + row.name, bn(row.kills), bn(row.score)]);
      list.appendChild(li);
    }
    if (d.me) boardCells(me, [bn(d.me.rank), '👉 ' + d.me.name, bn(d.me.kills), bn(d.me.score)]);
    else boardCells(me, ['–', '👉 আপনি এখনো খেলেননি', '–', '–']);
    me.classList.remove('hidden');
    renderPager(d.page, d.pages);
  } catch (e) {
    list.innerHTML = '<li class="board-msg">লিডারবোর্ড এখন লোড হচ্ছে না, একটু পরে চেষ্টা করুন 🙏</li>';
    me.classList.add('hidden');
  }
  pager.classList.remove('busy');
  list.classList.remove('loading');
}
// ‹ 1 … 4 5 6 … 20 ›
function renderPager(page, pages) {
  const nav = $('boardPager');
  nav.textContent = '';
  nav.classList.toggle('hidden', pages <= 1);
  if (pages <= 1) return;
  const btn = (label, target, cls = '') => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pg ' + cls; b.textContent = label;
    if (target == null || target === page) b.disabled = true;
    else b.addEventListener('click', () => { sound.click(); loadBoard(target); });
    if (target === page) b.setAttribute('aria-current', 'page');
    nav.appendChild(b);
  };
  btn('‹', page > 1 ? page - 1 : null, 'arrow');
  const nums = new Set([1, pages, page - 1, page, page + 1].filter(n => n >= 1 && n <= pages));
  let prev = 0;
  for (const n of [...nums].sort((a, b) => a - b)) {
    if (n - prev > 1) btn('…', null, 'gap');
    btn(bn(n), n, n === page ? 'on' : '');
    prev = n;
  }
  btn('›', page < pages ? page + 1 : null, 'arrow');
}
$('btnBoardStart').addEventListener('click', () => openBoard('scrStart'));
$('btnBoardOver').addEventListener('click', () => openBoard('scrOver'));
$('btnBoardBack').addEventListener('click', () => { sound.click(); show(boardFrom); });

// ------------------------------------------------------------------ challenge
// Share links land on /?c=<friend's score>; everyone else gets the default target.
const DEFAULT_CHALLENGE = 100;
const FRIEND_SCORE = Math.min(1e6, Math.max(0, parseInt(new URLSearchParams(location.search).get('c'), 10) || 0));
const CHALLENGE = FRIEND_SCORE || DEFAULT_CHALLENGE;
$('challengeLine').innerHTML = FRIEND_SCORE
  ? `🎯 বন্ধু পেয়েছে <b>${bn(CHALLENGE)}</b> পয়েন্ট, হারাইতে পারবা?`
  : `🎯 চ্যালেঞ্জ: <b>${bn(CHALLENGE)}</b> পয়েন্ট পার করতে পারবা?`;
$('challengeLine').classList.remove('hidden');

// ------------------------------------------------------------------ visit counter
// Counts one visit per browser session (refreshes don't inflate it); hides itself if the API is down.
(async function visitCounter() {
  const line = $('visitLine'), out = $('visitCount');
  const fmt = n => bn(Math.round(n).toLocaleString('en-IN'));
  let total = null;
  try {
    let counted = false;
    try { counted = sessionStorage.getItem('dsm_visit') === '1'; } catch (e) {}
    const res = await fetch(counted ? '/api/stats' : '/api/visit', { method: counted ? 'GET' : 'POST' });
    if (!res.ok) return;
    total = (await res.json()).total;
    try { sessionStorage.setItem('dsm_visit', '1'); } catch (e) {}
  } catch (e) { return; }
  if (typeof total !== 'number') return;
  line.classList.remove('hidden');
  const t0 = performance.now(), dur = 1200;
  const step = now => {
    const p = Math.min(1, (now - t0) / dur);
    out.textContent = fmt(total * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
})();
