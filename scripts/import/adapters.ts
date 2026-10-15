/** Kayıtlı kaynak bağdaştırıcıları (`npm run import:run -- <id>`). */
import type { SourceAdapter } from './lib/adapter.ts';
import { createWikidataAdapter } from './wikidata/adapter.ts';

export const ADAPTERS: SourceAdapter[] = [createWikidataAdapter()];
