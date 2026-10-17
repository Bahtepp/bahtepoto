# Türkiye kataloğu ilerleme

Son güncelleme: 2026-10-17. Dal: `katalog-turkiye`. Kontrol noktası: `katalog-oncesi` (aynı başlangıç commit'i).

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

Bu turda bütün markalara eklenen ortak kurallar: EcoBoost kısaltması `EB` ayrı motor değil; ST/RS performans varyantı, ST-Line ve RS Line donanım; Cool/Trend/Titanium/Joy/Touch/Icon/Equilibre ve benzeri paketler alt model değil; hp ile aynı tam sayıdaki PS, motor ailesi tutuyorsa bağlanır; yakıtsız satır ve ST-Line, ST/RS motor kaydına bağlanmaz. Şanzıman veya Eco etiketinden sonraki sayı güçtür. Listede aynı ailenin birden çok gücü tek başlık altında gruplanır. Donanım paketleri kartta seçenek olarak gösterilmez; TSB satırında durur.

## Sıradaki

Aynı kurallar aktarımda duruyor. Model model bakılacak:

1. Toyota Corolla, Yaris, Auris, C-HR, RAV4, Corolla Cross (benzin / hibrit)
2. Hyundai i20 / Tucson, Honda Civic
3. Opel Astra, Peugeot 208 / 308 / 3008, Citroën C3 / C4
4. Audi A3 / A4 / A6, Skoda Octavia / Superb
5. Seat, Dacia, Kia, Volvo
6. Kalan Türkiye modelleri

Belirsizler: `nissan.md`, `ford.md`, `renault.md`, `volkswagen.md`, `fiat.md`.

## Sayılar

Sayılar Volkswagen turunun sonuna göre. Fiat sonrası ikinci kuru çalıştırma: düşen 0, yeni 0, silinen model 0, değişen elle girilmiş kayıt 0. TSB satırı 15.420’den 15.433’e çıktı; eklenen 13 satır daha önce motor bilgisi sayılmayan kayıtlardı (aralarında 500e 42 kWh). Silinen satır yok.

| | Volkswagen sonrası | Fiat sonrası |
|---|---:|---:|
| Marka kaydı | 100 | 100 |
| Modeli olan marka | 97 | 97 |
| Model dosyası | 891 | 889 |
| Gerçek kasa | 1.356 | 1.356 |
| Varyant | 5.056 | 5.046 |
| Nesli belirsiz varyant | 1.909 | 1.901 |
| Motor | 2.504 | 2.504 |
| TSB satırı | 15.420 | 15.433 |
