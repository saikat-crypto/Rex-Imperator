import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T extends string | boolean> {
  value: T;
  label: string;
  sublabel?: string;
}

interface CustomDropdownProps<T extends string | boolean> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

export function CustomDropdown<T extends string | boolean>({
  value,
  options,
  onChange,
  className = '',
  ariaLabel,
}: CustomDropdownProps<T>): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || selectedOption?.label}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-[13px] font-medium transition-all duration-150 cursor-pointer shadow-soft-xs text-left ${
          isOpen
            ? 'bg-white border-[#181615] ring-1.5 ring-black/10 shadow-soft-sm text-[#181615]'
            : 'bg-white hover:bg-[#FAF8F5] border-black/15 hover:border-black/30 text-[#181615]'
        }`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#7A7469] transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-[#181615]' : ''
          }`}
        />
      </button>

      {/* Custom Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1.5 bg-[#FAF8F5]/98 backdrop-blur-md border border-black/10 rounded-xl p-1.5 shadow-soft-xl z-50 overflow-hidden"
          >
            <div className="space-y-0.5">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[13px] transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-white text-[#181615] font-semibold shadow-2xs border border-black/[0.04]'
                        : 'text-[#5A544A] hover:text-[#181615] hover:bg-black/[0.04] font-medium'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[11px] text-[#8C867C] font-normal leading-tight mt-0.5">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#181615] shrink-0 stroke-[2.2] ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
