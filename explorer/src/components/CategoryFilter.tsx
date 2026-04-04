import { useGlossary } from '../context/GlossaryContext';
import type { Category } from '../lib/sdk';

const categoryLabels: Record<Category | 'all', string> = {
  all: 'All Categories',
  'core-protocol': 'Core Protocol',
  'programming-model': 'Programming Model',
  'token-ecosystem': 'Token Ecosystem',
  defi: 'DeFi',
  'zk-compression': 'ZK Compression',
  infrastructure: 'Infrastructure',
  security: 'Security',
  'dev-tools': 'Dev Tools',
  network: 'Network',
  'blockchain-general': 'General Blockchain',
  web3: 'Web3',
  'programming-fundamentals': 'Programming Fundamentals',
  'ai-ml': 'AI & ML',
  'solana-ecosystem': 'Solana Ecosystem'
};

export const CategoryFilter: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory } = useGlossary();

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-12">
      <button
        onClick={() => setSelectedCategory('all')}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
          selectedCategory === 'all'
            ? 'bg-solana-green/20 border-solana-green text-solana-green'
            : 'bg-surface border-border text-text-secondary hover:border-border-hover hover:text-text-primary'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setSelectedCategory(cat)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
            selectedCategory === cat
              ? 'bg-solana-purple/20 border-solana-purple text-solana-purple'
              : 'bg-surface border-border text-text-secondary hover:border-border-hover hover:text-text-primary'
          }`}
        >
          {categoryLabels[cat]}
        </button>
      ))}
    </div>
  );
};
