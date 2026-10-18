# Ford / Toyota üçüncü tur araştırma raporu

Tarih: 18 Ekim 2026 · Ajan: `astra-ford-toyota` · Araştırma sözleşmesi: `bahtepoto-research-v1`

## Sonuç ve entegrasyon kararı

13 özgün JSON içindeki 21 benzersiz aday (Ford 11, Toyota 10) tek tek yeniden değerlendirildi. **Yayına aday: 0; İncelemede: 21; Desteklenmedi: 0; Mevcut canlı kayıtla kesin tekrar: 0.** Bu sonuç arızaların olmadığı anlamına gelmez: teknik arıza kanıtı ile Türkiye aracına uygulanabilirlik aynı şey değildir. Bazı adaylar güçlü servis/kampanya kanıtına, bazıları yalnız kullanıcı anlatımına dayanıyor. Aşağıdaki gerekçeler bunları ayırır.

Yeni sorun JSON'u: **0**. Üçüncü turda bulunan izler Türkiye/parça kapsamı tamamlanmadan yeni aday sayısına eklenmedi. Toplam aday hâlâ 21. Orijinal JSON'ların alanları ve `reviewed` bayrakları değiştirilmedi. Bu belge entegrasyon incelemesine hazır bir karar dosyasıdır; 21 kaydın yayına hazır olduğu iddiası değildir.

İlk iki turun üç raporu, 13 JSON'un kaynakları/kapsamları ve yerel canlı Ford Focus sorunları karşılaştırıldı. Aynı modelde bulunmak tek başına tekrar sayılmadı. Bu tur okunan yeni/yeniden açılan kaynaklar `FORD-TOYOTA-TUR3-KAYNAKLAR.md` dosyasındadır. Eski JSON kaynaklarının tamamının bu tur tekrar açıldığı iddia edilmez; önceki inceleme bilgileri korundu. Yerel kayıt karşılaştırması canlı web sitesinin yayın durumunu doğrulamaz.

## Entegrasyon için ortak kurallar

- Boş motor veya şanzıman alanı “tüm motorlar/şanzımanlar” değildir. Parça/VIN şartı kaybolacaksa otomatik aktarımı durdur.
- Model yılı, üretim tarihi ve satış/satın alma tarihi ayrı tutulmalı. Kampanya VIN kapsamı yıl aralığına indirgenmemeli.
- Yaygınlık bütün adaylarda `unknown` kalmalı. Onarım işletmesinin “common” ifadesi veya kampanya adedi Türkiye arıza oranı değildir.
- MMT, kayışlı Multidrive S CVT ve hibrit e-CVT ayrıdır. DPS6, diğer PowerShift ve tork konvertörlü otomatikler birbirine atanamaz.
- Donanım adı arıza kapsamı değildir; tavan rayı, ECU, ABS ünitesi gibi fiziksel parça şartları gerekiyorsa korunur.

## 21 adayın tek tek değerlendirmesi

### `astra-ft-puma-direksiyon-vuruntu` — İncelemede

**Direksiyon bağlantısında vuruntu** · Dosya: `ford-diger.json`
- Mevcut kapsam: Ford Puma; Puma crossover; 2021–2021; motor: 1.0 EcoBoost Hybrid; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** Tek UK kullanıcı vakası; mafsal/parça teşhisi ve bağımsız tekrar yok. Türkiye 2021 1.0 Hybrid satışı tek başına arızalı parçanın eşitliğini sağlamaz. Şanzıman ve üretim/VIN açık; model geneline yayınlanamaz.

- Önceki kaydın kaynağı: [2021 Puma hibrit: direksiyon bağlantısında vuruntu](https://www.fordownersclub.com/forums/topic/167039-clunky-steering/)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft-fiesta-durashift` — İncelemede

**Durashift debriyaj aktüatörü arızası** · Dosya: `ford-fiesta.json`
- Mevcut kapsam: Ford Fiesta; kasa kodu belirtilmemiş; 2002–2008; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: Durashift EST.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** Durashift EST tek kavramalı robotize manuel; DPS6 değildir. Aktüatör parça numarası ve Türkiye araç şanzıman etiketi gerekir. Motor belirtilmediği için 2002–2008 bütün motorlara eşleştirme yapılmamalı.

- Önceki kaydın kaynağı: [Fiesta Durashift EST debriyaj aktüatörü](https://www.ecutesting.com/common-faults/ford/fiesta-clutch-actuator-fault/)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft-fiesta-dps6-vites-kaybi` — İncelemede

**PowerShift vites geçişinin devre dışı kalması** · Dosya: `ford-fiesta.json`
- Mevcut kapsam: Ford Fiesta; kasa kodu belirtilmemiş; 2013–2013; motor: 1.6 benzinli; şanzıman: PowerShift DPS6 (kuru kavrama).

**Kaynak, Türkiye kapsamı ve yayın koşulu:** Türkiye 2013 1.6 benzinli kullanıcı vakası var; P0902 tek başına TCM kök nedeni değildir. Yeniden okunan 14M02 ABD Cuautitlan Fiesta/Michigan Focus ve OASIS kapsamındadır [F9]. Türkiye garantisi veya tüm PowerShift arızası olarak sunulamaz; kavrama/aktüatör/TCM teşhisi ayrılmalı.

- Önceki kaydın kaynağı: [2013 Fiesta 1.6 PowerShift: vites geçişinin kaybı](https://www.otoclubturkiye.com/forum/topic/307897-fiesta-16-powershift-motor-ar%C4%B1zas%C4%B1/)
- Önceki kaydın kaynağı: [Ford 14M02-S4 DPS6 kontrol ünitesi kapsamı](https://static.nhtsa.gov/odi/tsbs/2019/MC-10164606-0001.pdf)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft2-focus-gosterge` — İncelemede

**Gösterge panelinde kesinti ve ekran kaybı** · Dosya: `ford-focus-fiesta-tur2.json`
- Mevcut kapsam: Ford Focus; Focus Mk1; 1998–2004; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.
- Mevcut kapsam: Ford Focus; Focus Mk2; 2004–2010; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** Uzman onarım kaynağı gösterge arızasını destekliyor; önceki HELLA kaynağındaki tesisat alternatifi dışlanmadan tek kök neden yazılmaz. Mk1/Mk2, motor, gösterge parça/revizyonu ve Türkiye eşitliği ayrı kontrol edilmeli.

- Önceki kaydın kaynağı: [Focus gösterge paneli arızaları](https://www.ecutesting.com/common-faults/ford/focus-dashdashboard-instrument-cluster/)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft2-fiesta-sim22` — İncelemede

**EAC Fail uyarısı ve gaz tepkisinin kaybı** · Dosya: `ford-focus-fiesta-tur2.json`
- Mevcut kapsam: Ford Fiesta; kasa kodu belirtilmemiş; 2002–2004; motor: 1.25 Duratec-16V, 1.4 Duratec-16V, 1.6 Duratec-16V; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** Yalnız SIM22 ECU bulunan 1.25/1.4/1.6 Duratec-16V uygulamaları. Türkiye ECU parça numarası ve üretim sınırı eksik; EAC belirtisi tüm motor yönetim ünitelerine genellenemez.

- Önceki kaydın kaynağı: [SIM22 EAC Fail arızası](https://ecu.eu/eac-fail-at-sim22-engine-control-units-2s6a-12a650-se-110.htm)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft-ford-mk60-c1288` — İncelemede

**ABS basınç sensörü arızası** · Dosya: `ford-focus.json`
- Mevcut kapsam: Ford Focus; Focus Mk2; 2004–2011; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.
- Mevcut kapsam: Ford C-Max; C-Max I; 2005–2010; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** C1288 ve ATE MK60 parça kimliği birlikte aranmalı. Focus/C-Max model yılları ABS ünitesinin Türkiye araçlarında tek tip olduğunu kanıtlamıyor; motor/şanzıman üzerinden otomatik genişletme yapılmamalı.

- Önceki kaydın kaynağı: [Focus ve C-Max ABS basınç sensörü C1288](https://www.ecutesting.com/common-faults/ford/focus-c-max-abs-pump-fault/)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft2-mondeo-klima-fan` — İncelemede

**Fan arızası nedeniyle klimanın devreye girmemesi** · Dosya: `ford-kuga-mondeo-tur2.json`
- Mevcut kapsam: Ford Mondeo; Mondeo Mk4; 2011–2014; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** Kaynak 2011 sonrası fan/klima ilişkisini destekler; JSON üst sınırı 2014 kasa sınırıdır, doğrulanmış arıza bitiş tarihi değildir. Motor/fan modülü/TR tesisat eşleşmesi olmadan her Mk4 klima arızasına uygulanmaz.

- Önceki kaydın kaynağı: [Mondeo klima devreye girmemesi](https://www.hella.com/techworld/uk/bi/pdf/Ford-Mondeo-Failure-of-the-air-conditioning-system/Ford-Mondeo-Failure-of-the-air-conditioning-system.pdf)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft-ford-dcm35` — İncelemede

**Motor kontrol ünitesinde iletişim ve çalıştırma arızası** · Dosya: `ford-kuga-mondeo.json`
- Mevcut kapsam: Ford Mondeo; Mondeo Mk4; 2007–2014; motor: TDCi; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.
- Mevcut kapsam: Ford Kuga; Kuga Mk2; 2013–2015; motor: TDCi; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.
- Mevcut kapsam: Ford S-Max; kasa kodu belirtilmemiş; 2010–2015; motor: TDCi; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.
- Mevcut kapsam: Ford Galaxy; kasa kodu belirtilmemiş; 2010–2015; motor: TDCi; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** Yalnız Delphi DCM3.5 teşhisi/parça eşleşmesiyle kullanılabilir. TDCi tek başına motor kodu değildir. Kaynaktaki Kuga yıl/nesil uyuşmazlığı çözülmedi; 1.5 veya 2.0 dizel diye tahmin yapılmadı. [F6] şanzıman pazarlama adını doğrular, ECU uygulamasını değil.

- Önceki kaydın kaynağı: [Mondeo ve Kuga DCM3.5: motor çalışmaması](https://www.ecutesting.com/common-faults/ford/ford-mondeo-kuga-ecu-causing-no-start/)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft-kuga-16-sigma-17s09` — İncelemede

**Düşük soğutma sıvısıyla silindir kapağı hasarı** · Dosya: `ford-kuga-mondeo.json`
- Mevcut kapsam: Ford Kuga; Kuga Mk2; 2012–2014; motor: 1.6 EcoBoost; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** Ford belgesi Kuga Valencia üretimini 08.05.2012–21.11.2014 ile sınırlar [F7]. Türkiye 1.6 EcoBoost kaydı, kampanya VIN kapsamını kanıtlamaz. 1.5 EcoBoost ABD bülteni [F8] bu kayda eklenmez; 2012 üretim ile Türkiye model yılı ayrılmalı.

- Önceki kaydın kaynağı: [Ford: 1.0 Fox ve 1.6 Sigma soğutma incelemesi](https://www.parliament.uk/globalassets/documents/commons-committees/transport/Andy-Barratt-Ford-Ecoboost-131110_Redacted.pdf)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft-ford-mk100-basinc` — İncelemede

**ABS hidrolik ünitesinde fren basıncının kalması** · Dosya: `ford-ticari-modeller.json`
- Mevcut kapsam: Ford Fiesta; kasa kodu belirtilmemiş; 2013–2017; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.
- Mevcut kapsam: Ford B-Max; B-Max (B232); 2014–2017; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.
- Mevcut kapsam: Ford Tourneo Connect; kasa kodu belirtilmemiş; 2015–2018; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.
- Mevcut kapsam: Ford Transit Connect; kasa kodu belirtilmemiş; 2015–2019; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** ATE MK100 parça kimliği gerekir; araç listesi bütün Fiesta/B-Max/Connect motorlarını kapsayan kanıt değildir. Courier ve Custom bu adayın modelleri değildir. [F3–F5] ticari motor/şanzıman çeşitliliğini gösterir, ABS parçasını doğrulamaz.

- Önceki kaydın kaynağı: [Fiesta, B-Max ve Transit Connect: frenlerin bırakmaması](https://www.ecutesting.com/common-faults/ford/brakes-locking-fiesta-b-max-and-transit/)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft-ranger-abs` — İncelemede

**ABS ünitesi arızası ve düzensiz frenleme** · Dosya: `ford-ticari-modeller.json`
- Mevcut kapsam: Ford Ranger; Ranger (T6); 2012–2022; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** Bosch parça numarası eşleşmesi ve Türkiye VIN/çekiş bilgisi gerekli. Uzman kaynağın geniş yılı ile T6 sınırı kesiştirilmiş; tüm 2012–2022 Ranger için kroniklik kanıtı değil. Otomatik şanzıman sorunu olarak çoğaltılmaz.

- Önceki kaydın kaynağı: [Ranger ABS arızası ve frenlerin bırakmaması](https://www.ecutesting.com/common-faults/ford/ford-ranger-abs-failure/)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft-toyota-mmt-aktuator` — İncelemede

**MMT vites seçememe ve boşa geçme** · Dosya: `toyota-corolla-auris.json`
- Mevcut kapsam: Toyota Corolla; Corolla E140/E150; 2007–2009; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: MMT.
- Mevcut kapsam: Toyota Auris; Auris E150; 2007–2012; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: MMT.
- Mevcut kapsam: Toyota Yaris; Yaris XP90; 2006–2011; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: MMT.
- Mevcut kapsam: Toyota Aygo; Aygo I; 2005–2012; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: MMT.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** MMT robotize manuel; Multidrive S veya hibrit e-CVT değildir. Türkiye motor/MMT ve aktüatör numarası eşleşmesi eksik. Auris II 1.6 Multidrive S, 1.4 D-4D manuel ve hibrit e-CVT bilgileri [T1] eski MMT kapsamına taşınmaz.

- Önceki kaydın kaynağı: [Toyota MMT clutch actuator / gearbox malfunction](https://www.ecutesting.com/common-faults/toyota/toyota-mmt-clutch-actuator-fault/)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft-corolla-d4d-yag` — İncelemede

**D-4D motorunda yağ eksiltme** · Dosya: `toyota-corolla-auris.json`
- Mevcut kapsam: Toyota Corolla; Corolla E140/E150; 2010–2012; motor: 1.4 D-4D; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** Türkiye forumunda birden fazla yağ eksiltme anlatımı var [T8]; gerçek servis bülteni, motor seri sınırı, ölçüm koşulları ve revize parçalar doğrulanmadı. Turbo ve piston/segman nedenleri kesinleştirilmedi. 1.4 D-4D kanıtı 1WW/1AD/GD dizellere genişletilmez.

- Önceki kaydın kaynağı: [D4D dizel Corolla yağ eksiltme ve revizyon deneyimleri](https://www.toyotaclubtr.com/index.php?topic=47739.0)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft2-prius-egr-yapisma` — İncelemede

**EGR valfinin yapışması** · Dosya: `toyota-diger-tur2.json`
- Mevcut kapsam: Toyota Prius; Prius (XW30); 2010–2012; motor: 1.8 VVT-i Hybrid; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** ZF3 ABD garanti belgesi teknik arızayı destekliyor; Türkiye EGR parça/ECU/VIN eşitliği açık. XW30 2010–2012 kapsamı, e-CVT mekanik arızası veya tüm hibritlerde EGR sorunu olarak kullanılamaz. J0V ile farklı kök neden.

- Önceki kaydın kaynağı: [ZF3 EGR valfi garanti genişletmesi](https://static.nhtsa.gov/odi/tsbs/2016/MC-10134089-9999.pdf)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft2-avensis-valvematic` — İncelemede

**Valvematic kontrol arızası ve güç kısıtlaması** · Dosya: `toyota-diger-tur2.json`
- Mevcut kapsam: Toyota Avensis; Avensis T27; 2011–2011; motor: 1.6 Valvematic; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** 2011 1.6 Valvematic Türkiye vakası tekil; 213 bin km ve LPG bağlamı var. P1047 sonrası kısa süreli iyileşme model-geneli kroniklik ispatı değil. LPG tekleme anlatımı ayrı tutulmalı. Motor/şanzıman/denetleyici kodu ve bağımsız tekrar bekliyor.

- Önceki kaydın kaynağı: [Avensis T27 Valvematic arıza deneyimi](https://www.toyotaclubtr.com/index.php?topic=93827.0)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft-avensis-yakit-kacagi` — İncelemede

**Yakıt borusu ve pompa bağlantısında kaçak** · Dosya: `toyota-diger.json`
- Mevcut kapsam: Toyota Avensis; Avensis 2. nesil (T250); 2003–2008; motor: 2.0 benzinli; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** UK kaynak 2.0/2.4 benzinli ve daha geniş üretim dönemi bildirir; mevcut T250 2.0 kesiti Türkiye VIN/hat parçasıyla doğrulanmalı. T27 Valvematic veya dizel yakıt sistemi sorunu olarak genişletilmez.

- Önceki kaydın kaynağı: [Avensis benzinli yakıt sistemi gönüllü geri çağırması](https://media.toyota.co.uk/toyota-announces-voluntary-recalls/)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft-prius-j0v-guc-kaybi` — İncelemede

**Hibrit sisteminde koruma moduna geçememe** · Dosya: `toyota-diger.json`
- Mevcut kapsam: Toyota Prius; Prius (XW30); 2010–2014; motor: 1.8 VVT-i Hybrid; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** ABD J0V/18V684 hibrit fail-safe yazılım kapsamı Türkiye kampanyası değildir. XW30 ECU/VIN ve uygulanmış güncelleme kontrol edilmeli; EGR adayıyla veya normal batarya fanı bakımıyla [T3] birleştirilmez.

- Önceki kaydın kaynağı: [Prius J0V hibrit kontrol yazılımı açıklaması](https://techinfo.toyota.com/techInfoPortal/staticcontent/en/techinfo/html/prelogin/docs/cp/j0vtofaq.pdf)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft2-rav4-tavan-su` — İncelemede

**Tavan rayı bağlantılarından su sızıntısı** · Dosya: `toyota-rav4-tur2.json`
- Mevcut kapsam: Toyota RAV4; RAV4 5. nesil (XA50); 2019–2021; motor: 2.5 Hybrid; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** 22TE05 ABD XA50 tavan rayı klips/conta desteği; Türkiye üretim tesisi, parça ve VIN eşitliği bekliyor. Model yılı aralığı üretim tarihi değildir. OCS [T5] ayrı araştırma izi; bu su sızıntısının sonucu olarak eklenmedi.

- Önceki kaydın kaynağı: [22TE05 tavan rayı su sızıntısı](https://static.nhtsa.gov/odi/tsbs/2023/MC-10236192-9999.pdf)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft-rav4-arka-kol` — İncelemede

**Arka süspansiyon kolunda korozyon ve gevşeme** · Dosya: `toyota-rav4.json`
- Mevcut kapsam: Toyota RAV4; RAV4 3. nesil (XA30); 2006–2011; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** XA30 G0V arka kol konusu önceki ayar/servis ve sıkma şartlarıyla birlikte incelenmeli; tüm motor/çekişlere atama yapılmaz. XA40 veya XA50 aynı nesil değildir; Türkiye parça/VIN eşitliği eksik.

- Önceki kaydın kaynağı: [RAV4 G0V arka alt süspansiyon kolu açıklaması](https://techinfo.toyota.com/techInfoPortal/staticcontent/en/techinfo/html/prelogin/docs/cp/g0vtofaq.pdf)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft-yaris-eps-role` — İncelemede

**Elektrikli direksiyon desteğinin kesilmesi** · Dosya: `toyota-yaris-chr.json`
- Mevcut kapsam: Toyota Yaris; Yaris XP130; 2011–2012; motor: belirtilmemiş; tüm motorlar anlamına gelmez; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** XP130 erken üretim EPS rölesi; UK üretim sınırı ile JSON model yılı birbirinin yerine kullanılamaz. Türkiye EPS ünitesi/VIN bekliyor. XP210 yeni 1.5 hibrit [T6] bu adaya bağlanmaz.

- Önceki kaydın kaynağı: [Yaris / Verso-S elektrikli direksiyon geri çağırması](https://media.toyota.co.uk/toyota-announces-recall-of-some-yaris-and-verso-s-models-for-power-steering-correction/)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

### `astra-ft-chr-hv-kablo` — İncelemede

**Hibrit kontrol ünitesi kablosunda aşınma** · Dosya: `toyota-yaris-chr.json`
- Mevcut kapsam: Toyota C-HR; C-HR 1. nesil (AX10/AX50); 2016–2018; motor: 1.8 Hybrid; şanzıman: belirtilmemiş; otomatik kapsam çıkarılmaz.

**Kaynak, Türkiye kapsamı ve yayın koşulu:** Birinci nesil 1.8 Hybrid tesisat konusu. [T7] 2ZR-FXE/NiMH teknik ayrımını destekler, Türkiye kablo kampanyasını değil. Üç model için ortak verilen yabancı tarih aralığı C-HR VIN aralığı sayılmaz; 1.2 turbo, 2.0 hibrit ve ikinci nesle taşınmaz.

- Önceki kaydın kaynağı: [Prius ve C-HR HV motor kablo demeti yabancı kampanya raporu](https://static.nhtsa.gov/odi/frcl/2018/FRCL-18F156-2391.pdf)

**Değişiklik:** JSON alanı değiştirilmedi; eski kapsam yukarıdaki gibi korundu. Yeni karar: yalnız belirtilen koşullarla incelemede, otomatik yayın yok.

## Yeni izler ve kayıt üretmeme kararları

- **EcoSport/Focus/Fiesta 23S64:** yağ pompası kayışı/gergisi için gerçek resmi belge bulundu [F1]. Türkiye tesis/VIN ve teknik eşitlik kurulmadan yeni JSON oluşturulmadı. Mevcut Focus triger kaydıyla otomatik birleştirilmez; yağ pompası ve eksantrik tahriki ayrı parçalar.
- **Camry/RAV4 OCS:** gerçek ABD kampanya belgesi [T5] var. Türkiye sensör numarası ve VIN kapsamı eksik. Yeni Türkiye kronik sorun adayı sayılmadı.
- **Verso EGR:** Türkiye kullanıcı anlatımı [T2] ve 1WW teknik kimliği [T9] bulundu. Kullanıcı EGR değişimi, EGR soğutucu imalat kusurunu veya Türkiye kampanyasını kanıtlamaz. Yeni JSON yok.
- **Hilux/Prado GD DPF:** Avustralya kapsamı [T4] gerçek; Türkiye DPF/kalibrasyon eşitliği eksik. Satın alma tarihinden üretim yılı türetilmedi. Yeni JSON yok.
- **Hibrit fan/filtre:** [T3] bakım konusudur; genel kronik batarya arızası olarak yeni kayıt desteklenmedi. Bu karar mevcut 21 adayın “Desteklenmedi” sayısını değiştirmez; ayrı araştırma izidir.

## Teknik ayrımların sonucu

1. **EcoBoost:** 1.0 ailesi tek triger tasarımı değildir. Focus 125 PS MHEV zincirli uygulama [F2], yağ pompası kayışı kampanyası [F1] ve Fox soğutma hortumu [F7] ayrı tutuldu. Türkiye motor kodu–üretim tarihi–triger tasarımı matrisi hâlâ eksik; “2018 sonrası hepsi zincirli” kuralı önerilmedi.
2. **1.5 / 1.6 soğutma:** [F8] ABD Fusion/Escape 1.5, [F7] Sigma 1.6 üretim kapsamıdır. Türkiye dört haneli motor kodları ve blok revizyonları tamamlanmadı. Model adları benzer diye Kuga/Mondeo'ya otomatik uygulanamaz.
3. **PowerShift:** mevcut DPS6 adayının kuru çift kavrama sınırı korundu. Kuga 1.5 dizel PowerShift [F6] için kavrama/kutu kodu bu belgede açık değil. Islak kutu sorunları kuru DPS6'ya atanmadı; Türkiye Mondeo dizel/otomatik matrisi kapanmadı.
4. **Toyota:** Auris II 1NR-FE / 1ZR-FAE / 1ND-TV / 2ZR-FXE [T1] ve Verso 1WW [T9] ayrı. Eski Corolla VVT-i, bütün Valvematic yılları, 1AD/2AD ve GD dizellerinin Türkiye teknik kapsamı tamamlanmadı.
5. **Hibrit:** Yaris IV Li-ion, ilk C-HR 1.8 NiMH, Corolla Cross beşinci nesil Li-ion [T6/T7/T10] aynı batarya değildir. Fan/filtre bakım yöntemleri model/yıla bağlı [T3]. e-CVT'ye kayışlı CVT arızası taşınmadı; Türkiye tüm batarya parça numarası matrisi tamamlanmadı.

## Model ve nesil araştırma kapsamı

“İncelendi” yalnız yazılan teknik konu/aday için geçerlidir; modelin bütün sorunları araştırılmış değildir. “Önceki tur” bu tur yeni dış kaynak doğrulaması anlamına gelmez. Boşluk, aracın sorunsuz olduğu anlamına gelmez.

### Ford

| Model | Önceki turlarda incelenen kesit | Üçüncü tur gerçek katkı | Araştırılmamış / açık nesil ve kapsam |
|---|---|---|---|
| Focus | Mk1/Mk2 gösterge, Mk2 ABS; canlı kayıtlarda motor sorunları | Fox/MHEV tahrik ayrımı; Sigma üretim sınırı; ABD DPS6/23S64 karşılaştırması | Türkiye Mk3/Mk4 motor kodları, ıslak kutular, tam motor seçeneği matrisi |
| Fiesta | 2002–08 EST, 2002–04 SIM22, 2013 DPS6; MK100 | 14M02 tesis ayrımı, 23S64 yağ pompası sınırı | Diğer nesil/motorlar, TR kavrama/TCM parça revizyonları |
| Puma | 2021 1.0 Hybrid tek direksiyon vakası | Yayın için tekil vaka yetersizliği yeniden değerlendirildi | Diğer motor/yıllar, elektrik/klima/gövde/iç trim; yeni arıza kaynağı yok |
| EcoSport | Önceki tur boşluk | 23S64 ABD üretim kapsamı | Türkiye araç/tesis/şanzıman eşitliği; diğer sistemler |
| Kuga | Mk2 Sigma ve DCM3.5 | Türkiye 1.5 TDCi PowerShift belgesi; 1.5/1.6 soğutma ayrımı | Mk1/Mk3, hibritler; tüm dizel kutu kodları ve TR VIN |
| Mondeo | Mk4 DCM3.5 ve 2011 sonrası klima fanı | ABD Fusion bülteninin otomatik aktarılamayacağı belirlendi | Mk1–3, Mk5; TR dizel/otomatik uygulama matrisi |
| C-Max / Grand C-Max | C-Max I MK60 | C-Max 1.6 Sigma üretim sınırı okundu; yeni aday yapılmadı | Eski motorlar, II/Grand C-Max ayrı sorun kapsamları |
| S-Max / Galaxy | 2010–15 DCM3.5 | Parça eşleşmesi yayın engeli olarak korundu | Diğer nesiller, motor/kutu kombinasyonları; yeni kaynak yok |
| B-Max | 2014–17 MK100 | Courier/Connect ile yanlış kapsam aktarımı engeli | Diğer sistemler; yeni dış kaynak yok |
| Tourneo / Transit Courier | Önceki tur boşluk | 2019 Tourneo 1.5 TDCi 75/100 manuel doğrulaması | Transit ayrı uygulama; yeni nesil 2024 belgesi erişilemedi; arıza kapsamı açık |
| Tourneo / Transit Connect | 2015 sonrası MK100 adayları | Türkiye 1.5 120 PS sekiz ileri otomatik açıklaması | İlk nesil ve yeni nesil; ABS parça/VIN, diğer kutular |
| Tourneo / Transit Custom | Önceki tur boşluk | 2019 Tourneo 2.0 EcoBlue teknik seçenekleri | Transit ayrı kapsam; yeni nesil, yağlama/şanzıman/gövde arızaları |
| Ranger | T6 Bosch ABS | Türkiye ticari basın metni teknik bağlamı; ABS adayı genişletilmedi | Önceki/yeni nesiller, 6R80/10R80 TR uygulamaları |
| Diğer Ford modelleri | Bu dosyalarda kapsam yok | Yeni ayrıntılı araştırma yok | Ka, Fusion ve diğer katalog modelleri; tüm nesiller |

### Toyota

| Model | Önceki turlarda incelenen kesit | Üçüncü tur gerçek katkı | Araştırılmamış / açık nesil ve kapsam |
|---|---|---|---|
| Corolla | E140/E150 MMT ve 2010–12 1.4 D-4D yağ | Türkiye yağ tartışması yeniden okundu; neden/seri sınırı açık | E120/E170/E210 diğer motorlar, Valvematic ve hibritler |
| Auris | E150 MMT; II boşluk | II motor kodları ve manuel/Multidrive S/e-CVT ayrımı | Türkiye kod/şanzıman doğrulaması; I/II diğer sistemler |
| Yaris | XP90 MMT, XP130 EPS | IV/XP210 hibrit teknik ve batarya ayrımı | XP10; XP130 hibrit arızaları, XP210 TR parça kapsamı |
| C-HR | I 1.8 hibrit kablo | I 2ZR-FXE/NiMH teknik ayrımı | I 1.2/2.0, II hibrit sistemlerinin arıza kapsamı |
| RAV4 | XA30 arka kol; XA50 tavan su | OCS ABD izi, hibrit bakım parça çeşitliliği | XA10/20/40; XA50 TR ray/OCS eşitliği ve diğer sistemler |
| Avensis | T250 2.0 yakıt; T27 2011 Valvematic tekil vaka | Tek vakadan model-geneli kroniklik çıkarılmadı | T220, T250 diğer motorlar, T27 dizeller/diğer yıllar |
| Verso | Boşluk | 2014 1WW manuel teknik kimliği; TR EGR kullanıcı izi | 1.6/1.8 benzinli, 2.0/2.2 dizel; resmi TR EGR/parça kapsamı |
| Corolla Cross | Boşluk | Avrupa beşinci nesil hibrit teknik açıklaması | Türkiye kesin uygulamalar; elektrik/klima/trim arızaları |
| Prius | XW30 EGR ve J0V | Batarya fanı bakımının arızadan ayrılması | XW10/20/50/60 ve PHEV; TR XW30 parça/ECU eşitliği |
| Hilux | Boşluk | 1GD/2GD Avustralya DPF kapsamı | Türkiye GD eşitliği, eski KD motorlar; şasi/elektrik/aktarma |
| Land Cruiser / Prado | Boşluk | Yalnız Prado Avustralya GD DPF belgesi | Land Cruiser diğer aileleri/nesilleri; TR Prado eşitliği |
| Camry | Boşluk | ABD 2020–22 Hybrid OCS izi | TR sensör/VIN; eski nesiller ve diğer sistemler |
| Aygo | I MMT | MMT kapsamı yeniden değerlendirildi | II/Aygo X ve diğer sistemler; yeni kaynak yok |
| Diğer Toyota modelleri | Bu dosyalarda kapsam yok | Yeni ayrıntılı araştırma yok | Bütün incelenmemiş nesil ve uygulamalar |

## Eski/yeni alan değişiklikleri ve kalan işler

**Değiştirilen eski JSON alanı: 0.** Eski değerler aynen kaldığı için sessiz düzeltme veya ID değişimi yok. Yeni kapsam koşulları yukarıdaki 21 inceleme bölümünde ve kaynak defterinde kayıtlı. Bunlar şemanın ifade edemediği VIN/parça şartlarını yok sayarak yayına aktarılmamalı.

Öncelik sırası: (1) Türkiye servis/parça/VIN karşılığı bulunan adayları daraltmak, (2) DCM3.5 ve MK60/MK100 ünite numaralarını katalog araçlarıyla eşlemek, (3) 1.0 motor kodu–triger tasarımı ve ıslak PowerShift matrisini tamamlamak, (4) D-4D yağ eksiltme asıl servis bülteni, (5) Verso/Camry/Hilux yeni izlerinin Türkiye karşılığı. Klima/gövde/direksiyon adayları mevcut; elektrik, iç trim ve süspansiyon için bütün modellerin tarandığı iddia edilmez.

Tam Türkiye kapsamı henüz kapanmadı. Erişilemeyen belgeler ve kalan model/nesiller açıkça listelendi. Bu tur araştırma notları ile yayın kararı birbirinden ayrıldı.

## Doğrulama sonuçları

- JSON Schema Draft 2020-12 ve format kontrolü: **13/13 başarılı**.
- Projenin `researchBundleSchema` Zod doğrulaması: **13/13 başarılı**.
- Başlangıç SHA-256 listesine göre değişmeyen özgün JSON: **13/13**. Liste: `tur3-baslangic-sha256.txt`.
- Benzersiz aday ID: **21/21**; raporda karşılığı bulunan aday: **21/21**.
- Dosya içi kaynak ID tekilliği ve sorun→kaynak referansları: başarılı.
- Yeni aday JSON'u: **0**; silinen/değişen özgün aday: **0**.
- `src/`, `tests/`, katalog ve canlı sorun dosyalarına bu tur yazılmadı. Uygulama testi/build/import çalıştırılmadı; bu teslimat araştırma raporudur. Şema başarısı teknik iddiaların doğrulandığı anlamına gelmez.
- Commit, push, merge ve yayın yapılmadı. Diğer oturumların çalışma ağacı değişikliklerine müdahale edilmedi.

## Aynı Motor Ailesinde Farklı Güç Versiyonlarının Kronik Sorun Ayrımı

Ek inceleme: 18 Ekim 2026. Bu bölüm önceki genel motor isimlerinin bütün güçlere uygulanabileceği şeklinde yorumlanmasını engeller. Yeni kaynaklar kaynak defterindeki P1–P9'dur. Mevcut 21 adayın yayın durumu değişmedi.

### Bağlayıcı araştırma/eşleştirme standardı

Sorun kapsamı şu alanların kaynakla desteklenen kesişimidir: **model ve kasa + üretim/model yılı + tam motor satış adı ve özgün güç birimi + motor kodu/teknik nesil + hibrit türü + ilgili parça/revizyon + gerekiyorsa şanzıman kodu + Türkiye uygulanabilirliği**. Güç, bu koşulların yerine geçmez.

- Kaynak yalnız bir güç seçeneğini destekliyorsa başka güce genişletme yapılmaz. İki güçte aynı arızalı mekanizma ve uygulama destekleniyorsa ikisi ayrı motor girdileriyle kapsanabilir.
- Yalnız bir güçte bildirim bulunması diğer gücün sorunsuz olduğunu ispatlamaz. Ortak parça tasarımı da tek başına her güçte kroniklik kanıtı değildir.
- Gücü belirtilmeyen kaynak, mevcut bütün motor kimliklerini seçmek için joker değildir. Motorla ilişkili kayıtta güç/kod belirsizliği çözülemiyorsa incelemede tutulur. Gövde/ABS/direksiyon gibi konularda motor bağımsızlığı ayrıca parça uygulamasıyla kanıtlanmalıdır.
- `vehicles[].engines[].name`, arıza kaynağı desteklediğinde `1.0 EcoBoost 125 PS` veya `1.0 EcoBoost Hybrid 155 PS` kadar açık yazılır. `code` ancak ilgili arızalı araç/uygulama için doğrulanırsa eklenir. Teknik katalogdaki kodu gücü bilinmeyen forum aracına atama.
- PS, hp ve kW birbirinin aynı sayısı değildir. Hibritte içten yanmalı motor gücü ile toplam sistem gücünü ayır. Mevcut v1 şemasında ayrı güç alanı yok; bu görevde şema değiştirilmedi. Özgün birim motor adında, ayrım ve sınırlar `uncertainties`/araştırma notunda korunmalı.
- ST-Line motor kimliği değildir; ST ayrı performans uygulaması olabilir. Paket adından güç, hibrit sistemi veya şanzıman türetilmez.
- Araştırma standardı rapora eklendi; canlı eşleştirme koduna uygulanmış bir koruma olduğu iddia edilmiyor. Entegrasyon sırasında bu koşullar desteklenemiyorsa kayıt yayına alınmamalı.

### Puma: üç ayrı teknik seçenek

| Seçenek | Doğrulanan satış/şanzıman bağlamı | Motor kodu kanıtı | Yıl ve Türkiye sınırı |
|---|---|---|---|
| 1.0 EcoBoost 125 PS, mHEV olmayan | Türkiye lansmanında 7 ileri çift kavramalı otomatik [P1]; Temmuz 2020 broşürü benzinli/hibrit ayrımını gösterir [P2] | Takım üreticisinin uygulama tablosunda B7JA, 92 kW (125), Puma 2019–2023 [P5] | Tablo yılları Türkiye model yılı/VIN kapsamı değildir; bütün üretim yılları için kod sabitlenmedi |
| 1.0 EcoBoost Hybrid 125 PS | UK belgede 6 manuel/7 otomatik [P3]; sonraki Ford Otosan metninde manuel ve Powershift teknik dipnotları [P9] | Uygulama tablosunda B7JB, 92 kW (125), Puma 2019–2023 [P5] | Türkiye 2020 ilk lansman listesinden çıkarılamaz. P9'un kesin model yılı başlangıç/bitişi okunabilir metinde yok; tahmin edilmedi |
| 1.0 EcoBoost Hybrid 155 PS | Türkiye ilk lansmanında 6 manuel [P1]; UK belgede manuel/otomatik [P3], sonraki Otosan metninde Powershift [P9] | Uygulama tablosunda BZJA, 114 kW (155), Puma 2019–2023 [P5] | “155 PS her zaman manuel” de “her zaman otomatik” de yanlış genelleme olur. Sonraki kod/revizyonlar VIN ile kontrol edilmeli |

P5 tablosunun güç sütunu `kW (hp)` diye adlandırılmıştır; yukarıdaki PS satış adları Ford belgelerinden gelir. P5 bir Ford VIN/parça kataloğu değil, takım üreticisinin uygulama listesidir. Kodlar araştırma referansı olarak desteklenir; Türkiye'deki tekil otomobile kesin atama için yeterli değildir.

### Puma teknik sorularının yanıtları

1. **Eksantrik tahriki:** Laser'ın zincirli yeni Fox motorlar için takım belgesinde B7JA/B7JB/BZJA ailesi yer alır [P6]; P5 bu kodları üç Puma seçeneğine bağlar. Bu iki teknik kaynağın birlikte desteklediği sonuç, söz konusu kodlu uygulamalarda zincirli eksantrik tahrikidir. “125 PS kesin yağlı triger, 155 PS kesin zincir” ayrımı desteklenmiyor. Bu sonuç bütün 125 PS Ford motorlarına veya her Puma üretim revizyonuna genellenmedi.
2. **Yağ pompası tahriki:** OC Motorsport kendi servis gözleminde bu revize ailede zincir yanında yağ içinde çalışan ayrı pompa kayışı bulunduğunu, kodlar arasında B7JA/B7JB/BZJA olduğunu bildiriyor [P4]. Bu, tahrik mekanizması için servis kanıtıdır; Türkiye VIN'lerinin tamamında aynı parça numarasını veya aynı arıza oranını doğrulamıyor. BISG'nin dış tahrik kayışı da bu iki sistemden farklıdır. Zincirli triger, “motorda yağlı kayış yok” anlamına gelmez.
3. **Motor kodları:** İncelenen uygulama tablosunda standart 125, mHEV 125 ve mHEV 155 farklı kodlarla ayrılıyor. Kodun son harfi, üretim tarihi ve emisyon revizyonu kaybedilmemeli; bir kodun sonraki bütün araçlarda sürdüğü varsayılmamalı.
4. **Turbo/soğutma:** Ford'un hibrit açıklaması daha büyük turbo ve düşürülmüş sıkıştırma oranı yönünde tasarım farkını anlatıyor [P7]. Bu, standart 125 ile hibritlerin yalnız yazılımla ayrıldığını söylemeye izin vermez. Ancak 125 mHEV–155 mHEV turbo, su pompası, termostat, radyatör, hortum ve yağ pompası parça/revizyonlarının birebir eşitliği doğrulanmadı. Aynı veya farklı parça numarası uydurulmadı.
5. **125 standart / 125 mHEV:** Aynı güç etiketi teknik eşitlik değildir. Hibritte 48V sistem, BISG ve batarya bulunur; standart uygulama aynı hibrit mimarisine sahip değildir [P1/P7/P9]. Kayışlar, elektrik sistemi ve kontrol stratejileri ayrı değerlendirilir.
6. **125 mHEV / 155 mHEV ortaklıkları:** 1.0 üç silindirli EcoBoost hibrit mimarisi, 48V destek ve belgelenen zincirli motor ailesi ortak düzeydedir. Bunlardan bütün turbo/soğutma/gergi parçalarının aynı revizyon olduğu veya aynı arızaya sahip olduğu sonucu çıkmaz.
7. **Güce göre yaygınlık:** İncelenen belgeler ve servis yazısı 125/155 için karşılaştırılabilir araç sayısı, kilometre, bakım, şanzıman ve üretim dönemiyle düzeltilmiş arıza oranı vermiyor. “125 sorunlu, 155 sorunsuz” hipotezi **doğrulanmadı; tersine bütün sorunların ortak olduğu da doğrulanmadı**. Her iki sonuç için kanıt yetersiz.
8. **Motor mu şanzıman mı:** İlk Türkiye seçenekleri farklı şanzımanlarla geldiğinden kullanıcı deneyimi farkı yalnız güçle açıklanamaz. Zincir/pompa kayışı motor; kavrama/vites seçimi şanzıman; mevcut vuruntu vakası direksiyon konusudur. Yedi ileri Puma kutusu, altı ileri DPS6 adayının kapsamına otomatik eklenemez.

**Ortak sorun kararı:** P4'te zincir uzaması ve pompa kayışı bozulması servis gözlemi olarak var, ancak vakaların güç/kod/üretim bazında dağılımı verilmedi. Bu nedenle üç Türkiye seçeneğine ortak kronik sorun JSON'u eklenmedi. **Yalnız belirli güçte doğrulanan yeni sorun: 0.** Sorunun diğer güçte bulunmadığına dair kanıt: yok.

### Mevcut Puma adayı ve katalog kimlikleri

`astra-ft-puma-direksiyon-vuruntu` kaynağı yeniden açıldı [P8]. Araç 2021 1.0 hibrit ST-Line olarak belirtiliyor; **güç, motor kodu ve şanzıman verilmemiş**. Motor adı `1.0 EcoBoost Hybrid` olarak korundu; 125/155 ve B7JB/BZJA eklenmedi. Bu alanın genel olması iki güce otomatik yayın izni değildir. Direksiyon parçalarının ortaklığı ayrıca doğrulanmadığından motor-bağımsız kapsam da ilan edilmedi.

Salt okunur katalog kontrolünde Puma altında şu kimlikler ayrı bulundu:

- Standart 125: `ford-ecoboost-10-125ps-c519`.
- Hibrit 125: `ford-10-hibrit-ecoboost-125`.
- Hibrit 155: `ford-ecoboost-hybrid-10-155ps` ve `ford-10-hibrit-ecoboost-155`.
- Gücü belirsiz `ford-10-mhev`: 125 veya 155 olarak yorumlanmadı.

Kimlikteki metin motor kodu kanıtı değildir. İki 155 kimliği de sırf aynı isim/güç taşıyor diye aynı sorunla doldurulmamalı; kaynak, üretim ve parça koşulları kontrol edilmelidir. Mevcut 155 kaydının otomatik şanzıman görünümü ilk lansmandaki manuel seçeneğin yerine geçmez. Katalog dosyaları bu görevde değiştirilmedi.

### Diğer önemli ailelere uygulama

Aşağıdaki satırlar güç seçeneklerinin arıza kapsamını yeniden değerlendirir; kaynakta sayısal güç bulunmayan adaylara katalogdaki popüler güçler eklenmedi.

| Aile / adaylar | Güç incelemesi ve ortak/farklı teknik kapsam | Ortak veya güce özel sorun kararı / açık kanıt |
|---|---|---|
| Focus/Fiesta 1.0 EcoBoost | Yeni nesil 125/155 mHEV kodları P5'te Focus B7DC/M0DC, Fiesta B7JB/BZJA olarak ayrılır; Puma kodları Focus'a taşınmaz. Eski 1.0 Fox kayış/hortum ile yeni zincir ailesi ayrı | F1/F2/F7 kaynakları tüm 125/155 için ortak arıza kanıtı değildir. Pompa/triger/revizyon ve VIN açık |
| Fiesta 1.25/1.4/1.6 SIM22, Durashift ve 1.6 DPS6 | Mevcut arıza adaylarında kesin PS yok. SIM22 ECU, EST aktüatör ve DPS6 TCM birbirinden farklı parçalardır | Güç tahmini yapılmaz; EST/DPS6 sorunları hacim veya aynı güç üzerinden manuel/diğer otomatiklere yayılmaz |
| Kuga/Mondeo 1.5 ve 1.6 EcoBoost | F7 Sigma ve F8 ABD 1.5 farklı kapsam; güç listesi arıza belgesinde kesinleştirilmiyor. Türkiye 180 PS satış kaydı tek başına kampanya kapsamı değil | Ortak soğutma sorunu diye birleştirilmez. Blok/kafa/revizyon, üretim ve VIN belirleyici; güce özgü yeni sonuç yok |
| Ford TDCi / EcoBlue | Courier 75/100, Custom 130/170 ve Connect 120 PS teknik seçenekleri önceki turda incelendi. Aynı hacim ve aile ECU/DPF/kutu eşitliği değildir | DCM3.5, MK100 veya Ranger ABS bütün dizel güçlere atanmaz. Kuga/Mondeo kutu/parça matrisi açık |
| Corolla/Auris VVT-i / Valvematic; Avensis | T1'de 1NR-FE/1ZR-FAE ayrımı; Avensis tekil vakasında tam güç doğrulanmadı. Aynı “1.6” veya güç, kontrol ünitesi eşitliği değil | Valvematic vakası Corolla/Auris'e taşınmaz. Ortak denetleyici revizyonu ve güce göre tekrar verisi eksik |
| Corolla/Auris D-4D; Verso; Hilux/Prado | 1ND-TV, 1WW ve GD farklı teknik motorlar. Mevcut yağ/EGR/DPF izlerinin güç bazında kesin uygulaması tamamlanmadı | 1.4 yağ eksiltme başka hacme/güce kopyalanmaz; 1WW EGR ve GD DPF ayrı tutulur. Motor seri/parça sınırı açık |
| Yaris / C-HR / Prius / Corolla Cross hibrit | T6/T7/T10 farklı batarya ve hibrit nesilleri; aynı 1.8 veya yakın sistem gücü teknik eşitlik sağlamaz. Sistem gücü ile benzin motoru gücü ayrılır | Prius EGR/J0V, C-HR tesisat, Yaris EPS çapraz aktarılmaz. Güçlere göre ortak arıza doğrulanmadı; motor/PCU/batarya parça kapsamı gerekir |
| RAV4 / Camry hibrit | 2.5 ortak hacim tavan klipsi, OCS, arka kol veya hibrit parçası eşitliği değildir. MY ve üretim sınırları ayrı | Motor gücünden tavan/OCS ortaklığı çıkarılmaz. İlgili parça, tesis ve VIN kanıtı bekleniyor |
| Diğer elektrik/klima/direksiyon/süspansiyon adayları | Focus gösterge/MK60, Mondeo fan, MK100, Ranger ABS, Yaris EPS için motor bağımsızlığı otomatik değil | Aynı parçanın farklı güçlerdeki uygulaması kanıtlanırsa ortak kapsam mümkün; sadece motor sayısını azaltmak için ortaklaştırılmaz |

**21 aday için sonuç:** Genel motor adı bulunan bütün adaylarda güç bilgisi “bilinmiyor” durumundan “bütün güçler” durumuna çevrilmeyecek. Bu ek çalışma hiçbir adayın kapsamını genişletmedi. Kaynakta doğrulanmış arızalı gücü bulunmayan kayda `name` içine yeni PS veya `code` eklenmedi; özgün 13 JSON korunuyor. Yeni JSON sorunu veya canlı kayıt yok.
