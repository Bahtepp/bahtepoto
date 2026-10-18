/**
 * `npm run issues:import -- --input <klasör>`
 * Varsayılan dry-run'dır. Dosyaya yazmak için `--apply` gerekir.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'astro/zod';
import { brandSchema, engineSchema, marketSchema, modelSchema, sourceSchema } from '../../src/lib/catalog/schema.ts';
import { applyResearchPlan, planResearchImport, readResearchJson } from '../../src/lib/issues/import-research.ts';
import { issueSchema, issueSourceSchema } from '../../src/lib/issues/schema.ts';

const { values } = parseArgs({
  options: {
    input: { type: 'string' },
    apply: { type: 'boolean', default: false },
  },
});

if (!values.input) {
  console.error('Kullanım: npm run issues:import -- --input <klasör> [--apply]');
  process.exitCode = 1;
} else {
  const root = join(import.meta.dirname, '../..');
  const data = join(root, 'src', 'data');
  const read = (path: string) => JSON.parse(readFileSync(join(data, path), 'utf8')) as unknown;
  const list = (dir: string): string[] =>
    readdirSync(join(data, dir), { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? list(join(dir, entry.name)) : entry.name.endsWith('.json') ? [join(dir, entry.name)] : [],
    );
  const catalog = {
    brands: z.array(brandSchema).parse(read('catalog/brands.json')),
    markets: z.array(marketSchema).parse(read('catalog/markets.json')),
    sources: z.array(sourceSchema).parse(read('catalog/sources.json')),
    engines: list('catalog/engines').flatMap((file) => z.array(engineSchema).parse(read(file))),
    models: list('catalog/models').map((file) => modelSchema.parse(read(file))),
  };
  const issues = list('issues/records').flatMap((file) => z.array(issueSchema).parse(read(file)));
  const sources = z.array(issueSourceSchema).parse(read('issues/sources.json'));
  const inputPath = join(root, values.input);
  const files = readdirSync(inputPath, { withFileTypes: true }).flatMap((entry) => {
    const path = join(inputPath, entry.name);
    if (entry.isDirectory()) {
      return readdirSync(path)
        .filter((name) => name.endsWith('.json'))
        .map((name) => join(path, name));
    }
    return entry.name.endsWith('.json') ? [path] : [];
  });
  const plans = planResearchImport({
    files: files.map((file) => readResearchJson(file)),
    catalog,
    issues,
    sources,
  });
  const count = (decision: string) => plans.filter((plan) => plan.decision === decision).length;
  console.log(values.apply ? 'Aktarım (--apply)' : 'Dry-run (dosya yazılmadı)');
  console.log(
    `Aktarılacak: ${count('import')} · Zaten vardı: ${count('duplicate')} · İnceleme: ${count('review')} · Geçersiz: ${count('invalid')}`,
  );
  for (const plan of plans) {
    console.log(`  ${plan.decision}\t${plan.researchId}\t${plan.reason}`);
  }
  if (values.apply) {
    const written = applyResearchPlan(plans, join(data, 'issues', 'records'), join(data, 'issues', 'sources.json'));
    console.log(`Yazılan kayıt: ${written.issues} · Yazılan kaynak: ${written.sources}`);
  }
  if (count('invalid') > 0) process.exitCode = 1;
}
