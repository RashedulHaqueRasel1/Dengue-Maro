// POST /api/visit — count this visit and return the new total
import { recordVisit, handle } from '../../src/counter.js';

export const onRequestPost = ctx => handle(ctx, () => recordVisit(ctx));
