/**
 * Wikipedia'dan model maddelerini ve nesil maddelerini toplu getirir (MediaWiki API, 50 başlık/istek,
 * yönlendirmeler çözülür).
 *
 * Önbellek BAŞLIK bazındadır (`.cache/import/wikipedia/<tarih>/titles.json`: başlık → sayfa kimliği veya
 * "yok"; sayfalar `pages/<pageid>.json`). Aynı başlık bir daha indirilmez; aday başlık listesi değişse de
 * yalnızca yeni başlıklar sorulur. Eski toplu yanıt dosyaları (`<hash>.json`) da önbelleğe katılır.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { WikiPage } from './build.ts';

const API = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'bahtepoto-import/0.1 (https://bahtepoto.com; katalog veri içe aktarma)';

interface ApiPage {
  title: string;
  pageid?: number;
  missing?: boolean;
  invalid?: boolean;
  revisions?: { revid: number; slots: { main: { content: string } } }[];
}
interface ApiResponse {
  query?: { pages?: ApiPage[]; redirects?: { from: string; to: string }[]; normalized?: { from: string; to: string }[] };
}

export interface FetchOptions {
  cacheDir: string;
  offline?: boolean;
  log?: (m: string) => void;
  fetchImpl?: typeof fetch;
}

type Index = Record<string, number | null>;

function absorb(json: ApiResponse, asked: string[], index: Index, pagesDir: string) {
  const byTitle = new Map<string, WikiPage>();
  for (const p of json.query?.pages ?? []) {
    const rev = p.revisions?.[0];
    if (p.missing || p.invalid || !rev || !p.pageid) continue;
    const page: WikiPage = { title: p.title, pageid: p.pageid, revid: rev.revid, wikitext: rev.slots.main.content };
    byTitle.set(p.title, page);
    const file = join(pagesDir, `${p.pageid}.json`);
    if (!existsSync(file)) writeFileSync(file, JSON.stringify(page));
  }
  const resolve = (t: string) => {
    let cur = t;
    for (const n of json.query?.normalized ?? []) if (n.from === cur) cur = n.to;
    for (const r of json.query?.redirects ?? []) if (r.from === cur) cur = r.to;
    return cur;
  };
  for (const t of asked) index[t] = byTitle.get(resolve(t))?.pageid ?? null;
}

/** Başlık → sayfa (yönlendirme sonrası); bulunamayan başlıklar haritada yer almaz. */
export async function fetchPages(titles: string[], opts: FetchOptions): Promise<Map<string, WikiPage>> {
  const pagesDir = join(opts.cacheDir, 'pages');
  mkdirSync(pagesDir, { recursive: true });
  const indexFile = join(opts.cacheDir, 'titles.json');
  const index: Index = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, 'utf8')) : {};
  const unique = [...new Set(titles.filter((t) => t && t.length < 250))];

  // Eski toplu yanıt dosyalarını başlık önbelleğine kat (bir kez)
  if (Object.keys(index).length === 0) {
    for (const f of existsSync(opts.cacheDir) ? readdirSync(opts.cacheDir).filter((x) => /^[0-9a-f]{16}\.json$/.test(x)) : []) {
      const json = JSON.parse(readFileSync(join(opts.cacheDir, f), 'utf8')) as ApiResponse;
      const asked = [
        ...(json.query?.pages ?? []).map((p) => p.title),
        ...(json.query?.redirects ?? []).map((r) => r.from),
        ...(json.query?.normalized ?? []).map((n) => n.from),
      ];
      absorb(json, asked, index, pagesDir);
    }
  }

  const missing = unique.filter((t) => !(t in index));
  const doFetch = opts.fetchImpl ?? fetch;
  for (let i = 0; i < missing.length && !opts.offline; i += 50) {
    const batch = missing.slice(i, i + 50);
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      redirects: '1',
      prop: 'revisions',
      rvprop: 'content|ids',
      rvslots: 'main',
      titles: batch.join('|'),
    });
    const res = await doFetch(`${API}?${params}`, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`Wikipedia API: HTTP ${res.status}`);
    absorb((await res.json()) as ApiResponse, batch, index, pagesDir);
    writeFileSync(indexFile, JSON.stringify(index));
    opts.log?.(`  Wikipedia: ${Math.min(i + 50, missing.length)}/${missing.length} yeni başlık`);
    await new Promise((r) => setTimeout(r, 300)); // nazik istek hızı
  }
  writeFileSync(indexFile, JSON.stringify(index));

  const out = new Map<string, WikiPage>();
  for (const t of unique) {
    const id = index[t];
    if (!id) continue;
    const file = join(pagesDir, `${id}.json`);
    if (existsSync(file)) out.set(t, JSON.parse(readFileSync(file, 'utf8')) as WikiPage);
  }
  return out;
}

export const isDisambiguation = (p: WikiPage) => /\{\{\s*(disambiguation|disambig|dab|hndis|car disambiguation|set index)/i.test(p.wikitext);
export const hasCarInfobox = (p: WikiPage) => /\{\{\s*Infobox[ _]automobile/i.test(p.wikitext);
/** Önbellek anahtarı için kısa özet (testlerde ve tanılamada). */
export const shortHash = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 16);
