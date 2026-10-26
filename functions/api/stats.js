// GET /api/stats — current total without counting
import { readTotal, handle } from '../../src/counter.js';

export const onRequestGet = ctx => handle(ctx, () => readTotal(ctx));
