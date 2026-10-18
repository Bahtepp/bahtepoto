# BAHTEPOTO — GPT Almanya grubu 2. araştırma turu

Araştırma tarihi: 2026-10-18. Ajan: `gpt-german`.

## Teslimat

Bu teslimat **ilk turdaki 12 kayda ek olarak 7 YENİ sorun adayıdır**. Yeni issue kimlikleri `gpt2-` ile başlar; ilk tur JSON dosyaları değiştirilmedi.

- BMW: 2 kayıt — F10/F11 iç kapı tutamacı, E90 FRM elektronik modülü.
- Mercedes-Benz: 2 kayıt — W204 açılır tavan su tahliyesi, W205 ön salıncak burcu sesleri.
- Audi: 3 kayıt — A6 4G açılır MMI ekranı, Q5 ikinci nesil panoramik tavan su girişi, A3 8P ABS/ESP modülü.
- Toplam: 7 issue, 14 kaynak; medium 3, unknown 4, high 0, low 0.

## ÖNEMLİ: otomatik yayımlama uyarıları

Bu JSON'lar araştırma teslimidir, `npm run issues:import` yerel uygulama motorunda henüz çalıştırılmadı. **Dry-run ilk adım olmalıdır.**

Aşağıdaki sorunlar donanım koşulu nedeniyle otomatik genişletilmemeli:

1. Mercedes W204 tavan tahliyesi: yalnızca açılır/panoramik tavan bulunan araçlar; JSON v1 donanım opsiyonunu ifade etmiyor. İmport koşulunu sağlayamazsa `review`.
2. Audi Q5 ikinci nesil: **yalnızca 2018–2023 panoramik tavanlı** araçlar. Resmi Audi bülteni 2075969/2 bunu açıkça belirtiyor. Normal tavanlı tüm Q5'lere yayma.
3. Audi A6 4G MMI ekran: yalnız motorlu açılır ekranlı araçlar. Donanım kontrolü yoksa `review`.
4. Audi A3 8P ABS modülü: kontrol modülü alt tipi/parça kodu kapsamı belirsiz; bütün A3 araçlarına iddialı bir kapsam verme.
5. BMW 5 Serisi F10 kaydı: kullanıcı vakaları esas olarak F10/F11; katalog F10/F11/F07/F18 bir nesil olarak gruplanmış. Diğer gövde tiplerini otomatik aynı kabul etme.

Ayrıca önceki turda yer alan BMW F30 kapı tutamacı sorunuyla anlamsal tekrar kontrolü yapılmalı; farklı kasalarda aynı mekanizma varsa merkezi kayıt üzerinden farklı nesiller bağlanabilir.

Kaynaklar kullanıcı şikâyeti, uzman servis ve üretici teknik bülteninden seçildi. BMW E90 FRM kaydında güç kesilmesi sırasında modül yazılım bozulması bildirilmektedir, fakat bütün araçların aynı revizyonu etkilediği kanıtlanmadı. Mercedes W205 ön sesleri farklı parçalardan gelebilir; bu yüzden yaygınlık belirsiz.

## Kaynak şeffaflığı

Kaynakların `reviewed` alanı gerçekten gözden geçirilen içeriğe göre dolduruldu. Arama sonucunda görüldüğü halde sayfası açılamayan kaynaklarda `reviewed: false` yer alır. Resmi Audi Q5 bülteni Amerikan pazarı teknik dokümanıdır, **Türkiye geri çağırması olarak sunulmamalı**. Yeni içerikler kısa ve bağımsız Türkçe özetlerdir.

## Kullanım

ZIP içindeki 3 JSON dosyasını eski dosyaların üzerine yazmadan şu klasöre ekle:

`data/research/agent-outputs/gpt-german/`

Önce:

`npm run issues:import -- --input data/research/agent-outputs/gpt-german/`

**Özellikle diğer ajanın mevcut kayıtlarını ve ilk tur 12 kaydı koru.** `--apply` yalnızca koşulları doğrulanmış kayıtlar için kullanılmalı.

## Doğrulama

Üç JSON dosyası Draft 2020-12 `bahtepoto-research-v1` şemasına `FormatChecker` ile doğrulandı. Kaynak referansları çözümlendi. BAHTEPOTO yerel kataloğunun bazı modelleri GitHub üzerindeki önceki `main` sürümünden incelendi; en güncel yerel `katalog-turkiye` Cursor dry-run sonucu henüz bilinmiyor.
