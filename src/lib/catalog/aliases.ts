/**
 * Eski model slug'ları kanonik slug'a bağlar.
 * Birleştirme sonrası paylaşılan adresler 404 vermesin diye.
 * Hedef, kaynakla aynı slug olamaz (yönlendirme döngüsü yok).
 */
export interface ModelSlugAlias {
  brand: string;
  from: string;
  to: string;
  /** Arama kutusunda da bulunacak eski yazımlar. */
  labels: string[];
}

export const MODEL_SLUG_ALIASES: ModelSlugAlias[] = [
  { brand: 'ford', from: 'f150', to: 'f-150', labels: ['F150', 'F 150'] },
  { brand: 'ford', from: 'tourneocourier', to: 'tourneo-courier', labels: ['Tourneocourier', 'Tourneo Courier'] },
  { brand: 'ford', from: 'tourneocustom', to: 'tourneo-custom', labels: ['Tourneocustom'] },
  { brand: 'ford', from: 'tourneoconnect', to: 'tourneo-connect', labels: ['Tourneoconnect'] },
  { brand: 'jeep', from: 'grandcherokee', to: 'grand-cherokee', labels: ['Grandcherokee', 'Grand Cherokee'] },
  { brand: 'nissan', from: '350', to: '350z', labels: ['350 Z'] },
  { brand: 'mazda', from: 'mx5', to: 'mx-5', labels: ['MX5', 'MX 5'] },
  { brand: 'volvo', from: 'xc-90', to: 'xc90', labels: ['XC-90', 'XC 90'] },
  { brand: 'volvo', from: 's-80', to: 's80', labels: ['S-80', 'S 80'] },
  { brand: 'volvo', from: 'v-70', to: 'v70', labels: ['V-70', 'V 70'] },
  { brand: 'volvo', from: 'xc-70', to: 'xc70', labels: ['XC-70', 'XC 70'] },
  { brand: 'ds', from: 'ds-3', to: 'ds3', labels: ['DS-3', 'DS 3'] },
  { brand: 'ds', from: 'ds-7', to: 'ds7', labels: ['DS-7', 'DS 7'] },
  { brand: 'ds', from: 'ds-9', to: 'ds9', labels: ['DS-9', 'DS 9'] },
  { brand: 'chrysler', from: '300-c', to: '300c', labels: ['300-C', '300 C'] },
  { brand: 'chrysler', from: 'pacificia', to: 'pacifica', labels: ['Pacificia'] },
  { brand: 'proton', from: 'gen2', to: 'gen-2', labels: ['Gen2', 'Gen 2'] },
];

const byFrom = new Map(MODEL_SLUG_ALIASES.map((a) => [`${a.brand}/${a.from}`, a]));

export function canonicalModelSlug(brand: string, model: string): string {
  return byFrom.get(`${brand}/${model}`)?.to ?? model;
}

export function aliasLabelsFor(brand: string, model: string): string[] {
  return MODEL_SLUG_ALIASES.filter((a) => a.brand === brand && a.to === model).flatMap((a) => a.labels);
}

export function aliasesOnto(brand: string, model: string): ModelSlugAlias[] {
  return MODEL_SLUG_ALIASES.filter((a) => a.brand === brand && a.to === model);
}

/**
 * Eski adres, yeni slug ile birebir örtüşmüyorsa.
 * Hedef site köküne göredir; `base` yönlendirme üretilirken eklenir.
 * MINI Cooper birden fazla modele dağıldığı için marka seçimine gider.
 */
export const LEGACY_PATHS: { param: string; to: string }[] = [
  { param: 'volvo/xc40-t2', to: '/?marka=volvo&model=xc40' },
  { param: 'volvo/xc40-t2/nesil-belirlenmedi/15-129', to: '/arac/volvo/xc40/uretim-2017/15-129/' },
  { param: 'audi/rs', to: '/?marka=audi&model=e-tron-gt' },
  { param: 'audi/rs/nesil-belirlenmedi/e-tron-590', to: '/arac/audi/e-tron-gt/nesil-belirlenmedi/rs-e-tron-590/' },
  { param: 'audi/rs/nesil-belirlenmedi/e-tron', to: '/arac/audi/e-tron-gt/nesil-belirlenmedi/rs-e-tron/' },
  { param: 'mercedes-benz/mercedes', to: '/?marka=mercedes-benz&model=e' },
  { param: 'mercedes-benz/mercedes/nesil-belirlenmedi/40-571', to: '/arac/mercedes-benz/e/nesil-belirlenmedi/40-amg-571/' },
  { param: 'mini/cooper', to: '/?marka=mini' },
  { param: 'mini/cooper/nesil-belirlenmedi/16', to: '/?marka=mini' },
  { param: 'mini/cooper/nesil-belirlenmedi/15-116', to: '/?marka=mini' },
];
