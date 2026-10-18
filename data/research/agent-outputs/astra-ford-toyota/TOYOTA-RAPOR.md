# Toyota araştırma teslimatı — 18 Ekim 2026

Araştırmacı: `astra-ford-toyota`. Bu paket araştırma adaylarıdır; katalog veya canlı sorun kayıtlarına aktarılmadı. Türkiye parça/VIN koşulları kapanmadan otomatik yayımlanmamalı.

## Sayılar

- 4 JSON, 7 benzersiz sorun adayı, 7 farklı kaynak URL'si.
- 8 model kayıt kapsamındadır: Corolla, Auris, Yaris, Aygo, C-HR, RAV4, Avensis, Prius.
- Yaygınlık: 7 `unknown`; high/medium/low verilmedi. Geri çağırılan araç sayısı arıza sıklığı sayılmadı.
- Kaynakların tamamında ilgili metin açılıp okundu. Arama sonucu görülen diğer bağlantılar doğrulanmış kaynak listesine alınmadı.

## Dosya ve teknik kapsam

- `toyota-corolla-auris.json`: MMT aktüatör/vites seçimi (Corolla E140/E150 2007–2009, Auris E150 2007–2012, Yaris XP90 2006–2011, Aygo I 2005–2012). Tek sorun kaydı içinde ortak mekanizma tutuldu; farklı dosyalara kopyalanmadı. Parça ve MMT koşulu zorunlu. İkinci aday Corolla 1.4 D-4D 2010–2012 yağ eksiltmedir; Türkiye kullanıcılarının onarım deneyimleri var, kesin üretim seri sınırı açık.
- `toyota-yaris-chr.json`: Yaris XP130 2011–2012 EPS rölesi; C-HR ilk nesil 1.8 Hybrid 2016–2018 PCU kablo aşınması. Yıl alanı kampanyadaki bütün VIN'leri temsil etmez. Yaris belgesindeki Kasım 2010 başlangıcı nesil başlangıcının yerine geçirilmedi.
- `toyota-rav4.json`: XA30 2006–2011 arka alt süspansiyon kolu, ABD G0V koşullu adayı. Türkiye donanım eşitliği bekliyor; chassisWide kullanılmadı.
- `toyota-diger.json`: Avensis T250 2.0 benzinli 2003–2008 yakıt kaçağı; Prius XW30 2010–2014 hibrit koruma modu. Avensis 2.0 dizel ve Prius dışındaki hibritlere yayılmadı.

Motor adları yerel katalogla karşılaştırıldı; bu kontrol parça eşitliğini kanıtlamaz. Aygo model dosyası mevcut klasörde bulunamadı, yeni katalog kaydı üretilmedi. Avensis T250 yerel model yılları nesil/kampanya sınırını aşıyor; araştırma kapsamında katalog düzeltilmedi ve VIN koşulu korundu.

## Tekrar ve yanlış aktarım önleme

MMT, kayışlı CVT ve hibrit e-CVT ayrı mekanizmalardır. Hibrit bataryanın olağan yaşlanması sorun kaydı yapılmadı. Kullanıcı anlatısında atıf yapılan servis bülteninin aslı okunmadığı için üretici bülteni olarak sunulmadı. Auris forum profilinden motor/yıl çıkarılmadı. Verso-S ile Verso, Corolla Verso ile Verso birleştirilmedi. Prius J0V, önceki E0E/F0R kampanyalarının basit kopyası olarak yazılmadı.

## İncelenip kayıt üretilmeyenler ve açık işler

- **Hilux / Land Cruiser Prado:** [Toyota Australia DPF bildirimi](https://www.toyota.com.au/policies/dpf-class-action/dpf-class-action-notice) okundu. 1GD-FTV/2GD-FTV ve Avustralya kapsamı tanımlıdır; 1 Ekim 2015–23 Nisan 2020 satın alma tarihleri üretim yılına çevrilmedi. Türkiye DPF donanımı ve yazılım eşitliği çözülmediğinden JSON yok. Bu Prado bulgusu bütün Land Cruiser motorlarına taşınamaz.
- **Corolla Cross:** [Toyota 23TA16 belgesi](https://static.nhtsa.gov/odi/rcl/2023/RCMN-23V864-1182.pdf) okundu. ABD 2022–2023 araçlarında gösterge panelindeki hava yastığı açılma bölgesi ve önceki kontrol yöntemi konu edilir. Türkiye hibritinin panel/üretim tesisi eşitliği doğrulanmadı; kayıt yok.
- **Verso:** MMT kaynağındaki Corolla Verso ve direksiyon kampanyasındaki Verso-S, bu model için yeterli kanıt sayılmadı. Ayrı motor/yıl doğrulaması bekliyor.
- **Camry:** OCS hava yastığı sensörü için üretici arama sonuçları bulundu; ilgili model kapsamı ayrıntılı okunup Türkiye parçalarıyla karşılaştırılmadı. Yalnız ön tarama, JSON yok.
- **Valvematic/VVT-i, D-4D enjektör/EGR, klasik CVT, 12V akü, hibrit soğutma, HVAC, multimedya, gövde ve trim:** bütün alt sürümler tamamlanmış değildir. Bir sonraki araştırma yerel Valvematic arıza kodları ve Corolla/Auris D-4D bülteninin aslıyla başlamalı; ardından Verso, Camry, Hilux/Prado ve Corolla Cross parça kapsamı kontrol edilmeli.

Bu teslimat bütün Ford/Toyota nesillerinin veya bütün kronik sorunlarının tamamlandığı anlamına gelmez. Kesin arıza sıklığı ve Türkiye geri çağırma uygunluğu ileri sürülmemiştir.

## Doğrulama

4 Toyota dosyası hem JSON Schema hem projenin Zod şemasından geçti. Ford ile toplam 9/9 dosya, 15 benzersiz sorun kimliği ve 16 kaynak URL'si kontrol edildi. Özet uzunlukları, kaynak referansları, marka/model üyeliği ve yıl sıraları geçerli. Kontroller canlı entegrasyon onayı değildir.
