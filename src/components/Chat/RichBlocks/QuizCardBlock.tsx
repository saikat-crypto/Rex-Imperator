import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizBlockPayload } from '../../../types';
import { CheckCircle, XCircle, Lightbulb, RotateCcw } from 'lucide-react';

export const QuizCardBlock: React.FC<QuizBlockPayload> = ({
  question,
  options,
  correctId,
  explanation,
  hint,
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isCorrect = selected === correctId;

  const handleSelect = (id: string) => {
    if (revealed) return;
    setSelected(id);
    setRevealed(true);
  };

  const handleReset = () => {
    setSelected(null);
    setRevealed(false);
    setShowHint(false);
  };

  return (
    <div className="my-6 w-full select-none">
      <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 sm:p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent-primary)] font-medium">
            Quiz
          </span>
          <div className="flex items-center gap-2">
            {hint && !revealed && (
              <button
                onClick={() => setShowHint((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
              >
                <Lightbulb className="w-3 h-3" />
                Hint
              </button>
            )}
            {revealed && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        </div>

        {/* Question */}
        <p className="text-[15px] font-medium text-[var(--text-primary)] leading-snug mb-4">
          {question}
        </p>

        {/* Hint */}
        <AnimatePresence>
          {showHint && hint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 font-mono"
            >
              💡 {hint}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Options */}
        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            const isRight = opt.id === correctId;
            let borderClass = 'border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40';
            let bgClass = 'bg-white/60 hover:bg-white/90';
            let textClass = 'text-[var(--text-primary)]';

            if (revealed) {
              if (isRight) {
                borderClass = 'border-green-400';
                bgClass = 'bg-green-50';
                textClass = 'text-green-800';
              } else if (isSelected && !isRight) {
                borderClass = 'border-red-300';
                bgClass = 'bg-red-50';
                textClass = 'text-red-700';
              } else {
                borderClass = 'border-[var(--border-subtle)]';
                bgClass = 'bg-white/40';
                textClass = 'text-[var(--text-muted)]';
              }
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={revealed}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${borderClass} ${bgClass} ${revealed ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'}`}
              >
                <span className={`w-6 h-6 flex-shrink-0 rounded-full border flex items-center justify-center text-[11px] font-mono font-medium transition-colors ${revealed && isRight ? 'border-green-400 text-green-700 bg-green-100' : revealed && isSelected ? 'border-red-300 text-red-600 bg-red-50' : 'border-[var(--border-medium)] text-[var(--text-muted)]'}`}>
                  {opt.id.toUpperCase()}
                </span>
                <span className={`text-sm leading-snug ${textClass}`}>{opt.text}</span>
                {revealed && isRight && (
                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />
                )}
                {revealed && isSelected && !isRight && (
                  <XCircle className="w-4 h-4 text-red-400 ml-auto flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation after reveal */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 pt-4 border-t border-[var(--border-subtle)]"
            >
              <div className={`flex items-start gap-2 mb-2`}>
                {isCorrect ? (
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <span className={`text-sm font-semibold ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                  {isCorrect ? 'Correct! Well done.' : 'Not quite — here\'s why:'}
                </span>
              </div>
              <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed pl-6">
                {explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
