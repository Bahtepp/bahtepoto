/**
 * `npm run catalog:generations [-- --offline]`
 * Katalogdaki modeller için Wikipedia'dan nesil (kasa) bilgisi toplar ve
 * `data/staging/wikipedia/generations.json` + `NESIL-RAPORU.md` yazar. KATALOĞA YAZMAZ:
 * adaylar geçici alanda kalır ve kataloğa aktarılmaları insan onayı bekler.
 *
 * Aşamalar: modelleri belirle → model maddesini bul (aday başlıklar, yönlendirmeler) →
 * nesil bölümlerini/bağlantılı nesil maddelerini getir → bilgi kutularını normalize et →
 * bellekte eşleştirme denemesi (adaylar eklenmiş katalog kopyasıyla TSB içe aktarması) → rapor.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { loadRawCatalog, type Json } from '../lib/io.ts';
import { DEFAULT_DIRS, today } from '../lib/paths.ts';
import { analyze } from '../lib/analyze.ts';
import { readFirstSheet } from '../lib/xlsx.ts';
import { buildFromTsb, stripTsb } from '../tsb/build.ts';
import { mergeRows, parseSheet } from '../tsb/parse.ts';
import { applyGenerations, candidateTitles, generationsFromArticle, hasCuratedGenerations, qualifiedLinks, titleMatchesModel, WPGEN_PREFIX, type ModelGenerations } from './build.ts';
import { resolveViaWikidata, type WikidataMatch } from './wikidata.ts';
import { WIKIPEDIA_TITLES } from '../tsb/aliases.ts';
import { fetchPages, hasCarInfobox, isDisambiguation } from './fetch.ts';
import { sectionsWithMain } from './wikitext.ts';

const { values } = parseArgs({ options: { offline: { type: 'boolean' }, refresh: { type: 'boolean' } } });
const cacheBase = join(DEFAULT_DIRS.cacheDir, 'wikipedia');
const latestCache = () => (existsSync(cacheBase) ? readdirSync(cacheBase).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().at(-1) : undefined);
// Başlık önbelleği kalıcıdır: en son klasör kullanılır (yalnızca yeni başlıklar indirilir); --refresh yeni klasörle baştan indirir.
const cacheDir = join(cacheBase, values.refresh ? today() : (latestCache() ?? today()));
const log = (m: string) => console.log(m);


const raw = loadRawCatalog(DEFAULT_DIRS.catalogDir);
const brandName = new Map(raw.brands.map((b) => [String(b.id), String(b.name)]));
const targets = [...raw.models].filter(([, m]) => ((m.generations as Json[] | undefined) ?? []).length > 0);
console.log(`Wikipedia nesil toplama: ${targets.length} model`);

// 1) Model maddeleri
const candidates = new Map<string, string[]>();
const modelKey = (f: string) => f.replace(/^models\/|\.json$/g, '');
for (const [f, m] of targets) {
  // Takma ad tablosundaki kesin başlık (örn. MINI → "Mini Hatch") önce denenir.
  const override = WIKIPEDIA_TITLES[modelKey(f)];
  candidates.set(f, [...(override ? [override] : []), ...candidateTitles(brandName.get(String(m.brandId)) ?? String(m.brandId), String(m.name))]);
}
const articlePages = await fetchPages([...candidates.values()].flat(), { cacheDir, offline: values.offline, log });

// 2) Bağlantılı nesil maddeleri
const articleFor = new Map<string, NonNullable<ReturnType<typeof articlePages.get>>>();
for (const [f, titles] of candidates) {
  // Bilgi kutusu olmayan model maddesi de kabul: nesil maddelerine {{Main}} ile bağlanıyorsa (örn. "Jaguar XF").
  // Anlam ayrımı sayfası yalnızca yıl/kod nitelendirmeli nesil bağlantısı veriyorsa kabul edilir (bkz. qualifiedLinks).
  const page = titles
    .map((t) => articlePages.get(t))
    .find((p) => p && ((!isDisambiguation(p) && (hasCarInfobox(p) || sectionsWithMain(p.wikitext).some((s) => s.mains.length > 0))) || qualifiedLinks(p).length > 0));
  if (page) articleFor.set(f, page);
}
// 2b) Wikidata ile ad normalleştirme: maddesi bulunamayan veya başlığı modelle eşleşmeyen modeller.
//     Wikidata'daki enwiki bağlantısı bir yönlendirmeyse (örn. "Audi RS 3" → "Audi A3") kabul edilmez.
const identityVia = new Map<string, WikidataMatch>();
const needWd = targets.filter(([f, m]) => !hasCuratedGenerations(m) && (!articleFor.get(f) || !titleMatchesModel(articleFor.get(f)!.title, brandName.get(String(m.brandId)) ?? '', String(m.name))));
const wdQuery = (m: Json) => `${brandName.get(String(m.brandId)) ?? ''} ${String(m.name).replace(/\b[A-Za-z]{1,3}\b/g, (w) => w.toUpperCase())}`;
const wd = await resolveViaWikidata(needWd.map(([, m]) => wdQuery(m)), { cacheDir: join(DEFAULT_DIRS.cacheDir, 'wikidata-ara'), offline: values.offline, log });
const wdPages = await fetchPages([...wd.values()].map((x) => x.enwiki), { cacheDir, offline: values.offline, log });
// Başlıkla zaten başka bir katalog modeline ait olan madde, türev modele (örn. "Focus WRC" → "Ford Focus")
// ikinci kez verilmez; grup maddeleri ("Audi S and RS models") tek model sayılmaz.
const titleOwned = new Set(
  targets
    .filter(([f, m]) => articleFor.get(f) && titleMatchesModel(articleFor.get(f)!.title, brandName.get(String(m.brandId)) ?? '', String(m.name)))
    .map(([f]) => articleFor.get(f)!.pageid),
);
for (const [f, m] of needWd) {
  const match = wd.get(wdQuery(m));
  const page = match ? wdPages.get(match.enwiki) : undefined;
  if (!match || !page || page.title !== match.enwiki || isDisambiguation(page)) continue;
  if (titleOwned.has(page.pageid) || /\b(models|and|list of|family)\b/i.test(page.title)) continue;
  articleFor.set(f, page);
  identityVia.set(f, match);
}
console.log(`Wikidata ile kimliği doğrulanan model: ${identityVia.size} (sorgu ${needWd.length})`);

const linkedTitles = [...articleFor.values()].flatMap((p) => [...sectionsWithMain(p.wikitext).flatMap((s) => s.mains), ...qualifiedLinks(p)]);
const linkedPages = await fetchPages(linkedTitles, { cacheDir, offline: values.offline, log });

// 3) Normalize
const results: ModelGenerations[] = [];
for (const [f, m] of targets) {
  const base = { modelFile: f, modelId: String(m.id), generations: [], pages: [], conflicts: [], overlaps: [] };
  if (hasCuratedGenerations(m)) {
    results.push({ ...base, status: 'skipped-curated' });
    continue;
  }
  const article = articleFor.get(f);
  if (!article) {
    results.push({ ...base, status: 'not-found' });
    continue;
  }
  const { gens, used, conflicts, overlaps, conflictSlugs, blockedSpans } = generationsFromArticle(article, linkedPages, brandName.get(String(m.brandId)) ?? '', String(m.name));
  results.push({
    ...base,
    article: article.title,
    status: gens.length ? 'found' : 'no-generations',
    identity: identityVia.has(f)
      ? { via: 'wikidata', qid: identityVia.get(f)!.qid, label: identityVia.get(f)!.label }
      : WIKIPEDIA_TITLES[modelKey(f)] && articlePages.get(WIKIPEDIA_TITLES[modelKey(f)]!)?.pageid === article.pageid
        ? { via: 'alias', label: WIKIPEDIA_TITLES[modelKey(f)] }
        : { via: 'title' },
    generations: gens,
    pages: used.map((p) => ({ title: p.title, pageid: p.pageid, revid: p.revid })),
    conflicts,
    overlaps,
    conflictSlugs,
    blockedSpans,
  });
}

// 4) Yaz
const outDir = join(DEFAULT_DIRS.stagingDir, 'wikipedia');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'generations.json'), `${JSON.stringify({ retrievedAt: today(), source: 'en.wikipedia.org (Infobox automobile)', license: 'CC BY-SA 4.0 — yalnızca olgular', models: results }, null, 1)}\n`);
const count = (s: ModelGenerations['status']) => results.filter((r) => r.status === s).length;
const found = results.filter((r) => r.status === 'found');
const lines = [
  '# Wikipedia nesil toplama raporu',
  '',
  `Kaynak: İngilizce Wikipedia, "Infobox automobile" bilgi kutuları (CC BY-SA 4.0; yalnızca olgular). Tarih: ${today()}.`,
  '',
  '| | Sayı |',
  '|---|---|',
  `| Model | ${results.length} |`,
  `| Nesli bulunan model | ${found.length} |`,
  `| Toplanan nesil | ${found.reduce((a, r) => a + r.generations.length, 0)} |`,
  `| Elle girilmiş nesli olduğu için atlanan model | ${count('skipped-curated')} |`,
  `| Wikipedia maddesi bulunamayan model | ${count('not-found')} |`,
  `| Maddesi var, nesil bilgi kutusu yok | ${count('no-generations')} |`,
  `| Çelişkili model (aynı nesil için farklı yıllar / aynı sıra iki kez) | ${results.filter((r) => r.conflicts.length).length} |`,
  `| Nesil yılları 2+ yıl örtüşen model (bilgi; gövde/pazar farkı) | ${results.filter((r) => r.overlaps.length).length} |`,
  '',
  '## Çelişkiler',
  '',
  ...results.filter((r) => r.conflicts.length).flatMap((r) => [`- **${r.modelFile}** (${r.article}):`, ...r.conflicts.map((c) => `  - ${c}`)]),
  '',
  '## Maddesi bulunamayan modeller',
  '',
  results.filter((r) => r.status === 'not-found').map((r) => r.modelFile.replace(/^models\/|\.json$/g, '')).join(', '),
  '',
];
// 5) Eşleştirme denemesi (yalnızca bellekte; katalog yazılmaz)
const trial = trialMatch();
if (trial) lines.splice(lines.indexOf('## Çelişkiler'), 0, ...trial, '');
writeFileSync(join(outDir, 'NESIL-RAPORU.md'), lines.join('\n'));
console.log(`Nesli bulunan model ${found.length}/${results.length} · nesil ${found.reduce((a, r) => a + r.generations.length, 0)} · bulunamayan ${count('not-found')} · nesilsiz ${count('no-generations')}`);
console.log('Adaylar yalnızca data/staging/wikipedia altında; katalog değişmedi.');

/**
 * Adaylar eklenmiş katalog KOPYASI üzerinde TSB içe aktarmasını çalıştırır ve kaç varyantın nesle
 * bağlanacağını raporlar. TSB ham dosyaları önbellekte yoksa atlanır.
 */
function trialMatch(): string[] | undefined {
  const base = join(DEFAULT_DIRS.cacheDir, 'tsb');
  const day = existsSync(base) ? readdirSync(base).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().at(-1) : undefined;
  if (!day) {
    console.log('  (TSB önbelleği yok; eşleştirme denemesi atlandı)');
    return undefined;
  }
  const files = readdirSync(join(base, day)).filter((f) => f.endsWith('.xlsx')).sort();
  const rows = mergeRows(files.map((f) => parseSheet(readFirstSheet(readFileSync(join(base, day, f))), f.replace(/\.xlsx$/, ''))));
  const opts = { today: today(), sourceTitle: 'TSB Kasko Değer Listesi', sourceNotes: 'deneme' };
  const before = buildFromTsb(raw, rows, opts);
  const withGens = applyGenerations(stripTsb(raw), results, today());
  const after = buildFromTsb(withGens.catalog, rows, opts);
  const errors = analyze(after.merged, []).errors;
  for (const e of errors.slice(0, 10)) console.log(`  deneme hatası: ${e}`);

  // Nesle bağlanan / hâlâ belirsiz varyantlar ve Wikipedia nesline bağlananlar
  let onWp = 0;
  let modelsWithWpMatch = 0;
  const ambiguous: [string, number][] = [];
  for (const [f, m] of after.merged.models) {
    let modelWp = 0;
    for (const g of (m.generations as Json[]) ?? []) {
      const n = ((g.variants as Json[]) ?? []).length;
      if (((g.sourceIds as string[]) ?? []).some((s) => s.startsWith(WPGEN_PREFIX))) modelWp += n;
      if (g.slug === 'nesil-belirlenmedi' && n > 0 && results.find((r) => r.modelFile === f)?.status === 'found') ambiguous.push([f.replace(/^models\/|\.json$/g, ''), n]);
    }
    onWp += modelWp;
    if (modelWp > 0) modelsWithWpMatch++;
  }
  const s0 = before.stats;
  const s1 = after.stats;
  const total = s1.variants;
  return [
    '## Eşleştirme denemesi (bellekte; katalog YAZILMADI)',
    '',
    'Adaylar katalog kopyasına eklenip TSB içe aktarması içe aktarmanın kurallarıyla (tip adındaki kasa kodu / nesil ipucu,',
    'bütün model yıllarını yalnızca tek neslin kapsaması, motor hacmi + yakıt kanıtı, alt model ve çelişkili dönem kuralları) yeniden çalıştırıldı.',
    '',
    '| | Şimdiki katalog | Adaylarla |',
    '|---|---|---|',
    `| TSB varyantı | ${s0.variants} | ${total} |`,
    `| Nesli belirlenemeyen varyant | ${s0.variantsWithoutGeneration} | ${s1.variantsWithoutGeneration} |`,
    `| Kaynaklı nesle bağlanan varyant | ${s0.variantsOnExistingGenerations} | ${s1.variantsOnExistingGenerations} |`,
    `| — Wikipedia adayı nesle bağlanan | 0 | ${onWp} |`,
    `| Wikipedia nesline en az bir varyantı bağlanan model | 0 | ${modelsWithWpMatch} |`,
    `| Katalog şeması / bütünlük hatası | — | ${errors.length} |`,
    '',
    `Nesli bulunduğu hâlde varyantları belirsiz kalan modeller (en çok 25; neden: model yılları iki neslin sınırına düşüyor):`,
    '',
    ...ambiguous.sort((a, b) => b[1] - a[1]).slice(0, 25).map(([m, n]) => `- ${m}: ${n}`),
  ];
}
