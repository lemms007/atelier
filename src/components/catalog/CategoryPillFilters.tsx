import React, { useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GarmentCategory } from '../../types';
import { Heart, Store } from 'lucide-react';
import { getAvailableShops } from '../../utils/formatters';
import { HorizontalScrollStrip } from '../common/HorizontalScrollStrip';

const DRESS_CATEGORIES: string[] = [
  'All',
  'Wishlist',
  'Corset Gowns',
  'Long Gowns',
  'Midi Dresses',
  'Infinity & Multiway',
  'Bridal Gowns',
  'Formal Evening',
];

export const CategoryPillFilters: React.FC = () => {
  const {
    selectedCategory,
    setSelectedCategory,
    selectedShop,
    setSelectedShop,
    garments,
    wishlist,
  } = useApp();

  const activeCategoryRef = useRef<HTMLButtonElement | null>(null);
  const activeShopRef = useRef<HTMLButtonElement | null>(null);

  const availableShops = useMemo(() => getAvailableShops(garments), [garments]);

  // Dynamically include authentic dress categories from inventory, ignoring 'Sale'
  const categories = useMemo(() => {
    const list = [...DRESS_CATEGORIES];
    garments.forEach((g) => {
      if (
        g.category &&
        !list.includes(g.category) &&
        !g.category.toLowerCase().includes('sale')
      ) {
        list.push(g.category);
      }
    });
    return list;
  }, [garments]);

  // Auto-scroll active item into view on desktop / mobile
  useEffect(() => {
    if (activeCategoryRef.current) {
      activeCategoryRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (activeShopRef.current) {
      activeShopRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedShop]);

  return (
    <div id="catalog-category-filters" className="space-y-2 py-2 border-b border-[#E8E4DF]/60 pb-3">
      {/* Boutique Houses Filter Strip with Desktop Scroll Arrows & Dragging */}
      <HorizontalScrollStrip id="filter-strip-boutiques" className="w-full">
        <div className="flex items-center gap-1.5 min-w-max py-0.5">
          <span className="text-[10.5px] font-medium uppercase tracking-wider text-[#948E88] flex items-center gap-1 mr-1 shrink-0">
            <Store className="w-3.5 h-3.5 text-[#948E88]" />
            Boutique:
          </span>
          <button
            type="button"
            ref={selectedShop === 'All' ? activeShopRef : null}
            id="pill-shop-all"
            onClick={() => setSelectedShop('All')}
            className={`h-7.5 px-3.5 rounded-full text-xs transition-all whitespace-nowrap border cursor-pointer select-none shrink-0 ${
              selectedShop === 'All'
                ? 'bg-[#141312] text-white border-[#141312] font-semibold shadow-xs'
                : 'bg-[#FFFFFF] text-[#5C5854] border-[#E8E4DF] hover:border-[#141312] hover:text-[#141312]'
            }`}
          >
            All Boutiques
          </button>
          {availableShops.map((shop) => {
            const isActive = selectedShop === shop;
            return (
              <button
                key={shop}
                ref={isActive ? activeShopRef : null}
                type="button"
                id={`pill-shop-${shop.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedShop(shop)}
                className={`h-7.5 px-3.5 rounded-full text-xs transition-all whitespace-nowrap border cursor-pointer select-none shrink-0 ${
                  isActive
                    ? 'bg-[#141312] text-white border-[#141312] font-semibold shadow-xs'
                    : 'bg-[#FFFFFF] text-[#5C5854] border-[#E8E4DF] hover:border-[#141312] hover:text-[#141312]'
                }`}
              >
                {shop}
              </button>
            );
          })}
        </div>
      </HorizontalScrollStrip>

      {/* Dress Style & Category Pills with Desktop Scroll Arrows & Dragging */}
      <HorizontalScrollStrip id="filter-strip-categories" className="w-full">
        <div className="flex items-center gap-1.5 min-w-max py-0.5">
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            const isWishlist = category === 'Wishlist';

            return (
              <button
                key={category}
                ref={isActive ? activeCategoryRef : null}
                id={`pill-category-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedCategory(category as GarmentCategory)}
                className={`h-8 px-3.5 rounded-full text-xs tracking-tight transition-all whitespace-nowrap flex items-center justify-center gap-1.5 border cursor-pointer select-none shrink-0 ${
                  isActive
                    ? 'bg-[#80232F] text-white border-[#80232F] font-semibold shadow-xs'
                    : 'bg-[#FAF9F6] text-[#5C5854] border-[#E8E4DF] hover:border-[#141312] hover:text-[#141312] hover:bg-white'
                }`}
              >
                {isWishlist && (
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      isActive
                        ? 'fill-white text-white'
                        : wishlist.length > 0
                        ? 'fill-[#80232F] text-[#80232F]'
                        : 'text-current'
                    }`}
                  />
                )}
                <span>
                  {isWishlist ? `Wishlist (${wishlist.length})` : category}
                </span>
              </button>
            );
          })}
        </div>
      </HorizontalScrollStrip>
    </div>
  );
};
