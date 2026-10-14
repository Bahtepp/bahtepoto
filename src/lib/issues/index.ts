/**
 * Kronik sorun veri erişimi (yalnızca build/sunucu tarafı).
 * Canlı ve örnek veri kümeleri ayrı yüklenir, ayrı doğrulanır ve hiçbir zaman birleştirilmez.
 */
import { getCollection } from 'astro:content';
import { getCatalog } from '@/lib/catalog';
import type { Issue, IssueSource } from './schema';
import { validateIssues, type IssueDataset } from './validate';

export interface IssueData {
  dataset: IssueDataset;
  issues: Issue[];
  sourceById: Map<string, IssueSource>;
}

const cache = new Map<IssueDataset, Promise<IssueData>>();

async function load(dataset: IssueDataset): Promise<IssueData> {
  const [issueEntries, sourceEntries, catalog] = await Promise.all([
    dataset === 'live' ? getCollection('issues') : getCollection('demoIssues'),
    dataset === 'live' ? getCollection('issueSources') : getCollection('demoIssueSources'),
    getCatalog(),
  ]);
  const issues = issueEntries.map((e) => e.data);
  const sources = sourceEntries.map((e) => e.data);
  const errors = validateIssues(issues, sources, catalog, dataset);
  if (errors.length) {
    throw new Error(`Kronik sorun verisinde (${dataset}) ${errors.length} hata:\n  - ${errors.join('\n  - ')}`);
  }
  return { dataset, issues, sourceById: new Map(sources.map((s) => [s.id, s])) };
}

export function getIssueData(dataset: IssueDataset): Promise<IssueData> {
  let p = cache.get(dataset);
  if (!p) {
    p = load(dataset);
    cache.set(dataset, p);
  }
  return p;
}
