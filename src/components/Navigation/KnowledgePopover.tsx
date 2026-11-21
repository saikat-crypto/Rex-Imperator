import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BookOpen, GraduationCap } from 'lucide-react';
import type { SearchResult } from '../../utils/rag/ragEngine';

interface KnowledgePopoverProps {
  activeSources: SearchResult[];
}

export const KnowledgePopover: React.FC<KnowledgePopoverProps> = ({ activeSources }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasSources = activeSources.length > 0;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  return (
    <div
      ref={triggerRef}
      className="relative select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Knowledge Capsule Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Knowledge & context"
        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer shadow-soft-sm ${
          isOpen
            ? 'bg-white border-black/15 ring-1 ring-black/5 shadow-soft-md'
            : 'bg-white/80 hover:bg-white border-black/[0.08] hover:border-black/15'
        }`}
      >
        {/* Red 3D wireframe isometric cube icon */}
        <svg
          className="w-4 h-4 text-[#D93025] transition-transform duration-200 group-hover:scale-105"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3L4 7.5V16.5L12 21L20 16.5V7.5L12 3Z" />
          <path d="M12 12L4 7.5" />
          <path d="M12 12V21" />
          <path d="M12 12L20 7.5" />
        </svg>

        <span className="text-[13px] font-medium text-[#1E1B18] tracking-tight">
          Knowledge
        </span>

        {/* Dot: green pulsing if sources retrieved, grey if none */}
        <span
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            hasSources
              ? 'bg-emerald-500 animate-pulse'
              : 'bg-[#C8C4BD]'
          }`}
          title={hasSources ? `${activeSources.length} source${activeSources.length > 1 ? 's' : ''} retrieved` : 'No sources retrieved yet'}
        />

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#7A7368] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 w-[320px] sm:w-[350px] bg-[#FAF8F5]/98 backdrop-blur-md border border-black/[0.08] rounded-2xl p-4 shadow-soft-xl z-50 overflow-hidden"
          >
            {/* Popover Header */}
            <div className="flex items-center gap-1.5 mb-3">
              <BookOpen className="w-4 h-4 text-[#D93025]" />
              <h3 className="font-serif font-semibold text-[#231A14] text-[16px] tracking-tight">
                Knowledge
              </h3>
            </div>

            {/* Dynamic sources list */}
            {!hasSources ? (
              /* Empty state — new chat or no RAG match yet */
              <div className="flex flex-col items-center justify-center py-5 gap-2 text-center">
                <GraduationCap className="w-7 h-7 text-[#C8C4BD]" />
                <p className="text-[12.5px] text-[#9E9890] font-medium leading-snug">
                  No sources retrieved yet
                </p>
                <p className="text-[11px] text-[#B0AAA1] leading-snug max-w-[220px]">
                  As you ask questions, relevant textbook sections and exam papers will appear here.
                </p>
              </div>
            ) : (
              <div>
                <div className="text-[11px] font-semibold text-[#8A8275] uppercase tracking-wider mb-1.5 px-0.5">
                  Retrieved for this chat · {activeSources.length} source{activeSources.length > 1 ? 's' : ''}
                </div>
                <div className="max-h-[200px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                  {activeSources.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-white/70 hover:bg-white border border-black/[0.04] hover:border-black/10 text-[12px] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-medium text-[#201D1A] truncate text-[12px]">
                          <span className="text-[10px] font-bold text-[#B0AAA1] mr-1">[{idx + 1}]</span>
                          {item.title}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tight shrink-0 ${
                            item.docType === 'past_paper'
                              ? 'bg-amber-100/90 text-amber-800'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {item.docType === 'past_paper' ? 'Exam Paper' : 'Textbook'}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-[#7F796F] truncate mt-0.5">
                        {item.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
