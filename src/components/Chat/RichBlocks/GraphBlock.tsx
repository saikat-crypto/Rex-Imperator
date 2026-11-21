import React, { useState } from 'react';
import type { GraphBlockPayload } from '../../../types';

export const GraphBlock: React.FC<GraphBlockPayload> = ({
  title,
  type = 'line',
  data,
  accentColor = 'var(--accent-primary)',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 10);
  const chartHeight = 150;
  const chartWidth = 560;
  const paddingX = 35;
  const paddingY = 20;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1 || 1)) * innerWidth;
    const y = chartHeight - paddingY - (d.value / maxValue) * innerHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="my-6 w-full select-none">
      <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 sm:p-6">
        <div className="text-sm font-medium text-[var(--text-primary)] mb-3">
          {title}
        </div>

        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-40 overflow-visible"
          >
          {/* Subtle baseline */}
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="#DCD7CD"
            strokeWidth="1"
          />

          <defs>
            <linearGradient id="burgundyAreaGradClean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.16" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {type !== 'bar' && (
            <>
              <path d={areaD} fill="url(#burgundyAreaGradClean)" />
              <path
                d={pathD}
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {points.map((p, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isHovered ? 5 : 3.5}
                fill={isHovered ? '#FFFFFF' : accentColor}
                stroke={accentColor}
                strokeWidth={isHovered ? 2.5 : 1}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Labels row */}
        <div className="w-full flex justify-between px-6 mt-1 text-[11px] font-mono text-[#7D776C]">
          {data.map((d, i) => (
            <span
              key={i}
              className={hoveredIdx === i ? 'text-[var(--accent-primary)] font-medium' : ''}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};
