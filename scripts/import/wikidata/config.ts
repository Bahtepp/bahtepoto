/**
 * Wikidata içe aktarma hedefleri. Bu dosya bir İNSAN KARARIDIR: hangi Wikidata öğelerinin
 * hangi katalog modeline ait nesiller olduğu burada elle belirlenir; bağdaştırıcı bunu
 * kaynaktaki P1716 (marka) ve P155/P156 (önceki/sonraki nesil) ile doğrular.
 */

export interface WikidataModelTarget {
  /** Staging dosya adı: `data/staging/wikidata/<file>.json` */
  file: string;
  brandId: string;
  /** Markanın Wikidata öğesi; her nesilde P1716 bu değeri taşımalı. */
  brandQid: string;
  model: { id: string; slug: string; name: string; notes: string };
  /**
   * Nesil etiketinin (labels.en) kalıbı. 1. grup nesil adının modelden sonraki kısmı (`Mk7`),
   * 2. grup sıra numarası (`7`). Etiket uymazsa nesil atlanır; ad tahmin edilmez.
   */
  labelPattern: RegExp;
  /** Wikidata öğeleri, eskiden yeniye. Ardışık öğeler P155/P156 ile birbirine bağlı olmalı. */
  generations: string[];
  /**
   * Katalog şeması `labelPeriod` için pazar ve yıl temeli ister; Wikidata ikisini de vermez.
   * Bu değerler KAYNAĞA DAYANMAZ: aday kayıtta `placeholder` olarak işaretlenir ve
   * `import:promote --write` bunları `--accept-placeholders` olmadan kataloğa yazmaz.
   */
  placeholderPeriod: { marketId: string; basis: 'production' | 'model-year' | 'sales' };
}

export const WIKIDATA_TARGETS: WikidataModelTarget[] = [
  {
    file: 'volkswagen-golf',
    brandId: 'volkswagen',
    brandQid: 'Q246',
    model: {
      id: 'volkswagen-golf',
      slug: 'golf',
      name: 'Golf',
      notes: 'Wikidata nesil iskeleti (Mk5–Mk8). Makyaj dönemi, motor ve pazar verisi henüz yok; yıllar doğrulanmadı.',
    },
    labelPattern: /^Volkswagen Golf (Mk(\d+))$/,
    // Mk5, Mk6, Mk7, Mk8: Q62362 (Mk7) öğesinden P155/P156 zinciriyle bulundu.
    generations: ['Q1428988', 'Q1417956', 'Q62362', 'Q56403002'],
    placeholderPeriod: { marketId: 'eu', basis: 'production' },
  },
];
