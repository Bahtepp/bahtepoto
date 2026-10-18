# Renault / Dacia — ikinci araştırma turu

Tarih: 2026-10-18. Agent: `astra-renault`.

İlk turdaki 14 issue ID korundu; aynı ID ile ikinci belge oluşturulmadı. Düzeltmeler ilk beş JSON'a işlendi. Yeni kayıtlar `tur2-renault-yeni.json` ve `tur2-dacia-yeni.json` içinde ayrı tutuldu. Katalog kodu, canlı sorun kayıtları, eşleştirici ve yayın değiştirilmedi.

## Sonuç ve sayım tanımı

- **4/14 eski kaydın araç/motor kapsamı kısmen netleşti veya daraltıldı:** Clio gaz kelebeği, Fluence EDC, Sandero Easy-R, Lodgy far kumandası.
- **5/14 kaydın sınırlamaları ek teknik bilgilerle açıklaştırıldı:** K9K gergi, Bosch ABS, F9Q EGR, Duster kontak, Sandero kontak. Bunlar yeni kapsam çözümü sayılmadı.
- **5/14 kaydın önceki kapsamı korundu.** Yeni kanıt bulunmadan değişiklik yapılmadı.
- **Koşulsuz otomatik aktarıma hazır ilan edilen eski kayıt: 0. İncelemede tutulması önerilen: 14.** Dört kapsam iyileştirmesi, parça/VIN veya teşhis koşullarını ortadan kaldırmıyor. Eşleştirici çalıştırılmadı; bunlar araştırmacı önerileridir, sistemin yeni aktarım sonuçları değildir.
- **6 yeni benzersiz sorun araştırma kaydı** eklendi. Belirti bildirimi ile kesin teknik neden ayrıldı; hepsi ayrıca insan incelemesi gerektirir.
- Toplam **7 JSON, 20 issue, 12 model, 30 farklı kaynak URL'si**. Birinci tura göre 13 yeni kaynak URL'si. Aynı firmanın iki sayfası iki bağımsız arıza kanıtı sayılmadı.
- İlk 14 kayıt: 3 `medium`, 11 `unknown`. Yeni 6 kayıt: 2 `medium`, 4 `unknown`. Toplam: **5 medium, 15 unknown, 0 high, 0 low**.
- Toplam kaynak türleri: 11 `technical-publication`, 6 `expert-service`, 13 `user-report`. Yeni 6 sorunun kaynakları: 3 uzman servis sayfası, 6 kullanıcı kaynağı. Teknik uyumluluk belgeleri arıza yaygınlığına kanıt yapılmadı.

## İlk 14 kaydın eski / yeni kapsamı

### 1. Clio gaz kelebeği — kapsam daraltıldı

ID: `astra-renault-clio-12-16v-throttle`

Önce: 2001–2008, 1.2 16V, nesil ve motor alt kodu belirsiz.

Sonra: **Clio II, 2001–2006, atmosferik D4F 712**. ECU Testing arıza kaydı, RENBreakers'ın 8200067219 / 8200166869 uyumluluk kaydıyla kesiştirildi. Parça tedarikçisi birincil ürün kaydıdır; üretici VIN kataloğu değildir. Bu yüzden araç üzerindeki parça ve motor kodu kontrolü hâlâ gerekiyor. D4F 722, Clio III ve 2007–2008 için kanıt oluşturulmadı. Çıkarılan kapsamın sorunsuz olduğu iddia edilmiyor. **1.2 TCe hariçtir.**

### 2. Bosch ABS — model başına farklı parça doğrulandı

ID: `astra-renault-renault-bosch-abs-valve-relay`

Clio III: `0265950377`; Megane II: `0265950563`; Scenic II: `0265950770`; Modus: `0265950787`.

ACTRONICS tablosu yeniden okundu. Üretim yılı sınırları yok; genel nesil yılları eklenmedi. Yazıda ATE MK60 da anılıyor fakat kayıt bu aileye genişletilmedi. Kaynakta sayılan modüller birbirinin yerine geçer kabul edilmedi. Parça filtresi şemada yapısal olarak bulunmadığından inceleme devam eder.

### 3. K9K yardımcı kayış gergisi — parça sınırı eklendi

ID: `astra-renault-early-k9k-accessory-tensioner`

Clio II / Symbol: K9K 700 veya 702. Kangoo: K9K 700, 702 veya 710; şasi tipleri önceki JSON'da korunuyor. Gates bülteni yeniden okunarak **Haziran 2001–Haziran 2002 ve klimasız araç** koşulu doğrulandı. Eski gergiler `8200262773` / `8200292784`, değiştirilmiş gergi `8200328372`.

**Klimalı araçlara aktarılmamalı.** Ay, klima ve takılı parça revizyonu `years` alanından anlaşılamaz. Şemanın bu eksikliği notlarda açık tutuldu; yalnızca 2001–2002 yılına bakarak aktarım önerilmedi.

### 4. F9Q EGR — alt kod belirsizliği çözülemedi

ID: `astra-renault-f9q-egr-sticking`

Megane II / Scenic II, 1.9 dCi F9Q kapsamı değişmedi. HELLA metninde yalnız `F9Q...` yazıyor; alt kod, güç veya üretim lotu yok. Uyumlu parça listesi bulmak bütün alt kodlarda bu arızanın görüldüğünü kanıtlamaz. F9Q 800/804/812 gibi kodlar tahminen eklenmedi.

### 5. Fluence EDC — güç ve şanzıman ayrımı kısmen netleşti

ID: `astra-renault-fluence-edc-control-loss`

Önce: 2012 ve 2016, 1.5 dCi EDC; güç yazılmamıştı.

Sonra: 2012 sahibinin asıl metnindeki **110 bg** eklendi. Renault Türkiye katalog belgesi **110 bg / 81 kW ve 6 ileri çift kavramalı EDC** eşleşmesini destekliyor. Belgenin barındırıldığı URL'deki yanlış `90-hp` ifadesi veri olarak alınmadı. 2016 sahibi güç belirtmediği için ona güç uydurulmadı. Benzinli 1.6 CVT ayrı teknoloji olarak dışarıda kaldı. DC4 alt tipi ve kontrol ünitesi teşhisi servis belgesiyle doğrulanmadı; 2012–2016 kesintisiz aralık yapılmadı.

### 6. Sandero Easy-R — nesil ve teknoloji netleşti

ID: `astra-renault-sandero-easyr-judder`

Önce: 2019–2020, 0.9 TCe, Easy-R; nesil alanı boştu.

Sonra: **Sandero II, 0.9 TCe (TCe 90), robotize manuel Easy-R**. Üreticinin 2015 Easy-R açıklaması ve Sandero II tarihçesi, mevcut Türkiye sahiplerinin 2019–2020 örnekleriyle birlikte değerlendirildi. Dizel Easy-R, EDC ve yeni nesil CVT kapsam dışı. Kavrama/volan teşhisi ve motor alt kodu hâlâ belirsiz; kesin üretim kusuru sonucu çıkarılmadı.

### 7. Lodgy far kumandası — Türkiye ve örnek yıl bulundu

ID: `astra-renault-lodgy-light-stalk-intermittent`

Önce: yalnız Fransa topluluğu; yıl ve Türkiye ilişkisi belirsiz.

Sonra: Türkiye'de **2016 model** araç sahibinin sinyal verirken far kesilmesi bildirimi eklendi. Yapısal yıl kapsamı 2016'ya daraltıldı. Bu yıl tüm etkilenen üretim dönemi değil, doğrudan desteklenen örnektir. Fransa kayıtları silinmedi; üretim yılı vermedikleri için Türkiye kapsamını genişletmiyor. Kumanda parçası ve motor bilinmiyor; her Lodgy'ye aktarılamaz.

### 8. Duster kontak — sınır doğrulandı, parça numarası bulunamadı

ID: `astra-renault-duster-hjd-ignition`

HELLA yeniden okundu: HJD, 2017–2021; değiştirilmiş kilit önerisi var, OE/VIN sınırı yok. Önceki kapsam korundu. Duster I ve III'e yayılmayacağı not edildi. HJD içindeki bütün kontakların aynı olduğu kabul edilmedi.

### 9. Sandero kontak — VIN koşulu korundu

ID: `astra-renault-sandero-ignition-stuck`

2013–2021 ve `UU15SDKJ558926581`–`UU1HSDM9G60030836` sınırları yeniden okundu. Farklı tip önekleri içeren bu iki değer basit alfabetik VIN aralığına çevrilemez. Nesil/OE parça numarası kaynakta yok; bütün Sandero II/III araçlarına uygulanamaz.

### 10. Megane I klima klapesi — değişmedi

ID: `astra-renault-megane-i-hvac-flap`

1996–2002 klimalı araç kapsamı korundu. Klima koşulu yapısal filtre olmadığı için inceleme gerekir. İkinci turda yeni daraltıcı belge bulunmadı.

### 11. Laguna II klima basınç bağlantısı — değişmedi

ID: `astra-renault-laguna-ii-ac-pressure-contact`

B74/BG0 kapsamı korundu. Yıl, motor ve parçaya ait ek sınır bulunmadı; tüm klimasız/klimalı araçlara otomatik aktarım önerilmedi.

### 12. Kangoo I sürgülü kapı — değişmedi

ID: `astra-renault-kangoo-i-sliding-door-lock`

2003–2006, merkezi kilitli sol sürgülü kapı koşulu korundu. Normal yakıt kapağı güvenlik kilidi arıza değildir. Kapı/donanım koşulunu şema tek başına karşılamıyor.

### 13. Scenic gösterge — değişmedi

ID: `astra-renault-scenic-instrument-cluster`

Scenic I 1996–2003 / II 2003–2009 kapsamı korundu. Panel numarası doğrulaması gerekiyor. Megane Scenic adı Megane sedan/hatchback'e aktarılmadı.

### 14. Duster yan sinyal kablosu — değişmedi

ID: `astra-renault-duster-side-indicator-wire`

Kaynağın 2010–2018 tarih aralığı korundu. Kaynak nesil kodu vermediği için 2018 geçiş yılı Duster II olarak atanmadı. Kablo güzergâhı/parça kontrolü gerekiyor.

## Altı yeni kayıt

`tur2-renault-yeni.json`:

- **Clio III 1.5 dCi DCM1.2 iletişim/çalışmama:** 2005–2011, yalnız `8200911560 / 8200619409` parça eşleşmesi için daraltıldı. Genel 2002–2015 motor ailesi kapsamı alınmadı. `unknown`.
- **Clio IV airbag ECU iç arızası:** 2012–2019 Continental ünite gözlemi. Airbag lambasının her nedeni bu ünite değildir. OE/lot kapsamı belirsiz. `unknown`.
- **Megane II elektrikli camın aralıklı çalışmaması:** 2005 ve 2008 örnekleri. Modül, bağlantı ve mekanizma tek kök nedene indirgenmedi. `medium`.
- **Clio E-Tech şanzıman pompası bildirimi:** 2024 Türkiye örneği. Tek sahibin teşhis aktarımı; motor hacmi, nesil ve şanzıman kodu uydurulmadı. EDC diye etiketlenmedi. `unknown`.

`tur2-dacia-yeni.json`:

- **Duster multimedya donması:** 2021 ve 2023 Türkiye örnekleri. Ortak yazılım/ünite kusuru kanıtlanmadı; belirti grubu olarak tutuldu. `medium`.
- **Jogger 1.0 ECO-G gaz uyarısı ve yanlış seviye:** 2022 Türkiye örneği; LPG geçişi normal kalıyor. Sensör teşhisi yapılmış gibi yazılmadı. `unknown`.

İlk turun ABS valf rölesi ile yeni Clio airbag ECU arızası ayrı sistemlerdir. Yeni DCM1.2 sorunu eski K9K kayış gergisiyle birleştirilmedi. Önceden kayıtlı termostat ve yağ tüketimi sorunları tekrarlanmadı.

## Dışarıda bırakılan adaylar ve devam ihtiyacı

- **Jogger LPG'ye geçememe:** [Alman sahibin anlatımı](https://www.joggerforum.de/threads/maengel-bzw-defekte-beim-jogger-eco-g.496/) okundu. Sensör değişiminden sonra düzelme var; Türkiye örneğinde ise LPG geçişi çalışıyor. İki farklı belirtiyi tek sensör kusuruna dönüştürmekten kaçınıldı; Alman kayıt JSON kaynağına eklenmedi.
- **R9M 1.6 dCi ve M9R 2.0 dCi:** sorgularda genel motor rehberleri ve tekil forum anlatımları bulundu; alt kod/yıl/kök neden eşleşmesini yeterince destekleyen yeni kayıt oluşturulmadı. Parça kataloğunda motorun bulunması arıza kanıtı sayılmadı.
- **0.9 / 1.0 TCe:** Easy-R'nin 0.9 TCe kapsamı iyileştirildi; Jogger 1.0 ECO-G için gaz sistemi belirtisi eklendi. Genel turbo/zincir arızası iddiası oluşturulmadı.
- **Süspansiyon:** Clio yay kırılması adayları yaş, kullanım ve performans versiyonu ayrımını çözemedi; normal aşınmayı kronik sorun saymamak için yeni kart yok.
- **Captur, Kadjar, Megane III/IV, Logan, Dokker, Duster III:** ikinci turda kaynak araması bu modellerin bütün motor/kasalarının tek tek doğrulanması anlamına gelmiyor. Yeni aktarılabilir kapsam bulunmadı. Clio IV ABS arama sonucu, parça bazında ayrıntı ve mevcut ABS kaydıyla örtüşme kontrolü tamamlanmadığından ayrı kart yapılmadı.
- Bazı parça/forum bağlantıları erişilemedi. Bunlar `reviewed:true` kaynak olarak eklenmedi. Okunan parça satıcısı sayfası yalnız uyumluluk desteği, kullanıcı şikâyeti yalnız deneyim kanıtı olarak kullanıldı.

## Doğrulama ve teslim güvenliği

- JSON Schema Draft 2020-12 + URI/tarih FormatChecker: **7/7 başarılı**.
- Projedeki `researchBundleSchema` Zod kontrolü: **7/7 başarılı**.
- İlk turun 14 ID'si Git HEAD ile karşılaştırıldı; hepsi korundu. Toplam 20 benzersiz issue ID var; dosyalar arasında çakışma yok.
- `sourceIds` aynı dosyada çözülüyor; kullanılmayan kaynak yok. Model üst listeleri yalnız model adları içeriyor. Başlık/özet sınırları, yılların sırası, `agent` ve örnek kayıt yasağı kontrol edildi.
- Yedi JSON'un hiçbiri kataloğa uygulanmadı. `uncertainties` metinlerinin çözülmesi için otomatik onay kuralı üretilmedi.
- Değişiklikler yalnız `astra-renault` araştırma klasöründe. Kod testi/build, import, commit ve push yapılmadı.
