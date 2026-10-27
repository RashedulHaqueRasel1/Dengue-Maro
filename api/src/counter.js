// Visit counter shared by the Pages Functions in functions/api/.
// MONGODB_URI is a secret (.dev.vars locally, Pages dashboard in production).
import { MongoClient } from 'mongodb';

const DB_NAME = 'dengue_maro';

export const json = (data, status = 200) =>
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
export async function withDb(ctx, fn) {
  const { env, waitUntil } = ctx;
  if (!env.MONGODB_URI) throw new Error('MONGODB_URI not configured');
  const client = new MongoClient(env.MONGODB_URI, { maxPoolSize: 1, serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    return await fn(client.db(DB_NAME));
  } finally {
    waitUntil(client.close());
  }
}

export async function recordVisit(ctx) {
  const { request, env } = ctx;
  const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
  const ipHash = await hashIp(ip, env.IP_SALT || 'dengue-maro');
  return withDb(ctx, async db => {
    // both must finish before withDb closes the client
    const [stats] = await Promise.all([
      db.collection('stats').findOneAndUpdate(
        { _id: 'visits' },
        { $inc: { total: 1 }, $set: { updatedAt: new Date() } },
        { upsert: true, returnDocument: 'after' },
      ),
      db.collection('visits').insertOne({ ipHash, at: new Date(), country: request.cf?.country || null }),
    ]);
    return stats.total;
  });
}

export async function readTotal(ctx) {
  return withDb(ctx, async db => (await db.collection('stats').findOne({ _id: 'visits' }))?.total || 0);
}

// Non-secret hints about why the connection failed: error type/message with any credentials
// masked, plus the *shape* of MONGODB_URI (never its value).
function diagnose(err, uri = '') {
  const mask = s => String(s || '').replace(/mongodb(\+srv)?:\/\/[^\s@]*@/gi, 'mongodb$1://***@');
  return {
    reason: err?.name || 'Error',
    detail: mask(err?.message).slice(0, 300),
    uri: {
      set: !!uri,
      scheme: (uri.match(/^[a-z+]+:\/\//i) || ['invalid'])[0],
      hasPlaceholder: /<db_(username|password)>/.test(uri),
      hasWhitespaceOrQuotes: /^\s|\s$|^["']|["']$/.test(uri),
    },
  };
}

export async function handle(ctx, fn) {
  try {
    return json({ total: await fn() });
  } catch (err) {
    console.error('visit counter failed:', err);
    return json({ error: 'database unavailable', ...diagnose(err, ctx.env.MONGODB_URI) }, 503);
  }
}
