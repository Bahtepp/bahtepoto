/**
 * Katalog JSON dosyalarının okunur biçimi: girintili, ama kısa nesne/diziler ve varyant
 * kayıtları (`engineId` taşıyanlar) tek satırda. Böylece büyük model dosyaları gözden
 * geçirilebilir ve git farkları satır bazında anlamlı kalır.
 */
const INLINE_MAX = 160;

function isVariant(v: unknown): boolean {
  return !!v && typeof v === 'object' && !Array.isArray(v) && 'engineId' in (v as object);
}

function fmt(value: unknown, indent: string, inlineAll: boolean): string {
  const flat = JSON.stringify(value);
  if (value === null || typeof value !== 'object') return flat;
  if (inlineAll || flat.length <= INLINE_MAX || isVariant(value)) return spaced(value);
  const next = `${indent}  `;
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `[\n${value.map((v) => next + fmt(v, next, false)).join(',\n')}\n${indent}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '{}';
  return `{\n${entries.map(([k, v]) => `${next}${JSON.stringify(k)}: ${fmt(v, next, false)}`).join(',\n')}\n${indent}}`;
}

/** Tek satır, okunur boşluklarla: { "a": 1, "b": [1, 2] } */
function spaced(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(spaced).join(', ')}]`;
  const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
  return entries.length ? `{ ${entries.map(([k, v]) => `${JSON.stringify(k)}: ${spaced(v)}`).join(', ')} }` : '{}';
}

/**
 * Kayıt dizisi (marka, motor listesi): her kayıt bir satırda. `previous` verilirse, değişmemiş
 * kayıtların özgün satırı aynen korunur (elle girilmiş dosyalarda gereksiz fark oluşmaz, örn. `2.0`).
 */
export function formatRecordList(list: unknown[], previous?: string): string {
  const original = new Map<string, string>();
  if (previous) {
    for (const line of previous.split('\n')) {
      const text = line.trim().replace(/,$/, '');
      if (!text.startsWith('{')) continue;
      try {
        const rec = JSON.parse(text) as { id?: unknown };
        if (typeof rec.id === 'string') original.set(rec.id, JSON.stringify(rec) + '\u0000' + text);
      } catch {
        // çok satırlı kayıt: korunmaz, yeniden biçimlenir
      }
    }
  }
  const lineFor = (r: unknown) => {
    const id = (r as { id?: unknown }).id;
    const prev = typeof id === 'string' ? original.get(id) : undefined;
    if (prev) {
      const [json, text] = prev.split('\u0000') as [string, string];
      if (json === JSON.stringify(r)) return text;
    }
    return spaced(r);
  };
  return `[\n${list.map((r) => `  ${lineFor(r)}`).join(',\n')}\n]\n`;
}

export function formatJson(value: unknown): string {
  return `${fmt(value, '', false)}\n`;
}
