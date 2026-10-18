/**
 * BAHTEPOTO Kronik Araştırma JSON v1.
 *
 * Araştırmacı katalog kimliği yazmak zorunda değildir. Marka, model, nesil ve motor
 * insan dilindeki adlarla gelir. Katalog kimliğine çevirmek içe aktarma aracının işidir.
 */
import { z } from 'astro/zod';
import { isoDateSchema } from '../catalog/schema.ts';
import { issueCategorySchema, issueSourceKindSchema } from './schema.ts';

export const RESEARCH_SCHEMA_ID = 'bahtepoto-research-v1' as const;

export const researchSourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(3),
  url: z.url(),
  kind: issueSourceKindSchema,
  publisher: z.string().optional(),
  publishedAt: isoDateSchema.optional(),
  /** true ise metin gerçekten okundu. Arama sonucunda bağlantı görmek yeterli değildir. */
  reviewed: z.boolean(),
  reviewMethod: z.string().optional(),
  note: z.string().optional(),
  /** Aynı haberin kopyaları aynı değeri taşır. */
  basedOn: z.string().optional(),
});

export const researchEngineSchema = z
  .object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
  })
  .refine((e) => e.name || e.code, 'Motorda ad veya kod olmalı');

export const researchVehicleSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  /** Katalogdaki nesil adı, kodu veya kısa adı. Bilinmiyorsa boş bırakılır; tahmin edilmez. */
  generation: z.string().min(1).optional(),
  engines: z.array(researchEngineSchema).default([]),
  years: z
    .object({
      from: z.number().int().min(1885).max(2100),
      to: z.number().int().min(1885).max(2100),
    })
    .optional(),
  transmission: z
    .object({
      type: z.enum(['manual', 'automatic', 'dual-clutch', 'cvt', 'single-speed', 'automated-manual']).optional(),
      name: z.string().min(1).optional(),
    })
    .optional(),
  /**
   * Yalnızca süspansiyon ve hvac için. Sorun o nesilde motor ve donanımdan bağımsızsa true.
   * Şanzıman, nesli belirsiz kayıt ve okunmamış kaynak bu alanla aktarılmaz.
   */
  chassisWide: z.boolean().optional(),
});

export const researchIssueSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(3).max(80),
  summary: z.string().min(20).max(280),
  category: issueCategorySchema,
  frequency: z.enum(['high', 'medium', 'low', 'unknown']),
  /** Kullanıcıya gösterilmez. Yaygınlık yargısının kısa gerekçesi. */
  frequencyRationale: z.string().min(10),
  vehicles: z.array(researchVehicleSchema).min(1),
  sourceIds: z.array(z.string()).min(1),
  uncertainties: z.string().optional(),
  /** Örnek dosyalar canlı kataloğa aktarılmaz. */
  example: z.boolean().optional(),
});

export const researchBundleSchema = z.object({
  schema: z.literal(RESEARCH_SCHEMA_ID),
  agent: z.string().min(1),
  /** Bu dosyanın kapsadığı marka ve modeller. Kayıtlar bu listenin dışında olmamalı. */
  brands: z.array(z.string()).min(1),
  models: z.array(z.string()).min(1),
  researchedAt: isoDateSchema,
  sources: z.array(researchSourceSchema).min(1),
  issues: z.array(researchIssueSchema).min(1),
});

export type ResearchBundle = z.infer<typeof researchBundleSchema>;
export type ResearchIssue = z.infer<typeof researchIssueSchema>;
export type ResearchSource = z.infer<typeof researchSourceSchema>;
export type ResearchVehicle = z.infer<typeof researchVehicleSchema>;
