/**
 * Hafif arama indeksi: marka, Türkiye modeli ve motor satış adı.
 * Build'de /data/search.json olarak üretilir.
 */
import type { APIRoute } from 'astro';
import { getSearchIndex } from '@/lib/catalog';

export const GET: APIRoute = async () => {
  const index = await getSearchIndex();
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
