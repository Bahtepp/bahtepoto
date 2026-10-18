# Kronik kayıt birleştirme — 18 Ekim 2026

Üç araştırmacının dosyaları kuru çalıştırmadan geçirildi. Aktarım yalnızca motor, kasa ve şanzıman kapsamı katalogla doğrulanan kayıtlara yapıldı. Arayüz değişmedi. `katalog-turkiye` dalındaki önceki commitler duruyor. Uzak depoya gönderilmedi.

## Sayılar

| Ajan | Gelen | Aktarılan | Birleştirilen | İncelemede | Reddedilen |
| --- | ---: | ---: | ---: | ---: | ---: |
| GPT (BMW, Mercedes-Benz, Audi) | 12 | 12 | 0 | 0 | 0 |
| Claude (Hyundai, Kia) | 5 | 5 | 0 | 0 | 0 |
| Astra (Renault, Dacia) | 14 | 0 | 0 | 14 | 0 |

İkinci aktarım yeni kart açmadı: GPT’nin 12 kaydı ve Claude’un 5 kaydı `duplicate`. Astra’nın 14 kaydı yine incelemede.

## GPT — dokuz inceleme

İlk kuru çalıştırma 3 aktarılabilir, 9 inceleme, 0 geçersizdi. Kapsam daraltıldı; yaygınlık, kaydı geçirmek için yükseltilmedi.

| Kayıt | Sonuç | Gerekçe |
| --- | --- | --- |
| A4 B8 2.0 TFSI yağ tüketimi | Aktarıldı | Yalnız `2.0 TFSI 211 PS`, 2008–2011. 225 PS (2014–2015) dışarıda. Bülten ve bağımsız yayın yüksek yaygınlığı bu satır için destekliyor. |
| A4 B8 zincir gergisi | Aktarıldı | Aynı 211 PS satırı, 2008–2012. Yağ tüketiminden ayrı mekanizma; birleştirilmedi. |
| A4 B9 devirdaim/termostat | Aktarıldı | Yalnız `2.0 TFSI 252 PS`. 245 PS, adsız 2.0 TFSI ve sonraki TFSI satırları alınmadı. |
| A3 8V DQ200 | Aktarıldı | 1.4 TFSI 140/150/125 PS ve katalogdaki S tronic. 122 PS’in şanzımanı yazılmadığı için alınmadı. 2.0 TFSI S tronic DQ200 sayılmadı. Manuel varyant eşleşmiyor. |
| F30 kapı tutamacı | Aktarıldı | İki kullanıcı topluluğu var, bülten yok. Yaygınlık `medium`. |
| N13 wastegate | Aktarıldı | F30 `320i ED 170 PS` ve `1.6 320i ED 170 PS`. 328i ve 184 PS 320i değil. |
| N20 zincir kılavuzu | Aktarıldı | Yalnız F30 328i, 2012–2015. 320i ED N13’tür. Nesli belirsiz 320i 184 PS bağlanmadı. |
| N13 PCV | Aktarıldı | Wastegate ile aynı iki ED motoru, farklı mekanizma. Yaygınlık `unknown`. |
| M271 zincir | Aktarıldı | W204 `1.8 180`, `1.8 200`, `1.8 250`. `1.6 180` ve `1.6 180K` yok. İki forum olduğu için yaygınlık `medium`. |
| W204 direksiyon kilidi | Aktarıldı | Kasa geneli elektrik kaydı. İlk kuru çalıştırmada da aktarılabilirdi. |
| W205 C 220 d NOx | Aktarıldı | Katalog karşılığı `2.2 220` (2016–2017). 2018 `220d` ve nesli belirsiz `220 BlueTEC` yok. |
| W205 krom kaplama | Aktarıldı | İç trim, kasa geneli. Yaygınlık `unknown`. |

## Claude

Beş kayıt aktarıldı. i20 PB kapı tutamacı yeniden açılmadı.

- Tucson 3 ve Kona 1, yalnız `1.6 T-GDI` ve DCT, bültendeki yıllar duruyor. Kona 2 yok. Manuel eşleşmiyor.
- i30 FD direksiyon 2007–2008, GD kapı kaplaması 2012–2016, PD yalnız C-MDPS kaydında 2018–2019.
- C-MDPS: Elantra 6, i30 PD, Kona 1 ve Ioniq; verilen yıllarla.
- Kia yağ: Sportage 4 `2.4 GDI 181 PS` ve Sorento 3 `2.4 GDI`. Sportage 3 1.6 GDI yok.

## Astra

On dört kayıt da incelemede. K9K 700/702 kodu katalog satış adında yok; 2001–2002 ve klimasız koşul doğrulanmadan 1.5 dCi’ye yayılmadı. Bosch ABS parça numarası motora bağlanamadı. Clio 1.2 16V’nin nesli yazılmadığı için 1.2 TCe’ye geçmedi. Fluence 1.5 dCi adı hem motora hem aileye denk geldiği ve EDC katalogda ayrılmadığı için durdu. Sandero Easy-R, Sandero kontak ve Duster HJD nesil veya VIN belirsiz. Lodgy’nin nesli ve yılı yazılmadığı için bütün yıllara açılmadı.

## Eşleştirme

Doğrulanmış dar karşılıklar: N13 → iki 320i ED satırı, N20 → yalnız 328i, M271 → üç 1.8, W205 BlueTEC adı → `2.2 220`, A3 8V 1.4 TFSI DQ200 → S tronic. EA888 ailesi bütün güçlere eşitlenmedi. Aynı motordaki yağ ve zincir gibi farklı başlıklar ayrı kart kaldı. Benzer başlık ikinci kart açmıyor.

`npm test`: 288 geçti. Türkiye katalog testleri duruyor. Katalog motor kimlikleri değişmedi.
