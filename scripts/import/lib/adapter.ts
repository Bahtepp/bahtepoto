/**
 * Kaynak bağdaştırıcısı (adapter) arayüzü. Her bağdaştırıcı yalnızca BİR kaynağı bilir:
 *
 *   fetch()     → ham veriyi `.cache/import/<kaynak>/<tarih>/` altına indirir (tekrar indirmez)
 *   normalize() → önbellekteki ham veriden aday kayıtlar (StagingFile) üretir; ağa çıkmaz
 *   license     → kaynak, lisans ve atıf bilgisi
 *
 * Bağdaştırıcılar tahmin üretmez: kaynakta olmayan alan aday kayda yazılmaz. Katalog şeması
 * bir alanı zorunlu tuttuğu hâlde kaynak vermiyorsa, alan `placeholder` olarak işaretlenir ve
 * insan onayı olmadan kataloğa aktarılamaz (bkz. promote).
 */
import type { License, StagingFile } from './staging-schema.ts';

export interface AdapterContext {
  /** Bu bağdaştırıcının bu çalıştırmadaki önbellek klasörü: `.cache/import/<id>/<retrievedAt>/` */
  cacheDir: string;
  /** Ham verinin alındığı gün (YYYY-AA-GG). Aday kayıtların `retrievedAt` ve `updatedAt` değeri. */
  retrievedAt: string;
  /** `true` ise önbellekte olsa bile yeniden indirir. */
  refresh?: boolean;
  log?: (message: string) => void;
}

export interface FetchResult {
  /** Önbelleğe yazılan / önbellekte bulunan dosyalar (önbellek klasörüne göreli). */
  files: string[];
  /** Ağdan indirilen dosya sayısı (önbellekten okunanlar hariç). */
  downloaded: number;
}

export interface SourceAdapter {
  /** Kaynak kimliği; staging klasör adı olarak da kullanılır (`data/staging/<id>/`). */
  id: string;
  license: License;
  fetch(ctx: AdapterContext): Promise<FetchResult>;
  /** Her öğe `data/staging/<id>/<name>.json` olarak yazılır. */
  normalize(ctx: AdapterContext): Promise<{ name: string; file: StagingFile }[]>;
}
