import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingBag } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage, setActiveTab, setSelectedGarment } = useApp();

  if (!toastMessage) return null;

  const isBagToast =
    toastMessage.toLowerCase().includes('bag') ||
    toastMessage.toLowerCase().includes('cart');

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm transition-all duration-300 pointer-events-auto">
      <div className="bg-[#141312] text-white px-4 py-2.5 rounded-lg shadow-xl border border-[#2A2725] flex items-center justify-between gap-3 animate-fadeIn">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isBagToast && <ShoppingBag className="w-4 h-4 text-[#FAF9F6] shrink-0 stroke-[1.75]" />}
          <p className="text-xs font-medium leading-tight truncate">{toastMessage}</p>
        </div>
        {isBagToast && (
          <button
            type="button"
            onClick={() => {
              setSelectedGarment(null);
              setActiveTab('cart');
            }}
            className="text-[11px] font-semibold text-white bg-[#2A2725] hover:bg-[#3A3633] px-2.5 py-1 rounded transition-colors shrink-0 cursor-pointer"
          >
            View Bag
          </button>
        )}
      </div>
    </div>
  );
};

