# BAHTEPOTO — GPT BMW / Mercedes-Benz / Audi araştırması

Araştırma tarihi: 2026-10-18
Ajan: gpt-german
Biçim: bahtepoto-research-v1

## Dosyalar
- `bmw.json`: 4 sorun, 8 kaynak
- `mercedes-benz.json`: 4 sorun, 9 kaynak
- `audi.json`: 4 sorun, 8 kaynak

Toplam 12 sorun, 25 dahili kaynak kaydı. Her dosya bağımsız JSON Schema Draft 2020-12 doğrulamasından geçti; sorunların bütün kaynak kimlikleri aynı dosyada çözümleniyor. Her sorunun en az bir `reviewed: true` kaynağı var.

## Önemli eşleştirme notları
- BMW mevcut N47 zincir kaydı TEKRAR EDİLMEDİ. N20 erken motor zincir kılavuzu, N13 wastegate sesi ve N13 PCV ayrı tutuldu.
- BMW N20 ABD uzlaşması Türkiye'deki kapsam/arıza sıklığını kanıtlamaz. Doğru motor kodu ve üretim tarihini eşleştirmeden genel kart üretmeyin.
- Mercedes M271 1.8 CGI zinciri M274 1.6 ya da bütün C180 sürümlerine genişletilmeyecek.
- Mercedes W205 NOx sorunu SCR/AdBlue donanımına özgüdür; DPF ve AdBlue hatalarının hepsi NOx değildir.
- Mercedes W205 krom trim için bir kullanıcı kaynağı tam açılamadı; `reviewed:false` olarak bırakıldı.
- Audi erken EA888 2.0 TFSI yağ ve zincir ayrı arıza konularıdır. ABD CAEB bülteni tüm Türkiye motor kodlarını otomatik kapsamaz.
- Audi A3 8V S tronic kaydı YALNIZCA DQ200 kuru kavrama içindir. Katalogda DQ200 ayrımı yoksa `--apply` öncesi bekletin.
- Audi EA888 Gen3 su kaçağı, Volkswagen Grubu ajanının su kaçağı kayıtlarıyla aynı motor ailesinden olabilir. Semantik tekrar kontrolü zorunlu.
- Şema eşleştirmesi sırasında `generation`, motor adı veya şanzıman adı çözülemezse araç ID'si uydurmayın; beklemeye alın.

## Cursor dry-run

Dosyaları `data/research/agent-outputs/gpt-german/` altına kopyalayın.

```
npm run issues:import -- --input data/research/agent-outputs/gpt-german/
```

Dry-run raporunu inceleyin. Şüpheli kapsamları manuel onaylamadan `--apply` çalıştırmayın.

Bu çıktılar gerçek web araştırmasıdır ama henüz yerel `katalog-turkiye` dalındaki son katalog kimlikleriyle eşleştirilmedi ve canlıya alınmadı. Yüksek/Orta/Düşük etiketleri istatistiksel arıza olasılığı değildir.
