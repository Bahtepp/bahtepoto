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
- Citroën C3, C3 Aircross, C4, C4 X, C4 Picasso, C4 Cactus, Grand C4 Picasso, C5, C5 Aircross, C5 X, C-Elysée, DS3 (`citroen.md`)

Bu turda bütün markalara eklenen ortak kurallar: EcoBoost kısaltması `EB` ayrı motor değil; ST/RS performans varyantı, ST-Line ve RS Line donanım; Cool/Trend/Titanium/Joy/Touch/Icon/Equilibre ve benzeri paketler alt model değil; hp ile aynı tam sayıdaki PS, motor ailesi tutuyorsa bağlanır; yakıtsız satır ve ST-Line, ST/RS motor kaydına bağlanmaz. Şanzıman veya Eco etiketinden sonraki sayı güçtür. Listede aynı ailenin birden çok gücü tek başlık altında gruplanır. Donanım paketleri kartta seçenek olarak gösterilmez; TSB satırında durur.

## Sıradaki

Aynı kurallar aktarımda duruyor. Model model bakılacak:

1. Hyundai i20 / i30 / Tucson; Honda Civic
2. Audi A3 / A4 / A6; Skoda Octavia / Superb
3. Seat, Dacia, Kia, Volvo
4. Kalan Türkiye modelleri

Opel’de Meriva, Signum, Tigra, Cascada, Antara ve Ampera yalnızca model listesinden geçti. Peugeot’da 407 ve 4007, Citroën’de C1 ve C2 aynı şekilde. 106 ve 306 TSB listesinde ayrı model olarak görünmedi.

Belirsizler: `nissan.md`, `ford.md`, `renault.md`, `volkswagen.md`, `fiat.md`, `toyota.md`, `opel.md`, `peugeot.md`, `citroen.md`.

## Sayılar

Fiat sonrası TSB satırı 15.420’den 15.433’e çıktı (düşen 0). Bu turda 15.433’ten 15.450’ye çıktı (düşen 0, yeni 17). İkinci kuru çalıştırma: 15.450 → 15.450, düşen 0, yeni 0, silinen model 0, değişen elle girilmiş kayıt 0.

| | Toyota sonrası | Opel, Peugeot, Citroën sonrası |
|---|---:|---:|
| Marka kaydı | 100 | 100 |
| Modeli olan marka | 97 | 97 |
| Model dosyası | 892 | 867 |
| Gerçek kasa | 1.356 | 1.349 |
| Varyant | 5.046 | 5.023 |
| Nesli belirsiz varyant | 1.903 | 1.873 |
| Motor | 2.505 | 2.507 |
| TSB satırı | 15.433 | 15.450 |
