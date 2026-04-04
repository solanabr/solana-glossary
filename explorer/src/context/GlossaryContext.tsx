import React, { createContext, useContext, useState, useMemo } from 'react';
import { sdk } from '../lib/sdk';
import type { GlossaryTerm, Category } from '../lib/sdk';
import ptLocale from '../../../data/i18n/pt.json';
import esLocale from '../../../data/i18n/es.json';

const locales: Record<string, any> = {
  pt: ptLocale,
  es: esLocale
};

interface GlossaryContextType {
  terms: GlossaryTerm[];
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: Category | 'all';
  setSelectedCategory: (category: Category | 'all') => void;
  locale: string;
  setLocale: (locale: string) => void;
  filteredTerms: GlossaryTerm[];
}

const GlossaryContext = createContext<GlossaryContextType | undefined>(undefined);

export const GlossaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  
  const categories = useMemo(() => sdk.getCategories(), []);
  
  const terms = useMemo(() => {
    const baseTerms = sdk.allTerms();
    if (locale === 'en') return baseTerms;
    
    const overrides = locales[locale];
    if (!overrides) return baseTerms;

    return baseTerms.map((t: GlossaryTerm) => {
      const o = overrides[t.id];
      if (!o) return t;
      return {
        ...t,
        term: o.term ?? t.term,
        definition: o.definition ?? t.definition,
      };
    });
  }, [locale]);

  const filteredTerms = useMemo(() => {
    let result = terms;
    
    if (selectedCategory !== 'all') {
      result = result.filter(t => t.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.term.toLowerCase().includes(q) || 
        t.definition.toLowerCase().includes(q) ||
        t.aliases?.some(a => a.toLowerCase().includes(q))
      );
    }
    
    return result;
  }, [terms, searchQuery, selectedCategory]);

  return (
    <GlossaryContext.Provider value={{
      terms,
      categories,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
      locale,
      setLocale,
      filteredTerms
    }}>
      {children}
    </GlossaryContext.Provider>
  );
};

export const useGlossary = () => {
  const context = useContext(GlossaryContext);
  if (!context) throw new Error('useGlossary must be used within a GlossaryProvider');
  return context;
};
