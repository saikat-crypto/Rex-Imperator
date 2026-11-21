import React from 'react';

interface SidebarToggleIconProps {
  isOpen?: boolean;
  className?: string;
}

export const SidebarToggleIcon: React.FC<SidebarToggleIconProps> = ({
  isOpen = false,
  className = 'w-4 h-4',
}) => {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-all duration-200`}
    >
      {/* Outer rounded square */}
      <rect
        x="1.75"
        y="1.75"
        width="12.5"
        height="12.5"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      {/* Vertical side divider line */}
      <line
        x1="5.75"
        y1="1.75"
        x2="5.75"
        y2="14.25"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      {/* Subtle indicator fill in the sidebar section when open */}
      {isOpen && (
        <rect
          x="2.4"
          y="2.4"
          width="2.7"
          height="11.2"
          rx="1.5"
          fill="currentColor"
          fillOpacity="0.25"
        />
      )}
    </svg>
  );
};
