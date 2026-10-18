/**
 * Türkiye kataloğu regresyonu: ana liste, eski adresler, yabancı motorun gizlenmesi.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { engineGroupsForModel, type EngineGroupView } from '../src/lib/catalog/selector.ts';
import { marketGroup } from '../src/lib/catalog/market.ts';
import { publicEngine, publicVariant } from '../src/lib/catalog/publish.ts';
import { MODEL_SLUG_ALIASES, canonicalModelSlug } from '../src/lib/catalog/aliases.ts';
import { isHiddenModel, isPrimaryBrand } from '../src/lib/catalog/visibility.ts';
import { catalogPath, prefixBase, vehiclePath } from '../src/lib/catalog/format.ts';
import type { Engine, Variant } from '../src/lib/catalog/schema.ts';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

function groups(brand: string, model: string): EngineGroupView[] {
  const file = JSON.parse(readFileSync(`src/data/catalog/models/${brand}/${model}.json`, 'utf8')) as {
    generations: {
      id: string;
      slug: string;
      name: string;
      kind?: 'generation' | 'unassigned';
      labelPeriod: { start: { year: number }; end?: { year: number } | null };
      revisions: { id: string; slug: string; order: number }[];
      variants: Variant[];
    }[];
  };
  const engines = Object.fromEntries(
    (JSON.parse(readFileSync(`src/data/catalog/engines/${brand}.json`, 'utf8')) as Engine[]).map((e) => [e.id, e]),
  );
  const variants: Record<string, Variant[]> = {};
  for (const g of file.generations) variants[g.id] = g.variants;
  return engineGroupsForModel(file.generations, variants, engines);
}

describe('Türkiye ana kataloğu', () => {
  test('istenen markalar durur, Rogue ana listede değildir', () => {
    for (const slug of ['togg', 'byd', 'chery', 'mg', 'jaecoo', 'leapmotor', 'bmw', 'renault', 'fiat']) {
      assert.equal(isPrimaryBrand(slug), true, slug);
    }
    assert.equal(isHiddenModel('nissan', 'rogue'), true);
    assert.equal(existsSync('src/data/catalog/models/nissan/rogue.json'), true);
  });

  test('Volvo XC90 tek modeldir; eski slug yönlenir', () => {
    assert.equal(existsSync('src/data/catalog/models/volvo/xc90.json'), true);
    assert.equal(existsSync('src/data/catalog/models/volvo/xc-90.json'), false);
    assert.equal(canonicalModelSlug('volvo', 'xc-90'), 'xc90');
    assert.equal(canonicalModelSlug('ds', 'ds-7'), 'ds7');
    assert.equal(canonicalModelSlug('ford', 'f150'), 'f-150');
    assert.equal(canonicalModelSlug('mazda', 'mx5'), 'mx-5');
    for (const alias of MODEL_SLUG_ALIASES) {
      assert.notEqual(alias.from, alias.to);
      assert.equal(existsSync(`src/data/catalog/models/${alias.brand}/${alias.to}.json`), true, alias.to);
    }
  });

  test('seçilen Türkiye motorlarının kasası gelir; Avrupa Focus motoru listeye girmez', () => {
    const bmw = groups('bmw', '3-serisi').find((g) => g.label === '320d');
    assert.ok(bmw && bmw.chassis.length >= 1);
    const clio = groups('renault', 'clio').find((g) => g.label === '1.5 dCi');
    assert.ok(clio && clio.chassis.length >= 1);
    const qashqai = groups('nissan', 'qashqai').find((g) => g.label === '1.3 DIG-T');
    assert.ok(qashqai && qashqai.chassis.some((c) => c.label.includes('J11')));
    const focus = groups('ford', 'focus').find((g) => g.label === '1.6 TDCi');
    assert.ok(focus && focus.chassis.some((c) => !c.unassigned));
    const golf = groups('volkswagen', 'golf').find((g) => /1\.5/.test(g.label) && /TSI|eTSI/i.test(g.label));
    assert.ok(golf && golf.chassis.length >= 1);
    const civic = groups('honda', 'civic');
    assert.ok(civic.some((g) => /1\.6/.test(g.label) && g.chassis.length >= 1));
    const egea = groups('fiat', 'egea').find((g) => g.label === '1.3 MultiJet');
    assert.ok(egea && egea.chassis.length >= 1);
    const xc90 = groups('volvo', 'xc90');
    assert.ok(xc90.length >= 1 && xc90.every((g) => g.chassis.length >= 1));
    const togg = groups('togg', 't10x');
    assert.ok(togg.some((g) => g.label === '160 kW' && g.chassis.length >= 1));
    assert.ok(togg.some((g) => g.label === '320 kW' && g.chassis.length >= 1));
    const toggEngines = JSON.parse(readFileSync('src/data/catalog/engines/togg.json', 'utf8')) as {
      id: string;
      fuel?: string;
      power?: { kw?: number };
      batteryKwh?: number;
    }[];
    const t160 = toggEngines.find((e) => e.id === 'togg-160kw');
    const t320 = toggEngines.find((e) => e.id === 'togg-320kw');
    assert.equal(t160?.fuel, 'electric');
    assert.equal(t320?.fuel, 'electric');
    assert.equal(t160?.power?.kw, 160);
    assert.equal(t320?.power?.kw, 320);
    assert.equal(t160?.batteryKwh, undefined);

    const focusFile = JSON.parse(readFileSync('src/data/catalog/models/ford/focus.json', 'utf8')) as {
      generations: { variants: Variant[] }[];
    };
    const eu = focusFile.generations.flatMap((g) => g.variants).find((v) => v.id === 'ford-focus-mk1-zetec-se-14-75');
    assert.ok(eu);
    assert.equal(marketGroup(eu!), 'hidden');
    const shown = groups('ford', 'focus').flatMap((g) => g.chassis.flatMap((c) => c.options.map((o) => o.engineId)));
    assert.equal(shown.includes('ford-zetec-se-14-75'), false);
  });

  test('Audi 50 TDI 50 PS değildir; kronik motor kimliği ve TSB satırı durur', () => {
    const audi = JSON.parse(readFileSync('src/data/catalog/engines/audi.json', 'utf8')) as { id: string; name: string; power?: { ps?: number } }[];
    const badge = audi.find((e) => e.id === 'audi-50');
    assert.ok(badge);
    assert.equal(badge!.power?.ps, undefined);
    assert.equal(audi.some((e) => e.power?.ps === 50 && /tdi/i.test(e.name)), false);
    const ford = JSON.parse(readFileSync('src/data/catalog/engines/ford.json', 'utf8')) as { id: string }[];
    assert.ok(ford.some((e) => e.id === 'ford-duratorq-20-c346'));
    let refs = 0;
    for (const path of walk('src/data/catalog/models')) {
      const model = JSON.parse(readFileSync(path, 'utf8')) as {
        generations?: { variants?: { marketAvailability?: { sourceIds?: string[]; sourceRefs?: string[] }[] }[] }[];
      };
      for (const g of model.generations ?? []) {
        for (const v of g.variants ?? []) {
          for (const a of v.marketAvailability ?? []) {
            if (a.sourceIds?.includes('tsb-kasko-deger-listesi')) refs += a.sourceRefs?.length ?? 0;
          }
        }
      }
    }
    assert.equal(refs, 15463);
  });

  test('pazar seçici yok; GitHub Pages tabanı eski adresi bozmaz', () => {
    const ui = readFileSync('src/components/catalog/CatalogExplorer.astro', 'utf8') + readFileSync('src/scripts/catalog-explorer.ts', 'utf8');
    assert.equal(ui.includes('Tüm dünya'), false);
    assert.equal(ui.includes('MARKET_VIEWS'), false);
    assert.equal(prefixBase('/bahtepoto/', '/arac/volvo/xc90/'), '/bahtepoto/arac/volvo/xc90/');
    assert.match(readFileSync('src/scripts/catalog-explorer.ts', 'utf8'), /q\.delete\('market'\)/);
    assert.match(readFileSync('scripts/import/generations/build.ts', 'utf8'), /Motor varyantı bu aktarmayla üretilmez/);
  });

  test('yayımlanan katalog yabancı varyant ve kaynakça taşımaz', () => {
    let hidden = 0;
    let imported = 0;
    let primary = 0;
    const published = new Set<string>();
    for (const path of walk('src/data/catalog/models')) {
      const model = JSON.parse(readFileSync(path, 'utf8')) as { generations?: { variants?: Variant[] }[] };
      for (const generation of model.generations ?? []) {
        for (const variant of generation.variants ?? []) {
          const group = marketGroup(variant);
          const copy = publicVariant(variant);
          if (group !== 'primary') {
            if (group === 'hidden') hidden += 1;
            if (group === 'imported') imported += 1;
            assert.equal(copy, undefined, variant.id);
            continue;
          }
          primary += 1;
          assert.ok(copy);
          published.add(copy.id);
          assert.deepEqual(copy.marketIds, ['tr']);
          assert.equal(copy.notes, undefined);
          assert.deepEqual(copy.sourceIds, []);
          const raw = JSON.stringify(copy);
          assert.equal(raw.includes('TSB '), false, variant.id);
          assert.equal(raw.includes('Wikipedia'), false, variant.id);
          assert.equal(raw.includes('wp-en-'), false, variant.id);
          for (const row of copy.marketAvailability) {
            assert.equal(row.marketId, 'tr');
            assert.deepEqual(row.sourceRefs, []);
            assert.deepEqual(row.sourceIds, []);
          }
        }
      }
    }
    assert.equal(hidden, 42);
    assert.equal(imported, 68);
    assert.equal(published.has('ford-focus-mk1-zetec-se-14-75'), false);
    assert.equal(published.has('ford-focus-mk3-duratorq-20'), false);
    assert.ok(primary > 4900);

    const focus = readFileSync('src/data/catalog/models/ford/focus.json', 'utf8');
    assert.ok(focus.includes('ford-focus-mk3-duratorq-20'));
    const fordEngines = JSON.parse(readFileSync('src/data/catalog/engines/ford.json', 'utf8')) as Engine[];
    const engineIds = new Set(fordEngines.map((e) => e.id));
    assert.ok(engineIds.has('ford-duratorq-20-c346'));
    const issues = JSON.parse(readFileSync('src/data/issues/records/ford/focus.json', 'utf8')) as unknown;
    const referenced = new Set<string>();
    const walkIssues = (node: unknown) => {
      if (Array.isArray(node)) {
        for (const item of node) walkIssues(item);
        return;
      }
      if (!node || typeof node !== 'object') return;
      const record = node as { engineIds?: string[] };
      for (const id of record.engineIds ?? []) referenced.add(id);
      for (const value of Object.values(record)) walkIssues(value);
    };
    walkIssues(issues);
    assert.ok(referenced.has('ford-duratorq-20-c346'));
    for (const id of referenced) assert.ok(engineIds.has(id), id);
    const stripped = publicEngine(fordEngines.find((e) => e.id === 'ford-duratorq-20-c346')!);
    assert.equal(stripped.notes, undefined);
    assert.deepEqual(stripped.sourceIds, []);
    assert.equal(stripped.id, 'ford-duratorq-20-c346');
  });

  test('eski adres yeni araca gider; kayıp motor başka araca bağlanmaz', () => {
    const canonical = vehiclePath({ brand: 'volvo', model: 'xc90', generation: '1-nesil', variant: '24' });
    assert.equal(canonical, '/arac/volvo/xc90/1-nesil/24/');
    assert.notEqual('/arac/volvo/xc-90/1-nesil/24/', canonical);
    assert.equal(prefixBase('/bahtepoto/', canonical), '/bahtepoto/arac/volvo/xc90/1-nesil/24/');
    assert.equal(catalogPath({ brand: 'volvo', model: canonicalModelSlug('volvo', 'xc-90') }), '/?marka=volvo&model=xc90');
    assert.equal(catalogPath({ brand: 'ds', model: canonicalModelSlug('ds', 'ds-7') }), '/?marka=ds&model=ds7');
    assert.equal(catalogPath({ brand: 'ford', model: canonicalModelSlug('ford', 'f150') }), '/?marka=ford&model=f-150');
    assert.equal(catalogPath({ brand: 'mazda', model: canonicalModelSlug('mazda', 'mx5') }), '/?marka=mazda&model=mx-5');
    assert.equal(catalogPath({ brand: 'ford', model: 'focus' }), '/?marka=ford&model=focus');
    const layout = readFileSync('src/layouts/SiteLayout.astro', 'utf8');
    assert.equal(layout.includes('Wikipedia'), false);
    assert.equal(layout.includes('CC BY-SA'), false);
    const vehicle = readFileSync('src/pages/arac/[...vehicle].astro', 'utf8');
    assert.match(vehicle, /Bu araç Türkiye ana kataloğunda yer almıyor/);
    const config = readFileSync('astro.config.mjs', 'utf8');
    assert.match(config, /bahtepoto/);
  });
});
