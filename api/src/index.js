// dengue-maro-api: visit counter, share links and leaderboard. Not public (workers_dev is off); the Pages
// site forwards /api/* and /s/* here through a service binding, see ../../functions/.
import { recordVisit, readTotal, handle, json } from './counter.js';
import { createShare, shareImage, sharePage } from './share.js';
import { submitScore, leaderboard } from './leaderboard.js';

export default {
  async fetch(request, env, ctx) {
    const c = { request, env, waitUntil: p => ctx.waitUntil(p) };
    const { pathname } = new URL(request.url);
    const { method } = request;
    if (pathname === '/api/visit' && method === 'POST') return handle(c, () => recordVisit(c));
    if (pathname === '/api/stats' && method === 'GET') return handle(c, () => readTotal(c));
    try {
      if (pathname === '/api/score' && method === 'POST') return await submitScore(c);
      if (pathname === '/api/leaderboard' && method === 'GET') return await leaderboard(c);
      if (pathname === '/api/share' && method === 'POST') return await createShare(c);
      let m;
      if ((m = pathname.match(/^\/api\/share\/([a-z0-9]+)\.jpg$/)) && method === 'GET') return await shareImage(c, m[1], ctx);
      if ((m = pathname.match(/^\/s\/([a-z0-9]+)\/?$/)) && method === 'GET') return await sharePage(c, m[1]);
    } catch (err) {
      console.error('share failed:', err);
      return json({ error: 'share unavailable' }, 503);
    }
    return json({ error: 'not found' }, 404);
  },
};
