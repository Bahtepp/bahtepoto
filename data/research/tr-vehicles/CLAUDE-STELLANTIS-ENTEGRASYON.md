# Claude Stellantis entegrasyonu

Tarih: 2026-10-18. Dal: `katalog-turkiye`. Push, `main` birleştirmesi ve Pages yayını yapılmadı.

Önceki commitler duruyor: Gemini `c019641`, Hyundai/Kia ikinci tur ve BMW N13 `111da1d`. Bu tur yalnızca Stellantis araştırma dosyalarını, yeni kartları ve testleri değiştirir.

## Sayılar

| | |
|---|---|
| Gelen kayıt | 12 |
| Aktarılan | 6 |
| İncelemede | 6 |
| Zaten vardı / kopya olarak elenen | 0 |
| Geçersiz | 0 |

İlk kuru çalıştırma 7 aktarılabilir / 5 inceleme idi. Yağ kaydı ve 1.3 zincir yayına alınmayınca, Citroën 1.5 kaydı güç değeri yazılı motorlara bağlanınca sonuç 6 / 6 oldu. İkinci kuru çalıştırma yeni kart açmadı.

## Kararlar

| Kayıt | Karar | Gerekçe |
|---|---|---|
| Fiat Dualogic | Aktarıldı | 500 (312) `1.2 69 PS`, `1.2 FIRE 69 PS`, `1.4 100 PS` ve Punto 3 `1.4 FIRE 77 PS`, `1.3 Multijet 95 PS`. Katalogda Dualogic yazan satırlar. `1.2 FIRE` satırında MTA de var; kart yalnız Dualogic şartıyla görünür. Özet, normal geçiş sarsıntısını arızadan ayırır. |
| Egea 1.4 Fire yağ | İncelemede | Kaynaklar tüketimin üretici sınırını aştığını göstermiyor. Normal eksiltme kartı açılmadı. |
| 1.3 Multijet zincir | İncelemede | Kaynak Euro neslini ve üretim tarihini vermiyor. Katalog 75–95 PS satırlarını ayıramıyor. |
| Astra 1.6 CDTI takırtı | İncelemede | LVK/LVL motor kodu olarak kullanılmadı. Astra K’da 1.6 dizel satırı yok. |
| 308 II arka travers | İncelemede | Sertlik ve üretim tarihi (10.12.2015 / 20.06.2016) katalogda ayrılmıyor. Bütün 308 II’ye yayılmadı. |
| 1.6 BlueHDi AdBlue | Aktarıldı | Yalnız 208 I `1.6 BlueHDi 100 PS` ve 3008 II `1.6 BlueHDi 120 PS`. Yaygınlık Orta. AB tazminatı Türkiye garantisi diye yazılmadı. |
| Peugeot 1.5 BlueHDi zincir | Aktarıldı | 208 II, 2008 I/II, 308 II, 3008 II, 5008 II, 508 II, Rifter. Güç satırları 100–130 PS. 308 III katalogda 2026 olduğu için yok. 1 Şubat 2023 sonrası 8 mm zincir metinde dışarıda. |
| Citroën 1.5 BlueHDi zincir | Aktarıldı | C3, C3 Aircross, C4, C4 Cactus, C5 Aircross, Berlingo III, Grand C4 Picasso. Yalnız `1.5 BlueHDi 100/120/130 PS`. Etiketsiz `1.5 BlueHDi` yok. |
| Opel 1.5 dizel zincir | Aktarıldı | Corsa F 102 PS, Crossland 102 ve 120 PS, Grandland 130 PS. Astra K ve Insignia B’deki 122 PS GM satırı yok. Etiketsiz `1.5 DIZEL` yok. |
| 1.6 THP gergi | Aktarıldı | 308 I 150 ve 156 PS, 3008 I 156 PS, 508 I 156 ve 165 PS. 140 PS ve GTI yok. 308 II THP yok. |
| C4 Picasso BMP6 | İncelemede | Katalogda bu motorun şanzımanı Dualogic/BMP6 diye yazılmıyor. |
| C4 Picasso havalı süspansiyon | İncelemede | Donanım ayrılmıyor. Bütün kasaya yayılmadı. |

## Gemini ile örtüşme

Canlı beş kayıt duruyor ve kopyalanmadı: Linea göğüs, Egea direksiyon, Astra J PCV, Astra H korna, 1.2 PureTech.

Gemini’nin incelemede kalan Dualogic, 1.4 Fire yağ, 1.3 zincir, Astra K CDTI, 308 travers, AdBlue, havalı süspansiyon ve BMP6 dosyaları silinmedi. AdBlue ve Dualogic, Claude’un daralttığı kapsamla yeni kimlik aldı. Diğerleri hâlâ incelemede.

## Yaygınlık

Aktarılan kayıtlarda Yüksek yok. 1.5 zincir ve AdBlue Orta kaldı; kampanya araç sayısı Türkiye arıza oranı sayılmadı. 1.5 özetine 8 mm zincirin ve Avrupa kapsamının dışında olduğu cümlesi eklendi.

## Testler

- `npm test`: 305 geçti, 0 kaldı.
- `npm run check`: 0 hata, 0 uyarı, 1 eski ipucu (`scripts/import/generations/build.ts` erişilemeyen satır).
- `npm run import:check`: geçti. Golf yer tutucu ve örtüşen nesil uyarıları eskisi gibi.
- `npm run catalog:audit`: 100 marka, 851 model, 2.518 motor. Kesin 0, yüksek 0, inceleme 42 (Focus Avrupa), istisna 3.
- `npm run build`: 5.261 sayfa, hata yok.
- `npm audit`: 0 açık.
- Sayfa kontrolü: 308 II 1.5 BlueHDi yalnız zincir kartını gösteriyor. 308 II 1.2 PureTech yalnız kayış kartını gösteriyor. 308 I THP 150 gergi kartını gösteriyor, THP 140 göstermiyor. Corsa F 1.5 102 PS zincir kartını gösteriyor. Astra K 1.5 122 PS göstermiyor.
- Eşleşme: 308 II 1.5 BlueHDi zinciri görür, 1.2 PureTech görmez. Astra K ve Insignia 122 PS ile etiketsiz `1.5 DIZEL` görmez. 308 I THP 140 ve 308 II THP 156 gergi kartını görmez. 208 II 1.5 ve 3008 I 1.6 BlueHDi AdBlue kartını görmez. 500 0.9 ve Egea Dualogic görmez. BMW 320i ED hiçbir Stellantis kartını görmez. Gemini beşlisi ve N13 duruyor.
