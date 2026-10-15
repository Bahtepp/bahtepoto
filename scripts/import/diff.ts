/**
 * `npm run import:diff [-- --only <kaynak>] [--stdout]`
 * Her bağdaştırıcı için `data/staging/<kaynak>/FARK-RAPORU.md` yazar (yeni / değişen /
 * çelişen kayıtlar, alan bazında köken). Kataloğa dokunmaz.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { loadRawCatalog, loadStaging } from './lib/io.ts';
import { DEFAULT_DIRS } from './lib/paths.ts';
import { analyzeForReport, renderDiffReport } from './lib/report.ts';

const { values } = parseArgs({ options: { only: { type: 'string' }, stdout: { type: 'boolean' } } });
const staging = loadStaging(DEFAULT_DIRS.stagingDir, values.only);
const a = analyzeForReport(loadRawCatalog(DEFAULT_DIRS.catalogDir), staging);
const adapters = [...new Set(staging.map((s) => s.path.split('/')[0]!))];

if (adapters.length === 0) console.log('Staging boş; rapor üretilmedi.');
for (const adapter of adapters) {
  const md = renderDiffReport(a, adapter);
  if (values.stdout) console.log(md);
  else {
    const out = join(DEFAULT_DIRS.stagingDir, adapter, 'FARK-RAPORU.md');
    writeFileSync(out, md, 'utf8');
    console.log(`Yazıldı: ${out}`);
  }
}
if (a.errors.length > 0) {
  console.error(`Uyarı: ${a.errors.length} denetim hatası var (raporun "Hatalar" bölümüne bakın).`);
  process.exitCode = 1;
}
