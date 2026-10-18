# Paralel araştırma — 18 Ekim 2026

Başlangıç `katalog-turkiye` üzerinde `0bd62bf` ve `62d3cbf` ile uyuşuyordu. Önceki kronik kayıtlar duruyor. Uzak depoya gönderilmedi.

## Gemini

`data/research/agent-outputs/gemini-stellantis/` hazır. İçinde sorun JSON’u yok. Gemini tarayıcıda çalıştığı için dosyayı kullanıcı teslim edecek. Kuru çalıştırma 0 kayıt verdi; aktarılmış gibi sayılmadı.

Markalar: Fiat, Opel, Peugeot, Citroën. Şema `bahtepoto-research-v1`, ajan adı `gemini-stellantis`.

## Teslim edilen dosyalar

| Ajan | Bu turda gelen | Aktarılan | İncelemede bırakılan |
| --- | --- | ---: | ---: |
| Cursor, Volkswagen Grubu 2. tur | 3 sorun | 3 | 0 |
| Astra 2. tur | 6 yeni sorun; 1. tur dosyaları da daraltıldı | 2 | 18 |
| GPT 2. tur | 7 sorun | 0 | 7 |
| Claude | Yeni dosya yok | 0 | 0 |
| Gemini | Dosya yok | 0 | 0 |

Tur kuralı `data/research/agent-outputs/TUR-STANDARDI.md` içindedir. Eski JSON silinmedi.

## Astra’nın 14 kaydı

Bir kayıt çözülüp aktarıldı: Lodgy far kumandası yalnız 2016 model yılı. Diğer yıllara açılmadı.

İncelemede kalanlar: K9K kodu, Bosch ABS parça numarası, Clio 1.2 16V, Fluence EDC, Sandero Easy-R motor adı, Duster HJD, Sandero kontak nesli, Laguna, Kangoo, Scenic, Megane I klima ve Duster sinyal kablosu. Katalog bu koşulları ayıramıyor.

İkinci turdan Megane II elektrikli camı yalnız 2005 ve 2008 yıllarıyla aktarıldı. Clio IV airbag kaydı bütün kasaya yayılacağı için yayımlanmadı. Clio III beyin, E-Tech pompa, Duster ekran ve Jogger ECO-G katalogda ayrılmadığı için incelemede.

## Volkswagen Grubu

Üç yeni sorun, hepsinin yaygınlığı orta:

- Golf VII `1.5 TSI ACT 150 PS`, 2017–2020
- T-Roc 1. nesil aynı motor, 2017–2020
- Karoq `1.5 TSI ACT 150 PS`, 2017–2020
- Leon 5F `1.5 ACT 150 PS`, 2017–2020
- Ateca `1.5 ACT 150 PS`, 2017–2020

Golf 8, eTSI, Taigo, T-Roc’un 2022 sonrası 1.5 satırı, 1.4 devirdaim kaydı ve DQ200 kaydı bu soruna bağlanmadı. Katalog yalnız “DSG” diyorsa alt tip yüklenmedi.

Boş bırakılanlar: Polo, Jetta, Tiguan, Taigo, Touran, Caddy, Fabia, Rapid, Scala, Kamiq, Kodiaq, Yeti, Octavia ve Superb’in bu turdaki yeni konusu, Ibiza, Arona, Toledo, CUPRA Formentor, Leon, Ateca ve Born. Bu modellere uydurma sorun yazılmadı. Formentor 1.5 için tek sahip yorumu, 2021–2024 satırının tamamına yetmedi.

## Bekleyen teknik kapsam

- GPT: A6 MMI ekranı, Q5 panoramik tahliye, F10 kapı tutamacı ve E90 FRM. Katalog donanımı veya F07/F18 ve E91/E92/E93 ayrımını taşımıyor.
- GPT: A3 ABS, W204 tavan tahliyesi ve W205 salıncak kaynakları okunmamış işaretli.
- Astra’daki parça ve motor kodu kayıtları yukarıda.

Yinelenen kart açılmadı. Birinci turların ikinci aktarımı `duplicate`.

## Testler

- `npm test`: 289 geçti
- `npm run check`: 0 hata, 1 eski ipucu
- `npm run build`: 5239 sayfa
- `npm run import:check`: geçti
- `npm run catalog:audit`: satıldı 4, listede 4928, ithal 68, Türkiye kaydı yok 42
- `npm audit`: 0 açık

Türkiye kataloğu ve arayüz değişmedi.
