# TSB içe aktarma raporu

Kaynak dosyalar: `202201R1.xlsx`, `202610R1.xlsx` (TSB Kasko Değer Listesi). Fiyat değerleri kullanılmadı.

| | Sayı |
|---|---|
| TSB satırı (tekil marka-tip kodu) | 32427 |
| Kapsam dışı (ağır vasıta, otobüs, panelvan, karavan, motosiklet …) | 16136 |
| Aktarılan satır | 15271 |
| Aktarılamayan / belirsiz satır (`belirsiz.json`) | 890 |
| Marka | 97 |
| Yalnızca TSB kaynaklı model | 870 |
| Yeni nesil grubu (ipucundan: 5, "nesil belirlenmedi": 591) | 596 |
| Yeni motor (yakıt türü tip adında yazmayan: 1044) | 2444 |
| Yeni varyant (nesil × motor) | 5038 |
| — mevcut kataloğun nesillerine eşlenen | 3106 |
| — nesli belirlenemeyen | 1924 |
| Türkiye durumu eklenen mevcut (elle girilmiş) varyant | 12 |

## Kapsam dışı bırakılanlar

- kapsam dışı marka (ağır vasıta / otobüs / karavan / motosiklet): 11856
- ticari / ağır vasıta tipi: 3475
- ticari / ağır vasıta modeli: 805

## Aktarılamayanlar (nedenleriyle `belirsiz.json` içinde)

- motor bilgisi yok (hacim, güç ve motor tanımı yazmıyor): 768
- model adı çözümlenemedi: 122

## Markalar

| Marka | Model | Varyant |
|---|---|---|
| Mercedes-Benz | 40 | 416 |
| BMW | 32 | 379 |
| Audi | 37 | 323 |
| Volkswagen | 34 | 293 |
| Renault | 32 | 270 |
| Ford | 35 | 268 |
| Peugeot | 35 | 262 |
| Opel | 31 | 240 |
| Fiat | 32 | 194 |
| Hyundai | 26 | 180 |
| Citroen | 26 | 174 |
| Skoda | 15 | 168 |
| Kia | 26 | 155 |
| Toyota | 28 | 138 |
| Seat | 12 | 128 |
| Porsche | 9 | 115 |
| Volvo | 25 | 112 |
| Dacia | 7 | 108 |
| Nissan | 23 | 93 |
| Land Rover | 8 | 73 |
| Honda | 15 | 62 |
| Chevrolet | 24 | 61 |
| Alfa Romeo | 17 | 60 |
| Jeep | 8 | 49 |
| Jaguar | 13 | 47 |
| Suzuki | 14 | 39 |
| Chrysler | 14 | 35 |
| Dodge | 10 | 34 |
| Lexus | 13 | 34 |
| Bentley | 6 | 30 |
| Mazda | 12 | 29 |
| Subaru | 10 | 29 |
| Mini | 2 | 28 |
| SsangYong | 10 | 24 |
| Saab | 3 | 23 |
| Maserati | 4 | 22 |
| Lancia | 6 | 21 |
| Mitsubishi | 10 | 21 |
| Infiniti | 8 | 19 |
| Cadillac | 10 | 18 |
| Cupra | 5 | 17 |
| DS | 8 | 17 |
| Chery | 8 | 16 |
| MG | 6 | 14 |
| BYD | 11 | 14 |
| GMC | 7 | 14 |
| Aston Martin | 10 | 13 |
| Proton | 8 | 13 |
| Tesla | 2 | 11 |
| Tata | 7 | 10 |
| Lada | 7 | 9 |
| Lamborghini | 6 | 9 |
| Daihatsu | 5 | 8 |
| Lincoln | 6 | 7 |
| Dfsk | 6 | 7 |
| KGM | 6 | 7 |
| Ferrari | 4 | 5 |
| Mercury | 4 | 5 |
| Lotus | 5 | 5 |
| Smart | 2 | 5 |
| Buick | 4 | 4 |
| Ikco | 3 | 4 |
| Geely | 4 | 4 |
| Togg | 2 | 4 |
| Rolls-Royce | 3 | 3 |
| Saipa | 2 | 2 |
| GAC | 1 | 2 |
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
| Eklenen nesil | 1268 |
| Nesil eklenen model | 540 |
| Çelişki veya belirsiz model kimliği nedeniyle dışarıda bırakılan model (`data/staging/wikipedia/DISARIDA.md`) | 108 |
| Tip adındaki kasa koduyla eşlenen varyant | 28 |
| Kaynaktaki motor (hacim + yakıt) bilgisiyle eşlenen varyant | 14 |
| Bütün model yılları yalnızca tek neslin dönemine düşen varyant | 1243 |

Not: Aynı motor birden çok nesilde satıldıysa her nesil için ayrı varyant oluşur (bir TSB satırı yalnızca bir
varyanta girer). Nesil eklendikçe toplam varyant sayısının artması bu yüzdendir.

## Nesli belirlenemeyen TSB satırları: nedenler

| Neden | TSB satırı | Model |
|---|---|---|
| kaynaklı nesil yok — Wikipedia maddesi modelle eşleşmedi (adlandırma farkı / türev model) | 865 | 107 |
| yıllar birden çok nesle uyuyor; kaynaktaki motor bilgisi tek nesli göstermiyor | 739 | 96 |
| yıllar birden çok nesle uyuyor; motor hacmi veya yakıt türü bilinmiyor | 720 | 111 |
| kaynaklı nesil yok — Wikipedia maddesi bulunamadı | 598 | 174 |
| model yılları kaynakta çelişkili bir neslin dönemine düşüyor | 485 | 16 |
| satırın model yılları iki neslin dönemine yayılıyor | 321 | 72 |
| alt model / farklı kasa (ör. VERSO, PLUS, SEDAN): yalnızca kasa kodu veya nesil ipucuyla eşlenir | 312 | 52 |
| model yılları bilinen hiçbir neslin dönemine uymuyor | 309 | 44 |
| tek model yılı, komşu nesil sınırında | 239 | 72 |
| kaynaklı nesil yok — madde var, nesil bilgi kutusu yok | 227 | 41 |
| kaynaklı nesil yok — diğer | 1 | 1 |
