/**
 * Model başına statik JSON: varyantlar, çözülmüş motorlar, pazarlar ve kaynaklar.
 * Build'de /data/models/<marka>/<model>.json olarak üretilir; yalnızca model
 * seçildiğinde istemci tarafından indirilir.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCatalog, getModelPayload } from '@/lib/catalog';

export const getStaticPaths = (async () => {
  const { models, brandById } = await getCatalog();
  return models.map((m) => ({
    params: { brand: brandById.get(m.brandId)!.slug, model: m.slug },
    props: { modelId: m.id },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const payload = await getModelPayload(props.modelId as string);
  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
