/**
 * Kayıtlar arası bütünlük denetimi. Zod tek tek kayıtların biçimini doğrular;
 * burada ilişkiler (referanslar, benzersizlik, dönem tutarlılığı, kaynak kuralları)
 * denetlenir. Herhangi bir hata build'i durdurur.
 */
import type { Brand, Engine, Market, Model, Period, Source, VerificationStatus, YearMonth } from './schema';

export interface CatalogData {
  brands: Brand[];
  markets: Market[];
  sources: Source[];
  engines: Engine[];
  models: Model[];
}

const toNumber = (ym: YearMonth) => ym.year * 100 + (ym.month ?? 0);

export function validateCatalog(data: CatalogData): string[] {
  const errors: string[] = [];
  const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);

  const brandIds = new Set(data.brands.map((b) => b.id));
  const marketIds = new Set(data.markets.map((m) => m.id));
  const sourcesById = new Map(data.sources.map((s) => [s.id, s]));
  const enginesById = new Map(data.engines.map((e) => [e.id, e]));

  // Tüm kimlikler katalog genelinde benzersiz olmalı (ileride URL ve harici referanslar için).
  const seen = new Map<string, string>();
  const claim = (id: string, where: string) => {
    const prev = seen.get(id);
    if (prev) err(where, `"${id}" kimliği zaten kullanılıyor (${prev})`);
    else seen.set(id, where);
  };

  const checkMeta = (where: string, r: { status: VerificationStatus; sourceIds: string[]; notes?: string | undefined }) => {
    for (const sid of r.sourceIds) if (!sourcesById.has(sid)) err(where, `bilinmeyen kaynak "${sid}"`);
    if (['verified', 'sourced', 'conflicting'].includes(r.status) && r.sourceIds.length === 0) {
      err(where, `"${r.status}" durumu en az bir kaynak gerektirir`);
    }
    if (r.status === 'verified' && !r.sourceIds.some((sid) => sourcesById.get(sid)?.tier === 'primary')) {
      err(where, '"verified" durumu en az bir birincil (primary) kaynak gerektirir');
    }
    if (r.status === 'conflicting' && !r.notes) err(where, 'çelişkili kayıtlar "notes" alanında açıklanmalı');
  };

  const checkPeriod = (where: string, p: Period) => {
    if (!marketIds.has(p.marketId)) err(where, `bilinmeyen pazar "${p.marketId}"`);
    if (p.end && toNumber(p.end) < toNumber(p.start)) err(where, 'dönem bitişi başlangıçtan önce');
  };

  const checkSlugsUnique = (where: string, items: { slug: string }[]) => {
    const slugs = new Set<string>();
    for (const { slug } of items) {
      if (slugs.has(slug)) err(where, `"${slug}" slug'ı tekrar ediyor`);
      slugs.add(slug);
    }
  };

  for (const b of data.brands) {
    claim(b.id, `brands/${b.id}`);
    checkMeta(`brands/${b.id}`, b);
  }
  checkSlugsUnique('brands', data.brands);
  for (const m of data.markets) claim(m.id, `markets/${m.id}`);
  for (const m of data.markets) if (m.parentId && !marketIds.has(m.parentId)) err(`markets/${m.id}`, `bilinmeyen üst pazar "${m.parentId}"`);
  for (const s of data.sources) claim(s.id, `sources/${s.id}`);

  for (const e of data.engines) {
    const where = `engines/${e.id}`;
    claim(e.id, where);
    if (!brandIds.has(e.brandId)) err(where, `bilinmeyen marka "${e.brandId}"`);
    checkMeta(where, e);
  }

  for (const brandId of brandIds) {
    checkSlugsUnique(`models (${brandId})`, data.models.filter((m) => m.brandId === brandId));
  }

  for (const model of data.models) {
    const mw = `models/${model.id}`;
    claim(model.id, mw);
    if (!brandIds.has(model.brandId)) err(mw, `bilinmeyen marka "${model.brandId}"`);
    checkMeta(mw, model);
    checkSlugsUnique(mw, model.generations);

    for (const gen of model.generations) {
      const gw = `${mw}/${gen.slug}`;
      claim(gen.id, gw);
      checkMeta(gw, gen);
      checkPeriod(`${gw} labelPeriod`, gen.labelPeriod);
      gen.periods.forEach((p, i) => checkPeriod(`${gw} periods[${i}]`, p));
      checkSlugsUnique(`${gw} revisions`, gen.revisions);
      checkSlugsUnique(`${gw} variants`, gen.variants);

      const revisionIds = new Set(gen.revisions.map((r) => r.id));
      for (const rev of gen.revisions) {
        const rw = `${gw}/${rev.slug}`;
        claim(rev.id, rw);
        checkMeta(rw, rev);
        rev.periods.forEach((p, i) => checkPeriod(`${rw} periods[${i}]`, p));
      }

      for (const v of gen.variants) {
        const vw = `${gw}/variants/${v.slug}`;
        claim(v.id, vw);
        checkMeta(vw, v);
        const engine = enginesById.get(v.engineId);
        if (!engine) err(vw, `bilinmeyen motor "${v.engineId}"`);
        else if (engine.brandId !== model.brandId) err(vw, `motor "${v.engineId}" başka markaya ait`);

        for (const rid of v.revisionIds) if (!revisionIds.has(rid)) err(vw, `"${rid}" bu neslin makyaj dönemi değil`);
        if (v.revisionMapping === 'unknown' && v.revisionIds.length > 0) {
          err(vw, 'revisionMapping "unknown" iken revisionIds boş olmalı');
        }
        if (v.revisionMapping !== 'unknown' && v.revisionIds.length === 0) {
          err(vw, `revisionMapping "${v.revisionMapping}" en az bir makyaj dönemi gerektirir`);
        }
        if (gen.revisions.length === 0 && v.revisionIds.length > 0) err(vw, 'makyaj dönemi olmayan nesilde revisionIds kullanılamaz');

        for (const t of v.transmissions) {
          for (const rid of t.revisionIds) {
            if (!v.revisionIds.includes(rid)) err(vw, `şanzıman dönemi "${rid}" varyantın dönemleri arasında değil`);
          }
        }
        for (const mid of v.marketIds) if (!marketIds.has(mid)) err(vw, `bilinmeyen pazar "${mid}"`);
        v.periods.forEach((p, i) => checkPeriod(`${vw} periods[${i}]`, p));
      }
    }
  }

  return errors;
}
