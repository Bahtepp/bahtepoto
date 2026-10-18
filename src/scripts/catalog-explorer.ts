/**
 * Katalog gezgini: Marka → Model → Motor → Kasa → gerekirse güç.
 * Veri parça parça yüklenir. Seçim URL'de tutulur.
 * Kaynak metinleri ve sigorta satırları kullanıcıya gösterilmez.
 */
import type { BrandPayload, BrandSummary, ModelPayload, ModelSummary } from '@/lib/catalog/payload';
import type { FuelType } from '@/lib/catalog/schema';
import { canonicalModelSlug } from '@/lib/catalog/aliases';
import { FUEL_LABELS, vehiclePath, withBase, normalizeSearch } from '@/lib/catalog/format';
import { engineGroupsForModel, type ChassisOption, type EngineGroupView } from '@/lib/catalog/selector';
import { searchCatalog, type SearchHit, type SearchIndex } from '@/lib/catalog/search';

type Step = 'brand' | 'model' | 'detail';

interface Selection {
  brand?: string;
  model?: string;
  engine?: string;
  gen?: string;
}

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

const brandCache = new Map<string, Promise<BrandPayload>>();
const modelCache = new Map<string, Promise<ModelPayload>>();
let searchCache: Promise<SearchIndex> | undefined;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return (await res.json()) as T;
}

function loadBrand(slug: string) {
  let p = brandCache.get(slug);
  if (!p) {
    p = fetchJson<BrandPayload>(withBase(`/data/brands/${encodeURIComponent(slug)}.json`));
    p.catch(() => brandCache.delete(slug));
    brandCache.set(slug, p);
  }
  return p;
}

function loadModel(brandSlug: string, modelSlug: string) {
  const key = `${brandSlug}/${modelSlug}`;
  let p = modelCache.get(key);
  if (!p) {
    p = fetchJson<ModelPayload>(withBase(`/data/models/${encodeURIComponent(brandSlug)}/${encodeURIComponent(modelSlug)}.json`));
    p.catch(() => modelCache.delete(key));
    modelCache.set(key, p);
  }
  return p;
}

function loadSearch() {
  searchCache ??= fetchJson<SearchIndex>(withBase('/data/search.json'));
  return searchCache;
}

function fuelBadge(fuel?: FuelType): HTMLSpanElement | string {
  return fuel ? h('span', { class: `badge fuel fuel-${fuel}` }, FUEL_LABELS[fuel]) : '';
}

export function initCatalogExplorer(root: HTMLElement) {
  const brands: BrandSummary[] = JSON.parse(root.querySelector('#catalog-brands')!.textContent || '[]');
  const brandList = root.querySelector<HTMLUListElement>('#brand-list')!;
  const brandSearch = root.querySelector<HTMLInputElement>('#brand-search')!;
  const modelSearch = root.querySelector<HTMLInputElement>('#model-search')!;
  const modelList = root.querySelector<HTMLDivElement>('#model-list')!;
  const detail = root.querySelector<HTMLDivElement>('#detail')!;
  const statusEl = root.querySelector<HTMLParagraphElement>('#catalog-status')!;
  const globalSearch = root.querySelector<HTMLInputElement>('#global-search')!;
  const searchResults = root.querySelector<HTMLUListElement>('#search-results')!;
  const archiveToggle = root.querySelector<HTMLButtonElement>('#archive-toggle')!;
  const narrow = window.matchMedia('(max-width: 1099px)');

  let sel: Selection = {};
  let archive = false;
  let brandData: BrandPayload | undefined;
  let modelData: ModelPayload | undefined;
  let groups: EngineGroupView[] = [];
  let renderToken = 0;

  const announce = (msg: string) => {
    statusEl.textContent = msg;
  };

  const visibleBrands = () => brands.filter((b) => (archive ? b.tier === 'review' : b.tier === 'primary') && (archive || b.modelCount > 0));

  const readUrl = (): Selection => {
    const q = new URLSearchParams(location.search);
    const brand = q.get('marka') ?? undefined;
    const rawModel = q.get('model') ?? undefined;
    return {
      brand,
      model: brand && rawModel ? canonicalModelSlug(brand, rawModel) : rawModel,
      engine: q.get('motor') ?? undefined,
      gen: q.get('nesil') ?? undefined,
    };
  };

  const stripObsoleteQuery = () => {
    const q = new URLSearchParams(location.search);
    let changed = false;
    if (q.has('market') || q.has('pazar')) {
      q.delete('market');
      q.delete('pazar');
      changed = true;
    }
    const brand = q.get('marka');
    const model = q.get('model');
    if (brand && model) {
      const canon = canonicalModelSlug(brand, model);
      if (canon !== model) {
        q.set('model', canon);
        changed = true;
      }
    }
    if (!changed) return;
    const url = `${location.pathname}${q.size ? `?${q}` : ''}`;
    history.replaceState(null, '', url);
  };

  const writeUrl = (push: boolean) => {
    const q = new URLSearchParams();
    if (sel.brand) q.set('marka', sel.brand);
    if (sel.model) q.set('model', sel.model);
    if (sel.engine) q.set('motor', sel.engine);
    if (sel.gen) q.set('nesil', sel.gen);
    if (archive) q.set('arsiv', '1');
    const url = `${location.pathname}${q.size ? `?${q}` : ''}`;
    if (url === `${location.pathname}${location.search}`) return;
    history[push ? 'pushState' : 'replaceState'](null, '', url);
  };

  const setStep = (next: Step, focus = false) => {
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
    b.addEventListener('click', () => {
      const goto = b.dataset.goto as Step;
      if (goto === 'brand') {
        sel = {};
        writeUrl(true);
        renderAll();
      } else if (goto === 'model' && sel.brand) {
        sel = { brand: sel.brand };
        writeUrl(true);
        renderAll();
      }
      setStep(goto, true);
    }),
  );

  const turkeyModels = (list: ModelSummary[]) => list.filter((m) => m.generations.some((g) => (g.marketCounts?.tr ?? 0) > 0));

  const renderBrands = () => {
    const q = normalizeSearch(brandSearch.value);
    const items = visibleBrands().filter((b) => !q || normalizeSearch(b.name).includes(q));
    brandList.replaceChildren(
      ...items.map((b) =>
        h(
          'li',
          {},
          h(
            'a',
            {
              class: 'list-item',
              href: `?marka=${encodeURIComponent(b.slug)}${archive ? '&arsiv=1' : ''}`,
              'aria-current': sel.brand === b.slug ? 'true' : undefined,
              onclick: ((e: MouseEvent) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                void selectBrand(b.slug);
              }) as EventListener,
            },
            h('span', { class: 'list-item-title' }, b.name),
            h('span', { class: 'list-item-meta' }, b.modelCount > 0 ? `${b.modelCount} model` : 'Arşiv'),
          ),
        ),
      ),
    );
    if (brandList.children.length === 0) brandList.append(h('li', { class: 'empty' }, archive ? 'Arşivde eşleşen marka yok.' : 'Eşleşen marka yok.'));
    archiveToggle.textContent = archive ? 'Türkiye kataloğuna dön' : 'Nadir markalar';
    archiveToggle.setAttribute('aria-pressed', String(archive));
  };

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
    const q = normalizeSearch(modelSearch.value);
    const items = turkeyModels(brandData.models).filter((m) => !q || normalizeSearch(m.name).includes(q));
    if (items.length === 0) {
      modelList.replaceChildren(h('p', { class: 'empty' }, q ? 'Eşleşen model yok.' : 'Bu markada Türkiye kaydı olan model yok.'));
      return;
    }
    const archiveNote = brandData.brand.tier === 'review'
      ? h('p', { class: 'empty' }, 'Bu marka Türkiye ana kataloğunda değil. Nadir marka arşivindedir.')
      : null;
    modelList.replaceChildren(
      ...(archiveNote ? [archiveNote] : []),
      h(
        'ul',
        { class: 'list', 'data-roving': true },
        ...items.map((m) =>
          h(
            'li',
            {},
            h(
              'button',
              {
                type: 'button',
                class: 'list-item',
                'aria-current': sel.model === m.slug ? 'true' : undefined,
                onclick: () => void selectModel(m.slug),
              },
              h('span', { class: 'list-item-title' }, m.name),
            ),
          ),
        ),
      ),
    );
  };

  const currentModel = () => brandData?.models.find((m) => m.slug === sel.model);
  const currentGroup = () => groups.find((g) => g.slug === sel.engine);

  const detailLink = (chassis: ChassisOption, option = chassis.options[0]) => {
    if (!option || !sel.brand || !sel.model) return '#';
    return withBase(vehiclePath({ brand: sel.brand, model: sel.model, generation: chassis.slug, revision: option.revisionSlug, variant: option.variantSlug }));
  };

  const renderDetail = () => {
    const notice = brandData?.brand.tier === 'review'
      ? h('p', { class: 'empty' }, 'Bu marka Türkiye ana kataloğunda değil. Nadir marka arşivindedir.')
      : null;
    const paint = (...nodes: (HTMLElement | string)[]) => detail.replaceChildren(...(notice ? [notice, ...nodes] : nodes));
    const model = currentModel();
    if (!brandData || !model) {
      if (brandData && sel.model) {
        paint(h('h2', { class: 'detail-title' }, 'Ana katalogda değil'), h('p', { class: 'empty' }, 'Bu model Türkiye ana kataloğunda yer almıyor.'));
        return;
      }
      paint(
        h('div', { class: 'empty-hero' }, h('p', { class: 'empty-title' }, 'Aracını motorundan bul'), h('p', { class: 'empty' }, 'Marka, model, sonra motor. Kasa, motoru seçtikten sonra gelir.')),
      );
      return;
    }
    const group = currentGroup();
    if (!group) {
      paint(
        h('p', { class: 'crumbs' }, `${brandData.brand.name} › ${model.name}`),
        h('h2', { class: 'detail-title', tabindex: '-1' }, `${brandData.brand.name} ${model.name}`),
        h('p', { class: 'engines-hint' }, 'Motoru seçin. Aynı motorun farklı kasaları bir sonraki adımda ayrılır.'),
        groups.length
          ? h(
              'ul',
              { class: 'list' },
              ...groups.map((g) =>
                h(
                  'li',
                  {},
                  h(
                    'button',
                    { type: 'button', class: 'list-item', onclick: () => selectEngine(g.slug) },
                    h('span', { class: 'list-item-title' }, g.label),
                    h('span', { class: 'list-item-meta' }, [g.fuel ? FUEL_LABELS[g.fuel] : null, g.performance ? 'Performans' : null, `${g.chassis.length} kasa`].filter(Boolean).join(' · ')),
                  ),
                ),
              ),
            )
          : h('p', { class: 'empty' }, 'Bu model için Türkiye kaydı olan motor yok.'),
      );
      return;
    }

    const chassis = sel.gen ? group.chassis.find((c) => c.slug === sel.gen) : undefined;
    if (chassis && chassis.options.length > 1) {
      paint(
        h('button', { type: 'button', class: 'back', onclick: () => selectEngine(group.slug) }, '← Kasalar'),
        h('p', { class: 'crumbs' }, `${brandData.brand.name} › ${model.name} › ${group.label}`),
        h('h2', { class: 'detail-title', tabindex: '-1' }, `${chassis.label}${chassis.years ? ` (${chassis.years})` : ''}`),
        h('p', { class: 'engines-hint' }, 'Güç seçenekleri'),
        h(
          'ul',
          { class: 'list' },
          ...chassis.options.map((o) =>
            h(
              'li',
              {},
              h(
                'a',
                { class: 'list-item', href: detailLink(chassis, o) },
                h('span', { class: 'list-item-title' }, o.label),
                fuelBadge(group.fuel),
              ),
            ),
          ),
        ),
      );
      return;
    }

    paint(
      h('button', { type: 'button', class: 'back', onclick: () => { sel = { brand: sel.brand, model: sel.model }; writeUrl(true); renderDetail(); } }, '← Motorlar'),
      h('p', { class: 'crumbs' }, `${brandData.brand.name} › ${model.name} › ${group.label}`),
      h('h2', { class: 'detail-title', tabindex: '-1' }, group.label),
      fuelBadge(group.fuel),
      h('p', { class: 'engines-hint' }, 'Bu motorun bulunduğu kasalar'),
      h(
        'ul',
        { class: 'list' },
        ...group.chassis.map((c) => {
          const single = c.options.length === 1;
          const body = [
            h('span', { class: 'list-item-title' }, c.unassigned ? 'Kasa bilgisi yok' : c.label),
            h('span', { class: 'list-item-meta' }, [c.years || null, single ? null : `${c.options.length} güç`].filter(Boolean).join(' · ')),
          ];
          return h(
            'li',
            {},
            single
              ? h('a', { class: 'list-item', href: detailLink(c) }, ...body)
              : h('button', { type: 'button', class: 'list-item', onclick: () => selectChassis(c.slug) }, ...body),
          );
        }),
      ),
    );
  };

  const renderAll = () => {
    renderBrands();
    renderModels();
    renderDetail();
  };

  async function refreshGroups() {
    const model = currentModel();
    if (!model || !modelData || !brandData) {
      groups = [];
      return;
    }
    groups = engineGroupsForModel(model.generations, modelData.variantsByGeneration, modelData.engines);
  }

  async function selectBrand(slug: string, opts: { push?: boolean; moveStep?: boolean } = {}) {
    const { push = true, moveStep = true } = opts;
    const known = brands.find((b) => b.slug === slug);
    if (known) archive = known.tier === 'review';
    if (sel.brand !== slug) {
      sel = { brand: slug };
      brandData = undefined;
      modelData = undefined;
      groups = [];
      modelSearch.value = '';
    }
    writeUrl(push);
    renderAll();
    if (moveStep) setStep('model', true);
    try {
      const data = await loadBrand(slug);
      if (sel.brand !== slug) return;
      brandData = data;
      renderModels();
      if (sel.model) await selectModel(sel.model, { push: false, moveStep: true });
      announce(`${data.brand.name}: ${turkeyModels(data.models).length} model.`);
    } catch {
      if (sel.brand === slug) modelList.replaceChildren(h('p', { class: 'error' }, 'Model listesi yüklenemedi.'));
    }
  }

  async function selectModel(slug: string, opts: { push?: boolean; moveStep?: boolean } = {}) {
    const { push = true, moveStep = true } = opts;
    const keepEngine = sel.model === slug ? sel.engine : undefined;
    const keepGen = sel.model === slug ? sel.gen : undefined;
    sel = { brand: sel.brand, model: slug, engine: keepEngine, gen: keepGen };
    writeUrl(push);
    renderModels();
    if (moveStep) setStep('detail', true);
    const token = ++renderToken;
    try {
      modelData = await loadModel(sel.brand!, slug);
    } catch {
      if (token === renderToken) detail.replaceChildren(h('p', { class: 'error' }, 'Motor verisi yüklenemedi.'));
      return;
    }
    if (token !== renderToken) return;
    await refreshGroups();
    if (sel.engine && !groups.some((g) => g.slug === sel.engine)) sel = { brand: sel.brand, model: sel.model };
    renderDetail();
    announce(`${currentModel()?.name ?? slug}: ${groups.length} motor.`);
  }

  function selectEngine(slug: string) {
    sel = { brand: sel.brand, model: sel.model, engine: slug };
    writeUrl(true);
    renderDetail();
    setStep('detail', true);
  }

  function selectChassis(slug: string) {
    sel = { ...sel, gen: slug };
    writeUrl(true);
    renderDetail();
  }

  archiveToggle.addEventListener('click', () => {
    archive = !archive;
    sel = {};
    brandData = undefined;
    writeUrl(true);
    renderAll();
    setStep('brand', true);
  });

  const showSearch = (hits: SearchHit[]) => {
    searchResults.replaceChildren(
      ...hits.map((hit) =>
        h(
          'li',
          {},
          h(
            'button',
            {
              type: 'button',
              class: 'list-item',
              onclick: () => {
                searchResults.replaceChildren();
                globalSearch.value = '';
                archive = brands.find((b) => b.slug === hit.brand)?.tier === 'review';
                sel = { brand: hit.brand, model: hit.model, engine: hit.engine };
                void selectBrand(hit.brand, { moveStep: !hit.model });
              },
            },
            h('span', { class: 'list-item-title' }, hit.title),
            h('span', { class: 'list-item-meta' }, hit.subtitle),
          ),
        ),
      ),
    );
  };

  globalSearch.addEventListener('input', () => {
    const value = globalSearch.value;
    if (normalizeSearch(value).replace(/[^a-z0-9]+/g, '').length < 2) {
      searchResults.replaceChildren();
      return;
    }
    void loadSearch().then((index) => showSearch(searchCatalog(index, value)));
  });

  brandSearch.addEventListener('input', renderBrands);
  modelSearch.addEventListener('input', renderModels);

  const restore = async () => {
    const fromUrl = readUrl();
    archive = new URLSearchParams(location.search).get('arsiv') === '1';
    if (!fromUrl.brand || !brands.some((b) => b.slug === fromUrl.brand)) {
      sel = {};
      brandData = undefined;
      renderAll();
      setStep('brand');
      return;
    }
    sel = fromUrl;
    await selectBrand(fromUrl.brand, { push: false, moveStep: false });
    setStep(sel.model ? 'detail' : 'model');
  };

  window.addEventListener('popstate', () => void restore());
  stripObsoleteQuery();
  void restore();
}
