import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShippingDetails,
  KYCData,
  PaymentData,
  GovernmentIdType,
  PaymentMethod,
  BankName,
  DeliveryMethod,
} from '../../types';
import {
  formatPHP,
  formatPHMobile,
  isValidPHMobile,
  parseFullName,
  formatFullName,
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
  Truck,
  FileCheck,
  Camera,
  Trash2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export const LALAMOVE_SERVICEABLE_LOCATIONS: Record<string, string[]> = {
  'Metro Manila': [
    'Taguig City (BGC)',
    'Makati City',
    'Pasig City',
    'Quezon City',
    'Manila City',
    'Mandaluyong City',
    'San Juan City',
    'Parañaque City',
    'Muntinlupa City (Alabang)',
    'Pasay City',
    'Las Piñas City',
    'Marikina City',
    'Caloocan City',
    'Malabon City',
    'Navotas City',
    'Valenzuela City',
    'Pateros',
  ],
  'Cavite': [
    'Bacoor City',
    'Imus City',
    'Dasmariñas City',
    'General Trias City',
    'Silang',
    'Tagaytay City',
    'Kawit',
    'Noveleta',
    'Rosario',
    'Carmona',
    'Trece Martires City',
    'Naic',
    'Tanza',
  ],
  'Laguna': [
    'Biñan City',
    'Santa Rosa City',
    'Cabuyao City',
    'Calamba City',
    'San Pedro City',
    'San Pablo City',
    'Los Baños',
    'Bay',
    'Pagsanjan',
    'Santa Cruz',
  ],
  'Rizal': [
    'Antipolo City',
    'Cainta',
    'Taytay',
    'San Mateo',
    'Angono',
    'Binangonan',
    'Rodriguez (Montalban)',
    'Teresa',
    'Morong',
    'Tanay',
  ],
  'Bulacan': [
    'San Jose del Monte City',
    'Meycauayan City',
    'Marilao',
    'Bocaue',
    'Santa Maria',
    'Malolos City',
    'Guiguinto',
    'Balagtas',
    'Plaridel',
    'Baliuag',
  ],
  'Pampanga': [
    'Angeles City',
    'San Fernando City',
    'Mabalacat City',
    'Guagua',
    'Mexico',
    'Lubao',
    'Porac',
    'Apalit',
  ],
  'Batangas': [
    'Batangas City',
    'Lipa City',
    'Tanauan City',
    'Santo Tomas City',
    'Malvar',
  ],
  'Cebu': [
    'Cebu City',
    'Mandaue City',
    'Lapu-Lapu City',
    'Talisay City',
    'Consolacion',
  ],
};

// Backwards compatibility alias
export const GREATER_MANILA_LOCATIONS = LALAMOVE_SERVICEABLE_LOCATIONS;

export const CITY_POSTAL_CODES: Record<string, string> = {
  'Taguig City (BGC)': '1634',
  'Taguig City': '1634',
  'Makati City': '1200',
  'Pasig City': '1600',
  'Quezon City': '1100',
  'Manila City': '1000',
  'Mandaluyong City': '1550',
  'San Juan City': '1500',
  'Parañaque City': '1700',
  'Muntinlupa City (Alabang)': '1780',
  'Muntinlupa City': '1780',
  'Pasay City': '1300',
  'Las Piñas City': '1740',
  'Marikina City': '1800',
  'Caloocan City': '1400',
  'Malabon City': '1470',
  'Navotas City': '1485',
  'Valenzuela City': '1440',
  'Pateros': '1620',
  'Bacoor City': '4102',
  'Imus City': '4103',
  'Dasmariñas City': '4114',
  'General Trias City': '4107',
  'Silang': '4118',
  'Tagaytay City': '4120',
  'Kawit': '4104',
  'Noveleta': '4105',
  'Rosario': '4106',
  'Carmona': '4116',
  'Trece Martires City': '4109',
  'Naic': '4110',
  'Tanza': '4108',
  'Biñan City': '4024',
  'Santa Rosa City': '4026',
  'Cabuyao City': '4025',
  'Calamba City': '4027',
  'San Pedro City': '4023',
  'San Pablo City': '4000',
  'Los Baños': '4030',
  'Bay': '4033',
  'Pagsanjan': '4008',
  'Santa Cruz': '4009',
  'Antipolo City': '1870',
  'Cainta': '1900',
  'Taytay': '1920',
  'San Mateo': '1850',
  'Angono': '1930',
  'Binangonan': '1940',
  'Rodriguez (Montalban)': '1860',
  'Teresa': '1970',
  'Morong': '1960',
  'Tanay': '1980',
  'San Jose del Monte City': '3023',
  'Meycauayan City': '3020',
  'Marilao': '3019',
  'Bocaue': '3018',
  'Santa Maria': '3022',
  'Malolos City': '3000',
  'Guiguinto': '3015',
  'Balagtas': '3016',
  'Plaridel': '3004',
  'Baliuag': '3006',
  'Angeles City': '2009',
  'San Fernando City': '2000',
  'Mabalacat City': '2010',
  'Guagua': '2003',
  'Mexico': '2021',
  'Lubao': '2005',
  'Porac': '2008',
  'Apalit': '2016',
  'Batangas City': '4200',
  'Lipa City': '4217',
  'Tanauan City': '4232',
  'Santo Tomas City': '4234',
  'Malvar': '4233',
  'Cebu City': '6000',
  'Mandaue City': '6014',
  'Lapu-Lapu City': '6015',
  'Talisay City': '6045',
  'Consolacion': '6001',
};

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
  } = useApp();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Shipping form state: First, Middle, Last Name breakdown
  const initialNameParts = parseFullName(
    userProfile?.shippingDetails?.fullName ||
    userProfile?.displayName ||
    currentUser?.displayName ||
    ''
  );

  const [firstName, setFirstName] = useState(
    userProfile?.shippingDetails?.firstName || userProfile?.firstName || initialNameParts.firstName
  );
  const [middleName, setMiddleName] = useState(
    userProfile?.shippingDetails?.middleName ?? userProfile?.middleName ?? initialNameParts.middleName
  );
  const [lastName, setLastName] = useState(
    userProfile?.shippingDetails?.lastName || userProfile?.lastName || initialNameParts.lastName
  );

  const [mobileNumber, setMobileNumber] = useState(userProfile?.shippingDetails?.mobileNumber || userProfile?.phoneNumber || '');
  const [email, setEmail] = useState(userProfile?.shippingDetails?.email || currentUser?.email || '');
  const [deliveryAddress, setDeliveryAddress] = useState(userProfile?.shippingDetails?.deliveryAddress || '');
  const [landmarkNotes, setLandmarkNotes] = useState(userProfile?.shippingDetails?.landmarkNotes || '');
  const [province, setProvince] = useState(userProfile?.shippingDetails?.province || 'Metro Manila');
  const [city, setCity] = useState(userProfile?.shippingDetails?.city || 'Taguig City (BGC)');
  const [postalCode, setPostalCode] = useState(userProfile?.shippingDetails?.postalCode || '1634');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    (userProfile?.shippingDetails?.deliveryMethod as DeliveryMethod) || 'lalamove'
  );

  // KYC state
  const [idType, setIdType] = useState<GovernmentIdType>(
    (userProfile?.kycDetails?.idType as GovernmentIdType) || 'Philippine Passport'
  );
  const [frontIdImage, setFrontIdImage] = useState<string>(userProfile?.kycDetails?.frontIdImage || '');
  const [backIdImage, setBackIdImage] = useState<string>(userProfile?.kycDetails?.backIdImage || '');
  const [selfieWithIdImage, setSelfieWithIdImage] = useState<string>(userProfile?.kycDetails?.selfieWithIdImage || '');
  const [idNumber, setIdNumber] = useState<string>(userProfile?.kycDetails?.idNumber || '');

  // Populate from userProfile if available
  useEffect(() => {
    if (userProfile) {
      if (userProfile.shippingDetails) {
        const parsed = parseFullName(userProfile.shippingDetails.fullName || userProfile.displayName || '');
        setFirstName(userProfile.shippingDetails.firstName || userProfile.firstName || parsed.firstName);
        setMiddleName(userProfile.shippingDetails.middleName ?? userProfile.middleName ?? parsed.middleName);
        setLastName(userProfile.shippingDetails.lastName || userProfile.lastName || parsed.lastName);
        if (userProfile.shippingDetails.mobileNumber) setMobileNumber(userProfile.shippingDetails.mobileNumber);
        if (userProfile.shippingDetails.email) setEmail(userProfile.shippingDetails.email);
        if (userProfile.shippingDetails.deliveryAddress) setDeliveryAddress(userProfile.shippingDetails.deliveryAddress);
        if (userProfile.shippingDetails.landmarkNotes !== undefined) setLandmarkNotes(userProfile.shippingDetails.landmarkNotes);
        if (userProfile.shippingDetails.province) setProvince(userProfile.shippingDetails.province);
        if (userProfile.shippingDetails.city) setCity(userProfile.shippingDetails.city);
        if (userProfile.shippingDetails.postalCode) setPostalCode(userProfile.shippingDetails.postalCode);
        if (userProfile.shippingDetails.deliveryMethod) setDeliveryMethod(userProfile.shippingDetails.deliveryMethod as any);
      } else if (currentUser) {
        const parsed = parseFullName(currentUser.displayName || '');
        setFirstName(parsed.firstName);
        setMiddleName(parsed.middleName);
        setLastName(parsed.lastName);
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

  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince);
    const cities = LALAMOVE_SERVICEABLE_LOCATIONS[newProvince] || [];
    if (cities.length > 0) {
      const nextCity = cities[0];
      setCity(nextCity);
      if (CITY_POSTAL_CODES[nextCity]) {
        setPostalCode(CITY_POSTAL_CODES[nextCity]);
      }
    }
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    if (CITY_POSTAL_CODES[newCity]) {
      setPostalCode(CITY_POSTAL_CODES[newCity]);
    }
  };

  const availableCities = LALAMOVE_SERVICEABLE_LOCATIONS[province] || LALAMOVE_SERVICEABLE_LOCATIONS['Metro Manila'];

  // 3. Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [selectedBank, setSelectedBank] = useState<BankName>('BDO');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string>('');

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isCheckoutOpen) return null;

  // Courier shipping fee is calculated live and shouldered directly by the renter via the Lalamove app
  const shippingFee = 0;
  const grandTotal = cartRentalSubtotal;

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    if (!isValidPHMobile(mobileNumber)) {
      errs.mobileNumber = 'Valid mobile # (+63 9XX XXX XXXX) required';
    }
    if (!deliveryAddress.trim()) errs.deliveryAddress = 'Street address / unit / building is required';
    if (!city.trim()) errs.city = 'City / Municipality is required';
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

    const constructedFullName = formatFullName(firstName, middleName, lastName);

    const shippingData: ShippingDetails = {
      firstName: firstName.trim(),
      middleName: middleName ? middleName.trim() : undefined,
      lastName: lastName.trim(),
      fullName: constructedFullName,
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
            {/* Shipping */}
            <div
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-all ${
                currentStep === 1
                  ? 'bg-[#141312] text-white border-[#141312]'
                  : currentStep > 1
                  ? 'bg-[#F5F3EF] text-[#141312] border-[#E8E4DF]'
                  : 'bg-[#FAF9F6] text-[#948E88] border-[#E8E4DF]'
              }`}
            >
              {currentStep > 1 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#141312]" />
              ) : (
                <Truck className="w-3.5 h-3.5" />
              )}
              <span>Shipping</span>
            </div>

            {/* KYC */}
            <div
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-all ${
                currentStep === 2
                  ? 'bg-[#141312] text-white border-[#141312]'
                  : currentStep > 2
                  ? 'bg-[#F5F3EF] text-[#141312] border-[#E8E4DF]'
                  : 'bg-[#FAF9F6] text-[#948E88] border-[#E8E4DF]'
              }`}
            >
              {currentStep > 2 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#141312]" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>KYC Identity</span>
            </div>

            {/* Payment */}
            <div
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-all ${
                currentStep === 3
                  ? 'bg-[#141312] text-white border-[#141312]'
                  : 'bg-[#FAF9F6] text-[#948E88] border-[#E8E4DF]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment</span>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* ================= STEP 1: SHIPPING ================= */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E4DF] space-y-3">
                <h3 className="font-serif text-sm font-semibold text-[#141312] flex items-center gap-2">
                  <Truck className="w-4 h-4 stroke-[1.5]" />
                  <span>Renter & Delivery Details</span>
                </h3>

                {/* Legal Name Breakdown: First, Middle, Last */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854]">
                      Renter Legal Name (as indicated on Government ID) *
                    </label>
                    <span className="text-[9px] text-[#948E88]">First, Middle, Last</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-5">
                      <label className="text-[9px] font-medium text-[#78716C] uppercase block mb-1">
                        First Name *
                      </label>
                      <input
                        id="input-renter-first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Maria Clara"
                        className={`w-full bg-[#FAF9F6] border ${
                          errors.firstName ? 'border-[#B91C1C]' : 'border-[#E8E4DF]'
                        } rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]`}
                      />
                      {errors.firstName && (
                        <p className="text-[10px] text-[#B91C1C] mt-1">{errors.firstName}</p>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[9px] font-medium text-[#78716C] uppercase block mb-1">
                        Middle Name <span className="text-[#948E88] font-normal lowercase">(optional)</span>
                      </label>
                      <input
                        id="input-renter-middle-name"
                        type="text"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        placeholder="e.g. Santos"
                        className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="text-[9px] font-medium text-[#78716C] uppercase block mb-1">
                        Last Name *
                      </label>
                      <input
                        id="input-renter-last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Dela Cruz"
                        className={`w-full bg-[#FAF9F6] border ${
                          errors.lastName ? 'border-[#B91C1C]' : 'border-[#E8E4DF]'
                        } rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]`}
                      />
                      {errors.lastName && (
                        <p className="text-[10px] text-[#B91C1C] mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile & Email in grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                      Mobile # *
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

                {/* Street Address / Unit / Building */}
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                    Street Address / Unit / Building *
                  </label>
                  <textarea
                    id="input-renter-address"
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House / Unit / Building No., Street, Subdivision or Village"
                    className={`w-full bg-[#FAF9F6] border ${
                      errors.deliveryAddress ? 'border-[#B91C1C]' : 'border-[#E8E4DF]'
                    } rounded-md px-3 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]`}
                  />
                  {errors.deliveryAddress && (
                    <p className="text-[10px] text-[#B91C1C] mt-1">{errors.deliveryAddress}</p>
                  )}
                </div>

                {/* City & Province & Postal Code (Lalamove Serviceable Areas) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                      Province *
                    </label>
                    <select
                      id="select-renter-province"
                      value={province}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                    >
                      {Object.keys(LALAMOVE_SERVICEABLE_LOCATIONS).map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                      City / Municipality *
                    </label>
                    <select
                      id="select-renter-city"
                      value={city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className={`w-full bg-[#FAF9F6] border ${
                        errors.city ? 'border-[#B91C1C]' : 'border-[#E8E4DF]'
                      } rounded-md px-2.5 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]`}
                    >
                      {availableCities.includes(city) ? null : (
                        <option value={city}>{city}</option>
                      )}
                      {availableCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.city && (
                      <p className="text-[10px] text-[#B91C1C] mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block mb-1">
                      Postal Code
                    </label>
                    <input
                      id="input-renter-postal"
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 1634"
                      className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-2 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
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

              {/* Delivery Method / Courier Selector */}
              <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E4DF] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-[#5C5854] block">
                    Courier Delivery Option
                  </label>
                </div>

                <div className="p-3.5 rounded-lg border border-[#141312] bg-[#FAF9F6] space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#141312]">
                          Lalamove Delivery
                        </span>
                        <span className="text-[9px] bg-[#141312] text-white px-1.5 py-0.5 rounded font-medium">
                          Door-to-Door
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C5854] mt-1 leading-relaxed">
                        Door-to-door garment delivery and scheduled return pickup via Lalamove across all serviceable areas. Delivery fare depends on actual Lalamove app rates (distance & vehicle) and is shouldered directly by the renter upon dispatch and return.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-semibold text-xs text-[#141312]">Shouldered by Renter</span>
                      <span className="text-[9px] text-[#78716C] block">Via Lalamove App</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#5C5854] pt-2 border-t border-[#E8E4DF]">
                    <span>• Fare depends on live Lalamove app rates</span>
                    <span>• Renter pays courier directly upon booking/dispatch</span>
                    <span>• Direct rider tracking link coordinated via SMS</span>
                  </div>
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

                {/* Upload Zones: Front, Back, Live Selfie */}
                <div className="space-y-3 pt-1">
                  {/* Front ID */}
                  <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#141312]">
                        Front of {idType} *
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

                  {/* Back ID (Optional) */}
                  <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#141312]">
                        Back of Government ID (Optional)
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

                  {/* Live Selfie holding ID */}
                  <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#141312]">
                        Live Selfie Holding ID *
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
              {/* Order Price Summary Ledger */}
              <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E4DF] space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-2">
                  <span className="font-serif text-xs font-semibold text-[#141312] uppercase tracking-wider">
                    Booking Summary
                  </span>
                  <span className="text-[10px] text-[#78716C]">
                    {cart.length} Designer {cart.length === 1 ? 'Garment' : 'Garments'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#5C5854]">
                    <span>Subtotal</span>
                    <span className="font-medium text-[#141312]">{formatPHP(cartRentalSubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#5C5854]">
                    <div className="flex items-center gap-1.5">
                      <span>Refundable (50%)</span>
                      <span className="text-[9px] text-[#1E562F] bg-[#E7F0E9] px-1.5 py-0.2 rounded font-medium">
                        Refunded upon return
                      </span>
                    </div>
                    <span className="font-medium text-[#141312]">{formatPHP(cartDepositSubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#5C5854]">
                    <div className="flex items-center gap-1.5">
                      <span>Lalamove Courier Delivery</span>
                      <span className="text-[9px] text-[#141312] bg-[#F5F3EF] border border-[#E8E4DF] px-1.5 py-0.2 rounded font-medium">
                        Shouldered by Renter
                      </span>
                    </div>
                    <span className="font-medium text-[#141312] text-[11px]">
                      Paid via Lalamove App
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#E8E4DF] flex items-baseline justify-between text-xs">
                    <div>
                      <span className="font-semibold text-[#141312] block">
                        Total
                      </span>
                      <span className="text-[10px] text-[#948E88]">
                        {formatPHP(cartDepositSubtotal)} (50%) will be refunded upon garment return
                      </span>
                    </div>
                    <span className="font-serif text-base font-semibold text-[#141312]">
                      {formatPHP(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

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
                          <span className="block text-[9px] text-[#948E88] mt-0.5">
                            (Covers rental & security deposit; Lalamove delivery is paid directly by renter upon dispatch)
                          </span>
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
              <span>
                {currentStep === 1 ? 'Continue to Identity Verification' : 'Continue to Payment'}
              </span>
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
