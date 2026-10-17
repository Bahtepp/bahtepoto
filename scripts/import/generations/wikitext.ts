/**
 * Wikipedia wikitext ayrıştırma (yalnızca nesil bilgisi için gereken kısım):
 * bilgi kutuları (Infobox automobile), bölüm başlıkları, {{Main|…}} bağlantıları ve
 * üretim yılı satırları. Saf fonksiyonlar; ağa çıkmaz.
 */

export interface Infobox {
  /** Bilgi kutusunun bulunduğu 2. düzey bölüm başlığı ("Fourth generation (E46; 1998)"); giriş bölümündeyse boş. */
  heading: string;
  fields: Record<string, string>;
}

/** `{{` ile başlayan şablonun kapanışını (iç içe şablonları sayarak) bulur. */
function templateEnd(text: string, start: number): number {
  let depth = 0;
  for (let i = start; i < text.length - 1; i++) {
    if (text[i] === '{' && text[i + 1] === '{') {
      depth++;
      i++;
    } else if (text[i] === '}' && text[i + 1] === '}') {
      depth--;
      i++;
      if (depth === 0) return i + 1;
    }
  }
  return text.length;
}

/** Şablon gövdesini üst düzey `|` ile böler (iç şablon ve bağlantılardaki `|` hariç). */
function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let link = 0;
  let cur = '';
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === '{{') depth++, (cur += two), i++;
    else if (two === '}}') depth--, (cur += two), i++;
    else if (two === '[[') link++, (cur += two), i++;
    else if (two === ']]') link--, (cur += two), i++;
    else if (body[i] === '|' && depth === 0 && link === 0) parts.push(cur), (cur = '');
    else cur += body[i];
  }
  parts.push(cur);
  return parts;
}

export function parseInfoboxes(wikitext: string): Infobox[] {
  const out: Infobox[] = [];
  const re = /\{\{\s*Infobox[ _]automobile\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(wikitext))) {
    const end = templateEnd(wikitext, m.index);
    const body = wikitext.slice(m.index + 2, end - 2);
    const fields: Record<string, string> = {};
    for (const part of splitTopLevel(body).slice(1)) {
      const eq = part.indexOf('=');
      if (eq < 0) continue;
      const key = part.slice(0, eq).trim().toLowerCase().replace(/\s+/g, '_');
      if (key) fields[key] = part.slice(eq + 1).trim();
    }
    const before = wikitext.slice(0, m.index);
    const headings = [...before.matchAll(/^==\s*([^=].*?)\s*==\s*$/gm)];
    out.push({ heading: headings.at(-1)?.[1]?.trim() ?? '', fields });
    re.lastIndex = end;
  }
  return out;
}

/** 2. düzey bölümler ve bölümdeki {{Main|…}} hedefleri. */
export function sectionsWithMain(wikitext: string): { heading: string; mains: string[] }[] {
  const parts = wikitext.split(/^==\s*([^=].*?)\s*==\s*$/m);
  const out: { heading: string; mains: string[] }[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i]!.trim();
    const body = parts[i + 1] ?? '';
    const mains = [...body.matchAll(/\{\{\s*(?:Main|Main article|Further)\s*\|([^}]+)\}\}/gi)]
      .flatMap((x) => x[1]!.split('|'))
      .map((t) => t.trim())
      .filter((t) => t && !t.includes('=') && !t.includes('#'));
    out.push({ heading, mains });
  }
  return out;
}

/** Wikitext değerini düz metne indirger (ref, yorum, bağlantı, basit şablonlar). */
export function plain(value: string): string {
  return value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<ref[\s\S]*?<\/ref>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\{\{\s*(?:start date|end date|start date and age)\s*\|([^}]*)\}\}/gi, (_m, a: string) => a.split('|').filter((x) => /^\d{4}$/.test(x.trim()))[0] ?? '')
    .replace(/\{\{\s*(?:ubl|unbulleted list|plainlist|flatlist|plain list|hlist)\s*\|/gi, '\n')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\{\{[^{}]*\}\}/g, ' ')
    .replace(/'''?/g, '')
    .replace(/[ \t]+/g, ' ');
}

export interface ProductionLine {
  start: number;
  end: number | null;
  /** Parantez içindeki pazar / gövde açıklaması ("Europe", "sedan", "China"). */
  note: string;
}

const PRESENT = /\b(present|current|ongoing)\b/i;

/** "August 1997 – 2003 (Germany)\n2009–2014 (China)" → satırlar. */
export function parseProduction(value: string): ProductionLine[] {
  const lines = plain(value)
    .split(/\n|\*|;|,(?=\s*\d{4})/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: ProductionLine[] = [];
  for (const line of lines) {
    const years = [...line.matchAll(/\b(19[5-9]\d|20[0-4]\d)\b/g)].map((x) => Number(x[1]));
    if (years.length === 0) continue;
    const note = [...line.matchAll(/\(([^)]*)\)/g)].map((x) => x[1]!.trim()).join('; ');
    const rangeText = line.replace(/\([^)]*\)/g, '');
    const ry = [...rangeText.matchAll(/\b(19[5-9]\d|20[0-4]\d)\b/g)].map((x) => Number(x[1]));
    const ys = ry.length ? ry : years;
    const start = Math.min(...ys);
    // "2019–present" / "2019–" → sürüyor; "2012" tek yıl → 2012–2012; "1997–2003" → 2003
    const ongoing = PRESENT.test(rangeText) || (ys.length === 1 && /[–—-]\s*$/.test(rangeText.trim()));
    const end = ongoing ? null : Math.max(...ys);
    out.push({ start, end, note });
  }
  return out;
}

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };

/** Başlık veya sayfa adından nesil numarası ("Fourth generation", "Mk7", "Clio IV"). */
export function generationOrdinal(text: string): number | undefined {
  const t = text.toLowerCase();
  const word = ORDINALS.findIndex((o) => new RegExp(`\\b${o}[ -]generation\\b`).test(t));
  if (word >= 0) return word + 1;
  const mk = /\bmk\.?\s?(\d{1,2})\b/i.exec(text);
  if (mk) return Number(mk[1]);
  const num = /\b(\d{1,2})(?:st|nd|rd|th)[ -]generation\b/i.exec(text);
  if (num) return Number(num[1]);
  const roman = /\b(I{1,3}|IV|V|VI{1,3}|IX|X|XI{1,2})\b(?![^(]*\))/.exec(text.replace(/\([^)]*\)/g, ''));
  if (roman && roman[1] !== 'I') return ROMAN[roman[1]!];
  return undefined;
}

/** Kasa / platform kodları: "E46", "W204", "F30", "B7", "C346", "Typ 4F", "J1". */
export function chassisCodes(text: string): string[] {
  const inParens = [...text.matchAll(/\(([^)]*)\)/g)].map((x) => x[1]!).join(' ');
  const src = inParens || text;
  const codes = [...src.matchAll(/\b(?:Typ(?:e)?\s+)?([A-Z]{1,3}\d{1,3}[A-Z]?|\d[A-Z]\d?|[A-Z]{2}\d)\b/g)].map((x) => x[1]!);
  return [...new Set(codes.filter((c) => !/^(19|20)\d\d$/.test(c) && !/^MK\d+$/i.test(c)))];
}

/** Bilgi kutusundaki motor listesinden hacimler (litre): "1.4 L TSI I4" → 1.4 */
export function engineDisplacements(value: string): number[] {
  const t = plain(value);
  const litres = [...t.matchAll(/\b(\d)\.(\d)\s?(?:L|litre|liter|l\b)/gi)].map((x) => Number(`${x[1]}.${x[2]}`));
  const cc = [...t.matchAll(/\b(\d{3,4})\s?cc\b/gi)].map((x) => Math.round(Number(x[1]) / 100) / 10);
  return [...new Set([...litres, ...cc])].filter((x) => x > 0.5 && x < 9).sort((a, b) => a - b);
}
