/**
 * Türkiye kataloğunun görünürlüğü. Kayıtlar silinmez; varsayılan liste yalnızca
 * Türkiye'de yaygın markaları gösterir. Diğerleri arşivde kalır.
 *
 * İlan sayısı uydurulmaz. Liste elle düzenlenir.
 */
export type BrandTier = 'primary' | 'review';

/** Ana Türkiye kataloğu. Yeni yaygın marka buraya eklenir. */
const PRIMARY = new Set([
  'alfa-romeo', 'audi', 'bmw', 'byd', 'chery', 'chevrolet', 'citroen', 'cupra', 'dacia',
  'ds', 'fiat', 'ford', 'honda', 'hyundai', 'jaecoo', 'jaguar', 'jeep', 'kgm',
  'kia', 'land-rover', 'leapmotor', 'lexus', 'mazda', 'mercedes-benz', 'mg', 'mini', 'mitsubishi',
  'nissan', 'opel', 'peugeot', 'porsche', 'renault', 'seat', 'skoda', 'skywell', 'ssangyong',
  'subaru', 'suzuki', 'tesla', 'togg', 'toyota', 'volkswagen', 'volvo',
]);

/**
 * Ana markanın altında olsa da varsayılan Türkiye listesinden çıkarılan modeller.
 * Dosya silinmez; doğrudan adres açılır. İlan sayısı yoktur.
 * Anahtar: `marka-slug/model-slug`.
 */
const HIDDEN_MODELS = new Set([
  'nissan/rogue',
]);

export function brandTier(slug: string): BrandTier {
  return PRIMARY.has(slug) ? 'primary' : 'review';
}

export function isHiddenModel(brandSlug: string, modelSlug: string): boolean {
  return HIDDEN_MODELS.has(`${brandSlug}/${modelSlug}`);
}

export function isPrimaryBrand(slug: string): boolean {
  return brandTier(slug) === 'primary';
}
