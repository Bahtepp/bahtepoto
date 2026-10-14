# Katalog verisi ekleme rehberi

Katalog verisi `src/data/catalog/` altındaki JSON dosyalarında tutulur. Build sırasında
her kayıt **Zod şemasıyla** (`src/lib/catalog/schema.ts`) ve kayıtlar arası ilişkiler
**bütünlük denetimiyle** (`src/lib/catalog/validate.ts`) kontrol edilir. Hatalı bir kayıt
build'i durdurur ve hatanın yerini gösterir.

```text
src/data/catalog/
├── brands.json            # Markalar
├── markets.json           # Pazarlar / bölgeler (eu, tr, gb, na, cn …)
├── sources.json           # Veri kaynakları
├── engines/
│   └── ford.json          # Markaya ait motor tanımları (dizi)
└── models/
    └── ford/
        ├── focus.json     # Model + nesiller + makyaj dönemleri + varyantlar
        └── fiesta.json    # Henüz veri yok ("pending")
```

## Temel kurallar

1. **Kaynaksız veri girilmez.** `sourced`, `conflicting` ve `verified` durumları en az bir
   kaynak ister; `verified` en az bir **birincil** (üretici/resmi) kaynak ister.
2. **Bilinmeyen alan boş bırakılır.** Alanı hiç yazmayın; arayüz "Veri doğrulanıyor" gösterir.
   Tahmini değer girmeyin.
3. **Kaynaklar çelişiyorsa** `status: "conflicting"` verin ve `notes` alanında açıklayın.
   Çelişen değeri (örn. güç) boş bırakın.
4. **Birimleri kaynağın verdiği gibi girin.** Kaynak yalnızca `hp` veriyorsa `ps`'e
   çevirmeyin: `"power": { "hp": 125 }`.
5. **Nesil etiketi her zaman yıllıdır.** `labelPeriod` zorunludur; arayüz `Focus Mk2 (2004–2010)`
   biçiminde üretir. Hangi pazarın ve hangi temelin (üretim / model yılı / satış) yılları
   olduğunu `marketId` ve `basis` ile belirtin.
6. **Türetilmiş tarihler** (örn. makyaj tanıtım tarihinden çıkarılan dönem sınırı) için
   `"approximate": true` verin; arayüz `~2004–2008` olarak gösterir.
7. Her kayıtta `updatedAt` (YYYY-AA-GG) güncellenir.

## Kimlik (id) ve slug

- Yalnızca `a-z`, `0-9` ve `-`. Katalog genelinde benzersiz olmalı.
- Önerilen kalıp: `marka-model-nesil[-dönem|-motor]`
  - Model: `ford-focus`
  - Nesil: `ford-focus-mk2`
  - Makyaj dönemi: `ford-focus-mk2-facelift`
  - Varyant: `ford-focus-mk2-duratorq-16-109-g8da`
  - Motor: `ford-duratorq-16-109-g8da`
- `slug` URL'de görünen kısa addır ve kendi üst kaydı içinde benzersiz olmalı
  (örn. nesil `mk2`, dönem `makyajli`).

## Yeni model eklemek

`src/data/catalog/models/<marka>/<model>.json`:

```json
{
  "id": "ford-fiesta",
  "brandId": "ford",
  "slug": "fiesta",
  "name": "Fiesta",
  "order": 10,
  "status": "pending",
  "updatedAt": "2026-10-15",
  "generations": []
}
```

Nesil bilgisi doğrulanana kadar `generations` boş kalır; arayüz modeli "Veri doğrulanıyor"
olarak listeler.

## Nesil ve makyaj dönemi eklemek

```json
{
  "id": "ford-focus-mk3",
  "slug": "mk3",
  "name": "Focus Mk3",
  "code": "C346",
  "order": 2,
  "labelPeriod": { "marketId": "eu", "basis": "model-year", "start": { "year": 2011 }, "end": { "year": 2018 } },
  "periods": [
    { "marketId": "na", "basis": "model-year", "start": { "year": 2012 }, "end": { "year": 2019 } }
  ],
  "status": "sourced",
  "sourceIds": ["wp-en-ford-focus-mk3"],
  "updatedAt": "2026-10-15",
  "revisions": [
    {
      "id": "ford-focus-mk3-pre-facelift", "slug": "makyajsiz", "name": "Makyajsız",
      "kind": "pre-facelift", "order": 0,
      "periods": [{ "marketId": "eu", "basis": "model-year", "start": { "year": 2011 }, "end": { "year": 2014 } }],
      "status": "sourced", "sourceIds": ["wp-en-ford-focus-mk3"], "updatedAt": "2026-10-15"
    }
  ],
  "variants": []
}
```

- BMW/Mercedes gibi markalarda `name` markanın kendi adlandırmasını taşır
  (örn. `"3 Serisi (E46)"`, `"C-Serisi (W204)"`); Mk1/Mk2 zorunlu değildir.
- **Makyajı olmayan nesillerde `revisions` boş bırakılır.** Yapay "makyajlı/makyajsız"
  ayrımı eklenmez. Birden fazla makyaj için `kind: "update"` ve artan `order` kullanılır.
- Ülkeye göre farklı dönemler `periods` dizisine ayrı kayıtlar olarak eklenir.

## Motor eklemek

Önce `engines/<marka>.json` dosyasına motor tanımı:

```json
{
  "id": "ford-duratorq-16-109-g8da", "brandId": "ford", "slug": "duratorq-16-109-g8da",
  "name": "1.6 TDCi 109 PS", "family": "Duratorq TDCi", "codes": ["G8DA"],
  "fuel": "diesel", "displacementL": 1.6, "cylinders": 4, "aspiration": "turbo",
  "power": { "ps": 109 }, "torqueNm": 260,
  "status": "sourced", "sourceIds": ["wp-en-ford-focus-mk2-eu"], "updatedAt": "2026-10-15"
}
```

Yakıt türleri: `petrol`, `diesel`, `lpg`, `cng`, `mild-hybrid`, `hybrid`, `plug-in-hybrid`,
`electric`, `flex-fuel`.

Aynı motor birden fazla modelde kullanılıyorsa tek tanım yeterlidir. Kaynaklar farklı değer
veriyorsa, birincil kaynakla doğrulanana kadar **ayrı kayıt** tutun ve `notes`'ta belirtin.

## Motoru nesle bağlamak (varyant)

Neslin `variants` dizisine:

```json
{
  "id": "ford-focus-mk2-duratorq-20-110-ixda",
  "slug": "duratorq-20-110-ixda",
  "engineId": "ford-duratorq-20-110-ixda",
  "revisionIds": ["ford-focus-mk2-facelift"],
  "revisionMapping": "confirmed",
  "transmissions": [{ "type": "manual", "gears": 6 }],
  "marketIds": ["eu"],
  "status": "sourced",
  "sourceIds": ["wp-en-ford-focus-mk2-eu"],
  "updatedAt": "2026-10-15",
  "notes": "Kaynağa göre 2008 makyajıyla eklendi."
}
```

`revisionMapping` motorun hangi makyaj dönemine ait olduğunun güvenilirliğidir:

| Değer | Anlamı | Arayüz |
|---|---|---|
| `confirmed` | `revisionIds` kaynakla kesin | Yalnızca listelenen dönemlerde görünür |
| `partial` | Listelenen dönemlerde kesin; başkalarında da olabilir | Listelenen dönemlerde görünür; diğer dönemlerde "doğrulanmamış" grubunda |
| `unknown` | Dönem bilinmiyor (`revisionIds` boş) | Hiçbir dönemin altına eklenmez; "doğrulanmamış" grubunda gösterilir |

Bir şanzıman yalnızca belirli dönemde sunulduysa `transmissions[].revisionIds` ile belirtin.

## Kaynak eklemek

`sources.json`:

```json
{
  "id": "ford-media-focus-2018-press-kit",
  "title": "Yeni Ford Focus basın kiti",
  "url": "https://…",
  "publisher": "Ford of Europe",
  "tier": "primary",
  "accessedAt": "2026-10-15",
  "language": "en"
}
```

`tier`: `primary` (üretici/resmi), `secondary` (ansiklopedi, basın), `community` (forum, kullanıcı).

## Kontrol

```bash
npm run build
```

Şema veya bütünlük hatası varsa build, dosya ve kayıt yolunu belirterek durur, örn.:

```text
Katalog verisinde 2 bütünlük hatası:
  - models/ford-focus/mk2/variants/duratec-14-80: bilinmeyen motor "ford-yok"
  - models/ford-focus/mk3 labelPeriod: dönem bitişi başlangıçtan önce
```
