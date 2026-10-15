/**
 * Bağımlılıksız, küçük XLSX okuyucu: ZIP merkezi dizinini okur, girdileri zlib ile açar ve
 * ilk çalışma sayfasını satır dizisi olarak döndürür. Yalnızca düz tablo verisi için
 * (paylaşılan metinler, satır içi metinler ve sayılar); biçim ve formül desteklenmez.
 */
import { inflateRawSync } from 'node:zlib';

function unzip(buf: Buffer): Map<string, Buffer> {
  // Merkezi dizin sonu kaydı (EOCD), dosyanın son 64 KB'ı içinde.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('XLSX: ZIP dizini bulunamadı');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map<string, Buffer>();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('XLSX: bozuk merkezi dizin');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const dataStart = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(dataStart, dataStart + compSize);
    out.set(name, method === 0 ? Buffer.from(data) : inflateRawSync(data));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

const decode = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');

// Etiketler isteğe bağlı ad alanı önekiyle gelebilir (`<x:row>`).
const NS = '(?:\\w+:)?';
const tag = (name: string, attrs = '[^>]*') => new RegExp(`<${NS}${name}\\b${attrs}>([\\s\\S]*?)<\\/${NS}${name}>`, 'g');

const textOf = (xml: string) => decode([...xml.matchAll(tag('t'))].map((m) => m[1]).join(''));

/** "AB12" → 27 (sıfır tabanlı sütun). */
function columnIndex(ref: string): number {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? 'A';
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export type Cell = string | number | null;

/** İlk çalışma sayfasının satırları (boş hücreler `null`). */
export function readFirstSheet(buf: Buffer): Cell[][] {
  const files = unzip(buf);
  const shared = files.get('xl/sharedStrings.xml')?.toString('utf8') ?? '';
  const strings = [...shared.matchAll(tag('si'))].map((m) => textOf(m[1] ?? ''));
  const sheetName = [...files.keys()].filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort()[0];
  if (!sheetName) throw new Error('XLSX: çalışma sayfası yok');
  const xml = files.get(sheetName)!.toString('utf8');

  const rows: Cell[][] = [];
  const cellRe = new RegExp(`<${NS}c\\b([^>]*?)(?:\\/>|>([\\s\\S]*?)<\\/${NS}c>)`, 'g');
  const valueRe = new RegExp(`<${NS}v>([\\s\\S]*?)<\\/${NS}v>`);
  for (const rm of xml.matchAll(tag('row'))) {
    const row: Cell[] = [];
    for (const cm of (rm[1] ?? '').matchAll(cellRe)) {
      const attrs = cm[1] ?? '';
      const body = cm[2] ?? '';
      const ref = /\br="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const type = /\bt="(\w+)"/.exec(attrs)?.[1];
      const idx = ref ? columnIndex(ref) : row.length;
      const v = valueRe.exec(body)?.[1];
      let value: Cell = null;
      if (type === 's' && v !== undefined) value = strings[Number(v)] ?? null;
      else if (type === 'inlineStr') value = textOf(body);
      else if (type === 'str' && v !== undefined) value = decode(v);
      else if (v !== undefined) value = Number.isNaN(Number(v)) ? decode(v) : Number(v);
      while (row.length < idx) row.push(null);
      row[idx] = value;
    }
    rows.push(row);
  }
  return rows;
}
