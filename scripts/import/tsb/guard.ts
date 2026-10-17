/**
 * Aktarma öncesi karşılaştırma: yeni katalog mevcut kataloğa göre ne kaybediyor?
 *
 * - Elle girilmiş / başka kaynaklı kayıt (TSB'ye veya Wikipedia nesil aktarmasına ait olmayan her şey)
 *   değişirse aktarma her zaman durur.
 * - TSB kaynak satırı (sourceRefs, örn. "TSB 53-821") kaybolursa veya model dosyası silinecekse aktarma
 *   durur; yalnızca açık onayla (`--onayla-silme`) yapılır. Fark raporu her durumda yazılır.
 */
import type { Json, RawCatalog } from '../lib/io.ts';
import { stripWikipedia, WPGEN_PREFIX } from '../generations/build.ts';
import { stripTsb, TSB_SOURCE_ID } from './build.ts';

const ownedByTsb = (r: Json) => {
  const ids = (r.sourceIds as string[] | undefined) ?? [];
  return ids.length === 1 && ids[0] === TSB_SOURCE_ID;
};

/** Katalogdaki TSB satır kimlikleri → bulundukları model dosyası. */
export function tsbRefs(cat: RawCatalog): Map<string, string> {
  const out = new Map<string, string>();
  for (const [f, m] of cat.models)
    for (const g of (m.generations as Json[] | undefined) ?? [])
      for (const v of (g.variants as Json[] | undefined) ?? [])
        for (const a of (v.marketAvailability as Json[] | undefined) ?? [])
          if (((a.sourceIds as string[] | undefined) ?? []).includes(TSB_SOURCE_ID)) for (const r of (a.sourceRefs as string[]) ?? []) out.set(r, f);
  return out;
}

/** Aktarmaların elle girilmiş kayda eklediği kaynak bağlantıları (TSB, Wikipedia nesil sayfası) izden çıkarılır. */
const fingerprint = (r: Json) =>
  JSON.stringify(r, (k, v: unknown) => (k === 'sourceIds' && Array.isArray(v) ? v.filter((s) => s !== TSB_SOURCE_ID && !String(s).startsWith(WPGEN_PREFIX)) : v));

/** Elle girilmiş / başka kaynaklı kayıtların izi: anahtar → JSON. TSB ve Wikipedia aktarmalarının eklediği her şey çıkarılır. */
export function curatedRecords(cat: RawCatalog): Map<string, string> {
  const out = new Map<string, string>();
  const clean = stripTsb(stripWikipedia(cat));
  for (const b of clean.brands) if (!ownedByTsb(b)) out.set(`marka ${b.id}`, fingerprint(b));
  for (const s of clean.sources) if (s.id !== TSB_SOURCE_ID) out.set(`kaynak ${s.id}`, fingerprint(s));
  for (const list of clean.engines.values()) for (const e of list) out.set(`motor ${e.id}`, fingerprint(e));
  for (const m of clean.models.values()) {
    if (!ownedByTsb(m)) out.set(`model ${m.id}`, fingerprint(m));
    else for (const g of (m.generations as Json[] | undefined) ?? []) if (!ownedByTsb(g)) out.set(`nesil ${g.id}`, fingerprint(g));
  }
  return out;
}

export interface ImportDiff {
  refsBefore: number;
  refsAfter: number;
  lostRefs: { ref: string; file: string }[];
  gainedRefs: number;
  deletedModels: string[];
  curatedChanged: string[];
}

export function compareImport(before: RawCatalog, after: RawCatalog): ImportDiff {
  const rb = tsbRefs(before);
  const ra = tsbRefs(after);
  const cb = curatedRecords(before);
  const ca = curatedRecords(after);
  const curatedChanged = [...new Set([...cb.keys(), ...ca.keys()])].filter((k) => cb.get(k) !== ca.get(k)).sort();
  return {
    refsBefore: rb.size,
    refsAfter: ra.size,
    lostRefs: [...rb].filter(([r]) => !ra.has(r)).map(([ref, file]) => ({ ref, file })),
    gainedRefs: [...ra.keys()].filter((r) => !rb.has(r)).length,
    deletedModels: [...before.models.keys()].filter((f) => !after.models.has(f)).sort(),
    curatedChanged,
  };
}

/** Aktarmanın durması gereken nedenler (boşsa güvenli). `allowDeletions` yalnızca TSB satırı ve model silmeyi onaylar. */
export function blockers(d: ImportDiff, allowDeletions: boolean): string[] {
  const out: string[] = [];
  if (d.curatedChanged.length) out.push(`${d.curatedChanged.length} elle girilmiş / başka kaynaklı kayıt değişecekti`);
  if (!allowDeletions && d.lostRefs.length) out.push(`${d.lostRefs.length} TSB kaynak satırı katalogdan düşecekti (${d.refsBefore} → ${d.refsAfter})`);
  if (!allowDeletions && d.deletedModels.length) out.push(`${d.deletedModels.length} model dosyası silinecekti`);
  return out;
}

export function diffReport(d: ImportDiff, reasons: string[], files: string[]): string {
  const list = (xs: string[], max = 200) => [...xs.slice(0, max).map((x) => `- ${x}`), ...(xs.length > max ? [`- … ve ${xs.length - max} tane daha`] : [])];
  return [
    '# TSB aktarma fark raporu',
    '',
    `Kaynak dosyalar: ${files.map((f) => `\`${f.split(/[\\/]/).pop()}\``).join(', ')}`,
    '',
    reasons.length ? `**Aktarma durduruldu; katalog değiştirilmedi.** Nedenler:\n\n${reasons.map((r) => `- ${r}`).join('\n')}` : 'Aktarma güvenli: kayıp yok.',
    '',
    '| | Sayı |',
    '|---|---|',
    `| Mevcut katalogdaki TSB satırı | ${d.refsBefore} |`,
    `| Yeni katalogdaki TSB satırı | ${d.refsAfter} |`,
    `| Düşecek TSB satırı | ${d.lostRefs.length} |`,
    `| Yeni TSB satırı | ${d.gainedRefs} |`,
    `| Silinecek model dosyası | ${d.deletedModels.length} |`,
    `| Değişecek elle girilmiş kayıt | ${d.curatedChanged.length} |`,
    '',
    ...(d.lostRefs.length ? ['## Düşecek TSB satırları', '', ...list(d.lostRefs.map((x) => `${x.ref} (${x.file})`)), ''] : []),
    ...(d.deletedModels.length ? ['## Silinecek model dosyaları', '', ...list(d.deletedModels), ''] : []),
    ...(d.curatedChanged.length ? ['## Değişecek elle girilmiş kayıtlar (her zaman engellenir)', '', ...list(d.curatedChanged), ''] : []),
    'Kayıplar bekleniyorsa (örn. TSB listeden bir tipi gerçekten kaldırdı veya modeller birleştirildi) bu raporu',
    'inceleyip `npm run import -- --onayla-silme` ile onaylayın. Elle girilmiş kayıt değişikliği onayla da yapılmaz.',
    '',
  ].join('\n');
}
