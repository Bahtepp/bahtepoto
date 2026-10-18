/**
 * Kronik sorun görüntüleme etiketleri ve kapsam metinleri (Türkçe).
 * Sıklık veya risk hakkında veride bulunmayan hiçbir ifade üretmez; yalnızca
 * kayıttaki kanıt düzeyini ve ciddiyet sınıfını olduğu gibi adlandırır.
 */
import type {
  Applicability,
  Claim,
  Issue,
  IssueCategory,
  IssueKind,
  IssueSourceKind,
  IssueStatus,
  PrevalenceEvidence,
  SeverityLevel,
} from './schema';
import { FUEL_LABELS } from '../catalog/format.ts';

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  verified: 'Doğrulandı',
  supported: 'Kaynakla destekleniyor',
  researching: 'Araştırılıyor',
  disputed: 'Kaynaklar çelişiyor',
};

export const ISSUE_STATUS_DESCRIPTIONS: Record<IssueStatus, string> = {
  verified: 'Üretici bülteni / resmi kayıt ya da en az iki bağımsız uzman kaynakla doğrulandı.',
  supported: 'Kullanıcı raporu dışında en az bir kaynakla destekleniyor; doğrulama eşiğine henüz ulaşmadı.',
  researching: 'Kesinliği yetersiz; kesin bir kronik sorun olarak değerlendirilmemeli.',
  disputed: 'Kaynaklar bu konuda birbiriyle çelişiyor.',
};

export const ISSUE_KIND_LABELS: Record<IssueKind, string> = {
  chronic: 'Kronik sorun',
  'known-defect': 'Bilinen kusur',
  recall: 'Geri çağırma',
  'service-campaign': 'Servis kampanyası',
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  low: 'Düşük',
  moderate: 'Orta',
  high: 'Yüksek',
  safety: 'Güvenlikle ilgili',
};

/** Kullanıcıya gösterilen yaygınlık. Kanıt düzeyi ve ciddiyetten ayrı, nitel bir yargıdır. */
export const FREQUENCY_LABELS = {
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
  unknown: 'Belirsiz',
} as const;

/** Geri çağırmada yaygınlık etiketi yoktur. Eski kayıtlarda alan boşsa Belirsiz gösterilir. */
export function frequencyLabel(issue: Pick<Issue, 'kind' | 'frequencyRating'>): string | undefined {
  if (issue.kind === 'recall' || issue.kind === 'service-campaign') return undefined;
  return FREQUENCY_LABELS[issue.frequencyRating ?? 'unknown'];
}

/** Kanıt düzeyi — sıklık iddiası değildir. */
export const PREVALENCE_LABELS: Record<PrevalenceEvidence, string> = {
  unknown: 'Görülme sıklığına dair kanıt yok',
  'isolated-reports': 'Tekil raporlar',
  'repeated-reports': 'Birden fazla bağımsız rapor',
  'expert-observed': 'Uzman servis gözlemi',
  'survey-supported': 'Güvenilirlik araştırmasıyla destekleniyor',
  'manufacturer-acknowledged': 'Üretici bülteniyle kabul edilmiş',
};

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  engine: 'Motor',
  'fuel-system': 'Yakıt sistemi',
  cooling: 'Soğutma',
  emissions: 'Emisyon',
  transmission: 'Şanzıman',
  clutch: 'Debriyaj',
  electrical: 'Elektrik',
  suspension: 'Süspansiyon',
  steering: 'Direksiyon',
  brakes: 'Fren',
  body: 'Kaporta',
  interior: 'İç donanım',
  hvac: 'Klima / ısıtma',
  other: 'Diğer',
};

export const SOURCE_KIND_LABELS: Record<IssueSourceKind, string> = {
  'manufacturer-bulletin': 'Üretici teknik bülteni',
  'official-recall': 'Resmi geri çağırma kaydı',
  'technical-publication': 'Teknik yayın',
  'reliability-survey': 'Güvenilirlik araştırması',
  'expert-service': 'Uzman servis gözlemi',
  'user-report': 'Kullanıcı raporu',
};

export const STANCE_LABELS: Record<Claim['stance'], string> = {
  supports: 'destekliyor',
  contradicts: 'çürütüyor',
  partial: 'kısmen destekliyor',
};

export const ASPECT_LABELS: Record<Claim['aspects'][number], string> = {
  existence: 'sorunun varlığı',
  scope: 'kapsam',
  symptoms: 'belirtiler',
  severity: 'ciddiyet',
  prevalence: 'görülme sıklığı',
  remedy: 'çözüm',
};

const BASIS = { production: 'üretim', 'model-year': 'model yılı', sales: 'ilk tescil / satış' } as const;

/** "Focus Mk2 (2004–2010) · 2.0 TDCi 110 PS · 2004–2006 üretim" gibi okunur kapsam metni. */
export function describeSelector(s: Applicability, label: (id: string) => string): string {
  const parts: string[] = [];
  // Daha özgül düzey varsa üst düzeyi tekrar etme.
  if (s.revisionIds.length) parts.push(s.revisionIds.map(label).join(', '));
  else if (s.generationIds.length) parts.push(s.generationIds.map(label).join(', '));
  else if (s.modelIds.length) {
    const narrowed = s.engineIds.length + s.engineCodes.length + s.engineFamilies.length + s.fuels.length + s.aspirations.length > 0 || s.years;
    parts.push(narrowed ? s.modelIds.map(label).join(', ') : `${s.modelIds.map(label).join(', ')} (tüm nesiller)`);
  }

  const engines = [
    ...new Set([
      ...s.engineIds.map(label),
      ...s.engineCodes.map((c) => `${c} kodlu motorlar`),
      ...s.engineFamilies.map((f) => `${f} motorlar`),
    ]),
  ];
  if (engines.length) parts.push(engines.join(', '));
  if (s.fuels.length) parts.push(s.fuels.map((f) => FUEL_LABELS[f]).join(', '));
  if (s.aspirations.length) {
    const tr = { natural: 'atmosferik', turbo: 'turbolu', supercharged: 'kompresörlü', 'twin-turbo': 'çift turbolu' } as const;
    parts.push(`${s.aspirations.map((a) => tr[a]).join(' / ')} motorlar`);
  }
  if (s.transmissions.length) parts.push(`${s.transmissions.map((t) => [t.name, t.gears ? `${t.gears} ileri` : null, t.type].filter(Boolean).join(' ')).join(' / ')} şanzıman`);
  if (s.years) parts.push(`${s.years.from === s.years.to ? s.years.from : `${s.years.from}–${s.years.to}`} (${BASIS[s.years.basis]})`);
  if (s.marketIds.length) parts.push(`${s.marketIds.map(label).join(', ')} pazarı`);
  if (s.note) parts.push(s.note);
  return parts.join(' · ');
}

export function describeScope(appliesTo: Applicability[], label: (id: string) => string): string {
  return appliesTo.map((s) => describeSelector(s, label)).join(' ya da ');
}
