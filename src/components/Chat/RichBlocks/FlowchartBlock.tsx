import React from 'react';
import type { FlowchartBlockPayload } from '../../../types';
import { ArrowRight } from 'lucide-react';

export const FlowchartBlock: React.FC<FlowchartBlockPayload> = ({
  title,
  nodes,
}) => {
  if (!nodes || nodes.length === 0) return null;

  return (
    <div className="my-6 w-full select-none">
      {title && (
        <div className="text-sm font-medium text-[var(--text-primary)] mb-3 tracking-tight">
          {title}
        </div>
      )}

      <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 sm:p-6 overflow-x-auto">
        <div className="flex items-stretch gap-2.5 w-full min-w-[580px] lg:min-w-0 py-1">
          {nodes.map((node, i) => {
            const isLast = i === nodes.length - 1;
            return (
              <React.Fragment key={node.id}>
                {/* Node Box */}
                <div className="flex-1 min-w-[130px] p-4 rounded-xl bg-white/90 border border-[var(--border-medium)] shadow-soft-sm hover:border-[var(--accent-primary)]/60 transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-[var(--accent-primary)] font-medium mb-1">
                      STEP {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="text-sm font-medium text-[var(--text-primary)] leading-tight">
                      {node.label}
                    </div>
                  </div>
                  {node.subtext && (
                    <div className="text-xs text-[var(--text-muted)] mt-2 leading-snug">
                      {node.subtext}
                    </div>
                  )}
                </div>

                {/* Arrow Connector */}
                {!isLast && (
                  <div className="flex items-center justify-center text-[var(--accent-primary)] opacity-70 shrink-0 px-0.5">
                    <ArrowRight className="w-4 h-4 stroke-[2]" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
