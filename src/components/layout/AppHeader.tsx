import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  ShoppingBag,
  ShieldCheck,
  X,
  Heart,
  Sparkles,
  Clock,
} from 'lucide-react';

export const AppHeader: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    cartCount,
    searchQuery,
    setSearchQuery,
    orders,
    switchToAdmin,
    wishlist,
    selectedCategory,
    setSelectedCategory,
    currentUser,
    userProfile,
    setIsGoogleLoginModalOpen,
    setSelectedGarment,
    navigateToRentals,
  } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Count orders under verification
  const pendingVerificationCount = orders.filter(
    (o) => o.status === 'Under Verification'
  ).length;

  const currentRentalsCount = orders.filter(
    (o) => !['Completed / Deposit Refunded', 'Payment Rejected'].includes(o.status)
  ).length;

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E8E4DF] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-3">
        {/* Minimalist Boutique Brand Identity + Desktop Nav Link */}
        <div className="flex items-center gap-4">
          <button
            id="btn-brand-home"
            onClick={() => {
              setSelectedGarment(null);
              setActiveTab('explore');
            }}
            className="text-left group flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2.5 focus:outline-none cursor-pointer"
          >
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#141312] group-hover:opacity-75 transition-opacity">
              SINTA
            </span>
            <span className="text-[8.5px] sm:text-[9.5px] tracking-wider font-medium text-[#78716C] uppercase">
              WARDROBE RENTAL
            </span>
          </button>

          {/* Desktop Direct Navigation Link to Collection */}
          <nav className="hidden md:flex items-center pl-4 border-l border-[#E8E4DF]" aria-label="Main Navigation">
            <button
              id="nav-desktop-explore"
              type="button"
              onClick={() => {
                setSelectedGarment(null);
                setActiveTab('explore');
              }}
              className={`h-9 px-3.5 text-xs font-medium rounded-full transition-all duration-150 cursor-pointer flex items-center border active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141312] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F6] ${
                activeTab === 'explore'
                  ? 'bg-[#141312] border-[#141312] text-white'
                  : 'bg-white border-[#E8E4DF] text-[#5C5854] hover:text-[#141312] hover:border-[#141312] hover:bg-[#F5F3EF]'
              }`}
            >
              Collection
            </button>
          </nav>
        </div>

        {/* Minimalist Search Input */}
        {isSearchOpen ? (
          <div className="flex-1 max-w-sm flex items-center relative animate-fadeIn mx-2">
            <input
              id="input-header-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search designer, gown, style..."
              className="w-full h-9 bg-white border border-[#E8E4DF] text-[#141312] placeholder-[#948E88] text-xs rounded-full pl-9 pr-8 focus:outline-none focus:border-[#141312] transition-colors"
              autoFocus
            />
            <Search className="w-3.5 h-3.5 text-[#948E88] absolute left-3 pointer-events-none stroke-[1.75]" />
            <button
              id="btn-close-search"
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-3 text-[#948E88] hover:text-[#141312] transition-colors cursor-pointer"
              aria-label="Close search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}

        {/* Action Controls - Standardized Design System Toolbar */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Group 1: Exploration & Wardrobe Tools */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* 1. Search Trigger */}
            {!isSearchOpen && (
              <button
                id="btn-open-search"
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-[#E8E4DF] bg-white text-[#5C5854] hover:text-[#141312] hover:border-[#141312] hover:bg-[#F5F3EF] active:scale-[0.97] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141312] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F6] cursor-pointer shrink-0"
                title="Search Catalog"
                aria-label="Search Catalog"
              >
                <Search className="w-4 h-4 stroke-[1.75]" />
              </button>
            )}

            {/* 2. Wishlist */}
            <button
              id="btn-header-wishlist"
              type="button"
              onClick={() => {
                setSelectedGarment(null);
                setSelectedCategory('Wishlist');
                setActiveTab('explore');
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center relative border active:scale-[0.97] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141312] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F6] cursor-pointer shrink-0 ${
                selectedCategory === 'Wishlist'
                  ? 'bg-[#141312] border-[#141312] text-white hover:bg-[#2A2725] hover:border-[#2A2725]'
                  : 'bg-white border-[#E8E4DF] text-[#5C5854] hover:text-[#141312] hover:border-[#141312] hover:bg-[#F5F3EF]'
              }`}
              title="Your Wishlist"
              aria-label={`Wishlist (${wishlist.length} saved)`}
            >
              <Heart
                className={`w-4 h-4 stroke-[1.75] ${
                  wishlist.length > 0 && selectedCategory !== 'Wishlist'
                    ? 'fill-[#80232F] text-[#80232F]'
                    : ''
                }`}
              />
              {wishlist.length > 0 && (
                <span
                  className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold tabular-nums leading-none rounded-full flex items-center justify-center ring-2 ring-[#FAF9F6] shadow-xs ${
                    selectedCategory === 'Wishlist'
                      ? 'bg-white text-[#141312]'
                      : 'bg-[#80232F] text-white'
                  }`}
                >
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* 3. Rentals */}
            <button
              id="btn-header-rentals"
              type="button"
              onClick={() => {
                setSelectedGarment(null);
                navigateToRentals('all');
              }}
              className={`h-9 px-2.5 sm:px-3 rounded-full flex items-center gap-1.5 text-xs font-medium border active:scale-[0.97] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141312] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F6] cursor-pointer shrink-0 ${
                activeTab === 'my-rentals'
                  ? 'bg-[#141312] border-[#141312] text-white hover:bg-[#2A2725] hover:border-[#2A2725]'
                  : 'bg-white border-[#E8E4DF] text-[#5C5854] hover:text-[#141312] hover:border-[#141312] hover:bg-[#F5F3EF]'
              }`}
              title="My Rentals & Bookings"
              aria-label="My Rentals & Bookings"
            >
              <Clock className="w-4 h-4 stroke-[1.75]" />
              <span className="hidden sm:inline">Rentals</span>
              {currentRentalsCount > 0 && (
                <span
                  className={`min-w-[18px] h-[18px] px-1 text-[10px] font-bold tabular-nums leading-none rounded-full flex items-center justify-center ${
                    activeTab === 'my-rentals'
                      ? 'bg-white text-[#141312]'
                      : 'bg-[#80232F] text-white'
                  }`}
                >
                  {currentRentalsCount}
                </span>
              )}
            </button>
          </div>

          {/* Subtle Group Divider */}
          <div className="h-4 w-px bg-[#E8E4DF] mx-0.5 hidden sm:block shrink-0" aria-hidden="true" />

          {/* Group 2: Primary Conversion Target */}
          {/* 4. Shopping Bag */}
          <button
            id="btn-header-cart"
            type="button"
            onClick={() => {
              setSelectedGarment(null);
              setActiveTab('cart');
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center relative border active:scale-[0.97] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141312] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F6] cursor-pointer shrink-0 ${
              activeTab === 'cart'
                ? 'bg-[#141312] border-[#141312] text-white hover:bg-[#2A2725] hover:border-[#2A2725]'
                : 'bg-white border-[#E8E4DF] text-[#5C5854] hover:text-[#141312] hover:border-[#141312] hover:bg-[#F5F3EF]'
            }`}
            title="Rental Bag"
            aria-label={`Rental Bag (${cartCount} items)`}
          >
            <ShoppingBag className="w-4 h-4 stroke-[1.75]" />
            {cartCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold tabular-nums leading-none rounded-full flex items-center justify-center ring-2 ring-[#FAF9F6] shadow-xs ${
                  activeTab === 'cart'
                    ? 'bg-white text-[#141312]'
                    : 'bg-[#80232F] text-white'
                }`}
              >
                {cartCount}
              </span>
            )}
          </button>

          {/* Subtle Group Divider */}
          <div className="h-4 w-px bg-[#E8E4DF] mx-0.5 hidden sm:block shrink-0" aria-hidden="true" />

          {/* Group 3: Account & Operations */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* 5. Google Account / Profile */}
            {currentUser ? (
              <button
                id="btn-header-user-profile"
                type="button"
                onClick={() => {
                  setSelectedGarment(null);
                  setActiveTab('profile');
                }}
                className={`h-9 px-2 sm:px-3 rounded-full flex items-center gap-1.5 text-xs font-medium border active:scale-[0.97] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141312] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F6] cursor-pointer shrink-0 ${
                  activeTab === 'profile'
                    ? 'bg-[#141312] border-[#141312] text-white hover:bg-[#2A2725] hover:border-[#2A2725]'
                    : 'bg-white border-[#E8E4DF] text-[#5C5854] hover:text-[#141312] hover:border-[#141312] hover:bg-[#F5F3EF]'
                }`}
                title="Your Account & Reusable Details"
                aria-label="Your Account"
              >
                {userProfile?.photoURL || currentUser.photoURL ? (
                  <img
                    src={userProfile?.photoURL || currentUser.photoURL || ''}
                    alt="Profile"
                    className="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-[#E8E4DF]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold shrink-0 ${
                      activeTab === 'profile'
                        ? 'bg-white text-[#141312]'
                        : 'bg-[#141312] text-white'
                    }`}
                  >
                    {(userProfile?.displayName || currentUser.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="max-w-[90px] truncate hidden md:inline">
                  {userProfile?.displayName?.split(' ')[0] || currentUser.displayName?.split(' ')[0] || 'Account'}
                </span>
              </button>
            ) : (
              <button
                id="btn-header-google-signin"
                type="button"
                onClick={() => setIsGoogleLoginModalOpen(true)}
                className="h-9 px-2.5 sm:px-3 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-150 bg-white border border-[#E8E4DF] text-[#5C5854] hover:text-[#141312] hover:border-[#141312] hover:bg-[#F5F3EF] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141312] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F6] cursor-pointer shrink-0"
                title="Sign in with Google (Optional)"
                aria-label="Sign in with Google"
              >
                <Sparkles className="w-4 h-4 text-[#80232F]" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* 6. Admin Portal Switcher */}
            <button
              id="btn-header-admin-desk"
              type="button"
              onClick={() => {
                setSelectedGarment(null);
                switchToAdmin();
              }}
              className="h-9 px-2.5 sm:px-3 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-150 bg-white border border-[#E8E4DF] text-[#5C5854] hover:text-[#141312] hover:border-[#141312] hover:bg-[#F5F3EF] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141312] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F6] cursor-pointer shrink-0"
              title="Switch to Admin Verification Console"
              aria-label="Switch to Admin Console"
            >
              <ShieldCheck className="w-4 h-4 stroke-[1.75]" />
              <span className="hidden sm:inline">Admin</span>
              {pendingVerificationCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#141312] text-white text-[10px] font-bold tabular-nums leading-none flex items-center justify-center">
                  {pendingVerificationCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

