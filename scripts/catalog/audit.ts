/**
 * Katalog denetimi. Şüpheli kaydı silmez; seviyelere ayırır.
 * `npm run catalog:audit`
 *
 * Kesin hata varsa çıkış kodu 1. Diğer seviyeler rapordur.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const catalog = join(root, 'src', 'data', 'catalog');

type Level = 'kesin' | 'yuksek' | 'inceleme' | 'istisna';
interface Finding {
  level: Level;
  kind: string;
  path: string;
  detail: string;
}

/** Gerçek yüksek güç. Yalnızca kaynakta parantez içinde PS olduğu doğrulananlar. */
const POWER_EXCEPTIONS = new Set([
  'porsche-1034',
  'porsche-electric-1156',
  'lamborghini-40-920',
]);

const BRAND_AS_MODEL = new Set([
  'lexus', 'infiniti', 'jeep', 'mercedes', 'audi', 'bmw', 'toyota', 'nissan', 'ford', 'volkswagen', 'porsche', 'ferrari',
]);

const TRIM_MODEL = /\b(tributo|greenline|premium|titanium|comfortline|highline|elegance|limited|edition)\b/i;

const findings: Finding[] = [];
const push = (level: Level, kind: string, path: string, detail: string) => findings.push({ level, kind, path, detail });

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

const engineFiles = readdirSync(join(catalog, 'engines')).filter((f) => f.endsWith('.json'));
let engineCount = 0;
for (const file of engineFiles) {
  const path = join(catalog, 'engines', file);
  const engines = readJson(path) as { id: string; name: string; fuel?: string; displacementL?: number; power?: { ps?: number; kw?: number; hp?: number } }[];
  for (const e of engines) {
    engineCount++;
    const ps = e.power?.ps;
    if (ps === undefined) continue;
    if (POWER_EXCEPTIONS.has(e.id)) {
      push('istisna', 'yuksek-guc', path, `${e.id}: ${ps} PS kabul edildi`);
      continue;
    }
    if (ps > 1600) push('kesin', 'guc', path, `${e.id} "${e.name}" ${ps} PS. 4 haneli parantez cc veya kasa kodu olabilir.`);
    else if (ps >= 900 && e.displacementL === undefined && !e.fuel) push('yuksek', 'guc', path, `${e.id} "${e.name}" ${ps} PS, hacim ve yakıt yok.`);
    else if (ps > 800 && e.fuel !== 'electric' && e.fuel !== 'plug-in-hybrid') push('inceleme', 'guc', path, `${e.id} "${e.name}" ${ps} PS`);
    if (/^\d{3,4} PS$/.test(e.name) && e.displacementL === undefined && ps >= 900) {
      push('yuksek', 'yalniz-sayi', path, `${e.id} yalnızca sayıdan oluşuyor`);
    }
  }
}

const modelFiles = walk(join(catalog, 'models'));
const byBrand = new Map<string, Map<string, string[]>>();
let emptyModels = 0;
for (const path of modelFiles) {
  const rel = path.slice(catalog.length + 1).replaceAll('\\', '/');
  const brand = rel.split('/')[1] ?? '';
  const model = readJson(path) as { slug: string; name: string; generations?: { variants?: unknown[] }[] };
  const compact = model.slug.replace(/[^a-z0-9]/g, '');
  const bucket = byBrand.get(brand) ?? new Map<string, string[]>();
  const list = bucket.get(compact) ?? [];
  list.push(model.slug);
  bucket.set(compact, list);
  byBrand.set(brand, bucket);
  const variants = (model.generations ?? []).reduce((n, g) => n + (g.variants?.length ?? 0), 0);
  if (variants === 0) {
    emptyModels++;
    push('inceleme', 'bos-model', rel, model.slug);
  }
  if (BRAND_AS_MODEL.has(model.slug) && model.slug !== brand) push('kesin', 'yanlis-marka', rel, `${brand} altında model "${model.name}"`);
  if (TRIM_MODEL.test(model.slug) && !/^(rs|st|gti|type-r)/.test(model.slug)) push('yuksek', 'donanim-model', rel, model.name);
}

let duplicateGroups = 0;
for (const [brand, bucket] of byBrand) {
  for (const [compact, slugs] of bucket) {
    if (slugs.length < 2) continue;
    if (compact.length < 2) continue;
    duplicateGroups++;
    push('yuksek', 'yazim-tekrari', `models/${brand}`, `${slugs.join(' = ')} (${compact})`);
  }
}

const brands = readJson(join(catalog, 'brands.json')) as { slug: string }[];
const visibility = readFileSync(join(root, 'src', 'lib', 'catalog', 'visibility.ts'), 'utf8');
const explorer = readFileSync(join(root, 'src', 'scripts', 'catalog-explorer.ts'), 'utf8');
const explorerView = readFileSync(join(root, 'src', 'components', 'catalog', 'CatalogExplorer.astro'), 'utf8');
const marketSrc = readFileSync(join(root, 'src', 'lib', 'catalog', 'market.ts'), 'utf8');
const aliasSrc = readFileSync(join(root, 'src', 'lib', 'catalog', 'aliases.ts'), 'utf8');
const genImport = readFileSync(join(root, 'scripts', 'import', 'generations', 'build.ts'), 'utf8');

if (explorer.includes('Tüm dünya') || explorerView.includes('Tüm dünya') || /MARKET_VIEWS/.test(explorer + explorerView)) {
  push('kesin', 'pazar-arayuz', 'src/components/catalog', 'Kullanıcı arayüzünde Avrupa veya dünya pazarı seçimi var');
}
if (!marketSrc.includes("export type MarketView = 'tr'")) {
  push('kesin', 'pazar-kod', 'src/lib/catalog/market.ts', 'Kullanıcı pazar tipi yalnızca Türkiye olmalı');
}
if (marketSrc.includes("'world'") || marketSrc.includes('Tüm dünya')) {
  push('kesin', 'pazar-kod', 'src/lib/catalog/market.ts', 'Dünya pazarı kullanıcı modu duruyor');
}
if (!visibility.includes("'togg'") || !visibility.includes("'nissan/rogue'")) {
  push('kesin', 'gorunurluk', 'src/lib/catalog/visibility.ts', 'Togg ana listede veya Rogue gizli listede değil');
}
if (!genImport.includes('Motor varyantı bu aktarmayla üretilmez')) {
  push('kesin', 'import', 'scripts/import/generations/build.ts', 'Wikipedia aktarması motor varyantı üretmemeli');
}

const aliasPairs = [...aliasSrc.matchAll(/brand: '([^']+)', from: '([^']+)', to: '([^']+)'/g)];
if (aliasPairs.length < 10) push('kesin', 'alias', 'src/lib/catalog/aliases.ts', 'Eski model yönlendirmeleri eksik');
for (const [, brand, from, to] of aliasPairs) {
  if (from === to) push('kesin', 'alias', `${brand}/${from}`, 'Yönlendirme kendine dönüyor');
  const target = join(catalog, 'models', brand, `${to}.json`);
  if (!existsSync(target)) push('kesin', 'alias', `${brand}/${from}`, `Hedef model yok: ${to}`);
  else {
    const data = readJson(target) as { slug: string };
    if (data.slug !== to) push('kesin', 'alias', `${brand}/${to}`, `Dosya slug ${data.slug}`);
  }
}

const fordEngines = readJson(join(catalog, 'engines', 'ford.json')) as { id: string }[];
if (!fordEngines.some((e) => e.id === 'ford-duratorq-20-c346')) {
  push('kesin', 'kronik', 'engines/ford.json', 'ford-duratorq-20-c346 yok');
}

let tsbRefs = 0;
let sold = 0;
let listed = 0;
let imported = 0;
let foreign = 0;
let soldFromTsbOnly = 0;
const foreignLines: string[] = [];
const relationLines: string[] = ['# Türkiye motor–varyant taraması', '', 'Şüpheli satır silinmedi. `listed` resmi satış değildir.', ''];
for (const path of modelFiles) {
  const rel = path.slice(catalog.length + 1).replaceAll('\\', '/');
  const model = readJson(path) as {
    slug: string;
    name: string;
    generations?: {
      slug: string;
      name: string;
      variants?: {
        id: string;
        slug: string;
        engineId: string;
        marketIds?: string[];
        marketAvailability?: { marketId: string; status: string; sourceIds?: string[]; sourceRefs?: string[] }[];
      }[];
    }[];
  };
  const brand = rel.split('/')[1] ?? '';
  for (const g of model.generations ?? []) {
    for (const v of g.variants ?? []) {
      const tr = (v.marketAvailability ?? []).filter((a) => a.marketId === 'tr');
      const rank: Record<string, number> = { sold: 4, listed: 3, imported: 2, unverified: 1, 'not-offered': 0 };
      tr.sort((a, b) => (rank[b.status] ?? 0) - (rank[a.status] ?? 0));
      const best = tr[0]?.status;
      for (const a of v.marketAvailability ?? []) {
        if ((a.sourceIds ?? []).includes('tsb-kasko-deger-listesi')) tsbRefs += a.sourceRefs?.length ?? 0;
      }
      if (best === 'sold') {
        sold++;
        const soldRecs = tr.filter((a) => a.status === 'sold');
        const sources = soldRecs.flatMap((a) => a.sourceIds ?? []);
        if (sources.length === 0 || sources.every((s) => s === 'tsb-kasko-deger-listesi')) {
          soldFromTsbOnly++;
          push('kesin', 'sahte-satis', rel, `${v.id} TSB kaydı resmi satış gibi duruyor`);
        }
      } else if (best === 'listed') listed++;
      else if (best === 'imported') {
        imported++;
        foreignLines.push(`ithal ${brand}/${model.slug} ${v.id}`);
      } else {
        foreign++;
        foreignLines.push(`yabanci ${brand}/${model.slug} ${g.slug}/${v.slug} ${v.engineId} pazar=${(v.marketIds ?? []).join('+') || 'yok'}`);
        push('inceleme', 'turkiye-kaydi-yok', rel, `${v.id} Türkiye ana listesinde değil; veri duruyor, sayfa üretilmez`);
      }
      if (best === 'sold' || best === 'listed') {
        relationLines.push(`- ${brand}/${model.slug} · ${v.engineId} · ${g.slug}/${v.slug} · ${best}`);
      }
    }
  }
}
if (soldFromTsbOnly > 0) {
  /* kesin kayıt yukarıda eklendi */
}
if (tsbRefs !== 15463) push('kesin', 'tsb', 'catalog', `TSB satırı ${tsbRefs}; beklenen 15463`);

const levels: Level[] = ['kesin', 'yuksek', 'inceleme', 'istisna'];
console.log(`Marka ${brands.length} · model dosyası ${modelFiles.length} · motor ${engineCount} · boş model ${emptyModels} · yazım tekrarı grubu ${duplicateGroups}`);
console.log(`Türkiye varyant: satıldı ${sold} · listede ${listed} · ithal ${imported} · Türkiye kaydı yok ${foreign} · TSB satırı ${tsbRefs}`);
const scanDir = join(root, 'data', 'research', 'tr-vehicles');
mkdirSync(scanDir, { recursive: true });
writeFileSync(
  join(scanDir, 'turkiye-motor-varyant.md'),
  [
    ...relationLines,
    '',
    `Ana liste satırı: ${relationLines.length - 4}`,
    `İthal (ana listede değil, veri duruyor): ${imported}`,
    `Türkiye kaydı yok (sayfa üretilmez, veri duruyor): ${foreign}`,
    '',
    '## Türkiye kaydı olmayan veya ithal varyantlar',
    '',
    ...foreignLines.map((line) => `- ${line}`),
    '',
  ].join('\n'),
  'utf8',
);
for (const level of levels) {
  const rows = findings.filter((f) => f.level === level);
  console.log(`\n## ${level} (${rows.length})`);
  for (const f of rows.slice(0, 80)) console.log(`- [${f.kind}] ${f.path}: ${f.detail}`);
  if (rows.length > 80) console.log(`- … ${rows.length - 80} kayıt daha`);
}
const kesin = findings.filter((f) => f.level === 'kesin').length;
if (kesin > 0) process.exitCode = 1;
