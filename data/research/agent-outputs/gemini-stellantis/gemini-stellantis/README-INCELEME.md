# BAHTEPOTO — Gemini Stellantis araştırması (2026-10-18)

Bu paket Gemini'nin kullanıcıya ilettiği araştırma taslağından oluşturulmuştur. Orijinal JSON kayıtlarının iddiaları, yaygınlık etiketleri ve `reviewed: true` işaretleri *değiştirilmeden* korunmuştur. Bu etiketlerin doğru olduğu bağımsız olarak doğrulanmış değildir.

## İçerik

| Dosya | Kronik sorun adayı | Kaynak kaydı |
| --- | ---: | ---: |
| fiat.json | 5 | 5 |
| opel.json | 4 | 4 |
| peugeot.json | 3 | 3 |
| citroen.json | 3 | 3 |
| **Toplam** | **15** | **15** |

Dört dosya, yüklenen `bahtepoto-research-v1.schema.json` dosyasına karşı JSON Schema Draft 2020-12 ve URI format kontrolünden **hatasız** geçmiştir. Bu **kaynak doğruluğu, teknik araç kapsamı veya içe aktarılabilirlik onayı değildir**.

## Editör denetimi gerekenler

1. Birkaç DonanımHaber URL'sinin konu kimliği (ör. `123456789`, `135792468`, `120000000`, `125000000`, `145000000`) şüphelidir; bağımsız aramayla içerik doğrulanamadı. Kaynaklar ve `reviewed: true` bildirimleri tek tek doğrulanmadan yayımlama.
2. Peugeot 1.2 PureTech kayış sorunu tüm motor nesillerine genellenmemeli; yağ içi kayışlı sürüm ve model/yıl eşleştirilmeli.
3. Citroën C4 Picasso havalı süspansiyon sorunu yalnız ilgili donanıma uygulanmalı; mevcut JSON'da donanım filtresi yok. “Neredeyse kaçınılmaz” sıklık iddiası kanıt gerektirir.
4. Citroën MCP/ETG ve Fiat Dualogic şanzıman konularında *normal vites karakteri* ile teknik kusur ayrılmalı. Araştırma araçları çoğunlukla motor belirtmediğinden importer bu kayıtları incelemeye alabilir.
5. Opel 1.6 CDTI zincir kaydındaki “kopma yoksa orta” gerekçesi, arıza şiddetini görülme sıklığına karıştırıyor. Yaygınlık için bağımsız gözlemler gerek.
6. Fiat Fiorino için `generation` boş; doğru kasa doğrulanmadan kapsamı genişletme. Egea `1.4 Fire` ismi katalogda daha belirgin `1.4 Fire 95 PS` olarak kayıtlı olabilir.
7. Citroën üst seviye `models` listesinde C3 ve C5 Aircross yazıyor ama bunlar hakkında issue yok; gerekirse üst listeyi gerçek kapsama göre daralt.

## Cursor'da güvenli kullanım

ZIP'i projenin `data/research/agent-outputs/` klasörüne aç. Sonra **önce sadece dry-run**:

```bash
npm run issues:import -- --input data/research/agent-outputs/gemini-stellantis/
```

Uygunsuz/hatalı kaynak ve kapsamları düzelttikten, şüpheli URL'leri doğruladıktan sonra yalnızca uygun kayıtlar için `--apply` kullanılmalı. İncelemeye düşen kayıtlar otomatik genelleştirilmemeli.

Bu paket hiçbir GitHub commit'i veya canlı site değişikliği yapmaz.
