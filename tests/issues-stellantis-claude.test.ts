/**
 * Claude Stellantis aktarımı: doğrulanan altı kayıt ve dışarıda bırakılanlar.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { Engine, Model } from '../src/lib/catalog/schema.ts';
import { planResearchImport, readResearchJson } from '../src/lib/issues/import-research.ts';
import { matchIssue, type VehicleContext } from '../src/lib/issues/match.ts';
import { loadCatalog, loadIssues } from './helpers.ts';

const catalog = loadCatalog();
const live = loadIssues('live');

function issue(id: string) {
  const found = live.issues.find((item) => item.researchRef?.id === id);
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

function shows(record: ReturnType<typeof issue>, modelId: string, engineId: string, generationIncludes: string) {
  return matchIssue(record, context(modelId, engineId, generationIncludes)).verdict !== 'no';
}

describe('Claude Stellantis eşleşmesi', () => {
  test('ikinci aktarım yeni kart açmaz; Gemini ve N13 kayıtları durur', () => {
    const files = readdirSync('data/research/agent-outputs/claude-stellantis')
      .filter((name) => name.endsWith('.json'))
      .map((name) => readResearchJson(join('data/research/agent-outputs/claude-stellantis', name)));
    const plan = planResearchImport({ files, catalog, issues: live.issues, sources: live.sources });
    assert.equal(plan.filter((row) => row.decision === 'import').length, 0);
    for (const id of [
      'claude-stellantis-citroen-15bluehdi-eksantrik-zinciri',
      'claude-stellantis-fiat-dualogic-bosa-dusme',
      'claude-stellantis-opel-15-dizel-eksantrik-zinciri',
      'claude-stellantis-peugeot-16bluehdi-adblue-deposu',
      'claude-stellantis-peugeot-15bluehdi-eksantrik-zinciri',
      'claude-stellantis-peugeot-16thp-zincir-gergisi',
    ]) {
      assert.equal(plan.find((row) => row.researchId === id)?.decision, 'duplicate', id);
    }
    for (const id of [
      'claude-stellantis-citroen-c4p1-bmp6-debriyaj',
      'claude-stellantis-citroen-c4p1-arka-hava-suspansiyonu',
      'claude-stellantis-fiat-egea-14fire-yag-eksiltme',
      'claude-stellantis-fiat-13mj-triger-zinciri',
      'claude-stellantis-opel-16cdti-soguk-zincir-sesi',
      'claude-stellantis-peugeot-308ii-arka-travers-gicirtisi',
      'gemini-fiat-dualogic-robot-arizasi',
      'gemini-fiat-14-fire-yag-eksiltme',
      'gemini-fiat-13-multijet-zincir',
      'gemini-opel-astra-k-16cdti-zincir',
      'gemini-peugeot-308-torsiyon',
      'gemini-peugeot-bluehdi-adblue',
      'gemini-citroen-c4-picasso-havali-suspansiyon',
      'gemini-citroen-mcp-etg6-sarsinti',
    ]) {
      assert.equal(live.issues.some((item) => item.researchRef?.id === id), false, id);
    }
    for (const id of [
      'gemini-fiat-linea-punto-gogus-catlamasi',
      'gemini-fiat-egea-direksiyon-kutusu',
      'gemini-opel-14t-pcv-valfi',
      'gemini-opel-cim-modulu-arizasi',
      'gemini-peugeot-12-puretech-triger',
      'gpt-bmw-n13-termostat-flans-kacagi',
    ]) {
      assert.equal(live.issues.some((item) => item.researchRef?.id === id), true, id);
    }
  });

  test('1.5 BlueHDi zinciri PSA motorunda kalır, GM 1.5 ve etiketsiz ada geçmez', () => {
    const peugeot = issue('claude-stellantis-peugeot-15bluehdi-eksantrik-zinciri');
    const opel = issue('claude-stellantis-opel-15-dizel-eksantrik-zinciri');
    const citroen = issue('claude-stellantis-citroen-15bluehdi-eksantrik-zinciri');
    assert.equal(peugeot.frequencyRating, 'medium');
    assert.equal(shows(peugeot, 'peugeot-308', 'peugeot-15-bluehdi-130', '308-ii'), true);
    assert.equal(matchIssue(peugeot, context('peugeot-308', 'peugeot-12-puretech-130', '308-ii')).verdict, 'no');
    assert.equal(matchIssue(peugeot, context('peugeot-308', 'peugeot-16-thp-156', '308-i')).verdict, 'no');
    assert.equal(matchIssue(peugeot, context('peugeot-3008', 'peugeot-20-bluehdi-180', 'p84')).verdict, 'no');
    assert.equal(matchIssue(peugeot, context('bmw-3-serisi', 'bmw-320i-ed-170', 'f30')).verdict, 'no');
    assert.equal(shows(opel, 'opel-corsa', 'opel-15-dizel-102', 'corsa-f'), true);
    assert.equal(matchIssue(opel, context('opel-astra', 'opel-15-dizel-122', 'astra-k')).verdict, 'no');
    assert.equal(matchIssue(opel, context('opel-insignia', 'opel-15-dizel-122', 'z18')).verdict, 'no');
    assert.equal(matchIssue(opel, context('opel-crossland', 'opel-15-dizel', 'crossland')).verdict, 'no');
    assert.equal(matchIssue(opel, context('opel-crossland', 'opel-16-dizel-99', 'crossland')).verdict, 'no');
    assert.equal(shows(citroen, 'citroen-c5-aircross', 'citroen-15-bluehdi-130', 'c84'), true);
    assert.equal(matchIssue(citroen, context('citroen-c5-aircross', 'citroen-15-bluehdi', 'c84')).verdict, 'no');
    assert.equal(matchIssue(citroen, context('citroen-c3', 'citroen-16-hdi', '1-nesil')).verdict, 'no');
  });

  test('THP yalnız 150, 156 ve 165 satırında, AdBlue yalnız okunan 1.6 BlueHDi kasalarında', () => {
    const thp = issue('claude-stellantis-peugeot-16thp-zincir-gergisi');
    const adblue = issue('claude-stellantis-peugeot-16bluehdi-adblue-deposu');
    const engines = thp.appliesTo.flatMap((selector) => selector.engineIds);
    assert.equal(engines.includes('peugeot-16-thp-140'), false);
    assert.equal(engines.includes('peugeot-16-gti-thp-200'), false);
    assert.equal(shows(thp, 'peugeot-308', 'peugeot-16-thp-150', '308-i'), true);
    assert.equal(matchIssue(thp, context('peugeot-308', 'peugeot-16-thp-140', '308-i')).verdict, 'no');
    assert.equal(matchIssue(thp, context('peugeot-308', 'peugeot-16-thp-156', '308-ii')).verdict, 'no');
    assert.equal(matchIssue(thp, context('peugeot-3008', 'peugeot-16-thp-165', 'p84')).verdict, 'no');
    assert.equal(shows(adblue, 'peugeot-208', 'peugeot-16-bluehdi-100', '208-i'), true);
    assert.equal(matchIssue(adblue, context('peugeot-208', 'peugeot-15-bluehdi-100', '208-ii')).verdict, 'no');
    assert.equal(matchIssue(adblue, context('peugeot-3008', 'peugeot-16-bluehdi-120', 't84')).verdict, 'no');
    assert.equal(adblue.frequencyRating, 'medium');
  });

  test('Dualogic yalnız katalogda Dualogic yazan motorlarda', () => {
    const dualogic = issue('claude-stellantis-fiat-dualogic-bosa-dusme');
    assert.equal(shows(dualogic, 'fiat-500', 'fiat-14-100', '500'), true);
    assert.equal(shows(dualogic, 'fiat-punto', 'fiat-14-fire-77', 'punto-3'), true);
    assert.equal(matchIssue(dualogic, context('fiat-500', 'fiat-09', '500')).verdict, 'no');
    assert.equal(matchIssue(dualogic, context('fiat-egea', 'fiat-14-fire-95', 'egea')).verdict, 'no');
    assert.equal(matchIssue(dualogic, context('fiat-punto', 'fiat-13-multijet-75', 'punto-3')).verdict, 'no');
  });
});
