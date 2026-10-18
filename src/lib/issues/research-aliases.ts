/**
 * Araştırma motor/şanzıman adları ile TSB satış adları arasındaki doğrulanmış karşılıklar.
 * Bir motor ailesinin bütün güç ve nesilleri buradan eşitlenmez.
 * Listede olmayan kod otomatik aktarılmaz.
 */
function fold(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('İ', 'i')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '');
}

export type EngineAlias = {
  brandId: string;
  /** Katalog nesil adında aranır. Örn. w205. */
  generationIncludes?: string;
  /** Araştırma kodu bununla aynı ya da bununla başlar. Örn. n20 → N20B20. */
  code?: string;
  /** Araştırma adında hepsi bulunmalıdır. */
  nameIncludes?: string[];
  /** Araştırma adı bu değerlerden birine birebir eşit olmalıdır. Alt dizgi eşleşmez. */
  nameExact?: string[];
  /** Bu nesildeki katalog motor adları. Başka ada taşmaz. */
  catalogNames: string[];
};

export const ENGINE_ALIASES: EngineAlias[] = [
  {
    brandId: 'bmw',
    code: 'n13',
    nameIncludes: ['320i', 'efficient'],
    catalogNames: ['320i ED 170 PS', '1.6 320i ED 170 PS'],
  },
  {
    brandId: 'bmw',
    code: 'n13',
    generationIncludes: 'f30',
    nameIncludes: ['320i', 'ed'],
    catalogNames: ['320i ED 170 PS', '1.6 320i ED 170 PS'],
  },
  {
    brandId: 'bmw',
    code: 'n13',
    generationIncludes: 'f20',
    nameExact: ['116i'],
    catalogNames: ['116i'],
  },
  {
    brandId: 'bmw',
    code: 'n13',
    generationIncludes: 'f20',
    nameExact: ['118i'],
    catalogNames: ['118i'],
  },
  {
    brandId: 'bmw',
    code: 'n13',
    generationIncludes: 'f30',
    nameExact: ['316i'],
    catalogNames: ['316i'],
  },
  {
    brandId: 'bmw',
    code: 'n20',
    nameIncludes: ['328i'],
    catalogNames: ['328i'],
  },
  {
    brandId: 'mercedes-benz',
    code: 'm271',
    nameIncludes: ['1.8'],
    catalogNames: ['1.8 180', '1.8 200', '1.8 250'],
  },
  {
    brandId: 'mercedes-benz',
    generationIncludes: 'w205',
    nameIncludes: ['220', 'bluetec'],
    catalogNames: ['2.2 220'],
  },
];

export function aliasCatalogNames(
  brandId: string,
  generationLabel: string,
  name: string | undefined,
  code: string | undefined,
): string[] | undefined {
  const foldedName = name ? fold(name) : '';
  const foldedCode = code ? fold(code) : '';
  const generation = fold(generationLabel);
  const hits = ENGINE_ALIASES.filter((alias) => {
    if (alias.brandId !== brandId) return false;
    if (alias.generationIncludes && !generation.includes(fold(alias.generationIncludes))) return false;
    if (alias.code) {
      const expected = fold(alias.code);
      if (!(foldedCode === expected || foldedCode.startsWith(expected))) return false;
    } else if (foldedCode) return false;
    if (alias.nameIncludes && !alias.nameIncludes.every((part) => foldedName.includes(fold(part)))) return false;
    if (alias.nameExact && !alias.nameExact.some((part) => foldedName === fold(part))) return false;
    return Boolean(alias.code || alias.nameIncludes?.length || alias.nameExact?.length);
  });
  if (hits.length !== 1) return undefined;
  return hits[0].catalogNames.map((item) => fold(item));
}

/** A3 8V 1.4 TFSI’deki 7 ileri S tronic, kuru kavramalı DQ200’dür. Diğer S tronic araçlar dahil değildir. */
export function audiA3Dq200IsSTronic(brandId: string, generationLabel: string, engineName: string, wantedName: string | undefined, catalogName: string | undefined): boolean {
  return (
    brandId === 'audi' &&
    fold(generationLabel).includes('8v') &&
    fold(engineName).includes(fold('1.4 TFSI')) &&
    fold(wantedName ?? '') === 'dq200' &&
    fold(catalogName ?? '') === 'stronic'
  );
}
