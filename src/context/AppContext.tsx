import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Garment,
  GarmentCategory,
  CartItem,
  RentalOrder,
  OrderStatus,
  ShippingDetails,
  KYCData,
  PaymentData,
  GarmentSize,
  ViewMode,
  CustomerTab,
  RentalsFilterType,
  AdminTab,
  Admin2FAEmail,
  FirestoreCategory,
  FirestoreStore,
  FirestoreProductVariation,
  UserProfile,
  UserMeasurements,
  RentalPricingConfig,
  CheckoutConfig,
  FAQItem,
} from '../types';
import { MOCK_GARMENTS } from '../data/garments';
import { INITIAL_MOCK_ORDERS } from '../data/initialOrders';
import {
  subscribeToFirestoreProducts,
  saveGarmentToFirestore,
  deleteGarmentFromFirestore,
  purgeDemoGarmentsFromFirestore,
  normalizeFirestoreCatalogDatabase,
  getCachedGarmentsFromLocalStorage,
  subscribeToFirestoreCategories,
  subscribeToFirestoreStores,
  fetchProductVariationsFromFirestore,
  fetchRentalPricingConfigFromFirestore,
  saveRentalPricingConfigToFirestore,
} from '../services/firestoreProducts';
import {
  getCachedCheckoutConfig,
  setCachedCheckoutConfig,
  fetchCheckoutConfigFromFirestore,
  saveCheckoutConfigToFirestore,
  DEFAULT_CHECKOUT_CONFIG,
  DEFAULT_FAQS,
} from '../services/firestoreConfig';
import { auth, signInWithGoogle, signOutCurrentUser } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  getUserProfileFromFirestore,
  saveUserProfileToFirestore,
  syncUserProfileOnGoogleLogin,
  subscribeToUserProfile,
} from '../services/firestoreUsers';

export interface GarmentSelectionState {
  variationIndex: number;
  colorName?: string;
  size?: GarmentSize;
}

interface AppContextType {
  // Mode Separation (User / Customer vs Admin / Backoffice)
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  switchToAdmin: () => void;
  switchToUser: () => void;

  // Google User Authentication & Reusable Profile
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAuthLoading: boolean;
  isGoogleLoginModalOpen: boolean;
  setIsGoogleLoginModalOpen: (open: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;

  // 2FA Admin Authentication
  isAdminAuthenticated: boolean;
  adminEmail: string;
  setAdminEmail: (email: string) => void;
  isAdmin2FAOpen: boolean;
  setIsAdmin2FAOpen: (open: boolean) => void;
  admin2FACode: string | null;
  admin2FACodeSentAt: number | null;
  admin2FAEmailPreview: Admin2FAEmail | null;
  sendAdmin2FACode: (targetEmail?: string) => { success: boolean; code: string; email: string };
  verifyAdmin2FACode: (code: string) => boolean;
  logoutAdmin: () => void;

  // Customer Navigation & Screens
  activeTab: CustomerTab | 'admin';
  setActiveTab: (tab: CustomerTab | 'admin') => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  selectedGarment: Garment | null;
  setSelectedGarment: (garment: Garment | null, selection?: Partial<GarmentSelectionState>) => void;
  restoreCollectionScroll: () => boolean;
  garmentSelections: Record<string, GarmentSelectionState>;
  setGarmentSelection: (garmentId: string, selection: Partial<GarmentSelectionState>) => void;
  activeOrderId: string | null;
  setActiveOrderId: (orderId: string | null) => void;
  rentalsFilter: RentalsFilterType;
  setRentalsFilter: (filter: RentalsFilterType) => void;
  navigateToRentals: (filter?: RentalsFilterType, orderId?: string | null) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  checkoutStep: number;
  setCheckoutStep: (step: number) => void;

  // Catalog Filters
  selectedCategory: GarmentCategory;
  setSelectedCategory: (category: GarmentCategory) => void;
  selectedShop: string;
  setSelectedShop: (shop: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'featured';
  setSortBy: (sort: 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'featured') => void;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (garmentId: string) => void;

  // Configurable Rental Pricing & Durations (default: [4, 8, 12, 16], base markup: 500, extra per 4d: 500)
  rentalPricingConfig: RentalPricingConfig;
  updateRentalPricingConfig: (updates: Partial<RentalPricingConfig>) => Promise<void>;
  configuredDurations: number[];
  setConfiguredDurations: (durations: number[]) => void;

  // Configurable Checkout & Payment Details & Legal Content
  checkoutConfig: CheckoutConfig;
  updateCheckoutConfig: (updates: Partial<CheckoutConfig>) => Promise<void>;
  resetCheckoutConfigToDefaults: () => Promise<void>;

  // Configurable FAQs & Policies Modal
  faqs: FAQItem[];
  isFaqModalOpen: boolean;
  setIsFaqModalOpen: (open: boolean) => void;
  openFaqModal: (category?: string) => void;
  activeFaqCategory: string | null;
  setActiveFaqCategory: (category: string | null) => void;

  // Garments / Products data from Firestore
  garments: Garment[];
  categories: FirestoreCategory[];
  stores: FirestoreStore[];
  fetchVariations: (garment: Garment) => Promise<FirestoreProductVariation[]>;
  isFirestoreLoading: boolean;
  firestoreSource: 'firestore' | 'seed';
  saveGarment: (garment: Garment) => Promise<void>;
  deleteGarment: (garmentId: string) => Promise<void>;
  purgeDemoGarments: () => Promise<void>;
  normalizeFirestoreDatabase: () => Promise<{ mergedCount: number; createdUnifiedCount: number; details: string[] }>;

  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'addedAt'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItem: (cartItemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  cartCount: number;
  cartRentalSubtotal: number;
  cartDepositSubtotal: number;
  cartGrandTotal: number;

  // Orders
  orders: RentalOrder[];
  createOrder: (
    shipping: ShippingDetails,
    kyc: KYCData,
    payment: PaymentData
  ) => RentalOrder;
  updateOrderStatus: (
    orderId: string,
    newStatus: OrderStatus,
    adminNote?: string
  ) => void;
  deleteOrder: (orderId: string) => void;
  resetAllData: () => void;

  // UI Toast / Notification
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'atelier_rentals_cart_v2';
const ORDERS_STORAGE_KEY = 'atelier_rentals_orders_v2';
const WISHLIST_STORAGE_KEY = 'atelier_rentals_wishlist_v2';
const ADMIN_AUTH_STORAGE_KEY = 'atelier_admin_2fa_auth_v1';

const parseAdminRoute = (): { isAdmin: boolean; tab: AdminTab } => {
  if (typeof window === 'undefined') {
    return { isAdmin: false, tab: 'verification' };
  }
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const isAdmin = path === '/admin' || path.startsWith('/admin/') || hash === '#/admin' || hash.startsWith('#/admin/');
  
  let tab: AdminTab = 'verification';
  if (path.includes('/inventory') || hash.includes('/inventory')) {
    tab = 'inventory';
  } else if (path.includes('/ledger') || hash.includes('/ledger')) {
    tab = 'ledger';
  } else if (path.includes('/settings') || hash.includes('/settings')) {
    tab = 'settings';
  } else if (path.includes('/verification') || hash.includes('/verification')) {
    tab = 'verification';
  }

  return { isAdmin, tab };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialRoute = parseAdminRoute();
  const [viewMode, setViewModeState] = useState<ViewMode>(initialRoute.isAdmin ? 'admin' : 'user');
  const [activeTab, setActiveTabState] = useState<CustomerTab | 'admin'>('explore');
  const [adminTab, setAdminTabState] = useState<AdminTab>(initialRoute.tab);
  const [selectedGarment, setSelectedGarmentState] = useState<Garment | null>(null);
  const [garmentSelections, setGarmentSelections] = useState<Record<string, GarmentSelectionState>>({});

  // Preserve collection scroll position and active garment ID for seamless back navigation
  const lastScrollYRef = useRef<number>(0);
  const lastGarmentIdRef = useRef<string | null>(null);

  const setGarmentSelection = (garmentId: string, selection: Partial<GarmentSelectionState>) => {
    setGarmentSelections((prev) => {
      const existing = prev[garmentId] || { variationIndex: 0 };
      return {
        ...prev,
        [garmentId]: {
          ...existing,
          ...selection,
        },
      };
    });
  };

  const setSelectedGarment = (
    garment: Garment | null,
    selection?: Partial<GarmentSelectionState>
  ) => {
    if (garment) {
      // Capture the current scroll position and target garment before entering PDP
      lastScrollYRef.current = window.scrollY || document.documentElement.scrollTop || 0;
      lastGarmentIdRef.current = garment.id;
      setActiveTabState('explore');
      if (selection) {
        setGarmentSelection(garment.id, selection);
      }
    }
    setSelectedGarmentState(garment);
  };

  const restoreCollectionScroll = useCallback(() => {
    const targetId = lastGarmentIdRef.current;
    const targetEl = targetId ? document.getElementById(`garment-card-${targetId}`) : null;

    // Restore exact scroll position if saved
    if (lastScrollYRef.current > 0) {
      window.scrollTo({ top: lastScrollYRef.current, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = lastScrollYRef.current;
      document.body.scrollTop = lastScrollYRef.current;
    }

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      // Check if item is comfortably visible in the viewport
      const isVisible = rect.top >= 70 && rect.bottom <= viewportHeight - 70;

      if (!isVisible) {
        targetEl.scrollIntoView({ behavior: 'instant', block: 'center' });
      }

      // Add a subtle brief focus ring so renter immediately recognizes their selected product
      targetEl.classList.add('ring-2', 'ring-[#80232F]/50', 'ring-offset-2');
      setTimeout(() => {
        targetEl.classList.remove('ring-2', 'ring-[#80232F]/50', 'ring-offset-2');
      }, 1400);

      return true;
    } else if (lastScrollYRef.current > 0) {
      return true;
    }
    return false;
  }, []);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [rentalsFilter, setRentalsFilter] = useState<RentalsFilterType>('all');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);

  // Google Authentication & User Profile State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isGoogleLoginModalOpen, setIsGoogleLoginModalOpen] = useState<boolean>(false);

  // Monitor Google Authentication State changes
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Load or initialize user profile in Firestore
          const profile = await syncUserProfileOnGoogleLogin(user);
          setUserProfile(profile);

          // Listen for profile changes in real-time
          if (unsubscribeProfile) unsubscribeProfile();
          unsubscribeProfile = subscribeToUserProfile(user.uid, (updatedProfile) => {
            if (updatedProfile) {
              setUserProfile(updatedProfile);
            }
          });
        } catch (err) {
          console.error('[AppContext] Failed to initialize user profile:', err);
        }
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setUserProfile(null);
      }
      setIsAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setIsAuthLoading(true);
      const user = await signInWithGoogle();
      const profile = await syncUserProfileOnGoogleLogin(user);
      setUserProfile(profile);
      showToast(`Welcome back, ${profile.displayName || user.displayName || 'Renter'}!`);
      setIsGoogleLoginModalOpen(false);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        showToast('Google Sign-In was cancelled.');
      } else {
        showToast('Could not complete Google Sign-In. Please retry.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      await signOutCurrentUser();
      setUserProfile(null);
      setCurrentUser(null);
      showToast('Signed out of Sinta.');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser && !userProfile) {
      showToast('Please sign in with Google to save profile details.');
      return;
    }
    const uid = currentUser?.uid || userProfile?.uid;
    if (!uid) return;

    const currentData = userProfile || {
      uid,
      email: currentUser?.email || '',
      displayName: currentUser?.displayName || 'Sinta Renter',
      isRegistered: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const merged: UserProfile = {
      ...currentData,
      ...updates,
      uid,
    };

    setUserProfile(merged);
    try {
      await saveUserProfileToFirestore(merged);
      showToast('Saved your profile & reusable details to database.');
    } catch (err) {
      console.error('Failed to update user profile in Firestore:', err);
      showToast('Saved details locally.');
    }
  };

  // 2FA Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [isAdmin2FAOpen, setIsAdmin2FAOpen] = useState<boolean>(false);
  const [admin2FACode, setAdmin2FACode] = useState<string | null>(null);
  const [admin2FACodeSentAt, setAdmin2FACodeSentAt] = useState<number | null>(null);
  const [admin2FAEmailPreview, setAdmin2FAEmailPreview] = useState<Admin2FAEmail | null>(null);

  // Sync route changes on browser back/forward and hash changes
  useEffect(() => {
    const handleLocationChange = () => {
      const route = parseAdminRoute();
      setViewModeState(route.isAdmin ? 'admin' : 'user');
      if (route.isAdmin) {
        setAdminTabState(route.tab);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Send 6-Digit Verification Code to Admin Email
  const sendAdmin2FACode = (targetEmail?: string) => {
    const emailToUse = (targetEmail || adminEmail).trim();
    if (emailToUse) {
      setAdminEmail(emailToUse);
    }
    // Generate secure 6-digit OTP code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setAdmin2FACode(generatedCode);
    setAdmin2FACodeSentAt(Date.now());

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const emailPreview: Admin2FAEmail = {
      to: emailToUse,
      code: generatedCode,
      timestamp: timeString,
      expiresInMinutes: 10,
    };
    setAdmin2FAEmailPreview(emailPreview);
    showToast(`2FA code sent to ${emailToUse}`);

    return { success: true, code: generatedCode, email: emailToUse };
  };

  // Verify 6-Digit Admin Verification Code
  const verifyAdmin2FACode = (inputCode: string) => {
    const cleanInput = inputCode.trim();
    // Allow either the newly generated 6-digit code or standard dev bypass code
    if ((admin2FACode && cleanInput === admin2FACode) || cleanInput === '123456') {
      setIsAdminAuthenticated(true);
      try {
        sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true');
      } catch {
        // ignore storage error
      }
      setIsAdmin2FAOpen(false);
      setViewModeState('admin');
      showToast('Two-Factor Authentication verified. Access granted.');
      return true;
    }
    return false;
  };

  // Set ViewMode with browser URL synchronization
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      if (mode === 'admin') {
        const targetPath = adminTab === 'verification' ? '/admin' : `/admin/${adminTab}`;
        if (window.location.pathname !== targetPath) {
          window.history.pushState(null, '', targetPath);
        }
      } else {
        if (window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#/admin')) {
          window.history.pushState(null, '', '/');
        }
      }
    }
  };

  // Switch Admin tab with URL update
  const setAdminTab = (tab: AdminTab) => {
    setAdminTabState(tab);
    if (typeof window !== 'undefined' && viewMode === 'admin') {
      const targetPath = tab === 'verification' ? '/admin' : `/admin/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  // Logout / Lock Admin Console
  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    showToast('Admin session locked.');
  };

  const switchToAdmin = (targetTab: AdminTab = 'verification') => {
    setSelectedGarmentState(null);
    setViewModeState('admin');
    setAdminTabState(targetTab);
    if (typeof window !== 'undefined') {
      const targetPath = targetTab === 'verification' ? '/admin' : `/admin/${targetTab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  const switchToUser = () => {
    setSelectedGarmentState(null);
    setViewModeState('user');
    if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#/admin'))) {
      window.history.pushState(null, '', '/');
    }
  };

  const setActiveTab = (tab: CustomerTab | 'admin') => {
    setSelectedGarmentState(null);
    if (tab === 'admin') {
      switchToAdmin();
    } else {
      setActiveTabState(tab);
    }
  };

  const navigateToRentals = (filter: RentalsFilterType = 'all', orderId: string | null = null) => {
    setSelectedGarmentState(null);
    switchToUser();
    setRentalsFilter(filter);
    setActiveOrderId(orderId);
    setActiveTabState('my-rentals');
  };

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<GarmentCategory>('All');
  const [selectedShop, setSelectedShop] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'rating' | 'featured'>('newest');

  // Configurable rental pricing and duration options (default: 4, 8, 12, 16 days; base markup 500; 500 per 4 days)
  const DEFAULT_PRICING_CONFIG: RentalPricingConfig = {
    baseRentalDays: 4,
    baseMarkup: 500,
    extraRatePer4Days: 500,
    durationOptions: [4, 8, 12, 16],
  };
  const RENTAL_PRICING_STORAGE_KEY = 'sinta_rental_pricing_config_v2';

  const [rentalPricingConfig, setRentalPricingConfigState] = useState<RentalPricingConfig>(() => {
    try {
      const saved = localStorage.getItem(RENTAL_PRICING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          baseRentalDays: Number(parsed.baseRentalDays) || 4,
          baseMarkup: parsed.baseMarkup !== undefined ? Number(parsed.baseMarkup) : 500,
          extraRatePer4Days: parsed.extraRatePer4Days !== undefined ? Number(parsed.extraRatePer4Days) : 500,
          durationOptions:
            Array.isArray(parsed.durationOptions) && parsed.durationOptions.length > 0
              ? parsed.durationOptions
              : [4, 8, 12, 16],
        };
      }
    } catch {}
    return DEFAULT_PRICING_CONFIG;
  });

  const configuredDurations = rentalPricingConfig.durationOptions;

  const setConfiguredDurations = (durations: number[]) => {
    const sorted = Array.from(new Set(durations)).sort((a, b) => a - b);
    const updated: RentalPricingConfig = {
      ...rentalPricingConfig,
      durationOptions: sorted.length > 0 ? sorted : [4, 8, 12, 16],
    };
    setRentalPricingConfigState(updated);
    try {
      localStorage.setItem(RENTAL_PRICING_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    saveRentalPricingConfigToFirestore(updated).catch(() => {});
  };

  const updateRentalPricingConfig = async (updates: Partial<RentalPricingConfig>) => {
    const updated: RentalPricingConfig = {
      ...rentalPricingConfig,
      ...updates,
      durationOptions: updates.durationOptions
        ? Array.from(new Set(updates.durationOptions)).sort((a, b) => a - b)
        : rentalPricingConfig.durationOptions,
    };
    setRentalPricingConfigState(updated);
    try {
      localStorage.setItem(RENTAL_PRICING_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    await saveRentalPricingConfigToFirestore(updated);
  };

  // Sync pricing config from Firestore on mount
  useEffect(() => {
    fetchRentalPricingConfigFromFirestore()
      .then((remoteConfig) => {
        if (remoteConfig) {
          setRentalPricingConfigState((prev) => ({
            ...prev,
            ...remoteConfig,
            durationOptions:
              remoteConfig.durationOptions && remoteConfig.durationOptions.length > 0
                ? remoteConfig.durationOptions
                : [4, 8, 12, 16],
          }));
          try {
            localStorage.setItem(RENTAL_PRICING_STORAGE_KEY, JSON.stringify(remoteConfig));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Configurable Checkout Details (GCash, Bank Accounts, Terms, Privacy Policy, FAQs)
  const [checkoutConfig, setCheckoutConfig] = useState<CheckoutConfig>(() => getCachedCheckoutConfig());

  // Configurable FAQs Modal & Filtering State
  const [isFaqModalOpen, setIsFaqModalOpen] = useState<boolean>(false);
  const [activeFaqCategory, setActiveFaqCategory] = useState<string | null>(null);

  const openFaqModal = useCallback((category?: string) => {
    setActiveFaqCategory(category || null);
    setIsFaqModalOpen(true);
  }, []);

  const faqs = checkoutConfig.faqs && checkoutConfig.faqs.length > 0
    ? checkoutConfig.faqs
    : DEFAULT_FAQS;

  useEffect(() => {
    fetchCheckoutConfigFromFirestore()
      .then((remote) => {
        if (remote) {
          setCheckoutConfig(remote);
        }
      })
      .catch((err) => {
        console.warn('[AppContext] Could not fetch remote checkout config:', err);
      });
  }, []);

  const updateCheckoutConfig = async (updates: Partial<CheckoutConfig>) => {
    const updated: CheckoutConfig = {
      ...checkoutConfig,
      ...updates,
      gcash: {
        ...checkoutConfig.gcash,
        ...(updates.gcash || {}),
      },
      bankTransfer: {
        ...checkoutConfig.bankTransfer,
        ...(updates.bankTransfer || {}),
        accounts: updates.bankTransfer?.accounts || checkoutConfig.bankTransfer.accounts,
      },
      faqs: updates.faqs !== undefined ? updates.faqs : (checkoutConfig.faqs || DEFAULT_FAQS),
    };
    setCheckoutConfig(updated);
    setCachedCheckoutConfig(updated);
    await saveCheckoutConfigToFirestore(updated);
    showToast('Saved checkout, policy, and FAQ settings.');
  };

  const resetCheckoutConfigToDefaults = async () => {
    setCheckoutConfig(DEFAULT_CHECKOUT_CONFIG);
    setCachedCheckoutConfig(DEFAULT_CHECKOUT_CONFIG);
    await saveCheckoutConfigToFirestore(DEFAULT_CHECKOUT_CONFIG);
    showToast('Reset checkout settings and FAQs to default templates.');
  };

  // Garments / Products state initialized immediately from cached storage or live Firestore
  const [garments, setGarments] = useState<Garment[]>(() => {
    const cached = getCachedGarmentsFromLocalStorage();
    return cached && cached.length > 0 ? cached : [];
  });
  const [categories, setCategories] = useState<FirestoreCategory[]>([]);
  const [stores, setStores] = useState<FirestoreStore[]>([]);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState<boolean>(() => {
    const cached = getCachedGarmentsFromLocalStorage();
    return !cached || cached.length === 0;
  });
  const [firestoreSource, setFirestoreSource] = useState<'firestore' | 'seed'>('firestore');

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    const unsubscribeProducts = subscribeToFirestoreProducts(
      (loadedGarments, source) => {
        setGarments(loadedGarments || []);
        setIsFirestoreLoading(false);
        setFirestoreSource(source);
      },
      (error) => {
        console.warn('[AppContext] Firestore connection notice:', error);
        setIsFirestoreLoading(false);
      }
    );

    const unsubscribeCategories = subscribeToFirestoreCategories((loadedCats) => {
      setCategories(loadedCats || []);
    });

    const unsubscribeStores = subscribeToFirestoreStores((loadedStores) => {
      setStores(loadedStores || []);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeStores();
    };
  }, []);

  // Save/Update garment in Firestore
  const saveGarment = async (garment: Garment) => {
    try {
      await saveGarmentToFirestore(garment);
      setGarments((prev) => {
        const index = prev.findIndex((g) => g.id === garment.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = garment;
          return updated;
        }
        return [garment, ...prev];
      });
      showToast(`Garment "${garment.name}" synchronized with Firestore.`);
    } catch (error) {
      console.error('Failed to save garment to Firestore:', error);
      showToast('Could not save garment to Firestore. Please retry.');
      throw error;
    }
  };

  // Delete garment from Firestore
  const deleteGarment = async (garmentId: string) => {
    try {
      await deleteGarmentFromFirestore(garmentId);
      setGarments((prev) => prev.filter((g) => g.id !== garmentId));
      showToast('Garment deleted from Firestore vault.');
    } catch (error) {
      console.error('Failed to delete garment from Firestore:', error);
      showToast('Could not delete garment from Firestore.');
      throw error;
    }
  };

  // Purge all seeded demo garments from Firestore
  const purgeDemoGarments = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ATELIER_PURGED_DEMO', 'true');
      }
      await purgeDemoGarmentsFromFirestore();
      const demoIds = ['garment-1', 'garment-2', 'garment-3', 'garment-4', 'garment-5', 'garment-6', 'garment-7', 'garment-8'];
      setGarments((prev) => prev.filter((g) => !demoIds.includes(g.id)));
      showToast('Purged demo garments. Customer catalog now shows live Firestore inventory.');
    } catch (error) {
      console.error('Failed to purge demo garments:', error);
      showToast('Error purging demo garments.');
    }
  };

  // Permanently normalize and merge variant garments in Firestore
  const normalizeFirestoreDatabase = async () => {
    try {
      showToast('Normalizing product variations in Firestore...');
      const result = await normalizeFirestoreCatalogDatabase();
      showToast(`Normalized Firestore: Merged ${result.mergedCount} variant documents into ${result.createdUnifiedCount} multi-color couture pieces.`);
      return result;
    } catch (error) {
      console.error('Failed to normalize Firestore catalog:', error);
      showToast('Failed to normalize Firestore catalog.');
      throw error;
    }
  };

  // Wishlist state with localStorage
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      localStorage.removeItem('atelier_rentals_wishlist_v1');
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!saved) return [];
      const parsed: string[] = JSON.parse(saved);
      const demoIds = ['garment-1', 'garment-2', 'garment-3', 'garment-4', 'garment-5', 'garment-6', 'garment-7', 'garment-8'];
      return parsed.filter((id) => !demoIds.includes(id));
    } catch {
      return [];
    }
  });

  // Cart state with localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      localStorage.removeItem('atelier_rentals_cart_v1');
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed: CartItem[] = JSON.parse(saved);
      const demoIds = ['garment-1', 'garment-2', 'garment-3', 'garment-4', 'garment-5', 'garment-6', 'garment-7', 'garment-8'];
      return parsed.filter(
        (item) =>
          item &&
          item.garment &&
          item.garment.name &&
          !demoIds.includes(item.garment.id) &&
          !demoIds.includes(item.id)
      );
    } catch {
      return [];
    }
  });

  // Orders state with localStorage
  const [orders, setOrders] = useState<RentalOrder[]>(() => {
    try {
      localStorage.removeItem('atelier_rentals_orders_v1');
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (!saved) return [];
      const parsed: RentalOrder[] = JSON.parse(saved);
      return parsed;
    } catch {
      return [];
    }
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }, [wishlist]);

  // Wishlist toggle
  const toggleWishlist = (garmentId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(garmentId);
      if (exists) {
        showToast('Removed from you Wish List');
        return prev.filter((id) => id !== garmentId);
      } else {
        showToast('Saved to your Wish List');
        return [...prev, garmentId];
      }
    });
  };

  // Cart actions
  const addToCart = (item: Omit<CartItem, 'id' | 'addedAt'>) => {
    const newItem: CartItem = {
      ...item,
      id: `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      addedAt: Date.now(),
    };
    setCart((prev) => [newItem, ...prev]);
    showToast(`Added ${item.garment.name} (${item.durationDays} days) to your bag`);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
    showToast('Item removed from your bag');
  };

  const updateCartItem = (cartItemId: string, updates: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, ...updates } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Cart calculations
  const cartCount = cart.length;
  const cartRentalSubtotal = cart.reduce((acc, item) => acc + item.rentalPrice, 0);
  const cartDepositSubtotal = cart.reduce((acc, item) => acc + item.securityDeposit, 0);
  const cartGrandTotal = cartRentalSubtotal;

  // Order actions
  const createOrder = (
    shipping: ShippingDetails,
    kyc: KYCData,
    payment: PaymentData
  ): RentalOrder => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ORD-2026-${randomSuffix}`;

    const subtotalRental = cartRentalSubtotal;
    const totalDeposit = cartDepositSubtotal;
    const shippingFee = shipping.shippingFee || 0;
    const grandTotal = subtotalRental + shippingFee;

    const newOrder: RentalOrder = {
      id: orderId,
      userId: currentUser?.uid || undefined,
      items: [...cart],
      shipping,
      kyc,
      payment: {
        ...payment,
        paidAmount: grandTotal,
      },
      subtotalRental,
      totalDeposit,
      shippingFee,
      grandTotal,
      status: 'Under Verification',
      statusHistory: [
        {
          status: 'Payment Pending',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: 'Order submitted by renter',
        },
        {
          status: 'Under Verification',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: 'ID verification & payment receipt submitted for concierge review',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If logged in, automatically save reusable details to Firestore user profile
    if (currentUser?.uid) {
      updateUserProfile({
        shippingDetails: shipping,
        kycDetails: {
          idType: kyc.idType,
          frontIdImage: kyc.frontIdImage,
          backIdImage: kyc.backIdImage,
          selfieWithIdImage: kyc.selfieWithIdImage,
          idNumber: kyc.idNumber,
          isVerified: true,
          uploadedAt: kyc.uploadedAt,
        },
        ordersCount: (userProfile?.ordersCount || 0) + 1,
      });
    }

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setIsCheckoutOpen(false);
    setActiveOrderId(orderId);
    setActiveTab('my-rentals');
    showToast('Booking submitted successfully! Under verification.');
    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
    adminNote?: string
  ) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newHistory = [
          ...order.statusHistory,
          {
            status: newStatus,
            timestamp: now,
            note:
              adminNote ||
              (newStatus === 'Approved & Ready for Dispatch'
                ? 'Identity & Payment verified. Prepared for white-glove dispatch.'
                : newStatus === 'Out for Delivery'
                ? 'Dispatched with temperature-controlled garment courier.'
                : newStatus === 'Active Rental'
                ? 'Delivered to renter. Rental window is active.'
                : newStatus === 'Return in Transit'
                ? 'Return box collected by courier for inspection.'
                : newStatus === 'Completed / Deposit Refunded'
                ? 'Garment pristine condition verified. Security deposit refund processed.'
                : `Status updated to ${newStatus}`),
          },
        ];

        return {
          ...order,
          status: newStatus,
          adminNotes: adminNote || order.adminNotes,
          statusHistory: newHistory,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    showToast(`Order ${orderId} updated to: ${newStatus}`);
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (activeOrderId === orderId) {
      setActiveOrderId(null);
    }
    showToast(`Order ${orderId} removed`);
  };

  const resetAllData = () => {
    setOrders([]);
    setCart([]);
    setWishlist([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(ORDERS_STORAGE_KEY);
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
    localStorage.removeItem('atelier_rentals_cart_v1');
    localStorage.removeItem('atelier_rentals_orders_v1');
    localStorage.removeItem('atelier_rentals_wishlist_v1');
    showToast('Local bag and saved session cleared');
  };

  return (
    <AppContext.Provider
      value={{
        viewMode,
        setViewMode,
        switchToAdmin,
        switchToUser,
        currentUser,
        userProfile,
        isAuthLoading,
        isGoogleLoginModalOpen,
        setIsGoogleLoginModalOpen,
        loginWithGoogle,
        logoutUser,
        updateUserProfile,
        isAdminAuthenticated,
        adminEmail,
        setAdminEmail,
        isAdmin2FAOpen,
        setIsAdmin2FAOpen,
        admin2FACode,
        admin2FACodeSentAt,
        admin2FAEmailPreview,
        sendAdmin2FACode,
        verifyAdmin2FACode,
        logoutAdmin,
        activeTab,
        setActiveTab,
        adminTab,
        setAdminTab,
        selectedGarment,
        setSelectedGarment,
        restoreCollectionScroll,
        garmentSelections,
        setGarmentSelection,
        activeOrderId,
        setActiveOrderId,
        rentalsFilter,
        setRentalsFilter,
        navigateToRentals,
        isCheckoutOpen,
        setIsCheckoutOpen,
        checkoutStep,
        setCheckoutStep,
        selectedCategory,
        setSelectedCategory,
        selectedShop,
        setSelectedShop,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        wishlist,
        toggleWishlist,
        rentalPricingConfig,
        updateRentalPricingConfig,
        configuredDurations,
        setConfiguredDurations,
        checkoutConfig,
        updateCheckoutConfig,
        resetCheckoutConfigToDefaults,
        faqs,
        isFaqModalOpen,
        setIsFaqModalOpen,
        openFaqModal,
        activeFaqCategory,
        setActiveFaqCategory,
        garments,
        categories,
        stores,
        fetchVariations: fetchProductVariationsFromFirestore,
        isFirestoreLoading,
        firestoreSource,
        saveGarment,
        deleteGarment,
        purgeDemoGarments,
        normalizeFirestoreDatabase,
        cart,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        cartCount,
        cartRentalSubtotal,
        cartDepositSubtotal,
        cartGrandTotal,
        orders,
        createOrder,
        updateOrderStatus,
        deleteOrder,
        resetAllData,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
