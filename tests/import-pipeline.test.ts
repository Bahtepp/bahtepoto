/**
 * İçe aktarma iskeleti: geçici alan şeması, import:check (çakışma ve kanıt kuralları),
 * import:diff raporu ve import:promote (kuru çalıştırma / --write).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyze } from '../scripts/import/lib/analyze.ts';
import { loadRawCatalog, loadStaging } from '../scripts/import/lib/io.ts';
import { promote } from '../scripts/import/lib/promote.ts';
import { analyzeForReport, renderDiffReport } from '../scripts/import/lib/report.ts';
import { provenanceSchema, stagingFileSchema } from '../scripts/import/lib/staging-schema.ts';
import { gen, makeCatalog, makeStaging, provFor, stagingFile } from './import-helpers.ts';

const run = (files: Record<string, unknown>) => {
  const catalogDir = makeCatalog();
  const stagingDir = makeStaging(files);
  return { catalogDir, stagingDir, a: analyze(loadRawCatalog(catalogDir), loadStaging(stagingDir)) };
};
const kindOf = (a: ReturnType<typeof analyze>, id: string) => a.changes.find((c) => c.id === id)?.kind;

/** Mk6 kaynaklı kayıtla çelişir, Mk7 değişir, Mk8 yeni. */
const standard = () => stagingFile([gen('mk6', 2008, 2013), gen('mk7', 2012, 2021), gen('mk8', 2019, 2024)]);

describe('geçici alan şeması', () => {
  test('kaynak kökeni sourceId, retrievedAt ve sourceField ister', () => {
    assert.equal(provenanceSchema.safeParse({ kind: 'source', sourceId: 'x', retrievedAt: '2026-10-15' }).success, false);
    assert.equal(provenanceSchema.safeParse({ kind: 'source', sourceId: 'x', retrievedAt: '2026-10-15', sourceField: 'Q1#P580' }).success, true);
  });

  test('yer tutucu kökeni açıklama (note) ister', () => {
    assert.equal(provenanceSchema.safeParse({ kind: 'placeholder' }).success, false);
    assert.equal(provenanceSchema.safeParse({ kind: 'placeholder', note: 'kaynak vermiyor' }).success, true);
  });

  test('hedef dosya models/<marka>/<model>.json biçiminde olmalı', () => {
    const f = stagingFile([]);
    f.candidates![0]!.target = '../brands.json';
    assert.equal(stagingFileSchema.safeParse(f).success, false);
  });

  test('kayıt listesi biçimindeki raporlar (örn. tsb/belirsiz.json) aday dosyası sayılmaz', () => {
    const { a } = run({ 'tsb/belirsiz.json': [{ brand: 'FORD', reason: 'test' }] });
    assert.deepEqual(a.errors, []);
    assert.equal(a.staging.length, 0);
  });

  test('adapter alanı klasör adıyla aynı olmalı', () => {
    const { a } = run({ 'baska/golf.json': stagingFile([]) });
    assert.ok(a.errors.some((e) => e.includes('klasör adıyla')));
  });
});

describe('import:check', () => {
  test('yeni / değişen / çelişen / değişmeyen kayıtları ayırır', () => {
    const { a } = run({ 'test/golf.json': standard() });
    assert.deepEqual(a.errors, []);
    assert.equal(kindOf(a, 'volkswagen-golf'), 'unchanged');
    assert.equal(kindOf(a, 'volkswagen-golf-mk6'), 'conflicting');
    assert.equal(kindOf(a, 'volkswagen-golf-mk7'), 'changed');
    assert.equal(kindOf(a, 'volkswagen-golf-mk8'), 'new');
  });

  test('kaynaklı kayıtla çelişen aday uygulanmaz; değişen kayıtta adayın vermediği alanlar korunur', () => {
    const { a } = run({ 'test/golf.json': standard() });
    const gens = a.merged.models.get('models/volkswagen/golf.json')!.generations as Record<string, any>[];
    const byId = (id: string) => gens.find((g) => g.id === id)!;
    assert.equal(byId('volkswagen-golf-mk6').labelPeriod.end.year, 2012, 'Mk6 kaynaklı değer korunmalı');
    assert.equal(byId('volkswagen-golf-mk7').labelPeriod.end.year, 2021);
    assert.equal(byId('volkswagen-golf-mk7').revisions.length, 1, 'mevcut makyaj dönemi silinmemeli');
    assert.ok(byId('volkswagen-golf-mk8'));
  });

  test('meta alanlar (status, notes) farklı ama veri aynıysa kayıt değişmemiş sayılır', () => {
    const { a } = run({ 'test/golf.json': stagingFile([gen('mk6', 2008, 2012, { status: 'unverified', notes: 'başka not' })]) });
    assert.equal(kindOf(a, 'volkswagen-golf-mk6'), 'unchanged');
  });

  test('iki staging dosyası aynı kaydı farklı değerlerle verirse hata', () => {
    const { a } = run({
      'test/golf.json': stagingFile([gen('mk8', 2019, 2024)]),
      'diger/golf.json': stagingFile([gen('mk8', 2020, 2024)], { adapter: 'diger' }),
    });
    assert.ok(a.errors.some((e) => e.startsWith('çakışma: "volkswagen-golf-mk8"')), a.errors.join('\n'));
  });

  test('kökeni olmayan alan hatadır', () => {
    const g = gen('mk8', 2019, 2024);
    const prov = provFor(g);
    delete prov['labelPeriod.start.year'];
    const f = stagingFile([g], { provenance: { 'volkswagen-golf': {}, 'volkswagen-golf-mk8': prov } });
    const { a } = run({ 'test/golf.json': f });
    assert.ok(a.errors.some((e) => e.includes('"labelPeriod.start.year" alanının kökeni')));
    assert.ok(a.errors.some((e) => e.includes('"slug" alanının kökeni')), 'model alanları da köken ister');
  });

  test('kökendeki kaynak kaydın sourceIds listesinde olmalı', () => {
    const g = gen('mk8', 2019, 2024, { sourceIds: [] });
    const { a } = run({ 'test/golf.json': stagingFile([g]) });
    assert.ok(a.errors.some((e) => e.includes('sourceIds listesinde yok')));
  });

  test('yer tutucu içeren kayıt "sourced" olamaz ve notes ister', () => {
    const g = gen('mk8', 2019, null, { status: 'sourced' });
    const prov = { ...provFor(g), 'labelPeriod.end': { kind: 'placeholder' as const, note: 'bitiş yok' } };
    const f = stagingFile([g], { provenance: { 'volkswagen-golf': provFor({ brandId: 1, slug: 1, name: 1 }), 'volkswagen-golf-mk8': prov } });
    const { a } = run({ 'test/golf.json': f });
    assert.ok(a.errors.some((e) => e.includes('yer tutucu alan içeren kayıt "sourced" olamaz')));
    assert.ok(a.errors.some((e) => e.includes('"notes" alanı yer tutucuları açıklamalı')));
  });

  test('birleştirilmiş katalog mevcut şemalar ve validateCatalog ile denetlenir', () => {
    const bad = gen('mk8', 2019, 2024, { labelPeriod: { marketId: 'mars', basis: 'production', start: { year: 2019 }, end: { year: 2024 } } });
    const { a } = run({ 'test/golf.json': stagingFile([bad]) });
    assert.ok(a.errors.some((e) => e.startsWith('bütünlük:') && e.includes('bilinmeyen pazar "mars"')), a.errors.join('\n'));

    const invalid = gen('mk8', 2019, 2024, { status: 'belki' });
    const r2 = run({ 'test/golf.json': stagingFile([invalid]) });
    assert.ok(r2.a.errors.some((e) => e.startsWith('models/volkswagen/golf.json: generations.')), r2.a.errors.join('\n'));
  });

  test('ardışık nesillerin yılları üst üste binerse uyarır', () => {
    const { a } = run({ 'test/golf.json': standard() });
    assert.ok(a.warnings.some((w) => w.includes('"volkswagen-golf-mk7" bitişi (2021)')));
  });
});

describe('import:diff', () => {
  test('rapor yeni, değişen ve çelişen kayıtları alan bazında köken bilgisiyle gösterir', () => {
    const catalogDir = makeCatalog();
    const stagingDir = makeStaging({ 'test/golf.json': standard() });
    const md = renderDiffReport(analyzeForReport(loadRawCatalog(catalogDir), loadStaging(stagingDir)), 'test');
    assert.match(md, /\| 1 \| 1 \| 1 \| 1 \| 0 \|/); // yeni, değişen, çelişen, değişmeyen, hata
    assert.match(md, /### Çelişen kayıtlar \(1\)/);
    assert.match(md, /#### Nesil `volkswagen-golf-mk7` — Değişen/);
    assert.match(md, /\| `labelPeriod\.end\.year` \| `2020` \| `2021` \| kaynak · `test#labelPeriod\.end\.year`/);
    assert.match(md, /mevcut kaynaklı kayıtla çelişiyor/);
  });

  test('rapor deterministiktir', () => {
    const catalogDir = makeCatalog();
    const stagingDir = makeStaging({ 'test/golf.json': standard() });
    const render = () => renderDiffReport(analyzeForReport(loadRawCatalog(catalogDir), loadStaging(stagingDir)), 'test');
    assert.equal(render(), render());
  });
});

describe('import:promote', () => {
  const golfPath = (dir: string) => join(dir, 'models', 'volkswagen', 'golf.json');

  test('varsayılan kuru çalıştırmadır: katalog dosyaları değişmez', () => {
    const catalogDir = makeCatalog();
    const before = readFileSync(golfPath(catalogDir), 'utf8');
    const r = promote({ catalogDir, stagingDir: makeStaging({ 'test/golf.json': standard() }) });
    assert.equal(r.written, false);
    assert.deepEqual(r.files, ['models/volkswagen/golf.json']);
    assert.equal(readFileSync(golfPath(catalogDir), 'utf8'), before);
  });

  test('--write yalnızca uygulanabilir kayıtları yazar; çelişen kaydı yazmaz', () => {
    const catalogDir = makeCatalog();
    const r = promote({ catalogDir, stagingDir: makeStaging({ 'test/golf.json': standard() }) }, { write: true });
    assert.equal(r.written, true);
    const golf = JSON.parse(readFileSync(golfPath(catalogDir), 'utf8'));
    const ids = golf.generations.map((g: { id: string }) => g.id);
    assert.deepEqual(ids, ['volkswagen-golf-mk6', 'volkswagen-golf-mk7', 'volkswagen-golf-mk8']);
    assert.equal(golf.generations[0].labelPeriod.end.year, 2012);
    assert.equal(golf.generations[1].labelPeriod.end.year, 2021);
    // Yazılan katalog yeniden denetimden geçer.
    assert.deepEqual(analyze(loadRawCatalog(catalogDir), []).errors, []);
  });

  test('yer tutucu içeren aday --accept-placeholders olmadan yazılmaz', () => {
    const g = gen('mk8', 2019, null, { notes: 'Bitiş kaynakta yok.' });
    const prov = { ...provFor(g), 'labelPeriod.end': { kind: 'placeholder' as const, note: 'bitiş yok' } };
    const f = stagingFile([g], { provenance: { 'volkswagen-golf': provFor({ brandId: 1, slug: 1, name: 1 }), 'volkswagen-golf-mk8': prov } });
    const catalogDir = makeCatalog();
    const stagingDir = makeStaging({ 'test/golf.json': f });

    const blocked = promote({ catalogDir, stagingDir }, { write: true });
    assert.deepEqual(blocked.files, []);
    assert.match(blocked.analysis.changes.find((c) => c.id === 'volkswagen-golf-mk8')!.skipReason!, /accept-placeholders/);

    const accepted = promote({ catalogDir, stagingDir }, { write: true, acceptPlaceholders: true });
    assert.deepEqual(accepted.files, ['models/volkswagen/golf.json']);
  });

  test('lisansı yayın için doğrulanmamış kaynak yazılmaz', () => {
    const catalogDir = makeCatalog();
    const r = promote({ catalogDir, stagingDir: makeStaging({ 'test/golf.json': stagingFile([gen('mk8', 2019, 2024)], { publishable: false }) }) }, { write: true });
    assert.deepEqual(r.files, []);
  });

  test('import:check hatası varsa hiçbir şey yazılmaz', () => {
    const catalogDir = makeCatalog();
    const before = readFileSync(golfPath(catalogDir), 'utf8');
    const bad = gen('mk8', 2019, 2024, { labelPeriod: { marketId: 'mars', basis: 'production', start: { year: 2019 }, end: null } });
    const r = promote({ catalogDir, stagingDir: makeStaging({ 'test/golf.json': stagingFile([gen('mk7', 2012, 2021), bad]) }) }, { write: true });
    assert.ok(r.blocked);
    assert.equal(readFileSync(golfPath(catalogDir), 'utf8'), before);
  });
});
