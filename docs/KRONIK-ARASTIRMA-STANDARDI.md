# BAHTEPOTO Kronik Araştırma JSON v1

Sürüm kimliği: `bahtepoto-research-v1`

Bu biçim canlı sorun kaydının kopyası değildir. Araştırmacı, `hyundai-i20-pb` gibi dahili kimlik yazmaz. Marka, model, nesil ve motor adını yazar. Katalog kimliğine çevirmek içe aktarma aracının işidir.

## Dosyalar

- Şema: `data/research/agent-outputs/schema/bahtepoto-research-v1.schema.json`
- Çalışan denetleyici: `src/lib/issues/research-schema.ts`
- Örnek: `data/research/agent-outputs/examples/ornek-arastirma.json`
- Kısa not: `data/research/agent-outputs/ARASTIRMACI.md`

Örnek kayıt `example: true` taşır ve canlı kataloğa aktarılmaz.

## Teslim klasörleri

| Ajan | Markalar | Klasör |
|---|---|---|
| Astra | Renault, Dacia | `data/research/agent-outputs/astra-renault/` |
| Cursor | Volkswagen, Škoda, SEAT, CUPRA | `data/research/agent-outputs/cursor-vag/` |
| Claude | Hyundai, Kia | `data/research/agent-outputs/claude-hyundai/` |
| ChatGPT | BMW, Mercedes-Benz, Audi | `data/research/agent-outputs/gpt-german/` |

Araştırmacı yalnızca kendi klasörüne JSON koyar. Ortak şemayı, katalogu, `sources.json` dosyasını ve arayüzü değiştirmez.

## Kayıt

Bir dosya birden fazla sorun taşıyabilir. `brands` ve `models`, dosyadaki bütün kayıtları kapsar.

Zorunlu sorun alanları: `id`, `title`, `summary`, `category`, `frequency`, `frequencyRationale`, `vehicles`, `sourceIds`.

`frequency` değeri `high`, `medium`, `low` veya `unknown` olur. Bu, arızanın ciddiyeti değildir. Gerekçe `frequencyRationale` içindedir ve kullanıcıya gösterilmez.

Kaynaklar dosyada bir kez tanımlanır. Aynı soruna birden fazla kaynak bağlanabilir. Her kaynakta `reviewed` vardır. Metin okunmadıysa `false` yazılır.

Motor için `name` veya `code` yeterlidir. İkisi birden yazılırsa ikisi de aynı katalog motorunda bulunmalıdır. Nesil bilinmiyorsa alan boş bırakılır.

Şanzıman yalnızca biliniyorsa yazılır. `dual-clutch` ve `DSG` adı, kuru DQ200 ile ıslak DQ250, DQ381 veya DQ500 aynı kutu demek değildir. Tip ayırt edilemiyorsa kayıt o kadar daraltılır veya belirsizlik notuna yazılır.

## İçe aktarma

```text
npm run issues:import -- --input data/research/agent-outputs/astra-renault/
npm run issues:import -- --input data/research/agent-outputs/cursor-vag/ --apply
```

İlki dry-run'dır. Eşleşmeyi hesaplar, dosya yazmaz. `--apply` yalnızca `import` kararındaki kayıtları yazar.

Aktarılmayanlar:

- Bozuk JSON veya yanlış şema sürümü
- Okunmamış kaynak
- Bilinmeyen marka veya model
- Nesli yazılmadığı için birden fazla kasaya yayılacak motor
- Katalogda karşılığı olmayan motor
- Şanzıman bilgisi katalogda olmayan araca bağlanacak şanzıman sorunu
- Aynı araştırma kimliğiyle daha önce aktarılmış kayıt
- Aynı marka, kategori, kasa ve motorda zaten duran kayıt

Çelişen yeni metin eski doğrulanmış kaydın üzerine yazılmaz. Dry-run çıktısında `review` olarak kalır.

Aynı dosya ikinci kez aktarıldığında yeni kart açılmaz. Kaynak adresi katalogda varsa mevcut kaynak kimliği kullanılır.
