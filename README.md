# bahtepoto.com

bahtepoto.com web sitesinin kaynak kodu. Site **Astro + TypeScript** ile statik olarak üretilir. Test yayını GitHub Pages üzerindedir:

**https://bahtepp.github.io/bahtepoto/**

`bahtepoto.com` alan adı bu yayına bağlı değildir. DNS değiştirilmez. Hesaptaki `bahtepp.github.io` deposu bu projeden ayrıdır.

---

## Gereksinimler

| Araç | Sürüm | Not |
|---|---|---|
| Node.js | **22.12 veya üstü** (LTS) | Astro 7, Node 20'yi desteklemez. `.nvmrc` dosyasında belirtilmiştir. |
| npm | Node ile gelir | |
| Git | güncel | |

Kontrol: `node -v` ve `git --version`

## Kurulum ve çalıştırma

```bash
npm install        # bağımlılıkları kurar, package-lock.json oluşturur
npm run dev        # geliştirme sunucusu → http://localhost:4321
```

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusunu başlatır (http://localhost:4321) |
| `npm run check` | TypeScript ve `.astro` dosyalarında tip kontrolü yapar |
| `npm run build` | Tip kontrolü + üretim build'i (`dist/`) |
| `npm run preview` | Üretilen `dist/` çıktısını yerelde önizler |
| `npm test` | Kronik sorun eşleştirici ve kanıt kuralı testleri (Node yerleşik test aracı; Node 22.18+ gerekir) |

## Proje yapısı

```text
bahtepoto.com/
├── .github/workflows/pages.yml    # GitHub Pages yayını (push → main)
├── docs/VERI-EKLEME.md            # Katalog verisi ekleme rehberi
├── docs/KRONIK-SORUNLAR.md        # Kronik sorun şeması, eşleştirme ve kanıt kuralları
├── docs/FOCUS-DATA-AUDIT.md       # Ford Focus veri denetimi raporu (+ focus-data-audit.json)
├── docs/VERI-TOPLAMA-PLANI.md     # Kaynaklar, lisanslar, otomatik içe aktarma ve ölçek planı
├── public/                        # Olduğu gibi kopyalanan statik dosyalar (favicon vb.)
├── src/
│   ├── config/site.ts             # Site adı, URL, dil gibi tek kaynaklı ayarlar
│   ├── content.config.ts          # Content Collections: katalog + issues/issueSources + demoIssues/demoIssueSources
│   ├── data/catalog/              # Katalog verisi (JSON) — tek doğruluk kaynağı
│   │   ├── brands.json / markets.json / sources.json
│   │   ├── engines/<marka>.json   # Motor tanımları (markaya göre bölünmüş)
│   │   └── models/<marka>/<model>.json  # Nesil, makyaj dönemi, varyant
│   ├── data/issues/               # Kronik sorunlar — CANLI (katalogdan bağımsız)
│   ├── data/issues-demo/          # Kronik sorunlar — ÖRNEK, kurgusal (yalnızca /ornek/kronik-sorunlar/)
│   ├── lib/catalog/
│   │   ├── schema.ts              # Zod şemaları + TypeScript tipleri
│   │   ├── validate.ts            # Kayıtlar arası bütünlük denetimi (build'i durdurur)
│   │   ├── index.ts               # Veri erişim katmanı (yalnızca build/sunucu)
│   │   ├── payload.ts             # Tarayıcıya giden JSON parçalarının tipleri
│   │   ├── format.ts              # Türkçe etiket/biçim yardımcıları (sunucu + istemci)
│   │   └── json-array-loader.ts   # Klasördeki JSON dizilerini okuyan Content Layer loader'ı
│   ├── lib/issues/                # Kronik sorun şeması, eşleştirici, kanıt kuralları, etiketler
│   ├── lib/vehicle.ts             # Araç seçimi → detay sayfası rotaları ve eşleştirme bağlamı
│   ├── pages/
│   │   ├── index.astro            # Katalog gezgini (ana sayfa)
│   │   ├── arac/[...vehicle].astro  # Araç detay sayfası: /arac/ford/focus/mk2/makyajli/<motor>/
│   │   ├── ornek/kronik-sorunlar.astro  # Örnek veri sayfası (noindex)
│   │   └── data/                  # Statik JSON uç noktaları (parça parça yükleme)
│   │       ├── brands/[brand].json.ts         → /data/brands/ford.json
│   │       └── models/[brand]/[model].json.ts → /data/models/ford/focus.json
│   ├── components/catalog/CatalogExplorer.astro  # Gezgin iskeleti (marka listesi sunucuda)
│   ├── components/vehicle/        # Detay sayfası bölümleri: EngineSpecs, IssuesSection, IssueItem, VehicleSources
│   ├── scripts/catalog-explorer.ts  # Gezginin tarayıcı tarafı (bağımlılıksız TS)
│   ├── styles/global.css          # Tasarım token'ları (açık/koyu tema)
│   ├── styles/components.css      # Paylaşılan küçük bileşenler (rozet, durum, not)
│   ├── styles/catalog.css         # Gezgin stilleri
│   ├── styles/vehicle.css         # Detay sayfası ve kronik sorun listesi
│   ├── layouts/BaseLayout.astro   # Ortak HTML iskeleti ve temel <head> (SEO) ayarları
│   └── layouts/SiteLayout.astro   # Site başlığı ve alt bilgisiyle sayfa iskeleti
├── tests/                         # node --test testleri (gerçek katalog verisiyle)
├── astro.config.mjs               # Astro yapılandırması
├── tsconfig.json                  # TypeScript (strict) + "@/..." yol kısaltması
├── package.json
├── .editorconfig / .gitattributes / .gitignore / .nvmrc
└── README.md
```

## Otomobil kataloğu

Seçim hiyerarşisi: **Marka → Model → Motor/satış sürümü → Kasa → gerekirse güç**.

Kasa, motor seçilmeden önce zorunlu adım değildir. Yıl seçmek gerekmez; yıl aralığı kasa kartının yanında durur. Aynı motorun donanım, şanzıman ve yıl kopyaları tek kartta birleşir. ST, RS, GTI gibi performans sürümleri ayrı kalır. Doğrulanmamış makyaj dönemi ilk döneme bağlanmaz.

| Kavram | Nerede | Not |
|---|---|---|
| Brand | `brands.json` | `generationNaming`: Mk, şasi kodu (E46, W204) vb. |
| Model | `models/<marka>/<model>.json` | Model başına bir dosya |
| Generation | model dosyası içinde | `labelPeriod` zorunlu → nesil adı asla yılsız gösterilmez |
| Revision (makyaj) | nesil içinde | Yoksa boş; yapay ayrım eklenmez; birden fazla olabilir |
| Engine | `engines/<marka>.json` | Modelden bağımsız güç ünitesi tanımı |
| VehicleVariant | nesil içinde `variants` | Nesil × motor × makyaj dönemi × pazar × şanzıman |
| Market | `markets.json` | Dönemler pazar ve temel (üretim / model yılı / satış) ile tutulur |
| Source | `sources.json` | Birincil / ikincil / topluluk |

Her kayıtta benzersiz `id`, `slug`, doğrulama durumu (`status`), `sourceIds` ve `updatedAt` vardır.
Veri ekleme kuralları için: [docs/VERI-EKLEME.md](docs/VERI-EKLEME.md).

**Ölçeklenme:** Ana sayfa Türkiye markalarını ve hafif arama indeksini (`/data/search.json`) içerir.
Marka seçilince `/data/brands/<marka>.json`, model seçilince `/data/models/<marka>/<model>.json` indirilir.
Nadir markalar arşivdedir; kayıtlar silinmez.

## Araç detay sayfası ve kronik sorunlar

Kullanıcı yolu: **Marka → Model → Motor → Kasa → gerekirse güç → araç özeti**.
Detay sayfası (`/arac/<marka>/<model>/<nesil>/[<dönem>/]<varyant>/`) statik üretilir.
Makyaj dönemi doğrulanmamışsa seçim, dönem içermeyen adrese gider; eski dönem adresleri durur.

Bölümler: araç, motor özellikleri ve bilinen sorunlar. Ham sigorta satırı ve kaynak listesi gösterilmez.
Kasa yıllarının bir bölümü İngilizce Wikipedia olgularından gelir (CC BY-SA 4.0); bu atıf site altında durur.

Kronik sorunlar katalogdan bağımsız tutulur; şema, eşleştirme ve kanıt kuralları:
[docs/KRONIK-SORUNLAR.md](docs/KRONIK-SORUNLAR.md). Doğrulanmış kayıt yoksa sayfa "Henüz doğrulanmış
kronik sorun verisi bulunmuyor" der; "sorun yok" iddiasında bulunmaz.

## Teknik kararlar

| Karar | Gerekçe |
|---|---|
| **Astro 7, statik çıktı (`output: 'static'`)** | Sunucu gerektirmez; hızlı, güvenli ve SEO dostu. Tarayıcıya varsayılan olarak JavaScript gönderilmez. |
| **TypeScript `strict`** | Hataları geliştirme aşamasında yakalar. |
| **`@/` yol kısaltması** | `../../` zincirleri yerine `@/config/site` gibi okunaklı importlar. |
| **`trailingSlash: 'always'` + `build.format: 'directory'`** | `/sayfa/` biçiminde tek tip URL'ler; GitHub Pages ile uyumlu, yinelenen URL (SEO) sorununu önler. |
| **`site` ve `base`** | Yerelde kök dizin ve `https://bahtepoto.com`. `GITHUB_PAGES=true` iken site `https://bahtepp.github.io`, `base` `/bahtepoto`. |
| **Asgari bağımlılık** | Yalnızca `astro`, `@astrojs/check`, `typescript`, `@types/node` (yalnızca tip kontrolü). UI kütüphanesi yok; gezgin düz TypeScript. Sitemap, Pagefind vb. ihtiyaç doğduğunda eklenecek. |
| **Katalog verisi JSON + Content Collections** | Sunucu/veritabanı gerektirmez; build'de Zod + bütünlük denetimi. İleride harici kaynaktan içe aktarma aynı şemaya yazar. |
| **`.gitattributes` ile LF satır sonu** | Windows'ta geliştirme, Linux'ta CI build'i arasında tutarlılık. |
| **`package-lock.json` depoya eklenir** | CI'da `npm ci` ile birebir aynı sürümlerin kurulması için. |

## Bilinen eksikler

- Yıl aralığı filtresi henüz yok. Adresler marka, model, motor ve kasayı taşır.
- `npm test`, TypeScript dosyalarını doğrudan çalıştırmak için Node 22.18 veya üstünü gerektirir (site build'i 22.12+ ile çalışır).

## Git ve yayın

Kaynak: [github.com/Bahtepp/bahtepoto](https://github.com/Bahtepp/bahtepoto). Yerel çalışma dalı `katalog-turkiye`; yayın deposunun `main` dalına gider. `bahtepp.github.io` deposuna push edilmez.

Yayın iş akışı `.github/workflows/pages.yml`. `main` dalına push, GitHub Pages’i günceller. Özel alan adı ve DNS bu aşamada bağlanmaz.
