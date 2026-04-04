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
    <div className="relative mb-12">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none md:hidden"></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none md:hidden"></div>
      <div className="flex overflow-x-auto pb-4 pt-1 px-4 md:px-0 gap-3 justify-start md:flex-wrap md:justify-center hide-scrollbar snap-x">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all border shadow-sm snap-center ${
            selectedCategory === 'all'
              ? 'bg-solana-green/10 border-solana-green text-solana-green shadow-[0_0_15px_rgba(20,241,149,0.3)]'
              : 'bg-white/5 backdrop-blur-md border border-white/10 text-text-secondary hover:border-white/20 hover:text-text-primary hover:bg-white/10'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all border shadow-sm snap-center ${
              selectedCategory === cat
                ? 'bg-solana-purple/10 border-solana-purple text-solana-purple shadow-[0_0_15px_rgba(153,69,255,0.3)]'
                : 'bg-white/5 backdrop-blur-md border border-white/10 text-text-secondary hover:border-white/20 hover:text-text-primary hover:bg-white/10'
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>
    </div>
  );
};
