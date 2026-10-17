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
  /** Gövdeyi, tip adında daha önce bulunan gövde kısaltmasının üzerine yazar. */
  replaceBody?: boolean;
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
  },
  honda: {
    'TYPE-R': { model: 'CIVIC', note: 'Tip adında Civic yazmayan Type R, Civic performans sürümüdür' },
  },
  opel: {
    'INSIGNIA GRAND': { model: 'INSIGNIA', note: 'Insignia Grand Sport gövdesi' },
    'INSIGNIA COUNTRYTOURER': { model: 'INSIGNIA', body: 'wagon', note: 'Insignia Country Tourer station wagon gövdesi' },
    'ASTRA GTC': { model: 'ASTRA', body: 'hatchback-3', note: 'Astra GTC: 3 kapılı Astra gövdesi' },
    CROSSLANDX: { model: 'CROSSLAND', note: 'Bitişik yazım: Crossland X' },
    'CROSSLAND X': { model: 'CROSSLAND', note: 'Crossland X: Crossland’ın satış adı' },
    'MOKKA X': { model: 'MOKKA', note: 'Mokka X: Mokka’nın satış adı' },
    'GRANDLAND X': { model: 'GRANDLAND', note: 'Grandland X: Grandland’ın satış adı' },
    INSIGNIASPORTTOURER: { model: 'INSIGNIA', body: 'wagon', note: 'Insignia Sports Tourer station wagon gövdesi' },
    'VECTRA CARAVAN': { model: 'VECTRA', body: 'wagon', note: 'Vectra Caravan station wagon gövdesi' },
    'COMBO TOUR': { model: 'COMBO', note: 'Combo Tour: Combo’nun yolcu gövdesi' },
    'CORSA-E': { model: 'CORSA', note: 'Corsa-e: Corsa’nın elektrikli sürümü' },
    'ASTRA-E': { model: 'ASTRA', note: 'Astra-e: Astra’nın elektrikli sürümü' },
    'MOKKA-E': { model: 'MOKKA', note: 'Mokka-e: Mokka’nın elektrikli sürümü' },
    'ZAFIRA-E': { model: 'ZAFIRA LIFE', note: 'Zafira-e: elektrikli Zafira Life' },
    'FRONTERA-E': { model: 'FRONTERA', note: 'Frontera-e: Frontera’nın elektrikli sürümü' },
    'ADAM B14': { model: 'ADAM', note: 'B14 motor kodu, ayrı model değil' },
    'ADAM B12': { model: 'ADAM', note: 'B12 motor kodu, ayrı model değil' },
    'ADAM B10': { model: 'ADAM', note: 'B10 motor kodu, ayrı model değil' },
  },
  skoda: {
    'RAPID SPACEBACK': { model: 'RAPID', note: 'Rapid Spaceback hatchback gövdesi' },
    'YETI EXPERIENCE': { model: 'YETI', note: 'Experience donanım paketi' },
  },
  fiat: {
    '500L LIVING': { model: '500L', note: '500L Living: uzun gövdeli 500L' },
    '500 C': { model: '500', body: 'cabrio', replaceBody: true, note: '500C: 500’ün cabrio gövdesi' },
    '500C': { model: '500', body: 'cabrio', replaceBody: true, note: '500C: 500’ün cabrio gövdesi' },
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
    '206+': { model: '206', note: '206+: 206’nın satış adı' },
    '206 POP': { model: '206', note: 'Pop donanım paketi' },
    '206 FEVER': { model: '206', note: 'Fever donanım paketi' },
    '206 GENERATION': { model: '206', note: 'Generation donanım paketi' },
    '208 SIGNATURE': { model: '208', note: 'Signature donanım paketi' },
    '307 DESIGNTECH': { model: '307', note: 'DesignTech donanım paketi' },
    '2008 ALLUREROADTRIPDYNAMIC': { model: '2008', note: 'Allure Roadtrip Dynamic donanım paketi' },
    '3008ACTIVELIFE': { model: '3008', note: 'Active Life donanım paketi' },
    'E-208': { model: '208', note: 'e-208: 208’in elektrikli sürümü' },
    'E-2008': { model: '2008', note: 'e-2008: 2008’in elektrikli sürümü' },
    'e-2008': { model: '2008', note: 'e-2008: 2008’in elektrikli sürümü' },
    'E-308': { model: '308', note: 'e-308: 308’in elektrikli sürümü' },
    'E-3008': { model: '3008', note: 'e-3008: 3008’in elektrikli sürümü' },
    'E-5008': { model: '5008', note: 'e-5008: 5008’in elektrikli sürümü' },
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
    'C-ELLYSE': { model: 'C-ELYSEE', note: 'Yazım: C-Ellyse = C-Elysée' },
    C3AIRCROSS: { model: 'C3 AIRCROSS', note: 'Bitişik yazım: C3 Aircross, C3 değil' },
    C3AIRCROSSSHINE: { model: 'C3 AIRCROSS', note: 'Shine donanımı; C3 Aircross' },
    C3AIRCROSSEXCLUSIVE: { model: 'C3 AIRCROSS', note: 'Exclusive donanımı; C3 Aircross' },
    'GRAND C4': { model: 'GRAND C4 PICASSO', note: 'Grand C4 Picasso, C4 değil' },
    'GRAND C4PICASSO': { model: 'GRAND C4 PICASSO', note: 'Bitişik yazım: Grand C4 Picasso' },
    'GRAND PICASSO': { model: 'GRAND C4 PICASSO', note: 'Grand Picasso: Grand C4 Picasso' },
    'E-C3': { model: 'C3', note: 'ë-C3: C3’ün elektrikli sürümü' },
    'E-C4': { model: 'C4', note: 'ë-C4: C4’ün elektrikli sürümü' },
    'E-C5': { model: 'C5 AIRCROSS', note: 'ë-C5 Aircross: C5 Aircross’un elektrikli sürümü' },
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
