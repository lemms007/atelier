import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShippingDetails,
  KYCData,
  PaymentData,
  GovernmentIdType,
  PaymentMethod,
  BankName,
} from '../../types';
import {
  formatPHP,
  formatPHMobile,
  isValidPHMobile,
} from '../../utils/formatters';
import { RentalAgreementModal } from './RentalAgreementModal';
import {
  X,
  CheckCircle2,
  UploadCloud,
  QrCode,
  Copy,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Truck,
  FileCheck,
  Camera,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  User,
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartRentalSubtotal,
    cartDepositSubtotal,
    createOrder,
    showToast,
    currentUser,
    userProfile,
    loginWithGoogle,
    isAuthLoading,
  } = useApp();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // 1. Shipping form state
  const [fullName, setFullName] = useState('Beatriz Zobel-de Ayala');
  const [mobileNumber, setMobileNumber] = useState('+63 917 554 9912');
  const [email, setEmail] = useState('beatriz.ayala@luxemail.ph');
  const [deliveryAddress, setDeliveryAddress] = useState(
    'Unit 38B, Pacific Plaza Towers, 4th Avenue, Bonifacio Global City'
  );
  const [landmarkNotes, setLandmarkNotes] = useState(
    'Leave with the 24/7 concierge lobby front desk under my name'
  );
  const [city, setCity] = useState('Taguig City');
  const [province, setProvince] = useState('Metro Manila');
  const [postalCode, setPostalCode] = useState('1634');
  const [deliveryMethod, setDeliveryMethod] = useState<'same_day_courier' | 'express_provincial'>('same_day_courier');

  // 2. KYC state
  const [idType, setIdType] = useState<GovernmentIdType>('Philippine Passport');
  const [frontIdImage, setFrontIdImage] = useState<string>(
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80'
  );
  const [backIdImage, setBackIdImage] = useState<string>(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
  );
  const [selfieWithIdImage, setSelfieWithIdImage] = useState<string>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
  );
  const [idNumber, setIdNumber] = useState<string>('P8920412B');

  // Populate from userProfile if available
  useEffect(() => {
    if (userProfile) {
      if (userProfile.shippingDetails) {
        if (userProfile.shippingDetails.fullName) setFullName(userProfile.shippingDetails.fullName);
        if (userProfile.shippingDetails.mobileNumber) setMobileNumber(userProfile.shippingDetails.mobileNumber);
        if (userProfile.shippingDetails.email) setEmail(userProfile.shippingDetails.email);
        if (userProfile.shippingDetails.deliveryAddress) setDeliveryAddress(userProfile.shippingDetails.deliveryAddress);
        if (userProfile.shippingDetails.landmarkNotes !== undefined) setLandmarkNotes(userProfile.shippingDetails.landmarkNotes);
        if (userProfile.shippingDetails.city) setCity(userProfile.shippingDetails.city);
        if (userProfile.shippingDetails.province) setProvince(userProfile.shippingDetails.province);
        if (userProfile.shippingDetails.postalCode) setPostalCode(userProfile.shippingDetails.postalCode);
        if (userProfile.shippingDetails.deliveryMethod) setDeliveryMethod(userProfile.shippingDetails.deliveryMethod as any);
      } else if (currentUser) {
        if (currentUser.displayName) setFullName(currentUser.displayName);
        if (currentUser.email) setEmail(currentUser.email);
      }

      if (userProfile.kycDetails) {
        if (userProfile.kycDetails.idType) setIdType(userProfile.kycDetails.idType as GovernmentIdType);
        if (userProfile.kycDetails.frontIdImage) setFrontIdImage(userProfile.kycDetails.frontIdImage);
        if (userProfile.kycDetails.backIdImage) setBackIdImage(userProfile.kycDetails.backIdImage);
        if (userProfile.kycDetails.selfieWithIdImage) setSelfieWithIdImage(userProfile.kycDetails.selfieWithIdImage);
        if (userProfile.kycDetails.idNumber) setIdNumber(userProfile.kycDetails.idNumber);
      }
    }
  }, [userProfile, currentUser]);

  // 3. Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [selectedBank, setSelectedBank] = useState<BankName>('BDO');
  const [referenceNumber, setReferenceNumber] = useState<string>('8204910293812');
  const [receiptImage, setReceiptImage] = useState<string>(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'
  );

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isCheckoutOpen) return null;

  const shippingFee = deliveryMethod === 'same_day_courier' ? 350 : 650;
  const grandTotal = cartRentalSubtotal + cartDepositSubtotal + shippingFee;

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!fullName.trim()) errs.fullName = 'Full Name is required';
    if (!isValidPHMobile(mobileNumber)) {
      errs.mobileNumber = 'Valid Philippine mobile (+63 9XX XXX XXXX) required';
    }
    if (!deliveryAddress.trim()) errs.deliveryAddress = 'Complete delivery address is required';
    if (!city.trim()) errs.city = 'City is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!frontIdImage) errs.frontId = 'Front of government ID is required';
    if (!selfieWithIdImage) errs.selfie = 'Live selfie holding your ID is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 3 Validation
  const validateStep3 = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (paymentMethod === 'gcash') {
      const cleanRef = referenceNumber.replace(/\D/g, '');
      if (cleanRef.length < 9) {
        errs.referenceNumber = 'Please enter a valid 13-digit GCash Reference Number';
      }
    } else {
      if (!referenceNumber.trim()) {
        errs.referenceNumber = 'Bank transfer reference number is required';
      }
    }

    if (!receiptImage) {
      errs.receiptImage = 'Please upload a proof of payment screenshot';
    }

    if (!agreedToTerms) {
      errs.terms = 'You must agree to the Rental Terms & Damage Liability Waiver';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle final checkout submission
  const handleSubmitBooking = () => {
    if (!validateStep3()) return;

    const shippingData: ShippingDetails = {
      fullName,
      mobileNumber,
      email,
      deliveryAddress,
      landmarkNotes,
      city,
      province,
      postalCode,
      deliveryMethod,
      shippingFee,
    };

    const kycData: KYCData = {
      idType,
      frontIdImage,
      backIdImage: backIdImage || undefined,
      selfieWithIdImage,
      idNumber,
      uploadedAt: new Date().toISOString(),
    };

    const paymentData: PaymentData = {
      method: paymentMethod,
      bankName: paymentMethod === 'bank_transfer' ? selectedBank : undefined,
      accountName: paymentMethod === 'gcash' ? 'ATELIER LUXE COUTURE INC' : `${selectedBank} Atelier Manila Inc.`,
      accountNumber: paymentMethod === 'gcash' ? '0917 888 2345' : '1098 2341 5560',
      referenceNumber,
      receiptImage,
      paidAmount: grandTotal,
      paidAt: new Date().toISOString(),
    };

    createOrder(shippingData, kycData, paymentData);
  };

  // Handle File Upload helper
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
        showToast('Image uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    showToast(`Copied ${text} to clipboard`);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FAF8F5] w-full max-w-2xl rounded-3xl border border-[#F2ECE4] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header with Title & Close */}
        <div className="bg-[#FFFFFF] px-5 py-3.5 border-b border-[#E8E4DF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-base font-semibold text-[#141312]">
              Atelier Checkout
            </span>
            <span className="text-[10px] bg-[#F5F3EF] border border-[#E8E4DF] text-[#141312] px-2 py-0.5 rounded font-medium">
              Step {currentStep} of 3
            </span>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="w-8 h-8 rounded flex items-center justify-center text-[#948E88] hover:text-[#141312] transition-colors"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="bg-[#FFFFFF] px-5 py-2.5 border-b border-[#E8E4DF]">
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
            {/* Step 1 */}
            <div
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded border transition-all ${
                currentStep === 1
                  ? 'bg-[#141312] text-white border-[#141312]'
                  : currentStep > 1
                  ? 'bg-[#F5F3EF] text-[#141312] border-[#E8E4DF]'
                  : 'bg-[#FAF9F6] text-[#948E88] border-[#E8E4DF]'
              }`}
            >
              {currentStep > 1 ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-[9px] flex items-center justify-center">
                  1
                </span>
              )}
              <span>1. Shipping</span>
            </div>

            {/* Step 2 */}
            <div
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded border transition-all ${
                currentStep === 2
                  ? 'bg-[#141312] text-white border-[#141312]'
                  : currentStep > 2
                  ? 'bg-[#F5F3EF] text-[#141312] border-[#E8E4DF]'
                  : 'bg-[#FAF9F6] text-[#948E88] border-[#E8E4DF]'
              }`}
            >
              {currentStep > 2 ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-[9px] flex items-center justify-center">
                  2
                </span>
              )}
              <span>2. KYC Identity</span>
            </div>

            {/* Step 3 */}
            <div
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded border transition-all ${
                currentStep === 3
                  ? 'bg-[#141312] text-white border-[#141312]'
                  : 'bg-[#FAF9F6] text-[#948E88] border-[#E8E4DF]'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-[9px] flex items-center justify-center">
                3
              </span>
              <span>3. Payment</span>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Optional Google Login / Profile Auto-Sync Banner */}
          {!currentUser ? (
            <div className="bg-[#FFFFFF] border border-[#E8E4DF] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#141312] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[#E8E4DF]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#141312]">Optional: Sign in with Google</span>
                    <span className="text-[9px] bg-[#FAF9F6] border border-[#E8E4DF] text-[#80232F] px-1.5 py-0.2 rounded font-medium">
                      1-Click Reuse
                    </span>
                  </div>
                  <span className="text-[11px] text-[#78716C] block mt-0.5 leading-snug">
                    Save your delivery address and uploaded ID in our database for instant checkout next time.
                  </span>
                </div>
              </div>
              <button
                type="button"
                id="btn-checkout-google-auth"
                onClick={loginWithGoogle}
                disabled={isAuthLoading}
                className="h-9 px-3.5 bg-white hover:bg-[#FAF9F6] border border-[#D0C9C0] text-[#141312] text-xs font-medium rounded-lg flex items-center justify-center gap-2.5 shrink-0 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
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
                <span>{isAuthLoading ? 'Connecting...' : 'Continue with Google'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#FFFFFF] border border-[#E8E4DF] rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {userProfile?.photoURL || currentUser.photoURL ? (
                  <img
                    src={userProfile?.photoURL || currentUser.photoURL || ''}
                    alt="User"
                    className="w-7 h-7 rounded-full border border-[#E8E4DF] shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#141312] text-white flex items-center justify-center text-[10px] font-medium shrink-0">
                    {(userProfile?.displayName || currentUser.displayName || 'U').charAt(0)}
                  </div>
                )}
                <div className="truncate">
                  <span className="font-medium text-[#141312] block truncate">
                    {userProfile?.displayName || currentUser.displayName || 'Atelier Renter'}
                  </span>
                  <span className="text-[10px] text-[#78716C] block truncate">
                    {currentUser.email} • Atelier VIP Account
                  </span>
                </div>
              </div>
              <span className="bg-[#E7F0E9] text-[#1E562F] text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-[#1E562F]" />
                <span className="hidden sm:inline">Details Reused from Database</span>
                <span className="sm:hidden">Synced</span>
              </span>
            </div>
          )}

          {/* ================= STEP 1: SHIPPING ================= */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E4DF] space-y-3">
                <h3 className="font-serif text-sm font-semibold text-[#141312] flex items-center gap-2">
                  <Truck className="w-4 h-4 stroke-[1.5]" />
                  <span>Renter & Delivery Details</span>
                </h3>

                {/* Full Name */}
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    id="input-renter-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maria Clara Santos"
                    className={`w-full bg-[#FAF9F6] border ${
                      errors.fullName ? 'border-[#B91C1C]' : 'border-[#E8E4DF]'
                    } rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]`}
                  />
                  {errors.fullName && (
                    <p className="text-[10px] text-[#B91C1C] mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Mobile & Email in grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                      Philippine Mobile *
                    </label>
                    <input
                      id="input-renter-mobile"
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(formatPHMobile(e.target.value))}
                      placeholder="+63 9XX XXX XXXX"
                      className={`w-full bg-[#FAF9F6] border ${
                        errors.mobileNumber ? 'border-[#B91C1C]' : 'border-[#E8E4DF]'
                      } rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312] font-mono`}
                    />
                    {errors.mobileNumber && (
                      <p className="text-[10px] text-[#B91C1C] mt-1">{errors.mobileNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                      Email Address
                    </label>
                    <input
                      id="input-renter-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="renter@domain.ph"
                      className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                    />
                  </div>
                </div>

                {/* Complete Address */}
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                    Complete Delivery Address *
                  </label>
                  <textarea
                    id="input-renter-address"
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Unit / House No., Street, Building, Village / Barangay"
                    className={`w-full bg-[#FAF9F6] border ${
                      errors.deliveryAddress ? 'border-[#B91C1C]' : 'border-[#E8E4DF]'
                    } rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]`}
                  />
                  {errors.deliveryAddress && (
                    <p className="text-[10px] text-[#B91C1C] mt-1">{errors.deliveryAddress}</p>
                  )}
                </div>

                {/* City & Province & Postal Code */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                      Province
                    </label>
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
                    />
                  </div>
                </div>

                {/* Landmark Notes */}
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                    Delivery & Concierge Landmark Notes
                  </label>
                  <input
                    type="text"
                    value={landmarkNotes}
                    onChange={(e) => setLandmarkNotes(e.target.value)}
                    placeholder="e.g., Leave with front desk lobby / Gate 2 security"
                    className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                </div>
              </div>

              {/* Delivery Method Selector */}
              <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E4DF] space-y-2.5">
                <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block">
                  Select Courier Delivery Option
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('same_day_courier')}
                    className={`p-3 rounded-md border text-left transition-all ${
                      deliveryMethod === 'same_day_courier'
                        ? 'border-[#141312] bg-[#F5F3EF]'
                        : 'border-[#E8E4DF] bg-[#FAF9F6] hover:border-[#141312]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs text-[#141312]">
                        Metro Manila Courier
                      </span>
                      <span className="font-medium text-xs text-[#141312]">₱350</span>
                    </div>
                    <p className="text-[10px] text-[#5C5854] mt-1">
                      White-glove same-day delivery & return courier box pickup in BGC, Makati, Ortigas, Alabang, QC.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('express_provincial')}
                    className={`p-3 rounded-md border text-left transition-all ${
                      deliveryMethod === 'express_provincial'
                        ? 'border-[#141312] bg-[#F5F3EF]'
                        : 'border-[#E8E4DF] bg-[#FAF9F6] hover:border-[#141312]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs text-[#141312]">
                        Express Provincial
                      </span>
                      <span className="font-medium text-xs text-[#141312]">₱650</span>
                    </div>
                    <p className="text-[10px] text-[#5C5854] mt-1">
                      Cebu, Davao, Pampanga, Tagaytay, Iloilo with secure return airway bill included.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: KYC IDENTITY VERIFICATION ================= */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E4DF] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
                  <div>
                    <h3 className="font-serif text-sm font-semibold text-[#141312] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 stroke-[1.5]" />
                      <span>Renter Verification (KYC)</span>
                    </h3>
                    <p className="text-[11px] text-[#948E88]">
                      Required for high-value designer garment security
                    </p>
                  </div>

                  <span className="text-[10px] bg-[#F5F3EF] border border-[#E8E4DF] text-[#141312] px-2 py-0.5 rounded font-medium flex items-center gap-1">
                    <FileCheck className="w-3 h-3" />
                    Encrypted Storage
                  </span>
                </div>

                {/* ID Type Selector */}
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                    Government ID Type *
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as GovernmentIdType)}
                    className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                  >
                    <option value="Philippine Passport">Philippine Passport</option>
                    <option value="Driver's License (LTO)">Driver's License (LTO)</option>
                    <option value="Unified Multi-Purpose ID (UMID)">Unified Multi-Purpose ID (UMID)</option>
                    <option value="Philippine National ID (PhilID)">Philippine National ID (PhilID)</option>
                  </select>
                </div>

                {/* ID Number */}
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                    ID Document Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. P8920412B"
                    className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                </div>

                {/* 3 Upload Zones: Front, Back, Live Selfie */}
                <div className="space-y-3 pt-1">
                  {/* 1. Front ID */}
                  <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#141312]">
                        1. Front of {idType} *
                      </span>
                      {frontIdImage ? (
                        <span className="text-[10px] bg-[#141312] text-white px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          ID Received
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#B91C1C] font-medium">Required</span>
                      )}
                    </div>

                    {frontIdImage ? (
                      <div className="relative aspect-[16/9] w-full max-w-xs rounded-md overflow-hidden border border-[#E8E4DF] mx-auto group">
                        <img src={frontIdImage} alt="Front ID" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="px-2.5 py-1 bg-white text-xs font-medium rounded cursor-pointer text-[#141312]">
                            Replace
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, setFrontIdImage)}
                            />
                          </label>
                          <button
                            onClick={() => setFrontIdImage('')}
                            className="p-1 bg-[#B91C1C] text-white rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="border border-dashed border-[#E8E4DF] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-colors">
                        <UploadCloud className="w-5 h-5 text-[#948E88] mb-1" />
                        <span className="text-xs font-medium text-[#141312]">Upload Front ID</span>
                        <span className="text-[10px] text-[#948E88]">PNG, JPG up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setFrontIdImage)}
                        />
                      </label>
                    )}
                  </div>

                  {/* 2. Back ID (Optional) */}
                  <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#141312]">
                        2. Back of Government ID (Optional)
                      </span>
                      {backIdImage && (
                        <span className="text-[10px] bg-[#141312] text-white px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Received
                        </span>
                      )}
                    </div>

                    {backIdImage ? (
                      <div className="relative aspect-[16/9] w-full max-w-xs rounded-md overflow-hidden border border-[#E8E4DF] mx-auto group">
                        <img src={backIdImage} alt="Back ID" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="px-2.5 py-1 bg-white text-xs font-medium rounded cursor-pointer text-[#141312]">
                            Replace
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, setBackIdImage)}
                            />
                          </label>
                          <button
                            onClick={() => setBackIdImage('')}
                            className="p-1 bg-[#B91C1C] text-white rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="border border-dashed border-[#E8E4DF] rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-colors">
                        <UploadCloud className="w-4 h-4 text-[#948E88] mb-1" />
                        <span className="text-xs font-medium text-[#5C5854]">Upload Back of ID (Optional)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setBackIdImage)}
                        />
                      </label>
                    )}
                  </div>

                  {/* 3. Live Selfie holding ID */}
                  <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#141312]">
                        3. Live Selfie Holding ID *
                      </span>
                      {selfieWithIdImage ? (
                        <span className="text-[10px] bg-[#141312] text-white px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Selfie Verified
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#B91C1C] font-medium">Required</span>
                      )}
                    </div>

                    {selfieWithIdImage ? (
                      <div className="relative aspect-[3/4] w-full max-w-[130px] rounded-md overflow-hidden border border-[#E8E4DF] mx-auto group">
                        <img src={selfieWithIdImage} alt="Selfie with ID" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="px-2 py-0.5 bg-white text-[10px] font-medium rounded cursor-pointer text-[#141312]">
                            Replace
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, setSelfieWithIdImage)}
                            />
                          </label>
                          <button
                            onClick={() => setSelfieWithIdImage('')}
                            className="p-1 bg-[#B91C1C] text-white rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="border border-dashed border-[#E8E4DF] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-colors">
                        <Camera className="w-5 h-5 text-[#948E88] mb-1 stroke-[1.5]" />
                        <span className="text-xs font-medium text-[#141312]">Take / Upload Selfie with ID</span>
                        <span className="text-[10px] text-[#948E88]">Hold your ID clearly beside your face</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setSelfieWithIdImage)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PAYMENT & TERMS ================= */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Payment Rail Tabs: GCash vs Direct Bank Transfer */}
              <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E4DF] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
                  <h3 className="font-serif text-sm font-semibold text-[#141312] flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 stroke-[1.5]" />
                    <span>Philippine Payment Rails</span>
                  </h3>
                  <span className="font-serif text-sm font-semibold text-[#141312]">
                    Amount Due: {formatPHP(grandTotal)}
                  </span>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-[#FAF9F6] p-1 rounded-md border border-[#E8E4DF]">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gcash')}
                    className={`py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'gcash'
                        ? 'bg-[#141312] text-white'
                        : 'text-[#5C5854] hover:text-[#141312]'
                    }`}
                  >
                    <span>GCash (Instant QR)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-[#141312] text-white'
                        : 'text-[#5C5854] hover:text-[#141312]'
                    }`}
                  >
                    <span>Direct Bank Transfer</span>
                  </button>
                </div>

                {/* GCash Sub-view */}
                {paymentMethod === 'gcash' && (
                  <div className="space-y-3 pt-1">
                    <div className="bg-[#FAF9F6] border border-[#E8E4DF] p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4">
                      {/* Merchant QR Code simulation */}
                      <div className="w-28 h-28 bg-white p-2 rounded-md border border-[#E8E4DF] flex flex-col items-center justify-center shrink-0">
                        <div className="w-full h-full bg-[#FAF9F6] rounded flex flex-col items-center justify-center p-2 text-center">
                          <QrCode className="w-10 h-10 text-[#141312] mb-1 stroke-[1.5]" />
                          <span className="text-[8px] font-medium text-[#5C5854] tracking-wider uppercase">
                            Scan GCash QR
                          </span>
                        </div>
                      </div>

                      {/* Account Details */}
                      <div className="space-y-1.5 text-xs text-center sm:text-left flex-1">
                        <div>
                          <span className="text-[9px] uppercase font-medium text-[#948E88]">
                            Merchant Name
                          </span>
                          <p className="font-semibold text-[#141312]">
                            ATELIER LUXE COUTURE INC
                          </p>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-medium text-[#948E88]">
                            GCash Number
                          </span>
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <span className="font-mono font-medium text-xs text-[#141312]">
                              0917 888 2345
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('09178882345')}
                              className="p-1 text-[#948E88] hover:text-[#141312] rounded"
                              title="Copy Number"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[10px] text-[#5C5854]">
                          Exact amount to send: <strong className="text-[#141312]">{formatPHP(grandTotal)}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Transfer Sub-view */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                        Select Destination Bank
                      </label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value as BankName)}
                        className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                      >
                        <option value="BDO">BDO Unibank (Banco de Oro)</option>
                        <option value="BPI">Bank of the Philippine Islands (BPI)</option>
                        <option value="UnionBank">UnionBank of the Philippines</option>
                      </select>
                    </div>

                    <div className="bg-[#FAF9F6] border border-[#E8E4DF] p-3 rounded-lg space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#5C5854]">Account Name:</span>
                        <span className="font-medium text-[#141312]">
                          ATELIER LUXE MANILA INC.
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#5C5854]">Account Number:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-medium text-[#141312]">
                            {selectedBank === 'BDO'
                              ? '0019 8273 4401'
                              : selectedBank === 'BPI'
                              ? '3890 1204 88'
                              : '1098 7765 2200'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                selectedBank === 'BDO'
                                  ? '001982734401'
                                  : selectedBank === 'BPI'
                                  ? '3890120488'
                                  : '109877652200'
                              )
                            }
                            className="text-[#948E88] hover:text-[#141312]"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#5C5854]">Branch:</span>
                        <span className="text-[#141312]">BGC High Street Branch</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reference Number Input */}
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                    {paymentMethod === 'gcash' ? '13-Digit GCash Ref No. *' : 'Bank Transfer Reference Code *'}
                  </label>
                  <input
                    id="input-payment-ref"
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder={paymentMethod === 'gcash' ? 'e.g. 8204910293812' : 'e.g. BPI-TXN-9021884'}
                    className={`w-full bg-[#FAF9F6] border ${
                      errors.referenceNumber ? 'border-[#B91C1C]' : 'border-[#E8E4DF]'
                    } rounded-md px-3 py-2 text-xs text-[#141312] font-mono focus:outline-none focus:border-[#141312]`}
                  />
                  {errors.referenceNumber && (
                    <p className="text-[10px] text-[#B91C1C] mt-1">{errors.referenceNumber}</p>
                  )}
                </div>

                {/* Proof of Payment Receipt Upload */}
                <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#141312]">
                      Payment Receipt Screenshot *
                    </span>
                    {receiptImage && (
                      <span className="text-[10px] bg-[#141312] text-white px-2 py-0.5 rounded font-medium">
                        Attached
                      </span>
                    )}
                  </div>

                  {receiptImage ? (
                    <div className="relative aspect-[16/9] w-full max-w-xs rounded-md overflow-hidden border border-[#E8E4DF] mx-auto group">
                      <img src={receiptImage} alt="Receipt" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="px-2.5 py-1 bg-white text-xs font-medium rounded cursor-pointer text-[#141312]">
                          Replace
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, setReceiptImage)}
                          />
                        </label>
                        <button
                          onClick={() => setReceiptImage('')}
                          className="p-1 bg-[#B91C1C] text-white rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border border-dashed border-[#E8E4DF] rounded-lg p-3.5 flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-colors">
                      <UploadCloud className="w-5 h-5 text-[#948E88] mb-1 stroke-[1.5]" />
                      <span className="text-xs font-medium text-[#141312]">Upload Payment Screenshot</span>
                      <span className="text-[10px] text-[#948E88]">Attach mobile app receipt or transaction slip</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setReceiptImage)}
                      />
                    </label>
                  )}
                </div>

                {/* Rental Agreement Checkbox */}
                <div className="pt-2 border-t border-[#E8E4DF]">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      id="checkbox-terms-waiver"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-3.5 h-3.5 accent-[#141312] rounded border-[#E8E4DF]"
                    />
                    <div className="text-xs text-[#5C5854]">
                      <span>I agree to the </span>
                      <button
                        type="button"
                        onClick={() => setIsAgreementOpen(true)}
                        className="text-[#141312] font-medium underline"
                      >
                        Rental Agreement & Damage Liability Waiver
                      </button>
                      <span> and understand the 4–14 day policy and deposit terms.</span>
                    </div>
                  </label>
                  {errors.terms && (
                    <p className="text-[10px] text-[#B91C1C] mt-1">{errors.terms}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="bg-[#FFFFFF] p-4 border-t border-[#E8E4DF] flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              id="btn-checkout-prev"
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="h-10 px-4 rounded-md border border-[#E8E4DF] bg-white text-xs font-medium text-[#141312] hover:bg-[#FAF9F6] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          ) : (
            <div className="text-xs text-[#5C5854]">
              <span>Items: </span>
              <strong className="text-[#141312] font-medium">{cart.length} Garments</strong>
            </div>
          )}

          {currentStep < 3 ? (
            <button
              id="btn-checkout-next"
              type="button"
              onClick={() => {
                if (currentStep === 1 && validateStep1()) setCurrentStep(2);
                if (currentStep === 2 && validateStep2()) setCurrentStep(3);
              }}
              className="h-10 px-5 rounded-md bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <span>Continue to Step {currentStep + 1}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              id="btn-checkout-submit"
              type="button"
              onClick={handleSubmitBooking}
              className="h-10 px-5 rounded-md bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium flex items-center gap-2 active:scale-95 transition-all"
            >
              <span>Submit Booking & Proof ({formatPHP(grandTotal)})</span>
            </button>
          )}
        </div>
      </div>

      {/* Agreement Modal */}
      <RentalAgreementModal
        isOpen={isAgreementOpen}
        onClose={() => setIsAgreementOpen(false)}
        onAgree={() => setAgreedToTerms(true)}
      />
    </div>
  );
};
