/**
 * Araştırma JSON'unun içe aktarılması: dry-run, belirsiz eşleşme ve tekrar.
 */
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { Engine, Model } from '../src/lib/catalog/schema.ts';
import { applyResearchPlan, planResearchImport, readResearchJson } from '../src/lib/issues/import-research.ts';
import { matchIssue, type VehicleContext } from '../src/lib/issues/match.ts';
import { loadCatalog, loadIssues } from './helpers.ts';

const catalog = loadCatalog();
const live = loadIssues('live');
const preservedIds = live.issues.map((issue) => issue.id);

function bundle(issue: Record<string, unknown>, patch: Record<string, unknown> = {}) {
  return {
    schema: 'bahtepoto-research-v1',
    agent: 'test-ajan',
    brands: ['Volkswagen'],
    models: ['Golf'],
    researchedAt: '2026-10-18',
    sources: [
      {
        id: 'kaynak-a',
        title: 'Birinci teknik metin',
        url: 'https://example.com/arastirma-a',
        kind: 'technical-publication',
        publisher: 'Kaynak A',
        reviewed: true,
        reviewMethod: 'test',
      },
      {
        id: 'kaynak-b',
        title: 'İkinci teknik metin',
        url: 'https://example.com/arastirma-b',
        kind: 'technical-publication',
        publisher: 'Kaynak B',
        reviewed: true,
        reviewMethod: 'test',
      },
    ],
    issues: [
      {
        id: 'golf-vi-test-sogutma',
        title: 'Test soğutma kaydı',
        summary: 'Bu cümle yalnızca içe aktarma testidir. Canlı katalogdaki bir sorunu tekrar etmez.',
        category: 'cooling',
        frequency: 'medium',
        frequencyRationale: 'İki ayrı teknik metin aynı gövdeyi anlatıyor; oran verilmedi.',
        vehicles: [
          {
            brand: 'Volkswagen',
            model: 'Golf',
            generation: 'Golf VI',
            engines: [{ name: '1.4 TSI 160 PS' }],
          },
        ],
        sourceIds: ['kaynak-a', 'kaynak-b'],
        ...issue,
      },
    ],
    ...patch,
  };
}

function plan(data: unknown, issues = live.issues) {
  return planResearchImport({ files: [{ file: 'test.json', data }], catalog, issues, sources: live.sources });
}

function vehicle(modelId: string, genSlug: string, variantSlug: string, transmission?: { type: 'manual' | 'dual-clutch'; name?: string; revisionIds: string[] }): VehicleContext {
  const model = catalog.models.find((item) => item.id === modelId) as Model;
  const generation = model.generations.find((item) => item.slug === genSlug);
  if (!generation) throw new Error(genSlug);
  const found = generation.variants.find((item) => item.slug === variantSlug);
  if (!found) throw new Error(variantSlug);
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

describe('araştırma içe aktarma', () => {
  test('aynı JSON ikinci kez yeni kayıt açmaz', () => {
    const first = plan(bundle({}));
    assert.equal(first[0].decision, 'import');
    const second = plan(bundle({}), [...live.issues, first[0].issue!]);
    assert.equal(second[0].decision, 'duplicate');
  });

  test('bilinmeyen marka ve model uydurulmaz', () => {
    const sample = bundle({}).issues[0];
    const brand = plan(
      bundle(
        {},
        {
          brands: ['Trabant'],
          models: ['P601'],
          issues: [{ ...sample, vehicles: [{ brand: 'Trabant', model: 'P601', engines: [{ name: '600' }] }] }],
        },
      ),
    );
    assert.equal(brand[0].decision, 'review');
    assert.match(brand[0].reason, /bilinmeyen marka/);
    const model = plan(
      bundle(
        { vehicles: [{ brand: 'Volkswagen', model: 'Yokmodel', generation: 'Golf VII', engines: [{ name: '1.4 TSI 122 PS' }] }] },
        { models: ['Yokmodel'] },
      ),
    );
    assert.equal(model[0].decision, 'review');
    assert.match(model[0].reason, /bilinmeyen model/);
  });

  test('nesli yazılmayan 1.4 TSI bütün Golf kasalarına yayılmaz', () => {
    const result = plan(bundle({ id: 'nesilsiz-test', title: 'Nesilsiz test kaydı', vehicles: [{ brand: 'Volkswagen', model: 'Golf', engines: [{ name: '1.4 TSI' }] }] }));
    assert.equal(result[0].decision, 'review');
    assert.match(result[0].reason, /nesil/);
    assert.equal(result[0].issue, undefined);
  });

  test('DSG kaydı manuele bağlanmaz, Golf VII kaydı Golf 8e geçmez', () => {
    const polo = catalog.models.find((model) => model.id === 'volkswagen-polo')!;
    const poloV = polo.generations.find((generation) => generation.slug === 'polo-v')!;
    const poloVariant = poloV.variants.find((variant) => {
      const engine = catalog.engines.find((item) => item.id === variant.engineId);
      return engine?.name === '1.4 TSI ACT 150 PS';
    });
    assert.ok(poloVariant);
    const dsg = plan(
      bundle(
        {
          id: 'polo-dsg-deneme',
          category: 'transmission',
          title: 'Kuru DSG kalkış sarsıntısı',
          vehicles: [
            {
              brand: 'Volkswagen',
              model: 'Polo',
              generation: 'Polo V',
              engines: [{ name: '1.4 TSI ACT 150 PS' }],
              transmission: { type: 'dual-clutch', name: 'DSG' },
            },
          ],
        },
        { models: ['Polo'] },
      ),
    );
    assert.equal(dsg[0].decision, 'import', dsg[0].reason);
    const manual = vehicle('volkswagen-polo', 'polo-v', poloVariant!.slug, { type: 'manual', revisionIds: [] });
    assert.equal(matchIssue(dsg[0].issue!, manual).verdict, 'no');
    const pump = plan(bundle({}));
    assert.equal(pump[0].decision, 'import', pump[0].reason);
    const golf8 = catalog.models.find((model) => model.id === 'volkswagen-golf')!.generations.find((generation) => generation.slug === 'golf-8')!;
    assert.equal(matchIssue(pump[0].issue!, vehicle('volkswagen-golf', 'golf-8', golf8.variants[0].slug)).verdict, 'no');
    assert.equal(matchIssue(pump[0].issue!, vehicle('volkswagen-golf', 'golf-vi', '14-tsi-160')).verdict, 'applies');
  });

  test('başka ajandan gelen aynı başlık ikinci kart açmaz', () => {
    const first = plan(bundle({}));
    const other = plan(bundle({}, { agent: 'baska-ajan' }), [...live.issues, first[0].issue!]);
    assert.equal(other[0].decision, 'duplicate');
  });

  test('okunmamış kaynak doğrulanmış kayıt olmaz', () => {
    const data = bundle({});
    data.sources = data.sources.map((source) => ({ ...source, reviewed: false }));
    const result = plan(data);
    assert.equal(result[0].decision, 'review');
    assert.equal(result[0].issue, undefined);
  });

  test('bozuk JSON sistemi düşürmez', () => {
    const broken = readResearchJson(join(tmpdir(), 'olmayan-arastirma.json'));
    const result = planResearchImport({ files: [broken], catalog, issues: live.issues, sources: live.sources });
    assert.equal(result[0].decision, 'invalid');
  });

  test('eski kronik kayıtlar ve kaynaklar korunur; ciddiyet yaygınlıktan ayrıdır', () => {
    const before = live.issues.length;
    const result = plan(bundle({ frequency: 'high' }));
    assert.equal(live.issues.length, before);
    assert.deepEqual(live.issues.map((issue) => issue.id), preservedIds);
    assert.equal(result[0].issue?.frequencyRating, 'high');
    assert.equal(result[0].issue?.severity, undefined);
  });

  test('dry-run dosya yazmaz; apply yalnızca aktarılacak kayıtları yazar', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bahtepoto-import-'));
    const sources = join(dir, 'sources.json');
    const reviewed = plan(bundle({ id: 'yazilacak-kayit' }));
    const held = plan(bundle({ id: 'tutulacak', vehicles: [{ brand: 'Volkswagen', model: 'Golf', engines: [{ name: '1.4 TSI' }] }] }));
    applyResearchPlan([...reviewed, ...held], join(dir, 'records'), sources);
    const liveFile = readFileSync(join(import.meta.dirname, '..', 'src', 'data', 'issues', 'records', 'volkswagen', 'golf.json'), 'utf8');
    const written = JSON.parse(readFileSync(join(dir, 'records', 'volkswagen', 'golf.json'), 'utf8')) as { id: string }[];
    assert.deepEqual(
      written.map((issue) => issue.id),
      ['volkswagen-yazilacak-kayit'],
    );
    assert.equal(readFileSync(join(import.meta.dirname, '..', 'src', 'data', 'issues', 'records', 'volkswagen', 'golf.json'), 'utf8'), liveFile);
    applyResearchPlan([...reviewed.map((item) => ({ ...item, decision: 'duplicate' as const })), ...held], join(dir, 'records'), sources);
    const again = JSON.parse(readFileSync(join(dir, 'records', 'volkswagen', 'golf.json'), 'utf8')) as unknown[];
    assert.equal(again.length, 1);
    assert.equal(readdirSync(join(import.meta.dirname, '..', 'src', 'data', 'issues', 'records', 'volkswagen')).includes('golf.json'), true);
  });
});
