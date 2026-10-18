/**
 * Yayın öncesi negatif kapsam: yanlış motor, yanlış kasa, eski adres ve sahte güç.
 */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { LEGACY_PATHS, canonicalModelSlug } from '../src/lib/catalog/aliases.ts';
import { prefixBase } from '../src/lib/catalog/format.ts';
import type { Engine, Model } from '../src/lib/catalog/schema.ts';
import { matchIssue, type VehicleContext } from '../src/lib/issues/match.ts';
import { loadCatalog, loadIssues } from './helpers.ts';

const catalog = loadCatalog();
const live = loadIssues('live');

function issue(id: string) {
  const found = live.issues.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

function context(modelId: string, engineId: string, generationIncludes: string): VehicleContext {
  const model = catalog.models.find((item) => item.id === modelId) as Model;
  const generation = model.generations.find(
    (item) => item.id.includes(generationIncludes) && item.variants.some((variant) => variant.engineId === engineId),
  );
  if (!generation) throw new Error(`${modelId} ${generationIncludes} ${engineId}`);
  const variant = generation.variants.find((item) => item.engineId === engineId);
  if (!variant) throw new Error(engineId);
  return {
    brandId: model.brandId,
    modelId: model.id,
    generationId: generation.id,
    generation: { labelPeriod: generation.labelPeriod, periods: generation.periods, revisions: generation.revisions },
    engine: catalog.engines.find((item) => item.id === engineId) as Engine,
    variant,
    markets: catalog.markets,
    currentYear: 2026,
  };
}

describe('yayın öncesi yanlış eşleşme', () => {
  test('Golf R, 1.4 zincirini, 1.4 soğutmayı ve DQ200 kaydını göstermez', () => {
    const golfR = context('volkswagen-golf', 'volkswagen-20-tsi-300', 'golf-vii');
    for (const id of ['volkswagen-ea111-triger-zinciri', 'volkswagen-ea211-devirdaim-govdesi', 'volkswagen-dq200-kavrama-sarsintisi']) {
      assert.equal(matchIssue(issue(id), golfR).verdict, 'no', id);
    }
  });

  test('F30 kapı tutamacı E90 kasasında görünmez, F30 328i sayfasında görünür', () => {
    const door = issue('bmw-gpt-bmw-f30-kapi-kolu-yapisiyor');
    assert.equal(matchIssue(door, context('bmw-3-serisi', 'bmw-320d', 'e90')).verdict, 'no');
    assert.notEqual(matchIssue(door, context('bmw-3-serisi', 'bmw-328i', 'f30')).verdict, 'no');
  });

  test('bekleyen ikinci tur kayıtları canlı kart değildir', () => {
    for (const id of [
      'gpt2-audi-a6-c7-mmi-ekran-acilma',
      'gpt2-bmw-f10-kapi-ici-tutamac-yapisma',
      'astra-renault-clio-iv-airbag-ecu',
    ]) {
      assert.equal(live.issues.some((item) => item.researchRef?.id === id || item.id.endsWith(id)), false, id);
    }
  });

  test('E-TRON 50 yayımlanan motorda 50 PS değildir', () => {
    const engine = catalog.engines.find((item) => item.id === 'audi-e-tron-50');
    assert.ok(engine);
    assert.equal(engine.power?.ps, undefined);
    assert.equal(engine.name.includes('50 PS'), false);
  });

  test('eski slug kanonik modele gider ve sayfa bağlantısı base alır', () => {
    assert.equal(canonicalModelSlug('jeep', 'grandcherokee'), 'grand-cherokee');
    assert.equal(canonicalModelSlug('nissan', '350'), '350z');
    assert.equal(canonicalModelSlug('volvo', 'xc-90'), 'xc90');
    assert.equal(prefixBase('/bahtepoto/', '/arac/jeep/grand-cherokee/'), '/bahtepoto/arac/jeep/grand-cherokee/');
    assert.equal(prefixBase('/bahtepoto/', '/?marka=volvo&model=xc90'), '/bahtepoto/?marka=volvo&model=xc90');
    const page = readFileSync('src/pages/arac/[...vehicle].astro', 'utf8');
    assert.match(page, /withBase\(vehiclePath\(/);
    for (const legacy of LEGACY_PATHS) {
      assert.equal(legacy.param.includes('..'), false);
      assert.equal(legacy.to.startsWith('/'), true);
    }
    assert.equal(LEGACY_PATHS.some((item) => item.param === 'audi/rs/nesil-belirlenmedi/e-tron-590'), true);
    assert.equal(LEGACY_PATHS.some((item) => item.param === 'mini/cooper'), true);
  });
});
