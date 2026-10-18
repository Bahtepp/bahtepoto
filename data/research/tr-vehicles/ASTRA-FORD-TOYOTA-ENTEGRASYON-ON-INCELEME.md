# Astra Ford / Toyota — entegrasyon ön incelemesi

Tarih: 2026-10-18. Dal: `katalog-turkiye`. JSON, canlı sorun kaydı ve katalog değiştirilmedi. `--apply` çalıştırılmadı. Push, `main` ve Pages yok.

## Dry-run

`npm run issues:import -- --input data/research/agent-outputs/astra-ford-toyota/`

Aktarılacak: 7 · Zaten vardı: 0 · İnceleme: 14 · Geçersiz: 0

Bu 7 satır teknik eşleşme ürettiği için aktarılabilir göründü. Aşağıdaki kararların hiçbiri **entegrasyona uygun** değil. Importer uyarısı, Türkiye parçası, VIN veya kroniklik eksikliğini ölçmez.

| Karar | Adet |
|---|---|
| Entegrasyona uygun | 0 |
| Katalog eksikliği | 6 |
| Kanıt eksikliği | 15 |
| Tekrar | 0 |
| Desteklenmedi | 0 |

Canlı Focus kayıtlarıyla aynı arıza yok. Kuga 17S09’un “devirdaim pompası” ile çakışması başlıktaki “soğutma” sözcüğünden gelen sahte çakışmadır; ADAC Focus pompası ile Sigma kafa hasarı aynı konu değildir.

## Puma motor ayrımı

Katalogda Puma tek nesilde (`nesli belirlenmemiş`) ve ST-Line motor değildir:

| Satış adı | Katalog kimliği | Yıl | Şanzıman | Not |
|---|---|---|---|---|
| 1.0 EcoBoost 125 PS, mHEV değil | `ford-ecoboost-10-125ps-c519` | 2020–2026 | otomatik | Donanım ST-Line / Style |
| 1.0 EcoBoost Hybrid 125 PS | `ford-10-hibrit-ecoboost-125` | 2024–2026 | otomatik | 2021 kaydına bağlanamaz |
| 1.0 EcoBoost Hybrid 155 PS | `ford-ecoboost-hybrid-10-155ps` | 2020–2024 | otomatik | Ayrı kimlik |
| 1.0 EcoBoost Hybrid 155 PS, sonraki satır | `ford-10-hibrit-ecoboost-155` | 2024–2026 | otomatik | 155’in ikinci kimliği |
| Gücü yazılmayan mHEV | `ford-10-mhev` | yalnız 2022 | otomatik | Donanım metninde 155 var; 125 sayılmadı |
| 1.0 EcoBoost 95 PS | `ford-10-ecoboost-95` | 2020–2024 | yazılmamış | Üçlü tablonun dışında |
| ST 1.5 200 ve ST Hybrid 160 | ayrı kimlikler | 2022–2026 | | 1.0 ailesi değil |

Üç 1.0 seçeneği aynı triger veya aynı arıza değildir. 125 standartta görülen bir konu 155 mHEV’e eklenmedi. 155’in sorunsuz olduğu da varsayılmadı. Ortak kronik kart açılmadı.

## 21 aday

### Ford

1. `astra-ft-puma-direksiyon-vuruntu` — Direksiyon bağlantısında vuruntu  
   Model: Puma 2021, motor adı `1.0 EcoBoost Hybrid`. Güç, kod ve şanzıman yok.  
   Kaynak: Ford Owners Club, tek Birleşik Krallık konusu. Okunmuş.  
   Kapsam: mafsal teşhisi ve tekrar yok. ST-Line donanımdır.  
   Dry-run: inceleme, nesil `Puma crossover` bağlanamadı.  
   Astra: tek vaka, model geneline yayınlanamaz.  
   **Karar: kanıt eksikliği.**  
   Düzeltme: güç (125 veya 155), motor kodu ve parça teşhisi gelmeden katalog kimliğine bağlama. 95 PS, ST 1.5 ve etiketsiz `ford-10-mhev` dışarıda kalır.

2. `astra-ft-fiesta-durashift` — Durashift aktüatör  
   Model: Fiesta 2002–2008, motor yok, şanzıman Durashift EST.  
   Kaynak: ECU Testing. Okunmuş. DPS6’dan ayrı.  
   Kapsam: aktüatör numarası ve Türkiye etiketi yok.  
   Dry-run: inceleme, nesil yazılmadı.  
   Astra: bütün motorlara eşleştirme.  
   **Karar: katalog eksikliği.**  
   Düzeltme: katalogda Durashift EST yazan nesil ve motor yok. Ad bulununca parça numarası hâlâ gerekir. DPS6 satırına alma.

3. `astra-ft-fiesta-dps6-vites-kaybi` — PowerShift vites kaybı  
   Model: Fiesta 2013, `1.6 benzinli`, DPS6.  
   Kaynak: Oto Club Türkiye konusu ve ABD 14M02. İkisi de okunmuş.  
   Kapsam: P0902 kök neden değildir. 14M02 ABD tesisidir, Türkiye garantisi değildir.  
   Katalog: Mk6 `1.6 105 PS` satırı 2012–2017 ve aynı satırda hem PowerShift hem düz otomatik var.  
   Dry-run: inceleme, nesil yazılmadı.  
   Astra: bütün PowerShift arızası yazılmasın.  
   **Karar: kanıt eksikliği.**  
   Düzeltme: kuru DPS6 ile ıslak kutu ve düz otomatik ayrılmadan, 14M02 Türkiye’ye taşınmadan kart açma. `1.0 EcoBoost` PowerShift satırı bu kaydın motoru değildir.

4. `astra-ft2-focus-gosterge` — Gösterge kesintisi  
   Model: Focus Mk1 1998–2004 ve Mk2 2004–2010. Motor yok.  
   Kaynak: ECU Testing. Okunmuş. HELLA A sütunu tesisatı ayrı neden olarak duruyor.  
   Kapsam: panel parçası yok.  
   Dry-run: aktarılabilir, motor kimliği boş. Elektrik kategorisi motorsuz kaydı Mk1 ve Mk2’nin bütün motorlarına açar.  
   Astra: parça ve Türkiye donanımı yok.  
   **Karar: kanıt eksikliği.**  
   Düzeltme: importer’ın aktarılabilir sonucunu kullanma. Panel revizyonu gelmeden yayınlama. Canlı marş ve akü kayıtlarıyla aynı arıza değil.

5. `astra-ft2-fiesta-sim22` — EAC Fail  
   Model: Fiesta 2002–2004, `1.25 / 1.4 / 1.6 Duratec-16V`. Nesil yok.  
   Kaynak: ecu.eu, SIM22 örneği `2S6A-12A650-SE`. Okunmuş. Atıf verilen Ford bültenleri ayrıca okunmamış.  
   Dry-run: inceleme, nesil yazılmadı.  
   Astra: Türkiye ECU numarası yok.  
   **Karar: katalog eksikliği.**  
   Düzeltme: 2002–2004 nesli ve bu üç Duratec adı katalogda güvenle yok. SIM22 parçası yazılmadan sonraki Fiesta nesillerine ve bütün gaz kelebeği arızalarına yayma.

6. `astra-ft-ford-mk60-c1288` — ABS basınç sensörü  
   Model: Focus Mk2 2004–2011, C-Max I 2005–2010. Motor yok.  
   Kaynak: ECU Testing, C1288 ve ATE MK60. Okunmuş.  
   Dry-run: inceleme, motor yazılmadı. Fren kategorisi motorsuz yayılmaz.  
   Astra: model yılı ABS ünitesinin tek tip olduğunu kanıtlamaz.  
   **Karar: katalog eksikliği.**  
   Düzeltme: katalogda MK60 / C1288 alanı yok. Bütün Mk2 motorlarına açma. Mk4 fren servosu geri çağırması (`20S05`) ile aynı kayıt değil.

7. `astra-ft2-mondeo-klima-fan` — Fan yüzünden klima  
   Model: Mondeo Mk4 2011–2014. Motor yok.  
   Kaynak: HELLA. Okunmuş.  
   Kapsam: 2014 kasa sınırıdır, arızanın bittiği yıl değildir. Fan modülü yok.  
   Dry-run: inceleme, motor yazılmadı.  
   Astra: her Mk4 klima arızasına uygulanmaz.  
   **Karar: kanıt eksikliği.**  
   Düzeltme: fan modülü ve Türkiye tesisatı ayrılmadan yayınlama.

8. `astra-ft-ford-dcm35` — DCM3.5 çalışmama  
   Model: Mondeo Mk4, Kuga Mk2, S-Max, Galaxy. Motor adı yalnız `TDCi`.  
   Kaynak: ECU Testing. Okunmuş.  
   Katalog: `TDCi` diye motor yok. 1.6 ve 2.0 TDCi ayrı güç ve PowerShift satırları var.  
   Dry-run: inceleme, katalogda motor yok.  
   Astra: TDCi motor kodu değildir; Kuga yıl/nesil çelişkisi duruyor.  
   **Karar: kanıt eksikliği.**  
   Düzeltme: Delphi DCM3.5’in hangi dizel kodunda olduğu yazılmadan `2.0 TDCi` satırlarına alias açma. Katalogda dizel motorlar var; eksik olan ad değil, kaynağın motor ayrımı.

9. `astra-ft-kuga-16-sigma-17s09` — 1.6 EcoBoost soğutma  
   Model: Kuga Mk2 2012–2014, motor adı `1.6 EcoBoost`.  
   Kaynak: Ford’un parlamento belgesi. Valencia üretimi 08.05.2012–21.11.2014. Okunmuş.  
   Katalog: Mk2’de `1.6 EcoBoost 180 PS` (2012–2015); 150 PS nesli belirsiz satırda (2013–2014).  
   Dry-run: inceleme, Focus devirdaim kaydıyla sahte örtüşme.  
   Astra: Türkiye VIN kampanyayı kanıtlamaz. 1.5 EcoBoost eklenmez.  
   **Karar: kanıt eksikliği.**  
   Düzeltme: sahte örtüşmeyi tekrar sanma. 150 PS’yi 180 PS’ye, 1.5 EcoBoost’u bu kayda ekleme. Üretim tarihi model yılına indirgenmeden yayınlama.

10. `astra-ft-ford-mk100-basinc` — MK100 fren basıncı  
    Model: Fiesta 2013–2017, B-Max 2014–2017, Tourneo Connect 2015–2018, Transit Connect 2015–2019. Motor yok.  
    Kaynak: ECU Testing. Okunmuş.  
    Dry-run: inceleme, nesil yazılmadı.  
    Astra: araç listesi bütün motorların kanıtı değil. Courier ve Custom bu kayıtta değil.  
    **Karar: katalog eksikliği.**  
    Düzeltme: ATE MK100 parçası katalogda yok. Dört modelin bütün motorlarına fren kartı açma.

11. `astra-ft-ranger-abs` — Ranger ABS  
    Model: Ranger T6 2012–2022. Motor yok.  
    Kaynak: ECU Testing. Okunmuş. Bosch parça numarası şart.  
    Dry-run: inceleme, motor yazılmadı.  
    Astra: geniş yıl ile T6 kesişimi kroniklik değildir.  
    **Karar: kanıt eksikliği.**  
    Düzeltme: parça numarası ve Türkiye çekiş/VIN eşleşmesi olmadan 2012–2022 aralığına yayma. Otomatik şanzıman kartı yapma.

### Toyota

12. `astra-ft-toyota-mmt-aktuator` — MMT  
    Model: Corolla E140/E150 2007–2009, Auris E150 2007–2012, Yaris XP90 2006–2011, Aygo I 2005–2012. Şanzıman MMT, motor yok.  
    Kaynak: ECU Testing. Okunmuş.  
    Katalog: E150 ve XP90 satırlarında MMT etiketi yok. Aygo model dosyası yok. Multidrive S ve e-CVT ayrı.  
    Dry-run: inceleme, motor yazılmadı.  
    Astra: Türkiye aktüatör numarası yok.  
    **Karar: katalog eksikliği.**  
    Düzeltme: MMT yazmayan manuel, Multidrive S ve hibrit e-CVT satırlarına alma. Aygo için katalog modeli açılmadan kart üretme.

13. `astra-ft-corolla-d4d-yag` — 1.4 D-4D yağ  
    Model: Corolla E150, `1.4 D-4D`, 2010–2012.  
    Kaynak: Toyota Club Türkiye. Okunmuş. Servis bülteninin aslı okunmamış.  
    Katalog: `toyota-14-d-4d` E150’de 2008–2014. Aynı motor Yaris, Auris ve E170’de de var; nesil filtresi onları dışarıda tutar. E150 satırı iddia edilen yıllardan geniş.  
    Dry-run: aktarılabilir, `toyota-14-d-4d`.  
    Astra: seri sınırı, ölçüm ve piston/turbo ayrımı yok.  
    **Karar: kanıt eksikliği.**  
    Düzeltme: aktarılabilir sonucu kullanma. 2008–2009 ve 2013–2014 satırı koşullu da olsa bu kartı göstermemeli. 1WW, 1AD ve GD’ye genişletme.

14. `astra-ft2-prius-egr-yapisma` — EGR yapışması  
    Model: Prius XW30 2010–2012, `1.8 VVT-i Hybrid`.  
    Kaynak: ABD ZF3 garanti belgesi. Okunmuş.  
    Katalog: `toyota-18-vvt-i-hybrid` XW30’da 2010–2015.  
    Dry-run: aktarılabilir.  
    Astra: Türkiye EGR/ECU/VIN yok. J0V ile birleştirilmez.  
    **Karar: kanıt eksikliği.**  
    Düzeltme: ABD garanti uzatmasını Türkiye kronik kartı yapma. 2013–2015 satırına taşıma.

15. `astra-ft2-avensis-valvematic` — Valvematic  
    Model: Avensis 2011, `1.6 Valvematic`.  
    Kaynak: Toyota Club Türkiye, tek araç, LPG bağlamı var. Okunmuş.  
    Katalog: nesil `t270`. Motor adı `1.6` ve `1.6 132 PS`; `1.6 Valvematic` yok.  
    Dry-run: inceleme, nesil `Avensis T27` bağlanamadı.  
    Astra: tek vaka kroniklik değildir.  
    **Karar: kanıt eksikliği.**  
    Düzeltme: nesil adını `t270` yapmak yayını açmaz. LPG teklemesini Valvematic sayma. Corolla’ya taşıma.

16. `astra-ft-avensis-yakit-kacagi` — Yakıt kaçağı  
    Model: Avensis T250 2003–2008, motor adı `2.0 benzinli`.  
    Kaynak: Toyota GB gönüllü geri çağırma, 2.0/2.4 benzin, Temmuz 2000–Eylül 2008. Okunmuş.  
    Katalog: T250 `2.0` (`toyota-20`) yalnız 2008–2010. Aynı motor kimliği T270’de 2009–2017. `2.0 benzinli` eşleşmedi.  
    Dry-run: inceleme, katalogda motor yok.  
    Astra: Türkiye VIN/hat parçası yok. Dizel ve T27 dışarıda.  
    **Karar: katalog eksikliği.**  
    Düzeltme: adı `2.0` yapmak T270’deki aynı motor kimliğini de seçer. 2003–2007 satırı katalogda yok. Türkiye VIN gelmeden ve T270 ayrılmadan yayınlama. 2.0 D-4D ayrı motor, bu kayda girmez.

17. `astra-ft-prius-j0v-guc-kaybi` — Koruma modu  
    Model: Prius XW30 2010–2014, `1.8 VVT-i Hybrid`.  
    Kaynak: ABD J0V / 18V684. Okunmuş.  
    Katalog: aynı XW30 satırı 2010–2015.  
    Dry-run: aktarılabilir.  
    Astra: Türkiye ECU/VIN yok. EGR kaydıyla birleştirilmez.  
    **Karar: kanıt eksikliği.**  
    Düzeltme: ABD yazılım kampanyasını Türkiye kronik arızası diye sunma. 2015 model yılını kapsama alma.

18. `astra-ft2-rav4-tavan-su` — Tavan rayı  
    Model: RAV4 XA50 2019–2021, `2.5 Hybrid`.  
    Kaynak: ABD 22TE05. Okunmuş.  
    Katalog: XA50 `toyota-25-hybrid` 2019–2025. Aynı motor XA40’ta 2016–2018 ve nesli belirsiz satırda da var. Tavan rayı alanı yok.  
    Dry-run: aktarılabilir, `toyota-25-hybrid`. Nesil XA50’ye oturduğu için XA40 bu kuru çalıştırmada bağlanmadı.  
    Astra: tesis, klips ve VIN yok. Model yılı üretim tarihi değildir.  
    **Karar: kanıt eksikliği.**  
    Düzeltme: aktarılabilir sonucu kullanma. Rayı olmayan araca ve 2022–2025 satırına yayma. XA40 hibritini ekleme.

19. `astra-ft-rav4-arka-kol` — Arka kol  
    Model: RAV4 XA30 2006–2011. Motor yok.  
    Kaynak: Toyota G0V açıklaması. Okunmuş.  
    Dry-run: inceleme, motor yazılmadı. `chassisWide` yok.  
    Astra: bütün çekişlere atanmaz. XA40/XA50 ayrı.  
    **Karar: kanıt eksikliği.**  
    Düzeltme: süspansiyon kartını bütün XA30 motorlarına açmak için `chassisWide` verme. Türkiye parça/VIN ve sıkma koşulu duruyor.

20. `astra-ft-yaris-eps-role` — EPS rölesi  
    Model: Yaris XP130 2011–2012. Motor yok.  
    Kaynak: Toyota GB, Kasım 2010–Mart 2012 üretimi. Okunmuş.  
    Katalog: XP130 satırları çoğunlukla 2012’de başlayıp 2017–2020’ye gider. 1.5 Hybrid de bu nesildedir. Üretim ayı yok.  
    Dry-run: aktarılabilir, motor kimliği boş. Direksiyon kategorisi motorsuz kaydı neslin motorlarına açar.  
    Astra: model yılı üretim sınırının yerine geçmez.  
    **Karar: kanıt eksikliği.**  
    Düzeltme: importer sonucunu kullanma. 2013–2020 ve XP210 1.5 Hybrid bu kartı görmemeli. Verso-S, Verso değildir.

21. `astra-ft-chr-hv-kablo` — Hibrit kablo  
    Model: C-HR I 2016–2018, `1.8 Hybrid`.  
    Kaynak: yabancı kampanya raporu. Okunmuş. Belge ABD benzinli C-HR’yi dışlar.  
    Katalog: `toyota-18-hybrid` 2016–2024. 1.2 turbo ayrı motor. İkinci nesil `1.8 Hybrid 140 PS` ayrı kimlik. Aynı motor adı Prius XW50’de de var; nesil filtresi bu kuru çalıştırmada onu bağlamadı.  
    Dry-run: aktarılabilir, `toyota-18-hybrid`.  
    Astra: üç modelin ortak tarihi C-HR VIN aralığı değildir.  
    **Karar: kanıt eksikliği.**  
    Düzeltme: aktarılabilir sonucu kullanma. 2019–2024, 1.2 turbo, 2.0 Hybrid ve ikinci nesle taşıma. Türkiye kablo kampanyası gösterilmeden yayınlama.

## Sonuç

21 adayın kaynağı okunmuş işaretli ve mekanizmayı anlatıyor. Hiçbiri hem Türkiye parçasını hem katalogdaki tek motor/şanzıman/donanım kesişimini karşılamıyor. İmporter’ın aktarılabilir saydığı yedi kayıt — Focus gösterge, Corolla yağ, Prius EGR, Prius J0V, RAV4 tavan, Yaris EPS, C-HR kablo — yanlış yıl veya motorsuz nesle yayılacağı için araştırmada kalmalı.

Katalog geliştirmesi gerektirenler: Durashift, SIM22, MK60, MK100, MMT ve Avensis `2.0 benzinli` adı. Bunlarda da parça veya VIN gelmeden yayın yok.
