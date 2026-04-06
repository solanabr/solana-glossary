import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, X } from 'lucide-react';

export const SearchBar: React.FC<{ onSearch: (q: string) => void }> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div className="relative group max-w-2xl mx-auto w-full">
      <div className="absolute -inset-1 bg-gradient-to-r from-solana-green to-solana-purple rounded-3xl blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
      <div className="relative">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-solana-green transition-colors">
          <Search size={22} />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for terms, definitions, aliases..."
          value={query}
          onChange={handleChange}
          className="w-full bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl py-5 pl-14 pr-24 text-lg font-medium placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-solana-purple/50 focus:border-solana-purple transition-all shadow-2xl"
        />
        <div className="absolute inset-y-0 right-4 flex items-center gap-2">
          {query && (
            <button
              onClick={() => { setQuery(''); onSearch(''); }}
              className="p-1 h-8 w-8 flex items-center justify-center rounded-lg bg-surface-hover hover:bg-red-500/20 hover:text-red-400 transition-all pointer-events-auto"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-surface-hover border border-white/10 rounded-md text-xs text-text-tertiary font-mono pointer-events-none">
            <Command size={10} />
            K
          </kbd>
        </div>
      </div>
    </div>
  );
};

