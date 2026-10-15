/**
 * `npm run import:run -- <kaynak> [--refresh] [--offline]`
 * Bağdaştırıcıyı çalıştırır: ham veriyi `.cache/import/<kaynak>/<tarih>/` altına indirir
 * (önbellekte varsa indirmez) ve aday kayıtları `data/staging/<kaynak>/` altına yazar.
 * Kataloğa dokunmaz.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { ADAPTERS } from './adapters.ts';
import { writeJson } from './lib/io.ts';
import { DEFAULT_DIRS, today } from './lib/paths.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    refresh: { type: 'boolean' },
    /** Ağa çıkmadan en son önbellekten normalize eder. */
    offline: { type: 'boolean' },
    date: { type: 'string' },
  },
});
const id = positionals[0];
const adapter = ADAPTERS.find((a) => a.id === id);
if (!adapter) {
  console.error(`Kullanım: npm run import:run -- <kaynak>. Bilinen kaynaklar: ${ADAPTERS.map((a) => a.id).join(', ')}`);
  process.exit(1);
}

const base = join(DEFAULT_DIRS.cacheDir, adapter.id);
const latest = () => (existsSync(base) ? readdirSync(base).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().at(-1) : undefined);
const retrievedAt = values.date ?? (values.offline ? latest() : today());
if (!retrievedAt) {
  console.error(`Önbellekte ${adapter.id} verisi yok; --offline olmadan çalıştırın.`);
  process.exit(1);
}
const ctx = { cacheDir: join(base, retrievedAt), retrievedAt, refresh: values.refresh, log: (m: string) => console.log(`  ${m}`) };

if (!values.offline) {
  const f = await adapter.fetch(ctx);
  console.log(`${adapter.id}: ${f.files.length} ham dosya (${f.downloaded} indirildi) → ${ctx.cacheDir}`);
}
for (const { name, file } of await adapter.normalize(ctx)) {
  const out = join(DEFAULT_DIRS.stagingDir, adapter.id, `${name}.json`);
  writeJson(out, file);
  console.log(`Yazıldı: ${out} (${file.candidates.length} aday, ${file.skipped.length} atlanan)`);
}
console.log('Sonraki adım: npm run import:check && npm run import:diff');
