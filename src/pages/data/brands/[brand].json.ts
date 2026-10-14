/**
 * Marka başına statik JSON: modeller + nesil/makyaj özetleri (motorsuz).
 * Build'de /data/brands/<marka>.json olarak üretilir.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getBrandPayload, getCatalog } from '@/lib/catalog';

export const getStaticPaths = (async () => {
  const { brands } = await getCatalog();
  return brands.map((b) => ({ params: { brand: b.slug }, props: { brandId: b.id } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const payload = await getBrandPayload(props.brandId as string);
  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
