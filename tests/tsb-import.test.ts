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
import { availabilityFor, isPerformance, marketCounts, marketGroup } from '../src/lib/catalog/market.ts';
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

  test('şanzıman veya Eco etiketinden sonraki sayı güçtür; 1.2 atmosferik TCe olmaz', () => {
    const edc = parseTypeName('CLIO GT LINE 1.2 TURBO EDC 120');
    assert.equal(edc.displacementL, 1.2);
    assert.equal(edc.powerPs, 120);
    assert.equal(edc.transmission?.type, 'dual-clutch');
    assert.equal(edc.tech.includes('TCE'), false);

    const atmo = parseTypeName('CLIO HB ICON 1.2 16V 75');
    assert.equal(atmo.displacementL, 1.2);
    assert.equal(atmo.powerPs, 75);
    assert.equal(atmo.tech.includes('TCE'), false);
    assert.equal(atmo.fuel, undefined);

    const tce = parseTypeName('CLIO JOY 1.0 TCE X-TRONIC 100');
    assert.equal(tce.powerPs, 100);
    assert.equal(tce.fuel, 'petrol');
    assert.ok(tce.tech.includes('TCE'));
    assert.equal(tce.transmission?.type, 'cvt');

    const eco = parseTypeName('CLIO EQUILIBRE 1.0 TCE ECO 100');
    assert.equal(eco.powerPs, 100);
    assert.equal(eco.fuel, 'petrol');

    const glued = parseTypeName('MEGANE II S. AUTHENTIQUE BUSI.1.5 DCI 85');
    assert.equal(glued.displacementL, 1.5);
    assert.equal(glued.powerPs, 85);
    assert.equal(glued.fuel, 'diesel');

    const names = ['CLIO EQUILIBRE 1.0 SCE 65', 'CLIO EQUILIBRE 1.0 TCE 90', 'CLIO EQUILIBRE 1.0 TCE ECO 100', 'CLIO JOY 1.0 TCE 90'];
    const parsed = names.map(parseTypeName);
    const resolve = resolveModels(parsed);
    assert.equal(resolve(parsed[0]!).model, 'CLIO');

    const rsLine = parseTypeName('CLIO RS LINE 1.0 TCE X-TRONIC 100');
    assert.equal(rsLine.powerPs, 100);
    const hybrid = parseTypeName('CAPTUR ESPRIT ALPINE 1.6 E-TECH F.HYBRID 145');
    assert.equal(hybrid.displacementL, 1.6);
    assert.equal(hybrid.fuel, 'hybrid');
    assert.equal(hybrid.powerPs, 145);
  });

  test('EB EcoBoost kısaltmasıdır; ST gücü okunur; Cool ve ST-Line ayrı model değildir', () => {
    const eb = parseTypeName('FOCUS ST-LINE 1.0 MHEV EB 125 7AT');
    assert.equal(eb.fuel, 'mild-hybrid');
    assert.equal(eb.powerPs, 125);
    assert.ok(eb.tech.includes('ECOBOOST'));
    assert.equal(eb.tech.includes('EB'), false);

    const st = parseTypeName('FOCUS III 2.0 ST 250 HB');
    assert.equal(st.displacementL, 2);
    assert.equal(st.powerPs, 250);
    assert.equal(st.fuel, undefined);

    const line = parseTypeName('FOCUS ST LINE 1.6 125 5K');
    assert.equal(line.powerPs, 125);
    assert.equal(line.fuel, undefined);

    const names = [
      'FIESTA COOL 1.4',
      'FIESTA COOL 1.25',
      'FIESTA COOL 1.6',
      'FIESTA TREND 1.25i',
      'FOCUS ST LINE 1.6 125',
      'FOCUS ST LINE 1.0 ECOBOOST 125',
      'FOCUS ST LINE 1.5 TDCI 120',
    ];
    const parsed = names.map(parseTypeName);
    const resolve = resolveModels(parsed);
    assert.equal(resolve(parsed[0]!).model, 'FIESTA');
    assert.ok(resolve(parsed[0]!).trimWords.some((w) => w.toUpperCase() === 'COOL'));
    assert.equal(resolve(parsed[4]!).model, 'FOCUS');
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

  test('bitişik DIG-T dizel sayılmaz; DIG-T160 ve e-POWER ayrılır', () => {
    const glued = parseTypeName('MC QASHQAI 1.2DIG-T XTR.PLATINUM PREMIUM PACK');
    assert.equal(glued.displacementL, 1.2);
    assert.equal(glued.fuel, 'petrol');
    assert.ok(glued.tech.includes('DIG-T'));

    const power = parseTypeName('QASHQAI 1.3 DIG-T160 DCT PLATINUM');
    assert.equal(power.displacementL, 1.3);
    assert.equal(power.powerPs, 160);
    assert.equal(power.fuel, 'petrol');
    assert.equal(power.transmission?.type, 'dual-clutch');

    const ep = parseTypeName('QASHQAI E-POWER 190 DESIGN PACK');
    assert.equal(ep.fuel, 'hybrid');
    assert.equal(ep.powerPs, 190);
    assert.ok(ep.tech.includes('E-POWER'));
    assert.equal(ep.displacementL, undefined);

    const awd = parseTypeName('X-TRAIL E-POWER 213 E-4ORCE SKYPACK 4WD');
    assert.equal(awd.awd, true);
    assert.equal(awd.powerPs, 213);
    assert.equal(awd.fuel, 'hybrid');

    const rr = parseTypeName('GHOST EWB 6.75');
    assert.equal(rr.displacementL, 6.75);
    const fiesta = parseTypeName('FIESTA TREND 5K 1.25i');
    assert.equal(fiesta.displacementL, 1.25);
    assert.equal(fiesta.fuel, 'petrol');
    const aveo = parseTypeName('AVEO HB 1.416V LTZ OV');
    assert.equal(aveo.displacementL, 1.4);
    assert.equal(aveo.transmission?.type, 'automatic');
  });

  test('MC ön eki model adı değildir', () => {
    const names = ['MC QASHQAI 1.2 DIG-T VISIA', 'QASHQAI 1.5 DCI VISIA'];
    const parsed = names.map(parseTypeName);
    const resolve = resolveModels(parsed);
    assert.equal(resolve(parsed[0]!).model, 'QASHQAI');
    assert.equal(resolve(parsed[1]!).model, 'QASHQAI');
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
  row('FORD', '10', 'FOCUS 1.6i TITANIUM 4 KAPI (100)', [2011]),
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

  test('iki neslin sınırındaki tek model yılı tahminle nesle eklenmez; bütün yılları tek nesil kapsıyorsa o nesil', () => {
    const bucket = gen('nesil-belirlenmedi');
    assert.ok(bucket, 'nesil belirlenmedi grubu yok');
    // 2011 tek başına: Mk2 (üretim 2010 → model yılı 2011 olabilir) ve Mk3 (model yılı 2011–) ikisine de uyar.
    assert.ok((bucket.variants as Json[]).some((v) => ((v.marketAvailability as Json[])[0]!.sourceRefs as string[]).includes('TSB 53-10')));
    // 2009–2011: bütün yılları yalnızca Mk2 kapsar (Mk3 2009'u kapsamaz).
    assert.ok(variants('mk2').some((v) => ((v.marketAvailability as Json[])[0]!.sourceRefs as string[]).includes('TSB 53-5')));
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

  test('hp olarak tutulan aynı motor TSB PS satırına bağlanır; teknoloji farklıysa bağlanmaz', () => {
    const catalog = miniCatalog();
    const engines = catalog.engines.get('ford.json')!;
    engines.push(
      { id: 'ford-tdci-115hp', brandId: 'ford', slug: 'tdci-115hp', name: '1.6 TDCi (115 hp)', family: 'Duratorq TDCi', fuel: 'diesel', displacementL: 1.6, power: { hp: 115 }, status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15' },
      { id: 'ford-ecoblue-120', brandId: 'ford', slug: 'ecoblue-120', name: '1.5 EcoBlue 120 PS', family: 'EcoBlue', fuel: 'diesel', displacementL: 1.5, power: { ps: 120 }, status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15' },
    );
    const mk3 = (catalog.models.get('models/ford/focus.json')!.generations as Json[])[1]!;
    (mk3.variants as Json[]).push({
      id: 'ford-focus-mk3-115hp', slug: 'tdci-115hp', engineId: 'ford-tdci-115hp', revisionMapping: 'unknown', marketIds: ['eu'], status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15',
    });
    const built = buildFromTsb(catalog, [
      row('FORD', '3', 'FOCUS III TITANIUM 1.6 TDCi (115) 4K', [2012, 2013]),
      row('FORD', '4', 'FOCUS III TREND 1.6 TDCi (115) 5K', [2012, 2013]),
      row('FORD', '11', 'FOCUS 1.5 TDCi (120)', [2015, 2016]),
    ], OPTS);
    const gens = built.merged.models.get('models/ford/focus.json')!.generations as Json[];
    const mk3v = gens.find((g) => g.slug === 'mk3')!.variants as Json[];
    const linked = mk3v.find((x) => x.id === 'ford-focus-mk3-115hp')!;
    assert.deepEqual((linked.marketAvailability as Json[])[0]!.modelYears, [2012, 2013]);
    assert.equal(mk3v.some((x) => String(x.engineId).endsWith('16-tdci-115')), false);
    const tdci120 = mk3v.find((x) => String(x.engineId).includes('tdci') && String(x.engineId).includes('120'));
    assert.ok(tdci120);
    assert.notEqual(tdci120!.engineId, 'ford-ecoblue-120');
  });

  test('yakıtı yazmayan ST-Line satırı performans motoruna bağlanmaz', () => {
    const catalog = miniCatalog();
    catalog.engines.get('ford.json')!.push({
      id: 'ford-st25', brandId: 'ford', slug: 'st25', name: '2.5 Duratec ST', fuel: 'petrol', displacementL: 2.5, power: { ps: 225 }, status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15',
    });
    const built = buildFromTsb(catalog, [row('FORD', '20', 'KUGA ST-LINE 2.5 225 AT', [2020, 2021])], OPTS);
    const kuga = built.merged.models.get('models/ford/kuga.json')!;
    const v = ((kuga.generations as Json[])[0]!.variants as Json[])[0]!;
    assert.notEqual(v.engineId, 'ford-st25');
    assert.equal(v.trimName, undefined);
  });

  test('temizleme elle girilmiş veriyi özgün hâline döndürür', () => {
    const stripped = stripTsb(r.merged);
    const original = miniCatalog();
    assert.equal(JSON.stringify(stripped.engines.get('ford.json')), JSON.stringify(original.engines.get('ford.json')));
    const v = (((stripped.models.get('models/ford/focus.json')!.generations as Json[])[0]!.variants) as Json[])[0]!;
    assert.deepEqual(v, ((original.models.get('models/ford/focus.json')!.generations as Json[])[0]!.variants as Json[])[0]);
  });
});

describe('TSB → katalog: alt modeller ve elle girilmiş Türkiye durumu', () => {
  const catalog = miniCatalog();
  const mk2Variant = ((catalog.models.get('models/ford/focus.json')!.generations as Json[])[0]!.variants as Json[])[0]!;
  const sold = { marketId: 'tr', status: 'sold', modelYears: [], trims: [], bodyTypes: [], sourceRefs: ['Broşür'], sourceIds: ['wp'] };
  mk2Variant.marketIds = ['eu', 'tr'];
  mk2Variant.marketAvailability = [sold];
  const rows = [
    row('FORD', '1', 'FOCUS 1.6 TDCi TITANIUM (109)', [2007, 2008]),
    row('FORD', '2', 'FOCUS 1.6i TREND (100)', [2006, 2007]),
    row('FORD', '3', 'FOCUS CLASSIC 1.6i TREND (100)', [2006, 2007]),
  ];
  const r = buildFromTsb(catalog, rows, OPTS);
  const gens = r.merged.models.get('models/ford/focus.json')!.generations as Json[];
  const variants = (slug: string) => (gens.find((g) => g.slug === slug)?.variants as Json[] | undefined) ?? [];

  test('alt model adı geçen satır ("FOCUS CLASSIC") model yılından nesle eşlenmez', () => {
    assert.equal(variants('mk2').filter((v) => String(v.engineId).endsWith('16-100')).length, 1);
    const bucket = variants('nesil-belirlenmedi');
    assert.equal(bucket.length, 1);
    assert.deepEqual((bucket[0]!.marketAvailability as Json[])[0]!.sourceRefs, ['TSB 53-3']);
  });

  test('başka kaynakla girilmiş Türkiye durumu TSB kaydıyla ezilmez; TSB satırları yanında izlenebilir kalır', () => {
    const v = variants('mk2').find((x) => x.id === 'ford-focus-mk2-g8da')!;
    const avail = v.marketAvailability as Json[];
    assert.deepEqual(avail[0], sold, 'elle girilmiş kayıt değişmez');
    const tsb = avail.find((a) => ((a.sourceIds as string[]) ?? []).includes('tsb-kasko-deger-listesi'));
    assert.ok(tsb && (tsb.sourceRefs as string[]).length > 0, 'TSB satır kimlikleri ayrı kayıtta korunur');
    assert.equal(availabilityFor(v as never, 'tr')!.status, 'sold', 'arayüz en güçlü durumu gösterir');
    const stripped = ((stripTsb(r.merged).models.get('models/ford/focus.json')!.generations as Json[])[0]!.variants as Json[])[0];
    assert.deepEqual(stripped, mk2Variant);
  });
});

describe('paylaşılan motor notu, yaklaşık nesil ve BMW ED', () => {
  test('paylaşılan motor başka modelin tip adını örnek göstermez', () => {
    const rows = [
      row('NISSAN', '1', 'MICRA 1.2 TEKNA 5 KAPI', [2015, 2016]),
      row('NISSAN', '2', 'QASHQAI 1.2 VISIA TC S/S', [2015, 2016]),
    ];
    const r = buildFromTsb(miniCatalog(), rows, OPTS);
    const engines = r.merged.engines.get('nissan.json') as Json[];
    const shared = engines.find((e) => e.name === '1.2')!;
    assert.equal(String(shared.notes ?? '').includes('MICRA'), false);
    assert.equal(String(shared.notes ?? '').includes('QASHQAI'), false);
    const variantNote = (file: string) => {
      const gens = r.merged.models.get(file)!.generations as Json[];
      return String((gens[0]!.variants as Json[])[0]!.notes);
    };
    assert.match(variantNote('models/nissan/micra.json'), /MICRA 1\.2 TEKNA/);
    assert.match(variantNote('models/nissan/qashqai.json'), /QASHQAI 1\.2 VISIA/);
    assert.doesNotMatch(variantNote('models/nissan/qashqai.json'), /MICRA/);
  });

  test('yaklaşık dünya aralığı, yılları kapsayan kesin nesli belirsiz bırakmaz', () => {
    const period = (start: number, end: number, approximate = false) => ({
      marketId: 'global',
      basis: 'production',
      start: { year: start },
      end: { year: end },
      ...(approximate ? { approximate: true } : {}),
    });
    const catalog = miniCatalog();
    catalog.models.set('models/nissan/x-trail.json', {
      id: 'nissan-x-trail',
      brandId: 'nissan',
      slug: 'x-trail',
      name: 'X-TRAIL',
      status: 'sourced',
      sourceIds: ['wpgen-1'],
      updatedAt: '2026-10-15',
      generations: [
        { id: 'nissan-x-trail-t31', slug: 't31', name: 'T31', order: 2, labelPeriod: period(2007, 2019, true), status: 'sourced', sourceIds: ['wpgen-1'], updatedAt: '2026-10-15', revisions: [], variants: [] },
        { id: 'nissan-x-trail-t32', slug: 't32', name: 'T32', order: 3, labelPeriod: period(2013, 2022), status: 'sourced', sourceIds: ['wpgen-1'], updatedAt: '2026-10-15', revisions: [], variants: [] },
      ],
    });
    const r = buildFromTsb(catalog, [row('NISSAN', '9', 'X-TRAIL 1.6 DCI SKY PACK 4X2', [2014, 2015, 2016, 2017, 2018])], OPTS);
    const gens = r.merged.models.get('models/nissan/x-trail.json')!.generations as Json[];
    assert.equal(((gens.find((g) => g.slug === 't32')!.variants as Json[]) ?? []).length, 1);
    assert.equal(gens.find((g) => g.slug === 'nesil-belirlenmedi'), undefined);
  });

  test('BMW 320i ED donanım paketi değil, ayrı güç sürümüdür', () => {
    const r = buildFromTsb(miniCatalog(), [row('BMW', '2', '320i ED 170 SEDAN', [2013, 2014]), row('BMW', '1', '320d SEDAN (184)', [2012, 2013])], OPTS);
    const engines = r.merged.engines.get('bmw.json') as Json[];
    const ed = engines.find((e) => String(e.name).includes('ED'));
    assert.ok(ed, JSON.stringify(engines.map((e) => e.name)));
    assert.equal((ed!.power as Json).ps, 170);
    assert.equal(ed!.fuel, 'petrol');
    const model = r.merged.models.get('models/bmw/3-serisi.json')!;
    const variants = (model.generations as Json[]).flatMap((g) => g.variants as Json[]);
    const edVariant = variants.find((v) => String(v.notes).includes('320i ED'));
    assert.ok(edVariant);
    assert.deepEqual((edVariant!.marketAvailability as Json[])[0]!.trims, []);
    assert.ok(engines.some((e) => e.fuel === 'diesel' && String(e.name).includes('320d')));
  });

  test('Mercedes "180 d" dizel eki donanım sayılmaz', () => {
    const r = buildFromTsb(
      miniCatalog(),
      [row('MERCEDES', '1', 'CLA 180 d FL AMG', [2016, 2017]), row('MERCEDES', '2', 'C 180 CGI', [2010, 2011])],
      OPTS,
    );
    const engines = r.merged.engines.get('mercedes-benz.json') as Json[];
    const diesel = engines.find((e) => String(e.name).includes('180') && e.fuel === 'diesel');
    const other = engines.find((e) => String(e.name).includes('180') && e.fuel !== 'diesel');
    assert.ok(diesel, JSON.stringify(engines.map((e) => [e.name, e.fuel])));
    assert.notEqual(diesel!.id, other?.id);
    const cla = r.merged.models.get('models/mercedes-benz/cla.json')!;
    const trims = ((cla.generations as Json[])[0]!.variants as Json[])[0]!.marketAvailability as Json[];
    assert.equal((trims[0]!.trims as string[]).includes('D'), false);
  });

  test('6.75 litre 6.7 veya 6.8 diye kesilmez; DS7CROSSBACK ayrı model olmaz', () => {
    const r = buildFromTsb(
      miniCatalog(),
      [row('ROLLS-ROYCE', '1', 'GHOST EWB 6.75', [2022, 2023]), row('DS', '1', 'DS7CROSSBACK PURETECH225 EAT8', [2021, 2022])],
      OPTS,
    );
    const rolls = [...r.merged.engines.values()].flat().find((e) => (e as Json).displacementL === 6.75) as Json | undefined;
    assert.equal(rolls?.name, '6.75');
    assert.ok(r.merged.models.get('models/ds/ds7.json'));
    assert.equal(r.merged.models.get('models/ds/ds7crossback.json'), undefined);
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
    assert.equal(isPerformance({ ...listed, marketAvailability: [{ ...listed.marketAvailability[0]!, trims: ['ST Line'] }] }), false);
    assert.equal(isPerformance({ ...listed, marketAvailability: [{ ...listed.marketAvailability[0]!, trims: ['ST-Line'] }] }), false);
    assert.equal(isPerformance({ ...listed, marketAvailability: [{ ...listed.marketAvailability[0]!, trims: ['RS Line'] }] }), false);
    assert.equal(isPerformance({ ...listed, marketAvailability: [{ ...listed.marketAvailability[0]!, trims: ['GT Line'] }] }), false);
    assert.equal(isPerformance({ ...listed, marketAvailability: [{ ...listed.marketAvailability[0]!, trims: ['RS'] }] }), true);
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
