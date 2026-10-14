# Ford Focus veri kalite denetimi

**Tarih:** 15.10.2026 · **Kapsam:** `src/data/issues/` altındaki canlı Ford Focus kayıtları ·
**Kontrol noktası:** denetim öncesi durum yerel `focus-veri-denetimi` dalında `2c9445a` commit'inde.

Makine tarafından okunabilir kayıt kayıt sonuçlar: [`focus-data-audit.json`](focus-data-audit.json)
(ID, başlık, kaynak URL'leri, kaynak erişim durumu, resmi kayıt numaraları, kapsam, denetim sonucu,
düzeltme, kalan belirsizlik).

## Özet

| Ölçüt | Sayı |
|---|---|
| İncelenen kayıt | **32** (21 geri çağırma, 3 bilinen kusur, 8 kronik sorun adayı) |
| İncelenen kaynak | **43** |
| İçeriği okunup doğrulanan kaynak | **43** |
| Erişilemeyen kaynak | **0** (yardımcı kaynak DVSA veri dosyası erişilemedi; aşağıda) |
| Kaynakla doğru eşleşen kayıt (veri değişmedi) | **20** |
| Düzeltilen kayıt | **12** |
| Belirsizliği süren kayıt | **12** (düzeltilenlerle kesişebilir) |
| Bulunan yanlış motor / kasa / yıl eşleşmesi | **9 kayıtta** + 1 sistem hatası (aşağıda) |
| Kayıt silinen / birleştirilen | 0 (ID'lerin tamamı korundu) |

### Kaynaklara nasıl erişildi

| Kaynak | Adet | Yöntem | Sonuç |
|---|---|---|---|
| AB Safety Gate geri çağırma uyarıları | 23 | Resmi JSON arayüzü (`/safety-gate-alerts/public/api/notification/<id>`) | 23/23 okundu: model, tip onayı, üretim tarihi, kampanya kodu, risk, bildiren ülke |
| ADAC Pannenstatistik (2008–2025) | 17 | PDF indirildi, metni `pdftotext` ile çıkarıldı | 17/17 okundu: Focus satırı ve liste başlığı |
| Basın (What Car?, Autocar, AM-online) | 3 | Otomatik indirme 402/403 ile engellendi; sayfa metni tarayıcıyla okundu | 3/3 okundu |
| DVSA (Birleşik Krallık) geri çağırma veri dosyası | — | `RecallsFile.csv` | **Erişilemedi** (403, bot koruması). gov.uk sayfası yalnızca plaka/VIN sorgu formu |
| NHTSA (ABD) | — | Kullanılmadı | ABD Focus'ları Avrupa'dakilerden farklı olduğu için ABD kayıtları Avrupa/Türkiye araçlarına uygulanmadı |

## Bulunan hatalar ve düzeltmeler

### Yanlış kasa / motor / yıl eşleşmeleri

| Kayıt | Hata | Düzeltme |
|---|---|---|
| `ford-focus-ecoblue-dpf-catlagi-24e06` | **Yanlış kasa.** Uyarıdaki Focus tip onayları `e13*2007/46*1138` (Focus Mk3, tip DYB); Mk4 tip onayı listede yok. Kayıt "EcoBlue" ailesi üzerinden yalnızca Mk4 motorlarına bağlanmıştı: Mk4'te yanlışlıkla görünüyor, Mk3'te hiç görünmüyordu. | Kapsam Mk3 + dizel + 12.2014–07.2019 üretimine taşındı. Katalogda Mk3 EcoBlue motoru olmadığı için koşullu. |
| `ford-focus-mk4-arka-kapi-cocuk-kilidi` | **Kanıtsız kasa ataması.** Uyarıda tip onayı yok; 04–08.2018 üretimi Mk3 veya Mk4 olabilir. | Nesil kısıtı kaldırıldı; hiçbir araçta kesin değil, yalnızca koşullu. |
| `ford-focus-tdci-fan-modulu-yangin` | **Yanlış motor.** 2.0 TDCi 110 PS (IXDA) 2008 makyajıyla geldi; 2004–2006 kapsamında olamaz. | IXDA çıkarıldı. |
| `ford-focus-dizel-turbo-ve-takviye-basinci` | **Yanlış motor kapsamı.** Kaynak çoğu kalemde yakıt türü vermiyor; kayıt hepsini dizelle sınırlayıp turbolu benzinlileri (ör. Mk2 ST) dışlıyordu. | Açıkça dizel olan kalem (2006–2011) dizele, diğerleri "turbolu motorlar"a bağlandı; atmosferik motorlara uygulanmıyor. |
| `ford-focus-alternator-arizasi` | **Yanlış yıl.** Alt sınır 2003 kaynakta yok. | 2004–2011 |
| `ford-focus-mars-aku-arizalari` | **Yanlış yıl.** Alt sınır 2004 açık bir kayda dayanmıyor. | 2005–2022 |
| `ford-focus-atesleme-bobini-arizasi` | **Yanlış yıl.** 2008 raporu 2003 tescilinden başlıyor; 2002 kaynakta yok. | 2003–2007 |
| `ford-focus-devirdaim-pompasi-arizasi` | **Yanlış yıl.** Aynı gerekçe. | 2003–2004 |
| `ford-focus-direksiyon-yardimi-kaybi` | **Yanlış yıl ve uydurma nitelik.** 2004 kaynakta yok; başlıktaki "hidrolik" kaynakta geçmiyor (2009 raporu "elektrik destekli" diyor). | 2005–2009; "hidrolik" kaldırıldı |

### Sistem hatası: makyaj dönemi sınırı

Yaklaşık (`~`) makyaj dönemlerinde eşleştirici ±1 yıl tolerans kullanıyordu. Bu yüzden **Mayıs 2023
üretimini kapsayan 23S34 ve 23S31 kampanyaları makyajsız Focus Mk4 sayfalarında** (koşullu olarak)
görünüyordu; oysa Mk4 makyajı Haziran 2022'de geldi. Düzeltme:

- Yıl karşılaştırması ay hassasiyetine çekildi (yaklaşık dönemde ±6 ay, farklı ölçüm temelinde ±12 ay).
- Geri çağırma seçicilerine kaynaktaki üretim ayları eklendi.
- Mk4 makyaj sınırı, kaynaktaki Haziran 2022 tarihine bağlandı (yaklaşık olarak işaretli).
- Makyaj sınırına denk gelen 22S49 (06–07.2022) iki dönemde de yalnızca koşullu görünür.

### Diğer düzeltmeler

- **ADAC ifadesi:** Bütün ADAC kayıtları raporları "ortalamanın üstünde sık görülen kusurlar" diye
  anlatıyordu. Bu, yalnızca **2019 ve sonrası** raporların başlığı ("Überdurchschnittlich häufig
  auftretende Mängel"). 2008–2018 raporları "modelin en sık arızaları" listesidir
  ("häufigste Defekte/Mängel"). Bütün özetler ve kanıt notları buna göre düzeltildi.
- **Atlanmış raporlar** eklendi: marş motoru (2014), DPF (2009), ateşleme bobini (2011, 2013),
  direksiyon (2009).
- **ADAC pazarı:** Veri Almanya tesciline dayandığı için `Almanya (de)` pazarı eklendi (üst pazar: Avrupa)
  ve yıllar "ilk tescil" temelinde bu pazara bağlandı.
- **1.0 EcoBoost:** Rakamlar ve FSA bilgisi Birleşik Krallık kaynaklı. Kapsam bu pazarla sınırlandı;
  Autocar ve AM-online aynı BBC araştırmasına dayandığı için **bağımsız iki kaynak sayılmaz**.

## Tekrar eden ve ilişkili geri çağırma kampanyaları

Aynı sorunun mükerrer kaydı bulunmadı. İlişkili kampanyalar ayrı resmi kayıtlar olarak tutuldu ve
birbirine bağlandı (`recall.relatedIssueIds`); hiçbiri ayrı kronik sorun olarak sayılmıyor.

| Grup | Kampanyalar | İlişki |
|---|---|---|
| Motor kablo demeti (Mk4) | 19S50, 20S74, 20S28 | 20S74 = 19S50'nin hatalı onarımının düzeltilmesi; 20S28 = benzer parça, farklı üretim aralığı |
| 48 V / mHEV akü bağlantıları (Mk4) | 21S01, 21S36, 23S34 | Aynı alt sistem, farklı parçalar ve üretim aralıkları |
| Debriyaj baskı plakası (Mk3) | A12/0963/18, A12/0028/19 (18S39), A12/1883/19 | Tek kayıtta birleştirilmiş. İlk ikisi büyük olasılıkla aynı kampanyanın Almanya ve Birleşik Krallık duyuruları; üçüncüsü 2009–2013 üretimi için |

**Kampanya duyurularının ortak tarih aralıkları:** 22S21 (4 model) ve 21C12 (6 model) uyarılarında
üretim aralığı modeller için ortak veriliyor; Focus'a özgü aralık yok.

## Kronik sorun adaylarının değerlendirmesi

| Kayıt | Tekrar kanıtı | Bağımsız kaynak | Motor/kasa özgüllüğü | Sonuç |
|---|---|---|---|---|
| Marş aküsü | 15 rapor, 2005–2022 tescilleri | Yok (tek yayıncı: ADAC) | Yok (model düzeyi); bütün markalarda en yaygın arıza | Destekleniyor, doğrulanmadı |
| Alternatör | 11 rapor, 2004–2011 | Yok | Yok | Destekleniyor, doğrulanmadı |
| Marş motoru | 11 rapor, 2004 ve 2006–2016 | Yok | Yok | Destekleniyor, doğrulanmadı |
| Turbo / takviye basıncı | 9 rapor, 2003–2011 | Yok | Kısmen (dizel / turbolu) | Destekleniyor, doğrulanmadı |
| DPF tıkanması | 9 rapor, 2004–2011 | Yok | Dizel | Destekleniyor, doğrulanmadı |
| Ateşleme bobini | 5 rapor, 2003–2007 | Yok | Benzinli | Destekleniyor, doğrulanmadı |
| Direksiyon yardımı kaybı | 4 rapor, 2005–2009 | Yok | Yok | Destekleniyor, doğrulanmadı |
| Devirdaim pompası | 2 rapor, 2003–2004 | Yok | Yok | Zayıf; destekleniyor |
| Triger kayışı (bilinen kusur) | 1 rapor, 2016 | Yok | Motor türü yok | Zayıf; bilinen kusur |

**Kaynaklarla güçlü biçimde desteklenen (doğrulanmış) kronik sorun: 0.** Sekiz adayın hepsi tek
yayıncıya (ADAC) dayanıyor. ADAC aynı arızayı yıllarca tutarlı biçimde listelese de bu, bağımsız
ikinci bir kaynak sayılmaz. ADAC verisi model ve ilk tescil yılı düzeyindedir; arayüzde hiçbir motor
için kesin (motor bazında) eşleşme üretmez, bu bir testle güvence altında. Görülme sıklığına dair
somut oran (bin araç başına arıza) ADAC'ta model bazında var, ancak arıza kalemi bazında yok.

## Kalan belirsizlikler

| Kayıt | Belirsizlik |
|---|---|
| Çocuk kilidi (A12/1530/18) | Nesil (Mk3 / Mk4) belirlenemiyor |
| 24E06 | Katalogda Mk3 EcoBlue motor kaydı yok; motor düzeyinde eşleşme yapılamıyor |
| Debriyaj baskı plakası | Kampanya kodu yalnızca bir duyuruda; motor ve şanzıman belirtilmemiş |
| 22S21, 21C12 | Üretim aralıkları birden fazla model için ortak |
| 22S49 | Üretim tarihi makyaj sınırına denk geliyor |
| 20S74 | Yalnızca 19S50 onarımı hatalı yapılmış araçlar; ancak VIN ile belirlenebilir |
| TDCi fan modülü | Resmi DVSA kaydına erişilemedi; "known-defect" olarak tutuluyor |
| 1.0 EcoBoost hortumu | Ford FSA belgesi kamuya açık değil; Birleşik Krallık dışındaki kapsam bilinmiyor |
| Akü, devirdaim pompası, triger kayışı | Alt yıl sınırı ya da tekrar kanıtı zayıf |

Ayrıca hiçbir geri çağırma için VIN aralığı yayımlanmamış. Arayüz bu yüzden hiçbir geri çağırmayı
"kesin uygulanır" olarak göstermiyor ve şasi numarasıyla resmi kontrol yapılmasını istiyor.

## Ek araştırma gereken konular

1. **1.6 EcoBoost silindir kapağı çatlağı:** Autocar ve AM-online, Ocak 2018'de Birleşik Krallık'ta
   DVSA üzerinden yapılan ayrı bir gönüllü güvenlik geri çağırmasından söz ediyor (Focus dahil,
   yaklaşık 15.000 araç). Henüz kayıt yok; resmi kaydın bulunması gerekiyor.
2. **DVSA kayıtları:** TDCi fan modülü (2009) ve debriyaj kampanyaları için resmi Birleşik Krallık
   kayıtları; veri dosyası otomatik erişime kapalı. Elle veya resmi veri talebiyle kontrol edilmeli.
3. **Katalog eksiği:** Focus Mk3'ün EcoBlue dizel motor kayıtları (24E06 uyarısı Mk3 için EcoBlue
   motorların varlığını gösteriyor). Katalog verisi birincil kaynakla tamamlanmalı.
4. **Bağımsız ikinci kaynak:** ADAC dışındaki geniş kapsamlı araştırmalar (ör. TÜV Report,
   muayene istatistikleri) ADAC adaylarını doğrulamak veya çürütmek için kullanılmalı.
5. **Türkiye pazarı:** Ticaret Bakanlığı geri çağırma kayıtları incelenmedi; Avrupa kayıtları
   Türkiye için kesin kabul edilmedi.

## Bu denetimle eklenen kalite kuralları

Kurallar `src/lib/issues/validate.ts` ve testlerle zorlanıyor; ileride bütün araçlara uygulanabilir.

- **İçerik kontrolü:** Her kaynakta içerik kontrol durumu (`review`) var. `verified`/`supported` kayıtlarda en az bir
  kaynağın içeriği okunmuş olmalı.
- **Bağımsızlık:** Aynı habere dayanan kaynaklar (`basedOn`) bağımsız sayılmıyor.
- **Geri çağırma bilgisi:** Geri çağırmalarda kampanya bilgisi zorunlu (resmi kayıt no, üretim tarihleri, VIN aralığının
  yayımlanıp yayımlanmadığı). Seçicideki yıl aralığı kampanyanın üretim tarihlerini aşamaz.
- **Aşırı besleme:** Seçicide aşırı besleme alanı (`aspirations`) var; "turbo" arızaları atmosferik motorlara bağlanamaz.
- **Ay hassasiyeti:** Yıl karşılaştırmaları ay hassasiyetinde yapılıyor.
- **Arayüz:** Kronik sorunlar, bilinen kusurlar ve geri çağırmalar ayrı bölümlerde gösteriliyor. Geri çağırma bölümü VIN ile
  resmi kontrol uyarısıyla açılıyor.

## Test ve kontrol sonuçları

| Komut | Sonuç |
|---|---|
| `npm test` | 72/72 geçti (önceki 49 test korundu; 23 yeni test) |
| `npm run check` | 0 hata, 0 uyarı |
| `npm run build` | Başarılı, 97 sayfa |
| `npm audit` | 0 güvenlik açığı |

Yeni testler: `tests/focus-data.test.ts` (canlı veride yanlış nesil, motor, yakıt, makyaj dönemi ve
pazar eşleşmelerine karşı regresyon testleri), `tests/issues-validate.test.ts` (yeni kanıt kuralları),
`tests/issues-match.test.ts` (türe göre ayrım).
