import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BankAccountConfig, FAQItem } from '../../types';
import { DEFAULT_FAQS } from '../../services/firestoreConfig';
import {
  CreditCard,
  Building2,
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  QrCode,
  CheckCircle2,
  UploadCloud,
  FileCheck,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  Edit3,
  Check,
  Eye,
} from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const {
    checkoutConfig,
    updateCheckoutConfig,
    resetCheckoutConfigToDefaults,
    showToast,
    openFaqModal,
  } = useApp();

  // Local draft state for editing before saving
  const [activeSubTab, setActiveSubTab] = useState<'payment' | 'terms' | 'privacy' | 'faqs'>('payment');
  const [isSaving, setIsSaving] = useState(false);

  // GCash Draft State
  const [gcashMerchantName, setGcashMerchantName] = useState(checkoutConfig.gcash.merchantName);
  const [gcashAccountNumber, setGcashAccountNumber] = useState(checkoutConfig.gcash.accountNumber);
  const [gcashQrCodeImageUrl, setGcashQrCodeImageUrl] = useState(checkoutConfig.gcash.qrCodeImageUrl || '');
  const [gcashInstructions, setGcashInstructions] = useState(checkoutConfig.gcash.instructions || '');

  // Bank Transfer Draft State
  const [bankAccounts, setBankAccounts] = useState<BankAccountConfig[]>(checkoutConfig.bankTransfer.accounts);
  const [bankInstructions, setBankInstructions] = useState(checkoutConfig.bankTransfer.instructions || '');

  // Terms & Privacy Draft State
  const [termsTitle, setTermsTitle] = useState(checkoutConfig.termsTitle);
  const [termsContent, setTermsContent] = useState(checkoutConfig.termsContent);
  const [privacyTitle, setPrivacyTitle] = useState(checkoutConfig.privacyTitle);
  const [privacyContent, setPrivacyContent] = useState(checkoutConfig.privacyContent);

  // FAQ Draft State
  const [faqDrafts, setFaqDrafts] = useState<FAQItem[]>(
    checkoutConfig.faqs && checkoutConfig.faqs.length > 0
      ? checkoutConfig.faqs
      : DEFAULT_FAQS
  );

  useEffect(() => {
    if (checkoutConfig.faqs && checkoutConfig.faqs.length > 0) {
      setFaqDrafts(checkoutConfig.faqs);
    }
  }, [checkoutConfig.faqs]);

  // Add FAQ draft state
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState<FAQItem['category']>('booking');

  // Edit FAQ inline state
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editCategory, setEditCategory] = useState<FAQItem['category']>('booking');

  // New bank account inline state
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newAccountName, setNewAccountName] = useState('SINTA WARDROBE RENTAL INC.');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBranch, setNewBranch] = useState('');

  // Handle local QR code image upload
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setGcashQrCodeImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddBank = () => {
    if (!newBankName.trim() || !newAccountNumber.trim()) {
      showToast('Please provide bank name and account number');
      return;
    }
    const newAcc: BankAccountConfig = {
      id: `bank-${Date.now()}`,
      bankName: newBankName.trim(),
      accountName: newAccountName.trim() || 'SINTA WARDROBE RENTAL INC.',
      accountNumber: newAccountNumber.trim(),
      branch: newBranch.trim() || undefined,
    };
    setBankAccounts((prev) => [...prev, newAcc]);
    setNewBankName('');
    setNewAccountNumber('');
    setNewBranch('');
    setIsAddingBank(false);
    showToast('Bank account added to draft.');
  };

  const handleDeleteBank = (id: string) => {
    if (bankAccounts.length <= 1) {
      showToast('At least one bank account must be configured');
      return;
    }
    setBankAccounts((prev) => prev.filter((b) => b.id !== id));
  };

  // FAQ CRUD handlers
  const handleAddFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
      showToast('Please provide both question and answer.');
      return;
    }
    const newFaq: FAQItem = {
      id: `faq-${Date.now()}`,
      question: newFaqQuestion.trim(),
      answer: newFaqAnswer.trim(),
      category: newFaqCategory || 'booking',
    };
    setFaqDrafts((prev) => [...prev, newFaq]);
    setNewFaqQuestion('');
    setNewFaqAnswer('');
    setNewFaqCategory('booking');
    setIsAddingFaq(false);
    showToast('New FAQ added to draft.');
  };

  const handleDeleteFaq = (id: string) => {
    if (faqDrafts.length <= 1) {
      showToast('At least one FAQ item must remain configured.');
      return;
    }
    setFaqDrafts((prev) => prev.filter((f) => f.id !== id));
    showToast('FAQ removed from draft.');
  };

  const handleStartEditFaq = (faq: FAQItem) => {
    setEditingFaqId(faq.id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
    setEditCategory(faq.category || 'booking');
  };

  const handleSaveEditFaq = (id: string) => {
    if (!editQuestion.trim() || !editAnswer.trim()) {
      showToast('Question and answer cannot be empty.');
      return;
    }
    setFaqDrafts((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              question: editQuestion.trim(),
              answer: editAnswer.trim(),
              category: editCategory,
            }
          : f
      )
    );
    setEditingFaqId(null);
    showToast('FAQ updated in draft.');
  };

  const handleMoveFaq = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqDrafts.length) return;
    const reordered = [...faqDrafts];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setFaqDrafts(reordered);
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await updateCheckoutConfig({
        gcash: {
          merchantName: gcashMerchantName.trim(),
          accountNumber: gcashAccountNumber.trim(),
          qrCodeImageUrl: gcashQrCodeImageUrl.trim(),
          instructions: gcashInstructions.trim(),
        },
        bankTransfer: {
          accounts: bankAccounts,
          instructions: bankInstructions.trim(),
        },
        termsTitle: termsTitle.trim(),
        termsContent: termsContent.trim(),
        privacyTitle: privacyTitle.trim(),
        privacyContent: privacyContent.trim(),
        faqs: faqDrafts,
      });
      showToast('Configuration and FAQs successfully saved to database.');
    } catch (err) {
      showToast('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all payment details, terms, and FAQs back to default settings?')) {
      await resetCheckoutConfigToDefaults();
      // Update local draft states to defaults
      setGcashMerchantName('ATELIER LUXE COUTURE INC');
      setGcashAccountNumber('0917 888 2345');
      setGcashQrCodeImageUrl('');
      setGcashInstructions('Scan the QR code or send payment to the verified GCash mobile number. Attach your receipt screenshot with reference number.');
      setBankAccounts([
        {
          id: 'bank-bdo',
          bankName: 'BDO Unibank (Banco de Oro)',
          accountName: 'SINTA WARDROBE RENTAL INC.',
          accountNumber: '0019 8273 4401',
          branch: 'BGC High Street Branch',
        },
        {
          id: 'bank-bpi',
          bankName: 'Bank of the Philippine Islands (BPI)',
          accountName: 'SINTA WARDROBE RENTAL INC.',
          accountNumber: '3890 1204 88',
          branch: 'Makati Ayala Main Branch',
        },
        {
          id: 'bank-unionbank',
          bankName: 'UnionBank of the Philippines',
          accountName: 'SINTA WARDROBE RENTAL INC.',
          accountNumber: '1098 7765 2200',
          branch: 'Ortigas Center Emerald Branch',
        },
      ]);
      setBankInstructions('Transfer the exact amount to any of our accredited corporate bank accounts. Please enter your order or renter name as transfer remarks.');
      setTermsTitle('Terms of Service and Rental Agreement');
      setTermsContent(checkoutConfig.termsContent);
      setPrivacyTitle('Privacy Policy');
      setPrivacyContent(checkoutConfig.privacyContent);
      setFaqDrafts(DEFAULT_FAQS);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Title */}
      <div className="bg-white p-5 rounded-xl border border-[#E8E4DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-[#948E88] uppercase font-medium tracking-wider block">
            Store Administration
          </span>
          <h2 className="font-serif text-lg font-semibold text-[#141312] mt-0.5">
            Payment & Policy Configuration
          </h2>
          <p className="text-xs text-[#5C5854] mt-1">
            Configure live payment options, bank accounts, Terms of Service, and Privacy Policy presented during checkout.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-xs font-medium text-[#5C5854] hover:text-[#141312] bg-[#FAF9F6] border border-[#E8E4DF] rounded-md transition-colors flex items-center gap-1.5"
            title="Reset to default templates"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            id="btn-save-admin-settings"
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-medium text-white bg-[#141312] hover:bg-[#2A2725] rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E4DF] pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('payment')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeSubTab === 'payment'
              ? 'bg-[#141312] text-white'
              : 'bg-white text-[#5C5854] border border-[#E8E4DF] hover:text-[#141312]'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payment Options (GCash & Banks)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('terms')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeSubTab === 'terms'
              ? 'bg-[#141312] text-white'
              : 'bg-white text-[#5C5854] border border-[#E8E4DF] hover:text-[#141312]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Terms of Service & Rental Agreement</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('privacy')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeSubTab === 'privacy'
              ? 'bg-[#141312] text-white'
              : 'bg-white text-[#5C5854] border border-[#E8E4DF] hover:text-[#141312]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Privacy Policy</span>
        </button>

        <button
          id="subtab-admin-faqs"
          type="button"
          onClick={() => setActiveSubTab('faqs')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'faqs'
              ? 'bg-[#141312] text-white'
              : 'bg-white text-[#5C5854] border border-[#E8E4DF] hover:text-[#141312]'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>FAQs & Guidelines ({faqDrafts.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: PAYMENT OPTIONS */}
      {activeSubTab === 'payment' && (
        <div className="space-y-6">
          {/* Section: GCash Details */}
          <div className="bg-white p-5 rounded-xl border border-[#E8E4DF] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#007DFE]/10 flex items-center justify-center text-[#007DFE]">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[#141312]">
                    GCash Payment Configuration
                  </h3>
                  <p className="text-[11px] text-[#948E88]">
                    Displayed on the renter checkout under GCash option
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                  Merchant Account Name *
                </label>
                <input
                  type="text"
                  value={gcashMerchantName}
                  onChange={(e) => setGcashMerchantName(e.target.value)}
                  placeholder="e.g. ATELIER LUXE COUTURE INC"
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                  GCash Mobile Number *
                </label>
                <input
                  type="text"
                  value={gcashAccountNumber}
                  onChange={(e) => setGcashAccountNumber(e.target.value)}
                  placeholder="e.g. 0917 888 2345"
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2 text-xs font-mono text-[#141312] focus:outline-none focus:border-[#141312]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                  GCash Payment Instructions / Renter Guidance
                </label>
                <textarea
                  rows={2}
                  value={gcashInstructions}
                  onChange={(e) => setGcashInstructions(e.target.value)}
                  placeholder="Instructions shown to renter..."
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                />
              </div>

              {/* QR Code Upload / Preview */}
              <div className="sm:col-span-2 bg-[#FAF9F6] p-4 rounded-lg border border-[#E8E4DF] flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 bg-white rounded-md border border-[#E8E4DF] flex items-center justify-center shrink-0 overflow-hidden">
                  {gcashQrCodeImageUrl ? (
                    <img
                      src={gcashQrCodeImageUrl}
                      alt="GCash QR"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#948E88] text-center p-2">
                      <QrCode className="w-8 h-8 stroke-[1.5] mb-1" />
                      <span className="text-[9px]">Default QR</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs flex-1 text-center sm:text-left">
                  <span className="font-semibold text-[#141312] block">
                    Custom GCash QR Code Image
                  </span>
                  <p className="text-[11px] text-[#5C5854]">
                    Upload your merchant QR code screenshot or image so renters can scan directly.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <label className="px-3 py-1.5 bg-white border border-[#E8E4DF] text-xs font-medium rounded text-[#141312] hover:bg-[#FAF9F6] cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload QR Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleQrUpload}
                      />
                    </label>
                    {gcashQrCodeImageUrl && (
                      <button
                        type="button"
                        onClick={() => setGcashQrCodeImageUrl('')}
                        className="px-2.5 py-1.5 text-xs text-[#B91C1C] hover:underline"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Bank Accounts */}
          <div className="bg-white p-5 rounded-xl border border-[#E8E4DF] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#141312]/10 flex items-center justify-center text-[#141312]">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[#141312]">
                    Bank Transfer Accounts
                  </h3>
                  <p className="text-[11px] text-[#948E88]">
                    Destinations available to renters when selecting "Bank Transfer"
                  </p>
                </div>
              </div>

              {!isAddingBank && (
                <button
                  type="button"
                  onClick={() => setIsAddingBank(true)}
                  className="px-3 py-1.5 bg-[#141312] text-white text-xs font-medium rounded-md hover:bg-[#2A2725] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Bank Account</span>
                </button>
              )}
            </div>

            {/* Inline Add Bank Form */}
            {isAddingBank && (
              <div className="bg-[#FAF9F6] p-4 rounded-lg border border-[#E8E4DF] space-y-3">
                <h4 className="font-semibold text-xs text-[#141312] flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Destination Bank Account</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      placeholder="e.g. Metrobank, RCBC, Security Bank"
                      className="w-full bg-white border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                      Account Name *
                    </label>
                    <input
                      type="text"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      placeholder="e.g. SINTA WARDROBE RENTAL INC."
                      className="w-full bg-white border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value)}
                      placeholder="e.g. 1098 7765 2200"
                      className="w-full bg-white border border-[#E8E4DF] rounded-md px-3 py-2 text-xs font-mono text-[#141312] focus:outline-none focus:border-[#141312]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                      Branch / Remarks
                    </label>
                    <input
                      type="text"
                      value={newBranch}
                      onChange={(e) => setNewBranch(e.target.value)}
                      placeholder="e.g. BGC High Street Branch"
                      className="w-full bg-white border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingBank(false)}
                    className="px-3 py-1.5 text-xs text-[#5C5854] hover:text-[#141312]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddBank}
                    className="px-3.5 py-1.5 bg-[#141312] text-white text-xs font-medium rounded-md hover:bg-[#2A2725]"
                  >
                    Add Bank
                  </button>
                </div>
              </div>
            )}

            {/* List of Configured Banks */}
            <div className="space-y-2">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-[#FAF9F6] border border-[#E8E4DF] p-3 rounded-lg flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#141312]">
                        {account.bankName}
                      </span>
                      {account.branch && (
                        <span className="text-[10px] text-[#948E88] bg-white px-1.5 py-0.5 rounded border border-[#E8E4DF]">
                          {account.branch}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#5C5854]">
                      <span>
                        Account Name: <strong className="text-[#141312]">{account.accountName}</strong>
                      </span>
                      <span>
                        Account No:{' '}
                        <strong className="font-mono text-[#141312]">{account.accountNumber}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteBank(account.id)}
                    className="p-1.5 text-[#948E88] hover:text-[#B91C1C] rounded transition-colors"
                    title="Remove bank account"
                  >
                    <Trash2 className="w-4 h-4 stroke-[1.5]" />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                Bank Transfer Instructions
              </label>
              <textarea
                rows={2}
                value={bankInstructions}
                onChange={(e) => setBankInstructions(e.target.value)}
                placeholder="Instructions shown to renter when transferring to bank..."
                className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TERMS OF SERVICE & RENTAL AGREEMENT */}
      {activeSubTab === 'terms' && (
        <div className="bg-white p-5 rounded-xl border border-[#E8E4DF] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#141312]/10 flex items-center justify-center text-[#141312]">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-semibold text-[#141312]">
                  Terms of Service and Rental Agreement Content
                </h3>
                <p className="text-[11px] text-[#948E88]">
                  Content presented in the agreement modal when renters click "Terms of Service and Rental Agreement"
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
              Document Title *
            </label>
            <input
              type="text"
              value={termsTitle}
              onChange={(e) => setTermsTitle(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
              Full Terms & Clauses (Supports line breaks & numbered clauses)
            </label>
            <textarea
              rows={14}
              value={termsContent}
              onChange={(e) => setTermsContent(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2.5 text-xs text-[#141312] font-mono leading-relaxed focus:outline-none focus:border-[#141312]"
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PRIVACY POLICY */}
      {activeSubTab === 'privacy' && (
        <div className="bg-white p-5 rounded-xl border border-[#E8E4DF] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-semibold text-[#141312]">
                  Privacy Policy Content
                </h3>
                <p className="text-[11px] text-[#948E88]">
                  Content presented in the policy modal when renters click "Privacy Policy"
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
              Document Title *
            </label>
            <input
              type="text"
              value={privacyTitle}
              onChange={(e) => setPrivacyTitle(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
              Full Privacy Policy Content (Data Privacy Act compliance)
            </label>
            <textarea
              rows={14}
              value={privacyContent}
              onChange={(e) => setPrivacyContent(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2.5 text-xs text-[#141312] font-mono leading-relaxed focus:outline-none focus:border-[#141312]"
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 4: FAQS & RENTAL POLICY GUIDELINES */}
      {activeSubTab === 'faqs' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Top Info and Actions */}
          <div className="bg-white p-5 rounded-xl border border-[#E8E4DF] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E4DF] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#80232F]/10 flex items-center justify-center text-[#80232F]">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[#141312]">
                    Frequently Asked Questions ({faqDrafts.length})
                  </h3>
                  <p className="text-[11px] text-[#948E88]">
                    Rendered in Header navigation, Product Detail, Cart, and Checkout
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openFaqModal()}
                  className="px-3 py-1.5 text-xs font-medium text-[#141312] bg-[#FAF9F6] hover:bg-[#F5F3EF] border border-[#E8E4DF] rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Open live customer FAQ modal preview"
                >
                  <Eye className="w-3.5 h-3.5 text-[#5C5854]" />
                  <span>Preview Modal</span>
                </button>

                <button
                  id="btn-admin-add-faq"
                  type="button"
                  onClick={() => setIsAddingFaq(true)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#141312] hover:bg-[#2A2725] rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New FAQ</span>
                </button>
              </div>
            </div>

            {/* Inline Add FAQ Card */}
            {isAddingFaq && (
              <div className="bg-[#FAF9F6] border border-[#141312]/20 rounded-xl p-4 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-2">
                  <span className="font-serif text-xs font-semibold text-[#141312]">
                    Create New FAQ Item
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingFaq(false)}
                    className="text-xs text-[#948E88] hover:text-[#141312]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                      Question *
                    </label>
                    <input
                      id="input-new-faq-question"
                      type="text"
                      value={newFaqQuestion}
                      onChange={(e) => setNewFaqQuestion(e.target.value)}
                      placeholder="e.g. Can I request a try-on before renting?"
                      className="w-full bg-white border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                      Category *
                    </label>
                    <select
                      id="select-new-faq-category"
                      value={newFaqCategory}
                      onChange={(e) => setNewFaqCategory(e.target.value as any)}
                      className="w-full bg-white border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                    >
                      <option value="booking">Booking & Dates</option>
                      <option value="deposits">Security Deposits</option>
                      <option value="cleaning">Care & Cleaning</option>
                      <option value="shipping">Delivery & Logistics</option>
                      <option value="sizing">Sizing & Fit</option>
                      <option value="general">Registration & General</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                    Answer Guidelines *
                  </label>
                  <textarea
                    id="input-new-faq-answer"
                    rows={3}
                    value={newFaqAnswer}
                    onChange={(e) => setNewFaqAnswer(e.target.value)}
                    placeholder="Provide clear, concise rental rules or atelier policies..."
                    className="w-full bg-white border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingFaq(false)}
                    className="px-3 py-1.5 text-xs text-[#5C5854] hover:text-[#141312]"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-confirm-add-faq"
                    type="button"
                    onClick={handleAddFaq}
                    className="px-4 py-1.5 text-xs font-medium bg-[#141312] text-white rounded-md hover:bg-[#2A2725] transition-colors cursor-pointer"
                  >
                    Add to Drafts
                  </button>
                </div>
              </div>
            )}

            {/* List of Configured FAQs */}
            <div className="space-y-3">
              {faqDrafts.map((faq, index) => {
                const isEditing = editingFaqId === faq.id;

                if (isEditing) {
                  return (
                    <div
                      key={faq.id}
                      className="bg-[#FAF9F6] border-2 border-[#141312] rounded-xl p-4 space-y-3 animate-fadeIn"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                            Edit Question
                          </label>
                          <input
                            type="text"
                            value={editQuestion}
                            onChange={(e) => setEditQuestion(e.target.value)}
                            className="w-full bg-white border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                            Category
                          </label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as any)}
                            className="w-full bg-white border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                          >
                            <option value="booking">Booking & Dates</option>
                            <option value="deposits">Security Deposits</option>
                            <option value="cleaning">Care & Cleaning</option>
                            <option value="shipping">Delivery & Logistics</option>
                            <option value="sizing">Sizing & Fit</option>
                            <option value="general">Registration & General</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                          Edit Answer
                        </label>
                        <textarea
                          rows={4}
                          value={editAnswer}
                          onChange={(e) => setEditAnswer(e.target.value)}
                          className="w-full bg-white border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingFaqId(null)}
                          className="px-3 py-1.5 text-xs text-[#5C5854] hover:text-[#141312]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditFaq(faq.id)}
                          className="px-4 py-1.5 text-xs font-medium bg-[#141312] text-white rounded-md hover:bg-[#2A2725] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Update Item</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={faq.id}
                    id={`admin-faq-row-${faq.id}`}
                    className="bg-white border border-[#E8E4DF] rounded-xl p-3.5 sm:p-4 hover:border-[#141312]/30 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#80232F] bg-[#80232F]/10 px-2 py-0.5 rounded">
                            {faq.category || 'general'}
                          </span>
                          <span className="text-[11px] text-[#948E88]">
                            #{index + 1}
                          </span>
                        </div>
                        <h4 className="font-serif text-xs sm:text-sm font-semibold text-[#141312]">
                          {faq.question}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveFaq(index, 'up')}
                          className="w-7 h-7 rounded border border-[#E8E4DF] flex items-center justify-center text-[#5C5854] hover:text-[#141312] hover:bg-[#FAF9F6] disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === faqDrafts.length - 1}
                          onClick={() => handleMoveFaq(index, 'down')}
                          className="w-7 h-7 rounded border border-[#E8E4DF] flex items-center justify-center text-[#5C5854] hover:text-[#141312] hover:bg-[#FAF9F6] disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditFaq(faq)}
                          className="w-7 h-7 rounded border border-[#E8E4DF] flex items-center justify-center text-[#5C5854] hover:text-[#141312] hover:bg-[#FAF9F6]"
                          title="Edit FAQ"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="w-7 h-7 rounded border border-[#E8E4DF] flex items-center justify-center text-[#B91C1C] hover:bg-[#B91C1C]/10"
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#5C5854] leading-relaxed border-t border-[#E8E4DF]/50 pt-2 whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Save Action Floating Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E4DF] flex items-center justify-between">
        <span className="text-xs text-[#5C5854]">
          Changes will immediately take effect for all renters checking out.
        </span>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-5 py-2.5 text-xs font-medium text-white bg-[#141312] hover:bg-[#2A2725] rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>
    </div>
  );
};
