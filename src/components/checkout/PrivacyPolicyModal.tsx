import React from 'react';
import { X, ShieldCheck, FileCheck, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  title?: string;
  content?: string;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onAgree,
  title = 'Privacy Policy',
  content,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FFFFFF] w-full max-w-lg rounded-xl border border-[#E8E4DF] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E4DF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#141312] stroke-[1.5]" />
            <h3 className="font-serif text-base font-semibold text-[#141312]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center text-[#948E88] hover:text-[#141312]"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Scrollable Privacy Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#5C5854] leading-relaxed">
          <div className="bg-[#F5F3EF] p-3 rounded-lg border border-[#E8E4DF] flex items-center gap-2 text-[#141312] font-medium">
            <ShieldCheck className="w-4 h-4 text-[#141312] stroke-[1.5]" />
            <span>Republic Act No. 10173 Data Privacy Compliance</span>
          </div>

          {content ? (
            <div className="whitespace-pre-line space-y-3">
              {content}
            </div>
          ) : (
            <>
              <div>
                <h4 className="font-semibold text-[#141312] text-xs mb-1">
                  1. Collection of Personal Information
                </h4>
                <p>
                  In compliance with the Data Privacy Act of 2012 (Republic Act No. 10173), Sinta Wardrobe Rental collects personal information including your full legal name, delivery address, mobile contact number, email address, and government identification strictly for verifying high-value designer garment rentals.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-[#141312] text-xs mb-1">
                  2. Identity Verification (KYC)
                </h4>
                <p>
                  Uploaded government identification documents are accessed exclusively by authorized concierge verification officers to authenticate identity and prevent fraudulent bookings. We do not sell, disclose, or transfer your identification records to third-party advertisers.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-[#141312] text-xs mb-1">
                  3. Payment Data Security
                </h4>
                <p>
                  Payment proofs, transaction reference codes, and banking details are recorded solely for escrow auditing, payment confirmation, and processing security deposit refunds upon return of the rented pieces.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-[#141312] text-xs mb-1">
                  4. Data Retention and Storage
                </h4>
                <p>
                  Your personal records and order history are securely maintained in protected cloud infrastructure with restricted role-based administrative access. You may request data rectification or account profile deletion at any time by contacting concierge@sinta-rentals.ph.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-[#141312] text-xs mb-1">
                  5. Your Data Subject Rights
                </h4>
                <p>
                  As a data subject, you have the right to be informed, access, rectify, erase, or object to the processing of your personal data under Philippine data privacy regulations.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer CTAs */}
        <div className="p-4 border-t border-[#E8E4DF] bg-[#FAF9F6] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-[#5C5854] hover:text-[#141312]"
          >
            Close
          </button>
          <button
            id="btn-agree-privacy"
            type="button"
            onClick={() => {
              onAgree();
              onClose();
            }}
            className="px-4 py-2 bg-[#141312] text-white text-xs font-medium rounded-md hover:bg-[#2A2725] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>I Accept & Agree</span>
          </button>
        </div>
      </div>
    </div>
  );
};
