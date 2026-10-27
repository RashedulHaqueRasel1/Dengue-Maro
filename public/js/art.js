// All canvas drawing: room background, sleeper, mosquitoes, hand, splats, items.
export const TAU = Math.PI * 2;
const SKIN = '#c98b57', SKIN_L = '#e2ad7c', SKIN_S = '#9c6235', SKIN_D = '#5c3a1a';
const FONT_UI = '"Mina", "Noto Sans Bengali", sans-serif';
const FONT_BN = '"Noto Sans Bengali", "Mina", sans-serif';
const FONT_FUN = '"Atma", "Noto Sans Bengali", sans-serif';
const INK = '#1d1a16';

export function rr(g, x, y, w, h, r) {
  w = Math.max(0, w); h = Math.max(0, h);
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function seeded(seed) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

// ---------------------------------------------------------------- background
let noiseCanvas = null;
function noise() {
  if (noiseCanvas) return noiseCanvas;
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const p = c.getContext('2d');
  const d = p.createImageData(160, 160);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 110 + Math.random() * 120;
    d.data[i] = v; d.data[i + 1] = v * 0.95; d.data[i + 2] = v * 0.85; d.data[i + 3] = 26;
  }
  p.putImageData(d, 0, 0);
  return (noiseCanvas = c);
}

export function renderBackground(L, dpr) {
  const { W, H, u } = L;
  const c = document.createElement('canvas');
  c.width = Math.round(W * dpr);
  c.height = Math.round(H * dpr);
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const rnd = seeded(42);
  const fy = L.floorY;

  // plaster wall, warm afternoon tone
  let gr = g.createLinearGradient(0, 0, 0, fy);
  gr.addColorStop(0, '#e9d2a0');
  gr.addColorStop(0.6, '#e6c88c');
  gr.addColorStop(1, '#d8b376');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, fy);
  g.fillStyle = g.createPattern(noise(), 'repeat');
  g.fillRect(0, 0, W, fy);
  // damp patches (soft, like real seepage)
  for (const [x, y, r, a] of [[W * 0.05, fy * 0.95, W * 0.25, 0.22], [W * 0.95, fy * 0.9, W * 0.2, 0.18], [W * 0.75, 0, W * 0.22, 0.12], [W * 0.4, fy, W * 0.15, 0.1]]) {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(120,90,40,${a})`);
    rg.addColorStop(0.7, `rgba(120,90,40,${a * 0.35})`);
    rg.addColorStop(1, 'rgba(120,90,40,0)');
    g.fillStyle = rg;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // hairline crack
  g.strokeStyle = 'rgba(90,60,20,.3)';
  g.lineWidth = 1.2 * u;
  g.beginPath();
  let cx = W * 0.6, cy = fy * 0.35;
  g.moveTo(cx, cy);
  for (let i = 0; i < 8; i++) { cx += (rnd() - 0.35) * 12 * u; cy += 9 * u; g.lineTo(cx, cy); }
  g.stroke();

  // sunlight on the wall from the window
  const wc = { x: L.win.x + L.win.w / 2, y: L.win.y + L.win.h / 2 };
  gr = g.createRadialGradient(wc.x, wc.y, L.win.w * 0.3, wc.x + W * 0.1, wc.y, Math.max(W, H) * 0.75);
  gr.addColorStop(0, 'rgba(255,240,200,.55)');
  gr.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, fy);

  // floor: old mosaic tiles
  gr = g.createLinearGradient(0, fy, 0, H);
  gr.addColorStop(0, '#9b5a33');
  gr.addColorStop(1, '#6d3b1f');
  g.fillStyle = gr;
  g.fillRect(0, fy, W, H - fy);
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    const y0 = fy + (H - fy) * Math.pow(r / rows, 1.4), y1 = fy + (H - fy) * Math.pow((r + 1) / rows, 1.4);
    const n = 9, spread = 1 + r * 0.15;
    for (let k = -2; k < n + 2; k++) {
      const xa = W / 2 + (k / n - 0.5) * W * spread, xb = W / 2 + ((k + 1) / n - 0.5) * W * spread;
      const xa2 = W / 2 + (k / n - 0.5) * W * (spread + 0.15), xb2 = W / 2 + ((k + 1) / n - 0.5) * W * (spread + 0.15);
      g.fillStyle = (r + k) % 2 ? 'rgba(255,230,200,.06)' : 'rgba(0,0,0,.08)';
      g.beginPath(); g.moveTo(xa, y0); g.lineTo(xb, y0); g.lineTo(xb2, y1); g.lineTo(xa2, y1); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(40,20,5,.25)';
      g.lineWidth = 1;
      g.stroke();
    }
  }
  g.fillStyle = g.createPattern(noise(), 'repeat');
  g.fillRect(0, fy, W, H - fy);
  // skirting
  g.fillStyle = '#5c3218';
  g.fillRect(0, fy - 6 * u, W, 7 * u);
  g.fillStyle = 'rgba(255,255,255,.15)';
  g.fillRect(0, fy - 6 * u, W, 1.5 * u);

  // sun beam falling to the floor
  const b = L.beam;
  gr = g.createLinearGradient(b[0][0], b[0][1], b[3][0], b[3][1]);
  gr.addColorStop(0, 'rgba(255,245,210,.32)');
  gr.addColorStop(1, 'rgba(255,245,210,0)');
  g.fillStyle = gr;
  g.beginPath(); b.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();

  drawWindow(g, L, rnd);
  drawCalendar(g, L);
  drawClock(g, L);
  drawSwitch(g, L);
  drawWallFrames(g, L);

  // slippers
  const sx = L.man.x + L.man.w * 0.6, sy = fy + (H - fy) * 0.75;
  for (const [dx, rot] of [[0, -0.25], [24 * u, 0.12]]) {
    g.save(); g.translate(sx + dx, sy); g.rotate(rot); g.scale(1, 0.55);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(3 * u, 4 * u, 10 * u, 21 * u, 0, 0, TAU); g.fill();
    g.fillStyle = '#1d5fb8'; g.beginPath(); g.ellipse(0, 0, 9 * u, 20 * u, 0, 0, TAU); g.fill();
    g.strokeStyle = '#eee'; g.lineWidth = 3 * u;
    g.beginPath(); g.moveTo(-7 * u, -6 * u); g.lineTo(0, -13 * u); g.lineTo(7 * u, -6 * u); g.stroke();
    g.restore();
  }
  // contact shadow under the bed
  const M = L.man;
  gr = g.createRadialGradient(M.x + M.w / 2, M.y + M.h * 0.98, 0, M.x + M.w / 2, M.y + M.h * 0.98, M.w * 0.55);
  gr.addColorStop(0, 'rgba(30,12,0,.5)');
  gr.addColorStop(1, 'rgba(30,12,0,0)');
  g.save(); g.translate(0, M.y + M.h * 0.98); g.scale(1, 0.12); g.translate(0, -(M.y + M.h * 0.98));
  g.fillStyle = gr; g.fillRect(M.x - M.w * 0.1, M.y, M.w * 1.2, M.h * 2);
  g.restore();

  // vignette
  gr = g.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.8);
  gr.addColorStop(0, 'rgba(40,20,0,0)');
  gr.addColorStop(1, 'rgba(40,20,0,.45)');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  return c;
}

function drawWindow(g, L, rnd) {
  const { x, y, w, h } = L.win, u = L.u;
  const f = 9 * u;
  // recess shadow + wooden frame
  g.fillStyle = 'rgba(60,30,0,.35)';
  g.fillRect(x - f + 5 * u, y - f + 6 * u, w + f * 2, h + f * 2);
  let gr = g.createLinearGradient(x - f, 0, x + w + f, 0);
  gr.addColorStop(0, '#5a3418'); gr.addColorStop(0.5, '#7a4a24'); gr.addColorStop(1, '#4d2c14');
  g.fillStyle = gr;
  g.fillRect(x - f, y - f, w + f * 2, h + f * 2);
  // afternoon sky
  gr = g.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, '#5aa9e6'); gr.addColorStop(0.7, '#a9d6f5'); gr.addColorStop(1, '#f4e3c1');
  g.fillStyle = gr;
  g.fillRect(x, y, w, h);
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  // clouds
  g.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < 3; i++) {
    const cx = x + rnd() * w, cy = y + h * (0.1 + rnd() * 0.25), s = w * (0.08 + rnd() * 0.06);
    for (const [dx, dy, r] of [[0, 0, 1], [0.9, 0.1, 0.8], [-0.9, 0.15, 0.7], [0.4, -0.4, 0.75]]) {
      g.beginPath(); g.arc(cx + dx * s, cy + dy * s, r * s, 0, TAU); g.fill();
    }
  }
  // far buildings (hazy) then near buildings with water tanks
  for (const [layer, col, hmin, hmax] of [[0, '#b9c6cf', 0.35, 0.6], [1, null, 0.2, 0.5]]) {
    let bx = x - 6 * u;
    while (bx < x + w) {
      const bw = (16 + rnd() * 24) * u, bh = h * (hmin + rnd() * (hmax - hmin));
      const top = y + h - bh;
      g.fillStyle = col || ['#e8b4a0', '#d9d4c7', '#f2d49b', '#c9b8a6', '#b8c9b0'][Math.floor(rnd() * 5)];
      g.fillRect(bx, top, bw, bh);
      if (layer === 1) {
        g.fillStyle = 'rgba(0,0,0,.12)';
        g.fillRect(bx + bw * 0.8, top, bw * 0.2, bh);
        g.fillStyle = 'rgba(60,70,90,.55)';
        for (let wy = top + 5 * u; wy < y + h - 4 * u; wy += 8 * u)
          for (let wx = bx + 3 * u; wx < bx + bw - 5 * u; wx += 7 * u) g.fillRect(wx, wy, 3.5 * u, 4 * u);
        if (rnd() < 0.6) { g.fillStyle = '#2b2b2b'; g.fillRect(bx + bw * 0.2, top - 6 * u, 8 * u, 6 * u); }
      }
      bx += bw + (layer ? 2 : 4) * u;
    }
  }
  g.restore();
  // inner shadow on glass edge
  g.strokeStyle = 'rgba(0,0,0,.25)';
  g.lineWidth = 4 * u;
  g.strokeRect(x + 2 * u, y + 2 * u, w - 4 * u, h - 4 * u);
  // green grill with highlight
  const bar = (x1, y1, x2, y2) => {
    g.strokeStyle = '#1f4f3a'; g.lineWidth = 3.4 * u; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = 'rgba(160,230,190,.45)'; g.lineWidth = 1 * u; g.beginPath(); g.moveTo(x1 - u, y1 - u); g.lineTo(x2 - u, y2 - u); g.stroke();
  };
  for (let i = 1; i < 6; i++) bar(x + (w * i) / 6, y, x + (w * i) / 6, y + h);
  for (const fy of [0.33, 0.66]) bar(x, y + h * fy, x + w, y + h * fy);
  // curtains
  for (const side of [-1, 1]) {
    const cw = w * 0.22, cx0 = side < 0 ? x - f - cw * 0.35 : x + w + f - cw * 0.65;
    gr = g.createLinearGradient(cx0, 0, cx0 + cw, 0);
    for (let k = 0; k <= 6; k++) gr.addColorStop(k / 6, k % 2 ? '#8e1b3a' : '#b8355a');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(cx0, y - f * 1.8);
    g.lineTo(cx0 + cw, y - f * 1.8);
    g.quadraticCurveTo(cx0 + cw * (side < 0 ? 0.6 : 0.95), y + h * 0.6, cx0 + cw * (side < 0 ? 0.9 : 1.05), y + h + f * 2);
    g.lineTo(cx0 - cw * (side < 0 ? 0.05 : -0.1), y + h + f * 2);
    g.closePath();
    g.fill();
  }
  g.fillStyle = '#3a2412';
  g.fillRect(x - f * 2.6, y - f * 2, w + f * 5.2, 4 * u);
  // sill
  gr = g.createLinearGradient(0, y + h + f * 0.6, 0, y + h + f * 0.6 + 8 * u);
  gr.addColorStop(0, '#a77a52'); gr.addColorStop(1, '#6e4a2c');
  g.fillStyle = gr;
  g.fillRect(x - f * 1.6, y + h + f * 0.6, w + f * 3.2, 8 * u);
  // terracotta pot
  const { x: px, y: py, w: pw } = L.pot;
  gr = g.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0);
  gr.addColorStop(0, '#8c2f07'); gr.addColorStop(0.4, '#d0561c'); gr.addColorStop(1, '#7a2905');
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(px - pw / 2, py - pw * 0.7); g.lineTo(px + pw / 2, py - pw * 0.7);
  g.lineTo(px + pw * 0.36, py); g.lineTo(px - pw * 0.36, py); g.closePath(); g.fill();
  g.fillStyle = '#9c3408';
  g.fillRect(px - pw * 0.55, py - pw * 0.8, pw * 1.1, pw * 0.15);
  for (let i = -3; i <= 3; i++) {
    g.fillStyle = i % 2 ? '#2b8a3e' : '#40c057';
    g.beginPath(); g.ellipse(px + i * pw * 0.12, py - pw * 1.0, pw * 0.08, pw * 0.32, i * 0.3, 0, TAU); g.fill();
  }
  g.fillStyle = '#f72585';
  g.beginPath(); g.arc(px + pw * 0.05, py - pw * 1.3, pw * 0.09, 0, TAU); g.fill();
  g.fillStyle = '#ffd23f';
  g.beginPath(); g.arc(px + pw * 0.05, py - pw * 1.3, pw * 0.035, 0, TAU); g.fill();
}

export function drawPot(g, L, clean, time) {
  const { x: px, y: py, w: pw } = L.pot, u = L.u;
  g.fillStyle = '#7f4f24';
  g.beginPath(); g.ellipse(px, py + 1 * u, pw * 0.78, 5 * u, 0, 0, TAU); g.fill();
  if (!clean) {
    g.fillStyle = '#4cc9f0';
    g.beginPath(); g.ellipse(px, py, pw * 0.72, 3.6 * u, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.7)';
    g.fillRect(px - pw * 0.5 + ((time * 20) % (pw * 0.9)), py - 1 * u, 6 * u, 1.2 * u);
    g.strokeStyle = '#222';
    g.lineWidth = 1.2 * u;
    for (let i = 0; i < 3; i++) {
      const lx = px - pw * 0.4 + i * pw * 0.38, w = Math.sin(time * 9 + i * 2) * 2 * u;
      g.beginPath(); g.moveTo(lx, py - 1 * u); g.quadraticCurveTo(lx + 2 * u + w, py, lx + 4 * u, py + 1.5 * u); g.stroke();
    }
  }
  const text = clean ? 'পরিষ্কার ✅' : 'জমা পানি ⚠️ ট্যাপ!';
  g.font = `700 ${Math.round(10 * u)}px ${FONT_BN}`;
  const tw = g.measureText(text).width + 8 * u;
  const tx = px + pw * 0.55, ty = py - pw * 0.55;
  const sc = clean ? 1 : 1 + Math.max(0, Math.sin(time * 5)) * 0.08;
  g.save();
  g.translate(tx, ty);
  g.scale(sc, sc);
  g.fillStyle = '#fff';
  g.strokeStyle = clean ? '#2a9d8f' : '#c1121f';
  g.lineWidth = 1.5 * u;
  rr(g, 0, 0, tw, 15 * u, 3 * u); g.fill(); g.stroke();
  g.fillStyle = clean ? '#2a9d8f' : '#c1121f';
  g.textBaseline = 'middle';
  g.fillText(text, 4 * u, 8 * u);
  g.restore();
}

function drawCalendar(g, L) {
  const { x, y, w, h } = L.cal, u = L.u;
  g.fillStyle = 'rgba(40,20,0,.25)';
  g.beginPath(); g.moveTo(x + 6 * u, y + 6 * u); g.lineTo(x + w + 6 * u, y + 4 * u); g.lineTo(x + w + 3 * u, y + h + 8 * u); g.lineTo(x + 4 * u, y + h + 6 * u); g.fill();
  g.fillStyle = '#fbfaf5';
  g.fillRect(x, y, w, h);
  // photo on the calendar: green paddy field
  let gr = g.createLinearGradient(0, y, 0, y + h * 0.42);
  gr.addColorStop(0, '#9fd3f5'); gr.addColorStop(0.55, '#e8f4d0'); gr.addColorStop(0.56, '#6bbf59'); gr.addColorStop(1, '#2f8f3a');
  g.fillStyle = gr;
  g.fillRect(x + w * 0.06, y + w * 0.06, w * 0.88, h * 0.4);
  g.fillStyle = '#c1121f';
  g.fillRect(x, y + h * 0.47, w, h * 0.13);
  g.fillStyle = '#333';
  g.beginPath(); g.arc(x + w / 2, y - 3 * u, 3 * u, 0, TAU); g.fill();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#fff';
  g.font = `700 ${Math.round(h * 0.085)}px ${FONT_BN}`;
  g.fillText('ডেঙ্গু সতর্কতা', x + w / 2, y + h * 0.535);
  g.fillStyle = '#999';
  for (let r = 0; r < 3; r++)
    for (let k = 0; k < 7; k++) {
      g.fillStyle = r === 1 && k === 3 ? '#c1121f' : '#bbb';
      g.fillRect(x + w * 0.08 + k * w * 0.12, y + h * 0.66 + r * h * 0.1, w * 0.08, h * 0.06);
    }
  g.fillStyle = '#1d70d6';
  g.font = `700 ${Math.round(h * 0.075)}px ${FONT_BN}`;
  g.fillText('👆 টিপস', x + w / 2, y + h * 1.09);
  g.textAlign = 'left';
}

function drawClock(g, L) {
  const { x, y, r } = L.clock, u = L.u;
  g.fillStyle = 'rgba(40,20,0,.25)';
  g.beginPath(); g.arc(x + 4 * u, y + 5 * u, r, 0, TAU); g.fill();
  g.fillStyle = '#7a4a24';
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.fillStyle = '#fffdf6';
  g.beginPath(); g.arc(x, y, r * 0.84, 0, TAU); g.fill();
  g.fillStyle = '#333';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    g.beginPath(); g.arc(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, (i % 3 ? 0.8 : 1.6) * u, 0, TAU); g.fill();
  }
  const hand = (a, len, wd) => {
    g.strokeStyle = '#222'; g.lineWidth = wd; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a - Math.PI / 2) * len, y + Math.sin(a - Math.PI / 2) * len); g.stroke();
  };
  hand((2.25 / 12) * TAU, r * 0.42, 3 * u);
  hand((15 / 60) * TAU, r * 0.62, 2 * u);
  g.fillStyle = '#333';
  g.font = `700 ${Math.round(r * 0.28)}px ${FONT_BN}`;
  g.textAlign = 'center';
  g.fillText('দুপুর', x, y + r * 0.42);
  g.textAlign = 'left';
}

// ---------------------------------------------------------------- meme frames on the wall
// Pictures come from main.js (img/wall/wall.json, or the uncle's photos as a fallback).
let wallPics = [];
export function setWallPics(list) { wallPics = list.filter(p => p.img && p.img.complete && p.img.naturalWidth); }

// Find up to two free spots on the wall that don't cover the window, calendar, clock,
// fan, bed or the HUD, so the frames fit any screen shape.
function frameSpots(L) {
  // full size first; on cramped screens retry with smaller frames
  for (const k of [1, 0.75, 0.55]) {
    const spots = frameSpotsAt(L, Math.max(70, Math.min(L.W * 0.3, 190) * k));
    if (spots.length) return spots;
  }
  return [];
}
function frameSpotsAt(L, fw) {
  const { W, u } = L, f = 9 * u;
  const fh = fw * 0.82;
  const pad = 12 * u;
  const blocks = [
    { x: L.win.x - f * 2.6, y: 0, w: L.win.w + f * 5.2, h: L.win.y + L.win.h + f * 3 + L.pot.w * 1.4 },
    { x: L.cal.x - pad, y: L.cal.y - 10 * u, w: L.cal.w + pad * 2, h: L.cal.h * 1.15 + 70 * u },
    { x: L.clock.x - L.clock.r - pad, y: L.clock.y - L.clock.r - pad, w: L.clock.r * 2 + pad * 2, h: L.clock.r * 2 + pad * 2 },
    { x: L.fan.x - L.fan.r, y: 0, w: L.fan.r * 2, h: L.fan.y + L.fan.r * 0.3 },
    { x: L.man.x, y: L.man.y + L.man.h * 0.08, w: L.man.w, h: L.man.h },
    { x: 0, y: 0, w: W, h: 118 },
  ];
  const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const top = 118, bottom = Math.min(L.floorY, L.man.y + L.man.h * 0.08) - fh - 10 * u;
  const spots = [];
  // try the middle of the free wall band first, then work outwards
  for (const fy of [0.5, 0.35, 0.65, 0.2, 0.8, 0.05, 0.95]) {
    if (spots.length === 2) break;
    const y = top + (bottom - top) * fy;
    for (let col = 0; col <= 8; col++) {
      const x = W * 0.04 + ((W * 0.92 - fw) * col) / 8;
      const r = { x: x - pad, y: y - pad, w: fw + pad * 2, h: fh + pad * 2 };
      if (y < top || y > bottom || blocks.some(b => hit(r, b)) || spots.some(s => hit(r, s))) continue;
      spots.push({ x, y, w: fw, h: fh });
      if (spots.length === 2) break;
    }
  }
  return spots;
}

function drawWallFrames(g, L) {
  if (!wallPics.length) return;
  const u = L.u;
  frameSpots(L).forEach((s, i) => {
    const p = wallPics[i % wallPics.length], rot = i % 2 ? 0.05 : -0.04;
    const cx = s.x + s.w / 2;
    // nail + string
    g.strokeStyle = 'rgba(60,35,10,.7)'; g.lineWidth = 1.4 * u;
    g.beginPath(); g.moveTo(cx - s.w * 0.3, s.y + 4 * u); g.lineTo(cx, s.y - 22 * u); g.lineTo(cx + s.w * 0.3, s.y + 4 * u); g.stroke();
    g.fillStyle = '#4a4a4a'; g.beginPath(); g.arc(cx, s.y - 22 * u, 2.6 * u, 0, TAU); g.fill();
    g.save();
    g.translate(cx, s.y + s.h / 2); g.rotate(rot); g.translate(-s.w / 2, -s.h / 2);
    g.fillStyle = 'rgba(40,20,0,.32)'; g.fillRect(5 * u, 7 * u, s.w, s.h);
    const gr = g.createLinearGradient(0, 0, s.w, s.h);
    gr.addColorStop(0, '#8a5a2b'); gr.addColorStop(0.5, '#b07a3e'); gr.addColorStop(1, '#6b4220');
    g.fillStyle = gr; g.fillRect(0, 0, s.w, s.h);
    const m = 7 * u, iw = s.w - m * 2, ih = s.h - m * 2;
    g.fillStyle = '#111'; g.fillRect(m, m, iw, ih);
    g.save(); g.beginPath(); g.rect(m, m, iw, ih); g.clip();
    const sc = Math.max(iw / p.img.naturalWidth, ih / p.img.naturalHeight);
    g.drawImage(p.img, m + (iw - p.img.naturalWidth * sc) / 2, m + (ih - p.img.naturalHeight * sc) * (p.focusY ?? 0.35),
      p.img.naturalWidth * sc, p.img.naturalHeight * sc);
    if (p.caption) {
      const fs = Math.max(11, Math.round(ih * 0.15));
      g.font = `700 ${fs}px ${FONT_FUN}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
      let size = fs;
      while (size > 9 && g.measureText(p.caption).width > iw * 0.94) { size--; g.font = `700 ${size}px ${FONT_FUN}`; }
      g.lineWidth = size * 0.28; g.strokeStyle = '#000'; g.strokeText(p.caption, m + iw / 2, m + ih - size * 0.45);
      g.fillStyle = '#fff'; g.fillText(p.caption, m + iw / 2, m + ih - size * 0.45);
    }
    g.restore();
    // glass glare
    g.fillStyle = 'rgba(255,255,255,.08)';
    g.beginPath(); g.moveTo(m, m); g.lineTo(m + iw * 0.45, m); g.lineTo(m, m + ih * 0.6); g.closePath(); g.fill();
    g.restore();
  });
  g.textAlign = 'left';
}

function drawSwitch(g, L) {
  const u = L.u, x = L.cal.x + L.cal.w * 0.25, y = L.cal.y + L.cal.h + 34 * u;
  if (y + 24 * u > L.man.y) return;
  g.fillStyle = 'rgba(40,20,0,.2)';
  g.fillRect(x + 2 * u, y + 3 * u, 36 * u, 24 * u);
  g.fillStyle = '#f4f1ea';
  g.strokeStyle = '#a8a29a';
  g.lineWidth = 1.5 * u;
  rr(g, x, y, 34 * u, 22 * u, 3 * u); g.fill(); g.stroke();
  g.fillStyle = '#495057';
  for (let i = 0; i < 3; i++) g.fillRect(x + 5 * u + i * 9 * u, y + 6 * u, 5 * u, 10 * u);
}

export function drawDust(g, L, time) {
  const b = L.beam;
  g.fillStyle = 'rgba(255,250,225,.6)';
  for (let i = 0; i < 26; i++) {
    const p = ((time * 0.03 + i * 0.137) % 1), q = (i * 0.618) % 1;
    const top = [b[0][0] + (b[1][0] - b[0][0]) * q, b[0][1]];
    const bot = [b[3][0] + (b[2][0] - b[3][0]) * q, b[3][1]];
    const x = top[0] + (bot[0] - top[0]) * p + Math.sin(time + i) * 6 * L.u;
    const y = top[1] + (bot[1] - top[1]) * p;
    g.globalAlpha = Math.sin(p * Math.PI) * 0.8;
    g.beginPath(); g.arc(x, y, (0.8 + (i % 3) * 0.5) * L.u, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
}

// ---------------------------------------------------------------- fan
export function drawFan(g, L, angle) {
  const { x, y, r } = L.fan, u = L.u;
  g.strokeStyle = '#444';
  g.lineWidth = 4 * u;
  g.beginPath(); g.moveTo(x, 0); g.lineTo(x, y); g.stroke();
  for (let k = 2; k >= 0; k--) {
    g.fillStyle = k === 0 ? '#58626a' : `rgba(88,98,106,${0.18 / k})`;
    for (let i = 0; i < 3; i++) {
      const a = angle - k * 0.22 + (i * TAU) / 3;
      g.save(); g.translate(x, y); g.scale(1, 0.2); g.rotate(a);
      g.beginPath(); g.ellipse(r * 0.55, 0, r * 0.47, r * 0.1, 0, 0, TAU); g.fill();
      g.restore();
    }
  }
  g.fillStyle = '#3a4248';
  g.beginPath(); g.ellipse(x, y, 13 * u, 7 * u, 0, 0, TAU); g.fill();
}

// ---------------------------------------------------------------- sleeper (real photo + effects)
export function drawMan(g, L, S, time, shield, IMG) {
  const M = L.man, u = L.u, hd = L.head, r = hd.r;
  const sleeping = S.mood === 'sleep', calm = sleeping && !S.worry;
  const img = (S.mood === 'fever' && IMG.fever) || (S.mood === 'ouch' && IMG.ouch) || (S.mood === 'slapped' && IMG.slapped) || IMG.sleep;
  let dx = 0, dy = 0;
  if (S.mood === 'ouch' || S.mood === 'slapped') dx = Math.sin(time * 50) * 3 * u * Math.min(1, S.moodT * 2);
  if (S.kickT > 0) { dx += Math.sin(time * 35) * 2 * u; dy = Math.abs(Math.sin(time * 18)) * -2 * u; }
  const br = sleeping ? Math.sin(time * 1.6) : 0;

  if (img && img.complete && img.naturalWidth) {
    g.save();
    g.translate(M.x + dx, M.y + M.h + dy);
    g.scale(1, 1 + br * 0.006);
    g.drawImage(img, 0, -M.h, M.w, M.h);
    g.restore();
  }
  if (shield) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(M.x + M.w * 0.45, M.y + M.h * 0.4, 0, M.x + M.w * 0.45, M.y + M.h * 0.4, M.w * 0.55);
    gr.addColorStop(0, `rgba(60,200,120,${0.18 + Math.sin(time * 5) * 0.06})`);
    gr.addColorStop(1, 'rgba(60,200,120,0)');
    g.fillStyle = gr;
    g.fillRect(M.x - 20, M.y - 40, M.w + 40, M.h + 40);
    g.restore();
  }
  // fever flush pulse
  if (S.mood === 'fever') {
    g.save();
    g.globalCompositeOperation = 'multiply';
    const gr = g.createRadialGradient(hd.x, hd.y, 0, hd.x, hd.y, r * 1.4);
    gr.addColorStop(0, `rgba(255,120,120,${0.5 + Math.sin(time * 4) * 0.15})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(hd.x - r * 1.5, hd.y - r * 1.5, r * 3, r * 3);
    g.restore();
  }

  const N = L.nose;
  if (calm) {
    // snore bubble from the nose
    const b = r * (0.06 + Math.max(0, br) * 0.22);
    const bx = N.x + b * 0.9, by = N.y - b * 0.4;
    g.fillStyle = 'rgba(190,230,255,.45)';
    g.strokeStyle = 'rgba(120,180,230,.8)';
    g.lineWidth = 1.2 * u;
    g.beginPath(); g.arc(bx, by, b, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.9)';
    g.beginPath(); g.arc(bx - b * 0.35, by - b * 0.35, b * 0.22, 0, TAU); g.fill();
    drawZzz(g, N.x + r * 0.3, N.y - r * 0.6, time, u);
  }
  if (S.worry && sleeping) sweat(g, hd.x - r * 0.1, hd.y - r * 0.55, time, u);
  if (S.mood === 'ouch') {
    label(g, 'চুলকায়!', hd.x + r * 0.4, hd.y - r * 1.5, 15 * u, '#fff');
    const T = L.targets[S.scratchTgt];
    if (S.scratchT > 0) scratchFx(g, T.x, T.y, time, u);
  }
  if (S.kickT > 0) {
    const F = L.targets[2];
    g.strokeStyle = 'rgba(255,255,255,.9)';
    g.lineWidth = 2.5 * u;
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.arc(F.x + r * 0.6, F.y, r * (0.4 + i * 0.25), -0.7, 0.7); g.stroke();
    }
    label(g, 'লাথি!', F.x, F.y - r * 1.2, 14 * u, '#fff');
  }
  if (S.handprintT > 0 && !IMG.slapped) {
    g.save();
    g.globalAlpha = Math.min(1, S.handprintT) * 0.5;
    g.globalCompositeOperation = 'multiply';
    const C = L.targets[0];
    g.translate(C.x, C.y);
    g.rotate(-0.4);
    g.scale(r / 170, r / 170);
    g.fillStyle = '#e01e37';
    handShape(g, () => g.fill());
    g.restore();
  }
  if (S.mood === 'slapped') {
    for (let i = 0; i < 3; i++) {
      const a = time * 4 + (i * TAU) / 3;
      star(g, hd.x + Math.cos(a) * r * 1.2, hd.y - r * 0.9 + Math.sin(a) * r * 0.3, 7 * u);
    }
  }
  if (S.mood === 'fever') {
    label(g, 'ডেঙ্গু জ্বর! 🤒', hd.x + r * 0.4, hd.y - r * 1.6, 16 * u, '#ffd23f');
    sweat(g, hd.x + r * 0.2, hd.y - r * 0.6, time, u);
  }
  if (S.talkT > 0 && calm) thought(g, N.x + r * 0.5, hd.y - r * 0.9, S.talk, u, Math.min(1, S.talkT * 3));

  for (const b of S.bites) {
    const T = L.targets[b.t];
    g.fillStyle = 'rgba(220,40,50,.75)';
    g.beginPath(); g.arc(T.x + b.dx, T.y + b.dy, 3.6 * u, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,200,200,.7)';
    g.beginPath(); g.arc(T.x + b.dx - u, T.y + b.dy - u, 1.2 * u, 0, TAU); g.fill();
  }
}

function sweat(g, x, y, time, u) {
  const p = (time * 0.8) % 1;
  g.fillStyle = 'rgba(120,200,255,.9)';
  g.strokeStyle = 'rgba(40,110,180,.9)';
  g.lineWidth = 1.2 * u;
  g.beginPath();
  const yy = y + p * 10 * u;
  g.moveTo(x, yy - 7 * u);
  g.quadraticCurveTo(x + 5 * u, yy, x, yy + 3 * u);
  g.quadraticCurveTo(x - 5 * u, yy, x, yy - 7 * u);
  g.fill(); g.stroke();
}

function scratchFx(g, x, y, time, u) {
  g.strokeStyle = 'rgba(255,255,255,.95)';
  g.lineWidth = 2.5 * u;
  g.lineCap = 'round';
  const o = Math.sin(time * 40) * 4 * u;
  for (let i = -1; i <= 1; i++) {
    g.beginPath(); g.moveTo(x - 8 * u + o, y + i * 6 * u - 4 * u); g.lineTo(x + 8 * u + o, y + i * 6 * u + 4 * u); g.stroke();
  }
}

function thought(g, x, y, text, u, a) {
  g.save();
  g.globalAlpha = a;
  g.font = `600 ${Math.round(13 * u)}px ${FONT_FUN}`;
  const tw = g.measureText(text).width, pw = tw + 20 * u, ph = 26 * u;
  const bx = Math.min(x, L_W - pw - 6), by = y - ph - 18 * u;
  g.fillStyle = '#fff';
  g.strokeStyle = INK;
  g.lineWidth = 2 * u;
  for (const [cx, cy, cr] of [[x - 8 * u, y + 2 * u, 3 * u], [x - 2 * u, y - 8 * u, 5 * u]]) {
    g.beginPath(); g.arc(cx, cy, cr, 0, TAU); g.fill(); g.stroke();
  }
  rr(g, bx, by, pw, ph, 13 * u); g.fill(); g.stroke();
  g.fillStyle = INK;
  g.textBaseline = 'middle';
  g.fillText(text, bx + 10 * u, by + ph / 2 + 1);
  g.restore();
}
let L_W = 9999;
export function setWidth(w) { L_W = w; }

function drawZzz(g, x, y, time, u) {
  g.font = `700 ${Math.round(17 * u)}px ${FONT_FUN}`;
  g.textAlign = 'center';
  for (let i = 0; i < 3; i++) {
    const p = (time * 0.5 + i / 3) % 1;
    g.globalAlpha = Math.sin(p * Math.PI);
    g.fillStyle = '#fff';
    g.strokeStyle = INK;
    g.lineWidth = 3 * u;
    const s = 0.7 + p * 0.6;
    g.save();
    g.translate(x + p * 22 * u + Math.sin(p * 8) * 4 * u, y - p * 30 * u);
    g.scale(s, s);
    g.strokeText('z', 0, 0);
    g.fillText('z', 0, 0);
    g.restore();
  }
  g.globalAlpha = 1;
  g.textAlign = 'left';
}

function spiral(g, x, y, r, t) {
  g.beginPath();
  for (let a = 0; a < TAU * 2; a += 0.3) {
    const d = (a / (TAU * 2)) * r;
    g.lineTo(x + Math.cos(a + t * 8) * d, y + Math.sin(a + t * 8) * d);
  }
  g.stroke();
}

function star(g, x, y, r) {
  g.fillStyle = '#ffd23f';
  g.strokeStyle = INK;
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2, d = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  g.closePath();
  g.fill(); g.stroke();
}

export function label(g, text, x, y, size, color = '#fff', align = 'center') {
  g.font = `700 ${Math.round(size)}px ${FONT_FUN}`;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = Math.max(3, size * 0.22);
  g.strokeStyle = INK;
  g.strokeText(text, x, y);
  g.fillStyle = color;
  g.fillText(text, x, y);
  g.textAlign = 'left';
}

export function speech(g, x, y, text, u, a = 1) {
  g.save();
  g.globalAlpha = a;
  g.font = `700 ${Math.round(12 * u)}px ${FONT_FUN}`;
  const tw = g.measureText(text).width, pw = tw + 14 * u, ph = 20 * u;
  const bx = Math.max(4, Math.min(L_W - pw - 4, x - pw / 2)), by = y - ph - 8 * u;
  g.fillStyle = '#fff';
  g.strokeStyle = INK;
  g.lineWidth = 2 * u;
  rr(g, bx, by, pw, ph, 8 * u);
  g.fill(); g.stroke();
  g.beginPath();
  g.moveTo(x - 5 * u, by + ph - 1); g.lineTo(x, by + ph + 7 * u); g.lineTo(x + 5 * u, by + ph - 1);
  g.fill();
  g.beginPath();
  g.moveTo(x - 5 * u, by + ph); g.lineTo(x, by + ph + 7 * u); g.lineTo(x + 5 * u, by + ph);
  g.stroke();
  g.fillStyle = INK;
  g.textBaseline = 'middle';
  g.fillText(text, bx + 7 * u, by + ph / 2 + 1);
  g.restore();
}

// ---------------------------------------------------------------- mosquito
function wing(g, s, flap, back) {
  g.save();
  g.translate(-0.05 * s, -0.2 * s);
  g.rotate(Math.PI + flap);
  g.beginPath();
  g.ellipse(0.62 * s, 0, 0.68 * s, 0.18 * s, 0, 0, TAU);
  g.fillStyle = back ? 'rgba(190,210,240,.45)' : 'rgba(225,240,255,.55)';
  g.fill();
  g.strokeStyle = 'rgba(80,100,140,.7)';
  g.lineWidth = Math.max(0.8, 0.03 * s);
  g.stroke();
  g.strokeStyle = 'rgba(80,100,140,.35)';
  g.beginPath(); g.moveTo(0.05 * s, 0); g.lineTo(1.2 * s, 0); g.moveTo(0.3 * s, 0.05 * s); g.lineTo(1.0 * s, 0.12 * s); g.stroke();
  g.restore();
}

export function drawMosquito(g, m, time, u) {
  const s = m.size;
  const happy = m.state === 'bite' || m.state === 'leave';

  // soft shadow on the wall gives depth
  g.fillStyle = 'rgba(70,35,0,.13)';
  g.beginPath(); g.ellipse(m.x + s * 0.5, m.y + s * 1.7, s * 1.1, s * 0.28, 0, 0, TAU); g.fill();

  if (m.type === 'fast' && m.state !== 'bite') {
    const sp = Math.hypot(m.vx, m.vy);
    if (sp > 40) {
      const nx = -m.vx / sp, ny = -m.vy / sp;
      g.strokeStyle = 'rgba(255,255,255,.85)';
      g.lineWidth = 2;
      g.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        const ox = -ny * i * s * 0.45, oy = nx * i * s * 0.45, l = 2.4 + Math.abs(i) * -0.6;
        g.beginPath(); g.moveTo(m.x + nx * s * 1.5 + ox, m.y + ny * s * 1.5 + oy); g.lineTo(m.x + nx * s * l * 1.2 + ox, m.y + ny * s * l * 1.2 + oy); g.stroke();
      }
    }
  }

  g.save();
  g.translate(m.x, m.y);
  const pop = Math.min(1, m.pop);
  g.scale(m.face * pop, pop);
  g.rotate(m.tilt);
  if (m.hurtT > 0) g.globalAlpha = 0.5 + Math.sin(time * 60) * 0.5;

  const flapT = time * 75 + m.seed;
  const flap = w => (m.state === 'bite' ? -0.35 - w * 0.25 : -0.55 + Math.sin(flapT + w * 1.3) * 0.55);
  const blurWings = m.state !== 'bite';
  if (blurWings) { g.globalAlpha *= 0.35; wing(g, s, -0.95, true); wing(g, s, -0.15, true); g.globalAlpha /= 0.35; }
  wing(g, s, flap(1) - 0.25, true);

  // legs: black with white bands
  g.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    const bx = i * 0.22 * s, sw = Math.sin(time * 9 + i + m.seed) * 0.08 * s;
    const kx = bx + (i - 0.3) * 0.55 * s, ky = 0.6 * s;
    const fx = bx + (i - 0.5) * 1.1 * s + sw, fy = 1.45 * s;
    g.strokeStyle = '#111';
    g.lineWidth = Math.max(1, 0.07 * s);
    g.beginPath(); g.moveTo(bx, 0.15 * s); g.lineTo(kx, ky); g.lineTo(fx, fy); g.stroke();
    g.strokeStyle = '#fff';
    g.lineWidth = Math.max(1, 0.06 * s);
    for (const p of [0.35, 0.7]) {
      const px = kx + (fx - kx) * p, py = ky + (fy - ky) * p;
      g.beginPath(); g.moveTo(px - 0.03 * s, py - 0.04 * s); g.lineTo(px + 0.03 * s, py + 0.04 * s); g.stroke();
    }
  }

  // abdomen
  const bloat = 1 + m.blood * 0.7 + (m.type === 'fat' ? 0.25 : 0);
  g.save();
  g.translate(-0.74 * s, 0.1 * s);
  g.rotate(-0.12);
  g.beginPath();
  g.ellipse(0, 0, 0.8 * s * (1 + m.blood * 0.15), 0.27 * s * bloat, 0, 0, TAU);
  const abg = g.createLinearGradient(0, -0.3 * s, 0, 0.3 * s);
  abg.addColorStop(0, '#4a4a4a'); abg.addColorStop(0.45, '#151515'); abg.addColorStop(1, '#050505');
  g.fillStyle = abg;
  g.fill();
  g.save();
  g.clip();
  g.fillStyle = '#f4f4f4';
  for (let k = -3; k <= 3; k++) g.fillRect(k * 0.22 * s - 0.04 * s, -s, 0.08 * s, 2 * s);
  if (m.blood > 0) {
    g.fillStyle = `rgba(200,10,20,${0.25 + m.blood * 0.6})`;
    g.fillRect(-s, -s, 2 * s, 2 * s);
  }
  g.fillStyle = 'rgba(255,255,255,.35)';
  g.beginPath(); g.ellipse(0.1 * s, -0.14 * s * bloat, 0.45 * s, 0.06 * s * bloat, 0, 0, TAU); g.fill();
  g.restore();
  g.strokeStyle = '#000';
  g.lineWidth = Math.max(1, 0.03 * s);
  g.stroke();
  g.restore();

  // thorax with white lyre
  g.fillStyle = '#1a1a1a';
  g.beginPath(); g.ellipse(0, -0.02 * s, 0.36 * s, 0.31 * s, 0, 0, TAU); g.fill();
  g.strokeStyle = '#fff';
  g.lineWidth = Math.max(1, 0.06 * s);
  g.beginPath(); g.arc(0.02 * s, -0.02 * s, 0.17 * s, Math.PI * 0.6, Math.PI * 1.4); g.stroke();
  g.beginPath(); g.moveTo(0.04 * s, -0.2 * s); g.lineTo(0.04 * s, 0.14 * s); g.stroke();
  if (m.type === 'boss') {
    g.strokeStyle = '#ffd23f';
    g.lineWidth = 0.07 * s;
    g.beginPath(); g.arc(0.1 * s, -0.05 * s, 0.3 * s, 0.1 * Math.PI, 0.8 * Math.PI); g.stroke();
  }

  // big cartoon head
  const hx = 0.55 * s, hy = -0.08 * s, hr = 0.36 * s;
  g.fillStyle = '#1c1c1c';
  g.beginPath(); g.arc(hx, hy, hr, 0, TAU); g.fill();
  g.fillStyle = '#e9e9e9';
  g.beginPath(); g.arc(hx - 0.02 * s, hy - 0.2 * s, 0.07 * s, 0, TAU); g.fill();

  // proboscis
  g.strokeStyle = '#111';
  g.lineWidth = Math.max(1.2, 0.06 * s);
  const pAng = m.state === 'bite' ? 0.75 : 0.38;
  g.beginPath(); g.moveTo(hx + hr * 0.85, hy + hr * 0.4); g.lineTo(hx + hr * 0.85 + Math.cos(pAng) * 0.8 * s, hy + hr * 0.4 + Math.sin(pAng) * 0.8 * s); g.stroke();
  // antennae
  g.lineWidth = Math.max(0.8, 0.03 * s);
  const ant = Math.sin(time * 6 + m.seed) * 0.05 * s;
  g.beginPath(); g.moveTo(hx + 0.1 * s, hy - 0.24 * s); g.quadraticCurveTo(hx + 0.3 * s, hy - 0.6 * s, hx + 0.5 * s + ant, hy - 0.62 * s); g.stroke();
  g.beginPath(); g.moveTo(hx + 0.02 * s, hy - 0.26 * s); g.quadraticCurveTo(hx + 0.1 * s, hy - 0.7 * s, hx + 0.28 * s - ant, hy - 0.78 * s); g.stroke();

  // eyes
  const ex = hx + 0.12 * s, ey = hy - 0.04 * s;
  const lx = (m.lookX || 0) * m.face, ly = m.lookY || 0;
  const ca = Math.cos(-m.tilt), sa = Math.sin(-m.tilt);
  const llx = lx * ca - ly * sa, lly = lx * sa + ly * ca;
  const er = (m.scared ? 0.2 : 0.17) * s;
  if (m.type === 'boss') {
    g.fillStyle = '#000';
    rr(g, ex - 0.26 * s, ey - 0.1 * s, 0.46 * s, 0.17 * s, 0.06 * s); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.7)';
    g.lineWidth = 0.025 * s;
    g.beginPath(); g.moveTo(ex - 0.18 * s, ey - 0.05 * s); g.lineTo(ex - 0.08 * s, ey - 0.05 * s); g.stroke();
    g.fillStyle = '#3b2a1a';
    g.beginPath(); g.ellipse(hx + 0.18 * s, hy + 0.16 * s, 0.16 * s, 0.05 * s, 0.2, 0, TAU); g.fill();
    // crown
    g.fillStyle = '#ffd23f';
    g.strokeStyle = '#8a5a00';
    g.lineWidth = 0.03 * s;
    g.beginPath();
    g.moveTo(hx - 0.22 * s, hy - 0.22 * s); g.lineTo(hx - 0.2 * s, hy - 0.52 * s); g.lineTo(hx - 0.1 * s, hy - 0.36 * s);
    g.lineTo(hx, hy - 0.58 * s); g.lineTo(hx + 0.1 * s, hy - 0.36 * s); g.lineTo(hx + 0.2 * s, hy - 0.52 * s);
    g.lineTo(hx + 0.22 * s, hy - 0.22 * s); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#e63946';
    g.beginPath(); g.arc(hx, hy - 0.3 * s, 0.035 * s, 0, TAU); g.fill();
  } else if (happy) {
    g.strokeStyle = '#fff';
    g.lineWidth = Math.max(1.2, 0.05 * s);
    for (const [ox, sc] of [[-0.14, 0.75], [0, 1]]) {
      g.beginPath(); g.arc(ex + ox * s, ey + 0.02 * s, er * 0.7 * sc, 1.1 * Math.PI, 1.9 * Math.PI); g.stroke();
    }
    g.fillStyle = 'rgba(255,120,150,.7)';
    g.beginPath(); g.arc(hx + 0.05 * s, hy + 0.14 * s, 0.06 * s, 0, TAU); g.fill();
  } else if (m.hurtT > 0) {
    g.strokeStyle = '#fff';
    g.lineWidth = Math.max(1.2, 0.05 * s);
    for (const ox of [-0.14, 0]) {
      const cx = ex + ox * s, k = er * 0.6;
      g.beginPath(); g.moveTo(cx - k, ey - k); g.lineTo(cx + k, ey + k); g.moveTo(cx + k, ey - k); g.lineTo(cx - k, ey + k); g.stroke();
    }
  } else {
    // back eye then front eye, pupils follow the look target
    for (const [ox, sc] of [[-0.15, 0.75], [0, 1]]) {
      const cx = ex + ox * s, r0 = er * sc;
      g.fillStyle = '#fff';
      g.strokeStyle = '#000';
      g.lineWidth = Math.max(0.8, 0.025 * s);
      g.beginPath(); g.ellipse(cx, ey, r0 * 0.9, r0 * 1.1, 0, 0, TAU); g.fill(); g.stroke();
      const pr = r0 * (m.scared ? 0.32 : 0.5);
      g.fillStyle = m.type === 'fast' ? '#b5081a' : '#111';
      g.beginPath(); g.arc(cx + llx * r0 * 0.4, ey + lly * r0 * 0.45, pr, 0, TAU); g.fill();
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(cx + llx * r0 * 0.4 - pr * 0.35, ey + lly * r0 * 0.45 - pr * 0.35, pr * 0.35, 0, TAU); g.fill();
    }
    // brows: mischievous, or raised when scared
    g.strokeStyle = '#fff';
    g.lineWidth = Math.max(1, 0.04 * s);
    g.beginPath();
    if (m.scared) { g.moveTo(ex - 0.08 * s, ey - er * 1.5); g.lineTo(ex + 0.08 * s, ey - er * 1.8); }
    else { g.moveTo(ex - 0.08 * s, ey - er * 1.7); g.lineTo(ex + 0.1 * s, ey - er * 1.2); }
    g.stroke();
  }
  // grin / scared mouth
  if (m.type !== 'boss' && m.state !== 'bite') {
    g.strokeStyle = '#fff';
    g.lineWidth = Math.max(1, 0.035 * s);
    g.beginPath();
    if (m.scared) g.arc(hx + 0.08 * s, hy + 0.2 * s, 0.04 * s, 0, TAU);
    else g.arc(hx + 0.06 * s, hy + 0.1 * s, 0.09 * s, 0.15 * Math.PI, 0.75 * Math.PI);
    g.stroke();
    if (!m.scared) {
      g.fillStyle = '#fff';
      g.beginPath(); g.moveTo(hx + 0.08 * s, hy + 0.18 * s); g.lineTo(hx + 0.11 * s, hy + 0.25 * s); g.lineTo(hx + 0.13 * s, hy + 0.17 * s); g.fill();
    }
  }
  if (m.type === 'fast') {
    g.strokeStyle = '#e63946';
    g.lineWidth = 0.08 * s;
    g.beginPath(); g.arc(hx, hy, hr * 0.95, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke();
    const fl = Math.sin(time * 30) * 0.06 * s;
    g.beginPath(); g.moveTo(hx - hr * 0.7, hy - hr * 0.6); g.lineTo(hx - hr * 1.6, hy - hr * 0.3 + fl); g.moveTo(hx - hr * 0.7, hy - hr * 0.55); g.lineTo(hx - hr * 1.5, hy + fl); g.stroke();
  }

  if (blurWings) { g.globalAlpha *= 0.3; wing(g, s, -1.0, false); wing(g, s, -0.1, false); g.globalAlpha /= 0.3; }
  wing(g, s, flap(0), false);
  g.restore();

  // overlays drawn unflipped so text stays readable
  if (m.scared && m.state !== 'bite') {
    label(g, '!', m.x, m.y - s * 1.3, 18 * u, '#ffd23f');
    g.fillStyle = '#4cc9f0';
    g.beginPath(); g.ellipse(m.x - s * 0.6 * m.face, m.y - s * 0.7, 2.5 * u, 4 * u, 0, 0, TAU); g.fill();
  }
  if (m.say && m.say.t < m.say.life) {
    const a = Math.min(1, (m.say.life - m.say.t) * 4, m.say.t * 8);
    speech(g, m.x, m.y - s * (m.type === 'boss' ? 1.9 : 1.1), m.say.text, u, a);
  }
}

export function drawSoul(g, so, u) {
  const p = so.t / so.life, s = so.size;
  const x = so.x + Math.sin(so.t * 5) * 6 * u, y = so.y - p * 90 * u;
  g.save();
  g.globalAlpha = (1 - p) * 0.75;
  g.translate(x, y);
  g.fillStyle = 'rgba(255,255,255,.9)';
  g.beginPath(); g.ellipse(-0.4 * s, 0.05 * s, 0.6 * s, 0.22 * s, 0, 0, TAU); g.fill();
  g.beginPath(); g.arc(0.35 * s, -0.05 * s, 0.28 * s, 0, TAU); g.fill();
  const f = Math.sin(so.t * 25) * 0.4;
  for (const d of [-1, 1]) {
    g.save(); g.rotate(-Math.PI / 2 + d * (0.5 + f)); g.beginPath(); g.ellipse(0.4 * s, 0, 0.45 * s, 0.14 * s, 0, 0, TAU); g.restore(); g.fill();
  }
  g.strokeStyle = '#ffd23f';
  g.lineWidth = 2 * u;
  g.beginPath(); g.ellipse(0.35 * s, -0.55 * s, 0.25 * s, 0.08 * s, 0, 0, TAU); g.stroke();
  g.restore();
}

export function drawBiteWarning(g, m, time, u) {
  const p = m.biteT / m.biteDur;
  const r = m.size * 1.4 + 6 * u;
  g.save();
  g.strokeStyle = `rgba(230,57,70,${0.5 + Math.sin(time * 18) * 0.3})`;
  g.lineWidth = 3 * u;
  g.beginPath(); g.arc(m.x, m.y, r + Math.sin(time * 18) * 3 * u, 0, TAU); g.stroke();
  g.strokeStyle = '#ffd23f';
  g.lineWidth = 4 * u;
  g.beginPath(); g.arc(m.x, m.y, r + 6 * u, -Math.PI / 2, -Math.PI / 2 + p * TAU); g.stroke();
  g.restore();
}

export function drawHpBar(g, m, u) {
  const w = m.size * 2, h = 6 * u, x = m.x - w / 2, y = m.y - m.size * 1.3;
  g.fillStyle = INK;
  rr(g, x - 2, y - 2, w + 4, h + 4, 4); g.fill();
  g.fillStyle = '#e63946';
  rr(g, x, y, w * Math.max(0, m.hp / m.maxHp), h, 3); g.fill();
  if (!m.say || m.say.t >= m.say.life) label(g, 'মশা সর্দার', m.x, y - 10 * u, 12 * u, '#ffd23f');
}

// ---------------------------------------------------------------- hand
function handShape(g, fill) {
  const parts = [[-36, -78, 17, 62, 9], [-15, -92, 18, 74, 9], [6, -88, 18, 70, 9], [26, -72, 16, 56, 8]];
  for (const [x, y, w, hh, r] of parts) { rr(g, x, y, w, hh, r); fill(); }
  g.save(); g.translate(-44, 4); g.rotate(-0.85); rr(g, -10, -42, 20, 48, 10); g.restore(); fill();
  rr(g, -42, -32, 86, 82, 26); fill();
}

function paintHand(g, zap) {
  g.strokeStyle = '#6b3a17';
  g.lineWidth = 9;
  g.lineJoin = 'round';
  handShape(g, () => g.stroke());
  const sk = g.createRadialGradient(-10, -30, 10, 0, -10, 110);
  sk.addColorStop(0, zap ? '#e6fbff' : '#f9d3a8');
  sk.addColorStop(0.6, zap ? '#bdf3ff' : '#eab07c');
  sk.addColorStop(1, zap ? '#7fdcf0' : '#c98a55');
  g.fillStyle = sk;
  handShape(g, () => g.fill());
  g.strokeStyle = 'rgba(120,60,20,.35)';
  g.lineWidth = 3;
  g.beginPath(); g.arc(-4, 10, 26, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
  g.beginPath(); g.moveTo(-30, -26); g.lineTo(34, -24); g.stroke();
  // fingernails
  g.fillStyle = zap ? 'rgba(255,255,255,.7)' : 'rgba(255,225,215,.85)';
  g.strokeStyle = 'rgba(150,90,60,.5)';
  g.lineWidth = 1.5;
  for (const [x, y, w] of [[-27.5, -72, 11], [-6, -86, 12], [15, -82, 12], [34, -66, 10]]) {
    g.beginPath(); g.ellipse(x, y + 6, w / 2, 7, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  }
  // knuckle creases
  g.strokeStyle = 'rgba(120,60,20,.25)';
  for (const [x, y] of [[-27, -44], [-6, -52], [15, -50], [34, -40]]) { g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + 5, y); g.stroke(); }
}

export function drawHand(g, h) {
  const p = h.t / h.life;
  const slam = Math.min(1, h.t / 0.07);
  const scale = h.size * (1.45 - 0.45 * slam) * (p > 0.6 ? 1 + (p - 0.6) * 0.15 : 1);
  const alpha = p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45;
  const ox = (1 - slam) * 40 * h.flip, oy = (1 - slam) * -50;
  g.save();
  g.globalAlpha = Math.max(0, alpha);
  g.translate(h.x + ox, h.y + oy);
  if (h.hit && h.t < 0.25) {
    const br = h.size * 1.1 * (0.8 + slam * 0.4);
    g.fillStyle = h.zap ? '#7ae7ff' : '#ffd23f';
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU + h.rot, d = i % 2 ? br * 0.55 : br;
      g.lineTo(Math.cos(a) * d, Math.sin(a) * d);
    }
    g.closePath(); g.fill(); g.stroke();
  }
  g.rotate(h.rot);
  g.scale((h.flip * scale) / 100, scale / 100);
  paintHand(g, h.zap);
  g.restore();
}

// ghost hand that follows the mouse on desktop
export function drawCursorHand(g, x, y, size, time, zap) {
  g.save();
  g.globalAlpha = 0.55;
  g.translate(x, y - 6 + Math.sin(time * 6) * 3);
  g.rotate(0.25);
  g.scale(size / 100, size / 100);
  paintHand(g, zap);
  g.restore();
}

// ---------------------------------------------------------------- splat
export function makeSplat(x, y, r, heavy) {
  const blobs = [{ dx: 0, dy: 0, r }];
  const n = heavy ? 14 : 9;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, d = r * (0.7 + Math.random() * 1.3);
    blobs.push({ dx: Math.cos(a) * d, dy: Math.sin(a) * d, r: r * (0.1 + Math.random() * 0.3) });
  }
  const drips = [];
  for (let i = 0; i < (heavy ? 4 : 2); i++) drips.push({ dx: (Math.random() - 0.5) * r * 1.2, len: r * (0.6 + Math.random() * 1.6), w: r * 0.16 });
  const legs = [];
  for (let i = 0; i < 6; i++) legs.push(Math.random() * TAU);
  return { x, y, r, blobs, drips, legs, t: 0, rot: Math.random() * TAU };
}

export function drawSplat(g, s) {
  const grow = Math.min(1, s.t / 0.08);
  const alpha = s.t < 5 ? 1 : Math.max(0, 1 - (s.t - 5) / 1.5);
  if (alpha <= 0) return;
  g.save();
  g.globalAlpha = alpha * 0.9;
  g.translate(s.x, s.y);
  g.fillStyle = '#b5081a';
  for (const b of s.blobs) { g.beginPath(); g.arc(b.dx * grow, b.dy * grow, b.r * grow, 0, TAU); g.fill(); }
  for (const d of s.drips) {
    const l = d.len * Math.min(1, s.t / 1.5);
    g.fillRect(d.dx - d.w / 2, 0, d.w, l);
    g.beginPath(); g.arc(d.dx, l, d.w * 0.8, 0, TAU); g.fill();
  }
  g.fillStyle = 'rgba(255,120,120,.35)';
  g.beginPath(); g.arc(-s.r * 0.3, -s.r * 0.3, s.r * 0.3 * grow, 0, TAU); g.fill();
  g.rotate(s.rot);
  g.strokeStyle = '#111';
  g.lineWidth = Math.max(1, s.r * 0.08);
  for (const a of s.legs) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * s.r * 1.3, Math.sin(a) * s.r * 1.3); g.stroke(); }
  g.fillStyle = '#111';
  g.beginPath(); g.ellipse(0, 0, s.r * 0.75, s.r * 0.3, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.7)';
  for (let k = -1; k <= 1; k++) g.fillRect(k * s.r * 0.25 - 1, -s.r * 0.3, 2, s.r * 0.6);
  // X eyes on the squashed head
  g.strokeStyle = '#fff';
  g.lineWidth = Math.max(1, s.r * 0.07);
  const ex = s.r * 0.6, k = s.r * 0.1;
  g.beginPath(); g.moveTo(ex - k, -k); g.lineTo(ex + k, k); g.moveTo(ex + k, -k); g.lineTo(ex - k, k); g.stroke();
  g.restore();
}

// ---------------------------------------------------------------- items
export function drawItem(g, it, time, u) {
  if (it.life - it.t < 2 && Math.sin(time * 20) > 0) return;
  const r = it.r * (1 + Math.sin(time * 6) * 0.05);
  g.save();
  g.fillStyle = 'rgba(255,255,255,.9)';
  g.strokeStyle = it.color;
  g.lineWidth = 4 * u;
  g.shadowColor = it.color;
  g.shadowBlur = 18;
  g.beginPath(); g.arc(it.x, it.y, r, 0, TAU); g.fill(); g.stroke();
  g.restore();
  g.font = `${Math.round(r * 1.1)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(it.emoji, it.x, it.y + r * 0.06);
  label(g, it.name, it.x, it.y + r + 10 * u, 12 * u, '#fff');
}

export function drawCoil(g, L, time) {
  const u = L.u, x = L.bed.x + L.bed.w * 0.35, y = L.floorY + (L.H - L.floorY) * 0.55;
  g.save();
  g.strokeStyle = '#2d6a4f';
  g.lineWidth = 4 * u;
  g.beginPath();
  for (let a = 0; a < TAU * 3; a += 0.2) {
    const r = 3 * u + a * 2.2 * u;
    g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.35);
  }
  g.stroke();
  g.fillStyle = '#ff6b00';
  g.beginPath(); g.arc(x + 3 * u + TAU * 3 * 2.2 * u, y, 3 * u, 0, TAU); g.fill();
  for (let i = 0; i < 6; i++) {
    const p = (time * 0.35 + i / 6) % 1;
    g.fillStyle = `rgba(200,200,200,${0.35 * (1 - p)})`;
    g.beginPath();
    g.arc(x + 44 * u + Math.sin(p * 9 + i) * 14 * u, y - p * L.H * 0.4, (8 + p * 26) * u, 0, TAU);
    g.fill();
  }
  g.restore();
}

export function drawZap(g, z) {
  g.save();
  g.globalAlpha = 1 - z.t / z.life;
  g.strokeStyle = '#7ae7ff';
  g.lineWidth = 3;
  g.shadowColor = '#00e5ff';
  g.shadowBlur = 12;
  g.beginPath();
  g.moveTo(z.x1, z.y1);
  const n = 7;
  for (let i = 1; i < n; i++) {
    const p = i / n;
    g.lineTo(z.x1 + (z.x2 - z.x1) * p + (Math.random() - 0.5) * 18, z.y1 + (z.y2 - z.y1) * p + (Math.random() - 0.5) * 18);
  }
  g.lineTo(z.x2, z.y2);
  g.stroke();
  g.restore();
}
