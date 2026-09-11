import React, { useEffect, useRef } from 'react';
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
import { AdminAuthScreen } from './components/admin/AdminAuthScreen';
import { GoogleAuthModal } from './components/auth/GoogleAuthModal';
import { FaqModal } from './components/common/FaqModal';
import { FloatingFaqButton } from './components/common/FloatingFaqButton';
import { Garment, CustomerTab, ViewMode } from './types';

const AppContent: React.FC = () => {
  const {
    viewMode,
    isAdminAuthenticated,
    activeTab,
    selectedGarment,
    setSelectedGarment,
    restoreCollectionScroll,
  } = useApp();

  const prevGarmentRef = useRef<Garment | null>(null);
  const prevTabRef = useRef<CustomerTab | 'admin'>(activeTab);
  const prevViewModeRef = useRef<ViewMode>(viewMode);

  // Prevent aggressive browser restoration on page loads
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Handle navigation scroll states:
  // 1. Tab switches or Admin view toggles -> Scroll to top
  // 2. Opening Product Detail Page -> Scroll to top of PDP
  // 3. Returning from PDP (Back to Collection) -> Restore position where user left off / selected product
  useEffect(() => {
    const prevGarment = prevGarmentRef.current;
    const prevTab = prevTabRef.current;
    const prevViewMode = prevViewModeRef.current;

    prevGarmentRef.current = selectedGarment;
    prevTabRef.current = activeTab;
    prevViewModeRef.current = viewMode;

    // Mode change (Customer vs Admin) or customer tab switch
    if (prevViewMode !== viewMode || prevTab !== activeTab) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      return;
    }

    // Opening PDP from collection or another screen
    if (!prevGarment && selectedGarment) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      return;
    }

    // Returning from PDP back to collection / previous view (Back to Collection clicked)
    if (prevGarment && !selectedGarment) {
      // Immediate attempt
      restoreCollectionScroll();

      // Ensure restoration after DOM commit and layout pass
      const animFrame = requestAnimationFrame(() => {
        restoreCollectionScroll();
      });

      const timer1 = setTimeout(() => {
        restoreCollectionScroll();
      }, 50);

      const timer2 = setTimeout(() => {
        restoreCollectionScroll();
      }, 150);

      return () => {
        cancelAnimationFrame(animFrame);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [selectedGarment, activeTab, viewMode, restoreCollectionScroll]);

  // Distinct Admin / Backoffice Portal View
  if (viewMode === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <div className="min-h-screen bg-[#141312] text-[#FAF9F6] flex flex-col antialiased selection:bg-[#FAF9F6]/20 selection:text-white">
          <AdminAuthScreen />
          <Toast />
        </div>
      );
    }

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
        {activeTab === 'cart' && <CartView />}
        {activeTab === 'my-rentals' && <MyRentalsView />}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'explore' && (
          selectedGarment ? (
            <ProductDetailPage
              garment={selectedGarment}
              onBack={() => setSelectedGarment(null)}
            />
          ) : (
            <CatalogView />
          )
        )}
      </main>

      {/* Streamlined 3-Step Checkout Modal */}
      <CheckoutModal />

      {/* Optional Google Registration & Sign In Modal */}
      <GoogleAuthModal />

      {/* Customer Mobile Navigation Bar */}
      <BottomNavigation />

      {/* FAQs & Rental Guidelines Modal */}
      <FaqModal />

      {/* Floating FAQ Quick Trigger */}
      <FloatingFaqButton />

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
