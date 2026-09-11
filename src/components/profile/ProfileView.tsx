import React, { useState, useEffect } from 'react';
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
  Truck,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Edit3,
  Save,
  LogOut,
  Lock,
} from 'lucide-react';
import { GovernmentIdType, PHILIPPINE_GOVERNMENT_IDS, GarmentSize } from '../../types';
import { parseFullName, formatFullName } from '../../utils/formatters';

export const ProfileView: React.FC = () => {
  const {
    resetAllData,
    orders,
    wishlist,
    switchToAdmin,
    isAdminAuthenticated,
    currentUser,
    userProfile,
    loginWithGoogle,
    logoutUser,
    updateUserProfile,
    isAuthLoading,
    showToast,
    faqs,
    openFaqModal,
  } = useApp();

  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Edit states for sections
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [isEditingSizing, setIsEditingSizing] = useState(false);
  const [isEditingKYC, setIsEditingKYC] = useState(false);

  // Shipping Form with First, Middle, and Last Name
  const initialNameParts = parseFullName(
    userProfile?.shippingDetails?.fullName ||
    userProfile?.displayName ||
    currentUser?.displayName ||
    ''
  );

  const [shippingForm, setShippingForm] = useState({
    firstName: userProfile?.shippingDetails?.firstName || userProfile?.firstName || initialNameParts.firstName,
    middleName: userProfile?.shippingDetails?.middleName ?? userProfile?.middleName ?? initialNameParts.middleName,
    lastName: userProfile?.shippingDetails?.lastName || userProfile?.lastName || initialNameParts.lastName,
    fullName: userProfile?.shippingDetails?.fullName || userProfile?.displayName || currentUser?.displayName || '',
    mobileNumber: userProfile?.shippingDetails?.mobileNumber || userProfile?.phoneNumber || '',
    email: userProfile?.shippingDetails?.email || userProfile?.email || currentUser?.email || '',
    deliveryAddress: userProfile?.shippingDetails?.deliveryAddress || '',
    landmarkNotes: userProfile?.shippingDetails?.landmarkNotes || '',
    city: userProfile?.shippingDetails?.city || '',
    province: userProfile?.shippingDetails?.province || '',
    postalCode: userProfile?.shippingDetails?.postalCode || '',
  });

  // Sizing Form
  const [sizingForm, setSizingForm] = useState({
    primarySize: (userProfile?.measurements?.primarySize || 'S') as GarmentSize,
    bust: userProfile?.measurements?.bust || '',
    waist: userProfile?.measurements?.waist || '',
    hips: userProfile?.measurements?.hips || '',
    height: userProfile?.measurements?.height || '',
  });

  // KYC Form
  const [kycForm, setKycForm] = useState({
    idType: (userProfile?.kycDetails?.idType || 'Philippine Passport') as GovernmentIdType,
    idNumber: userProfile?.kycDetails?.idNumber || '',
    frontIdImage: userProfile?.kycDetails?.frontIdImage || '',
    backIdImage: userProfile?.kycDetails?.backIdImage || '',
    selfieWithIdImage: userProfile?.kycDetails?.selfieWithIdImage || '',
  });

  // Sync state when userProfile updates
  useEffect(() => {
    if (userProfile) {
      if (userProfile.shippingDetails) {
        const parsed = parseFullName(userProfile.shippingDetails.fullName || userProfile.displayName || '');
        setShippingForm({
          firstName: userProfile.shippingDetails.firstName || userProfile.firstName || parsed.firstName,
          middleName: userProfile.shippingDetails.middleName ?? userProfile.middleName ?? parsed.middleName,
          lastName: userProfile.shippingDetails.lastName || userProfile.lastName || parsed.lastName,
          fullName: userProfile.shippingDetails.fullName || userProfile.displayName || '',
          mobileNumber: userProfile.shippingDetails.mobileNumber || '',
          email: userProfile.shippingDetails.email || userProfile.email || '',
          deliveryAddress: userProfile.shippingDetails.deliveryAddress || '',
          landmarkNotes: userProfile.shippingDetails.landmarkNotes || '',
          city: userProfile.shippingDetails.city || '',
          province: userProfile.shippingDetails.province || '',
          postalCode: userProfile.shippingDetails.postalCode || '',
        });
      }
      if (userProfile.measurements) {
        setSizingForm({
          primarySize: userProfile.measurements.primarySize || 'S',
          bust: userProfile.measurements.bust || '',
          waist: userProfile.measurements.waist || '',
          hips: userProfile.measurements.hips || '',
          height: userProfile.measurements.height || '',
        });
      }
      if (userProfile.kycDetails) {
        setKycForm({
          idType: (userProfile.kycDetails.idType || 'Philippine Passport') as GovernmentIdType,
          idNumber: userProfile.kycDetails.idNumber || '',
          frontIdImage: userProfile.kycDetails.frontIdImage || '',
          backIdImage: userProfile.kycDetails.backIdImage || '',
          selfieWithIdImage: userProfile.kycDetails.selfieWithIdImage || '',
        });
      }
    }
  }, [userProfile]);

  const handleSaveShipping = async () => {
    const combinedFullName = formatFullName(
      shippingForm.firstName,
      shippingForm.middleName,
      shippingForm.lastName
    ) || shippingForm.fullName;

    await updateUserProfile({
      firstName: shippingForm.firstName.trim(),
      middleName: shippingForm.middleName ? shippingForm.middleName.trim() : undefined,
      lastName: shippingForm.lastName.trim(),
      displayName: combinedFullName || userProfile?.displayName || 'Sinta Renter',
      shippingDetails: {
        ...shippingForm,
        firstName: shippingForm.firstName.trim(),
        middleName: shippingForm.middleName ? shippingForm.middleName.trim() : undefined,
        lastName: shippingForm.lastName.trim(),
        fullName: combinedFullName,
        deliveryMethod: 'lalamove',
        shippingFee: 0,
      },
    });
    setShippingForm((prev) => ({
      ...prev,
      fullName: combinedFullName,
    }));
    setIsEditingShipping(false);
  };

  const handleSaveSizing = async () => {
    await updateUserProfile({
      measurements: sizingForm,
    });
    setIsEditingSizing(false);
  };

  const handleSaveKYC = async () => {
    await updateUserProfile({
      kycDetails: {
        idType: kycForm.idType,
        idNumber: kycForm.idNumber,
        frontIdImage: kycForm.frontIdImage,
        backIdImage: kycForm.backIdImage || undefined,
        selfieWithIdImage: kycForm.selfieWithIdImage,
        isVerified: true,
        uploadedAt: new Date().toISOString(),
      },
    });
    setIsEditingKYC(false);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'frontIdImage' | 'backIdImage' | 'selfieWithIdImage'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setKycForm((prev) => ({ ...prev, [field]: reader.result as string }));
        showToast('Document image uploaded');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-32 space-y-5 animate-fadeIn">
      {/* Google Sign-in Banner if Not Authenticated */}
      {!currentUser ? (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E8E4DF] p-5 shadow-sm space-y-3.5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#141312] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#E8E4DF]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base font-semibold text-[#141312]">
                  Optional Google Registration
                </h2>
                <span className="text-[10px] bg-[#FAF9F6] border border-[#E8E4DF] text-[#80232F] px-2 py-0.5 rounded-full font-medium">
                  Cloud Persistence
                </span>
              </div>
              <p className="text-xs text-[#5C5854] mt-1 leading-relaxed">
                Sign in with Google to reuse your uploaded shipping addresses, government ID verification, and sizing silhouette across all visits and devices.
              </p>
            </div>
          </div>

          <button
            id="btn-profile-google-login"
            type="button"
            disabled={isAuthLoading}
            onClick={loginWithGoogle}
            className="w-full h-11 bg-[#FFFFFF] hover:bg-[#F5F3EF] border border-[#D0C9C0] text-[#141312] font-medium text-xs rounded-xl flex items-center justify-center gap-3 shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
            <span>{isAuthLoading ? 'Connecting to Google...' : 'Sign in with Google Account'}</span>
          </button>
        </div>
      ) : (
        /* Authenticated Account Profile Header */
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E8E4DF] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            {userProfile?.photoURL || currentUser.photoURL ? (
              <img
                src={userProfile?.photoURL || currentUser.photoURL || ''}
                alt="Avatar"
                className="w-14 h-14 rounded-full border border-[#E8E4DF] object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#FAF9F6] border border-[#E8E4DF] flex items-center justify-center text-[#141312] font-serif text-lg font-medium shrink-0">
                {(userProfile?.displayName || currentUser.displayName || 'U').slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base font-semibold text-[#141312] truncate">
                  {userProfile?.displayName || currentUser.displayName || 'Sinta Renter'}
                </h2>
                <span className="bg-[#FAF9F6] border border-[#E8E4DF] text-[#141312] text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <Award className="w-3 h-3 text-[#141312]" />
                  {userProfile?.membershipTier || 'VIP Member'}
                </span>
              </div>
              <p className="text-xs text-[#5C5854] mt-0.5 truncate">{currentUser.email}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#1E562F]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Google Account Connected • Database Synced</span>
              </div>
            </div>
          </div>

          <button
            id="btn-profile-logout"
            onClick={logoutUser}
            className="px-3 py-1.5 bg-[#FAF9F6] hover:bg-[#F5F3EF] border border-[#E8E4DF] text-[#5C5854] hover:text-[#B91C1C] text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors shrink-0 self-start sm:self-center cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Renter Statistics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E8E4DF] text-center">
          <span className="text-[10px] uppercase font-medium text-[#948E88] tracking-wider block">
            Active & Past Bookings
          </span>
          <span className="font-serif text-lg font-semibold text-[#141312] mt-0.5 block">
            {orders.length}
          </span>
        </div>
        <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E8E4DF] text-center">
          <span className="text-[10px] uppercase font-medium text-[#948E88] tracking-wider block">
            Saved in Wishlist
          </span>
          <span className="font-serif text-lg font-semibold text-[#141312] mt-0.5 block">
            {wishlist.length}
          </span>
        </div>
      </div>

      {/* 1. Reusable Shipping Details Card */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-2.5">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#141312]" />
            <h3 className="font-serif text-xs font-semibold text-[#141312]">
              Reusable Delivery & Shipping Details
            </h3>
          </div>
          <button
            onClick={() => setIsEditingShipping(!isEditingShipping)}
            className="text-xs font-medium text-[#141312] hover:text-[#5C5854] flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEditingShipping ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        {isEditingShipping ? (
          <div className="space-y-3 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                  First Name *
                </label>
                <input
                  id="profile-shipping-first-name"
                  type="text"
                  value={shippingForm.firstName}
                  onChange={(e) => setShippingForm({ ...shippingForm, firstName: e.target.value })}
                  placeholder="e.g. Maria Clara"
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                  Middle Name <span className="text-[#948E88] font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="profile-shipping-middle-name"
                  type="text"
                  value={shippingForm.middleName}
                  onChange={(e) => setShippingForm({ ...shippingForm, middleName: e.target.value })}
                  placeholder="e.g. Santos"
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                  Last Name *
                </label>
                <input
                  id="profile-shipping-last-name"
                  type="text"
                  value={shippingForm.lastName}
                  onChange={(e) => setShippingForm({ ...shippingForm, lastName: e.target.value })}
                  placeholder="e.g. Dela Cruz"
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                  Mobile Number
                </label>
                <input
                  id="profile-shipping-mobile"
                  type="text"
                  value={shippingForm.mobileNumber}
                  onChange={(e) => setShippingForm({ ...shippingForm, mobileNumber: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                  Email Address
                </label>
                <input
                  id="profile-shipping-email"
                  type="email"
                  value={shippingForm.email}
                  onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                Delivery Address
              </label>
              <textarea
                rows={2}
                value={shippingForm.deliveryAddress}
                onChange={(e) => setShippingForm({ ...shippingForm, deliveryAddress: e.target.value })}
                className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={shippingForm.city}
                  onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                  Province
                </label>
                <input
                  type="text"
                  value={shippingForm.province}
                  onChange={(e) => setShippingForm({ ...shippingForm, province: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={shippingForm.postalCode}
                  onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                Landmark / Concierge Dispatch Notes
              </label>
              <input
                type="text"
                value={shippingForm.landmarkNotes}
                onChange={(e) => setShippingForm({ ...shippingForm, landmarkNotes: e.target.value })}
                className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
              />
            </div>

            <button
              onClick={handleSaveShipping}
              className="w-full py-2 bg-[#141312] text-white text-xs font-medium rounded-md hover:bg-[#2A2725] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Reusable Delivery Details to Database</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1.5 text-xs text-[#5C5854]">
            {shippingForm.firstName || shippingForm.lastName || shippingForm.fullName || shippingForm.deliveryAddress ? (
              <>
                <p className="font-medium text-[#141312]">
                  {formatFullName(shippingForm.firstName, shippingForm.middleName, shippingForm.lastName) || shippingForm.fullName}{' '}
                  {shippingForm.mobileNumber ? `• ${shippingForm.mobileNumber}` : ''}
                </p>
                {(shippingForm.firstName || shippingForm.lastName) && (
                  <p className="text-[11px] text-[#78716C]">
                    Given: <span className="font-medium text-[#141312]">{shippingForm.firstName || '—'}</span>
                    {shippingForm.middleName ? <> • Middle: <span className="font-medium text-[#141312]">{shippingForm.middleName}</span></> : null}
                    {' '}• Surname: <span className="font-medium text-[#141312]">{shippingForm.lastName || '—'}</span>
                  </p>
                )}
                <p>{[shippingForm.deliveryAddress, shippingForm.city, shippingForm.province, shippingForm.postalCode].filter(Boolean).join(', ')}</p>
                {shippingForm.landmarkNotes && (
                  <p className="text-[11px] text-[#78716C] italic">Note: {shippingForm.landmarkNotes}</p>
                )}
                <div className="pt-1 flex items-center gap-1.5 text-[10px] text-[#1E562F]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Auto-filled at checkout</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#948E88] italic">No delivery address saved yet. Click Edit to set your reusable address.</p>
            )}
          </div>
        )}
      </div>

      {/* 2. Reusable Government ID KYC Verification Card */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#80232F]" />
            <h3 className="font-serif text-xs font-semibold text-[#141312]">
              Reusable Government ID & Identity KYC
            </h3>
          </div>
          <button
            onClick={() => setIsEditingKYC(!isEditingKYC)}
            className="text-xs font-medium text-[#141312] hover:text-[#5C5854] flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEditingKYC ? 'Cancel' : (kycForm.idNumber || kycForm.frontIdImage ? 'Update ID' : 'Add ID')}</span>
          </button>
        </div>

        {isEditingKYC ? (
          <div className="space-y-3 animate-fadeIn text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                  ID Document Type
                </label>
                <select
                  value={kycForm.idType}
                  onChange={(e) => setKycForm({ ...kycForm, idType: e.target.value as GovernmentIdType })}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
                >
                  {PHILIPPINE_GOVERNMENT_IDS.map((govId) => (
                    <option key={govId} value={govId}>
                      {govId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                  ID Number
                </label>
                <input
                  type="text"
                  value={kycForm.idNumber}
                  onChange={(e) => setKycForm({ ...kycForm, idNumber: e.target.value })}
                  placeholder="e.g. P8920412B"
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
                />
              </div>
            </div>

            {/* ID Images Upload */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-[#78716C] uppercase block mb-1">Front ID</span>
                <div className="relative aspect-[16/10] rounded-lg border border-[#E8E4DF] overflow-hidden bg-[#FAF9F6] flex items-center justify-center">
                  {kycForm.frontIdImage ? (
                    <img src={kycForm.frontIdImage} alt="Front ID" className="w-full h-full object-cover" />
                  ) : (
                    <UploadCloud className="w-5 h-5 text-[#948E88]" />
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium cursor-pointer">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'frontIdImage')}
                    />
                  </label>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#78716C] uppercase block mb-1">Selfie with ID</span>
                <div className="relative aspect-[16/10] rounded-lg border border-[#E8E4DF] overflow-hidden bg-[#FAF9F6] flex items-center justify-center">
                  {kycForm.selfieWithIdImage ? (
                    <img src={kycForm.selfieWithIdImage} alt="Selfie with ID" className="w-full h-full object-cover" />
                  ) : (
                    <UploadCloud className="w-5 h-5 text-[#948E88]" />
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium cursor-pointer">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'selfieWithIdImage')}
                    />
                  </label>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveKYC}
              className="w-full py-2 bg-[#141312] text-white text-xs font-medium rounded-md hover:bg-[#2A2725] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Verified ID to Database</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs">
            {kycForm.idNumber || kycForm.frontIdImage ? (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#141312]">{kycForm.idType}</span>
                    <span className="text-[10px] bg-[#FAF9F6] border border-[#E8E4DF] text-[#5C5854] px-1.5 py-0.2 rounded font-mono">
                      {kycForm.idNumber || 'Uploaded ID'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#78716C]">
                    Government ID credentials saved • Reusable across all rentals
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#1E562F] bg-[#E7F0E9] px-2 py-1 rounded-full font-medium shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>VIP KYC</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#948E88] italic">No government ID uploaded yet. Click Add ID to save your credentials.</p>
            )}
          </div>
        )}
      </div>

      {/* 3. Saved Silhouette Measurements */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-2.5">
          <h3 className="font-serif text-xs font-semibold text-[#141312] flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-[#141312] stroke-[1.5]" />
            <span>Saved Silhouette Sizing Profile</span>
          </h3>
          <button
            onClick={() => setIsEditingSizing(!isEditingSizing)}
            className="text-xs font-medium text-[#141312] hover:text-[#5C5854] flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEditingSizing ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        {isEditingSizing ? (
          <div className="space-y-3 animate-fadeIn text-xs">
            <div>
              <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                Primary Standard Size
              </label>
              <select
                value={sizingForm.primarySize}
                onChange={(e) => setSizingForm({ ...sizingForm, primarySize: e.target.value as GarmentSize })}
                className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2.5 py-1.5 text-xs text-[#141312]"
              >
                {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].map((s) => (
                  <option key={s} value={s}>
                    Size {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                  Bust
                </label>
                <input
                  type="text"
                  value={sizingForm.bust}
                  onChange={(e) => setSizingForm({ ...sizingForm, bust: e.target.value })}
                  placeholder={'33"'}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2 py-1.5 text-xs text-center text-[#141312]"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                  Waist
                </label>
                <input
                  type="text"
                  value={sizingForm.waist}
                  onChange={(e) => setSizingForm({ ...sizingForm, waist: e.target.value })}
                  placeholder={'26"'}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2 py-1.5 text-xs text-center text-[#141312]"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                  Hips
                </label>
                <input
                  type="text"
                  value={sizingForm.hips}
                  onChange={(e) => setSizingForm({ ...sizingForm, hips: e.target.value })}
                  placeholder={'36"'}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2 py-1.5 text-xs text-center text-[#141312]"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#78716C] uppercase block mb-1">
                  Height
                </label>
                <input
                  type="text"
                  value={sizingForm.height}
                  onChange={(e) => setSizingForm({ ...sizingForm, height: e.target.value })}
                  placeholder={"5'6\""}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-md px-2 py-1.5 text-xs text-center text-[#141312]"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSizing}
              className="w-full py-2 bg-[#141312] text-white text-xs font-medium rounded-md hover:bg-[#2A2725] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Measurements to Database</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#78716C]">Fitted Silhouette Baseline</span>
              <span className="text-[10px] bg-[#FAF9F6] text-[#141312] border border-[#E8E4DF] px-2 py-0.5 rounded font-medium">
                Primary: Size {sizingForm.primarySize}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-[#FAF9F6] p-2 rounded-lg border border-[#E8E4DF]">
                <span className="text-[9px] text-[#948E88] uppercase block">Bust</span>
                <span className="font-medium text-[#141312] mt-0.5 block">{sizingForm.bust || '—'}</span>
              </div>
              <div className="bg-[#FAF9F6] p-2 rounded-lg border border-[#E8E4DF]">
                <span className="text-[9px] text-[#948E88] uppercase block">Waist</span>
                <span className="font-medium text-[#141312] mt-0.5 block">{sizingForm.waist || '—'}</span>
              </div>
              <div className="bg-[#FAF9F6] p-2 rounded-lg border border-[#E8E4DF]">
                <span className="text-[9px] text-[#948E88] uppercase block">Hips</span>
                <span className="font-medium text-[#141312] mt-0.5 block">{sizingForm.hips || '—'}</span>
              </div>
              <div className="bg-[#FAF9F6] p-2 rounded-lg border border-[#E8E4DF]">
                <span className="text-[9px] text-[#948E88] uppercase block">Height</span>
                <span className="font-medium text-[#141312] mt-0.5 block">{sizingForm.height || '—'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAQ & Guidelines Accordion */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-2.5">
          <h3 className="font-serif text-xs font-semibold text-[#141312] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#141312] stroke-[1.5]" />
            <span>Sinta Wardrobe Rental FAQs & Policy</span>
          </h3>
          <button
            type="button"
            id="btn-profile-open-faqs"
            onClick={() => openFaqModal()}
            className="text-[11px] font-medium text-[#80232F] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Search & View All</span>
          </button>
        </div>

        <div className="divide-y divide-[#E8E4DF]">
          {faqs.slice(0, 5).map((faq, idx) => (
            <div key={faq.id || idx} className="py-2.5">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left text-xs font-medium text-[#141312] hover:text-[#5C5854] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 pr-2">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-[#80232F] bg-[#80232F]/10 px-1.5 py-0.5 rounded shrink-0">
                    {faq.category || 'general'}
                  </span>
                  <span className="font-serif text-xs font-semibold text-[#141312]">{faq.question}</span>
                </div>
                {openFaq === idx ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#948E88] shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#948E88] shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <p className="text-xs text-[#5C5854] mt-2 leading-relaxed pl-1 whitespace-pre-line">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>

        {faqs.length > 5 && (
          <button
            type="button"
            onClick={() => openFaqModal()}
            className="w-full py-2 text-center text-xs font-medium text-[#141312] bg-[#FAF9F6] hover:bg-[#F5F3EF] border border-[#E8E4DF] rounded-lg transition-colors cursor-pointer mt-1"
          >
            View all {faqs.length} FAQs & Guidelines
          </button>
        )}
      </div>

      {/* Staff & Admin Portal Access */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E8E4DF] p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#141312]" />
            <h3 className="font-serif text-xs font-semibold text-[#141312]">
              Sinta Operations & Verification Portal
            </h3>
          </div>
          <span className="text-[9px] bg-[#FAF9F6] border border-[#E8E4DF] text-[#5C5854] px-1.5 py-0.5 rounded font-mono uppercase">
            {isAdminAuthenticated ? '2FA Verified' : '2FA Protected'}
          </span>
        </div>
        <p className="text-xs text-[#5C5854] leading-relaxed">
          Access the backend management console to review government IDs, verify GCash/Bank transfer receipts, manage garment inventory, and authorize dispatch.
        </p>
        <button
          id="btn-profile-open-admin"
          onClick={switchToAdmin}
          className="w-full py-2 bg-[#FAF9F6] hover:bg-[#141312] text-[#141312] hover:text-white border border-[#E8E4DF] hover:border-[#141312] text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isAdminAuthenticated ? 'Launch Admin Verification Console' : 'Authenticate with 2FA & Launch Console'}</span>
        </button>
      </div>

      {/* Chat with Us & Reset Actions */}
      <div className="space-y-2">
        <a
          id="btn-profile-chat-with-us"
          href="https://www.facebook.com/profile.php?id=61594416564619"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-10 bg-[#141312] hover:bg-[#2A2725] text-white font-medium text-xs rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Chat with us</span>
        </a>

        <button
          onClick={resetAllData}
          className="w-full py-2 text-xs text-[#948E88] hover:text-[#B91C1C] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Local Bag & Saved Session</span>
        </button>
      </div>

      <ConciergeModal
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
      />
    </div>
  );
};
