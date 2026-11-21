import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TabbedDeckBlockPayload } from '../../../types';

export const TabbedDeckBlock: React.FC<TabbedDeckBlockPayload> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!tabs || tabs.length === 0) return null;

  const current = tabs[activeTab] || tabs[0];

  return (
    <div className="my-6 w-full select-none">
      <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 sm:p-6 md:p-7">
        {/* Horizontal Tab Headers */}
        <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] pb-3 mb-4 overflow-x-auto">
          {tabs.map((tab, i) => {
            const isActive = i === activeTab;
            return (
              <button
                key={tab.id || i}
                onClick={() => setActiveTab(i)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-[var(--accent-primary)] bg-[var(--accent-soft)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/[0.03]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="min-h-[90px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id || activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="text-[14.5px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap"
            >
              {current.content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
