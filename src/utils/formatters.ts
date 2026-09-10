/**
 * Currency, date, and validation helpers for Atelier Design System
 */
import { Garment, GarmentSize } from '../types';

export const formatPHP = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPHPNumber = (amount: number): string => {
  return new Intl.NumberFormat('en-PH').format(amount);
};

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDisplayDateShort = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const formatPHMobile = (input: string): string => {
  // Strip non-digits
  const digits = input.replace(/\D/g, '');

  // Handle standard 09XX or 639XX or 9XX inputs
  let cleanDigits = digits;
  if (digits.startsWith('63')) {
    cleanDigits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    cleanDigits = digits.slice(1);
  }

  // Limit to 10 digits (e.g. 917 123 4567)
  const trimmed = cleanDigits.slice(0, 10);

  if (trimmed.length === 0) return '+63 ';
  if (trimmed.length <= 3) return `+63 ${trimmed}`;
  if (trimmed.length <= 6) return `+63 ${trimmed.slice(0, 3)} ${trimmed.slice(3)}`;
  return `+63 ${trimmed.slice(0, 3)} ${trimmed.slice(3, 6)} ${trimmed.slice(6, 10)}`;
};

export const isValidPHMobile = (formattedOrRaw: string): boolean => {
  const digits = formattedOrRaw.replace(/\D/g, '');
  // Format is valid if 639XXXXXXXXX (12 digits) or 09XXXXXXXXX (11 digits) or 9XXXXXXXXX (10 digits starting with 9)
  if (digits.startsWith('639') && digits.length === 12) return true;
  if (digits.startsWith('09') && digits.length === 11) return true;
  if (digits.startsWith('9') && digits.length === 10) return true;
  return false;
};

export interface ParsedFullName {
  firstName: string;
  middleName: string;
  lastName: string;
}

/**
 * Break down a single full name string into First Name, Middle Name, and Last Name
 */
export const parseFullName = (fullName?: string): ParsedFullName => {
  if (!fullName) {
    return { firstName: '', middleName: '', lastName: '' };
  }
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', middleName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: '', lastName: '' };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleName: '', lastName: parts[1] };
  }
  if (parts.length === 3) {
    return { firstName: parts[0], middleName: parts[1], lastName: parts[2] };
  }
  // 4 or more words (e.g. "Maria Clara Santos De La Cruz" or "Jose Maria Dela Cruz")
  // First word is First Name, Last word is Last Name, middle words are Middle Name
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
};

/**
 * Combines First Name, Middle Name (optional), and Last Name into a single Full Name string
 */
export const formatFullName = (
  firstName?: string,
  middleName?: string,
  lastName?: string
): string => {
  const list = [firstName, middleName, lastName]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s));
  return list.join(' ');
};

export const calculateDaysBetween = (startStr: string, endStr: string): number => {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of start & end day
  return diffDays > 0 ? diffDays : 0;
};

export const addDaysToDate = (dateStr: string, daysToAdd: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
};

export const DEFAULT_RENTAL_PRICING_CONFIG = {
  baseRentalDays: 4,
  baseMarkup: 500,
  extraRatePer4Days: 500,
  durationOptions: [4, 8, 12, 16],
};

export const calculateRentalPrice = (
  basePrice4Days: number,
  dailyExtraRate: number,
  durationDays: number,
  pricingConfig?: {
    baseRentalDays?: number;
    baseMarkup?: number;
    extraRatePer4Days?: number;
    durationOptions?: number[];
  }
): number => {
  const config = pricingConfig || DEFAULT_RENTAL_PRICING_CONFIG;
  const baseDays = config.baseRentalDays || 4;
  const extraRatePer4 = config.extraRatePer4Days !== undefined ? config.extraRatePer4Days : 500;

  if (durationDays <= baseDays) {
    return basePrice4Days;
  }

  const extraDays = durationDays - baseDays;
  // Standard daily rate derived from extraRatePer4 (default: 500 / 4 = 125/day)
  // For 8 days: 4 extra days * 125 = +500
  // For 12 days: 8 extra days * 125 = +1000
  // For 16 days: 12 extra days * 125 = +1500
  const ratePerDay =
    dailyExtraRate && Math.abs(dailyExtraRate - extraRatePer4 / 4) > 1
      ? dailyExtraRate
      : extraRatePer4 / 4;

  return basePrice4Days + Math.round(extraDays * ratePerDay);
};

export const normalizeShopName = (name?: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (/^corset\s*bloomfields?$/i.test(trimmed)) {
    return 'Corset Bloomfield';
  }
  if (/^love\s*humbly(\s*shop)?$/i.test(trimmed)) {
    return 'Love Humbly Shop';
  }
  return trimmed;
};

export const getGarmentShop = (garment: {
  store?: string;
  designer?: string;
  name?: string;
}): string => {
  if (garment.store && garment.store.trim()) {
    return normalizeShopName(garment.store);
  }
  if (garment.designer && garment.designer.trim()) {
    return normalizeShopName(garment.designer);
  }
  return '';
};

export const getAvailableShops = (
  garments: Array<{ store?: string; designer?: string; name?: string }>
): string[] => {
  const shopSet = new Set<string>();
  garments.forEach((g) => {
    const s = getGarmentShop(g);
    if (s) shopSet.add(normalizeShopName(s));
  });
  return Array.from(shopSet);
};

export interface GarmentColorOption {
  index: number;
  name: string;
  colorName: string;
  hex?: string;
  image?: string;
  images?: string[];
  sizes?: GarmentSize[];
  price?: number;
  is_available_for_rent?: boolean;
  quantity?: number;
  available_to_sell?: number;
  inStock?: boolean;
  disabled?: boolean;
}

export const getGarmentColorOptions = (garment: Garment): GarmentColorOption[] => {
  const hasVariations = Array.isArray(garment.variations) && garment.variations.length > 0;
  if (hasVariations) {
    return garment.variations!.map((v, idx) => {
      const isPausedOrDisabled =
        v.is_available_for_rent === false ||
        (v as any).status === 'disabled' ||
        (v as any).status === 'paused' ||
        (v as any).status === 'sold-out' ||
        (v as any).status === 'archived' ||
        v.inStock === false ||
        (v.available_to_sell !== undefined && v.available_to_sell <= 0) ||
        (v.quantity !== undefined && v.quantity <= 0);

      return {
        index: idx,
        name: v.name,
        colorName: v.colorName || v.name,
        hex: v.hex,
        image: (v.images && v.images[0]) || garment.images[0],
        images: v.images && v.images.length > 0 ? v.images : garment.images,
        sizes: v.sizes && v.sizes.length > 0 ? v.sizes : garment.sizes,
        price: v.price,
        is_available_for_rent: v.is_available_for_rent,
        quantity: v.quantity,
        available_to_sell: v.available_to_sell,
        inStock: v.inStock,
        disabled: Boolean(isPausedOrDisabled),
      };
    });
  }
  if (Array.isArray(garment.colors) && garment.colors.length > 0) {
    const isProductDisabled = garment.is_available_for_rent === false || (garment.quantity !== undefined && garment.quantity <= 0);
    return garment.colors.map((c, idx) => ({
      index: idx,
      name: c.name,
      colorName: c.name,
      hex: c.hex,
      image: c.image || garment.images[0],
      images: c.image ? [c.image, ...garment.images.filter((img) => img !== c.image)] : garment.images,
      sizes: garment.sizes,
      price: undefined,
      is_available_for_rent: garment.is_available_for_rent,
      quantity: garment.quantity,
      available_to_sell: garment.available_to_sell,
      disabled: Boolean(isProductDisabled),
    }));
  }
  const isProductDisabled = garment.is_available_for_rent === false || (garment.quantity !== undefined && garment.quantity <= 0);
  return [
    {
      index: 0,
      name: 'Original',
      colorName: 'Original',
      hex: '#141312',
      image: garment.images[0] || '',
      images: garment.images,
      sizes: garment.sizes,
      price: undefined,
      is_available_for_rent: garment.is_available_for_rent,
      quantity: garment.quantity,
      available_to_sell: garment.available_to_sell,
      disabled: Boolean(isProductDisabled),
    },
  ];
};

const STANDARD_SIZE_ORDER = [
  'XXS',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '5XL',
  'Free Size',
];

/**
 * Checks if a string looks like a SKU or technical database ID rather than an apparel size
 */
export const isSkuLike = (val?: string): boolean => {
  if (!val) return true;
  const trimmed = val.trim();
  if (!trimmed) return true;
  // 1. Matches numeric segments with hyphens (e.g. 706236-814995-907048, 706236-836766)
  if (/^[0-9]+(-[0-9]+)+$/.test(trimmed)) return true;
  // 2. Starts with SKU- or sku:
  if (/^sku[:\s_-]/i.test(trimmed)) return true;
  // 3. Purely numeric with 5 or more digits
  if (/^\d{5,}$/.test(trimmed)) return true;
  // 4. Typical Firestore document ID (20+ chars alphanumeric without spaces)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return true;
  return false;
};

/**
 * Normalizes variations/subcollection option_name into standard clothing sizes
 * or extracts size if suffixed onto a SKU (e.g. CB-001-S -> S)
 */
export const normalizeSizeName = (val?: string): string | null => {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower === 'extra small' || lower === 'extrasmall' || lower === 'x-small' || lower === 'xs') return 'XS';
  if (lower === 'small' || lower === 's') return 'S';
  if (lower === 'medium' || lower === 'med' || lower === 'm') return 'M';
  if (lower === 'large' || lower === 'l') return 'L';
  if (lower === 'extra large' || lower === 'extralarge' || lower === 'x-large' || lower === 'xl') return 'XL';
  if (lower === '2xl' || lower === 'xxl' || lower === '2x-large' || lower === '2x large' || lower === '2 extra large') return '2XL';
  if (lower === '3xl' || lower === 'xxxl' || lower === '3x-large' || lower === '3x large') return '3XL';
  if (lower === '4xl' || lower === '4x-large' || lower === '4x large') return '4XL';
  if (lower === '5xl' || lower === '5x-large' || lower === '5x large') return '5XL';
  if (
    lower === 'one size' ||
    lower === 'onesize' ||
    lower === 'free size' ||
    lower === 'freesize' ||
    lower === 'os' ||
    lower === 'fs'
  ) {
    return 'Free Size';
  }

  // If it's SKU-like, check if it has a size suffix (e.g. -S, -M, _XL)
  if (isSkuLike(trimmed)) {
    const match = trimmed.match(/[-_/\s](XXS|XS|S|M|L|XL|2XL|3XL|4XL|5XL|XXL|XXXL|Free Size|One Size)$/i);
    if (match) {
      return normalizeSizeName(match[1]);
    }
    return null;
  }

  // Numeric sizing (e.g. US 2, 4, 6, 8, 10, 12)
  if (/^\d{1,2}$/.test(trimmed)) {
    return `US ${trimmed}`;
  }

  // General acceptable size labels
  if (trimmed.length <= 12 && !isSkuLike(trimmed)) {
    return trimmed.toUpperCase();
  }

  return null;
};

/**
 * Derives a clean, sorted list of clothing sizes, stripping out any SKUs or database IDs
 */
export const getGarmentAvailableSizes = (
  subVariations: Array<{ option_name?: string; sku?: string; [key: string]: any }> = [],
  fallbackSizes: GarmentSize[] = []
): GarmentSize[] => {
  const extractedSizes: string[] = [];

  if (Array.isArray(subVariations) && subVariations.length > 0) {
    for (const v of subVariations) {
      const norm =
        normalizeSizeName(v.option_name) ||
        (v.sku && !isSkuLike(v.sku) ? normalizeSizeName(v.sku) : null);
      if (norm && !extractedSizes.includes(norm)) {
        extractedSizes.push(norm);
      }
    }
  }

  if (extractedSizes.length > 0) {
    return sortSizes(extractedSizes as GarmentSize[]);
  }

  // Fallback to cleaned fallbackSizes
  const cleanedFallbacks: GarmentSize[] = [];
  for (const s of fallbackSizes) {
    const norm = normalizeSizeName(s);
    if (norm && !cleanedFallbacks.includes(norm)) {
      cleanedFallbacks.push(norm);
    }
  }

  if (cleanedFallbacks.length > 0) {
    return sortSizes(cleanedFallbacks);
  }

  return ['XS', 'S', 'M', 'L', 'XL'];
};

const sortSizes = (sizes: GarmentSize[]): GarmentSize[] => {
  return [...sizes].sort((a, b) => {
    const idxA = STANDARD_SIZE_ORDER.indexOf(a);
    const idxB = STANDARD_SIZE_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
};
