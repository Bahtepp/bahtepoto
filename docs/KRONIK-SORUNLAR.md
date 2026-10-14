# Kronik sorun verisi

Kronik sorunlar **katalogdan bağımsız** tutulur ve araçlara yalnızca uygulanabilirlik
seçicileriyle bağlanır. Böylece ileride dış kaynaklardan toplanan binlerce kayıt, katalog
dosyalarına dokunmadan eşleştirilebilir.

```text
src/data/issues/                 # CANLI veri (araç sayfalarında gösterilir)
├── sources.json                 # Kronik sorun kaynakları
└── records/<marka>/<model>.json # Sorun kayıtları (dizi)

src/data/issues-demo/            # ÖRNEK veri (yalnızca /ornek/kronik-sorunlar/)
├── sources.json                 # "demo": true
└── records/*.json               # "demo": true
```

| Dosya | Görev |
|---|---|
| `src/lib/issues/schema.ts` | Zod şeması |
| `src/lib/issues/validate.ts` | Kanıt kuralları ve katalog referansı denetimi (build'i durdurur) |
| `src/lib/issues/match.ts` | Sorun ↔ araç eşleştiricisi (saf fonksiyon) |
| `src/lib/issues/format.ts` | Türkçe etiketler, kapsam metni |
| `tests/issues-*.test.ts` | Eşleştirici ve kanıt kuralı testleri (`npm test`) |

## Kayıt şeması

| Alan | Açıklama |
|---|---|
| `id`, `slug` | Benzersiz kimlik |
| `brandId` | Marka |
| `kind` | `chronic` (tekrarlayan), `known-defect` (bilinen kusur), `recall` (geri çağırma), `service-campaign` |
| `category` | `engine`, `fuel-system`, `transmission`, `electrical` … |
| `title` | Kısa başlık |
| `summary` | 1–2 cümlelik sade açıklama (en fazla 320 karakter) |
| `symptoms` | Başlıca belirtiler (ilk 3'ü listede görünür) |
| `symptomDetails` | Ayrıntılı belirtiler (genişletilen bölümde) |
| `checks` | Satın alırken kontrol edilecekler |
| `remedies[]` | Çözüm / onarım; her biri kaynak ister |
| `appliesTo[]` | Uygulanabilirlik seçicileri (aşağıda) |
| `excludes[]` | Kapsam dışı tutulan araçlar |
| `severity` | Ciddiyet: `low` / `moderate` / `high` / `safety` + gerekçe + kaynak |
| `prevalence` | Görülme sıklığı **kanıt düzeyi** + kaynak |
| `claims[]` | Hangi kaynağın hangi yönü (`existence`, `scope`, `symptoms`, `severity`, `prevalence`, `remedy`) desteklediği / çürüttüğü |
| `status` | `verified` / `supported` / `researching` / `disputed` |
| `updatedAt` | Son güncelleme |
| `demo` | Örnek kayıt (canlı veride daima `false`) |

**Ciddiyet ≠ görülme sıklığı.** `severity` sorun ortaya çıktığında sonucun ağırlığıdır;
`prevalence` ne kadar sık görüldüğüne dair *kanıtın* düzeyidir. Arayüz "çok sık görülür"
gibi bir ifade üretmez; yalnızca kanıt düzeyini adlandırır (örn. "Güvenilirlik araştırmasıyla
destekleniyor"). Kanıt yoksa "Görülme sıklığına dair kanıt yok" yazar.

## Uygulanabilirlik seçicisi

Bir seçicideki dolu alanların **hepsi** sağlanmalı (VE). Birden fazla seçici VEYA'dır.

| Alan | Örnek | Not |
|---|---|---|
| `modelIds` | `["ford-focus"]` | Bütün model |
| `generationIds` | `["ford-focus-mk2"]` | Yalnızca bir kasa |
| `revisionIds` | `["ford-focus-mk2-facelift"]` | Yalnızca bir makyaj dönemi |
| `engineIds` | `["ford-duratorq-20-110-ixda"]` | Katalogdaki motor kaydı |
| `engineCodes` | `["G8DA"]` | Kataloğa bağımlı değil; büyük/küçük harf duyarsız |
| `engineFamilies` | `["Duratorq TDCi"]` | Motor ailesi |
| `fuels` | `["diesel"]` | Yakıt türü |
| `aspirations` | `["turbo"]` | Aşırı besleme; motorun bilgisi yoksa eşleşme koşullu |
| `transmissions` | `[{ "name": "PowerShift" }]` | Tür / ad / vites sayısı |
| `years` | `{ "from": 2020, "fromMonth": 6, "to": 2020, "toMonth": 11, "basis": "production", "marketId": "eu" }` | Üretim / model yılı / satış; ay isteğe bağlı |
| `marketIds` | `["gb"]` | Pazar (alt pazar hiyerarşisi desteklenir) |

`engineIds` / `engineCodes` / `engineFamilies` kendi aralarında VEYA'dır.

## Eşleştirme kuralları

Sonuç: **uygulanır**, **koşullu** (gerekçesiyle) veya **uygulanmaz**. Belirsizlik hiçbir
zaman "uygulanır" üretmez.

- Motora özgü sorun aynı kasanın **diğer motorlarına eklenmez**.
- Kasa / model geneli sorun motor değişince **kaybolmaz**.
- Motor kodu bilinmeyen motorlar kod bazlı seçicilerle **eşleştirilmez** (yanlış pozitif önlemi).
- Motorun seçilen makyaj döneminde sunulduğu katalogda doğrulanmadıysa motora özgü sorunlar
  yalnızca **koşullu** gösterilir; kasa geneli sorunlar etkilenmez.
- Yıl aralığı dönemle kısmen örtüşüyorsa koşullu, örtüşmüyorsa uygulanmaz. Yaklaşık (`~`)
  dönemlerde ve farklı ölçüm temellerinde 1 yıl tolerans uygulanır; bu durumlarda kesin eşleşme
  yalnızca dönem tamamen kapsanıyorsa verilir.
- Şanzıman: aracın bilinen seçeneklerinin tamamı eşleşiyorsa uygulanır, bir kısmı eşleşiyorsa
  koşullu, hiçbiri eşleşmiyorsa uygulanmaz; şanzıman bilgisi yoksa koşullu.
- Pazar: farklı pazar → uygulanmaz; aracın pazarının alt pazarı (Avrupa aracı, Birleşik
  Krallık kaydı) → koşullu.

Araç sayfasında gruplar: **motora özgü**, **kasa ve model geneli**, **koşullu eşleşmeler**,
**araştırılan veya tartışmalı kayıtlar**.

## Geri çağırma bilgisi (`recall`)

`recall` ve `service-campaign` türü kayıtlarda zorunludur: `campaignCode` (örn. Ford 21S36),
`references` (resmi kayıt no), `productionFrom` / `productionTo`, `vinRangePublished`,
`reportingCountries`, `otherModels`, `relatedIssueIds` (ilişkili ama ayrı kampanyalar). Seçicideki
üretim yılları kampanya tarihlerini aşamaz. VIN aralığı yayımlanmamışsa arayüz kampanyayı hiçbir araçta
kesin göstermez ve şasi numarasıyla resmi kontrol ister.

## Kaynak içerik kontrolü

Her kaynakta `review` (`content-checked` / `inaccessible` / `not-checked`, tarih, yöntem) tutulur:
bağlantının bulunması içeriğin doğrulandığı anlamına gelmez. Aynı haberin farklı yayınları `basedOn`
ile işaretlenir ve bağımsız kaynak sayımında tek sayılır. Denetim örneği:
[FOCUS-DATA-AUDIT.md](FOCUS-DATA-AUDIT.md).

## Kaynak türleri ve kanıt kuralları

| `kind` | Tür |
|---|---|
| `manufacturer-bulletin` | Üretici teknik bülteni, servis kampanyası |
| `official-recall` | Resmi geri çağırma kaydı |
| `technical-publication` | Güvenilir teknik yayın / araştırma |
| `reliability-survey` | Geniş kapsamlı güvenilirlik araştırması |
| `expert-service` | Uzman servis gözlemi |
| `user-report` | Kullanıcı raporu, forum |

Build sırasında denetlenen kurallar:

1. `verified`: varlık iddiası üretici bülteni / resmi geri çağırmayla **ya da** en az iki farklı
   yayıncıdan teknik yayın / araştırma / uzman servis kaynağıyla desteklenmeli.
2. `verified` / `supported`: en az bir kullanıcı-dışı kaynak gerekir. Yalnızca kullanıcı
   raporlarına dayanan kayıt `researching` olmalıdır.
3. Çürütücü (`contradicts`) kaynak varsa durum `disputed` veya `researching` olmalıdır;
   çelişki arayüzde gösterilir.
4. `recall` türü resmi geri çağırma kaynağı ister. **Geri çağırma tek başına görülme sıklığı
   kanıtı değildir.**
5. `prevalence`: `repeated-reports` ≥ 2 kaynak; `expert-observed` uzman servis;
   `survey-supported` güvenilirlik araştırması; `manufacturer-acknowledged` üretici bülteni
   (geri çağırma yetmez).
6. `chronic` türü (`verified`/`supported` iken) tekrarlama kanıtı (`repeated-reports` veya üstü) ister.
7. Ciddiyet, sıklık ve çözüm kaynakları `claims` listesinde de yer almalıdır.
8. Katalog referansları (model, nesil, dönem, motor, pazar) var olmalı ve birbiriyle tutarlı olmalı.
9. Canlı veride `demo: true` kayıt / kaynak bulunamaz; örnek veride her kayıt `demo: true` olmalı.
10. Canlı veride `verified` / `supported` kayıtların en az bir varlık kaynağının içeriği okunmuş (`review.status: "content-checked"`) olmalı.
11. Aynı habere dayanan kaynaklar (`basedOn`) `verified` için iki bağımsız kaynak yerine geçmez.
12. `recall` / `service-campaign` türü `recall` bilgisi ister; seçicinin üretim yılları kampanya tarihlerini aşamaz.

## Örnek kayıt (yapı gösterimi — gerçek bir sorun değildir)

```json
{
  "id": "ford-focus-mk2-ornek",
  "slug": "ornek",
  "brandId": "ford",
  "kind": "known-defect",
  "category": "fuel-system",
  "title": "…",
  "summary": "…",
  "symptoms": ["…"],
  "checks": ["…"],
  "appliesTo": [{ "modelIds": ["ford-focus"], "generationIds": ["ford-focus-mk2"], "engineCodes": ["G8DA"] }],
  "claims": [{ "sourceId": "…", "aspects": ["existence", "scope"], "stance": "supports" }],
  "status": "supported",
  "updatedAt": "2026-10-15"
}
```

## Kontrol

```bash
npm test
```

```bash
npm run build
```
