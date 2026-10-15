/**
 * TSB Kasko Değer Listesi ayrıştırıcısı.
 *
 * Dosya biçimi (2026): 1. satır başlık ("Ekim 2026"), 2. satır sütunlar:
 *   Marka Kodu | Tip Kodu | Marka Adı | Tip Adı | <model yılı> | <model yılı> | …
 * Bir hücrede değer (> 0) varsa o tip, o MODEL YILI için listede yer alıyor demektir.
 * Değerlerin kendisi (fiyatlar) kullanılmaz ve kataloğa yazılmaz; yalnızca araç tanımı ve
 * listelendiği model yılları alınır.
 *
 * Tip adı serbest metindir ("FOCUS III TITANIUM 1.6 TDCi (115) 4K"); buradaki kurallar yalnızca
 * metinde açıkça yazanı çıkarır. Çıkarılamayan alan boş kalır.
 */
import type { Cell } from '../lib/xlsx.ts';

export interface TsbRow {
  brandCode: string;
  typeCode: string;
  brand: string;
  typeName: string;
  /** Listede değeri olan model yılları (artan). */
  modelYears: number[];
  /** Kaydın geldiği dosyalar. */
  files: string[];
}

const str = (c: Cell | undefined) => (c === null || c === undefined ? '' : String(c).trim());

/** Bir çalışma sayfasını satırlara çevirir. Başlık satırı otomatik bulunur. */
export function parseSheet(rows: Cell[][], file: string): TsbRow[] {
  const headerIdx = rows.findIndex((r) => str(r[0]).toLocaleLowerCase('tr-TR').startsWith('marka kodu'));
  if (headerIdx < 0) throw new Error(`${file}: "Marka Kodu" başlık satırı bulunamadı`);
  const header = rows[headerIdx]!;
  const yearCols = header
    .map((h, i) => ({ i, year: Number(str(h)) }))
    .filter((x) => Number.isInteger(x.year) && x.year >= 1950 && x.year <= 2100);
  if (yearCols.length === 0) throw new Error(`${file}: model yılı sütunu yok`);

  const out: TsbRow[] = [];
  for (const r of rows.slice(headerIdx + 1)) {
    const brandCode = str(r[0]);
    const typeCode = str(r[1]);
    const brand = str(r[2]);
    const typeName = str(r[3]).replace(/\s+/g, ' ');
    if (!brandCode || !typeCode || !brand || !typeName) continue;
    const modelYears = yearCols.filter(({ i }) => typeof r[i] === 'number' && (r[i] as number) > 0).map((x) => x.year).sort((a, b) => a - b);
    if (modelYears.length === 0) continue;
    out.push({ brandCode, typeCode, brand, typeName, modelYears, files: [file] });
  }
  return out;
}

/**
 * Birden çok dosyanın satırlarını marka kodu + tip kodu ile birleştirir: model yılları
 * birleşir, ad ve marka en yeni dosyadan alınır (dosyalar eskiden yeniye verilmeli).
 */
export function mergeRows(lists: TsbRow[][]): TsbRow[] {
  const byKey = new Map<string, TsbRow>();
  for (const list of lists) {
    for (const row of list) {
      const key = `${row.brandCode}-${row.typeCode}`;
      const prev = byKey.get(key);
      if (!prev) byKey.set(key, { ...row, modelYears: [...row.modelYears], files: [...row.files] });
      else {
        prev.modelYears = [...new Set([...prev.modelYears, ...row.modelYears])].sort((a, b) => a - b);
        prev.files = [...new Set([...prev.files, ...row.files])];
        prev.brand = row.brand;
        prev.typeName = row.typeName;
      }
    }
  }
  return [...byKey.values()];
}
