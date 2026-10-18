# Araştırma turları

Her ajan yalnızca yeni kayıtlarını teslim eder. Eski JSON silinmez ve sessizce ezilmez.

- Dosya adı turu ayırır: `vag-2026-10-18.json` birinci tur, `vag-2026-10-18-tur2.json` ikinci turdur.
- Sorun `id` ve kaynak `id` turlar arasında benzersiz kalır.
- Aynı `agent` + aynı sorun `id` ikinci aktarımda yeni kart açmaz.
- Başlığı ve mekanizması aynı olan ikinci kart yayınlanmaz.
- Farklı mekanizma, aynı motorda olsa da ayrı kalır.
- Kasa, motor veya şanzıman ayrılmıyorsa kayıt incelemede kalır ve silinmez.
- Yeni dosya mevcut kronik kayıtları silmez.

Klasörler: `cursor-vag`, `astra-renault`, `claude-hyundai`, `gpt-german`, `gemini-stellantis`.
