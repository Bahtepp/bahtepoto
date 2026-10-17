# TSB içe aktarma raporu

Kaynak dosyalar: `202201R1.xlsx`, `202610R1.xlsx` (TSB Kasko Değer Listesi). Fiyat değerleri kullanılmadı.

| | Sayı |
|---|---|
| TSB satırı (tekil marka-tip kodu) | 32427 |
| Kapsam dışı (ağır vasıta, otobüs, panelvan, karavan, motosiklet …) | 16136 |
| Aktarılan satır | 15157 |
| Aktarılamayan / belirsiz satır (`belirsiz.json`) | 1045 |
| Marka | 96 |
| Yalnızca TSB kaynaklı model | 895 |
| Yeni nesil grubu (ipucundan: 10, "nesil belirlenmedi": 727) | 737 |
| Yeni motor (yakıt türü tip adında yazmayan: 1039) | 2397 |
| Yeni varyant (nesil × motor) | 4944 |
| — mevcut kataloğun nesillerine eşlenen | 1824 |
| — nesli belirlenemeyen | 3101 |
| Türkiye durumu eklenen mevcut (elle girilmiş) varyant | 7 |

## Kapsam dışı bırakılanlar

- kapsam dışı marka (ağır vasıta / otobüs / karavan / motosiklet): 11856
- ticari / ağır vasıta tipi: 3475
- ticari / ağır vasıta modeli: 805

## Aktarılamayanlar (nedenleriyle `belirsiz.json` içinde)

- motor bilgisi yok (hacim, güç ve motor tanımı yazmıyor): 899
- model adı çözümlenemedi: 146

## Markalar

| Marka | Model | Varyant |
|---|---|---|
| BMW | 42 | 363 |
| Audi | 38 | 343 |
| Mercedes-Benz | 46 | 325 |
| Renault | 35 | 295 |
| Peugeot | 36 | 288 |
| Volkswagen | 34 | 286 |
| Ford | 34 | 267 |
| Opel | 34 | 250 |
| Fiat | 34 | 199 |
| Skoda | 17 | 177 |
| Citroen | 26 | 170 |
| Hyundai | 29 | 166 |
| Kia | 27 | 152 |
| Seat | 14 | 134 |
| Toyota | 28 | 118 |
| Porsche | 9 | 116 |
| Volvo | 22 | 111 |
| Dacia | 7 | 104 |
| Nissan | 22 | 87 |
| Chrysler | 19 | 81 |
| Alfa Romeo | 17 | 65 |
| Land Rover | 8 | 64 |
| Chevrolet | 24 | 59 |
| Honda | 15 | 55 |
| Jaguar | 13 | 44 |
| Suzuki | 14 | 42 |
| Lexus | 13 | 36 |
| Dodge | 10 | 33 |
| Mazda | 11 | 30 |
| Bentley | 6 | 29 |
| Mini | 4 | 28 |
| Lancia | 6 | 24 |
| Maserati | 4 | 23 |
| SsangYong | 12 | 23 |
| Subaru | 10 | 21 |
| Mitsubishi | 10 | 20 |
| Infiniti | 8 | 19 |
| Saab | 3 | 18 |
| Cadillac | 10 | 18 |
| Cupra | 5 | 17 |
| Chery | 7 | 15 |
| DS | 5 | 15 |
| Proton | 8 | 14 |
| MG | 6 | 14 |
| BYD | 11 | 14 |
| GMC | 7 | 14 |
| Aston Martin | 10 | 13 |
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
| Eklenen nesil | 1015 |
| Nesil eklenen model | 424 |
| Çelişki veya belirsiz model kimliği nedeniyle dışarıda bırakılan model (`data/staging/wikipedia/DISARIDA.md`) | 134 |
| Tip adındaki kasa koduyla eşlenen varyant | 27 |
| Kaynaktaki motor hacmiyle desteklenerek eşlenen varyant | 20 |

Not: Aynı motor birden çok nesilde satıldıysa her nesil için ayrı varyant oluşur (bir TSB satırı yalnızca bir
varyanta girer). Nesil eklendikçe toplam varyant sayısının artması bu yüzdendir.
