/**
 * Tarayıcıya parça parça gönderilen JSON yüklerinin tipleri.
 *
 *   /data/brands/<marka>.json           → BrandPayload  (modeller + nesil/makyaj özetleri, motorsuz)
 *   /data/models/<marka>/<model>.json   → ModelPayload  (varyantlar, çözülmüş motorlar, kaynaklar)
 *
 * Böylece ziyaretçi yalnızca açtığı markanın ve seçtiği modelin verisini indirir;
 * katalog on binlerce varyanta büyüse de ilk yük küçük kalır.
 * Bu dosya yalnızca tip içerir; istemci betiği de güvenle import edebilir.
 */
import type {
  Brand,
  Engine,
  Generation,
  Market,
  Model,
  Revision,
  Source,
  Variant,
} from './schema';
import type { MarketView } from './market';

export type BrandSummary = Pick<Brand, 'id' | 'slug' | 'name' | 'status' | 'generationNaming'> & {
  modelCount: number;
};

export type RevisionSummary = Pick<Revision, 'id' | 'slug' | 'name' | 'kind' | 'order' | 'periods' | 'status' | 'notes'>;

export type GenerationSummary = Pick<
  Generation,
  'id' | 'slug' | 'name' | 'code' | 'order' | 'labelPeriod' | 'periods' | 'status' | 'notes'
> & {
  revisions: RevisionSummary[];
  variantCount: number;
  /** Pazar görünümüne göre listelenen motor sayısı (bkz. market.ts). */
  marketCounts: Record<MarketView, number>;
};

export type ModelSummary = Pick<Model, 'id' | 'slug' | 'name' | 'status' | 'notes'> & {
  generations: GenerationSummary[];
};

export interface BrandPayload {
  brand: BrandSummary;
  models: ModelSummary[];
  markets: Market[];
}

export interface ModelPayload {
  modelId: string;
  brandId: string;
  /** Nesil kimliği → o neslin varyantları */
  variantsByGeneration: Record<string, Variant[]>;
  engines: Record<string, Engine>;
  sources: Record<string, Source>;
  markets: Record<string, Market>;
  updatedAt: string;
}
