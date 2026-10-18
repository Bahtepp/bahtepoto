/**
 * Hafif katalog araması. Marka, model ve motor satış adı.
 * İndeks yalnızca Türkiye ana kataloğundaki araçları taşır.
 * Eski model yazımları `aliases` ile aynı kanonik modele gider.
 */
import { normalizeSearch } from './format.ts';

export interface SearchIndex {
  brands: { slug: string; name: string; tier: 'primary' | 'review' }[];
  models: { brand: string; brandName: string; slug: string; name: string; aliases?: string[] }[];
  engines: { brand: string; brandName: string; model: string; modelName: string; slug: string; label: string }[];
}

export interface SearchHit {
  kind: 'brand' | 'model' | 'engine';
  title: string;
  subtitle: string;
  brand: string;
  model?: string;
  engine?: string;
}

function compact(text: string): string {
  return normalizeSearch(text).replace(/[^a-z0-9]+/g, '');
}

function score(query: string, queryCompact: string, text: string): number {
  const n = normalizeSearch(text);
  const c = compact(text);
  if (!query) return 0;
  if (n === query || c === queryCompact) return 100;
  if (n.startsWith(query) || c.startsWith(queryCompact)) return 80;
  if (n.includes(query) || c.includes(queryCompact)) return 50;
  return 0;
}

/** En fazla 8 sonuç. Nadir markalar yalnızca adları birebir yazılırsa arşiv olarak çıkar. */
export function searchCatalog(index: SearchIndex, raw: string): SearchHit[] {
  const query = normalizeSearch(raw);
  const queryCompact = compact(raw);
  if (queryCompact.length < 2) return [];

  const hits: { score: number; hit: SearchHit }[] = [];

  for (const b of index.brands) {
    const s = score(query, queryCompact, b.name);
    if (s === 0) continue;
    if (b.tier === 'review' && s < 100) continue;
    hits.push({
      score: s + 5,
      hit: {
        kind: 'brand',
        title: b.name,
        subtitle: b.tier === 'review' ? 'Arşiv' : 'Marka',
        brand: b.slug,
      },
    });
  }

  for (const m of index.models) {
    const texts = [m.name, `${m.brandName} ${m.name}`, ...(m.aliases ?? [])];
    const s = Math.max(...texts.map((text) => score(query, queryCompact, text)));
    if (s === 0) continue;
    hits.push({
      score: s + 3,
      hit: { kind: 'model', title: `${m.brandName} ${m.name}`, subtitle: 'Model', brand: m.brand, model: m.slug },
    });
  }

  for (const e of index.engines) {
    const s = Math.max(score(query, queryCompact, e.label), score(query, queryCompact, `${e.brandName} ${e.label}`));
    if (s === 0) continue;
    hits.push({
      score: s,
      hit: {
        kind: 'engine',
        title: `${e.brandName} ${e.modelName} ${e.label}`,
        subtitle: 'Motor',
        brand: e.brand,
        model: e.model,
        engine: e.slug,
      },
    });
  }

  hits.sort((a, b) => b.score - a.score || a.hit.title.localeCompare(b.hit.title, 'tr'));
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  for (const { hit } of hits) {
    const key = `${hit.kind}|${hit.brand}|${hit.model ?? ''}|${hit.engine ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
    if (out.length === 8) break;
  }
  return out;
}
