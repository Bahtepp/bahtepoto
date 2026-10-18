# Renault ve Dacia araştırma teslimi

**İkinci tur güncellemesi:** Güncel teslim 7 JSON, 20 sorun ve 30 kaynak içerir. İlk 14 kayıt aynı kimliklerle güncellendi; 6 yeni kayıt `tur2-*.json` dosyalarındadır. Güncel kapsam, inceleme kararları ve doğrulama sonuçları için [TUR2-RAPOR.md](TUR2-RAPOR.md) dosyasını okuyun. Aşağıdaki sayısal özet birinci turun tarihçesidir.

Araştırma tarihi: 2026-10-18. Agent: `astra-renault`. Format: `bahtepoto-research-v1`.

Bu teslim yalnızca araştırmadır. Katalog, kaynak havuzu, mevcut sorun kayıtları ve site kodu değiştirilmedi. İçe aktarma veya yayın yapılmadı. JSON içindeki `uncertainties` koşulları çözülmeden otomatik geniş kapsamlı eşleştirme yapılmamalı.

## Sayısal sonuç

- 5 bağımsız JSON, 14 yeni sorun araştırma kaydı, 17 farklı kaynak URL'si.
- JSON kapsamında 11 model: Renault Clio, Megane, Scenic, Modus, Symbol, Kangoo, Laguna, Fluence; Dacia Duster, Sandero, Lodgy.
- 22 araç kapsamı nesnesi var. Bunlar 22 farklı motor veya nesil demek değildir; aynı model farklı sorunlarda tekrar yer alabilir.
- Yaygınlık: `high` 0, `medium` 3, `low` 0, `unknown` 11. Oran hesaplanmadı. Medium kayıtlar Fluence EDC, Sandero Easy-R ve Lodgy far kumandasıdır.
- 17 kaynağın ilgili yazı/bülten metni okundu. 8 teknik yayın, 3 uzman servis yazısı, 6 kullanıcı kaynağı. Kullanıcı topluluğu üretici alan adında olsa da resmî bülten sayılmadı.
- Mevcut üç Renault/Dacia termostat ve yağ tüketimi kaydının yeni kopyası: 0. Yeni kayıtlar arasında yinelenen issue ID: 0.

## Dosyalar ve kapsam

- `renault-clio.json`: 3 kayıt. Atmosferik 1.2 16V gaz kelebeği; Clio III / Megane II / Scenic II / Modus için belirli Bosch ABS modülleri; Clio II / Symbol / Kangoo için erken K9K yardımcı kayış gergisi. Ortak sorunlar tek kayıtta çoklu araçla tutuldu.
- `renault-megane.json`: 2 kayıt. Megane II ve Scenic II F9Q 1.9 dCi EGR; klimalı Megane I 1996–2002 iç hava klapesi. Scenic EGR için ikinci dosyada tekrar kart açılmadı.
- `renault-diger-modeller.json`: 4 kayıt. Laguna II B74/BG0 klima basınç bağlantısı; Kangoo I 2003–2006 sol sürgülü kapı kilidi; Scenic I 1996–2003 / II 2003–2009 gösterge paneli; 2012 ve 2016 Fluence 1.5 dCi EDC kullanıcı bildirimleri.
- `dacia-duster.json`: 2 kayıt. Duster II HJD 2017–2021 kontak kilidi; kaynakta 2010–2018 verilen, nesli belirsiz yan sinyal kablosu.
- `dacia-diger-modeller.json`: 3 kayıt. Sandero kontak kilidi; 2019–2020 Sandero 0.9 TCe Easy-R kalkış titremesi; Lodgy far/sinyal kumandası kesintileri.

Motor kapsamı açık kaynaklardan alınan ad/kodlarla sınırlıdır: 1.2 16V, 1.5 dCi (dar kapsamda K9K 700/702/710), 1.9 dCi F9Q, 0.9 TCe. Motor bağımsız elektrik/klima/gövde kayıtlarına tahmini motor listesi eklenmedi. EDC ve Easy-R ayrı şanzıman türleriyle kaydedildi.

## Eşleştirmeden önce çözülmesi gerekenler

1. Gates gergi bülteni yalnızca **Haziran 2001–Haziran 2002, klimasız** araçlar ve belirtilen motor/şasi tipleri içindir. Şemadaki yıl aralığı bu iki koşulu tek başına ifade etmez. Bütün 1.5 dCi araçlarına yayılmamalı.
2. ABS ve gaz kelebeği kayıtları parça numarasına bağlıdır. Sadece model adı/yıl eşleşmesi yeterli değil. Clio 1.2 16V kaydı 1.2 TCe değildir.
3. Duster sinyal kablosu ile Sandero kontak kaydında kaynak nesli açık vermiyor. Geçiş yılları tahminle kasaya bağlanmadı. Sandero için bültendeki VIN aralığı ayrıca kontrol edilmeli.
4. Fluence raporlarındaki beyin teşhisi kullanıcı aktarımıdır; DC4 alt tipi ve parça kimliği doğrulanmış değildir. 2012 ile 2016 arasındaki tüm yıllar otomatik kapsam sayılmadı.
5. Sandero Easy-R titremesinin volan/kavrama kök nedeni teknik raporla kanıtlanmadı. CVT ve EDC kapsam dışıdır. Bir şikâyette çözüldü etiketi olsa da sonraki tekrarlama yorumu korundu.
6. Lodgy kaynakları Fransa kullanıcı topluluğundandır; üretim yılı, motor ve Türkiye parça eşleşmesi açık değil. Bütün Lodgy araçlarına otomatik bağlanmamalı.
7. Yabancı teknik kaynaklar Türkiye geri çağırması veya Türkiye'de ölçülmüş arıza sıklığı gibi sunulmadı. Aynı parça ve üretim kapsamı kontrol edilmeli. `unknown`, nadir anlamına gelmez.
8. Duster ve Sandero kontak belirtileri benzerdir fakat farklı model/VIN kapsamlı bültenlere dayanır. Katalog eşleştirmesinde ortak kök parça doğrulanırsa aynı temel sorunun model kapsamları olarak değerlendirilebilir; mevcut kayıtlarla tekrar değiller.

## Ön araştırmada kalıp sorun JSON'una alınmayanlar

Bu liste araştırılmayan modellerin sorunsuz olduğu anlamına gelmez. Listedeki bütün kasa/motorlar dış kaynakla tek tek doğrulanmış değildir.

- **Logan:** [HELLA alternatör kasnağı notu](https://www.hella.com/techworld/es/bi/dacia-logan-se-enciende-el-testigo-luminoso-de-control-de-carga/) okundu. 2006–2011, K9K/K7J/K4M/K7M kapsamındaki şarj uyarısı için teşhis bilgisi var; erken arıza ve normal aşınma ayrımı yok. Kronik sorun kartına dönüştürülmedi. Bu URL, 17 JSON kaynağına dahil değildir.
- **Dokker:** [2021 araç AdBlue şikâyeti](https://www.sikayetvar.com/dacia/dacia-adblue-arizasi-nedeniyle) aday olarak bulundu; motor alt tipi ve teşhis kapsamı tamamlanmadı. Tek anlatımdan tüm Blue dCi motorlarına kayıt oluşturulmadı.
- **Jogger / Spring:** geri çağırma ve kullanıcı şikâyeti aramaları yapıldı; bu teslimde Türkiye araç kapsamı netleştirilmiş yeni kayıt yok.
- **Captur / Kadjar:** R9M/K9K aramaları bütün modelleri veya yılları etkileyen yeni bir sorunu doğrulamadı. Genel motor rehberlerinden otomatik kart üretilmedi.
- **Austral / Arkana / Clio V E-Tech:** şanzıman kampanya adayları bulundu. [Renault Japonya SC06 duyurusu](https://www.renault.jp/after_service/recall_data/260528.html) Japonya tipleri/üretim aralıkları içindir; Türkiye araçlarına aktarılmadı. Bağlantı adaydır, JSON'da reviewed kaynak değildir.
- **Talisman:** R-Link aramalarında ücret/güncelleme anlaşmazlığı bulundu; tek başına teknik arıza kanıtı kabul edilmedi.
- **Megane IV iç trim:** kapı tutamağı kaplama soyulması aramalarında aday şikâyetler bulundu, tam birincil metin/kapsam doğrulaması tamamlanmadı. Yeni kart yok.
- **Clio I, Clio IV/V'nin diğer sistemleri, Megane III/IV'ün diğer motorları:** bu teslimde yeni kapsamlı doğrulama yapılmadı. Daha önce kayıtlı Clio IV 1.2 TCe yağ tüketimi tekrar edilmedi.
- **1.0 TCe, 1.4 TCe, 2.0 dCi, R9M ve E-Tech aileleri:** arama/ön eleme tam bir sorun-kasa eşleştirmesi değildir. Motor ailesi ortak diye mevcut sorunlar taşınmadı. 1.3 TCe için mevcut termostat kayıtları tekrar açılmadı.

Nissan/Mercedes için JSON oluşturulmadı. Ortak motor kullanımı tek başına aynı arıza kapsamını kanıtlamadığı için yeni çapraz marka ataması önerilmedi.

## Doğrulama

- JSON Schema Draft 2020-12 ve tarih/URI FormatChecker: 5/5 geçti.
- Projenin `researchBundleSchema` Zod doğrulaması: 5/5 geçti.
- Kaynak ID çözümlemesi, kullanılmayan kaynaklar, dosyalar arası issue ID tekilliği, marka/model üst liste uyumu, tarih aralığı sırası, başlık/özet uzunlukları ve `example:true` yasağı kontrol edildi.
- Katalog kimliği tahmin edilmedi. Canlı kayıt dosyaları ve kaynak havuzu değiştirilmedi. İçe aktarma, commit veya push yapılmadı.
- Uygulama kodu değişmediğinden tüm site test/build işlemleri çalıştırılmadı; bu teslimin doğrulaması araştırma şeması ve kayıt bütünlüğüdür.
