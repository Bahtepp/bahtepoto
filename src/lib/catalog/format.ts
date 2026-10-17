/**
 * Görüntüleme yardımcıları. Hem Astro bileşenlerinde hem tarayıcı betiğinde kullanılır;
 * bu yüzden yalnızca saf TypeScript içerir (Astro/Node bağımlılığı yok).
 */
import type {
  Engine,
  FuelType,
  Period,
  PeriodBasis,
  Transmission,
  VerificationStatus,
  YearMonth,
} from './schema';

export const PENDING_TEXT = 'Veri doğrulanıyor';

export const FUEL_LABELS: Record<FuelType, string> = {
  petrol: 'Benzin',
  diesel: 'Dizel',
  lpg: 'Benzin/LPG',
  cng: 'CNG',
  'mild-hybrid': 'Hafif hibrit',
  hybrid: 'Hibrit',
  'plug-in-hybrid': 'Plug-in hibrit',
  electric: 'Elektrik',
  'flex-fuel': 'Flex-fuel',
};

export const STATUS_LABELS: Record<VerificationStatus, string> = {
  verified: 'Doğrulandı',
  sourced: 'Kaynaklı',
  conflicting: 'Kaynaklar çelişiyor',
  unverified: 'Doğrulanmadı',
  pending: PENDING_TEXT,
};

export const STATUS_DESCRIPTIONS: Record<VerificationStatus, string> = {
  verified: 'Birincil kaynakla (üretici/resmi belge) doğrulandı.',
  sourced: 'İkincil kaynağa dayanıyor; üretici belgesiyle henüz çapraz kontrol edilmedi.',
  conflicting: 'Kaynaklar arasında çelişki var; ayrıntı notlarda.',
  unverified: 'Kaynak gösterilmedi.',
  pending: 'Bu kayıt için veri henüz girilmedi.',
};

export const BASIS_LABELS: Record<PeriodBasis, string> = {
  production: 'üretim',
  'model-year': 'model yılı',
  sales: 'satış',
};

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export function formatYearMonth(ym: YearMonth, withMonth = false): string {
  return withMonth && ym.month ? `${MONTHS[ym.month - 1]} ${ym.year}` : String(ym.year);
}

/** "1998–2004", sürüyorsa "2018–günümüz", türetilmişse "~2004–2008". */
export function formatYearRange(period: Pick<Period, 'start' | 'end'> & { approximate?: boolean }, withMonth = false): string {
  const start = formatYearMonth(period.start, withMonth);
  const end = period.end ? formatYearMonth(period.end, withMonth) : 'günümüz';
  return `${period.approximate ? '~' : ''}${start}–${end}`;
}

/** "Focus Mk2 (2004–2010)". Nesil adı hiçbir zaman yılsız üretilmez. */
export function generationLabel(gen: { name: string; kind?: 'generation' | 'unassigned'; labelPeriod: Pick<Period, 'start' | 'end'> & { approximate?: boolean } }): string {
  // Nesli belirlenmemiş araçlar grubu gerçek bir kasa değildir: yıl aralığıyla nesil gibi gösterilmez.
  if (gen.kind === 'unassigned') return gen.name;
  return `${gen.name} (${formatYearRange(gen.labelPeriod)})`;
}

export function formatPower(power: Engine['power']): string | null {
  if (!power) return null;
  const parts: string[] = [];
  if (power.ps !== undefined) parts.push(`${power.ps} PS`);
  if (power.kw !== undefined) parts.push(`${power.kw} kW`);
  if (power.hp !== undefined && power.ps === undefined) parts.push(`${power.hp} hp`);
  return parts.join(' · ');
}

export function formatDisplacement(engine: Pick<Engine, 'displacementL' | 'displacementCc'>): string | null {
  if (engine.displacementCc) return `${engine.displacementCc.toLocaleString('tr-TR')} cm³`;
  if (engine.displacementL) return `${engine.displacementL.toLocaleString('tr-TR', { minimumFractionDigits: 1 })} L`;
  return null;
}

const TRANSMISSION_TYPES: Record<Transmission['type'], string> = {
  manual: 'manuel',
  automatic: 'otomatik',
  'dual-clutch': 'çift kavrama',
  cvt: 'CVT',
  'single-speed': 'tek vites',
  'automated-manual': 'yarı otomatik',
};

export function formatTransmission(t: Transmission): string {
  const base = t.gears ? `${t.gears} ileri ${TRANSMISSION_TYPES[t.type]}` : TRANSMISSION_TYPES[t.type];
  return t.name ? `${base} (${t.name})` : base;
}

/**
 * Araç detay sayfası yolu. Hem sunucu (statik rotalar) hem istemci (katalog bağlantıları) kullanır.
 * /arac/<marka>/<model>/<nesil>/[<makyaj-dönemi>/]<varyant>/
 */
export function vehiclePath(p: { brand: string; model: string; generation: string; revision?: string; variant: string }): string {
  return `/arac/${[p.brand, p.model, p.generation, p.revision, p.variant].filter(Boolean).join('/')}/`;
}

/** Katalog gezginini aynı seçimle açan adres (detay sayfasından geri dönüş için). */
export function catalogPath(p: { brand: string; model?: string; generation?: string; engine?: string }): string {
  const q = new URLSearchParams();
  q.set('marka', p.brand);
  if (p.model) q.set('model', p.model);
  if (p.engine) q.set('motor', p.engine);
  if (p.generation) q.set('nesil', p.generation);
  return `/?${q}`;
}

/** GitHub Pages alt dizini dahil mutlak site yolu. */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${prefix}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Türkçe büyük/küçük harf duyarsız arama için normalleştirme. */
export function normalizeSearch(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .trim();
}
