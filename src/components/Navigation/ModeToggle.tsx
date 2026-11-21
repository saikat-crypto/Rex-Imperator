import React from 'react';
import { motion } from 'framer-motion';

export type AppMode = 'chat' | 'voice';

interface ModeToggleProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="select-none flex items-center">
      <div className="flex items-center p-1 rounded-full bg-white/90 backdrop-blur-md border border-black/[0.08] shadow-soft-sm">
        {/* Chat Tab (Left, as requested) */}
        <button
          type="button"
          onClick={() => onModeChange('chat')}
          className={`relative px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-200 cursor-pointer ${
            mode === 'chat'
              ? 'text-[#181615] font-semibold'
              : 'text-[#6F695E] hover:text-[#181615]'
          }`}
        >
          {mode === 'chat' && (
            <motion.div
              layoutId="mode-toggle-indicator"
              className="absolute inset-0 rounded-full bg-[#FCD702] shadow-xs"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          <span className="relative z-10">Chat</span>
        </button>

        {/* Voice Tab (Right, as requested) */}
        <button
          type="button"
          onClick={() => onModeChange('voice')}
          className={`relative px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-200 cursor-pointer ${
            mode === 'voice'
              ? 'text-[#181615] font-semibold'
              : 'text-[#6F695E] hover:text-[#181615]'
          }`}
        >
          {mode === 'voice' && (
            <motion.div
              layoutId="mode-toggle-indicator"
              className="absolute inset-0 rounded-full bg-[#FCD702] shadow-xs"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          <span className="relative z-10">Voice</span>
        </button>
      </div>
    </div>
  );
};
