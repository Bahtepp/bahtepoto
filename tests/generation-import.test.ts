/**
 * Wikipedia nesillerinin kataloğa otomatik aktarılması ve TSB varyantlarının yeni nesillerle eşleşmesi:
 * yanlış marka/model, kasa kodu > motor > tek nesil yılı önceliği, örtüşen yıllar, tekrar eden varyantlar,
 * ikinci çalıştırma ve geri alma.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../scripts/import/lib/analyze.ts';
import { loadRawCatalog, type Json, type RawCatalog } from '../scripts/import/lib/io.ts';
import { DEFAULT_DIRS } from '../scripts/import/lib/paths.ts';
import { applyGenerations, importBlocker, type ModelGenerations, type StagedGeneration } from '../scripts/import/generations/build.ts';
import { buildFromTsb, stripTsb } from '../scripts/import/tsb/build.ts';
import type { TsbRow } from '../scripts/import/tsb/parse.ts';

const OPTS = { today: '2026-10-17', sourceTitle: 'TSB test', sourceNotes: 'test' };
const row = (typeCode: string, typeName: string, modelYears: number[]): TsbRow => ({ brandCode: '20', typeCode, brand: 'BMW', typeName, modelYears, files: ['t'] });

const gen = (slug: string, code: string, ordinal: number, start: number, end: number | null, engines: number[]): StagedGeneration => ({
  slug,
  name: `3 Serisi (${code})`,
  code,
  ordinal,
  start,
  end,
  marketId: 'global',
  approximate: false,
  engineDisplacementsL: engines,
  page: `BMW 3 Series (${code})`,
  productionNote: '',
});

const staged = (gens: StagedGeneration[], extra: Partial<ModelGenerations> = {}): ModelGenerations => ({
  modelFile: 'models/bmw/3-serisi.json',
  modelId: 'bmw-3-serisi',
  article: 'BMW 3 Series',
  status: 'found',
  generations: gens,
  pages: gens.map((g, i) => ({ title: g.page, pageid: 500 + i, revid: 900 + i })),
  conflicts: [],
  overlaps: [],
  ...extra,
});

function catalog(): RawCatalog {
  return {
    brands: [{ id: 'bmw', slug: 'bmw', name: 'BMW', status: 'sourced', sourceIds: ['tsb-kasko-deger-listesi'], updatedAt: '2026-10-15' }],
    markets: [{ id: 'tr', name: 'Türkiye', kind: 'country', isoCode: 'TR' }],
    sources: [],
    engines: new Map(),
    models: new Map<string, Json>([
      ['models/bmw/3-serisi.json', { id: 'bmw-3-serisi', brandId: 'bmw', slug: '3-serisi', name: '3 Serisi', status: 'sourced', sourceIds: ['tsb-kasko-deger-listesi'], updatedAt: '2026-10-15', generations: [] }],
    ]),
  };
}

// E46 1997–2006 ve E90 2004–2013 üretim yılları örtüşüyor (2004–2006 iki nesle de uyar).
const STAGED = [staged([gen('e46', 'E46', 4, 1997, 2006, [1.9, 3]), gen('e90', 'E90/E91/E92/E93', 5, 2004, 2013, [2, 3])])];
const ROWS = [
  row('1', '320d E90 2.0 (177) SEDAN', [2006]), // kasa kodu yazıyor → E90
  row('2', '320d 2.0 (163)', [2008, 2009, 2010]), // yalnızca E90'nın dönemine uyuyor
  row('3', '318i 1.9 (118)', [2005]), // iki nesle uyar; 1.9 L yalnızca E46 için listeli → E46
  row('4', '330i 3.0 (231)', [2005]), // iki nesle uyar; 3.0 L ikisinde de var → belirsiz
];

function run(cat = catalog(), stagedGens = STAGED) {
  const withGens = applyGenerations(stripTsb(cat), stagedGens, '2026-10-17');
  return { ...buildFromTsb(withGens.catalog, ROWS, OPTS), added: withGens.added };
}

const variantsOf = (r: ReturnType<typeof run>, slug: string) =>
  ((r.merged.models.get('models/bmw/3-serisi.json')!.generations as Json[]).find((g) => g.slug === slug)?.variants as Json[] | undefined) ?? [];
const refs = (vs: Json[]) => vs.flatMap((v) => ((v.marketAvailability as Json[])[0]!.sourceRefs as string[]));

describe('Wikipedia nesillerinin aktarılma koşulları', () => {
  test('madde başka modele aitse (yanlış marka/model) aktarılmaz', () => {
    assert.match(importBlocker(staged([], { article: 'Audi A3', status: 'found', generations: [gen('8v', '8V', 3, 2012, 2020, [])] }), 'Audi', 'RS3')!, /açıkça eşleşmiyor/);
    assert.match(importBlocker(staged([gen('e90', 'E90', 5, 2004, 2013, [])], { article: 'BMW 1 Series' }), 'BMW', '3 Serisi')!, /açıkça eşleşmiyor/);
    assert.equal(importBlocker(staged([gen('e90', 'E90', 5, 2004, 2013, [])]), 'BMW', '3 Serisi'), undefined);
    assert.equal(importBlocker(staged([gen('x', 'X', 1, 2000, 2005, [])], { article: 'Audi RS 4' }), 'Audi', 'RS4'), undefined, 'boşluk farkı engel değil');
  });

  test('kaynakta çelişki olan model aktarılmaz', () => {
    assert.match(importBlocker(staged([gen('e90', 'E90', 5, 2004, 2013, [])], { conflicts: ['e90: iki satır farklı yıllar'] }), 'BMW', '3 Serisi')!, /çelişki/);
  });

  test('aktarılan nesil "kaynaklı" (resmi doğrulama değil) ve Wikipedia kaynağına bağlı', () => {
    const r = run();
    const g = (r.merged.models.get('models/bmw/3-serisi.json')!.generations as Json[]).find((x) => x.slug === 'e46')!;
    assert.equal(g.status, 'sourced');
    assert.deepEqual(g.sourceIds, ['wpgen-500']);
    assert.equal((r.merged.sources.find((s) => s.id === 'wpgen-500')!).tier, 'secondary');
  });
});

describe('TSB varyantlarının yeni nesillerle eşleşmesi', () => {
  const r = run();

  test('öncelik 1: tip adındaki kasa kodu', () => {
    assert.ok(refs(variantsOf(r, 'e90')).includes('TSB 20-1'));
    assert.equal(r.stats.matchedByCode, 1);
  });

  test('öncelik 2: kaynaktaki motor hacmi tek nesli gösteriyorsa', () => {
    assert.ok(refs(variantsOf(r, 'e46')).includes('TSB 20-3'));
    assert.equal(r.stats.matchedByEngine, 1);
  });

  test('öncelik 3: model yılları yalnızca bir neslin dönemine uyuyorsa', () => {
    assert.ok(refs(variantsOf(r, 'e90')).includes('TSB 20-2'));
  });

  test('örtüşen yılda motor da ayırt etmiyorsa tahmin yapılmaz (nesli belirlenmemiş araçlar)', () => {
    const bucket = variantsOf(r, 'nesil-belirlenmedi');
    assert.deepEqual(refs(bucket), ['TSB 20-4']);
    const g = (r.merged.models.get('models/bmw/3-serisi.json')!.generations as Json[]).find((x) => x.slug === 'nesil-belirlenmedi')!;
    assert.equal(g.kind, 'unassigned');
  });

  test('her TSB satırı tam bir varyantta (tekrar eden varyant yok)', () => {
    const all = (r.merged.models.get('models/bmw/3-serisi.json')!.generations as Json[]).flatMap((g) => refs(g.variants as Json[]));
    assert.deepEqual([...all].sort(), ['TSB 20-1', 'TSB 20-2', 'TSB 20-3', 'TSB 20-4']);
  });

  test('birleştirilmiş katalog şemaları ve bütünlük denetimini geçer', () => {
    assert.deepEqual(analyze(r.merged, []).errors, []);
  });
});

describe('tekrar çalıştırma ve geri alma', () => {
  test('ikinci çalıştırma aynı sonucu üretir (yinelenen nesil/varyant yok)', () => {
    const first = run();
    const second = run(first.merged);
    assert.equal(JSON.stringify([...second.merged.models]), JSON.stringify([...first.merged.models]));
    assert.equal(JSON.stringify(second.merged.sources), JSON.stringify(first.merged.sources));
  });

  test('geri alma (--without-generations) Wikipedia nesillerini kaldırır, TSB araçları kaybolmaz', () => {
    const imported = run();
    const reverted = run(imported.merged, []);
    const baseline = run(catalog(), []);
    assert.equal(JSON.stringify([...reverted.merged.models]), JSON.stringify([...baseline.merged.models]));
    assert.equal(reverted.merged.sources.some((s) => String(s.id).startsWith('wpgen-')), false);
    const all = (reverted.merged.models.get('models/bmw/3-serisi.json')!.generations as Json[]).flatMap((g) => refs(g.variants as Json[]));
    assert.equal(all.length, 4, 'TSB satırları geri almada korunur');
  });
});

describe('gerçek katalog', () => {
  const raw = loadRawCatalog(DEFAULT_DIRS.catalogDir);

  test('her TSB tip kodu yalnızca bir varyantta (tekrar yok)', () => {
    const seen = new Map<string, string>();
    for (const m of raw.models.values()) {
      for (const g of (m.generations as Json[]) ?? []) {
        for (const v of (g.variants as Json[]) ?? []) {
          for (const a of (v.marketAvailability as Json[] | undefined) ?? []) {
            if (!((a.sourceIds as string[]) ?? []).includes('tsb-kasko-deger-listesi')) continue;
            for (const ref of (a.sourceRefs as string[]) ?? []) {
              assert.ok(!seen.has(ref), `${ref}: ${seen.get(ref)} ve ${String(v.id)}`);
              seen.set(ref, String(v.id));
            }
          }
        }
      }
    }
    assert.ok(seen.size > 1000);
  });

  test('"nesil belirlenmedi" grupları gerçek nesil olarak işaretlenmez', () => {
    for (const m of raw.models.values()) {
      for (const g of (m.generations as Json[]) ?? []) {
        if (g.slug === 'nesil-belirlenmedi') assert.equal(g.kind, 'unassigned', String(g.id));
      }
    }
  });

  test('Wikipedia nesilleri elle girilmiş nesli olan modellere eklenmez', () => {
    for (const m of raw.models.values()) {
      const gens = (m.generations as Json[]) ?? [];
      const curated = gens.some((g) => ((g.sourceIds as string[]) ?? []).some((s) => s !== 'tsb-kasko-deger-listesi' && !s.startsWith('wpgen-')));
      const wp = gens.some((g) => ((g.sourceIds as string[]) ?? []).some((s) => s.startsWith('wpgen-')));
      assert.ok(!(curated && wp), String(m.id));
    }
  });
});
