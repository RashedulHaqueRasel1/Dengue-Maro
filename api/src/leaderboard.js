// Leaderboard: one row per player (a random id the browser keeps), holding that player's
// best game. Ranked by mosquitoes killed, then score.
import { withDb, json } from './counter.js';

const ID_RE = /^[a-z0-9]{16}$/;
const PER_PAGE = 5;
const int = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v)) || 0));

function cleanName(raw) {
  const s = String(raw || '')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(s).slice(0, 20).join('');
}

const better = (a, b) => a.kills > b.kills || (a.kills === b.kills && a.score > b.score);

async function rankOf(col, row) {
  return 1 + (await col.countDocuments({
    $or: [{ kills: { $gt: row.kills } }, { kills: row.kills, score: { $gt: row.score } }],
  }));
}

// POST /api/score  { id, name, score, kills, combo, time }  →  { rank, best, improved }
export async function submitScore(c) {
  let body;
  try { body = await c.request.json(); } catch (e) { return json({ error: 'bad json' }, 400); }
  const id = String(body.id || '');
  const name = cleanName(body.name);
  if (!ID_RE.test(id) || !name) return json({ error: 'bad player' }, 400);
  const game = {
    score: int(body.score, 1e6),
    kills: int(body.kills, 1e5),
    combo: int(body.combo, 1e4),
    time: int(body.time, 7200),
  };
  // cheap sanity check against hand-edited requests: nobody kills faster than this
  if (game.kills > 5 + game.time * 3 || game.score > 50 + game.kills * 30) return json({ error: 'not plausible' }, 400);

  return withDb(c, async db => {
    const col = db.collection('players');
    await col.createIndex({ kills: -1, score: -1 });
    const prev = await col.findOne({ _id: id });
    const improved = !prev || better(game, prev);
    const set = { name, updatedAt: new Date(), ...(improved ? { ...game, bestAt: new Date() } : {}) };
    await col.updateOne({ _id: id }, { $set: set, $inc: { games: 1 }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
    const best = improved ? game : { score: prev.score, kills: prev.kills, combo: prev.combo, time: prev.time };
    return json({ rank: await rankOf(col, best), best, improved });
  });
}

// GET /api/leaderboard?page=<n>&me=<id>
//   →  { page, pages, players, top: [5 rows for that page], me: { rank, ... } | null }
export async function leaderboard(c) {
  const q = new URL(c.request.url).searchParams;
  const me = q.get('me') || '';
  return withDb(c, async db => {
    const col = db.collection('players');
    const players = await col.countDocuments();
    const pages = Math.max(1, Math.ceil(players / PER_PAGE));
    const page = Math.min(pages, Math.max(1, parseInt(q.get('page'), 10) || 1));
    const rows = await col.find({}, { projection: { name: 1, kills: 1, score: 1, combo: 1 } })
      .sort({ kills: -1, score: -1, bestAt: 1, _id: 1 })
      .skip((page - 1) * PER_PAGE).limit(PER_PAGE).toArray();
    let mine = null;
    if (ID_RE.test(me)) {
      const row = await col.findOne({ _id: me }, { projection: { name: 1, kills: 1, score: 1, combo: 1 } });
      if (row) mine = { name: row.name, kills: row.kills, score: row.score, combo: row.combo, rank: await rankOf(col, row) };
    }
    return json({
      page, pages, players,
      // player ids stay private: they're the only "password" for a row
      top: rows.map((r, i) => ({ rank: (page - 1) * PER_PAGE + i + 1, name: r.name, kills: r.kills, score: r.score, combo: r.combo, me: r._id === me })),
      me: mine,
    });
  });
}
