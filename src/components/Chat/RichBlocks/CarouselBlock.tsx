import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CarouselBlockPayload } from '../../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CarouselBlock: React.FC<CarouselBlockPayload> = ({ title, items }) => {
  const [index, setIndex] = useState(0);

  if (!items || items.length === 0) return null;

  const current = items[index];

  const handlePrev = () => {
    setIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="my-6 w-full select-none">
      {title && (
        <div className="text-sm font-medium text-[var(--text-primary)] mb-3 tracking-tight">
          {title}
        </div>
      )}

      <div className="relative rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 sm:p-6 md:p-7 transition-all">
        {/* Top bar with tag & counter */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent-primary)] font-medium">
            {current.tag || `Phase ${index + 1}`}
          </span>
          <span className="font-mono text-xs text-[var(--text-muted)]">
            {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </span>
        </div>

        {/* Slide Content with Animation */}
        <div className="min-h-[110px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id || index}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <h4 className="text-lg font-serif font-medium text-[var(--text-primary)] mb-1.5">
                {current.title}
              </h4>
              {current.subtitle && (
                <div className="text-xs text-[var(--text-muted)] mb-2 font-mono">
                  {current.subtitle}
                </div>
              )}
              <p className="text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
                {current.content}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer controls & dot indicators */}
        <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
          {/* Dot Indicators */}
          <div className="flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? 'w-5 bg-[var(--accent-primary)]'
                    : 'w-1.5 bg-black/15 hover:bg-black/30'
                }`}
                title={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--surface-hover)] transition-colors active:scale-95"
              title="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--surface-hover)] transition-colors active:scale-95"
              title="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
