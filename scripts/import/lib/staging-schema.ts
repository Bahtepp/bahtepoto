/**
 * Geçici alan (staging) şeması. Bağdaştırıcıların ürettiği aday kayıtlar
 * `data/staging/<kaynak>/*.json` dosyalarında bu biçimde durur.
 *
 * Aday kayıt, katalogdaki kaydın birebir biçimindedir (`record`); yanında her alanın
 * nereden geldiğini gösteren `provenance` haritası taşır. Kataloğa yazılırken yalnızca
 * `record` yazılır; kaynak bilgisi kaydın `sourceIds` / `status` / `notes` alanlarına zaten
 * yansıtılmış olmalıdır.
 */
import { z } from 'astro/zod';
import { idSchema, isoDateSchema, sourceSchema } from '../../../src/lib/catalog/schema.ts';

/**
 * Alanın kökeni:
 * - source:      Değer kaynakta açıkça var (`sourceField` kaynaktaki yerini gösterir).
 * - derived:     Kaynaktaki bir değerden kurala bağlı ve tahminsiz türetildi (örn. etiketten slug).
 * - editorial:   İçe aktarma yapılandırmasında bir insan tarafından belirlendi (örn. hedef model).
 * - placeholder: Katalog şeması değer istiyor ama kaynak vermiyor. Değer kaynağa DAYANMAZ;
 *                `note` nedenini açıklar ve kayıt açık onay olmadan kataloğa aktarılmaz.
 */
export const provenanceKindSchema = z.enum(['source', 'derived', 'editorial', 'placeholder']);

export const provenanceSchema = z
  .object({
    kind: provenanceKindSchema,
    /** Katalog kaynak kimliği (staging dosyasının `sources` listesinde veya sources.json'da). */
    sourceId: idSchema.optional(),
    retrievedAt: isoDateSchema.optional(),
    /** Kaynaktaki alan, örn. `Q62362#P580` veya `Q62362#labels.en`. */
    sourceField: z.string().min(1).optional(),
    note: z.string().min(1).optional(),
  })
  .superRefine((p, ctx) => {
    if (p.kind === 'source' || p.kind === 'derived') {
      for (const key of ['sourceId', 'retrievedAt', 'sourceField'] as const) {
        if (!p[key]) ctx.addIssue({ code: 'custom', message: `"${p.kind}" kökeni "${key}" gerektirir`, path: [key] });
      }
    }
    if ((p.kind === 'placeholder' || p.kind === 'editorial') && !p.note) {
      ctx.addIssue({ code: 'custom', message: `"${p.kind}" kökeni "note" ile açıklanmalı`, path: ['note'] });
    }
  });

export const licenseSchema = z.object({
  /** Kaynağın adı, örn. "Wikidata". */
  name: z.string().min(1),
  /** Lisans adı, örn. "CC0 1.0". */
  license: z.string().min(1),
  licenseUrl: z.url(),
  /** Sitede gösterilecek atıf metni. */
  attribution: z.string().min(1),
  /** Lisans doğrulandı ve veri yayımlanabilir mi? `false` ise promote bu dosyayı yazmaz. */
  publishable: z.boolean(),
});

/** Katalog kaydı: biçimi `check` aşamasında katalog şemalarıyla doğrulanır. */
const catalogRecordSchema = z.looseObject({ id: idSchema });

export const modelCandidateSchema = z.object({
  kind: z.literal('model'),
  /** Hedef dosya, katalog klasörüne göreli: `models/<marka>/<model>.json` */
  target: z.string().regex(/^models\/[a-z0-9-]+\/[a-z0-9-]+\.json$/, 'hedef models/<marka>/<model>.json olmalı'),
  /**
   * Model kaydı (nesiller dahil). Kaynağın vermediği alanlar (örn. makyaj dönemleri, varyantlar)
   * yazılmaz; mevcut katalog kaydındaki değerleri korunur.
   */
  record: catalogRecordSchema,
  /** Kayıt kimliği → alan yolu (`labelPeriod.start.year`) → köken. */
  provenance: z.record(idSchema, z.record(z.string(), provenanceSchema)),
});

export const stagingFileSchema = z.object({
  schemaVersion: z.literal(1),
  /** Bağdaştırıcı kimliği (`data/staging/<adapter>/`). */
  adapter: idSchema,
  /** Ham verinin alındığı gün. */
  retrievedAt: isoDateSchema,
  license: licenseSchema,
  /** Kullanılan ham dosyalar (`.cache/import/` altına göreli; git dışı). */
  rawFiles: z.array(z.string()).default([]),
  /** Kataloğa eklenecek kaynak kayıtları (sources.json biçiminde). */
  sources: z.array(sourceSchema).default([]),
  candidates: z.array(modelCandidateSchema).default([]),
  /** Kaynakta bulunup aday üretilemeyen öğeler ve nedenleri (sessizce atlanmaz). */
  skipped: z.array(z.object({ ref: z.string(), reason: z.string() })).default([]),
});

export type ProvenanceKind = z.infer<typeof provenanceKindSchema>;
export type Provenance = z.infer<typeof provenanceSchema>;
export type License = z.infer<typeof licenseSchema>;
export type ModelCandidate = z.infer<typeof modelCandidateSchema>;
export type StagingFile = z.infer<typeof stagingFileSchema>;
export type StagingFileInput = z.input<typeof stagingFileSchema>;

/** Kayıt düzeyindeki meta alanlar: köken haritası gerektirmez (kaydın kendisini anlatır). */
export const META_KEYS = ['id', 'status', 'sourceIds', 'updatedAt', 'notes'] as const;

/**
 * Bir kaydın köken gerektiren yaprak alan yolları. Meta alanlar ve iç içe nesil listesi
 * (`generations`, kendi kimliğiyle ayrıca izlenir) hariç; boş diziler yaprak sayılmaz.
 */
export function leafPaths(record: Record<string, unknown>, skip: readonly string[] = []): string[] {
  const out: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (value !== null && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k);
    } else out.push(path);
  };
  for (const [key, value] of Object.entries(record)) {
    if ((META_KEYS as readonly string[]).includes(key) || skip.includes(key)) continue;
    walk(value, key);
  }
  return out;
}
