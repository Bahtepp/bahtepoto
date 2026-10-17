/**
 * Kataloğa güvenli yazma: değişiklikler önce yedek klasöründe hazırlanır, eski dosyalar yedeklenir ve
 * yazım bir günlük dosyasıyla (`YARIM.json`) yapılır. Yazım yarıda kesilirse (hata veya süreç ölümü)
 * bir sonraki çalıştırma `recoverInterrupted` ile önceki tutarlı kataloğu geri yükler; son başarılı
 * aktarma `rollbackLast` ile açıkça geri alınabilir.
 *
 * Yedek düzeni: `<yedekKökü>/<zaman>/{yeni,eski}/<göreli yol>` + `<zaman>/manifest.json`.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** Bir dosya değişikliği: `content: null` dosyayı siler. */
export interface FileChange {
  rel: string;
  content: string | null;
}

interface Manifest {
  stamp: string;
  changes: { rel: string; existed: boolean; deleted: boolean }[];
}

const JOURNAL = 'YARIM.json';

const stampNow = () => new Date().toISOString().replace(/[:.]/g, '-');

function restore(dir: string, backupDir: string, m: Manifest): void {
  for (const c of m.changes) {
    const target = join(dir, c.rel);
    if (c.existed) {
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(join(backupDir, 'eski', c.rel), target);
    } else if (existsSync(target)) unlinkSync(target);
  }
}

export interface ApplyOptions {
  /** Testler için: n. dosyadan sonra hata fırlatır (yarıda kesilme benzetimi). */
  failAfter?: number;
  /** Testler için: hata yerine süreç ölümünü taklit eder (geri yükleme yapılmaz, günlük kalır). */
  crash?: boolean;
}

/**
 * Değişiklikleri uygular. Hata olursa eski dosyalar geri yüklenir ve hata yeniden fırlatılır.
 * Dönen değer yedek klasörüdür (değişiklik yoksa `undefined`).
 */
export function applyChanges(dir: string, backupRoot: string, changes: FileChange[], opts: ApplyOptions = {}): string | undefined {
  if (changes.length === 0) return undefined;
  if (existsSync(join(backupRoot, JOURNAL))) throw new Error(`Yarım kalmış bir yazım var (${join(backupRoot, JOURNAL)}); önce geri yükleyin.`);
  const stamp = stampNow();
  const backupDir = join(backupRoot, stamp);
  const manifest: Manifest = { stamp, changes: [] };
  // 1. Hazırlık: yeni içerikler ve eski dosyaların kopyası (katalog henüz değişmedi).
  for (const c of changes) {
    const target = join(dir, c.rel);
    const existed = existsSync(target);
    if (existed) {
      mkdirSync(dirname(join(backupDir, 'eski', c.rel)), { recursive: true });
      copyFileSync(target, join(backupDir, 'eski', c.rel));
    }
    if (c.content !== null) {
      mkdirSync(dirname(join(backupDir, 'yeni', c.rel)), { recursive: true });
      writeFileSync(join(backupDir, 'yeni', c.rel), c.content, 'utf8');
    }
    manifest.changes.push({ rel: c.rel, existed, deleted: c.content === null });
  }
  writeFileSync(join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  // 2. Günlük: bu dosya varken katalog tutarsız olabilir.
  writeFileSync(join(backupRoot, JOURNAL), JSON.stringify({ stamp }), 'utf8');
  // 3. Uygulama.
  let n = 0;
  try {
    for (const c of manifest.changes) {
      if (opts.failAfter !== undefined && n >= opts.failAfter) throw new Error('benzetilmiş kesinti');
      const target = join(dir, c.rel);
      if (c.deleted) {
        if (existsSync(target)) unlinkSync(target);
      } else {
        mkdirSync(dirname(target), { recursive: true });
        // Aynı birimde kopyala + yeniden adlandır: hedef dosya hiçbir an yarım yazılmış olmaz.
        const part = `${target}.yazim`;
        copyFileSync(join(backupDir, 'yeni', c.rel), part);
        renameSync(part, target);
      }
      n++;
    }
  } catch (e) {
    if (opts.crash) throw e;
    restore(dir, backupDir, manifest);
    rmSync(join(backupRoot, JOURNAL), { force: true });
    throw e;
  }
  rmSync(join(backupRoot, JOURNAL), { force: true });
  prune(backupRoot);
  return backupDir;
}

/** Yalnızca son KEEP yedek tutulur. */
const KEEP = 5;
function prune(backupRoot: string): void {
  const all = readdirSync(backupRoot).filter((d) => existsSync(join(backupRoot, d, 'manifest.json'))).sort((a, b) => a.replace(/^geri-alindi-/, '').localeCompare(b.replace(/^geri-alindi-/, '')));
  for (const d of all.slice(0, Math.max(0, all.length - KEEP))) rmSync(join(backupRoot, d), { recursive: true, force: true });
}

/** Yarım kalmış yazım varsa önceki kataloğu geri yükler; geri yüklendiyse yedek klasörünü döndürür. */
export function recoverInterrupted(dir: string, backupRoot: string): string | undefined {
  const journal = join(backupRoot, JOURNAL);
  if (!existsSync(journal)) return undefined;
  const { stamp } = JSON.parse(readFileSync(journal, 'utf8')) as { stamp: string };
  const backupDir = join(backupRoot, stamp);
  const manifest = JSON.parse(readFileSync(join(backupDir, 'manifest.json'), 'utf8')) as Manifest;
  restore(dir, backupDir, manifest);
  for (const c of manifest.changes) rmSync(`${join(dir, c.rel)}.yazim`, { force: true });
  rmSync(journal, { force: true });
  return backupDir;
}

/** Son başarılı yazımı geri alır (yedek klasörü kaldırılır ki ikinci çağrı bir öncekini geri alsın). */
export function rollbackLast(dir: string, backupRoot: string): string | undefined {
  if (existsSync(join(backupRoot, JOURNAL))) return recoverInterrupted(dir, backupRoot);
  const stamps = existsSync(backupRoot) ? readdirSync(backupRoot).filter((d) => !d.startsWith('geri-alindi-') && existsSync(join(backupRoot, d, 'manifest.json'))).sort() : [];
  const last = stamps.at(-1);
  if (!last) return undefined;
  const backupDir = join(backupRoot, last);
  restore(dir, backupDir, JSON.parse(readFileSync(join(backupDir, 'manifest.json'), 'utf8')) as Manifest);
  renameSync(backupDir, join(backupRoot, `geri-alindi-${last}`));
  return backupDir;
}
