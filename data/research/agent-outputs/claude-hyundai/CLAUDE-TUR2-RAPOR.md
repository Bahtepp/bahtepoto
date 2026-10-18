# Hyundai ve Kia ikinci tur raporu

> **Güncel değil:** Bu raporun kapsam ve yaygınlık bilgileri `CLAUDE-TUR2-DOGRULAMA.md` ile değiştirildi (Santa Fe ve CHA084'teki Rio/Sportage satırları çıkarıldı, kaynaklar ve yaygınlıklar güncellendi). Geçerli değerlendirme o dosyadadır.


Tarih: 2026-10-18 · Ajan: `claude-hyundai` · Şema: `bahtepoto-research-v1`.
İlk tur dosyaları (`RAPOR.md`, `hyundai-i30.json`, `hyundai-tucson.json`, `hyundai-diger-modeller.json`,
`kia-sportage.json`) değiştirilmedi. Canlı katalog, `src/data/issues/` ve `sources.json` değiştirilmedi.

## Dosyalar

| Dosya | Sorun | Kaynak (okunan) |
|---|---|---|
| `hyundai-diger-tur2.json` | 4 | 5 (5) |
| `kia-rio-ceed-tur2.json` | 4 | 3 (3) |
| `kia-sportage-diger-tur2.json` | 2 | 3 (2) |
| `kia-diger-tur2.json` | 2 | 3 (3) |
| **Toplam** | **12** | **14 (13)** |

`hyundai-i20-tur2.json` ve `hyundai-accent-tur2.json` oluşturulmadı: i20 ve Accent Blue için
doğrulanabilen sorunlar yalnızca Gamma motor kayıtlarında çıktı ve onlar `hyundai-diger-tur2.json` içinde.

Doğrulama: dört dosya JSON şemasına ve projedeki `researchBundleSchema`'ya göre geçerli. Bütün
`claude-hyundai` dosyalarında sorun ve kaynak kimlikleri benzersiz. Metinlerde yüzde ifadesi yok.
`npm run issues:import` kuru çalıştırma (dosya yazmadan): **aktarılabilir 6, inceleme 6, geçersiz 0**;
ilk turun 5 kaydı "zaten vardı" olarak tanındı.

## Yeni sorunlar

| Kimlik | Başlık | Marka / model · nesil | Yaygınlık | İçe aktarma |
|---|---|---|---|---|
| `claude-hyundai-t2-mdps-esnek-kavrama` | Direksiyonda tıkırtı (esnek kavrama) | Elantra 4. ve 5. nesil, Santa Fe 3. nesil | medium | aktarılabilir |
| `claude-hyundai-t2-iccu-12v-sarj` | 12V akü şarj olmuyor (ICCU arızası) | Ioniq 5, Ioniq 6 | unknown | aktarılabilir |
| `claude-hyundai-t2-gamma-katalizor` | Katalizör dağılması ve silindir çizilmesi | Accent Blue, i20, i30, Elantra · G4FA/G4FC | low | inceleme |
| `claude-hyundai-t2-gamma-triger-zinciri` | Triger zincirinde erken uzama | Accent Blue, i20, i30, Elantra · G4FA/G4FC | medium | inceleme |
| `claude-kia-t2-rio3-debriyaj` | Debriyajda erken aşınma ve kalkışta titreme | Rio 3. nesil · 1.25, 1.4 CRDi · manuel | medium | inceleme |
| `claude-kia-t2-rio3-direksiyon-kaplama` | Direksiyon simidi kaplamasında soyulma | Rio 3. nesil | low | aktarılabilir |
| `claude-kia-t2-gamma-katalizor` | Katalizör dağılması ve silindir çizilmesi | Rio, Ceed, Cerato, Venga · G4FA/G4FC | low | inceleme |
| `claude-kia-t2-gamma-triger-zinciri` | Triger zincirinde erken uzama | Rio, Ceed, Cerato, Venga · G4FA/G4FC | medium | inceleme |
| `claude-kia-t2-cmdps-alt-rulman-sesi` | Direksiyon çevrilirken sürtünme sesi | Rio 3. nesil, Sportage 3. ve 4. nesil, Niro 1. nesil | medium | aktarılabilir |
| `claude-kia-t2-sportage3-awd-aktuator` | Dört çeker devre dışı, arıza lambası yanıyor | Sportage 3. nesil (dört çeker) | unknown | inceleme |
| `claude-kia-t2-optima-mdps-kavrama` | Direksiyonda ses (esnek kavrama) | Optima | low | aktarılabilir |
| `claude-kia-t2-ev6-iccu-12v-sarj` | 12V akü şarj olmuyor (ICCU arızası) | EV6 | unknown | aktarılabilir |

**Yeni benzersiz sorun: 12** (Hyundai 4, Kia 8). Yeni araştırılan modeller: Elantra (4. ve 5. nesil),
Santa Fe (3. nesil), Ioniq 5, Ioniq 6, Accent Blue, i20, i30 (Gamma), Rio, Ceed, Cerato, Venga,
Sportage (3. ve 4. nesil), Niro, Optima, EV6.

## Yaygınlık dağılımı

| high | medium | low | unknown |
|---|---|---|---|
| 0 | 5 | 4 | 3 |

Hiçbir kayda "high" verilmedi. Rio debriyajında çok sayıda bağımsız sahip yorumu var ama yorumlar
şikâyet odaklı ve oran yok. ICCU kayıtları `unknown`: kaynaklar resmi soruşturma ve geri çağırma
kayıtları; bunlar arızanın varlığını ve ilk düzeltmenin yetmediğini gösteriyor, sıklığını göstermiyor.

## Kategori ve kapsam

Direksiyon 3 · motor 4 · elektrik 2 · debriyaj 1 · iç trim 1 · aktarma (dört çeker) 1.

- **Motor:** Yalnızca Gamma 1.4 (G4FA) ve 1.6 (G4FC) MPI. Gamma II (G4FG), 1.6 GDI ve 1.6 T-GDI bu kayıtlara
  alınmadı. Kaynak, direkt enjeksiyonlu ve turbolu sürümlerin farklı (daha dayanıklı) zincir kullandığını
  yazıyor.
- **Şanzıman:** Rio debriyajı yalnızca manuel. AWD aktüatörü yalnızca dört çekerli Sportage 3. nesil.
  1.0 T-GDI ve 7 ileri DCT için yeni kayıt açılmadı (aşağıda).
- **Elektrikli:** ICCU kayıtları Hyundai (Ioniq 5, 6) ve Kia (EV6) için iki ayrı markanın ayrı resmi
  kayıtlarına dayanıyor. Ortak platform tek başına gerekçe olarak kullanılmadı.
- **Kia–Hyundai ayrımı:** Kia'nın direksiyon (CHA084) ve Optima kavrama bültenleri Kia'nın kendi
  belgeleri. Hyundai'nin Elantra/Santa Fe kavrama bülteni Kia modellerine yayılmadı.

## Kaynaklar

| Kaynak | Tür | Okundu mu |
|---|---|---|
| Hyundai TSB 17-ST-002 ve 17-ST-001 (NHTSA kopyası) | Üretici bülteni | Evet, `pdftotext` |
| NHTSA PE23011 kapanış özeti | Resmi soruşturma | Evet, `pdftotext` |
| NHTSA geri çağırma arayüzü (Ioniq 5 ve EV6) | Resmi geri çağırma | Evet, JSON |
| Za Rulem, "6 слабых мест моторов Hyundai и Kia" (15.04.2021) | Teknik yayın | Evet |
| Kia TSB CHA084 rev. 8 (NHTSA kopyası) | Üretici bülteni | Evet, `pdftotext` |
| Kia TSB CHA072 ve CS1604 soru-cevap (NHTSA kopyası) | Üretici bülteni | Evet, `pdftotext` |
| Kia TSB 047 (AWD aktüatör, NHTSA kopyası) | Üretici bülteni | **Hayır**: taranmış görüntü PDF |
| CarComplaints, Kia TSB 047 özeti | Teknik yayın | Evet |
| Fiches-auto, Kia Rio 2011-2016 güvenilirlik sayfası ve tek yorum | Kullanıcı raporu | Evet |

Aynı kaynağa dayananlar `basedOn` ile işaretli: Za Rulem makalesi (Hyundai ve Kia dosyası), Hyundai
17-ST-001/002, Kia CHA072/CS1604, Kia TSB 047 ve özeti, Fiches-auto sayfaları.

## İlk turla olası tekrarlar

- **`claude-hyundai-t2-mdps-esnek-kavrama` ↔ ilk tur `claude-hyundai-i30-fd-direksiyon-sesi`:** Bülten
  "Elantra Touring (FD)" satırını da kapsıyor; bu araç i30 FD'dir. Çakışmasın diye FD bu kayda
  **eklenmedi**. Elantra 6 (AD) rulman sesi ilk turdaki ayrı kayıttır (farklı mekanizma).
- **`claude-kia-t2-cmdps-alt-rulman-sesi` ↔ ilk tur `claude-hyundai-cmdps-rulman-sesi`:** Benzer
  mekanizma (direksiyon kolonu rulman sesi) ama farklı marka ve farklı üretici bülteni. Kurallar gereği
  ayrı kart; incelemede birlikte görülmesi önerilir.
- **i20 PB iç kapı tutamacı** yeniden yazılmadı. Rio direksiyon simidi kaplaması farklı bir parçadır.

## Kapsamı belirsiz bırakılanlar

- **Gamma kayıtları (4 kayıt, inceleme):** Kaynak nesil ve yıl vermiyor; "erken motorlar" diyor ama
  tarih yok. Model listesi Rusya pazarı; Türkiye'deki Accent Blue, i20 ve diğer modellerin motor kodları
  katalogda eşleştirilmeli.
- **Rio debriyajı (inceleme):** Katalogda bu motorların şanzıman bilgisi bulunmadığı için manuel kutu
  eşleşmesi doğrulanamıyor. Yorumlar Fransa pazarından.
- **Sportage AWD aktüatörü (inceleme):** Asıl bülten okunamadı. 6 Mayıs 2010 – 19 Şubat 2013 üretim
  aralığı ve P1820-P1824 kodları yalnızca arama özetlerinde görüldü.
- **Kia CHA084:** Bülten Cerato'yu (ABD adı Forte YD/BD) da kapsıyor. Katalogda Cerato nesilleri
  ayrılmadığı için Cerato bu kayda eklenmedi. Yıllar bülten yerine katalogdaki nesil dönemlerinden yazıldı
  (bülten bu kasa kodlarını yıl sınırı olmadan sayıyor).
- **ABD kaynakları:** Bültenler ve geri çağırmalar ABD model yıllarını veriyor; Türkiye araçlarının aynı
  parçaları kullandığı ayrıca doğrulanmadı. Hepsinde `uncertainties` alanında yazılı.

## Kaynak bulunamayan veya kayıt açılmayan modeller

| Model / konu | Durum |
|---|---|
| Hyundai i10, Getz, Accent Era, ix35, Bayon, Kona 2. nesil, Tucson diğer motorlar | Okunmuş, modele bağlı güvenilir kaynak bulunamadı |
| i20 GB ve BC3, Bayon, Kona: 1.0 T-GDI ve 7 ileri DCT sarsıntısı | Yalnızca bir forum yorumunda başkasından aktarılan gözlem ve kaynaksız derleme siteleri; kayıt açılmadı |
| Accent Era 1.5 CRDi enjektör | Yalnızca kaynaksız derleme sitesi (araclo); kayıt açılmadı |
| Kappa 1.2 (G4LA) triger zinciri sesi | Satış amaçlı rapor ve genel parça rehberi; kayıt açılmadı |
| Kia Picanto, Stonic, XCeed, Ceed 3. nesil, Sorento diğer motorlar | Okunmuş güvenilir kaynak bulunamadı |
| Rio 1.4 CRDi EGR, DPF, turbo | Yalnızca genel derleme metinleri; kayıt açılmadı |

Erişilemeyen kaynaklar: HonestJohn (Türkiye'den CloudFront ülke engeli), Tomorrow's Technician ve
import-car.com (Cloudflare bot denetimi / 403; bot denetimi aşılmadı). Au7o, autopartspro, carchecker ve
araclo gibi kaynak göstermeyen derleme siteleri kanıt olarak kullanılmadı.
