/**
 * Katalog denetimi. Şüpheli kaydı silmez; seviyelere ayırır.
 * `npm run catalog:audit`
 *
 * Kesin hata varsa çıkış kodu 1. Diğer seviyeler rapordur.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
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

const brands = readJson(join(catalog, 'brands.json')) as unknown[];
const levels: Level[] = ['kesin', 'yuksek', 'inceleme', 'istisna'];
console.log(`Marka ${brands.length} · model dosyası ${modelFiles.length} · motor ${engineCount} · boş model ${emptyModels} · yazım tekrarı grubu ${duplicateGroups}`);
for (const level of levels) {
  const rows = findings.filter((f) => f.level === level);
  console.log(`\n## ${level} (${rows.length})`);
  for (const f of rows.slice(0, 80)) console.log(`- [${f.kind}] ${f.path}: ${f.detail}`);
  if (rows.length > 80) console.log(`- … ${rows.length - 80} kayıt daha`);
}
const kesin = findings.filter((f) => f.level === 'kesin').length;
if (kesin > 0) process.exitCode = 1;
