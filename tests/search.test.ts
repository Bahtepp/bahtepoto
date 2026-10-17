/**
 * Global arama: marka, model, motor, Türkçe karakter ve arşiv görünürlüğü.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchCatalog, type SearchIndex } from '../src/lib/catalog/search.ts';
import { normalizeSearch } from '../src/lib/catalog/format.ts';
import { brandTier, isPrimaryBrand } from '../src/lib/catalog/visibility.ts';
import { performanceBadge } from '../src/lib/catalog/market.ts';

const index: SearchIndex = {
  brands: [
    { slug: 'renault', name: 'Renault', tier: 'primary' },
    { slug: 'bmw', name: 'BMW', tier: 'primary' },
    { slug: 'mercedes-benz', name: 'Mercedes-Benz', tier: 'primary' },
    { slug: 'ferrari', name: 'Ferrari', tier: 'review' },
  ],
  models: [
    { brand: 'renault', brandName: 'Renault', slug: 'clio', name: 'Clio' },
    { brand: 'fiat', brandName: 'Fiat', slug: 'egea', name: 'Egea' },
    { brand: 'honda', brandName: 'Honda', slug: 'civic', name: 'Civic' },
    { brand: 'nissan', brandName: 'Nissan', slug: 'qashqai', name: 'Qashqai' },
  ],
  engines: [
    { brand: 'bmw', brandName: 'BMW', model: '3-serisi', modelName: '3 Serisi', slug: '320d-diesel', label: '320d' },
    { brand: 'mercedes-benz', brandName: 'Mercedes-Benz', model: 'c-serisi', modelName: 'C Serisi', slug: 'c180-petrol', label: 'C 180' },
  ],
};

describe('global arama', () => {
  test('clio Renault Clio, 320d BMW, c180 Mercedes', () => {
    const clio = searchCatalog(index, 'clio')[0];
    assert.equal(clio?.title, 'Renault Clio');
    const d = searchCatalog(index, '320d')[0];
    assert.equal(d?.title, 'BMW 3 Serisi 320d');
    assert.equal(d?.engine, '320d-diesel');
    const c = searchCatalog(index, 'c180')[0];
    assert.equal(c?.title, 'Mercedes-Benz C Serisi C 180');
    assert.equal(searchCatalog(index, 'qashqai')[0]?.title, 'Nissan Qashqai');
    assert.equal(searchCatalog(index, 'egea')[0]?.title, 'Fiat Egea');
    assert.equal(searchCatalog(index, 'civic')[0]?.title, 'Honda Civic');
  });

  test('Türkçe karakter, büyük harf ve tire farkı', () => {
    assert.equal(normalizeSearch('ÇLİO'), normalizeSearch('clio'));
    assert.equal(normalizeSearch('Işık'), 'isik');
    assert.equal(searchCatalog(index, 'CLİO')[0]?.model, 'clio');
    assert.equal(searchCatalog(index, 'e-gea')[0]?.title, 'Fiat Egea');
  });

  test('nadir marka kısmi aramada yok, tam adında arşiv', () => {
    assert.equal(searchCatalog(index, 'ferr').length, 0);
    const hit = searchCatalog(index, 'Ferrari')[0];
    assert.equal(hit?.subtitle, 'Arşiv');
  });

  test('Türkiye görünürlüğü yaygın markayı tutar, nadir markayı silmez', () => {
    const brands = JSON.parse(readFileSync('src/data/catalog/brands.json', 'utf8')) as { slug: string }[];
    for (const slug of ['bmw', 'mercedes-benz', 'renault', 'fiat', 'honda', 'byd', 'chery', 'mg']) {
      assert.equal(isPrimaryBrand(slug), true, slug);
    }
    for (const slug of ['daewoo', 'dfsk', 'geely']) assert.equal(isPrimaryBrand(slug), false, slug);
    assert.equal(performanceBadge({ trimName: 'Titanium' }), undefined);
    assert.equal(performanceBadge({ trimName: 'ST' }), 'ST');
    assert.equal(performanceBadge({ trimName: 'GTI' }), 'GTI');
    assert.equal(performanceBadge({ trimName: 'TYPE R' }), 'TYPE R');
    const review = brands.filter((b) => brandTier(b.slug) === 'review');
    assert.ok(review.length > 0);
    assert.ok(brands.some((b) => b.slug === review[0]!.slug));
  });

  test('motor kartı kaynak metni göstermez; kronik motor kimlikleri durur', () => {
    const explorer = readFileSync('src/scripts/catalog-explorer.ts', 'utf8');
    const specs = readFileSync('src/components/vehicle/EngineSpecs.astro', 'utf8');
    const vehicle = readFileSync('src/pages/arac/[...vehicle].astro', 'utf8');
    assert.equal(explorer.includes('engine.notes'), false);
    assert.equal(explorer.includes('sourceRefs'), false);
    assert.equal(specs.includes('engine.notes'), false);
    assert.equal(specs.includes('Donanım:'), false);
    assert.equal(vehicle.includes('VehicleSources'), false);
    const focus = readFileSync('src/data/issues/records/ford/focus.json', 'utf8');
    assert.ok(focus.includes('ford-duratorq-20-c346'));
    assert.ok(focus.includes('ford-duratorq-st-20-185ps-c346'));
  });
});
