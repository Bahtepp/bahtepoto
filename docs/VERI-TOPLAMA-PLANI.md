# Veri toplama ve katalog genişletme planı

**Durum:** Faz 1 ve Faz 2 uygulandı (15.10.2026). İçe aktarma iskeleti `scripts/import/` altında; Golf Mk5–Mk8 adayları ve fark raporu `data/staging/wikidata/` altında, **kataloğa aktarılmadı** (onay bekliyor).
**Hedef:** Ford Focus dışındaki araçları, düşük maliyetle ve tahmin üretmeden kataloğa eklemek.

Seçim yapısı değişmiyor: **Marka → Model → Nesil/Kasa (yıl aralığı) → Makyaj dönemi (yıl aralığı) → Motor**.
Yıl ve motor eşleşmeleri pazar bazında tutulur (örn. "Avrupa, üretim").

## 1. İlkeler

1. **Tahmin yok.** İçe aktarma yalnızca kaynakta açıkça bulunan alanları yazar. Kaynakta olmayan nesil,
   makyaj dönemi veya motor eşleşmesi boş kalır ve arayüzde "Veri doğrulanıyor" görünür.
2. **Önce geçici alan.** Dış veri doğrudan kataloğa yazılmaz: geçici alan → şema + bütünlük kontrolü →
   fark raporu → insan onayı → katalog.
3. **Her alanın kaynağı bellidir.** Hangi kaynaktan, ne zaman, hangi lisansla alındığı kayıtta durur.
4. **Pazar ayrımı.** ABD, Kanada veya Çin verisi Avrupa ya da Türkiye araçlarına kesin olarak uygulanmaz.
5. **Lisansı belirsiz kaynak yayımlanmaz.** Lisansı doğrulanmamış kaynak yalnızca iç araştırma notu olur;
   sitede gösterilmez.

## 2. Kaynak envanteri

"Lisans" sütunundaki değerler resmi sayfalardan kontrol edildi. "Doğrulanmalı" yazanlar için
yayına almadan önce veri setinin kendi sayfası okunmalı.

### 2a. Katalog: marka, model, nesil, makyaj dönemi, motor

| Kaynak | Ne verir | Pazar | Erişim | Lisans | Rolü |
|---|---|---|---|---|---|
| **Wikidata** | Marka → model → nesil zinciri, başlangıç/bitiş yılı, önceki/sonraki nesil, bazen motor bağlantısı | Belirsiz (yılların temeli yazmıyor) | Ücretsiz SPARQL / JSON | CC0 | **İskelet üretici.** Örn. Golf Mk7 = [Q62362](https://www.wikidata.org/wiki/Q62362): P580=2012, P582=2021, P155/P156 (önceki/sonraki nesil), P516 (motor). Makyaj bilgisi yok. |
| **Wikipedia** | Nesil sayfaları, makyaj tarihleri, motor tabloları | Genellikle Avrupa / ABD ayrı | Ücretsiz API | CC BY-SA 4.0 | **Makyaj ve motor adayları.** Metin kopyalanmaz; olgular özetlenir ve kaynak gösterilir. Tablolar sayfadan sayfaya değiştiği için ayrıştırma insan onayına tabi. |
| **EEA CO2 izleme verisi** (AB'de yeni tescil edilen otomobiller) | Marka, ticari ad, **tip onay numarası**, tip/varyant/versiyon, motor hacmi, güç, yakıt; yıl bazında | AB-27 (+ BK, İzlanda, Norveç) | Ücretsiz CSV / SQL | EEA genel politikası CC BY (veri seti sayfasında doğrulanmalı) | **Pazar bazlı motor doğrulaması.** "Bu motor bu modelde AB'de hangi yıllarda tescil edildi" sorusunu kaynakla yanıtlar. Tip onay numarası, geri çağırmaları nesle bağlamanın anahtarı (Focus denetiminde Mk3 = `…*1138`, Mk4 = `…*1911` örneği). |
| NHTSA vPIC | Marka/model/model yılı, VIN çözümleme | Yalnızca ABD | Ücretsiz, anahtarsız | ABD kamu malı (data.gov kaydı) | Yalnızca ad normalizasyonu. Avrupa nesil/motor verisi için **kullanılmaz**. |
| Üretici basın siteleri, fiyat listeleri, broşürler | Motor seçenekleri, makyaj tarihleri | Ülkeye göre | Elle | Değişken; çoğunlukla telifli | Birincil kaynak olarak **elle** atıf; toplu indirme yok. |
| auto-data.net, cars-data.com, CarQuery, Autodata, TecRMI | Ayrıntılı teknik veri | Çeşitli | Ücretli / koşullu | Ticari; kazıma ve yeniden yayın kısıtlı veya doğrulanamadı | **Kullanılmaz.** Erişim izni ve lisans alınırsa yeniden değerlendirilir. |

### 2b. Sorunlar: geri çağırmalar, bilinen sorunlar

| Kaynak | Ne verir | Pazar | Erişim | Lisans | Rolü |
|---|---|---|---|---|---|
| **AB Safety Gate** | Geri çağırma: model, tip onayı, üretim tarihi, kampanya kodu, risk | AB/AEA | Ücretsiz; herkese açık ama belgelenmemiş JSON uç noktası (Focus denetiminde kullanıldı) + data.europa.eu | Komisyon belgeleri için 2011/833/EU; Komisyon Safety Gate yayınlarında CC BY 4.0 (veri setinde doğrulanmalı) | **Ana geri çağırma kaynağı.** Tip onay numarasıyla nesle bağlanır. |
| KBA Rückrufdatenbank | Almanya geri çağırmaları | Almanya | Web; tam indirme seçeneği bildiriliyor | Kullanım koşulları doğrulanamadı | Doğrulama için; koşullar netleşmeden yayımlanmaz. |
| DVSA | Birleşik Krallık geri çağırmaları | Birleşik Krallık | Güncel dosya otomatik erişime kapalı (403); data.gov.uk'taki eski CSV "UK Crown Copyright"; OGL'li istatistik seti 2013–2017 | Karışık | Sınırlı; elle kontrol. |
| Transport Canada | Geri çağırmalar | Kanada | Aylık CSV + anahtarlı API | Open Government Licence – Canada (ikincil kaynakta; doğrulanmalı) | Avrupa araçlarına doğrudan uygulanmaz; yalnızca araştırma sinyali. |
| NHTSA recalls / complaints | Geri çağırma, doğrulanmamış şikâyet | ABD | Ücretsiz | ABD kamu malı | Avrupa/Türkiye araçlarına **uygulanmaz**. Aynı motor kodunda tekrar eden şikâyetler yalnızca "olası sorun" araştırması başlatır. |
| Türkiye (Sanayi ve Teknoloji Bakanlığı, e-Devlet sorgusu, GÜBİS) | Türkiye geri çağırmaları | Türkiye | Toplu veri / API bulunamadı | — | Elle izleme; kullanıcıya VIN ile e-Devlet / yetkili servis sorgusu önerilir. |
| **ADAC Pannenstatistik** | Model + ilk tescil yılı bazında arıza kalemleri | Almanya | PDF; yıllık | ADAC telifi; lisans bulunamadı | **Bilinen sorunlar listesi için.** Yalnızca olgular (hangi kalem, hangi yıllar) Türkçe özetlenir ve kaynak gösterilir; tablo ve metin kopyalanmaz. Focus denetimindeki gibi yarı otomatik çıkarım (`pdftotext`) + insan onayı. |
| TÜV Report | Muayene kusur oranları | Almanya | Ücretli | Telifli | Lisans olmadan kullanılmaz. |
| Otomotiv basını, uzman servisler | Bilinen sorun, belirti, çözüm | Çeşitli | Elle | Telifli | Elle özet + atıf. Aynı habere dayanan yayınlar `basedOn` ile tek kaynak sayılır. |
| Kullanıcı forumları | Tekrar eden bildirimler | Çeşitli | Elle | Site koşulları | Kazıma yok. En az iki bağımsız bildirim varsa "bilinen / sık bildirilen", tekil bildirim "olası sorun". |

## 3. Otomatik içe aktarma nasıl çalışacak

```text
scripts/import/<kaynak>/          Bağdaştırıcı (adapter): kaynağı okur, alanları eşler — tahmin etmez
        │
        ▼
.cache/import/<kaynak>/<tarih>/   Ham indirme (git DIŞI, .gitignore). Tekrar indirmeyi önler.
        │
        ▼
data/staging/<kaynak>/*.json      Normalize edilmiş ADAY kayıtlar + alan bazında kaynak bilgisi
        │   (git'te izlenebilir ama site build'ine girmez)
        ▼
npm run import:check              Zod şeması + katalog bütünlüğü + kanıt kuralları + çakışma tespiti
        │
        ▼
npm run import:diff               Fark raporu: yeni / değişen / çelişen kayıtlar (Markdown)
        │
        ▼
İnsan onayı                       Yerel inceleme veya Pull Request (otomatik birleştirme YOK)
        │
        ▼
npm run import:promote            Onaylı kayıtları src/data/catalog ve src/data/issues'a yazar
```

### Ayrıntılar

- **Bağdaştırıcı arayüzü:** `fetch()` (ham veriyi önbelleğe indirir), `normalize()` (aday kayıt üretir),
  `license` (kaynak + lisans + atıf metni). Her bağdaştırıcı yalnızca bir kaynağı bilir.
- **Kaynak bilgisi:** Aday kayıtta her alanın yanında `{ sourceId, retrievedAt, sourceField }` tutulur.
  Kataloğa yazılırken mevcut `sourceIds` / `status` alanlarına dönüşür.
- **Kimlikler:** Mevcut slug kuralları kullanılır (`marka-model-nesil`). Aynı kayıt tekrar içe
  aktarıldığında aynı kimliği alır; bu sayede güncellemeler fark olarak görünür.
- **Eşleştirme anahtarları:**
  - Tip onay numarası (`e13*2007/46*1911` → Focus Mk4) için yeni bir eşleme tablosu:
    `src/data/catalog/type-approvals/<marka>.json`. Kaynağı EEA verisi ve Safety Gate uyarıları.
  - Motor kodu ve motor ailesi (mevcut seçiciler).
- **Çakışmalar:** İki kaynak farklı yıl veya güç verirse kayıt `conflicting` olur ve değer boş kalır
  (Focus kataloğundaki mevcut uygulama).
- **Makyaj dönemleri:** Yalnızca kaynak açıkça makyaj tarihi veriyorsa oluşturulur. Wikidata'da makyaj
  yok; Wikipedia veya üretici kaynağı yoksa nesil makyajsız (tek dönem) olarak kalır ve not düşülür.
- **Zamanlama:** Başlangıçta komutlar yerelde elle çalıştırılır. İleride zamanlanmış bir GitHub Actions
  işi yalnızca fark raporu ve PR oluşturabilir; doğrudan `main`'e yazmaz ve yayınlamaz.
- **API anahtarları:** Anahtar gerektiren kaynaklar (ör. Transport Canada API) yalnızca ortam
  değişkeniyle çalışır; anahtar yoksa bağdaştırıcı atlanır. Depoya anahtar girmez.

### Kullanım (Faz 1–2)

```text
npm run import:run -- wikidata      Ham veriyi .cache/import/wikidata/<tarih>/ altına indirir, adayları data/staging/wikidata/ altına yazar
npm run import:check                Geçici alan şeması + kanıt kuralları + katalog şemaları + validate.ts + çakışma tespiti
npm run import:diff                 data/staging/<kaynak>/FARK-RAPORU.md
npm run import:promote              KURU ÇALIŞTIRMA: yalnızca neyin yazılacağını gösterir
npm run import:promote -- --write   Onaydan sonra src/data/catalog altına yazar
```

- **Kanıt kuralları:** Aday kayıttaki her veri alanının kökeni (`provenance`) olmalı: `source` (kaynakta açıkça var),
  `derived` (kaynaktaki değerden kurala bağlı türetildi), `editorial` (içe aktarma yapılandırmasında insan kararı) veya
  `placeholder`. Kökendeki kaynak, kaydın `sourceIds` listesinde bulunmalı.
- **Yer tutucular:** Katalog şeması bir alanı zorunlu tuttuğu hâlde kaynak vermiyorsa (Wikidata için `labelPeriod.marketId`
  ve `basis`; bitiş yılı yoksa `labelPeriod.end`) alan `placeholder` olarak işaretlenir. Bu kayıtlar `sourced`/`verified`
  olamaz, `notes` ile açıklanmalıdır ve `--write` bunları yalnızca ek `--accept-placeholders` bayrağıyla yazar.
- **Promote kapıları:** `import:check` hatası varsa hiçbir şey yazılmaz; lisansı yayın için doğrulanmamış kaynak
  (`publishable: false`) yazılmaz; mevcut `sourced`/`verified`/`conflicting` kayıtla çelişen değer hiçbir zaman otomatik yazılmaz;
  adayın vermediği alanlar (makyaj dönemleri, varyantlar) mevcut kayıttan korunur, içe aktarma hiçbir şey silmez.
- **Golf adayları:** Wikidata yılları Mk5 2003–2009, Mk6 2008–2012, Mk7 2012–2021, Mk8 2019– (P582 yok). Ardışık nesillerde
  yıllar üst üste biniyor; bu, yılların temelinin (pazar / üretim / satış) belirsiz olduğunu doğruluyor. Onaydan önce pazar ve
  temel başka bir kaynakla (Wikipedia, üretici) belirlenmeli.

## 4. İlk test markaları

Tek seferde marka kataloğu indirilmez. Her markadan **bir model** ile başlanır, uçtan uca denenir:

| Marka / model | Neden |
|---|---|
| **Volkswagen Golf** (Mk5–Mk8) | Wikidata'da nesil zinciri tam; EEA ve Safety Gate'te çok kayıt; brief'teki örnek. Wikidata'nın Golf Mk7 için verdiği 2012–2021 aralığı, örnekteki 2012–2020 ile çelişiyor: pazar/temel doğrulamasının iyi bir testi. |
| **Renault Clio** | Türkiye'de üretiliyor (Bursa); Türkiye pazarı için önemli. |
| **Toyota Corolla** | Türkiye'de üretiliyor (Sakarya); hibrit motorlar (yakıt türü eşleşmesi testi). |
| **Fiat Egea / Tipo** | Türkiye'de üretiliyor ve satılıyor; Avrupa'da farklı adla (Tipo) satılması, ad eşleştirme testi. |

Başarı ölçütü: dört modelin nesil ve yıl iskeleti Wikidata'dan, motor-yıl doğrulaması EEA'dan,
geri çağırmalar Safety Gate'ten **elle tek satır yazmadan** geçici alana gelir; fark raporu insan
onayıyla kataloğa alınır; mevcut testler ve yeni içe aktarma testleri geçer.

## 5. Astro ve GitHub Pages ölçeklenmesi

GitHub Pages sınırları ([GitHub belgeleri](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)):
yayınlanan site en fazla **1 GB**, kaynak depo önerisi 1 GB, bant genişliği 100 GB/ay (esnek), dağıtım
süresi en fazla 10 dakika. Özel GitHub Actions iş akışıyla yapılan build'ler saatlik build sınırına
tabi değil.

**Mevcut ölçüm (15.10.2026):** 95 detay sayfası, ortalama **49 KB** (bütün sorun ayrıntıları HTML'e
gömülü), build 3 sn. Bu oranla yaklaşık 20.000 sayfa 1 GB sınırına ulaşır. Önlemler:

1. **Detay sayfalarını inceltmek:** Sorun kayıtlarının ayrıntıları ("Ayrıntılar" ve "Teknik doğrulama"
   alanları) model başına bir JSON'a (`/data/issues/<marka>/<model>.json`) taşınır ve açıldığında
   yüklenir. Sayfada başlık, özet ve belirtiler kalır. Hedef: sayfa başına 10–15 KB.
2. **Sayfa sayısını kontrol etmek:** Makyaj dönemi eşleşmesi doğrulanmamış motor × dönem
   kombinasyonları ayrı sayfa yerine tek varyant sayfasında dönem seçicisiyle gösterilebilir.
3. **Ham veri depoya girmez:** EEA gibi büyük veri setleri `.cache/` altında işlenir (git dışı).
   Depoda yalnızca normalize edilmiş, model başına bölünmüş JSON durur (mevcut yapı).
4. **Parçalı yükleme korunur:** Marka ve model JSON'ları zaten ayrı. Model başına dosya boyutu takip
   edilir (Focus: 44 KB).
5. **Build süresi:** Astro'nun içerik önbelleği değişmeyen koleksiyonları yeniden işlemez. Build
   10 dakikaya yaklaşırsa önce 1. ve 2. maddeler uygulanır.
6. **Arama:** Marka/model araması için ileride statik, parçalı bir arama dizini (ör. Pagefind)
   eklenebilir; sunucu gerekmez.
7. **Çıkış yolu:** Sınırlar yine aşılırsa, statik çıktıyı değiştirmeden başka bir statik barındırıcıya
   geçmek mümkün. Bu karar şimdilik gerekmiyor.

## 6. Yol haritası

| Faz | İş | Çıktı |
|---|---|---|
| 0 | Yayın politikası sadeleştirildi, bu plan | Bu commit |
| 1 | İçe aktarma iskeleti: bağdaştırıcı arayüzü, geçici alan şeması, `import:check`, `import:diff`, `import:promote` (kuru çalıştırma) | Testli altyapı; veri yok |
| 2 | Wikidata bağdaştırıcısı → VW Golf nesil iskeleti | Golf Mk5–Mk8 adayları + fark raporu |
| 3 | EEA bağdaştırıcısı → motor-yıl doğrulaması + tip onayı eşleme tablosu | Golf motorları (AB, yıl bazında) |
| 4 | Safety Gate bağdaştırıcısı → tip onayıyla geri çağırma eşleşmesi | Golf geri çağırmaları |
| 5 | Renault Clio, Toyota Corolla, Fiat Egea/Tipo | Dört modelde uçtan uca deneme |
| 6 | Detay sayfası inceltme (5.1) ve ölçek ölçümü | Sayfa başına hedef boyut |

## 7. Yayın öncesi doğrulanması gereken lisanslar

- EEA CO2 izleme veri setinin kendi lisans notu (genel politika CC BY).
- Safety Gate verisinin data.europa.eu sayfasındaki lisans; kullanılan JSON uç noktası belgelenmemiş,
  değişebilir.
- KBA Rückrufdatenbank kullanım koşulları.
- Transport Canada verisinin lisansı (ikincil kaynakta OGL – Canada).
- ADAC: olguları özetleme ve atıf yeterli mi; tablo/grafik kullanılmayacak. Gerekirse ADAC basın birimine sorulmalı.

## Kaynaklar (bu plan için kontrol edilenler)

- [EEA CO2 izleme veri seti](https://www.eea.europa.eu/data-and-maps/data/co2-cars-emission-12), [EEA telif sayfası](https://www.eea.europa.eu/legal/copyright)
- [Commission Decision 2011/833/EU](https://eur-lex.europa.eu/eli/dec/2011/833/oj/eng)
- [data.gov.uk – Vehicle Safety Branch Recalls Database](https://data.gov.uk/dataset/vehicle-safety-branch-recalls-database), [DfT/DVSA istatistik veri seti](https://findtransportdata.dft.gov.uk/dataset/vehicle-testing-enforcement-approval-and-safety-defect-data-17f1cae571f)
- [Open Canada – Vehicle Recalls Database](https://open.canada.ca/data/en/dataset/1ec92326-47ef-4110-b7ca-959fab03f96d)
- [Wikidata Q62362 (Volkswagen Golf Mk7)](https://www.wikidata.org/wiki/Q62362)
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [KBA Rückrufdatenbank hakkında haber (mobiFlip)](https://www.mobiflip.de/shortnews/kba-rueckrufdatenbank-wurde-optimiert/)
