/**
 * Üç araştırmacının aktarılan kayıtları: doğru motor, doğru kasa, ikinci aktarım.
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
const preserved = [
  'bmw-n47-triger-zinciri',
  'volkswagen-dq200-kavrama-sarsintisi',
  'hyundai-i20-pb-kapi-tutamaci',
  'renault-13-tce-termostat-govdesi',
  'renault-12-tce-yag-tuketimi',
  'dacia-13-tce-termostat-govdesi',
  'nissan-13-dig-t-termostat-govdesi',
  'nissan-qashqai-12-dig-t-zincir',
];

function issue(agent: string, id: string) {
  const found = live.issues.find((item) => item.researchRef?.agent === agent && item.researchRef.id === id);
  if (!found) throw new Error(id);
  return found;
}

function context(modelId: string, engineId: string, generationIncludes: string, transmission?: { type: 'manual' | 'dual-clutch'; name?: string; revisionIds: string[] }): VehicleContext {
  const model = catalog.models.find((item) => item.id === modelId) as Model;
  const generation = model.generations.find(
    (item) => item.id.includes(generationIncludes) && item.variants.some((variant) => variant.engineId === engineId),
  );
  if (!generation) throw new Error(`${modelId} ${generationIncludes} ${engineId}`);
  const found = generation.variants.find((variant) => variant.engineId === engineId);
  if (!found) throw new Error(engineId);
  const engine = catalog.engines.find((item) => item.id === found.engineId) as Engine;
  return {
    brandId: model.brandId,
    modelId: model.id,
    generationId: generation.id,
    generation: { labelPeriod: generation.labelPeriod, periods: generation.periods, revisions: generation.revisions },
    engine,
    variant: transmission ? { ...found, transmissions: [transmission] } : found,
    markets: catalog.markets,
    currentYear: 2026,
  };
}

function files(folder: string) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) return readdirSync(path).filter((name) => name.endsWith('.json')).map((name) => join(path, name));
    return entry.name.endsWith('.json') ? [path] : [];
  });
}

describe('ajan kayıtlarının kapsamı', () => {
  test('eski Ford, Renault, BMW, Volkswagen ve Hyundai kayıtları duruyor', () => {
    for (const id of preserved) assert.equal(live.issues.some((item) => item.id === id), true, id);
    const i20 = live.issues.filter((item) => item.brandId === 'hyundai' && item.appliesTo.some((selector) => selector.generationIds.includes('hyundai-i20-pb')));
    assert.equal(i20.length, 1);
    assert.equal(i20[0].id, 'hyundai-i20-pb-kapi-tutamaci');
  });

  test('BMW N13 ve N20 ayrı motorlara bağlı', () => {
    const n20 = issue('gpt-german', 'gpt-bmw-n20-zincir-kilavuzu');
    const n13 = issue('gpt-german', 'gpt-bmw-n13-wastegate-sesi');
    assert.deepEqual(n20.appliesTo[0].engineIds, ['bmw-328i']);
    assert.deepEqual(n13.appliesTo[0].engineIds.slice().sort(), ['bmw-16-320i-ed-170', 'bmw-320i-ed-170']);
    assert.equal(matchIssue(n20, context('bmw-3-serisi', 'bmw-328i', 'f30')).verdict === 'no', false);
    assert.equal(matchIssue(n20, context('bmw-3-serisi', 'bmw-320i-ed-170', 'f30')).verdict, 'no');
    assert.equal(matchIssue(n13, context('bmw-3-serisi', 'bmw-328i', 'f30')).verdict, 'no');
    assert.equal(matchIssue(n47(), context('bmw-3-serisi', 'bmw-328i', 'f30')).verdict, 'no');
  });

  test('Mercedes M271 1.6 motora, W205 NOx sonraki 220d satırına geçmez', () => {
    const chain = issue('gpt-german', 'gpt-mer-w204-m271-zincir-dislisi');
    const nox = issue('gpt-german', 'gpt-mer-w205-c220d-nox-sensoru');
    assert.equal(chain.appliesTo[0].engineIds.includes('mercedes-benz-16-180'), false);
    assert.equal(chain.appliesTo[0].engineIds.includes('mercedes-benz-18-180'), true);
    assert.equal(matchIssue(chain, context('mercedes-benz-c', 'mercedes-benz-16-180', 'w204')).verdict, 'no');
    assert.deepEqual(nox.appliesTo[0].engineIds, ['mercedes-benz-22-220']);
    assert.equal(matchIssue(nox, context('mercedes-benz-c', 'mercedes-benz-220d', 'w205')).verdict, 'no');
  });

  test('Audi yağ ve pompa tek güce, DQ200 manuele bağlanmaz', () => {
    const oil = issue('gpt-german', 'gpt-audi-b8-20-tfsi-yag-tuketimi');
    const pump = issue('gpt-german', 'gpt-audi-b9-devirdaim-termostat-kacagi');
    const dsg = issue('gpt-german', 'gpt-audi-a3-8v-dq200-kavrama');
    assert.deepEqual(oil.appliesTo[0].engineIds, ['audi-20-tfsi-211']);
    assert.equal(matchIssue(oil, context('audi-a4', 'audi-20-tfsi-225', '8k')).verdict, 'no');
    assert.deepEqual(pump.appliesTo[0].engineIds, ['audi-20-tfsi-252']);
    assert.equal(matchIssue(pump, context('audi-a4', 'audi-20-tfsi-245', '8w')).verdict, 'no');
    assert.equal(dsg.appliesTo[0].engineIds.includes('audi-14-tfsi-122'), false);
    assert.equal(matchIssue(dsg, context('audi-a3', 'audi-14-tfsi-140', '8v')).verdict === 'no', false);
    assert.equal(matchIssue(dsg, context('audi-a3', 'audi-14-tfsi-140', '8v', { type: 'manual', revisionIds: [] })).verdict, 'no');
  });

  test('Hyundai ve Kia kayıtları yanlış kasa ve şanzımana geçmez', () => {
    const dct = issue('claude-hyundai', 'claude-hyundai-16t-dct-sarsinti');
    const fd = issue('claude-hyundai', 'claude-hyundai-i30-fd-direksiyon-sesi');
    const gd = issue('claude-hyundai', 'claude-hyundai-i30-gd-kapi-trim');
    const oil = issue('claude-hyundai', 'claude-kia-theta-24-gdi-yag');
    assert.deepEqual(dct.appliesTo.map((selector) => selector.generationIds[0]).sort(), ['hyundai-kona-1-nesil', 'hyundai-tucson-3-nesil']);
    assert.equal(matchIssue(dct, context('hyundai-tucson', 'hyundai-16-t-gdi', '3-nesil', { type: 'manual', revisionIds: [] })).verdict, 'no');
    assert.equal(fd.appliesTo[0].generationIds[0], 'hyundai-i30-fd');
    assert.equal(matchIssue(fd, context('hyundai-i30', 'hyundai-16-gdi', 'gd')).verdict, 'no');
    assert.equal(gd.appliesTo[0].generationIds[0], 'hyundai-i30-gd');
    assert.equal(matchIssue(gd, context('hyundai-i30', 'hyundai-16-crdi', 'fd')).verdict, 'no');
    assert.deepEqual(oil.appliesTo.map((selector) => selector.engineIds[0]).sort(), ['kia-24-gdi', 'kia-24-gdi-181']);
    assert.equal(matchIssue(oil, context('kia-sportage', 'kia-16-gdi-135', '3-nesil')).verdict, 'no');
  });

  test('ikinci aktarım aynı sonucu verir; Astra kayıtları incelemede kalır', () => {
    const gpt = planResearchImport({
      files: files('data/research/agent-outputs/gpt-german').map((file) => readResearchJson(file)),
      catalog,
      issues: live.issues,
      sources: live.sources,
    });
    for (const id of ['gpt-audi-b8-20-tfsi-yag-tuketimi', 'gpt-bmw-n20-zincir-kilavuzu', 'gpt-mer-w205-c220d-nox-sensoru']) {
      assert.equal(gpt.find((item) => item.researchId === id)?.decision, 'duplicate', id);
    }
    for (const id of ['gpt2-audi-a6-c7-mmi-ekran-acilma', 'gpt2-audi-q5-panorama-tavan-drenaj', 'gpt2-bmw-f10-kapi-ici-tutamac-yapisma', 'gpt2-bmw-e90-frm-modulu-islev-kaybi']) {
      assert.equal(live.issues.some((item) => item.researchRef?.id === id), false, id);
    }
    const claude = planResearchImport({
      files: files('data/research/agent-outputs/claude-hyundai').map((file) => readResearchJson(file)),
      catalog,
      issues: live.issues,
      sources: live.sources,
    });
    for (const id of [
      'claude-hyundai-cmdps-rulman-sesi',
      'claude-hyundai-i30-fd-direksiyon-sesi',
      'claude-hyundai-i30-gd-kapi-trim',
      'claude-hyundai-16t-dct-sarsinti',
      'claude-kia-theta-24-gdi-yag',
    ]) {
      assert.equal(claude.find((item) => item.researchId === id)?.decision, 'duplicate', id);
    }
    for (const row of claude.filter((item) => item.decision === 'import')) {
      assert.equal(live.issues.some((item) => item.researchRef?.id === row.researchId), false, row.researchId);
    }
    const astra = planResearchImport({
      files: files('data/research/agent-outputs/astra-renault').map((file) => readResearchJson(file)),
      catalog,
      issues: live.issues,
      sources: live.sources,
    });
    const stillHeld = [
      'astra-renault-early-k9k-accessory-tensioner',
      'astra-renault-renault-bosch-abs-valve-relay',
      'astra-renault-clio-12-16v-throttle',
      'astra-renault-fluence-edc-control-loss',
      'astra-renault-sandero-easyr-judder',
      'astra-renault-duster-hjd-ignition',
      'astra-renault-sandero-ignition-stuck',
    ];
    assert.equal(live.issues.some((item) => item.researchRef?.id === 'astra-renault-clio-iv-airbag-ecu'), false);
    for (const id of stillHeld) {
      const row = astra.find((item) => item.researchId === id);
      assert.ok(row, id);
      assert.equal(row.decision, 'review', `${id} ${row.reason}`);
    }
  });
});

function n47() {
  const found = live.issues.find((item) => item.id === 'bmw-n47-triger-zinciri');
  if (!found) throw new Error('n47');
  return found;
}
