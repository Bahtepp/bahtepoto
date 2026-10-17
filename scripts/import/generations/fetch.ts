/**
 * Wikipedia'dan model maddelerini ve nesil maddelerini toplu getirir (MediaWiki API, 50 başlık/istek,
 * yönlendirmeler çözülür). Yanıtlar `.cache/import/wikipedia/<tarih>/` altında saklanır; aynı gün
 * yeniden çalıştırmada ağa çıkılmaz.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

export interface FetchOptions {
  cacheDir: string;
  offline?: boolean;
  log?: (m: string) => void;
  fetchImpl?: typeof fetch;
}

/** Başlık → sayfa (yönlendirme sonrası); bulunamayan başlıklar haritada yer almaz. */
export async function fetchPages(titles: string[], opts: FetchOptions): Promise<Map<string, WikiPage>> {
  mkdirSync(opts.cacheDir, { recursive: true });
  const unique = [...new Set(titles.filter((t) => t && t.length < 250))];
  const out = new Map<string, WikiPage>();
  const doFetch = opts.fetchImpl ?? fetch;
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    const key = createHash('sha1').update(batch.join('\n')).digest('hex').slice(0, 16);
    const file = join(opts.cacheDir, `${key}.json`);
    let json: { query?: { pages?: ApiPage[]; redirects?: { from: string; to: string }[]; normalized?: { from: string; to: string }[] } };
    if (existsSync(file)) json = JSON.parse(readFileSync(file, 'utf8'));
    else {
      if (opts.offline) continue;
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
      json = await res.json();
      writeFileSync(file, JSON.stringify(json));
      opts.log?.(`  Wikipedia: ${Math.min(i + 50, unique.length)}/${unique.length} başlık`);
      await new Promise((r) => setTimeout(r, 300)); // nazik istek hızı
    }
    const byTitle = new Map<string, WikiPage>();
    for (const p of json.query?.pages ?? []) {
      const rev = p.revisions?.[0];
      if (p.missing || p.invalid || !rev || !p.pageid) continue;
      byTitle.set(p.title, { title: p.title, pageid: p.pageid, revid: rev.revid, wikitext: rev.slots.main.content });
    }
    const resolve = (t: string) => {
      let cur = t;
      for (const n of json.query?.normalized ?? []) if (n.from === cur) cur = n.to;
      for (const r of json.query?.redirects ?? []) if (r.from === cur) cur = r.to;
      return cur;
    };
    for (const t of batch) {
      const page = byTitle.get(resolve(t));
      if (page) out.set(t, page);
    }
  }
  return out;
}

export const isDisambiguation = (p: WikiPage) => /\{\{\s*(disambiguation|disambig|dab|hndis|car disambiguation|set index)/i.test(p.wikitext);
export const hasCarInfobox = (p: WikiPage) => /\{\{\s*Infobox[ _]automobile/i.test(p.wikitext);
