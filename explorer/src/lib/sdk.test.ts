import { describe, it, expect } from 'vitest';
import { sdk } from './sdk';

describe('Solana Glossary SDK Wrapper', () => {
  it('should return all terms', () => {
    const terms = sdk.allTerms();
    expect(terms.length).toBeGreaterThan(1000);
  });

  it('should get a specific term by id', () => {
    const term = sdk.getTerm('pda');
    expect(term).toBeDefined();
    expect(term?.term).toBe('Program Derived Address (PDA)');
  });

  it('should return categories', () => {
    const categories = sdk.getCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories).toContain('core-protocol');
  });

  it('should filter terms by category', () => {
    const terms = sdk.getTermsByCategory('core-protocol');
    expect(terms.length).toBeGreaterThan(0);
    expect(terms.every(t => t.category === 'core-protocol')).toBe(true);
  });

  it('should search terms correctly', () => {
    const results = sdk.searchTerms('Proof of History');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].term).toContain('Proof of History');
  });
});
