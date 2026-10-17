# TSB içe aktarma raporu

Kaynak dosyalar: `202201R1.xlsx`, `202610R1.xlsx` (TSB Kasko Değer Listesi). Fiyat değerleri kullanılmadı.

| | Sayı |
|---|---|
| TSB satırı (tekil marka-tip kodu) | 32427 |
| Kapsam dışı (ağır vasıta, otobüs, panelvan, karavan, motosiklet …) | 16136 |
| Aktarılan satır | 15334 |
| Aktarılamayan / belirsiz satır (`belirsiz.json`) | 828 |
| Marka | 97 |
| Yalnızca TSB kaynaklı model | 823 |
| Yeni nesil grubu (ipucundan: 5, "nesil belirlenmedi": 552) | 557 |
| Yeni motor (yakıt türü tip adında yazmayan: 989) | 2460 |
| Yeni varyant (nesil × motor) | 4987 |
| — mevcut kataloğun nesillerine eşlenen | 3090 |
| — nesli belirlenemeyen | 1892 |
| Türkiye durumu eklenen mevcut (elle girilmiş) varyant | 12 |

## Kapsam dışı bırakılanlar

- kapsam dışı marka (ağır vasıta / otobüs / karavan / motosiklet): 11856
- ticari / ağır vasıta tipi: 3475
- ticari / ağır vasıta modeli: 805

## Aktarılamayanlar (nedenleriyle `belirsiz.json` içinde)

- motor bilgisi yok (hacim, güç ve motor tanımı yazmıyor): 731
- model adı çözümlenemedi: 97

## Markalar

| Marka | Model | Varyant |
|---|---|---|
| Mercedes-Benz | 39 | 445 |
| BMW | 32 | 378 |
| Audi | 37 | 323 |
| Volkswagen | 34 | 293 |
| Ford | 32 | 261 |
| Renault | 28 | 251 |
| Peugeot | 22 | 247 |
| Opel | 21 | 232 |
| Hyundai | 33 | 188 |
| Fiat | 29 | 178 |
| Citroen | 23 | 174 |
| Skoda | 14 | 166 |
| Kia | 26 | 153 |
| Toyota | 29 | 130 |
| Seat | 12 | 128 |
| Porsche | 9 | 115 |
| Volvo | 20 | 108 |
| Dacia | 7 | 106 |
| Nissan | 23 | 91 |
| Land Rover | 8 | 73 |
| Chevrolet | 24 | 61 |
| Honda | 13 | 60 |
| Jeep | 8 | 58 |
| Alfa Romeo | 16 | 57 |
| Jaguar | 13 | 47 |
| Suzuki | 14 | 39 |
| Lexus | 13 | 38 |
| Mini | 4 | 35 |
| Dodge | 10 | 31 |
| Bentley | 6 | 30 |
| Subaru | 10 | 29 |
| Mazda | 11 | 28 |
| SsangYong | 10 | 24 |
| Saab | 3 | 23 |
| Chrysler | 8 | 22 |
| Maserati | 4 | 22 |
| Infiniti | 9 | 22 |
| Mitsubishi | 10 | 21 |
| Lancia | 6 | 20 |
| Cadillac | 10 | 18 |
| DS | 5 | 18 |
| Cupra | 5 | 16 |
| Chery | 8 | 16 |
| MG | 6 | 14 |
| BYD | 11 | 14 |
| GMC | 7 | 14 |
| Aston Martin | 10 | 13 |
| Proton | 7 | 12 |
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
| Skywell | 1 | 1 |
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
| Eklenen nesil | 1250 |
| Nesil eklenen model | 532 |
| Çelişki veya belirsiz model kimliği nedeniyle dışarıda bırakılan model (`data/staging/wikipedia/DISARIDA.md`) | 102 |
| Tip adındaki kasa koduyla eşlenen varyant | 4 |
| Kaynaktaki motor (hacim + yakıt) bilgisiyle eşlenen varyant | 15 |
| Bütün model yılları yalnızca tek neslin dönemine düşen varyant | 1237 |

Not: Aynı motor birden çok nesilde satıldıysa her nesil için ayrı varyant oluşur (bir TSB satırı yalnızca bir
varyanta girer). Nesil eklendikçe toplam varyant sayısının artması bu yüzdendir.

## Nesli belirlenemeyen TSB satırları: nedenler

| Neden | TSB satırı | Model |
|---|---|---|
| kaynaklı nesil yok — Wikipedia maddesi modelle eşleşmedi (adlandırma farkı / türev model) | 855 | 101 |
| yıllar birden çok nesle uyuyor; kaynaktaki motor bilgisi tek nesli göstermiyor | 806 | 99 |
| yıllar birden çok nesle uyuyor; motor hacmi veya yakıt türü bilinmiyor | 670 | 108 |
| model yılları kaynakta çelişkili bir neslin dönemine düşüyor | 436 | 16 |
| kaynaklı nesil yok — Wikipedia maddesi bulunamadı | 423 | 111 |
| satırın model yılları iki neslin dönemine yayılıyor | 303 | 72 |
| model yılları bilinen hiçbir neslin dönemine uymuyor | 300 | 43 |
| kaynaklı nesil yok — diğer | 288 | 30 |
| alt model / farklı kasa (ör. VERSO, PLUS, SEDAN): yalnızca kasa kodu veya nesil ipucuyla eşlenir | 278 | 56 |
| tek model yılı, komşu nesil sınırında | 240 | 72 |
| kaynaklı nesil yok — madde var, nesil bilgi kutusu yok | 203 | 37 |
