import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryPillFilters } from './CategoryPillFilters';
import { GarmentCard } from './GarmentCard';
import { Package, Heart } from 'lucide-react';
import { getGarmentShop, getAvailableShops } from '../../utils/formatters';

export const CatalogView: React.FC = () => {
  const {
    garments,
    selectedCategory,
    setSelectedCategory,
    selectedShop,
    setSelectedShop,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    wishlist,
  } = useApp();

  const availableShops = useMemo(() => getAvailableShops(garments), [garments]);

  // Filter garments based on category, shop, wishlist, and search
  const filteredGarments = garments
    .filter((g) => {
      // Exclude any sale items defensively
      if (
        g.isSale ||
        g.category?.toLowerCase().includes('sale') ||
        g.name?.toLowerCase().includes('sale')
      ) {
        return false;
      }

      // Wishlist filtering
      if (selectedCategory === 'Wishlist') {
        if (!wishlist.includes(g.id)) return false;
      } else if (selectedCategory !== 'All') {
        if (g.category !== selectedCategory) return false;
      }

      // Shop filtering
      if (selectedShop !== 'All') {
        const shop = getGarmentShop(g);
        if (shop.toLowerCase() !== selectedShop.toLowerCase()) {
          return false;
        }
      }

      // Search filtering
      const shopName = getGarmentShop(g);
      const matchSearch =
        !searchQuery ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.store && g.store.toLowerCase().includes(searchQuery.toLowerCase())) ||
        g.designer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.productType && g.productType.toLowerCase().includes(searchQuery.toLowerCase())) ||
        g.fabric.toLowerCase().includes(searchQuery.toLowerCase());

      return matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.basePrice4Days - b.basePrice4Days;
      if (sortBy === 'price-desc') return b.basePrice4Days - a.basePrice4Days;
      // Default: 'newest' (Newest to Oldest)
      const dateA = a.updatedAt || 0;
      const dateB = b.updatedAt || 0;
      if (dateB !== dateA) return dateB - dateA;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

  return (
    <div className="pb-28 pt-2">
      {/* Category & Shop Pills Filter */}
      <div>
        <CategoryPillFilters />
      </div>

      {/* Secondary Bar: Active Filters / Item Count & Sorting */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-[#5C5854] flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-[#141312]">
            {filteredGarments.length} {filteredGarments.length === 1 ? 'Piece' : 'Pieces'}
          </span>
          {selectedCategory === 'Wishlist' && (
            <span className="bg-[#FAF0F1] border border-[#F2D6D8] px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 text-[#80232F] font-medium">
              <Heart className="w-3 h-3 fill-current" />
              Wish List
            </span>
          )}
          {selectedShop !== 'All' && (
            <span className="bg-[#F5F3EF] border border-[#E8E4DF] px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 text-[#141312]">
              <span>Shop: {selectedShop}</span>
              <button
                onClick={() => setSelectedShop('All')}
                className="hover:text-[#80232F] ml-0.5 cursor-pointer"
                aria-label="Clear shop filter"
              >
                ×
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="bg-[#F5F3EF] border border-[#E8E4DF] px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 text-[#141312]">
              "{searchQuery}"
              <button
                onClick={() => setSearchQuery('')}
                className="hover:text-[#80232F] ml-0.5 cursor-pointer"
                aria-label="Clear search query"
              >
                ×
              </button>
            </span>
          )}
        </div>

        {/* Filter & Sort Selectors (filter icon removed) */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          {/* Shop Filter Selector */}
          <select
            id="select-filter-shop"
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="bg-[#FFFFFF] border border-[#E8E4DF] rounded-md px-2.5 py-1 text-xs text-[#141312] focus:outline-none focus:border-[#141312] transition-colors cursor-pointer"
            aria-label="Filter by Shop"
          >
            <option value="All">All Shops</option>
            {availableShops.map((shop) => (
              <option key={shop} value={shop}>
                {shop}
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            id="select-sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#FFFFFF] border border-[#E8E4DF] rounded-md px-2.5 py-1 text-xs text-[#141312] focus:outline-none focus:border-[#141312] transition-colors cursor-pointer"
            aria-label="Sort by"
          >
            <option value="newest">Newest to Oldest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Garments Grid */}
      <div className="px-4 sm:px-6 mt-1">
        {filteredGarments.length === 0 ? (
          <div className="py-16 text-center bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-6 max-w-md mx-auto">
            {selectedCategory === 'Wishlist' ? (
              <>
                <Heart className="w-8 h-8 text-[#948E88] mx-auto mb-2.5 stroke-[1.5]" />
                <h3 className="font-serif text-base font-semibold text-[#141312]">
                  Your Wish List is Empty
                </h3>
                <p className="text-xs text-[#5C5854] mt-1 max-w-xs mx-auto">
                  Click the heart on any dress you love to save it to your Wish List.
                </p>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="mt-4 px-4 py-2 bg-[#141312] text-white text-xs font-medium rounded-md hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Explore All Dresses
                </button>
              </>
            ) : (
              <>
                <Package className="w-8 h-8 text-[#948E88] mx-auto mb-2.5 stroke-[1.5]" />
                <h3 className="font-serif text-base font-semibold text-[#141312]">
                  No garments found
                </h3>
                <p className="text-xs text-[#5C5854] mt-1 max-w-xs mx-auto">
                  We couldn't find any designer pieces matching your current filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedShop('All');
                  }}
                  className="mt-4 px-4 py-2 bg-[#141312] text-white text-xs font-medium rounded-md hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Reset Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {filteredGarments.map((garment) => (
              <GarmentCard key={garment.id} garment={garment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

