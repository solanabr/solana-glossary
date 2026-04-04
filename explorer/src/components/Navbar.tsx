import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useGlossary } from '../context/GlossaryContext';

export const Navbar: React.FC = () => {
  const { locale, setLocale } = useGlossary();

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solana-green to-solana-purple flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-solana-purple/20">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight m-0 leading-tight">Solana Glossary</h1>
            <p className="text-xs text-text-tertiary uppercase tracking-widest font-semibold m-0">Explorer v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center bg-surface border border-border rounded-lg p-1">
            {['en', 'pt', 'es'].map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  locale === l 
                  ? 'bg-solana-purple text-white shadow-md' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          
          <a 
            href="https://github.com/solanabr/solana-glossary" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <ExternalLink size={24} />
          </a>
        </div>
      </div>
    </nav>
  );
};
