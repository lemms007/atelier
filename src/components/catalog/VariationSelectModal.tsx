import React, { useState } from 'react';
import { Garment, GarmentSize, GarmentVariation } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  formatPHP,
  addDaysToDate,
  calculateRentalPrice,
  formatDisplayDateShort,
} from '../../utils/formatters';
import { X, Check, ShoppingBag, Sparkles, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { GarmentImage } from '../common/GarmentImage';

interface VariationSelectModalProps {
  garment: Garment;
  isOpen: boolean;
  onClose: () => void;
}

export const VariationSelectModal: React.FC<VariationSelectModalProps> = ({
  garment,
  isOpen,
  onClose,
}) => {
  const { addToCart, configuredDurations } = useApp();

  const hasVariations = Array.isArray(garment.variations) && garment.variations.length > 0;
  const [selectedVarIndex, setSelectedVarIndex] = useState<number>(0);

  const activeVar: GarmentVariation | null = hasVariations
    ? garment.variations![selectedVarIndex] || garment.variations![0]
    : null;

  // Available sizes
  const availableSizes: GarmentSize[] = (activeVar?.sizes && activeVar.sizes.length > 0)
    ? activeVar.sizes
    : (garment.sizes.length > 0 ? garment.sizes : ['S', 'M', 'L']);

  const [selectedSize, setSelectedSize] = useState<GarmentSize>(availableSizes[0] || 'S');

  // Dates & Durations
  const durationOptions = configuredDurations && configuredDurations.length > 0
    ? configuredDurations
    : [4, 8, 12, 14];

  const [durationDays, setDurationDays] = useState<number>(durationOptions[0] || 4);

  const today = new Date();
  const defaultStartDate = addDaysToDate(today.toISOString().split('T')[0], 1);
  const [startDate, setStartDate] = useState<string>(defaultStartDate);

  const endDate = addDaysToDate(startDate, durationDays - 1);

  // Price calculations
  const rentalPrice = calculateRentalPrice(
    garment.basePrice4Days,
    garment.dailyExtraRate,
    durationDays
  );

  // Current preview image
  const previewImage = (activeVar?.images && activeVar.images[0]) || garment.images[0] || '';

  const storeSource = garment.store || (garment.designer !== 'Atelier Manila' ? garment.designer : 'Love Humbly Shop');

  if (!isOpen) return null;

  const handleConfirmAddToCart = () => {
    const chosenColor = activeVar ? activeVar.name : (garment.colors[0]?.name || 'Standard');

    addToCart({
      garmentId: garment.id,
      garment,
      selectedSize,
      selectedColor: chosenColor,
      startDate,
      endDate,
      durationDays,
      rentalPrice,
      securityDeposit: garment.securityDeposit,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        id="modal-variation-select"
        className="bg-[#FFFFFF] border border-[#E8E4DF] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E4DF] flex items-center justify-between bg-[#FAF9F6]">
          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#80232F] block">
              {storeSource}
            </span>
            <h3 className="font-serif text-lg font-bold text-[#141312]">
              Select Rental Options
            </h3>
          </div>
          <button
            id="btn-close-variation-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5C5854] hover:text-[#141312] hover:bg-[#E8E4DF]/50 transition-colors"
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
              <h4 className="font-serif text-sm font-semibold text-[#141312] truncate">
                {garment.name}
              </h4>
              <p className="text-[#5C5854] text-[11px] truncate mt-0.5">
                {garment.productType || garment.category}
              </p>
              <div className="flex items-baseline gap-1.5 mt-1 font-semibold text-[#141312]">
                <span className="font-serif text-sm">{formatPHP(rentalPrice)}</span>
                <span className="text-[10px] text-[#948E88] font-normal">
                  for {durationDays} days (+{formatPHP(garment.securityDeposit)} deposit)
                </span>
              </div>
            </div>
          </div>

          {/* 1. Color / Style Variation */}
          {hasVariations && garment.variations!.length > 1 && (
            <div className="space-y-2">
              <label className="font-semibold text-[#141312] block tracking-wide">
                1. Select Colorway: <span className="font-serif text-[#80232F]">{activeVar?.name}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {garment.variations!.map((variation, idx) => {
                  const isSelected = selectedVarIndex === idx;
                  const thumb = (variation.images && variation.images[0]) || garment.images[0];
                  return (
                    <button
                      key={variation.id || idx}
                      type="button"
                      onClick={() => {
                        setSelectedVarIndex(idx);
                        if (variation.sizes && variation.sizes.length > 0 && !variation.sizes.includes(selectedSize)) {
                          setSelectedSize(variation.sizes[0]);
                        }
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-[#141312] bg-[#FAF9F6] ring-1 ring-[#141312]'
                          : 'border-[#E8E4DF] hover:border-[#141312]/40 bg-white'
                      }`}
                    >
                      {thumb ? (
                        <div className="w-7 h-9 rounded overflow-hidden shrink-0 bg-[#E8E4DF]">
                          <img
                            src={thumb}
                            alt={variation.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <span
                          className="w-4 h-4 rounded-full border shrink-0"
                          style={{ backgroundColor: variation.hex || '#ccc' }}
                        />
                      )}
                      <span className="text-[11px] font-medium text-[#141312] truncate flex-1">
                        {variation.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#141312] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Size Selection */}
          <div className="space-y-2">
            <label className="font-semibold text-[#141312] block tracking-wide">
              2. Select Size: <span className="text-[#80232F]">{selectedSize}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`h-9 px-4 rounded-lg font-medium text-xs transition-all border ${
                      isSelected
                        ? 'bg-[#141312] text-white border-[#141312]'
                        : 'bg-white text-[#141312] border-[#E8E4DF] hover:border-[#141312]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Duration Selection (Configurable rates: 4, 8, 12, 14 days) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#141312] block tracking-wide">
                3. Rental Duration: <span className="text-[#80232F]">{durationDays} Days</span>
              </label>
              <span className="text-[10px] text-[#948E88]">
                +{formatPHP(garment.dailyExtraRate)}/extra day
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {durationOptions.map((days) => {
                const isSelected = durationDays === days;
                const priceForDays = calculateRentalPrice(
                  garment.basePrice4Days,
                  garment.dailyExtraRate,
                  days
                );
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDurationDays(days)}
                    className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-[#141312] text-white border-[#141312]'
                        : 'bg-white text-[#141312] border-[#E8E4DF] hover:border-[#141312]'
                    }`}
                  >
                    <span className="font-semibold text-xs">{days} Days</span>
                    <span
                      className={`text-[10px] ${
                        isSelected ? 'text-white/80' : 'text-[#5C5854]'
                      }`}
                    >
                      {formatPHP(priceForDays)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Rental Period Start Date */}
          <div className="space-y-2">
            <label className="font-semibold text-[#141312] block tracking-wide">
              4. Rental Dates
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E8E4DF]">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#948E88] block">
                  Delivery / Start
                </span>
                <input
                  type="date"
                  value={startDate}
                  min={defaultStartDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-[#E8E4DF] rounded px-2 py-1 text-xs text-[#141312] mt-0.5 font-medium"
                />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#948E88] block">
                  Return by ({durationDays} Days)
                </span>
                <div className="w-full bg-[#EFECE6] border border-[#E8E4DF] rounded px-2 py-1 text-xs text-[#141312] mt-0.5 font-medium flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3 text-[#5C5854]" />
                  <span>{formatDisplayDateShort(endDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E8E4DF] bg-[#FAF9F6] flex items-center justify-between gap-3">
          <div>
            <span className="text-[9px] uppercase text-[#948E88] tracking-wider block">
              Total to Pay
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-lg font-bold text-[#141312]">
                {formatPHP(rentalPrice)}
              </span>
              <span className="text-[10px] text-[#5C5854]">
                (+{formatPHP(garment.securityDeposit)} dep)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-xs font-medium text-[#5C5854] hover:text-[#141312] transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-variation-add-cart"
              type="button"
              onClick={handleConfirmAddToCart}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#141312] hover:bg-[#2A2725] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add to Bag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
