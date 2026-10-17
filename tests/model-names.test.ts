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
        row('RENAULT', 'KADJAR 1.5 DCI 110'),
        row('RENAULT', 'KADJAR BLACK EDITION 1.5 DCI 110'),
        row('RENAULT', 'KADJAR BLACK EDITION 1.2 TCE 130'),
        row('RENAULT', 'KADJAR BLACK EDITION 1.5 DCI EDC 110'),
      ]),
      ['models/renault/kadjar.json'],
    );
  });
  test('i30 CW ve Accent Era asıl modelde', () => {
    assert.deepEqual(files([row('HYUNDAI', 'I30 1.6 CRDI STYLE'), row('HYUNDAI', 'I30 CW 1.6 CRDI STYLE'), row('HYUNDAI', 'ACCENT ERA 1.5 CRDI', [2010]), row('HYUNDAI', 'ACCENT 1.5 CRDI', [2010])]), [
      'models/hyundai/accent.json',
      'models/hyundai/i30.json',
    ]);
  });
  test('C5AIRCROSS / C5-AC → C5 Aircross; C3 Aircross ayrı kalır', () => {
    assert.deepEqual(files([row('CITROEN', 'C5AIRCROSS 1.5 BLUEHDI 130'), row('CITROEN', 'C5-AC 1.5 BLUEHDI 130'), row('CITROEN', 'C3AIRCROSS 1.2 PURETECH 110')]), [
      'models/citroen/c3aircross.json',
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
    assert.deepEqual(f, ['models/aston-martin/dbs.json', 'models/volvo/xc-90.json']);
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
