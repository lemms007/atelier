import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Search,
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  Calendar,
  Sparkles,
  Truck,
  Ruler,
  MessageCircle,
} from 'lucide-react';
import { FAQItem } from '../../types';

interface FaqModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialCategory?: string | null;
  onOpenConcierge?: () => void;
}

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.FC<{ className?: string }> }
> = {
  all: { label: 'All Topics', icon: HelpCircle },
  booking: { label: 'Booking & Dates', icon: Calendar },
  deposits: { label: 'Security Deposits', icon: ShieldCheck },
  cleaning: { label: 'Care & Cleaning', icon: Sparkles },
  shipping: { label: 'Delivery & Logistics', icon: Truck },
  sizing: { label: 'Sizing & Fit', icon: Ruler },
  general: { label: 'Registration & General', icon: HelpCircle },
};

export const FaqModal: React.FC<FaqModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  initialCategory: propInitialCategory,
  onOpenConcierge,
}) => {
  const {
    faqs,
    isFaqModalOpen,
    setIsFaqModalOpen,
    activeFaqCategory,
    setActiveFaqCategory,
  } = useApp();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isFaqModalOpen;
  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setIsFaqModalOpen(false);
      setActiveFaqCategory(null);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Sync category when activeFaqCategory changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const cat = propInitialCategory || activeFaqCategory || 'all';
      setSelectedCategory(cat);
    }
  }, [isOpen, propInitialCategory, activeFaqCategory]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filter FAQs based on category and search query
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory =
        selectedCategory === 'all' || faq.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const qLower = faq.question.toLowerCase();
      const aLower = faq.answer.toLowerCase();
      const queryLower = searchQuery.toLowerCase().trim();

      return qLower.includes(queryLower) || aLower.includes(queryLower);
    });
  }, [faqs, selectedCategory, searchQuery]);

  // Automatically expand matches when searching or first item
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const autoExpanded: Record<string, boolean> = {};
      filteredFaqs.forEach((faq) => {
        autoExpanded[faq.id] = true;
      });
      setExpandedIds(autoExpanded);
    }
  }, [searchQuery, filteredFaqs]);

  const toggleAccordion = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="faq-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-xs animate-fadeIn"
    >
      <div
        className="bg-[#FFFFFF] w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[#E8E4DF] shadow-2xl flex flex-col overflow-hidden text-[#141312]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#FAF9F6] border-b border-[#E8E4DF] p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#141312] text-[#FAF9F6] flex items-center justify-center">
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
              <h2
                id="faq-modal-title"
                className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#141312]"
              >
                FAQs & Guidelines
              </h2>
            </div>
            <p className="text-xs text-[#5C5854]">
              Everything you need to know about dress rental, deposits, and courier delivery.
            </p>
          </div>

          <button
            id="btn-close-faq-modal"
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E8E4DF] text-[#5C5854] hover:text-[#141312] hover:bg-[#F5F3EF] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close FAQ dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="p-3 sm:p-4 border-b border-[#E8E4DF] bg-white space-y-3 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#948E88] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-faq-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics (e.g., security deposit, dry cleaning, Manila courier)..."
              className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl pl-9 pr-9 py-2 text-xs text-[#141312] placeholder-[#948E88] focus:outline-none focus:border-[#141312] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#948E88] hover:text-[#141312]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills - Flex wrap so all topics are visible and directly accessible */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            {Object.entries(CATEGORY_META).map(([key, meta]) => {
              const Icon = meta.icon;
              const isSelected = selectedCategory === key;
              return (
                <button
                  key={key}
                  id={`btn-faq-cat-${key}`}
                  type="button"
                  onClick={() => setSelectedCategory(key)}
                  className={`px-2.5 py-1.5 rounded-full font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#141312] text-white border-[#141312]'
                      : 'bg-[#FAF9F6] text-[#5C5854] border-[#E8E4DF] hover:border-[#141312]/30 hover:text-[#141312]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accordion Questions List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <HelpCircle className="w-8 h-8 text-[#948E88] mx-auto stroke-[1.25]" />
              <p className="font-serif text-sm font-medium text-[#141312]">
                No questions found
              </p>
              <p className="text-xs text-[#5C5854] max-w-xs mx-auto">
                No matching answers for &quot;{searchQuery}&quot;. Feel free to reset your search or reach out to our concierge.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-2 text-xs text-[#141312] underline font-medium cursor-pointer"
              >
                View all FAQs
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isExpanded =
                expandedIds[faq.id] ?? (index === 0 && !searchQuery);
              const categoryKey = faq.category || 'general';
              const meta = CATEGORY_META[categoryKey] || CATEGORY_META.general;

              return (
                <div
                  key={faq.id}
                  id={`faq-item-${faq.id}`}
                  className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl overflow-hidden transition-all hover:border-[#141312]/30"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    aria-expanded={isExpanded}
                    className="w-full p-3.5 sm:p-4 text-left flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="space-y-1 pr-1">
                      <span className="inline-block text-[10px] uppercase tracking-wider font-semibold text-[#80232F] bg-[#80232F]/10 px-2 py-0.5 rounded">
                        {meta.label}
                      </span>
                      <h3 className="font-serif text-sm font-semibold text-[#141312] leading-snug">
                        {faq.question}
                      </h3>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full bg-white border border-[#E8E4DF] flex items-center justify-center text-[#5C5854] shrink-0 transition-transform duration-200 mt-0.5 ${
                        isExpanded ? 'rotate-180 text-[#141312]' : ''
                      }`}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3.5 pb-4 pt-1 sm:px-4 text-xs text-[#4A4744] leading-relaxed border-t border-[#E8E4DF]/60 bg-white/70">
                      <p className="whitespace-pre-line">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Concierge Support Link */}
        <div className="bg-[#FAF9F6] border-t border-[#E8E4DF] p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#5C5854] text-center sm:text-left">
            <MessageCircle className="w-4 h-4 text-[#141312] shrink-0 hidden sm:block" />
            <span>
              Still have questions regarding your rental dates or fittings?
            </span>
          </div>

          <a
            id="btn-faq-chat-with-us"
            href="https://www.facebook.com/profile.php?id=61594416564619"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat with us</span>
          </a>
        </div>
      </div>
    </div>
  );
};
