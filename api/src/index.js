// dengue-maro-api: visit counter Worker. Not public (workers_dev is off); the Pages site
// forwards /api/* here through a service binding, see ../../functions/api/[[path]].js.
import { recordVisit, readTotal, handle, json } from './counter.js';

export default {
  async fetch(request, env, ctx) {
    const c = { request, env, waitUntil: p => ctx.waitUntil(p) };
    const { pathname } = new URL(request.url);
    if (pathname === '/api/visit' && request.method === 'POST') return handle(c, () => recordVisit(c));
    if (pathname === '/api/stats' && request.method === 'GET') return handle(c, () => readTotal(c));
    return json({ error: 'not found' }, 404);
  },
};
