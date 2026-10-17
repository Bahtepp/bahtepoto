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
  'subaru', 'suzuki', 'tesla', 'toyota', 'volkswagen', 'volvo',
]);

export function brandTier(slug: string): BrandTier {
  return PRIMARY.has(slug) ? 'primary' : 'review';
}

export function isPrimaryBrand(slug: string): boolean {
  return brandTier(slug) === 'primary';
}
