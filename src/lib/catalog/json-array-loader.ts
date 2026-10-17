/**
 * Bir klasördeki tüm `*.json` dosyalarını okuyan, her dosyanın bir kayıt DİZİSİ
 * içerdiği Content Layer loader'ı. Örn. `engines/ford.json`, `engines/bmw.json`.
 *
 * Astro'nun `file()` loader'ı tek dosya, `glob()` loader'ı dosya başına tek kayıt
 * okur; motorlar gibi markaya göre bölünmüş listeler için bu küçük loader kullanılır.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Loader } from 'astro/loaders';

async function listJsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return listJsonFiles(full);
      return entry.isFile() && entry.name.endsWith('.json') ? [full] : [];
    }),
  );
  return nested.flat().sort();
}

export function jsonArrayDirLoader(dir: string): Loader {
  return {
    name: 'json-array-dir',
    load: async ({ config, store, parseData, generateDigest, logger, watcher }) => {
      const root = fileURLToPath(new URL(dir, config.root));
      const siteRoot = fileURLToPath(config.root);
      const relativeToSite = (file: string) => relative(siteRoot, file).replaceAll('\\', '/');

      const sync = async () => {
        store.clear();
        for (const file of await listJsonFiles(root)) {
          const rel = relative(root, file);
          const filePath = relativeToSite(file);
          const raw: unknown = JSON.parse(await readFile(file, 'utf-8'));
          if (!Array.isArray(raw)) {
            throw new Error(`${dir}/${rel}: dosya bir JSON dizisi olmalı`);
          }
          for (const item of raw as Record<string, unknown>[]) {
            const id = item.id;
            if (typeof id !== 'string') throw new Error(`${dir}/${rel}: her kaydın string "id" alanı olmalı`);
            if (store.has(id)) throw new Error(`${dir}/${rel}: "${id}" kimliği birden fazla kez tanımlı`);
            const data = await parseData({ id, data: item, filePath });
            store.set({ id, data, digest: generateDigest(item), filePath });
          }
        }
      };

      await sync();

      watcher?.add(root);
      watcher?.on('change', async (changed) => {
        if (!changed.startsWith(root)) return;
        logger.info(`Yeniden yükleniyor: ${relative(root, changed)}`);
        await sync();
      });
    },
  };
}
