/**
 * `npm run import:promote [-- --only <kaynak>] [--write] [--accept-placeholders]`
 * Varsayılan KURU ÇALIŞTIRMA: yalnızca neyin yazılacağını gösterir. `--write` verilmeden
 * `src/data/catalog` değişmez. Ayrıntılar: lib/promote.ts
 */
import { parseArgs } from 'node:util';
import { DEFAULT_DIRS } from './lib/paths.ts';
import { promote } from './lib/promote.ts';

const { values } = parseArgs({
  options: { only: { type: 'string' }, write: { type: 'boolean' }, 'accept-placeholders': { type: 'boolean' } },
});
const r = promote(DEFAULT_DIRS, { only: values.only, write: values.write, acceptPlaceholders: values['accept-placeholders'] });

for (const e of r.analysis.errors) console.error(`  HATA: ${e}`);
if (r.blocked) {
  console.error(`promote durduruldu: ${r.blocked}. Hiçbir dosya yazılmadı.`);
  process.exitCode = 1;
} else {
  for (const c of r.analysis.changes.filter((x) => x.kind !== 'unchanged')) {
    console.log(`  ${c.applied ? '+' : '-'} ${c.recordType} ${c.id} (${c.kind})${c.applied ? '' : `: ${c.skipReason}`}`);
  }
  if (r.files.length === 0) console.log('Yazılacak dosya yok.');
  else if (r.written) console.log(`Yazıldı (src/data/catalog): ${r.files.join(', ')}`);
  else console.log(`KURU ÇALIŞTIRMA — yazılacak dosyalar: ${r.files.join(', ')}\nYazmak için: npm run import:promote -- --write`);
}
