/**
 * Disk erişimi: canlı katalogu ve staging dosyalarını ham JSON olarak okur.
 * Ham biçim korunur (şema varsayılanları eklenmez); promote yalnızca değişen dosyaları yazar.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { stagingFileSchema, type StagingFile } from './staging-schema.ts';

export type Json = Record<string, unknown>;

export interface RawCatalog {
  brands: Json[];
  markets: Json[];
  sources: Json[];
  /** Dosya (engines/ altına göreli) → motor listesi */
  engines: Map<string, Json[]>;
  /** Dosya (katalog klasörüne göreli, `models/<marka>/<model>.json`) → model kaydı */
  models: Map<string, Json>;
}

export const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));

/** Katalog dosyalarıyla aynı biçim: 2 boşluk girinti, sonda satır sonu. */
export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const toPosix = (p: string) => p.split(sep).join('/');

export function listJsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => {
      const full = join(dir, e.name);
      if (e.isDirectory()) return listJsonFiles(full);
      return e.isFile() && e.name.endsWith('.json') ? [full] : [];
    })
    .sort();
}

export function loadRawCatalog(catalogDir: string): RawCatalog {
  const arr = (file: string) => readJson(join(catalogDir, file)) as Json[];
  const enginesDir = join(catalogDir, 'engines');
  return {
    brands: arr('brands.json'),
    markets: arr('markets.json'),
    sources: arr('sources.json'),
    engines: new Map(listJsonFiles(enginesDir).map((f) => [toPosix(relative(enginesDir, f)), readJson(f) as Json[]])),
    models: new Map(listJsonFiles(join(catalogDir, 'models')).map((f) => [toPosix(relative(catalogDir, f)), readJson(f) as Json])),
  };
}

export interface LoadedStagingFile {
  /** Staging klasörüne göreli yol, örn. `wikidata/volkswagen-golf.json` */
  path: string;
  file?: StagingFile;
  /** Şema hataları (dosya okunamadıysa veya biçim yanlışsa). */
  errors: string[];
}

export function loadStaging(stagingDir: string, only?: string): LoadedStagingFile[] {
  return listJsonFiles(stagingDir)
    .map((full) => ({ full, path: toPosix(relative(stagingDir, full)) }))
    .filter(({ path }) => !only || path.startsWith(`${only}/`))
    .map(({ full, path }): LoadedStagingFile | undefined => {
      let raw: unknown;
      try {
        raw = readJson(full);
      } catch (e) {
        return { path, errors: [`${path}: JSON okunamadı (${(e as Error).message})`] };
      }
      // Kayıt listesi biçimindeki raporlar (örn. tsb/belirsiz.json) aday dosyası değildir.
      if (Array.isArray(raw)) return undefined;
      const parsed = stagingFileSchema.safeParse(raw);
      if (!parsed.success) {
        return { path, errors: parsed.error.issues.map((i) => `${path}: ${i.path.join('.') || '(kök)'}: ${i.message}`) };
      }
      const folder = path.split('/')[0];
      const errors = parsed.data.adapter === folder ? [] : [`${path}: "adapter" (${parsed.data.adapter}) klasör adıyla (${folder}) aynı olmalı`];
      return { path, file: parsed.data, errors };
    })
    .filter((x): x is LoadedStagingFile => x !== undefined);
}
