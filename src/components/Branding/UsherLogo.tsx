import React from 'react';

interface UsherLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export const UsherLogo: React.FC<UsherLogoProps> = ({ className = '', style }) => {
  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Thick Red Outer Border */}
      <path
        d="M100 100v200a150 150 0 0 0 300 0v-200"
        fill="none"
        stroke="#E60000"
        strokeWidth="60"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Yellow Main Body */}
      <path
        d="M100 100v200a150 150 0 0 0 300 0v-200"
        fill="#FFD700"
        stroke="#E60000"
        strokeWidth="20"
        strokeLinejoin="round"
      />
      {/* White Face Area */}
      <path
        d="M160 100v180a90 90 0 0 0 180 0v-180"
        fill="white"
      />
      {/* Left Eye */}
      <circle cx="210" cy="220" r="50" fill="white" stroke="#8B0000" strokeWidth="8" />
      <circle cx="210" cy="220" r="25" fill="#3D1A00" />
      <circle cx="225" cy="210" r="10" fill="white" />
      {/* Right Eye */}
      <circle cx="290" cy="220" r="50" fill="white" stroke="#8B0000" strokeWidth="8" />
      <circle cx="290" cy="220" r="25" fill="#3D1A00" />
      <circle cx="305" cy="210" r="10" fill="white" />
      {/* Eyebrows */}
      <path d="M160 160 Q210 130 240 160" stroke="#E60000" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M260 160 Q290 130 340 160" stroke="#E60000" strokeWidth="12" fill="none" strokeLinecap="round" />
      {/* Mouth */}
      <path d="M200 320 Q250 340 300 320" stroke="#8B0000" strokeWidth="10" fill="none" strokeLinecap="round" />
    </svg>
  );
};
