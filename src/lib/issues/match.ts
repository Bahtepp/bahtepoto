/**
 * Kronik sorun ↔ araç eşleştiricisi.
 *
 * Saf fonksiyonlardan oluşur; çalışma zamanında hiçbir modül import etmez (yalnızca tipler).
 * Bu sayede hem Astro build'inde hem de `node --test` ile doğrudan test edilebilir.
 *
 * Sonuç üç değerlidir:
 * - applies:     Sorun bu araca uygulanır (bütün koşullar veriyle doğrulanabildi).
 * - conditional: Sorun bu araca uygulanabilir ama en az bir koşul doğrulanamadı
 *                (örn. yalnızca belirli şanzıman, yıl aralığı kısmen örtüşüyor,
 *                motorun bu makyaj döneminde sunulduğu doğrulanmadı). Gerekçeler `reasons`'ta.
 * - no:          Uygulanmaz.
 *
 * İlke: Belirsizlik hiçbir zaman "applies" üretmez. Yanlış motor, yıl, makyaj dönemi,
 * şanzıman veya pazar "no" üretir; bilinmeyen bilgi "conditional" üretir.
 */
import type { Engine, Market, Period, Transmission, Variant, YearMonth } from '../catalog/schema';
import type { Applicability, Issue, TransmissionMatch, YearRange } from './schema';

export type Verdict = 'applies' | 'conditional' | 'no';

export interface VehicleContext {
  brandId: string;
  modelId: string;
  generationId: string;
  generation: {
    labelPeriod: Period;
    periods: Period[];
    revisions: { id: string; periods: Period[] }[];
  };
  /** Seçilen makyaj dönemi. Nesilde makyaj dönemi varsa ama seçilmediyse undefined. */
  revisionId?: string;
  /** Seçilen motor. Seçilmediyse motora özgü sorunlar "conditional" olur. */
  engine?: Pick<Engine, 'id' | 'codes' | 'family' | 'fuel' | 'aspiration'>;
  variant?: Pick<Variant, 'revisionIds' | 'revisionMapping' | 'transmissions' | 'marketIds' | 'periods'>;
  /** Pazar hiyerarşisi (parentId) için. */
  markets: Pick<Market, 'id' | 'parentId'>[];
  /** Gerekçe metinlerinde kimlikleri okunur adlara çevirir. */
  label?: (id: string) => string;
  /** "günümüz" yerine kullanılacak yıl (test edilebilirlik için). */
  currentYear?: number;
}

export interface MatchResult {
  verdict: Verdict;
  /** Eşleşen seçici motora özgü mü (motor kimliği veya yakıt kısıtı içeriyor mu)? */
  engineSpecific: boolean;
  /** "conditional" sonucunun gerekçeleri (kullanıcıya gösterilir). */
  reasons: string[];
}

type Dim = { v: 'yes' | 'no' | 'maybe'; reason?: string };
const YES: Dim = { v: 'yes' };
const NO: Dim = { v: 'no' };
const maybe = (reason: string): Dim => ({ v: 'maybe', reason });

const BASIS_TR = { production: 'üretim', 'model-year': 'model yılı', sales: 'ilk tescil / satış' } as const;

// Motor/şanzıman kodları için dilden bağımsız küçük harf: Türkçe yerelinde "I" → "ı" olur
// ve "IXDA" ile "ixda" eşleşmez.
const lc = (s: string) => s.toLowerCase();

function ancestors(marketId: string, markets: VehicleContext['markets']): string[] {
  const out: string[] = [];
  let cur = markets.find((m) => m.id === marketId);
  const seen = new Set<string>();
  while (cur?.parentId && !seen.has(cur.parentId)) {
    seen.add(cur.parentId);
    out.push(cur.parentId);
    cur = markets.find((m) => m.id === cur!.parentId);
  }
  return out;
}

export const isEngineSpecific = (s: Applicability) =>
  s.engineIds.length + s.engineCodes.length + s.engineFamilies.length + s.fuels.length + s.aspirations.length > 0;

const ASPIRATION_TR = { natural: 'atmosferik', turbo: 'turbolu', supercharged: 'kompresörlü', 'twin-turbo': 'çift turbolu' } as const;

// --- Boyut değerlendiricileri ----------------------------------------------

function matchRevision(s: Applicability, ctx: VehicleContext, label: (id: string) => string): Dim {
  if (s.revisionIds.length === 0) return YES;
  const ownRevisions = ctx.generation.revisions.map((r) => r.id);
  const relevant = s.revisionIds.filter((id) => ownRevisions.includes(id));
  if (relevant.length === 0) return NO; // seçicinin makyaj dönemleri bu nesle ait değil
  if (!ctx.revisionId) return maybe(`Yalnızca ${relevant.map(label).join(', ')} dönemi`);
  return relevant.includes(ctx.revisionId) ? YES : NO;
}

function matchEngine(s: Applicability, ctx: VehicleContext, label: (id: string) => string): Dim {
  const hasIdentity = s.engineIds.length + s.engineCodes.length + s.engineFamilies.length > 0;
  if (!hasIdentity && s.fuels.length === 0 && s.aspirations.length === 0) return YES;

  const e = ctx.engine;
  if (!e) {
    const parts = [
      ...s.engineIds.map(label),
      ...s.engineCodes.map((c) => `${c} kodlu motorlar`),
      ...s.engineFamilies.map((f) => `${f} ailesi`),
    ];
    if (s.aspirations.length) parts.push(`${s.aspirations.map((a) => ASPIRATION_TR[a]).join(' / ')} motorlar`);
    return maybe(`Yalnızca belirli motorlar${parts.length ? `: ${parts.join(', ')}` : ''}`);
  }

  if (hasIdentity) {
    const codes = new Set(e.codes.map(lc));
    const ok =
      s.engineIds.includes(e.id) ||
      s.engineCodes.some((c) => codes.has(lc(c))) ||
      (e.family !== undefined && s.engineFamilies.some((f) => lc(f) === lc(e.family!)));
    // Motor kodu bilinmeyen motorlar, kod bazlı seçicilerle EŞLEŞTİRİLMEZ (yanlış pozitif önlemi).
    if (!ok) return NO;
  }
  if (s.fuels.length > 0 && !s.fuels.includes(e.fuel)) return NO;
  if (s.aspirations.length > 0) {
    if (e.aspiration === undefined) {
      return maybe(`Yalnızca ${s.aspirations.map((a) => ASPIRATION_TR[a]).join(' / ')} motorlar; bu motorun aşırı besleme bilgisi doğrulanmadı`);
    }
    if (!s.aspirations.includes(e.aspiration)) return NO;
  }

  // Motor doğru, ama motorun seçili makyaj döneminde sunulduğu doğrulanmadıysa kesin eşleşme üretme.
  if (ctx.revisionId && ctx.variant && !ctx.variant.revisionIds.includes(ctx.revisionId)) {
    return maybe(`Bu motorun ${label(ctx.revisionId)} döneminde sunulduğu doğrulanmadı`);
  }
  return YES;
}

const transmissionMatches = (t: Transmission, m: TransmissionMatch) =>
  (m.type === undefined || m.type === t.type) &&
  (m.gears === undefined || m.gears === t.gears) &&
  (m.name === undefined || (t.name !== undefined && lc(t.name) === lc(m.name)));

const describeTransmission = (m: TransmissionMatch) =>
  [m.name, m.gears ? `${m.gears} ileri` : null, m.type ? { manual: 'manuel', automatic: 'otomatik', 'dual-clutch': 'çift kavramalı', cvt: 'CVT', 'single-speed': 'tek vites', 'automated-manual': 'yarı otomatik' }[m.type] : null]
    .filter(Boolean)
    .join(' ');

function matchTransmission(s: Applicability, ctx: VehicleContext): Dim {
  if (s.transmissions.length === 0) return YES;
  const wanted = s.transmissions.map(describeTransmission).join(' / ');
  const options = (ctx.variant?.transmissions ?? []).filter(
    (t) => t.revisionIds.length === 0 || !ctx.revisionId || t.revisionIds.includes(ctx.revisionId),
  );
  if (options.length === 0) return maybe(`Yalnızca ${wanted} şanzımanlı araçlar (şanzıman bilgisi doğrulanmadı)`);
  const matching = options.filter((t) => s.transmissions.some((m) => transmissionMatches(t, m)));
  if (matching.length === 0) return NO;
  if (matching.length === options.length) return YES;
  return maybe(`Yalnızca ${wanted} şanzımanlı araçlar`);
}

function marketCovers(selectorMarkets: string[], vehicleMarket: string, ctx: VehicleContext) {
  return selectorMarkets.includes(vehicleMarket) || ancestors(vehicleMarket, ctx.markets).some((a) => selectorMarkets.includes(a));
}

function vehicleMarkets(ctx: VehicleContext): string[] {
  return ctx.variant?.marketIds.length ? ctx.variant.marketIds : [ctx.generation.labelPeriod.marketId];
}

function matchMarket(s: Applicability, ctx: VehicleContext, label: (id: string) => string): Dim {
  if (s.marketIds.length === 0) return YES;
  const vm = vehicleMarkets(ctx);
  const covered = vm.filter((m) => marketCovers(s.marketIds, m, ctx));
  if (covered.length === vm.length) return YES;
  // Seçici, aracın pazarının bir alt pazarını hedefliyorsa (örn. araç: Avrupa, sorun: Birleşik Krallık) koşullu.
  const narrower = s.marketIds.filter((sm) => vm.some((m) => ancestors(sm, ctx.markets).includes(m)));
  if (covered.length > 0 || narrower.length > 0) {
    return maybe(`Yalnızca ${[...new Set([...s.marketIds])].map(label).join(', ')} pazarı`);
  }
  return NO;
}

/** Ay cinsinden mutlak zaman (yıl*12 + ay). Ay bilinmiyorsa başlangıçta Ocak, bitişte Aralık alınır. */
const monthIndex = (year: number, month: number) => year * 12 + (month - 1);
const startOf = (ym: YearMonth) => monthIndex(ym.year, ym.month ?? 1);
const endOf = (ym: YearMonth | null, ctx: VehicleContext) =>
  ym ? monthIndex(ym.year, ym.month ?? 12) : monthIndex(ctx.currentYear ?? new Date().getFullYear(), 12);
const fmtRange = (r: YearRange) =>
  r.from === r.to && !r.fromMonth && !r.toMonth
    ? String(r.from)
    : `${r.fromMonth ? `${String(r.fromMonth).padStart(2, '0')}.` : ''}${r.from}–${r.toMonth ? `${String(r.toMonth).padStart(2, '0')}.` : ''}${r.to}`;

/** Aracın, yıl karşılaştırmasında kullanılacak en özgül dönemi. */
function vehiclePeriods(ctx: VehicleContext): Period[] {
  if (ctx.variant?.periods.length) return ctx.variant.periods;
  const rev = ctx.revisionId ? ctx.generation.revisions.find((r) => r.id === ctx.revisionId) : undefined;
  if (rev?.periods.length) return rev.periods;
  return [ctx.generation.labelPeriod, ...ctx.generation.periods];
}

function matchYears(s: Applicability, ctx: VehicleContext, label: (id: string) => string): Dim {
  const r: YearRange | undefined = s.years;
  if (!r) return YES;
  const market = r.marketId ?? s.marketIds[0];
  const periods = vehiclePeriods(ctx);
  const sameBasis = periods.filter((p) => p.basis === r.basis);
  const pool = sameBasis.length ? sameBasis : periods;
  const p =
    pool.find((x) => !market || x.marketId === market || ancestors(x.marketId, ctx.markets).includes(market)) ?? pool[0];
  const rangeText = `${fmtRange(r)} (${BASIS_TR[r.basis]}${market ? `, ${label(market)}` : ''})`;
  if (!p) return maybe(`Yalnızca ${rangeText} araçlar`);

  // Tolerans (ay): farklı ölçüm temeli (üretim ↔ model yılı ↔ satış) 12 ay, yaklaşık dönem 6 ay.
  const tol = p.basis !== r.basis ? 12 : p.approximate ? 6 : 0;
  const start = startOf(p.start);
  const end = endOf(p.end, ctx);
  const from = monthIndex(r.from, r.fromMonth ?? 1);
  const to = monthIndex(r.to, r.toMonth ?? 12);
  if (end + tol < from || start - tol > to) return NO;
  if (start - tol >= from && end + tol <= to && p.basis === r.basis) return YES;
  return maybe(`Yalnızca ${rangeText} araçlar`);
}

// --- Seçici ve sorun düzeyi -------------------------------------------------

export function evaluateSelector(s: Applicability, ctx: VehicleContext): { verdict: Verdict; reasons: string[] } {
  const label = ctx.label ?? ((id: string) => id);
  const dims: Dim[] = [
    s.modelIds.length === 0 || s.modelIds.includes(ctx.modelId) ? YES : NO,
    s.generationIds.length === 0 || s.generationIds.includes(ctx.generationId) ? YES : NO,
  ];
  if (dims.some((d) => d.v === 'no')) return { verdict: 'no', reasons: [] };
  dims.push(
    matchRevision(s, ctx, label),
    matchEngine(s, ctx, label),
    matchTransmission(s, ctx),
    matchMarket(s, ctx, label),
    matchYears(s, ctx, label),
  );
  if (dims.some((d) => d.v === 'no')) return { verdict: 'no', reasons: [] };
  const reasons = dims.filter((d) => d.v === 'maybe').map((d) => d.reason!);
  if (s.note && reasons.length) reasons.push(s.note);
  return { verdict: reasons.length ? 'conditional' : 'applies', reasons };
}

const RANK: Record<Verdict, number> = { no: 0, conditional: 1, applies: 2 };

export function matchIssue(issue: Issue, ctx: VehicleContext): MatchResult {
  if (issue.brandId !== ctx.brandId) return { verdict: 'no', engineSpecific: false, reasons: [] };

  let best: MatchResult = { verdict: 'no', engineSpecific: false, reasons: [] };
  for (const s of issue.appliesTo) {
    const r = evaluateSelector(s, ctx);
    const candidate: MatchResult = { verdict: r.verdict, engineSpecific: isEngineSpecific(s), reasons: r.reasons };
    if (
      RANK[candidate.verdict] > RANK[best.verdict] ||
      // Eşit sonuçta motora özgü eşleşme öne alınır (kullanıcı motor seçtiğinde daha bilgilendirici).
      (RANK[candidate.verdict] === RANK[best.verdict] && candidate.engineSpecific && !best.engineSpecific)
    ) {
      best = candidate;
    }
  }
  if (best.verdict === 'no') return best;

  for (const ex of issue.excludes) {
    const r = evaluateSelector(ex, ctx);
    if (r.verdict === 'applies') return { verdict: 'no', engineSpecific: best.engineSpecific, reasons: [] };
    if (r.verdict === 'conditional') {
      best = {
        ...best,
        verdict: 'conditional',
        reasons: [...best.reasons, `Kapsam dışı tutulan araçlardan biri olabilir${ex.note ? ` (${ex.note})` : ''}`],
      };
    }
  }
  return best;
}

export interface GroupedIssues<T extends Issue = Issue> {
  /** Seçilen motora özgü, doğrulanmış/desteklenen eşleşmeler. */
  engine: { issue: T; match: MatchResult }[];
  /** Kasa / model / dönem geneli eşleşmeler. */
  general: { issue: T; match: MatchResult }[];
  /** Koşullu eşleşmeler (gerekçeli). */
  conditional: { issue: T; match: MatchResult }[];
  /** "Araştırılıyor" veya "tartışmalı" kayıtlar: kesin sorun gibi gösterilmez. */
  researching: { issue: T; match: MatchResult }[];
}

const SEVERITY_ORDER = { safety: 0, high: 1, moderate: 2, low: 3 } as const;

export function groupIssues<T extends Issue>(issues: T[], ctx: VehicleContext): GroupedIssues<T> {
  const out: GroupedIssues<T> = { engine: [], general: [], conditional: [], researching: [] };
  for (const issue of issues) {
    const match = matchIssue(issue, ctx);
    if (match.verdict === 'no') continue;
    const item = { issue, match };
    if (issue.status === 'researching' || issue.status === 'disputed') out.researching.push(item);
    else if (match.verdict === 'conditional') out.conditional.push(item);
    else if (match.engineSpecific) out.engine.push(item);
    else out.general.push(item);
  }
  const bySeverity = (a: { issue: T }, b: { issue: T }) =>
    (a.issue.severity ? SEVERITY_ORDER[a.issue.severity.level] : 9) - (b.issue.severity ? SEVERITY_ORDER[b.issue.severity.level] : 9) ||
    a.issue.title.localeCompare(b.issue.title, 'tr');
  for (const list of Object.values(out)) list.sort(bySeverity);
  return out;
}

/**
 * Kullanıcıya gösterilen üç grup (yayın politikası):
 * - known:    Bilinen / sık bildirilen sorunlar — kaynakla desteklenen kronik sorunlar ve bilinen kusurlar
 * - possible: Olası sorunlar — araştırılan (örn. tekil bildirim) veya kaynakları çelişen kayıtlar;
 *             "yaygın" diye sunulmaz
 * - recalls:  Resmi geri çağırmalar ve servis kampanyaları (VIN ile resmi kontrol gerekir)
 *
 * Gruplar kanıt türüne göre ayrılır; eşleşmenin kesinliği (motora özgü / kasa geneli / koşullu)
 * her kayıtta `scope` olarak ayrıca taşınır. Eşleştirme kuralları değişmez.
 */
export type DisplayGroup = 'known' | 'possible' | 'recalls';
export type MatchScope = 'engine' | 'general' | 'conditional';

export interface DisplayItem<T extends Issue = Issue> {
  issue: T;
  match: MatchResult;
  scope: MatchScope;
}

export type DisplayGroups<T extends Issue = Issue> = Record<DisplayGroup, DisplayItem<T>[]>;

export function displayGroupOf(issue: Pick<Issue, 'kind' | 'status'>): DisplayGroup {
  if (issue.kind === 'recall' || issue.kind === 'service-campaign') return 'recalls';
  if (issue.status === 'researching' || issue.status === 'disputed') return 'possible';
  return 'known';
}

const SCOPE_ORDER: Record<MatchScope, number> = { engine: 0, general: 1, conditional: 2 };

export function groupForDisplay<T extends Issue>(issues: T[], ctx: VehicleContext): DisplayGroups<T> {
  const out: DisplayGroups<T> = { known: [], possible: [], recalls: [] };
  for (const issue of issues) {
    const match = matchIssue(issue, ctx);
    if (match.verdict === 'no') continue;
    const scope: MatchScope = match.verdict === 'conditional' ? 'conditional' : match.engineSpecific ? 'engine' : 'general';
    out[displayGroupOf(issue)].push({ issue, match, scope });
  }
  const sev = (i: Issue) => (i.severity ? SEVERITY_ORDER[i.severity.level] : 9);
  for (const list of Object.values(out)) {
    list.sort(
      (a, b) =>
        SCOPE_ORDER[a.scope] - SCOPE_ORDER[b.scope] ||
        sev(a.issue) - sev(b.issue) ||
        a.issue.title.localeCompare(b.issue.title, 'tr'),
    );
  }
  return out;
}
