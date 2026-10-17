/**
 * TSB içe aktarma hattı (`npm run import` bunu çağırır; testler geçici klasörlerle çağırır).
 *
 * Sıra: yarım kalmış yazım varsa geri yükle → kaynak dosyaları al ve doğrula (indirme / önbellek / elle
 * bırakılan klasör) → Wikipedia nesilleri + TSB ile yeni kataloğu kur → şema denetimi → mevcut katalogla
 * karşılaştır (TSB satırı, model dosyası veya elle girilmiş kayıt kaybı varsa dur, fark raporu yaz) →
 * yedekli ve günlüklü yazım. Kaynak alınamazsa katalog yüklenmeden çıkılır.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateMerged } from '../lib/analyze.ts';
import { loadRawCatalog, type RawCatalog } from '../lib/io.ts';
import { formatJson, formatRecordList } from '../lib/json-format.ts';
import type { ImportDirs } from '../lib/paths.ts';
import { stabilizeDates } from '../lib/stable-dates.ts';
import { applyChanges, recoverInterrupted, type ApplyOptions, type FileChange } from '../lib/safe-write.ts';
import { applyGenerations, importBlocker, type ModelGenerations } from '../generations/build.ts';
import { buildFromTsb, stripTsb, type BuildResult } from './build.ts';
import { blockers, compareImport, diffReport, type ImportDiff } from './guard.ts';
import { cachedSource, latestCached, MIN_ROWS, readSources, SourceError, stageDownload, stageInbox, type FetchLike, type StagedSource } from './source.ts';

export interface ImportOptions {
  dirs: ImportDirs;
  /** Kaynak: `online` indirir, `offline` önbelleği kullanır, `inbox` elle bırakılan klasörü alır. */
  source: 'online' | 'offline' | 'inbox';
  inboxDir?: string;
  write: boolean;
  /** TSB satırı / model dosyası kaybını açıkça onaylar (elle girilmiş kayıtları kapsamaz). */
  allowDeletions?: boolean;
  withoutGenerations?: boolean;
  date: string;
  fetchImpl?: FetchLike;
  minRows?: number;
  /** Testler için yazım kesintisi benzetimi. */
  applyOptions?: ApplyOptions;
}

export interface ImportOutcome {
  status: 'written' | 'dry-run' | 'blocked' | 'invalid';
  written: string[];
  diff: ImportDiff;
  reasons: string[];
  recovered?: string;
  backup?: string;
}

/** Yazım yedekleri (git dışı). */
export const backupRoot = (dirs: ImportDirs) => join(dirs.cacheDir, 'yedek', 'katalog');

/** Kaynak dosyaları seçilen yoldan alır. Hata SourceError olarak fırlar; katalog hiç okunmamıştır. */
export async function sourceFiles(o: ImportOptions): Promise<StagedSource> {
  const base = join(o.dirs.cacheDir, 'tsb');
  const minRows = o.minRows ?? MIN_ROWS;
  if (o.source === 'inbox') return stageInbox(o.inboxDir!, base, o.date, minRows);
  if (o.source === 'offline') {
    const files = latestCached(base, minRows);
    if (files.length === 0) throw new SourceError('Önbellekte geçerli TSB dosyası yok; --offline olmadan veya --elle ile çalıştırın.');
    return cachedSource(files);
  }
  return stageDownload(base, o.date, o.fetchImpl, minRows);
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
    `| Yalnızca TSB kaynaklı model | ${s.models} |`,
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

/** Eksik nesil (kasa) ve motor eşleştirmeleri: her çalıştırmada güncel liste. */
function gapsReport(catalog: RawCatalog): string {
  type G = { slug: string; name: string; code?: string; revisions?: unknown[]; variants: { engineId: string; revisionMapping: string; marketAvailability?: { marketId: string }[] }[] };
  const brandName = new Map(catalog.brands.map((b) => [String(b.id), String(b.name)]));
  const engines = new Map([...catalog.engines.values()].flat().map((e) => [String(e.id), e]));
  const noGen: [string, string, number, number][] = [];
  const unknownRev: string[] = [];
  const hintGens: string[] = [];
  for (const m of catalog.models.values()) {
    const gens = (m.generations as G[] | undefined) ?? [];
    const bucket = gens.find((g) => g.slug === 'nesil-belirlenmedi');
    if (bucket) noGen.push([brandName.get(String(m.brandId)) ?? String(m.brandId), String(m.name), bucket.variants.length, gens.length - 1]);
    for (const g of gens) {
      if (/^nesil-\d+$/.test(g.slug)) hintGens.push(`${brandName.get(String(m.brandId))} ${g.name}`);
      if ((g.revisions ?? []).length > 0) {
        const n = g.variants.filter((v) => v.revisionMapping === 'unknown' && v.marketAvailability?.some((a) => a.marketId === 'tr')).length;
        if (n) unknownRev.push(`${brandName.get(String(m.brandId))} ${g.name}: ${n} Türkiye motorunun makyaj dönemi bilinmiyor`);
      }
    }
  }
  const byBrand = new Map<string, { total: number; fuel: number; power: number; disp: number }>();
  for (const e of engines.values()) {
    if (!((e.sourceIds as string[] | undefined) ?? []).includes('tsb-kasko-deger-listesi')) continue;
    const b = brandName.get(String(e.brandId)) ?? String(e.brandId);
    const s = byBrand.get(b) ?? { total: 0, fuel: 0, power: 0, disp: 0 };
    s.total++;
    if (!e.fuel) s.fuel++;
    if (!e.power) s.power++;
    if (e.displacementL === undefined && e.fuel !== 'electric') s.disp++;
    byBrand.set(b, s);
  }
  const variantsNoGen = noGen.reduce((a, x) => a + x[2], 0);
  return [
    '# Eksik kasa (nesil) ve motor eşleştirmeleri',
    '',
    '`npm run catalog:update` her çalıştığında yeniden üretilir. Katalogda model dosyasına kaynaklı nesil eklendikçe',
    'TSB satırları o nesillere kendiliğinden eşlenir ve bu liste kısalır.',
    '',
    `## Nesli belirlenemeyen varyantlar (${variantsNoGen} varyant, ${noGen.length} model)`,
    '',
    '| Marka | Model | Nesli belirlenemeyen varyant | Bilinen nesil |',
    '|---|---|---|---|',
    ...noGen.sort((a, b) => b[2] - a[2] || a[0].localeCompare(b[0], 'tr')).map(([b, m, n, k]) => `| ${b} | ${m} | ${n} | ${k} |`),
    '',
    `## Yalnızca TSB ipucundan oluşturulan nesiller (${hintGens.length}; kasa kodu, makyaj dönemi ve üretim yılları doğrulanmadı)`,
    '',
    ...hintGens.sort((a, b) => a.localeCompare(b, 'tr')).map((x) => `- ${x}`),
    '',
    `## Makyaj dönemi eşleşmesi bilinmeyen Türkiye motorları (${unknownRev.length} nesil)`,
    '',
    ...(unknownRev.length ? unknownRev.map((x) => `- ${x}`) : ['Yok.']),
    '',
    '## Motor bilgisi eksik TSB motorları (tip adında yazmayan alanlar)',
    '',
    '| Marka | Motor | Yakıt yok | Güç yok | Hacim yok |',
    '|---|---|---|---|---|',
    ...[...byBrand].sort((a, b) => b[1].fuel + b[1].power - (a[1].fuel + a[1].power)).map(([b, s]) => `| ${b} | ${s.total} | ${s.fuel} | ${s.power} | ${s.disp} |`),
    '',
  ].join('\n');
}


/** Yeni kataloğu dosya değişikliklerine çevirir (yalnızca içeriği değişen dosyalar). */
export function planChanges(dir: string, before: RawCatalog, after: RawCatalog): FileChange[] {
  const changes: FileChange[] = [];
  const put = (rel: string, content: string) => {
    const full = join(dir, rel);
    if (existsSync(full) && readFileSync(full, 'utf8') === content) return;
    changes.push({ rel, content });
  };
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const prev = (rel: string) => (existsSync(join(dir, rel)) ? readFileSync(join(dir, rel), 'utf8') : undefined);
  if (!same(before.brands, after.brands)) put('brands.json', formatRecordList(after.brands, prev('brands.json')));
  if (!same(before.sources, after.sources)) put('sources.json', formatJson(after.sources));
  if (!same(before.markets, after.markets)) put('markets.json', formatJson(after.markets));
  for (const [f, list] of after.engines) if (!same(before.engines.get(f), list)) put(`engines/${f}`, formatRecordList(list, prev(`engines/${f}`)));
  for (const [f, m] of after.models) if (!same(before.models.get(f), m)) put(f, formatJson(m));
  for (const f of before.models.keys()) if (!after.models.has(f) && existsSync(join(dir, f))) changes.push({ rel: f, content: null });
  return changes;
}

export async function runTsbImport(opts: ImportOptions): Promise<ImportOutcome> {
  // Önceki çalıştırma yazım sırasında kesildiyse önce tutarlı katalog geri yüklenir.
  const recovered = recoverInterrupted(opts.dirs.catalogDir, backupRoot(opts.dirs));
  if (recovered) console.warn(`Yarım kalmış yazım bulundu; önceki katalog geri yüklendi (${recovered}).`);
  const source = await sourceFiles(opts);
  let outcome: ImportOutcome;
  try {
    outcome = await importWith(opts, source.files);
  } catch (e) {
    source.discard();
    throw e;
  }
  // Yeni kaynak dosyaları yalnızca aktarma güvenli bulunduysa önbelleğe girer.
  if (outcome.status === 'written' || outcome.status === 'dry-run') source.commit();
  else source.discard();
  return { ...outcome, recovered };
}

async function importWith(opts: ImportOptions, sourcePaths: string[]): Promise<ImportOutcome> {
  const { dirs, date } = opts;
  const recovered = undefined;
  const files = [...sourcePaths].sort((a, b) => a.split(/[\\/]/).pop()!.localeCompare(b.split(/[\\/]/).pop()!));
  const rows = readSources(files, opts.minRows ?? MIN_ROWS);
  const raw = loadRawCatalog(dirs.catalogDir);
  const names = files.map((f) => f.split(/[\\/]/).pop()!.replace(/R\d*\.xlsx$/i, '')).map((n) => `${n.slice(0, 4)}-${n.slice(4, 6)}`);

  // Wikipedia nesilleri (data/staging/wikipedia/generations.json): çelişkisiz ve kimliği açıkça eşleşen
  // modellerin nesilleri eklenir; önceki Wikipedia nesilleri her çalıştırmada temizlenip yeniden kurulur.
  // `--without-generations` bütün Wikipedia nesillerini geri alır.
  const genFile = join(dirs.stagingDir, 'wikipedia', 'generations.json');
  const genStaged: ModelGenerations[] = !opts.withoutGenerations && existsSync(genFile) ? (JSON.parse(readFileSync(genFile, 'utf8')) as { models: ModelGenerations[] }).models : [];
  const brandName = new Map(raw.brands.map((b) => [String(b.id), String(b.name)]));
  const excluded: { model: string; reason: string }[] = [];
  const accepted = genStaged.filter((mg) => {
    const m = raw.models.get(mg.modelFile);
    if (!m || mg.status === 'skipped-curated' || mg.status === 'not-found' || mg.status === 'no-generations') return false;
    const why = importBlocker(mg, brandName.get(String(m.brandId)) ?? '', String(m.name));
    if (why) excluded.push({ model: mg.modelFile.replace(/^models\/|\.json$/g, ''), reason: why });
    return !why;
  });
  const withGens = applyGenerations(stripTsb(raw), accepted, date);
  console.log(`Wikipedia nesilleri: ${withGens.added} nesil, ${withGens.models} model eklendi · çelişki/kimlik nedeniyle dışarıda ${excluded.length} model`);

  const blockedSpans = new Map(accepted.filter((mg) => (mg.blockedSpans ?? []).length > 0).map((mg) => [mg.modelFile, mg.blockedSpans!]));
  const result = buildFromTsb(withGens.catalog, rows, {
    blockedSpans,
    today: date,
    sourceTitle: `TSB Kasko Değer Listesi (${names.join(', ')})`,
    sourceNotes:
      'Türkiye Sigorta Birliği\'nin yayımladığı kasko değer listesi. Yalnızca araç tanımları (marka, tip adı, tip kodu) ve tipin listede yer aldığı MODEL YILLARI kullanıldı; fiyat değerleri kullanılmadı. Liste, Türkiye pazarında bulunan araçları gösterir; tek başına resmi distribütör satışını kanıtlamaz.',
  });
  // İçeriği değişmeyen kayıtlar eski tarihini korur (aynı veri başka gün aktarılınca dosya değişmez).
  result.merged = stabilizeDates(raw, result.merged);
  const errors = validateMerged(result.merged);

  const stagingDir = join(dirs.stagingDir, 'tsb');
  mkdirSync(stagingDir, { recursive: true });
  mkdirSync(join(dirs.stagingDir, 'wikipedia'), { recursive: true });
  // Neden belirsiz: satır ve model sayıları ("kaynaklı nesil yok" toplayıcı durumuna göre ayrıntılandırılır)
  const genStatus = new Map(genStaged.map((mg) => [mg.modelFile.replace(/^models\/|\.json$/g, ''), mg.status as string]));
  const excludedWhy = new Map(excluded.map((x) => [x.model, x.reason.startsWith('kaynakta çelişki') ? 'kaynakta çelişki' : 'Wikipedia maddesi modelle eşleşmedi (adlandırma farkı / türev model)']));
  const reasonRows = new Map<string, { rows: number; models: Set<string> }>();
  for (const u of result.unassignedReasons) {
    let reason = u.reason;
    if (reason === 'modelin kaynaklı nesli yok') {
      const st = genStatus.get(u.model);
      reason = excludedWhy.get(u.model)
        ? `kaynaklı nesil yok — ${excludedWhy.get(u.model)}`
        : st === 'not-found'
          ? 'kaynaklı nesil yok — Wikipedia maddesi bulunamadı'
          : st === 'no-generations'
            ? 'kaynaklı nesil yok — madde var, nesil bilgi kutusu yok'
            : 'kaynaklı nesil yok — diğer';
    }
    const r = reasonRows.get(reason) ?? { rows: 0, models: new Set<string>() };
    r.rows++;
    r.models.add(u.model);
    reasonRows.set(reason, r);
  }
  const reasonSection = [
    '## Nesli belirlenemeyen TSB satırları: nedenler',
    '',
    '| Neden | TSB satırı | Model |',
    '|---|---|---|',
    ...[...reasonRows].sort((x, y) => y[1].rows - x[1].rows).map(([k, v]) => `| ${k} | ${v.rows} | ${v.models.size} |`),
    '',
  ];

  const genSection = [
    '## Wikipedia nesilleri',
    '',
    '| | Sayı |',
    '|---|---|',
    `| Eklenen nesil | ${withGens.added} |`,
    `| Nesil eklenen model | ${withGens.models} |`,
    `| Çelişki veya belirsiz model kimliği nedeniyle dışarıda bırakılan model (\`data/staging/wikipedia/DISARIDA.md\`) | ${excluded.length} |`,
    `| Tip adındaki kasa koduyla eşlenen varyant | ${result.stats.matchedByCode} |`,
    `| Kaynaktaki motor (hacim + yakıt) bilgisiyle eşlenen varyant | ${result.stats.matchedByEngine} |`,
    `| Bütün model yılları yalnızca tek neslin dönemine düşen varyant | ${result.stats.matchedByContainment} |`,
    '',
    'Not: Aynı motor birden çok nesilde satıldıysa her nesil için ayrı varyant oluşur (bir TSB satırı yalnızca bir',
    'varyanta girer). Nesil eklendikçe toplam varyant sayısının artması bu yüzdendir.',
    '',
  ];
  writeFileSync(join(stagingDir, 'RAPOR.md'), `${report(result, files, errors)}\n${genSection.join('\n')}\n${reasonSection.join('\n')}`, 'utf8');
  writeFileSync(join(stagingDir, 'belirsiz.json'), formatRecordList(result.rejects), 'utf8');
  writeFileSync(join(stagingDir, 'EKSIKLER.md'), gapsReport(result.merged), 'utf8');
  writeFileSync(join(dirs.stagingDir, 'wikipedia', 'DISARIDA.md'), ['# Wikipedia nesilleri: dışarıda bırakılan modeller', '', 'Bu modellerin nesilleri kataloğa otomatik aktarılmadı (kaynakta çelişki veya model kimliği açık değil).', '', ...excluded.map((x) => `- **${x.model}**: ${x.reason}`), ''].join('\n'), 'utf8');


  const diff = compareImport(raw, result.merged);
  const reasons = errors.length ? [`şema/bütünlük denetimi ${errors.length} hata buldu`] : blockers(diff, opts.allowDeletions ?? false);
  writeFileSync(join(stagingDir, 'FARK.md'), diffReport(diff, reasons, files), 'utf8');

  const s = result.stats;
  console.log(`Marka ${s.brands} · yeni model ${s.models} · yeni nesil ${s.generations} · yeni motor ${s.engines} · yeni varyant ${s.variants} · belirsiz ${result.rejects.length}`);
  console.log(`TSB satırı: katalogda ${diff.refsBefore} → ${diff.refsAfter} (düşen ${diff.lostRefs.length}, yeni ${diff.gainedRefs}) · silinecek model ${diff.deletedModels.length} · değişen elle girilmiş kayıt ${diff.curatedChanged.length}`);
  if (errors.length) {
    for (const e of errors.slice(0, 30)) console.error(`  HATA: ${e}`);
    return { status: 'invalid', written: [], diff, reasons, recovered };
  }
  if (reasons.length) return { status: 'blocked', written: [], diff, reasons, recovered };
  if (!opts.write) return { status: 'dry-run', written: [], diff, reasons, recovered };
  const changes = planChanges(dirs.catalogDir, raw, result.merged);
  const backup = applyChanges(dirs.catalogDir, backupRoot(dirs), changes, opts.applyOptions);
  return { status: 'written', written: changes.map((c) => (c.content === null ? `${c.rel} (silindi)` : c.rel)), diff, reasons, recovered, backup };
}
