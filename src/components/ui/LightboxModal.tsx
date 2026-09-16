import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Tag } from 'lucide-react';
import { MachineImage } from '../../types';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: MachineImage[];
  initialIndex?: number;
  machineName?: string;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  machineName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || !images.length) return null;

  const currentImage = images[currentIndex] || images[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex w-full items-center justify-between text-white mb-4 px-2">
          <div>
            <span className="text-sm font-semibold tracking-wide text-sky-400">
              {machineName || 'Machine Media'}
            </span>
            <span className="mx-2 text-slate-500">•</span>
            <span className="text-xs text-slate-400">
              {currentIndex + 1} of {images.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main image presentation */}
        <div className="relative w-full max-h-[70vh] flex items-center justify-center bg-black/40 rounded-xl overflow-hidden border border-white/10">
          <img
            src={currentImage.image_url}
            alt={currentImage.caption || 'Machine view'}
            className="max-h-[70vh] max-w-full object-contain select-none"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white hover:bg-black/90 transition"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white hover:bg-black/90 transition"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* View Type Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-sky-600/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-xs">
            <Tag className="h-3.5 w-3.5" />
            {currentImage.view_type}
          </div>
        </div>

        {/* Caption */}
        {currentImage.caption && (
          <p className="mt-3 text-sm text-slate-300 text-center font-medium max-w-2xl">
            {currentImage.caption}
          </p>
        )}

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto p-2 max-w-full">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  currentIndex === idx ? 'border-sky-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img.image_url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
