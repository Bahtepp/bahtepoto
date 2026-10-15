/**
 * İçe aktarma hattının klasörleri. Komutlar her zaman depo köküne göre çalışır;
 * testler kendi geçici klasörlerini `ImportDirs` ile verir.
 */
import { join, resolve } from 'node:path';

export const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..');

export interface ImportDirs {
  /** Ham indirmeler (git dışı): `.cache/import/<kaynak>/<tarih>/` */
  cacheDir: string;
  /** Aday kayıtlar: `data/staging/<kaynak>/*.json` */
  stagingDir: string;
  /** Canlı katalog: `src/data/catalog/` */
  catalogDir: string;
}

export const DEFAULT_DIRS: ImportDirs = {
  cacheDir: join(REPO_ROOT, '.cache', 'import'),
  stagingDir: join(REPO_ROOT, 'data', 'staging'),
  catalogDir: join(REPO_ROOT, 'src', 'data', 'catalog'),
};

/** Bugünün tarihi (YYYY-AA-GG, UTC). Önbellek klasörü ve `retrievedAt` için. */
export const today = (): string => new Date().toISOString().slice(0, 10);
