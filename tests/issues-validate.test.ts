/**
 * Kronik sorun KANIT kurallarının testleri.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'astro/zod';
import { validateIssues } from '../src/lib/issues/validate.ts';
import { issueSourceSchema } from '../src/lib/issues/schema.ts';
import { loadCatalog, loadIssues, makeIssue } from './helpers.ts';

const catalog = loadCatalog();
const review = { status: 'content-checked', checkedAt: '2026-10-15' };
const sources = z.array(issueSourceSchema).parse([
  { id: 'test-src', kind: 'technical-publication', title: 'T', publisher: 'A', accessedAt: '2026-10-15', review },
  { id: 'tech-b', kind: 'expert-service', title: 'T', publisher: 'B', accessedAt: '2026-10-15', review },
  { id: 'forum-1', kind: 'user-report', title: 'F1', accessedAt: '2026-10-15', review },
  { id: 'forum-2', kind: 'user-report', title: 'F2', accessedAt: '2026-10-15', review },
  { id: 'recall', kind: 'official-recall', title: 'R', accessedAt: '2026-10-15', review },
  { id: 'tsb', kind: 'manufacturer-bulletin', title: 'TSB', accessedAt: '2026-10-15', review },
  // Aynı habere dayanan iki yayın (bağımsız değil)
  { id: 'press-a', kind: 'technical-publication', title: 'PA', publisher: 'Yayıncı A', basedOn: 'ayni-haber', accessedAt: '2026-10-15', review },
  { id: 'press-b', kind: 'technical-publication', title: 'PB', publisher: 'Yayıncı B', basedOn: 'ayni-haber', accessedAt: '2026-10-15', review },
  // İçeriği okunmamış kaynak
  { id: 'unread', kind: 'technical-publication', title: 'U', publisher: 'C', accessedAt: '2026-10-15' },
]);
const recallInfo = { vinRangePublished: false, productionFrom: '2020-01-01', productionTo: '2020-12-31' };
const base = { appliesTo: [{ modelIds: ['ford-focus'] }] };
const errorsFor = (partial: Record<string, unknown>) => validateIssues([makeIssue({ ...base, ...partial })], sources, catalog, 'live');
const expectError = (partial: Record<string, unknown>, pattern: RegExp) => {
  const errors = errorsFor(partial);
  assert.ok(errors.some((e) => pattern.test(e)), `beklenen hata yok. Hatalar: ${JSON.stringify(errors)}`);
};

describe('veri kümeleri', () => {
  test('canlı veri geçerli', () => {
    const live = loadIssues('live');
    assert.deepEqual(validateIssues(live.issues, live.sources, catalog, 'live'), []);
  });
  test('örnek veri geçerli', () => {
    const demo = loadIssues('demo');
    assert.deepEqual(validateIssues(demo.issues, demo.sources, catalog, 'demo'), []);
  });
  test('örnek kayıt canlı veriye karışamaz', () => {
    const demo = loadIssues('demo');
    const errors = validateIssues(demo.issues, demo.sources, catalog, 'live');
    assert.ok(errors.some((e) => /canlı veriye karışamaz/.test(e)));
  });
});

describe('kanıt kuralları', () => {
  test('yalnızca kullanıcı raporu → "supported" olamaz', () => {
    expectError(
      { status: 'supported', claims: [{ sourceId: 'forum-1', aspects: ['existence'], stance: 'supports' }] },
      /kullanıcı raporlarına dayanan/,
    );
  });

  test('yalnızca kullanıcı raporu → "researching" kabul edilir', () => {
    assert.deepEqual(errorsFor({ status: 'researching', claims: [{ sourceId: 'forum-1', aspects: ['existence'], stance: 'supports' }] }), []);
  });

  test('"verified" tek teknik kaynakla olamaz', () => {
    expectError({ status: 'verified' }, /"verified" için/);
  });

  test('"verified": iki bağımsız uzman kaynak veya üretici bülteni yeterli', () => {
    assert.deepEqual(
      errorsFor({
        status: 'verified',
        claims: [
          { sourceId: 'test-src', aspects: ['existence'], stance: 'supports' },
          { sourceId: 'tech-b', aspects: ['existence'], stance: 'supports' },
        ],
      }),
      [],
    );
    assert.deepEqual(errorsFor({ status: 'verified', claims: [{ sourceId: 'tsb', aspects: ['existence'], stance: 'supports' }] }), []);
  });

  test('çürütücü kaynak varken "verified" olamaz', () => {
    expectError(
      {
        status: 'verified',
        claims: [
          { sourceId: 'tsb', aspects: ['existence'], stance: 'supports' },
          { sourceId: 'test-src', aspects: ['existence'], stance: 'contradicts' },
        ],
      },
      /çürütücü kaynak/,
    );
  });

  test('geri çağırma kaydı tek başına görülme sıklığı kanıtı değildir', () => {
    expectError(
      {
        kind: 'recall',
        prevalence: { evidence: 'isolated-reports', sourceIds: ['recall'] },
        claims: [{ sourceId: 'recall', aspects: ['existence'], stance: 'supports' }],
      },
      /geri çağırma kaydı tek başına/,
    );
  });

  test('"recall" türü resmi geri çağırma kaynağı ister', () => {
    expectError({ kind: 'recall', recall: recallInfo }, /resmi geri çağırma kaynağı/);
  });

  test('"recall" türü kampanya bilgisi (üretim tarihleri, VIN kapsamı) ister', () => {
    expectError({ kind: 'recall', claims: [{ sourceId: 'recall', aspects: ['existence'], stance: 'supports' }] }, /"recall" bilgisi/);
  });

  test('geri çağırma kapsamı, kampanyanın üretim tarihlerinin dışına genişletilemez', () => {
    expectError(
      {
        kind: 'recall',
        status: 'verified',
        recall: recallInfo,
        appliesTo: [{ modelIds: ['ford-focus'], years: { from: 2019, to: 2021, basis: 'production' } }],
        claims: [{ sourceId: 'recall', aspects: ['existence'], stance: 'supports' }],
      },
      /kampanyanın üretim tarihlerini aşıyor/,
    );
  });

  test('aynı habere dayanan iki yayın "verified" için iki bağımsız kaynak sayılmaz', () => {
    expectError(
      {
        status: 'verified',
        claims: [
          { sourceId: 'press-a', aspects: ['existence'], stance: 'supports' },
          { sourceId: 'press-b', aspects: ['existence'], stance: 'supports' },
        ],
      },
      /"verified" için/,
    );
  });

  test('içeriği kontrol edilmemiş kaynak tek başına "supported" durumu veremez', () => {
    expectError({ status: 'supported', claims: [{ sourceId: 'unread', aspects: ['existence'], stance: 'supports' }] }, /içeriği kontrol edilmiş/);
  });

  test('"chronic" iddiası tekrar kanıtı ister', () => {
    expectError({ kind: 'chronic' }, /tekrarlama kanıtı/);
  });

  test('"manufacturer-acknowledged" geri çağırmayla sağlanamaz', () => {
    expectError(
      {
        prevalence: { evidence: 'manufacturer-acknowledged', sourceIds: ['recall'] },
        claims: [
          { sourceId: 'test-src', aspects: ['existence'], stance: 'supports' },
          { sourceId: 'recall', aspects: ['prevalence'], stance: 'supports' },
        ],
      },
      /üretici teknik bülteni gerektirir/,
    );
  });

  test('ciddiyet kaynağı claims listesinde olmalı', () => {
    expectError({ severity: { level: 'high', rationale: 'x', sourceIds: ['tech-b'] } }, /"claims" listesinde/);
  });
});

describe('katalog referansları', () => {
  test('bilinmeyen nesil', () => {
    expectError({ appliesTo: [{ modelIds: ['ford-focus'], generationIds: ['ford-focus-mk9'] }] }, /bilinmeyen nesil/);
  });
  test('başka nesle ait makyaj dönemi', () => {
    expectError(
      { appliesTo: [{ modelIds: ['ford-focus'], generationIds: ['ford-focus-mk2'], revisionIds: ['ford-focus-mk3-facelift'] }] },
      /listelenen nesillere ait değil/,
    );
  });
  test('bilinmeyen motor', () => {
    expectError({ appliesTo: [{ engineIds: ['ford-yok'] }] }, /bilinmeyen motor/);
  });
});
