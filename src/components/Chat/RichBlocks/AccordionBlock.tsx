import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AccordionBlockPayload } from '../../../types';
import { ChevronDown } from 'lucide-react';

export const AccordionBlock: React.FC<AccordionBlockPayload> = ({ items }) => {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    [items[0]?.id || '0']: true, // first open by default
  });

  const toggle = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="my-6 w-full select-none">
      <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
        {items.map((item, i) => {
          const isOpen = !!openIds[item.id || String(i)];
          return (
            <div key={item.id || i} className="transition-colors">
              <button
                type="button"
                onClick={() => toggle(item.id || String(i))}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-black/[0.02] transition-colors"
              >
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {item.title}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[var(--accent-primary)] transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pt-1 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                      {item.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
