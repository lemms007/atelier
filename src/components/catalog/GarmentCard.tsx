import React, { useState } from 'react';
import { Garment } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatPHP, getGarmentShop } from '../../utils/formatters';
import { Heart, ShoppingBag } from 'lucide-react';
import { GarmentImage } from '../common/GarmentImage';
import { preloadGarmentVariationImages } from '../../utils/imageCache';
import { VariationSelectModal } from './VariationSelectModal';

interface GarmentCardProps {
  garment: Garment;
}

export const GarmentCard: React.FC<GarmentCardProps> = ({ garment }) => {
  const { setSelectedGarment, wishlist, toggleWishlist } = useApp();
  const isWishlisted = wishlist.includes(garment.id);
  const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedVarIndex, setSelectedVarIndex] = useState<number>(0);

  // Determine authentic product source (Love Humbly Shop or Corset Bloomfields)
  const productSource = getGarmentShop(garment);

  const hasVariations = Array.isArray(garment.variations) && garment.variations.length > 0;
  const activeVar = hasVariations ? garment.variations![selectedVarIndex] || garment.variations![0] : null;

  const imagesList = (activeVar && activeVar.images && activeVar.images.length > 0)
    ? activeVar.images
    : (Array.isArray(garment.images) ? garment.images : []);

  const currentImageSrc = imagesList[activeImgIndex] || imagesList[0] || '';

  const handleImageError = () => {
    // If current image fails, automatically try the next image in the array
    if (activeImgIndex < imagesList.length - 1) {
      setActiveImgIndex((prev) => prev + 1);
    }
  };

  const handleSelectVariation = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setSelectedVarIndex(index);
    setActiveImgIndex(0);
  };

  const handleOpenVariationModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVariationModalOpen(true);
  };

  return (
    <>
      <div
        id={`garment-card-${garment.id}`}
        onClick={() => setSelectedGarment(garment)}
        onMouseEnter={() => preloadGarmentVariationImages(garment)}
        className="group bg-[#FFFFFF] rounded-lg border border-[#E8E4DF] overflow-hidden hover:border-[#141312]/40 transition-all duration-300 flex flex-col cursor-pointer"
      >
        {/* 3:4 Aspect Ratio Image Showcase */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F5F3EF]">
          <GarmentImage
            src={currentImageSrc}
            alt={garment.name}
            garmentName={garment.name}
            designerName={productSource}
            categoryName={garment.category}
            onImageError={handleImageError}
            className="group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          />

          {/* Rental Status / Stock Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {garment.is_available_for_rent === false ? (
              <span className="bg-[#78350F]/90 backdrop-blur-sm text-white text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full shadow-xs">
                Rental Paused
              </span>
            ) : garment.quantity !== undefined && garment.quantity <= 0 ? (
              <span className="bg-[#991B1B]/90 backdrop-blur-sm text-white text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full shadow-xs">
                Out of Stock
              </span>
            ) : null}

            {hasVariations && garment.variations!.length > 1 && (
              <span className="bg-black/75 backdrop-blur-sm text-white text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full">
                {garment.variations!.length} Colors
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            id={`btn-wishlist-${garment.id}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(garment.id);
            }}
            aria-label="Save to Wishlist"
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#141312] hover:scale-105 active:scale-95 transition-transform border border-[#E8E4DF]"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isWishlisted ? 'fill-[#80232F] text-[#80232F]' : 'text-[#5C5854]'
              }`}
            />
          </button>
        </div>

        {/* Card Content & Minimalist Pricing */}
        <div className="p-3 flex flex-col justify-between flex-1 gap-2">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#948E88] truncate">
                {productSource}
              </p>
            </div>

            <h3 className="font-serif text-sm font-semibold text-[#141312] line-clamp-1 mt-0.5">
              {garment.name}
            </h3>

            {/* Color Variation Swatches Preview */}
            {garment.colors.length > 1 && (
              <div className="flex items-center gap-1.5 mt-1.5" onClick={(e) => e.stopPropagation()}>
                {garment.colors.slice(0, 5).map((color, cIdx) => {
                  const isSelected = selectedVarIndex === cIdx;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      title={color.name}
                      onClick={(e) => handleSelectVariation(e, cIdx)}
                      className={`w-3 h-3 rounded-full border transition-transform ${
                        isSelected
                          ? 'scale-125 ring-1 ring-black border-white'
                          : 'border-black/20 hover:scale-110 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  );
                })}
                {garment.colors.length > 5 && (
                  <span className="text-[9px] text-[#948E88]">+{garment.colors.length - 5}</span>
                )}
              </div>
            )}

            <p className="text-xs font-medium text-[#141312] mt-1.5">
              {garment.price_min && garment.price_max && garment.price_min !== garment.price_max ? (
                <>
                  {formatPHP(garment.price_min)} – {formatPHP(garment.price_max)}
                </>
              ) : (
                <>
                  {formatPHP(garment.price_min || garment.basePrice4Days)}
                </>
              )}
              <span className="text-[10px] font-normal text-[#948E88]"> / 4 days</span>
            </p>
          </div>

          {/* Add to Bag Button with Variation Dialog */}
          <button
            id={`btn-card-add-cart-${garment.id}`}
            onClick={garment.is_available_for_rent === false || (garment.quantity !== undefined && garment.quantity <= 0) ? (e) => { e.stopPropagation(); setSelectedGarment(garment); } : handleOpenVariationModal}
            className={`w-full py-1.5 px-2.5 rounded text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
              garment.is_available_for_rent === false
                ? 'bg-[#FAF9F6] text-[#78350F] border-[#FDE68A] hover:bg-[#FEF3C7]'
                : garment.quantity !== undefined && garment.quantity <= 0
                ? 'bg-[#FAF9F6] text-[#991B1B] border-[#FECACA] hover:bg-[#FEE2E2]'
                : 'bg-[#FAF9F6] hover:bg-[#141312] text-[#141312] hover:text-white border-[#E8E4DF] hover:border-[#141312] active:scale-95'
            }`}
          >
            <ShoppingBag className="w-3 h-3 stroke-[1.75]" />
            <span>
              {garment.is_available_for_rent === false
                ? 'Rental Paused'
                : garment.quantity !== undefined && garment.quantity <= 0
                ? 'Out of Stock'
                : 'Add to Bag'}
            </span>
          </button>
        </div>
      </div>

      {/* Variation Selection Dialog */}
      <VariationSelectModal
        garment={garment}
        isOpen={isVariationModalOpen}
        onClose={() => setIsVariationModalOpen(false)}
      />
    </>
  );
};
