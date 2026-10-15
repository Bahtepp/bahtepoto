# Fark raporu: wikidata

> Bu rapor `npm run import:diff` ile üretildi. Aday kayıtlar **henüz kataloğa yazılmadı**;
> `npm run import:promote` varsayılan olarak yalnızca kuru çalıştırma yapar.

## Özet

| Yeni | Değişen | Çelişen | Değişmeyen | Hata | Uyarı |
|---|---|---|---|---|---|
| 9 | 0 | 0 | 0 | 0 | 6 |

## `data/staging/wikidata/volkswagen-golf.json`

- Kaynak: Wikidata — lisans: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) — yayımlanabilir: evet
- Atıf: Wikidata (CC0 1.0), https://www.wikidata.org
- Ham verinin alındığı gün: 2026-10-15
- Ham dosyalar (git dışı): `.cache/import/wikidata/2026-10-15/Q1428988.json`, `.cache/import/wikidata/2026-10-15/Q1417956.json`, `.cache/import/wikidata/2026-10-15/Q62362.json`, `.cache/import/wikidata/2026-10-15/Q56403002.json`

### Yeni kayıtlar (9)

#### Model `volkswagen-golf` — Yeni

- Hedef: `src/data/catalog/models/volkswagen/golf.json`
- `import:promote --write`: yazılmaz — aday dosyasında kaynağa dayanmayan yer tutucu alanlar var; insan onayı (--accept-placeholders) gerekli

| Alan | Aday | Köken |
|---|---|---|
| `brandId` | `volkswagen` | yapılandırma · İçe aktarma yapılandırması (scripts/import/wikidata/config.ts); her nesilde P1716 = Q246 doğrulandı |
| `slug` | `golf` | yapılandırma · İçe aktarma yapılandırması (scripts/import/wikidata/config.ts) |
| `name` | `Golf` | yapılandırma · İçe aktarma yapılandırması (scripts/import/wikidata/config.ts) |
| `status` | `unverified` | — |
| `notes` | `Wikidata nesil iskeleti (Mk5–Mk8). Makyaj dönemi, motor ve pazar verisi henüz yok; yıllar doğrulanmadı.` | — |

#### Nesil `volkswagen-golf-mk5` — Yeni

- Hedef: `src/data/catalog/models/volkswagen/golf.json`
- `import:promote --write`: yazılmaz — aday dosyasında kaynağa dayanmayan yer tutucu alanlar var; insan onayı (--accept-placeholders) gerekli

| Alan | Aday | Köken |
|---|---|---|
| `slug` | `mk5` | türetildi · `Q1428988#labels.en` · 2026-10-15 · "Volkswagen Golf Mk5" etiketinden |
| `name` | `Golf Mk5` | türetildi · `Q1428988#labels.en` · 2026-10-15 · "Volkswagen Golf Mk5" etiketinden |
| `order` | `4` | türetildi · `Q1428988#labels.en` · 2026-10-15 · "Mk5" sıra numarası eksi 1 |
| `labelPeriod.marketId` | `eu` | **YER TUTUCU** |
| `labelPeriod.basis` | `production` | **YER TUTUCU** |
| `labelPeriod.start.year` | `2003` | kaynak · `Q1428988#P580` · 2026-10-15 · Wikidata'daki dayanak: https://de.wikipedia.org/wiki/VW_Golf (P143 Q48183 üzerinden aktarılmış). |
| `labelPeriod.end.year` | `2009` | kaynak · `Q1428988#P582` · 2026-10-15 · Wikidata'daki dayanak: https://de.wikipedia.org/wiki/VW_Golf (P143 Q48183 üzerinden aktarılmış). |
| `status` | `unverified` | — |
| `sourceIds` | `["wikidata-q1428988"]` | — |
| `notes` | `Yıllar (2003–2009) Wikidata Q1428988 öğesinin P580/P582 değerlerinden alındı ve doğrulanmadı. Wikidata bu yılların üretim, satış ya da model yılı olduğunu ve hangi pazara ait olduğunu belirtmiyor; etiketteki pazar (eu) ve temel (production) kaynağa dayanmayan yer tutuculardır. Wikidata makyaj bilgisi vermediği için makyaj dönemi oluşturulmadı.` | — |

**Kaynağa dayanmayan yer tutucular:**

- `labelPeriod.marketId`: Wikidata P580/P582 yılların hangi pazara ve hangi temele (üretim / satış / model yılı) ait olduğunu belirtmiyor; "eu" / "production" yer tutucudur.
- `labelPeriod.basis`: Wikidata P580/P582 yılların hangi pazara ve hangi temele (üretim / satış / model yılı) ait olduğunu belirtmiyor; "eu" / "production" yer tutucudur.

#### Nesil `volkswagen-golf-mk6` — Yeni

- Hedef: `src/data/catalog/models/volkswagen/golf.json`
- `import:promote --write`: yazılmaz — aday dosyasında kaynağa dayanmayan yer tutucu alanlar var; insan onayı (--accept-placeholders) gerekli

| Alan | Aday | Köken |
|---|---|---|
| `slug` | `mk6` | türetildi · `Q1417956#labels.en` · 2026-10-15 · "Volkswagen Golf Mk6" etiketinden |
| `name` | `Golf Mk6` | türetildi · `Q1417956#labels.en` · 2026-10-15 · "Volkswagen Golf Mk6" etiketinden |
| `order` | `5` | türetildi · `Q1417956#labels.en` · 2026-10-15 · "Mk6" sıra numarası eksi 1 |
| `labelPeriod.marketId` | `eu` | **YER TUTUCU** |
| `labelPeriod.basis` | `production` | **YER TUTUCU** |
| `labelPeriod.start.year` | `2008` | kaynak · `Q1417956#P580` · 2026-10-15 · Wikidata'daki dayanak: https://de.wikipedia.org/wiki/VW_Golf (P143 Q48183 üzerinden aktarılmış). |
| `labelPeriod.end.year` | `2012` | kaynak · `Q1417956#P582` · 2026-10-15 · Wikidata'daki dayanak: https://de.wikipedia.org/wiki/VW_Golf (P143 Q48183 üzerinden aktarılmış). |
| `status` | `unverified` | — |
| `sourceIds` | `["wikidata-q1417956"]` | — |
| `notes` | `Yıllar (2008–2012) Wikidata Q1417956 öğesinin P580/P582 değerlerinden alındı ve doğrulanmadı. Wikidata bu yılların üretim, satış ya da model yılı olduğunu ve hangi pazara ait olduğunu belirtmiyor; etiketteki pazar (eu) ve temel (production) kaynağa dayanmayan yer tutuculardır. Wikidata makyaj bilgisi vermediği için makyaj dönemi oluşturulmadı.` | — |

**Kaynağa dayanmayan yer tutucular:**

- `labelPeriod.marketId`: Wikidata P580/P582 yılların hangi pazara ve hangi temele (üretim / satış / model yılı) ait olduğunu belirtmiyor; "eu" / "production" yer tutucudur.
- `labelPeriod.basis`: Wikidata P580/P582 yılların hangi pazara ve hangi temele (üretim / satış / model yılı) ait olduğunu belirtmiyor; "eu" / "production" yer tutucudur.

#### Nesil `volkswagen-golf-mk7` — Yeni

- Hedef: `src/data/catalog/models/volkswagen/golf.json`
- `import:promote --write`: yazılmaz — aday dosyasında kaynağa dayanmayan yer tutucu alanlar var; insan onayı (--accept-placeholders) gerekli

| Alan | Aday | Köken |
|---|---|---|
| `slug` | `mk7` | türetildi · `Q62362#labels.en` · 2026-10-15 · "Volkswagen Golf Mk7" etiketinden |
| `name` | `Golf Mk7` | türetildi · `Q62362#labels.en` · 2026-10-15 · "Volkswagen Golf Mk7" etiketinden |
| `order` | `6` | türetildi · `Q62362#labels.en` · 2026-10-15 · "Mk7" sıra numarası eksi 1 |
| `labelPeriod.marketId` | `eu` | **YER TUTUCU** |
| `labelPeriod.basis` | `production` | **YER TUTUCU** |
| `labelPeriod.start.year` | `2012` | kaynak · `Q62362#P580` · 2026-10-15 · Wikidata'daki dayanak: https://de.wikipedia.org/wiki/VW_Golf (P143 Q48183 üzerinden aktarılmış). |
| `labelPeriod.end.year` | `2021` | kaynak · `Q62362#P582` · 2026-10-15 · Wikidata'daki dayanak: https://de.wikipedia.org/wiki/VW_Golf (P143 Q48183 üzerinden aktarılmış). |
| `status` | `unverified` | — |
| `sourceIds` | `["wikidata-q62362"]` | — |
| `notes` | `Yıllar (2012–2021) Wikidata Q62362 öğesinin P580/P582 değerlerinden alındı ve doğrulanmadı. Wikidata bu yılların üretim, satış ya da model yılı olduğunu ve hangi pazara ait olduğunu belirtmiyor; etiketteki pazar (eu) ve temel (production) kaynağa dayanmayan yer tutuculardır. Wikidata makyaj bilgisi vermediği için makyaj dönemi oluşturulmadı.` | — |

**Kaynağa dayanmayan yer tutucular:**

- `labelPeriod.marketId`: Wikidata P580/P582 yılların hangi pazara ve hangi temele (üretim / satış / model yılı) ait olduğunu belirtmiyor; "eu" / "production" yer tutucudur.
- `labelPeriod.basis`: Wikidata P580/P582 yılların hangi pazara ve hangi temele (üretim / satış / model yılı) ait olduğunu belirtmiyor; "eu" / "production" yer tutucudur.

#### Nesil `volkswagen-golf-mk8` — Yeni

- Hedef: `src/data/catalog/models/volkswagen/golf.json`
- `import:promote --write`: yazılmaz — aday dosyasında kaynağa dayanmayan yer tutucu alanlar var; insan onayı (--accept-placeholders) gerekli

| Alan | Aday | Köken |
|---|---|---|
| `slug` | `mk8` | türetildi · `Q56403002#labels.en` · 2026-10-15 · "Volkswagen Golf Mk8" etiketinden |
| `name` | `Golf Mk8` | türetildi · `Q56403002#labels.en` · 2026-10-15 · "Volkswagen Golf Mk8" etiketinden |
| `order` | `7` | türetildi · `Q56403002#labels.en` · 2026-10-15 · "Mk8" sıra numarası eksi 1 |
| `labelPeriod.marketId` | `eu` | **YER TUTUCU** |
| `labelPeriod.basis` | `production` | **YER TUTUCU** |
| `labelPeriod.start.year` | `2019` | kaynak · `Q56403002#P580` · 2026-10-15 · Wikidata'daki dayanak: https://de.wikipedia.org/wiki/VW_Golf (P143 Q48183 üzerinden aktarılmış). |
| `labelPeriod.end` | `null` | **YER TUTUCU** |
| `status` | `unverified` | — |
| `sourceIds` | `["wikidata-q56403002"]` | — |
| `notes` | `Yıllar (2019–bitiş yok) Wikidata Q56403002 öğesinin P580/P582 değerlerinden alındı ve doğrulanmadı. Wikidata bu yılların üretim, satış ya da model yılı olduğunu ve hangi pazara ait olduğunu belirtmiyor; etiketteki pazar (eu) ve temel (production) kaynağa dayanmayan yer tutuculardır. Wikidata'da bitiş yılı yok; nesil "sürüyor" olarak yazıldı ama bu doğrulanmadı. Wikidata makyaj bilgisi vermediği için makyaj dönemi oluşturulmadı.` | — |

**Kaynağa dayanmayan yer tutucular:**

- `labelPeriod.marketId`: Wikidata P580/P582 yılların hangi pazara ve hangi temele (üretim / satış / model yılı) ait olduğunu belirtmiyor; "eu" / "production" yer tutucudur.
- `labelPeriod.basis`: Wikidata P580/P582 yılların hangi pazara ve hangi temele (üretim / satış / model yılı) ait olduğunu belirtmiyor; "eu" / "production" yer tutucudur.
- `labelPeriod.end`: Wikidata'da P582 (bitiş) yok. Katalogda null "sürüyor" anlamına gelir; bu kaynakta doğrulanmadı.

#### Kaynak `wikidata-q1428988` — Yeni

- Hedef: `src/data/catalog/sources.json`
- `import:promote --write`: yazılmaz — bu dosyadan uygulanan aday kayıt yok

| Alan | Aday | Köken |
|---|---|---|
| `title` | `Volkswagen Golf Mk5 (Wikidata Q1428988)` | — |
| `url` | `https://www.wikidata.org/wiki/Q1428988` | — |
| `publisher` | `Wikidata` | — |
| `tier` | `secondary` | — |
| `accessedAt` | `2026-10-15` | — |
| `language` | `mul` | — |
| `notes` | `CC0 1.0. Topluluk tarafından düzenlenir. Okunan revizyon: 2469710653.` | — |

#### Kaynak `wikidata-q1417956` — Yeni

- Hedef: `src/data/catalog/sources.json`
- `import:promote --write`: yazılmaz — bu dosyadan uygulanan aday kayıt yok

| Alan | Aday | Köken |
|---|---|---|
| `title` | `Volkswagen Golf Mk6 (Wikidata Q1417956)` | — |
| `url` | `https://www.wikidata.org/wiki/Q1417956` | — |
| `publisher` | `Wikidata` | — |
| `tier` | `secondary` | — |
| `accessedAt` | `2026-10-15` | — |
| `language` | `mul` | — |
| `notes` | `CC0 1.0. Topluluk tarafından düzenlenir. Okunan revizyon: 2469714677.` | — |

#### Kaynak `wikidata-q62362` — Yeni

- Hedef: `src/data/catalog/sources.json`
- `import:promote --write`: yazılmaz — bu dosyadan uygulanan aday kayıt yok

| Alan | Aday | Köken |
|---|---|---|
| `title` | `Volkswagen Golf Mk7 (Wikidata Q62362)` | — |
| `url` | `https://www.wikidata.org/wiki/Q62362` | — |
| `publisher` | `Wikidata` | — |
| `tier` | `secondary` | — |
| `accessedAt` | `2026-10-15` | — |
| `language` | `mul` | — |
| `notes` | `CC0 1.0. Topluluk tarafından düzenlenir. Okunan revizyon: 2556978941.` | — |

#### Kaynak `wikidata-q56403002` — Yeni

- Hedef: `src/data/catalog/sources.json`
- `import:promote --write`: yazılmaz — bu dosyadan uygulanan aday kayıt yok

| Alan | Aday | Köken |
|---|---|---|
| `title` | `Volkswagen Golf Mk8 (Wikidata Q56403002)` | — |
| `url` | `https://www.wikidata.org/wiki/Q56403002` | — |
| `publisher` | `Wikidata` | — |
| `tier` | `secondary` | — |
| `accessedAt` | `2026-10-15` | — |
| `language` | `mul` | — |
| `notes` | `CC0 1.0. Topluluk tarafından düzenlenir. Okunan revizyon: 2469873933.` | — |

## Uyarılar

- wikidata/volkswagen-golf.json volkswagen-golf-mk5: kaynağa dayanmayan yer tutucu alanlar (labelPeriod.marketId, labelPeriod.basis); onaydan önce doğrulanmalı
- wikidata/volkswagen-golf.json volkswagen-golf-mk6: kaynağa dayanmayan yer tutucu alanlar (labelPeriod.marketId, labelPeriod.basis); onaydan önce doğrulanmalı
- wikidata/volkswagen-golf.json volkswagen-golf-mk7: kaynağa dayanmayan yer tutucu alanlar (labelPeriod.marketId, labelPeriod.basis); onaydan önce doğrulanmalı
- wikidata/volkswagen-golf.json volkswagen-golf-mk8: kaynağa dayanmayan yer tutucu alanlar (labelPeriod.marketId, labelPeriod.basis, labelPeriod.end); onaydan önce doğrulanmalı
- models/volkswagen/golf.json: "volkswagen-golf-mk5" bitişi (2009) "volkswagen-golf-mk6" başlangıcından (2008) sonra; yıllar üst üste biniyor (pazar veya yıl temeli farkı olabilir)
- models/volkswagen/golf.json: "volkswagen-golf-mk7" bitişi (2021) "volkswagen-golf-mk8" başlangıcından (2019) sonra; yıllar üst üste biniyor (pazar veya yıl temeli farkı olabilir)

## Hatalar

Yok. Birleştirilmiş katalog şemaları ve bütünlük denetimini geçiyor.
