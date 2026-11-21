import React, { useState } from 'react';
import type { ComparisonSliderBlockPayload } from '../../../types';

export const ComparisonSliderBlock: React.FC<ComparisonSliderBlockPayload> = ({
  title,
  beforeLabel = 'Before',
  afterLabel = 'After',
  beforeText,
  afterText,
}) => {
  const [sliderPos, setSliderPos] = useState(50); // percentage

  return (
    <div className="my-6 w-full select-none">
      {title && (
        <div className="text-sm font-medium text-[var(--text-primary)] mb-3 tracking-tight">
          {title}
        </div>
      )}

      <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 sm:p-6 md:p-7 overflow-hidden">
        {/* Header with labels */}
        <div className="flex items-center justify-between text-xs font-mono mb-4 text-[var(--text-muted)]">
          <span className="text-[var(--accent-primary)] font-medium">{beforeLabel}</span>
          <span>{sliderPos}% split</span>
          <span className="text-[var(--accent-primary)] font-medium">{afterLabel}</span>
        </div>

        {/* Side by side interactive display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          <div
            className={`p-4 rounded-xl border transition-all ${
              sliderPos >= 50
                ? 'bg-white/70 border-[var(--border-medium)] shadow-soft-sm'
                : 'bg-[var(--surface-subtle)]/50 border-transparent opacity-60'
            }`}
          >
            <div className="text-xs font-mono font-medium text-[var(--accent-primary)] mb-1">
              {beforeLabel}
            </div>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
              {beforeText}
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border transition-all ${
              sliderPos <= 50
                ? 'bg-white/70 border-[var(--border-medium)] shadow-soft-sm'
                : 'bg-[var(--surface-subtle)]/50 border-transparent opacity-60'
            }`}
          >
            <div className="text-xs font-mono font-medium text-[var(--accent-primary)] mb-1">
              {afterLabel}
            </div>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
              {afterText}
            </p>
          </div>
        </div>

        {/* Range Slider handle */}
        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--text-muted)]">Focus:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="flex-1 accent-[var(--accent-primary)] cursor-pointer h-1.5 bg-black/10 rounded-lg appearance-none"
          />
        </div>
      </div>
    </div>
  );
};
