# Türkiye katalog temizliği

Tarih: 2026-10-18. Dal: `katalog-turkiye`. Canlı siteye, `main` dalına ve uzak depoya yazılmadı.

Önceki denetim raporu duruyor: `data/research/tr-vehicles/KATALOG-DENETIMI.md`.

Motor–varyant taraması: `data/research/tr-vehicles/turkiye-motor-varyant.md`.

## Başlangıç sayıları

Çalışma başında dal `origin/main` üzerinde 7 yerel commit ilerideydi. Katalog sayıları önceki raporla aynıydı.

| | Başlangıç | Son |
|---|---:|---:|
| Marka dosyası | 100 | 100 |
| Ana kullanıcı markası | 43 | 43 |
| Arşiv markası | 57 | 57 |
| Model dosyası | 851 | 851 |
| Motor kaydı | 2518 | 2518 |
| Varyant | 5042 | 5042 |
| TSB satırı | 15463 | 15463 |

Varyantların pazar durumu değişmedi:

| Durum | Sayı | Anlamı |
|---|---:|---|
| `sold` | 4 | Ford Türkiye broşürü veya fiyat listesiyle doğrulanmış Focus Mk2 motorları |
| `listed` | 4928 | TSB kasko değer listesinde. Resmi distribütör satışı değildir |
| `imported` | 68 | TSB’de ABD tipi / ithal kaydı. Ana listede gösterilmez |
| Türkiye kaydı yok | 42 | Yalnızca Ford Focus Wikipedia Avrupa motor listesi |

Başka markada, Türkiye kaydı olmayan model dosyası yoktu. 851 modelin tamamında en az bir Türkiye TSB varyantı var. Bu yüzden model veya marka dosyası silinmedi. Silmek 15.463 TSB satırından birini düşürürdü.

## Türkiye dışı kayıtların dağılımı

Kullanıcıya açık Avrupa ve dünya pazarı seçeneği kodda duruyordu (`MarketView = tr | eu | world`). Arayüzde ayrı bir pazar menüsü yoktu; seçici zaten Türkiye ana listesini kullanıyordu. Eski `market=eu` ve `market=world` adresleri artık sorgu dizesinden düşer ve sayfa Türkiye görünümünde kalır.

Kasa etiketlerindeki `eu` ve `global` kimlikleri üretim yılıdır. BMW F30, Golf, Civic, Qashqai J11/J12 ve Focus nesilleri bu bilgilerle duruyor. Bu kimlik bir motorun Türkiye’de satıldığı anlamına gelmez.

## Silinen yabancı pazar modelleri

0. Doğrulanmış ve Türkiye TSB satırı bulunmayan model dosyası yoktu.

## Silinen yabancı pazar motorları

0. 42 Avrupa kaydı silinmedi. Gerekçeler:

- Bir kısmının aynı kasada TSB ikizi var (örneğin Focus Mk2 ST hem Wikipedia `ford-focus-mk2-st` hem TSB `ford-focus-mk2-25`).
- `ford-duratorq-20-c346` ve diğer kronik sorun motor kimlikleri bu kayıtlarda.
- Örnek kronik sorun sayfası bu varyant slug’larını arıyor.
- Türkiye’de hiç satılmadığı ayrıca doğrulanmadı. Toplu silme yapılmadı.

Bu 42 varyant kullanıcı sayfası olarak üretilmez. Eski adres, Focus seçim ekranına gider (`/?marka=ford&model=focus`). Yanlış bir motora bağlanmaz.

## Gizlenen belirsiz modeller

Ana listeden çıkarılan ve dosyası duran model: `nissan/rogue`.

57 arşiv markası ana listede değildir. “Nadir markalar” ile açılır. TSB satırları durur. İlan sayısı yazılmadı. Omoda bu arşivdedir; Togg, BYD, Chery, MG, Jaecoo ve Leapmotor ana listededir.

68 ithal varyant ana motora girmez. Eski adresleri, ait oldukları modelin seçim ekranına gider. Kayıt silinmedi.

## Korunan Türkiye motorları

Ana liste: 4 resmi satış + 4.928 TSB listesi = 4.932 varyant.

Arama indeksi: 43 marka, 663 model, 2.932 motor kartı. Rogue ve Avrupa’ya özel Focus motoru indekste yok.

Korunan örnekler: BMW 320d, Renault Clio 1.5 dCi, Nissan Qashqai 1.3 DIG-T (J11 ve J12), Ford Focus 1.6 TDCi, Volkswagen Golf 1.5 TSI, Honda Civic 1.6, Fiat Egea 1.3 MultiJet.

## Kasa bilgisi korunan modeller

Wikipedia nesil aktarması yalnızca kasa yılı ve kodu yazar. Motor varyantı üretmez. Yeniden içe aktarma, kaldırılmış bir Avrupa motorunu kataloga geri koymaz; bu motorlar TSB aktarmasından da gelmiyor.

## TSB satırı

| | Sayı |
|---|---:|
| Başlangıç | 15463 |
| Son | 15463 |
| Düşen | 0 |

## Kırık URL düzeltmeleri

Eski model slug’u, aynı kasa ve varyant kanonik modelde duruyorsa o sayfaya gider. Varyant yoksa model seçimine gider. Yönlendirme `noindex` taşır; kanonik adres eski slug değildir.

| Eski | Yeni |
|---|---|
| Ford `f150` | `f-150` |
| Ford `tourneocourier` | `tourneo-courier` |
| Ford `tourneocustom` | `tourneo-custom` |
| Ford `tourneoconnect` | `tourneo-connect` |
| Mazda `mx5` | `mx-5` |
| Volvo `xc-90`, `s-80`, `v-70`, `xc-70` | `xc90`, `s80`, `v70`, `xc70` |
| DS `ds-3`, `ds-7`, `ds-9` | `ds3`, `ds7`, `ds9` |
| Chrysler `300-c`, `pacificia` | `300c`, `pacifica` |
| Proton `gen2` | `gen-2` |

Örnek: `/arac/volvo/xc-90/1-nesil/24/` → `/arac/volvo/xc90/1-nesil/24/`.
`/arac/volvo/xc-90/` → `/?marka=volvo&model=xc90`.
`/arac/ford/focus/mk1/makyajli/zetec-se-14-75/` → `/?marka=ford&model=focus`.

GitHub Pages `base` yolu `prefixBase` ile eklenir. Yerel üretimde kök dizindir.

## Çözülemeyen pazar belirsizlikleri

- 42 Focus Wikipedia motoru: Türkiye kaydı yok, veri duruyor, sayfa yok. İnceleme adayı. `npm run catalog:audit` bunları hata saymaz.
- 68 ithal varyant: Türkiye’de görülmüş, resmi satış değil.
- `audi-e-tron-50` adı “E-TRON 50 PS” ve güç alanı 50 PS. 50 TDI düzeltmesiyle aynı sınıf olabilir; bu turda silinmedi. `audi-50` (50 TDI satış etiketi) güç alanı taşımıyor.
- Arşivdeki 57 markanın hangisinin yalnızca tekil ithal olduğu ilan sayısıyla ölçülmedi.

## Test sonuçları

| Komut | Sonuç |
|---|---|
| `npm test` | 251 geçti, 0 kaldı |
| `npm run check` | 0 hata |
| `npm run build` | 5235 sayfa |
| `npm run import:check` | geçti |
| `npm run catalog:audit` | kesin 0, yüksek 0, inceleme 42, istisna 3 |
| `npm audit` | 0 açık |

Önizlemede `/?market=eu&marka=volvo&model=xc-90` adresi `/?marka=volvo&model=xc90` oldu. XC90 motor listesi açıldı. Pazar menüsü yok.

## Son yerel commitler

Bu turdan önce dal `origin/main` üzerinde 7 commit ilerideydi. Yeni kod commit’i:

`69b6141` Türkiye kataloğunu tek pazara indirir; eski model adreslerini yönlendirir.

Bu rapor ayrı bir yerel commit’tedir. Uzak depoya gönderilmedi.

## Yayın öncesi son kontrol

Kaynak katalog aynı kaldı: 100 marka, 43 ana, 57 arşiv, 851 model, 2.518 motor, 5.042 varyant, 15.463 TSB satırı. `sold` 4, `listed` 4.928, `imported` 68. TSB satırı resmi satış yapılmadı.

42 Ford Focus Wikipedia/Avrupa varyantı kaynak dosyada duruyor. Kamuya giden model JSON’undan çıkarıldı. `dist/data/models/ford/focus.json` bu 42 kaydı, `ford-duratorq-20-c346` motorunu, TSB satır kimliğini ve Wikipedia metnini içermiyor. Yayımlanan Türkiye varyantı 4.932. Yayımlanmayan kayıt 110: 42 Türkiye kaydı olmayan varyant ve 68 ithal varyant. Marka JSON’larında da kaynakça metni yok.

`ford-duratorq-20-c346` kimliği değiştirilmedi. Motor dosyasında ve Focus kronik sorun kaydında duruyor. Sorun kaydının işaret ettiği motor kimliklerinin hepsi motor dosyasında bulunuyor. Kaynak varyant silinmediği için eşleştirme yetim değil. Bu motorun Türkiye sayfası yok; eski adresi Focus seçimine gider.

Footer’daki Wikipedia CC BY-SA cümlesi kaldırıldı. Kullanıcıya gösterilenler üretim yılı, kasa kodu ve motor ölçüsü. `VehicleSources` sayfalara bağlı değil. TSB kimlikleri kaynak dosyada duruyor.

Doğrudan arşiv adresi (`?marka=ferrari`) nadir marka arşivini açar ve bunun ana katalog olmadığını yazar. Rogue ana listede ve aramada yok; doğrudan adres “Bu model Türkiye ana kataloğunda yer almıyor” der. Araç sayfasında da aynı uyarı var.

Eski adresler statik yenileme sayfasıdır, HTTP 301 değildir. Döngü yok.

| Eski | Gittiği yer |
|---|---|
| `/arac/volvo/xc-90/1-nesil/24/` | `/arac/volvo/xc90/1-nesil/24/` |
| `/arac/ds/ds-7/nesil-belirlenmedi/15-bluehdi-130/` | kanonik DS7 sayfası |
| `/arac/mazda/mx5/uretim-1989/15/` | kanonik MX-5 sayfası |
| `/arac/ford/f150/nesil-belirlenmedi/35/` | `/?marka=ford&model=f-150` |
| `/arac/ford/focus/mk3/duratorq-20/` | `/?marka=ford&model=focus` |

F-150 ithaldir; eski derin adres başka bir araca değil, model seçimine gider. GitHub Pages tabanı `prefixBase('/bahtepoto/', …)` ile sınandı. Bu üretim yerel kök dizinidir.

Önizleme: `market=eu` düştü. BMW 320d E90 ve F30 kasasını açtı. Focus 1.6 TDCi Mk2 kasasını açtı. Togg T10X 160 kW ve 320 kW kasaya indi. Arama: Clio, Civic, Qashqai, Egea, 320d ve XC 90 doğru modele gitti. Rogue aramada yok. Ferrari yalnızca tam adıyla arşiv olarak çıktı. Pazar menüsü yok. Togg yakıtı tip adında yazmadığı için “elektrik” diye işaretlenmedi.

| Komut | Sonuç |
|---|---|
| `npm test` | 253 geçti, 0 kaldı |
| `npm run check` | 0 hata |
| `npm run build` | 5239 sayfa |
| `npm run import:check` | geçti |
| `npm run catalog:audit` | kesin 0, yüksek 0, inceleme 42, istisna 3 |
| `npm audit` | 0 açık |

Uzak depoya gönderilmedi. Canlı site değişmedi.
