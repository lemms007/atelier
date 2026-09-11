import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FloatingFaqButton: React.FC = () => {
  const {
    viewMode,
    isCheckoutOpen,
    selectedGarment,
    isFaqOpen,
    openFaqModal,
  } = useApp();

  // Hide in Admin mode or when Checkout modal is active
  if (viewMode === 'admin' || isCheckoutOpen || isFaqOpen) {
    return null;
  }

  // When a garment is open on mobile, hide floating button to prevent
  // blocking the mobile sticky "Book Now / Add to Bag" action bar.
  // On desktop (md:), it stays cleanly visible in the bottom right corner.
  const visibilityClasses = selectedGarment ? 'hidden md:flex' : 'flex';

  return (
    <div
      id="container-floating-faq"
      className={`fixed z-30 ${visibilityClasses} bottom-20 right-4 md:bottom-6 md:right-6 items-center`}
    >
      <button
        id="btn-floating-faq"
        type="button"
        onClick={() => openFaqModal()}
        className="group relative flex items-center justify-center gap-2 h-11 w-11 sm:w-auto sm:px-4 rounded-full bg-[#141312] hover:bg-[#2A2725] text-white shadow-md hover:shadow-lg shadow-[#141312]/20 border border-[#2A2725] active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141312] focus-visible:ring-offset-2"
        aria-label="Frequently Asked Questions & Guidelines"
        title="FAQs & Rental Guidelines"
      >
        <HelpCircle className="w-4 h-4 text-white stroke-[1.75] transition-transform duration-200 group-hover:scale-110" />
        <span className="hidden sm:inline text-xs font-medium tracking-wide">
          FAQs
        </span>
      </button>
    </div>
  );
};
