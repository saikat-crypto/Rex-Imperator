import React, { useState } from 'react';
import type { RoadmapChecklistBlockPayload } from '../../../types';
import { Check } from 'lucide-react';

export const RoadmapChecklistBlock: React.FC<RoadmapChecklistBlockPayload> = ({
  title,
  items,
}) => {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    items.forEach((item) => {
      if (item.completed) initial[item.id] = true;
    });
    return initial;
  });

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const total = items.length;
  const completedCount = items.filter((item) => checkedIds[item.id]).length;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="my-6 w-full select-none">
      <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 sm:p-6 md:p-7">
        {/* Title and Progress count */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
          <span className="font-mono text-xs text-[var(--accent-primary)] font-medium">
            {completedCount} / {total} ({progressPercent}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-[var(--accent-primary)] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Checklist Rows */}
        <div className="space-y-2">
          {items.map((item) => {
            const isDone = !!checkedIds[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isDone
                    ? 'bg-white/40 border-transparent opacity-70'
                    : 'bg-white/80 border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
                }`}
              >
                {/* Custom Checkbox */}
                <div
                  className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                    isDone
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'border border-black/25 hover:border-[var(--accent-primary)]'
                  }`}
                >
                  {isDone && <Check className="w-3 h-3 stroke-[2.5]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[14px] leading-snug transition-colors ${
                      isDone
                        ? 'line-through text-[var(--text-muted)]'
                        : 'text-[var(--text-primary)] font-normal'
                    }`}
                  >
                    {item.text}
                  </div>
                  {item.detail && (
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                      {item.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
