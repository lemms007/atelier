import React from 'react';
import { useApp } from '../../context/AppContext';
import { Compass, ShoppingBag, Clock, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const {
    viewMode,
    activeTab,
    setActiveTab,
    cartCount,
    orders,
    isCheckoutOpen,
    setSelectedGarment,
  } = useApp();

  if (isCheckoutOpen || viewMode === 'admin') {
    return null; // Hidden during checkout or in admin mode
  }

  // Count active/pending orders
  const activeOrdersCount = orders.filter(
    (o) => !['Completed / Deposit Refunded', 'Payment Rejected'].includes(o.status)
  ).length;

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E8E4DF] shadow-[0_-2px_10px_rgba(20,19,18,0.02)]"
    >
      <div className="max-w-md mx-auto h-16 px-6 flex items-center justify-between">
        {/* 1. Explore */}
        <button
          id="nav-tab-explore"
          onClick={() => {
            setSelectedGarment(null);
            setActiveTab('explore');
          }}
          className={`flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 transition-colors relative ${
            activeTab === 'explore'
              ? 'text-[#141312]'
              : 'text-[#948E88] hover:text-[#5C5854]'
          }`}
        >
          <Compass className="w-5 h-5 stroke-[1.6]" />
          <span className="text-[10px] tracking-wide font-medium mt-1">Explore</span>
          {activeTab === 'explore' && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#141312]" />
          )}
        </button>

        {/* 2. Cart / Bag */}
        <button
          id="nav-tab-cart"
          onClick={() => {
            setSelectedGarment(null);
            setActiveTab('cart');
          }}
          className={`flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 relative transition-colors ${
            activeTab === 'cart'
              ? 'text-[#141312]'
              : 'text-[#948E88] hover:text-[#5C5854]'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 stroke-[1.6]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 bg-[#80232F] text-white text-[9px] font-semibold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-wide font-medium mt-1">Bag</span>
          {activeTab === 'cart' && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#141312]" />
          )}
        </button>

        {/* 3. My Rentals */}
        <button
          id="nav-tab-rentals"
          onClick={() => {
            setSelectedGarment(null);
            setActiveTab('my-rentals');
          }}
          className={`flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 relative transition-colors ${
            activeTab === 'my-rentals'
              ? 'text-[#141312]'
              : 'text-[#948E88] hover:text-[#5C5854]'
          }`}
        >
          <div className="relative">
            <Clock className="w-5 h-5 stroke-[1.6]" />
            {activeOrdersCount > 0 && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-[#80232F] rounded-full ring-2 ring-white" />
            )}
          </div>
          <span className="text-[10px] tracking-wide font-medium mt-1">Rentals</span>
          {activeTab === 'my-rentals' && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#141312]" />
          )}
        </button>

        {/* 4. Profile */}
        <button
          id="nav-tab-profile"
          onClick={() => {
            setSelectedGarment(null);
            setActiveTab('profile');
          }}
          className={`flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 relative transition-colors ${
            activeTab === 'profile'
              ? 'text-[#141312]'
              : 'text-[#948E88] hover:text-[#5C5854]'
          }`}
        >
          <User className="w-5 h-5 stroke-[1.6]" />
          <span className="text-[10px] tracking-wide font-medium mt-1">Profile</span>
          {activeTab === 'profile' && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#141312]" />
          )}
        </button>
      </div>
    </nav>
  );
};
