# Elle indirilen TSB dosyaları

Otomatik indirme çalışmazsa (örn. TSB sunucusu hata verirse):

1. https://www.tsb.org.tr/tr/kasko-deger-listesi sayfasından güncel listeyi ("Dosyayı İndir") ve gerekirse
   arşivden Ocak 2022 listesini indirin. Dosya adlarını değiştirmeyin (örn. `202610R1.xlsx`, `202201R1.xlsx`).
2. Dosyaları bu klasöre bırakın.
3. Önce kuru çalıştırma: `npm run catalog:tsb -- --elle`, sonra yazma: `npm run import -- --elle`.

Dosyalar doğrulanır (geçerli xlsx, "Marka Kodu" başlığı, en az 1000 satır), sonra `.cache/import/tsb/<tarih>/`
önbelleğine kopyalanır; bundan sonra `npm run import -- --offline` da aynı dosyaları kullanır. Yalnızca güncel
listeyi bırakırsanız önbellekteki arşiv listesi (202201R1) korunur. Bu klasördeki xlsx dosyaları git'e girmez.
