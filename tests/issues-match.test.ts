/**
 * Kronik sorun eşleştirici testleri — gerçek Ford Focus katalog verisiyle.
 * Özellikle yanlış motor, yıl, makyaj dönemi, şanzıman ve pazar eşleşmelerine karşı.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { groupIssues, matchIssue } from '../src/lib/issues/match.ts';
import { focusContext, loadCatalog, loadIssues, makeIssue } from './helpers.ts';

const catalog = loadCatalog();
const ctx = (gen: string, rev?: string, variant?: string) => focusContext(catalog, gen, rev, variant);
const verdict = (issue: ReturnType<typeof makeIssue>, c: ReturnType<typeof ctx>) => matchIssue(issue, c).verdict;
const mk2Variants = catalog.models.find((m) => m.id === 'ford-focus')!.generations.find((g) => g.slug === 'mk2')!.variants;

describe('motora özgü sorunlar', () => {
  const ixda = makeIssue({ appliesTo: [{ generationIds: ['ford-focus-mk2'], modelIds: ['ford-focus'], engineIds: ['ford-duratorq-20-110-ixda'] }] });

  test('doğru motor + doğrulanmış dönem → uygulanır ve motora özgüdür', () => {
    const r = matchIssue(ixda, ctx('mk2', 'makyajli', 'duratorq-20-110-ixda'));
    assert.equal(r.verdict, 'applies');
    assert.equal(r.engineSpecific, true);
  });

  test('aynı kasanın diğer motorlarına otomatik eklenmez', () => {
    for (const v of mk2Variants.filter((x) => x.engineId !== 'ford-duratorq-20-110-ixda')) {
      for (const rev of ['makyajsiz', 'makyajli']) {
        assert.equal(verdict(ixda, ctx('mk2', rev, v.slug)), 'no', `${rev}/${v.slug}`);
      }
    }
  });

  test('başka nesilde uygulanmaz', () => {
    assert.equal(verdict(ixda, ctx('mk3', 'makyajli', 'duratorq-20')), 'no');
  });

  test('motor seçilmemişse kesin değil, koşulludur', () => {
    const r = matchIssue(ixda, ctx('mk2', 'makyajli'));
    assert.equal(r.verdict, 'conditional');
    assert.match(r.reasons.join(' '), /belirli motorlar/);
  });
});

describe('motor kodu ile eşleştirme', () => {
  const g8da = makeIssue({ appliesTo: [{ engineCodes: ['G8DA'] }] });

  test('makyaj dönemi eşleşmesi doğrulanmamış motorda koşullu (kesin değil)', () => {
    for (const rev of ['makyajsiz', 'makyajli']) {
      const r = matchIssue(g8da, ctx('mk2', rev, 'duratorq-16-109-g8da'));
      assert.equal(r.verdict, 'conditional', rev);
      assert.match(r.reasons.join(' '), /sunulduğu doğrulanmadı/);
    }
  });

  test('motor kodu bilinmeyen benzer motorla eşleşmez (yanlış pozitif yok)', () => {
    // Mk3 1.6 TDCi kayıtlarında motor kodu yok; G8DA sorunu bunlara geçmemeli.
    assert.equal(verdict(g8da, ctx('mk3', 'makyajsiz', 'duratorq-16-115hp')), 'no');
    assert.equal(verdict(g8da, ctx('mk2', 'makyajli', 'duratorq-16-90-hhda')), 'no');
  });

  test('motor kodu büyük/küçük harf duyarsız', () => {
    const lower = makeIssue({ appliesTo: [{ engineCodes: ['ixda'] }] });
    assert.equal(verdict(lower, ctx('mk2', 'makyajli', 'duratorq-20-110-ixda')), 'applies');
  });
});

describe('kasa ve model geneli sorunlar', () => {
  const mk2 = makeIssue({ appliesTo: [{ modelIds: ['ford-focus'], generationIds: ['ford-focus-mk2'] }] });
  const model = makeIssue({ appliesTo: [{ modelIds: ['ford-focus'] }] });

  test('kasa geneli sorun motor değişince kaybolmaz', () => {
    for (const v of mk2Variants) {
      for (const rev of ['makyajsiz', 'makyajli']) {
        const r = matchIssue(mk2, ctx('mk2', rev, v.slug));
        assert.equal(r.verdict, 'applies', `${rev}/${v.slug}`);
        assert.equal(r.engineSpecific, false);
      }
    }
  });

  test('kasa geneli sorun diğer nesillerde görünmez', () => {
    assert.equal(verdict(mk2, ctx('mk1', 'makyajli', 'rs')), 'no');
    assert.equal(verdict(mk2, ctx('mk3', 'makyajli', 'rs')), 'no');
    assert.equal(verdict(mk2, ctx('mk4', 'makyajli', 'st')), 'no');
  });

  test('model geneli sorun bütün nesillerde görünür', () => {
    assert.equal(verdict(model, ctx('mk1', 'makyajsiz', 'endura-tddi-18-75')), 'applies');
    assert.equal(verdict(model, ctx('mk4', 'makyajli', 'ecoblue-15-95ps')), 'applies');
  });

  test('farklı marka asla eşleşmez', () => {
    const other = makeIssue({ brandId: 'renault', appliesTo: [{ modelIds: ['ford-focus'] }] });
    assert.equal(verdict(other, ctx('mk2', 'makyajli', 'duratorq-20-110-ixda')), 'no');
  });
});

describe('makyaj dönemi', () => {
  const facelift = makeIssue({ appliesTo: [{ modelIds: ['ford-focus'], revisionIds: ['ford-focus-mk2-facelift'] }] });

  test('doğru dönem → uygulanır, yanlış dönem → uygulanmaz', () => {
    assert.equal(verdict(facelift, ctx('mk2', 'makyajli', 'duratec-14-80')), 'applies');
    assert.equal(verdict(facelift, ctx('mk2', 'makyajsiz', 'duratec-14-80')), 'no');
  });

  test('dönem seçilmemişse koşullu', () => {
    assert.equal(verdict(facelift, ctx('mk2')), 'conditional');
  });

  test('başka neslin makyajlı dönemine taşmaz', () => {
    assert.equal(verdict(facelift, ctx('mk3', 'makyajli', 'rs')), 'no');
  });

  test('motor + dönem birlikte: motor yalnızca makyajsızda doğrulanmışsa makyajlıda uygulanmaz', () => {
    const issue = makeIssue({
      appliesTo: [{ modelIds: ['ford-focus'], engineIds: ['ford-ecoboost-16-150hp'], revisionIds: ['ford-focus-mk3-pre-facelift'] }],
    });
    assert.equal(verdict(issue, ctx('mk3', 'makyajsiz', 'ecoboost-16-150hp')), 'applies');
    assert.equal(verdict(issue, ctx('mk3', 'makyajli', 'ecoboost-16-150hp')), 'no');
  });
});

describe('yıl aralığı', () => {
  const early = makeIssue({
    appliesTo: [{ modelIds: ['ford-focus'], generationIds: ['ford-focus-mk2'], years: { from: 2004, to: 2006, basis: 'production', marketId: 'eu' } }],
  });

  test('kısmen örtüşen dönemde koşullu, örtüşmeyen dönemde uygulanmaz', () => {
    const r = matchIssue(early, ctx('mk2', 'makyajsiz', 'duratec-14-80'));
    assert.equal(r.verdict, 'conditional');
    assert.match(r.reasons.join(' '), /2004–2006/);
    assert.equal(verdict(early, ctx('mk2', 'makyajli', 'duratec-14-80')), 'no');
  });

  test('dönemin tamamını kapsayan aralık → uygulanır', () => {
    const wide = makeIssue({ appliesTo: [{ modelIds: ['ford-focus'], years: { from: 2000, to: 2012, basis: 'production' } }] });
    assert.equal(verdict(wide, ctx('mk2', 'makyajli', 'duratec-14-80')), 'applies');
  });

  test('varyantın kendi üretim dönemi kullanılır (Mk1 RS: Eki 2002–Kas 2003)', () => {
    const rsYears = makeIssue({ appliesTo: [{ modelIds: ['ford-focus'], years: { from: 2002, to: 2003, basis: 'production' } }] });
    const later = makeIssue({ appliesTo: [{ modelIds: ['ford-focus'], years: { from: 2004, to: 2005, basis: 'production' } }] });
    assert.equal(verdict(rsYears, ctx('mk1', 'makyajli', 'rs')), 'applies');
    assert.equal(verdict(later, ctx('mk1', 'makyajli', 'rs')), 'no');
  });

  test('farklı ölçüm temeli (model yılı ↔ üretim) kesin eşleşme üretmez', () => {
    const my = makeIssue({ appliesTo: [{ modelIds: ['ford-focus'], years: { from: 2000, to: 2012, basis: 'model-year' } }] });
    assert.equal(verdict(my, ctx('mk2', 'makyajli', 'duratec-14-80')), 'conditional');
  });
});

describe('şanzıman', () => {
  const ps = makeIssue({ appliesTo: [{ modelIds: ['ford-focus'], transmissions: [{ name: 'PowerShift' }] }] });

  test('birden fazla şanzıman seçeneği varsa koşullu', () => {
    const r = matchIssue(ps, ctx('mk2', 'makyajli', 'duratorq-20-136-g6da'));
    assert.equal(r.verdict, 'conditional');
    assert.match(r.reasons.join(' '), /PowerShift/);
  });

  test('şanzıman o dönemde sunulmadıysa uygulanmaz', () => {
    // 2.0 TDCi 136 için PowerShift yalnızca makyajlı dönemde.
    assert.equal(verdict(ps, ctx('mk2', 'makyajsiz', 'duratorq-20-136-g6da')), 'no');
  });

  test('bilinen şanzımanların hiçbiri eşleşmiyorsa uygulanmaz', () => {
    assert.equal(verdict(ps, ctx('mk2', 'makyajli', 'duratorq-20-110-ixda')), 'no');
  });

  test('tek bilinen seçenek eşleşiyorsa uygulanır', () => {
    assert.equal(verdict(ps, ctx('mk3', 'makyajli', 'duratorq-20')), 'applies');
  });

  test('şanzıman bilgisi yoksa kesin değil, koşullu', () => {
    assert.equal(verdict(ps, ctx('mk3', 'makyajli', 'ecoboost-10-100hp')), 'conditional');
  });
});

describe('pazar', () => {
  test('başka pazara ait sorun uygulanmaz', () => {
    const na = makeIssue({ appliesTo: [{ modelIds: ['ford-focus'], marketIds: ['na'] }] });
    assert.equal(verdict(na, ctx('mk3', 'makyajli', 'rs')), 'no');
  });

  test('alt pazar (Birleşik Krallık) → Avrupa aracında koşullu', () => {
    const gb = makeIssue({ appliesTo: [{ modelIds: ['ford-focus'], marketIds: ['gb'] }] });
    assert.equal(verdict(gb, ctx('mk3', 'makyajli', 'rs')), 'conditional');
  });

  test('aynı pazar → uygulanır', () => {
    const eu = makeIssue({ appliesTo: [{ modelIds: ['ford-focus'], marketIds: ['eu'] }] });
    // Mk3 benzinli ST yalnızca Avrupa kaydında. RS artık TSB ile Türkiye'de de listeli; o araçta Avrupa sorunu koşullu kalır.
    assert.equal(verdict(eu, ctx('mk3', 'makyajli', 'st')), 'applies');
  });
});

describe('kapsam dışı (excludes)', () => {
  test('hariç tutulan varyant elenir, diğerleri kalır', () => {
    const issue = makeIssue({
      appliesTo: [{ modelIds: ['ford-focus'], generationIds: ['ford-focus-mk2'] }],
      excludes: [{ engineIds: ['ford-duratec-rs-25-305', 'ford-duratec-rs500-25-350'] }],
    });
    assert.equal(verdict(issue, ctx('mk2', 'makyajli', 'rs')), 'no');
    assert.equal(verdict(issue, ctx('mk2', 'makyajli', 'rs500')), 'no');
    assert.equal(verdict(issue, ctx('mk2', 'makyajli', 'duratorq-20-110-ixda')), 'applies');
  });
});

describe('gruplama (örnek veri)', () => {
  const demo = loadIssues('demo').issues;
  const ids = (list: { issue: { id: string } }[]) => list.map((x) => x.issue.id).sort();

  test('Mk2 makyajlı + 2.0 TDCi 110 (IXDA)', () => {
    const g = groupIssues(demo, ctx('mk2', 'makyajli', 'duratorq-20-110-ixda'));
    assert.deepEqual(ids(g.engine), ['demo-focus-mk2-ixda']);
    assert.deepEqual(ids(g.general), ['demo-focus-mk2-kasa', 'demo-focus-mk2-makyajli', 'demo-focus-model-geneli']);
    assert.deepEqual(ids(g.conditional), []);
    assert.deepEqual(ids(g.researching), ['demo-focus-arastiriliyor', 'demo-focus-tartismali']);
  });

  test('Mk2 makyajlı + 1.6 TDCi 109 (G8DA, dönem eşleşmesi doğrulanmamış)', () => {
    const g = groupIssues(demo, ctx('mk2', 'makyajli', 'duratorq-16-109-g8da'));
    assert.deepEqual(ids(g.engine), [], 'doğrulanmamış motor-dönem eşleşmesinde kesin motor sorunu olmamalı');
    assert.deepEqual(ids(g.general), ['demo-focus-mk2-kasa', 'demo-focus-mk2-makyajli', 'demo-focus-model-geneli']);
    assert.deepEqual(ids(g.conditional), ['demo-focus-mk2-g8da']);
  });

  test('Mk2 makyajsız + 2.0 TDCi 136: PowerShift ve makyajlı sorunu görünmez, erken yıl koşullu', () => {
    const g = groupIssues(demo, ctx('mk2', 'makyajsiz', 'duratorq-20-136-g6da'));
    const all = [...g.engine, ...g.general, ...g.conditional, ...g.researching].map((x) => x.issue.id);
    assert.ok(!all.includes('demo-focus-mk2-powershift'));
    assert.ok(!all.includes('demo-focus-mk2-makyajli'));
    assert.ok(!all.includes('demo-focus-mk2-ixda'));
    assert.deepEqual(ids(g.conditional), ['demo-focus-mk2-erken-yillar']);
  });

  test('Mk3: yalnızca model geneli örnek görünür', () => {
    const g = groupIssues(demo, ctx('mk3', 'makyajsiz', 'ecoboost-16-150hp'));
    assert.deepEqual(ids(g.general), ['demo-focus-model-geneli']);
    assert.equal(g.engine.length + g.conditional.length + g.researching.length, 0);
  });
});

describe('canlı veri', () => {
  test('canlı veride örnek (demo) kayıt bulunmaz', () => {
    const live = loadIssues('live');
    assert.ok(live.issues.every((i) => !i.demo));
    assert.ok(live.sources.every((s) => !s.demo));
  });
});

describe('ekran grupları (yayın politikası)', () => {
  test('bilinen, olası ve geri çağırma ayrı gruplarda; araştırılan kayıt "bilinen" sayılmaz', async () => {
    const { groupForDisplay } = await import('../src/lib/issues/match.ts');
    const base = { appliesTo: [{ modelIds: ['ford-focus'] }] };
    const chronic = makeIssue({ ...base, id: 'k1', slug: 'k1', kind: 'chronic' });
    const defect = makeIssue({ ...base, id: 'k2', slug: 'k2', kind: 'known-defect' });
    const recall = makeIssue({ ...base, id: 'k3', slug: 'k3', kind: 'recall', recall: { vinRangePublished: false } });
    const single = makeIssue({ ...base, id: 'k4', slug: 'k4', kind: 'chronic', status: 'researching' });
    const disputed = makeIssue({ ...base, id: 'k5', slug: 'k5', kind: 'known-defect', status: 'disputed' });
    const g = groupForDisplay([chronic, defect, recall, single, disputed], ctx('mk2', 'makyajli', 'duratec-14-80'));
    const ids = (x: { issue: { id: string } }[]) => x.map((i) => i.issue.id).sort();
    assert.deepEqual(ids(g.known), ['k1', 'k2']);
    assert.deepEqual(ids(g.possible), ['k4', 'k5']);
    assert.deepEqual(ids(g.recalls), ['k3']);
  });

  test('eşleşme kesinliği kayıtta korunur: motora özgü, kasa geneli, koşullu', async () => {
    const { groupForDisplay } = await import('../src/lib/issues/match.ts');
    const engine = makeIssue({ id: 'e1', slug: 'e1', appliesTo: [{ engineIds: ['ford-duratorq-20-110-ixda'] }] });
    const general = makeIssue({ id: 'e2', slug: 'e2', appliesTo: [{ generationIds: ['ford-focus-mk2'], modelIds: ['ford-focus'] }] });
    const cond = makeIssue({ id: 'e3', slug: 'e3', appliesTo: [{ modelIds: ['ford-focus'], transmissions: [{ name: 'PowerShift' }] }] });
    const g = groupForDisplay([cond, general, engine], ctx('mk2', 'makyajli', 'duratorq-20-136-g6da'));
    assert.deepEqual(g.known.map((x) => [x.issue.id, x.scope]), [['e2', 'general'], ['e3', 'conditional']]);
    const g2 = groupForDisplay([cond, general, engine], ctx('mk2', 'makyajli', 'duratorq-20-110-ixda'));
    assert.deepEqual(g2.known.map((x) => [x.issue.id, x.scope]), [['e1', 'engine'], ['e2', 'general']]);
  });
});
