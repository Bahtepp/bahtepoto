/**
 * `npm run catalog:tsb [-- --write] [--offline | --elle | --klasor <yol>] [--onayla-silme] [--refresh]`
 * `npm run import`          (= --write: indir + doğrula + birleştir + eşleştir + karşılaştır + yedekli yaz)
 * `npm run import -- --geri-al`  son başarılı aktarmayı geri alır
 *
 * Kaynak: TSB Kasko Değer Listesi (https://www.tsb.org.tr/tr/kasko-deger-listesi). Sayfanın
 * kendi "Dosyayı İndir" ve "Arşiv" düğmelerinin kullandığı herkese açık dosyalar indirilir:
 * en güncel liste + arşivden Ocak 2022 listesi (model yılı kapsamı 2008'e uzansın diye).
 * Fiyat değerleri kullanılmaz; yalnızca marka, tip adı, tip kodu ve listelendiği model yılları.
 *
 * Otomatik indirme mümkün değilse: TSB sayfasından indirilen xlsx dosyalarını `data/gelen/tsb/`
 * klasörüne bırakın ve `npm run import -- --elle` çalıştırın (başka klasör için `--klasor <yol>`).
 *
 * Güvenlik: kaynak alınamaz/bozuksa katalog okunmaz bile; TSB satırı veya model dosyası düşecekse ya da
 * elle girilmiş bir kayıt değişecekse yazılmaz ve `data/staging/tsb/FARK.md` yazılır. Yazım yedekli ve
 * günlüklüdür; yarıda kesilirse bir sonraki çalıştırma önceki kataloğu geri yükler.
 *
 * Çıktılar: data/staging/tsb/{RAPOR.md, belirsiz.json, EKSIKLER.md, FARK.md}, `--write` ile src/data/catalog/…
 */
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { rollbackLast } from '../lib/safe-write.ts';
import { DEFAULT_DIRS, REPO_ROOT, today } from '../lib/paths.ts';
import { backupRoot, runTsbImport } from './pipeline.ts';
import { SourceError } from './source.ts';

const { values } = parseArgs({
  options: {
    write: { type: 'boolean' },
    offline: { type: 'boolean' },
    elle: { type: 'boolean' },
    klasor: { type: 'string' },
    'onayla-silme': { type: 'boolean' },
    'geri-al': { type: 'boolean' },
    refresh: { type: 'boolean' },
    'without-generations': { type: 'boolean' },
  },
});

console.log('TSB Kasko Değer Listesi içe aktarma');
if (values['geri-al']) {
  const restored = rollbackLast(DEFAULT_DIRS.catalogDir, backupRoot(DEFAULT_DIRS));
  console.log(restored ? `Son aktarma geri alındı (${restored}).` : 'Geri alınacak yedek yok.');
  process.exit(0);
}

const inboxDir = values.klasor ?? (values.elle ? join(REPO_ROOT, 'data', 'gelen', 'tsb') : undefined);
try {
  const r = await runTsbImport({
    dirs: DEFAULT_DIRS,
    source: inboxDir ? 'inbox' : values.offline ? 'offline' : 'online',
    inboxDir,
    write: Boolean(values.write),
    allowDeletions: values['onayla-silme'],
    withoutGenerations: values['without-generations'],
    date: today(),
  });
  if (r.status === 'invalid') {
    console.error('Denetim hata buldu; katalog yazılmadı. Ayrıntı: data/staging/tsb/RAPOR.md');
    process.exitCode = 1;
  } else if (r.status === 'blocked') {
    for (const x of r.reasons) console.error(`  DURDURULDU: ${x}`);
    console.error('Katalog değiştirilmedi. Fark raporu: data/staging/tsb/FARK.md');
    process.exitCode = 1;
  } else if (r.status === 'written') {
    console.log(`Kataloğa yazıldı: ${r.written.length} dosya. Rapor: data/staging/tsb/RAPOR.md${r.backup ? ` · yedek: ${r.backup}` : ''}`);
  } else {
    console.log('KURU ÇALIŞTIRMA: katalog yazılmadı. Yazmak için: npm run catalog:update');
  }
} catch (e) {
  if (!(e instanceof SourceError)) throw e;
  console.error(`Kaynak alınamadı: ${e.message}`);
  console.error('Katalog değiştirilmedi. Çevrimdışı: npm run import -- --offline · Elle indirilen dosyalar: data/gelen/tsb/ + npm run import -- --elle');
  process.exitCode = 1;
}
