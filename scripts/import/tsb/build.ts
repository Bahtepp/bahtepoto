/**
 * TSB satırlarından katalog kayıtları üretir ve mevcut katalogla birleştirir.
 *
 * Gruplama: marka → model → nesil → motor. Aynı motorun farklı model yıllarındaki, donanım
 * paketlerindeki ve gövde tiplerindeki satırları TEK varyantta birleşir; model yılları, donanımlar,
 * gövde tipleri ve TSB tip kodları varyantın Türkiye pazar durumunda (`marketAvailability`) saklanır.
 *
 * Nesil eşleştirme (tahminsiz):
 * 1. Tip adında nesil ipucu (III, MK7) ve katalogda bu nesil varsa → o nesil.
 * 2. Katalogda modelin nesilleri varsa ve satırın model yılları yalnızca BİR neslin yıl aralığıyla
 *    örtüşüp onun içinde kalıyorsa → o nesil. Birden fazla nesille örtüşüyorsa belirsiz.
 * 3. İpucu var ama katalogda nesil yoksa → ipucundan nesil ("Focus III"), yılları TSB model yılları.
 * 4. Hiçbiri değilse → "nesil belirlenmedi" grubu (açıkça etiketlenir); kayıt yine aktarılır.
 */
import type { Json, RawCatalog } from '../lib/io.ts';
import type { TsbRow } from './parse.ts';
import { nearlyEqual, parseTypeName, resolveModels, type ParsedType } from './normalize.ts';
import { BRAND_RULES, EXCLUDED_BRANDS, EXCLUDED_MODEL_PREFIXES, EXCLUDED_WORDS, type BrandRule } from './rules.ts';

export const TSB_SOURCE_ID = 'tsb-kasko-deger-listesi';
const MARKET = 'tr';

export interface RejectedRow {
  brand: string;
  code: string;
  typeName: string;
  modelYears: string;
  reason: string;
}

export interface BuildStats {
  rows: number;
  excluded: Record<string, number>;
  rejected: Record<string, number>;
  imported: number;
  brands: number;
  models: number;
  generations: number;
  engines: number;
  variants: number;
  /** Nesli belirlenemeyen ("nesil belirlenmedi" grubundaki) varyant sayısı. */
  variantsWithoutGeneration: number;
  /** Nesil ipucundan oluşturulan nesil sayısı. */
  hintGenerations: number;
  /** Katalogdaki mevcut nesillere eşlenen varyant sayısı. */
  variantsOnExistingGenerations: number;
  /** Mevcut varyantlara eklenen Türkiye pazar durumu. */
  existingVariantsEnriched: number;
  fuelUnknownEngines: number;
}

export interface BuildResult {
  merged: RawCatalog;
  stats: BuildStats;
  rejects: RejectedRow[];
  /** Model başına özet (rapor için). */
  perBrand: Map<string, { name: string; models: number; variants: number }>;
}

// ---------------------------------------------------------------------------
const fold = (s: string) =>
  s.toLocaleUpperCase('tr-TR').replace(/İ/g, 'I').replace(/Ş/g, 'S').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/Ç/g, 'C');

export const slugify = (s: string) =>
  fold(s)
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ACRONYMS = new Set(['GT', 'GTI', 'GTD', 'RS', 'ST', 'SUV', 'AMG', 'CR-V', 'HR-V', 'BRZ', 'GTR', 'GT-R', 'MX-5', 'RAV4', 'UP', 'ID']);
/** Görünen ad: yalnızca harflerden oluşan 3+ harfli sözcükler baş harfi büyük yazılır. */
export function displayName(s: string): string {
  return s
    .split(' ')
    .map((w) => {
      const F = fold(w);
      if (ACRONYMS.has(F) || !/^[A-Z]{3,}$/.test(F)) return w.toUpperCase() === w ? w : w;
      return F.charAt(0) + F.slice(1).toLowerCase();
    })
    .join(' ');
}

/** Motor teknolojisi sözcüklerinin üretici yazımı (yalnızca görünen ad; kimlikleri etkilemez). */
const TECH_DISPLAY: Record<string, string> = {
  TDCI: 'TDCi', ECOBOOST: 'EcoBoost', 'E.BOOST': 'EcoBoost', EB: 'EcoBoost', ECOBLUE: 'EcoBlue', DCI: 'dCi', BLUEDCI: 'Blue dCi', HDI: 'HDi',
  BLUEHDI: 'BlueHDi', 'E-HDI': 'e-HDi', TCE: 'TCe', CRDI: 'CRDi', CDTI: 'CDTi', PURETECH: 'PureTech', MULTIJET: 'Multijet',
  MULTIAIR: 'MultiAir', HIBRIT: 'Hibrit', HYBRID: 'Hybrid', 'TI-VCT': 'Ti-VCT', TIVCT: 'Ti-VCT', DURATEC: 'Duratec',
  ECOTEC: 'Ecotec', BLUETEC: 'BlueTEC', 'T-JET': 'T-Jet', TJET: 'T-Jet', 'D-4D': 'D-4D', VVTI: 'VVT-i', 'VVT-I': 'VVT-i',
  'I-VTEC': 'i-VTEC', 'I-DTEC': 'i-DTEC', SKYACTIV: 'Skyactiv', 'E-TSI': 'eTSI', ETSI: 'eTSI', 'E-HYBRID': 'eHybrid', MJET: 'Multijet',
};
const techDisplay = (t: string) => TECH_DISPLAY[fold(t)] ?? t;

function brandRuleFor(tsbBrand: string): BrandRule {
  const rule = BRAND_RULES[tsbBrand];
  if (rule) return rule;
  return { id: slugify(tsbBrand), name: displayName(tsbBrand) };
}

const ROMAN: Record<string, number> = { II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
const hintNumber = (hint: string) => ROMAN[hint] ?? (/^MK(\d+)$/.exec(hint) ? Number(/^MK(\d+)$/.exec(hint)![1]) : undefined);

interface Item {
  row: TsbRow;
  parsed: ParsedType;
  brand: BrandRule;
  model: string;
  trims: string[];
  engineKey: string;
  engineName: string;
  techTokens: string[];
}

const FUEL_ORDER = ['petrol', 'diesel', 'lpg', 'cng', 'mild-hybrid', 'hybrid', 'plug-in-hybrid', 'electric', 'flex-fuel'];
const BODY_TR: Record<string, string> = {
  'hatchback-3': '3 kapı',
  'sedan-4': '4 kapı sedan',
  'hatchback-5': '5 kapı',
  wagon: 'Station wagon',
  coupe: 'Coupé',
  cabrio: 'Cabrio',
  suv: 'SUV',
  van: 'Van',
  pickup: 'Pick-up',
  mpv: 'MPV',
};

function excludedReason(row: TsbRow, p: ParsedType): string | undefined {
  if (EXCLUDED_BRANDS.has(row.brand)) return 'kapsam dışı marka (ağır vasıta / otobüs / karavan / motosiklet)';
  const T = ` ${fold(row.typeName)} `;
  if (EXCLUDED_WORDS.some((w) => T.includes(` ${w} `) || T.includes(` ${w}`) && w.length > 5)) return 'ticari / ağır vasıta tipi';
  const first = fold(p.prefix[0] ?? row.typeName.split(' ')[0] ?? '');
  if (EXCLUDED_MODEL_PREFIXES.some((m) => first === m || (m.endsWith('.') && first.startsWith(m)) || (m.length > 4 && first.startsWith(m)))) {
    return 'ticari / ağır vasıta modeli';
  }
  if (p.body === 'van') return 'ticari / ağır vasıta tipi';
  return undefined;
}

/** BMW: "320d" → model "3 Serisi", motor tanımı "320d" (d: dizel, i: benzin, e: plug-in). */
function bmwSeries(first: string): { model: string; fuel?: ParsedType['fuel'] } | undefined {
  const m = /^(\d)(\d{2})([A-Za-z]*)$/.exec(first);
  if (!m) return undefined;
  const suffix = m[3]!.toLowerCase();
  const fuel = /d$/.test(suffix) ? 'diesel' : /e$/.test(suffix) ? 'plug-in-hybrid' : /i$/.test(suffix) ? 'petrol' : undefined;
  return { model: `${m[1]} Serisi`, fuel };
}

/** Kaydın tek kaynağı TSB mi (önceki içe aktarmanın ürettiği kayıt)? */
const ownedByTsb = (r: Json) => {
  const ids = (r.sourceIds as string[] | undefined) ?? [];
  return ids.length === 1 && ids[0] === TSB_SOURCE_ID;
};

/**
 * Önceki TSB içe aktarmasının ürettiklerini kaldırır: yalnızca TSB'ye dayanan motorlar,
 * nesiller ve varyantlar silinir; elle girilmiş varyantlara eklenen Türkiye durumu geri alınır.
 * Modeller ve markalar silinmez (boş kalabilir).
 */
export function stripTsb(raw: RawCatalog): RawCatalog {
  const out: RawCatalog = {
    brands: structuredClone(raw.brands),
    markets: structuredClone(raw.markets),
    sources: structuredClone(raw.sources),
    engines: new Map([...raw.engines].map(([k, v]) => [k, structuredClone(v).filter((e) => !ownedByTsb(e))])),
    models: new Map([...raw.models].map(([k, v]) => [k, structuredClone(v)])),
  };
  for (const [k, list] of out.engines) if (list.length === 0 && !raw.engines.get(k)?.some((e) => !ownedByTsb(e))) out.engines.delete(k);
  for (const model of out.models.values()) {
    const gens = ((model.generations as Json[] | undefined) ?? []).map((g) => {
      const variants = ((g.variants as Json[] | undefined) ?? [])
        .filter((v) => !ownedByTsb(v))
        .map((v) => {
          const avail = (v.marketAvailability as Json[] | undefined) ?? [];
          const kept = avail.filter((a) => !((a.sourceIds as string[] | undefined) ?? []).includes(TSB_SOURCE_ID));
          if (kept.length !== avail.length) {
            const removedMarkets = avail.filter((a) => !kept.includes(a)).map((a) => a.marketId);
            v.marketAvailability = kept;
            const periodsMarkets = new Set(((v.periods as Json[] | undefined) ?? []).map((p) => p.marketId));
            v.marketIds = ((v.marketIds as string[]) ?? []).filter((m) => !removedMarkets.includes(m) || periodsMarkets.has(m) || kept.some((a) => a.marketId === m));
            if (kept.length === 0) delete v.marketAvailability;
          }
          return v;
        });
      return { ...g, variants };
    });
    model.generations = gens.filter((g) => !(ownedByTsb(g) && (g.variants as Json[]).length === 0));
  }
  return out;
}

// ---------------------------------------------------------------------------

export function buildFromTsb(raw: RawCatalog, rows: TsbRow[], opts: { today: string; sourceTitle: string; sourceNotes: string }): BuildResult {
  const stats: BuildStats = {
    rows: rows.length,
    excluded: {},
    rejected: {},
    imported: 0,
    brands: 0,
    models: 0,
    generations: 0,
    engines: 0,
    variants: 0,
    variantsWithoutGeneration: 0,
    hintGenerations: 0,
    variantsOnExistingGenerations: 0,
    existingVariantsEnriched: 0,
    fuelUnknownEngines: 0,
  };
  const rejects: RejectedRow[] = [];
  const reject = (row: TsbRow, reason: string, bucket = stats.rejected) => {
    bucket[reason] = (bucket[reason] ?? 0) + 1;
    if (bucket === stats.rejected) {
      rejects.push({
        brand: row.brand,
        code: `${row.brandCode}-${row.typeCode}`,
        typeName: row.typeName,
        modelYears: `${row.modelYears[0]}–${row.modelYears.at(-1)}`,
        reason,
      });
    }
  };

  // 1) Ayrıştır ve kapsam dışı satırları ayır
  const byBrand = new Map<string, { row: TsbRow; parsed: ParsedType }[]>();
  for (const row of rows) {
    const parsed = parseTypeName(row.typeName);
    const why = excludedReason(row, parsed);
    if (why) {
      reject(row, why, stats.excluded);
      continue;
    }
    const list = byBrand.get(row.brand) ?? [];
    list.push({ row, parsed });
    byBrand.set(row.brand, list);
  }

  // 2) Model adlarını çöz
  const items: Item[] = [];
  for (const [tsbBrand, list] of byBrand) {
    const brand = brandRuleFor(tsbBrand);
    const resolve = resolveModels(list.map((x) => x.parsed));
    const pre: { row: TsbRow; parsed: ParsedType; model: string; trims: string[] }[] = [];
    for (const { row, parsed } of list) {
      let { model, trimWords } = resolve(parsed);
      if (brand.id === 'bmw') {
        const series = bmwSeries(parsed.prefix[0] ?? '');
        if (series) {
          model = series.model;
          trimWords = parsed.prefix.slice(1);
          parsed.tech.unshift(parsed.prefix[0]!);
          parsed.fuel ??= series.fuel;
        }
      }
      if (brand.modelPrefix) model = `${brand.modelPrefix} ${model}`.trim();
      pre.push({ row, parsed, model: fold(model), trims: trimWords });
    }

    // Yazım hatası birleştirme: 1–2 satırlık model adı, 5+ satırlı bir modele 1 harf uzaklıktaysa.
    const counts = new Map<string, number>();
    for (const p of pre) counts.set(p.model, (counts.get(p.model) ?? 0) + 1);
    const big = [...counts].filter(([, n]) => n >= 5).map(([m]) => m);
    for (const p of pre) {
      if ((counts.get(p.model) ?? 0) <= 2) {
        const target = big.find((b) => b !== p.model && b.length >= 4 && nearlyEqual(b, p.model));
        if (target) p.model = target;
      }
    }

    for (const p of pre) {
      const { row, parsed } = p;
      // Bitişik yazılmış uzun adlar ("TOURNEOCUSTOM320LECOBLUE") güvenilir model adı değildir.
      const glued = p.model.split(' ').some((w) => w.length > 14);
      // Tek harfli model adı (Mercedes "C", "E") yalnızca markada yaygınsa kabul edilir; "C MAX" gibi kopuk yazımlar değil.
      const lonelyLetter = p.model.length === 1 && (counts.get(p.model) ?? 0) < 10;
      if (!p.model || /[.]/.test(p.model) || !/[A-Z0-9]/.test(p.model) || glued || lonelyLetter) {
        reject(row, 'model adı çözümlenemedi');
        continue;
      }
      // Yalnızca motor tanımı yazan tipler: "C 200", "CLS 350", "X6 xDRIVE 30d", "NX 200t".
      if (parsed.displacementL === undefined && parsed.tech.length === 0) {
        const idx = p.trims.findIndex((w) => /^(?:[xs]DRIVE)?\d{2,3}[A-Za-z]{0,2}$/i.test(w));
        if (idx >= 0 && idx <= 2) {
          const designation = p.trims[idx]!.replace(/^[xs]DRIVE/i, '');
          const suffix = (/[A-Za-z]+$/.exec(designation)?.[0] ?? '').toLowerCase();
          parsed.tech.push(designation);
          p.trims.splice(idx, 1);
          // Üreticinin adlandırma kuralı adın içinde: BMW/Mercedes "d" dizel, "e" plug-in; Lexus "h" hibrit.
          if (brand.id === 'bmw' || brand.id === 'mercedes-benz') {
            if (suffix === 'd') parsed.fuel ??= 'diesel';
            if (suffix === 'e') parsed.fuel ??= 'plug-in-hybrid';
          }
          if (brand.id === 'lexus' && suffix === 'h') parsed.fuel ??= 'hybrid';
        }
      }
      if (parsed.displacementL === undefined && parsed.powerPs === undefined && parsed.powerKw === undefined && parsed.powerHp === undefined && parsed.tech.length === 0) {
        reject(row, 'motor bilgisi yok (hacim, güç ve motor tanımı yazmıyor)');
        continue;
      }
      const tech = [...new Set(parsed.tech.map((t) => t.replace(/[.,]$/, '')))];
      const techUp = tech.map(fold).sort();
      const power = parsed.powerPs !== undefined ? `${parsed.powerPs}ps` : parsed.powerKw !== undefined ? `${parsed.powerKw}kw` : parsed.powerHp !== undefined ? `${parsed.powerHp}hp` : '';
      const engineKey = [parsed.displacementL?.toFixed(1) ?? '', techUp.join('+'), power].join('|');
      const powerText = parsed.powerPs !== undefined ? `${parsed.powerPs} PS` : parsed.powerKw !== undefined ? `${parsed.powerKw} kW` : parsed.powerHp !== undefined ? `${parsed.powerHp} HP` : '';
      const engineName = [parsed.displacementL?.toFixed(1), ...tech.map(techDisplay), powerText].filter(Boolean).join(' ');
      items.push({ row, parsed, brand, model: p.model, trims: [...p.trims, ...parsed.rest], engineKey, engineName, techTokens: tech });
    }
  }

  // 3) Önceki çalıştırmanın ürettiklerini temizle, sonra birleştir (idempotent)
  const merged = stripTsb(raw);
  const allIds = new Set<string>();
  const collect = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(collect);
    else if (v && typeof v === 'object') {
      const o = v as Json;
      if (typeof o.id === 'string') allIds.add(o.id);
      for (const x of Object.values(o)) if (x && typeof x === 'object') collect(x);
    }
  };
  collect(merged.brands);
  collect(merged.markets);
  collect(merged.sources);
  for (const list of merged.engines.values()) collect(list);
  for (const m of merged.models.values()) collect(m);
  const uniqueId = (base: string) => {
    let id = base;
    for (let n = 2; allIds.has(id); n++) id = `${base}-${n}`;
    allIds.add(id);
    return id;
  };

  if (!merged.sources.some((s) => s.id === TSB_SOURCE_ID)) {
    merged.sources.push({
      id: TSB_SOURCE_ID,
      title: opts.sourceTitle,
      url: 'https://www.tsb.org.tr/tr/kasko-deger-listesi',
      publisher: 'Türkiye Sigorta, Reasürans ve Emeklilik Şirketleri Birliği (TSB)',
      tier: 'secondary',
      accessedAt: opts.today,
      language: 'tr',
      notes: opts.sourceNotes,
    });
    allIds.add(TSB_SOURCE_ID);
  } else {
    const s = merged.sources.find((x) => x.id === TSB_SOURCE_ID)!;
    Object.assign(s, { title: opts.sourceTitle, accessedAt: opts.today, notes: opts.sourceNotes });
  }

  const brandIds = new Set(merged.brands.map((b) => String(b.id)));
  const touchedBrands = new Set<string>();
  const perBrand = new Map<string, { name: string; models: number; variants: number }>();

  // Marka → model → öğeler
  const groups = new Map<string, Map<string, Item[]>>();
  for (const it of items) {
    const g = groups.get(it.brand.id) ?? new Map<string, Item[]>();
    const list = g.get(it.model) ?? [];
    list.push(it);
    g.set(it.model, list);
    groups.set(it.brand.id, g);
  }

  for (const [brandId, models] of groups) {
    const rule = items.find((i) => i.brand.id === brandId)!.brand;
    if (!brandIds.has(brandId)) {
      merged.brands.push({ id: brandId, slug: brandId, name: rule.name, status: 'sourced', sourceIds: [TSB_SOURCE_ID], updatedAt: opts.today });
      brandIds.add(brandId);
      allIds.add(brandId);
    } else {
      const b = merged.brands.find((x) => x.id === brandId)!;
      if (b.status === 'pending') b.status = 'sourced';
      const sids = new Set([...((b.sourceIds as string[] | undefined) ?? []), TSB_SOURCE_ID]);
      b.sourceIds = [...sids];
    }
    touchedBrands.add(brandId);

    // Marka motorları
    const engineFile = `${brandId}.json`;
    const engines = merged.engines.get(engineFile) ?? [];
    merged.engines.set(engineFile, engines);
    const engineByKey = new Map<string, Json>();

    const engineFor = (list: Item[]): Json => {
      const it = list[0]!;
      const cached = engineByKey.get(it.engineKey);
      if (cached) return cached;
      const fuels = [...new Set(list.map((x) => x.parsed.fuel).filter(Boolean))];
      const fuel = fuels.length === 1 ? fuels[0] : undefined;
      const disp = it.parsed.displacementL;
      const ps = it.parsed.powerPs;
      // Mevcut (elle girilmiş) motor: hacim, PS ve (biliniyorsa) yakıt aynı ve tek eşleşme
      const existing = engines.filter(
        (e) =>
          disp !== undefined &&
          ps !== undefined &&
          e.displacementL === disp &&
          (e.power as Json | undefined)?.ps === ps &&
          (fuel === undefined || e.fuel === fuel) &&
          !(e.sourceIds as string[] | undefined)?.includes(TSB_SOURCE_ID),
      );
      if (existing.length === 1) {
        engineByKey.set(it.engineKey, existing[0]!);
        return existing[0]!;
      }
      const slugPart = slugify([disp !== undefined ? String(Math.round(disp * 10)) : '', ...it.techTokens, ps ?? (it.parsed.powerKw ? `${it.parsed.powerKw}kw` : it.parsed.powerHp ? `${it.parsed.powerHp}hp` : '')].filter(Boolean).join(' ')) || 'motor';
      const prior = engines.find((e) => e.slug === slugPart && (e.sourceIds as string[] | undefined)?.includes(TSB_SOURCE_ID));
      if (prior) {
        engineByKey.set(it.engineKey, prior);
        return prior;
      }
      const power: Json = {};
      if (ps !== undefined) power.ps = ps;
      if (it.parsed.powerKw !== undefined) power.kw = it.parsed.powerKw;
      if (it.parsed.powerHp !== undefined) power.hp = it.parsed.powerHp;
      const engine: Json = {
        id: uniqueId(`${brandId}-${slugPart}`),
        brandId,
        slug: slugPart,
        name: it.engineName,
        ...(fuel ? { fuel } : {}),
        ...(disp !== undefined ? { displacementL: disp } : {}),
        ...(Object.keys(power).length ? { power } : {}),
        status: fuels.length > 1 ? 'conflicting' : 'sourced',
        sourceIds: [TSB_SOURCE_ID],
        updatedAt: opts.today,
        notes:
          fuels.length > 1
            ? `TSB tip adlarında yakıt türü çelişiyor (${fuels.join(', ')}); yakıt boş bırakıldı.`
            : `TSB tip adından (örn. "${it.row.typeName}")${fuel ? '' : '; yakıt türü tip adında yazmıyor'}.`,
      };
      if (!fuel) stats.fuelUnknownEngines++;
      engines.push(engine);
      engineByKey.set(it.engineKey, engine);
      stats.engines++;
      return engine;
    };

    for (const [modelName, list] of models) {
      const modelSlug = slugify(displayName(modelName));
      if (!modelSlug) {
        for (const it of list) reject(it.row, 'model adı çözümlenemedi');
        continue;
      }
      const target = `models/${brandId}/${modelSlug}.json`;
      let model = merged.models.get(target);
      if (!model) {
        model = {
          id: uniqueId(`${brandId}-${modelSlug}`),
          brandId,
          slug: modelSlug,
          name: displayName(modelName),
          order: 999, // elle girilmiş modellerden sonra, ada göre
          status: 'sourced',
          sourceIds: [TSB_SOURCE_ID],
          updatedAt: opts.today,
          notes: 'Türkiye pazarı: TSB Kasko Değer Listesi\'nden otomatik oluşturuldu. Nesil ve makyaj eşleşmesi kaynakta yoksa "nesil belirlenmedi" olarak gösterilir.',
          generations: [],
        };
        merged.models.set(target, model);
        stats.models++;
      } else {
        if (model.status === 'pending') model.status = 'sourced';
        model.sourceIds = [...new Set([...((model.sourceIds as string[] | undefined) ?? []), TSB_SOURCE_ID])];
      }
      const gens = model.generations as Json[];
      const curatedGens = [...gens];
      const bucketGens = new Map<string, Json>();

      const genFor = (it: Item): { gen: Json; kind: 'existing' | 'hint' | 'none' } => {
        const years = it.row.modelYears;
        const a = years[0]!;
        const b = years.at(-1)!;
        const hint = it.parsed.generationHint;
        const hn = hint ? hintNumber(hint) : undefined;
        if (hn !== undefined) {
          const byHint = curatedGens.find((g) => new RegExp(`(^|-)mk${hn}$`).test(String(g.slug)) || new RegExp(`\\b(mk${hn}|${hint})\\b`, 'i').test(String(g.name)));
          if (byHint) return { gen: byHint, kind: 'existing' };
        }
        const ranges = curatedGens
          .filter((g) => g.order !== 999 && g.labelPeriod)
          .map((g) => {
            const lp = g.labelPeriod as { start: { year: number }; end: { year: number } | null };
            return { g, s: lp.start.year, e: lp.end?.year ?? 9999 };
          });
        const overlapping = ranges.filter((r) => r.s <= b && r.e >= a);
        // Model yılı ile katalogdaki üretim/model yılı temeli farklı olabilir: bitişik bir neslin
        // sınırına 1 yıldan yakın satırlar belirsiz sayılır (örn. 2011 model yılı Mk2 de olabilir).
        const near = ranges.filter((r) => r.s <= b + 1 && r.e >= a - 1);
        if (overlapping.length === 1 && near.length === 1 && overlapping[0]!.s <= a && overlapping[0]!.e >= b) return { gen: overlapping[0]!.g, kind: 'existing' };

        const key = hn !== undefined && overlapping.length === 0 ? `hint-${hn}` : 'none';
        // Aynı model dosyasına farklı TSB adlarından gelen satırlar aynı grubu paylaşır.
        const bucketSlug = key === 'none' ? 'nesil-belirlenmedi' : `nesil-${hn}`;
        let gen = bucketGens.get(key) ?? gens.find((g) => g.slug === bucketSlug && ownedByTsb(g));
        if (!gen) {
          const isHint = key !== 'none';
          gen = {
            id: uniqueId(`${model!.id}-${isHint ? `nesil-${hn}` : 'nesil-belirlenmedi'}`),
            slug: isHint ? `nesil-${hn}` : 'nesil-belirlenmedi',
            name: isHint ? `${displayName(modelName)} ${hint}` : `${displayName(modelName)} (nesil belirlenmedi)`,
            order: isHint ? 900 + (hn ?? 0) : 999,
            labelPeriod: { marketId: MARKET, basis: 'model-year', start: { year: a }, end: { year: b } },
            status: 'unverified',
            sourceIds: [TSB_SOURCE_ID],
            updatedAt: opts.today,
            notes: isHint
              ? `Nesil adı TSB tip adlarındaki "${hint}" ifadesinden alındı; yıllar bu tiplerin TSB listesinde yer aldığı model yılları (Türkiye). Üretim yılları ve makyaj dönemleri doğrulanmadı.`
              : 'Bu tiplerin hangi nesle ait olduğu kaynakta yazmıyor veya model yılları birden fazla nesille örtüşüyor. Yıllar TSB listesinde yer aldıkları model yılları (Türkiye).',
            revisions: [],
            variants: [],
          };
          gens.push(gen);
          stats.generations++;
          if (isHint) stats.hintGenerations++;
        }
        bucketGens.set(key, gen);
        // Yıl aralığını genişlet
        const lp = gen.labelPeriod as { start: { year: number }; end: { year: number } };
        lp.start.year = Math.min(lp.start.year, a);
        lp.end.year = Math.max(lp.end.year, b);
        return { gen, kind: key === 'none' ? 'none' : 'hint' };
      };

      // Nesil × motor grupları
      const variantGroups = new Map<string, { gen: Json; kind: string; items: Item[] }>();
      for (const it of list) {
        const { gen, kind } = genFor(it);
        const key = `${String(gen.id)}|${it.engineKey}`;
        const vg = variantGroups.get(key) ?? { gen, kind, items: [] };
        vg.items.push(it);
        variantGroups.set(key, vg);
      }

      let modelVariants = 0;
      for (const { gen, kind, items: vItems } of variantGroups.values()) {
        const engine = engineFor(vItems.filter((x) => x.engineKey === vItems[0]!.engineKey));
        const years = [...new Set(vItems.flatMap((x) => x.row.modelYears))].sort((x, y) => x - y);
        const imported = vItems.every((x) => x.brand.imported);
        const availability: Json = {
          marketId: MARKET,
          status: imported ? 'imported' : 'listed',
          modelYears: years,
          trims: [...new Set(vItems.map((x) => displayName(x.trims.join(' ').trim())).filter(Boolean))].sort(),
          bodyTypes: [...new Set(vItems.map((x) => x.parsed.body).filter(Boolean).map((b) => BODY_TR[b!]!))].sort(),
          sourceRefs: [...new Set(vItems.map((x) => `TSB ${x.row.brandCode}-${x.row.typeCode}`))].sort(),
          sourceIds: [TSB_SOURCE_ID],
        };
        const transmissions: Json[] = [];
        for (const t of vItems.map((x) => x.parsed.transmission).filter(Boolean)) {
          const sig = `${t!.type}|${t!.name ?? ''}|${t!.gears ?? ''}`;
          if (!transmissions.some((x) => `${x.type}|${x.name ?? ''}|${x.gears ?? ''}` === sig)) {
            transmissions.push({ type: t!.type, ...(t!.gears ? { gears: t!.gears } : {}), ...(t!.name ? { name: t!.name } : {}) });
          }
        }
        const variants = gen.variants as Json[];
        const existing = variants.find((v) => v.engineId === engine.id);
        if (existing) {
          const avail = ((existing.marketAvailability as Json[] | undefined) ?? []).filter((x) => x.marketId !== MARKET);
          avail.push(availability);
          existing.marketAvailability = avail;
          existing.marketIds = [...new Set([...((existing.marketIds as string[] | undefined) ?? []), MARKET])];
          if (!(existing.sourceIds as string[] | undefined)?.includes(TSB_SOURCE_ID)) stats.existingVariantsEnriched++;
          continue;
        }
        const slug = String(engine.slug);
        variants.push({
          id: uniqueId(`${String(gen.id)}-${slug}`),
          slug: variants.some((v) => v.slug === slug) ? `${slug}-${variants.length + 1}` : slug,
          engineId: engine.id,
          revisionMapping: 'unknown',
          transmissions,
          ...(vItems.every((x) => x.parsed.awd) ? { drivetrain: 'awd' } : {}),
          marketIds: [MARKET],
          periods: [{ marketId: MARKET, basis: 'model-year', start: { year: years[0] }, end: { year: years.at(-1) } }],
          marketAvailability: [availability],
          status: 'sourced',
          sourceIds: [TSB_SOURCE_ID],
          updatedAt: opts.today,
        });
        stats.variants++;
        modelVariants++;
        if (kind === 'none') stats.variantsWithoutGeneration++;
        if (kind === 'existing') stats.variantsOnExistingGenerations++;
        stats.imported += vItems.length;
      }
      const pb = perBrand.get(brandId) ?? { name: rule.name, models: 0, variants: 0 };
      pb.models++;
      pb.variants += modelVariants;
      perBrand.set(brandId, pb);
    }
  }
  // Önceki çalıştırmadan kalan, artık hiçbir TSB satırı düşmeyen (yalnızca TSB kaynaklı) boş modeller silinir.
  for (const [f, m] of merged.models) if (ownedByTsb(m) && ((m.generations as Json[] | undefined) ?? []).length === 0) merged.models.delete(f);
  stats.brands = touchedBrands.size;
  // Yeniden çalıştırmada da doğru sayı: kaynağı yalnızca TSB olan modeller
  stats.models = [...merged.models.values()].filter((m) => ownedByTsb(m) && ((m.generations as Json[] | undefined) ?? []).length > 0).length;
  void FUEL_ORDER;
  return { merged, stats, rejects, perBrand };
}
