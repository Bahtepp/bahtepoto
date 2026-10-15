/**
 * `npm run import:check [-- --only <kaynak>]`
 * Staging adaylarını şema, kanıt kuralları, katalog şemaları + validateCatalog ve çakışma
 * tespitinden geçirir. Hata varsa çıkış kodu 1.
 */
import { parseArgs } from 'node:util';
import { analyze } from './lib/analyze.ts';
import { loadRawCatalog, loadStaging } from './lib/io.ts';
import { DEFAULT_DIRS } from './lib/paths.ts';

const { values } = parseArgs({ options: { only: { type: 'string' } } });
const staging = loadStaging(DEFAULT_DIRS.stagingDir, values.only);
const a = analyze(loadRawCatalog(DEFAULT_DIRS.catalogDir), staging);

const count = (k: string) => a.changes.filter((c) => c.kind === k).length;
console.log(`Staging dosyası: ${staging.length}`);
console.log(`Yeni: ${count('new')} · Değişen: ${count('changed')} · Çelişen: ${count('conflicting')} · Değişmeyen: ${count('unchanged')}`);
for (const w of a.warnings) console.log(`  uyarı: ${w}`);
for (const e of a.errors) console.error(`  HATA: ${e}`);
if (a.errors.length > 0) {
  console.error(`import:check başarısız: ${a.errors.length} hata`);
  process.exitCode = 1;
} else console.log('import:check geçti.');
