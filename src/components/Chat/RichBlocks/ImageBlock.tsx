import React, { useState } from 'react';
import type { ImageBlockPayload } from '../../../types';
import { Maximize2, X } from 'lucide-react';

export const ImageBlock: React.FC<ImageBlockPayload> = ({ url, alt, caption }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="my-3 w-full">
      <div className="relative group overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-soft-sm w-full max-w-2xl">
        <img
          src={url}
          alt={alt}
          className="w-full h-auto object-cover max-h-96 transition-transform duration-300 group-hover:scale-[1.01]"
        />
        <button
          onClick={() => setIsZoomed(true)}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-black/80"
          title="Zoom image"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {caption && (
        <div className="mt-1.5 text-xs text-[var(--text-muted)] italic max-w-2xl">
          {caption}
        </div>
      )}

      {/* Modal Zoom View */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={url}
              alt={alt}
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            />
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
