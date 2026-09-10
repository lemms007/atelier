export type GarmentCategory =
  | 'All'
  | 'Wishlist'
  | 'Corset Gowns'
  | 'Long Gowns'
  | 'Midi Dresses'
  | 'Infinity & Multiway'
  | 'Bridal Gowns'
  | 'Formal Evening'
  | string;

export type GarmentSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL' | '5XL' | string;

export interface GarmentColor {
  name: string;
  hex: string;
  image?: string;
}

export interface GarmentVariation {
  id?: string;
  name: string; // e.g. "Burgundy", "Olive Green", "Champagne", or "Medium / Pink"
  colorName?: string;
  option_name?: string;
  hex?: string;
  images: string[];
  sizes?: GarmentSize[];
  sku?: string;
  store_id?: string;
  price?: number;
  sale_price?: number;
  quantity?: number;
  available_to_sell?: number;
  inStock?: boolean;
  basePrice4Days?: number;
  dailyExtraRate?: number;
  securityDeposit?: number;
  is_available_for_rent?: boolean;
}

export interface RentalPricingConfig {
  baseRentalDays: number; // default: 4 days
  baseMarkup: number; // default: 500 PHP added to dress price for 4-day base rate
  extraRatePer4Days: number; // default: 500 PHP per 4 days beyond base days
  durationOptions: number[]; // default: [4, 8, 12, 16]
}

export interface Garment {
  id: string;
  sku?: string;
  store_id?: string;
  model_name?: string;
  title?: string;
  name: string;
  designer: string; // "Love Humbly Shop" or "Corset Bloomfield"
  store?: string; // Product source shop
  productType?: string; // e.g. "Corset Gown", "Long Gown", "Midi Dress"
  category: string;
  category_name?: string;
  product_slug?: string;
  product_url?: string;
  status?: string;
  dressPrice?: number; // Catalog / retail base dress price in PHP
  price_min?: number;
  price_max?: number;
  raw_price?: string;
  rental_price?: number;
  retailValue: number; // in PHP
  basePrice4Days: number; // 4-day rate in PHP: dressPrice + baseMarkup (default: dressPrice + 500)
  dailyExtraRate: number; // rate per day beyond 4 days in PHP (e.g. 125/day = 500 per 4 days)
  extraRatePer4Days?: number; // rate per 4 additional days (default: 500)
  securityDeposit: number; // refundable deposit in PHP
  quantity?: number; // Total stock units available in vault
  available_to_sell?: number;
  lowStockThreshold?: number;
  sizes: GarmentSize[];
  colors: GarmentColor[];
  variations?: GarmentVariation[];
  images: string[];
  original_image_url?: string;
  supabase_image_url?: string;
  photos?: string[];
  image_remote_urls?: string[];
  description: string;
  details: string[];
  fabric: string;
  silhouette: string;
  occasion: string;
  modelMeasurements: {
    height: string;
    bust: string;
    waist: string;
    hips: string;
    wearingSize: GarmentSize;
  };
  careInstructions: string;
  rating: number;
  reviewCount: number;
  featured?: boolean;
  is_available_for_rent?: boolean;
  variants_count?: number;
  rawDocIds?: string[]; // Merged source Firestore document IDs
  updatedAt?: number;
}

/**
 * Raw and normalized Firestore Database Schema types
 */
export interface FirestoreRentalProduct {
  title?: string;
  name?: string;
  store?: string;
  rental_price?: number;
  raw_price?: string;
  original_image_url?: string;
  supabase_image_url?: string;
  product_url?: string;
  updated_at?: any;
  basePrice4Days?: number;
  retailValue?: number;
  dailyExtraRate?: number;
  securityDeposit?: number;
  quantity?: number;
  available_to_sell?: number;
  lowStockThreshold?: number;
  is_available_for_rent?: boolean;
  featured?: boolean;
  variations?: any[];
  images?: string[];
  [key: string]: any;
}

export interface FirestoreRawProduct {
  sku: string;
  store_id: string;
  model_name: string;
  description: string;
  category_name: string;
  product_slug: string;
  status: string;
  price_min: number;
  price_max: number;
  photos: string[];
  image_remote_urls: string[];
  variants_count: number;
  is_available_for_rent: boolean;
  created_at?: string;
  scraped_at?: string;
}

export interface FirestoreProductVariation {
  sku: string;
  store_id: string;
  option_name: string;
  price: number;
  sale_price: number;
  quantity: number;
  available_to_sell: number;
  width?: number;
  length?: number;
  height?: number;
  weight?: number;
  scraped_at?: string;
}

export interface FirestoreCategory {
  id?: string;
  store_id: string;
  name: string;
  sort_order: number;
  scraped_at?: string;
}

export interface FirestoreStore {
  id?: string;
  store_id: string;
  slug: string;
  shop_name: string;
  shop_link: string;
  shop_image_url: string;
  shop_image_remote_url?: string;
  is_vacation?: boolean;
  business_hours?: string | any;
  socials?: string | any;
  owner?: string | any;
  scraped_at?: string;
}

export interface CartItem {
  id: string; // unique item instance id in cart
  garmentId: string;
  garment: Garment;
  selectedSize: GarmentSize;
  selectedColor: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number; // 4 to 14 days
  rentalPrice: number; // base + extra days calculation
  securityDeposit: number;
  addedAt: number;
}

export type GovernmentIdType =
  | 'Philippine Passport'
  | "Driver's License (LTO)"
  | 'Unified Multi-Purpose ID (UMID)'
  | 'Philippine National ID (PhilID)'
  | 'Professional Regulation Commission (PRC) ID'
  | 'Postal ID'
  | "Voter's ID or Voter's Certification";

export const PHILIPPINE_GOVERNMENT_IDS: GovernmentIdType[] = [
  'Philippine Passport',
  "Driver's License (LTO)",
  'Unified Multi-Purpose ID (UMID)',
  'Philippine National ID (PhilID)',
  'Professional Regulation Commission (PRC) ID',
  'Postal ID',
  "Voter's ID or Voter's Certification",
];

export interface KYCData {
  idType: GovernmentIdType;
  frontIdImage: string;
  backIdImage?: string;
  selfieWithIdImage: string;
  idNumber?: string;
  uploadedAt: string;
  isVerified?: boolean;
}

export type PaymentMethod = 'gcash' | 'bank_transfer';
export type BankName = 'BPI' | 'BDO' | 'UnionBank';

export interface PaymentData {
  method: PaymentMethod;
  bankName?: BankName;
  accountName: string;
  accountNumber: string;
  referenceNumber: string;
  receiptImage: string;
  paidAmount: number;
  paidAt: string;
}

export type DeliveryMethod = 'lalamove' | 'same_day_courier' | 'express_provincial';

export type ViewMode = 'user' | 'admin';
export type CustomerTab = 'explore' | 'cart' | 'my-rentals' | 'profile';
export type AdminTab = 'verification' | 'inventory' | 'ledger';

export interface Admin2FAEmail {
  to: string;
  code: string;
  timestamp: string;
  expiresInMinutes: number;
}

export interface ShippingDetails {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  deliveryAddress: string;
  landmarkNotes?: string;
  city: string;
  province: string;
  postalCode: string;
  deliveryMethod: DeliveryMethod;
  shippingFee: number;
}

export type OrderStatus =
  | 'Payment Pending'
  | 'Under Verification'
  | 'Approved & Ready for Dispatch'
  | 'Out for Delivery'
  | 'Active Rental'
  | 'Return in Transit'
  | 'Completed / Deposit Refunded'
  | 'ID Re-upload Requested'
  | 'Payment Rejected';

export interface StatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface UserMeasurements {
  primarySize: GarmentSize;
  bust: string;
  waist: string;
  hips: string;
  height: string;
}

export interface UserPaymentPreferences {
  method?: PaymentMethod;
  bankName?: BankName;
  accountName?: string;
  accountNumber?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  photoURL?: string;
  phoneNumber?: string;
  isRegistered: boolean;
  createdAt: string;
  lastLoginAt: string;
  membershipTier?: 'Standard' | 'VIP Member' | 'Sinta Connoisseur' | 'Atelier Connoisseur';
  shippingDetails?: Partial<ShippingDetails>;
  kycDetails?: Partial<KYCData>;
  measurements?: UserMeasurements;
  paymentPreferences?: UserPaymentPreferences;
  wishlist?: string[];
  ordersCount?: number;
}

export interface RentalOrder {
  id: string; // e.g. ORD-2026-8924
  userId?: string;
  items: CartItem[];
  shipping: ShippingDetails;
  kyc: KYCData;
  payment: PaymentData;
  subtotalRental: number;
  totalDeposit: number;
  shippingFee: number;
  grandTotal: number;
  status: OrderStatus;
  statusHistory: StatusHistoryItem[];
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}
