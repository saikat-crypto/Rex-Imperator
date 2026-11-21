import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SearchResult } from '../../../types';
import { ChevronDown } from 'lucide-react';
import katex from 'katex';

interface SourcesShelfProps {
  sources: SearchResult[];
}

export const SourcesShelf: React.FC<SourcesShelfProps> = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  const renderMathSnippet = (content: string) => {
    const parts = content.split(/(\$[^\$\n]+?\$)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        try {
          const html = katex.renderToString(part.slice(1, -1), {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={idx}
              className="inline-math px-0.5 align-baseline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={idx}>{part}</span>;
        }
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="mt-4 pt-3 border-t border-black/[0.06] select-none">
      {/* Clean, Simple Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F9F8F6] text-[#181615] border border-black/[0.08] shadow-2xs hover:border-black/[0.15] text-[13px] font-medium transition-colors cursor-pointer"
        title={isOpen ? 'Collapse curriculum sources' : 'Show curriculum sources'}
      >
        <span>Curriculum Sources</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#7A7469] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Clean Dropdown List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -2 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -2 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div
              className={`mt-2.5 space-y-2.5 ${
                sources.length > 2
                  ? 'max-h-[290px] overflow-y-auto overscroll-contain pr-1.5'
                  : ''
              }`}
              style={
                sources.length > 2
                  ? { scrollbarWidth: 'thin', scrollbarColor: 'rgba(0, 0, 0, 0.15) transparent' }
                  : undefined
              }
            >
              {sources.map((source, index) => (
                <div
                  key={source.id || index}
                  className="p-3.5 rounded-xl bg-white border border-black/[0.07] text-left shadow-2xs"
                >
                  <p className="text-[13px] font-medium text-[#181615] mb-1.5">
                    {source.title}{source.source ? `, ${source.source}` : ''}
                  </p>
                  <div className="text-[12px] text-[#55524B] leading-relaxed select-text">
                    {renderMathSnippet(source.content)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
