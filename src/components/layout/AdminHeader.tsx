import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, ArrowLeft, Layers, Landmark, Lock, LogOut } from 'lucide-react';
import { AdminTab } from '../../types';

export const AdminHeader: React.FC = () => {
  const {
    switchToUser,
    logoutAdmin,
    adminEmail,
    adminTab,
    setAdminTab,
    orders,
  } = useApp();

  const pendingVerificationCount = orders.filter(
    (o) => o.status === 'Under Verification'
  ).length;

  const tabs: { id: AdminTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'verification', label: 'KYC & Verification Queue', icon: ShieldCheck },
    { id: 'inventory', label: 'Inventory & Rates', icon: Layers },
    { id: 'ledger', label: 'Escrow & Revenue', icon: Landmark },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#141312] text-white border-b border-[#2A2725] shadow-sm">
      {/* Top microbar */}
      <div className="bg-[#1C1A18] text-[#948E88] text-[10px] tracking-widest font-medium py-1 px-4 sm:px-6 flex items-center justify-between uppercase border-b border-[#2A2725]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
          <span>Internal Sinta Wardrobe Backoffice Desk</span>
          <span className="hidden sm:inline text-[#5C5854]">•</span>
          <span className="hidden sm:inline text-[#22C55E]">2FA Active ({adminEmail})</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="btn-admin-lock-session"
            onClick={logoutAdmin}
            className="text-[#948E88] hover:text-white flex items-center gap-1 transition-colors text-[10px] lowercase hover:underline"
            title="Lock session and revoke 2FA"
          >
            <Lock className="w-2.5 h-2.5" />
            <span>lock session</span>
          </button>
          <span className="text-[#3D3A37]">•</span>
          <button
            id="btn-admin-exit-to-store"
            onClick={switchToUser}
            className="text-white hover:text-[#FAF9F6] flex items-center gap-1 transition-colors text-[10px] lowercase hover:underline"
          >
            <ArrowLeft className="w-3 h-3 stroke-[2]" />
            <span>exit to storefront</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-14 flex items-center justify-between gap-4">
          {/* Brand & Portal Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white">
                SINTA
              </span>
              <span className="text-[9px] tracking-[0.24em] font-medium text-[#948E88] uppercase hidden sm:inline">
                WARDROBE RENTAL
              </span>
            </div>
            <div className="h-4 w-px bg-[#2A2725] hidden sm:block" />
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#2A2725] text-[#FAF9F6] border border-[#3D3A37] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#22C55E]" />
              <span>Admin Console</span>
            </span>
          </div>

          {/* Right Action: Lock & Exit Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-admin-logout"
              onClick={logoutAdmin}
              className="px-2.5 py-1.5 bg-[#2A2725] hover:bg-[#3D3A37] text-[#FAF9F6] text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 border border-[#3D3A37]"
              title="Lock 2FA Session and Return to Store"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock & Sign Out</span>
            </button>

            <button
              id="btn-admin-header-return-store"
              onClick={switchToUser}
              className="px-3 py-1.5 bg-[#FAF9F6] hover:bg-white text-[#141312] text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Customer Storefront</span>
              <span className="sm:hidden">Store</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-[#2A2725] py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`admin-nav-tab-${tab.id}`}
                onClick={() => setAdminTab(tab.id)}
                className={`px-3 py-2 text-xs font-medium rounded-md flex items-center gap-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#2A2725] text-white'
                    : 'text-[#948E88] hover:text-white hover:bg-[#1C1A18]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
                <span>{tab.label}</span>
                {tab.id === 'verification' && pendingVerificationCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-[#141312] text-[9px] font-bold flex items-center justify-center">
                    {pendingVerificationCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

