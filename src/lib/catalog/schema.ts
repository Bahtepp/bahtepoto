/**
 * Katalog veri şemaları (tek kaynak).
 *
 * Kavramlar:
 *   Brand → Model → Generation → Revision (makyaj dönemi)
 *   Engine (markaya ait güç ünitesi tanımı, modellerden bağımsız)
 *   Variant (VehicleVariant: nesil × motor × [makyaj dönemleri] × pazar eşleşmesi)
 *   Market (pazar/bölge), Source (veri kaynağı)
 *
 * Her kayıt: benzersiz `id`, URL uyumlu `slug` (gerektiğinde), doğrulama durumu
 * (`status`), kaynak listesi (`sourceIds`) ve son güncelleme tarihi (`updatedAt`) taşır.
 * Şemalar build sırasında Zod ile; kayıtlar arası ilişkiler `validate.ts` ile denetlenir.
 */
import { z } from 'astro/zod';

/** Küçük harf, rakam ve tire. Örn: `ford-focus-mk2`. */
export const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id yalnızca a-z, 0-9 ve tire içerebilir');
export const slugSchema = idSchema;

/**
 * Doğrulama durumu:
 * - verified:    Birincil kaynakla (üretici belgesi, resmi basın bülteni vb.) doğrulandı.
 * - sourced:     En az bir ikincil kaynağa (ansiklopedi, yayın) dayanıyor; birincil kaynakla henüz çapraz kontrol yapılmadı.
 * - conflicting: Kaynaklar birbiriyle çelişiyor; `notes` alanında açıklanır.
 * - unverified:  Kaynak gösterilmeden girildi; kullanıcıya doğrulanmış gibi sunulmaz.
 * - pending:     Kayıt yalnızca iskelet olarak var; içerik "Veri doğrulanıyor".
 */
export const verificationStatusSchema = z.enum(['verified', 'sourced', 'conflicting', 'unverified', 'pending']);

/** ISO tarih (YYYY-AA-GG). */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-AA-GG biçiminde olmalı');

/** Bütün kayıtlarda ortak meta alanlar. */
const recordMeta = {
  status: verificationStatusSchema,
  sourceIds: z.array(idSchema).default([]),
  updatedAt: isoDateSchema,
  /** Editör notu: çelişkiler, varsayımlar, eksikler. Kullanıcıya gösterilebilir. */
  notes: z.string().optional(),
};

/** Yıl (ve biliniyorsa ay) hassasiyetinde zaman noktası. */
export const yearMonthSchema = z.object({
  year: z.number().int().min(1885).max(2100),
  month: z.number().int().min(1).max(12).optional(),
});

/**
 * Bir dönemin neye göre ölçüldüğü. Üretim yılı ile model yılı ve satış dönemi
 * birbirinden farklı olabildiği için her dönem kendi temelini belirtir.
 */
export const periodBasisSchema = z.enum(['production', 'model-year', 'sales']);

export const periodSchema = z.object({
  /** Pazar kimliği (markets.json). */
  marketId: idSchema,
  basis: periodBasisSchema,
  start: yearMonthSchema,
  /** `null`: üretim/satış sürüyor. */
  end: yearMonthSchema.nullable(),
  /**
   * Sınırlar kaynakta doğrudan verilmeyip kaynaktaki olaylardan (tanıtım, satış başlangıcı vb.)
   * türetildiyse `true`. Arayüzde "yaklaşık" olarak işaretlenir.
   */
  approximate: z.boolean().default(false),
});

/** Pazar / bölge. Ülkelere göre değişen üretim ve satış dönemleri bu kimliklerle bağlanır. */
export const marketSchema = z.object({
  id: idSchema,
  name: z.string(),
  /** `region` (Avrupa), `country` (Türkiye) */
  kind: z.enum(['region', 'country', 'global']),
  /** Ülke için ISO 3166-1 alpha-2 kodu. */
  isoCode: z.string().length(2).optional(),
  /** Kapsayan bölge (örn. `tr` → `eu` değil; yalnızca kesin olduğunda doldurulur). */
  parentId: idSchema.optional(),
});

/** Veri kaynağı. */
export const sourceSchema = z.object({
  id: idSchema,
  title: z.string(),
  url: z.url().optional(),
  publisher: z.string().optional(),
  /** primary: üretici/resmi; secondary: ansiklopedi, basın; community: forum, kullanıcı */
  tier: z.enum(['primary', 'secondary', 'community']),
  /** Kaynağın içeriğe son erişim tarihi. */
  accessedAt: isoDateSchema,
  language: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Markanın nesil adlandırma geleneği. Arayüz her markaya Mk1/Mk2 dayatmaz;
 * nesil adı (`Generation.name`) veride serbest metin olarak tutulur, bu alan yalnızca
 * editörlere ve ileride filtrelere yol gösterir.
 */
export const generationNamingSchema = z.enum([
  'mark-number', // Ford: Focus Mk2
  'chassis-code', // BMW: E46, F30 · Mercedes-Benz: W204
  'roman-numeral', // örn. Golf VII
  'generation-number', // örn. 8. nesil
  'other',
]);

export const brandSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: z.string(),
  /** Menşe ülke kodu (ISO alpha-2). */
  countryCode: z.string().length(2).optional(),
  generationNaming: generationNamingSchema.optional(),
  ...recordMeta,
});

export const fuelTypeSchema = z.enum([
  'petrol',
  'diesel',
  'lpg', // fabrika çıkışlı benzin/LPG (bi-fuel)
  'cng',
  'mild-hybrid',
  'hybrid',
  'plug-in-hybrid',
  'electric',
  'flex-fuel',
]);

export const powerSchema = z
  .object({
    ps: z.number().positive().optional(),
    kw: z.number().positive().optional(),
    hp: z.number().positive().optional(),
  })
  .refine((p) => p.ps !== undefined || p.kw !== undefined || p.hp !== undefined, 'En az bir güç birimi gerekli');

/** Motor (güç ünitesi) tanımı. Modelden bağımsızdır; aynı motor farklı modellerde kullanılabilir. */
export const engineSchema = z.object({
  id: idSchema,
  brandId: idSchema,
  slug: slugSchema,
  /** Kullanıcıya gösterilen ad, örn. "1.6 TDCi 109 PS" */
  name: z.string(),
  /** Motor ailesi, örn. "Duratorq", "EcoBoost", "Sigma (Zetec-SE)" */
  family: z.string().optional(),
  /** Üretici motor kodları (örn. "G8DA"). Yalnızca kaynakta geçiyorsa doldurulur. */
  codes: z.array(z.string()).default([]),
  /** Kaynak yakıt türünü açıkça vermiyorsa girilmez (arayüz "Veri doğrulanıyor" gösterir). */
  fuel: fuelTypeSchema.optional(),
  /** Nominal hacim (litre, örn. 1.6). */
  displacementL: z.number().positive().optional(),
  /** Kesin hacim (cm³), kaynakta varsa. */
  displacementCc: z.number().int().positive().optional(),
  cylinders: z.number().int().positive().optional(),
  aspiration: z.enum(['natural', 'turbo', 'supercharged', 'twin-turbo']).optional(),
  /** Bilinmiyorsa alan hiç girilmez; arayüz "Veri doğrulanıyor" gösterir. */
  power: powerSchema.optional(),
  torqueNm: z.number().positive().optional(),
  /** Elektrikli/hibritler için batarya kapasitesi. */
  batteryKwh: z.number().positive().optional(),
  ...recordMeta,
});

export const transmissionSchema = z.object({
  type: z.enum(['manual', 'automatic', 'dual-clutch', 'cvt', 'single-speed', 'automated-manual']),
  gears: z.number().int().positive().optional(),
  /** Üretici/ticari ad, örn. "PowerShift", "MTX-75" */
  name: z.string().optional(),
  /** Şanzıman yalnızca belirli makyaj dönemlerinde sunulduysa. Boş: varyantın tüm dönemleri. */
  revisionIds: z.array(idSchema).default([]),
});

/**
 * Motor ↔ makyaj dönemi eşleşmesinin güvenilirliği:
 * - confirmed: `revisionIds` kaynakla (doğrudan ya da kaynaktaki tarihlerden kesin olarak) belirlendi.
 * - partial:   Listelenen dönemlerde sunulduğu kesin; başka dönemlerde de sunulmuş olabilir.
 * - unknown:   Hangi makyaj döneminde sunulduğu bilinmiyor. Motor, dönemlerin altına
 *              otomatik olarak KOPYALANMAZ; arayüzde ayrı bir grupta gösterilir.
 */
export const revisionMappingSchema = z.enum(['confirmed', 'partial', 'unknown']);

/**
 * Bir varyantın belirli bir pazardaki durumu. Bilgi yoksa kayıt girilmez; eksik bilgi
 * hiçbir zaman "sunulmadı" anlamına gelmez.
 * - sold:        Pazarda resmi satışı kaynakla doğrulandı (distribütör fiyat listesi, broşür).
 * - listed:      Pazarın resmi araç değer listesinde yer alıyor (örn. TSB Kasko Değer Listesi);
 *                pazarda bulunduğunu gösterir, satış kanalını (resmi / ithal) belirtmez.
 * - imported:    Pazarda görülebilir ama resmi distribütör dışı (ör. ABD tipi ithal araç).
 * - unverified:  Pazardaki durumu henüz doğrulanmadı.
 * - not-offered: Pazarda sunulmadığı kaynakla doğrulandı.
 */
export const marketAvailabilityStatusSchema = z.enum(['sold', 'listed', 'imported', 'unverified', 'not-offered']);

export const marketAvailabilitySchema = z.object({
  marketId: idSchema,
  status: marketAvailabilityStatusSchema,
  /** Kaynağın verdiği model yılları (üretim yılı DEĞİL). */
  modelYears: z.array(z.number().int().min(1885).max(2100)).default([]),
  /** Kaynakta bu varyantla geçen donanım paketleri (motor değildir). */
  trims: z.array(z.string()).default([]),
  /** Kaynakta geçen gövde tipleri. */
  bodyTypes: z.array(z.string()).default([]),
  /** Kaynaktaki kayıt kimlikleri (örn. TSB marka-tip kodu). */
  sourceRefs: z.array(z.string()).default([]),
  sourceIds: z.array(idSchema).default([]),
  notes: z.string().optional(),
});

/** VehicleVariant: bir neslin belirli bir motorla, belirli dönem ve pazarlarda sunulması. */
export const variantSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  engineId: idSchema,
  /** Varsa sürüm/donanım adı, örn. "ST", "RS", "RS500" */
  trimName: z.string().optional(),
  revisionIds: z.array(idSchema).default([]),
  revisionMapping: revisionMappingSchema,
  transmissions: z.array(transmissionSchema).default([]),
  drivetrain: z.enum(['fwd', 'rwd', 'awd']).optional(),
  marketIds: z.array(idSchema).min(1),
  /** Bu motorun bu nesilde sunulduğu dönem (biliniyorsa). */
  periods: z.array(periodSchema).default([]),
  /** Pazar bazlı satış / listelenme durumu (bkz. marketAvailabilitySchema). */
  marketAvailability: z.array(marketAvailabilitySchema).default([]),
  ...recordMeta,
});

/** Makyaj dönemi / revizyon. Makyajı olmayan nesillerde hiç kayıt girilmez. */
export const revisionSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  /** Kullanıcıya gösterilen ad, örn. "Makyajsız", "Makyajlı", "2. makyaj" */
  name: z.string(),
  kind: z.enum(['pre-facelift', 'facelift', 'update']),
  /** Sıralama (0'dan başlar). */
  order: z.number().int().min(0),
  periods: z.array(periodSchema).default([]),
  ...recordMeta,
});

export const generationSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  /** Markanın kendi adlandırması, örn. "Focus Mk2", "3 Serisi (E46)" */
  name: z.string(),
  /** Platform/kasa kodu, örn. "C307". */
  code: z.string().optional(),
  order: z.number().int().min(0),
  /**
   * Etiketteki yıl aralığı. Nesil adı ASLA yılsız gösterilmez; bu alan zorunludur.
   * `marketId` + `basis` ile hangi pazarın hangi temeldeki yılları olduğu açıktır.
   */
  labelPeriod: periodSchema,
  /** Pazar bazlı ek dönemler (diğer ülkeler, satış/model yılı farkları). */
  periods: z.array(periodSchema).default([]),
  revisions: z.array(revisionSchema).default([]),
  variants: z.array(variantSchema).default([]),
  ...recordMeta,
});

export const modelSchema = z.object({
  id: idSchema,
  brandId: idSchema,
  slug: slugSchema,
  name: z.string(),
  order: z.number().int().min(0).default(0),
  generations: z.array(generationSchema).default([]),
  ...recordMeta,
});

export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
export type YearMonth = z.infer<typeof yearMonthSchema>;
export type Period = z.infer<typeof periodSchema>;
export type PeriodBasis = z.infer<typeof periodBasisSchema>;
export type Market = z.infer<typeof marketSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Brand = z.infer<typeof brandSchema>;
export type FuelType = z.infer<typeof fuelTypeSchema>;
export type Engine = z.infer<typeof engineSchema>;
export type Transmission = z.infer<typeof transmissionSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type Revision = z.infer<typeof revisionSchema>;
export type Generation = z.infer<typeof generationSchema>;
export type Model = z.infer<typeof modelSchema>;
export type MarketAvailability = z.infer<typeof marketAvailabilitySchema>;
export type MarketAvailabilityStatus = z.infer<typeof marketAvailabilityStatusSchema>;
