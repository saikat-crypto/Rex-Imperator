import React from 'react';
import type { MetricGridBlockPayload } from '../../../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const MetricGridBlock: React.FC<MetricGridBlockPayload> = ({ title, metrics }) => {
  if (!metrics || metrics.length === 0) return null;

  const gridCols =
    metrics.length === 1
      ? 'grid-cols-1 max-w-sm'
      : metrics.length === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : metrics.length === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="my-6 w-full select-none">
      {title && (
        <div className="text-sm font-medium text-[var(--text-primary)] mb-3 tracking-tight">
          {title}
        </div>
      )}

      <div className={`grid ${gridCols} gap-3.5`}>
        {metrics.map((m, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition-all"
          >
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
              {m.label}
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-serif font-normal text-[var(--text-primary)] tracking-tight">
                {m.value}
              </span>

              {m.trend && (
                <div
                  className={`flex items-center gap-1 text-xs font-mono font-medium px-2 py-0.5 rounded-full ${
                    m.trend.direction === 'up'
                      ? 'text-emerald-800 bg-emerald-50 border border-emerald-200/50'
                      : m.trend.direction === 'down'
                      ? 'text-[var(--accent-primary)] bg-[var(--accent-soft)] border border-[var(--accent-primary)]/20'
                      : 'text-[var(--text-muted)] bg-black/[0.04]'
                  }`}
                >
                  {m.trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
                  {m.trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
                  {m.trend.direction === 'neutral' && <Minus className="w-3 h-3" />}
                  <span>{m.trend.text}</span>
                </div>
              )}
            </div>

            {m.description && (
              <div className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                {m.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
