/**
 * Content Collections tanımları. Katalog verisi `src/data/catalog/` altında JSON
 * olarak tutulur ve build sırasında Zod şemalarıyla doğrulanır.
 */
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { jsonArrayDirLoader } from '@/lib/catalog/json-array-loader';
import {
  brandSchema,
  engineSchema,
  marketSchema,
  modelSchema,
  sourceSchema,
} from '@/lib/catalog/schema';
import { issueSchema, issueSourceSchema } from '@/lib/issues/schema';

const CATALOG = './src/data/catalog';

const brands = defineCollection({
  loader: file(`${CATALOG}/brands.json`),
  schema: brandSchema,
});

const markets = defineCollection({
  loader: file(`${CATALOG}/markets.json`),
  schema: marketSchema,
});

const sources = defineCollection({
  loader: file(`${CATALOG}/sources.json`),
  schema: sourceSchema,
});

/** Markaya göre bölünmüş motor listeleri: engines/<marka>.json */
const engines = defineCollection({
  loader: jsonArrayDirLoader(`${CATALOG}/engines/`),
  schema: engineSchema,
});

/** Model başına bir dosya: models/<marka>/<model>.json (nesiller, makyaj dönemleri, varyantlar dahil). */
const models = defineCollection({
  loader: glob({
    pattern: '**/*.json',
    base: `${CATALOG}/models`,
    generateId: ({ data }) => String(data.id),
  }),
  schema: modelSchema,
});

/*
 * Kronik sorunlar: katalogdan bağımsız klasörde. Canlı ve örnek (demo) veriler AYRI
 * koleksiyonlardır; örnek veri canlı sayfalara hiçbir koşulda yüklenmez.
 */
const issues = defineCollection({
  loader: jsonArrayDirLoader('./src/data/issues/records/'),
  schema: issueSchema,
});

const issueSources = defineCollection({
  loader: file('./src/data/issues/sources.json'),
  schema: issueSourceSchema,
});

const demoIssues = defineCollection({
  loader: jsonArrayDirLoader('./src/data/issues-demo/records/'),
  schema: issueSchema,
});

const demoIssueSources = defineCollection({
  loader: file('./src/data/issues-demo/sources.json'),
  schema: issueSourceSchema,
});

export const collections = {
  brands,
  markets,
  sources,
  engines,
  models,
  issues,
  issueSources,
  demoIssues,
  demoIssueSources,
};
