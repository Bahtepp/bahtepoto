/**
 * Testler için en küçük XLSX: sıkıştırmasız ZIP + satır içi metinli tek çalışma sayfası
 * (scripts/import/lib/xlsx.ts okuyucusunun desteklediği biçim).
 */
import { crc32 } from 'node:zlib';

type Cell = string | number | null;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const col = (i: number) => {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

function zip(files: [string, string][]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of files) {
    const data = Buffer.from(text, 'utf8');
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, data);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, eocd]);
}

export function makeXlsx(rows: Cell[][]): Buffer {
  const body = rows
    .map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => (v === null ? '' : typeof v === 'number' ? `<c r="${col(ci)}${ri + 1}"><v>${v}</v></c>` : `<c r="${col(ci)}${ri + 1}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`)).join('')}</row>`)
    .join('');
  return zip([['xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8"?><worksheet><sheetData>${body}</sheetData></worksheet>`]]);
}

/** TSB biçiminde liste: [marka kodu, tip kodu, marka, tip adı, model yılları]. */
export function tsbXlsx(rows: [string, string, string, string, number[]][], years = [2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006]): Buffer {
  return makeXlsx([
    ['Ekim 2026'],
    ['Marka Kodu', 'Tip Kodu', 'Marka Adı', 'Tip Adı', ...years.map(String)],
    ...rows.map(([b, t, brand, name, ys]) => [b, t, brand, name, ...years.map((y) => (ys.includes(y) ? 500000 : 0))]),
  ]);
}
