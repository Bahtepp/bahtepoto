# Ford ilk teslimat — 18 Ekim 2026

Araştırmacı: `astra-ford-toyota`. Yalnız araştırma çıktısıdır; canlıya aktarım yapılmadı.

## Sayılar ve kapsam

- 5 JSON, 8 yeni araştırma adayı, 9 farklı kaynak URL'si; bütün kayıtların yaygınlığı `unknown`.
- Kayıt kapsamındaki 12 model: Focus, C-Max, Fiesta, Mondeo, Kuga, S-Max, Galaxy, B-Max, Tourneo Connect, Transit Connect, Ranger ve Puma.
- Kaynak metniyle incelenen başlıklar: MK60/C1288, MK100 fren basıncı, Durashift EST, DPS6 vites kaybı, Delphi DCM3.5, Kuga 1.6 EcoBoost/17S09, Ranger ABS ve Puma direksiyon vuruntusu.
- Türkiye katalog dosyaları motor/nesil varlığı için okundu; bunlar parçanın aynı olduğunu veya Türkiye kampanyasını kanıtlamaz. Parça/VIN koşulları her kaydın `uncertainties` alanındadır. Hiçbir kayıt koşulları atlanarak otomatik yayımlanmamalı.

## Tekrar ve eşleştirme kontrolü

Mevcut `src/data/issues/records/ford/focus.json` içindeki 32 kayıt incelendi. Soğutma hortumu, triger, turbo, DPF, akü, marş ve mevcut geri çağırmalar yeniden yazılmadı. Yeni Focus kaydı MK60 basınç sensörüdür; bu mekanizma mevcut fren servosu/pedal geri çağırmalarından ayrıdır. Türkiye satışı doğrulanmamış 42 Focus araştırma varyantına eşleştirme yapılmadı.

DPS6 kuru çift kavrama, ıslak PowerShift ve tek kavramalı Durashift EST ayrı tutuldu. 14M02 ABD bülteni Türkiye kampanyası sayılmadı. Fiesta Türkiye bildirimi yalnız belirtiyi destekler; kesin TCM arızası olarak yazılmadı. Fiesta 2002–2008 için kaynak ve yerel nesil numaraları farklı olduğundan nesil alanı boş bırakıldı.

Kuga DCM3.5 kaynağındaki “Mk II / 2010” çelişkisi nedeniyle yıl kesişimi daraltıldı. DCM3.5 motor hacmi tahmin edilmedi. Ranger kaynağındaki 2010–2023 geniş satış aralığı bütün nesillere aktarılmadı. Parça numaraları zorunlu inceleme koşuludur.

## Araştırılıp yeni JSON üretilmeyen veya açık kalanlar

- Focus I/III/IV: mevcut kayıtlar kontrol edildi; bu teslimatta yeni kapsam eklenmedi. 1.0 EcoBoost wet-belt konusu mevcut triger kaydıyla ilişkisi ve motor revizyonu çözülmeden çoğaltılmadı.
- Tourneo Courier: [2023 1.0 EcoBoost klima bildirimi](https://forum.donanimhaber.com/2-yasinda-arabanin-klima-kompresoru-bozulur-mu-ford-courier--161775410) okundu. Kompresör teşhisi kesinleşmemiş; tek olaydan kronik kompresör arızası üretilmedi. Transit Courier parça listesi Tourneo kanıtı sayılmadı.
- Tourneo Custom: [Roy Wood servis duyurusu](https://www.roywoodtransits.co.uk/cambelt-bulletin/) ve [DRN-4871878 kararının teknik olay özeti](https://www.financial-ombudsman.org.uk/decision/DRN-4871878.pdf) okundu. Bakım aralığı kısalması tek başına kroniklik kanıtı değildir; kararda kök neden de kesinleşmemiştir. Yerel motor etiketleri ayrıca eşleştirmeye elverişsiz; katalog değiştirilmedi.
- EcoSport: 23S64/23V905 yağ pompası kayışı araması yapıldı; Türkiye parça/şanzıman kapsamı doğrulanmadı, kayıt yok. Bu yalnız ön taramadır.
- Islak PowerShift: [yerel tartışma](https://www.otoclubturkiye.com/forum/topic/296130-powershift-6dct450-mps6-n-den-d-ye-stop-etme-sorunu/) okundu; şanzımanı paylaşan farklı markalardan bütün Mondeo/Kuga araçlarına kusur taşınmadı.
- Puma direksiyon kaydı tek 2021 araç bildirimidir; kroniklik ve kesin parça bekler. Bütün Puma yıllarına uygulanmaz.
- Fiesta'nın bütün nesilleri, 1.4/1.5/1.6/2.0 TDCi alt sürümleri, SYNC, kilit/cam, HVAC, süspansiyon ve trim başlıkları tamamen doğrulanmış değildir. Bu ilk teslimat bütün Ford sorunlarının tamamlandığı anlamına gelmez.

## Kaynak erişim notu

`tsbsearch.com/Ford/24-7042` açıldığında arama özetindeki EcoBlue yerine 1998 Windstar metni döndü; `/134` belge yolu 403 verdi. Bu bağlantılar doğrulanmış EcoBlue kanıtı olarak kullanılmadı. Ford destek sayfası yalnız JavaScript uyarısı verdi. Kaynak sayısı JSON'lara alınan 9 URL'dir; değerlendirilip elenen bağlantılar buna dahil değildir.

## Doğrulama

5/5 dosya JSON Schema doğrulamasından geçti. Araştırma kaydı ile canlı katalog entegrasyonu ayrıdır. Toyota araştırması sonraki aşamadır. Önceki Renault/Dacia dosyaları ve canlı Focus sorunları değiştirilmedi.
