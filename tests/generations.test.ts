/**
 * Wikipedia nesil toplayıcısı (scripts/import/generations): bilgi kutusu ayrıştırma, üretim satırı
 * seçimi (Türkiye > Avrupa > açıklamasız > en geniş), kasa kodu ve nesil numarası, nesil çıkarımı ve
 * katalog kopyasına ekleme kuralları. Ağa çıkmaz.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { Json, RawCatalog } from '../scripts/import/lib/io.ts';
import {
  applyGenerations,
  candidateTitles,
  generationsFromArticle,
  hasCuratedGenerations,
  pickProduction,
  stripWikipedia,
  type ModelGenerations,
  type WikiPage,
} from '../scripts/import/generations/build.ts';
import { chassisCodes, engineDisplacements, generationOrdinal, parseInfoboxes, parseProduction } from '../scripts/import/generations/wikitext.ts';

const page = (title: string, wikitext: string, pageid = 1): WikiPage => ({ title, pageid, revid: 100 + pageid, wikitext });

describe('wikitext ayrıştırma', () => {
  test('iç içe şablonlu bilgi kutusu alanları ve bölüm başlığı', () => {
    const boxes = parseInfoboxes(`intro\n== Fourth generation (E46; 1998) ==\n{{Infobox automobile\n| name = BMW 3 Series (E46)\n| production = {{ubl|1997–2006}}\n| engine = {{plainlist|\n* 1.9 L M43 I4\n* 3.0 L M54 I6}}\n}}\n`);
    assert.equal(boxes.length, 1);
    assert.equal(boxes[0]!.heading, 'Fourth generation (E46; 1998)');
    assert.equal(boxes[0]!.fields.name, 'BMW 3 Series (E46)');
    assert.deepEqual(engineDisplacements(boxes[0]!.fields.engine!), [1.9, 3]);
  });

  test('üretim satırları: ülke notu, "present", tek yıl', () => {
    assert.deepEqual(parseProduction('2012–2020 (France)<br>2012–2021 (Turkey)'), [
      { start: 2012, end: 2020, note: 'France' },
      { start: 2012, end: 2021, note: 'Turkey' },
    ]);
    assert.deepEqual(parseProduction('2019–present'), [{ start: 2019, end: null, note: '' }]);
    assert.deepEqual(parseProduction('August 1997 – 2003<ref>x</ref>'), [{ start: 1997, end: 2003, note: '' }]);
  });

  test('satır seçimi: Türkiye > Avrupa > açıklamasız > en geniş (yaklaşık)', () => {
    const lines = parseProduction('2012–2020 (France)\n2012–2021 (Turkey)\n2018–2021 (Algeria)');
    assert.deepEqual(pickProduction(lines), { start: 2012, end: 2021, marketId: 'tr', approximate: false, note: 'Turkey' });
    assert.equal(pickProduction(parseProduction('1996–2010 (Czech Republic)\n2002–2010 (India)'))!.marketId, 'eu');
    assert.deepEqual(pickProduction(parseProduction('2010–2015\n2010–2018 (China)')), { start: 2010, end: 2015, marketId: 'global', approximate: false, note: '' });
    const wide = pickProduction(parseProduction('2013–2020 (China)\n2015–2020 (Brazil)'))!;
    assert.deepEqual([wide.start, wide.end, wide.approximate], [2013, 2020, true]);
  });

  test('kasa kodu ve nesil numarası yalnızca yazandan', () => {
    assert.deepEqual(chassisCodes('Fifth generation (E90/E91/E92/E93; 2004)'), ['E90', 'E91', 'E92', 'E93']);
    assert.deepEqual(chassisCodes("Third generation (''Typ'' 5E; 2012)"), ['5E']);
    assert.equal(generationOrdinal('Fourth generation (E46; 1998)'), 4);
    assert.equal(generationOrdinal('Volkswagen Golf Mk7'), 7);
    assert.equal(generationOrdinal('Clio IV'), 4);
    assert.equal(generationOrdinal('Renault Clio'), undefined);
  });

  test('aday başlıklar: "3 Serisi" → "3 Series", tek harf → "-Class"', () => {
    assert.ok(candidateTitles('BMW', '3 Serisi').includes('BMW 3 Series'));
    assert.ok(candidateTitles('Mercedes-Benz', 'C').includes('Mercedes-Benz C-Class'));
    assert.ok(candidateTitles('Ford', 'C-MAX').includes('Ford C-Max'));
  });
});

const infobox = (name: string, production: string, extra = '') => `{{Infobox automobile\n| name = ${name}\n| production = ${production}\n${extra}}}`;

describe('maddeden nesil çıkarımı', () => {
  test('bölüm bilgi kutuları; giriş kutusu (tüm model) nesil sayılmaz; gelecekteki nesil atlanır', () => {
    const art = page(
      'Renault Clio',
      [
        infobox('Renault Clio', '1990–present'),
        '== Third generation (X85; 2005) ==',
        infobox('Clio III', '2005–2012', '| engine = 1.2 L I4<br>1.5 L dCi\n'),
        '== Fourth generation (X98; 2012) ==',
        infobox('Clio IV', '2012–2020 (France)<br>2012–2021 (Turkey)'),
        '== Sixth generation (X60; 2027) ==',
        infobox('Clio VI', '2027–present'),
      ].join('\n'),
    );
    const { gens } = generationsFromArticle(art, new Map(), 'Renault', 'Clio', 2026);
    assert.deepEqual(gens.map((g) => [g.slug, g.name, g.code, g.start, g.end, g.marketId]), [
      ['x85', 'Clio III (X85)', 'X85', 2005, 2012, 'global'],
      ['x98', 'Clio IV (X98)', 'X98', 2012, 2021, 'tr'],
    ]);
    assert.deepEqual(gens[0]!.engineDisplacementsL, [1.2, 1.5]);
  });

  test('{{Main}} ile bağlanan nesil maddeleri; Türkçe ad ("3 Serisi", "1. nesil")', () => {
    const art = page('BMW 3 Series', '== Fourth generation (E46; 1998) ==\n{{Main|BMW 3 Series (E46)}}\ntext\n== M versions ==\n{{Main|BMW M3}}');
    const linked = new Map([
      ['BMW 3 Series (E46)', page('BMW 3 Series (E46)', infobox('BMW 3 Series (E46)', '1997–2006'), 2)],
      ['BMW M3', page('BMW M3', infobox('BMW M3', '1986–present'), 3)],
    ]);
    const { gens, used } = generationsFromArticle(art, linked, 'BMW', '3 Serisi', 2026);
    assert.deepEqual(gens.map((g) => [g.name, g.code, g.start, g.end, g.page]), [['3 Serisi (E46)', 'E46', 1997, 2006, 'BMW 3 Series (E46)']]);
    assert.deepEqual(used.map((p) => p.title), ['BMW 3 Series (E46)'], 'türev model (M3) nesil sayılmaz');
  });

  test('halef model nesil sayılmaz (Citroën C5 X)', () => {
    const art = page('Citroën C5', ['== Second generation (RD/TD; 2008) ==', infobox('Citroën C5', '2008–2017'), '== Successor ==', '{{Main|Citroën C5 X}}'].join('\n'));
    const linked = new Map([['Citroën C5 X', page('Citroën C5 X', infobox('Citroën C5 X', '2022–2026'), 2)]]);
    const { gens } = generationsFromArticle(art, linked, 'Citroën', 'C5', 2026);
    assert.equal(gens.some((g) => g.page === 'Citroën C5 X' || g.name === 'C5 X'), false);
    assert.ok(gens.some((g) => g.start === 2008));
  });

  test('model maddesinin başlığı kasa kodu sayılmaz ("Audi A5")', () => {
    const art = page('Audi A5', ['== First generation (8T/8F; 2007) ==', infobox('Audi A5', '2007–2016'), '== Second generation (F5; 2016) ==', infobox('Audi A5', '2016–2024')].join('\n'));
    const { gens } = generationsFromArticle(art, new Map(), 'Audi', 'A5', 2026);
    assert.deepEqual(gens.map((g) => g.code), ['8T/8F', 'F5']);
  });

  test('aynı kasa kodunu paylaşan farklı nesiller birleştirilmez (Audi A4 B6/B7)', () => {
    const art = page('Audi A4', ['== Second generation (8E/8H; 2000) ==', infobox('B6', '2000–2006'), '== Third generation (8E/8H; 2004) ==', infobox('B7', '2004–2009')].join('\n'));
    const { gens, conflicts } = generationsFromArticle(art, new Map(), 'Audi', 'A4', 2026);
    assert.equal(gens.length, 2);
    assert.deepEqual(conflicts, []);
  });

  test('ardışık nesillerin örtüşmesi çelişki değil, bilgi notudur', () => {
    const art = page('BMW 3 Series', ['== Fourth generation (E46; 1998) ==', infobox('E46', '1997–2006'), '== Fifth generation (E90; 2004) ==', infobox('E90', '2004–2013')].join('\n'));
    const { conflicts, overlaps } = generationsFromArticle(art, new Map(), 'BMW', '3 Serisi', 2026);
    assert.deepEqual(conflicts, []);
    assert.equal(overlaps.length, 1);
  });
});

function catalog(): RawCatalog {
  const tsbBucket = { id: 'bmw-3-serisi-nesil-belirlenmedi', slug: 'nesil-belirlenmedi', name: '3 Serisi (nesil belirlenmedi)', order: 999, labelPeriod: { marketId: 'tr', basis: 'model-year', start: { year: 2008 }, end: { year: 2026 } }, status: 'unverified', sourceIds: ['tsb-kasko-deger-listesi'], updatedAt: '2026-10-15', variants: [] };
  return {
    brands: [{ id: 'bmw', slug: 'bmw', name: 'BMW', status: 'sourced', sourceIds: ['tsb-kasko-deger-listesi'], updatedAt: '2026-10-15' }],
    markets: [{ id: 'tr', name: 'Türkiye', kind: 'country', isoCode: 'TR' }],
    sources: [{ id: 'tsb-kasko-deger-listesi', title: 'TSB', tier: 'secondary', accessedAt: '2026-10-15' }],
    engines: new Map(),
    models: new Map<string, Json>([
      ['models/bmw/3-serisi.json', { id: 'bmw-3-serisi', brandId: 'bmw', slug: '3-serisi', name: '3 Serisi', status: 'sourced', sourceIds: ['tsb-kasko-deger-listesi'], updatedAt: '2026-10-15', generations: [tsbBucket] }],
      // Model kimliği "bmw-3-serisi-e46" ile çakışacak bir model: nesil kimliği benzersizleştirilmeli.
      ['models/bmw/3-serisi-e46.json', { id: 'bmw-3-serisi-e46', brandId: 'bmw', slug: '3-serisi-e46', name: '3 Serisi E46', status: 'sourced', sourceIds: ['tsb-kasko-deger-listesi'], updatedAt: '2026-10-15', generations: [] }],
      ['models/bmw/x5.json', { id: 'bmw-x5', brandId: 'bmw', slug: 'x5', name: 'X5', status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15', generations: [{ id: 'bmw-x5-e53', sourceIds: ['wp-elle'], variants: [] }] }],
    ]),
  };
}

const staged: ModelGenerations[] = [
  {
    modelFile: 'models/bmw/3-serisi.json',
    modelId: 'bmw-3-serisi',
    article: 'BMW 3 Series',
    status: 'found',
    generations: [{ slug: 'e46', name: '3 Serisi (E46)', code: 'E46', ordinal: 4, start: 1997, end: 2006, marketId: 'global', approximate: false, engineDisplacementsL: [], page: 'BMW 3 Series (E46)', productionNote: '' }],
    pages: [{ title: 'BMW 3 Series (E46)', pageid: 42, revid: 7 }],
    conflicts: [],
    overlaps: [],
  },
  { ...{ modelFile: 'models/bmw/x5.json', modelId: 'bmw-x5', article: 'BMW X5', status: 'found' as const, pages: [{ title: 'BMW X5 (E53)', pageid: 43, revid: 8 }], conflicts: [], overlaps: [] }, generations: [{ slug: 'e53', name: 'X5 (E53)', code: 'E53', start: 1999, end: 2006, marketId: 'global' as const, approximate: false, engineDisplacementsL: [], page: 'BMW X5 (E53)', productionNote: '' }] },
];

describe('katalog kopyasına ekleme (adaylar)', () => {
  const { catalog: out, added } = applyGenerations(catalog(), staged, '2026-10-17');
  const gens = (f: string) => (out.models.get(f)!.generations as Json[]).map((g) => g.id);

  test('elle girilmiş nesli olan modele dokunulmaz', () => {
    assert.equal(hasCuratedGenerations(catalog().models.get('models/bmw/x5.json')!), true);
    assert.deepEqual(gens('models/bmw/x5.json'), ['bmw-x5-e53']);
    assert.equal(added, 1);
  });

  test('nesil kimliği katalog genelinde benzersiz; kaynak ve dünya geneli pazarı eklenir', () => {
    assert.ok(gens('models/bmw/3-serisi.json').includes('bmw-3-serisi-e46-2'));
    assert.ok(out.sources.some((s) => s.id === 'wpgen-42' && String(s.url).includes('oldid=7')));
    assert.ok(out.markets.some((m) => m.id === 'global'));
  });

  test('yeniden ekleme yinelenen nesil üretmez; temizleme yalnızca Wikipedia nesillerini kaldırır', () => {
    const again = applyGenerations(out, staged, '2026-10-17').catalog;
    assert.equal((again.models.get('models/bmw/3-serisi.json')!.generations as Json[]).length, 2);
    const stripped = stripWikipedia(again);
    assert.deepEqual((stripped.models.get('models/bmw/3-serisi.json')!.generations as Json[]).map((g) => g.slug), ['nesil-belirlenmedi']);
    assert.equal(stripped.sources.some((s) => String(s.id).startsWith('wpgen-')), false);
  });
});
