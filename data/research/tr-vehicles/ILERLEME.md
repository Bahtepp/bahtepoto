# Türkiye kataloğu ilerleme

Son güncelleme: 2026-10-17. Dal: `katalog-turkiye`. Kontrol noktası: `katalog-oncesi` (aynı başlangıç commit'i).

## Bitti

Kurallar bütün TSB aktarımına uygulandı (97 marka, 15.401 kaynak satırı). İkinci kuru çalıştırma aynı sayıyı verdi: düşen satır 0, yeni satır 0, silinen model 0, değişen elle girilmiş kayıt 0.

Derin bakılanlar:

- Nissan Qashqai, X-Trail, Micra, Juke (TSB satırları + kasa yılları)
- BMW 3 Serisi: `320i ED` ayrı güç sürümü (170 PS), M Sport donanım olarak kaldı
- Mercedes-Benz: `180 d` dizel eki `180` benzin kaydından ayrıldı
- Ford Focus, Fiesta, Mondeo, C-Max, Grand C-Max, S-Max, Kuga, Puma (`ford.md`)

Bu turda bütün markalara eklenen ortak kurallar: EcoBoost kısaltması `EB` ayrı motor değil; ST/RS performans varyantı, ST-Line donanım; Cool/Trend/Titanium ve benzeri paketler alt model değil; hp ile aynı tam sayıdaki PS, motor ailesi tutuyorsa bağlanır; yakıtsız satır ve ST-Line, ST/RS motor kaydına bağlanmaz. Listede aynı ailenin birden çok gücü tek başlık altında gruplanır. Donanım paketleri kartta seçenek olarak gösterilmez; TSB satırında durur.

## Sıradaki

Aynı kurallar aktarımda duruyor. Model model bakılacak:

1. Renault Clio, Megane
2. Volkswagen Golf, Passat
3. Fiat Egea, Toyota Corolla, Hyundai i20 / Tucson, Honda Civic
4. Opel Astra, Peugeot 208 / 308 / 3008, Citroën C3 / C4
5. Audi A3 / A4 / A6, Skoda Octavia / Superb
6. Kalan Türkiye modelleri

Belirsizler: `nissan.md`, `ford.md`.

## Sayılar

| | Önce | Sonra |
|---|---:|---:|
| Marka kaydı | 100 | 100 |
| Modeli olan marka | 97 | 97 |
| Model dosyası | 898 | 897 |
| Gerçek kasa | 1.356 | 1.356 |
| Varyant | 5.093 | 5.090 |
| Nesli belirsiz varyant | 1.924 | 1.922 |
| Motor | 2.502 | 2.505 |
| TSB satırı | 15.401 | 15.401 |
