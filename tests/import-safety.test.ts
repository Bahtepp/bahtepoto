/**
 * Veri aktarım güvenliği: başarısız indirme, boş önbellek, bozuk/eksik XLSX, eksik kaynak satırları,
 * yarıda kesilen yazım, aynı verinin ikinci kez aktarılması ve elle girilmiş kayıtların korunması.
 * Her senaryoda başarısız aktarmadan sonra katalog dosyalarının bayt bayt aynı kaldığı doğrulanır.
 * Yalnızca geçici klasörler kullanılır; gerçek katalog ve önbelleğe dokunulmaz.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { loadRawCatalog, writeJson } from '../scripts/import/lib/io.ts';
import type { ImportDirs } from '../scripts/import/lib/paths.ts';
import { applyChanges, recoverInterrupted, rollbackLast } from '../scripts/import/lib/safe-write.ts';
import { backupRoot, runTsbImport, type ImportOptions } from '../scripts/import/tsb/pipeline.ts';
import { blockers, compareImport } from '../scripts/import/tsb/guard.ts';
import { SourceError, validateTsbFile, type FetchLike } from '../scripts/import/tsb/source.ts';
import { makeXlsx, tsbXlsx } from './xlsx-helper.ts';

type Row = [string, string, string, string, number[]];
const ROWS: Row[] = [
  ['53', '1', 'FORD', 'FOCUS 1.6 TDCi TITANIUM (109)', [2007, 2008]],
  ['53', '2', 'FORD', 'FOCUS 1.6 TDCi TREND (109)', [2006, 2007]],
  ['53', '3', 'FORD', 'FOCUS III TITANIUM 1.6 TDCi (115) 4K', [2012, 2013]],
  ['53', '4', 'FORD', 'FOCUS III TREND 1.6 TDCi (115) 5K', [2014]],
  ['53', '5', 'FORD', 'FIESTA 1.4 TDCi TREND (70)', [2010, 2011]],
  ['53', '6', 'FORD', 'C-MAX 1.6 TDCi TREND (115)', [2012]],
];
const MIN = 3;
const BROCHURE = { marketId: 'tr', status: 'sold', modelYears: [], trims: [], bodyTypes: [], sourceRefs: ['Broşür 2005, s. 32'], sourceIds: ['brosur'], notes: 'Elle girildi.' };

/** Diskte küçük katalog: Ford Focus Mk2/Mk3, Mk2'de elle girilmiş 1.6 TDCi 109 ve broşür kaydı. */
function writeCatalog(dir: string) {
  const period = (s: number, e: number) => ({ marketId: 'eu', basis: 'production', start: { year: s }, end: { year: e } });
  writeJson(join(dir, 'brands.json'), [{ id: 'ford', slug: 'ford', name: 'Ford', status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15' }]);
  writeJson(join(dir, 'markets.json'), [
    { id: 'eu', name: 'Avrupa', kind: 'region' },
    { id: 'tr', name: 'Türkiye', kind: 'country', isoCode: 'TR' },
  ]);
  writeJson(join(dir, 'sources.json'), [
    { id: 'wp', title: 'Wikipedia', tier: 'secondary', accessedAt: '2026-10-15' },
    { id: 'brosur', title: 'Ford Türkiye broşürü', tier: 'primary', accessedAt: '2026-10-15' },
  ]);
  writeJson(join(dir, 'engines', 'ford.json'), [{ id: 'ford-g8da', brandId: 'ford', slug: 'g8da', name: '1.6 TDCi 109 PS', fuel: 'diesel', displacementL: 1.6, power: { ps: 109 }, status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15' }]);
  writeJson(join(dir, 'models', 'ford', 'focus.json'), {
    id: 'ford-focus', brandId: 'ford', slug: 'focus', name: 'Focus', status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15',
    generations: [
      {
        id: 'ford-focus-mk2', slug: 'mk2', name: 'Focus Mk2', order: 1, labelPeriod: period(2004, 2010), status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15',
        variants: [{ id: 'ford-focus-mk2-g8da', slug: 'g8da', engineId: 'ford-g8da', revisionMapping: 'unknown', marketIds: ['eu', 'tr'], status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15', marketAvailability: [BROCHURE] }],
      },
      { id: 'ford-focus-mk3', slug: 'mk3', name: 'Focus Mk3', order: 2, labelPeriod: period(2011, 2018), status: 'sourced', sourceIds: ['wp'], updatedAt: '2026-10-15', variants: [] },
    ],
  });
}

/** Katalog klasörünün bayt bayt anlık görüntüsü. */
function snapshot(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else out.set(relative(dir, p), readFileSync(p, 'utf8'));
    }
  };
  walk(dir);
  return out;
}

interface Env {
  dirs: ImportDirs;
  inbox: string;
  opts: (o: Partial<ImportOptions>) => ImportOptions;
  drop: (name: string, buf: Buffer) => void;
  cacheEntries: () => string[];
}

/** Geçici klasörler + ilk başarılı aktarma (elle bırakılan dosyadan). */
async function env(): Promise<Env> {
  const root = mkdtempSync(join(tmpdir(), 'bahtepoto-guvenlik-'));
  const dirs: ImportDirs = { catalogDir: join(root, 'catalog'), stagingDir: join(root, 'staging'), cacheDir: join(root, 'cache') };
  writeCatalog(dirs.catalogDir);
  let inboxN = 0;
  let inbox = join(root, 'gelen-0');
  const e: Env = {
    dirs,
    get inbox() {
      return inbox;
    },
    opts: (o) => ({ dirs, source: 'offline', write: true, date: '2026-10-20', minRows: MIN, inboxDir: inbox, ...o }),
    drop: (name, buf) => {
      inbox = join(root, `gelen-${++inboxN}`);
      mkdirSync(inbox, { recursive: true });
      writeFileSync(join(inbox, name), buf);
    },
    cacheEntries: () => {
      const base = join(dirs.cacheDir, 'tsb');
      return existsSync(base) ? readdirSync(base).flatMap((d) => [d, ...readdirSync(join(base, d)).map((f) => `${d}/${f}`)]).sort() : [];
    },
  };
  e.drop('202610R1.xlsx', tsbXlsx(ROWS));
  const first = await runTsbImport(e.opts({ source: 'inbox', date: '2026-10-19' }));
  assert.equal(first.status, 'written', first.reasons.join('; '));
  return e;
}

const http400: FetchLike = async () => ({ ok: false, status: 400, json: async () => ({}), arrayBuffer: async () => new ArrayBuffer(0) });

describe('başarısız kaynak: katalog ve önbellek değişmez', () => {
  test('HTTP 400 yanıtı', async () => {
    const e = await env();
    const before = snapshot(e.dirs.catalogDir);
    const cache = e.cacheEntries();
    await assert.rejects(runTsbImport(e.opts({ source: 'online', fetchImpl: http400 })), (err: Error) => err instanceof SourceError && /HTTP 400/.test(err.message));
    assert.deepEqual(snapshot(e.dirs.catalogDir), before);
    assert.deepEqual(e.cacheEntries(), cache, 'boş tarih klasörü veya geçici klasör kalmamalı');
  });

  test('ağ hatası ve bozuk indirilen dosya', async () => {
    const e = await env();
    const before = snapshot(e.dirs.catalogDir);
    const cache = e.cacheEntries();
    const offline: FetchLike = async () => {
      throw new Error('getaddrinfo ENOTFOUND');
    };
    await assert.rejects(runTsbImport(e.opts({ source: 'online', fetchImpl: offline })), SourceError);
    const broken: FetchLike = async (url) => ({
      ok: true,
      status: 200,
      json: async () => (url.includes('Latest') ? { HasError: false, Result: '/content/InsuranceExcelFiles/202611R1.xlsx' } : null),
      arrayBuffer: async () => new Uint8Array(Buffer.from('<html>Bakım çalışması</html>')).buffer,
    });
    await assert.rejects(runTsbImport(e.opts({ source: 'online', fetchImpl: broken })), /geçerli bir XLSX/);
    assert.deepEqual(snapshot(e.dirs.catalogDir), before);
    assert.deepEqual(e.cacheEntries(), cache);
  });

  test('boş önbellek klasörü atlanır; hiç geçerli dosya yoksa durur', async () => {
    const e = await env();
    const before = snapshot(e.dirs.catalogDir);
    mkdirSync(join(e.dirs.cacheDir, 'tsb', '2026-12-31'), { recursive: true });
    const r = await runTsbImport(e.opts({}));
    assert.equal(r.status, 'written');
    assert.deepEqual(r.written, []);
    assert.equal(r.diff.refsAfter, ROWS.length);
    assert.deepEqual(snapshot(e.dirs.catalogDir), before);

    const empty = { ...e.dirs, cacheDir: mkdtempSync(join(tmpdir(), 'bahtepoto-bos-')) };
    mkdirSync(join(empty.cacheDir, 'tsb', '2026-10-17'), { recursive: true });
    await assert.rejects(runTsbImport(e.opts({ dirs: empty })), /geçerli TSB dosyası yok/);
    assert.deepEqual(snapshot(e.dirs.catalogDir), before);
  });

  test('bozuk XLSX: ZIP değil, kesik ZIP, başlıksız sayfa, yanlış ad', async () => {
    const e = await env();
    const before = snapshot(e.dirs.catalogDir);
    const cache = e.cacheEntries();
    const good = tsbXlsx(ROWS);
    const cases: [string, Buffer, RegExp][] = [
      ['202611R1.xlsx', Buffer.from('bu bir excel değil'), /geçerli bir XLSX/],
      ['202611R1.xlsx', good.subarray(0, Math.floor(good.length / 2)), /okunamadı/],
      ['202611R1.xlsx', makeXlsx([['Ad', 'Soyad'], ['a', 'b']]), /Marka Kodu/],
      ['liste.xlsx', good, /dosya adı/],
    ];
    for (const [name, buf, re] of cases) {
      e.drop(name, buf);
      await assert.rejects(runTsbImport(e.opts({ source: 'inbox' })), re, name);
    }
    assert.deepEqual(snapshot(e.dirs.catalogDir), before);
    assert.deepEqual(e.cacheEntries(), cache);
  });

  test('çok az satırlı (eksik) dosya kabul edilmez', () => {
    assert.throws(() => validateTsbFile(tsbXlsx(ROWS.slice(0, 2)), '202611R1.xlsx', MIN), /yalnızca 2 satır/);
    assert.equal(validateTsbFile(tsbXlsx(ROWS), '202611R1.xlsx', MIN).length, ROWS.length);
  });
});

describe('eksik kaynak satırları', () => {
  test('satır düşerse durur, fark raporu yazılır, katalog ve önbellek değişmez', async () => {
    const e = await env();
    const before = snapshot(e.dirs.catalogDir);
    const cache = e.cacheEntries();
    e.drop('202611R1.xlsx', tsbXlsx(ROWS.slice(0, 4)));
    const r = await runTsbImport(e.opts({ source: 'inbox' }));
    assert.equal(r.status, 'blocked');
    assert.deepEqual(r.diff.lostRefs.map((x) => x.ref).sort(), ['TSB 53-5', 'TSB 53-6']);
    assert.deepEqual(snapshot(e.dirs.catalogDir), before);
    assert.deepEqual(e.cacheEntries(), cache, 'durdurulan aktarmanın dosyası önbelleğe girmez');
    const report = readFileSync(join(e.dirs.stagingDir, 'tsb', 'FARK.md'), 'utf8');
    assert.match(report, /Aktarma durduruldu/);
    assert.match(report, /TSB 53-5/);
  });

  test('açık onayla (--onayla-silme) yapılır; elle girilmiş kayıt yine korunur', async () => {
    const e = await env();
    e.drop('202611R1.xlsx', tsbXlsx(ROWS.slice(0, 4)));
    const r = await runTsbImport(e.opts({ source: 'inbox', allowDeletions: true }));
    assert.equal(r.status, 'written');
    assert.equal(r.diff.refsAfter, 4);
    assert.ok(r.written.some((f) => f.includes('(silindi)')), r.written.join(', '));
    const focus = JSON.parse(readFileSync(join(e.dirs.catalogDir, 'models', 'ford', 'focus.json'), 'utf8'));
    assert.deepEqual(focus.generations[0].variants[0].marketAvailability[0], BROCHURE);
  });
});

describe('yarıda kesilme ve geri alma', () => {
  const newRows = (): Row[] => [...ROWS, ['53', '7', 'FORD', 'KUGA 1.5 ECOBOOST TREND (150)', [2014]], ['99', '1', 'SKODA', 'OCTAVIA 1.6 TDI (105)', [2013]]];

  test('yazım hatayla kesilirse eski dosyalar geri yüklenir', async () => {
    const e = await env();
    const before = snapshot(e.dirs.catalogDir);
    e.drop('202611R1.xlsx', tsbXlsx(newRows()));
    await assert.rejects(runTsbImport(e.opts({ source: 'inbox', applyOptions: { failAfter: 1 } })), /benzetilmiş kesinti/);
    assert.deepEqual(snapshot(e.dirs.catalogDir), before);
    assert.equal(existsSync(join(backupRoot(e.dirs), 'YARIM.json')), false);
  });

  test('süreç ölürse (günlük kalır) sonraki çalıştırma önceki kataloğu geri yükler', async () => {
    const e = await env();
    const before = snapshot(e.dirs.catalogDir);
    e.drop('202611R1.xlsx', tsbXlsx(newRows()));
    await assert.rejects(runTsbImport(e.opts({ source: 'inbox', applyOptions: { failAfter: 2, crash: true } })));
    assert.notDeepEqual(snapshot(e.dirs.catalogDir), before, 'katalog yarım yazılmış olmalı');
    assert.ok(existsSync(join(backupRoot(e.dirs), 'YARIM.json')));
    assert.ok(recoverInterrupted(e.dirs.catalogDir, backupRoot(e.dirs)));
    assert.deepEqual(snapshot(e.dirs.catalogDir), before);
    assert.equal(recoverInterrupted(e.dirs.catalogDir, backupRoot(e.dirs)), undefined);
  });

  test('aktarma başında yarım yazım kendiliğinden geri yüklenir', async () => {
    const e = await env();
    e.drop('202611R1.xlsx', tsbXlsx(newRows()));
    await assert.rejects(runTsbImport(e.opts({ source: 'inbox', applyOptions: { failAfter: 1, crash: true } })));
    const r = await runTsbImport(e.opts({ source: 'inbox' }));
    assert.ok(r.recovered);
    assert.equal(r.status, 'written');
    assert.equal(r.diff.refsAfter, newRows().length);
  });

  test('son başarılı aktarma geri alınabilir', async () => {
    const e = await env();
    const before = snapshot(e.dirs.catalogDir);
    e.drop('202611R1.xlsx', tsbXlsx(newRows()));
    assert.equal((await runTsbImport(e.opts({ source: 'inbox' }))).status, 'written');
    assert.notDeepEqual(snapshot(e.dirs.catalogDir), before);
    assert.ok(rollbackLast(e.dirs.catalogDir, backupRoot(e.dirs)));
    assert.deepEqual(snapshot(e.dirs.catalogDir), before);
  });

  test('yarım yazım varken yeni yazım başlamaz', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bahtepoto-yazim-'));
    const backups = join(dir, 'yedek');
    mkdirSync(backups);
    writeFileSync(join(backups, 'YARIM.json'), '{"stamp":"x"}');
    assert.throws(() => applyChanges(join(dir, 'k'), backups, [{ rel: 'a.json', content: '{}' }]), /Yarım kalmış/);
  });
});

describe('tekrarlanabilirlik ve elle girilmiş kayıtlar', () => {
  test('aynı veri ikinci kez aktarılınca hiçbir dosya değişmez', async () => {
    const e = await env();
    const before = snapshot(e.dirs.catalogDir);
    const again = await runTsbImport(e.opts({}));
    assert.equal(again.status, 'written');
    assert.deepEqual(again.written, []);
    assert.equal(again.backup, undefined);
    e.drop('202610R1.xlsx', tsbXlsx(ROWS));
    assert.deepEqual((await runTsbImport(e.opts({ source: 'inbox' }))).written, []);
    assert.deepEqual(snapshot(e.dirs.catalogDir), before);
  });

  test('elle girilmiş broşür kaydı korunur, TSB kaydı yanına eklenir', async () => {
    const e = await env();
    const focus = JSON.parse(readFileSync(join(e.dirs.catalogDir, 'models', 'ford', 'focus.json'), 'utf8'));
    const v = focus.generations[0].variants.find((x: { id: string }) => x.id === 'ford-focus-mk2-g8da');
    assert.deepEqual(v.marketAvailability[0], BROCHURE);
    assert.ok(v.marketAvailability.some((a: { sourceIds: string[] }) => a.sourceIds.includes('tsb-kasko-deger-listesi')));
  });

  test('elle girilmiş kaydı değiştirecek sonuç onayla bile engellenir', async () => {
    const e = await env();
    const cat = loadRawCatalog(e.dirs.catalogDir);
    const changed = loadRawCatalog(e.dirs.catalogDir);
    const focus = changed.models.get('models/ford/focus.json')!;
    (focus as { name: string }).name = 'Focus (değişti)';
    changed.engines.set('ford.json', []);
    const d = compareImport(cat, changed);
    assert.deepEqual(d.curatedChanged, ['model ford-focus', 'motor ford-g8da']);
    assert.match(blockers(d, true).join(' '), /elle girilmiş/);
    assert.deepEqual(blockers(compareImport(cat, cat), false), []);
  });
});
