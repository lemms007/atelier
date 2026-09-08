import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { GarmentCategory } from '../../types';
import { Heart, Store } from 'lucide-react';
import { getAvailableShops } from '../../utils/formatters';

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

  return (
    <div className="space-y-2 py-1.5 border-b border-[#E8E4DF]/60 pb-2.5">
      {/* Boutique Houses Filter Strip */}
      <div className="w-full overflow-x-auto no-scrollbar px-4 sm:px-6">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[10.5px] font-medium uppercase tracking-wider text-[#948E88] flex items-center gap-1 mr-1">
            <Store className="w-3 h-3 text-[#948E88]" />
            Boutique:
          </span>
          <button
            type="button"
            id="pill-shop-all"
            onClick={() => setSelectedShop('All')}
            className={`h-7 px-3 rounded-full text-xs transition-all whitespace-nowrap border cursor-pointer ${
              selectedShop === 'All'
                ? 'bg-[#141312] text-white border-[#141312] font-medium shadow-2xs'
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
                type="button"
                id={`pill-shop-${shop.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedShop(shop)}
                className={`h-7 px-3 rounded-full text-xs transition-all whitespace-nowrap border cursor-pointer ${
                  isActive
                    ? 'bg-[#141312] text-white border-[#141312] font-medium shadow-2xs'
                    : 'bg-[#FFFFFF] text-[#5C5854] border-[#E8E4DF] hover:border-[#141312] hover:text-[#141312]'
                }`}
              >
                {shop}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dress Style & Category Pills */}
      <div className="w-full overflow-x-auto no-scrollbar px-4 sm:px-6">
        <div className="flex items-center gap-1.5 min-w-max">
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            const isWishlist = category === 'Wishlist';

            return (
              <button
                key={category}
                id={`pill-category-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedCategory(category as GarmentCategory)}
                className={`h-7.5 px-3 rounded-full text-xs tracking-tight transition-all whitespace-nowrap flex items-center justify-center gap-1.5 border cursor-pointer ${
                  isActive
                    ? 'bg-[#80232F] text-white border-[#80232F] font-medium shadow-2xs'
                    : 'bg-[#FAF9F6] text-[#5C5854] border-[#E8E4DF] hover:border-[#141312] hover:text-[#141312]'
                }`}
              >
                {isWishlist && (
                  <Heart
                    className={`w-3 h-3 ${
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
      </div>
    </div>
  );
};
