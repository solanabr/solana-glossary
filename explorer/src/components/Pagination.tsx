import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useGlossary } from '../context/GlossaryContext';
import { motion } from 'framer-motion';

export const Pagination: React.FC = () => {
  const { currentPage, setCurrentPage, totalPages } = useGlossary();

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const showThreshold = 2; // Number of pages to show around current page

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > showThreshold + 2) {
        pages.push('ellipsis-start');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - showThreshold);
      const end = Math.min(totalPages - 1, currentPage + showThreshold);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - (showThreshold + 1)) {
        pages.push('ellipsis-end');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col items-center gap-6 mt-16 mb-8">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-solana-purple/20 hover:border-solana-purple/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => {
            if (typeof page === 'string') {
              return (
                <div key={idx} className="px-2 text-text-tertiary">
                  <MoreHorizontal size={16} />
                </div>
              );
            }

            const isActive = page === currentPage;

            return (
              <button
                key={idx}
                onClick={() => handlePageChange(page)}
                className={`relative min-w-[44px] h-11 flex items-center justify-center rounded-xl font-bold text-sm transition-all overflow-hidden ${
                  isActive
                    ? 'text-white'
                    : 'text-text-secondary bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-page"
                    className="absolute inset-0 bg-gradient-to-br from-solana-green to-solana-purple opacity-90 shadow-[0_0_15px_rgba(153,69,255,0.4)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{page}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-solana-green/20 hover:border-solana-green/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="text-xs font-bold tracking-widest text-text-tertiary uppercase flex items-center gap-2">
        Page <span className="text-solana-green">{currentPage}</span> of {totalPages}
      </div>
    </div>
  );
};
