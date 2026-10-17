# TSB içe aktarma raporu

Kaynak dosyalar: `202201R1.xlsx`, `202610R1.xlsx` (TSB Kasko Değer Listesi). Fiyat değerleri kullanılmadı.

| | Sayı |
|---|---|
| TSB satırı (tekil marka-tip kodu) | 32427 |
| Kapsam dışı (ağır vasıta, otobüs, panelvan, karavan, motosiklet …) | 16136 |
| Aktarılan satır | 15153 |
| Aktarılamayan / belirsiz satır (`belirsiz.json`) | 995 |
| Marka | 97 |
| Yalnızca TSB kaynaklı model | 882 |
| Yeni nesil grubu (ipucundan: 5, "nesil belirlenmedi": 616) | 621 |
| Yeni motor (yakıt türü tip adında yazmayan: 1033) | 2421 |
| Yeni varyant (nesil × motor) | 5071 |
| — mevcut kataloğun nesillerine eşlenen | 2963 |
| — nesli belirlenemeyen | 2100 |
| Türkiye durumu eklenen mevcut (elle girilmiş) varyant | 12 |

## Kapsam dışı bırakılanlar

- kapsam dışı marka (ağır vasıta / otobüs / karavan / motosiklet): 11856
- ticari / ağır vasıta tipi: 3475
- ticari / ağır vasıta modeli: 805

## Aktarılamayanlar (nedenleriyle `belirsiz.json` içinde)

- motor bilgisi yok (hacim, güç ve motor tanımı yazmıyor): 863
- model adı çözümlenemedi: 132

## Markalar

| Marka | Model | Varyant |
|---|---|---|
| Mercedes-Benz | 40 | 380 |
| BMW | 32 | 379 |
| Audi | 38 | 340 |
| Volkswagen | 34 | 298 |
| Renault | 35 | 287 |
| Peugeot | 36 | 269 |
| Ford | 34 | 265 |
| Opel | 34 | 254 |
| Fiat | 34 | 198 |
| Hyundai | 29 | 185 |
| Skoda | 17 | 184 |
| Citroen | 26 | 177 |
| Kia | 27 | 157 |
| Seat | 14 | 138 |
| Toyota | 28 | 128 |
| Porsche | 9 | 115 |
| Dacia | 7 | 107 |
| Volvo | 22 | 106 |
| Nissan | 22 | 90 |
| Land Rover | 8 | 73 |
| Chevrolet | 24 | 61 |
| Honda | 15 | 61 |
| Alfa Romeo | 17 | 60 |
| Jeep | 8 | 49 |
| Jaguar | 13 | 43 |
| Suzuki | 14 | 39 |
| Chrysler | 14 | 35 |
| Dodge | 10 | 34 |
| Lexus | 13 | 34 |
| Bentley | 6 | 30 |
| Mazda | 11 | 29 |
| Subaru | 10 | 29 |
| Mini | 4 | 28 |
| SsangYong | 12 | 24 |
| Saab | 3 | 23 |
| Maserati | 4 | 22 |
| Mitsubishi | 10 | 22 |
| Lancia | 6 | 21 |
| Infiniti | 8 | 19 |
| Cadillac | 10 | 18 |
| Cupra | 5 | 17 |
| Chery | 7 | 16 |
| DS | 5 | 15 |
| MG | 6 | 14 |
| BYD | 11 | 14 |
| GMC | 7 | 14 |
| Aston Martin | 10 | 13 |
| Proton | 8 | 12 |
| Tesla | 2 | 11 |
| Tata | 7 | 10 |
| Lada | 7 | 9 |
| Lamborghini | 6 | 9 |
| Daihatsu | 5 | 8 |
| Lincoln | 6 | 7 |
| Dfsk | 6 | 7 |
| KGM | 7 | 7 |
| Ferrari | 4 | 5 |
| Mercury | 4 | 5 |
| Lotus | 5 | 5 |
| Smart | 2 | 5 |
| Buick | 4 | 4 |
| Ikco | 3 | 4 |
| Geely | 4 | 4 |
| Togg | 2 | 4 |
| Saipa | 2 | 2 |
| GAC | 1 | 2 |
| Rolls-Royce | 2 | 2 |
| Skywell | 2 | 2 |
| Forthing | 2 | 2 |
| Voyah | 2 | 2 |
| Swm | 2 | 2 |
| Lucid | 2 | 2 |
| Daewoo | 1 | 1 |
| Pontiac | 1 | 1 |
| Morgan | 1 | 1 |
| Caterham | 1 | 1 |
| Shuanghuan | 1 | 1 |
| Hummer | 1 | 1 |
| Ravon | 1 | 1 |
| Zotye | 1 | 1 |
| Seres | 1 | 1 |
| Ora | 1 | 1 |
| Brilliance | 1 | 1 |
| Mahindra | 1 | 1 |
| Leapmotor | 1 | 1 |
| Zhidou | 1 | 1 |
| Relive | 1 | 1 |
| Reeder | 1 | 1 |
| Hongqi | 1 | 1 |
| Xpeng | 1 | 1 |
| Polestones | 1 | 1 |
| Jaecoo | 1 | 1 |
| Levc | 1 | 1 |
| Eveasy | 1 | 1 |
| Fangchengbao | 1 | 1 |
| Rox | 1 | 1 |
| Omoda | 1 | 1 |

## Denetim

Katalog şemaları ve bütünlük denetimi geçti.

## Wikipedia nesilleri

| | Sayı |
|---|---|
| Eklenen nesil | 1215 |
| Nesil eklenen model | 512 |
| Çelişki veya belirsiz model kimliği nedeniyle dışarıda bırakılan model (`data/staging/wikipedia/DISARIDA.md`) | 105 |
| Tip adındaki kasa koduyla eşlenen varyant | 28 |
| Kaynaktaki motor (hacim + yakıt) bilgisiyle eşlenen varyant | 17 |
| Bütün model yılları yalnızca tek neslin dönemine düşen varyant | 1167 |

Not: Aynı motor birden çok nesilde satıldıysa her nesil için ayrı varyant oluşur (bir TSB satırı yalnızca bir
varyanta girer). Nesil eklendikçe toplam varyant sayısının artması bu yüzdendir.

## Nesli belirlenemeyen TSB satırları: nedenler

| Neden | TSB satırı | Model |
|---|---|---|
| kaynaklı nesil yok — Wikipedia maddesi bulunamadı | 1335 | 215 |
| kaynaklı nesil yok — Wikipedia maddesi modelle eşleşmedi (adlandırma farkı / türev model) | 831 | 104 |
| yıllar birden çok nesle uyuyor; motor hacmi veya yakıt türü bilinmiyor | 774 | 110 |
| yıllar birden çok nesle uyuyor; kaynaktaki motor bilgisi tek nesli göstermiyor | 773 | 99 |
| model yılları kaynakta çelişkili bir neslin dönemine düşüyor | 431 | 15 |
| alt model / farklı kasa (ör. VERSO, PLUS, SEDAN): yalnızca kasa kodu veya nesil ipucuyla eşlenir | 315 | 53 |
| model yılları bilinen hiçbir neslin dönemine uymuyor | 307 | 36 |
| satırın model yılları iki neslin dönemine yayılıyor | 281 | 66 |
| kaynaklı nesil yok — madde var, nesil bilgi kutusu yok | 233 | 44 |
| tek model yılı, komşu nesil sınırında | 232 | 71 |
