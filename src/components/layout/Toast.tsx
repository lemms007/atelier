import React from 'react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm pointer-events-none transition-all duration-300">
      <div className="bg-[#141312] text-white px-4 py-2.5 rounded-md shadow-lg border border-[#141312] flex items-center gap-2">
        <p className="text-xs font-medium leading-tight">{toastMessage}</p>
      </div>
    </div>
  );
};
