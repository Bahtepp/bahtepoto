/**
 * Kronik sorun (issue) veri şeması.
 *
 * Katalogdan BAĞIMSIZDIR: sorun kayıtları `src/data/issues/` altında tutulur ve araçlara
 * yalnızca uygulanabilirlik seçicileri (`appliesTo`) üzerinden bağlanır. Seçiciler katalog
 * kimliklerini (model, nesil, makyaj dönemi, motor) ya da kataloğa bağımlı olmayan
 * tanımlayıcıları (motor kodu, motor ailesi, yakıt, şanzıman, yıl, pazar) kullanabilir.
 * Böylece ileride dış kaynaklardan toplanan sorunlar mevcut katalogla otomatik eşleştirilebilir.
 *
 * Kavramsal ayrımlar:
 * - `severity`   (ciddiyet)              — sorun ortaya çıktığında sonucu ne kadar ağır?
 * - `prevalence` (görülme sıklığı kanıtı) — ne kadar sık görüldüğüne dair hangi düzeyde kanıt var?
 *   Bu ikisi ayrı tutulur; ikisi de kaynak gerektirir. Kanıt yoksa alan boş/`unknown` kalır.
 * - `status`     (doğrulama durumu)      — sorunun varlığı ne kadar sağlam destekleniyor?
 */
import { z } from 'astro/zod';
// `.ts` uzantısı: testlerin bu dosyayı Node ile doğrudan çalıştırabilmesi için.
import { fuelTypeSchema, idSchema, isoDateSchema, periodBasisSchema } from '../catalog/schema.ts';

/**
 * Kaynak türleri (güvenilirlik sırasıyla değil, niteliğe göre):
 * - manufacturer-bulletin: Üretici teknik servis bülteni (TSB), servis kampanyası
 * - official-recall:       Resmi geri çağırma kaydı (ör. DVSA, NHTSA, KBA, Ticaret Bakanlığı)
 * - technical-publication: Güvenilir teknik yayın, akademik/bağımsız araştırma
 * - reliability-survey:    Geniş kapsamlı güvenilirlik araştırması (ör. muayene istatistikleri, büyük anketler)
 * - expert-service:        Uzman servis gözlemi (kimliği belli servis/uzman)
 * - user-report:           Kullanıcı raporu, forum, şikâyet sitesi
 */
export const issueSourceKindSchema = z.enum([
  'manufacturer-bulletin',
  'official-recall',
  'technical-publication',
  'reliability-survey',
  'expert-service',
  'user-report',
]);

export const issueSourceSchema = z.object({
  id: idSchema,
  kind: issueSourceKindSchema,
  title: z.string(),
  url: z.url().optional(),
  publisher: z.string().optional(),
  /** Kaynağın yayın tarihi (biliniyorsa). */
  publishedAt: isoDateSchema.optional(),
  accessedAt: isoDateSchema,
  /** Resmi kayıt numarası (geri çağırma no, TSB no). */
  reference: z.string().optional(),
  marketId: idSchema.optional(),
  language: z.string().optional(),
  notes: z.string().optional(),
  /** Örnek (kurgusal) kaynak. Canlı veride daima false. */
  demo: z.boolean().default(false),
});

export const yearRangeSchema = z
  .object({
    from: z.number().int().min(1885).max(2100),
    to: z.number().int().min(1885).max(2100),
    basis: periodBasisSchema,
    /** Yılların hangi pazara göre olduğu (yoksa seçicinin pazarı / araç pazarı). */
    marketId: idSchema.optional(),
  })
  .refine((r) => r.to >= r.from, 'Yıl aralığında "to" >= "from" olmalı');

export const transmissionMatchSchema = z
  .object({
    type: z.enum(['manual', 'automatic', 'dual-clutch', 'cvt', 'single-speed', 'automated-manual']).optional(),
    /** Ticari/üretici adı, örn. "PowerShift". Büyük/küçük harf duyarsız karşılaştırılır. */
    name: z.string().optional(),
    gears: z.number().int().positive().optional(),
  })
  .refine((t) => t.type || t.name || t.gears, 'Şanzıman seçicisi en az bir alan içermeli');

/**
 * Uygulanabilirlik seçicisi. Bir seçicideki TÜM dolu alanlar sağlanmalıdır (VE);
 * boş alanlar "kısıt yok" demektir. Bir sorunun birden fazla seçicisi olabilir (VEYA).
 *
 * Motor kimliği (engineIds / engineCodes / engineFamilies) kendi içinde VEYA'dır:
 * motor bu listelerden herhangi biriyle eşleşirse kimlik koşulu sağlanır.
 */
export const applicabilitySchema = z
  .object({
    modelIds: z.array(idSchema).default([]),
    generationIds: z.array(idSchema).default([]),
    revisionIds: z.array(idSchema).default([]),
    engineIds: z.array(idSchema).default([]),
    engineCodes: z.array(z.string()).default([]),
    engineFamilies: z.array(z.string()).default([]),
    fuels: z.array(fuelTypeSchema).default([]),
    transmissions: z.array(transmissionMatchSchema).default([]),
    years: yearRangeSchema.optional(),
    marketIds: z.array(idSchema).default([]),
    /** İnsan tarafından okunacak kapsam notu, örn. "DPF'li araçlar". */
    note: z.string().optional(),
  })
  .refine(
    (s) => s.modelIds.length + s.engineIds.length + s.engineCodes.length + s.engineFamilies.length > 0,
    'Seçici en az bir model, motor kimliği, motor kodu veya motor ailesine bağlanmalı',
  );

export const issueKindSchema = z.enum([
  'chronic', // tekrarlayan, araç/motor tipine özgü sorun
  'known-defect', // bilinen kusur; tekrarlama kanıtı henüz yok
  'recall', // resmi geri çağırma (tek başına kroniklik kanıtı değildir)
  'service-campaign', // üretici servis kampanyası / TSB
]);

export const issueCategorySchema = z.enum([
  'engine',
  'fuel-system',
  'cooling',
  'emissions',
  'transmission',
  'clutch',
  'electrical',
  'suspension',
  'steering',
  'brakes',
  'body',
  'interior',
  'hvac',
  'other',
]);

/** Ciddiyet: sorunun sonucunun ağırlığı (sıklıktan bağımsız). */
export const severityLevelSchema = z.enum(['low', 'moderate', 'high', 'safety']);

/**
 * Görülme sıklığına ilişkin KANIT düzeyi. Bir sıklık iddiası değildir:
 * - unknown:                    Sıklığa dair kanıt yok
 * - isolated-reports:           Tekil raporlar
 * - repeated-reports:           Birbirinden bağımsız çok sayıda rapor (en az 2 kaynak)
 * - expert-observed:            Uzman servis tarafından tekrarlayan sorun olarak gözlenmiş
 * - survey-supported:           Geniş kapsamlı güvenilirlik araştırmasıyla desteklenmiş
 * - manufacturer-acknowledged:  Üretici teknik bülteniyle kabul edilmiş
 */
export const prevalenceEvidenceSchema = z.enum([
  'unknown',
  'isolated-reports',
  'repeated-reports',
  'expert-observed',
  'survey-supported',
  'manufacturer-acknowledged',
]);

/** Bir kaynağın sorunun hangi yönünü desteklediği / çürüttüğü. */
export const claimAspectSchema = z.enum(['existence', 'scope', 'symptoms', 'severity', 'prevalence', 'remedy']);

export const claimSchema = z.object({
  sourceId: idSchema,
  aspects: z.array(claimAspectSchema).min(1),
  stance: z.enum(['supports', 'contradicts', 'partial']),
  note: z.string().optional(),
});

/**
 * Doğrulama durumu:
 * - verified:    Varlığı üretici bülteni / resmi kayıtla ya da en az iki bağımsız uzman/teknik kaynakla destekleniyor.
 * - supported:   En az bir kullanıcı-dışı kaynakla destekleniyor; doğrulama eşiğine ulaşmadı.
 * - researching: Araştırılıyor. Kesinlik yetersiz; arayüzde kesin sorun gibi gösterilmez.
 * - disputed:    Kaynaklar çelişiyor; çelişki gizlenmeden gösterilir.
 */
export const issueStatusSchema = z.enum(['verified', 'supported', 'researching', 'disputed']);

export const issueSchema = z.object({
  id: idSchema,
  slug: idSchema,
  brandId: idSchema,
  kind: issueKindSchema,
  category: issueCategorySchema,
  title: z.string().min(3).max(120),
  /** Bir-iki cümlelik sade açıklama. */
  summary: z.string().min(10).max(320),
  /** Başlıca belirtiler (ilk 3'ü listede görünür). */
  symptoms: z.array(z.string()).min(1),
  /** Genişletilen bölümde ayrıntılı belirtiler. */
  symptomDetails: z.array(z.string()).default([]),
  /** Araç satın alırken / kontrol ederken yapılacaklar. */
  checks: z.array(z.string()).default([]),
  /** Bilinen teknik çözüm veya onarım. */
  remedies: z
    .array(z.object({ text: z.string(), sourceIds: z.array(idSchema).min(1) }))
    .default([]),
  appliesTo: z.array(applicabilitySchema).min(1),
  /** Bu seçicilerden biriyle eşleşen araçlar kapsam dışıdır. */
  excludes: z.array(applicabilitySchema).default([]),
  severity: z
    .object({ level: severityLevelSchema, rationale: z.string(), sourceIds: z.array(idSchema).min(1) })
    .optional(),
  prevalence: z
    .object({ evidence: prevalenceEvidenceSchema, note: z.string().optional(), sourceIds: z.array(idSchema).default([]) })
    .default({ evidence: 'unknown', sourceIds: [] }),
  claims: z.array(claimSchema).min(1),
  status: issueStatusSchema,
  updatedAt: isoDateSchema,
  notes: z.string().optional(),
  /** Örnek (kurgusal) kayıt. Canlı veride daima false; yalnızca örnek koleksiyonda true. */
  demo: z.boolean().default(false),
});

export type IssueSourceKind = z.infer<typeof issueSourceKindSchema>;
export type IssueSource = z.infer<typeof issueSourceSchema>;
export type YearRange = z.infer<typeof yearRangeSchema>;
export type TransmissionMatch = z.infer<typeof transmissionMatchSchema>;
export type Applicability = z.infer<typeof applicabilitySchema>;
export type IssueKind = z.infer<typeof issueKindSchema>;
export type IssueCategory = z.infer<typeof issueCategorySchema>;
export type SeverityLevel = z.infer<typeof severityLevelSchema>;
export type PrevalenceEvidence = z.infer<typeof prevalenceEvidenceSchema>;
export type Claim = z.infer<typeof claimSchema>;
export type IssueStatus = z.infer<typeof issueStatusSchema>;
export type Issue = z.infer<typeof issueSchema>;
