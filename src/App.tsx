import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppHeader } from './components/layout/AppHeader';
import { AdminHeader } from './components/layout/AdminHeader';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { Toast } from './components/layout/Toast';
import { CatalogView } from './components/catalog/CatalogView';
import { ProductDetailPage } from './components/pdp/ProductDetailPage';
import { CartView } from './components/cart/CartView';
import { MyRentalsView } from './components/rentals/MyRentalsView';
import { AdminOrdersPortal } from './components/admin/AdminOrdersPortal';
import { ProfileView } from './components/profile/ProfileView';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { Admin2FAModal } from './components/admin/Admin2FAModal';
import { GoogleAuthModal } from './components/auth/GoogleAuthModal';

const AppContent: React.FC = () => {
  const {
    viewMode,
    activeTab,
    selectedGarment,
    setSelectedGarment,
  } = useApp();

  // Scroll to the top whenever selectedGarment or active customer tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [selectedGarment, activeTab, viewMode]);

  // Distinct Admin / Backoffice Portal View
  if (viewMode === 'admin') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#141312] flex flex-col antialiased selection:bg-[#141312]/10 selection:text-[#141312]">
        {/* Dedicated Admin Portal Header */}
        <AdminHeader />

        {/* Admin Backoffice Console */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <AdminOrdersPortal />
        </main>

        {/* Global Toast */}
        <Toast />
      </div>
    );
  }

  // Customer / Renter Storefront View
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#141312] flex flex-col antialiased selection:bg-[#141312]/10 selection:text-[#141312]">
      {/* Customer Store Header */}
      <AppHeader />

      {/* Main Storefront Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {selectedGarment ? (
          <ProductDetailPage
            garment={selectedGarment}
            onBack={() => setSelectedGarment(null)}
          />
        ) : (
          <>
            {activeTab === 'explore' && <CatalogView />}
            {activeTab === 'cart' && <CartView />}
            {activeTab === 'my-rentals' && <MyRentalsView />}
            {activeTab === 'profile' && <ProfileView />}
          </>
        )}
      </main>

      {/* Streamlined 3-Step Checkout Modal */}
      <CheckoutModal />

      {/* Optional Google Registration & Sign In Modal */}
      <GoogleAuthModal />

      {/* Customer Mobile Navigation Bar */}
      <BottomNavigation />

      {/* Admin Two-Factor Authentication Modal */}
      <Admin2FAModal />

      {/* Notification Toast */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
