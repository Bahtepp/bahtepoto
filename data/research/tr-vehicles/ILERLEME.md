# Türkiye kataloğu ilerleme

Son güncelleme: 2026-10-18. Dal: `katalog-turkiye`. Kontrol noktası: `katalog-oncesi` (aynı başlangıç commit'i).

## Bitti

Kurallar bütün TSB aktarımına uygulandı (97 marka, 15.401 kaynak satırı). İkinci kuru çalıştırma aynı sayıyı verdi: düşen satır 0, yeni satır 0, silinen model 0, değişen elle girilmiş kayıt 0.

Derin bakılanlar:

- Nissan Qashqai, X-Trail, Micra, Juke (TSB satırları + kasa yılları)
- BMW 3 Serisi: `320i ED` ayrı güç sürümü (170 PS), M Sport donanım olarak kaldı
- Mercedes-Benz: `180 d` dizel eki `180` benzin kaydından ayrıldı
- Ford Focus, Fiesta, Mondeo, C-Max, Grand C-Max, S-Max, Kuga, Puma (`ford.md`)
- Renault Clio, Megane, Symbol, Fluence, Taliant, Captur, Kadjar, Austral, Scenic, Laguna, Talisman, Koleos ve diğer binek modeller (`renault.md`)
- Volkswagen Golf, Passat, Polo, Jetta, Scirocco, Tiguan, T-Roc, T-Cross, Taigo, Touareg, Arteon, Amarok, ID.3, ID.4 ve diğer binek modeller (`volkswagen.md`)
- Fiat Egea, Linea, Punto, 500, 500L, 500X, 500e, Albea, Bravo, Palio ve diğer binek modeller (`fiat.md`)
- Toyota Corolla, Corolla Cross, Yaris, Yaris Cross, Auris, C-HR, RAV4, Verso (`toyota.md`). Boş `rav-4.json` kopyası kaldırıldı; Türkiye satırları `rav4.json` içinde.
- Fiat 500C, 500’ün cabrio gövdesi. 500L, 500X ve 500e ayrı (`fiat.md`).
- Opel Astra, Corsa, Insignia, Mokka, Grandland, Crossland, Vectra, Adam, Frontera, Zafira (`opel.md`)
- Peugeot 206, 207, 208, 301, 307, 308, 508, 2008, 3008, 5008 (`peugeot.md`)
- Citroën C3, C3 Aircross, C4, C4 X, C4 Picasso, C4 Cactus, Grand C4 Picasso, C5, C5 Aircross, C5 X, C-Elysée, DS3 (`citroen.md`). C5’teki “C5 X” nesil etiketi kalktı; 2008–2015 satırları C5 2. nesilde.
- Hyundai i20, i30, Tucson, Accent, Accent Era, Accent Blue, Bayon, Kona, Ioniq, Ioniq 5, Ioniq 6 (`hyundai.md`)
- Honda Civic, Jazz, CR-V, HR-V (`honda.md`)

Bu turda bütün markalara eklenen ortak kurallar: EcoBoost kısaltması `EB` ayrı motor değil; ST/RS performans varyantı, ST-Line ve RS Line donanım; Cool/Trend/Titanium/Joy/Touch/Icon/Equilibre ve benzeri paketler alt model değil; hp ile aynı tam sayıdaki PS, motor ailesi tutuyorsa bağlanır; yakıtsız satır ve ST-Line, ST/RS motor kaydına bağlanmaz. Şanzıman veya Eco etiketinden sonraki sayı güçtür. Listede aynı ailenin birden çok gücü tek başlık altında gruplanır. Donanım paketleri kartta seçenek olarak gösterilmez; TSB satırında durur.

## Sıradaki

Aynı kurallar aktarımda duruyor. Model model bakılacak:

1. Audi A3 / A4 / A6; Skoda Octavia / Superb
2. Seat, Dacia, Kia, Volvo
3. Kalan Türkiye modelleri

Opel’de Meriva, Signum, Tigra, Cascada, Antara ve Ampera yalnızca model listesinden geçti. Peugeot’da 407 ve 4007, Citroën’de C1 ve C2 aynı şekilde. 106 ve 306 TSB listesinde ayrı model olarak görünmedi.

Belirsizler: `nissan.md`, `ford.md`, `renault.md`, `volkswagen.md`, `fiat.md`, `toyota.md`, `opel.md`, `peugeot.md`, `citroen.md`, `hyundai.md`, `honda.md`.

Model dosyası 892’den 867’ye inmişti (Opel, Peugeot, Citroën turu). 30 silinen dosya donanım, elektrikli gövde, yazım veya boş kabuktu: Fiat 500C → 500 cabrio; Opel Adam B10/B12/B14 → Adam, Astra-e/Corsa-e/Mokka-e/Frontera-e → ana model, Zafira-e → Zafira Life, Vectra Caravan → Vectra, Combo Tour → Combo; Peugeot 206 Pop/Fever/Generation, 208 Signature, 307 DesignTech, 3008 Active Life ve e-208/e-2008/e-308/e-3008/e-5008 → ana model; Citroën e-C3/e-C4 → C3/C4, e-C5 → C5 Aircross, C-Ellyse → C-Elysée, Grand C4 yazım kopyaları → Grand C4 Picasso; boş Toyota rav-4. 5 eklenen dosya gerçek modeldi: C3 Aircross, C4 Picasso, C4 X, Grand C4 Picasso, DS 9. Git’in `c3aircross` → `c5-x` benzerlik adı, C3 Aircross’un C5 X’e birleşmesi değildir. 208 ile 2008, C3 ile C3 Aircross, C5 ile C5 X, 500L/500X/500e ayrı kaldı. Yanlış birleşen ayrı model görülmedi.

## Sayılar

Fiat sonrası TSB satırı 15.420’den 15.433’e çıktı (düşen 0). Opel turunda 15.450 (düşen 0, yeni 17). Hyundai ve Honda turunda 15.450’den 15.460’a çıktı (düşen 0, yeni 10). Yeni satırlar, 84.5 / 99.5 / 107.8 kW gibi ondalıklı motor gücünün şarj gücü sanılmasından kurtulan Inster ve Kia EV2 kayıtları. İkinci kuru çalıştırma: 15.460 → 15.460, düşen 0, yeni 0, silinen model 0, değişen elle girilmiş kayıt 0.

| | Opel, Peugeot, Citroën sonrası | Hyundai ve Honda sonrası |
|---|---:|---:|
| Marka kaydı | 100 | 100 |
| Modeli olan marka | 97 | 97 |
| Model dosyası | 867 | 874 |
| Gerçek kasa | 1.349 | 1.348 |
| Varyant | 5.023 | 5.034 |
| Nesli belirsiz varyant | 1.873 | 1.891 |
| Motor | 2.507 | 2.514 |
| TSB satırı | 15.450 | 15.460 |
