# bahtepoto.com

bahtepoto.com web sitesinin kaynak kodu. Site **Astro + TypeScript** ile statik olarak üretilir ve ileride **GitHub Pages** üzerinden `bahtepoto.com` özel alan adıyla yayınlanması planlanmaktadır.

> **Durum:** Geliştirme aşaması — yalnızca localhost. Henüz hosting, DNS değişikliği veya canlı yayın yok.

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
├── .github/workflows/             # (deploy.yml henüz yok; bkz. "Bilinen eksikler")
├── docs/VERI-EKLEME.md            # Katalog verisi ekleme rehberi
├── docs/KRONIK-SORUNLAR.md        # Kronik sorun şeması, eşleştirme ve kanıt kuralları
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

Seçim hiyerarşisi: **Marka → Model → Nesil/Kasa → Makyaj dönemi → Motor**.

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

**Ölçeklenme:** Ana sayfa yalnızca marka listesini içerir. Marka seçilince `/data/brands/<marka>.json`
(modeller + nesil özetleri), nesil seçilince `/data/models/<marka>/<model>.json` (motorlar, varyantlar,
kaynaklar) indirilir. Veri dosyaları da marka/model başına bölündüğü için on binlerce varyantta hem
depo (küçük diff'ler) hem tarayıcı (küçük parçalar) tarafı hafif kalır.

## Araç detay sayfası ve kronik sorunlar

Kullanıcı yolu: **Marka → Model → Nesil → Makyaj dönemi → Motor → "Ayrıntılar ve kronik sorunlar"**.
Detay sayfası (`/arac/<marka>/<model>/<nesil>/[<dönem>/]<varyant>/`) statik üretilir ve
"Katalogda bu seçime dön" bağlantısıyla gezgini aynı seçimle açar; aynı motorun diğer dönemine ve
aynı dönemdeki diğer motorlara doğrudan geçiş bağlantıları vardır.

Bölümler: araç kimliği, motor özellikleri (yalnızca katalog verisi; eksik alan "Veri doğrulanıyor"),
kronik sorunlar, kaynaklar ve doğrulama durumu. Yeni bölümler (yakıt tüketimi, ikinci el kontrol
rehberi, bakım maliyetleri, kullanıcı deneyimleri) `src/components/vehicle/` altına bileşen olarak
eklenip sayfadaki `SECTIONS` listesine bir satırla bağlanır.

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
| **`site: 'https://bahtepoto.com'`, `base` yok** | Kanonik URL ve ileride sitemap için gerekli. Özel alan adı kök dizinden yayın yapacağı için `base` gerekmez. |
| **Asgari bağımlılık** | Yalnızca `astro`, `@astrojs/check`, `typescript`, `@types/node` (yalnızca tip kontrolü). UI kütüphanesi yok; gezgin düz TypeScript. Sitemap, Pagefind vb. ihtiyaç doğduğunda eklenecek. |
| **Katalog verisi JSON + Content Collections** | Sunucu/veritabanı gerektirmez; build'de Zod + bütünlük denetimi. İleride harici kaynaktan içe aktarma aynı şemaya yazar. |
| **`.gitattributes` ile LF satır sonu** | Windows'ta geliştirme, Linux'ta CI build'i arasında tutarlılık. |
| **`package-lock.json` depoya eklenir** | CI'da `npm ci` ile birebir aynı sürümlerin kurulması için. |

## Bilinen eksikler

- `.github/workflows/deploy.yml` README'de anılıyor ama depoda yok; yalnızca boş bir `.github/workflows/_probe` dosyası var. Yayın aşamasında oluşturulacak.
- Canlı kronik sorun verisi henüz boş. Build bu yüzden `issues` / `issueSources` koleksiyonları için "boş koleksiyon" uyarısı verir; ilk doğrulanmış kayıtla birlikte kaybolur.
- `npm test`, TypeScript dosyalarını doğrudan çalıştırmak için Node 22.18 veya üstünü gerektirir (site build'i 22.12+ ile çalışır).

## Git ve GitHub

Bu depo GitHub'daki **`bahtepoto.com`** reposuna bağlanacaktır. Hesaptaki **`bahtepp.github.io`** deposu bu projeden tamamen bağımsızdır; bu projeden oraya hiçbir şey gönderilmez.

Remote bağlama (repo adresi kesinleştikten sonra):

```bash
git remote add origin <REPO_ADRESİ>
git remote -v        # doğrulama
git push -u origin main
```

## Yayın planı (henüz uygulanmadı)

1. **Workflow:** `.github/workflows/deploy.yml` hazır, ancak yalnızca `workflow_dispatch` (elle) ile tetiklenir. Canlıya alma kararıyla birlikte `push: branches: [main]` bloğu açılacak.
2. **GitHub Pages ayarı:** Repo → *Settings → Pages → Build and deployment → Source: GitHub Actions*.
3. **Alan adı doğrulama (önerilir):** GitHub hesap ayarları → *Pages → Add a verified domain* → `bahtepoto.com` için verilen TXT kaydını DNS'e ekleme. Alan adının başka hesaplarca ele geçirilmesini önler.
4. **Özel alan adı:** Repo → *Settings → Pages → Custom domain*: `bahtepoto.com`, ardından *Enforce HTTPS*. (GitHub Actions ile yayında `CNAME` dosyası gerekmez; ayar repo ayarlarında tutulur.)
5. **DNS kayıtları (alan adı sağlayıcısında):**
   - Kök alan adı `bahtepoto.com` → `A` kayıtları: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - (İsteğe bağlı IPv6) `AAAA`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `www.bahtepoto.com` → `CNAME`: `<github-kullanıcı-adı>.github.io`
   - Bu değerler yayın öncesi GitHub'ın güncel belgeleriyle yeniden doğrulanacaktır.
6. **Not:** Özel alan adı bağlanmadan önce site `https://<kullanıcı-adı>.github.io/bahtepoto.com/` alt yolunda yayınlanır; bu ara aşamada önizleme yapılacaksa geçici olarak `base` ayarı gerekir.
