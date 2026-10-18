# Gemini — Fiat, Opel, Peugeot, Citroën

Gemini tarayıcıda çalışır. Bu klasöre, katalog dosyalarına ve Git deposuna erişemez.

Araştırma bittiğinde kullanıcı JSON dosyasını veya ZIP arşivini indirip bu klasöre koyar. Entegrasyon burada yapılır. Gemini’nin kendisi dosya yazmaz, kod değiştirmez ve Git işlemi yapmaz.

Şimdilik bu klasörde sorun kaydı yoktur. Dosya gelmeden aktarım yapılmış sayılmaz.

## Teslim biçimi

- Şema: `bahtepoto-research-v1`
- `agent`: `gemini-stellantis`
- Markalar: Fiat, Opel, Peugeot, Citroën
- Bir kayıt tek markaya aittir
- Katalog kimliği tahmin edilmez; satıştaki motor ve nesil adı yazılır
- Okunmayan kaynağın `reviewed` alanı `false` kalır
- Aynı mekanizma ikinci turda yeni bir `id` alır; birinci turun dosyası silinmez

Kuru çalıştırma:

`npm run issues:import -- --input data/research/agent-outputs/gemini-stellantis/`
