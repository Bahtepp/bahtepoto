/**
 * Model takma adları (düzenlenebilir, insan kararı).
 *
 * TSB tip adlarında model adına yapışan GÖVDE veya DONANIM sözcükleri ("CLIO GRAND TOUR", "I30 CW",
 * "CEED SPORTYWAGON") ayrı model sayılmamalı: bunlar asıl modelin gövde/donanım varyantıdır ve aynı
 * nesillere aittir. Buradaki her satır, katalog modelinin adını (TSB'de çözümlenen, Türkçe karakterleri
 * katlanmış büyük harfli hâliyle) asıl modele bağlar; çıkarılan sözcük donanım bilgisinde korunur.
 *
 * Kurallar:
 * - Yalnızca aynı modelin gövde/donanım varyantları birleştirilir. Ayrı model veya performans versiyonları
 *   (Audi TTS, RS, Mercedes-AMG GT, Golf R …) burada YER ALMAZ.
 * - `wikipedia` yalnızca modelin kimliğinden emin olunan durumlarda İngilizce madde başlığını verir
 *   (örn. Honda Jazz = Honda Fit; Türkiye'deki MINI = Mini Hatch).
 */
import type { BodyType } from './normalize.ts';

export interface ModelAlias {
  /** Asıl model (katalogdaki ad, büyük harf). */
  model: string;
  /** Çıkarılan sözcüklerin gövde tipi (biliniyorsa). */
  body?: BodyType;
  /** Neden (rapor ve inceleme için). */
  note: string;
}

/** Marka kimliği → (TSB'de çözümlenen model adı → asıl model). */
export const MODEL_ALIASES: Record<string, Record<string, ModelAlias>> = {
  renault: {
    'CLIO GRAND': { model: 'CLIO', body: 'wagon', note: 'Clio Grand Tour: Clio station wagon gövdesi' },
    'SYMBOL COLLECTION': { model: 'SYMBOL', note: 'Collection donanım paketi' },
    'FLUENCE BOLD': { model: 'FLUENCE', note: 'Bold donanım paketi' },
    'KADJAR BLACK': { model: 'KADJAR', note: 'Black Edition donanım paketi' },
  },
  seat: {
    'IBIZA SPORTOURER': { model: 'IBIZA', body: 'wagon', note: 'Ibiza ST (Sportourer) station wagon gövdesi' },
    'ALTEA XL': { model: 'ALTEA', note: 'Altea XL: uzun gövdeli Altea (aynı nesil)' },
  },
  kia: {
    'CEED SPORTYWAGON': { model: 'CEED', body: 'wagon', note: "cee'd Sportswagon station wagon gövdesi" },
  },
  hyundai: {
    'I30 CW': { model: 'I30', body: 'wagon', note: 'i30 CW station wagon gövdesi' },
    'I20 TROY': { model: 'I20', note: 'i20 Troy: Türkiye donanım/versiyon adı' },
    'I20 ACTIVE': { model: 'I20', note: 'i20 Active: i20 crossover görünümlü versiyon (aynı nesil)' },
    'ACCENT ERA': { model: 'ACCENT', note: "Accent Era: üçüncü nesil Accent'in Türkiye satış adı" },
  },
  opel: {
    'INSIGNIA GRAND': { model: 'INSIGNIA', note: 'Insignia Grand Sport gövdesi' },
    'INSIGNIA COUNTRYTOURER': { model: 'INSIGNIA', body: 'wagon', note: 'Insignia Country Tourer station wagon gövdesi' },
    'ASTRA GTC': { model: 'ASTRA', body: 'hatchback-3', note: 'Astra GTC: 3 kapılı Astra gövdesi' },
  },
  skoda: {
    'RAPID SPACEBACK': { model: 'RAPID', note: 'Rapid Spaceback hatchback gövdesi' },
    'YETI EXPERIENCE': { model: 'YETI', note: 'Experience donanım paketi' },
  },
  fiat: {
    '500L LIVING': { model: '500L', note: '500L Living: uzun gövdeli 500L' },
    '500 C': { model: '500C', note: 'Yazım farkı: 500 C = 500C' },
    'STRADA PICK': { model: 'STRADA', body: 'pickup', note: 'Strada pick-up gövdesi' },
    'EGEA CROSS': { model: 'EGEA', body: 'suv', note: 'Egea Cross: Egea’nın yükseltilmiş gövdesi; ayrı motor ailesi değil' },
    'LINEA VIA': { model: 'LINEA', note: 'Linea Via: Linea’nın satış adı' },
    'G.PUNTO': { model: 'PUNTO', note: 'G.Punto: Grande Punto yazımı' },
    ABART: { model: 'ABARTH', note: 'Yazım: Abart = Abarth' },
  },
  toyota: {
    'RAV 4': { model: 'RAV4', note: 'Yazım: RAV 4 = RAV4' },
    HIGHLINDER: { model: 'HIGHLANDER', note: 'Yazım: Highlinder = Highlander' },
  },
  peugeot: {
    'PARTNER TEEPE': { model: 'PARTNER', note: 'Partner Tepee: binek Partner' },
    'PARTNER ORIGIN': { model: 'PARTNER', note: 'Partner Origin: önceki nesil Partner satış adı' },
  },
  mini: {
    'MINI ONE': { model: 'MINI', note: 'One donanım seviyesi' },
    'MINI JOHN': { model: 'MINI', note: 'John Cooper Works donanım seviyesi' },
    'MINI COOPER': { model: 'MINI', note: 'Cooper donanım seviyesi' },
  },
  ds: {
    DS7CROSSBACK: { model: 'DS7', note: 'DS 7 Crossback: bitişik yazılmış gövde adı, ayrı model değil' },
  },
  volkswagen: {
    ID4: { model: 'ID.4', note: 'Yazım farkı: ID4 = ID.4' },
    'ID-4': { model: 'ID.4', note: 'Yazım farkı: ID-4 = ID.4' },
    'AMAROK AVENTURA': { model: 'AMAROK', note: 'Aventura donanım paketi' },
    TIGUANALLSPACE: { model: 'TIGUAN ALLSPACE', note: 'Bitişik yazım: Tiguan Allspace' },
    'CROSS POLO': { model: 'POLO', note: 'Cross Polo: Polo’nun crossover görünümlü versiyonu' },
    'PASSAT CC': { model: 'CC', note: 'Passat CC, Volkswagen CC ile aynı model' },
  },
  citroen: {
    C5AIRCROSS: { model: 'C5 AIRCROSS', note: 'Bitişik yazım' },
    'C5-AC': { model: 'C5 AIRCROSS', note: 'Kısaltma: C5 AC = C5 Aircross' },
    'C5 AC': { model: 'C5 AIRCROSS', note: 'Kısaltma: C5 AC = C5 Aircross' },
  },
  ssangyong: {
    'REXTON W': { model: 'REXTON', note: 'Rexton W: Rexton makyajlı versiyon adı' },
    'REXTON RX270': { model: 'REXTON', note: 'RX270 motor tanımıdır' },
  },
  kgm: {
    'MUSSO GRAND': { model: 'MUSSO', note: 'Musso Grand: uzun kasalı Musso' },
  },
  audi: {
    TTR: { model: 'TT', body: 'cabrio', note: 'TT Roadster gövdesi (TTS ayrı performans versiyonudur)' },
  },
  bentley: {
    FLYING: { model: 'FLYING SPUR', note: 'Model adı kesik yazılmış: Flying Spur' },
  },
};

/** Katalog model dosyası (marka/slug) → kimliği kesin İngilizce Wikipedia başlığı. */
export const WIKIPEDIA_TITLES: Record<string, string> = {
  'mini/mini': 'Mini Hatch',
  'honda/jazz': 'Honda Fit',
  'audi/q4': 'Audi Q4 e-tron',
};
