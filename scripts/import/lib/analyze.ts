/**
 * Staging adaylarını canlı katalogla karşılaştırır, birleştirilmiş katalog üretir ve
 * sonucu katalog şemaları + `validateCatalog` ile denetler. `import:check`, `import:diff`
 * ve `import:promote` aynı analizi kullanır.
 *
 * Birleştirme kuralları:
 * - İçe aktarma hiçbir şeyi silmez. Aday kayıtta olmayan alanlar (örn. makyaj dönemleri,
 *   varyantlar) mevcut kayıttan korunur.
 * - Karşılaştırmada meta alanlar (status, sourceIds, notes, updatedAt) yok sayılır;
 *   yalnızca veri alanları farklıysa kayıt "değişti" sayılır.
 * - Mevcut kayıt kaynaklı/doğrulanmış (`sourced`, `verified`, `conflicting`) ise ve veri
 *   farklıysa kayıt "çelişiyor" olur ve HİÇBİR ZAMAN otomatik uygulanmaz.
 * - İki staging dosyası aynı kaydı farklı değerlerle veriyorsa bu bir hatadır.
 */
import { z } from 'astro/zod';
import {
  brandSchema,
  engineSchema,
  marketSchema,
  modelSchema,
  sourceSchema,
  type VerificationStatus,
} from '../../../src/lib/catalog/schema.ts';
import { validateCatalog, type CatalogData } from '../../../src/lib/catalog/validate.ts';
import type { Json, LoadedStagingFile, RawCatalog } from './io.ts';
import { META_KEYS, leafPaths, type ModelCandidate, type Provenance, type StagingFile } from './staging-schema.ts';

export type ChangeKind = 'new' | 'changed' | 'unchanged' | 'conflicting';
export type RecordType = 'model' | 'generation' | 'source';

export interface FieldChange {
  path: string;
  before: unknown;
  after: unknown;
  provenance?: Provenance;
}

export interface RecordChange {
  stagingPath: string;
  adapter: string;
  recordType: RecordType;
  id: string;
  /** Hedef katalog dosyası (katalog klasörüne göreli). */
  target: string;
  kind: ChangeKind;
  /** Aday kaydın alanları (yeni kayıtta tamamı, değişende yalnız farklar). */
  fields: FieldChange[];
  /** Bu kayıttaki yer tutucu (kaynağa dayanmayan) alanlar. */
  placeholders: { path: string; note: string }[];
  /** Uygulandı mı (birleştirilmiş kataloğa yazıldı mı)? */
  applied: boolean;
  /** Uygulanmadıysa nedeni. */
  skipReason?: string;
}

export interface Analysis {
  errors: string[];
  warnings: string[];
  changes: RecordChange[];
  /** Uygulanabilir değişiklikler işlenmiş katalog (ham biçim). */
  merged: RawCatalog;
  staging: LoadedStagingFile[];
}

export interface AnalyzeOptions {
  /**
   * Aday dosyasının (model + nesilleri) uygulanıp uygulanmayacağı. Döndürülen metin atlama
   * nedenidir; `undefined` uygulanır. Varsayılan: hepsi uygulanır (check/diff onaylanmış
   * gibi denetler).
   */
  gate?: (ctx: { file: StagingFile; candidate: ModelCandidate; changes: RecordChange[] }) => string | undefined;
}

const CURATED: VerificationStatus[] = ['verified', 'sourced', 'conflicting'];
const SOURCE_IGNORED_KEYS = ['accessedAt', 'notes'];
const stable = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x));
const clone = <T>(v: T): T => structuredClone(v);

/** Yol → değer (yaprak alanlar). */
function flatten(record: Json, skip: readonly string[]): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const path of leafPaths(record, skip)) out.set(path, getPath(record, path));
  return out;
}

export function getPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const part of path.split(/\.|\[(\d+)\]/).filter((p) => p !== undefined && p !== '')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

const dataKeys = (r: Json, skip: readonly string[]) =>
  Object.keys(r).filter((k) => !(META_KEYS as readonly string[]).includes(k) && !skip.includes(k));

/** Adayın verdiği veri alanlarının mevcut kayıttaki karşılığıyla aynı olup olmadığı. */
function sameData(existing: Json, candidate: Json, skip: readonly string[]): boolean {
  return dataKeys(candidate, skip).every((k) => stable(existing[k]) === stable(candidate[k]));
}

function fieldChanges(existing: Json | undefined, candidate: Json, skip: readonly string[], prov: Record<string, Provenance> = {}): FieldChange[] {
  const after = flatten(candidate, skip);
  const before = existing ? flatten(pick(existing, Object.keys(candidate)), skip) : new Map<string, unknown>();
  // Meta alanlar da raporda görünsün (durum ve not değişikliği önemli).
  for (const k of ['status', 'sourceIds', 'notes']) {
    if (k in candidate) after.set(k, candidate[k]);
    if (existing && k in existing) before.set(k, existing[k]);
  }
  const paths = [...new Set([...before.keys(), ...after.keys()])];
  return paths
    .filter((p) => !existing || stable(before.get(p)) !== stable(after.get(p)))
    .map((p) => ({ path: p, before: before.get(p), after: after.get(p), provenance: prov[p] }));
}

const pick = (r: Json, keys: string[]): Json => Object.fromEntries(Object.entries(r).filter(([k]) => keys.includes(k)));

function placeholdersOf(prov: Record<string, Provenance> = {}) {
  return Object.entries(prov)
    .filter(([, p]) => p.kind === 'placeholder')
    .map(([path, p]) => ({ path, note: p.note ?? '' }));
}

/** Aday dosyalarının kendi içindeki kanıt kuralları. */
function checkEvidence(sp: string, file: StagingFile, catalogSourceIds: Set<string>, errors: string[], warnings: string[]): void {
  const known = new Set([...catalogSourceIds, ...file.sources.map((s) => s.id)]);
  if (!file.license.publishable) {
    warnings.push(`${sp}: kaynağın lisansı yayın için doğrulanmadı ("publishable": false); promote bu dosyayı yazmaz`);
  }
  for (const s of file.skipped) warnings.push(`${sp}: atlandı ${s.ref}: ${s.reason}`);

  for (const c of file.candidates) {
    const model = c.record;
    const gens = Array.isArray(model.generations) ? (model.generations as Json[]) : [];
    const records: [Json, readonly string[]][] = [[model, ['generations']], ...gens.map((g) => [g, []] as [Json, readonly string[]])];
    const recordIds = new Set(records.map(([r]) => String(r.id)));

    for (const id of Object.keys(c.provenance)) {
      if (!recordIds.has(id)) errors.push(`${sp}: köken haritasında adayda olmayan kayıt "${id}"`);
    }

    for (const [rec, skip] of records) {
      const id = String(rec.id);
      const where = `${sp} ${id}`;
      const prov = c.provenance[id] ?? {};
      const leaves = leafPaths(rec, skip);
      for (const path of leaves) if (!prov[path]) errors.push(`${where}: "${path}" alanının kökeni (provenance) yok`);
      for (const path of Object.keys(prov)) if (!leaves.includes(path)) errors.push(`${where}: kökeni verilen "${path}" alanı kayıtta yok`);

      const recSources = Array.isArray(rec.sourceIds) ? (rec.sourceIds as string[]) : [];
      for (const [path, p] of Object.entries(prov)) {
        if (p.sourceId && !known.has(p.sourceId)) errors.push(`${where}: "${path}" bilinmeyen kaynağa dayanıyor ("${p.sourceId}")`);
        if (p.sourceId && !recSources.includes(p.sourceId)) errors.push(`${where}: "${path}" kaynağı "${p.sourceId}" kaydın sourceIds listesinde yok`);
      }

      const ph = placeholdersOf(prov);
      if (ph.length > 0) {
        if (CURATED.includes(rec.status as VerificationStatus)) {
          errors.push(`${where}: yer tutucu alan içeren kayıt "${String(rec.status)}" olamaz (unverified veya pending olmalı)`);
        }
        if (!rec.notes) errors.push(`${where}: yer tutucu alan içeren kaydın "notes" alanı yer tutucuları açıklamalı`);
        warnings.push(`${where}: kaynağa dayanmayan yer tutucu alanlar (${ph.map((p) => p.path).join(', ')}); onaydan önce doğrulanmalı`);
      }
    }

    const brandId = String(model.brandId ?? '');
    const slug = String(model.slug ?? '');
    if (c.target !== `models/${brandId}/${slug}.json`) {
      errors.push(`${sp} ${String(model.id)}: hedef "${c.target}" models/${brandId}/${slug}.json olmalı`);
    }
  }
}

/** Ardışık nesillerin etiket yılları üst üste biniyorsa uyarır (pazar/temel farkına işaret eder). */
function overlapWarnings(where: string, model: Json, warnings: string[]): void {
  type G = { id: string; order: number; labelPeriod?: { start?: { year: number }; end?: { year: number } | null } };
  const gens = ((model.generations as G[] | undefined) ?? []).slice().sort((a, b) => a.order - b.order);
  for (let i = 1; i < gens.length; i++) {
    const prev = gens[i - 1]!;
    const next = gens[i]!;
    const prevEnd = prev.labelPeriod?.end?.year;
    const nextStart = next.labelPeriod?.start?.year;
    if (prevEnd !== undefined && nextStart !== undefined && nextStart < prevEnd) {
      warnings.push(`${where}: "${prev.id}" bitişi (${prevEnd}) "${next.id}" başlangıcından (${nextStart}) sonra; yıllar üst üste biniyor (pazar veya yıl temeli farkı olabilir)`);
    }
  }
}

export function analyze(raw: RawCatalog, staging: LoadedStagingFile[], options: AnalyzeOptions = {}): Analysis {
  const errors = staging.flatMap((s) => s.errors);
  const warnings: string[] = [];
  const changes: RecordChange[] = [];
  const merged: RawCatalog = {
    brands: clone(raw.brands),
    markets: clone(raw.markets),
    sources: clone(raw.sources),
    engines: new Map([...raw.engines].map(([k, v]) => [k, clone(v)])),
    models: new Map([...raw.models].map(([k, v]) => [k, clone(v)])),
  };
  const catalogSourceIds = new Set(raw.sources.map((s) => String(s.id)));
  /** Kayıt kimliği → onu ilk veren staging dosyası ve veri imzası (staging'ler arası çakışma). */
  const firstSeen = new Map<string, { path: string; sig: string }>();
  const touchedModels = new Set<string>();

  const claimStaging = (sp: string, id: string, rec: Json, skip: readonly string[]) => {
    const keys = dataKeys(rec, skip).sort();
    const sig = stable(pick(rec, keys));
    const prev = firstSeen.get(id);
    if (!prev) firstSeen.set(id, { path: sp, sig });
    else if (prev.sig !== sig) errors.push(`çakışma: "${id}" kaydı ${prev.path} ve ${sp} dosyalarında farklı değerlerle geliyor; insan kararı gerekli`);
  };

  for (const s of staging) {
    if (!s.file) continue;
    const file = s.file;
    const sp = s.path;
    checkEvidence(sp, file, catalogSourceIds, errors, warnings);

    let anyApplied = false;
    for (const c of file.candidates) {
      const cand = clone(c.record) as Json;
      const candGens = Array.isArray(cand.generations) ? (cand.generations as Json[]) : [];
      const existingModel = merged.models.get(c.target);
      const candChanges: RecordChange[] = [];
      const base = { stagingPath: sp, adapter: file.adapter, target: c.target, applied: false };

      if (existingModel && existingModel.id !== cand.id) {
        errors.push(`${sp}: hedef ${c.target} başka bir modele ait ("${String(existingModel.id)}")`);
        continue;
      }

      // Model düzeyi (nesiller hariç)
      claimStaging(sp, String(cand.id), cand, ['generations']);
      const modelOnly = pick(cand, Object.keys(cand).filter((k) => k !== 'generations'));
      const modelProv = c.provenance[String(cand.id)];
      const modelKind: ChangeKind = !existingModel
        ? 'new'
        : sameData(existingModel, modelOnly, ['generations'])
          ? 'unchanged'
          : CURATED.includes(existingModel.status as VerificationStatus)
            ? 'conflicting'
            : 'changed';
      candChanges.push({
        ...base,
        recordType: 'model',
        id: String(cand.id),
        kind: modelKind,
        fields: modelKind === 'unchanged' ? [] : fieldChanges(existingModel, modelOnly, ['generations'], modelProv),
        placeholders: placeholdersOf(modelProv),
      });

      // Nesiller
      const existingGens = (existingModel?.generations as Json[] | undefined) ?? [];
      for (const g of candGens) {
        const id = String(g.id);
        claimStaging(sp, id, g, []);
        const prev = existingGens.find((x) => x.id === id);
        const prov = c.provenance[id];
        const kind: ChangeKind = !prev
          ? 'new'
          : sameData(prev, g, [])
            ? 'unchanged'
            : CURATED.includes(prev.status as VerificationStatus)
              ? 'conflicting'
              : 'changed';
        candChanges.push({
          ...base,
          recordType: 'generation',
          id,
          kind,
          fields: kind === 'unchanged' ? [] : fieldChanges(prev, g, [], prov),
          placeholders: placeholdersOf(prov),
        });
      }

      const skipReason = options.gate?.({ file, candidate: c, changes: candChanges });
      for (const ch of candChanges) {
        if (ch.kind === 'conflicting') ch.skipReason = 'mevcut kaynaklı kayıtla çelişiyor; otomatik uygulanmaz';
        else if (ch.kind === 'unchanged') ch.skipReason = 'değişiklik yok';
        else if (skipReason) ch.skipReason = skipReason;
        else ch.applied = true;
      }
      changes.push(...candChanges);
      if (skipReason) continue;

      // Uygula
      const apply = (id: string) => candChanges.find((x) => x.id === id)?.applied ?? false;
      const target: Json = existingModel ? clone(existingModel) : { ...modelOnly, generations: [] };
      if (existingModel && apply(String(cand.id))) Object.assign(target, modelOnly);
      const gens = (target.generations as Json[] | undefined) ?? [];
      for (const g of candGens) {
        if (!apply(String(g.id))) continue;
        const idx = gens.findIndex((x) => x.id === g.id);
        if (idx >= 0) gens[idx] = { ...gens[idx], ...g };
        else gens.push(g);
      }
      target.generations = gens;
      if (candChanges.some((x) => x.applied)) {
        merged.models.set(c.target, target);
        anyApplied = true;
      }
      touchedModels.add(c.target);
    }

    // Kaynak kayıtları: dosyadaki bir aday uygulandıysa eklenir/güncellenir.
    for (const src of file.sources) {
      const idx = merged.sources.findIndex((x) => x.id === src.id);
      const prev = idx >= 0 ? merged.sources[idx] : undefined;
      const kind: ChangeKind = !prev ? 'new' : sameData(prev, src, SOURCE_IGNORED_KEYS) ? 'unchanged' : 'changed';
      const change: RecordChange = {
        stagingPath: sp,
        adapter: file.adapter,
        recordType: 'source',
        id: src.id,
        target: 'sources.json',
        kind,
        fields: kind === 'unchanged' ? [] : fieldChanges(prev, src as Json, []),
        placeholders: [],
        applied: false,
      };
      if (kind === 'unchanged') change.skipReason = 'değişiklik yok';
      else if (!anyApplied) change.skipReason = 'bu dosyadan uygulanan aday kayıt yok';
      else {
        change.applied = true;
        if (prev) merged.sources[idx] = { ...prev, ...src };
        else merged.sources.push(clone(src) as Json);
      }
      changes.push(change);
    }
  }

  for (const t of touchedModels) {
    const m = merged.models.get(t);
    if (m) overlapWarnings(t, m, warnings);
  }

  errors.push(...validateMerged(merged));
  return { errors, warnings, changes, merged, staging };
}

/** Birleştirilmiş katalogu sitenin kullandığı şemalarla ve bütünlük denetimiyle doğrular. */
export function validateMerged(merged: RawCatalog): string[] {
  const errors: string[] = [];
  const parse = <T>(where: string, schema: z.ZodType<T>, value: unknown): T | undefined => {
    const r = schema.safeParse(value);
    if (r.success) return r.data;
    for (const i of r.error.issues) errors.push(`${where}: ${i.path.join('.') || '(kök)'}: ${i.message}`);
    return undefined;
  };
  const brands = parse('brands.json', z.array(brandSchema), merged.brands);
  const markets = parse('markets.json', z.array(marketSchema), merged.markets);
  const sources = parse('sources.json', z.array(sourceSchema), merged.sources);
  const engines = [...merged.engines].flatMap(([f, list]) => parse(`engines/${f}`, z.array(engineSchema), list) ?? []);
  const models = [...merged.models].flatMap(([f, m]) => {
    const parsed = parse(f, modelSchema, m);
    return parsed ? [parsed] : [];
  });
  if (errors.length > 0 || !brands || !markets || !sources) return errors;
  const data: CatalogData = { brands, markets, sources, engines, models };
  return validateCatalog(data).map((e) => `bütünlük: ${e}`);
}
