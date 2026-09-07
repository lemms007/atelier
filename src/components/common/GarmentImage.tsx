import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import {
  isImageCached,
  markImageLoaded,
  markImageFailed,
  isImageFailed,
} from '../../utils/imageCache';

interface GarmentImageProps {
  src?: string;
  alt: string;
  className?: string;
  aspectRatio?: string; // e.g. "aspect-[3/4]"
  objectFit?: 'cover' | 'contain';
  garmentName?: string;
  designerName?: string;
  categoryName?: string;
  priority?: boolean;
  compact?: boolean;
  onImageError?: () => void;
  onImageLoad?: () => void;
}

/**
 * High-performance GarmentImage renderer with client-side memory caching,
 * lazy-loading, async decoding, and network request deduplication.
 */
export const GarmentImage: React.FC<GarmentImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'aspect-[3/4]',
  objectFit = 'cover',
  garmentName,
  designerName,
  categoryName,
  priority = false,
  compact = false,
  onImageError,
  onImageLoad,
}) => {
  // Validate clean string URL
  const rawClean = typeof src === 'string' ? src.trim() : '';
  const isInvalid =
    !rawClean ||
    rawClean === 'null' ||
    rawClean === 'undefined' ||
    rawClean === '[object Object]' ||
    rawClean.length < 6 ||
    isImageFailed(rawClean);
  const cleanSrc = isInvalid ? null : rawClean;

  const [hasError, setHasError] = useState(isInvalid);
  const [isLoaded, setIsLoaded] = useState(() => (cleanSrc ? isImageCached(cleanSrc) : false));

  // Reset states whenever the image source changes (e.g. clicking thumbnail)
  useEffect(() => {
    if (!cleanSrc || isImageFailed(cleanSrc)) {
      setHasError(true);
      setIsLoaded(false);
    } else if (isImageCached(cleanSrc)) {
      setHasError(false);
      setIsLoaded(true);
    } else {
      setHasError(false);
      setIsLoaded(false);
    }
  }, [cleanSrc]);

  const handleImageError = () => {
    if (cleanSrc) {
      markImageFailed(cleanSrc);
    }
    setHasError(true);
    if (onImageError) {
      onImageError();
    }
  };

  const handleImageLoad = () => {
    if (cleanSrc) {
      markImageLoaded(cleanSrc);
    }
    setIsLoaded(true);
    if (onImageLoad) {
      onImageLoad();
    }
  };

  if (!cleanSrc || hasError) {
    if (compact) {
      return (
        <div
          className={`w-full h-full ${aspectRatio} bg-gradient-to-br from-[#F5F3EF] to-[#E5E0D8] flex items-center justify-center p-1 select-none border border-[#E8E4DF] ${className}`}
        >
          <div className="w-5 h-5 rounded-full bg-white/80 shadow-2xs flex items-center justify-center text-[#80232F]">
            <Sparkles className="w-2.5 h-2.5 stroke-[1.5]" />
          </div>
        </div>
      );
    }

    return (
      <div
        className={`w-full h-full ${aspectRatio} bg-gradient-to-br from-[#F5F3EF] via-[#EFECE6] to-[#E5E0D8] flex flex-col items-center justify-center p-4 text-center select-none border border-[#E8E4DF] ${className}`}
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 shadow-xs border border-[#E8E4DF] flex items-center justify-center mb-2 text-[#141312]">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#80232F] stroke-[1.5]" />
        </div>
        {designerName && (
          <p className="text-[9px] uppercase tracking-[0.18em] font-medium text-[#948E88] max-w-[90%] truncate">
            {designerName}
          </p>
        )}
        <h4 className="font-serif text-xs font-semibold text-[#141312] max-w-[90%] line-clamp-2 mt-0.5">
          {garmentName || alt || 'Atelier Garment'}
        </h4>
        {categoryName && (
          <span className="mt-1.5 text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full bg-white/70 border border-[#E8E4DF] text-[#5C5854]">
            {categoryName}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#F5F3EF] ${aspectRatio} ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#F5F3EF] animate-pulse flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#C8A27A]/40 animate-spin" />
        </div>
      )}
      <img
        key={cleanSrc}
        src={cleanSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-full transition-opacity duration-300 ${
          objectFit === 'contain' ? 'object-contain' : 'object-cover'
        } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};
