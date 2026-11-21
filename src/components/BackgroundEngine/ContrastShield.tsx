import React from 'react';

interface ContrastShieldProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'solid';
}

export const ContrastShield: React.FC<ContrastShieldProps> = ({
  children,
  className = '',
  intensity = 'medium',
}) => {
  // Styles tailored to ensure black text and burgundy accents remain 100% legible
  const intensityMap = {
    subtle: 'bg-porcelain-100/50 backdrop-blur-sm border-porcelain-300/40',
    medium: 'bg-white/75 backdrop-blur-md border-black/[0.06] shadow-soft-sm',
    solid: 'bg-white/92 backdrop-blur-xl border-black/[0.08] shadow-soft-md',
  };

  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${intensityMap[intensity]} ${className}`}
    >
      {children}
    </div>
  );
};
