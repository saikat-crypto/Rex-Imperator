import React from 'react';
import { SidebarToggleIcon } from '../Sidebar/SidebarToggleIcon';
import { ModeToggle, type AppMode } from './ModeToggle';

interface SkyHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  chatTitle?: string;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

// Single cloud cluster SVG with soft, misty, foggy edges (discernible billows with blur filter)
const MistyCloud: React.FC<{
  className?: string;
  opacity?: number;
  scale?: number;
}> = ({ className = '', opacity = 0.85, scale = 1 }) => (
  <div
    className={`inline-block shrink-0 select-none pointer-events-none ${className}`}
    style={{ transform: `scale(${scale})`, opacity }}
  >
    <svg
      width="220"
      height="85"
      viewBox="0 0 220 85"
      fill="none"
      className="overflow-visible"
    >
      <defs>
        <filter id="misty-blur" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" />
        </filter>
        <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
        </filter>
      </defs>

      {/* Soft outer glow */}
      <g filter="url(#soft-glow)" opacity="0.6">
        <ellipse cx="65" cy="50" rx="38" ry="24" fill="white" />
        <ellipse cx="115" cy="42" rx="46" ry="30" fill="white" />
        <ellipse cx="165" cy="52" rx="36" ry="22" fill="white" />
      </g>

      {/* Main misty cloud body with soft edges */}
      <g filter="url(#misty-blur)">
        <ellipse cx="50" cy="54" rx="36" ry="22" fill="white" fillOpacity="0.88" />
        <ellipse cx="90" cy="42" rx="42" ry="28" fill="white" fillOpacity="0.94" />
        <ellipse cx="132" cy="38" rx="44" ry="30" fill="white" fillOpacity="0.96" />
        <ellipse cx="170" cy="52" rx="36" ry="22" fill="white" fillOpacity="0.90" />
        <ellipse cx="110" cy="56" rx="55" ry="20" fill="white" fillOpacity="0.95" />
      </g>

      {/* Highlight center puff */}
      <ellipse
        cx="120"
        cy="40"
        rx="28"
        ry="16"
        fill="white"
        fillOpacity="0.75"
        filter="url(#misty-blur)"
      />
    </svg>
  </div>
);

// Small wisp cloud
const MistyCloudSmall: React.FC<{
  className?: string;
  opacity?: number;
  scale?: number;
}> = ({ className = '', opacity = 0.75, scale = 0.85 }) => (
  <div
    className={`inline-block shrink-0 select-none pointer-events-none ${className}`}
    style={{ transform: `scale(${scale})`, opacity }}
  >
    <svg
      width="160"
      height="65"
      viewBox="0 0 160 65"
      fill="none"
      className="overflow-visible"
    >
      <defs>
        <filter id="misty-blur-sm" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" />
        </filter>
      </defs>

      <g filter="url(#misty-blur-sm)">
        <ellipse cx="40" cy="42" rx="26" ry="16" fill="white" fillOpacity="0.85" />
        <ellipse cx="78" cy="34" rx="32" ry="20" fill="white" fillOpacity="0.92" />
        <ellipse cx="118" cy="40" rx="28" ry="16" fill="white" fillOpacity="0.88" />
        <ellipse cx="80" cy="44" rx="45" ry="14" fill="white" fillOpacity="0.9" />
      </g>
    </svg>
  </div>
);

export const SkyHeader: React.FC<SkyHeaderProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  chatTitle,
  mode,
  onModeChange,
}) => {
  return (
    <div className="relative w-full shrink-0 select-none z-30 h-[72px] sm:h-[80px]">
      {/* 1. Atmospheric Sky & Drifting Clouds Background Layer (fades seamlessly into canvas, NO border line) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 bg-gradient-to-b from-[#CEE5F8] via-[#E4F2FC] via-[45%] to-white">
        {/* Continuous Looping Cloud Strip: 2 identical 100% widths sliding continuously */}
        <div className="flex w-[200%] h-full animate-cloud-drift-slow">
          {/* Cloud Strip 1 */}
          <div className="w-1/2 h-full relative flex items-center justify-between px-6">
            <div className="absolute top-[6%] left-[4%]">
              <MistyCloud scale={0.88} opacity={0.86} />
            </div>
            <div className="absolute top-[26%] left-[22%]">
              <MistyCloudSmall scale={0.72} opacity={0.7} />
            </div>
            <div className="absolute top-[4%] left-[44%]">
              <MistyCloud scale={0.92} opacity={0.84} />
            </div>
            <div className="absolute top-[30%] left-[64%]">
              <MistyCloudSmall scale={0.78} opacity={0.72} />
            </div>
            <div className="absolute top-[8%] left-[82%]">
              <MistyCloud scale={0.82} opacity={0.85} />
            </div>
          </div>

          {/* Cloud Strip 2 (Identical for seamless infinite right-to-left loop) */}
          <div className="w-1/2 h-full relative flex items-center justify-between px-6">
            <div className="absolute top-[6%] left-[4%]">
              <MistyCloud scale={0.88} opacity={0.86} />
            </div>
            <div className="absolute top-[26%] left-[22%]">
              <MistyCloudSmall scale={0.72} opacity={0.7} />
            </div>
            <div className="absolute top-[4%] left-[44%]">
              <MistyCloud scale={0.92} opacity={0.84} />
            </div>
            <div className="absolute top-[30%] left-[64%]">
              <MistyCloudSmall scale={0.78} opacity={0.72} />
            </div>
            <div className="absolute top-[8%] left-[82%]">
              <MistyCloud scale={0.82} opacity={0.85} />
            </div>
          </div>
        </div>

        {/* Secondary Parallax Layer (Slightly faster small wisps) */}
        <div className="absolute inset-0 flex w-[200%] h-full animate-cloud-drift-fast opacity-65">
          <div className="w-1/2 h-full relative">
            <div className="absolute top-[38%] left-[12%]">
              <MistyCloudSmall scale={0.65} opacity={0.6} />
            </div>
            <div className="absolute top-[16%] left-[54%]">
              <MistyCloudSmall scale={0.7} opacity={0.65} />
            </div>
          </div>
          <div className="w-1/2 h-full relative">
            <div className="absolute top-[38%] left-[12%]">
              <MistyCloudSmall scale={0.65} opacity={0.6} />
            </div>
            <div className="absolute top-[16%] left-[54%]">
              <MistyCloudSmall scale={0.7} opacity={0.65} />
            </div>
          </div>
        </div>

        {/* Seamless bottom fade into white chat canvas */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-white" />
      </div>

      {/* 2. Top Header Controls: Single straight horizontal line right at the top (h-14, pt-1.5) */}
      <div className="relative w-full h-14 flex items-center justify-between px-4 sm:px-6 pt-1.5 z-30">
        {/* Left: Sidebar Expand Toggle + Chat Title in same straight line */}
        <div className="flex items-center gap-2 max-w-[200px] sm:max-w-[260px] md:max-w-[340px] shrink-0">
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-[#4E483E] hover:text-[#181615] hover:bg-white/60 transition-colors shrink-0 shadow-xs border border-black/[0.04] bg-white/70 backdrop-blur-sm"
              title="Expand sidebar (Ctrl+B)"
            >
              <SidebarToggleIcon isOpen={false} className="w-[17px] h-[17px]" />
            </button>
          )}

          {mode === 'chat' && chatTitle && (
            <span
              className="text-[13.5px] font-medium text-[#181615] tracking-tight truncate select-none drop-shadow-xs"
              title={chatTitle}
            >
              {chatTitle}
            </span>
          )}
        </div>

        {/* Center: Mode Toggle in same straight horizontal line */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <ModeToggle mode={mode} onModeChange={onModeChange} />
        </div>

        {/* Right: Balanced spacer keeping layout perfectly aligned */}
        <div className="w-8 sm:w-12 shrink-0 pointer-events-none" />
      </div>
    </div>
  );
};
