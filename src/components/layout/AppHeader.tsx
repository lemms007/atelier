import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, ShoppingBag, ShieldCheck, X, Heart, User, Sparkles } from 'lucide-react';

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
  } = useApp();

  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Count orders under verification
  const pendingVerificationCount = orders.filter(
    (o) => o.status === 'Under Verification'
  ).length;

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E8E4DF] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-3">
        {/* Minimalist Boutique Brand Identity */}
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

        {/* Minimalist Search Input */}
        {isSearchOpen ? (
          <div className="flex-1 max-w-sm flex items-center relative animate-fadeIn mx-2">
            <input
              id="input-header-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search designer, gown, style..."
              className="w-full bg-[#FFFFFF] border border-[#E8E4DF] text-[#141312] placeholder-[#948E88] text-xs rounded-full pl-9 pr-8 py-2 focus:outline-none focus:border-[#141312] transition-colors"
              autoFocus
            />
            <Search className="w-3.5 h-3.5 text-[#948E88] absolute left-3" />
            <button
              id="btn-close-search"
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-3 text-[#948E88] hover:text-[#141312] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {!isSearchOpen && (
            <button
              id="btn-open-search"
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#5C5854] hover:text-[#141312] hover:bg-[#F5F3EF] transition-colors cursor-pointer"
              title="Search Catalog"
            >
              <Search className="w-4 h-4 stroke-[1.75]" />
            </button>
          )}

          {/* Wishlist Button */}
          <button
            id="btn-header-wishlist"
            onClick={() => {
              setSelectedGarment(null);
              setSelectedCategory('Wishlist');
              setActiveTab('explore');
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-colors cursor-pointer ${
              selectedCategory === 'Wishlist'
                ? 'bg-[#141312] text-white'
                : 'text-[#141312] hover:bg-[#F5F3EF]'
            }`}
            title="Your Wish List"
          >
            <Heart className={`w-4 h-4 stroke-[1.75] ${wishlist.length > 0 && selectedCategory !== 'Wishlist' ? 'fill-[#80232F] text-[#80232F]' : ''}`} />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-[#80232F] text-[#FAF9F6] text-[9px] font-semibold rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Google Account / Profile Button */}
          {currentUser ? (
            <button
              id="btn-header-user-profile"
              onClick={() => {
                setSelectedGarment(null);
                setActiveTab('profile');
              }}
              className={`h-9 px-2 sm:px-2.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer border ${
                activeTab === 'profile'
                  ? 'bg-[#141312] text-white border-[#141312]'
                  : 'bg-[#FFFFFF] border-[#E8E4DF] text-[#141312] hover:bg-[#F5F3EF]'
              }`}
              title="Your Account & Reusable Details"
            >
              {userProfile?.photoURL || currentUser.photoURL ? (
                <img
                  src={userProfile?.photoURL || currentUser.photoURL || ''}
                  alt="Profile"
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#141312] text-white text-[9px] flex items-center justify-center font-medium shrink-0">
                  {(userProfile?.displayName || currentUser.displayName || 'U').charAt(0)}
                </div>
              )}
              <span className="text-xs font-medium max-w-[90px] truncate hidden md:inline">
                {userProfile?.displayName?.split(' ')[0] || currentUser.displayName?.split(' ')[0] || 'Account'}
              </span>
            </button>
          ) : (
            <button
              id="btn-header-google-signin"
              onClick={() => setIsGoogleLoginModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors bg-[#FFFFFF] text-[#141312] border border-[#E8E4DF] hover:border-[#141312] cursor-pointer"
              title="Sign in with Google (Optional)"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#80232F]" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Admin Portal Switcher Button */}
          <button
            id="btn-header-admin-desk"
            onClick={() => {
              setSelectedGarment(null);
              switchToAdmin();
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors bg-[#FFFFFF] text-[#5C5854] border border-[#E8E4DF] hover:border-[#141312] hover:text-[#141312] cursor-pointer"
            title="Switch to Admin Verification Console"
          >
            <ShieldCheck className="w-3.5 h-3.5 stroke-[1.75]" />
            <span className="hidden sm:inline">Admin Portal</span>
            {pendingVerificationCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#141312] text-white text-[9px] flex items-center justify-center font-bold">
                {pendingVerificationCount}
              </span>
            )}
          </button>

          {/* Shopping Bag Button with Live Minimalist Badge */}
          <button
            id="btn-header-cart"
            onClick={() => {
              setSelectedGarment(null);
              setActiveTab('cart');
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-colors cursor-pointer ${
              activeTab === 'cart'
                ? 'bg-[#141312] text-white'
                : 'text-[#141312] hover:bg-[#F5F3EF]'
            }`}
            title="Rental Bag"
          >
            <ShoppingBag className="w-4 h-4 stroke-[1.75]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-[#80232F] text-[#FAF9F6] text-[9px] font-semibold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

