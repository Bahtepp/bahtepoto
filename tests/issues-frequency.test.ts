/**
 * İlk kronik sorun grubu: yaygınlık etiketi, motor/kasa/şanzıman sınırı.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { displayGroupOf, matchIssue } from '../src/lib/issues/match.ts';
import { frequencyLabel, SEVERITY_LABELS } from '../src/lib/issues/format.ts';
import { validateIssues } from '../src/lib/issues/validate.ts';
import { briefIssue } from '../src/lib/issues/brief.ts';
import type { Issue } from '../src/lib/issues/schema.ts';
import type { Engine, Model } from '../src/lib/catalog/schema.ts';
import type { VehicleContext } from '../src/lib/issues/match.ts';
import { loadCatalog, loadIssues, makeIssue } from './helpers.ts';

const catalog = loadCatalog();
const live = loadIssues('live');
const byId = new Map(live.issues.map((i) => [i.id, i]));

function vehicle(modelId: string, genSlug: string, variantSlug: string, transmission?: { type: 'manual' | 'dual-clutch'; name?: string; revisionIds: string[] }): VehicleContext {
  const model = catalog.models.find((m) => m.id === modelId) as Model;
  const g = model.generations.find((x) => x.slug === genSlug);
  if (!g) throw new Error(`nesil yok: ${modelId}/${genSlug}`);
  const v = g.variants.find((x) => x.slug === variantSlug);
  if (!v) throw new Error(`varyant yok: ${variantSlug}`);
  const engine = catalog.engines.find((e) => e.id === v.engineId) as Engine;
  const variant = transmission ? { ...v, transmissions: [transmission] } : v;
  return {
    brandId: model.brandId,
    modelId: model.id,
    generationId: g.id,
    generation: { labelPeriod: g.labelPeriod, periods: g.periods, revisions: g.revisions },
    engine,
    variant,
    markets: catalog.markets,
    currentYear: 2026,
  };
}

const verdict = (id: string, ctx: VehicleContext) => matchIssue(byId.get(id)!, ctx).verdict;

describe('yaygınlık etiketi', () => {
  test('yüksek yaygınlık düşük ciddiyet değildir; etiketler ayrıdır', () => {
    const chain = byId.get('bmw-n47-triger-zinciri')!;
    assert.equal(chain.frequencyRating, 'high');
    assert.equal(chain.severity?.level, 'high');
    assert.equal(frequencyLabel(chain), 'Yüksek');
    const rareButSerious = makeIssue({
      appliesTo: [{ modelIds: ['ford-focus'] }],
      frequencyRating: 'low',
      severity: { level: 'high', rationale: 'Seyrek ama ağır.', sourceIds: ['test-src'] },
    });
    assert.equal(frequencyLabel(rareButSerious), 'Düşük');
    assert.equal(SEVERITY_LABELS[rareButSerious.severity!.level], 'Yüksek');
    assert.notEqual(frequencyLabel(rareButSerious), 'önemsiz');
  });

  test('eski kayıtta etiket yoksa Belirsiz; geri çağırmada etiket yok', () => {
    const old = live.issues.find((i) => i.brandId === 'ford' && i.kind === 'chronic' && !i.frequencyRating);
    assert.ok(old);
    assert.equal(frequencyLabel(old!), 'Belirsiz');
    const recall = live.issues.find((i) => i.kind === 'recall');
    assert.equal(frequencyLabel(recall!), undefined);
  });

  test('yalnızca kullanıcı bildirimi resmi kusur değildir', () => {
    const door = byId.get('hyundai-i20-pb-kapi-tutamaci')!;
    assert.equal(door.status, 'researching');
    assert.equal(door.kind, 'known-defect');
    assert.equal(displayGroupOf(door), 'possible');
    assert.equal(frequencyLabel(door), 'Düşük');
    assert.doesNotMatch(door.summary, /üretici|resmî|resmi kusur|üretim hatası/i);
    assert.equal(door.demo, false);
  });

  test('yüksek yaygınlık tekil kanıtla doğrulamadan geçmez', () => {
    const brief = briefIssue({
      id: 'test-yuksek-tekil',
      slug: 'test-yuksek-tekil',
      brandId: 'hyundai',
      title: 'Tek bildirim',
      summary: 'Tek bir kullanıcı bunu bildirdi.',
      frequency: 'high',
      category: 'interior',
      appliesTo: [{ modelIds: ['hyundai-i20'], generationIds: ['hyundai-i20-pb'] }],
      sourceIds: ['forum-hyundaiclub-i20-kapi'],
      userReportsOnly: true,
      updatedAt: '2026-10-18',
    });
    const errors = validateIssues([brief], live.sources, catalog, 'live');
    assert.ok(errors.some((e) => e.includes('frequencyRating "high"')));
  });
});

describe('kapsam sınırları', () => {
  test('1.3 TCe termostat 1.0 TCe ve 1.5 dCi üzerinde görünmez', () => {
    assert.equal(verdict('renault-13-tce-termostat-govdesi', vehicle('renault-clio', 'clio-v', '10-tce-90')), 'no');
    assert.equal(verdict('renault-13-tce-termostat-govdesi', vehicle('renault-clio', 'clio-iv', '15-dci-90')), 'no');
    const clio13 = vehicle('renault-clio', 'nesil-belirlenmedi', '13-tce-130');
    assert.notEqual(verdict('renault-13-tce-termostat-govdesi', clio13), 'no');
    assert.equal(verdict('dacia-13-tce-termostat-govdesi', vehicle('dacia-duster', 'duster-ii', '10-tce-100')), 'no');
    assert.notEqual(verdict('dacia-13-tce-termostat-govdesi', vehicle('dacia-duster', 'duster-ii', '13-tce-130')), 'no');
  });

  test('Clio IV yağ kaydı Clio V üzerinde görünmez', () => {
    assert.equal(verdict('renault-12-tce-yag-tuketimi', vehicle('renault-clio', 'clio-v', '10-tce-100')), 'no');
    assert.equal(verdict('renault-12-tce-yag-tuketimi', vehicle('renault-clio', 'clio-iii', '14')), 'no');
  });

  test('i20 PB kapı tutamacı sonraki nesilde görünmez, PB motorlarında görünür', () => {
    assert.notEqual(verdict('hyundai-i20-pb-kapi-tutamaci', vehicle('hyundai-i20', 'pb', '12')), 'no');
    assert.notEqual(verdict('hyundai-i20-pb-kapi-tutamaci', vehicle('hyundai-i20', 'pb', '14-crdi-90')), 'no');
    assert.equal(verdict('hyundai-i20-pb-kapi-tutamaci', vehicle('hyundai-i20', 'gb', '12-mpi')), 'no');
    assert.equal(verdict('hyundai-i20-pb-kapi-tutamaci', vehicle('hyundai-i20', 'bc3', '14-mpi-100')), 'no');
  });

  test('DSG kaydı manuel Golf ve 2.0 DSG üzerinde görünmez', () => {
    const manual = vehicle('volkswagen-golf', 'golf-vii', '14-tsi-122', { type: 'manual', revisionIds: [] });
    assert.equal(verdict('volkswagen-dq200-kavrama-sarsintisi', manual), 'no');
    const dsg = vehicle('volkswagen-golf', 'golf-vii', '14-tsi-122');
    assert.notEqual(verdict('volkswagen-dq200-kavrama-sarsintisi', dsg), 'no');
    assert.equal(verdict('volkswagen-dq200-kavrama-sarsintisi', vehicle('volkswagen-golf', 'golf-vii', '20-tsi-280')), 'no');
  });

  test('Qashqai zincir kaydı 1.3 DIG-T üzerinde görünmez', () => {
    assert.equal(verdict('nissan-qashqai-12-dig-t-zincir', vehicle('nissan-qashqai', 'j11', '13-dig-t-160')), 'no');
    assert.notEqual(verdict('nissan-qashqai-12-dig-t-zincir', vehicle('nissan-qashqai', 'j11', '12-dig-t')), 'no');
    assert.equal(verdict('nissan-13-dig-t-termostat-govdesi', vehicle('nissan-qashqai', 'j11', '12-dig-t')), 'no');
  });

  test('N47 kaydı 190 PS ve benzinli 320i üzerinde görünmez', () => {
    assert.notEqual(verdict('bmw-n47-triger-zinciri', vehicle('bmw-3-serisi', 'e90-e91-e92-e93', '320d')), 'no');
    assert.equal(verdict('bmw-n47-triger-zinciri', vehicle('bmw-3-serisi', 'f30-f31-f34-f35', '20-320d-190')), 'no');
    assert.equal(verdict('bmw-n47-triger-zinciri', vehicle('bmw-3-serisi', 'e90-e91-e92-e93', '320i')), 'no');
  });

  test('canlı kayıtlarda örnek veri yok', () => {
    assert.equal(live.issues.some((i: Issue) => i.demo), false);
    assert.equal(live.sources.some((s) => s.demo), false);
  });
});
