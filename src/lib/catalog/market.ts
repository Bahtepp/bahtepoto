/**
 * Pazar görünümü: katalogda hangi motorların hangi pazar seçiminde gösterileceği.
 * Saf TypeScript (tarayıcı betiği, Astro ve `node --test` ortak kullanır).
 *
 * - Türkiye (varsayılan): yalnızca Türkiye'de satışı doğrulanan (`sold`) veya Türkiye resmi
 *   değer listesinde yer alan (`listed`) motorlar ana listede. İthal (`imported`) ayrı grupta.
 *   Avrupa'da bulunması Türkiye'de satıldığını kanıtlamaz; Türkiye bilgisi olmayan motor
 *   Türkiye listesinde GÖSTERİLMEZ (ama "sunulmadı" da sayılmaz).
 * - Avrupa: pazarları Avrupa veya Avrupa'nın alt pazarı olan motorlar.
 * - Tüm dünya: hepsi.
 */
import type { Market, MarketAvailability, Variant } from './schema';

export type MarketView = 'tr' | 'eu' | 'world';
export const MARKET_VIEWS: { id: MarketView; label: string }[] = [
  { id: 'tr', label: 'Türkiye' },
  { id: 'eu', label: 'Avrupa' },
  { id: 'world', label: 'Tüm dünya' },
];
export const DEFAULT_MARKET_VIEW: MarketView = 'tr';

export type MarketGroup = 'primary' | 'imported' | 'hidden';

export const AVAILABILITY_LABELS: Record<MarketAvailability['status'], string> = {
  sold: 'Türkiye\'de resmi satışı doğrulandı',
  listed: 'Türkiye kasko değer listesinde',
  imported: 'Türkiye\'de ithal olarak görülebilir',
  unverified: 'Türkiye satışı doğrulanmadı',
  'not-offered': 'Türkiye\'de sunulmadığı doğrulandı',
};

type V = Pick<Variant, 'marketIds' | 'marketAvailability' | 'trimName'>;

export const availabilityFor = (v: Pick<Variant, 'marketAvailability'>, marketId: string) =>
  (v.marketAvailability ?? []).find((a) => a.marketId === marketId);

function inRegion(marketId: string, region: string, markets: Pick<Market, 'id' | 'parentId'>[]): boolean {
  let cur: string | undefined = marketId;
  const seen = new Set<string>();
  while (cur && !seen.has(cur)) {
    if (cur === region) return true;
    seen.add(cur);
    cur = markets.find((m) => m.id === cur)?.parentId;
  }
  return false;
}

export function marketGroup(v: V, view: MarketView, markets: Pick<Market, 'id' | 'parentId'>[]): MarketGroup {
  if (view === 'world') return 'primary';
  if (view === 'eu') return v.marketIds.some((m) => inRegion(m, 'eu', markets)) ? 'primary' : 'hidden';
  const tr = availabilityFor(v, 'tr');
  if (tr?.status === 'sold' || tr?.status === 'listed') return 'primary';
  if (tr?.status === 'imported') return 'imported';
  return 'hidden';
}

/** Özel performans modelleri (ST, RS, GTI, R, AMG …): normal motor listesinden ayrı başlıkta. */
const PERFORMANCE = /^(ST|RS|RS\d+|GTI|GTD|R|R32|AMG|TYPE R|N|M\d?|CUPRA|SRT|NISMO|JCW|ABARTH|TRACKHAWK|RS500)$/i;
export function isPerformance(v: V): boolean {
  if (v.trimName && PERFORMANCE.test(v.trimName.trim())) return true;
  const trims = availabilityFor(v, 'tr')?.trims ?? [];
  return trims.length > 0 && trims.every((t) => PERFORMANCE.test(t.trim().split(' ')[0] ?? ''));
}

export function marketCounts(variants: V[], markets: Pick<Market, 'id' | 'parentId'>[]): Record<MarketView, number> {
  return {
    tr: variants.filter((v) => marketGroup(v, 'tr', markets) === 'primary').length,
    eu: variants.filter((v) => marketGroup(v, 'eu', markets) === 'primary').length,
    world: variants.length,
  };
}

/** "2011–2017" / "2011, 2013" (model yılları ardışık değilse). */
export function formatModelYears(years: number[]): string {
  if (years.length === 0) return '';
  const sorted = [...years].sort((a, b) => a - b);
  const contiguous = sorted.every((y, i) => i === 0 || y === sorted[i - 1]! + 1);
  if (contiguous) return sorted.length === 1 ? String(sorted[0]) : `${sorted[0]}–${sorted.at(-1)}`;
  return sorted.join(', ');
}
