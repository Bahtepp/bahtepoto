# Katalog denetimi

Tarih: 2026-10-18. Dal: `katalog-turkiye`. Canlı siteye ve `main` dalına yazılmadı.

Denetim iki türlü yapıldı. Bütün model dosyaları ve motor kayıtları `npm run catalog:audit` ile tarandı. Aşağıdaki tablodaki satırlar ayrıca TSB tip adına bakılarak düzeltildi. Her modelin dış kaynakla tek tek doğrulandığı iddia edilmez.

## Sayılar

| | Önce | Sonra |
|---|---:|---:|
| Marka dosyası (`brands.json`) | 100 | 100 |
| Model dosyası | 874 | 851 |
| Motor kaydı | — | 2518 |
| TSB satırı (katalogda) | 15460 | 15463 |
| Düşen TSB satırı | — | 0 |
| Değişen elle girilmiş kayıt | — | 0 |

Motor kaydının önceki toplamı bu turda ayrıca sayılmadı. İsimleri bilinen sahte güç kayıtları (4691, 6400, 6100, 3300, 5204, 1795, 4000, 991, 992, Audi 50 PS) katalogda artık yok. 15463, önceki 15460’a üç Jeep satırının eklenmesidir; bu satırlar önceden belirsiz dosyasına düşüyordu (`JEEPGRANDCHEROKEE`, 17 karakter).

İkinci kuru çalıştırma birincisiyle aynı: düşen satır 0, silinecek model 0, elle kayıt 0.

## 1. Düzeltilen hatalı güçler

Kural `scripts/import/tsb/normalize.ts` içindedir. Yeniden içe aktarma aynı hatayı üretmez. Güç yazmıyorsa alan boş kalır.

| Marka | Eski | Yeni | Gerekçe | Kaynak |
|---|---|---|---|---|
| Alfa Romeo 8C | `alfa-romeo-4691` / 4691 PS | `alfa-romeo-47` / 4.7, güç yok | `(4691)` cc | TSB 3-1025 |
| Dodge Challenger / Charger | 6400 PS, 6100 PS | 6.4 ve 6.1, güç yok | `(6400)` `(6100)` cc | TSB 45-1005, 45-1006, 45-1007, 45-1008 |
| Dodge Grand Caravan | 3300 PS | 3.3, güç yok | `(3300)` cc | TSB 45-1023 |
| Lamborghini Gallardo | 5204 PS | 5.2, model Gallardo | `(5204)` cc; `140` model adı değil | TSB 235-1007 |
| Nissan Versa | 1795 PS | 1.8, güç yok | `(1795)` cc | TSB 107-1110 |
| Toyota Tacoma | 4000 PS | 4.0, güç yok | `(4000)` cc | TSB 144-1122 |
| Porsche 911 | 3.8 991 PS | 3.8 520 PS | `(991)` kasa, `(520)` güç | TSB 118-1105 |
| Porsche 911 | 992 PS | GT3, güç yok | `(992)` kasa | TSB 118-1111 |
| Audi A6 / A7 / A8 / Q8 | 3.0 TDI 50 PS | 3.0 TDI, 50 satış kademesi | `50 TDI` PS değildir | TSB 9-1355, 9-1356 ve aynı aile |

Korunan yüksek güç (otomatik alarm yok):

- Porsche Taycan Turbo GT Weissach `(1034)` → 1034 PS. TSB 118-1215
- Porsche Cayenne Turbo Electric `(1156)` → 1156 PS. TSB 118-1238
- Lamborghini Temerario `4.0 (920)` → 920 PS. TSB 235-1020

Dört haneli çıplak parantez 1600’ün üstündeyse cc sayılır. 1000–1600 ve `ELECTRIC` geçen satırlar güç kalır.

## 2. Birleştirilen yazım tekrarları

Eski dosya silindi, satırlar hedef modelde. Takma ad `scripts/import/tsb/aliases.ts` içindedir.

| Eski | Kalan |
|---|---|
| Ford `f150` | `f-150` |
| Ford `tourneocourier` | `tourneo-courier` |
| Ford `tourneocustom` | `tourneo-custom` |
| Ford `tourneoconnect` | `tourneo-connect` |
| Mazda `mx5` | `mx-5` |
| Volvo `s-80`, `v-70`, `xc-70`, `xc-90` | `s80`, `v70`, `xc70`, `xc90` |
| DS `ds-3`, `ds-7`, `ds-9` | `ds3`, `ds7`, `ds9` |
| Chrysler `300-c` | `300c` |
| Chrysler `pacificia` | `pacifica` |
| Proton `gen2` | `gen-2` |

208 ile 2008, C3 ile C3 Aircross bu kuralla birleşmez. Denetim sonunda yazım tekrarı grubu 0.

## 3. Yanlış marka ve model

| Eski yer | Yeni yer | Örnek kaynak |
|---|---|---|
| Toyota › Lexus | Lexus › RX, GX, LX, LS, ES | TSB 144-459 `LEXUS RX 350` |
| Lexus › Lexus | Lexus › LS, ES | TSB 571-1064 `LEXUS LS 460` |
| Nissan › Infiniti | Infiniti › FX, QX | TSB 107-220 `INFINITI FX 35` |
| Nissan › 350 | Nissan › 350Z | TSB 107-226 `350 Z 3.5` |
| Chrysler › Jeep, Grand, Wrangler, Grand Cherokee | Jeep › Grand Cherokee, Wrangler, Compass, Patriot, Avenger | TSB 33-225 `JEEP GRAND CHEROKEE LTD 4.7` |
| Mercedes-Benz › Mercedes | Mercedes-Benz › E, AMG | TSB 90-2304 `MERCEDES AMG E 63 4MATIC+ 4.0 (571)` |
| Audi › RS | Audi › e-tron GT, teknik ad RS | TSB 9-1572 `RS E-TRON GT (590)` |
| Lamborghini › 140 | Lamborghini › Gallardo | TSB 235-1007 |

## 4. Donanım paketi olan modeller

| Eski model | Bağlandığı model | Gerekçe |
|---|---|---|
| Alfa Romeo Tonale Tributo | Tonale | Tributo sürüm adı |
| Škoda Yeti Greenline | Yeti | Greenline sürüm adı; 1.6 TDI duruyor |
| Skywell ET5 Premium | ET5 | Premium paket |
| Ford Focus WRC | Focus | `FOCUS WRC 2.0 (136) POWERSHIFT` yol otomobili. 136 PS ralli aracı değildir |
| Volvo XC40 T2 | XC40 | T2 satış kademesi; motor 1.5 129 PS. TSB 154-1262 |
| MINI Cooper | MINI | Cooper satış sürümü. Countryman, Clubman ve Paceman ayrı aile oldu |

BMW M3, Focus ST/RS, Golf GTI ve benzeri performans adları alias tablosuna konmadı.

## 5. Motor adı

| Kaynak metni | Eski kimlik | Yeni kimlik |
|---|---|---|
| Škoda `YETI … 1.6 TDCI CR 105` | `skoda-16-tdci` | `skoda-16-tdi` |
| Ford `TOURNEO COURIER 1.5 DCI 75` | `ford-15-dci-75` | `ford-15-tdci-75` |

Škoda, Volkswagen, Seat, Cupra ve Audi için kaynakta yazan TDCi, TDI olur. Ford için kaynakta yazan dCi, TDCi olur. Başka markaya yasak kelime listesi uygulanmadı.

## 6. MINI ve KGM / SsangYong

TSB’de Countryman, Clubman ve Paceman geçiyor; artık ayrı model dosyaları. Eksik aile uydurulmadı.

KGM ve SsangYong ayrı marka kaldı. Actyon, Korando, Musso, Rexton, Tivoli ve Torres iki markada da duruyor. 2024 KGM kaydı SsangYong adıyla gösterilmedi. İki ad da marka aramasında bulunur.

## 7. Türkiye görünürlüğü

`togg` ana listeye eklendi. Nissan Rogue ana model listesinden çıkarıldı; dosya duruyor (`src/lib/catalog/visibility.ts`, `HIDDEN_MODELS`). İlan sayısı yazılmadı. BYD, Chery ve MG ana listede kaldı.

## 8. Denetim komutu

`npm run catalog:audit`

Seviyeler: kesin, yüksek, inceleme, istisna. Şüpheli kayıt silinmez. Son çalıştırma: kesin 0, yüksek 0, inceleme 0, istisna 3 (Taycan 1034, Cayenne Electric 1156, Temerario 920).

Taranan: 100 marka, 851 model dosyası, 2518 motor kaydı.

## 9. Bilerek dokunulmayanlar

- Ford Focus kronik kayıtları ve `ford-duratorq-20-c346` kimliği.
- Seçim akışı: marka, model, motor, kasa.
- Wikipedia CC BY-SA satırı.
- Orijinal TSB xlsx dosyaları.

## 10. Sürdürülen belirsiz kayıtlar

Bunlar zorla başka modele taşınmadı.

- Mercedes C 180 / BMW 320d gibi satış adları motor tanımı olarak duruyor. Ayrı PS uydurulmadı.
- KGM ve SsangYong’da aynı model adları dönemine göre iki markada duruyor.
- Yakıtı tip adında yazmayan motorların yakıt alanı boş. Denetim bunu hata saymıyor.

## 11. Testler

Komutlar bu dalda, yayın olmadan çalıştırıldı.

- `npm test`: 247 geçti, 0 kaldı.
- `npm run check`: geçti.
- `npm run build`: geçti.
- `npm run import:check`: geçti. Golf nesil yılı uyarıları eskisi gibi.
- `npm run catalog:audit`: kesin hata 0.
- `npm audit`: 0 açık.

Eski model adresleri (`/arac/volvo/xc-90/…` gibi) bu katalogda artık üretilmiyor. Yönlendirme yayın sırasında ayrıca bağlanmalı. Bu turda siteye sürüm çıkmadı.

## 12. Yerel commitler

`katalog-turkiye` dalı `origin/main` önünde. Push yapılmadı.

- `ce4e6a7` Parantezdeki cc, Porsche kasa kodu ve Audi 50 TDI etiketini motor gücü sanmama
- `97e5069` Yinelenen yazı, yanlış marka ve donanım paketini içe aktarmada birleştirme
- `58a106a` Togg ana listede; Nissan Rogue arşivde
- `9a09e03` `npm run catalog:audit`
- `3801724` Kataloğun yeniden yazılması
- `4462db2` Bu rapor
