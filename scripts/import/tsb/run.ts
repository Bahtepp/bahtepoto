/**
 * `npm run catalog:tsb [-- --write] [--offline] [--refresh]`
 * `npm run catalog:update`  (= indir + ayrıştır + normalize et + birleştir + eşleştir + kataloğa yaz + rapor)
 *
 * Kaynak: TSB Kasko Değer Listesi (https://www.tsb.org.tr/tr/kasko-deger-listesi). Sayfanın
 * kendi "Dosyayı İndir" ve "Arşiv" düğmelerinin kullandığı herkese açık dosyalar indirilir:
 * en güncel liste + arşivden Ocak 2022 listesi (model yılı kapsamı 2008'e uzansın diye).
 * Fiyat değerleri kullanılmaz; yalnızca marka, tip adı, tip kodu ve listelendiği model yılları.
 *
 * Çıktılar:
 * - data/staging/tsb/RAPOR.md         Kısa sonuç raporu (sayılar)
 * - data/staging/tsb/belirsiz.json    Aktarılamayan / belirsiz satırlar ve nedenleri
 * - src/data/catalog/…                `--write` ile (katalog şemaları + bütünlük denetimi geçerse)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { validateMerged } from '../lib/analyze.ts';
import { loadRawCatalog, type RawCatalog } from '../lib/io.ts';
import { formatJson, formatRecordList } from '../lib/json-format.ts';
import { DEFAULT_DIRS, today } from '../lib/paths.ts';
import { readFirstSheet } from '../lib/xlsx.ts';
import { buildFromTsb, type BuildResult } from './build.ts';
import { mergeRows, parseSheet } from './parse.ts';

const BASE = 'https://www.tsb.org.tr';
const USER_AGENT = 'bahtepoto-import/0.1 (https://bahtepoto.com; katalog veri içe aktarma)';
/** Arşivden alınacak listeler (Yıl, Ay kimliği; TSB'de Ocak = 2). Arşiv yalnızca son 4 yılı tutar. */
const ARCHIVES = [{ year: 2022, monthId: 2 }];

const { values } = parseArgs({
  options: { write: { type: 'boolean' }, offline: { type: 'boolean' }, refresh: { type: 'boolean' } },
});

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { 'User-Agent': USER_AGENT, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
  if (!res.ok) throw new Error(`TSB ${path}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function download(cacheDir: string, filePath: string): Promise<string> {
  const name = filePath.split('/').pop()!;
  const out = join(cacheDir, name);
  if (existsSync(out) && !values.refresh) return out;
  const res = await fetch(`${BASE}${filePath}`, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`TSB ${filePath}: HTTP ${res.status}`);
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  console.log(`  indirildi ${name}`);
  return out;
}

async function fetchFiles(): Promise<string[]> {
  const base = join(DEFAULT_DIRS.cacheDir, 'tsb');
  if (values.offline) {
    const dates = existsSync(base) ? readdirSync(base).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort() : [];
    const dir = dates.at(-1);
    if (!dir) throw new Error('Önbellekte TSB dosyası yok; --offline olmadan çalıştırın.');
    return readdirSync(join(base, dir)).filter((f) => f.endsWith('.xlsx')).sort().map((f) => join(base, dir, f));
  }
  const cacheDir = join(base, today());
  mkdirSync(cacheDir, { recursive: true });
  const latest = await getJson<{ HasError: boolean; Result: string }>('/InsuranceData/GetLatestExcelFile');
  if (latest.HasError || !latest.Result) throw new Error('TSB güncel liste adresi alınamadı');
  const paths = [];
  for (const a of ARCHIVES) {
    const p = await getJson<string | null>(`/InsuranceData/GetInsuranceDataArchiveFile?Year=${a.year}&MonthId=${a.monthId}`);
    if (p) paths.push(p);
    else console.warn(`  uyarı: ${a.year}/${a.monthId} arşivi bulunamadı`);
  }
  paths.push(latest.Result);
  const files = [];
  for (const p of paths) files.push(await download(cacheDir, p));
  return files.sort(); // dosya adları YYYYMM ile başlar: eskiden yeniye
}

function report(r: BuildResult, files: string[], errors: string[]): string {
  const s = r.stats;
  const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
  const lines = [
    '# TSB içe aktarma raporu',
    '',
    `Kaynak dosyalar: ${files.map((f) => `\`${f.split(/[\\/]/).pop()}\``).join(', ')} (TSB Kasko Değer Listesi). Fiyat değerleri kullanılmadı.`,
    '',
    '| | Sayı |',
    '|---|---|',
    `| TSB satırı (tekil marka-tip kodu) | ${s.rows} |`,
    `| Kapsam dışı (ağır vasıta, otobüs, panelvan, karavan, motosiklet …) | ${sum(s.excluded)} |`,
    `| Aktarılan satır | ${s.imported} |`,
    `| Aktarılamayan / belirsiz satır (\`belirsiz.json\`) | ${sum(s.rejected)} |`,
    `| Marka | ${s.brands} |`,
    `| Yeni model | ${s.models} |`,
    `| Yeni nesil grubu (ipucundan: ${s.hintGenerations}, "nesil belirlenmedi": ${s.generations - s.hintGenerations}) | ${s.generations} |`,
    `| Yeni motor (yakıt türü tip adında yazmayan: ${s.fuelUnknownEngines}) | ${s.engines} |`,
    `| Yeni varyant (nesil × motor) | ${s.variants} |`,
    `| — mevcut kataloğun nesillerine eşlenen | ${s.variantsOnExistingGenerations} |`,
    `| — nesli belirlenemeyen | ${s.variantsWithoutGeneration} |`,
    `| Türkiye durumu eklenen mevcut (elle girilmiş) varyant | ${s.existingVariantsEnriched} |`,
    '',
    '## Kapsam dışı bırakılanlar',
    '',
    ...Object.entries(s.excluded).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`),
    '',
    '## Aktarılamayanlar (nedenleriyle `belirsiz.json` içinde)',
    '',
    ...Object.entries(s.rejected).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`),
    '',
    '## Markalar',
    '',
    '| Marka | Model | Varyant |',
    '|---|---|---|',
    ...[...r.perBrand.values()].sort((a, b) => b.variants - a.variants).map((b) => `| ${b.name} | ${b.models} | ${b.variants} |`),
    '',
    '## Denetim',
    '',
    errors.length ? `${errors.length} hata (ilk 50):\n\n${errors.slice(0, 50).map((e) => `- ${e}`).join('\n')}` : 'Katalog şemaları ve bütünlük denetimi geçti.',
    '',
  ];
  return lines.join('\n');
}

function writeCatalog(before: RawCatalog, after: RawCatalog): string[] {
  const dir = DEFAULT_DIRS.catalogDir;
  const written: string[] = [];
  const put = (rel: string, content: string) => {
    const full = join(dir, rel);
    if (existsSync(full) && readFileSync(full, 'utf8') === content) return;
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content, 'utf8');
    written.push(rel);
  };
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const prev = (rel: string) => (existsSync(join(dir, rel)) ? readFileSync(join(dir, rel), 'utf8') : undefined);
  if (!same(before.brands, after.brands)) put('brands.json', formatRecordList(after.brands, prev('brands.json')));
  if (!same(before.sources, after.sources)) put('sources.json', formatJson(after.sources));
  for (const [f, list] of after.engines) if (!same(before.engines.get(f), list)) put(`engines/${f}`, formatRecordList(list, prev(`engines/${f}`)));
  for (const [f, m] of after.models) if (!same(before.models.get(f), m)) put(f, formatJson(m));
  for (const f of before.models.keys()) {
    if (!after.models.has(f) && existsSync(join(dir, f))) {
      unlinkSync(join(dir, f));
      written.push(`${f} (silindi)`);
    }
  }
  return written;
}

// ---------------------------------------------------------------------------
console.log('TSB Kasko Değer Listesi içe aktarma');
const files = await fetchFiles();
const parsed = files.map((f) => {
  const name = f.split(/[\\/]/).pop()!.replace(/\.xlsx$/, '');
  const rows = parseSheet(readFirstSheet(readFileSync(f)), name);
  console.log(`  ${name}: ${rows.length} satır`);
  return rows;
});
const rows = mergeRows(parsed);
const raw = loadRawCatalog(DEFAULT_DIRS.catalogDir);
const names = files.map((f) => f.split(/[\\/]/).pop()!.replace(/R\d*\.xlsx$/, '')).map((n) => `${n.slice(0, 4)}-${n.slice(4, 6)}`);
const result = buildFromTsb(raw, rows, {
  today: today(),
  sourceTitle: `TSB Kasko Değer Listesi (${names.join(', ')})`,
  sourceNotes:
    'Türkiye Sigorta Birliği\'nin yayımladığı kasko değer listesi. Yalnızca araç tanımları (marka, tip adı, tip kodu) ve tipin listede yer aldığı MODEL YILLARI kullanıldı; fiyat değerleri kullanılmadı. Liste, Türkiye pazarında bulunan araçları gösterir; tek başına resmi distribütör satışını kanıtlamaz.',
});
const errors = validateMerged(result.merged);

const stagingDir = join(DEFAULT_DIRS.stagingDir, 'tsb');
mkdirSync(stagingDir, { recursive: true });
writeFileSync(join(stagingDir, 'RAPOR.md'), report(result, files, errors), 'utf8');
writeFileSync(join(stagingDir, 'belirsiz.json'), formatRecordList(result.rejects), 'utf8');

const s = result.stats;
console.log(`Marka ${s.brands} · yeni model ${s.models} · yeni nesil ${s.generations} · yeni motor ${s.engines} · yeni varyant ${s.variants} · belirsiz ${result.rejects.length}`);
if (errors.length) {
  for (const e of errors.slice(0, 30)) console.error(`  HATA: ${e}`);
  console.error(`Denetim ${errors.length} hata buldu; katalog yazılmadı. Ayrıntı: data/staging/tsb/RAPOR.md`);
  process.exitCode = 1;
} else if (values.write) {
  const written = writeCatalog(raw, result.merged);
  console.log(`Kataloğa yazıldı: ${written.length} dosya. Rapor: data/staging/tsb/RAPOR.md`);
} else {
  console.log('KURU ÇALIŞTIRMA: katalog yazılmadı. Yazmak için: npm run catalog:update');
}
