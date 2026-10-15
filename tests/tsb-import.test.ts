/**
 * TSB (Türkiye Sigorta Birliği) Kasko Değer Listesi içe aktarması, Türkiye pazar filtresi ve
 * pazar bazlı kronik sorun eşleştirmesi.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../scripts/import/lib/analyze.ts';
import { loadRawCatalog, type Json, type RawCatalog } from '../scripts/import/lib/io.ts';
import { DEFAULT_DIRS } from '../scripts/import/lib/paths.ts';
import { buildFromTsb, stripTsb, TSB_SOURCE_ID } from '../scripts/import/tsb/build.ts';
import { parseTypeName, resolveModels } from '../scripts/import/tsb/normalize.ts';
import { mergeRows, parseSheet, type TsbRow } from '../scripts/import/tsb/parse.ts';
import { isPerformance, marketCounts, marketGroup } from '../src/lib/catalog/market.ts';
import { matchIssue, type VehicleContext } from '../src/lib/issues/match.ts';
import { makeIssue } from './helpers.ts';

const OPTS = { today: '2026-10-15', sourceTitle: 'TSB test', sourceNotes: 'test' };
const row = (brand: string, typeCode: string, typeName: string, modelYears: number[]): TsbRow => ({
  brandCode: '53',
  typeCode,
  brand,
  typeName,
  modelYears,
  files: ['test'],
});

describe('TSB tip adı ayrıştırma', () => {
  test('nesil ipucu, hacim, güç, yakıt, gövde ve donanım ayrı alanlara ayrılır', () => {
    const p = parseTypeName('FOCUS III TITANIUM 1.6 TDCi (115) 4K');
    assert.equal(p.generationHint, 'III');
    assert.equal(p.displacementL, 1.6);
    assert.equal(p.powerPs, 115);
    assert.equal(p.fuel, 'diesel');
    assert.equal(p.body, 'sedan-4');
    assert.deepEqual(p.prefix, ['FOCUS', 'TITANIUM']);
  });

  test('"1.6i" benzin, "OV" otomatik, "5 KAPI" hatchback', () => {
    const p = parseTypeName('FOCUS 1.6i COLLECTION 5 KAPI OV (100)');
    assert.equal(p.fuel, 'petrol');
    assert.equal(p.transmission?.type, 'automatic');
    assert.equal(p.body, 'hatchback-5');
    assert.deepEqual(p.rest, ['COLLECTION']);
  });

  test('yakıt türü yazmıyorsa boş kalır (tahmin edilmez)', () => {
    const p = parseTypeName('FOCUS TREND X 5K 1.6 (115)');
    assert.equal(p.fuel, undefined);
    assert.equal(p.powerPs, 115);
  });

  test('ilk sözcük her zaman modeldir ("CC" gövde değil)', () => {
    const p = parseTypeName('CC 1.4 TSI 160 BMT TIPTRONIC DSG');
    assert.deepEqual(p.prefix, ['CC']);
    assert.equal(p.transmission?.type, 'dual-clutch');
    assert.equal(p.powerPs, 160);
  });

  test('donanım adı model sayılmaz, alt model sayılır', () => {
    const names = [
      'FOCUS TITANIUM 5K 1.6 TDCi (109)',
      'FOCUS 1.6 TDCi TITANIUM 4K',
      'FOCUS C-MAX 1.6 TDCi TITANIUM',
      'C-MAX 1.6 TDCi TREND',
      'C-MAX 1.6 TREND',
      'C-MAX 2.0 TDCi TITANIUM',
      'FOCUS 1.6 TREND',
      'FOCUS 1.6 TDCi TREND',
    ];
    const parsed = names.map(parseTypeName);
    const resolve = resolveModels(parsed);
    assert.equal(resolve(parsed[0]!).model, 'FOCUS');
    assert.deepEqual(resolve(parsed[0]!).trimWords, ['TITANIUM']);
    assert.equal(resolve(parsed[2]!).model, 'C-MAX');
  });
});

describe('TSB dosyası', () => {
  test('başlık satırı bulunur; değeri olan model yılları alınır, fiyatlar alınmaz', () => {
    const rows = parseSheet(
      [
        ['Ekim 2026'],
        ['Marka Kodu', 'Tip Kodu', 'Marka Adı', 'Tip Adı', '2026', '2025', '2024'],
        ['53', '100', 'FORD', 'FOCUS 1.6 TDCi (115)', 0, 900000, 800000],
        ['53', '101', 'FORD', 'FOCUS 1.6 (125)', 0, 0, 0],
      ],
      'test',
    );
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0]!.modelYears, [2024, 2025]);
    assert.equal(Object.values(rows[0]!).some((v) => v === 900000), false);
  });

  test('dosyalar marka + tip kodu ile birleşir, model yılları birleşir', () => {
    const merged = mergeRows([[row('FORD', '100', 'FOCUS 1.6', [2010, 2011])], [row('FORD', '100', 'FOCUS 1.6 TDCi', [2012])]]);
    assert.equal(merged.length, 1);
    assert.deepEqual(merged[0]!.modelYears, [2010, 2011, 2012]);
    assert.equal(merged[0]!.typeName, 'FOCUS 1.6 TDCi');
  });
});

/** Küçük katalog: Ford Focus Mk2 (2004–2010) ve Mk3 (2011–2018), Mk2'de elle girilmiş 1.6 TDCi 109. */
function miniCatalog(): RawCatalog {
  const period = (s: number, e: number) => ({ marketId: 'eu', basis: 'production', start: { year: s }, end: { year: e } });
  return {
    brands: [{ id: 'ford', slug: 'ford', name: 'Ford', status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15' }],
    markets: [
      { id: 'eu', name: 'Avrupa', kind: 'region' },
      { id: 'tr', name: 'Türkiye', kind: 'country', isoCode: 'TR' },
      { id: 'na', name: 'Kuzey Amerika', kind: 'region' },
    ],
    sources: [{ id: 'wp', title: 'Wikipedia', tier: 'secondary', accessedAt: '2026-10-15' }],
    engines: new Map([
      ['ford.json', [{ id: 'ford-g8da', brandId: 'ford', slug: 'g8da', name: '1.6 TDCi 109 PS', fuel: 'diesel', displacementL: 1.6, power: { ps: 109 }, status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15' }]],
    ]),
    models: new Map([
      [
        'models/ford/focus.json',
        {
          id: 'ford-focus',
          brandId: 'ford',
          slug: 'focus',
          name: 'Focus',
          status: 'sourced',
          sourceIds: ['wp'],
          updatedAt: '2026-10-15',
          generations: [
            {
              id: 'ford-focus-mk2', slug: 'mk2', name: 'Focus Mk2', order: 1, labelPeriod: period(2004, 2010), status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15',
              variants: [{ id: 'ford-focus-mk2-g8da', slug: 'g8da', engineId: 'ford-g8da', revisionMapping: 'unknown', marketIds: ['eu'], status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15' }],
            },
            { id: 'ford-focus-mk3', slug: 'mk3', name: 'Focus Mk3', order: 2, labelPeriod: period(2011, 2018), status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15', variants: [] },
          ],
        },
      ],
    ]),
  };
}

const ROWS = [
  row('FORD', '1', 'FOCUS 1.6 TDCi TITANIUM (109)', [2007, 2008]),
  row('FORD', '2', 'FOCUS 1.6 TDCi TREND (109)', [2006, 2007]),
  row('FORD', '3', 'FOCUS III TITANIUM 1.6 TDCi (115) 4K', [2012, 2013]),
  row('FORD', '4', 'FOCUS III TREND 1.6 TDCi (115) 5K', [2014]),
  row('FORD', '5', 'FOCUS 1.6i COLLECTION 5 KAPI OV (100)', [2009, 2010, 2011]),
  row('FORD', '6', 'KAMYON CARGO 2538 6x2', [2015]),
  row('FORD', '7', 'FOCUS TITANIUM', [2015]),
  row('FORD', '8', 'FOCUS RS 2.3 ECOBOOST (350)', [2016, 2017]),
  row('FORD /USA', '9', 'MUSTANG 5.0 V8 GT (450)', [2020]),
];

describe('TSB → katalog', () => {
  const r = buildFromTsb(miniCatalog(), ROWS, OPTS);
  const focus = r.merged.models.get('models/ford/focus.json')!;
  const gens = focus.generations as Json[];
  const gen = (slug: string) => gens.find((g) => g.slug === slug)!;
  const variants = (slug: string) => gen(slug).variants as Json[];

  test('farklı yıl ve donanımdaki aynı motor tek varyantta birleşir; yıllar ve donanımlar korunur', () => {
    const mk3 = variants('mk3').filter((v) => String(v.engineId).endsWith('16-tdci-115'));
    assert.equal(mk3.length, 1, JSON.stringify(variants('mk3').map((v) => v.id)));
    const a = (mk3[0]!.marketAvailability as Json[])[0]!;
    assert.deepEqual(a.modelYears, [2012, 2013, 2014]);
    assert.deepEqual(a.trims, ['Titanium', 'Trend']);
    assert.equal(a.status, 'listed');
    assert.deepEqual(mk3[0]!.periods, [{ marketId: 'tr', basis: 'model-year', start: { year: 2012 }, end: { year: 2014 } }]);
  });

  test('mevcut (elle girilmiş) varyanta Türkiye durumu eklenir, alanları değişmez', () => {
    const v = variants('mk2').find((x) => x.id === 'ford-focus-mk2-g8da')!;
    assert.deepEqual(v.marketIds, ['eu', 'tr']);
    assert.deepEqual(v.sourceIds, ['wp']);
    assert.deepEqual((v.marketAvailability as Json[])[0]!.modelYears, [2006, 2007, 2008]);
  });

  test('iki neslin sınırına düşen satır tahminle nesle eklenmez ("nesil belirlenmedi")', () => {
    const bucket = gen('nesil-belirlenmedi');
    assert.ok(bucket, 'nesil belirlenmedi grubu yok');
    assert.equal(bucket.status, 'unverified');
    assert.ok((bucket.variants as Json[]).some((v) => ((v.marketAvailability as Json[])[0]!.modelYears as number[]).includes(2011)));
    assert.equal(variants('mk3').some((v) => ((v.marketAvailability as Json[])[0]!.modelYears as number[]).includes(2011)), false);
  });

  test('ağır vasıta kapsam dışı; motor bilgisi olmayan satır belirsiz dosyasına gider', () => {
    assert.equal(r.stats.excluded['ticari / ağır vasıta tipi'] ?? 0, 1);
    assert.ok(r.rejects.some((x) => x.typeName === 'FOCUS TITANIUM' && x.reason.startsWith('motor bilgisi yok')));
  });

  test('ABD tipi ("FORD /USA") ithal olarak işaretlenir', () => {
    const mustang = r.merged.models.get('models/ford/mustang.json')!;
    const v = ((mustang.generations as Json[])[0]!.variants as Json[])[0]!;
    assert.equal((v.marketAvailability as Json[])[0]!.status, 'imported');
  });

  test('birleştirilmiş katalog şemaları ve bütünlük denetimini geçer', () => {
    assert.deepEqual(analyze(r.merged, []).errors, []);
  });

  test('yeniden çalıştırma aynı sonucu üretir (idempotent)', () => {
    const again = buildFromTsb(r.merged, ROWS, OPTS);
    assert.equal(JSON.stringify([...again.merged.models]), JSON.stringify([...r.merged.models]));
    assert.equal(JSON.stringify([...again.merged.engines]), JSON.stringify([...r.merged.engines]));
  });

  test('temizleme elle girilmiş veriyi özgün hâline döndürür', () => {
    const stripped = stripTsb(r.merged);
    const original = miniCatalog();
    assert.equal(JSON.stringify(stripped.engines.get('ford.json')), JSON.stringify(original.engines.get('ford.json')));
    const v = (((stripped.models.get('models/ford/focus.json')!.generations as Json[])[0]!.variants) as Json[])[0]!;
    assert.deepEqual(v, ((original.models.get('models/ford/focus.json')!.generations as Json[])[0]!.variants as Json[])[0]);
  });
});

describe('Türkiye pazar filtresi', () => {
  const markets = [{ id: 'eu' }, { id: 'gb', parentId: 'eu' }, { id: 'tr' }, { id: 'na' }];
  const listed = { marketIds: ['tr'], marketAvailability: [{ marketId: 'tr', status: 'listed' as const, modelYears: [], trims: [], bodyTypes: [], sourceRefs: [], sourceIds: ['x'] }] };
  const euOnly = { marketIds: ['eu'], marketAvailability: [] };
  const gbOnly = { marketIds: ['gb'], marketAvailability: [] };
  const imported = { marketIds: ['tr'], marketAvailability: [{ ...listed.marketAvailability[0]!, status: 'imported' as const }] };
  const unverifiedTr = { marketIds: ['eu'], marketAvailability: [{ ...listed.marketAvailability[0]!, status: 'unverified' as const }] };

  test('Türkiye: yalnızca Türkiye kaydı olan motorlar ana listede', () => {
    assert.equal(marketGroup(listed, 'tr', markets), 'primary');
    assert.equal(marketGroup(euOnly, 'tr', markets), 'hidden', 'Avrupa\'da bulunması Türkiye\'de satıldığını kanıtlamaz');
    assert.equal(marketGroup(unverifiedTr, 'tr', markets), 'hidden');
    assert.equal(marketGroup(imported, 'tr', markets), 'imported');
  });

  test('Avrupa: alt pazarlar dahil; Tüm dünya: hepsi', () => {
    assert.equal(marketGroup(gbOnly, 'eu', markets), 'primary');
    assert.equal(marketGroup(listed, 'eu', markets), 'hidden');
    for (const v of [listed, euOnly, imported]) assert.equal(marketGroup(v, 'world', markets), 'primary');
    assert.deepEqual(marketCounts([listed, euOnly, gbOnly, imported], markets), { tr: 1, eu: 2, world: 4 });
  });

  test('performans modelleri ayrı gruplanır, silinmez', () => {
    assert.equal(isPerformance({ marketIds: ['eu'], marketAvailability: [], trimName: 'ST' }), true);
    assert.equal(isPerformance({ ...listed, marketAvailability: [{ ...listed.marketAvailability[0]!, trims: ['RS'] }] }), true);
    assert.equal(isPerformance({ ...listed, marketAvailability: [{ ...listed.marketAvailability[0]!, trims: ['Titanium', 'ST'] }] }), false);
  });

  test('gerçek katalog: TSB varyantlarının hepsinde Türkiye durumu ve model yılları var', () => {
    const raw = loadRawCatalog(DEFAULT_DIRS.catalogDir);
    let n = 0;
    for (const m of raw.models.values()) {
      for (const g of (m.generations as Json[]) ?? []) {
        for (const v of (g.variants as Json[]) ?? []) {
          if (!(v.sourceIds as string[]).includes(TSB_SOURCE_ID)) continue;
          n++;
          const tr = ((v.marketAvailability as Json[]) ?? []).find((a) => a.marketId === 'tr');
          assert.ok(tr && (tr.modelYears as number[]).length > 0, String(v.id));
        }
      }
    }
    assert.ok(n > 1000, `TSB varyant sayısı beklenenden az: ${n}`);
  });
});

describe('pazar bazlı kronik sorun eşleştirmesi', () => {
  const ctx = (marketIds: string[], fuel?: 'diesel'): VehicleContext => ({
    brandId: 'ford',
    modelId: 'ford-focus',
    generationId: 'ford-focus-mk3',
    generation: { labelPeriod: { marketId: 'eu', basis: 'production', start: { year: 2011 }, end: { year: 2018 }, approximate: false }, periods: [], revisions: [] },
    engine: { id: 'ford-16-tdci-115', codes: [], fuel },
    variant: { revisionIds: [], revisionMapping: 'unknown', transmissions: [], marketIds, periods: [] },
    markets: [{ id: 'eu' }, { id: 'tr' }, { id: 'na' }],
    currentYear: 2026,
  });
  const scoped = (marketIds: string[], extra: Record<string, unknown> = {}) =>
    makeIssue({ appliesTo: [{ modelIds: ['ford-focus'], generationIds: ['ford-focus-mk3'], marketIds, ...extra }] });

  test('ABD pazarına özgü sorun Türkiye motoruyla eşleşmez', () => {
    assert.equal(matchIssue(scoped(['na']), ctx(['tr'])).verdict, 'no');
  });

  test('Avrupa sorunu, hem Avrupa hem Türkiye\'de bulunan motorda yalnızca koşullu', () => {
    assert.equal(matchIssue(scoped(['eu']), ctx(['eu', 'tr'])).verdict, 'conditional');
    assert.equal(matchIssue(scoped(['eu']), ctx(['tr'])).verdict, 'no');
  });

  test('yakıta özgü sorun, yakıtı bilinmeyen motorda kesin değil koşullu', () => {
    const issue = scoped([], { fuels: ['diesel'] });
    assert.equal(matchIssue(issue, ctx(['tr'])).verdict, 'conditional');
    assert.equal(matchIssue(issue, ctx(['tr'], 'diesel')).verdict, 'applies');
  });
});
