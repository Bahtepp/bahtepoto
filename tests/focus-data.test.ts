/**
 * Ford Focus CANLI kronik sorun verisi için yanlış eşleşme regresyon testleri.
 * Ford Focus veri denetiminde (docs/FOCUS-DATA-AUDIT.md) bulunan hataların ve
 * genel kapsam kurallarının tekrarlanmamasını sağlar.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { matchIssue, type Verdict } from '../src/lib/issues/match.ts';
import { focusContext, loadCatalog, loadIssues } from './helpers.ts';

const catalog = loadCatalog();
const { issues, sources } = loadIssues('live');
const focus = catalog.models.find((m) => m.id === 'ford-focus')!;
const issue = (id: string) => {
  const i = issues.find((x) => x.id === id);
  if (!i) throw new Error(`kayıt yok: ${id}`);
  return i;
};
const v = (id: string, gen: string, rev: string | undefined, variant: string): Verdict =>
  matchIssue(issue(id), focusContext(catalog, gen, rev, variant)).verdict;

/**
 * Detay sayfası üretilen (nesil, dönem, varyant) seçimleri — elle denetlenmiş Focus verisi.
 * Yalnızca TSB'den gelen varyantlar (Türkiye listesi; makyaj dönemi ve çoğunlukla yakıt türü
 * bilinmez) burada hariçtir; onların eşleşme kuralları tests/tsb-import.test.ts'te sınanır.
 */
const tsbOnly = (v: { sourceIds: string[] }) => v.sourceIds.length > 0 && v.sourceIds.every((s) => s === 'tsb-kasko-deger-listesi');
const selections = focus.generations.flatMap((g) =>
  g.variants.filter((variant) => !tsbOnly(variant)).flatMap((variant) => {
    const revs =
      g.revisions.length === 0
        ? [undefined]
        : variant.revisionMapping === 'confirmed'
          ? g.revisions.filter((r) => variant.revisionIds.includes(r.id))
          : g.revisions;
    return revs.map((r) => ({ gen: g.slug, genId: g.id, rev: r?.slug, variant: variant.slug }));
  }),
);
const adacIds = issues.filter((i) => i.claims.some((c) => c.sourceId.startsWith('adac-'))).map((i) => i.id);

describe('kaynak içerik kontrolü', () => {
  test('bütün canlı kaynakların içerik kontrol durumu kayıtlı', () => {
    const missing = sources.filter((s) => !s.review).map((s) => s.id);
    assert.deepEqual(missing, []);
  });

  test('resmi geri çağırma kaynaklarının içeriği okunmuş', () => {
    const bad = sources.filter((s) => s.kind === 'official-recall' && s.review?.status !== 'content-checked').map((s) => s.id);
    assert.deepEqual(bad, []);
  });

  test('geri çağırma kayıtlarında kampanya bilgisi var ve VIN aralığı yayımlanmadıysa bu belirtilmiş', () => {
    for (const i of issues.filter((x) => x.kind === 'recall')) {
      assert.ok(i.recall, `${i.id}: recall bilgisi yok`);
      assert.equal(typeof i.recall.vinRangePublished, 'boolean');
      assert.ok(i.recall.references.length > 0, `${i.id}: resmi kayıt numarası yok`);
    }
  });
});

describe('nesil ayrımı', () => {
  const mk4Only = issues.filter((i) => i.appliesTo.every((s) => s.generationIds.length === 1 && s.generationIds[0] === 'ford-focus-mk4'));
  const mk3Only = issues.filter((i) => i.appliesTo.every((s) => s.generationIds.length === 1 && s.generationIds[0] === 'ford-focus-mk3'));

  test('yalnızca Mk4\'e ait kayıtlar Mk1–Mk3\'te görünmez', () => {
    assert.ok(mk4Only.length >= 15);
    for (const sel of selections.filter((s) => s.gen !== 'mk4')) {
      for (const i of mk4Only) assert.equal(v(i.id, sel.gen, sel.rev, sel.variant), 'no', `${i.id} → ${sel.gen}/${sel.rev}/${sel.variant}`);
    }
  });

  test('yalnızca Mk3\'e ait kayıtlar Mk1, Mk2 ve Mk4\'te görünmez', () => {
    assert.ok(mk3Only.length >= 3);
    for (const sel of selections.filter((s) => s.gen !== 'mk3')) {
      for (const i of mk3Only) assert.equal(v(i.id, sel.gen, sel.rev, sel.variant), 'no', `${i.id} → ${sel.gen}/${sel.rev}/${sel.variant}`);
    }
  });

  test('24E06 (EcoBlue DPF): tip onayı Mk3 → Mk4\'te görünmez, Mk3 dizelde koşullu, Mk3 benzinlide görünmez', () => {
    for (const sel of selections.filter((s) => s.gen === 'mk4')) {
      assert.equal(v('ford-focus-ecoblue-dpf-catlagi-24e06', sel.gen, sel.rev, sel.variant), 'no', sel.variant);
    }
    assert.equal(v('ford-focus-ecoblue-dpf-catlagi-24e06', 'mk3', 'makyajli', 'duratorq-15-120hp'), 'conditional');
    assert.equal(v('ford-focus-ecoblue-dpf-catlagi-24e06', 'mk3', 'makyajsiz', 'ecoboost-16-150hp'), 'no');
  });

  test('nesli belirsiz çocuk kilidi geri çağırması hiçbir araçta kesin görünmez', () => {
    for (const sel of selections) {
      assert.notEqual(v('ford-focus-mk4-arka-kapi-cocuk-kilidi', sel.gen, sel.rev, sel.variant), 'applies', sel.variant);
    }
    assert.equal(v('ford-focus-mk4-arka-kapi-cocuk-kilidi', 'mk2', 'makyajli', 'duratec-14-80'), 'no');
  });
});

describe('motor ve yakıt ayrımı', () => {
  test('17S45 (2.0 Duratorq): Mk3 1.6 TDCi ve benzinlilere uygulanmaz', () => {
    assert.equal(v('ford-focus-mk3-20-tdci-asiri-isinma-17s45', 'mk3', 'makyajsiz', 'duratorq-16-115hp'), 'no');
    assert.equal(v('ford-focus-mk3-20-tdci-asiri-isinma-17s45', 'mk3', 'makyajli', 'ecoboost-15-150hp'), 'no');
    assert.equal(v('ford-focus-mk3-20-tdci-asiri-isinma-17s45', 'mk3', 'makyajli', 'duratorq-20'), 'conditional');
  });

  test('48 V / mHEV geri çağırmaları hibrit olmayan Mk4\'lere uygulanmaz', () => {
    for (const id of ['ford-focus-mk4-48v-sase-kablosu-21s36', 'ford-focus-mk4-mhev-aku-kutup-somunu-21s01', 'ford-focus-mk4-48v-aku-kablosu-23s34']) {
      for (const variant of ['ecoboost-10-125ps', 'ecoblue-15-95ps', 'st']) {
        for (const rev of ['makyajsiz', 'makyajli']) {
          const sel = selections.find((s) => s.gen === 'mk4' && s.rev === rev && s.variant === variant);
          if (sel) assert.equal(v(id, 'mk4', rev, variant), 'no', `${id} → ${rev}/${variant}`);
        }
      }
      // Hibritte görünür (koşullu): üretim tarihi kampanyaya uyan en az bir makyaj döneminde.
      const onHybrid = ['makyajsiz', 'makyajli'].map((rev) => v(id, 'mk4', rev, 'ecoboost-hybrid-10-125ps'));
      assert.ok(onHybrid.includes('conditional'), `${id}: ${onHybrid.join(', ')}`);
    }
    // 2020 üretimi kampanya, makyajlı (2022+) dönemde görünmez; 2023 üretimi kampanya makyajlıda görünür.
    assert.equal(v('ford-focus-mk4-mhev-aku-kutup-somunu-21s01', 'mk4', 'makyajli', 'ecoboost-hybrid-10-125ps'), 'no');
    assert.equal(v('ford-focus-mk4-48v-aku-kablosu-23s34', 'mk4', 'makyajli', 'ecoboost-hybrid-10-125ps'), 'conditional');
  });

  test('TDCi fan modülü: 2008 sonrası IXDA motoruna ve benzinlilere uygulanmaz', () => {
    assert.equal(v('ford-focus-tdci-fan-modulu-yangin', 'mk2', 'makyajli', 'duratorq-20-110-ixda'), 'no');
    assert.equal(v('ford-focus-tdci-fan-modulu-yangin', 'mk2', 'makyajsiz', 'duratec-16-100'), 'no');
    // Birleşik Krallık kaynaklı: Avrupa aracı için koşullu
    assert.equal(v('ford-focus-tdci-fan-modulu-yangin', 'mk2', 'makyajsiz', 'duratorq-18-115-kkda'), 'conditional');
  });

  test('1.0 EcoBoost hortum: 2014 sonrası 138 bhp, Mk4 ve dizellere uygulanmaz', () => {
    assert.equal(v('ford-focus-mk3-10-ecoboost-sogutma-hortumu', 'mk3', 'makyajli', 'ecoboost-10-138hp'), 'no');
    assert.equal(v('ford-focus-mk3-10-ecoboost-sogutma-hortumu', 'mk3', 'makyajsiz', 'duratorq-16-95hp'), 'no');
    assert.equal(v('ford-focus-mk3-10-ecoboost-sogutma-hortumu', 'mk4', 'makyajsiz', 'ecoboost-10-100ps'), 'no');
    assert.equal(v('ford-focus-mk3-10-ecoboost-sogutma-hortumu', 'mk3', 'makyajsiz', 'ecoboost-10-100hp'), 'conditional');
  });

  test('ADAC turbo kaydı atmosferik benzinlilere uygulanmaz, turbolu benzinliyi dışlamaz', () => {
    assert.equal(v('ford-focus-dizel-turbo-ve-takviye-basinci', 'mk2', 'makyajsiz', 'duratec-16-100'), 'no');
    assert.equal(v('ford-focus-dizel-turbo-ve-takviye-basinci', 'mk2', 'makyajsiz', 'st'), 'conditional');
    assert.equal(v('ford-focus-dizel-turbo-ve-takviye-basinci', 'mk2', 'makyajsiz', 'duratorq-16-109-g8da'), 'conditional');
  });

  test('ateşleme bobini dizellere, DPF tıkanması benzinlilere uygulanmaz', () => {
    assert.equal(v('ford-focus-atesleme-bobini-arizasi', 'mk2', 'makyajsiz', 'duratorq-16-109-g8da'), 'no');
    assert.equal(v('ford-focus-atesleme-bobini-arizasi', 'mk2', 'makyajsiz', 'duratec-16-100'), 'conditional');
    assert.equal(v('ford-focus-dizel-partikul-filtresi-tikanmasi', 'mk2', 'makyajsiz', 'duratec-16-100'), 'no');
  });
});

describe('kesinlik', () => {
  test('ADAC model istatistikleri hiçbir araçta kesin (motor bazında) eşleşme üretmez', () => {
    assert.ok(adacIds.length === 9);
    for (const sel of selections) {
      for (const id of adacIds) assert.notEqual(v(id, sel.gen, sel.rev, sel.variant), 'applies', `${id} → ${sel.gen}/${sel.rev}/${sel.variant}`);
    }
  });

  test('geri çağırmalar hiçbir araçta kesin uygulanmaz (VIN aralığı yayımlanmadı)', () => {
    const recalls = issues.filter((i) => i.kind === 'recall' && i.recall && !i.recall.vinRangePublished);
    assert.equal(recalls.length, 21);
    for (const sel of selections) {
      for (const i of recalls) assert.notEqual(v(i.id, sel.gen, sel.rev, sel.variant), 'applies', `${i.id} → ${sel.gen}/${sel.rev}/${sel.variant}`);
    }
  });
});

describe('makyaj dönemi ayrımı (Mk4, makyaj ~Haziran 2022)', () => {
  const after = ['ford-focus-mk4-48v-aku-kablosu-23s34', 'ford-focus-mk4-arka-kemer-tokasi-23s31', 'ford-focus-mk4-yakit-rayi-sizintisi-25sc2'];
  const before = [
    'ford-focus-mk4-motor-kablo-demeti-19s50',
    'ford-focus-mk4-mhev-aku-kutup-somunu-21s01',
    'ford-focus-mk4-48v-sase-kablosu-21s36',
    'ford-focus-mk4-fren-servosu-20s05',
    'ford-focus-mk4-panoramik-tavan-trimi-22s40',
  ];
  const mk4Sel = (rev: string) => selections.filter((s) => s.gen === 'mk4' && s.rev === rev);

  test('makyaj sonrası üretimi kapsayan kampanyalar makyajsız Mk4\'te görünmez', () => {
    for (const sel of mk4Sel('makyajsiz')) {
      for (const id of after) assert.equal(v(id, 'mk4', 'makyajsiz', sel.variant), 'no', `${id} → ${sel.variant}`);
    }
  });

  test('makyaj öncesi üretimi kapsayan kampanyalar makyajlı Mk4\'te görünmez', () => {
    for (const sel of mk4Sel('makyajli')) {
      for (const id of before) assert.equal(v(id, 'mk4', 'makyajli', sel.variant), 'no', `${id} → ${sel.variant}`);
    }
  });

  test('makyaj sınırına denk gelen kampanya (22S49, 06–07.2022) iki dönemde de yalnızca koşullu', () => {
    assert.equal(v('ford-focus-mk4-aks-civata-deligi-22s49', 'mk4', 'makyajsiz', 'ecoboost-10-85ps'), 'conditional');
    assert.equal(v('ford-focus-mk4-aks-civata-deligi-22s49', 'mk4', 'makyajli', 'ecoboost-10-85ps'), 'conditional');
  });
});
