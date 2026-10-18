/**
 * Katalog erişim katmanı (yalnızca build/sunucu tarafı).
 * Koleksiyonları okur, bütünlüğü denetler ve sayfalara/JSON uç noktalarına
 * hazır yükler üretir. Arayüz bileşenleri veriye doğrudan değil, buradan erişir.
 */
import { getCollection } from 'astro:content';
import type { BrandPayload, BrandSummary, ModelPayload, ModelSummary } from './payload';
import type { Brand, Engine, Market, Model, Source } from './schema';
import { validateCatalog, type CatalogData } from './validate';
import { aliasLabelsFor } from './aliases';
import { marketCounts } from './market';
import { publicEngine, publicVariant } from './publish';
import { engineGroupsForModel } from './selector';
import type { SearchIndex } from './search';
import { brandTier, isHiddenModel } from './visibility';

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
    generations: [...model.generations]
      .sort((a, b) => a.order - b.order)
      .map((g) => ({
        id: g.id,
        slug: g.slug,
        name: g.name,
        code: g.code,
        kind: g.kind,
        order: g.order,
        labelPeriod: g.labelPeriod,
        periods: g.periods,
        status: g.status,
        variantCount: marketCounts(g.variants).tr,
        marketCounts: marketCounts(g.variants),
        modelYears: [...new Set(g.variants.flatMap((v) => v.marketAvailability.flatMap((a) => (a.marketId === 'tr' ? a.modelYears : []))))].sort((x, y) => x - y),
        revisions: [...g.revisions]
          .sort((a, b) => a.order - b.order)
          .map(({ id, slug, name, kind, order, periods, status }) => ({ id, slug, name, kind, order, periods, status })),
      }))
      .filter((g) => g.marketCounts.tr > 0),
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
    tier: brandTier(b.slug),
    modelCount: models.filter((m) => m.brandId === b.id && !isHiddenModel(b.slug, m.slug) && summarizeModel(m).generations.some((g) => g.marketCounts.tr > 0)).length,
  }));
}

/** Ana sayfa araması için küçük indeks. Türkiye kaydı olmayan modeller girmez. */
export async function getSearchIndex(): Promise<SearchIndex> {
  const catalog = await getCatalog();
  const listed = await getBrandSummaries();
  const brands = listed.filter((b) => (b.tier === 'primary' ? b.modelCount > 0 : true));
  const brandIds = new Set(brands.map((b) => b.id));
  const models: SearchIndex['models'] = [];
  const engines: SearchIndex['engines'] = [];
  for (const model of catalog.models) {
    if (!brandIds.has(model.brandId)) continue;
    const summary = summarizeModel(model);
    if (!summary.generations.some((g) => g.marketCounts.tr > 0)) continue;
    const brand = catalog.brandById.get(model.brandId)!;
    if (brandTier(brand.slug) !== 'primary' || isHiddenModel(brand.slug, model.slug)) continue;
    const aliases = aliasLabelsFor(brand.slug, model.slug);
    models.push({ brand: brand.slug, brandName: brand.name, slug: model.slug, name: model.name, ...(aliases.length ? { aliases } : {}) });
    const engineMap: Record<string, (typeof catalog.engines)[number]> = {};
    const variantsByGeneration: Record<string, (typeof model.generations)[number]['variants']> = {};
    for (const gen of model.generations) {
      variantsByGeneration[gen.id] = gen.variants;
      for (const v of gen.variants) {
        const engine = catalog.engineById.get(v.engineId);
        if (engine) engineMap[engine.id] = engine;
      }
    }
    for (const group of engineGroupsForModel(summary.generations, variantsByGeneration, engineMap)) {
      if (group.chassis.length === 0) continue;
      engines.push({ brand: brand.slug, brandName: brand.name, model: model.slug, modelName: model.name, slug: group.slug, label: group.label });
    }
  }
  return {
    brands: brands.map((b) => ({ slug: b.slug, name: b.name, tier: b.tier })),
    models,
    engines,
  };
}

export async function getBrandPayload(brandId: string): Promise<BrandPayload> {
  const catalog = await getCatalog();
  const brand = (await getBrandSummaries()).find((b) => b.id === brandId);
  if (!brand) throw new Error(`Bilinmeyen marka: ${brandId}`);
  return {
    brand,
    models: catalog.models.filter((m) => m.brandId === brandId && (brand.tier !== 'primary' || !isHiddenModel(brand.slug, m.slug))).map((m) => summarizeModel(m)),
    markets: catalog.markets.filter((m) => m.id === 'tr'),
  };
}

export async function getModelPayload(modelId: string): Promise<ModelPayload> {
  const catalog = await getCatalog();
  const model = catalog.models.find((m) => m.id === modelId);
  if (!model) throw new Error(`Bilinmeyen model: ${modelId}`);

  const engines: ModelPayload['engines'] = {};
  const markets: ModelPayload['markets'] = {};
  const variantsByGeneration: ModelPayload['variantsByGeneration'] = {};
  let updatedAt = model.updatedAt;

  const trMarket = catalog.marketById.get('tr');
  for (const gen of model.generations) {
    const visible = gen.variants.flatMap((v) => {
      const next = publicVariant(v);
      return next ? [next] : [];
    });
    variantsByGeneration[gen.id] = visible;
    for (const v of visible) {
      const engine = catalog.engineById.get(v.engineId)!;
      engines[engine.id] = publicEngine(engine);
      if (trMarket) markets.tr = trMarket;
      for (const d of [v.updatedAt, engine.updatedAt, gen.updatedAt]) if (d > updatedAt) updatedAt = d;
    }
  }

  return { modelId: model.id, brandId: model.brandId, variantsByGeneration, engines, sources: {}, markets, updatedAt };
}
