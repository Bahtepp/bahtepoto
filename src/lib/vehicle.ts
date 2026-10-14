/**
 * Araç detay sayfaları için katalog seçimini (marka/model/nesil/dönem/motor) çözer,
 * kronik sorun eşleştiricisine bağlam üretir ve statik rotaları listeler.
 * Katalog ve kronik sorun verileri burada yalnızca "okunarak" birleştirilir; birbirine yazılmaz.
 */
import { getCatalog } from '@/lib/catalog';
import { formatYearRange, generationLabel } from '@/lib/catalog/format';
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
