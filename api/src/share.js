// Score-card share links. The browser renders the card (it shapes Bengali text correctly),
// uploads it here, and gets back /s/<id>. That page carries Open Graph tags pointing at the
// stored image, so Facebook / Messenger / WhatsApp show the player's own card as the preview.
import { Binary } from 'mongodb';
import { withDb, json } from './counter.js';

const MAX_BYTES = 400 * 1024;
const TTL_DAYS = 60;
const ID_RE = /^[a-z0-9]{8}$/;
const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const int = (v, max) => Math.max(0, Math.min(max, parseInt(v, 10) || 0));

function newId() {
  const a = crypto.getRandomValues(new Uint8Array(8));
  return [...a].map(b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
}

// POST /api/share?score=&kills=&combo=  body: image/jpeg  →  { id, url }
export async function createShare(c) {
  const { request } = c;
  if (!/^image\/jpeg/.test(request.headers.get('content-type') || '')) return json({ error: 'jpeg only' }, 415);
  const buf = new Uint8Array(await request.arrayBuffer());
  if (buf.length > MAX_BYTES || buf.length < 1000) return json({ error: 'bad size' }, 413);
  if (buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) return json({ error: 'not a jpeg' }, 415);
  const q = new URL(request.url).searchParams;
  const doc = {
    _id: newId(),
    img: new Binary(buf),
    score: int(q.get('score'), 1e6),
    kills: int(q.get('kills'), 1e5),
    combo: int(q.get('combo'), 1e4),
    createdAt: new Date(),
  };
  await withDb(c, async db => {
    const col = db.collection('shares');
    // old cards expire on their own so the free cluster doesn't fill up
    await col.createIndex({ createdAt: 1 }, { expireAfterSeconds: TTL_DAYS * 86400 });
    await col.insertOne(doc);
  });
  const origin = new URL(request.url).origin;
  return json({ id: doc._id, url: `${origin}/s/${doc._id}` });
}

async function findShare(c, id, withImage) {
  if (!ID_RE.test(id)) return null;
  return withDb(c, db => db.collection('shares').findOne({ _id: id }, withImage ? {} : { projection: { img: 0 } }));
}

// GET /api/share/<id>.jpg — immutable, so cache it at the edge after the first fetch
export async function shareImage(c, id, ctx) {
  const cache = caches.default, key = new Request(c.request.url);
  const hit = await cache.match(key);
  if (hit) return hit;
  const doc = await findShare(c, id, true);
  if (!doc) return new Response('not found', { status: 404 });
  const res = new Response(doc.img.buffer, {
    headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' },
  });
  ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

// GET /s/<id> — link-preview page for crawlers; people are sent straight on to the game
export async function sharePage(c, id) {
  const origin = new URL(c.request.url).origin;
  const doc = await findShare(c, id, false).catch(() => null);
  if (!doc) return Response.redirect(origin + '/', 302);
  const game = `${origin}/?c=${doc.score}`;
  const title = `আমি ${bn(doc.score)} পয়েন্ট পেয়েছি, ${bn(doc.kills)}টা মশা থাপ্পড়ে মেরেছি! 👋🦟`;
  const desc = 'তুমি পারবা আমারে হারাইতে? ঘুমন্ত মামাকে ডেঙ্গু মশার হাত থেকে বাঁচাও — ডেঙ্গু থাপ্পড় বাজ';
  const img = `${origin}/api/share/${doc._id}.jpg`;
  const html = `<!doctype html><html lang="bn"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ডেঙ্গু থাপ্পড় বাজ">
<meta property="og:locale" content="bn_BD">
<meta property="og:url" content="${esc(`${origin}/s/${doc._id}`)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<script>location.replace(${JSON.stringify(game)})</script>
</head><body style="font-family:sans-serif;text-align:center;padding:40px">
<p><a href="${esc(game)}">ডেঙ্গু থাপ্পড় বাজ খেলতে এখানে চাপুন 👋</a></p>
</body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
