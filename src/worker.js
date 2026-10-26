// Visit counter API. Static game files are served from ./public by the assets binding;
// only /api/* reaches this code. MONGODB_URI is a secret (.dev.vars locally, dashboard in prod).
import { MongoClient } from 'mongodb';

const DB_NAME = 'dengue_maro';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

// store a salted SHA-256 of the IP, never the raw address
async function hashIp(ip, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + '|' + ip));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Workers can't share sockets between requests, so each request opens its own short-lived client.
async function withDb(env, ctx, fn) {
  const client = new MongoClient(env.MONGODB_URI, { maxPoolSize: 1, serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    return await fn(client.db(DB_NAME));
  } finally {
    ctx.waitUntil(client.close());
  }
}

async function recordVisit(request, env, ctx) {
  const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
  const ipHash = await hashIp(ip, env.IP_SALT || 'dengue-maro');
  return withDb(env, ctx, async db => {
    const stats = await db.collection('stats').findOneAndUpdate(
      { _id: 'visits' },
      { $inc: { total: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true, returnDocument: 'after' },
    );
    ctx.waitUntil(
      db.collection('visits').insertOne({
        ipHash,
        at: new Date(),
        country: request.cf?.country || null,
      }),
    );
    return stats.total;
  });
}

async function readTotal(env, ctx) {
  return withDb(env, ctx, async db => (await db.collection('stats').findOne({ _id: 'visits' }))?.total || 0);
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/')) {
      if (!env.MONGODB_URI) return json({ error: 'MONGODB_URI not configured' }, 500);
      try {
        if (pathname === '/api/visit' && request.method === 'POST') return json({ total: await recordVisit(request, env, ctx) });
        if (pathname === '/api/stats' && request.method === 'GET') return json({ total: await readTotal(env, ctx) });
        return json({ error: 'not found' }, 404);
      } catch (err) {
        console.error('visit counter failed:', err);
        return json({ error: 'database unavailable' }, 503);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
