/**
 * Kronik sorun kayıtlarının bütünlük ve KANIT kuralları.
 * Zod tek tek kayıtların biçimini denetler; burada kaynak düzeyleri ile iddialar arasındaki
 * kurallar ve katalog referansları denetlenir. Hatalar build'i durdurur.
 *
 * Yalnızca tip import eder; `node --test` ile doğrudan test edilebilir.
 */
import type { CatalogData } from '../catalog/validate';
import type { Applicability, Issue, IssueSource, IssueSourceKind } from './schema';

export type IssueDataset = 'live' | 'demo';

const STRONG_OFFICIAL: IssueSourceKind[] = ['manufacturer-bulletin', 'official-recall'];
const INDEPENDENT_EXPERT: IssueSourceKind[] = ['technical-publication', 'reliability-survey', 'expert-service'];

export function validateIssues(issues: Issue[], sources: IssueSource[], catalog: CatalogData, dataset: IssueDataset): string[] {
  const errors: string[] = [];
  const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);

  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const brandIds = new Set(catalog.brands.map((b) => b.id));
  const modelById = new Map(catalog.models.map((m) => [m.id, m]));
  const genOwner = new Map<string, string>(); // generationId → modelId
  const revOwner = new Map<string, string>(); // revisionId → generationId
  for (const m of catalog.models) {
    for (const g of m.generations) {
      genOwner.set(g.id, m.id);
      for (const r of g.revisions) revOwner.set(r.id, g.id);
    }
  }
  const engineIds = new Set(catalog.engines.map((e) => e.id));
  const marketIds = new Set(catalog.markets.map((m) => m.id));

  for (const s of sources) {
    if (dataset === 'live' && s.demo) err(`issue-sources/${s.id}`, 'örnek (demo) kaynak canlı veriye karışamaz');
    if (dataset === 'demo' && !s.demo) err(`demo-issue-sources/${s.id}`, 'örnek veri kaynağı "demo": true olmalı');
    if (s.marketId && !marketIds.has(s.marketId)) err(`issue-sources/${s.id}`, `bilinmeyen pazar "${s.marketId}"`);
  }

  const allIssueIds = new Set(issues.map((i) => i.id));
  const ids = new Set<string>();
  const checkSelector = (where: string, s: Applicability) => {
    for (const id of s.modelIds) {
      const model = modelById.get(id);
      if (!model) err(where, `bilinmeyen model "${id}"`);
    }
    for (const id of s.generationIds) {
      const owner = genOwner.get(id);
      if (!owner) err(where, `bilinmeyen nesil "${id}"`);
      else if (s.modelIds.length && !s.modelIds.includes(owner)) err(where, `nesil "${id}" listelenen modellere ait değil`);
    }
    for (const id of s.revisionIds) {
      const owner = revOwner.get(id);
      if (!owner) err(where, `bilinmeyen makyaj dönemi "${id}"`);
      else if (s.generationIds.length && !s.generationIds.includes(owner)) {
        err(where, `makyaj dönemi "${id}" listelenen nesillere ait değil`);
      }
    }
    for (const id of s.engineIds) if (!engineIds.has(id)) err(where, `bilinmeyen motor "${id}"`);
    for (const id of s.marketIds) if (!marketIds.has(id)) err(where, `bilinmeyen pazar "${id}"`);
    if (s.years?.marketId && !marketIds.has(s.years.marketId)) err(where, `bilinmeyen pazar "${s.years.marketId}"`);
  };

  for (const issue of issues) {
    const w = `${dataset === 'demo' ? 'demo-issues' : 'issues'}/${issue.id}`;
    if (ids.has(issue.id)) err(w, 'kimlik tekrar ediyor');
    ids.add(issue.id);

    if (dataset === 'live' && issue.demo) err(w, 'örnek (demo) kayıt canlı veriye karışamaz');
    if (dataset === 'demo' && !issue.demo) err(w, 'örnek kayıt "demo": true olmalı');
    if (!brandIds.has(issue.brandId)) err(w, `bilinmeyen marka "${issue.brandId}"`);

    issue.appliesTo.forEach((s, i) => checkSelector(`${w} appliesTo[${i}]`, s));
    issue.excludes.forEach((s, i) => checkSelector(`${w} excludes[${i}]`, s));

    // Kaynak referansları
    const allRefs = [
      ...issue.claims.map((c) => c.sourceId),
      ...(issue.severity?.sourceIds ?? []),
      ...issue.prevalence.sourceIds,
      ...issue.remedies.flatMap((r) => r.sourceIds),
    ];
    for (const id of allRefs) if (!sourceById.has(id)) err(w, `bilinmeyen kaynak "${id}"`);
    const kindOf = (id: string) => sourceById.get(id)?.kind;
    const claimedIds = new Set(issue.claims.map((c) => c.sourceId));
    for (const id of allRefs) if (!claimedIds.has(id)) err(w, `kaynak "${id}" "claims" listesinde de yer almalı`);

    // Varlık iddiasını destekleyen kaynaklar
    const existence = issue.claims.filter((c) => c.stance === 'supports' && c.aspects.includes('existence'));
    const existenceKinds = existence.map((c) => kindOf(c.sourceId)).filter(Boolean) as IssueSourceKind[];
    const contradicts = issue.claims.some((c) => c.stance === 'contradicts');

    if (contradicts && (issue.status === 'verified' || issue.status === 'supported')) {
      err(w, 'çürütücü kaynak varken durum "disputed" veya "researching" olmalı');
    }

    if (issue.status === 'verified') {
      const official = existenceKinds.some((k) => STRONG_OFFICIAL.includes(k));
      // Aynı habere/açıklamaya dayanan kaynaklar (basedOn) ve aynı yayıncı tek sayılır.
      const expertPublishers = new Set(
        existence
          .filter((c) => INDEPENDENT_EXPERT.includes(kindOf(c.sourceId)!))
          .map((c) => {
            const src = sourceById.get(c.sourceId);
            return src?.basedOn ?? src?.publisher ?? c.sourceId;
          }),
      );
      if (!official && expertPublishers.size < 2) {
        err(w, '"verified" için üretici bülteni / resmi geri çağırma ya da en az iki bağımsız uzman/teknik kaynak gerekli');
      }
    }
    if (issue.status === 'verified' || issue.status === 'supported') {
      if (!existenceKinds.some((k) => k !== 'user-report')) {
        err(w, 'yalnızca kullanıcı raporlarına dayanan kayıt "researching" durumunda olmalı');
      }
    }

    // Canlı veride kaynak içeriğinin gerçekten okunmuş olması
    if (dataset === 'live' && (issue.status === 'verified' || issue.status === 'supported')) {
      const checked = existence.some((c) => sourceById.get(c.sourceId)?.review?.status === 'content-checked');
      if (!checked) err(w, `"${issue.status}" için varlık iddiasını destekleyen en az bir kaynağın içeriği kontrol edilmiş olmalı (review.status: "content-checked")`);
    }

    // Geri çağırma kaydı yalnızca resmi kayıtla
    if (issue.kind === 'recall' && !existenceKinds.includes('official-recall')) {
      err(w, '"recall" türü resmi geri çağırma kaynağı gerektirir');
    }
    if ((issue.kind === 'recall' || issue.kind === 'service-campaign') && !issue.recall) {
      err(w, `"${issue.kind}" türü "recall" bilgisi (kampanya, üretim tarihleri, VIN kapsamı) gerektirir`);
    }
    if (issue.recall) {
      const r = issue.recall;
      if (r.productionFrom && r.productionTo && r.productionTo < r.productionFrom) err(w, 'recall.productionTo, productionFrom tarihinden önce');
      for (const rid of r.relatedIssueIds) {
        if (rid === issue.id) err(w, 'kayıt kendisiyle ilişkilendirilemez');
        else if (!allIssueIds.has(rid)) err(w, `ilişkili kayıt "${rid}" bulunamadı`);
      }
      // Seçicideki yıl aralığı, kampanyanın üretim tarihlerini aşamaz (kapsamı genişletmeme kuralı).
      const fromY = r.productionFrom ? Number(r.productionFrom.slice(0, 4)) : undefined;
      const toY = r.productionTo ? Number(r.productionTo.slice(0, 4)) : undefined;
      issue.appliesTo.forEach((s, i) => {
        if (!s.years || s.years.basis !== 'production') return;
        if ((fromY !== undefined && s.years.from < fromY) || (toY !== undefined && s.years.to > toY)) {
          err(w, `appliesTo[${i}].years (${s.years.from}–${s.years.to}) kampanyanın üretim tarihlerini aşıyor`);
        }
      });
    }
    if (issue.kind === 'service-campaign' && !existenceKinds.includes('manufacturer-bulletin')) {
      err(w, '"service-campaign" türü üretici bülteni gerektirir');
    }

    // Görülme sıklığı kanıtı ↔ kaynak türü
    const pKinds = issue.prevalence.sourceIds.map(kindOf).filter(Boolean) as IssueSourceKind[];
    const ev = issue.prevalence.evidence;
    if (ev !== 'unknown' && pKinds.length === 0) err(w, `görülme sıklığı kanıtı "${ev}" kaynak gerektirir`);
    if (pKinds.includes('official-recall') && ev !== 'unknown') {
      // Bir geri çağırma, sorunun var olduğunu gösterir; ne kadar sık görüldüğünü göstermez.
      const others = pKinds.filter((k) => k !== 'official-recall');
      if (others.length === 0) err(w, 'geri çağırma kaydı tek başına görülme sıklığı kanıtı değildir');
    }
    if (ev === 'repeated-reports' && issue.prevalence.sourceIds.length < 2) err(w, '"repeated-reports" en az iki bağımsız kaynak gerektirir');
    if (ev === 'expert-observed' && !pKinds.includes('expert-service')) err(w, '"expert-observed" uzman servis kaynağı gerektirir');
    if (ev === 'survey-supported' && !pKinds.includes('reliability-survey')) err(w, '"survey-supported" güvenilirlik araştırması gerektirir');
    if (ev === 'manufacturer-acknowledged' && !pKinds.includes('manufacturer-bulletin')) {
      err(w, '"manufacturer-acknowledged" üretici teknik bülteni gerektirir (geri çağırma yeterli değildir)');
    }

    // "Kronik" iddiası tekrar kanıtı ister
    if (issue.kind === 'chronic' && (issue.status === 'verified' || issue.status === 'supported')) {
      if (ev === 'unknown' || ev === 'isolated-reports') {
        err(w, '"chronic" türü için tekrarlama kanıtı (repeated-reports veya üstü) gerekli; aksi halde "known-defect" ya da "researching" kullanın');
      }
    }
  }

  return errors;
}
