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
