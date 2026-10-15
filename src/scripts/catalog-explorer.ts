/**
 * Katalog gezgininin tarayıcı tarafı.
 *
 * - Veri parça parça yüklenir: marka seçilince /data/brands/<marka>.json,
 *   nesil seçilince (veya model açılınca, ön yükleme olarak) /data/models/<marka>/<model>.json.
 * - Seçim durumu URL'de tutulur (?marka=ford&model=focus&nesil=mk2&donem=makyajli);
 *   bağlantı paylaşılabilir, geri/ileri tuşları çalışır.
 * - Pazar seçimi (Türkiye varsayılan / Avrupa / Tüm dünya) URL'de `pazar` ile tutulur; Türkiye
 *   seçiliyken yalnızca Türkiye kaydı olan motorlar listelenir (bkz. lib/catalog/market.ts).
 * - Motorlar yalnızca veride eşleştirildikleri makyaj dönemi altında listelenir.
 *   Eşleşmesi bilinmeyen motorlar ayrı, açıkça etiketlenmiş bir grupta gösterilir.
 */
import type {
  BrandPayload,
  BrandSummary,
  GenerationSummary,
  ModelPayload,
  ModelSummary,
  RevisionSummary,
} from '@/lib/catalog/payload';
import type { Engine, FuelType, Period, Source, Variant, VerificationStatus } from '@/lib/catalog/schema';
import {
  BASIS_LABELS,
  FUEL_LABELS,
  PENDING_TEXT,
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
  formatDisplacement,
  formatPower,
  formatTransmission,
  formatYearRange,
  generationLabel,
  vehiclePath,
  normalizeSearch,
} from '@/lib/catalog/format';
import {
  AVAILABILITY_LABELS,
  DEFAULT_MARKET_VIEW,
  MARKET_VIEWS,
  availabilityFor,
  formatModelYears,
  isPerformance,
  marketGroup,
  type MarketView,
} from '@/lib/catalog/market';

type Step = 'brand' | 'model' | 'detail';

interface Selection {
  brand?: string;
  model?: string;
  gen?: string;
  rev?: string;
}

// ---------------------------------------------------------------------------
// Küçük DOM yardımcısı: metinler daima textContent ile eklenir (XSS'e kapalı).
// ---------------------------------------------------------------------------
type Child = Node | string | number | null | undefined | false;
type Attrs = Record<string, string | number | boolean | undefined | EventListener>;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (typeof value === 'function') el.addEventListener(key.replace(/^on/, ''), value);
    else if (key === 'class') el.className = String(value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

const pending = (text = PENDING_TEXT) => h('span', { class: 'pending' }, text);

function statusBadge(status: VerificationStatus, compact = false) {
  return h(
    'span',
    { class: `badge status-${status}`, title: STATUS_DESCRIPTIONS[status] },
    compact && status === 'sourced' ? 'Kaynaklı' : STATUS_LABELS[status],
  );
}

function periodText(p: Period, marketName: (id: string) => string): string {
  return `${formatYearRange(p, true)} · ${marketName(p.marketId)} · ${BASIS_LABELS[p.basis]}${p.approximate ? ' (yaklaşık)' : ''}`;
}

// ---------------------------------------------------------------------------
// Veri yükleme (önbellekli)
// ---------------------------------------------------------------------------
const brandCache = new Map<string, Promise<BrandPayload>>();
const modelCache = new Map<string, Promise<ModelPayload>>();

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return (await res.json()) as T;
}

function loadBrand(slug: string) {
  let p = brandCache.get(slug);
  if (!p) {
    p = fetchJson<BrandPayload>(`/data/brands/${encodeURIComponent(slug)}.json`);
    p.catch(() => brandCache.delete(slug));
    brandCache.set(slug, p);
  }
  return p;
}

function loadModel(brandSlug: string, modelSlug: string) {
  const key = `${brandSlug}/${modelSlug}`;
  let p = modelCache.get(key);
  if (!p) {
    p = fetchJson<ModelPayload>(`/data/models/${encodeURIComponent(brandSlug)}/${encodeURIComponent(modelSlug)}.json`);
    p.catch(() => modelCache.delete(key));
    modelCache.set(key, p);
  }
  return p;
}

// ---------------------------------------------------------------------------
// Gezgin
// ---------------------------------------------------------------------------
export function initCatalogExplorer(root: HTMLElement) {
  const brands: BrandSummary[] = JSON.parse(root.querySelector('#catalog-brands')!.textContent || '[]');
  const brandList = root.querySelector<HTMLUListElement>('#brand-list')!;
  const brandSearch = root.querySelector<HTMLInputElement>('#brand-search')!;
  const modelSearch = root.querySelector<HTMLInputElement>('#model-search')!;
  const modelList = root.querySelector<HTMLDivElement>('#model-list')!;
  const detail = root.querySelector<HTMLDivElement>('#detail')!;
  const statusEl = root.querySelector<HTMLParagraphElement>('#catalog-status')!;
  const narrow = window.matchMedia('(max-width: 1099px)');

  let sel: Selection = {};
  let market: MarketView = DEFAULT_MARKET_VIEW;
  const marketSwitch = root.querySelector<HTMLFieldSetElement>('#market-switch');
  const isView = (v: string | null): v is MarketView => MARKET_VIEWS.some((m) => m.id === v);
  let step: Step = 'brand';
  const expanded = new Set<string>();
  const fuelFilter = new Set<FuelType>();
  let engineQuery = '';
  let brandData: BrandPayload | undefined;
  let modelData: ModelPayload | undefined;
  let renderToken = 0;

  const announce = (msg: string) => {
    statusEl.textContent = msg;
  };

  // --- URL <-> durum -------------------------------------------------------
  const readUrl = (): Selection => {
    const q = new URLSearchParams(location.search);
    return {
      brand: q.get('marka') ?? undefined,
      model: q.get('model') ?? undefined,
      gen: q.get('nesil') ?? undefined,
      rev: q.get('donem') ?? undefined,
    };
  };

  const writeUrl = (push: boolean) => {
    const q = new URLSearchParams();
    if (sel.brand) q.set('marka', sel.brand);
    if (sel.model) q.set('model', sel.model);
    if (sel.gen) q.set('nesil', sel.gen);
    if (sel.rev) q.set('donem', sel.rev);
    if (market !== DEFAULT_MARKET_VIEW) q.set('pazar', market);
    const url = `${location.pathname}${q.size ? `?${q}` : ''}`;
    if (url === `${location.pathname}${location.search}`) return;
    history[push ? 'pushState' : 'replaceState'](null, '', url);
  };

  // --- Adımlar (dar ekran) -------------------------------------------------
  const setStep = (next: Step, focus = false) => {
    step = next;
    root.dataset.step = next;
    root.querySelectorAll<HTMLButtonElement>('.explorer-steps [data-goto]').forEach((b) => {
      if (b.dataset.goto === next) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    if (focus && narrow.matches) {
      root.querySelector<HTMLElement>(`[data-panel="${next}"] h2`)?.focus();
      window.scrollTo({ top: root.offsetTop - 8 });
    }
  };

  root.querySelectorAll<HTMLButtonElement>('[data-goto]').forEach((b) =>
    b.addEventListener('click', () => setStep(b.dataset.goto as Step, true)),
  );

  // --- Yardımcı aramalar ---------------------------------------------------
  const currentModel = (): ModelSummary | undefined => brandData?.models.find((m) => m.slug === sel.model);
  const currentGen = (): GenerationSummary | undefined => currentModel()?.generations.find((g) => g.slug === sel.gen);
  const marketName = (id: string) =>
    modelData?.markets[id]?.name ?? brandData?.markets.find((m) => m.id === id)?.name ?? id;

  // --- Marka listesi -------------------------------------------------------
  const renderBrands = () => {
    const q = normalizeSearch(brandSearch.value);
    brandList.replaceChildren(
      ...brands
        .filter((b) => !q || normalizeSearch(b.name).includes(q))
        .map((b) =>
          h(
            'li',
            {},
            h(
              'a',
              {
                class: 'list-item',
                href: `?marka=${encodeURIComponent(b.slug)}`,
                'aria-current': sel.brand === b.slug ? 'true' : undefined,
                onclick: ((e: MouseEvent) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                  e.preventDefault();
                  selectBrand(b.slug);
                }) as EventListener,
              },
              h('span', { class: 'list-item-title' }, b.name),
              h('span', { class: 'list-item-meta' }, b.modelCount > 0 ? `${b.modelCount} model` : PENDING_TEXT),
            ),
          ),
        ),
    );
    if (brandList.children.length === 0) brandList.append(h('li', { class: 'empty' }, 'Eşleşen marka yok.'));
  };

  // --- Model / nesil listesi -----------------------------------------------
  const generationMatches = (g: GenerationSummary, q: string) =>
    normalizeSearch(`${generationLabel(g)} ${g.code ?? ''}`).includes(q) ||
    (/^\d{4}$/.test(q) &&
      Number(q) >= g.labelPeriod.start.year &&
      Number(q) <= (g.labelPeriod.end?.year ?? new Date().getFullYear()));

  const renderModels = () => {
    if (!sel.brand) {
      modelSearch.disabled = true;
      modelList.replaceChildren(h('p', { class: 'empty' }, 'Modelleri görmek için bir marka seçin.'));
      return;
    }
    if (!brandData) {
      modelList.replaceChildren(h('p', { class: 'empty' }, 'Yükleniyor…'));
      return;
    }
    modelSearch.disabled = false;
    root.querySelector('#panel-model-title')!.textContent = `${brandData.brand.name} modelleri`;

    if (brandData.models.length === 0) {
      modelList.replaceChildren(
        h('div', { class: 'empty-block' }, pending(), h('p', { class: 'empty' }, `${brandData.brand.name} için model verisi henüz girilmedi.`)),
      );
      return;
    }

    const q = normalizeSearch(modelSearch.value);
    const items = brandData.models
      .map((m) => {
        const nameHit = !q || normalizeSearch(m.name).includes(q);
        const gens = nameHit ? m.generations : m.generations.filter((g) => generationMatches(g, q));
        return { m, gens, visible: nameHit || gens.length > 0 };
      })
      .filter((x) => x.visible);

    if (items.length === 0) {
      modelList.replaceChildren(h('p', { class: 'empty' }, 'Eşleşen model veya nesil yok.'));
      return;
    }

    const ul = h('ul', { class: 'tree', 'data-roving': true });
    for (const { m, gens } of items) {
      const isOpen = expanded.has(m.slug) || (q !== '' && gens.length > 0);
      const groupId = `gens-${m.slug}`;
      const li = h(
        'li',
        { class: 'tree-model' },
        h(
          'button',
          {
            type: 'button',
            class: 'list-item tree-toggle',
            'aria-expanded': String(isOpen),
            'aria-controls': groupId,
            'data-selected': sel.model === m.slug ? 'true' : undefined,
            onclick: () => toggleModel(m.slug),
          },
          h('span', { class: 'chevron', 'aria-hidden': 'true' }),
          h('span', { class: 'list-item-title' }, m.name),
          h(
            'span',
            { class: 'list-item-meta' },
            m.generations.length > 0 ? `${m.generations.length} nesil` : PENDING_TEXT,
          ),
        ),
      );

      if (isOpen) {
        const sub = h('ul', { class: 'tree-gens', id: groupId });
        if (m.generations.length === 0) {
          sub.append(h('li', { class: 'tree-empty' }, pending(), ' Nesil bilgisi henüz girilmedi.'));
        }
        for (const g of gens) {
          const active = sel.model === m.slug && sel.gen === g.slug;
          sub.append(
            h(
              'li',
              {},
              h(
                'button',
                {
                  type: 'button',
                  class: 'list-item gen-item',
                  'aria-pressed': String(active),
                  onclick: () => selectGeneration(m.slug, g.slug),
                },
                h('span', { class: 'list-item-title' }, generationLabel(g)),
                h(
                  'span',
                  { class: 'list-item-meta' },
                  [
                    g.code,
                    `${marketName(g.labelPeriod.marketId)}, ${BASIS_LABELS[g.labelPeriod.basis]} yılları`,
                    market === 'world' ? null : `${MARKET_VIEWS.find((m) => m.id === market)!.label}: ${g.marketCounts?.[market] ?? 0} motor`,
                    g.revisions.length > 0 ? `${g.revisions.length} makyaj dönemi` : null,
                  ]
                    .filter(Boolean)
                    .join(' · '),
                ),
              ),
            ),
          );
        }
        li.append(sub);
      }
      ul.append(li);
    }
    modelList.replaceChildren(ul);
  };

  // --- Ayrıntı paneli ------------------------------------------------------
  const sourceLinks = (ids: string[], sources: Record<string, Source>) => {
    const list = ids.map((id) => sources[id]).filter(Boolean);
    if (list.length === 0) return null;
    return h(
      'span',
      { class: 'source-refs' },
      'Kaynak: ',
      ...list.flatMap((s, i) => [
        i > 0 ? ', ' : null,
        s.url ? h('a', { href: s.url, rel: 'noopener', target: '_blank' }, s.title) : s.title,
      ]),
    );
  };

  const specRow = (label: string, value: Child) =>
    h('div', { class: 'spec' }, h('dt', {}, label), h('dd', {}, value ?? pending()));

  const engineCard = (
    v: Variant,
    engine: Engine,
    gen: GenerationSummary,
    revId: string | undefined,
    selectedRev: RevisionSummary | undefined,
  ) => {
    const detailHref = vehiclePath({ brand: sel.brand!, model: sel.model!, generation: gen.slug, revision: selectedRev?.slug, variant: v.slug });
    const revName = (id: string) => gen.revisions.find((r) => r.id === id)?.name.toLocaleLowerCase('tr-TR') ?? id;
    const transmissions = v.transmissions.length
      ? h(
          'ul',
          { class: 'inline-list' },
          ...v.transmissions.map((t) =>
            h('li', {}, formatTransmission(t), t.revisionIds.length ? ` — yalnızca ${t.revisionIds.map(revName).join(', ')}` : ''),
          ),
        )
      : null;

    const notes = [engine.notes, v.notes].filter(Boolean) as string[];
    const otherRevisionsPossible = v.revisionMapping === 'partial' && revId !== undefined;
    const status: VerificationStatus =
      engine.status === 'conflicting' || v.status === 'conflicting' ? 'conflicting' : v.status;

    return h(
      'li',
      { class: 'engine-card' },
      h(
        'div',
        { class: 'engine-head' },
        h('h4', {}, engine.name),
        h(
          'div',
          { class: 'badges' },
          v.trimName ? h('span', { class: 'badge badge-trim' }, v.trimName) : null,
          engine.fuel ? h('span', { class: `badge fuel fuel-${engine.fuel}` }, FUEL_LABELS[engine.fuel]) : null,
          statusBadge(status, true),
        ),
      ),
      h(
        'dl',
        { class: 'specs' },
        specRow('Güç', formatPower(engine.power)),
        specRow('Tork', engine.torqueNm ? `${engine.torqueNm} Nm` : null),
        specRow('Hacim', formatDisplacement(engine) ?? (engine.fuel === 'electric' ? '—' : null)),
        specRow('Motor kodu', engine.codes.length ? engine.codes.join(', ') : null),
        specRow('Şanzıman', transmissions),
        engine.family ? specRow('Motor ailesi', engine.family) : null,
        engine.batteryKwh ? specRow('Batarya', `${engine.batteryKwh.toLocaleString('tr-TR')} kWh`) : null,
        v.drivetrain ? specRow('Çekiş', { fwd: 'Önden çekiş', rwd: 'Arkadan itiş', awd: 'Dört çeker' }[v.drivetrain]) : null,
        specRow('Yakıt', engine.fuel ? FUEL_LABELS[engine.fuel] : null),
        specRow('Pazar', v.marketIds.map(marketName).join(', ')),
        trRow(v),
        v.periods.length ? specRow('Dönem', v.periods.map((p) => periodText(p, marketName)).join('; ')) : null,
      ),
      otherRevisionsPossible
        ? h('p', { class: 'engine-note' }, 'Bu motor diğer makyaj döneminde de sunulmuş olabilir; henüz doğrulanmadı.')
        : null,
      ...notes.map((n) => h('p', { class: 'engine-note' }, n)),
      modelData ? h('p', { class: 'engine-sources' }, sourceLinks([...new Set([...v.sourceIds, ...engine.sourceIds])], modelData.sources)) : null,
      h('a', { class: 'engine-link', href: detailHref }, 'Ayrıntılar ve kronik sorunlar', h('span', { 'aria-hidden': 'true' }, ' →')),
    );
  };

  /** Türkiye pazar durumu: kaynak, model yılları, donanım ve gövde tipleri. */
  const trRow = (v: Variant) => {
    const a = availabilityFor(v, 'tr');
    if (!a) return specRow('Türkiye', 'Türkiye satışı doğrulanmadı');
    const parts = [AVAILABILITY_LABELS[a.status]];
    if (a.modelYears.length) parts.push(`model yılı ${formatModelYears(a.modelYears)}`);
    return h(
      'div',
      { class: 'spec spec-wide' },
      h('dt', {}, 'Türkiye'),
      h(
        'dd',
        {},
        parts.join(' · '),
        a.trims.length ? h('span', { class: 'spec-sub' }, `Donanım: ${a.trims.slice(0, 10).join(', ')}${a.trims.length > 10 ? ' …' : ''}`) : null,
        a.bodyTypes.length ? h('span', { class: 'spec-sub' }, `Gövde: ${a.bodyTypes.join(', ')}`) : null,
      ),
    );
  };

  const filterVariants = (variants: Variant[]) => {
    const q = normalizeSearch(engineQuery);
    return variants.filter((v) => {
      const e = modelData!.engines[v.engineId]!;
      if (fuelFilter.size > 0 && (!e.fuel || !fuelFilter.has(e.fuel))) return false;
      if (!q) return true;
      return normalizeSearch(`${e.name} ${e.family ?? ''} ${e.codes.join(' ')} ${v.trimName ?? ''}`).includes(q);
    });
  };

  const sortVariants = (variants: Variant[]) => {
    const fuelOrder = Object.keys(FUEL_LABELS);
    return [...variants].sort((a, b) => {
      const ea = modelData!.engines[a.engineId]!;
      const eb = modelData!.engines[b.engineId]!;
      return (
        fuelOrder.indexOf(ea.fuel ?? '') - fuelOrder.indexOf(eb.fuel ?? '') ||
        (ea.displacementL ?? 99) - (eb.displacementL ?? 99) ||
        ea.name.localeCompare(eb.name, 'tr', { numeric: true })
      );
    });
  };

  const renderEngines = (gen: GenerationSummary, rev: RevisionSummary | undefined, container: HTMLElement) => {
    const everything = modelData!.variantsByGeneration[gen.id] ?? [];
    if (everything.length === 0) {
      container.replaceChildren(h('div', { class: 'empty-block' }, pending(), h('p', { class: 'empty' }, 'Bu nesil için motor verisi henüz girilmedi.')));
      return;
    }

    // Pazar filtresi: Türkiye'de ana liste yalnızca Türkiye kaydı olanlar; ithaller ve diğer pazarlar ayrı.
    const markets = Object.values(modelData!.markets).concat(brandData?.markets ?? []);
    const inMarket = everything.filter((v) => marketGroup(v, market, markets) === 'primary');
    const imported = everything.filter((v) => marketGroup(v, market, markets) === 'imported');
    const hiddenCount = everything.length - inMarket.length - imported.length;
    const performance = inMarket.filter(isPerformance);
    const all = inMarket.filter((v) => !isPerformance(v));
    const primary = rev ? all.filter((v) => v.revisionIds.includes(rev.id)) : all;
    const unmapped = rev ? all.filter((v) => !v.revisionIds.includes(rev.id) && v.revisionMapping !== 'confirmed') : [];

    // Yakıt filtresi yalnızca bu seçimde gerçekten bulunan yakıt türlerini sunar.
    const fuels = [...new Set([...primary, ...unmapped, ...performance].map((v) => modelData!.engines[v.engineId]!.fuel).filter((f): f is FuelType => !!f))].sort(
      (a, b) => Object.keys(FUEL_LABELS).indexOf(a) - Object.keys(FUEL_LABELS).indexOf(b),
    );
    for (const f of [...fuelFilter]) if (!fuels.includes(f)) fuelFilter.delete(f);

    const shownPrimary = sortVariants(filterVariants(primary));
    const shownUnmapped = sortVariants(filterVariants(unmapped));

    const fuelset = h(
      'fieldset',
      { class: 'chips' },
      h('legend', { class: 'visually-hidden' }, 'Yakıt türüne göre filtrele'),
      ...fuels.map((f) =>
        h(
          'label',
          { class: 'chip' },
          h('input', {
            type: 'checkbox',
            value: f,
            checked: fuelFilter.has(f),
            onchange: ((e: Event) => {
              const input = e.target as HTMLInputElement;
              if (input.checked) fuelFilter.add(f);
              else fuelFilter.delete(f);
              renderEngines(gen, rev, container);
              container.querySelector<HTMLInputElement>(`.chips input[value="${f}"]`)?.focus();
            }) as EventListener,
          }),
          h('span', {}, FUEL_LABELS[f]),
        ),
      ),
    );

    const search = h('input', {
      type: 'search',
      class: 'engine-search',
      placeholder: 'Motor ara (örn. TDCi, 1.6, G8DA)',
      value: engineQuery,
      'aria-label': 'Motor ara',
      autocomplete: 'off',
      spellcheck: 'false',
    });
    search.addEventListener('input', () => {
      engineQuery = search.value;
      renderEngines(gen, rev, container);
      const again = container.querySelector<HTMLInputElement>('.engine-search')!;
      again.focus();
      again.setSelectionRange(again.value.length, again.value.length);
    });

    const heading = rev ? `${rev.name} döneme ait motorlar` : 'Motorlar';
    const issuesHint = h(
      'p',
      { class: 'engines-hint' },
      'Kronik sorunları görmek için bir motorun “Ayrıntılar ve kronik sorunlar” bağlantısını açın. Motora özgü sorunlarla birlikte kasa ve model genelindeki sorunlar da listelenir.',
    );
    const children: Child[] = [
      issuesHint,
      h('div', { class: 'engine-tools' }, fuelset, search),
      h(
        'div',
        { class: 'engine-section-head' },
        h('h3', {}, heading),
        h('span', { class: 'count' }, `${shownPrimary.length} / ${primary.length}`),
      ),
    ];

    if (shownPrimary.length) {
      children.push(h('ul', { class: 'engine-list' }, ...shownPrimary.map((v) => engineCard(v, modelData!.engines[v.engineId]!, gen, rev?.id, rev))));
    } else {
      children.push(
        h(
          'p',
          { class: 'empty' },
          primary.length
            ? 'Filtreye uyan motor yok.'
            : all.length === 0 && market !== 'world'
              ? `Bu nesil için ${market === 'tr' ? 'Türkiye' : 'Avrupa'} kaydı olan motor henüz yok.`
              : 'Bu döneme doğrulanmış olarak eşleştirilmiş motor henüz yok.',
        ),
      );
    }

    if (unmapped.length) {
      children.push(
        h(
          'details',
          { class: 'unmapped', open: primary.length === 0 },
          h(
            'summary',
            {},
            h('span', {}, 'Makyaj dönemi eşleşmesi doğrulanmamış motorlar'),
            h('span', { class: 'count' }, `${shownUnmapped.length} / ${unmapped.length}`),
          ),
          h(
            'p',
            { class: 'unmapped-help' },
            `Bu motorlar ${gen.name} neslinde sunuldu, ancak hangi makyaj döneminde sunulduğu kaynaklarla henüz doğrulanmadı. Bu yüzden seçili dönemin altına otomatik olarak eklenmedi.`,
          ),
          shownUnmapped.length
            ? h('ul', { class: 'engine-list' }, ...shownUnmapped.map((v) => engineCard(v, modelData!.engines[v.engineId]!, gen, undefined, rev)))
            : h('p', { class: 'empty' }, 'Filtreye uyan motor yok.'),
        ),
      );
    }

    const extraGroup = (title: string, help: string, list: Variant[], open: boolean) => {
      const shown = sortVariants(filterVariants(list));
      return h(
        'details',
        { class: 'unmapped', open },
        h('summary', {}, h('span', {}, title), h('span', { class: 'count' }, `${shown.length} / ${list.length}`)),
        h('p', { class: 'unmapped-help' }, help),
        shown.length
          ? h('ul', { class: 'engine-list' }, ...shown.map((v) => engineCard(v, modelData!.engines[v.engineId]!, gen, rev && v.revisionIds.includes(rev.id) ? rev.id : undefined, rev)))
          : h('p', { class: 'empty' }, 'Filtreye uyan motor yok.'),
      );
    };
    if (performance.length) {
      children.push(extraGroup('Özel performans modelleri', 'Az sayıda üretilen performans versiyonları (ST, RS, GTI …). Makyaj dönemi eşleşmesi her kartta ayrıca belirtilir.', performance, true));
    }
    if (imported.length) {
      children.push(extraGroup('İthal olarak görülebilenler', "Türkiye'de görülebilen ama resmi distribütör listesinde olmayan (ör. ABD tipi) araçlar.", imported, false));
    }
    if (hiddenCount > 0 && market !== 'world') {
      const where = market === 'tr' ? "Türkiye'de" : "Avrupa'da";
      children.push(
        h(
          'p',
          { class: 'callout market-hidden' },
          `${market === 'tr' ? 'Türkiye' : 'Avrupa'} kaydı bulunmayan ${hiddenCount} motor bu listede gösterilmiyor. Bu, o motorun ${where} satılmadığı anlamına gelmez; yalnızca kaynakla doğrulanmadı. `,
          h('button', { type: 'button', class: 'linklike', onclick: () => setMarket('world') }, 'Tüm dünya kataloğunu göster'),
        ),
      );
    }

    container.replaceChildren(...children.filter((c): c is Node => c instanceof Node));
    announce(`${shownPrimary.length} motor listeleniyor.`);
  };

  const renderDetail = async () => {
    const token = ++renderToken;
    const model = currentModel();
    const gen = currentGen();

    if (!brandData || !model || !gen) {
      detail.replaceChildren(
        h(
          'div',
          { class: 'empty-hero' },
          h('p', { class: 'empty-title' }, 'Aracını adım adım bul'),
          h('p', { class: 'empty' }, 'Marka → model → nesil → makyaj dönemi → motor sırasıyla seçim yapın.'),
        ),
      );
      return;
    }

    const rev = gen.revisions.find((r) => r.slug === sel.rev);
    const title = h('h2', { class: 'detail-title', tabindex: '-1' }, `${brandData.brand.name} ${generationLabel(gen)}`);
    const crumbs = h(
      'p',
      { class: 'crumbs' },
      [brandData.brand.name, model.name, generationLabel(gen), rev ? `${rev.name} (${formatYearRange(rev.periods[0] ?? gen.labelPeriod)})` : null]
        .filter(Boolean)
        .join(' › '),
    );

    const media = h(
      'div',
      { class: 'media-placeholder', role: 'img', 'aria-label': 'Araç görseli henüz eklenmedi' },
      h('span', { 'aria-hidden': 'true', class: 'media-icon' }),
      h('span', {}, 'Görsel yakında'),
    );

    const facts = h(
      'dl',
      { class: 'facts' },
      h('div', {}, h('dt', {}, 'Kasa / platform kodu'), h('dd', {}, gen.code ?? pending())),
      h('div', {}, h('dt', {}, 'Etiketteki yıllar'), h('dd', {}, periodText(gen.labelPeriod, marketName))),
      gen.periods.length
        ? h('div', {}, h('dt', {}, 'Diğer dönemler'), h('dd', {}, gen.periods.map((p) => periodText(p, marketName)).join('; ')))
        : null,
      h('div', {}, h('dt', {}, 'Doğrulama'), h('dd', {}, statusBadge(gen.status))),
    );

    const head = h('div', { class: 'detail-head' }, h('div', { class: 'detail-titles' }, crumbs, title, facts), media);
    const genNote = gen.notes ? h('p', { class: 'note' }, gen.notes) : null;

    // Makyaj dönemi seçimi (yalnızca veride makyaj dönemi varsa).
    let revisionPicker: HTMLElement | null = null;
    if (gen.revisions.length > 0) {
      revisionPicker = h(
        'fieldset',
        { class: 'revisions' },
        h('legend', {}, 'Makyaj dönemi'),
        h(
          'div',
          { class: 'revision-options' },
          ...gen.revisions.map((r) =>
            h(
              'label',
              { class: 'revision-option' },
              h('input', {
                type: 'radio',
                name: `rev-${gen.id}`,
                value: r.slug,
                checked: r.slug === sel.rev,
                onchange: () => selectRevision(r.slug),
              }),
              h(
                'span',
                { class: 'revision-body' },
                h('span', { class: 'revision-name' }, `${r.name} (${r.periods[0] ? formatYearRange(r.periods[0]) : '?'})`),
                h(
                  'span',
                  { class: 'revision-meta' },
                  r.periods[0] ? `${marketName(r.periods[0].marketId)}, ${BASIS_LABELS[r.periods[0].basis]}${r.periods[0].approximate ? ', yaklaşık' : ''}` : PENDING_TEXT,
                ),
              ),
            ),
          ),
        ),
        rev?.notes ? h('p', { class: 'note' }, rev.notes) : null,
      );
    }

    const engines = h('section', { class: 'engines', 'aria-label': 'Motor seçenekleri' });
    const sourcesBox = h('section', { class: 'sources', 'aria-label': 'Kaynaklar' });

    detail.replaceChildren(head, genNote ?? '', revisionPicker ?? '', engines, sourcesBox);

    if (gen.revisions.length > 0 && !rev) {
      engines.replaceChildren(h('p', { class: 'callout' }, 'Motor seçeneklerini görmek için bir makyaj dönemi seçin.'));
    } else {
      engines.replaceChildren(h('p', { class: 'empty' }, 'Motorlar yükleniyor…'));
    }

    try {
      modelData = await loadModel(sel.brand!, model.slug);
    } catch {
      if (token === renderToken) engines.replaceChildren(h('p', { class: 'error' }, 'Motor verisi yüklenemedi. Sayfayı yenileyip tekrar deneyin.'));
      return;
    }
    if (token !== renderToken) return;

    if (gen.revisions.length === 0 || rev) renderEngines(gen, rev, engines);

    // Kaynaklar ve güncelleme bilgisi
    const genSourceIds = new Set<string>(
      (modelData.variantsByGeneration[gen.id] ?? []).flatMap((v) => [...v.sourceIds, ...modelData!.engines[v.engineId]!.sourceIds]),
    );
    const sources = [...genSourceIds].map((id) => modelData!.sources[id]).filter(Boolean);
    if (sources.length) {
      sourcesBox.replaceChildren(
        h('h3', {}, 'Kaynaklar'),
        h(
          'ul',
          {},
          ...sources.map((s) =>
            h(
              'li',
              {},
              s.url ? h('a', { href: s.url, rel: 'noopener', target: '_blank' }, s.title) : s.title,
              ` — ${s.publisher ?? ''}, erişim ${new Date(s.accessedAt).toLocaleDateString('tr-TR')}`,
              s.tier === 'secondary' ? ' (ikincil kaynak)' : '',
            ),
          ),
        ),
        h('p', { class: 'updated' }, `Son güncelleme: ${new Date(modelData.updatedAt).toLocaleDateString('tr-TR')}`),
      );
    }
  };

  // --- Eylemler ------------------------------------------------------------
  function syncMarketSwitch() {
    marketSwitch?.querySelectorAll<HTMLInputElement>('input[name="pazar"]').forEach((i) => (i.checked = i.value === market));
  }

  /** Pazar değişince seçim (marka/model/nesil/dönem) korunur; yalnızca listeler yeniden çizilir. */
  function setMarket(next: MarketView) {
    if (next === market) return;
    market = next;
    syncMarketSwitch();
    writeUrl(false);
    renderModels();
    void renderDetail();
    announce(`Pazar: ${MARKET_VIEWS.find((m) => m.id === next)!.label}`);
  }
  marketSwitch?.addEventListener('change', (e) => {
    const v = (e.target as HTMLInputElement).value;
    if (isView(v)) setMarket(v);
  });

  const resetEngineFilters = () => {
    fuelFilter.clear();
    engineQuery = '';
  };

  async function selectBrand(slug: string, opts: { push?: boolean; moveStep?: boolean } = {}) {
    const { push = true, moveStep = true } = opts;
    if (sel.brand !== slug) {
      sel = { brand: slug };
      brandData = undefined;
      modelData = undefined;
      expanded.clear();
      modelSearch.value = '';
      resetEngineFilters();
    }
    writeUrl(push);
    renderBrands();
    renderModels();
    void renderDetail();
    if (moveStep) setStep('model', true);
    try {
      const data = await loadBrand(slug);
      if (sel.brand !== slug) return;
      brandData = data;
      if (sel.model) expanded.add(sel.model);
      renderModels();
      await renderDetail();
      announce(`${data.brand.name}: ${data.models.length} model.`);
    } catch {
      if (sel.brand === slug) modelList.replaceChildren(h('p', { class: 'error' }, 'Model listesi yüklenemedi.'));
    }
  }

  function toggleModel(slug: string) {
    if (expanded.has(slug)) expanded.delete(slug);
    else {
      expanded.add(slug);
      const m = brandData?.models.find((x) => x.slug === slug);
      if (m && m.generations.length > 0 && sel.brand) void loadModel(sel.brand, slug).catch(() => {}); // ön yükleme
    }
    renderModels();
    root.querySelector<HTMLButtonElement>(`[aria-controls="gens-${slug}"]`)?.focus();
  }

  function selectGeneration(modelSlug: string, genSlug: string) {
    if (sel.model !== modelSlug || sel.gen !== genSlug) {
      sel = { brand: sel.brand, model: modelSlug, gen: genSlug };
      resetEngineFilters();
    }
    writeUrl(true);
    renderModels();
    void renderDetail().then(() => {
      if (!narrow.matches) detail.querySelector<HTMLElement>('.detail-title')?.focus();
    });
    setStep('detail', true);
  }

  function selectRevision(revSlug: string) {
    sel = { ...sel, rev: revSlug };
    writeUrl(false);
    void renderDetail().then(() => detail.querySelector<HTMLInputElement>(`.revisions input[value="${revSlug}"]`)?.focus());
  }

  // --- Klavye: listelerde ok tuşlarıyla gezinme -----------------------------
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    const target = e.target as HTMLElement;
    const list = target.closest('[data-roving]');
    if (!list || !target.matches('.list-item')) return;
    const items = [...list.querySelectorAll<HTMLElement>('.list-item')];
    const i = items.indexOf(target);
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : Math.max(0, Math.min(items.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)));
    items[next]?.focus();
    e.preventDefault();
  });

  brandSearch.addEventListener('input', renderBrands);
  brandSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') brandList.querySelector<HTMLElement>('.list-item')?.click();
    if (e.key === 'ArrowDown') {
      brandList.querySelector<HTMLElement>('.list-item')?.focus();
      e.preventDefault();
    }
  });
  modelSearch.addEventListener('input', renderModels);
  modelSearch.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      modelList.querySelector<HTMLElement>('.list-item')?.focus();
      e.preventDefault();
    }
  });

  // --- Başlangıç / geri-ileri ----------------------------------------------
  const restore = async () => {
    const fromUrl = readUrl();
    const p = new URLSearchParams(location.search).get('pazar');
    market = isView(p) ? p : DEFAULT_MARKET_VIEW;
    syncMarketSwitch();
    if (!fromUrl.brand || !brands.some((b) => b.slug === fromUrl.brand)) {
      sel = {};
      brandData = undefined;
      renderBrands();
      renderModels();
      void renderDetail();
      setStep('brand');
      return;
    }
    const brandChanged = fromUrl.brand !== sel.brand;
    sel = fromUrl;
    if (brandChanged) {
      brandData = undefined;
      expanded.clear();
    }
    if (sel.model) expanded.add(sel.model);
    await selectBrand(fromUrl.brand, { push: false, moveStep: false });
    setStep(sel.gen ? 'detail' : 'model');
  };

  window.addEventListener('popstate', () => void restore());
  narrow.addEventListener('change', () => setStep(step));
  void restore();
}
