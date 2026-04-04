import React from 'react';
import { Tag, Layers } from 'lucide-react';
import type { GlossaryTerm } from '../lib/sdk';
import { motion } from 'framer-motion';

interface TermCardProps {
  term: GlossaryTerm;
}

export const TermCard = React.memo(({ term }: TermCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-solana-purple/40 p-6 rounded-2xl transition-all duration-500 hover:shadow-2xl hover:shadow-solana-purple/10 overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-solana-green to-solana-purple transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-2xl font-bold text-text-primary group-hover:text-solana-green transition-colors">
          {term.term}
        </h3>
        <span className="px-3 py-1 bg-surface-hover border border-border rounded-lg text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
          {term.category.replace('-', ' ')}
        </span>
      </div>
      
      <p className="text-text-secondary leading-relaxed mb-6 font-medium">
        {term.definition}
      </p>

      {term.aliases && term.aliases.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs font-bold text-text-tertiary flex items-center gap-1">
            <Tag size={12} /> ALIASES:
          </span>
          {term.aliases.map((a) => (
            <span key={a} className="px-2 py-0.5 bg-solana-green/10 border border-solana-green/20 text-solana-green rounded text-xs">
              {a}
            </span>
          ))}
        </div>
      )}

      {term.related && term.related.length > 0 && (
        <div className="pt-4 border-t border-border mt-auto">
          <span className="text-xs font-bold text-text-tertiary flex items-center gap-1 mb-2">
            <Layers size={12} /> RELATED CONCEPTS:
          </span>
          <div className="flex flex-wrap gap-2">
            {term.related.map((r) => (
              <span key={r} className="text-xs text-solana-purple hover:underline cursor-pointer">
                #{r}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
});
