import React from 'react';
import type { ComparisonMatrixBlockPayload } from '../../../types';
import { Check, X } from 'lucide-react';

export const ComparisonMatrixBlock: React.FC<ComparisonMatrixBlockPayload> = ({
  title,
  columns,
  features,
}) => {
  if (!columns || !features) return null;

  return (
    <div className="my-6 w-full select-none">
      {title && (
        <div className="text-sm font-medium text-[var(--text-primary)] mb-3 tracking-tight">
          {title}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 sm:p-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="pb-3 pt-1 font-medium text-[var(--text-muted)] w-1/3">
                Feature / Criterion
              </th>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`pb-3 pt-1 font-medium text-center ${
                    col.isHighlighted
                      ? 'text-[var(--accent-primary)] font-semibold'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{col.title}</span>
                    {col.isHighlighted && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                        Top Pick
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {features.map((feature, i) => (
              <tr key={i} className="hover:bg-black/[0.015] transition-colors">
                <td className="py-3 font-normal text-[var(--text-secondary)]">
                  {feature.name}
                </td>
                {columns.map((col) => {
                  const val = feature.values[col.id];
                  return (
                    <td key={col.id} className="py-3 text-center">
                      {typeof val === 'boolean' ? (
                        val ? (
                          <Check className="w-4 h-4 mx-auto text-[var(--accent-primary)]" />
                        ) : (
                          <X className="w-4 h-4 mx-auto text-black/20" />
                        )
                      ) : (
                        <span
                          className={`font-mono ${
                            col.isHighlighted
                              ? 'text-[var(--accent-primary)] font-medium'
                              : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {String(val ?? '—')}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
