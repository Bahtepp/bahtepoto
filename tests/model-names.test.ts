/**
 * Model adı normalleştirmesi: gövde/donanım varyantları asıl modelde birleşir; ayrı modeller, performans
 * versiyonları ve motor tanımları yanlışlıkla birleştirilmez. Wikipedia başlık adayları ve yıl/kod
 * nitelendirmeli nesil bağlantıları.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { RawCatalog } from '../scripts/import/lib/io.ts';
import { candidateTitles, importBlocker, qualifiedLinks, type ModelGenerations } from '../scripts/import/generations/build.ts';
import { MODEL_ALIASES, WIKIPEDIA_TITLES } from '../scripts/import/tsb/aliases.ts';
import { buildFromTsb, TSB_SOURCE_ID } from '../scripts/import/tsb/build.ts';
import type { TsbRow } from '../scripts/import/tsb/parse.ts';

const OPTS = { today: '2026-10-17', sourceTitle: 'TSB', sourceNotes: 't' };
let code = 0;
const row = (brand: string, typeName: string, modelYears: number[] = [2020]): TsbRow => ({ brandCode: '9', typeCode: String(++code), brand, typeName, modelYears, files: ['t'] });
const empty = (): RawCatalog => ({ brands: [], markets: [{ id: 'tr', name: 'Türkiye', kind: 'country', isoCode: 'TR' }], sources: [], engines: new Map(), models: new Map() });
const build = (rows: TsbRow[]) => buildFromTsb(empty(), rows, OPTS);
const files = (rows: TsbRow[]) => [...build(rows).merged.models.keys()].sort();
/** Kaynak satırı → model dosyası. */
const placement = (rows: TsbRow[]) => {
  const r = build(rows);
  const out = new Map<string, string>();
  for (const [f, m] of r.merged.models)
    for (const g of (m.generations as { variants: { marketAvailability?: { sourceIds?: string[]; sourceRefs: string[] }[] }[] }[]) ?? [])
      for (const v of g.variants)
        for (const a of v.marketAvailability ?? []) if (a.sourceIds?.includes(TSB_SOURCE_ID)) for (const ref of a.sourceRefs) out.set(ref, f);
  return { out, rejected: r.stats };
};

describe('takma ad tablosu (gövde/donanım varyantları)', () => {
  test('Clio Grand Tour, Clio ile aynı modelde; gövde station wagon', () => {
    assert.deepEqual(files([row('RENAULT', 'CLIO 1.5 DCI JOY'), row('RENAULT', 'CLIO GRAND TOUR 1.5 DCI JOY')]), ['models/renault/clio.json']);
    assert.deepEqual(
      files([
        row('VOLKSWAGEN', 'ID.4 PURE 125 KW'),
        row('VOLKSWAGEN', 'ID4 PURE 109 KW'),
        row('VOLKSWAGEN', 'ID-4 150KW'),
        row('VOLKSWAGEN', 'ID.3 PRO (150KW)'),
      ]),
      ['models/volkswagen/id-3.json', 'models/volkswagen/id-4.json'],
    );
    assert.deepEqual(
      files([row('VOLKSWAGEN', 'AMAROK 2.0 TDI HIGHLINE'), row('VOLKSWAGEN', 'AMAROK AVENTURA 4x4 3.0 V6 TDI 224 OV')]),
      ['models/volkswagen/amarok.json'],
    );
    assert.deepEqual(files([row('VOLKSWAGEN', 'POLO 1.0 TSI 95'), row('VOLKSWAGEN', 'CROSS POLO 1.4 (80)')]), ['models/volkswagen/polo.json']);
    assert.deepEqual(
      files([
        row('VOLKSWAGEN', 'PASSAT CC 1.4 TSI 160'),
        row('VOLKSWAGEN', 'PASSAT CC 2.0 TSI 200'),
        row('VOLKSWAGEN', 'PASSAT CC 1.8 TFSI 160'),
        row('RENAULT', 'MEGANE CC 1.6 110'),
        row('RENAULT', 'MEGANE 1.6 110'),
      ]),
      ['models/renault/megane.json', 'models/volkswagen/cc.json'],
    );
    assert.deepEqual(
      files([
        row('RENAULT', 'KADJAR 1.5 DCI 110'),
        row('RENAULT', 'KADJAR BLACK EDITION 1.5 DCI 110'),
        row('RENAULT', 'KADJAR BLACK EDITION 1.2 TCE 130'),
        row('RENAULT', 'KADJAR BLACK EDITION 1.5 DCI EDC 110'),
      ]),
      ['models/renault/kadjar.json'],
    );
  });
  test('Egea Cross ve Linea Via asıl modelde; 500, 500L, 500X ve 500e ayrı', () => {
    assert.deepEqual(
      files([
        row('TOFAS-FIAT', 'EGEA SEDAN EASY 1.4 FIRE 95'),
        row('TOFAS-FIAT', 'EGEA CROSS STREET 1.4 FIRE 95'),
        row('TOFAS-FIAT', 'EGEA CROSS URBAN 1.4 FIRE 95'),
        row('TOFAS-FIAT', 'EGEA CROSS LOUNGE 1.4 FIRE 95'),
        row('TOFAS-FIAT', 'EGEA HB EASY 1.6 M.JET 120'),
      ]),
      ['models/fiat/egea.json'],
    );
    assert.deepEqual(
      files([
        row('TOFAS-FIAT', 'LINEA 1.4 FIRE (77)'),
        row('TOFAS-FIAT', 'LINEA VIA 1.4 FIRE 77 E5'),
        row('TOFAS-FIAT', 'LINEA VIA 1.3 MULTIJET 90'),
        row('TOFAS-FIAT', 'LINEA VIA 1.6 MULTIJET 105 E5'),
      ]),
      ['models/fiat/linea.json'],
    );
    assert.deepEqual(
      files([
        row('FIAT', 'PUNTO POP 1.4 FIRE (77)'),
        row('FIAT', 'PUNTO EASY 1.4 FIRE (77)'),
        row('FIAT', 'PUNTO LOUNGE 1.4 FIRE (77)'),
        row('FIAT', 'G.PUNTO 3K 1.4 FIRE (77) ACTIVE DUALOGIC'),
      ]),
      ['models/fiat/punto.json'],
    );
    assert.deepEqual(
      files([
        row('FIAT', '500 POP 1.2 (69)'),
        row('FIAT', '500C 1.2 (69) 3K'),
        row('FIAT', '500 C 1.4 (100)'),
        row('FIAT', '500L 1.4 FIRE 95 POP'),
        row('FIAT', '500X POP 1.6 E-TORQ 110'),
        row('FIAT', '500E HB LA PRIMA 42KWH'),
      ]),
      ['models/fiat/500.json', 'models/fiat/500e.json', 'models/fiat/500l.json', 'models/fiat/500x.json'],
    );
    const cabrio = build([row('FIAT', '500C 1.2 (69) 3K')]).merged.models.get('models/fiat/500.json');
    const bodies = ((cabrio?.generations as { variants: { marketAvailability?: { bodyTypes?: string[] }[] }[] }[]) ?? []).flatMap((g) =>
      g.variants.flatMap((v) => (v.marketAvailability ?? []).flatMap((a) => a.bodyTypes ?? [])),
    );
    assert.ok(bodies.includes('Cabrio'));
  });
  test('Opel X, -e ve motor kodu ayrı model açmaz', () => {
    assert.deepEqual(
      files([
        row('OPEL', 'CROSSLAND X 1.2 110 ENJOY'),
        row('OPEL', 'CROSSLAND X 1.2 130 ENJOY'),
        row('OPEL', 'CROSSLAND X 1.2 81 ENJOY'),
        row('OPEL', 'CROSSLANDX 1.5DIZEL 102 MT6'),
      ]),
      ['models/opel/crossland.json'],
    );
    assert.deepEqual(
      files([
        row('OPEL', 'CORSA 1.2 100 AT8 EDITION'),
        row('OPEL', 'CORSA 1.2 75 MT5 ESSENTIAL'),
        row('OPEL', 'CORSA 1.4 90'),
        row('OPEL', 'CORSA-E 100KW GS'),
      ]),
      ['models/opel/corsa.json'],
    );
    assert.deepEqual(
      files([
        row('OPEL', 'ADAM 1.4 87 JAM'),
        row('OPEL', 'ADAM B14 XEL 87 MTA JAM'),
        row('OPEL', 'ADAM B14 XEL 87 GLAM'),
        row('OPEL', 'ADAM B14 XEL 87 SLAM'),
      ]),
      ['models/opel/adam.json'],
    );
    const opc = build([row('OPEL', 'ASTRA GTC OPC 2.0 280 MT6')]).merged.models.get('models/opel/astra.json');
    const trimName = ((opc?.generations as { variants: { trimName?: string }[] }[]) ?? []).flatMap((g) => g.variants.map((v) => v.trimName)).find(Boolean);
    assert.equal(trimName, 'OPC');
  });
  test('Peugeot elektrikli sürüm ve Citroën Aircross asıl modelinde', () => {
    assert.deepEqual(
      files([
        row('PEUGEOT', '208 1.2 PURETECH 100 ACTIVE'),
        row('PEUGEOT', '208 1.2 PURETECH 130 ALLURE'),
        row('PEUGEOT', '208 1.5 BLUEHDI 100'),
        row('PEUGEOT', 'E-208 GT 100KW'),
      ]),
      ['models/peugeot/208.json'],
    );
    assert.deepEqual(
      files([
        row('CITROEN', 'C3 1.2 PURETECH 83 FEEL'),
        row('CITROEN', 'C3 1.2 PURETECH 110 SHINE'),
        row('CITROEN', 'C3 AIRCROSS 1.2 PURETECH 110 FEEL'),
        row('CITROEN', 'C3 AIRCROSS 1.5 BLUEHDI 120 SHINE'),
        row('CITROEN', 'C3 AIRCROSS 1.2 PURETECH 130 SHINE'),
        row('CITROEN', 'C3AIRCROSS 1.2 PURETECH 130'),
      ]),
      ['models/citroen/c3-aircross.json', 'models/citroen/c3.json'],
    );
    assert.deepEqual(
      files([
        row('CITROEN', 'C5 2.0 HDI EXCLUSIVE'),
        row('CITROEN', 'C5 AIRCROSS 1.5 BLUEHDI 130 FEEL'),
        row('CITROEN', 'C5 X 1.6 PHEV 181'),
        row('CITROEN', 'C4 1.2 PURETECH 130 FEEL'),
        row('CITROEN', 'C4 X FEEL 1.2 PURETECH 100'),
        row('CITROEN', 'C4 PICASSO 1.6 HDI 110'),
      ]),
      ['models/citroen/c4-picasso.json', 'models/citroen/c4-x.json', 'models/citroen/c4.json', 'models/citroen/c5-aircross.json', 'models/citroen/c5-x.json', 'models/citroen/c5.json'],
    );
  });
  test('Corolla Cross ve Yaris Cross ayrı model; RAV 4, RAV4 ile aynı', () => {
    const cross = (name: string) => row('TOYOTA', name);
    assert.deepEqual(
      files([
        cross('COROLLA 1.6 ACTIVE'),
        cross('COROLLA 1.8 HYBRID VISION E-CVT'),
        cross('COROLLA CROSS 1.8 HYBRID FLAME E-CVT'),
        cross('COROLLA CROSS 1.8 HYBRID PASSION E-CVT'),
        cross('COROLLA CROSS 1.8 HYBRID DREAM E-CVT'),
        cross('YARIS 1.5 HYBRID COOL'),
        cross('YARIS CROSS 1.5 DREAM MULTIDRIVE S'),
        cross('YARIS CROSS 1.5 HYBRID DREAM E-CVT'),
        cross('YARIS CROSS 1.5 HYBRID FLAME E-CVT'),
      ]),
      ['models/toyota/corolla-cross.json', 'models/toyota/corolla.json', 'models/toyota/yaris-cross.json', 'models/toyota/yaris.json'],
    );
    assert.deepEqual(
      files([
        row('FIAT', '500X POP 1.6 E-TORQ 110'),
        row('FIAT', '500X CROSS 1.6 E-TORQ 110'),
        row('FIAT', '500X CROSS 1.4 MULTIAIR 140'),
        row('FIAT', '500X CROSS PLUS 1.6 E-TORQ 110'),
        row('FIAT', 'PANDA CROSS 1.2'),
      ]),
      ['models/fiat/500x.json', 'models/fiat/panda.json'],
    );
    assert.deepEqual(
      files([
        cross('RAV4 2.5 HYBRID PREMIUM 4x4'),
        cross('RAV4 2.0 MULTIDRIVE S'),
        cross('RAV4 2.2 D-4D PREMIUM'),
        cross('RAV 4 2.0 VVT-I 5 KAPI'),
      ]),
      ['models/toyota/rav4.json'],
    );
  });
  test('i30 CW i30 gövdesidir; Accent, Era ve Blue ayrı kalır', () => {
    assert.deepEqual(files([row('HYUNDAI', 'I30 1.6 CRDI STYLE'), row('HYUNDAI', 'I30 CW 1.6 CRDI STYLE')]), ['models/hyundai/i30.json']);
    assert.deepEqual(
      files([
        row('HYUNDAI', 'ACCENT 1.5 CRDI', [2010]),
        row('HYUNDAI', 'ACCENT ERA 1.5 CRDI', [2010]),
        row('HYUNDAI', 'ACCENT BLUE 1.4 CVVT MODE', [2012]),
      ]),
      ['models/hyundai/accent-blue.json', 'models/hyundai/accent-era.json', 'models/hyundai/accent.json'],
    );
  });
  test('Ioniq 5 ve Ioniq 6, Ioniq’ten ayrıdır; ix35 Tucson’a karışmaz', () => {
    assert.deepEqual(
      files([
        row('HYUNDAI', 'IONIQ HYBRID 1.6 GDI HEV'),
        row('HYUNDAI', 'IONIQ 5 PROGRESSIVE 125KW'),
        row('HYUNDAI', 'IONIQ 6 PROGRESSIVE 111 KW'),
      ]),
      ['models/hyundai/ioniq-5.json', 'models/hyundai/ioniq-6.json', 'models/hyundai/ioniq.json'],
    );
    assert.deepEqual(files([row('HYUNDAI', 'TUCSON 1.6 T-GDI STYLE'), row('HYUNDAI', 'IX35 1.6 GDI STYLE')]), [
      'models/hyundai/ix35.json',
      'models/hyundai/tucson.json',
    ]);
  });
  test('Type R Civic’te kalır', () => {
    assert.deepEqual(files([row('HONDA', 'CIVIC SEDAN 1.6 (125) DREAM'), row('HONDA', 'TYPE-R 2.0 TURBO i-VTEC')]), ['models/honda/civic.json']);
    const civic = build([row('HONDA', 'TYPE-R 2.0 TURBO i-VTEC')]).merged.models.get('models/honda/civic.json');
    const trimName = ((civic?.generations as { variants: { trimName?: string }[] }[]) ?? []).flatMap((g) => g.variants.map((v) => v.trimName)).find(Boolean);
    assert.equal(trimName, 'TYPE R');
  });
  test('C5AIRCROSS / C5-AC → C5 Aircross; C3 Aircross ayrı kalır', () => {
    assert.deepEqual(files([row('CITROEN', 'C5AIRCROSS 1.5 BLUEHDI 130'), row('CITROEN', 'C5-AC 1.5 BLUEHDI 130'), row('CITROEN', 'C3AIRCROSS 1.2 PURETECH 110')]), [
      'models/citroen/c3-aircross.json',
      'models/citroen/c5-aircross.json',
    ]);
  });
  test('tablo performans/ayrı model adı içermez (TTS, RS, AMG, GT)', () => {
    for (const [brand, entries] of Object.entries(MODEL_ALIASES))
      for (const [from, a] of Object.entries(entries)) {
        assert.doesNotMatch(from, /^(TTS|RS ?\d|AMG|GTI|M\d)\b/, `${brand}: ${from}`);
        assert.notEqual(from, a.model, `${brand}: ${from} kendine bağlanmış`);
        assert.ok(a.note.length > 0, `${brand}: ${from} gerekçesiz`);
      }
  });
  test('Audi TTR → TT; TTS ayrı model', () => {
    assert.deepEqual(files([row('AUDI', 'TT 2.0 TFSI (230)'), row('AUDI', 'TTR 2.0 TFSI (230)'), row('AUDI', 'TTS 2.0 TFSI (310)')]), ['models/audi/tt.json', 'models/audi/tts.json']);
  });
});

describe('yanlış birleşmeye karşı', () => {
  test('yazım farkı birleştirmesi rakamları farklı modelleri birleştirmez (C3/C5, 208/308)', () => {
    const rows = [
      ...Array.from({ length: 4 }, () => row('PEUGEOT', '208 1.2 PURETECH ACTIVE')),
      row('PEUGEOT', '308 1.2 PURETECH ACTIVE'),
      ...Array.from({ length: 4 }, () => row('CITROEN', 'C3 1.2 PURETECH FEEL')),
      row('CITROEN', 'C5 1.6 HDI'),
    ];
    assert.deepEqual(files(rows), ['models/citroen/c3.json', 'models/citroen/c5.json', 'models/peugeot/208.json', 'models/peugeot/308.json']);
  });
  test('"RX 300", "FX 37", "SF 90": motor/güç tanımı yoksa harf + sayı birleştirilmez', () => {
    const f = files([row('LEXUS', 'RX 300 EXECUTIVE'), row('INFINITI', 'FX 37 GT PREMIUM'), row('FERRARI', 'SF 90 STRADALE')]);
    assert.deepEqual(f, ['models/ferrari/sf.json', 'models/infiniti/fx.json', 'models/lexus/rx.json']);
  });
  test('"DBS 770" (3 harf + 3 rakam) birleştirilmez; "XC 90 2.0" birleşir', () => {
    const f = files([row('ASTON MARTIN', 'DBS 770 ULTIMATE 5.2 (770)'), row('VOLVO', 'XC 90 2.0 D5 (235) INSCRIPTION')]);
    assert.deepEqual(f, ['models/aston-martin/dbs.json', 'models/volvo/xc90.json']);
  });
  test('"MERCEDES-AMG 63 S" kaybolmaz; "MERCEDES-AMG C 43" C sınıfına gider', () => {
    const rows = [row('MERCEDES', 'MERCEDES-AMG 63 S 4MATIC+ FL'), row('MERCEDES', 'MERCEDES-AMG C 43 4MATIC 3.0 (390)')];
    const { out } = placement(rows);
    assert.equal(out.size, 2, 'her TSB satırı bir kez');
    assert.equal(out.get(`9-${rows[1]!.typeCode}`) ?? [...out.values()].find((f) => f.endsWith('/c.json')), 'models/mercedes-benz/c.json');
    assert.ok(![...out.values()].some((f) => f.endsWith('/63.json')), [...out.values()].join(', '));
  });
});

describe('Wikipedia başlıkları', () => {
  test('aday biçimleri: Serisi → Series, kısa kod büyük harf, -Class, bitişik/tireli, i önekli', () => {
    assert.ok(candidateTitles('BMW', '3 Serisi').includes('BMW 3 Series'));
    assert.ok(candidateTitles('Mercedes-Benz', 'Cla').includes('Mercedes-Benz CLA-Class'));
    assert.ok(candidateTitles('Volvo', 'XC 90').includes('Volvo XC90'));
    assert.ok(candidateTitles('BMW', 'I3').includes('BMW i3'));
    assert.ok(candidateTitles('DS', 'DS 7').includes('DS 7'));
  });
  test('takma ad başlığı kimlik sayılır, eşleşmeyen başlık sayılmaz', () => {
    const mg = (identity: ModelGenerations['identity'], article: string): ModelGenerations => ({
      modelFile: 'models/mini/mini.json', modelId: 'mini-mini', article, status: 'found', identity, conflicts: [], overlaps: [], pages: [],
      generations: [{ slug: 'f56', name: 'F56', code: 'F56', ordinal: 3, start: 2014, end: null, marketId: 'global', approximate: false, engineDisplacementsL: [], engineSignatures: [], page: 'Mini Hatch', productionNote: '' }],
    });
    assert.equal(WIKIPEDIA_TITLES['mini/mini'], 'Mini Hatch');
    assert.equal(importBlocker(mg({ via: 'alias', label: 'Mini Hatch' }, 'Mini Hatch'), 'MINI', 'Mini'), undefined);
    assert.match(importBlocker(mg({ via: 'title' }, 'Mini Hatch'), 'MINI', 'Countryman') ?? '', /eşleşmiyor/);
  });
  test('nitelendirilmiş bağlantılar: yıl/kod kabul, sözcük reddedilir', () => {
    const page = {
      title: 'Toyota Corolla', pageid: 1, revid: 1,
      wikitext: '[[Toyota Corolla (E120)]] [[Toyota Corolla (2018)|x]] [[Toyota Corolla (1995–2004)]] [[Toyota Corolla (Cross)]] [[Toyota Corolla (disambiguation)]] [[Toyota Camry (XV70)]]',
    };
    assert.deepEqual(qualifiedLinks(page).sort(), ['Toyota Corolla (1995–2004)', 'Toyota Corolla (2018)', 'Toyota Corolla (E120)']);
  });
});
