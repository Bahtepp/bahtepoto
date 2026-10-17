/**
 * Wikidata bağdaştırıcısı (ad normalleştirme): İngilizce Wikipedia'da başlıkla bulunamayan veya başlığı
 * modelle eşleşmeyen modeller için Wikidata'da etiketi ya da diğer adı TAM OLARAK "<Marka> <Model>" olan
 * otomobil modeli öğesini arar ve onun İngilizce Wikipedia bağlantısını (sitelink) verir.
 *
 * Kurallar:
 * - Etiket/diğer ad karşılaştırması harf, aksan ve boşluk farkı dışında birebir olmalı ("Audi RS4" = "Audi RS 4").
 * - Öğe bir otomobil modeli olmalı (P31: Q3231690 otomobil modeli veya Q59773381 otomobil model serisi).
 * - Birden çok uygun öğe varsa (ad iki ayrı modele aitse) karar verilmez.
 * Yanıtlar `.cache/import/wikidata-ara/` altında saklanır; aynı sorgu bir daha gönderilmez.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://www.wikidata.org/w/api.php';
const USER_AGENT = 'bahtepoto-import/0.1 (https://bahtepoto.com; katalog veri içe aktarma)';
export const CAR_MODEL_CLASSES = new Set(['Q3231690', 'Q59773381']);

export interface WikidataMatch {
  qid: string;
  /** Eşleşen etiket veya diğer ad. */
  label: string;
  enwiki: string;
}

interface SearchResult {
  id: string;
  label?: string;
  match?: { type: string; text: string };
  aliases?: string[];
}
interface Entity {
  id: string;
  claims?: Record<string, { mainsnak: { datavalue?: { value?: { id?: string } } } }[]>;
  sitelinks?: Record<string, { title: string }>;
}

export const normalizeName = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

/** Arama sonuçları + öğe verisinden tek, kesin eşleşmeyi seçer (saf fonksiyon; testlerde kullanılır). */
export function pickMatch(query: string, results: SearchResult[], entities: Map<string, Entity>): WikidataMatch | undefined {
  const q = normalizeName(query);
  const exact = results.filter((r) => [r.match?.text, r.label, ...(r.aliases ?? [])].some((t) => t && normalizeName(t) === q));
  const cars = exact
    .map((r) => ({ r, e: entities.get(r.id) }))
    .filter(({ e }) => e && (e.claims?.P31 ?? []).some((c) => CAR_MODEL_CLASSES.has(c.mainsnak.datavalue?.value?.id ?? '')) && e.sitelinks?.enwiki);
  if (cars.length !== 1) return undefined;
  const { r, e } = cars[0]!;
  return { qid: r.id, label: r.match?.text ?? r.label ?? query, enwiki: e!.sitelinks!.enwiki!.title };
}

async function getJson(url: string, file: string, offline: boolean, doFetch: typeof fetch): Promise<unknown | undefined> {
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  if (offline) return undefined;
  const res = await doFetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Wikidata: HTTP ${res.status}`);
  const json = await res.json();
  writeFileSync(file, JSON.stringify(json));
  await new Promise((r) => setTimeout(r, 200));
  return json;
}

/** Sorgu ("Ford Grand C-MAX") → kesin Wikidata eşleşmesi. Bulunamayan sorgular haritada yer almaz. */
export async function resolveViaWikidata(
  queries: string[],
  opts: { cacheDir: string; offline?: boolean; fetchImpl?: typeof fetch; log?: (m: string) => void },
): Promise<Map<string, WikidataMatch>> {
  mkdirSync(opts.cacheDir, { recursive: true });
  const doFetch = opts.fetchImpl ?? fetch;
  const hash = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 16);
  const searches = new Map<string, SearchResult[]>();
  let n = 0;
  for (const q of [...new Set(queries)]) {
    const url = `${API}?${new URLSearchParams({ action: 'wbsearchentities', search: q, language: 'en', type: 'item', limit: '7', format: 'json' })}`;
    const json = (await getJson(url, join(opts.cacheDir, `ara-${hash(q)}.json`), Boolean(opts.offline), doFetch)) as { search?: SearchResult[] } | undefined;
    searches.set(q, json?.search ?? []);
    if (++n % 50 === 0) opts.log?.(`  Wikidata arama: ${n}/${queries.length}`);
  }
  const ids = [...new Set([...searches.values()].flat().map((r) => r.id))];
  const entities = new Map<string, Entity>();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = `${API}?${new URLSearchParams({ action: 'wbgetentities', ids: batch.join('|'), props: 'claims|sitelinks', sitefilter: 'enwiki', format: 'json' })}`;
    const json = (await getJson(url, join(opts.cacheDir, `oge-${hash(batch.join('|'))}.json`), Boolean(opts.offline), doFetch)) as { entities?: Record<string, Entity> } | undefined;
    for (const e of Object.values(json?.entities ?? {})) entities.set(e.id, e);
  }
  const out = new Map<string, WikidataMatch>();
  for (const [q, results] of searches) {
    const m = pickMatch(q, results, entities);
    if (m) out.set(q, m);
  }
  return out;
}
