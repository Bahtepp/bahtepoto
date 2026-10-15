/**
 * Onaylanan staging adaylarını kataloğa yazar. Varsayılan KURU ÇALIŞTIRMA'dır: yalnızca
 * hangi dosyaların yazılacağını gösterir. Dosyaya yazmak için `write: true` gerekir.
 *
 * Yazmayı durduran durumlar:
 * - `import:check` hatası (birleştirilmiş katalog geçersizse hiçbir şey yazılmaz)
 * - Lisansı yayın için doğrulanmamış kaynak (`publishable: false`) → o dosya atlanır
 * - Yer tutucu (kaynağa dayanmayan) alan içeren aday → `acceptPlaceholders` olmadan atlanır
 * - Mevcut kaynaklı kayıtla çelişen kayıt → her zaman atlanır
 */
import { join } from 'node:path';
import { analyze, type Analysis, type AnalyzeOptions } from './analyze.ts';
import { loadRawCatalog, loadStaging, writeJson, type RawCatalog } from './io.ts';
import type { ImportDirs } from './paths.ts';

export interface PromoteOptions {
  write?: boolean;
  acceptPlaceholders?: boolean;
  /** Yalnızca bu bağdaştırıcının staging dosyaları. */
  only?: string;
}

export interface PromoteResult {
  analysis: Analysis;
  /** Yazılacak / yazılan dosyalar (katalog klasörüne göreli). */
  files: string[];
  written: boolean;
  /** Yazma neden yapılmadı (check hatası vb.). */
  blocked?: string;
}

/** Promote'un aday dosyası düzeyindeki kapısı; fark raporu da gerçek durumu bununla gösterir. */
export function promoteGate(options: Pick<PromoteOptions, 'acceptPlaceholders'> = {}): AnalyzeOptions['gate'] {
  return ({ file, changes }) => {
    if (!file.license.publishable) return 'kaynağın lisansı yayın için doğrulanmadı';
    if (!options.acceptPlaceholders && changes.some((c) => c.placeholders.length > 0 && c.kind !== 'unchanged')) {
      return 'aday dosyasında kaynağa dayanmayan yer tutucu alanlar var; insan onayı (--accept-placeholders) gerekli';
    }
    return undefined;
  };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function changedFiles(before: RawCatalog, after: RawCatalog): string[] {
  const files: string[] = [];
  if (!same(before.sources, after.sources)) files.push('sources.json');
  for (const [path, model] of after.models) if (!same(before.models.get(path), model)) files.push(path);
  return files;
}

export function promote(dirs: Pick<ImportDirs, 'catalogDir' | 'stagingDir'>, options: PromoteOptions = {}): PromoteResult {
  const raw = loadRawCatalog(dirs.catalogDir);
  const staging = loadStaging(dirs.stagingDir, options.only);

  // Önce her şey onaylanmış gibi denetle: staging'de hata varsa hiçbir şey yazılmaz.
  const check = analyze(raw, staging);
  if (check.errors.length > 0) {
    return { analysis: check, files: [], written: false, blocked: `import:check ${check.errors.length} hata buldu` };
  }

  const analysis = analyze(raw, staging, { gate: promoteGate(options) });
  if (analysis.errors.length > 0) {
    return { analysis, files: [], written: false, blocked: `birleştirilmiş katalog ${analysis.errors.length} hata içeriyor` };
  }

  const files = changedFiles(raw, analysis.merged);
  if (options.write) {
    for (const f of files) {
      writeJson(join(dirs.catalogDir, f), f === 'sources.json' ? analysis.merged.sources : analysis.merged.models.get(f));
    }
  }
  return { analysis, files, written: Boolean(options.write) && files.length > 0 };
}
