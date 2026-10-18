/**
 * Araştırma JSON'unu mevcut kronik sorun kayıtlarına çevirir.
 * Varsayılan kullanım dry-run'dır: `applyResearchPlan` çağrılmazsa dosya yazılmaz.
 * Belirsiz motor, kasa veya şanzıman eşleşmesi aktarılmaz.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Engine, Model } from '../catalog/schema.ts';
import type { CatalogData } from '../catalog/validate.ts';
import type { Issue, IssueSource } from './schema.ts';
import { issueSchema, issueSourceSchema } from './schema.ts';
import { validateIssues } from './validate.ts';
import {
  RESEARCH_SCHEMA_ID,
  researchBundleSchema,
  type ResearchBundle,
  type ResearchIssue,
  type ResearchVehicle,
} from './research-schema.ts';

export type ImportDecision = 'import' | 'duplicate' | 'review' | 'invalid';

export type PlannedChange = {
  file: string;
  researchId: string;
  decision: ImportDecision;
  reason: string;
  issue?: Issue;
  sources?: IssueSource[];
  targetFile?: string;
};

const BRAND_ALIASES: Record<string, string> = {
  vw: 'volkswagen',
  vag: 'volkswagen',
  skoda: 'skoda',
  seat: 'seat',
  cupra: 'cupra',
};

export function fold(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('İ', 'i')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '');
}

function brandIdOf(catalog: CatalogData, name: string): string | undefined {
  const key = fold(name);
  const alias = BRAND_ALIASES[key];
  if (alias && catalog.brands.some((b) => b.id === alias)) return alias;
  return catalog.brands.find((b) => fold(b.name) === key || fold(b.slug) === key || b.id === key)?.id;
}

function modelOf(catalog: CatalogData, brandId: string, name: string): Model | undefined {
  const key = fold(name);
  const hits = catalog.models.filter(
    (m) => m.brandId === brandId && (fold(m.name) === key || fold(m.slug) === key || m.id === key),
  );
  return hits.length === 1 ? hits[0] : undefined;
}

const ROMAN: Record<string, string> = { '2': 'ii', '3': 'iii', '4': 'iv', '5': 'v', '6': 'vi', '7': 'vii', '8': 'viii' };

function tokens(value: string): string[] {
  return value
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((token) => ROMAN[token] ?? token);
}

function generationIds(model: Model, label: string | undefined): { ids: string[]; ambiguous: boolean } {
  if (!label) return { ids: [], ambiguous: false };
  const query = tokens(label);
  const hits = model.generations.filter((generation) => {
    const names = new Set(tokens(`${generation.name} ${generation.slug} ${generation.code ?? ''}`));
    return query.every((token) => names.has(token));
  });
  return { ids: hits.map((generation) => generation.id), ambiguous: hits.length !== 1 };
}

function enginesOn(model: Model, generationId: string, byId: Map<string, Engine>): Engine[] {
  const generation = model.generations.find((g) => g.id === generationId);
  if (!generation) return [];
  const ids = [...new Set(generation.variants.map((v) => v.engineId))];
  return ids.flatMap((id) => {
    const engine = byId.get(id);
    return engine ? [engine] : [];
  });
}

function transmissionFits(
  model: Model,
  generationId: string,
  engineId: string,
  wanted: NonNullable<ResearchVehicle['transmission']>,
): 'match' | 'missing' | 'other' {
  const generation = model.generations.find((g) => g.id === generationId);
  const variants = (generation?.variants ?? []).filter((v) => v.engineId === engineId);
  let sawMatch = false;
  let sawMissing = false;
  for (const variant of variants) {
    const options = variant.transmissions ?? [];
    if (options.length === 0) {
      sawMissing = true;
      continue;
    }
    const hit = options.some(
      (t) =>
        (wanted.type === undefined || t.type === wanted.type) &&
        (wanted.name === undefined || (t.name !== undefined && fold(t.name) === fold(wanted.name))),
    );
    if (hit) sawMatch = true;
  }
  if (sawMissing) return 'missing';
  return sawMatch ? 'match' : 'other';
}

function resolveVehicle(
  vehicle: ResearchVehicle,
  catalog: CatalogData,
  byId: Map<string, Engine>,
  category: ResearchIssue['category'],
): { selector?: Record<string, unknown>; skipped?: string[]; reason?: string } {
  const brandId = brandIdOf(catalog, vehicle.brand);
  if (!brandId) return { reason: `bilinmeyen marka "${vehicle.brand}"` };
  const model = modelOf(catalog, brandId, vehicle.model);
  if (!model) return { reason: `bilinmeyen model "${vehicle.brand} ${vehicle.model}"` };
  const generations = generationIds(model, vehicle.generation);
  if (vehicle.generation && generations.ambiguous) {
    return { reason: `nesil "${vehicle.generation}" tek kasaya bağlanamadı` };
  }
  if (!vehicle.generation) {
    const withEngine = model.generations.filter((g) => g.variants.length > 0);
    if (withEngine.length !== 1) {
      return { reason: 'nesil yazılmadı; sorun bütün kasalara yayılmadı' };
    }
    generations.ids = [withEngine[0].id];
  }
  const generationId = generations.ids[0];
  const pool = enginesOn(model, generationId, byId);
  const engineIds: string[] = [];
  const skipped: string[] = [];
  if (vehicle.engines.length === 0 && (vehicle.transmission || !['body', 'interior', 'electrical'].includes(category))) {
    return { reason: `${model.name}: motor yazılmadı, kayıt bütün motorlara yayılmadı` };
  }
  for (const wanted of vehicle.engines) {
    const name = wanted.name ? fold(wanted.name) : '';
    const code = wanted.code ? fold(wanted.code) : '';
    const byName = name ? pool.filter((e) => fold(e.name) === name) : [];
    const byFamily = name ? pool.filter((e) => e.family && fold(e.family) === name) : [];
    const byCode = code ? pool.filter((e) => e.codes.some((item) => fold(item) === code)) : [];
    let chosen: Engine[] = [];
    if (code && name) {
      const codes = new Set(byCode.map((e) => e.id));
      chosen = [...byName, ...byFamily].filter((e) => codes.has(e.id));
      if (chosen.length === 0) return { reason: `motor adı ve kodu aynı motorda buluşmadı (${wanted.name} / ${wanted.code})` };
    } else if (byName.length && byFamily.length) {
      const names = new Set(byName.map((e) => e.id));
      const same = byFamily.every((e) => names.has(e.id)) && byName.every((e) => byFamily.some((f) => f.id === e.id));
      if (!same) return { reason: `"${wanted.name}" hem motor adına hem motor ailesine karşılık geliyor` };
      chosen = byName;
    } else if (byName.length) chosen = byName;
    else if (byFamily.length) chosen = byFamily;
    else if (byCode.length) chosen = byCode;
    else return { reason: `katalogda motor yok: ${wanted.name ?? wanted.code}` };
    for (const engine of chosen) {
      if (vehicle.transmission) {
        const fit = transmissionFits(model, generationId, engine.id, vehicle.transmission);
        if (fit !== 'match') {
          skipped.push(engine.name);
          continue;
        }
      }
      if (!engineIds.includes(engine.id)) engineIds.push(engine.id);
    }
  }
  if (vehicle.engines.length > 0 && engineIds.length === 0) {
    return { reason: skipped.length ? `şanzıman doğrulanamadı: ${skipped.join(', ')}` : 'motor eşleşmedi' };
  }
  const selector: Record<string, unknown> = {
    modelIds: [model.id],
    generationIds: [generationId],
    engineIds,
  };
  if (vehicle.transmission) selector.transmissions = [vehicle.transmission];
  if (vehicle.years) selector.years = { ...vehicle.years, basis: 'model-year' };
  return { selector, skipped };
}

function slugSource(agent: string, localId: string): string {
  const raw = `arastirma-${fold(agent)}-${localId}`;
  return raw.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}

function issueIdFor(brandId: string, researchId: string): string {
  return researchId.startsWith(`${brandId}-`) ? researchId : `${brandId}-${researchId}`;
}

function scopeKey(issue: Issue): string {
  return issue.appliesTo
    .map((s) =>
      [s.generationIds.join('+'), s.engineIds.join('+'), s.engineFamilies.join('+'), s.transmissions.map((t) => t.name ?? t.type).join('+')].join(
        '|',
      ),
    )
    .sort()
    .join('||');
}

function engineTokens(issue: Issue, byId: Map<string, Engine>): Set<string> {
  const tokens = new Set<string>();
  for (const selector of issue.appliesTo) {
    for (const family of selector.engineFamilies) tokens.add(`family:${fold(family)}`);
    for (const id of selector.engineIds) {
      tokens.add(`id:${id}`);
      const family = byId.get(id)?.family;
      if (family) tokens.add(`family:${fold(family)}`);
    }
  }
  return tokens;
}

function overlaps(a: Issue, b: Issue, byId: Map<string, Engine>): boolean {
  if (a.brandId !== b.brandId || a.category !== b.category) return false;
  const gens = (issue: Issue) => new Set(issue.appliesTo.flatMap((s) => s.generationIds));
  const ga = gens(a);
  const gb = gens(b);
  if (ga.size && gb.size && ![...ga].some((id) => gb.has(id))) return false;
  const ea = engineTokens(a, byId);
  const eb = engineTokens(b, byId);
  if (ea.size && eb.size && ![...ea].some((token) => eb.has(token))) return false;
  return true;
}

function sameText(a: Issue, b: Issue): boolean {
  return fold(a.title) === fold(b.title) && a.summary === b.summary && a.frequencyRating === b.frequencyRating && scopeKey(a) === scopeKey(b);
}

function toSources(bundle: ResearchBundle, issue: ResearchIssue, existing: IssueSource[]): { sources: IssueSource[]; ids: string[]; reason?: string } {
  const byLocal = new Map(bundle.sources.map((s) => [s.id, s]));
  const sources: IssueSource[] = [];
  const ids: string[] = [];
  for (const localId of issue.sourceIds) {
    const source = byLocal.get(localId);
    if (!source) return { sources: [], ids: [], reason: `kaynak yok: ${localId}` };
    if (!source.reviewed) return { sources: [], ids: [], reason: `kaynak okunmadan işaretlenmiş: ${localId}` };
    const reused = existing.find((s) => s.url === source.url);
    const id = reused?.id ?? slugSource(bundle.agent, source.id);
    ids.push(id);
    if (reused) continue;
    sources.push(
      issueSourceSchema.parse({
        id,
        kind: source.kind,
        title: source.title,
        url: source.url,
        publisher: source.publisher,
        publishedAt: source.publishedAt,
        accessedAt: bundle.researchedAt,
        language: 'und',
        notes: source.note,
        basedOn: source.basedOn,
        review: { status: 'content-checked', checkedAt: bundle.researchedAt, method: source.reviewMethod },
        demo: false,
      }),
    );
  }
  return { sources, ids };
}

function buildIssue(bundle: ResearchBundle, research: ResearchIssue, catalog: CatalogData, byId: Map<string, Engine>, sourceIds: string[]): { issue?: Issue; reason?: string } {
  const brands = new Set<string>();
  const selectors = [];
  const skipped: string[] = [];
  const declaredModels = new Set(bundle.models.map((model) => fold(model)));
  for (const vehicle of research.vehicles) {
    if (!declaredModels.has(fold(vehicle.model))) return { reason: `${vehicle.model} dosyanın model kapsamının dışında` };
    const brandId = brandIdOf(catalog, vehicle.brand);
    if (brandId) brands.add(brandId);
    const resolved = resolveVehicle(vehicle, catalog, byId, research.category);
    if (!resolved.selector) return { reason: resolved.reason };
    skipped.push(...(resolved.skipped ?? []));
    selectors.push(resolved.selector);
  }
  if (brands.size !== 1) return { reason: 'bir kayıt tek markaya bağlanmalı' };
  const brandId = [...brands][0];
  const declared = new Set(bundle.brands.map((b) => brandIdOf(catalog, b) ?? fold(b)));
  if (!declared.has(brandId)) return { reason: 'kayıt, dosyanın marka kapsamının dışında' };
  const linked = research.sourceIds.flatMap((id) => {
    const source = bundle.sources.find((item) => item.id === id);
    return source ? [source] : [];
  });
  const userOnly = linked.every((source) => source.kind === 'user-report');
  const publishers = new Set(
    linked
      .filter((source) => source.kind === 'technical-publication' || source.kind === 'reliability-survey' || source.kind === 'expert-service')
      .map((source) => source.basedOn ?? source.publisher ?? source.id),
  );
  let status: Issue['status'] = 'supported';
  let evidence: Issue['prevalence']['evidence'] = 'isolated-reports';
  let kind: Issue['kind'] = 'known-defect';
  if (research.frequency === 'unknown' || userOnly) {
    status = 'researching';
    evidence = research.frequency === 'unknown' ? 'unknown' : 'isolated-reports';
    kind = 'known-defect';
  } else if (publishers.size >= 2) {
    status = 'verified';
    evidence = 'repeated-reports';
    kind = 'chronic';
  } else if (linked.some((source) => source.kind === 'expert-service')) {
    evidence = 'expert-observed';
    kind = 'chronic';
  }
  if (research.frequency === 'high' && (evidence === 'unknown' || evidence === 'isolated-reports')) {
    return { reason: 'yüksek yaygınlık, zayıf kanıtla aktarılmadı' };
  }
  const id = issueIdFor(brandId, research.id);
  const issue = issueSchema.parse({
    id,
    slug: id,
    brandId,
    kind,
    category: research.category,
    title: research.title,
    summary: research.summary,
    symptoms: [research.summary.split(/(?<=\.)\s/)[0] ?? research.summary],
    appliesTo: selectors,
    prevalence: {
      evidence,
      note: research.frequencyRationale,
      sourceIds: evidence === 'unknown' ? [] : sourceIds,
    },
    frequencyRating: research.frequency,
    researchRef: { schema: RESEARCH_SCHEMA_ID, agent: bundle.agent, id: research.id },
    claims: sourceIds.map((sourceId) => ({ sourceId, aspects: ['existence', 'prevalence'], stance: 'supports' as const })),
    status,
    updatedAt: bundle.researchedAt,
    notes: [research.frequencyRationale, research.uncertainties, skipped.length ? `Şanzımanı doğrulanamayan motorlar alınmadı: ${skipped.join(', ')}` : '']
      .filter(Boolean)
      .join(' '),
    demo: false,
  });
  return { issue };
}

export function planResearchImport(input: {
  files: { file: string; data: unknown }[];
  catalog: CatalogData;
  issues: Issue[];
  sources: IssueSource[];
}): PlannedChange[] {
  const plans: PlannedChange[] = [];
  const accepted: Issue[] = [...input.issues];
  const knownSources = [...input.sources];
  const byId = new Map(input.catalog.engines.map((e) => [e.id, e]));

  for (const file of input.files) {
    const parsed = researchBundleSchema.safeParse(file.data);
    if (!parsed.success) {
      plans.push({
        file: file.file,
        researchId: '-',
        decision: 'invalid',
        reason: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      continue;
    }
    const bundle = parsed.data;
    for (const research of bundle.issues) {
      const base = { file: file.file, researchId: research.id };
      if (research.example) {
        plans.push({ ...base, decision: 'review', reason: 'örnek kayıt aktarılmaz' });
        continue;
      }
      const prior = accepted.find((issue) => issue?.researchRef?.agent === bundle.agent && issue.researchRef.id === research.id);
      const sourced = toSources(bundle, research, knownSources);
      if (sourced.reason) {
        plans.push({ ...base, decision: 'review', reason: sourced.reason });
        continue;
      }
      const built = buildIssue(bundle, research, input.catalog, byId, sourced.ids);
      if (!built.issue) {
        plans.push({ ...base, decision: 'review', reason: built.reason ?? 'eşleşmedi' });
        continue;
      }
      const errors = validateIssues([built.issue], [...knownSources, ...sourced.sources], input.catalog, 'live');
      if (errors.length) {
        plans.push({ ...base, decision: 'invalid', reason: errors.join(' | ') });
        continue;
      }
      if (prior) {
        plans.push({
          ...base,
          decision: sameText(prior, built.issue) ? 'duplicate' : 'review',
          reason: sameText(prior, built.issue) ? 'aynı araştırma kaydı daha önce aktarıldı' : 'doğrulanmış kayıtla çelişiyor; eski kayıt korundu',
        });
        continue;
      }
      const clash = accepted.find((issue) => overlaps(issue, built.issue!, byId));
      if (clash) {
        plans.push({
          ...base,
          decision: fold(clash.title) === fold(built.issue.title) ? 'duplicate' : 'review',
          reason: `mevcut kayıtla örtüşüyor: ${clash.id}`,
        });
        continue;
      }
      const model = input.catalog.models.find((m) => m.id === built.issue!.appliesTo[0].modelIds[0]);
      plans.push({
        ...base,
        decision: 'import',
        reason: built.issue.appliesTo.map((s) => s.engineIds.join(', ')).join(' + '),
        issue: built.issue,
        sources: sourced.sources,
        targetFile: `${built.issue.brandId}/${model?.slug ?? 'genel'}.json`,
      });
      accepted.push(built.issue);
      knownSources.push(...sourced.sources);
    }
  }
  return plans;
}

export function applyResearchPlan(plans: PlannedChange[], issuesRoot: string, sourcesPath: string): { issues: number; sources: number } {
  const imports = plans.filter((p) => p.decision === 'import' && p.issue);
  const newSources = new Map<string, IssueSource>();
  for (const plan of imports) for (const source of plan.sources ?? []) newSources.set(source.id, source);
  if (newSources.size) appendJsonArray(sourcesPath, [...newSources.values()]);
  const byFile = new Map<string, Issue[]>();
  for (const plan of imports) {
    const path = plan.targetFile ?? 'genel/genel.json';
    const list = byFile.get(path) ?? [];
    list.push(plan.issue!);
    byFile.set(path, list);
  }
  for (const [rel, issues] of byFile) appendJsonArray(join(issuesRoot, rel), issues);
  return { issues: imports.length, sources: newSources.size };
}

function appendJsonArray(path: string, items: unknown[]): void {
  if (items.length === 0) return;
  mkdirSync(dirname(path), { recursive: true });
  const block = items.map((item) => JSON.stringify(item, null, 2).replace(/^/gm, '  ')).join(',\n');
  let next: string;
  try {
    const raw = readFileSync(path, 'utf8');
    const end = raw.lastIndexOf(']');
    const before = raw.slice(0, end).trimEnd();
    const comma = before.endsWith('[') ? '\n' : ',\n';
    next = `${before}${comma}${block}\n]\n`;
  } catch {
    next = `[\n${block}\n]\n`;
  }
  writeFileSync(path, next);
}

export function readResearchJson(path: string): { file: string; data: unknown } {
  try {
    return { file: path, data: JSON.parse(readFileSync(path, 'utf8')) as unknown };
  } catch (error) {
    return { file: path, data: { schema: 'invalid-json', error: error instanceof Error ? error.message : 'okunamadı' } };
  }
}
