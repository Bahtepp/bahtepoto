/**
 * Tarih kararlılığı: içeriği değişmeyen kayıt, yeni çalıştırmanın tarihini (`updatedAt`, `accessedAt`)
 * almaz. Böylece aynı veri başka bir gün yeniden aktarıldığında hiçbir dosya değişmez.
 * Kayıtlar dizilerde `id` ile (yoksa sırayla) eşlenir.
 */
import type { Json, RawCatalog } from './io.ts';

const DATE_KEYS = new Set(['updatedAt', 'accessedAt']);
const isObj = (x: unknown): x is Json => typeof x === 'object' && x !== null && !Array.isArray(x);
const withoutDates = (x: Json) => JSON.stringify(x, (k, v: unknown) => (DATE_KEYS.has(k) ? undefined : v));

function stabilize(prev: unknown, next: unknown): unknown {
  if (Array.isArray(next)) {
    if (!Array.isArray(prev)) return next;
    const byId = new Map(prev.filter((p) => isObj(p) && p.id !== undefined).map((p) => [(p as Json).id, p]));
    return next.map((n, i) => (isObj(n) ? stabilize(n.id !== undefined ? byId.get(n.id) : prev[i], n) : n));
  }
  if (!isObj(next) || !isObj(prev)) return next;
  const out: Json = {};
  for (const [k, v] of Object.entries(next)) out[k] = stabilize(prev[k], v);
  if (withoutDates(out) === withoutDates(prev)) for (const k of DATE_KEYS) if (k in out && k in prev) out[k] = prev[k];
  return out;
}

export function stabilizeDates(before: RawCatalog, after: RawCatalog): RawCatalog {
  return {
    brands: stabilize(before.brands, after.brands) as Json[],
    markets: after.markets,
    sources: stabilize(before.sources, after.sources) as Json[],
    engines: new Map([...after.engines].map(([f, list]) => [f, stabilize(before.engines.get(f), list) as Json[]])),
    models: new Map([...after.models].map(([f, m]) => [f, stabilize(before.models.get(f), m) as Json])),
  };
}
