/**
 * Wikipedia bilgi kutularından nesil kayıtları üretir ve kataloğa ekler.
 *
 * Kurallar (tahminsiz):
 * - Nesil yalnızca bir bilgi kutusunda `production` satırı varsa oluşturulur. Yıllar o satırdan alınır.
 * - Birden çok üretim satırı varsa önce Türkiye, sonra Avrupa ülkeleri seçilir; hiçbiri yoksa
 *   açıklamasız satır(lar), o da yoksa bütün satırların en geniş aralığı ("yaklaşık", dünya geneli).
 * - Kasa kodu yalnızca başlıkta veya bilgi kutusunda yazıyorsa girilir; makyaj dönemi üretilmez.
 * - Elle girilmiş (TSB ve Wikipedia dışı kaynaklı) nesli olan modellere dokunulmaz.
 * - Yeniden çalıştırma: önceki Wikipedia nesilleri (kaynağı yalnızca `wpgen-…`) temizlenip yeniden kurulur.
 */
import type { Json, RawCatalog } from '../lib/io.ts';
import { chassisCodes, engineDisplacements, engineSignatures, generationOrdinal, parseInfoboxes, parseProduction, plain, sectionsWithMain, type Infobox, type ProductionLine } from './wikitext.ts';

export const WPGEN_PREFIX = 'wpgen-';
const ownedByWp = (r: Json) => {
  const ids = (r.sourceIds as string[] | undefined) ?? [];
  return ids.length > 0 && ids.every((s) => s.startsWith(WPGEN_PREFIX));
};
const TSB = 'tsb-kasko-deger-listesi';

export interface WikiPage {
  title: string;
  pageid: number;
  revid: number;
  wikitext: string;
}

export interface StagedGeneration {
  slug: string;
  name: string;
  code?: string;
  ordinal?: number;
  start: number;
  end: number | null;
  marketId: 'tr' | 'eu' | 'global';
  approximate: boolean;
  engineDisplacementsL: number[];
  /** "hacim:yakıt" imzaları (bkz. wikitext.engineSignatures). */
  engineSignatures?: string[];
  /** Kaynak sayfa ve satır açıklaması (rapor ve not için). */
  page: string;
  productionNote: string;
}

export interface ModelGenerations {
  modelFile: string;
  modelId: string;
  article?: string;
  status: 'found' | 'not-found' | 'no-generations' | 'skipped-curated';
  /** Model kimliği nasıl doğrulandı: madde başlığı veya Wikidata etiketi/diğer adı (tam eşleşme). */
  identity?: { via: 'title' | 'wikidata' | 'alias'; qid?: string; label?: string };
  generations: StagedGeneration[];
  pages: { title: string; pageid: number; revid: number }[];
  /** Gerçek çelişkiler (aynı nesil için farklı yıllar, aynı sıra numarası iki kez). */
  conflicts: string[];
  /** Ardışık nesillerin 2 yıldan fazla örtüşmesi (gövde/pazar farkı; bilgi amaçlı). */
  overlaps: string[];
  /** Çelişkiye karışan nesil kimlikleri: bunlar aktarılmaz; diğer nesiller aktarılabilir. */
  conflictSlugs?: string[];
  /** Çelişkili nesillerin kaynakta geçen dönemleri: bu yıllara düşen TSB satırları hiçbir nesle eşlenmez. */
  blockedSpans?: { start: number; end: number | null }[];
}

const TURKEY = /\bturkey\b|\btürkiye\b|bursa|izmit|gölcük|golcuk|sakarya|adapazarı|kocaeli/i;
const EUROPE = /\b(europe|european|germany|france|spain|portugal|italy|united kingdom|uk|england|belgium|netherlands|czech|slovakia|poland|hungary|romania|slovenia|sweden|austria|finland|serbia|global|worldwide)\b/i;

/** Üretim satırlarından etiket dönemi: Türkiye > Avrupa > açıklamasız > en geniş. */
export function pickProduction(lines: ProductionLine[]): { start: number; end: number | null; marketId: 'tr' | 'eu' | 'global'; approximate: boolean; note: string } | undefined {
  if (lines.length === 0) return undefined;
  const span = (ls: ProductionLine[]) => ({
    start: Math.min(...ls.map((l) => l.start)),
    end: ls.some((l) => l.end === null) ? null : Math.max(...ls.map((l) => l.end!)),
  });
  const tr = lines.filter((l) => TURKEY.test(l.note));
  if (tr.length) return { ...span(tr), marketId: 'tr', approximate: false, note: tr.map((l) => l.note).join('; ') };
  const eu = lines.filter((l) => EUROPE.test(l.note));
  if (eu.length) return { ...span(eu), marketId: 'eu', approximate: false, note: eu.map((l) => l.note).join('; ') };
  const plainLines = lines.filter((l) => !l.note);
  if (plainLines.length) return { ...span(plainLines), marketId: 'global', approximate: false, note: '' };
  return { ...span(lines), marketId: 'global', approximate: true, note: `farklı pazarlar: ${lines.map((l) => l.note).join('; ')}` };
}

const cleanHeading = (h: string) => plain(h.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const GENERIC_NAME = /^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+generation$/i;

const ORD_WORDS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
/** Görünen adın Türkçeleştirilmesi: "3 Series" → "3 Serisi", "First generation" → "1. nesil". */
function turkishName(s: string): string {
  return s
    .replace(/\(?\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)[ -]generation\b\)?/gi, (_m, w: string) => `${ORD_WORDS.indexOf(w.toLowerCase()) + 1}. nesil`)
    .replace(/\bSeries\b/g, 'Serisi')
    .replace(/-Class\b/g, '-Serisi')
    .replace(/\s+/g, ' ')
    .trim();
}

function stageFrom(ib: Infobox, heading: string, page: WikiPage, brand: string, modelName: string, separatePage: boolean, currentYear: number): StagedGeneration | undefined {
  const picked = pickProduction(parseProduction(ib.fields.production ?? ''));
  if (!picked) return undefined;
  if (picked.start > currentYear) return undefined; // henüz üretime girmemiş nesil
  const label = `${heading} ${page.title}`;
  const codeField = plain(ib.fields.model_code ?? ib.fields.chassis_code ?? '').trim();
  // Model maddesinin başlığı ("Audi A5") kasa kodu değildir; yalnızca ayrı nesil maddesinin başlığı kullanılır.
  const fromTitle = separatePage ? chassisCodes(page.title) : [];
  const codes = chassisCodes(heading).length ? chassisCodes(heading) : fromTitle.length ? fromTitle : codeField ? chassisCodes(`(${codeField})`) : [];
  const ordinal = generationOrdinal(heading) ?? generationOrdinal(page.title) ?? generationOrdinal(plain(ib.fields.name ?? ''));
  let display = plain(ib.fields.name ?? '').replace(/\s+/g, ' ').trim();
  for (const b of [brand, brand.replace(/-/g, ' '), 'Škoda', 'SEAT', 'Citroën']) display = display.replace(new RegExp(`^${b}\\s+`, 'i'), '');
  // Bilgi kutusu adı yalnızca model adını tam sözcük olarak içeriyorsa kullanılır ("C" → "electric" içinde sayılmaz).
  const modelWord = (modelName.split(' ')[0] ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const useDisplay = display && !GENERIC_NAME.test(display) && new RegExp(`(^|[\\s-])${modelWord}($|[\\s-])`, 'i').test(display) && display.length <= 40;
  const suffix = codes.length ? ` (${codes.join('/')})` : '';
  const name = turkishName(useDisplay ? `${display}${suffix && !display.includes(codes[0]!) ? suffix : ''}` : ordinal ? `${modelName} ${ordinal}. nesil${suffix}` : `${modelName}${suffix || ` (${picked.start})`}`);
  const slug = codes.length ? slugify(codes.join('-')) : ordinal ? `${ordinal}-nesil` : `uretim-${picked.start}`;
  return {
    slug,
    name,
    ...(codes.length ? { code: codes.join('/') } : {}),
    ...(ordinal ? { ordinal } : {}),
    start: picked.start,
    end: picked.end,
    marketId: picked.marketId,
    approximate: picked.approximate,
    engineDisplacementsL: engineDisplacements(ib.fields.engine ?? ''),
    engineSignatures: engineSignatures(ib.fields.engine ?? ''),
    page: page.title,
    productionNote: picked.note,
  };
  void label;
}

/**
 * Bir modelin Wikipedia maddesinden (ve {{Main}} ile bağlanan nesil maddelerinden) nesilleri çıkarır.
 * `pages` maddenin kendisi ve getirilmiş nesil sayfalarıdır (başlığa göre).
 */
export function generationsFromArticle(
  article: WikiPage,
  linked: Map<string, WikiPage>,
  brand: string,
  modelName: string,
  currentYear = new Date().getFullYear(),
): { gens: StagedGeneration[]; used: WikiPage[]; conflicts: string[]; overlaps: string[]; conflictSlugs: string[]; blockedSpans: { start: number; end: number | null }[] } {
  const gens: StagedGeneration[] = [];
  const used = new Set<WikiPage>();
  const conflicts: string[] = [];
  const overlaps: string[] = [];
  const boxes = parseInfoboxes(article.wikitext);
  const sectioned = boxes.filter((b) => b.heading);
  for (const ib of sectioned) {
    const heading = cleanHeading(ib.heading);
    if (!/generation|\bmk\s?\d|\(([A-Z]{1,3}\d|\d[A-Z])/i.test(heading) && generationOrdinal(heading) === undefined && chassisCodes(heading).length === 0) continue;
    const g = stageFrom(ib, heading, article, brand, modelName, false, currentYear);
    if (g) {
      gens.push(g);
      used.add(article);
    }
  }
  // Bilgi kutusu olmayan nesil bölümleri: {{Main|<marka> <model> (E46)}} → nesil maddesinin bilgi kutusu
  const prefix = article.title.replace(/\s*\(.*\)$/, '').toLowerCase();
  for (const s of sectionsWithMain(article.wikitext)) {
    const heading = cleanHeading(s.heading);
    if (sectioned.some((b) => cleanHeading(b.heading) === heading)) continue;
    const headingIsGeneration = generationOrdinal(heading) !== undefined || /generation|\bmk\s?\d/i.test(heading) || chassisCodes(heading).length > 0;
    // "Successor" / "Citroën C5 X" ayrı modeldir. Başlık nesil değilse {{Main}} hedefi nesil sayılmaz.
    if (!headingIsGeneration) continue;
    for (const target of s.mains) {
      const page = linked.get(target);
      if (!page || !page.title.toLowerCase().startsWith(prefix)) continue;
      if (generationOrdinal(page.title) === undefined && chassisCodes(page.title).length === 0 && generationOrdinal(heading) === undefined) continue;
      const ib = parseInfoboxes(page.wikitext)[0];
      if (!ib) continue;
      const g = stageFrom(ib, heading, page, brand, modelName, true, currentYear);
      if (g) {
        gens.push(g);
        used.add(page);
      }
    }
  }
  // Anlam ayrımı veya yalnızca bağlantı veren madde: "<Model> (1995–2004)", "<Model> (X250)" gibi yıl/kod
  // nitelendirmeli bağlantılar nesil maddesidir. Sözcük nitelendirmeliler ("coupé", "Americas") ayrı araçtır, alınmaz.
  if (gens.length === 0) {
    const seen = new Set<number>();
    for (const target of qualifiedLinks(article)) {
      const page = linked.get(target);
      if (!page || seen.has(page.pageid)) continue;
      const ib = parseInfoboxes(page.wikitext)[0];
      if (!ib) continue;
      const g = stageFrom(ib, '', page, brand, modelName, true, currentYear);
      if (g) {
        seen.add(page.pageid);
        gens.push(g);
        used.add(page);
      }
    }
  }
  // Tek nesilli madde ("Fiat Tipo (2015)"): giriş bilgi kutusu tek nesildir.
  if (gens.length === 0 && boxes.length === 1 && !boxes[0]!.heading) {
    const g = stageFrom(boxes[0]!, '', article, brand, modelName, false, currentYear);
    if (g) {
      gens.push(g);
      used.add(article);
    }
  }

  // Tekrarları ayıkla (aynı slug) ve çelişkileri raporla
  const bySlug = new Map<string, StagedGeneration>();
  /** Çelişkiye karışan nesiller (aktarılmaz) ve kaynakta geçen bütün dönemleri (bu yıllara eşleştirme yapılmaz). */
  const conflictSlugs = new Set<string>();
  const blockedSpans: { start: number; end: number | null }[] = [];
  for (const g of gens) {
    const prev = bySlug.get(g.slug);
    if (!prev) bySlug.set(g.slug, g);
    else if (prev.ordinal !== undefined && g.ordinal !== undefined && prev.ordinal !== g.ordinal) {
      // Aynı kasa kodunu paylaşan farklı nesiller (örn. Audi A4 B6 ve B7, ikisi de "8E/8H"): sıra numarasıyla ayrılır.
      const slug = `${g.slug}-${g.ordinal}-nesil`;
      bySlug.set(slug, { ...g, slug });
    } else if (prev.start !== g.start || prev.end !== g.end) {
      conflicts.push(`${g.slug}: iki kaynak satırı farklı yıllar veriyor (${prev.start}–${prev.end ?? '…'} / ${g.start}–${g.end ?? '…'})`);
      conflictSlugs.add(g.slug);
      blockedSpans.push({ start: prev.start, end: prev.end }, { start: g.start, end: g.end });
    }
  }
  const unique = [...bySlug.values()].sort((a, b) => a.start - b.start);
  const ordinals = new Map<number, StagedGeneration>();
  for (const g of unique) {
    if (g.ordinal === undefined) continue;
    const prev = ordinals.get(g.ordinal);
    if (prev) {
      conflicts.push(`${g.ordinal}. nesil iki kez: ${prev.name} ve ${g.name}`);
      for (const x of [prev, g]) {
        conflictSlugs.add(x.slug);
        blockedSpans.push({ start: x.start, end: x.end });
      }
    }
    ordinals.set(g.ordinal, g);
  }
  for (let i = 1; i < unique.length; i++) {
    const p = unique[i - 1]!;
    const n = unique[i]!;
    if (p.end !== null && n.start < p.end - 1) overlaps.push(`${p.name} (${p.start}–${p.end}) ile ${n.name} (${n.start}–${n.end ?? '…'}) 2 yıldan fazla örtüşüyor (farklı gövde/pazar olabilir)`);
  }
  return { gens: unique, used: [...used], conflicts, overlaps, conflictSlugs: [...conflictSlugs], blockedSpans };
}

/** Modelin elle girilmiş nesli var mı (TSB ve Wikipedia dışı kaynak)? */
export function hasCuratedGenerations(model: Json): boolean {
  return ((model.generations as Json[] | undefined) ?? []).some((g) => {
    const ids = (g.sourceIds as string[] | undefined) ?? [];
    return ids.length > 0 && !ids.every((s) => s === TSB || s.startsWith(WPGEN_PREFIX));
  });
}

/** Önceki Wikipedia nesillerini ve kaynaklarını kaldırır (yalnızca kaynağı `wpgen-…` olanlar). */
export function stripWikipedia(cat: RawCatalog): RawCatalog {
  const out: RawCatalog = { ...cat, sources: cat.sources.filter((s) => !String(s.id).startsWith(WPGEN_PREFIX)), models: new Map() };
  for (const [f, m] of cat.models) {
    const gens = ((m.generations as Json[] | undefined) ?? []).filter((g) => !(ownedByWp(g) && ((g.variants as Json[] | undefined) ?? []).every((v) => (v.sourceIds as string[] | undefined)?.every((s) => s === TSB))));
    out.models.set(f, { ...m, generations: gens });
  }
  return out;
}

export const sourceIdForPage = (pageid: number) => `${WPGEN_PREFIX}${pageid}`;

/** Wikipedia nesillerini kataloğa ekler (elle girilmiş nesli olan modeller atlanır). */
export function applyGenerations(cat: RawCatalog, staged: ModelGenerations[], today: string): { catalog: RawCatalog; added: number; models: number } {
  const out = stripWikipedia(cat);
  if (!out.markets.some((m) => m.id === 'global')) out.markets = [...out.markets, { id: 'global', name: 'Dünya geneli', kind: 'global' }];
  const sources = [...out.sources];
  const sourceIds = new Set(sources.map((s) => String(s.id)));
  // Kimlikler katalog genelinde benzersiz olmalı (örn. "Corvette C7" modeli ile "Corvette (C7)" nesli).
  const allIds = new Set<string>();
  const collect = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(collect);
    else if (v && typeof v === 'object') {
      const id = (v as Json).id;
      if (typeof id === 'string') allIds.add(id);
      Object.values(v as Json).forEach((x) => x && typeof x === 'object' && collect(x));
    }
  };
  collect([out.brands, out.markets, out.sources, [...out.engines.values()], [...out.models.values()]]);
  const uniqueId = (base: string) => {
    let id = base;
    for (let n = 2; allIds.has(id); n++) id = `${base}-${n}`;
    allIds.add(id);
    return id;
  };
  let added = 0;
  let models = 0;
  for (const mg of staged) {
    if (mg.status !== 'found' || mg.generations.length === 0) continue;
    const model = out.models.get(mg.modelFile);
    if (!model || hasCuratedGenerations(model)) continue;
    const gens = [...((model.generations as Json[] | undefined) ?? [])];
    const usedSlugs = new Set(gens.map((g) => String(g.slug)));
    let any = false;
    const conflicting = new Set(mg.conflictSlugs ?? []);
    for (const g of mg.generations) {
      if (conflicting.has(g.slug)) continue; // çelişkili nesil aktarılmaz
      const page = mg.pages.find((p) => p.title === g.page);
      if (!page) continue;
      const sid = sourceIdForPage(page.pageid);
      if (!sourceIds.has(sid)) {
        sources.push({
          id: sid,
          title: `${page.title} (Wikipedia)`,
          url: `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(page.title.replace(/ /g, '_'))}&oldid=${page.revid}`,
          publisher: 'Wikipedia (İngilizce)',
          tier: 'secondary',
          accessedAt: today,
          language: 'en',
          notes: `Bilgi kutusundaki üretim yılları, kasa kodu ve motor hacimleri; revizyon ${page.revid}. CC BY-SA 4.0 (yalnızca olgular kullanıldı).`,
        });
        sourceIds.add(sid);
      }
      let slug = g.slug;
      for (let n = 2; usedSlugs.has(slug); n++) slug = `${g.slug}-${n}`;
      usedSlugs.add(slug);
      gens.push({
        id: uniqueId(`${String(model.id)}-${slug}`),
        slug,
        name: g.name,
        ...(g.code ? { code: g.code } : {}),
        order: g.ordinal ?? 100 + (g.start - 1900),
        labelPeriod: { marketId: g.marketId, basis: 'production', start: { year: g.start }, end: g.end === null ? null : { year: g.end }, ...(g.approximate ? { approximate: true } : {}) },
        ...(g.engineDisplacementsL.length ? { engineDisplacementsL: g.engineDisplacementsL } : {}),
        ...(g.engineSignatures?.length ? { engineSignatures: g.engineSignatures } : {}),
        status: 'sourced',
        sourceIds: [sid],
        updatedAt: today,
        notes: `Üretim yılları İngilizce Wikipedia "${g.page}" bilgi kutusundan${g.productionNote ? ` (${g.productionNote})` : ''}${g.approximate ? '; satırlar farklı pazarlara ait, en geniş aralık gösteriliyor' : ''}. Makyaj dönemleri girilmedi.`,
        revisions: [],
        variants: [],
      });
      added++;
      any = true;
    }
    if (any) {
      model.generations = gens;
      models++;
    }
  }
  out.sources = sources;
  return { catalog: out, added, models };
}

/** Model adından aday Wikipedia başlıkları ("3 Serisi" → "BMW 3 Series", "C" → "Mercedes-Benz C-Class"). */
export function candidateTitles(brand: string, model: string): string[] {
  const forms = new Set<string>([model]);
  forms.add(model.replace(/\bSerisi\b/i, 'Series'));
  // Kısa harf kodları büyük harfle ("Cla" → "CLA", "Xf" → "XF"): katalog görünen adı küçük harfe çevirmiş olabilir.
  const upperShort = model.replace(/\b[A-Za-z]{1,3}\b/g, (w) => w.toUpperCase());
  forms.add(upperShort);
  if (/^[A-Z]{1,3}$/i.test(model)) forms.add(`${model.toUpperCase()}-Class`);
  const title = (s: string) => s.replace(/\b([A-Za-z])([A-Za-z]*)\b/g, (_m, a: string, b: string) => a.toUpperCase() + b.toLowerCase());
  for (const f of [...forms]) forms.add(title(f));
  for (const f of [...forms]) {
    // Harf kodu + numara: "XC 90" → "XC90" / "XC-90"
    const m = /^([A-Za-z]{1,3})[ -](\d{1,3})(\b.*)$/.exec(f);
    if (m) {
      forms.add(`${m[1]}${m[2]}${m[3]}`);
      forms.add(`${m[1]}-${m[2]}${m[3]}`);
    }
    // Küçük harfle başlayan model kodları: "I3" → "i3", "IX1" → "iX1"
    if (/^I[A-Z0-9]/.test(f)) forms.add(`i${f.slice(1)}`);
  }
  // Model adı marka adıyla başlıyorsa marka tekrar edilmez: marka "DS", model "DS 3" → "DS 3"
  const brandKey = brand.toLowerCase();
  return [...forms].map((f) => (f.toLowerCase().startsWith(`${brandKey} `) ? f : `${brand} ${f}`));
}

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s*\(.*\)\s*$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Bir modelin Wikipedia adaylarının kataloğa otomatik aktarılıp aktarılamayacağı.
 * Döndürülen metin dışarıda bırakma nedenidir; `undefined` aktarılabilir.
 */
export function importBlocker(mg: ModelGenerations, brand: string, modelName: string): string | undefined {
  if (mg.status !== 'found' || mg.generations.length === 0) return `nesil bulunamadı (${mg.status})`;
  // Çelişki yalnızca ilgili nesilleri dışarıda bırakır; çelişkisiz nesil kalmıyorsa model aktarılmaz.
  const conflicting = new Set(mg.conflictSlugs ?? []);
  if (mg.conflicts.length > 0 && (conflicting.size === 0 || mg.generations.every((g) => conflicting.has(g.slug)))) {
    return `kaynakta çelişki: ${mg.conflicts.join(' · ')}`;
  }
  // Marka ve model kimliği: Wikidata'da etiketi/diğer adı birebir eşleşen öğe (bkz. wikidata.ts) ya da
  // markayla başlayıp model adını (veya İngilizce karşılığını) içeren madde başlığı.
  if (mg.identity?.via === 'wikidata' || mg.identity?.via === 'alias') return undefined;
  if (!titleMatchesModel(mg.article ?? '', brand, modelName)) return `Wikipedia maddesi ("${mg.article}") bu modelle açıkça eşleşmiyor`;
  return undefined;
}

/** Madde başlığı bu marka + modeli açıkça adlandırıyor mu (aksan/boşluk farkı hariç)? */
export function titleMatchesModel(article: string, brand: string, modelName: string): boolean {
  const title = norm(article);
  const forms = candidateTitles(brand, modelName).map((t) => norm(t));
  const tight = (x: string) => x.replace(/ /g, '');
  return forms.some((f) => title === f || title.startsWith(`${f} `) || tight(title) === tight(f));
}

/** Nesil maddesi sayılan nitelendirme: yıl, yıl aralığı veya kasa/şasi kodu ("1995–2004", "2012", "X250", "750/101", "T6"). */
const GENERATION_QUALIFIER = /^(\d{4}(\s?[–-]\s?(\d{4}|present))?|[A-Z]{0,3}\d{1,4}[A-Z]?(\/[A-Z]{0,3}\d{1,4}[A-Z]?)*)$/;

/** Maddedeki "<madde başlığı> (<yıl veya kod>)" bağlantıları (anlam ayrımı ve bağlantı veren madde için). */
export function qualifiedLinks(article: WikiPage): string[] {
  const base = article.title.replace(/\s*\(.*\)$/, '');
  const out = new Set<string>();
  for (const m of article.wikitext.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g)) {
    const target = m[1]!.trim();
    const q = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(([^)]+)\\)$`, 'i').exec(target);
    if (q && GENERATION_QUALIFIER.test(q[1]!.trim())) out.add(target);
  }
  return [...out];
}
