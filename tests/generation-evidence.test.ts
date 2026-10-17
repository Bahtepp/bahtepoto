/**
 * Eksik nesilleri tamamlama kuralları: yalnızca tek neslin bütün yılları kapsaması, motor hacmi + yakıt
 * kanıtı (hacim tek başına yetmez), kaynakta çelişkili nesil dönemleri, Wikidata ile ad normalleştirme,
 * nesil düzeyinde çelişki ayıklama ve TSB ad normalleştirmesi (Mercedes C180, Chrysler JEEP, BMW M340d).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { Json, RawCatalog } from '../scripts/import/lib/io.ts';
import { applyGenerations, generationsFromArticle, importBlocker, type ModelGenerations, type StagedGeneration, type WikiPage } from '../scripts/import/generations/build.ts';
import { pickMatch } from '../scripts/import/generations/wikidata.ts';
import { buildFromTsb, stripTsb } from '../scripts/import/tsb/build.ts';
import type { TsbRow } from '../scripts/import/tsb/parse.ts';

const OPTS = { today: '2026-10-17', sourceTitle: 'TSB', sourceNotes: 't' };
const row = (brand: string, typeCode: string, typeName: string, modelYears: number[]): TsbRow => ({ brandCode: '9', typeCode, brand, typeName, modelYears, files: ['t'] });

const g = (slug: string, code: string, ordinal: number, start: number, end: number | null, signatures: string[]): StagedGeneration => ({
  slug, name: `3 Serisi (${code})`, code, ordinal, start, end, marketId: 'global', approximate: false, engineDisplacementsL: [], engineSignatures: signatures, page: `P ${code}`, productionNote: '',
});
const staged = (gens: StagedGeneration[], extra: Partial<ModelGenerations> = {}): ModelGenerations => ({
  modelFile: 'models/bmw/3-serisi.json', modelId: 'bmw-3-serisi', article: 'BMW 3 Series', status: 'found', generations: gens,
  pages: gens.map((x, i) => ({ title: x.page, pageid: 70 + i, revid: 1 })), conflicts: [], overlaps: [], ...extra,
});
const catalog = (): RawCatalog => ({
  brands: [{ id: 'bmw', slug: 'bmw', name: 'BMW', status: 'sourced', sourceIds: ['tsb-kasko-deger-listesi'], updatedAt: '2026-10-15' }],
  markets: [{ id: 'tr', name: 'Türkiye', kind: 'country', isoCode: 'TR' }],
  sources: [],
  engines: new Map(),
  models: new Map<string, Json>([['models/bmw/3-serisi.json', { id: 'bmw-3-serisi', brandId: 'bmw', slug: '3-serisi', name: '3 Serisi', status: 'sourced', sourceIds: ['tsb-kasko-deger-listesi'], updatedAt: '2026-10-15', generations: [] }]]),
});
function run(rows: TsbRow[], st: ModelGenerations[], blocked?: Map<string, { start: number; end: number | null }[]>) {
  const withGens = applyGenerations(stripTsb(catalog()), st, '2026-10-17');
  return buildFromTsb(withGens.catalog, rows, { ...OPTS, blockedSpans: blocked });
}
const genOfRef = (r: ReturnType<typeof run>, ref: string) => {
  for (const m of r.merged.models.values()) for (const gen of (m.generations as Json[]) ?? []) for (const v of (gen.variants as Json[]) ?? []) {
    if (((v.marketAvailability as Json[])[0]!.sourceRefs as string[]).includes(ref)) return String(gen.slug);
  }
  return undefined;
};

// E90 2004–2013 ve F30 2011–2018 (üretim): 2011–2014 model yılları iki nesle uyar.
const E90_F30 = [staged([g('e90', 'E90', 5, 2004, 2013, ['2.0:diesel', '1.6:petrol']), g('f30', 'F30', 6, 2011, 2018, ['2.0:diesel', '1.5:petrol'])])];

describe('bütün yılları tek nesil kapsıyorsa', () => {
  test('"320d 2008–2012": yalnızca E90 bütün yılları kapsar → E90', () => {
    const r = run([row('BMW', '1', '320d 2.0 (184)', [2008, 2009, 2010, 2011, 2012])], E90_F30);
    assert.equal(genOfRef(r, 'TSB 9-1'), 'e90');
    assert.equal(r.stats.matchedByContainment, 1);
  });

  test('tek model yılı iki nesle uyuyorsa tahmin yapılmaz', () => {
    const r = run([row('BMW', '2', '320d 2.0 (184)', [2012])], E90_F30);
    assert.equal(genOfRef(r, 'TSB 9-2'), 'nesil-belirlenmedi');
  });
});

describe('motor kanıtı: hacim + yakıt', () => {
  test('1.6 benzinli yalnızca E90 için listeli → E90', () => {
    const r = run([row('BMW', '3', '316i 1.6 (136)', [2012])], E90_F30);
    assert.equal(genOfRef(r, 'TSB 9-3'), 'e90');
    assert.equal(r.stats.matchedByEngine, 1);
  });

  test('yakıt türü bilinmiyorsa motor hacmi tek başına kanıt sayılmaz', () => {
    const r = run([row('BMW', '4', '316 1.6 (136)', [2012])], E90_F30);
    assert.equal(genOfRef(r, 'TSB 9-4'), 'nesil-belirlenmedi');
  });

  test('aynı hacim + yakıt iki nesilde de varsa belirsiz kalır', () => {
    const r = run([row('BMW', '5', '320d 2.0 (190)', [2012])], E90_F30);
    assert.equal(genOfRef(r, 'TSB 9-5'), 'nesil-belirlenmedi');
  });
});

describe('kaynakta çelişkili nesiller', () => {
  test('çelişkili neslin dönemine düşen yıllar yıl/motor kuralıyla eşlenmez', () => {
    const blocked = new Map([['models/bmw/3-serisi.json', [{ start: 2007, end: 2010 }]]]);
    const r = run([row('BMW', '6', '320d 2.0 (184)', [2008, 2009])], E90_F30, blocked);
    assert.equal(genOfRef(r, 'TSB 9-6'), 'nesil-belirlenmedi');
    const reasons = r.unassignedReasons.map((x) => x.reason);
    assert.ok(reasons.some((x) => x.includes('çelişkili bir neslin dönemine')));
  });

  test('aynı nesil numarası iki kez: ikisi de aktarılmaz, diğer nesiller aktarılır', () => {
    const box = (name: string, prod: string) => `{{Infobox automobile\n| name = ${name}\n| production = ${prod}\n}}`;
    const art: WikiPage = {
      title: 'Kia Rio', pageid: 1, revid: 1,
      wikitext: ['== Third generation (UB; 2011) ==', box('Rio', '2011–2017'), '== Fourth generation (YB; 2017) ==', box('Rio', '2017–2023'), '== Fourth generation (FB; 2017) ==', box('Rio', '2017–present (China)')].join('\n'),
    };
    const out = generationsFromArticle(art, new Map(), 'Kia', 'Rio', 2026);
    // "YB"/"FB" rakam içermediği için kasa kodu sayılmaz; ikisi de "4. nesil" olarak çakışır.
    assert.deepEqual(out.conflictSlugs, ['4-nesil']);
    assert.ok(out.blockedSpans.length >= 2);
    const mg: ModelGenerations = { modelFile: 'models/kia/rio.json', modelId: 'kia-rio', article: 'Kia Rio', status: 'found', generations: out.gens, pages: [{ title: 'Kia Rio', pageid: 1, revid: 1 }], conflicts: out.conflicts, overlaps: [], conflictSlugs: out.conflictSlugs, blockedSpans: out.blockedSpans };
    assert.equal(importBlocker(mg, 'Kia', 'Rio'), undefined, 'çelişkisiz nesil kaldığı için model aktarılabilir');
    const cat: RawCatalog = { ...catalog(), models: new Map([['models/kia/rio.json', { id: 'kia-rio', brandId: 'kia', slug: 'rio', name: 'Rio', status: 'sourced', sourceIds: ['tsb-kasko-deger-listesi'], updatedAt: '2026-10-15', generations: [] }]]) };
    const applied = applyGenerations(cat, [mg], '2026-10-17');
    assert.deepEqual((applied.catalog.models.get('models/kia/rio.json')!.generations as Json[]).map((x) => x.slug), ['3-nesil']);
  });
});

describe('Wikidata ile ad normalleştirme', () => {
  const car = (id: string, enwiki: string) => ({ id, claims: { P31: [{ mainsnak: { datavalue: { value: { id: 'Q3231690' } } } }] }, sitelinks: { enwiki: { title: enwiki } } });
  const ents = new Map<string, Record<string, unknown>>([
    ['Q1', car('Q1', 'Audi RS 4')],
    ['Q2', car('Q2', 'Fiat Tipo (2015)')],
    ['Q3', { id: 'Q3', claims: { P31: [{ mainsnak: { datavalue: { value: { id: 'Q5' } } } }] }, sitelinks: { enwiki: { title: 'Egea (person)' } } }],
    ['Q4', car('Q4', 'Ford Puma (crossover)')],
    ['Q6', car('Q6', 'Ford Puma (coupé)')],
  ]);
  test('etiket/diğer ad boşluk ve aksan farkı dışında birebir eşleşmeli', () => {
    assert.equal(pickMatch('Audi RS4', [{ id: 'Q1', label: 'Audi RS 4' }], ents as never)?.enwiki, 'Audi RS 4');
    assert.equal(pickMatch('Fiat Egea', [{ id: 'Q2', label: 'Fiat Tipo', aliases: ['Fiat Egea'] }], ents as never)?.enwiki, 'Fiat Tipo (2015)');
    assert.equal(pickMatch('Audi RS4', [{ id: 'Q1', label: 'Audi RS 4 Avant quattro' }], ents as never), undefined);
  });
  test('otomobil modeli olmayan öğe ve iki ayrı model (belirsiz ad) kabul edilmez', () => {
    assert.equal(pickMatch('Fiat Egea', [{ id: 'Q3', label: 'Fiat Egea' }], ents as never), undefined);
    assert.equal(pickMatch('Ford Puma', [{ id: 'Q4', label: 'Ford Puma' }, { id: 'Q6', label: 'Ford Puma' }], ents as never), undefined);
  });
});

describe('TSB ad normalleştirme', () => {
  const build = (rows: TsbRow[]) => buildFromTsb({ ...catalog(), brands: [], models: new Map() }, rows, OPTS);
  test('Mercedes "C180" ve "C 200" aynı modelde (C), motor tanımı korunur', () => {
    const r = build([row('MERCEDES', '1', 'C180 AVANTGARDE 1.6 (156)', [2015]), row('MERCEDES', '2', 'C 200 AVANTGARDE 1.5 (184)', [2019])]);
    const files = [...r.merged.models.keys()];
    assert.deepEqual(files, ['models/mercedes-benz/c.json']);
    const engines = (r.merged.engines.get('mercedes-benz.json') ?? []).map((e) => String(e.name));
    assert.ok(engines.some((n) => n.includes('180')), engines.join(', '));
  });
  test('Chrysler altında listelenen "JEEP" modelleri Jeep markasına geçer', () => {
    const r = build([row('CHRYSLER', '3', 'JEEP COMPASS 1.4 (170) LIMITED', [2018])]);
    assert.ok(r.merged.models.has('models/jeep/compass.json'), [...r.merged.models.keys()].join(', '));
  });
  test('BMW "M340i" 3 Serisi; "M3" ayrı model kalır', () => {
    const r = build([row('BMW', '4', 'M340i 3.0 (374) xDRIVE', [2020]), row('BMW', '5', 'M3 3.0 (480) COMPETITION', [2021])]);
    const files = [...r.merged.models.keys()].sort();
    assert.deepEqual(files, ['models/bmw/3-serisi.json', 'models/bmw/m3.json']);
  });
});
