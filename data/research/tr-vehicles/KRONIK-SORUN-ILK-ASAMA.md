# Kronik sorun — ilk aşama

Tarih: 2026-10-18. Dal: `katalog-turkiye`. Yayın ve GitHub push yapılmadı.

## Ne değişti

Mevcut kronik sorun şeması duruyor. Üzerine kullanıcının gördüğü `frequencyRating` alanı eklendi: Yüksek, Orta, Düşük, Belirsiz. Bu alan araştırmacının nitel yargısıdır; yüzde değildir. `severity` sonucun ağırlığı, `prevalence` kanıt düzeyidir. Eski Ford kayıtlarında alan yoktur; kartta Belirsiz görünür. Geri çağırmada yaygınlık etiketi yoktur.

Kart artık başlık, yaygınlık, kısa kategori ve bir-iki cümledir. Kaynak listesi, araştırma notu ve doğrulama matrisi ekranda yok. Bölüm başlığı “Kronik ve bilinen sorunlar”, altında gerekirse “Bildirilmiş olası sorunlar”, daha altta “Resmî geri çağırmalar”. Kısa uyarı metni bölümün sonundadır.

Kısa girdiyi mevcut kayda çeviren yardımcı: `src/lib/issues/brief.ts`. Doğrulama duruyor. Yüksek yaygınlık, tekil veya belirsiz kanıtla yazılamaz. Yalnızca kullanıcı bildirimi `researching` kalır ve resmi kusur diye sunulmaz.

## Araştırılan marka ve modeller

İlk grup: Renault Clio, Renault Megane, Fiat Egea, Ford Focus, Volkswagen Golf, Volkswagen Passat, BMW 3 Serisi, Nissan Qashqai, Honda Civic, Opel Astra, Hyundai i20, Toyota Corolla.

Aynı 1.3 TCe / HR13 gövdesi için Dacia Duster de bağlandı. Mercedes M282 aynı motor ailesinde anılıyor; okunan atölye anlatımı kaçağı Renault ve Dacia için kuruyor, Mercedes gövdesinin aynı parça olduğunu söylemiyor. Mercedes kaydı açılmadı.

## Eklenen kayıtlar

8 kayıt, 6 ayrı konu:

| Konu | Kapsam | Yaygınlık |
| --- | --- | --- |
| Termostat gövdesinde su kaçağı | Renault Clio ve Megane 1.3 TCe; Dacia Duster II 1.3 TCe | Yüksek |
| Aynı gövde, Nissan 1.3 DIG-T | Qashqai. Arıza hacmi esas olarak Renault/Dacia için söylendiği için | Orta |
| 1.2 TCe yağ tüketimi | Clio IV, 2012–2016 model yılı penceresi. 1.0 TCe ve 1.3 TCe değil | Yüksek |
| N47 triger zinciri | 3 Serisi E90 320d/318d ve 184 PS F30. 190 PS B47 ve benzinliler değil | Yüksek |
| 1.2 DIG-T zincir sesi | Qashqai J11. 1.3 DIG-T değil | Yüksek |
| DSG kavrama sarsıntısı | Golf VI/VII/8 ve Passat B7/B8 üzerinde katalogda DSG yazan 1.0/1.2/1.4 TSI ve 1.6 TDI. 2.0 ve manuel değil | Yüksek |
| İç kapı tutamacı boyası | Yalnızca i20 PB. Sonraki nesiller değil | Düşük |

Kayıt dağılımı: Yüksek 6, Orta 1, Düşük 1, Belirsiz 0.

Motora veya soğutmaya bağlı: 6 kayıt. Şanzımana bağlı: 1. Kasa / model geneli: 1 (i20 PB).

Bağlanan kasalar: Clio IV, Megane IV (1.3 TCe), Duster II, Qashqai J11, Qashqai J12 (yalnızca 1.3 DIG-T termostat), BMW E90, BMW F30, Golf VI, Golf VII, Golf 8, Passat B7, Passat B8, i20 PB. Katalogda nesli ayrılmamış 1.3 TCe Clio ve 184 PS 320d satırları da aynı motor kaydına düşer. Clio II’nin bu turda ayrı kasa sorunu yok; Clio V 1.0 TCe bu kayıtlardan hiçbirini göstermiyor.

## Birleştirme

Termostat kaçağı, su eksiltme ve hararet aynı gövde sorununda tek kart. Marka filtresi tek kaydın Renault ve Nissan’a birlikte bağlanmasına izin vermediği için Renault, Dacia ve Nissan ayrı kayıt; metin aynı parçayı anlatıyor, üçüncü taraf siteden kopya değil.

1.2 TCe yağ tüketiminde Que Choisir ve onu aktaran Auto-Moto `basedOn` ile tek araştırma sayıldı. İkinci bağımsız kanıt gibi kullanılmadı. DSG için iki alım rehberi de aynı ayrımı tekrarladığı için aynı gruba alındı.

1.5 dCi, genel DPF tıkanması ve sıradan bakım aşınması eklenmedi.

## Kaynaklar

11 yeni iç kaynak. Türler: 1 uzman atölye videosu, 7 teknik yayın (bir kısmı aynı haberin aktarımı), 2 kullanıcı forumu (Reddit ve Hyundai Club TR). Okuma tarihi 2026-10-18. Kullanıcıya kaynakça gösterilmiyor.

Kronikmotor taranmadı ve metinleri kopyalanmadı. Otoplans ve benzeri derleme listeleri kaynak yapılmadı. Yüzde uydurulmadı. Tamir fiyatı yazılmadı.

Sınır: bazı sayfalar arama sonucunda gelen metin ve video konuşma dökümüyle okundu; her kaynağın tamamı ayrıca indirilmedi. Hibrit veya mild hybrid sürümlerde termostat kaçağının azaldığına dair okunmuş veri yok, bu iddia yazılmadı.

## Boş bırakılanlar

Yeterli, araca bağlanabilir bir kaynak okunmadığı için yeni kayıt açılmayanlar:

- Fiat Egea. Okunan DPF yazısı genel rejenerasyon anlatımıydı.
- Honda Civic. Modele özgü bir kusur metni okunmadı.
- Opel Astra. M32 şanzıman iddiası bu turda doğrulanmış bir sayfaya bağlanamadı.
- Toyota Corolla. Modele özgü bir kusur metni okunmadı.
- Ford Focus. Mevcut geri çağırma ve ADAC kayıtları duruyor. Yeni kısa kart eklenmedi; PowerShift için bu turda yeni bir sayfa okunmadı. Eski kartların özetleri kısaltılmadı, ekranda kaynak listesi kalkmış halde duruyor. Yaygınlık alanı boş olduğu için Belirsiz görünüyor.
- Mercedes 1.3. Aynı gövde kaçağı doğrulanmadı.

## Togg

T10X 160 kW ve 320 kW motorlarına `fuel: electric` yazıldı. Güç alanları 160 kW ve 320 kW olarak kaldı. 52,4 ve 89,6 kWh batarya kapasitesi güce yazılmadı. Motor kimlikleri ve TSB bağları değişmedi. Araç sayfasında yakıt “Elektrik”, güç “160 kW” görünüyor.

Aynı biçimde yakıtı boş kW kayıtları (BYD, Volvo, BMW, Tesla, Lucid, MG, Audi, Fiat, Reeder, Neta) bu turda değiştirilmedi. Özellikle Tesla’daki 75 kW benzeri satırlar batarya kWh ile karışmış olabilir; kaynak okumadan elektrikli işaretlenmedi.

## Testler

- `npm test`: 264 geçti, 0 kaldı (önceki 253’e 11 yeni test eklendi).
- `npm run check`: 0 hata. Önceden duran `scripts/import/generations/build.ts:140` uyarısı duruyor.
- `npm run build`: 5239 sayfa, iki kez tamamlandı.
- `npm run import:check`: geçti. Golf Wikidata yer tutucusu ve nesil yılı örtüşmesi uyarıları eskisi gibi.
- `npm run catalog:audit`: kesin 0, yüksek 0, inceleme 42 (Türkiye kaydı olmayan Focus varyantları), istisna 3.
- `npm audit`: 0 açık.

Yeni testler: 1.3 TCe 1.0 TCe ve 1.5 dCi’ye geçmiyor; Clio IV yağ kaydı Clio V’te yok; i20 PB kapı tutamacı GB ve BC3’te yok; DSG kaydı manuel ve 2.0 Golf R’de yok; Qashqai zinciri 1.3 DIG-T’de yok; N47 190 PS ve 320i’de yok; düşük yaygınlık ciddiyet alanını düşürmüyor; kullanıcı bildirimi resmi kusur değil; demo canlı veriye karışmıyor.

Önizlemede bakılan sayfalar: Clio 1.3 TCe kartı, Clio V 1.0 TCe boş, Golf VII 1.4 TSI DSG kartı, Golf R boş, i20 PB olası sorun, i20 GB boş, Togg T10X yakıt Elektrik, Focus Mk2 eski kartlar ve ayrı geri çağırma başlığı.

## Commitler

Önceki katalog commit’i duruyor: `1bb8217`.

- `c0a1c05` Kronik sorun kartını kısa tutar ve yaygınlık etiketini ayırır.
- `8be647c` İlk kronik sorun kayıtlarını doğru motor ve kasalara bağlar.

Bu rapor dosyası ayrı bir yerel commit’tedir. Push yok.

## Sonraki kontrol

Kartların dili ve araştırma sınırı yayımlamadan önce gözden geçirilecek. Bu tur push edilmedi.
