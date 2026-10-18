# Hyundai ve Kia ikinci tur doğrulama raporu

Tarih: 2026-10-18 · Ajan: `claude-hyundai` · Şema: `bahtepoto-research-v1`.
Bu rapor `CLAUDE-TUR2-RAPOR.md`'nin yerini alır. Dört ikinci tur dosyası (`hyundai-diger-tur2.json`,
`kia-rio-ceed-tur2.json`, `kia-sportage-diger-tur2.json`, `kia-diger-tur2.json`) bu doğrulamaya göre
baştan yazıldı. Sorun kimliklerinin hepsi korundu. İlk tur dosyaları, kod, katalog ve canlı veri
değiştirilmedi.

## Özet

| Ölçüt | Sayı |
|---|---|
| İncelenen yeni sorun | **12** |
| Yayına aday | **6** |
| İncelemede kalan | **6** |
| Çıkarılması önerilen | **0** (kayıt içinde yanlış araç satırları çıkarıldı; aşağıda) |
| Doğrulanan kaynak | **23 kaynak kaydının 23'ü okundu** (21 ayrı belge; Za Rulem ve Wikipedia Gamma sayfası iki dosyada ayrı kayıt) |
| Okunamayıp değiştirilen kaynak | 1 (görüntü PDF yerine aynı bültenin metin içeren kopyası) |
| Yaygınlığı değiştirilen kayıt | **8** |

Doğrulama komutları:

- **Şema:** Dört dosya JSON şemasına ve projedeki `researchBundleSchema`'ya göre geçerli; ek alan yok,
  kullanılmayan kaynak yok, metinde yüzde yok.
- **Kimlikler:** Bütün `claude-hyundai` dosyalarında sorun ve kaynak kimlikleri benzersiz.
- **İçe aktarma:** `npm run issues:import` kuru çalıştırma (dosya yazmadan) sonucu: aktarılabilir 6, inceleme 6, geçersiz 0. İlk turun 5 kaydı
  "zaten vardı" olarak tanındı.

## Kayıt kayıt değerlendirme

### YAYINA ADAY

**1. `claude-hyundai-t2-mdps-esnek-kavrama` — Direksiyonda tıkırtı (esnek kavrama)** · medium
Hyundai 17-ST-002 ve 17-ST-001 okundu (metin sütunlu ve okuma sırasıyla ayrı çıkarıldı).

- **Bülten içeriği:** Esnek kauçuk kavrama aşınınca tıkırtı veya vuruntu oluyor; güvenlik sorunu değil. Parça 56315-2K000-FFF.
  Garanti 10 yıla uzatılmış.
- **Elantra HD:** Bütün üretim.
- **Elantra MD (Kore üretimi):** Üretim 13.08.2010–19.02.2014. Kayıt bu tarihlere daraltıldı; UD ABD üretimidir ve ayrı satırdır.
- **Düzeltme:** **Santa Fe çıkarıldı.** Bültendeki "Santa Fe (NC)" ABD'nin uzun şaseli Santa Fe'si. Avrupa'ya bu kasa
  değil, normal boy Santa Fe ve ayrı bir Grand Santa Fe geldi.
- **Belirsizlik:** Türkiye/Avrupa araçlarında aynı parçanın kullanıldığı bir Avrupa parça kataloğuyla doğrulanamadı; notta yazılı.
  Yaygınlık "medium": dayanağı yalnızca bülten değil, üreticinin parçanın garantisini 10 yıla uzatması.

**2. `claude-hyundai-t2-iccu-12v-sarj` — 12V akü şarj olmuyor (ICCU)** · unknown → **low**

- **Okunan resmi belgeler:**
  - NHTSA PE23011: 2022 Ioniq 5; ICCU aşırı akım, şarj sonu gerilim tepesi ve ısıl yükle hasar görüyor, sigortası atıyor.
  - 24V-868 onay yazısı: 2022–2024 Ioniq 5, 2023–2025 Ioniq 6; 24V-204'ü genişletip yeniliyor; ABD'de 145.235 araç.
- **Avrupa kanıtı:** ÖAMTC sayfasındaki Avusturya geri çağırması okundu. Ioniq 5 üretim 13.01.2021–29.02.2024, Ioniq 6
  üretim 28.09.2022–04.04.2024. Yıllar bu Avrupa üretim aralıklarına göre güncellendi.
- **Türkiye:** Resmi bir Türkiye geri çağırması bulunamadı. Aynı sistemin bulunması ile Türkiye'de geri çağırma
  yapılması ayrı tutuldu.
- **Yaygınlık:** "low". ABD soruşturmasında incelenen bildirim sayısı kapsamdaki araçların küçük bir bölümü. Kayıt Genesis ve
  diğer Hyundai elektrikli modellerine yayılmadı.

**3. `claude-kia-t2-optima-mdps-kavrama` — Direksiyonda ses (esnek kavrama)** · low

- **Okunan belgeler:** CHA072, CS1604 soru-cevap ve verilen 2019 sahip mektubu (MC-10158144). Üçü de aynı programın belgeleri;
  `basedOn` ile tek kaynak sayılıyor.
- **Kapsam:** Bütün 2011–2013 ve bazı 2014 MY Optima, üretim 12.08.2010–18.12.2013.
- **Direksiyon donanımı:** CHA084 tablosunda Optima QF/TF Mobis kolon tipi elektrikli direksiyon olarak geçiyor.
- **Yaygınlık:** Kia sorunu ağırlıklı olarak çok nemli sıcak kıyı eyaletlerine bağladığı için "low" kaldı.
- **Belirsizlik:** Türkiye'deki Optima'nın aynı parçayı kullandığı doğrulanmadı.

**4. `claude-kia-t2-ev6-iccu-12v-sarj` — 12V akü şarj olmuyor (ICCU)** · unknown → **low**

- **Okunan resmi rapor:** 24V-867 Part 573 raporu. Kapsam bütün 2022–2023 ve bazı 2024 EV6'lar, üretim 17.11.2021–22.07.2024;
  araçlar şasi numarası sırasıyla üretilmemiş.
- **Arıza ve parça:** ICCU ASSY 36400-1XFA0, tedarikçi Hyundai Mobis. Neden geçici yüksek gerilim ve ısıl çevrim; 12V akü sürüşte
  boşalıyor ve güç kademeli düşüyor.
- **Yaygınlık:** Raporda üreticinin ABD kapsamı için verdiği küçük bir arıza oranı tahmini var. Bu yüzden "low"; oranın
  kendisi kullanıcı metnine yazılmadı.
- **Avrupa:** EV6-Forum.de'de (Ağustos 2023) ICCU ve sigortası değiştirilen vakalar okundu. Avrupa veya Türkiye için resmi
  geri çağırma numarası okunmadı.

**5. `claude-kia-t2-rio3-direksiyon-kaplama` — Direksiyon simidi kaplamasında soyulma** · low → **medium**
Verilen iki KiaClubTr başlığı açılıp okundu ve ikisi de Rio 3. nesille ilgili:

- **Ocak 2012'de alınmış yeni kasa Rio:** 6,5 ayda soyulma başlamış.
- **Ekim 2012 Rio Sedan 1.4 CVVT otomatik:** Bir yılda kaplama pul pul kalkmış; servis fabrikaya iletip simidi garantiden
  değiştirmiş.
- **2013 Rio 1.4 CRDi hatchback:** Aynı soyulma; yeni simit Kore'den sipariş edilmiş.

İlk başlıktaki Cerato yorumları kayda katılmadı. Fransa ve Türkiye'den bağımsız bildirimler ve servisin garantide değişim
yapması nedeniyle yaygınlık "medium" yapıldı.

**6. `claude-kia-t2-cmdps-alt-rulman-sesi` — Direksiyon çevrilirken sürtünme sesi** · medium → **unknown**

- **Okunan bülten:** CHA084 revizyon 8; açıklama, sayfa 8 model tablosu ve sonsuz dişli kiti tablosu okundu.
- **Önemli düzeltme:** Alt rulman/sonsuz dişli sürtünme sesi onarımı **yalnızca Mobis kolonlu** araçlar için.
  **Rio 3. nesil ve Sportage 3./4. nesil Mando kolonlu**; bültende yalnızca motor, ECU ve kolon gövdesi
  onarımı için anılıyorlar. Bu yüzden ilk sürümdeki Rio ve Sportage satırları **çıkarıldı**.
- **Yeni kapsam:** Kayıt, sonsuz dişli kiti tablosundaki 2017 ve 2018–2020 DE ile, yani **Niro 1. nesil**le sınırlandı.
- **Cerato:** Forte YD/BD satırları tabloda var, ama katalogda Cerato nesilleri ayrılmadığı için eklenmedi.
- **Ayrım:** Esnek kavrama aşınması (kayıt 1 ve 3) ile alt rulman/sonsuz dişli sesi ayrı mekanizmalar olarak tutuldu.
- **Kaynak:** Verilen oemdtc.com sayfası Cloudflare bot denetimi gösterdi ve açılmadı; bu denetim aşılmadı. Sayfa aynı NHTSA
  belgesinin (10202226) kopyası olduğu için asıl belge kullanıldı.
- **Yaygınlık:** Kaynak yalnızca onarım prosedürü verdiği için "unknown".

### İNCELEMEDE

**7. `claude-kia-t2-rio3-debriyaj` — Debriyajda erken aşınma ve kalkışta titreme** · medium

- **Kaynaklar:** Kaynak (Fiches-auto, 174 yorum) debriyajı özellikle 1.2 85 ch ve 1.4 CRDI 90 ch için anıyor.
  Wikipedia'nın Rio 3. nesil bölümü okundu: Avrupa'da 1.25 benzinli yalnızca 5 ileri manuel, 1.4 CRDi yalnızca 6 ileri manuel;
  otomatik yalnızca 1.4 benzinlide.
- **Yapılan:** Kayıt iki motor satırına ayrıldı ve her birine şanzıman adı yazıldı.
- **Neden incelemede:** 1.4 CRDi satırı artık içe aktarıcıdan geçiyor; 1.25 satırı katalogda bu varyantın şanzıman bilgisi
  olmadığı için takılıyor.
- **Öneri:** Katalog şanzıman bilgisi eklenince yayına alınabilir. Türkiye'den debriyaj bildirimi okunmadı.

**8. `claude-kia-t2-sportage3-awd-aktuator` — Dört çeker devre dışı, arıza lambası yanıyor** · unknown

- **Kaynak düzeltmesi:** İlk sürümde asıl bülten okunamamıştı (görüntü PDF). Aynı bültenin metin içeren NHTSA kopyası
  (SB-10089950-5448) bulundu ve okundu.
- **Bülten içeriği (CHA 047, Nisan 2015):**
  - Dört çekerli 2011–2016 MY Sportage SL, üretim 06.05.2010–19.02.2013.
  - Dört çekerli 2011–2015 MY Sorento XMa, üretim 24.10.2009–11.12.2014.
  - Belirtiler: P1820–P1824 (dört çeker pompa motoru), dört çeker devre dışı, arıza lambası.
  - Onarım: yalnızca hidrolik aktüatör 47810-3B520; kavrama tertibatı değiştirilmiyor.
- **Yapılan:** Sorento 2. nesil eklendi, yıllar üretim aralıklarına göre güncellendi.
- **Neden incelemede:** Bülten motor değil **yalnızca dört çekerli araçları** kapsıyor. Şemada dört çeker ayrımı yok;
  motor yazmak sorunu önden çekişli araçlara da yayardı.
- **Öneri:** İçe aktarmada çekiş (dört çeker) filtresi desteklenene veya katalogda dört çekerli varyantlar ayrılana kadar
  incelemede kalsın.

**9–12. Gamma kayıtları** · yaygınlık dördünde de **unknown** (önce low/medium)

- `claude-hyundai-t2-gamma-katalizor` · low → unknown
- `claude-hyundai-t2-gamma-triger-zinciri` · medium → unknown
- `claude-kia-t2-gamma-katalizor` · low → unknown
- `claude-kia-t2-gamma-triger-zinciri` · medium → unknown

**Mevcut kanıt:**

- **Kaynak:** Za Rulem makalesi okundu: G4FA 1.4 ve G4FC 1.6 MPI için katalizör seramiğinin dağılması (yalnızca "erken motorlar") ve
  plaka tipi zincirin erken aşınması.
- **Motor-model eşlemesi:** Wikipedia Gamma sayfasından okundu. Liste "eksik" işaretli ve çelişkili: G4FC'nin 2010'da
  değiştirildiğini yazıp 2017–2020'ye uzanan uygulamalar sayıyor.
- **Düzeltme:** Elantra (Hyundai) ile Cerato (Kia) bu kayıtlardan çıkarıldı. Elantra'nın listesi çelişkili; Cerato ise katalogda
  nesle ayrılmıyor.
- **İkinci kaynak:** Zincir için bağımsız ikinci kaynak aranırken yalnızca tek bir forum vakası ve okunmamış ticari siteler bulundu.

**Neden incelemede:**

- Tek yayıncı ve yabancı pazar; Türkiye'den servis veya kullanıcı doğrulaması yok.
- Katalizör sorunu "erken motorlar" ile sınırlı ama tarih yok.
- Katalog motor kayıtlarında G4FA/G4FC kodu yok.

Aday nesil eşleşmesi kasıtlı olarak araç alanına değil `uncertainties` notuna yazıldı; böylece kayıt bütün nesil üretimine
otomatik yayılmıyor. Öneri: Türkiye'den servis kaynağı veya ikinci bağımsız teknik kaynak bulunana kadar incelemede kalsın.

## İlk tur kayıtlarıyla tekrar kontrolü

| Yeni kayıt | İlk tur kaydı | Sonuç |
|---|---|---|
| Hyundai esnek kavrama (Elantra 4–5) | i30 FD direksiyon tıkırtısı | Aynı mekanizma ailesi (esnek kavrama), **farklı araçlar**. i30 FD ve Elantra Touring (FD) yeni kayda eklenmedi; hiçbir araç sayfasında çift kart oluşmaz. İstenirse Elantra satırları ilk tur kaydına birleştirilebilir. |
| Kia alt rulman sesi (Niro 1) | Hyundai C-MDPS rulman sesi | Aynı mekanizma, **farklı marka ve farklı üretici bülteni** (marka başına tek kayıt kuralı). Niro'nun kardeşi Ioniq ilk tur Hyundai kaydında; Niro Kia kaydında. Çakışma yok. |
| Gamma zincir / katalizör | Sportage/Sorento 2.4 GDI yağ eksilmesi | Farklı motor ailesi (Gamma MPI ve Theta GDI). Çakışma yok. |
| ICCU, Optima, Rio, Sportage/Sorento AWD | Tucson/Kona DCT, i30 GD kapı trimi | Çakışma yok. |

İlk turun beş kaydı yeniden üretilmedi.

## Yaygınlığı değiştirilen kayıtlar (8)

| Kayıt | Önce | Sonra | Neden |
|---|---|---|---|
| Hyundai ICCU | unknown | low | Resmi soruşturmada incelenen bildirimler kapsamın küçük bir bölümü; Avrupa geri çağırması (sıklık kanıtı değil) |
| Kia EV6 ICCU | unknown | low | Üreticinin resmi raporundaki tahmin küçük bir bölüm; Avrupa kullanıcı bildirimleri |
| Rio direksiyon kaplaması | low | medium | Türkiye ve Fransa'dan bağımsız bildirimler, servis garantide değiştiriyor |
| Kia alt rulman sesi | medium | unknown | Yalnızca onarım bülteni; garanti uzatması veya bildirim yok |
| Gamma kayıtları (4) | low / medium | unknown | Tek yabancı kaynak, ikinci bağımsız kaynak yok |

Hiçbir kayda "high" verilmedi. Hiçbir kullanıcı metninde yüzde veya arıza oranı yok.

## Kaynak kalitesi notları

- **`reviewed: true` anlamı:** Bütün kaynaklarda `true`, metnin gerçekten okunduğu anlamına geliyor. PDF'ler indirilip
  `pdftotext` ile; web sayfaları indirilip ya da tarayıcıyla; NHTSA geri çağırma arayüzü JSON olarak okundu.
- **Aynı belgenin kopyaları:** `basedOn` ile işaretli ve bağımsız sayılmıyor: Hyundai 17-ST-001/002, NHTSA ICCU kayıtları,
  Kia CS1604 belgeleri, Kia 24V-867 belgeleri, Fiches-auto sayfaları, Za Rulem ve Wikipedia Gamma.
- **Açılamayan bağlantılar:** oemdtc.com ve Tomorrow's Technician (Cloudflare bot denetimi; aşılmadı), HonestJohn (Türkiye'den
  ülke engeli), import-car.com (403). Bunlar kaynak olarak kullanılmadı.
- **ABD kaynakları:** Bültenler ve geri çağırmalar ABD içindir. Türkiye'ye uygulanabilirlik her kayıtta ayrıca belirtildi.
  Avrupa kanıtı yalnızca ICCU kayıtlarında bulundu (ÖAMTC, EV6-Forum.de).
