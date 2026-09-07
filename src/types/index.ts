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

export type GarmentSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface GarmentColor {
  name: string;
  hex: string;
  image?: string;
}

export interface GarmentVariation {
  id?: string;
  name: string; // e.g. "Burgundy", "Olive Green", "Champagne"
  colorName?: string;
  hex?: string;
  images: string[];
  sizes?: GarmentSize[];
  sku?: string;
  inStock?: boolean;
  basePrice4Days?: number;
  dailyExtraRate?: number;
  securityDeposit?: number;
}

export interface Garment {
  id: string;
  name: string;
  designer: string; // "Love Humbly Shop" or "Corset Bloomfields"
  store?: string; // Product source shop
  productType?: string; // e.g. "Corset Gown", "Long Gown", "Midi Dress"
  category: string;
  retailValue: number; // in PHP
  basePrice4Days: number; // 4-day minimum rate in PHP
  dailyExtraRate: number; // rate per day beyond 4 days in PHP
  securityDeposit: number; // refundable deposit in PHP
  sizes: GarmentSize[];
  colors: GarmentColor[];
  variations?: GarmentVariation[];
  images: string[];
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
  rawDocIds?: string[]; // Merged source Firestore document IDs
  updatedAt?: number;
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
  | 'Philippine National ID (PhilID)';

export interface KYCData {
  idType: GovernmentIdType;
  frontIdImage: string;
  backIdImage?: string;
  selfieWithIdImage: string;
  idNumber?: string;
  uploadedAt: string;
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

export type DeliveryMethod = 'same_day_courier' | 'express_provincial';

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

export interface RentalOrder {
  id: string; // e.g. ORD-2026-8924
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
