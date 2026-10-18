/**
 * Motor öncelikli seçim: marka → model → motor grubu → kasa → gerekirse güç.
 * Katalog şemasını değiştirmez; varyantları kullanıcı sırasına göre gruplar.
 */
import type { Engine, FuelType, Variant } from './schema.ts';
import { formatYearRange, generationLabel, normalizeSearch } from './format.ts';
import { isPerformance, marketGroup } from './market.ts';

export interface ChassisOption {
  generationId: string;
  slug: string;
  /** Kullanıcıya görünen kasa adı. Belirsiz nesil gerçek kasa gibi adlandırılmaz. */
  label: string;
  unassigned: boolean;
  years: string;
  /** Aynı motordaki gerçek güç / teknik sürümler. Tek seçenekse ayrıca ekran açılmaz. */
  options: TechnicalOption[];
}

export interface TechnicalOption {
  engineId: string;
  label: string;
  variantSlug: string;
  revisionSlug?: string;
}

export interface EngineGroupView {
  slug: string;
  label: string;
  fuel?: FuelType;
  performance: boolean;
  chassis: ChassisOption[];
}

interface GenLike {
  id: string;
  slug: string;
  name: string;
  kind?: 'generation' | 'unassigned';
  labelPeriod: { start: { year: number }; end?: { year: number } | null; approximate?: boolean };
  modelYears?: number[];
  revisions: { id: string; slug: string; order: number }[];
}

function stripPower(name: string): string {
  return name.replace(/\s+\d+\s*(?:ps|hp|kw|bhp|bg)\b/gi, '').replace(/\s+/g, ' ').trim();
}

/** Satış adındaki bilinen yazım: veri kaydı değişmez, kartta Türkiye’deki ad görünür. */
function displayLabel(label: string): string {
  return label.replace(/\bMultijet\b/g, 'MultiJet');
}

function slugify(text: string): string {
  return normalizeSearch(text).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'motor';
}

/** Satış adı: aile varsa o, yoksa güç ekinden arındırılmış motor adı. */
export function engineGroupIdentity(
  engine: Pick<Engine, 'name' | 'family' | 'fuel'>,
  variant: Pick<Variant, 'trimName' | 'marketAvailability' | 'marketIds'>,
): { slug: string; label: string; fuel?: FuelType; performance: boolean } {
  const performance = isPerformance(variant);
  const base = (engine.family || stripPower(engine.name) || engine.name).trim();
  const badge = variant.trimName?.trim();
  const raw = performance && badge && !normalizeSearch(base).includes(normalizeSearch(badge)) ? `${base} ${badge}` : base;
  const label = displayLabel(raw);
  const fuel = engine.fuel;
  return { slug: fuel ? `${slugify(label)}-${fuel}` : slugify(label), label, fuel, performance };
}

function optionLabel(engine: Pick<Engine, 'name' | 'power'>): string {
  if (engine.power?.ps !== undefined) return `${engine.power.ps} PS`;
  if (engine.power?.kw !== undefined) return `${engine.power.kw} kW`;
  if (engine.power?.hp !== undefined) return `${engine.power.hp} hp`;
  return engine.name;
}

function representativeRevision(gen: GenLike, variant: Variant): string | undefined {
  if (gen.revisions.length === 0 || variant.revisionMapping !== 'confirmed') return undefined;
  const ordered = [...gen.revisions].sort((a, b) => a.order - b.order);
  return ordered.find((r) => variant.revisionIds.includes(r.id))?.slug;
}

function chassisYears(gen: GenLike): string {
  if (gen.kind === 'unassigned') {
    const years = gen.modelYears ?? [];
    if (years.length === 0) return '';
    const a = years[0]!;
    const b = years[years.length - 1]!;
    return a === b ? String(a) : `${a}–${b}`;
  }
  return formatYearRange({ ...gen.labelPeriod, end: gen.labelPeriod.end ?? null });
}

/**
 * Türkiye ana listesindeki varyantları motor grubuna, sonra kasaya ayırır.
 * Aynı motorun şanzıman ve donanım kopyaları tek seçenekte birleşir.
 * Türkiye kaydı olmayan motor gruba girmez.
 */
export function engineGroupsForModel(
  generations: GenLike[],
  variantsByGeneration: Record<string, Variant[]>,
  engines: Record<string, Engine>,
): EngineGroupView[] {
  const groups = new Map<string, EngineGroupView>();

  for (const gen of generations) {
    const seenEngine = new Set<string>();
    for (const variant of variantsByGeneration[gen.id] ?? []) {
      if (marketGroup(variant) !== 'primary') continue;
      const engine = engines[variant.engineId];
      if (!engine) continue;
      const id = engineGroupIdentity(engine, variant);
      const dedupe = `${id.slug}|${variant.engineId}`;
      if (seenEngine.has(dedupe)) continue;
      seenEngine.add(dedupe);

      let group = groups.get(id.slug);
      if (!group) {
        group = { slug: id.slug, label: id.label, fuel: id.fuel, performance: id.performance, chassis: [] };
        groups.set(id.slug, group);
      }
      let chassis = group.chassis.find((c) => c.generationId === gen.id);
      if (!chassis) {
        const unassigned = gen.kind === 'unassigned';
        chassis = {
          generationId: gen.id,
          slug: gen.slug,
          label: unassigned
            ? 'Kasa bilgisi yok'
            : generationLabel({ ...gen, kind: gen.kind, labelPeriod: { ...gen.labelPeriod, end: gen.labelPeriod.end ?? null } }).replace(/\s*\([^)]*\)\s*$/, ''),
          unassigned,
          years: chassisYears(gen),
          options: [],
        };
        group.chassis.push(chassis);
      }
      if (!chassis.options.some((o) => o.engineId === variant.engineId)) {
        chassis.options.push({
          engineId: variant.engineId,
          label: optionLabel(engine),
          variantSlug: variant.slug,
          revisionSlug: representativeRevision(gen, variant),
        });
      }
    }
  }

  const fuelOrder = ['petrol', 'diesel', 'lpg', 'mild-hybrid', 'hybrid', 'plug-in-hybrid', 'electric'];
  return [...groups.values()].sort((a, b) => {
    if (a.performance !== b.performance) return a.performance ? 1 : -1;
    const fa = fuelOrder.indexOf(a.fuel ?? '');
    const fb = fuelOrder.indexOf(b.fuel ?? '');
    return (fa < 0 ? 99 : fa) - (fb < 0 ? 99 : fb) || a.label.localeCompare(b.label, 'tr', { numeric: true });
  });
}
