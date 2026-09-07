import React from 'react';
import { X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface RentalAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
}

export const RentalAgreementModal: React.FC<RentalAgreementModalProps> = ({
  isOpen,
  onClose,
  onAgree,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FFFFFF] w-full max-w-lg rounded-xl border border-[#E8E4DF] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E4DF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#141312] stroke-[1.5]" />
            <h3 className="font-serif text-base font-semibold text-[#141312]">
              Rental Agreement & Waiver
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center text-[#948E88] hover:text-[#141312]"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#5C5854] leading-relaxed">
          <div className="bg-[#F5F3EF] p-3 rounded-lg border border-[#E8E4DF] flex items-center gap-2 text-[#141312] font-medium">
            <ShieldCheck className="w-4 h-4 text-[#141312] stroke-[1.5]" />
            <span>Atelier Manila Certified Couture Hire Terms</span>
          </div>

          <div>
            <h4 className="font-semibold text-[#141312] text-xs mb-1">
              1. 4 to 14-Day Rental Window
            </h4>
            <p>
              Day 1 commences upon receipt of the garment via our designated courier. The final day signifies the scheduled pickup by our return courier. Extensions must be requested 48 hours prior and are subject to availability.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#141312] text-xs mb-1">
              2. Care & Prohibited Alterations
            </h4>
            <p>
              Renters may NOT perform permanent alterations, hem cuts, pin adjustments with non-silk pins, iron on delicate organza, or attempt home washing. All garments are sanitized through our specialized atelier dry cleaning partners.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#141312] text-xs mb-1">
              3. Minor Wear vs. Major Damage
            </h4>
            <p>
              Standard wear (minor cosmetic hem dust, removable beverage splatters) is 100% covered by Atelier Insurance. Irreparable tears, severe burns, cigarette marks, or theft will forfeit the security deposit and may incur up to the full retail replacement value.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#141312] text-xs mb-1">
              4. 100% Security Deposit Refund Policy
            </h4>
            <p>
              Refundable deposits are remitted to your original GCash or Bank account within 24 hours of our physical garment check in Manila.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#141312] text-xs mb-1">
              5. KYC Verification Consent
            </h4>
            <p>
              Your uploaded government identification and selfie are stored encrypted and utilized strictly for rental identity verification in compliance with Republic Act No. 10173 (Data Privacy Act of 2012).
            </p>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="p-4 border-t border-[#E8E4DF] bg-[#FAF9F6] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-[#5C5854] hover:text-[#141312]"
          >
            Close
          </button>
          <button
            id="btn-agree-waiver"
            onClick={() => {
              onAgree();
              onClose();
            }}
            className="px-4 py-2 bg-[#141312] text-white text-xs font-medium rounded-md hover:bg-[#2A2725] flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>I Accept & Agree</span>
          </button>
        </div>
      </div>
    </div>
  );
};
