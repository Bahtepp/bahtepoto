/**
 * Kısa kronik sorun girdisini mevcut ayrıntılı kayda çevirir.
 * Doğrulama kurallarını gevşetmez: üretilen kayıt `validateIssues` içinden geçer.
 */
import { issueSchema, type Issue, type IssueCategory, type IssueKind } from './schema.ts';

export interface BriefIssue {
  id: string;
  slug: string;
  brandId: string;
  title: string;
  summary: string;
  /** high | medium | low | unknown. Yüzde değildir. */
  frequency: 'high' | 'medium' | 'low' | 'unknown';
  category: IssueCategory;
  /** Şema varsayılanları `issueSchema.parse` sırasında doldurulur. */
  appliesTo: object[];
  /** Okunmuş kaynak kimlikleri. En az biri varlık iddiasına bağlanır. */
  sourceIds: string[];
  /**
   * Yalnızca kullanıcı bildirimi varsa researching + known-defect.
   * Teknik veya uzman kaynak varsa supported + chronic (yüksek/orta) ya da known-defect.
   */
  userReportsOnly?: boolean;
  updatedAt: string;
  notes?: string;
}

export function briefIssue(input: BriefIssue): Issue {
  const userOnly = input.userReportsOnly === true;
  const kind: IssueKind = userOnly || input.frequency === 'low' || input.frequency === 'unknown' ? 'known-defect' : 'chronic';
  const evidence = userOnly
    ? input.frequency === 'unknown'
      ? 'unknown'
      : 'isolated-reports'
    : input.frequency === 'high' || input.frequency === 'medium'
      ? input.sourceIds.length >= 2
        ? 'repeated-reports'
        : 'expert-observed'
      : input.frequency === 'low'
        ? 'isolated-reports'
        : 'unknown';
  return issueSchema.parse({
    id: input.id,
    slug: input.slug,
    brandId: input.brandId,
    kind,
    category: input.category,
    title: input.title,
    summary: input.summary,
    symptoms: [input.summary],
    symptomDetails: [],
    checks: [],
    remedies: [],
    appliesTo: input.appliesTo,
    excludes: [],
    prevalence: {
      evidence,
      sourceIds: evidence === 'unknown' ? [] : input.sourceIds,
    },
    frequencyRating: input.frequency,
    claims: input.sourceIds.map((sourceId) => ({
      sourceId,
      aspects: ['existence'],
      stance: 'supports' as const,
    })),
    status: userOnly ? 'researching' : 'supported',
    updatedAt: input.updatedAt,
    notes: input.notes,
    demo: false,
  });
}
