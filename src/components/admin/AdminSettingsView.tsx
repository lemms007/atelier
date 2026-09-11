import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BankAccountConfig } from '../../types';
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
} from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const { checkoutConfig, updateCheckoutConfig, resetCheckoutConfigToDefaults, showToast } = useApp();

  // Local draft state for editing before saving
  const [activeSubTab, setActiveSubTab] = useState<'payment' | 'terms' | 'privacy'>('payment');
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
      });
      showToast('Configuration successfully saved to database.');
    } catch (err) {
      showToast('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all payment details, terms, and privacy policy back to default settings?')) {
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
