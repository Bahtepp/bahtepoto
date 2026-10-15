/**
 * TSB içe aktarma kuralları (insan kararı, tek yerde):
 * - Kapsam: otomobil ve hafif ticari binek türevleri. Kamyon, çekici, otobüs, minibüs, panelvan,
 *   karavan, motosiklet ve iş makineleri alınmaz.
 * - Marka adlarının katalog markalarına eşlenmesi.
 */

export interface BrandRule {
  id: string;
  name: string;
  /** Model adının başına eklenecek ön ek (örn. TSB "RANGE ROVER | SPORT" → Land Rover "Range Rover Sport"). */
  modelPrefix?: string;
  /** Bu marka adıyla listelenenler resmi distribütör dışı ithal araç (örn. "FORD /USA"). */
  imported?: boolean;
}

/** TSB marka adı → katalog markası. Listede olmayanlar ad üzerinden otomatik eşlenir. */
export const BRAND_RULES: Record<string, BrandRule> = {
  MERCEDES: { id: 'mercedes-benz', name: 'Mercedes-Benz' },
  'TOFAS-FIAT': { id: 'fiat', name: 'Fiat' },
  FIAT: { id: 'fiat', name: 'Fiat' },
  'RENAULT (OYAK)': { id: 'renault', name: 'Renault' },
  'FORD /USA': { id: 'ford', name: 'Ford', imported: true },
  'DODGE/USA': { id: 'dodge', name: 'Dodge', imported: true },
  'VOLVO-TR': { id: 'volvo', name: 'Volvo' },
  'RANGE ROVER': { id: 'land-rover', name: 'Land Rover', modelPrefix: 'RANGE ROVER' },
  'LAND ROVER': { id: 'land-rover', name: 'Land Rover' },
  BMW: { id: 'bmw', name: 'BMW' },
  DS: { id: 'ds', name: 'DS' },
  MG: { id: 'mg', name: 'MG' },
  GMC: { id: 'gmc', name: 'GMC' },
  BYD: { id: 'byd', name: 'BYD' },
  KIA: { id: 'kia', name: 'Kia' },
  SEAT: { id: 'seat', name: 'Seat' },
  MINI: { id: 'mini', name: 'Mini' },
  TOGG: { id: 'togg', name: 'Togg' },
  'LYNK-CO': { id: 'lynk-co', name: 'Lynk & Co' },
  'ROLLS-ROYCE': { id: 'rolls-royce', name: 'Rolls-Royce' },
  'ASTON MARTIN': { id: 'aston-martin', name: 'Aston Martin' },
  'ALFA ROMEO': { id: 'alfa-romeo', name: 'Alfa Romeo' },
  'TRUMPCHI/GAC': { id: 'gac', name: 'GAC' },
  'GREAT WALL': { id: 'great-wall', name: 'Great Wall' },
  'DONG FENG': { id: 'dongfeng', name: 'Dongfeng' },
  KGMOBILITY: { id: 'kgm', name: 'KGM' },
  SSANGYONG: { id: 'ssangyong', name: 'SsangYong' },
  'THE LONDON TAXI': { id: 'london-taxi', name: 'The London Taxi' },
};

/** Tamamen kapsam dışı markalar (ağır vasıta, otobüs, karavan, motosiklet, iş makinesi). */
export const EXCLUDED_BRANDS = new Set([
  'ADRIA', 'AKIA', 'AR-BUS', 'ASKAM/FARGO/DESOTO', 'ASTRA', 'AVIA', 'BMC', 'BOZANKAYA', 'BREDAMENARIBUS', 'CARTHAGO', 'CRRC',
  'DAF', 'EMT', 'ETRUSCO', 'GROVE', 'GULERYUZ', 'HABAS', 'HBS', 'HFKANUNI', 'HISCAR', 'HOBBY', 'HYMER', 'IRIZAR', 'ISOBUS',
  'ISUZU', 'KAMAZ', 'KARSAN', 'KENWORTH', 'KNAUS', 'LAIKA', 'MAN', 'MAZ', 'MENARINIBUS', 'MILLER', 'MOTORSIKLET', 'MULTICAR',
  'NEOPLAN', 'OTOKAR/MAGIRUS', 'OTOYOL\\IVECO\\FIAT', 'PETERBILT', 'PIMAKINA', 'SANY', 'SCANIA', 'SCHMIDT', 'SETRA', 'SINOTRUK',
  'SITRAK', 'SOLARIS', 'TADANO FAUN', 'TATRA', 'TCV', 'TEMSA', 'TEZELLER', 'TURKAR', 'TURKKAR', 'WEINSBERG', 'ZIRAI TRAKTOR',
  'ZOOMLION', 'GAZ', 'MAXUS', 'FOTON', 'MEGA', 'ALKE', 'AIXAM', 'KTM', 'PGO', 'PIAGGIO', 'TENAX', 'FOLKVAN', 'CENNTRO',
]);

/** Tip adında geçtiğinde satırı kapsam dışı bırakan sözcükler (Türkçe karakterler katlanmış, büyük harf). */
export const EXCLUDED_WORDS = [
  'KAMYON', 'KAMYONET', 'CEKICI', 'OTOBUS', 'MINIBUS', 'MIDIBUS', 'PANELVAN', 'KASALI', 'SASI', 'FRIGO', 'AMBULANS', 'CENAZE',
  'SERVIS', 'OKUL', 'TURIZM', 'CAMLIVAN', 'KOMBIVAN', 'FRIGORIFIK', 'TANKER', 'DAMPER', 'MIXTO', 'KAPALIKASA', 'KAPALI KASA',
  'PANEL VAN', 'P.VAN', 'PAN.VAN', 'K.NET', 'KAMYONETI', 'ACIK KASA', 'TEKKABIN', 'BETON', 'VINC', 'CEKICI',
];

/** Yalnızca ticari/ağır vasıta olarak satılan model adları (tipin ilk sözcüğü). */
export const EXCLUDED_MODEL_PREFIXES = [
  'TRANSIT', 'TRAN.', 'TRA.', 'TRANS.', 'TR.', 'T.CUSTOM', 'SPRINTER', 'ESPRINTER', 'E-SPRINTER', 'CRAFTER', 'CRAFT.', 'DUCATO',
  'MASTER', 'DAILY', 'JUMPER', 'BOXER', 'MOVANO', 'LT', 'VARIO', 'ATEGO', 'ACTROS', 'AROCS', 'AXOR', 'CARGO', 'F-MAX',
  'CANTER', 'TRANSPORTER', 'T.PORTER', 'TPORTER', 'TRAFICPANELVAN', 'TRAFICMULTIX', 'UNIMOG', 'ECONIC', 'E-TRANSIT', 'H350',
  'MIDLUM', 'MAGNUM', 'PREMIUM', 'KERAX', 'BOXER', 'E-JOURNEY', 'EXPRESS', 'KANGOOEXPRESSFRIGOMAXI',
];

/**
 * Ana modelden ayrı satılmış bir alt modeli ya da nesil dönemi ana modelden farklı bir kasayı gösteren
 * sözcükler (örn. "COROLLA VERSO", "GOLF PLUS", "ASTRA HB CLASSIC", "YARIS CROSS", "PASSAT PRO").
 * Bu satırlar model yılına bakılarak bir nesle eşlenmez; yalnızca tip adındaki nesil ipucu (III, MK7)
 * ile eşlenebilir. `first`: yalnızca model adından hemen sonra geldiğinde (donanım adının parçası
 * olabildikleri için: "MIDLINE PLUS"); `anywhere`: tip adının herhangi bir yerinde.
 */
export const SUBMODEL_WORDS = {
  first: new Set(['PLUS', 'PRO']),
  anywhere: new Set(['VERSO', 'CLASSIC', 'CROSS', 'SYMBOL', 'CC', 'E-TECH', 'ETECH', 'TWINTOP', 'CAMPUS']),
  /**
   * Yalnızca belirli modelde alt model gösteren sözcükler (TSB model adı → sözcükler).
   * POLO SEDAN: uzun dingil mesafeli Polo sedan (Vento) 2010'dan beri Avrupa dışı pazarlar için ayrı
   * üretilen bir hattır (Wikipedia "Volkswagen Polo Mk5"); dönemi hatchback nesillerinden farklıdır.
   */
  byModel: { POLO: ['SEDAN'] } as Record<string, string[]>,
};
