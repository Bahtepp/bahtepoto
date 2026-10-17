/**
 * TSB tip adlarından araç özniteliklerini çıkarır (yalnızca metinde açıkça yazanı).
 *
 * Örnek: "FOCUS III TITANIUM 1.6 TDCi (115) 4K"
 *   model: FOCUS · nesil ipucu: III · motor: 1.6 TDCi · güç: 115 PS · yakıt: dizel (TDCi) ·
 *   gövde: 4 kapı · donanım: TITANIUM
 *
 * Model adı istatistiksel bulunur (bkz. `resolveModels`): motor/gövde/şanzıman bilgisinden önce
 * gelen sözcüklerden ilki modeldir; ikinci sözcük yalnızca o markada hiçbir zaman motor
 * bilgisinden SONRA görünmüyorsa ve tek bir modelin ardından geliyorsa alt model sayılır
 * ("FOCUS C-MAX"). Aksi hâlde donanım adıdır ("FOCUS TITANIUM").
 */
import type { FuelType, Transmission } from '../../../src/lib/catalog/schema.ts';

export type BodyType = 'hatchback-3' | 'sedan-4' | 'hatchback-5' | 'wagon' | 'coupe' | 'cabrio' | 'suv' | 'van' | 'pickup' | 'mpv';

export interface ParsedType {
  /** Motor/gövde/şanzıman bilgisinden önceki sözcükler (model + nesil ipucu + donanım). */
  prefix: string[];
  /** Motor bilgisinden sonraki, sınıflandırılmamış sözcükler (çoğunlukla donanım). */
  rest: string[];
  displacementL?: number;
  powerPs?: number;
  powerHp?: number;
  powerKw?: number;
  /** "42KWH" gibi tip adında açık yazan batarya. Güç yoksa uydurulmaz. */
  batteryKwh?: number;
  fuel?: FuelType;
  /** Motoru tanımlayan teknoloji sözcükleri (TDCi, TSI, ECOBOOST …), metindeki yazımıyla. */
  tech: string[];
  transmission?: Pick<Transmission, 'type' | 'gears' | 'name'>;
  body?: BodyType;
  /** 4x4 / 4MOTION / QUATTRO / XDRIVE / AWD → dört çeker. */
  awd: boolean;
  generationHint?: string;
}

const up = (s: string) => s.toLocaleUpperCase('tr-TR').replace(/İ/g, 'I').replace(/Ş/g, 'S').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/Ç/g, 'C');

/** Porsche 911 kasa kodları. Parantezde güç gibi durur: "911 TURBO (991) 3.8 (520)". */
const PORSCHE_CHASSIS = new Set(['901', '930', '964', '993', '996', '997', '991', '992']);
/** Audi satış kademesi. "50 TDI" 50 PS değildir; gerçek güç ayrı yazılır veya boş kalır. */
const AUDI_BADGE = new Set(['25', '30', '35', '40', '45', '50', '55', '60', '70']);

const DIESEL = new Set(['TDCI', 'TDI', 'DCI', 'CRDI', 'CRDİ', 'HDI', 'BLUEHDI', 'BLUHDI', 'E-HDI', 'JTD', 'JTDM', 'MULTIJET', 'MJET', 'MJT', 'M.JET', 'M-JET', 'CDTI', 'CTDI', 'CDI', 'D4D', 'D-4D', 'DIZEL', 'DIESEL', 'SDV6', 'TDV6', 'SD4', 'TD4', 'ED4', 'CRD', 'DTEC', 'I-DTEC', 'IDTEC', 'SKYACTIV-D', 'VCDI', 'D-CAT', 'BLUETEC', 'TDS', 'SDI', 'ECOBLUE', 'BLUEDCI', 'B.DCI', 'BDCI', 'CRDI4', 'DDIS', 'DDIS4', 'TDDI', 'TDCI4', 'D-4D4', 'XDI', 'CRTD', 'BITDI', 'BITURBODIESEL', 'TDCİ']);
const PETROL = new Set(['EB', 'E.BOOST', 'TSI', 'TFSI', 'FSI', 'TCE', 'ECOBOOST', 'VVT', 'VVTI', 'VVT-I', 'DUAL-VVT', 'CVVT', 'VTEC', 'I-VTEC', 'IVTEC', 'V-TEC', 'MPI', 'GDI', 'T-GDI', 'TGDI', 'PURETECH', 'PTECH', 'THP', 'VTI', 'E-VTI', 'TJET', 'T-JET', 'T.JET', 'MULTIAIR', 'FIRE', 'TB', 'TBI', 'BENZIN', 'BENZINLI', 'SCE', 'TI-VCT', 'TIVCT', 'DURATEC', 'ECOTEC', 'SIDI', 'TURBOJET', 'GTI', 'EVO', 'DIG-T', 'DIGT', 'IG-T', 'IGT', 'SKYACTIV-G', 'TSI-ACT', 'FIREFLY', 'E-TORQ', 'E.TORQ', 'ETORQ']);
const HYBRID = new Set(['HYBRID', 'HIBRIT', 'HIBRID', 'HEV', 'E:HEV', 'EHEV', 'FULL-HYBRID', 'F.HYBRID', 'F-HYBRID', 'E-TECH', 'ETECH', 'E-TECH-HYBRID', 'HYBRIT', 'SELF-CHARGING', 'E-POWER', 'EPOWER']);
const PHEV = new Set(['PHEV', 'PLUG-IN', 'E-HYBRID', 'EHYBRID', 'PLUGIN', 'PLUG-IN-HYBRID', 'GTE', 'HYBRID4', 'E-TENSE', 'ETENSE']);
const MHEV = new Set(['MHEV', 'ETSI', 'E-TSI', 'MILD-HYBRID', 'MILD', '48V', 'MHYBRID']);
const ELECTRIC = new Set(['EV', 'BEV', 'ELEKTRIK', 'ELEKTRIKLI', 'ELECTRIC', 'E-TRON', 'KWH']);
const LPG = new Set(['LPG', 'BI-FUEL', 'BIFUEL', 'ECO-G', 'ECOG']);
const CNG = new Set(['CNG', 'TGI', 'METAN']);

const AUTO = new Set(['OV', 'O.V', 'O.V.', 'OTOMATIK', 'OTM', 'OTOM', 'AT', 'A/T', 'TIPTRONIC', 'STEPTRONIC', 'AUTO', 'OTOMATIK.', 'GEARTRONIC', 'AUTOMATIC', 'EAT6', 'EAT8', 'EAT', '8AT', '6AT', '7AT', '9AT', '9G-TRONIC', '7G-TRONIC', 'OTOM.', 'TORQUE']);
const DCT = new Map<string, string>([
  ['DSG', 'DSG'],
  ['S-TRONIC', 'S tronic'],
  ['STRONIC', 'S tronic'],
  ['EDC', 'EDC'],
  ['POWERSHIFT', 'PowerShift'],
  ['DCT', 'DCT'],
  ['7DCT', 'DCT'],
  ['PDK', 'PDK'],
  ['7G-DCT', '7G-DCT'],
  ['8G-DCT', '8G-DCT'],
  ['TCT', 'TCT'],
  ['DDCT', 'DDCT'],
  ['EDC6', 'EDC'],
]);
const AMT = new Map<string, string>([
  ['DUALOGIC', 'Dualogic'],
  ['EASYTRONIC', 'Easytronic'],
  ['ETG', 'ETG'],
  ['MMT', 'MMT'],
  ['ASG', 'ASG'],
  ['AMT', 'AMT'],
  ['2-TRONIC', '2-Tronic'],
  ['EGS', 'EGS'],
  ['ROBOTIZE', 'Robotize'],
  ['QUICKSHIFT', 'Quickshift'],
  ['SENSODRIVE', 'SensoDrive'],
  ['MTA', 'MTA'],
]);
const CVT = new Map<string, string>([
  ['CVT', 'CVT'],
  ['XTRONIC', 'Xtronic'],
  ['X-TRONIC', 'Xtronic'],
  ['MULTIDRIVE', 'Multidrive'],
  ['E-CVT', 'e-CVT'],
  ['ECVT', 'e-CVT'],
  ['MULTITRONIC', 'Multitronic'],
  ['LINEARTRONIC', 'Lineartronic'],
  ['IVT', 'IVT'],
]);
const MANUAL = new Set(['MANUEL', 'MT', 'M/T', 'MANUAL', 'DUZ']);
const AWD = new Set(['4X4', '4MOTION', 'QUATTRO', 'XDRIVE', 'AWD', '4WD', '4MATIC', 'ALL4', 'Q4', '4X4.', 'ALLGRIP', '4MOTION.', 'E-FOUR', 'ALLWHEELDRIVE', '4XMOTION', 'E-4ORCE', 'E4ORCE']);
const BODY: [RegExp, BodyType][] = [
  [/^3K$|^3KAPI$|^3D$|^3DR$/, 'hatchback-3'],
  [/^4K$|^4KAPI$|^SEDAN$|^4D$|^4DR$|^SD$|^SDN$|^NB$/, 'sedan-4'],
  [/^5K$|^5KAPI$|^HB$|^HATCHBACK$|^5D$|^5DR$|^HB5$/, 'hatchback-5'],
  [/^SW$|^VARIANT$|^ESTATE$|^STATION$|^WAGON$|^KOMBI$|^TOURER$|^ST\.WAGON$|^S\.WAGON$|^STATIONWAGON$|^SWAGON$|^SPORTSWAGON$|^AVANT$|^TOURING$|^BREAK$|^SPORTBRAKE$|^SPORTS\s?TOURER$|^GRANDTOUR$|^GRANDTOURER$/, 'wagon'],
  [/^COUPE$|^COUPÉ$|^KUPE$/, 'coupe'],
  [/^CABRIO$|^CABRIOLET$|^CC$|^CABRIOLE$|^ROADSTER$|^SPIDER$|^SPYDER$|^KABRIYOLE$/, 'cabrio'],
  [/^PICK-?UP$|^PICKUP$|^DOUBLECAB$|^D\/C$|^S\/C$|^CIFTKABIN$|^TEKKABIN$/, 'pickup'],
  [/^VAN$|^PANELVAN$|^PANEL$|^KAMYONET$|^MINIBUS$|^COMBI$|^KOMBİ$/, 'van'],
];
/** Motor tanımının parçası olup donanım sayılmayan sözcükler (emisyon sınıfı, start-stop vb.). */
const NEUTRAL = new Set([
  'BMT', 'ACT', 'BLUEMOTION', 'S&S', 'SS', 'START&STOP', 'START-STOP', '16V', '8V', '12V', '20V', '24V', 'TURBO', 'TWINCHARGER', 'ECO',
  'BITURBO', 'E5', 'E6', 'E6D', 'E6.2', 'EU5', 'EU6', 'EURO5', 'EURO6', 'ENERGY', 'ECOFLEX', 'ECONETIC', 'V6', 'V8', 'V10', 'V12',
]);
const ROMAN = /^(II|III|IV|V|VI|VII|VIII|IX)$/;
const MK = /^MK\.?(\d{1,2})$/;

function fuelOf(t: string): FuelType | undefined {
  if (PHEV.has(t)) return 'plug-in-hybrid';
  if (MHEV.has(t)) return 'mild-hybrid';
  if (HYBRID.has(t)) return 'hybrid';
  if (ELECTRIC.has(t)) return 'electric';
  if (DIESEL.has(t)) return 'diesel';
  if (LPG.has(t)) return 'lpg';
  if (CNG.has(t)) return 'cng';
  if (PETROL.has(t)) return 'petrol';
  return undefined;
}

/** Yakıt önceliği: hibrit/elektrik türleri, temel yakıt sözcüğünü geçersiz kılar (örn. "1.5 TSI ETSI"). */
const FUEL_RANK: Record<FuelType, number> = {
  'plug-in-hybrid': 7,
  hybrid: 5,
  'mild-hybrid': 6,
  electric: 8,
  lpg: 3,
  cng: 3,
  'flex-fuel': 3,
  diesel: 2,
  petrol: 1,
};

/**
 * Hacme veya güce bitişik yazılmış motor teknolojisi: "1.2DIG-T", "DIG-T160", "1.6TDCI".
 * Tek harf ("1.6d") burada çözülmez; "D" DIG-T / DCI içinden koparılmaz.
 * Uzun takma adlar önce denenir ("BLUEDCI" → DCI + artık değil).
 */
const GLUED_TECH: { alias: string; canon: string }[] = [
  ['BLUEDCI', 'BLUEDCI'],
  ['BLUEHDI', 'BLUEHDI'],
  ['ECOBOOST', 'ECOBOOST'],
  ['ECOBLUE', 'ECOBLUE'],
  ['PURETECH', 'PURETECH'],
  ['MULTIJET', 'MULTIJET'],
  ['E-POWER', 'E-POWER'],
  ['EPOWER', 'E-POWER'],
  ['DIG-T', 'DIG-T'],
  ['DIGT', 'DIG-T'],
  ['IG-T', 'IG-T'],
  ['IGT', 'IG-T'],
  ['TDCI', 'TDCI'],
  ['TFSI', 'TFSI'],
  ['CDTI', 'CDTI'],
  ['CRDI', 'CRDI'],
  ['T-GDI', 'T-GDI'],
  ['TGDI', 'T-GDI'],
  ['TCE', 'TCE'],
  ['T-JET', 'T-JET'],
  ['TJET', 'T-JET'],
  ['TSI', 'TSI'],
  ['TDI', 'TDI'],
  ['DCI', 'DCI'],
  ['CDI', 'CDI'],
  ['HDI', 'HDI'],
  ['BLUHDI', 'BLUEHDI'],
  ['PTECH', 'PURETECH'],
  ['GDI', 'GDI'],
]
  .map(([alias, canon]) => ({ alias, canon }))
  .sort((a, b) => b.alias.replace(/-/g, '').length - a.alias.replace(/-/g, '').length);

function matchGluedTech(raw: string): { canon: string; power?: number } | undefined {
  const U = raw.replace(/-/g, '');
  if (!U) return undefined;
  for (const { alias, canon } of GLUED_TECH) {
    const A = alias.replace(/-/g, '');
    if (U === A) return { canon };
    if (U.startsWith(A)) {
      const rest = U.slice(A.length);
      if (/^\d{2,3}$/.test(rest)) {
        const n = Number(rest);
        if (n >= 50 && n <= 800) return { canon, power: n };
      }
    }
  }
  return undefined;
}

export function parseTypeName(typeName: string): ParsedType {
  const raw = typeName
    // Bitişik yazımlar: "TITANIUM1.6i" → "TITANIUM 1.6i"
    .replace(/([A-Za-zÇĞİÖŞÜçğıöşü])(\d[.,]\d)/g, '$1 $2')
    // "BUSI.1.5 DCI" nokta hacmi yutmasın.
    .replace(/\.(\d[.,]\d)/g, '. $1')
    // "(150KW)" güç birimi kaybolmasın; "(211)" PS olarak kalır.
    .replace(/\(\s*(\d{2,4})\s*KW\s*\)/gi, ' $1KW ')
    .replace(/\(\s*(\d{2,4})\s*(?:PS|HP|BG)?\s*\)/gi, ' ($1) ')
    // "105BMT", "TIP.160": güç, kısaltmaya yapışık yazılmış.
    .replace(/(\d{2,3})(BMT|DSG|ACT)\b/gi, '$1 $2')
    .replace(/\bTIP\.(\d{2,3})\b/gi, 'TIP $1')
    // Fiat yazımları: "M.JET 120", "T.JET180", "G.PUNTO", "HATCBACK".
    .replace(/\bHATCBACK\b/gi, 'HB')
    .replace(/\bG\.\s*PUNTO\b/gi, 'PUNTO')
    .replace(/\bT\.JET/gi, 'T-JET')
    .replace(/\bM\.JET/gi, 'M-JET')
    .replace(/\bE\.TORQ/gi, 'E-TORQ')
    .replace(/\b(M-JET|T-JET)(\d{2,3})/gi, '$1 $2')
    .replace(/(\d{2,3})DCT/gi, '$1 DCT')
    .replace(/(\d{2,3})(DIZEL|DIESEL|CDTI|CTDI)\b/gi, '$1 $2')
    .replace(/\bB(10|12|14)\s+X(EL|ER|FT|FL)\b/gi, 'B$1X$2')
    // "1.4 D 4D" dizel ailesidir. "HYB." ve "HIBRID" hibrittir; "M.HYB" mild hybrid.
    .replace(/\bD\s+4D\b/gi, 'D-4D')
    .replace(/\bM\.HYB\b/gi, 'MHEV')
    .replace(/\bHYB\./gi, 'HYBRID ')
    .replace(/(\d)\s+(KAPI)\b/gi, '$1$2')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  // Model kodu ile motor tanımı bitişikse ayır: "IS200t" → "IS 200t", "GS300h" → "GS 300h"
  const glued = /^([A-Z]{2,3})(\d{3}[a-z]{0,2})$/.exec(raw[0] ?? '');
  if (glued) raw.splice(0, 1, glued[1]!, glued[2]!);
  const out: ParsedType = { prefix: [], rest: [], tech: [], awd: false };
  let seenAttr = false;
  let fuelRank = 0;
  const setFuel = (f: FuelType | undefined) => {
    if (f && FUEL_RANK[f] > fuelRank) {
      out.fuel = f;
      fuelRank = FUEL_RANK[f];
    }
  };

  for (let i = 0; i < raw.length; i++) {
    const tok = raw[i]!;
    const T = up(tok).replace(/[,;]$/, '');
    let attr = false;

    // Güç: "(115)", "115PS", "115 PS", "110KW", "150HP", "150BG"
    // Parantezdeki 4 hane her zaman PS değildir. 1600 üstü veya yüzün katı büyük sayılar
    // TSB'de cc'dir: "(4691)", "(6400)", "(1795)". 1000–1600 arası çıplak sayı güncel
    // elektrikli/hiper otomobil gücü olabilir: "(1034)", "(1156)". Birimli yazım (PS/kW) ayrıca okunur.
    const paren = /^\((\d{2,4})\)$/.exec(T);
    const unit = /^(\d{2,4})(PS|HP|BG|KW|BHP)$/.exec(T);
    const unitNext = /^(\d{2,4})$/.exec(T) && /^(PS|HP|BG|KW|BHP)$/.test(up(raw[i + 1] ?? ''));
    const chassis = paren ? PORSCHE_CHASSIS.has(paren[1]!) : false;
    if (paren && chassis) {
      out.generationHint ??= paren[1];
      attr = true;
    } else if (paren && paren[1]!.length === 4) {
      const n = Number(paren[1]);
      const electric = /\b(ELECTRIC|ELEKTRIK|EV)\b/.test(raw.map(up).join(' '));
      const asCc = !electric && (n > 1600 || (n >= 2500 && n % 100 === 0));
      if (asCc) {
        if (out.displacementL === undefined) out.displacementL = Math.round(n / 100) / 10;
      } else if (out.powerPs === undefined && n >= 50) {
        out.powerPs = n;
      }
      attr = true;
    } else if (paren && out.powerPs === undefined) {
      const n = Number(paren[1]);
      if (n >= 50 && n <= 1200) out.powerPs = n;
      attr = true;
    } else if (unit || unitNext) {
      const n = Number(unit ? unit[1] : T);
      const u = unit ? unit[2] : up(raw[++i] ?? '');
      if (u === 'KW') out.powerKw ??= n;
      else if (u === 'HP' || u === 'BHP') out.powerHp ??= n;
      else out.powerPs ??= n;
      attr = true;
    }
    // "84.5KW", "226.1KW": motor gücü. "7.4KW" tek haneli olduğu için aşağıdaki şarj kuralında kalır.
    const decKw = /^(\d{2,3}[.,]\d)KW$/.exec(T);
    if (!attr && decKw) {
      const kw = Number(decKw[1]!.replace(',', '.'));
      if (kw <= 22) {
        if (up(raw[i + 1] ?? '') === 'OBC') i++;
        out.tech.push('OBC');
      } else {
        out.powerKw ??= kw;
        if (!out.fuel) setFuel('electric');
      }
      attr = true;
    }
    const kwh = /^(\d{2,3}(?:[.,]\d)?)KWH$/.exec(T);
    if (!attr && kwh) {
      out.batteryKwh = Number(kwh[1]!.replace(',', '.'));
      setFuel('electric');
      out.tech.push(`${out.batteryKwh}kWh`);
      attr = true;
    }

    // İki ondalık: "6.75", "1.25i". "1.416V" buna uymaz (supap sayısı ayrı ele alınır).
    const disp2 = /^(\d{1,2})[.,](\d{2})([ILD])?$/.exec(T);
    if (!attr && disp2 && out.displacementL === undefined) {
      out.displacementL = Number(`${disp2[1]}.${disp2[2]}`);
      if (disp2[3] === 'I') setFuel('petrol');
      if (disp2[3] === 'D') setFuel('diesel');
      attr = true;
    }

    // Hacim: "1.6", "1,6", "1.6i", "1.6L", "2.0TDI", "1.4TSI", "1.6TDCI", "1.2DIG-T", "1.416V"
    // Tek harf yakıt kısaltması ("1.6i", "1.5d") yalnızca sonek TAM O harfse uygulanır.
    // "1.2DIG-T" içindeki D dizel değildir. "6.75" tek haneye kesilmez.
    const disp = /^(\d)[.,](\d)(.*)$/.exec(T);
    const valveRest = /^(?:8|12|16|20|24)V$/.test(disp?.[3] ?? '');
    if (!attr && disp && out.displacementL === undefined && (!/^\d/.test(disp[3] ?? '') || valveRest)) {
      const rest = valveRest ? '' : (disp[3] ?? '');
      // "7.4KW" şarj gücü veya kW'dir; 7.4 litre hacim değildir.
      if (up(rest) === 'KW') {
        // Ondalıklı kW (7.4KW, 7.4KW OBC) yerleşik şarj gücüdür; motor gücü veya hacim değildir.
        if (up(raw[i + 1] ?? '') === 'OBC') i++;
        out.tech.push('OBC');
        attr = true;
      }
      const glued = !attr && rest ? matchGluedTech(rest) : undefined;
      const letter = /^[ILTD]$/.test(rest) ? rest : undefined;
      if (!attr) out.displacementL = Number(`${disp[1]}.${disp[2]}`);
      if (!attr && letter === 'I') setFuel('petrol');
      if (!attr && letter === 'D') setFuel('diesel');
      // "1.0T" / "1.5T": turbo benzin. Dizel "1.6TDI" yapışık aile olarak yukarıda ayrılır.
      if (!attr && letter === 'T') setFuel('petrol');
      if (glued) {
        const f = fuelOf(glued.canon);
        if (f) {
          setFuel(f);
          out.tech.push(glued.canon);
        }
        if (glued.power !== undefined && out.powerPs === undefined) out.powerPs = glued.power;
      } else if (!attr && rest && !letter) {
        const f = fuelOf(rest);
        if (f) {
          setFuel(f);
          out.tech.push(storedTech(rest));
        }
      }
      attr = true;
    }

    // Teknolojiye bitişik güç, hacimsiz: "DIG-T160", "E-POWER" (güç sonraki sözcüktedir).
    if (!attr) {
      const glued = matchGluedTech(T);
      if (glued) {
        const f = fuelOf(glued.canon);
        if (f) {
          setFuel(f);
          out.tech.push(glued.canon);
          if (glued.power !== undefined && out.powerPs === undefined) out.powerPs = glued.power;
          attr = true;
        }
      }
    }

    // Opel motor kodu: "B14XEL", "B10XFT". Ayrı model değildir; güç hemen ardından yazılır.
    if (!attr && /^B\d{2}X[A-Z]{2}$/.test(T)) {
      out.tech.push(T);
      attr = true;
    }
    if (!attr) {
      const f = fuelOf(T);
      if (f) {
        setFuel(f);
        out.tech.push(storedTech(tok));
        attr = true;
      }
    }
    // Motor tanımının parçası olan ama donanım olmayan sözcükler: "1.2 TSI BMT 105", "1.5 DCI E6 110".
    // ACT (silindir devre dışı bırakma) ayrı bir motor sürümüdür; motor tanımına eklenir.
    // "1.0 T 100" içindeki T donanım adı değildir; turbo benzin işaretidir.
    if (!attr && T === 'T' && /^\d[.,]\d/.test(up(raw[i - 1] ?? ''))) {
      setFuel('petrol');
      attr = true;
    }
    if (!attr && seenAttr && NEUTRAL.has(T)) {
      if (T === 'ACT' || T === 'TWINCHARGER' || T === 'BITURBO') out.tech.push(tok);
      attr = true;
    }
    // Teknoloji sözcüğüne bitişik güç: "ECOBOOST 180", "MULTIAIR 170" (motor sözcüğünün hemen ardından)
    if (!attr && /^\d{2,3}$/.test(T) && seenAttr && out.powerPs === undefined && out.powerHp === undefined && out.powerKw === undefined) {
      const prev = up(raw[i - 1] ?? '');
      const next = up(raw[i + 1] ?? '');
      // "3.0 50 TDI": 50, Audi'nin satış kademesidir. Güç olarak yazılmaz.
      if (AUDI_BADGE.has(T) && /^(TDI|TFSI|TSI|FSI|ETRON|E-TRON)$/.test(next)) {
        attr = true;
      } else {
      // "2.0 ST 250": ST/RS performans modelidir, sonraki sayı güçtür. "ST LINE" donanım paketidir.
      const afterPerformance = /^(ST|RS|RS500)$/.test(prev) && next !== 'LINE';
      // "TCE EDC 120", "TCE X-TRONIC 100": güç, şanzıman sözcüğünün ardında da yazılır.
      const prevKey = prev.replace(/\.$/, '');
      const afterTrans = AUTO.has(prev) || AUTO.has(prevKey) || DCT.has(prevKey) || AMT.has(prevKey) || CVT.has(prevKey) || MANUAL.has(prevKey);
      // "MULTIJET II 85": II motor serisidir; güç ondan sonra yazılır.
      const prev2 = up(raw[i - 2] ?? '').replace(/\.$/, '');
      const afterEngineSeries = ROMAN.test(prev) && fuelOf(prev2) !== undefined;
      const afterEngineCode = /^B\d{2}X[A-Z]{2}$/.test(prev);
      // "1.0 T 100": T turbo işaretidir, sonraki sayı güçtür.
      const afterTurboMark = prev === 'T' && /^\d[.,]\d/.test(up(raw[i - 2] ?? ''));
      if (fuelOf(prev) || /^\d[.,]\d/.test(prev) || NEUTRAL.has(prev) || afterPerformance || afterTrans || afterEngineSeries || afterEngineCode || afterTurboMark || /^TIP/.test(prev) || /^EV\d+$/.test(prev)) {
        const n = Number(T);
        if (n >= 50 && n <= 800) {
          out.powerPs = n;
          attr = true;
        }
      }
      }
    }

    if (!attr) {
      const key = T.replace(/\.$/, '');
      if (AUTO.has(T) || AUTO.has(key)) {
        out.transmission ??= { type: 'automatic' };
        attr = true;
      } else if (DCT.has(key)) {
        out.transmission = { type: 'dual-clutch', name: DCT.get(key) };
        attr = true;
      } else if (AMT.has(key)) {
        out.transmission = { type: 'automated-manual', name: AMT.get(key) };
        attr = true;
      } else if (CVT.has(key)) {
        out.transmission = { type: 'cvt', name: CVT.get(key) };
        attr = true;
      } else if (MANUAL.has(key)) {
        out.transmission ??= { type: 'manual' };
        attr = true;
      } else if (AWD.has(key)) {
        out.awd = true;
        attr = true;
      } else {
        const body = BODY.find(([re]) => re.test(key));
        // Passat CC ayrı modeldir (Volkswagen CC). Megane CC gibi kullanımlar kabrio gövdesidir.
        const passatCc = key === 'CC' && up(out.prefix[0] ?? '') === 'PASSAT' && out.prefix.length === 1 && !seenAttr;
        if (body && !passatCc) {
          out.body ??= body[1];
          attr = true;
        }
      }
    }
    // Vites sayısı: "6 ILERI", "7 VITES"
    if (!attr && /^\d$/.test(T) && /^(ILERI|VITES|IL\.)$/.test(up(raw[i + 1] ?? '').replace(/İ/g, 'I'))) {
      if (out.transmission) out.transmission.gears = Number(T);
      i++;
      attr = true;
    }

    // "MULTIJET II 85" / "FIRE EVO II 69": roma rakamı motor serisidir, kasa nesli değil.
    const seriesPrev = up(raw[i - 1] ?? '').replace(/\.$/, '');
    const seriesNext = up(raw[i + 1] ?? '');
    if (!attr && ROMAN.test(T) && fuelOf(seriesPrev) !== undefined && /^\d{2,3}$/.test(seriesNext)) attr = true;
    // "GOLF GTI VI" / "FOCUS III TITANIUM": nesil rakamı model ile donanım arasında da durur.
    // Yakıt bayrağını açmaz; sonraki donanım sözcüğü model adının yanında kalır. "X" nesil değildir (ID.6 X).
    if (!attr && out.prefix.length >= 1 && out.generationHint === undefined && (ROMAN.test(T) || MK.test(T))) {
      out.generationHint = T.replace(/^MK\.?/, 'MK');
      continue;
    }

    // İlk sözcük daima model adının parçasıdır ("CC 1.4 TSI": CC burada gövde değil, model).
    if (i === 0 && attr && !paren && !disp) {
      attr = false;
      out.body = undefined;
      out.transmission = undefined;
      out.awd = false;
      out.tech = [];
      out.fuel = undefined;
      fuelRank = 0;
    }
    if (attr) seenAttr = true;
    else if (!seenAttr) out.prefix.push(tok);
    else out.rest.push(tok);
  }

  // Nesil ipucu döngüde yakalanmadıysa: modelden hemen sonraki roma rakamı veya MKn.
  const g = out.prefix[1] ? up(out.prefix[1]) : '';
  if (!out.generationHint && (ROMAN.test(g) || MK.test(g))) {
    out.generationHint = g.replace(/^MK\.?/, 'MK');
    out.prefix.splice(1, 1);
  }
  // "GTE PHEV" / "GTE HIBRIT": yakıt zaten GTE veya eHybrid ile belli. Ek sözcük motor adı değildir.
  // "911 (992) GT3": kasa kodu güç değildir. GT3 motor kimliği olarak kalır; güç uydurulmaz.
  if (out.generationHint && PORSCHE_CHASSIS.has(out.generationHint)) {
    const perf = [...out.prefix, ...out.rest].find((w) => /^(GT2|GT3|GT4|TURBO)$/i.test(up(w)));
    if (perf && !out.tech.some((t) => up(t) === up(perf))) out.tech.push(perf);
  }
  const hasSpecificHybrid = out.tech.some((t) => ['GTE', 'EHYBRID', 'E-HYBRID', 'ETSI', 'E-TSI'].includes(up(t)));
  if (hasSpecificHybrid) out.tech = out.tech.filter((t) => !['PHEV', 'HIBRIT', 'HYBRIT', 'PLUGIN', 'PLUG-IN', 'PLUG-IN-HYBRID'].includes(up(t)));
  return out;
}

export interface ModelResolution {
  model: string;
  /** Model adından sonra kalan ön ek sözcükleri (donanım). */
  trimWords: string[];
}

/** Damerau-Levenshtein uzaklığı ≤ 1 mi (yazım hatası tespiti). */
export function nearlyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  const [sh, lo] = a.length < b.length ? [a, b] : [b, a];
  return sh.slice(i) === lo.slice(i + 1);
}

/** Model adı olmayan baş sözcükler ("NEW GOLF", "THE BEETLE", "MY 2017 …"). */
const LEADING_NOISE = new Set(['NEW', 'YENI', 'THE', 'ALL', 'MY', 'ALL-NEW', 'MC']);
/** Model adına birleşen ön sözcükler ("GRAND C-MAX", "GRAND SCENIC"). */
const JOINING = new Set(['GRAND', 'CROSS', 'BIG', 'LAND']);
/**
 * Hiçbir zaman alt model sayılmayan sözcükler.
 * Makyaj kısaltmaları, performans sürümleri (ST, RS — bunlar modelin motor varyantıdır)
 * ve donanım paketleri (Cool, Trend, Titanium, ST-Line …).
 */
const NEVER_SUBMODEL = new Set([
  'MCA', 'FL', 'MY', 'NEW', 'YENI', 'FACELIFT', 'MCA1', 'MCAI', 'ICA', 'ICA3',
  'ST', 'RS', 'RS500', 'ST-LINE', 'STLINE', 'GT-LINE', 'GTLINE', 'RS-LINE', 'RSLINE',
  'TREND', 'TITANIUM', 'GHIA', 'STYLE', 'COMFORTLINE', 'HIGHLINE', 'TEKNA', 'VISIA', 'ICON', 'JOY',
  'TOUCH', 'DYNAMIQUE', 'PRIVILEGE', 'EXPRESSION', 'EQUILIBRE', 'AUTHENTIQUE', 'EXTREME', 'EXCEPTION',
  'CONNECT', 'OUTDOOR', 'TECHNO', 'INTENS', 'ESPRIT', 'INITIALE', 'EVOLUTION',
  'AMBIENTE', 'COOL', 'COLLECTION', 'TRENDLINE', 'AMBITION', 'ALLURE', 'ELEGANCE',
  'AVENTURA', 'IMPRESSION', 'BUSINESS', 'R-LINE', 'RLINE',
]);

/** "EB" ve "E.BOOST", EcoBoost'un kısaltmasıdır; ayrı motor kimliği üretmez. */
function storedTech(tok: string): string {
  const t = up(tok).replace(/[.,]$/, '');
  if (t === 'EB' || t === 'E.BOOST' || t === 'EBOOST' || t === 'E-BOOST') return 'ECOBOOST';
  if (t === 'B.DCI' || t === 'BDCI') return 'BLUEDCI';
  if (t === 'F.HYBRID' || t === 'F-HYBRID') return 'HYBRID';
  if (t === 'ETECH') return 'E-TECH';
  if (t === 'M-JET' || t === 'M.JET' || t === 'MJET' || t === 'MJT') return 'MULTIJET';
  if (t === 'T.JET' || t === 'TJET' || t === 'T-JET') return 'T-JET';
  if (t === 'E.TORQ' || t === 'ETORQ' || t === 'E-TORQ') return 'E-TORQ';
  if (t === 'HIBRID') return 'HYBRID';
  if (t === 'CTDI') return 'CDTI';
  if (t === 'PTECH') return 'PURETECH';
  if (t === 'BLUHDI') return 'BLUEHDI';
  if (t === 'ETENSE') return 'E-TENSE';
  if (t === 'TGDI') return 'T-GDI';
  if (t === 'HEV' || t === 'E:HEV' || t === 'EHEV') return 'HYBRID';
  if (t === 'VTEC' || t === 'V-TEC' || t === 'IVTEC' || t === 'I-VTEC') return 'i-VTEC';
  return tok.replace(/[.,]$/, '');
}

/**
 * Bir markanın bütün tipleri üzerinden model adlarını çözer.
 * Dönen fonksiyon, bir tipin `prefix` sözcüklerinden modeli ve donanım sözcüklerini ayırır.
 */
export function resolveModels(parsed: ParsedType[]): (p: ParsedType) => ModelResolution {
  const strip = (prefix: string[]) => {
    let i = 0;
    while (i < prefix.length - 1 && LEADING_NOISE.has(up(prefix[i]!))) i++;
    return prefix.slice(i);
  };
  const afterAttr = new Set<string>(); // motor bilgisinden sonra görülen sözcükler (donanım işareti)
  const heads = new Map<string, number>(); // ilk sözcük sıklığı
  const followers = new Map<string, Set<string>>(); // ikinci sözcük → önünde görülen ilk sözcükler
  const pairs = new Map<string, number>();
  for (const p of parsed) {
    const pre = strip(p.prefix);
    for (const w of p.rest) afterAttr.add(up(w));
    for (const w of pre.slice(2)) afterAttr.add(up(w));
    const [a, b] = pre;
    if (a) heads.set(up(a), (heads.get(up(a)) ?? 0) + 1);
    if (a && b) {
      const B = up(b);
      if (!followers.has(B)) followers.set(B, new Set());
      followers.get(B)!.add(up(a));
      pairs.set(`${up(a)} ${B}`, (pairs.get(`${up(a)} ${B}`) ?? 0) + 1);
    }
  }
  // "X1 SDRIVE16D": sDrive/xDrive tanımı motor/çekiş bilgisidir, alt model değildir.
  // VERSO birden çok gerçek modeldir (Corolla Verso, Proace Verso).
  // CROSS yalnızca Corolla, Yaris ve Egea'da model adıdır. 500X Cross, Panda Cross ve V40 Cross ana modelde kalır.
  const WITH_FIRST = new Set(['VERSO']);
  const CROSS_MODEL = new Set(['COROLLA', 'YARIS', 'EGEA']);
  const trimLike = (W: string) =>
    !WITH_FIRST.has(W) &&
    (W.includes('.') || /^[SX]DRIVE/.test(W) || afterAttr.has(W) || NEVER_SUBMODEL.has(W) || [...afterAttr].some((t) => t.length >= 5 && nearlyEqual(t, W)));
  const isHead = (W: string) => (heads.get(W) ?? 0) >= 3;
  return (p) => {
    const [first, second, ...more] = strip(p.prefix);
    if (!first) return { model: '', trimWords: [] };
    const F = up(first);
    if (!second) return { model: first, trimWords: [] };
    const S = up(second);
    if (JOINING.has(F)) return { model: `${first} ${second}`, trimWords: more };
    // Harf kodu + numara aralıklı yazılmış model: "XC 90 2.0", "DS 3 1.6", "RAV 4 2.0". Yalnızca satırda motor bilgisi
    // (hacim veya güç) AYRICA yazıyorsa: aksi hâlde numara motor tanımıdır ("RX 300", "FX 37", "LC 500").
    // 3 harfli önekte 3 haneli numara özel versiyon tanımıdır ("DBS 770", "DBX 707"), birleştirilmez.
    const hasEngine = p.displacementL !== undefined || p.powerPs !== undefined || p.powerKw !== undefined || p.powerHp !== undefined || p.tech.length > 0;
    if (hasEngine && /^[A-Z]{1,3}$/.test(F) && /^\d{1,3}$/.test(S) && !(F.length === 3 && S.length === 3)) {
      return { model: `${first} ${second}`, trimWords: more };
    }
    // "FOCUS C-MAX": ikinci sözcük de markada başlı başına bir model → o model
    const crossModel = S === 'CROSS' && CROSS_MODEL.has(F);
    if (isHead(S) && isHead(F) && !trimLike(S) && !WITH_FIRST.has(S) && !crossModel) return { model: second, trimWords: more };
    const sub = (pairs.get(`${F} ${S}`) ?? 0) >= 3 && /[A-Z]/.test(S) && (crossModel || (!trimLike(S) && ((followers.get(S)?.size ?? 0) === 1 || WITH_FIRST.has(S))));
    if (sub) return { model: `${first} ${second}`, trimWords: more };
    return { model: first, trimWords: [second, ...more] };
  };
}
