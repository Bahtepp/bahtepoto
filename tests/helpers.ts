/**
 * Test yardımcıları: gerçek katalog verisini, sitenin kullandığı Zod şemalarıyla
 * (varsayılan değerler dahil) yükler ve araç bağlamı (VehicleContext) üretir.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'astro/zod';
import {
  brandSchema,
  engineSchema,
  marketSchema,
  modelSchema,
  sourceSchema,
  type Engine,
  type Model,
} from '../src/lib/catalog/schema.ts';
import { issueSchema, issueSourceSchema, type Issue, type IssueSource } from '../src/lib/issues/schema.ts';
import type { VehicleContext } from '../src/lib/issues/match.ts';
import type { CatalogData } from '../src/lib/catalog/validate.ts';

const ROOT = join(import.meta.dirname, '..', 'src', 'data');
const readJson = (path: string): unknown => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));

function listJson(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listJson(join(dir, e.name)) : e.name.endsWith('.json') ? [join(dir, e.name)] : [],
  );
}

export function loadCatalog(): CatalogData {
  return {
    brands: z.array(brandSchema).parse(readJson('catalog/brands.json')),
    markets: z.array(marketSchema).parse(readJson('catalog/markets.json')),
    sources: z.array(sourceSchema).parse(readJson('catalog/sources.json')),
    engines: listJson('catalog/engines').flatMap((f) => z.array(engineSchema).parse(readJson(f))),
    models: listJson('catalog/models').map((f) => modelSchema.parse(readJson(f))),
  };
}

export function loadIssues(dataset: 'live' | 'demo'): { issues: Issue[]; sources: IssueSource[] } {
  const base = dataset === 'live' ? 'issues' : 'issues-demo';
  return {
    issues: listJson(`${base}/records`).flatMap((f) => z.array(issueSchema).parse(readJson(f))),
    sources: z.array(issueSourceSchema).parse(readJson(`${base}/sources.json`)),
  };
}

/** Test içinde kısa kayıt yazmak için: eksik alanları şema varsayılanlarıyla doldurur. */
export const makeIssue = (partial: Record<string, unknown>): Issue =>
  issueSchema.parse({
    id: 'test-issue',
    slug: 'test-issue',
    brandId: 'ford',
    kind: 'known-defect',
    category: 'engine',
    title: 'Test sorunu',
    summary: 'Test amaçlı kayıt, gerçek bir sorun değildir.',
    symptoms: ['test'],
    claims: [{ sourceId: 'test-src', aspects: ['existence'], stance: 'supports' }],
    status: 'supported',
    updatedAt: '2026-10-15',
    ...partial,
  });

/**
 * Focus aracı için bağlam üretir.
 * @param gen     nesil slug'ı (mk1..mk4)
 * @param rev     makyaj dönemi slug'ı (makyajsiz / makyajli) veya undefined
 * @param variant varyant slug'ı veya undefined (motor seçilmedi)
 */
export function focusContext(catalog: CatalogData, gen: string, rev?: string, variant?: string): VehicleContext {
  const model = catalog.models.find((m) => m.id === 'ford-focus') as Model;
  const g = model.generations.find((x) => x.slug === gen);
  if (!g) throw new Error(`nesil yok: ${gen}`);
  const r = rev ? g.revisions.find((x) => x.slug === rev) : undefined;
  if (rev && !r) throw new Error(`dönem yok: ${rev}`);
  const v = variant ? g.variants.find((x) => x.slug === variant) : undefined;
  if (variant && !v) throw new Error(`varyant yok: ${variant}`);
  const engine = v ? (catalog.engines.find((e) => e.id === v.engineId) as Engine) : undefined;
  return {
    brandId: 'ford',
    modelId: model.id,
    generationId: g.id,
    generation: { labelPeriod: g.labelPeriod, periods: g.periods, revisions: g.revisions },
    revisionId: r?.id,
    engine,
    variant: v,
    markets: catalog.markets,
    currentYear: 2026,
  };
}
