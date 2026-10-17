/**
 * TSB kaynak dosyaları: indirme, elle bırakılan dosyalar ve önbellek. Kurallar:
 *
 * - Dosyalar önce geçici klasöre (`.cache/import/tsb/.gecici-*`) iner; her biri doğrulanır (ZIP imzası,
 *   çalışma sayfası, "Marka Kodu" başlığı, en az MIN_ROWS satır). Aktarma güvenli bulunursa (`commit`)
 *   tarihli önbellek klasörüne taşınır; durdurulursa (`discard`) silinir. Başarısız indirme veya bozuk dosya
 *   önbelleği ve kataloğu değiştirmez; boş klasör kalmaz.
 * - Çevrimdışı kullanımda yalnızca geçerli xlsx içeren en yeni klasör kullanılır.
 * - Otomatik indirme mümkün değilse TSB sayfasından indirilen dosyalar `data/gelen/tsb/` klasörüne
 *   bırakılır (`npm run import -- --elle`); aynı doğrulamadan geçip önbelleğe kopyalanır.
 */
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readFirstSheet } from '../lib/xlsx.ts';
import { mergeRows, parseSheet, type TsbRow } from './parse.ts';

export const BASE = 'https://www.tsb.org.tr';
/**
 * HTTP başlıkları yalnızca ASCII olabilir: Türkçe karakterli User-Agent ("içe aktarma") TSB sunucusundan
 * HTTP 400 alıyordu (Ekim 2026). Kimliğimizi açıkça bildiren ASCII bir değer kullanılır.
 */
export const USER_AGENT = 'bahtepoto-import/0.1 (+https://bahtepoto.com; katalog veri aktarma)';
/** Arşivden alınacak listeler (Yıl, Ay kimliği; TSB'de Ocak = 2). Arşiv yalnızca son 4 yılı tutar. */
export const ARCHIVES = [{ year: 2022, monthId: 2, file: '202201R1.xlsx' }];
/** Gerçek listeler 25 000+ satırdır; bundan azı eksik veya yanlış dosya sayılır. */
export const MIN_ROWS = 1000;
/** Dosya adı YYYYMM ile başlamalı (eskiden yeniye sıralama ve kaynak başlığı buna dayanır). */
const FILE_NAME = /^\d{6}R?\d*\.xlsx$/i;

export class SourceError extends Error {}

export type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; arrayBuffer(): Promise<ArrayBuffer> }>;

/** Tek dosyayı doğrular ve satırlarını döndürür; geçersizse SourceError. */
export function validateTsbFile(buf: Buffer, name: string, minRows = MIN_ROWS): TsbRow[] {
  if (!FILE_NAME.test(name)) throw new SourceError(`${name}: dosya adı TSB biçiminde değil (örn. 202610R1.xlsx)`);
  if (buf.length < 4 || buf.readUInt32LE(0) !== 0x04034b50) throw new SourceError(`${name}: geçerli bir XLSX (ZIP) dosyası değil (${buf.length} bayt)`);
  let rows: TsbRow[];
  try {
    rows = parseSheet(readFirstSheet(buf), name.replace(/\.xlsx$/i, ''));
  } catch (e) {
    throw new SourceError(`${name}: okunamadı (${(e as Error).message})`);
  }
  if (rows.length < minRows) throw new SourceError(`${name}: yalnızca ${rows.length} satır (en az ${minRows} bekleniyor); dosya eksik olabilir`);
  return rows;
}

const xlsxIn = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => /\.xlsx$/i.test(f)).sort() : []);
const dated = (base: string) => (existsSync(base) ? readdirSync(base).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort() : []);

/** Geçerli xlsx içeren en yeni önbellek klasörünün dosyaları (yoksa boş). */
export function latestCached(base: string, minRows = MIN_ROWS): string[] {
  for (const d of dated(base).reverse()) {
    const files = xlsxIn(join(base, d));
    if (files.length === 0) continue;
    const ok = files.every((f) => {
      try {
        validateTsbFile(readFileSync(join(base, d, f)), f, minRows);
        return true;
      } catch {
        return false;
      }
    });
    if (ok) return files.map((f) => join(base, d, f));
  }
  return [];
}

/**
 * Doğrulanmış dosyaları geçici klasörden tarihli klasöre taşır. Önceki önbellekte olup yenisinde olmayan
 * arşiv dosyaları (ARCHIVES) korunur ki tek dosya bırakıldığında model yılı kapsamı daralmasın.
 */
function promote(base: string, tmp: string, date: string, minRows: number): string[] {
  const target = join(base, date);
  const previous = latestCached(base, minRows);
  mkdirSync(target, { recursive: true });
  for (const f of xlsxIn(tmp)) renameSync(join(tmp, f), join(target, f));
  for (const p of previous) {
    const name = p.split(/[\\/]/).pop()!;
    if (ARCHIVES.some((a) => a.file === name) && !existsSync(join(target, name))) copyFileSync(p, join(target, name));
  }
  rmSync(tmp, { recursive: true, force: true });
  return xlsxIn(target).map((f) => join(target, f));
}

function stage(base: string): string {
  mkdirSync(base, { recursive: true });
  return mkdtempSync(join(base, '.gecici-'));
}

/** Geçici alanda hazırlanmış, doğrulanmış kaynak dosyaları. */
export interface StagedSource {
  /** Okunacak dosyalar (eski önbellekteki arşiv listeleri dahil). */
  files: string[];
  /** Önbelleğe al (aktarma güvenli bulundu); önbellekteki dosya yollarını döndürür. */
  commit(): string[];
  /** Geçici dosyaları sil (aktarma durduruldu veya hata). */
  discard(): void;
}

function staged(base: string, tmp: string, date: string, minRows: number): StagedSource {
  // Yeni listede olmayan arşiv listesi önceki önbellekten okunur (bkz. promote).
  const name = (p: string) => p.split(/[\\/]/).pop()!;
  const previous = latestCached(base, minRows).filter((p) => ARCHIVES.some((a) => a.file === name(p)) && !existsSync(join(tmp, name(p))));
  return {
    files: [...previous, ...xlsxIn(tmp).map((f) => join(tmp, f))],
    commit: () => promote(base, tmp, date, minRows),
    discard: () => rmSync(tmp, { recursive: true, force: true }),
  };
}

/** Önbellekteki dosyalar (taşıma gerekmez). */
export const cachedSource = (files: string[]): StagedSource => ({ files, commit: () => files, discard: () => {} });

/** Elle bırakılan dosyaları doğrulayıp geçici alana alır. */
export function stageInbox(inbox: string, base: string, date: string, minRows = MIN_ROWS): StagedSource {
  const files = xlsxIn(inbox);
  if (files.length === 0) throw new SourceError(`${inbox} klasöründe xlsx dosyası yok. TSB sayfasından indirdiğiniz dosyaları buraya bırakın.`);
  for (const f of files) validateTsbFile(readFileSync(join(inbox, f)), f, minRows);
  const tmp = stage(base);
  try {
    for (const f of files) copyFileSync(join(inbox, f), join(tmp, f));
    return staged(base, tmp, date, minRows);
  } catch (e) {
    rmSync(tmp, { recursive: true, force: true });
    throw e;
  }
}

/** TSB sitesinden en güncel liste + arşiv listelerini geçici klasöre indirir ve doğrular. */
export async function stageDownload(base: string, date: string, fetchImpl: FetchLike = fetch as unknown as FetchLike, minRows = MIN_ROWS): Promise<StagedSource> {
  const get = async (path: string) => {
    let res;
    try {
      res = await fetchImpl(`${BASE}${path}`, { headers: { 'User-Agent': USER_AGENT, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
    } catch (e) {
      throw new SourceError(`TSB ${path}: bağlantı kurulamadı (${(e as Error).message})`);
    }
    if (!res.ok) throw new SourceError(`TSB ${path}: HTTP ${res.status}`);
    return res;
  };
  const tmp = stage(base);
  try {
    const latest = (await (await get('/InsuranceData/GetLatestExcelFile')).json()) as { HasError?: boolean; Result?: string };
    if (latest.HasError || !latest.Result) throw new SourceError('TSB güncel liste adresi alınamadı');
    const paths: string[] = [];
    for (const a of ARCHIVES) {
      const p = (await (await get(`/InsuranceData/GetInsuranceDataArchiveFile?Year=${a.year}&MonthId=${a.monthId}`)).json()) as string | null;
      if (p) paths.push(p);
      else console.warn(`  uyarı: ${a.year}/${a.monthId} arşivi bulunamadı`);
    }
    paths.push(latest.Result);
    for (const p of paths) {
      const name = p.split('/').pop()!;
      const buf = Buffer.from(await (await get(p)).arrayBuffer());
      validateTsbFile(buf, name, minRows);
      writeFileSync(join(tmp, name), buf);
      console.log(`  indirildi ${name}`);
    }
    return staged(base, tmp, date, minRows);
  } catch (e) {
    rmSync(tmp, { recursive: true, force: true });
    throw e;
  }
}

/** Dosyaları okuyup birleştirir (eskiden yeniye). Her dosya yeniden doğrulanır. */
export function readSources(files: string[], minRows = MIN_ROWS): TsbRow[] {
  if (files.length === 0) throw new SourceError('TSB kaynak dosyası yok');
  const sorted = [...files].sort((a, b) => a.split(/[\\/]/).pop()!.localeCompare(b.split(/[\\/]/).pop()!));
  const parsed = sorted.map((f) => {
    const name = f.split(/[\\/]/).pop()!;
    const rows = validateTsbFile(readFileSync(f), name, minRows);
    console.log(`  ${name.replace(/\.xlsx$/i, '')}: ${rows.length} satır`);
    return rows;
  });
  const rows = mergeRows(parsed);
  if (rows.length === 0) throw new SourceError('TSB listelerinde satır bulunamadı');
  return rows;
}
