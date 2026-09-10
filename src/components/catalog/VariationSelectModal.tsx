import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Garment, GarmentSize, GarmentVariation, FirestoreProductVariation } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  formatPHP,
  addDaysToDate,
  calculateRentalPrice,
  formatDisplayDateShort,
  getGarmentColorOptions,
  GarmentColorOption,
  getGarmentAvailableSizes,
  normalizeSizeName,
  isSkuLike,
  getGarmentShop,
} from '../../utils/formatters';
import { X, Check, ShoppingBag, CalendarCheck, Calendar as CalendarIcon } from 'lucide-react';
import { GarmentImage } from '../common/GarmentImage';
import { RentalCalendar } from '../pdp/RentalCalendar';
import { fetchProductVariationsFromFirestore } from '../../services/firestoreProducts';

interface VariationSelectModalProps {
  garment: Garment;
  isOpen: boolean;
  initialVariationIndex?: number;
  initialColorName?: string;
  initialSize?: GarmentSize;
  onSelectVariation?: (index: number, colorName: string, size?: GarmentSize) => void;
  onClose: () => void;
}

export const VariationSelectModal: React.FC<VariationSelectModalProps> = ({
  garment,
  isOpen,
  initialVariationIndex,
  initialColorName,
  initialSize,
  onSelectVariation,
  onClose,
}) => {
  const {
    addToCart,
    setIsCheckoutOpen,
    setGarmentSelection,
    configuredDurations,
    rentalPricingConfig,
  } = useApp();
  const [subVariations, setSubVariations] = useState<FirestoreProductVariation[]>([]);
  const [showCalendarGrid, setShowCalendarGrid] = useState<boolean>(false);

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

  // Compute initial index from props, avoiding disabled options
  const computeInitialIndex = useCallback(() => {
    if (initialColorName) {
      const foundIdx = colorOptions.findIndex(
        (opt) => opt.name.toLowerCase() === initialColorName.toLowerCase() && !isColorDisabled(opt)
      );
      if (foundIdx !== -1) return foundIdx;
    }
    if (
      initialVariationIndex !== undefined &&
      colorOptions[initialVariationIndex] &&
      !isColorDisabled(colorOptions[initialVariationIndex])
    ) {
      return initialVariationIndex;
    }
    const firstEnabledIdx = colorOptions.findIndex((opt) => !isColorDisabled(opt));
    if (firstEnabledIdx !== -1) return firstEnabledIdx;
    return 0;
  }, [colorOptions, initialColorName, initialVariationIndex, isColorDisabled]);

  const [selectedVarIndex, setSelectedVarIndex] = useState<number>(computeInitialIndex);

  // Sync index whenever modal is opened or initial props change
  useEffect(() => {
    if (isOpen) {
      const idx = computeInitialIndex();
      setSelectedVarIndex(idx);
    }
  }, [isOpen, computeInitialIndex]);

  const activeOpt = colorOptions[selectedVarIndex] || colorOptions[0];
  const activeVar: GarmentVariation | null =
    garment.variations && garment.variations[selectedVarIndex]
      ? garment.variations[selectedVarIndex]
      : null;

  // Available sizes derived from subcollection or active color option or parent (sanitized of SKUs)
  const fallbackSizes = activeOpt?.sizes && activeOpt.sizes.length > 0
    ? activeOpt.sizes
    : (garment.sizes.length > 0 ? garment.sizes : ['XS', 'S', 'M', 'L', 'XL']);

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

  const [selectedSize, setSelectedSize] = useState<GarmentSize>(() => {
    if (initialSize && availableSizes.includes(initialSize) && !isSizeDisabled(initialSize)) {
      return initialSize;
    }
    const firstValid = availableSizes.find((s) => !isSizeDisabled(s));
    return firstValid || availableSizes[0] || 'S';
  });

  useEffect(() => {
    if (isOpen && availableSizes.length > 0) {
      if (!availableSizes.includes(selectedSize) || isSizeDisabled(selectedSize)) {
        const firstValid = availableSizes.find((s) => !isSizeDisabled(s));
        if (firstValid && firstValid !== selectedSize) {
          setSelectedSize(firstValid);
        }
      }
    }
  }, [isOpen, initialSize, selectedVarIndex, availableSizes, isSizeDisabled, selectedSize]);

  // Dates & Durations
  const durationOptions = configuredDurations && configuredDurations.length > 0
    ? configuredDurations
    : [4, 8, 12, 16];

  const [durationDays, setDurationDays] = useState<number>(durationOptions[0] || 4);

  const today = new Date();
  const defaultStartDate = addDaysToDate(today.toISOString().split('T')[0], 1);
  const [startDate, setStartDate] = useState<string>(defaultStartDate);

  const endDate = addDaysToDate(startDate, durationDays - 1);

  // Price calculations: prioritize live subcollection or variation price from database
  const matchedSubVar = subVariations.find((v) => {
    const norm = normalizeSizeName(v.option_name) || (v.sku && !isSkuLike(v.sku) ? normalizeSizeName(v.sku) : null);
    return (
      norm?.toLowerCase() === selectedSize.toLowerCase() ||
      v.option_name?.toLowerCase() === selectedSize.toLowerCase()
    );
  });
  const effectiveBasePrice =
    (matchedSubVar?.price && matchedSubVar.price > 0 ? matchedSubVar.price : null) ||
    (activeOpt?.price && activeOpt.price > 0 ? activeOpt.price : null) ||
    (activeVar?.price && activeVar.price > 0 ? activeVar.price : null) ||
    garment.price_min ||
    garment.basePrice4Days;

  const rentalPrice = calculateRentalPrice(
    effectiveBasePrice,
    garment.dailyExtraRate,
    durationDays,
    rentalPricingConfig
  );

  const securityDeposit = Math.max(0, Math.round(rentalPrice * 0.5));

  // Current preview image
  const previewImage = activeOpt?.image || (activeVar?.images && activeVar.images[0]) || garment.images[0] || '';

  const productSource = getGarmentShop(garment);

  const isActionDisabled =
    garment.is_available_for_rent === false ||
    (garment.quantity !== undefined && garment.quantity <= 0) ||
    isSizeDisabled(selectedSize) ||
    (activeOpt && isColorDisabled(activeOpt));

  const handleSelectColorOption = (idx: number, opt: GarmentColorOption) => {
    if (isColorDisabled(opt)) return;
    setSelectedVarIndex(idx);
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
      variationIndex: idx,
      colorName: opt.name,
      size: nextSize,
    });
    onSelectVariation?.(idx, opt.name, nextSize);
  };

  const handleDateChange = (start: string, _end: string, days?: number) => {
    setStartDate(start);
    if (days && durationOptions.includes(days)) {
      setDurationDays(days);
    }
  };

  if (!isOpen) return null;

  const handleConfirmAddToCart = () => {
    if (isActionDisabled) return;
    const chosenColor = activeOpt ? activeOpt.name : (garment.colors[0]?.name || 'Standard');

    setGarmentSelection(garment.id, {
      variationIndex: selectedVarIndex,
      colorName: chosenColor,
      size: selectedSize,
    });

    addToCart({
      garmentId: garment.id,
      garment,
      selectedSize,
      selectedColor: chosenColor,
      startDate,
      endDate,
      durationDays,
      rentalPrice,
      securityDeposit,
    });

    onSelectVariation?.(selectedVarIndex, chosenColor, selectedSize);
    onClose();
  };

  const handleInstantReserve = () => {
    if (isActionDisabled) return;
    const chosenColor = activeOpt ? activeOpt.name : (garment.colors[0]?.name || 'Standard');

    setGarmentSelection(garment.id, {
      variationIndex: selectedVarIndex,
      colorName: chosenColor,
      size: selectedSize,
    });

    addToCart({
      garmentId: garment.id,
      garment,
      selectedSize,
      selectedColor: chosenColor,
      startDate,
      endDate,
      durationDays,
      rentalPrice,
      securityDeposit,
    });

    onSelectVariation?.(selectedVarIndex, chosenColor, selectedSize);
    onClose();
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        id="modal-variation-select"
        className="bg-[#FFFFFF] border border-[#E8E4DF] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header: Patterned after Product Detail Page */}
        <div className="p-4 sm:p-5 border-b border-[#E8E4DF] bg-[#FAF9F6]/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#80232F] block">
              {productSource}
            </span>
            <div className="mt-0.5">
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#141312]">
                Rental Options
              </h3>
            </div>
          </div>
          <button
            id="btn-close-variation-modal"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5C5854] hover:text-[#141312] hover:bg-[#E8E4DF]/50 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Garment Preview Bar */}
          <div className="flex gap-3 bg-[#FAF9F6] p-3 rounded-xl border border-[#E8E4DF] items-center">
            <div className="w-14 h-18 rounded-lg overflow-hidden shrink-0 bg-[#E8E4DF]">
              <GarmentImage
                src={previewImage}
                alt={garment.name}
                compact
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-serif text-sm font-semibold text-[#141312] truncate">
                  {garment.name}
                </h4>
                {garment.is_available_for_rent === false ? (
                  <span className="text-[9px] bg-[#FEF3C7] text-[#78350F] border border-[#FDE68A] px-1.5 py-0.5 rounded font-medium shrink-0">
                    Rental Paused
                  </span>
                ) : garment.quantity !== undefined && garment.quantity <= 0 ? (
                  <span className="text-[9px] bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] px-1.5 py-0.5 rounded font-medium shrink-0">
                    Out of Stock
                  </span>
                ) : (
                  <span className="text-[9px] bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] px-1.5 py-0.5 rounded font-medium shrink-0">
                    Vault Ready
                  </span>
                )}
              </div>
              <p className="text-[#5C5854] text-[11px] truncate mt-0.5">
                {garment.designer ? `${garment.designer} · ` : ''}{garment.productType || garment.category}
              </p>
              <div className="flex items-baseline gap-1.5 mt-1 font-semibold text-[#141312]">
                <span className="font-serif text-sm">{formatPHP(rentalPrice)}</span>
                <span className="text-[10px] text-[#948E88] font-normal">
                  for {durationDays} days · {formatPHP(securityDeposit)} refundable
                </span>
              </div>
            </div>
          </div>

          {/* Colorway */}
          {colorOptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-xs text-[#141312] block tracking-wide">
                  Colorway: <span className="font-serif text-[#80232F]">{activeOpt?.name}</span>
                </label>
                {colorOptions.length > 1 && (
                  <span className="text-[10px] text-[#948E88]">
                    {colorOptions.length} Colorways
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {colorOptions.map((opt, idx) => {
                  const isSelected = selectedVarIndex === idx;
                  const isOptDisabled = isColorDisabled(opt);
                  const thumb = opt.image || garment.images[0];
                  return (
                    <button
                      key={opt.name || idx}
                      type="button"
                      id={`btn-modal-color-${opt.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      disabled={isOptDisabled}
                      onClick={() => !isOptDisabled && handleSelectColorOption(idx, opt)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                        isOptDisabled
                          ? 'opacity-35 border-[#E8E4DF] bg-[#FAF9F6] text-[#948E88] cursor-not-allowed line-through'
                          : isSelected
                          ? 'border-[#141312] bg-[#FAF9F6] ring-1 ring-[#141312] cursor-pointer'
                          : 'border-[#E8E4DF] hover:border-[#141312]/40 bg-white cursor-pointer'
                      }`}
                    >
                      {thumb ? (
                        <div className="w-7 h-9 rounded overflow-hidden shrink-0 bg-[#E8E4DF]">
                          <img
                            src={thumb}
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
                    type="button"
                    id={`btn-modal-size-${size.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    disabled={!isAvailable}
                    onClick={() => isAvailable && setSelectedSize(size)}
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
                  days,
                  rentalPricingConfig
                );
                return (
                  <button
                    key={days}
                    type="button"
                    id={`btn-modal-duration-${days}d`}
                    onClick={() => setDurationDays(days)}
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
                  onChange={(e) => setStartDate(e.target.value)}
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
                  rentalPricingConfig={rentalPricingConfig}
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
              id="btn-confirm-variation-add-cart"
              type="button"
              disabled={isActionDisabled}
              onClick={handleConfirmAddToCart}
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
              id="btn-modal-rent-now"
              type="button"
              disabled={isActionDisabled}
              onClick={handleInstantReserve}
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
  );
};
