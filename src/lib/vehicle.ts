/**
 * Araç detay sayfaları için katalog seçimini (marka/model/nesil/dönem/motor) çözer,
 * kronik sorun eşleştiricisine bağlam üretir ve statik rotaları listeler.
 * Katalog ve kronik sorun verileri burada yalnızca "okunarak" birleştirilir; birbirine yazılmaz.
 */
import { getCatalog } from '@/lib/catalog';
import { MODEL_SLUG_ALIASES, aliasesOnto } from '@/lib/catalog/aliases';
import { catalogPath, formatYearRange, generationLabel, vehiclePath } from '@/lib/catalog/format';
import { isTurkeyPrimary, marketGroup } from '@/lib/catalog/market';
import type { Brand, Engine, Generation, Model, Revision, Variant } from '@/lib/catalog/schema';
import type { VehicleContext } from '@/lib/issues/match';

export interface VehicleSelection {
  brand: Brand;
  model: Model;
  generation: Generation;
  revision?: Revision;
  variant: Variant;
  engine: Engine;
  /** Motorun seçilen makyaj döneminde sunulduğu veriyle doğrulandı mı? */
  revisionMappingVerified: boolean;
}

/**
 * Bir varyant için sayfa üretilecek makyaj dönemleri:
 * - Makyajsız nesil: tek sayfa (dönem yok)
 * - revisionMapping "confirmed": yalnızca doğrulanmış dönemler (diğerlerinde sunulmadığı biliniyor)
 * - "partial" / "unknown": bütün dönemler; doğrulanmamış olanlar sayfada açıkça uyarılır
 */
export function revisionsForVariant(gen: Generation, v: Variant): (Revision | undefined)[] {
  if (gen.revisions.length === 0) return [undefined];
  if (v.revisionMapping === 'confirmed') return gen.revisions.filter((r) => v.revisionIds.includes(r.id));
  return [...gen.revisions];
}

/** Kullanıcıya açılan sayfalar: Türkiye ana listesi (satış veya değer listesi). */
export function isPublicSelection(sel: VehicleSelection): boolean {
  return isTurkeyPrimary(sel.variant);
}

function selectionParam(sel: VehicleSelection, modelSlug = sel.model.slug): string {
  return vehiclePath({
    brand: sel.brand.slug,
    model: modelSlug,
    generation: sel.generation.slug,
    revision: sel.revision?.slug,
    variant: sel.variant.slug,
  }).replace(/^\/arac\/|\/$/g, '');
}

export interface CatalogRedirect {
  /** `[...vehicle]` parametresi, başında `/arac` yok. */
  param: string;
  /** Site köküne göre hedef. `base` Astro tarafından eklenir. */
  to: string;
}

/**
 * Eski model slug'ları kanonik araca gider.
 * Türkiye ana listesinde olmayan eski varyant adresi, o modelin seçim ekranına gider.
 * Hedef kendisi olan veya hâlâ yayımlanan bir sayfayla çakışan kayıt üretilmez.
 */
export async function getCatalogRedirects(): Promise<CatalogRedirect[]> {
  const catalog = await getCatalog();
  const all = await getVehicleSelections();
  const publicParams = new Set(all.filter((s) => isPublicSelection(s)).map((s) => selectionParam(s)));
  const out: CatalogRedirect[] = [];
  const seen = new Set<string>();
  const add = (param: string, to: string) => {
    if (!param || param === to.replace(/^\/arac\/|\/$/g, '') || publicParams.has(param) || seen.has(param)) return;
    seen.add(param);
    out.push({ param, to });
  };

  for (const sel of all) {
    if (isPublicSelection(sel)) {
      const canonical = vehiclePath({
        brand: sel.brand.slug,
        model: sel.model.slug,
        generation: sel.generation.slug,
        revision: sel.revision?.slug,
        variant: sel.variant.slug,
      });
      for (const alias of aliasesOnto(sel.brand.slug, sel.model.slug)) {
        add(selectionParam(sel, alias.from), canonical);
      }
      continue;
    }
    if (marketGroup(sel.variant) === 'hidden' || marketGroup(sel.variant) === 'imported') {
      add(selectionParam(sel), catalogPath({ brand: sel.brand.slug, model: sel.model.slug }));
    }
  }

  for (const alias of MODEL_SLUG_ALIASES) {
    const target = catalog.models.find((m) => m.slug === alias.to && catalog.brandById.get(m.brandId)?.slug === alias.brand);
    if (!target) continue;
    add(`${alias.brand}/${alias.from}`, catalogPath({ brand: alias.brand, model: alias.to }));
  }
  return out;
}

export async function getVehicleSelections(): Promise<VehicleSelection[]> {
  const catalog = await getCatalog();
  const out: VehicleSelection[] = [];
  for (const model of catalog.models) {
    const brand = catalog.brandById.get(model.brandId)!;
    for (const generation of model.generations) {
      for (const variant of generation.variants) {
        const engine = catalog.engineById.get(variant.engineId)!;
        for (const revision of revisionsForVariant(generation, variant)) {
          out.push({
            brand,
            model,
            generation,
            revision,
            variant,
            engine,
            revisionMappingVerified: !revision || variant.revisionIds.includes(revision.id),
          });
        }
        // Doğrulanmamış makyaj, ilk döneme yönlendirilmez. Seçici bu adrese gider.
        if (generation.revisions.length > 0 && variant.revisionMapping !== 'confirmed') {
          out.push({
            brand,
            model,
            generation,
            variant,
            engine,
            revisionMappingVerified: false,
          });
        }
      }
    }
  }
  return out;
}

/** Kimlikleri kullanıcıya gösterilecek adlara çevirir (sorun kapsamı ve gerekçeler için). */
export async function getLabeler(): Promise<(id: string) => string> {
  const catalog = await getCatalog();
  const names = new Map<string, string>();
  for (const b of catalog.brands) names.set(b.id, b.name);
  for (const m of catalog.markets) names.set(m.id, m.name);
  for (const e of catalog.engines) names.set(e.id, e.name);
  for (const model of catalog.models) {
    names.set(model.id, `${catalog.brandById.get(model.brandId)?.name ?? ''} ${model.name}`.trim());
    for (const g of model.generations) {
      names.set(g.id, generationLabel(g));
      for (const r of g.revisions) {
        names.set(r.id, r.periods[0] ? `${g.name} ${r.name.toLocaleLowerCase('tr-TR')} (${formatYearRange(r.periods[0])})` : `${g.name} ${r.name}`);
      }
    }
  }
  return (id: string) => names.get(id) ?? id;
}

export async function toVehicleContext(sel: VehicleSelection): Promise<VehicleContext> {
  const catalog = await getCatalog();
  return {
    brandId: sel.brand.id,
    modelId: sel.model.id,
    generationId: sel.generation.id,
    generation: {
      labelPeriod: sel.generation.labelPeriod,
      periods: sel.generation.periods,
      revisions: sel.generation.revisions,
    },
    revisionId: sel.revision?.id,
    engine: sel.engine,
    variant: sel.variant,
    markets: catalog.markets,
    label: await getLabeler(),
  };
}
