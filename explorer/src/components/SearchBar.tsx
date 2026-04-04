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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    onSearch(q);
  };

  return (
    <div className="relative group max-w-2xl mx-auto w-full group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-solana-green transition-colors">
        <Search size={22} />
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for terms, definitions, aliases..."
        value={query}
        onChange={handleChange}
        className="w-full bg-surface border border-border rounded-2xl py-5 pl-14 pr-20 text-lg font-medium placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-solana-purple/50 focus:border-solana-purple transition-all shadow-xl"
      />
      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none gap-1.5">
        <kbd className="flex items-center gap-1 px-2 py-1 bg-surface-hover border border-border rounded-md text-xs text-text-tertiary font-mono">
          <Command size={10} />
          K
        </kbd>
        {query && (
          <button
            onClick={() => { setQuery(''); onSearch(''); }}
            className="p-1 h-8 w-8 flex items-center justify-center rounded-lg bg-surface-hover hover:bg-red-500/20 hover:text-red-400 transition-all pointer-events-auto"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
