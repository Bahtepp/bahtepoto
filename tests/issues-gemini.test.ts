/**
 * Gemini Stellantis aktarımı: doğrulanan beş kayıt ve bilinçli dışarıda bırakılanlar.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
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

describe('Gemini Stellantis eşleşmesi', () => {
  test('doğrulanan kayıtlar doğru kasa ve motorda görünür', () => {
    assert.notEqual(matchIssue(issue('fiat-gemini-fiat-linea-punto-gogus-catlamasi'), context('fiat-linea', 'fiat-14-fire-77', 'linea')).verdict, 'no');
    assert.notEqual(matchIssue(issue('fiat-gemini-fiat-egea-direksiyon-kutusu'), context('fiat-egea', 'fiat-14-fire-95', 'egea')).verdict, 'no');
    assert.notEqual(matchIssue(issue('opel-gemini-opel-14t-pcv-valfi'), context('opel-astra', 'opel-14-140', 'astra-j')).verdict, 'no');
    assert.notEqual(matchIssue(issue('opel-gemini-opel-cim-modulu-arizasi'), context('opel-astra', 'opel-16-115', 'astra-h')).verdict, 'no');
    assert.notEqual(matchIssue(issue('peugeot-gemini-peugeot-12-puretech-triger'), context('peugeot-308', 'peugeot-12-puretech-130', '308-ii')).verdict, 'no');
    assert.notEqual(matchIssue(issue('peugeot-gemini-peugeot-12-puretech-triger'), context('peugeot-2008', 'peugeot-12-puretech-100', 'p24')).verdict, 'no');
  });

  test('yanlış kasa, zincirli aday ve dizel satırına yayılmaz', () => {
    const belt = issue('peugeot-gemini-peugeot-12-puretech-triger');
    assert.equal(matchIssue(belt, context('peugeot-308', 'peugeot-12-puretech-130', '308-iii')).verdict, 'no');
    assert.equal(matchIssue(belt, context('peugeot-308', 'peugeot-15-bluehdi-130', '308-ii')).verdict, 'no');
    assert.equal(matchIssue(belt, context('peugeot-2008', 'peugeot-12-puretech-130', 'p24')).verdict, 'no');
    assert.equal(matchIssue(belt, context('peugeot-2008', 'peugeot-12-hybrid-145', 'p24')).verdict, 'no');
    assert.equal(matchIssue(issue('opel-gemini-opel-14t-pcv-valfi'), context('opel-astra', 'opel-14-140', 'astra-k')).verdict, 'no');
    assert.equal(matchIssue(issue('opel-gemini-opel-14t-pcv-valfi'), context('opel-insignia', 'opel-14-140', 'g09')).verdict, 'no');
    assert.equal(matchIssue(issue('opel-gemini-opel-cim-modulu-arizasi'), context('opel-corsa', 'opel-12', 'corsa-d')).verdict, 'no');
    assert.equal(matchIssue(issue('fiat-gemini-fiat-linea-punto-gogus-catlamasi'), context('fiat-punto', 'fiat-14-fire-77', '3-nesil')).verdict, 'no');
  });

  test('doğrulanmayan Gemini adayları canlı kart değildir', () => {
    for (const id of [
      'gemini-fiat-dualogic-robot-arizasi',
      'gemini-fiat-14-fire-yag-eksiltme',
      'gemini-fiat-13-multijet-zincir',
      'gemini-opel-astra-k-16cdti-zincir',
      'gemini-opel-corsa-d-klape-dislisi',
      'gemini-peugeot-bluehdi-adblue',
      'gemini-peugeot-308-torsiyon',
      'gemini-citroen-mcp-etg6-sarsinti',
      'gemini-citroen-c4-picasso-havali-suspansiyon',
      'gemini-citroen-ruzgar-sesi',
    ]) {
      assert.equal(live.issues.some((item) => item.researchRef?.id === id), false, id);
    }
  });
});
