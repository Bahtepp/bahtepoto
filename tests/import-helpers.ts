/**
 * İçe aktarma testleri için geçici katalog ve staging klasörleri. Gerçek
 * `src/data/catalog` ve `data/staging` klasörlerine hiçbir zaman yazılmaz.
 */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeJson } from '../scripts/import/lib/io.ts';
import { leafPaths, type Provenance, type StagingFileInput } from '../scripts/import/lib/staging-schema.ts';

type Json = Record<string, unknown>;

export const gen = (slug: string, start: number, end: number | null, extra: Json = {}): Json => ({
  id: `volkswagen-golf-${slug}`,
  slug,
  name: `Golf ${slug.toUpperCase()}`,
  order: Number(slug.replace(/\D/g, '')) - 1,
  labelPeriod: { marketId: 'eu', basis: 'production', start: { year: start }, end: end === null ? null : { year: end } },
  status: 'unverified',
  sourceIds: ['wp-golf'],
  updatedAt: '2026-10-15',
  ...extra,
});

/** Geçici katalog: Volkswagen + Golf (Mk6 kaynaklı, Mk7 doğrulanmamış ve makyaj dönemli). */
export function makeCatalog(): string {
  const dir = mkdtempSync(join(tmpdir(), 'bahtepoto-catalog-'));
  writeJson(join(dir, 'brands.json'), [{ id: 'volkswagen', slug: 'volkswagen', name: 'Volkswagen', status: 'pending', updatedAt: '2026-10-15' }]);
  writeJson(join(dir, 'markets.json'), [{ id: 'eu', name: 'Avrupa', kind: 'region' }]);
  writeJson(join(dir, 'sources.json'), [
    { id: 'wp-golf', title: 'Volkswagen Golf', publisher: 'Wikipedia', tier: 'secondary', accessedAt: '2026-10-01' },
  ]);
  writeJson(join(dir, 'engines', 'volkswagen.json'), []);
  writeJson(join(dir, 'models', 'volkswagen', 'golf.json'), {
    id: 'volkswagen-golf',
    brandId: 'volkswagen',
    slug: 'golf',
    name: 'Golf',
    status: 'pending',
    updatedAt: '2026-10-15',
    generations: [
      gen('mk6', 2008, 2012, { status: 'sourced' }),
      gen('mk7', 2012, 2020, {
        revisions: [
          {
            id: 'volkswagen-golf-mk7-pre-facelift',
            slug: 'makyajsiz',
            name: 'Makyajsız',
            kind: 'pre-facelift',
            order: 0,
            status: 'pending',
            updatedAt: '2026-10-15',
          },
        ],
      }),
    ],
  });
  return dir;
}

/** Kaydın bütün yaprak alanları için `source` kökeni. */
export function provFor(record: Json, skip: string[] = [], sourceId = 'wp-golf'): Record<string, Provenance> {
  return Object.fromEntries(
    leafPaths(record, skip).map((p) => [p, { kind: 'source', sourceId, retrievedAt: '2026-10-15', sourceField: `test#${p}` } as Provenance]),
  );
}

/** Golf modeli adayı içeren staging dosyası. */
export function stagingFile(gens: Json[], opts: { adapter?: string; publishable?: boolean; provenance?: Record<string, Record<string, Provenance>> } = {}): StagingFileInput {
  const model = { id: 'volkswagen-golf', brandId: 'volkswagen', slug: 'golf', name: 'Golf', status: 'pending', sourceIds: ['wp-golf'], updatedAt: '2026-10-15', generations: gens };
  const provenance = opts.provenance ?? {
    'volkswagen-golf': provFor(model, ['generations']),
    ...Object.fromEntries(gens.map((g) => [String(g.id), provFor(g)])),
  };
  return {
    schemaVersion: 1,
    adapter: opts.adapter ?? 'test',
    retrievedAt: '2026-10-15',
    license: { name: 'Test', license: 'CC0 1.0', licenseUrl: 'https://example.org/cc0', attribution: 'Test', publishable: opts.publishable ?? true },
    sources: [],
    candidates: [{ kind: 'model', target: 'models/volkswagen/golf.json', record: model, provenance }],
  };
}

export function makeStaging(files: Record<string, unknown>): string {
  const dir = mkdtempSync(join(tmpdir(), 'bahtepoto-staging-'));
  for (const [path, content] of Object.entries(files)) writeJson(join(dir, path), content);
  return dir;
}
