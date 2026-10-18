# Stellantis grubu araştırma raporu (Fiat, Opel, Peugeot, Citroën)

Tarih: 2026-10-18 · Ajan: `claude-stellantis` · Şema: `bahtepoto-research-v1`.
Canlı kayıtlar (`src/data/issues/`), kod, `claude-hyundai` ve `gemini-stellantis` dosyaları değiştirilmedi.
Gemini kimlikleri kullanılmadı; bütün kimlikler `claude-stellantis-` / `claude-st-` ile başlıyor.

## Dosyalar

| Dosya | Paket | Sorun | Kaynak (okunan) |
|---|---|---|---|
| `fiat-tur1.json` | 1: Gemini adayları | 3 | 6 (6) |
| `opel-tur1.json` | 1 | 1 | 2 (2) |
| `peugeot-tur1.json` | 1 | 2 | 6 (6) |
| `citroen-tur1.json` | 1 | 2 | 1 (1) |
| `peugeot-tur2.json` | 2: yeni sorunlar | 2 | 5 (5) |
| `opel-tur2.json` | 2 | 1 | 3 (3) |
| `citroen-tur2.json` | 2 | 1 | 3 (3) |
| **Toplam** | | **12** | **26 (26)** |

Doğrulama: yedi dosya JSON şemasına ve `researchBundleSchema`'ya göre geçerli. Ek alan yok, kimlikler
benzersiz, metinlerde yüzde ifadesi yok. Bütün kaynaklar tarafımdan açılıp okundu (`reviewed: true`).
`npm run issues:import` kuru çalıştırma: **aktarılabilir 7, inceleme 5, geçersiz 0, zaten vardı 0**.

## 1. Gemini'nin on adayı

| # | Gemini adayı | Durum | Kayıt | Not |
|---|---|---|---|---|
| 1 | Fiat Dualogic | **Kısmen doğrulandı** | `claude-stellantis-fiat-dualogic-bosa-dusme` | Kimliği belli bir İngiliz şanzıman servisi ve uzun bir sahip forumu konusu. Kapsam 500 (312) ve Punto 3. nesil, katalogda Dualogic'le eşleşen motorlarla. Linea ve Bravo okunan kaynaklarda geçmediği için eklenmedi. Normal duraksama/sarsıntı, boşa düşme ve vites geçmeme gibi arızalardan ayrıldı. |
| 2 | Fiat 1.4 Fire yağ tüketimi | **Kısmen doğrulandı, kapsam belirsiz** | `claude-stellantis-fiat-egea-14fire-yag-eksiltme` | Egea 1.4 FIRE 95 PS için çok sayıda şikâyet var, ama tüketimin sınırı aştığını gösteren ölçüm okunmadı. Kayıt "şikâyet" olarak yazıldı; yaygınlık `unknown`. Gemini'nin Linea/Punto 1.4 Fire 77 PS (8 supap) kapsamı desteklenmedi. |
| 3 | Fiat 1.3 MultiJet zincir | **Kısmen doğrulandı, kapsam belirsiz** | `claude-stellantis-fiat-13mj-triger-zinciri` | FAI'nin teknik yazısı Fiat'ın zincir kopabileceğini kabul eden müşteri mektubunu aktarıyor ve nedeni partikül filtreli sürümlerde yağın seyrelmesine bağlıyor. Motor nesli (Euro 4/5/6), üretim dönemi ve km kapsamı kaynakta yok. |
| 4 | Opel Astra K 1.6 CDTI zincir | **Kısmen doğrulandı** | `claude-stellantis-opel-16cdti-soguk-zincir-sesi` | febi'nin teknik notu soğuk çalıştırmada takırtıyı ve gergi contası çözümünü anlatıyor. Kaynaktaki LVK/LVL/LVM/LWQ/LWV GM'nin RPO kodları, Opel motor kodu değil; motor kodu yazılmadı. Katalogda Astra K'da 1.6 dizel yok, Türkiye'deki 1.6 dizel Astra'lar nesli belirlenmemiş grupta. Kayıt incelemeye düşüyor. |
| 5 | Opel Corsa D kalorifer klapesi | **Desteklenmedi** | — | Yalnızca başka markalara ait klape motoru forumları ve genel rehberler bulundu. Corsa D'ye özgü bir kaynak okunmadı. |
| 6 | Peugeot BlueHDi AdBlue | **Doğrulandı** (kapsam 1.6 BlueHDi ile sınırlı) | `claude-stellantis-peugeot-16bluehdi-adblue-deposu` | Avrupa Komisyonu duyurusu: Ocak 2014 - Ağustos 2020 üretimi Stellantis dizellerinde AdBlue deposu sorunu ve AB çapında tazminat. Kullanıcı raporu okunan 208 I 1.6 BlueHDi 100 ve 3008 II 1.6 BlueHDi 120 yazıldı. 1.5 BlueHDi'ye ait AdBlue raporu okunmadığı için eklenmedi (1.5'in ayrı sorunu aşağıda). |
| 7 | Peugeot 308 arka travers | **Doğrulandı** | `claude-stellantis-peugeot-308ii-arka-travers-gicirtisi` | L'argus makalesi bir üretici teknik notunu aktarıyor: 25.000 Nm/rad viraj demirli araçlar 10.12.2015'e, 30.000 Nm/rad demirliler 20.06.2016'ya kadar. Susturucu askısı vuruntusu ayrı tutuldu. Motor ile demir eşleşmesi okunmadığı için motor yazılmadı; kayıt incelemeye düşüyor. |
| 8 | Citroën C4 Picasso MCP/ETG | **Kısmen doğrulandı** (yalnızca 1. nesil BMP6) | `claude-stellantis-citroen-c4p1-bmp6-debriyaj` | Fiches-auto'nun 2006-2013 C4 Picasso sayfası normal sarsıntıyı arızadan (güçlü titreme, kayma, hata mesajı) ayırıyor. 2. nesil ETG6 için kaynak okunmadı. |
| 9 | Citroën C4 Picasso havalı arka süspansiyon | **Doğrulandı** (yalnızca donanımlı 1. nesil) | `claude-stellantis-citroen-c4p1-arka-hava-suspansiyonu` | Gözenekli körük, yorulan sensör, kompresör. Çelik yaylı araçlar kapsam dışı. Katalogda C4 Picasso nesilleri ayrılmadığı için incelemede. |
| 10 | Citroën C-Elysée rüzgâr/yalıtım sesi | **Desteklenmedi** | — | Sahip yorumları otoyolda yetersiz ses yalıtımını bir **karakter** olarak anlatıyor. Arızalı fitil veya kapı ayarı gösteren kaynak bulunamadı. |

Özet: **3 doğrulandı** (308 travers; AdBlue ve havalı süspansiyon kapsamı daraltılarak), **5 kısmen
doğrulandı** (Dualogic, 1.4 Fire, 1.3 MultiJet, Astra K 1.6 CDTI, C4 Picasso BMP6), **2 desteklenmedi**
(Corsa D klapesi, C-Elysée rüzgâr sesi).
Gemini'nin uydurma DonanımHaber konu numaralı ve genel şikâyet sitesi bağlantıları kullanılmadı.

## 2. Yeni sorunlar (Türkiye'de satılan modeller)

| Kimlik | Başlık | Kapsam | Yaygınlık | İçe aktarma |
|---|---|---|---|---|
| `claude-stellantis-peugeot-15bluehdi-eksantrik-zinciri` | 1.5 BlueHDi: eksantrik zincirinde uzama ve kopma | 208 II, 2008 I/II, 308 II/III, 3008 II, 5008 II, 508 II, Rifter · 2017-2023 | medium | aktarılabilir |
| `claude-stellantis-citroen-15bluehdi-eksantrik-zinciri` | Aynı sorun | C3, C3 Aircross, C4, C4 Cactus, C5 Aircross, Berlingo III, Grand C4 Picasso | medium | inceleme (C3, C3 Aircross, C4 katalogda nesle ayrılmamış) |
| `claude-stellantis-opel-15-dizel-eksantrik-zinciri` | Aynı sorun (PSA 1.5 dizel) | Corsa F, Crossland, Grandland 1. nesil | medium | aktarılabilir |
| `claude-stellantis-peugeot-16thp-zincir-gergisi` | 1.6 THP: zincir gergisi kayması | 308 I, 3008 I, 508 I | medium | aktarılabilir |

- **1.5 BlueHDi:** L'argus, UFC-Que Choisir ve MotorsActu birbirini tutuyor. Zincir Şubat 2023'te 7 mm'den
  8 mm'ye geçti; özel kapsam 10 yıl / 240.000 km. Model listesi Que Choisir'den. Üç marka için ayrı kayıt
  açıldı (marka başına bir kayıt kuralı). 301 ve C-Elysée 1.5 BlueHDi listede yok, eklenmedi.
- **Opel motor ayrımı:** Astra K (2019 sonrası) ve Insignia B'deki 1.5 dizel GM motorudur. Katalogda iki
  motorun adı da "1.5 DIZEL" olduğu için yalnızca PSA dönemi nesilleri ve güç değerli motor adları yazıldı.
  Astra L katalogda tek "1.5 DIZEL" adıyla geçtiği için çıkarıldı. 1.6 CDTI kaydı da yalnızca GM motorudur;
  Grandland/Crossland'deki PSA 1.6 dizel o kayda girmez.
- **PureTech:** Yeni kayıt açılmadı (canlı kayıt var). Kayışlı ve zincirli nesiller karıştırılmadı.

## 3. Canlı kayıtlar için öneriler (yeni kart açılmadı)

| Canlı kayıt | Öneri |
|---|---|
| Peugeot erken 1.2 PureTech kayış | AdBlue duyurusunu yapan Avrupa Komisyonu / CPC süreci ve L'argus'un Stellantis tazminat platformu haberleri PureTech'i de anıyor. Platformun kapsamı ve 10 yıl / 175.000 km uzatma resmî Stellantis sayfasından okunup kaynak olarak eklenebilir. Bu turda o sayfayı okumadım; kayda bir şey eklenmedi. |
| Fiat Linea airbag kapağı, Egea direksiyon tıkırtısı, Opel Astra J PCV, Astra H korna (CIM) | Bu turda yeni bir güçlendirici kaynak bulunamadı. |

## 4. Kaynak bulunamayan veya kayıt açılmayan konular

| Konu | Durum |
|---|---|
| Opel Corsa D 1.2 / 1.4 benzinli zincir uzaması | Yalnızca Autodoc ve Au7o gibi kaynak göstermeyen derleme siteleri; kayıt açılmadı |
| Peugeot 3008 II / 5008 II EAT8 vites sarsıntısı | Yalnızca forumdaki tek tük yorum ve ikinci elden aktarılan bir bilanço; L'argus sayfası kaldırılmış (404) |
| Egea 1.6 Multijet DCT | Okunmuş güvenilir kaynak bulunamadı |
| C4 Picasso II ETG6 | Okunmuş kaynak bulunamadı |
| Fiat Linea, Fiorino, Doblo diğer konular; Opel Insignia, Mokka, Vectra; Peugeot 301, Partner; Citroën C3, C5 Aircross diğer konular | Bu turda ayrıca araştırılmadı veya güvenilir kaynak çıkmadı |

Erişim notları: Auto Express C4 Picasso makalesi kaldırılmış (410). FAI'nin 2018 tarihli PDF'i indirilemedi
(404); onun yerine aynı içeriği taşıyan PMM makalesi okundu. Caroom (403) okunmadı. Bot denetimi aşılmadı.

## 5. Genel belirsizlikler

- Kaynakların çoğu Fransa, İngiltere veya AB pazarına ait. Türkiye'deki araçların aynı parçaları
  kullandığı ve tazminat/uzatma programlarının Türkiye'de geçerli olduğu doğrulanmadı.
- C4 Picasso, Grand C4 Picasso, C3, C3 Aircross, C4, Rifter, Fiorino ve Bravo katalogda nesle
  ayrılmadığı için bu modellerdeki kayıtlar incelemeye düşüyor ya da yıl sınırıyla yazıldı.
- Yaygınlıklar oran değil, kaynak türüne ve tekrar eden bildirimlere dayalı değerlendirmedir;
  gerekçeler her kayıtta `frequencyRationale` alanında.
