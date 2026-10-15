/**
 * Wikidata bağdaştırıcısı: nesil iskeleti (ad, sıra, başlangıç/bitiş yılı) üretir.
 *
 * Kullanılan özellikler: P580 başlangıç zamanı, P582 bitiş zamanı, P155/P156 önceki/sonraki
 * nesil, P1716 marka. Wikidata makyaj dönemi, pazar veya yıl temeli (üretim / satış / model
 * yılı) vermez; bu nedenle:
 * - makyaj dönemi, varyant ve motor ÜRETİLMEZ;
 * - kayıtlar `unverified` olur ve `notes` yılların temelinin belirsiz olduğunu açıkça yazar;
 * - `labelPeriod.marketId` / `basis` yer tutucudur (bkz. config.ts).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AdapterContext, SourceAdapter } from '../lib/adapter.ts';
import type { License, Provenance, StagingFile } from '../lib/staging-schema.ts';
import { WIKIDATA_TARGETS, type WikidataModelTarget } from './config.ts';

export const WIKIDATA_LICENSE: License = {
  name: 'Wikidata',
  license: 'CC0 1.0',
  licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  attribution: 'Wikidata (CC0 1.0), https://www.wikidata.org',
  publishable: true,
};

const USER_AGENT = 'bahtepoto-import/0.1 (https://bahtepoto.com; katalog veri içe aktarma)';
const entityUrl = (qid: string) => `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
export const sourceIdFor = (qid: string) => `wikidata-${qid.toLowerCase()}`;

// --- Wikidata JSON biçiminin kullanılan kısmı ---
interface Snak {
  snaktype: string;
  datavalue?: { value: unknown };
}
interface Claim {
  rank: 'preferred' | 'normal' | 'deprecated';
  mainsnak: Snak;
  references?: { snaks: Record<string, Snak[]> }[];
}
export interface WikidataEntity {
  id: string;
  lastrevid?: number;
  labels: Record<string, { value: string }>;
  claims: Record<string, Claim[]>;
}

/** En yüksek dereceli (preferred > normal) ve kullanımdan kaldırılmamış ifadeler. */
function bestClaims(e: WikidataEntity, prop: string): Claim[] {
  const all = (e.claims[prop] ?? []).filter((c) => c.rank !== 'deprecated' && c.mainsnak.snaktype === 'value');
  const preferred = all.filter((c) => c.rank === 'preferred');
  return preferred.length > 0 ? preferred : all;
}

const itemIds = (e: WikidataEntity, prop: string) =>
  bestClaims(e, prop)
    .map((c) => (c.mainsnak.datavalue?.value as { id?: string } | undefined)?.id)
    .filter((x): x is string => !!x);

type TimeResult =
  | { ok: true; value: { year: number; month?: number }; claim: Claim }
  | { ok: false; reason: 'missing' | 'conflict' | 'imprecise'; detail?: string };

/** Zaman değeri: yalnızca kaynaktaki hassasiyet kadar (yıl = 9, ay = 10 ve üstü). */
export function readTime(e: WikidataEntity, prop: string): TimeResult {
  const claims = bestClaims(e, prop);
  if (claims.length === 0) return { ok: false, reason: 'missing' };
  const values = claims.map((c) => {
    const v = c.mainsnak.datavalue?.value as { time: string; precision: number };
    const m = /^([+-]\d+)-(\d{2})-(\d{2})T/.exec(v.time);
    if (!m || v.precision < 9) return undefined;
    const year = Number(m[1]);
    const month = Number(m[2]);
    return v.precision >= 10 && month > 0 ? { year, month } : { year };
  });
  if (values.some((v) => v === undefined)) return { ok: false, reason: 'imprecise' };
  const distinct = [...new Set(values.map((v) => JSON.stringify(v)))];
  if (distinct.length > 1) return { ok: false, reason: 'conflict', detail: distinct.join(' / ') };
  return { ok: true, value: values[0]!, claim: claims[0]! };
}

/** İfadenin Wikidata içindeki dayanağı (varsa), kısa Türkçe açıklama. */
function referenceNote(claim: Claim): string {
  const urls = new Set<string>();
  let importedFrom: string | undefined;
  for (const ref of claim.references ?? []) {
    for (const p of ['P854', 'P4656']) {
      for (const s of ref.snaks[p] ?? []) if (typeof s.datavalue?.value === 'string') urls.add(s.datavalue.value);
    }
    for (const s of ref.snaks.P143 ?? []) importedFrom ??= (s.datavalue?.value as { id?: string } | undefined)?.id;
  }
  const via = importedFrom ? ` (P143 ${importedFrom} üzerinden aktarılmış)` : '';
  if (urls.size > 0) return `Wikidata'daki dayanak: ${[...urls].join(', ')}${via}.`;
  if (importedFrom) return `Wikidata'daki dayanak: P143 ${importedFrom} üzerinden aktarılmış.`;
  return 'Wikidata bu değer için kaynak göstermiyor.';
}

const reasonText = (r: { reason: string; detail?: string }) => `${r.reason}${r.detail ? ` (${r.detail})` : ''}`;

/**
 * Önbellekteki Wikidata öğelerinden staging dosyası üretir. Saf fonksiyondur (ağa çıkmaz);
 * testler sabit öğe JSON'larıyla çağırır.
 */
export function normalizeTarget(target: WikidataModelTarget, entities: Map<string, WikidataEntity>, retrievedAt: string): StagingFile {
  const skipped: StagingFile['skipped'] = [];
  const sources: StagingFile['sources'] = [];
  const generations: Record<string, unknown>[] = [];
  const provenance: Record<string, Record<string, Provenance>> = {};
  const { marketId, basis } = target.placeholderPeriod;

  // Zincir doğrulaması: yapılandırmadaki sıra kaynaktaki P155/P156 ile aynı olmalı.
  target.generations.forEach((qid, i) => {
    const next = target.generations[i + 1];
    const a = entities.get(qid);
    const b = next ? entities.get(next) : undefined;
    if (!next || !a || !b) return;
    if (!itemIds(a, 'P156').includes(next) || !itemIds(b, 'P155').includes(qid)) {
      throw new Error(`Wikidata zinciri yapılandırmayla uyuşmuyor: ${qid} → ${next} (P156/P155). config.ts'i kontrol edin.`);
    }
  });

  for (const qid of target.generations) {
    const e = entities.get(qid);
    if (!e) {
      skipped.push({ ref: qid, reason: 'önbellekte öğe yok' });
      continue;
    }
    const label = e.labels.en?.value ?? '';
    const m = target.labelPattern.exec(label);
    if (!m || !m[1] || !m[2]) {
      skipped.push({ ref: qid, reason: `İngilizce etiket ("${label}") beklenen kalıba uymuyor; nesil adı tahmin edilmedi` });
      continue;
    }
    const brands = itemIds(e, 'P1716');
    if (!brands.includes(target.brandQid)) {
      skipped.push({ ref: qid, reason: `P1716 (marka) ${target.brandQid} değil (${brands.join(', ') || 'yok'})` });
      continue;
    }
    const start = readTime(e, 'P580');
    if (!start.ok) {
      skipped.push({ ref: qid, reason: `P580 (başlangıç) kullanılamıyor: ${reasonText(start)}; nesil yılsız gösterilemez` });
      continue;
    }
    const end = readTime(e, 'P582');
    if (!end.ok && end.reason !== 'missing') {
      skipped.push({ ref: qid, reason: `P582 (bitiş) kullanılamıyor: ${reasonText(end)}` });
      continue;
    }

    const sourceId = sourceIdFor(qid);
    const suffix = m[1];
    const id = `${target.model.id}-${suffix.toLowerCase()}`;
    const src = (field: string, note?: string): Provenance => ({
      kind: 'source',
      sourceId,
      retrievedAt,
      sourceField: `${qid}#${field}`,
      ...(note ? { note } : {}),
    });
    const der = (field: string, note: string): Provenance => ({ kind: 'derived', sourceId, retrievedAt, sourceField: `${qid}#${field}`, note });
    const basisNote = `Wikidata P580/P582 yılların hangi pazara ve hangi temele (üretim / satış / model yılı) ait olduğunu belirtmiyor; "${marketId}" / "${basis}" yer tutucudur.`;

    const prov: Record<string, Provenance> = {
      slug: der('labels.en', `"${label}" etiketinden`),
      name: der('labels.en', `"${label}" etiketinden`),
      order: der('labels.en', `"${suffix}" sıra numarası eksi 1`),
      'labelPeriod.marketId': { kind: 'placeholder', note: basisNote },
      'labelPeriod.basis': { kind: 'placeholder', note: basisNote },
      'labelPeriod.start.year': src('P580', referenceNote(start.claim)),
    };
    if (start.value.month) prov['labelPeriod.start.month'] = src('P580');
    if (end.ok) {
      prov['labelPeriod.end.year'] = src('P582', referenceNote(end.claim));
      if (end.value.month) prov['labelPeriod.end.month'] = src('P582');
    } else {
      prov['labelPeriod.end'] = {
        kind: 'placeholder',
        note: `Wikidata'da P582 (bitiş) yok. Katalogda null "sürüyor" anlamına gelir; bu kaynakta doğrulanmadı.`,
      };
    }

    const years = `${start.value.year}–${end.ok ? end.value.year : 'bitiş yok'}`;
    const notes = [
      `Yıllar (${years}) Wikidata ${qid} öğesinin P580/P582 değerlerinden alındı ve doğrulanmadı.`,
      `Wikidata bu yılların üretim, satış ya da model yılı olduğunu ve hangi pazara ait olduğunu belirtmiyor; etiketteki pazar (${marketId}) ve temel (${basis}) kaynağa dayanmayan yer tutuculardır.`,
      end.ok ? '' : `Wikidata'da bitiş yılı yok; nesil "sürüyor" olarak yazıldı ama bu doğrulanmadı.`,
      'Wikidata makyaj bilgisi vermediği için makyaj dönemi oluşturulmadı.',
    ]
      .filter(Boolean)
      .join(' ');

    generations.push({
      id,
      slug: suffix.toLowerCase(),
      name: `${target.model.name} ${suffix}`,
      order: Number(m[2]) - 1,
      labelPeriod: { marketId, basis, start: start.value, end: end.ok ? end.value : null },
      status: 'unverified',
      sourceIds: [sourceId],
      updatedAt: retrievedAt,
      notes,
    });
    provenance[id] = prov;
    sources.push({
      id: sourceId,
      title: `${label} (Wikidata ${qid})`,
      url: `https://www.wikidata.org/wiki/${qid}`,
      publisher: 'Wikidata',
      tier: 'secondary',
      accessedAt: retrievedAt,
      language: 'mul',
      notes: `CC0 1.0. Topluluk tarafından düzenlenir.${e.lastrevid ? ` Okunan revizyon: ${e.lastrevid}.` : ''}`,
    });
  }

  const configNote = 'İçe aktarma yapılandırması (scripts/import/wikidata/config.ts)';
  provenance[target.model.id] = {
    slug: { kind: 'editorial', note: configNote },
    name: { kind: 'editorial', note: configNote },
    brandId: { kind: 'editorial', note: `${configNote}; her nesilde P1716 = ${target.brandQid} doğrulandı` },
  };

  return {
    schemaVersion: 1,
    adapter: 'wikidata',
    retrievedAt,
    license: WIKIDATA_LICENSE,
    rawFiles: target.generations.filter((q) => entities.has(q)).map((q) => `wikidata/${retrievedAt}/${q}.json`),
    sources,
    candidates: [
      {
        kind: 'model',
        target: `models/${target.brandId}/${target.model.slug}.json`,
        record: {
          id: target.model.id,
          brandId: target.brandId,
          slug: target.model.slug,
          name: target.model.name,
          status: 'unverified',
          updatedAt: retrievedAt,
          notes: target.model.notes,
          generations,
        },
        provenance,
      },
    ],
    skipped,
  };
}

export function readCachedEntity(cacheDir: string, qid: string): WikidataEntity | undefined {
  const path = join(cacheDir, `${qid}.json`);
  if (!existsSync(path)) return undefined;
  const raw = JSON.parse(readFileSync(path, 'utf8')) as { entities: Record<string, WikidataEntity> };
  return raw.entities[qid] ?? Object.values(raw.entities)[0];
}

export function createWikidataAdapter(options: { targets?: WikidataModelTarget[]; fetchImpl?: typeof fetch } = {}): SourceAdapter {
  const targets = options.targets ?? WIKIDATA_TARGETS;
  const doFetch = options.fetchImpl ?? fetch;
  return {
    id: 'wikidata',
    license: WIKIDATA_LICENSE,
    async fetch(ctx: AdapterContext) {
      mkdirSync(ctx.cacheDir, { recursive: true });
      const files: string[] = [];
      let downloaded = 0;
      for (const qid of targets.flatMap((t) => t.generations)) {
        const name = `${qid}.json`;
        const path = join(ctx.cacheDir, name);
        files.push(name);
        if (existsSync(path) && !ctx.refresh) continue;
        const res = await doFetch(entityUrl(qid), { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
        if (!res.ok) throw new Error(`Wikidata ${qid}: HTTP ${res.status}`);
        writeFileSync(path, await res.text(), 'utf8');
        downloaded++;
        ctx.log?.(`indirildi ${qid}`);
      }
      return { files, downloaded };
    },
    async normalize(ctx: AdapterContext) {
      return targets.map((t) => {
        const entities = new Map<string, WikidataEntity>();
        for (const qid of t.generations) {
          const e = readCachedEntity(ctx.cacheDir, qid);
          if (e) entities.set(qid, e);
        }
        return { name: t.file, file: normalizeTarget(t, entities, ctx.retrievedAt) };
      });
    },
  };
}
