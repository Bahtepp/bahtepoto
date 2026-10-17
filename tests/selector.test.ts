/**
 * Motor öncelikli seçim: aynı satış adı tek kartta, kasa ve güç sonra ayrılır.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { engineGroupsForModel, type EngineGroupView } from '../src/lib/catalog/selector.ts';
import type { Engine, Variant } from '../src/lib/catalog/schema.ts';

const MARKETS = [{ id: 'tr' }, { id: 'eu', parentId: 'global' }, { id: 'global' }];

function groups(brand: string, model: string): EngineGroupView[] {
  const file = JSON.parse(readFileSync(`src/data/catalog/models/${brand}/${model}.json`, 'utf8')) as {
    generations: {
      id: string;
      slug: string;
      name: string;
      kind?: 'generation' | 'unassigned';
      labelPeriod: { start: { year: number }; end?: { year: number } | null };
      modelYears?: number[];
      revisions: { id: string; slug: string; order: number }[];
      variants: Variant[];
    }[];
  };
  const engines = Object.fromEntries(
    (JSON.parse(readFileSync(`src/data/catalog/engines/${brand}.json`, 'utf8')) as Engine[]).map((e) => [e.id, e]),
  );
  const variants: Record<string, Variant[]> = {};
  for (const g of file.generations) variants[g.id] = g.variants;
  return engineGroupsForModel(file.generations, variants, engines, MARKETS, 'tr');
}

function one(list: EngineGroupView[], label: string): EngineGroupView {
  const found = list.filter((g) => g.label === label);
  assert.equal(found.length, 1, `${label} tek kart olmalı, bulunan: ${found.map((g) => g.slug).join(', ') || 'yok'}`);
  return found[0]!;
}

describe('motor öncelikli seçim', () => {
  test('BMW 3 Serisi 320i ve 320d tek kart; kasa ve güç sonra', () => {
    const g = groups('bmw', '3-serisi');
    const i = one(g, '320i');
    const d = one(g, '320d');
    assert.equal(i.fuel, 'petrol');
    assert.equal(d.fuel, 'diesel');
    assert.ok(i.chassis.length >= 1);
    assert.ok(d.chassis.length >= 1);
    for (const c of [...i.chassis, ...d.chassis]) {
      if (!c.unassigned) assert.match(c.years, /\d{4}/);
      assert.ok(!c.label.includes('TSB'));
    }
    const powers = d.chassis.flatMap((c) => c.options.map((o) => o.label));
    assert.ok(new Set(powers).size >= 1);
  });

  test('Qashqai 1.3 DIG-T tek kartta J11 ve J12; 158 ile 160 ayrı güç', () => {
    const g = groups('nissan', 'qashqai');
    const dig = one(g, '1.3 DIG-T');
    const codes = dig.chassis.filter((c) => !c.unassigned).map((c) => c.label);
    assert.ok(codes.some((n) => n.includes('J11')));
    assert.ok(codes.some((n) => n.includes('J12')));
    const j11 = dig.chassis.find((c) => c.label.includes('J11'))!;
    const labels = j11.options.map((o) => o.label).sort();
    assert.ok(labels.includes('158 PS'));
    assert.ok(labels.includes('160 PS'));
    assert.equal(one(g, 'e-POWER').fuel, 'hybrid');
    assert.ok(g.some((x) => x.label === '1.5 dCi'));
    assert.ok(g.some((x) => x.label === '1.2 DIG-T'));
  });

  test('Focus 1.6 TDCi, Clio 1.5 dCi, Golf 1.5 eTSI, Egea 1.3 MultiJet, Civic motorları kasa taşır', () => {
    const focus = one(groups('ford', 'focus'), '1.6 TDCi');
    assert.ok(focus.chassis.some((c) => !c.unassigned));
    assert.equal(focus.fuel, 'diesel');
    const clio = one(groups('renault', 'clio'), '1.5 dCi');
    assert.ok(clio.chassis.length >= 1);
    const golf = groups('volkswagen', 'golf').find((x) => /1\.5 eTSI|1\.5 TSI/i.test(x.label));
    assert.ok(golf, 'Golf 1.5 eTSI veya 1.5 TSI bulunamadı');
    assert.ok(golf!.chassis.length >= 1);
    const egea = one(groups('fiat', 'egea'), '1.3 MultiJet');
    assert.ok(egea.chassis.flatMap((c) => c.options.map((o) => o.label)).length >= 2);
    assert.equal(egea.fuel, 'diesel');
    const civic = groups('honda', 'civic');
    assert.ok(civic.some((x) => x.chassis.length >= 1));
    assert.ok(civic.some((x) => /i-VTEC|Type R|1\.5|1\.6/i.test(x.label)));
  });

  test('doğrulanmamış makyaj ilk döneme bağlanmaz', () => {
    const gen = {
      id: 'g',
      slug: 'kasa',
      name: 'Kasa',
      kind: 'generation' as const,
      labelPeriod: { start: { year: 2012 }, end: { year: 2018 } },
      revisions: [
        { id: 'r1', slug: 'makyajsiz', order: 1 },
        { id: 'r2', slug: 'makyajli', order: 2 },
      ],
    };
    const engine = { id: 'e', name: '1.6 TDCi', fuel: 'diesel' as const, brandId: 'ford', slug: '16', codes: [], status: 'sourced' as const, sourceIds: [], updatedAt: '2026-10-17' };
    const variant = {
      id: 'v',
      slug: '16-tdci',
      engineId: 'e',
      revisionIds: [],
      revisionMapping: 'unknown' as const,
      transmissions: [],
      marketIds: ['tr'],
      periods: [],
      marketAvailability: [{ marketId: 'tr', status: 'listed' as const, modelYears: [2014], trims: ['Titanium'], bodyTypes: [], sourceRefs: [], sourceIds: [] }],
      status: 'sourced' as const,
      sourceIds: [],
      updatedAt: '2026-10-17',
    };
    const unknown = engineGroupsForModel([gen], { g: [variant] }, { e: engine }, MARKETS, 'tr');
    assert.equal(unknown[0]?.chassis[0]?.options[0]?.revisionSlug, undefined);
    const confirmed = engineGroupsForModel(
      [gen],
      { g: [{ ...variant, revisionMapping: 'confirmed', revisionIds: ['r2'] }] },
      { e: engine },
      MARKETS,
      'tr',
    );
    assert.equal(confirmed[0]?.chassis[0]?.options[0]?.revisionSlug, 'makyajli');
  });

  test('belirsiz nesil gerçek kasa adı gibi yazılmaz', () => {
    const g = groups('nissan', 'qashqai');
    for (const group of g) {
      for (const c of group.chassis) {
        if (c.unassigned) assert.equal(c.label, 'Kasa bilgisi yok');
      }
    }
  });
});
