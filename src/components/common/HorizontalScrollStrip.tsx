import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollStripProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const HorizontalScrollStrip: React.FC<HorizontalScrollStripProps> = ({
  children,
  className = '',
  id,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  // Check scroll boundary visibility for arrows & edge fades
  const updateScrollBounds = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollBounds();

    const resizeObserver = new ResizeObserver(() => {
      updateScrollBounds();
    });
    resizeObserver.observe(el);

    el.addEventListener('scroll', updateScrollBounds, { passive: true });

    return () => {
      resizeObserver.disconnect();
      el.removeEventListener('scroll', updateScrollBounds);
    };
  }, [updateScrollBounds]);

  // Handle Wheel Scroll (converts vertical wheel movement to horizontal scrolling on desktop)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;

    // If there is horizontal overflow, scroll horizontally
    if (el.scrollWidth > el.clientWidth) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        // Prevent default vertical page scroll only if we can actually scroll horizontally
        const atLeft = el.scrollLeft <= 0 && e.deltaY < 0;
        const atRight = el.scrollLeft >= el.scrollWidth - el.clientWidth && e.deltaY > 0;
        if (!atLeft && !atRight) {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 0.8;
          updateScrollBounds();
        }
      }
    }
  };

  // Scroll by step (using Chevron buttons)
  const handleScrollStep = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.5, 200);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Mouse Drag to Scroll handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftState(el.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const el = containerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.3;
    if (Math.abs(walk) > 4) {
      setHasMoved(true);
    }
    el.scrollLeft = scrollLeftState - walk;
    updateScrollBounds();
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Intercept child clicks if the user was actually dragging to prevent accidental triggers
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMoved) {
      e.stopPropagation();
      e.preventDefault();
      setHasMoved(false);
    }
  };

  return (
    <div id={id} className={`relative group w-full ${className}`}>
      {/* Left Chevron Button (Desktop) */}
      <div
        className={`hidden md:flex absolute left-0 top-0 bottom-0 z-10 items-center justify-start pl-1 pointer-events-none transition-opacity duration-200 ${
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#FAF9F6] via-[#FAF9F6]/90 to-transparent pointer-events-none" />
        <button
          type="button"
          onClick={() => handleScrollStep('left')}
          disabled={!canScrollLeft}
          aria-label="Scroll filter left"
          className="relative pointer-events-auto w-7 h-7 rounded-full bg-white/95 border border-[#E8E4DF] shadow-xs text-[#141312] flex items-center justify-center hover:bg-[#141312] hover:text-white hover:border-[#141312] transition-all cursor-pointer disabled:opacity-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Main Scrollable Track */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onClickCapture={handleClickCapture}
        className={`w-full overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {children}
      </div>

      {/* Right Chevron Button (Desktop) */}
      <div
        className={`hidden md:flex absolute right-0 top-0 bottom-0 z-10 items-center justify-end pr-1 pointer-events-none transition-opacity duration-200 ${
          canScrollRight ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#FAF9F6] via-[#FAF9F6]/90 to-transparent pointer-events-none" />
        <button
          type="button"
          onClick={() => handleScrollStep('right')}
          disabled={!canScrollRight}
          aria-label="Scroll filter right"
          className="relative pointer-events-auto w-7 h-7 rounded-full bg-white/95 border border-[#E8E4DF] shadow-xs text-[#141312] flex items-center justify-center hover:bg-[#141312] hover:text-white hover:border-[#141312] transition-all cursor-pointer disabled:opacity-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
