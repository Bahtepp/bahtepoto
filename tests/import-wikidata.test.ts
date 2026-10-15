/**
 * Wikidata bağdaştırıcısı: sabit öğe JSON'larıyla (ağa çıkmadan) normalize kuralları,
 * önbellek davranışı ve depodaki Golf adaylarının durumu.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyze } from '../scripts/import/lib/analyze.ts';
import { loadRawCatalog, loadStaging } from '../scripts/import/lib/io.ts';
import { DEFAULT_DIRS } from '../scripts/import/lib/paths.ts';
import { stagingFileSchema } from '../scripts/import/lib/staging-schema.ts';
import { createWikidataAdapter, normalizeTarget, type WikidataEntity } from '../scripts/import/wikidata/adapter.ts';
import type { WikidataModelTarget } from '../scripts/import/wikidata/config.ts';

const time = (t: string, precision = 9, rank: 'normal' | 'preferred' | 'deprecated' = 'normal') => ({
  rank,
  mainsnak: { snaktype: 'value', datavalue: { value: { time: t, precision } } },
});
const item = (id: string) => ({ rank: 'normal' as const, mainsnak: { snaktype: 'value', datavalue: { value: { id } } } });

function entity(id: string, label: string, opts: { start?: unknown[]; end?: unknown[]; prev?: string; next?: string; brand?: string } = {}): WikidataEntity {
  const claims: Record<string, unknown[]> = {
    P1716: [item(opts.brand ?? 'Q246')],
    P580: opts.start ?? [],
    P582: opts.end ?? [],
  };
  if (opts.prev) claims.P155 = [item(opts.prev)];
  if (opts.next) claims.P156 = [item(opts.next)];
  return { id, lastrevid: 1, labels: { en: { value: label } }, claims } as unknown as WikidataEntity;
}

const target: WikidataModelTarget = {
  file: 'volkswagen-golf',
  brandId: 'volkswagen',
  brandQid: 'Q246',
  model: { id: 'volkswagen-golf', slug: 'golf', name: 'Golf', notes: 'test' },
  labelPattern: /^Volkswagen Golf (Mk(\d+))$/,
  generations: ['Q5', 'Q6', 'Q7', 'Q8'],
  placeholderPeriod: { marketId: 'eu', basis: 'production' },
};

const golfEntities = (): Map<string, WikidataEntity> =>
  new Map([
    ['Q5', entity('Q5', 'Volkswagen Golf Mk5', { start: [time('+2003-01-01T00:00:00Z')], end: [time('+2009-01-01T00:00:00Z')], next: 'Q6' })],
    ['Q6', entity('Q6', 'Volkswagen Golf Mk6', { start: [time('+2008-10-00T00:00:00Z', 10)], end: [time('+2012-00-00T00:00:00Z')], prev: 'Q5', next: 'Q7' })],
    ['Q7', entity('Q7', 'Volkswagen Golf Mk7', { start: [time('+2012-00-00T00:00:00Z')], end: [time('+2021-00-00T00:00:00Z')], prev: 'Q6', next: 'Q8' })],
    ['Q8', entity('Q8', 'Volkswagen Golf Mk8', { start: [time('+2019-00-00T00:00:00Z')], prev: 'Q7' })],
  ]);

type Gen = Record<string, any>;
const gensOf = (f: ReturnType<typeof normalizeTarget>) => f.candidates[0]!.record.generations as Gen[];

describe('Wikidata normalize', () => {
  const file = normalizeTarget(target, golfEntities(), '2026-10-15');
  const gens = gensOf(file);
  const prov = file.candidates[0]!.provenance;

  test('çıktı geçici alan şemasına uyar', () => {
    assert.equal(stagingFileSchema.safeParse(file).success, true);
  });

  test('dört nesil, Wikidata etiketinden ad ve sıra', () => {
    assert.deepEqual(
      gens.map((g) => [g.id, g.name, g.order]),
      [
        ['volkswagen-golf-mk5', 'Golf Mk5', 4],
        ['volkswagen-golf-mk6', 'Golf Mk6', 5],
        ['volkswagen-golf-mk7', 'Golf Mk7', 6],
        ['volkswagen-golf-mk8', 'Golf Mk8', 7],
      ],
    );
  });

  test('makyaj dönemi, varyant ve ek dönem üretilmez', () => {
    for (const g of gens) {
      assert.equal(g.revisions, undefined, `${g.id}: makyaj dönemi üretilmemeli`);
      assert.equal(g.variants, undefined);
      assert.equal(g.periods, undefined);
      assert.match(g.notes, /makyaj dönemi oluşturulmadı/);
    }
  });

  test('kayıtlar unverified; notlar yıl temelinin belirsiz olduğunu açıkça yazar', () => {
    for (const g of gens) {
      assert.equal(g.status, 'unverified');
      assert.match(g.notes, /üretim, satış ya da model yılı olduğunu .* belirtmiyor/);
      assert.match(g.notes, /pazar \(eu\) ve temel \(production\) kaynağa dayanmayan yer tutuculardır/);
    }
  });

  test('pazar ve yıl temeli yer tutucu olarak işaretlenir; yıllar kaynaktan', () => {
    const p = prov['volkswagen-golf-mk7']!;
    assert.equal(p['labelPeriod.marketId']!.kind, 'placeholder');
    assert.equal(p['labelPeriod.basis']!.kind, 'placeholder');
    assert.deepEqual(
      [p['labelPeriod.start.year']!.kind, p['labelPeriod.start.year']!.sourceField],
      ['source', 'Q7#P580'],
    );
    assert.equal(p['labelPeriod.end.year']!.sourceField, 'Q7#P582');
  });

  test('yalnızca kaynaktaki hassasiyet kadar tarih: yıl hassasiyetinde ay yazılmaz', () => {
    assert.deepEqual(gens[0]!.labelPeriod.start, { year: 2003 }, '+2003-01-01 ama hassasiyet yıl');
    assert.deepEqual(gens[1]!.labelPeriod.start, { year: 2008, month: 10 });
  });

  test('P582 yoksa bitiş yer tutucudur ve not düşülür', () => {
    const mk8 = gens[3]!;
    assert.equal(mk8.labelPeriod.end, null);
    assert.equal(prov['volkswagen-golf-mk8']!['labelPeriod.end']!.kind, 'placeholder');
    assert.match(mk8.notes, /bitiş yılı yok/);
  });

  test('her nesil kendi Wikidata kaynağına bağlı', () => {
    assert.deepEqual(gens.map((g) => g.sourceIds), [['wikidata-q5'], ['wikidata-q6'], ['wikidata-q7'], ['wikidata-q8']]);
    assert.deepEqual(file.sources.map((s) => s.url), ['Q5', 'Q6', 'Q7', 'Q8'].map((q) => `https://www.wikidata.org/wiki/${q}`));
  });
});

describe('Wikidata normalize: tahmin yerine atlama', () => {
  test('etiket kalıba uymazsa nesil atlanır', () => {
    const e = golfEntities();
    e.set('Q8', entity('Q8', 'Golf 8', { start: [time('+2019-00-00T00:00:00Z')], prev: 'Q7' }));
    const f = normalizeTarget(target, e, '2026-10-15');
    assert.equal(gensOf(f).length, 3);
    assert.match(f.skipped[0]!.reason, /beklenen kalıba uymuyor/);
  });

  test('marka (P1716) uyuşmazsa nesil atlanır', () => {
    const e = golfEntities();
    e.set('Q7', entity('Q7', 'Volkswagen Golf Mk7', { start: [time('+2012-00-00T00:00:00Z')], brand: 'Q999', prev: 'Q6', next: 'Q8' }));
    const f = normalizeTarget(target, e, '2026-10-15');
    assert.deepEqual(f.skipped.map((s) => s.ref), ['Q7']);
  });

  test('başlangıç yılı yoksa, belirsizse veya çelişiyorsa nesil atlanır', () => {
    const e = golfEntities();
    e.set('Q5', entity('Q5', 'Volkswagen Golf Mk5', { next: 'Q6' }));
    e.set('Q6', entity('Q6', 'Volkswagen Golf Mk6', { start: [time('+2000-00-00T00:00:00Z', 8)], prev: 'Q5', next: 'Q7' }));
    e.set('Q7', entity('Q7', 'Volkswagen Golf Mk7', { start: [time('+2012-00-00T00:00:00Z'), time('+2013-00-00T00:00:00Z')], prev: 'Q6', next: 'Q8' }));
    const f = normalizeTarget(target, e, '2026-10-15');
    assert.deepEqual(gensOf(f).map((g) => g.id), ['volkswagen-golf-mk8']);
    assert.deepEqual(f.skipped.map((s) => s.reason.match(/missing|imprecise|conflict/)?.[0]), ['missing', 'imprecise', 'conflict']);
  });

  test('tercih edilen (preferred) değer çelişkiyi çözer; kaldırılmış (deprecated) değer yok sayılır', () => {
    const e = golfEntities();
    e.set('Q7', entity('Q7', 'Volkswagen Golf Mk7', {
      start: [time('+2012-00-00T00:00:00Z', 9, 'preferred'), time('+2013-00-00T00:00:00Z')],
      end: [time('+2020-00-00T00:00:00Z', 9, 'deprecated'), time('+2021-00-00T00:00:00Z')],
      prev: 'Q6',
      next: 'Q8',
    }));
    const mk7 = gensOf(normalizeTarget(target, e, '2026-10-15'))[2]!;
    assert.deepEqual([mk7.labelPeriod.start, mk7.labelPeriod.end], [{ year: 2012 }, { year: 2021 }]);
  });

  test('P155/P156 zinciri yapılandırmayla uyuşmazsa hata verir', () => {
    const e = golfEntities();
    e.set('Q6', entity('Q6', 'Volkswagen Golf Mk6', { start: [time('+2008-00-00T00:00:00Z')], prev: 'Q5', next: 'Q99' }));
    assert.throws(() => normalizeTarget(target, e, '2026-10-15'), /zinciri yapılandırmayla uyuşmuyor/);
  });
});

describe('Wikidata fetch', () => {
  test('ham veriyi önbelleğe yazar ve tekrar indirmez', async () => {
    let calls = 0;
    const fakeFetch = (async (url: string | URL | Request) => {
      calls++;
      const qid = String(url).match(/(Q\d+)\.json$/)![1]!;
      return new Response(JSON.stringify({ entities: { [qid]: golfEntities().get(qid) } }), { status: 200 });
    }) as typeof fetch;
    const adapter = createWikidataAdapter({ targets: [target], fetchImpl: fakeFetch });
    const ctx = { cacheDir: join(mkdtempSync(join(tmpdir(), 'bahtepoto-cache-')), 'wikidata', '2026-10-15'), retrievedAt: '2026-10-15' };

    assert.equal((await adapter.fetch(ctx)).downloaded, 4);
    assert.equal((await adapter.fetch(ctx)).downloaded, 0);
    assert.equal(calls, 4);
    const [out] = await adapter.normalize(ctx);
    assert.equal(gensOf(out!.file).length, 4);
  });
});

describe('depodaki Golf adayları (data/staging/wikidata)', () => {
  const staging = loadStaging(DEFAULT_DIRS.stagingDir, 'wikidata');
  const golf = staging.find((s) => s.path === 'wikidata/volkswagen-golf.json');

  test('aday dosyası var ve import:check hatasız', () => {
    assert.ok(golf?.file, 'data/staging/wikidata/volkswagen-golf.json yok');
    assert.deepEqual(analyze(loadRawCatalog(DEFAULT_DIRS.catalogDir), staging).errors, []);
  });

  test('Mk5–Mk8, hepsi unverified ve makyaj dönemsiz', () => {
    const gens = golf!.file!.candidates[0]!.record.generations as Gen[];
    assert.deepEqual(gens.map((g) => g.slug), ['mk5', 'mk6', 'mk7', 'mk8']);
    for (const g of gens) {
      assert.equal(g.status, 'unverified');
      assert.equal(g.revisions, undefined);
    }
  });

  test('fark raporu üretilmiş', () => {
    assert.ok(existsSync(join(DEFAULT_DIRS.stagingDir, 'wikidata', 'FARK-RAPORU.md')));
  });

  test('Golf kataloğa aktarılmadı (insan onayı bekliyor)', () => {
    assert.equal(existsSync(join(DEFAULT_DIRS.catalogDir, 'models', 'volkswagen', 'golf.json')), false);
    assert.equal(loadRawCatalog(DEFAULT_DIRS.catalogDir).sources.some((s) => String(s.id).startsWith('wikidata-')), false);
  });
});
