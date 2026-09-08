import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { Garment, GarmentSize, FirestoreProductVariation } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  formatPHP,
  addDaysToDate,
  calculateRentalPrice,
  formatDisplayDateShort,
  getGarmentShop,
  getGarmentColorOptions,
  GarmentColorOption,
  getGarmentAvailableSizes,
  normalizeSizeName,
  isSkuLike,
} from '../../utils/formatters';
import { RentalCalendar } from './RentalCalendar';
import {
  ArrowLeft,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  ShoppingBag,
  CalendarCheck,
  Check,
  CheckCircle2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { GarmentImage } from '../common/GarmentImage';
import { preloadGarmentVariationImages } from '../../utils/imageCache';
import {
  fetchProductVariationsFromFirestore,
  deduplicateImageUrls,
} from '../../services/firestoreProducts';

interface ProductDetailPageProps {
  garment: Garment;
  onBack: () => void;
  initialVariationIndex?: number;
  initialColor?: string;
  initialSize?: GarmentSize;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  garment,
  onBack,
  initialVariationIndex,
  initialColor,
  initialSize,
}) => {
  const {
    addToCart,
    wishlist,
    toggleWishlist,
    showToast,
    setIsCheckoutOpen,
    configuredDurations,
    garmentSelections,
    setGarmentSelection,
  } = useApp();

  const durationOptions = configuredDurations && configuredDurations.length > 0
    ? configuredDurations
    : [4, 8, 12, 14];

  const [subVariations, setSubVariations] = useState<FirestoreProductVariation[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchProductVariationsFromFirestore(garment).then((vars) => {
      if (isMounted && vars.length > 0) {
        setSubVariations(vars);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [garment]);

  // Color options list derived uniformly
  const colorOptions = useMemo(() => getGarmentColorOptions(garment), [garment]);

  // Helper to determine if a colorway option is disabled
  const isColorDisabled = useCallback(
    (opt: GarmentColorOption) => {
      if (opt.disabled) return true;
      if (opt.is_available_for_rent === false) return true;
      if (opt.inStock === false) return true;
      if (opt.quantity !== undefined && opt.quantity <= 0) return true;
      if (opt.available_to_sell !== undefined && opt.available_to_sell <= 0) return true;

      // Check subcollection matching color name
      if (subVariations.length > 0) {
        const matchingColorSubVars = subVariations.filter((v) => {
          const norm = normalizeSizeName(v.option_name);
          if (!norm) {
            return (
              v.option_name.toLowerCase() === opt.name.toLowerCase() ||
              (opt.colorName && v.option_name.toLowerCase() === opt.colorName.toLowerCase())
            );
          }
          return false;
        });
        if (matchingColorSubVars.length > 0) {
          const anyAvailable = matchingColorSubVars.some((v) => v.available_to_sell > 0);
          if (!anyAvailable) return true;
        }
      }

      return false;
    },
    [subVariations]
  );

  // Check saved variation state for this garment (e.g. from GarmentCard in catalog)
  const savedSelection = garmentSelections[garment.id];

  const initialIndex = useMemo(() => {
    if (initialColor) {
      const idx = colorOptions.findIndex(
        (opt) => opt.name.toLowerCase() === initialColor.toLowerCase() && !isColorDisabled(opt)
      );
      if (idx !== -1) return idx;
    }
    if (savedSelection?.colorName) {
      const idx = colorOptions.findIndex(
        (opt) => opt.name.toLowerCase() === savedSelection.colorName!.toLowerCase() && !isColorDisabled(opt)
      );
      if (idx !== -1) return idx;
    }
    if (
      savedSelection?.variationIndex !== undefined &&
      colorOptions[savedSelection.variationIndex] &&
      !isColorDisabled(colorOptions[savedSelection.variationIndex])
    ) {
      return savedSelection.variationIndex;
    }
    if (
      initialVariationIndex !== undefined &&
      colorOptions[initialVariationIndex] &&
      !isColorDisabled(colorOptions[initialVariationIndex])
    ) {
      return initialVariationIndex;
    }
    // Do not auto-select disabled colorway; select first available
    const firstEnabledIdx = colorOptions.findIndex((opt) => !isColorDisabled(opt));
    if (firstEnabledIdx !== -1) return firstEnabledIdx;
    return 0;
  }, [colorOptions, initialColor, initialVariationIndex, savedSelection, isColorDisabled]);

  // Selected variant state
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return colorOptions[initialIndex]?.name || 'Original';
  });

  useEffect(() => {
    const currentOpt = colorOptions.find(
      (opt) => opt.name.toLowerCase() === selectedColor.toLowerCase()
    );
    // If currently selected colorway is disabled, switch to first available colorway
    if (!currentOpt || isColorDisabled(currentOpt)) {
      const firstValid = colorOptions.find((opt) => !isColorDisabled(opt));
      if (firstValid && firstValid.name !== selectedColor) {
        setSelectedColor(firstValid.name);
      }
    } else if (savedSelection?.colorName) {
      const savedOpt = colorOptions.find(
        (opt) => opt.name.toLowerCase() === savedSelection.colorName!.toLowerCase()
      );
      if (savedOpt && !isColorDisabled(savedOpt) && savedOpt.name !== selectedColor) {
        setSelectedColor(savedOpt.name);
      }
    }
  }, [garment.id, colorOptions, isColorDisabled, savedSelection?.colorName]);

  const activeColorOption = colorOptions.find(
    (opt) => opt.name.toLowerCase() === selectedColor.toLowerCase()
  ) || colorOptions[0];

  const hasVariations = Array.isArray(garment.variations) && garment.variations.length > 0;
  const activeVariation = hasVariations
    ? garment.variations!.find(
        (v) =>
          v.name.toLowerCase() === selectedColor.toLowerCase() ||
          v.colorName?.toLowerCase() === selectedColor.toLowerCase()
      ) || garment.variations![0]
    : null;

  // Active sizes (from subcollection, variation or parent, sanitized of SKUs)
  const fallbackSizes = activeColorOption?.sizes && activeColorOption.sizes.length > 0
    ? activeColorOption.sizes
    : activeVariation?.sizes && activeVariation.sizes.length > 0
    ? activeVariation.sizes
    : garment.sizes;

  const availableSizes: GarmentSize[] = useMemo(() => {
    return getGarmentAvailableSizes(subVariations, fallbackSizes);
  }, [subVariations, fallbackSizes]);

  // Helper to determine if a size variation is disabled
  const isSizeDisabled = useCallback(
    (size: GarmentSize) => {
      const matchedSubVar = subVariations.find((v) => {
        const norm =
          normalizeSizeName(v.option_name) ||
          (v.sku && !isSkuLike(v.sku) ? normalizeSizeName(v.sku) : null);
        return (
          norm?.toLowerCase() === size.toLowerCase() ||
          v.option_name.toLowerCase() === size.toLowerCase()
        );
      });
      if (matchedSubVar) {
        return matchedSubVar.available_to_sell <= 0;
      }
      return false;
    },
    [subVariations]
  );

  // Initialize size to first enabled size (do not auto-select disabled size)
  const [selectedSize, setSelectedSize] = useState<GarmentSize>(() => {
    if (
      savedSelection?.size &&
      availableSizes.includes(savedSelection.size) &&
      !isSizeDisabled(savedSelection.size)
    ) {
      return savedSelection.size;
    }
    const firstEnabled = availableSizes.find((s) => !isSizeDisabled(s));
    return firstEnabled || availableSizes[0] || 'S';
  });

  // When sizes or subcollection load, ensure a disabled size is not auto-selected
  useEffect(() => {
    if (availableSizes.length > 0) {
      if (!availableSizes.includes(selectedSize) || isSizeDisabled(selectedSize)) {
        const firstAvailable = availableSizes.find((s) => !isSizeDisabled(s));
        if (firstAvailable && firstAvailable !== selectedSize) {
          setSelectedSize(firstAvailable);
          setGarmentSelection(garment.id, { size: firstAvailable });
        }
      }
    }
  }, [availableSizes, subVariations, selectedSize, isSizeDisabled, garment.id]);

  const handleSelectColorOption = (opt: GarmentColorOption) => {
    if (isColorDisabled(opt)) return;
    setSelectedColor(opt.name);
    let nextSize = selectedSize;
    if (opt.sizes && opt.sizes.length > 0 && !opt.sizes.includes(selectedSize)) {
      const validSize = opt.sizes.find((s) => !isSizeDisabled(s)) || opt.sizes[0];
      nextSize = validSize;
      setSelectedSize(nextSize);
    } else if (isSizeDisabled(selectedSize)) {
      const validSize = availableSizes.find((s) => !isSizeDisabled(s));
      if (validSize) {
        nextSize = validSize;
        setSelectedSize(nextSize);
      }
    }
    setGarmentSelection(garment.id, {
      variationIndex: opt.index,
      colorName: opt.name,
      size: nextSize,
    });
    setActiveImageIndex(0);
    setFailedIndices([]);
  };

  const handleSelectSize = (size: GarmentSize) => {
    if (isSizeDisabled(size)) return;
    setSelectedSize(size);
    setGarmentSelection(garment.id, {
      size,
    });
  };

  // Filter and deduplicate valid image URLs for the active color option
  const candidateImages = activeColorOption?.images && activeColorOption.images.length > 0
    ? activeColorOption.images
    : activeColorOption?.image
    ? [activeColorOption.image, ...garment.images.filter((img) => img !== activeColorOption.image)]
    : (activeVariation && activeVariation.images && activeVariation.images.length > 0
    ? activeVariation.images
    : garment.images);

  const validImages = useMemo(() => {
    return deduplicateImageUrls(candidateImages);
  }, [candidateImages]);

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [failedIndices, setFailedIndices] = useState<number[]>([]);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);
  const [showCalendarGrid, setShowCalendarGrid] = useState<boolean>(false);

  // Ensure PDP opens immediately at the very top of the page
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [garment.id]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    preloadGarmentVariationImages(garment);
  }, [garment.id]);

  // Reset active image index when viewing a new garment or switching color variation
  useEffect(() => {
    setActiveImageIndex(0);
    setFailedIndices([]);
  }, [garment.id, selectedColor]);

  // When active sizes change, verify selectedSize is still valid
  useEffect(() => {
    if (!availableSizes.includes(selectedSize) && availableSizes.length > 0) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  useEffect(() => {
    if (activeImageIndex >= validImages.length && validImages.length > 0) {
      setActiveImageIndex(0);
    }
  }, [validImages.length, activeImageIndex]);

  const handleMainImageError = () => {
    const currentIdx = activeImageIndex;
    setFailedIndices((prev) => {
      const updated = prev.includes(currentIdx) ? prev : [...prev, currentIdx];
      // Automatically switch to the first working image if available
      const nextWorkingIdx = validImages.findIndex((_, idx) => !updated.includes(idx));
      if (nextWorkingIdx !== -1 && nextWorkingIdx !== currentIdx) {
        setActiveImageIndex(nextWorkingIdx);
      }
      return updated;
    });
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (validImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (validImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  };

  // Default dates: tomorrow start, 4 days minimum
  const today = new Date();
  const defaultStartDate = addDaysToDate(today.toISOString().split('T')[0], 1);
  const defaultEndDate = addDaysToDate(defaultStartDate, 3); // 4 days

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [durationDays, setDurationDays] = useState<number>(4);

  const handleDateChange = (start: string, end: string, duration: number) => {
    setStartDate(start);
    setEndDate(end);
    setDurationDays(duration);
  };

  const handleSelectDuration = (days: number) => {
    setDurationDays(days);
    setEndDate(addDaysToDate(startDate, days - 1));
  };

  const handleStartDateChange = (newStart: string) => {
    if (!newStart) return;
    setStartDate(newStart);
    setEndDate(addDaysToDate(newStart, durationDays - 1));
  };

  // Price calculations: prioritize live subcollection or variation price from database
  const activeSubVar = subVariations.find((v) => {
    const norm = normalizeSizeName(v.option_name) || (v.sku && !isSkuLike(v.sku) ? normalizeSizeName(v.sku) : null);
    return (
      norm?.toLowerCase() === selectedSize.toLowerCase() ||
      v.option_name?.toLowerCase() === selectedSize.toLowerCase()
    );
  });
  const effectiveBasePrice =
    (activeSubVar?.price && activeSubVar.price > 0 ? activeSubVar.price : null) ||
    (activeColorOption?.price && activeColorOption.price > 0 ? activeColorOption.price : null) ||
    (activeVariation?.price && activeVariation.price > 0 ? activeVariation.price : null) ||
    garment.price_min ||
    garment.basePrice4Days;

  const rentalPrice = calculateRentalPrice(
    effectiveBasePrice,
    garment.dailyExtraRate,
    durationDays
  );
  const securityDeposit = Math.max(0, Math.round(rentalPrice * 0.5));

  const isWishlisted = wishlist.includes(garment.id);

  // Handle Add to Cart
  const handleAddToCart = () => {
    setGarmentSelection(garment.id, {
      variationIndex: activeColorOption?.index ?? 0,
      colorName: selectedColor,
      size: selectedSize,
    });
    addToCart({
      garmentId: garment.id,
      garment,
      selectedSize,
      selectedColor,
      startDate,
      endDate,
      durationDays,
      rentalPrice,
      securityDeposit,
    });
  };

  // Handle Rent Now (Add to Cart & Open Checkout)
  const handleRentNow = () => {
    setGarmentSelection(garment.id, {
      variationIndex: activeColorOption?.index ?? 0,
      colorName: selectedColor,
      size: selectedSize,
    });
    addToCart({
      garmentId: garment.id,
      garment,
      selectedSize,
      selectedColor,
      startDate,
      endDate,
      durationDays,
      rentalPrice,
      securityDeposit,
    });
    setIsCheckoutOpen(true);
  };

  const productSource = getGarmentShop(garment);

  const productType = garment.productType || garment.category;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${garment.name} - ${productSource}`,
        text: `Rent ${garment.name} by ${productSource} for ${formatPHP(rentalPrice)}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-32">
      {/* Floating Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E8E4DF] px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between">
          <button
            id="btn-pdp-back"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-[#141312] hover:text-[#80232F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[1.75]" />
            <span>Back to Collection</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-white border border-[#E8E4DF] flex items-center justify-center text-[#5C5854] hover:text-[#141312] transition-colors cursor-pointer"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>
            <button
              onClick={() => toggleWishlist(garment.id)}
              className="w-8 h-8 rounded-full bg-white border border-[#E8E4DF] flex items-center justify-center transition-colors cursor-pointer"
              title="Save to Wishlist"
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isWishlisted ? 'fill-[#80232F] text-[#80232F]' : 'text-[#5C5854]'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Column 1: Product Image and Details Card (Favorable 7-Column Layout & Fits in One Screen) */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* 1. Image Showcase - Editorial Frame (Enlarged & Clean) */}
            <div className="relative h-[350px] sm:h-[390px] aspect-[3/4] mx-auto bg-[#F5F3EF] rounded-xl overflow-hidden border border-[#E8E4DF] group shadow-xs">
              <GarmentImage
                src={validImages[activeImageIndex] || validImages[0]}
                alt={`${garment.name} - View ${activeImageIndex + 1}`}
                garmentName={garment.name}
                designerName={garment.designer}
                categoryName={garment.category}
                priority
                onImageError={handleMainImageError}
              />

              {/* Carousel Arrows (if multiple images) */}
              {validImages.length > 1 && (
                <>
                  <button
                    id="btn-pdp-prev-img"
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-[#141312] flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-xs border border-[#E8E4DF] opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2]" />
                  </button>
                  <button
                    id="btn-pdp-next-img"
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-[#141312] flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-xs border border-[#E8E4DF] opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2]" />
                  </button>
                </>
              )}

              {/* Zoom Lightbox Trigger (if image available) */}
              {validImages.length > 0 && (
                <button
                  id="btn-pdp-zoom"
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-black transition-colors cursor-pointer"
                  title="Zoom Image"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Gallery Pagination Dots */}
              {validImages.length > 1 && (
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  {validImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'bg-white w-3.5'
                          : 'bg-white/40 w-1.5 hover:bg-white/70'
                      }`}
                      aria-label={`View photo ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Selector Row */}
            {validImages.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-0.5 px-1">
                {validImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    id={`btn-pdp-thumb-${idx}`}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-12 h-15 rounded-md overflow-hidden transition-all shrink-0 cursor-pointer ${
                      activeImageIndex === idx
                        ? 'ring-2 ring-[#141312] ring-offset-1 scale-105 opacity-100 shadow-xs'
                        : 'border border-[#E8E4DF] opacity-60 hover:opacity-100 hover:scale-102'
                    }`}
                    title={`Select Photo ${idx + 1}`}
                  >
                    <GarmentImage
                      src={img}
                      alt={`Photo ${idx + 1}`}
                      aspectRatio="aspect-auto"
                      compact={true}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[7px] text-center font-mono py-0.2">
                      {idx + 1}/{validImages.length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* 2. Garment Details & Editorial Header Card */}
            <div className="space-y-3 bg-[#FFFFFF] p-4 sm:p-5 rounded-xl border border-[#E8E4DF] shadow-xs">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#948E88]">
                    {productType}
                  </span>
                  <span className="text-[9px] font-medium text-[#80232F] bg-[#80232F]/8 px-2 py-0.5 rounded">
                    Vault Certified
                  </span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#141312] leading-tight">
                  {garment.name}
                </h1>
                <p className="text-xs text-[#5C5854] mt-0.5">
                  By <span className="text-[#141312] font-medium">{productSource}</span>
                </p>
              </div>

              {/* Key Silhouette & Fabric Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {garment.fabric && (
                  <span className="text-[10px] bg-[#FAF9F6] border border-[#E8E4DF] text-[#5C5854] px-2 py-0.5 rounded-full">
                    {garment.fabric}
                  </span>
                )}
                {garment.silhouette && (
                  <span className="text-[10px] bg-[#FAF9F6] border border-[#E8E4DF] text-[#5C5854] px-2 py-0.5 rounded-full">
                    {garment.silhouette}
                  </span>
                )}
                {garment.occasion && (
                  <span className="text-[10px] bg-[#FAF9F6] border border-[#E8E4DF] text-[#5C5854] px-2 py-0.5 rounded-full">
                    {garment.occasion}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-[13px] text-[#5C5854] leading-relaxed">
                {garment.description}
              </p>
            </div>
          </div>

          {/* Column 2: Styled directly after VariationSelectModal ("Add to Bag" dialog) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Main Rental Configuration & Booking Card */}
            <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] shadow-xs overflow-hidden">
              {/* Header: patterned after Add to Bag dialog */}
              <div className="p-4 sm:p-5 border-b border-[#E8E4DF] bg-[#FAF9F6]/60">
                <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#80232F] block">
                  {productSource}
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#141312]">
                    Rental Options
                  </h3>
                  <span className="text-[10px] text-[#5C5854] font-medium bg-white px-2 py-0.5 rounded border border-[#E8E4DF]">
                    Size {selectedSize} · {selectedColor} · {durationDays}D
                  </span>
                </div>
              </div>

              {/* Step-by-Step Configuration Body */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* Colorway */}
                {colorOptions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-xs text-[#141312] block tracking-wide">
                        Colorway: <span className="font-serif text-[#80232F]">{selectedColor}</span>
                      </label>
                      {colorOptions.length > 1 && (
                        <span className="text-[10px] text-[#948E88]">
                          {colorOptions.length} Colorways
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {colorOptions.map((opt) => {
                        const isSelected = selectedColor.toLowerCase() === opt.name.toLowerCase();
                        const isOptDisabled = isColorDisabled(opt);
                        return (
                          <button
                            key={opt.name}
                            type="button"
                            id={`btn-color-${opt.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            disabled={isOptDisabled}
                            onClick={() => !isOptDisabled && handleSelectColorOption(opt)}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                              isOptDisabled
                                ? 'opacity-35 border-[#E8E4DF] bg-[#FAF9F6] text-[#948E88] cursor-not-allowed line-through'
                                : isSelected
                                ? 'border-[#141312] bg-[#FAF9F6] ring-1 ring-[#141312] cursor-pointer'
                                : 'border-[#E8E4DF] hover:border-[#141312]/40 bg-white cursor-pointer'
                            }`}
                          >
                            {opt.image ? (
                              <div className="w-7 h-9 rounded overflow-hidden shrink-0 bg-[#E8E4DF]">
                                <img
                                  src={opt.image}
                                  alt={opt.name}
                                  className={`w-full h-full object-cover ${isOptDisabled ? 'grayscale' : ''}`}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ) : (
                              <span
                                className="w-4 h-4 rounded-full border shrink-0"
                                style={{ backgroundColor: opt.hex || '#ccc' }}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <span className={`text-[11px] font-medium block truncate ${isOptDisabled ? 'line-through text-[#948E88]' : 'text-[#141312]'}`}>
                                {opt.name}
                              </span>
                              {isOptDisabled && (
                                <span className="text-[9px] text-[#B91C1C] block not-italic no-underline font-normal">
                                  Unavailable
                                </span>
                              )}
                            </div>
                            {isSelected && !isOptDisabled && <Check className="w-3.5 h-3.5 text-[#141312] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size */}
                <div className="space-y-2 pt-2 border-t border-[#E8E4DF]/60">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-xs text-[#141312] block tracking-wide">
                      Size: <span className="text-[#80232F]">{selectedSize}</span>
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => {
                      const isSelected = selectedSize === size;
                      const matchedSubVar = subVariations.find((v) => {
                        const norm =
                          normalizeSizeName(v.option_name) ||
                          (v.sku && !isSkuLike(v.sku) ? normalizeSizeName(v.sku) : null);
                        return (
                          norm?.toLowerCase() === size.toLowerCase() ||
                          v.option_name.toLowerCase() === size.toLowerCase()
                        );
                      });
                      const isAvailable = !isSizeDisabled(size);

                      return (
                        <button
                          key={size}
                          id={`btn-size-${size.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => isAvailable && handleSelectSize(size)}
                          className={`h-9 px-3.5 rounded-lg font-medium text-xs transition-all border flex items-center gap-1.5 ${
                            !isAvailable
                              ? 'opacity-30 border-[#E8E4DF] bg-[#FAF9F6] text-[#948E88] cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-[#141312] text-white border-[#141312] cursor-pointer'
                              : 'bg-white text-[#141312] border-[#E8E4DF] hover:border-[#141312] cursor-pointer'
                          }`}
                        >
                          <span>{size}</span>
                          {matchedSubVar && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-[#FAF9F6] text-[#5C5854] border border-[#E8E4DF]'
                              }`}
                            >
                              {matchedSubVar.available_to_sell} left
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2 pt-2 border-t border-[#E8E4DF]/60">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-xs text-[#141312] block tracking-wide">
                      Duration: <span className="text-[#80232F]">{durationDays} Days</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {durationOptions.map((days) => {
                      const isSelected = durationDays === days;
                      const priceForDays = calculateRentalPrice(
                        effectiveBasePrice,
                        garment.dailyExtraRate,
                        days
                      );
                      return (
                        <button
                          key={days}
                          type="button"
                          id={`btn-pdp-duration-${days}d`}
                          onClick={() => handleSelectDuration(days)}
                          className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#141312] text-white border-[#141312] shadow-xs'
                              : 'bg-white text-[#141312] border-[#E8E4DF] hover:border-[#141312]'
                          }`}
                        >
                          <span className="font-semibold text-xs">{days} Days</span>
                          <span
                            className={`text-[10px] font-medium ${
                              isSelected ? 'text-white/90' : 'text-[#141312]'
                            }`}
                          >
                            {formatPHP(priceForDays)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Price and Refundable Breakdown */}
                  <div className="flex flex-wrap items-baseline justify-between gap-1.5 p-2.5 bg-[#FAF9F6] rounded-xl border border-[#E8E4DF] mt-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-serif text-base sm:text-lg font-bold text-[#141312]">
                        {formatPHP(rentalPrice)}
                      </span>
                      <span className="text-[11px] text-[#948E88]">
                        for {durationDays} days
                      </span>
                    </div>
                    <span className="text-[11px] text-[#5C5854]">
                      ({formatPHP(securityDeposit)} refundable · 50%)
                    </span>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-2 pt-2 border-t border-[#E8E4DF]/60">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-xs text-[#141312] block tracking-wide">
                      Dates
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCalendarGrid(!showCalendarGrid)}
                      className="text-[11px] font-medium text-[#80232F] hover:text-[#50131B] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{showCalendarGrid ? 'Hide Calendar' : 'View Calendar Grid'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E8E4DF]">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[#948E88] block font-medium">
                        Delivery / Start
                      </span>
                      <input
                        type="date"
                        value={startDate}
                        min={defaultStartDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="w-full bg-white border border-[#E8E4DF] rounded px-2 py-1 text-xs text-[#141312] mt-0.5 font-medium focus:outline-none focus:border-[#141312]"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[#948E88] block font-medium">
                        Return by ({durationDays} Days)
                      </span>
                      <div className="w-full bg-[#EFECE6] border border-[#E8E4DF] rounded px-2 py-1 text-xs text-[#141312] mt-0.5 font-medium flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3 text-[#5C5854] shrink-0" />
                        <span className="truncate">{formatDisplayDateShort(endDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Optional expanded monthly calendar grid */}
                  {showCalendarGrid && (
                    <div className="pt-2 animate-fadeIn">
                      <RentalCalendar
                        garment={garment}
                        startDate={startDate}
                        endDate={endDate}
                        configuredDurations={durationOptions}
                        onChangeDates={handleDateChange}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer: Action Buttons */}
              <div className="p-4 sm:p-5 bg-[#FAF9F6] border-t border-[#E8E4DF]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    id="btn-inline-add-to-cart"
                    type="button"
                    disabled={garment.is_available_for_rent === false || (garment.quantity !== undefined && garment.quantity <= 0)}
                    onClick={handleAddToCart}
                    className="h-11 px-4 rounded-lg text-xs font-semibold border border-[#141312] text-[#141312] bg-white hover:bg-[#FAF9F6] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="w-4 h-4 stroke-[1.75]" />
                    <span>
                      {garment.is_available_for_rent === false
                        ? 'Rental Paused'
                        : garment.quantity !== undefined && garment.quantity <= 0
                        ? 'Out of Stock'
                        : 'Add to Bag'}
                    </span>
                  </button>

                  <button
                    id="btn-inline-rent-now"
                    type="button"
                    disabled={garment.is_available_for_rent === false || (garment.quantity !== undefined && garment.quantity <= 0)}
                    onClick={handleRentNow}
                    className="h-11 px-4 rounded-lg text-xs font-semibold text-white bg-[#141312] hover:bg-[#2A2725] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    <span>
                      {garment.is_available_for_rent === false
                        ? 'Unavailable'
                        : garment.quantity !== undefined && garment.quantity <= 0
                        ? 'Out of Stock'
                        : 'Book Now'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Sticky Bottom Action Bar */}
      <div
        id="pdp-sticky-bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E8E4DF] py-3 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Price Breakdown */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-lg sm:text-xl font-semibold text-[#141312]">
                {formatPHP(rentalPrice)}
              </span>
              <span className="text-[11px] text-[#948E88]">
                ({durationDays} Days)
              </span>
            </div>
            <span className="text-[10px] text-[#5C5854]">
              ({formatPHP(securityDeposit)} refundable · 50%)
            </span>
          </div>

          {/* Dual Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              id="btn-pdp-add-to-cart"
              type="button"
              disabled={garment.is_available_for_rent === false || (garment.quantity !== undefined && garment.quantity <= 0)}
              onClick={handleAddToCart}
              className="h-10 px-4 sm:px-5 rounded-md text-xs font-medium border border-[#141312] text-[#141312] bg-white hover:bg-[#FAF9F6] active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>
                {garment.is_available_for_rent === false
                  ? 'Rental Paused'
                  : garment.quantity !== undefined && garment.quantity <= 0
                  ? 'Out of Stock'
                  : 'Add to Bag'}
              </span>
            </button>

            <button
              id="btn-pdp-rent-now"
              type="button"
              disabled={garment.is_available_for_rent === false || (garment.quantity !== undefined && garment.quantity <= 0)}
              onClick={handleRentNow}
              className="h-10 px-5 sm:px-6 rounded-md text-xs font-medium text-white bg-[#141312] hover:bg-[#2A2725] active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>
                {garment.is_available_for_rent === false
                  ? 'Unavailable'
                  : garment.quantity !== undefined && garment.quantity <= 0
                  ? 'Out of Stock'
                  : 'Book Now'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Fullscreen Zoom Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-fadeIn select-none">
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors z-10"
            title="Close Zoom"
          >
            <X className="w-4 h-4" />
          </button>

          {validImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 active:scale-95 transition-all z-10"
                title="Previous Image"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2]" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 active:scale-95 transition-all z-10"
                title="Next Image"
              >
                <ChevronRight className="w-5 h-5 stroke-[2]" />
              </button>
            </>
          )}

          <div className="max-h-[82vh] max-w-[90vw] flex items-center justify-center">
            <img
              key={validImages[activeImageIndex] || validImages[0]}
              src={validImages[activeImageIndex] || validImages[0]}
              alt={garment.name}
              className="max-h-[82vh] max-w-full object-contain rounded-md"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="text-center mt-3">
            <p className="text-white font-serif text-sm">
              {garment.name} — <span className="text-white/70">{productSource}</span>
            </p>
            {validImages.length > 1 && (
              <p className="text-white/60 text-xs mt-0.5 font-mono">
                {activeImageIndex + 1} of {validImages.length}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
