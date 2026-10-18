# Gemini Stellantis entegrasyonu

Tarih: 18 Ekim 2026. Dal: `katalog-turkiye`. Canlı yayın ve `main` birleştirmesi yapılmadı.

İlk dry-run 15 kayıt gördü: 1 aktarılabilir, 14 inceleme, 0 geçersiz. Kaynaklar açılınca o tek adayın DonanımHaber adresi de 404 çıktı. Düzeltmeden sonra 5 kayıt aktarıldı, 10 kayıt incelemede kaldı. İkinci dry-run 5 tekrarı ve 0 yeni kaydı gösterdi.

## Kaynak kontrolü

Şu DonanımHaber konu numaraları açılmadı (404): `123456789`, `135792468`, `140000000`, `120000000` (iki ayrı kayıtta), `125000000`, `145000000`. Bunlar ilgili forum konuları değil.

Ayrıca 404: Şikayetvar Linea torpido adresi, Şikayetvar Citroën rüzgar sesi, `forum.peugeotturkey.com` torsiyon adresi.

Okunamayanlar: `fiatlinea.org` güvenlik duvarı, `opelim.net` konu `10000` güvenlik duvarı.

Açılan ama iddiayı taşımayan: Şikayetvar C4 Picasso sayfası. Görünen şikayetler cam, ekran, fitil ve partikül filtresi. Körük yok.

Şikayetvar Peugeot triger listesi açıldı ama 1.2 kayış ile 1.5 zincir aynı sayfada. PureTech kaydında kullanılmadı.

## Importer

`suspension` ve `hvac` için motor, ancak `chassisWide: true`, tek nesil ve şanzıman koşulu yoksa boş kalabilir. `body`, `interior`, `electrical` ve `steering` önceki kuralda duruyor. Motor kategorisi bu işaretle açılmaz. Okunmamış kaynak yine aktarılmaz. Bu turda hiçbir Gemini kaydına `chassisWide` verilmedi: Corsa D klapesi elektronik klimaya, 308 traversi belirli viraj demirine bağlı.

Alias eklenmedi.

## Aktarılanlar

| Kayıt | Kaynak | Eşleşme | Yaygınlık | Engel |
|---|---|---|---|---|
| Linea yolcu hava yastığı kapağı | Şikayetvar Linea airbag sayfası okundu | Linea nesli, motor yok | high → medium. Oran yok | Punto okunmadı, eklenmedi |
| Egea direksiyon tıkırtısı | Şikayetvar Egea ses sayfası okundu | Egea (356), motor yok | medium kaldı | Her ses aynı parça değil; metin belirti olarak yazıldı |
| Astra J 1.4 PCV | Still Running Strong okundu. 140 PS = A14NET/B14NET | Yalnızca Astra J `1.4 140 PS` | high → medium. Oran yok | Insignia sayfası okunamadı, alias yok. Astra K aynı motor kimliğinde olsa da nesli ayrı |
| Astra H CIM kornası | Field Remedy 2262 okundu | Astra H, motor yok | high → medium. Şasi aralığı var, oran yok | Corsa D değil. Direksiyon tuşları bu notta yok. Zafira B katalogda ayrılmıyor |
| 1.2 PureTech kayışı | Stellantis tazminat sayfası okundu | 308 II: 82, 110 ve 130 PS. 2008 II: 100 ve 155 PS, model yılı 2020–2022 | high → medium. Üretici kabul ediyor, oran yok | Avrupa tazminatı Türkiye garantisi diye yazılmadı |

## İncelemede kalanlar

| Kayıt | Kaynak | Eşleşme | Yaygınlık | Engel |
|---|---|---|---|---|
| Dualogic | 404 | Katalogda Dualogic satırları var; bağlanmadı | medium, kanıtsız | Arıza metni okunmadı. Manuel araçlara yazılmadı |
| Egea 1.4 Fire yağ | 404 | Ad `1.4 FIRE 95 PS` olarak daraltıldı | medium, kanıtsız | Kılavuzun normal saydığı tüketim ile arıza ayrılmadı. Yakıtsız 1.4 FIRE satırı dışarıda |
| 1.3 MultiJet zincir | Forum metni okunamadı | Fiorino çıkarıldı. 90 PS adayı yazıldı ama aktarılmadı | medium, kanıtsız | Erken arıza ile yüksek kilometre aşınması ayrılmadı |
| Astra K 1.6 CDTI zincir | Şikayetvar'da Astra 1.6 CDTI sesi var | Katalogda bu ad yok | medium kaldı | Nesilsiz 1.6 dizel satırları tahmini taşınmadı. Insignia B 136 PS adında CDTI yok |
| Corsa D klape | 404 | Field Remedy 2627 yalnızca 2007–2008 elektronik klima | medium, kanıtsız | Donanım ayrılamadığı için neslin tamamına açılmadı |
| BlueHDi AdBlue | 404 | 1.5 ve 1.6 ayrılmadı | high kanıtsız, değiştirilmedi | Bütün dizellere açılmadı |
| 308 II arka travers | L'Argus okundu | Motor değil. 2015 sonu ve 2016 ortasına kadar, belirli viraj demiri | medium | Katalog donanımı ayıramıyor. `chassisWide` verilmedi |
| C4 Picasso ETG/MCP | 404 | C4 Picasso nesli katalogda tek ve belirsiz. C-Elysée'de ETG adı yok | high kanıtsız | ETG5, ETG6 ve MCP birleştirilmedi. Nesiller motorlara göre dağıtılmadı |
| C4 Picasso körük | Sayfa açıldı, körük yok | Nesil eşleşmiyor. Exclusive donanımı yok | high kanıtsız | Neredeyse kaçınılmaz iddiası kullanılmadı |
| C-Elysée rüzgar | 404 | Katalog adı `C-ELYSEE (2012)` | medium, kanıtsız | Yalıtım beklentisi fitil arızası diye yazılmadı |

Bekleyen Astra ve GPT kayıtları bu turda aktarılmadı.
