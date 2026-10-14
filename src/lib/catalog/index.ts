/**
 * Katalog erişim katmanı (yalnızca build/sunucu tarafı).
 * Koleksiyonları okur, bütünlüğü denetler ve sayfalara/JSON uç noktalarına
 * hazır yükler üretir. Arayüz bileşenleri veriye doğrudan değil, buradan erişir.
 */
import { getCollection } from 'astro:content';
import type { BrandPayload, BrandSummary, ModelPayload, ModelSummary } from './payload';
import type { Brand, Engine, Market, Model, Source } from './schema';
import { validateCatalog, type CatalogData } from './validate';

interface Catalog extends CatalogData {
  brandById: Map<string, Brand>;
  engineById: Map<string, Engine>;
  marketById: Map<string, Market>;
  sourceById: Map<string, Source>;
}

let cache: Promise<Catalog> | undefined;

const byOrderThenName = <T extends { order?: number; name: string }>(a: T, b: T) =>
  (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, 'tr');

async function loadCatalog(): Promise<Catalog> {
  const [brands, markets, sources, engines, models] = await Promise.all([
    getCollection('brands'),
    getCollection('markets'),
    getCollection('sources'),
    getCollection('engines'),
    getCollection('models'),
  ]);

  const data: CatalogData = {
    brands: brands.map((e) => e.data).sort((a, b) => a.name.localeCompare(b.name, 'tr')),
    markets: markets.map((e) => e.data),
    sources: sources.map((e) => e.data),
    engines: engines.map((e) => e.data),
    models: models.map((e) => e.data).sort(byOrderThenName),
  };

  const errors = validateCatalog(data);
  if (errors.length > 0) {
    throw new Error(`Katalog verisinde ${errors.length} bütünlük hatası:\n  - ${errors.join('\n  - ')}`);
  }

  return {
    ...data,
    brandById: new Map(data.brands.map((b) => [b.id, b])),
    engineById: new Map(data.engines.map((e) => [e.id, e])),
    marketById: new Map(data.markets.map((m) => [m.id, m])),
    sourceById: new Map(data.sources.map((s) => [s.id, s])),
  };
}

export function getCatalog(): Promise<Catalog> {
  cache ??= loadCatalog();
  return cache;
}

function summarizeModel(model: Model): ModelSummary {
  return {
    id: model.id,
    slug: model.slug,
    name: model.name,
    status: model.status,
    notes: model.notes,
    generations: [...model.generations]
      .sort((a, b) => a.order - b.order)
      .map((g) => ({
        id: g.id,
        slug: g.slug,
        name: g.name,
        code: g.code,
        order: g.order,
        labelPeriod: g.labelPeriod,
        periods: g.periods,
        status: g.status,
        notes: g.notes,
        variantCount: g.variants.length,
        revisions: [...g.revisions]
          .sort((a, b) => a.order - b.order)
          .map(({ id, slug, name, kind, order, periods, status, notes }) => ({ id, slug, name, kind, order, periods, status, notes })),
      })),
  };
}

export async function getBrandSummaries(): Promise<BrandSummary[]> {
  const { brands, models } = await getCatalog();
  return brands.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    status: b.status,
    generationNaming: b.generationNaming,
    modelCount: models.filter((m) => m.brandId === b.id).length,
  }));
}

export async function getBrandPayload(brandId: string): Promise<BrandPayload> {
  const catalog = await getCatalog();
  const brand = (await getBrandSummaries()).find((b) => b.id === brandId);
  if (!brand) throw new Error(`Bilinmeyen marka: ${brandId}`);
  return {
    brand,
    models: catalog.models.filter((m) => m.brandId === brandId).map(summarizeModel),
    markets: catalog.markets,
  };
}

export async function getModelPayload(modelId: string): Promise<ModelPayload> {
  const catalog = await getCatalog();
  const model = catalog.models.find((m) => m.id === modelId);
  if (!model) throw new Error(`Bilinmeyen model: ${modelId}`);

  const engines: ModelPayload['engines'] = {};
  const sources: ModelPayload['sources'] = {};
  const markets: ModelPayload['markets'] = {};
  const addSources = (ids: string[]) => {
    for (const id of ids) sources[id] = catalog.sourceById.get(id)!;
  };

  addSources(model.sourceIds);
  const variantsByGeneration: ModelPayload['variantsByGeneration'] = {};
  let updatedAt = model.updatedAt;

  for (const gen of model.generations) {
    addSources(gen.sourceIds);
    gen.revisions.forEach((r) => addSources(r.sourceIds));
    variantsByGeneration[gen.id] = gen.variants;
    for (const v of gen.variants) {
      const engine = catalog.engineById.get(v.engineId)!;
      engines[engine.id] = engine;
      addSources(v.sourceIds);
      addSources(engine.sourceIds);
      for (const mid of v.marketIds) markets[mid] = catalog.marketById.get(mid)!;
      for (const d of [v.updatedAt, engine.updatedAt, gen.updatedAt]) if (d > updatedAt) updatedAt = d;
    }
  }

  return { modelId: model.id, brandId: model.brandId, variantsByGeneration, engines, sources, markets, updatedAt };
}
