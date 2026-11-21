import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SearchResult } from '../../../types';
import { BookOpen, Award, FileQuestion, Compass, Copy, Check, X } from 'lucide-react';
import katex from 'katex';

interface CitationTooltipProps {
  source: SearchResult;
  num: number;
}

export const CitationTooltip: React.FC<CitationTooltipProps> = ({ source, num }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openDownward, setOpenDownward] = useState(false);
  const badgeRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const isOpen = isHovered || isPinned;

  // Measure position on open to avoid clipping beyond viewport top
  useEffect(() => {
    if (isOpen && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      // If badge is in the top 220px of the window, render tooltip below it
      if (rect.top < 220) {
        setOpenDownward(true);
      } else {
        setOpenDownward(false);
      }
    }
  }, [isOpen]);

  // Handle outside click to unpin
  useEffect(() => {
    if (!isPinned) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        badgeRef.current &&
        !badgeRef.current.contains(e.target as Node)
      ) {
        setIsPinned(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPinned(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPinned]);

  const handleCopyCitation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `[${num}] ${source.title} — ${source.source}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const getDocTypeMeta = () => {
    switch (source.docType) {
      case 'marking_scheme':
        return {
          label: 'Marking Scheme',
          icon: Award,
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300/80',
          pillColor: 'bg-amber-50 text-amber-800 border-amber-300/60 hover:bg-amber-100',
        };
      case 'sample_paper':
      case 'past_paper':
      case 'model_paper':
        return {
          label: 'Exam Paper',
          icon: FileQuestion,
          badgeColor: 'bg-purple-100 text-purple-900 border-purple-300/80',
          pillColor: 'bg-purple-50 text-purple-800 border-purple-200/70 hover:bg-purple-100',
        };
      case 'syllabus':
        return {
          label: 'Syllabus',
          icon: Compass,
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300/80',
          pillColor: 'bg-emerald-50 text-emerald-800 border-emerald-200/70 hover:bg-emerald-100',
        };
      case 'textbook':
      default:
        return {
          label: 'Textbook',
          icon: BookOpen,
          badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
          pillColor: 'bg-red-50 text-[#D93025] border-red-200/70 hover:bg-red-100/80',
        };
    }
  };

  const docMeta = getDocTypeMeta();
  const IconComponent = docMeta.icon;

  // Render excerpt with inline KaTeX
  const renderExcerptWithLatex = (content: string) => {
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
    <span
      className="relative inline-block align-baseline select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Interactive Badge Pill */}
      <span
        ref={badgeRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsPinned((prev) => !prev);
        }}
        className={`inline-flex items-center justify-center text-[10px] font-semibold rounded px-1.5 py-0.5 mx-0.5 cursor-pointer transition-all leading-none align-middle ${docMeta.pillColor} ${
          isPinned ? 'ring-2 ring-[#FCD702] ring-offset-1' : ''
        }`}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        title={`Citation [${num}]: ${source.title} (${source.source})`}
        aria-label={`Citation ${num}: ${source.title}`}
        role="button"
        tabIndex={0}
      >
        {num}
      </span>

      {/* Hover / Pinned Preview Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: openDownward ? -6 : 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openDownward ? -4 : 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute left-1/2 -translate-x-1/2 z-50 w-[300px] sm:w-[350px] pointer-events-auto ${
              openDownward ? 'top-full mt-2' : 'bottom-full mb-2'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#FAF8F5] border border-black/10 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-left">
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${docMeta.badgeColor}`}>
                    [{num}]
                  </span>
                  {source.board && (
                    <span className="text-[9.5px] font-semibold text-[#181615] bg-black/[0.05] border border-black/[0.08] px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {source.board}
                    </span>
                  )}
                  <span className="text-[10px] font-medium text-[#7A7469] uppercase tracking-wider">
                    {source.grade || 'Curriculum'} • {source.subject || 'STEM'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-tight border ${docMeta.badgeColor}`}>
                    <IconComponent className="w-2.5 h-2.5" />
                    {docMeta.label}
                  </span>

                  {isPinned && (
                    <button
                      onClick={() => setIsPinned(false)}
                      className="p-1 text-[#8A8478] hover:text-[#181615] transition-colors rounded hover:bg-black/5"
                      title="Close pinned preview"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Topic */}
              <h4 className="text-[13px] font-semibold text-[#181615] leading-snug mb-0.5">
                {source.title}
              </h4>
              <p className="text-[10.5px] text-[#706B60] mb-2.5 font-mono break-words">
                {source.source}
              </p>

              {/* Verbatim Excerpt with KaTeX */}
              <div className="border-t border-black/[0.06] pt-2 mb-2.5">
                <div className="text-[11.5px] text-[#3D3A34] leading-relaxed max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                  {renderExcerptWithLatex(source.content)}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-black/[0.06] pt-2 text-[10.5px] text-[#7A7469]">
                <span className="flex items-center gap-1">
                  {source.score ? `${Math.round(source.score * 100)}% match` : 'Verified Source'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCitation}
                  className="flex items-center gap-1 text-[#181615] hover:text-[#D93025] font-medium transition-colors px-1.5 py-0.5 rounded hover:bg-black/5"
                  title="Copy citation reference"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Citation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};
