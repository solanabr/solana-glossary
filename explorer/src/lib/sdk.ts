import { allTerms, getTerm, searchTerms, getCategories, getTermsByCategory } from '@stbr/solana-glossary';
import type { GlossaryTerm, Category } from '@stbr/solana-glossary';

export const sdk = {
  allTerms: () => allTerms,
  getTerm: (id: string) => getTerm(id),
  searchTerms: (query: string) => searchTerms(query),
  getCategories: () => getCategories(),
  getTermsByCategory: (category: Category) => getTermsByCategory(category),
};

export type { GlossaryTerm, Category };
