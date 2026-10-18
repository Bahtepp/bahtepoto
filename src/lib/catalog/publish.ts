/**
 * Kamuya giden katalog yükü. Kaynak dosyalar (TSB satırları, kronik sorun
 * motor kimlikleri, araştırma varyantları) olduğu gibi kalır.
 * Yayımlanan kopya yalnızca Türkiye ana listesini taşır; kaynakça alanları yazılmaz.
 */
import type { Engine, Variant } from './schema.ts';
import { isTurkeyPrimary } from './market.ts';

export function publicVariant(variant: Variant): Variant | undefined {
  if (!isTurkeyPrimary(variant)) return undefined;
  const next: Variant = {
    ...variant,
    sourceIds: [],
    marketIds: ['tr'],
    marketAvailability: (variant.marketAvailability ?? [])
      .filter((row) => row.marketId === 'tr')
      .map((row) => ({
        marketId: row.marketId,
        status: row.status,
        modelYears: row.modelYears,
        trims: row.trims,
        bodyTypes: row.bodyTypes,
        sourceRefs: [],
        sourceIds: [],
      })),
  };
  delete next.notes;
  for (const row of next.marketAvailability) delete row.notes;
  return next;
}

export function publicEngine(engine: Engine): Engine {
  const next: Engine = { ...engine, sourceIds: [] };
  delete next.notes;
  return next;
}
