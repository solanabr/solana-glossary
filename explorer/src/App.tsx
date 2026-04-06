import React from 'react';
import { GlossaryProvider, useGlossary } from './context/GlossaryContext';
import { Navbar } from './components/Navbar';
import { SearchBar } from './components/SearchBar';
import { CategoryFilter } from './components/CategoryFilter';
import { TermCard } from './components/TermCard';
import { Pagination } from './components/Pagination';
import { motion } from 'framer-motion';

const GlossaryContent: React.FC = () => {
  const { filteredTerms, paginatedTerms, setSearchQuery } = useGlossary();

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-solana-purple selection:text-white relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-solana-green/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-spin-slow pointer-events-none" />
      <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-solana-purple/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-spin-reverse pointer-events-none" />

      <Navbar />
      
      <main className="container mx-auto px-6 py-12 max-w-7xl relative z-10">
        <header className="text-center mb-16 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block p-2 px-4 rounded-full bg-solana-green/10 border border-solana-green/20 text-solana-green text-sm font-bold tracking-widest uppercase mb-4"
          >
            The Ultimate Solana Knowledge Base
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-solana-green to-solana-purple bg-clip-text text-transparent">
            Explore the Ecosystem
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            1001 terms defining the future of decentralized finance, infrastructure, and the web3 economy.
          </p>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.2em] text-text-tertiary uppercase"
          >
            <span className="w-8 h-[1px] bg-border" />
            POWERED BY <span className="bg-gradient-to-r from-solana-green to-solana-purple bg-clip-text text-transparent">SOLANA</span>
            <span className="w-8 h-[1px] bg-border" />
          </motion.div>
        </header>

        <section className="sticky top-24 z-30 mb-8 backdrop-blur-xl py-4 flex flex-col items-center">
          <SearchBar onSearch={setSearchQuery} />
        </section>

        <CategoryFilter />

        <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
          <h2 className="text-lg font-bold text-text-secondary flex items-center gap-2">
            Showing <span className="text-white">{filteredTerms.length}</span> Results
          </h2>
          <div className="text-xs text-text-tertiary font-mono">
            UPDATED APR 2026
          </div>
        </div>

        <section>
          {filteredTerms.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedTerms.map((term) => (
                  <TermCard key={term.id} term={term} />
                ))}
              </div>
              <Pagination />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-surface rounded-3xl border border-border flex items-center justify-center text-text-tertiary mb-6">
                ?
              </div>
              <h3 className="text-2xl font-bold mb-2 text-text-primary">No Matching Terms</h3>
              <p className="text-text-secondary max-w-sm">
                We couldn't find any terms matching your criteria. Try adjusting your search query or category filters.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border mt-20 py-12 bg-surface/50">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 font-bold text-text-secondary">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-solana-green to-solana-purple" />
            SOLANA GLOSSARY EXPLORER
          </div>
          <p className="text-text-tertiary text-sm max-w-md mx-auto">
            A first-party reference for the Solana ecosystem. Building the data layer for the next billion users.
          </p>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GlossaryProvider>
      <GlossaryContent />
    </GlossaryProvider>
  );
};

export default App;
