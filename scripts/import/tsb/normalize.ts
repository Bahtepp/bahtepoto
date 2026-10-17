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

const DIESEL = new Set(['TDCI', 'TDI', 'DCI', 'CRDI', 'CRDİ', 'HDI', 'BLUEHDI', 'E-HDI', 'JTD', 'JTDM', 'MULTIJET', 'MJET', 'MJT', 'CDTI', 'CDI', 'D4D', 'D-4D', 'DIZEL', 'DIESEL', 'SDV6', 'TDV6', 'SD4', 'TD4', 'ED4', 'CRD', 'DTEC', 'I-DTEC', 'IDTEC', 'SKYACTIV-D', 'VCDI', 'D-CAT', 'BLUETEC', 'TDS', 'SDI', 'ECOBLUE', 'BLUEDCI', 'CRDI4', 'DDIS', 'DDIS4', 'TDDI', 'TDCI4', 'D-4D4', 'XDI', 'CRTD', 'BITDI', 'BITURBODIESEL', 'TDCİ']);
const PETROL = new Set(['EB', 'E.BOOST', 'TSI', 'TFSI', 'FSI', 'TCE', 'ECOBOOST', 'VVT', 'VVTI', 'VVT-I', 'DUAL-VVT', 'VTEC', 'I-VTEC', 'IVTEC', 'MPI', 'GDI', 'T-GDI', 'TGDI', 'PURETECH', 'THP', 'VTI', 'TJET', 'T-JET', 'MULTIAIR', 'FIRE', 'TB', 'TBI', 'BENZIN', 'BENZINLI', 'SCE', 'TI-VCT', 'TIVCT', 'DURATEC', 'ECOTEC', 'SIDI', 'TURBOJET', 'GTI', 'EVO', 'DIG-T', 'SKYACTIV-G', 'TSI-ACT', 'ECO-G', 'FIREFLY']);
const HYBRID = new Set(['HYBRID', 'HIBRIT', 'HEV', 'FULL-HYBRID', 'E-TECH-HYBRID', 'HYBRIT', 'SELF-CHARGING']);
const PHEV = new Set(['PHEV', 'PLUG-IN', 'E-HYBRID', 'EHYBRID', 'PLUGIN', 'PLUG-IN-HYBRID', 'GTE']);
const MHEV = new Set(['MHEV', 'ETSI', 'E-TSI', 'MILD-HYBRID', 'MILD', '48V', 'MHYBRID']);
const ELECTRIC = new Set(['EV', 'BEV', 'ELEKTRIK', 'ELEKTRIKLI', 'ELECTRIC', 'E-TRON', 'KWH']);
const LPG = new Set(['LPG', 'BI-FUEL', 'BIFUEL']);
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
  ['MULTIDRIVE', 'Multidrive'],
  ['E-CVT', 'e-CVT'],
  ['ECVT', 'e-CVT'],
  ['MULTITRONIC', 'Multitronic'],
  ['LINEARTRONIC', 'Lineartronic'],
  ['IVT', 'IVT'],
]);
const MANUAL = new Set(['MANUEL', 'MT', 'M/T', 'MANUAL', 'DUZ']);
const AWD = new Set(['4X4', '4MOTION', 'QUATTRO', 'XDRIVE', 'AWD', '4WD', '4MATIC', 'ALL4', 'Q4', '4X4.', 'ALLGRIP', '4MOTION.', 'E-FOUR', 'ALLWHEELDRIVE', '4XMOTION']);
const BODY: [RegExp, BodyType][] = [
  [/^3K$|^3KAPI$|^3D$|^3DR$/, 'hatchback-3'],
  [/^4K$|^4KAPI$|^SEDAN$|^4D$|^4DR$|^SD$|^SDN$/, 'sedan-4'],
  [/^5K$|^5KAPI$|^HB$|^HATCHBACK$|^5D$|^5DR$|^HB5$/, 'hatchback-5'],
  [/^SW$|^VARIANT$|^ESTATE$|^STATION$|^WAGON$|^KOMBI$|^TOURER$|^ST\.WAGON$|^SPORTSWAGON$|^AVANT$|^TOURING$|^BREAK$|^SPORTBRAKE$|^SPORTS\s?TOURER$|^GRANDTOUR$|^GRANDTOURER$/, 'wagon'],
  [/^COUPE$|^COUPÉ$|^KUPE$/, 'coupe'],
  [/^CABRIO$|^CABRIOLET$|^CC$|^CABRIOLE$|^ROADSTER$|^SPIDER$|^SPYDER$|^KABRIYOLE$/, 'cabrio'],
  [/^PICK-?UP$|^PICKUP$|^DOUBLECAB$|^D\/C$|^S\/C$|^CIFTKABIN$|^TEKKABIN$/, 'pickup'],
  [/^VAN$|^PANELVAN$|^PANEL$|^KAMYONET$|^MINIBUS$|^COMBI$|^KOMBİ$/, 'van'],
];
/** Motor tanımının parçası olup donanım sayılmayan sözcükler (emisyon sınıfı, start-stop vb.). */
const NEUTRAL = new Set([
  'BMT', 'ACT', 'BLUEMOTION', 'S&S', 'SS', 'START&STOP', 'START-STOP', '16V', '8V', '12V', '20V', '24V', 'TURBO', 'TWINCHARGER',
  'BITURBO', 'E5', 'E6', 'E6D', 'E6.2', 'EU5', 'EU6', 'EURO5', 'EURO6', 'ENERGY', 'ECOFLEX', 'ECONETIC', 'V6', 'V8', 'V10', 'V12',
]);
const ROMAN = /^(II|III|IV|V|VI|VII|VIII|IX|X)$/;
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

export function parseTypeName(typeName: string): ParsedType {
  const raw = typeName
    // Bitişik yazımlar: "TITANIUM1.6i" → "TITANIUM 1.6i"
    .replace(/([A-Za-zÇĞİÖŞÜçğıöşü])(\d[.,]\d)/g, '$1 $2')
    .replace(/\(\s*(\d{2,4})\s*(?:PS|HP|BG|KW)?\s*\)/gi, ' ($1) ')
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
    const paren = /^\((\d{2,4})\)$/.exec(T);
    const unit = /^(\d{2,4})(PS|HP|BG|KW|BHP)$/.exec(T);
    const unitNext = /^(\d{2,4})$/.exec(T) && /^(PS|HP|BG|KW|BHP)$/.test(up(raw[i + 1] ?? ''));
    if (paren && out.powerPs === undefined) {
      out.powerPs = Number(paren[1]);
      attr = true;
    } else if (unit || unitNext) {
      const n = Number(unit ? unit[1] : T);
      const u = unit ? unit[2] : up(raw[++i] ?? '');
      if (u === 'KW') out.powerKw ??= n;
      else if (u === 'HP' || u === 'BHP') out.powerHp ??= n;
      else out.powerPs ??= n;
      attr = true;
    }

    // Hacim: "1.6", "1,6", "1.6i", "1.6L", "2.0TDI", "1.4TSI", "1.6TDCI"
    const disp = /^(\d)[.,](\d)(I|L|T|D)?([A-Z-]*)$/.exec(T);
    if (!attr && disp && out.displacementL === undefined) {
      out.displacementL = Number(`${disp[1]}.${disp[2]}`);
      if (disp[3] === 'I') setFuel('petrol');
      if (disp[3] === 'D') setFuel('diesel');
      const glued = disp[4];
      if (glued) {
        const f = fuelOf(glued);
        if (f) {
          setFuel(f);
          out.tech.push(glued);
        }
      }
      attr = true;
    }

    if (!attr) {
      const f = fuelOf(T);
      if (f) {
        setFuel(f);
        out.tech.push(tok);
        attr = true;
      }
    }
    // Motor tanımının parçası olan ama donanım olmayan sözcükler: "1.2 TSI BMT 105", "1.5 DCI E6 110".
    // ACT (silindir devre dışı bırakma) ayrı bir motor sürümüdür; motor tanımına eklenir.
    if (!attr && seenAttr && NEUTRAL.has(T)) {
      if (T === 'ACT' || T === 'TWINCHARGER' || T === 'BITURBO') out.tech.push(tok);
      attr = true;
    }
    // Teknoloji sözcüğüne bitişik güç: "ECOBOOST 180", "MULTIAIR 170" (motor sözcüğünün hemen ardından)
    if (!attr && /^\d{2,3}$/.test(T) && seenAttr && out.powerPs === undefined && out.powerHp === undefined && out.powerKw === undefined) {
      const prev = up(raw[i - 1] ?? '');
      if (fuelOf(prev) || /^\d[.,]\d/.test(prev) || NEUTRAL.has(prev)) {
        const n = Number(T);
        if (n >= 50 && n <= 800) {
          out.powerPs = n;
          attr = true;
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
        if (body) {
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

  // Nesil ipucu: modelden hemen sonra gelen roma rakamı veya MKn.
  const g = out.prefix[1] ? up(out.prefix[1]) : '';
  if (ROMAN.test(g) || MK.test(g)) {
    out.generationHint = g.replace(/^MK\.?/, 'MK');
    out.prefix.splice(1, 1);
  }
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
const LEADING_NOISE = new Set(['NEW', 'YENI', 'THE', 'ALL', 'MY', 'ALL-NEW']);
/** Model adına birleşen ön sözcükler ("GRAND C-MAX", "GRAND SCENIC"). */
const JOINING = new Set(['GRAND', 'CROSS', 'BIG']);
/** Hiçbir zaman alt model sayılmayan sözcükler (makyaj / model yılı kısaltmaları). */
const NEVER_SUBMODEL = new Set(['MCA', 'FL', 'MY', 'NEW', 'YENI', 'FACELIFT', 'MCA1', 'MCAI', 'ICA', 'ICA3']);

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
  const trimLike = (W: string) => W.includes('.') || /^[SX]DRIVE/.test(W) || afterAttr.has(W) || NEVER_SUBMODEL.has(W) || [...afterAttr].some((t) => t.length >= 5 && nearlyEqual(t, W));
  const isHead = (W: string) => (heads.get(W) ?? 0) >= 3;
  return (p) => {
    const [first, second, ...more] = strip(p.prefix);
    if (!first) return { model: '', trimWords: [] };
    const F = up(first);
    if (!second) return { model: first, trimWords: [] };
    const S = up(second);
    if (JOINING.has(F)) return { model: `${first} ${second}`, trimWords: more };
    // "FOCUS C-MAX": ikinci sözcük de markada başlı başına bir model → o model
    if (isHead(S) && isHead(F) && !trimLike(S)) return { model: second, trimWords: more };
    const sub = (followers.get(S)?.size ?? 0) === 1 && (pairs.get(`${F} ${S}`) ?? 0) >= 3 && !trimLike(S) && /[A-Z]/.test(S);
    if (sub) return { model: `${first} ${second}`, trimWords: more };
    return { model: first, trimWords: [second, ...more] };
  };
}
