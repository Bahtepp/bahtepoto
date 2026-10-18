# Canlı yayın öncesi kalite kontrolü

Tarih: 2026-10-18. Dal: `katalog-turkiye`. İncelemenin başladığı uzak uç: `6367614ed7f6b3999892ed9215a37ac787c1f9a1`. Bu uç, `origin/katalog-turkiye` ve PR #1 ile aynıydı. `origin/main` `815785a` idi. Dal `main`'den 19 commit ilerideydi. Çalışma ağacında yalnızca izlenmeyen `.claude/launch.json` vardı; commitlenmedi.

Bu kontrol yeni araştırma yayını, `main` birleştirmesi, force push veya GitHub Pages yayını başlatmadı.

## 1. İncelenen commit ve dal

PR #1 tabanı `main`, başı `katalog-turkiye`. Uzak dal `git fetch` sonrası yerel uçla aynıydı. Bekleyen Astra ve GPT ikinci tur JSON dosyaları duruyor; canlı sorun kartına aktarılmadı.

## 2. Katalog bütünlüğü

Kod ve veri sayımı, denetim raporuyla aynı:

| Ölçü | Sonuç |
|---|---|
| Model JSON | 851 |
| Motor | 2.518 |
| Türkiye'de satıldı | 4 |
| Kasko listesinde | 4.928 |
| İthal | 68 |
| Türkiye kaydı yok (gizli Ford Focus) | 42 |
| TSB satırı | 15.463 |
| Marka | 100 |
| Boş model | 0 |
| Yazım tekrarı grubu | 0 |

Marka klasörü ile `brandId` uyuşmayan dosya yok. Aynı markada yinelenen model slug'ı yok. Nissan Rogue dosyası duruyor, ana listede değil. Togg, BYD, Chery, MG, Jaecoo ve Leapmotor ana listede.

Denetim: kesin 0, yüksek 0, inceleme 42 (gizli Focus), istisna 3 (Lamborghini 920 PS, Porsche 1156 PS ve 1034 PS).

Seçim sırası üretim sitesinde denendi: arama `320d` iki BMW 3 Serisi motoru getirdi; seçim `/?marka=bmw&model=3-serisi&motor=320d-diesel` adresine yazıldı. Kasalar E90, F30 ve kasası belirsiz grup olarak ayrıldı. F30 içinde 184 PS ile güçsüz `320d` ayrı seçenek. 184 PS bağlantısı `/bahtepoto/arac/bmw/3-serisi/f30-f31-f34-f35/320d-184/` sayfasını açtı.

Fiat Egea'da motorlar kasa öncesinde listeleniyor. Bazı satırlar yalnızca `1.5` ve `1.6`; yakıt yazılmamış. Bu, uydurulmuş güç değil, eksik tip adı. Ayrı bir araştırma turu açılmadı.

## 3. Doğru kronik eşleşmeler

Üretim sayfası ve testler:

- Golf VI erken 1.4 TSI zinciri o kasada kalıyor. Golf VII sonraki 1.4 TSI soğutma kaydı ayrı.
- Golf VII 1.5 TSI ACT, T-Roc, Karoq, Leon ve Ateca kayıtları 2017–2020 ve yazılan güçte. Golf 8 ve sonraki 1.5 TSI bu kaydı almıyor.
- F30 320d 184 PS sayfasında N47 zinciri “Bu motora özgü” ve yaygınlık Yüksek. 320i ED sayfasında N47 ve N20 zinciri yok. 320i ED'de N13 wastegate ve PCV var.
- F30 320d ve 320i ED sayfalarında iç kapı tutamacı var. E90 320d eşleşmesi yok.
- W204 M271 zinciri 1.8 satırlarında. W204 1.6 ve W205 sonraki 220d NOx kaydını almıyor. W205 NOx yalnızca `2.2 220`.
- A4 B8 yağ tüketimi yalnız 2.0 TFSI 211 PS. Zincir gergisi aynı güçte. B9 pompa yalnız 252 PS. 245 PS almıyor.
- A3 8V DQ200 kaydı doğrulanan S tronic satırlarında. Manuel eşleşmiyor.
- Clio 1.3 TCe soğutma, Clio IV 1.2 TCe yağ, Duster II 1.3 TCe, Lodgy far kumandası (yalnız 2016 model yılı), i20 PB kapı, Tucson/Kona DCT ve Kia 2.4 GDI kapsamı mevcut testlerde duruyor.

## 4. Görünmemesi gereken eşleşmeler

- Golf VII R (`2.0 TSI 300`) sayfasında zincir, devirdaim ve DQ200 kartı yok. Üretim HTML'i de bu başlıkları içermiyor.
- DQ200 ailesi 1.0/1.2/1.4 TSI ve 1.6 TDI ile sınırlı. 2.0 TSI Golf R'ye geçmiyor.
- N20 zinciri 320i ED'ye eklenmiyor. N13 kaydı 328i'de yok.
- 245 PS A4, A3 122 PS ve manuel A3 DQ200 almıyor.
- Avrupa Focus Zetec sayfası araç kartı değil. `/bahtepoto/arac/ford/focus/mk1/zetec-se-14-75/` Focus seçim ekranına meta-refresh ile gidiyor.
- İkinci aktarım yeni kart açmıyor. Canlı veride `gpt2-audi-a6-c7-mmi-ekran-acilma`, `gpt2-bmw-f10-kapi-ici-tutamac-yapisma` ve `astra-renault-clio-iv-airbag-ecu` yok.

## 5. Mobil ve masaüstü

`/bahtepoto/` altında servis edilen üretim derlemesi açıldı.

- Masaüstü: CSS ve katalog betiği `/bahtepoto/_astro/` altından yüklendi. Yatay taşma yok (1905 px içerik, 1920 px pencere).
- 390 px mobil: BMW 320d sayfası ve Fiat Egea motor listesi `scrollWidth` 390. Taşma yok. Marka, model ve motor adımları ile “Modeller” geri düğmesi duruyor.
- Kart: başlık, yaygınlık, kategori, kapsam ve bir veya iki cümle. Kaynak, iç kimlik ve araştırma notu metinde yok.
- 320i ED'de yaygınlık Belirsiz ve Orta birlikte göründü. F30 320d'de Yüksek göründü.
- Skip link, arama kutusu adı ve adım düğmeleri erişilebilir ad taşıyor.
- Sekme başlığı modeli iki kez yazıyor: “BMW 3 Serisi 320d 3 Serisi (F30)”. Görünen başlık sade. Düşük öncelikli.

## 6. Eski adresler

GitHub Pages HTTP 301 üretmiyor. Eski adresler `meta http-equiv="refresh"` ve 2 saniye gecikme. Bunu 301 diye yazmıyorum.

Düzeltmeden önce üretim derlemesi eski Volvo adresini `https://bahtepp.github.io/?marka=volvo&model=xc90` adresine, yani sitenin dışına gönderiyordu. Araç sayfasındaki diğer motor bağlantıları `/arac/...` diye köke gidiyordu.

Düzeltmeden sonra örnekler:

- `/bahtepoto/arac/volvo/xc-90/` → `/bahtepoto/?marka=volvo&model=xc90`
- `/bahtepoto/arac/jeep/grandcherokee/` → Grand Cherokee seçimi
- `/bahtepoto/arac/nissan/350/` → 350Z seçimi
- `/bahtepoto/arac/ford/tourneocourier/` → Tourneo Courier seçimi
- `/bahtepoto/arac/volvo/xc40-t2/nesil-belirlenmedi/15-129/` → XC40 1.5 129 sayfası
- `/bahtepoto/arac/audi/rs/nesil-belirlenmedi/e-tron-590/` → E-tron GT sayfası
- `/bahtepoto/arac/mercedes-benz/mercedes/nesil-belirlenmedi/40-571/` → E 4.0 AMG 571 sayfası
- `/bahtepoto/arac/mini/cooper/` → MINI marka seçimi. Eski Cooper kovası Clubman, Countryman ve Mini'ye dağıldığı için tek araca bağlanmadı.

## 7. GitHub Pages üretim testi

`GITHUB_PAGES=true` ve `PAGES_REPO=bahtepoto` ile `npm run build`: 5.261 sayfa. Sayfa artışı yeni yönlendirme dosyalarından.

Yerel sunucu `dist` içeriğini `http://127.0.0.1:4173/bahtepoto/` altından verdi.

- Ana sayfa, CSS, JS ve `/bahtepoto/data/search.json` 200.
- Kök `http://127.0.0.1:4173/` 404. Site kökü `/` değil.
- Katalog, araç sayfası ve iç bağlantılar `/bahtepoto/` altında kaldı.
- Arama `320d` sonuç verdi ve seçim URL'ye yazıldı.
- `search.json` yaklaşık 390 KB. Tüm katalog tek istekte inmiyor. Model JSON'u seçilince iniyor. Kaynak sözlüğü boş nesne.

## 8. Güvenlik ve bağımlılıklar

- `npm ci`: 268 paket, kurulum temiz.
- `npm audit`: 0 açık.
- İzlenen dosyada `.env`, özel anahtar veya şifre yok.
- `.claude/launch.json` commitlenmedi.
- Örnek kronik kayıt canlı kartta yok. `/ornek/kronik-sorunlar/` ayrı ve noindex.
- Q8 E-tron 50 motoru artık “E-TRON 50”. Güç alanı yok. “50 PS” yazılmıyor. Ayrıştırıcı `Q8 E-TRON 50 QUATTRO` için güç üretmiyor. Parantezdeki 590 PS duruyor.

## 9. Bulunan hatalar ve düzeltmeler

Kritik, düzeltildi:

- GitHub Pages'de statik yönlendirme hedefi `/bahtepoto/` önekini kaybediyordu.
- Araç sayfasındaki kasa ve motor geçişleri `/arac/` köküne gidiyordu.

Önemli, düzeltildi:

- Jeep `grandcherokee`, Nissan `350`, Volvo `xc40-t2`, Audi `rs` E-tron GT ve Mercedes `mercedes` eski adresleri 404 idi.
- Q8 E-tron 50, 50 PS sanılıyordu.

Düşük, kod değişmedi:

- Sekme başlığında model adı yineleniyor.
- `scripts/import/generations/build.ts:140` erişilemeyen kod ipucu.
- Golf nesil yılları örtüşme uyarıları ve Wikidata yer tutucuları duruyor.

## 10. Testler

| Komut | Sonuç |
|---|---|
| `npm ci` | geçti, 0 açık |
| `npm test` | 295 geçti, 0 kaldı |
| `npm run check` | 0 hata, 0 uyarı, 1 ipucu |
| `npm run build` (`GITHUB_PAGES=true`) | 5.261 sayfa |
| `npm run import:check` | geçti |
| `npm run catalog:audit` | sayılar aynı |
| `npm audit` | 0 açık |

Yeni testler: Golf R negatif eşleşme, F30 kapı tutamacının E90'da görünmemesi, bekleyen ikinci tur kimliklerinin canlıda olmaması, E-tron 50 gücünün silinmesi, eski slug ve `/bahtepoto/` öneki.

## 11. Kalan riskler

- Yönlendirme HTTP 301 değil, 2 saniyelik meta-refresh.
- F30 kuşağı kodu F31/F34/F35 de içeriyor. İki varyant hem sedan hem station wagon gövdesi taşıyor. Kapı tutamacı kaydı bu kuşağın tamamında görünüyor. Sedan 320d sayfası doğru. Karışık gövdeli 316i ve 1.5 318i sayfası da aynı kartı gösteriyor.
- MINI Cooper'ın eski derin adresi tek modele değil, marka seçimine gidiyor.
- `main`'de silinmiş başka artık slug'lar (örneğin `ford/focus-wrc`, `lamborghini/140`) için tek tek yönlendirme eklenmedi.
- Fiat Egea'da yakıtsız `1.5` ve `1.6` satırları duruyor.
- Bu düzeltmeler henüz GitHub'a gönderilmedi.

## Karar

**YAYINA HAZIR**

Engelleyici veri veya seçim hatası kalmadı. GitHub Pages'i sitenin dışına atan yönlendirmeler ve 50 PS yazılan E-tron 50 düzeltildi. Kronik kartlar yanlış motora, Golf R'ye, manuele ve bekleyen araştırma dosyalarına taşmıyor. Karar, bu yerel düzeltmeleri içerir. Güncellenmiş commit GitHub'a gönderilmeden PR #1 eski ucu gösterir.
