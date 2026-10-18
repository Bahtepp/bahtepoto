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

  function german(brand: string, model: string, issue: Record<string, unknown>) {
    return planResearchImport({
      files: [
        {
          file: 'test.json',
          data: {
            schema: 'bahtepoto-research-v1',
            agent: 'alias-test',
            brands: [brand],
            models: [model],
            researchedAt: '2026-10-18',
            sources: [
              {
                id: 'a',
                title: 'Birinci teknik metin',
                url: 'https://example.com/alias-a',
                kind: 'expert-service',
                publisher: 'Servis A',
                reviewed: true,
                reviewMethod: 'test',
              },
              {
                id: 'b',
                title: 'İkinci teknik metin',
                url: 'https://example.com/alias-b',
                kind: 'technical-publication',
                publisher: 'Yayın B',
                reviewed: true,
                reviewMethod: 'test',
              },
            ],
            issues: [
              {
                id: 'alias-kaydi',
                title: 'Alias kapsam testi',
                summary: 'Bu cümle yalnızca motor eşleştirme testidir. Başka bir sorunu tekrar etmez.',
                category: 'engine',
                frequency: 'medium',
                frequencyRationale: 'İki ayrı teknik kaynak aynı motoru anlatıyor; oran verilmedi.',
                sourceIds: ['a', 'b'],
                ...issue,
              },
            ],
          },
        },
      ],
      catalog,
      issues: live.issues,
      sources: live.sources,
    });
  }

  test('N13 yalnız F30 320i ED satırlarına bağlanır', () => {
    const result = german('BMW', '3 Serisi', {
      vehicles: [
        {
          brand: 'BMW',
          model: '3 Serisi',
          generation: '3 Serisi (F30)',
          engines: [{ name: '320i EfficientDynamics 1.6', code: 'N13B16' }],
        },
      ],
    });
    assert.equal(result[0].decision, 'import', result[0].reason);
    assert.deepEqual(result[0].issue?.appliesTo[0].engineIds.slice().sort(), ['bmw-16-320i-ed-170', 'bmw-320i-ed-170']);
  });

  test('N20 320i adı bütün 320i motorlarına yayılmaz', () => {
    const narrow = german('BMW', '3 Serisi', {
      vehicles: [
        {
          brand: 'BMW',
          model: '3 Serisi',
          generation: '3 Serisi (F30)',
          engines: [{ name: '328i 2.0 N20', code: 'N20B20' }],
        },
      ],
    });
    assert.equal(narrow[0].decision, 'import', narrow[0].reason);
    assert.deepEqual(narrow[0].issue?.appliesTo[0].engineIds, ['bmw-328i']);
    const wide = german('BMW', '3 Serisi', {
      vehicles: [
        {
          brand: 'BMW',
          model: '3 Serisi',
          generation: '3 Serisi (F30)',
          engines: [{ name: '320i 2.0 N20', code: 'N20B20' }],
        },
      ],
    });
    assert.equal(wide[0].decision, 'review');
    assert.equal(wide[0].issue, undefined);
  });

  test('M271 yalnız W204 1.8 motorlarına bağlanır', () => {
    const result = german('Mercedes-Benz', 'C', {
      vehicles: [
        {
          brand: 'Mercedes-Benz',
          model: 'C',
          generation: 'C 3. nesil (W204)',
          engines: [{ name: 'C 180 CGI 1.8', code: 'M271' }],
        },
      ],
    });
    assert.equal(result[0].decision, 'import', result[0].reason);
    assert.deepEqual(result[0].issue?.appliesTo[0].engineIds.slice().sort(), [
      'mercedes-benz-18-180',
      'mercedes-benz-18-200',
      'mercedes-benz-18-250',
    ]);
  });

  test('A3 8V 1.4 TFSI DQ200 yalnız S tronic satırlarına bağlanır', () => {
    const result = german('Audi', 'A3', {
      category: 'transmission',
      vehicles: [
        {
          brand: 'Audi',
          model: 'A3',
          generation: 'A3 3. nesil (8V)',
          engines: [{ name: '1.4 TFSI' }],
          transmission: { type: 'dual-clutch', name: 'DQ200' },
        },
      ],
    });
    assert.equal(result[0].decision, 'import', result[0].reason);
    const ids = result[0].issue?.appliesTo[0].engineIds ?? [];
    assert.ok(ids.length > 0);
    assert.equal(ids.includes('audi-14-tfsi-122'), false);
    assert.equal(result[0].issue?.appliesTo[0].transmissions[0].name, 'S tronic');
    const other = german('Audi', 'A4', {
      category: 'transmission',
      vehicles: [
        {
          brand: 'Audi',
          model: 'A4',
          generation: 'A4 5. nesil (8W)',
          engines: [{ name: '2.0 TFSI 252 PS' }],
          transmission: { type: 'dual-clutch', name: 'DQ200' },
        },
      ],
    });
    assert.equal(other[0].decision, 'review', other[0].reason);
  });

  test('aynı motordaki farklı arıza ikinci kaydı tutmaz; benzer başlık tutulur', () => {
    const data = {
      schema: 'bahtepoto-research-v1',
      agent: 'alias-test',
      brands: ['BMW'],
      models: ['3 Serisi'],
      researchedAt: '2026-10-18',
      sources: [
        {
          id: 'a',
          title: 'Birinci teknik metin',
          url: 'https://example.com/mekanizma-a',
          kind: 'expert-service',
          publisher: 'Servis A',
          reviewed: true,
          reviewMethod: 'test',
        },
      ],
      issues: [
        {
          id: 'yag-testi',
          title: 'Kapak contasından yağ kaçağı',
          summary: 'Bu cümle yağ kaçağı mekanizmasını anlatan test kaydıdır. Başka sorunu tekrar etmez.',
          category: 'engine',
          frequency: 'medium',
          frequencyRationale: 'Tek uzman servis aynı kaçağı gördüğünü yazıyor; oran verilmedi.',
          vehicles: [{ brand: 'BMW', model: '3 Serisi', generation: '3 Serisi (F30)', engines: [{ name: '328i' }] }],
          sourceIds: ['a'],
        },
        {
          id: 'sogutma-testi',
          title: 'Devirdaim gövdesinden su sızıntısı',
          summary: 'Bu cümle soğutma kaçağını anlatan ayrı bir test kaydıdır. Yağ kaydıyla aynı mekanizma değildir.',
          category: 'engine',
          frequency: 'medium',
          frequencyRationale: 'Tek uzman servis aynı kaçağı gördüğünü yazıyor; oran verilmedi.',
          vehicles: [{ brand: 'BMW', model: '3 Serisi', generation: '3 Serisi (F30)', engines: [{ name: '328i' }] }],
          sourceIds: ['a'],
        },
        {
          id: 'yag-tekrari',
          title: 'Üst kapaktan yağ kaçağı',
          summary: 'Bu cümle aynı yağ kaçağını farklı başlıkla anlatan test kaydıdır. Yeni kart açmamalı.',
          category: 'engine',
          frequency: 'medium',
          frequencyRationale: 'Tek uzman servis aynı kaçağı gördüğünü yazıyor; oran verilmedi.',
          vehicles: [{ brand: 'BMW', model: '3 Serisi', generation: '3 Serisi (F30)', engines: [{ name: '328i' }] }],
          sourceIds: ['a'],
        },
      ],
    };
    const result = planResearchImport({ files: [{ file: 'test.json', data }], catalog, issues: live.issues, sources: live.sources });
    assert.equal(result[0].decision, 'import', result[0].reason);
    assert.equal(result[1].decision, 'import', result[1].reason);
    assert.equal(result[2].decision, 'review');
  });

  test('nesli ve yılı yazılmayan kayıt bütün üretime yayılmaz', () => {
    const result = german('Dacia', 'Lodgy', {
      category: 'electrical',
      vehicles: [{ brand: 'Dacia', model: 'Lodgy' }],
    });
    assert.equal(result[0].decision, 'review');
    assert.match(result[0].reason, /nesil ve yıl/);
  });
});
