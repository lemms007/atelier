import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  ShieldCheck,
  Truck,
  Ruler,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const GoogleAuthModal: React.FC = () => {
  const {
    isGoogleLoginModalOpen,
    setIsGoogleLoginModalOpen,
    loginWithGoogle,
    isAuthLoading,
    currentUser,
  } = useApp();

  if (!isGoogleLoginModalOpen || currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF9F6] w-full max-w-md rounded-2xl border border-[#E8E4DF] shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="bg-[#FFFFFF] px-5 py-4 border-b border-[#E8E4DF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-semibold tracking-wide text-[#141312] uppercase">
              Sinta Renter Account
            </span>
            <span className="text-[10px] bg-[#FAF9F6] border border-[#E8E4DF] text-[#80232F] px-2 py-0.5 rounded-full font-medium">
              Optional
            </span>
          </div>

          <button
            onClick={() => setIsGoogleLoginModalOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#948E88] hover:text-[#141312] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div className="text-center space-y-1.5 pb-1">
            <div className="w-12 h-12 rounded-full bg-[#141312] text-white flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-6 h-6 text-[#E8E4DF]" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-[#141312]">
              Sign in with Google
            </h2>
            <p className="text-xs text-[#5C5854] max-w-xs mx-auto leading-relaxed">
              Register optionally with Google to securely store your measurements, delivery addresses, and verified Philippine ID credentials in our database.
            </p>
          </div>

          {/* Value Props */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-3.5 space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs">
              <Truck className="w-4 h-4 text-[#141312] shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-[#141312] block">Reusable Delivery Details</span>
                <span className="text-[11px] text-[#78716C] leading-snug block">
                  Never re-type your Metro Manila or provincial delivery address and courier notes.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#80232F] shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-[#141312] block">1-Time Government ID Verification</span>
                <span className="text-[11px] text-[#78716C] leading-snug block">
                  Upload your Philippine Passport or LTO License once; reused securely across all future couture rentals.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <Ruler className="w-4 h-4 text-[#141312] shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-[#141312] block">Saved Sizing Profile</span>
                <span className="text-[11px] text-[#78716C] leading-snug block">
                  Store your bust, waist, hips, and height for instant size compatibility checking.
                </span>
              </div>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div className="space-y-2 pt-1">
            <button
              id="btn-google-auth-login"
              type="button"
              disabled={isAuthLoading}
              onClick={loginWithGoogle}
              className="w-full h-11 bg-white hover:bg-[#F5F3EF] border border-[#D0C9C0] text-[#141312] font-medium text-xs rounded-xl flex items-center justify-center gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isAuthLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsGoogleLoginModalOpen(false)}
              className="w-full py-2 text-xs text-[#948E88] hover:text-[#141312] transition-colors cursor-pointer"
            >
              Continue browsing as Guest
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#948E88] pt-1 border-t border-[#E8E4DF]/60">
            <Lock className="w-3 h-3 text-[#948E88]" />
            <span>End-to-end encrypted • Firebase Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};
