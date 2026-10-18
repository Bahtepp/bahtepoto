# Kronik sorun: çoklu ajan sistemi

Tarih: 2026-10-18. Dal: `katalog-turkiye`. Canlı siteye ve GitHub'a gönderilmedi.

## Teknik sistem

Araştırma biçimi `bahtepoto-research-v1`. Araştırmacı katalog kimliği yazmaz. Marka, model, nesil ve motor adını yazar.

- Şema: `data/research/agent-outputs/schema/bahtepoto-research-v1.schema.json`
- Denetleyici: `src/lib/issues/research-schema.ts`
- Örnek: `data/research/agent-outputs/examples/ornek-arastirma.json` (`example: true`, aktarılmaz)
- Araştırmacı notu: `data/research/agent-outputs/ARASTIRMACI.md`
- Standart: `docs/KRONIK-ARASTIRMA-STANDARDI.md`

Klasörler: `astra-renault`, `cursor-vag`, `claude-hyundai`, `gpt-german`. Astra, Claude ve ChatGPT dosyası gelmedi. Bu klasörlerde yalnızca bekleyen not var.

İçe aktarma:

```text
npm run issues:import -- --input data/research/agent-outputs/cursor-vag/
npm run issues:import -- --input data/research/agent-outputs/cursor-vag/ --apply
```

İlki dry-run'dır. `--apply` yalnızca eşleşmesi doğrulanan kayıtları yazar. Bilinmeyen marka veya model uydurulmaz. Nesli yazılmayan motor bütün kasalara yayılmaz. Katalogda şanzımanı doğrulanamayan motor, şanzıman kaydına alınmaz. Aynı araştırma kimliği ikinci kez yeni kart açmaz. Aynı marka, kategori, kasa ve motordaki eski kayıt ezilmez.

## Volkswagen Grubu

Üç markada kayıt var: Volkswagen, Škoda, SEAT. CUPRA kataloğu tarandı; Formentor, Leon ve Ateca satırları 1.5, 2.0 veya hibrit. DQ200 ile DQ381 bu satırlarda ayrılmadığı için CUPRA kaydı açılmadı. Born elektriklidir.

Kayıt bağlanan modeller: Golf, Passat, Tiguan, Polo, Octavia, Fabia, Superb, Leon, Ibiza, Toledo, Arona. 20 kasa, 31 motor kimliği.

Yeni benzersiz sorun: 8.

| Yaygınlık | Kayıt |
|---|---|
| Yüksek | 5 (üç zincir, iki DSG) |
| Orta | 3 (devirdaim gövdesi) |
| Düşük | 0 |
| Belirsiz | 0 |

Motor 3, soğutma 3, şanzıman 2. Yeni kaynak: 6. Hepsi okundu.

Konular:

- Erken 1.4 TSI triger zinciri. Golf VI, Passat B6, Passat B7, Tiguan'da 122 ve 160 PS, Octavia Mk2, Fabia 180 PS, Leon 2. nesil, Ibiza 180 PS, Toledo 122 PS. Golf VII ve sonrası yok.
- 1.4 TSI devirdaim gövdesi. Golf VII, Passat B8, Polo V ACT, Tiguan 125 ve 150 PS, Octavia Mk3, Superb 3, Leon 3, Toledo 125 PS. GTE ve eHybrid yok.
- Kuru 7 ileri DSG. Škoda ve SEAT'ta katalogda DSG yazan küçük motorlar. Mevcut Volkswagen Golf ve Passat DSG kaydı duruyor; ikinci kart açılmadı.

Aynı metin marka başına ayrı kayıttır. Katalog bir kaydı başka markaya göstermez.

Eklenmeyenler: Jetta, T-Roc, Taigo, Touran, Caddy, Scala, Kamiq, Karoq, Kodiaq, Rapid, Yeti, Ateca ve bütün CUPRA. Polo V'nin 1.2 TSI satırı eski ve yeni motoru aynı kasada tuttuğu için zincire bağlanmadı. Adı yalnızca "1.6 TDI" olan satır, motor adıyla motor ailesi çakıştığı için DSG kaydına alınmadı. 1.5 TSI ve 180 PS Fabia DSG'si alınmadı. Tiguan'ın 125/150 PS motoru zincire, 122/160 PS motoru devirdaim kaydına konmadı.

## Veri entegrasyonu

Cursor dosyası dry-run'da 8 aktarım, 0 inceleme, 0 geçersiz verdi. `--apply` 8 kayıt ve 6 kaynak yazdı. İkinci çalıştırma 8 kaydın hepsini "zaten vardı" dedi.

Eski kayıtlar duruyor: Renault 1.3 TCe, Renault 1.2 TCe, Nissan 1.3 DIG-T, Nissan 1.2 DIG-T, BMW N47, Volkswagen DQ200, Hyundai i20 PB, Ford Focus. Astra, Claude ve ChatGPT teslim etmedi.

## Git ve kalite

- `npm test`: 276 geçti
- `npm run check`: 0 hata, önceden duran 1 uyarı (`scripts/import/generations/build.ts`)
- `npm run build`: 5239 sayfa
- `npm run import:check`: geçti
- `npm run catalog:audit`: kesin 0, yüksek 0, inceleme 42, istisna 3. TSB satırı 15463. Türkiye sayıları değişmedi.
- `npm audit`: 0 açık

Katalog motor kimlikleri ve TSB satırları değiştirilmedi.

Yerel commit `fca4d2d` standardı ve içe aktarma aracını tutar. Volkswagen Grubu kayıtları bir sonraki yerel committir. Push yapılmadı.
