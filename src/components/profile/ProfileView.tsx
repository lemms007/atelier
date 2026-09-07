import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConciergeModal } from '../common/ConciergeModal';
import {
  User,
  ShieldCheck,
  Ruler,
  HelpCircle,
  RotateCcw,
  Sparkles,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Calendar,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { resetAllData, orders, wishlist, switchToAdmin, isAdminAuthenticated, adminEmail } = useApp();
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the 4 to 14-day rental window work?',
      a: 'Day 1 is your delivery date when our courier arrives with your dress in specialized hanging garment luggage. The final day (Day 4 up to Day 14) is when our return courier arrives to collect the package.',
    },
    {
      q: 'Do I need to dry clean the garment before returning?',
      a: 'Never! Complimentary professional dry cleaning and sanitization by our certified atelier textile conservators is included in every rental. Please do not wash or iron at home.',
    },
    {
      q: 'When is my refundable security deposit returned?',
      a: 'Your security deposit is remitted back to your original GCash or Bank Transfer account within 24 hours of our Manila team verifying the garment on return.',
    },
    {
      q: 'Can I request temporary tailoring or pin alterations?',
      a: 'Permanent cutting or sewing is strictly prohibited. You may only use non-damaging silk-safe dress tape or non-piercing clips provided in your Atelier care kit.',
    },
    {
      q: 'What areas in the Philippines are covered for delivery?',
      a: 'We offer white-glove same-day courier dispatch across Metro Manila (BGC, Makati, Ortigas, Alabang, QC) and express insured courier across Luzon, Visayas, and Mindanao.',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-32 space-y-5 animate-fadeIn">
      {/* Profile Header */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#FAF9F6] border border-[#E8E4DF] flex items-center justify-center text-[#141312] font-serif text-lg font-medium shrink-0">
          BZ
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-base font-semibold text-[#141312] truncate">
              Beatriz Zobel-de Ayala
            </h2>
            <span className="bg-[#FAF9F6] border border-[#E8E4DF] text-[#141312] text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
              <Award className="w-3 h-3 text-[#141312]" />
              VIP Member
            </span>
          </div>
          <p className="text-xs text-[#5C5854] mt-0.5">beatriz.ayala@luxemail.ph • +63 917 554 9912</p>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-[#5C5854]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#141312]" />
            <span>Identity Certified (Philippine Passport)</span>
          </div>
        </div>
      </div>

      {/* Renter Statistics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E8E4DF] text-center">
          <span className="text-[10px] uppercase font-medium text-[#948E88] tracking-wider block">Active & Past Bookings</span>
          <span className="font-serif text-lg font-semibold text-[#141312] mt-0.5 block">{orders.length}</span>
        </div>
        <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E8E4DF] text-center">
          <span className="text-[10px] uppercase font-medium text-[#948E88] tracking-wider block">Saved in Wishlist</span>
          <span className="font-serif text-lg font-semibold text-[#141312] mt-0.5 block">{wishlist.length}</span>
        </div>
      </div>

      {/* Saved Silhouette Measurements */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-2.5">
          <h3 className="font-serif text-xs font-semibold text-[#141312] flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-[#141312] stroke-[1.5]" />
            <span>Saved Sizing Profile</span>
          </h3>
          <span className="text-[10px] bg-[#FAF9F6] text-[#5C5854] border border-[#E8E4DF] px-2 py-0.5 rounded font-medium">
            Primary Size: S
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-[#FAF9F6] p-2 rounded-lg border border-[#E8E4DF]">
            <span className="text-[9px] text-[#948E88] uppercase block">Bust</span>
            <span className="font-medium text-[#141312] mt-0.5 block">33" (84cm)</span>
          </div>
          <div className="bg-[#FAF9F6] p-2 rounded-lg border border-[#E8E4DF]">
            <span className="text-[9px] text-[#948E88] uppercase block">Waist</span>
            <span className="font-medium text-[#141312] mt-0.5 block">25" (63cm)</span>
          </div>
          <div className="bg-[#FAF9F6] p-2 rounded-lg border border-[#E8E4DF]">
            <span className="text-[9px] text-[#948E88] uppercase block">Hips</span>
            <span className="font-medium text-[#141312] mt-0.5 block">35" (89cm)</span>
          </div>
          <div className="bg-[#FAF9F6] p-2 rounded-lg border border-[#E8E4DF]">
            <span className="text-[9px] text-[#948E88] uppercase block">Height</span>
            <span className="font-medium text-[#141312] mt-0.5 block">5'9"</span>
          </div>
        </div>
      </div>

      {/* FAQ & Guidelines Accordion */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-4 space-y-3">
        <h3 className="font-serif text-xs font-semibold text-[#141312] flex items-center gap-1.5 border-b border-[#E8E4DF] pb-2.5">
          <HelpCircle className="w-3.5 h-3.5 text-[#141312] stroke-[1.5]" />
          <span>Atelier Rental FAQs & Policy</span>
        </h3>

        <div className="divide-y divide-[#E8E4DF]">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-2.5">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left text-xs font-medium text-[#141312] hover:text-[#5C5854] transition-colors"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#948E88]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#948E88]" />
                )}
              </button>
              {openFaq === idx && (
                <p className="text-xs text-[#5C5854] mt-2 leading-relaxed pl-1">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Staff & Admin Portal Access */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#141312]" />
            <h3 className="font-serif text-xs font-semibold text-[#141312]">
              Atelier Operations & Verification Portal
            </h3>
          </div>
          <span className="text-[9px] bg-[#FAF9F6] border border-[#E8E4DF] text-[#5C5854] px-1.5 py-0.5 rounded font-mono uppercase">
            {isAdminAuthenticated ? '2FA Verified' : '2FA Protected'}
          </span>
        </div>
        <p className="text-xs text-[#5C5854] leading-relaxed">
          Access the backend management console to review government IDs, verify GCash/Bank transfer receipts, manage garment inventory, and authorize dispatch. Requires two-factor email verification.
        </p>
        <button
          id="btn-profile-open-admin"
          onClick={switchToAdmin}
          className="w-full py-2 bg-[#FAF9F6] hover:bg-[#141312] text-[#141312] hover:text-white border border-[#E8E4DF] hover:border-[#141312] text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isAdminAuthenticated ? 'Launch Admin Verification Console' : 'Authenticate with 2FA & Launch Console'}</span>
        </button>
      </div>

      {/* Concierge & Reset Actions */}
      <div className="space-y-2">
        <button
          onClick={() => setIsConciergeOpen(true)}
          className="w-full h-10 bg-[#141312] hover:bg-[#2A2725] text-white font-medium text-xs rounded-md flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Chat with Manila Atelier Concierge</span>
        </button>

        <button
          onClick={resetAllData}
          className="w-full py-2 text-xs text-[#948E88] hover:text-[#B91C1C] flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data & Initial Orders</span>
        </button>
      </div>

      <ConciergeModal
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
      />
    </div>
  );
};
