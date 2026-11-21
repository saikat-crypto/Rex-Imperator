import React, { useState } from 'react';
import type { OpenUIWidgetPayload } from '../../../types';

export const OpenUIWidgetBlock: React.FC<OpenUIWidgetPayload> = ({
  componentType,
  title,
  description,
  props,
}) => {
  const [sliderValue, setSliderValue] = useState<number>(
    typeof props.initialValue === 'number' ? props.initialValue : 65
  );

  return (
    <div className="my-6 w-full p-5 sm:p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
        {componentType === 'slider-metric' && (
          <span className="font-mono text-xs font-medium text-[var(--accent-primary)]">
            {sliderValue}%
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
          {description}
        </p>
      )}

      {componentType === 'slider-metric' && (
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-full accent-[var(--accent-primary)] cursor-pointer h-1 bg-[#D8D3C8] rounded-lg appearance-none"
          />
        </div>
      )}
    </div>
  );
};
