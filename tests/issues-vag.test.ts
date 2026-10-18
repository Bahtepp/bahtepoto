/**
 * Volkswagen Grubu kayıtları: kasa, motor ve DSG sınırı.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { Engine, Model } from '../src/lib/catalog/schema.ts';
import { matchIssue, type VehicleContext } from '../src/lib/issues/match.ts';
import { loadCatalog, loadIssues } from './helpers.ts';

const catalog = loadCatalog();
const live = loadIssues('live');
const byId = new Map(live.issues.map((issue) => [issue.id, issue]));

function vehicle(modelId: string, genSlug: string, engineName: string, transmission?: { type: 'manual' | 'dual-clutch'; name?: string; revisionIds: string[] }): VehicleContext {
  const model = catalog.models.find((item) => item.id === modelId) as Model;
  const generation = model.generations.find((item) => item.slug === genSlug);
  if (!generation) throw new Error(genSlug);
  const found = generation.variants.find((variant) => {
    const engine = catalog.engines.find((item) => item.id === variant.engineId);
    return engine?.name === engineName;
  });
  if (!found) throw new Error(`${genSlug} ${engineName}`);
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

const shows = (id: string, ctx: VehicleContext) => matchIssue(byId.get(id)!, ctx).verdict === 'applies';

describe('Volkswagen Grubu kronik kayıtları', () => {
  test('eski kayıtlar duruyor ve yeni DSG kartı Golf kaydını çoğaltmıyor', () => {
    for (const id of [
      'renault-13-tce-termostat-govdesi',
      'renault-12-tce-yag-tuketimi',
      'nissan-13-dig-t-termostat-govdesi',
      'nissan-qashqai-12-dig-t-zincir',
      'bmw-n47-triger-zinciri',
      'volkswagen-dq200-kavrama-sarsintisi',
      'hyundai-i20-pb-kapi-tutamaci',
      'ford-focus-triger-kayisi-2016',
    ]) {
      assert.ok(byId.has(id), id);
    }
    assert.equal(live.issues.filter((issue) => issue.brandId === 'volkswagen' && issue.category === 'transmission').length, 1);
    assert.equal(byId.get('volkswagen-ea111-triger-zinciri')?.frequencyRating, 'high');
    assert.equal(byId.get('volkswagen-ea111-triger-zinciri')?.severity, undefined);
  });

  test('zincir Golf VI 1.4te kalır, devirdaim Golf VII 1.4te kalır', () => {
    const golf6 = vehicle('volkswagen-golf', 'golf-vi', '1.4 TSI 122 PS');
    const golf7 = vehicle('volkswagen-golf', 'golf-vii', '1.4 TSI 122 PS');
    const golf8 = vehicle('volkswagen-golf', 'golf-8', '1.0 TSI 115 PS');
    assert.equal(shows('volkswagen-ea111-triger-zinciri', golf6), true);
    assert.equal(shows('volkswagen-ea111-triger-zinciri', golf7), false);
    assert.equal(shows('volkswagen-ea111-triger-zinciri', golf8), false);
    assert.equal(shows('volkswagen-ea211-devirdaim-govdesi', golf6), false);
    assert.equal(shows('volkswagen-ea211-devirdaim-govdesi', golf7), true);
    assert.equal(shows('volkswagen-ea211-devirdaim-govdesi', golf8), false);
    assert.equal(shows('volkswagen-ea211-devirdaim-govdesi', vehicle('volkswagen-golf', 'golf-vii', '2.0 TSI 280 PS')), false);
  });

  test('Škoda ve SEAT DSG kaydı manuele ve Cupra ya geçmez', () => {
    const manual = vehicle('skoda-octavia', '5e', '1.4 TSI 150 PS', { type: 'manual', revisionIds: [] });
    assert.equal(matchIssue(byId.get('skoda-dq200-kavrama')!, manual).verdict, 'no');
    const dsg = vehicle('skoda-octavia', '5e', '1.4 TSI 150 PS');
    assert.equal(shows('skoda-dq200-kavrama', dsg), true);
    assert.equal(shows('skoda-ea111-triger-zinciri', dsg), false);
    const leonOld = vehicle('seat-leon', '1p', '1.4 TSI 125 PS');
    const leonNew = vehicle('seat-leon', '5f', '1.4 TSI 125 PS');
    assert.equal(shows('seat-ea111-triger-zinciri', leonOld), true);
    assert.equal(shows('seat-ea111-triger-zinciri', leonNew), false);
    assert.equal(shows('seat-ea211-devirdaim-govdesi', leonNew), true);
    assert.equal(shows('seat-ea211-devirdaim-govdesi', leonOld), false);
    const cupra = catalog.models.find((model) => model.brandId === 'cupra');
    assert.ok(cupra);
    assert.equal(live.issues.some((issue) => issue.brandId === 'cupra'), false);
  });

  test('1.5 TSI titremesi erken satırda kalır, sonraki 1.5 ve DSG kaydına karışmaz', () => {
    const golf = vehicle('volkswagen-golf', 'golf-vii', '1.5 TSI ACT 150 PS');
    assert.equal(shows('volkswagen-vw-15-tsi-soguk-titreme', golf), true);
    assert.equal(shows('volkswagen-ea211-devirdaim-govdesi', golf), false);
    assert.equal(shows('volkswagen-vw-15-tsi-soguk-titreme', vehicle('volkswagen-golf', 'golf-8', '1.5 TSI ACT 150 PS')), false);
    assert.equal(shows('volkswagen-vw-15-tsi-soguk-titreme', vehicle('volkswagen-t-roc', 'a11-d11-ac7-ac8', '1.5 TSI 150 PS')), false);
    assert.equal(matchIssue(byId.get('skoda-15-tsi-soguk-titreme')!, vehicle('skoda-karoq', 'nu7', '1.0 TSI 115 PS')).verdict, 'no');
    assert.equal(shows('seat-15-tsi-soguk-titreme', vehicle('seat-leon', '5f', '1.5 ACT 150 PS')), true);
    assert.equal(shows('seat-15-tsi-soguk-titreme', vehicle('seat-ateca', 'kh7', '1.4 ACT 150 PS')), false);
    assert.equal(live.issues.some((issue) => issue.brandId === 'cupra'), false);
  });
});
