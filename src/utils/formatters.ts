/**
 * Currency, date, and validation helpers for Atelier Design System
 */

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

export const calculateRentalPrice = (
  basePrice4Days: number,
  dailyExtraRate: number,
  durationDays: number
): number => {
  if (durationDays <= 4) return basePrice4Days;
  const extraDays = durationDays - 4;
  return basePrice4Days + extraDays * dailyExtraRate;
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
  if (garment.designer && garment.designer.trim() && garment.designer !== 'Atelier Manila') {
    return normalizeShopName(garment.designer);
  }
  if (garment.name && garment.name.toLowerCase().includes('corset')) {
    return 'Corset Bloomfield';
  }
  return 'Love Humbly Shop';
};

export const getAvailableShops = (
  garments: Array<{ store?: string; designer?: string; name?: string }>
): string[] => {
  const shopSet = new Set<string>();
  // Pre-seed known canonical shops
  shopSet.add('Love Humbly Shop');
  shopSet.add('Corset Bloomfield');
  garments.forEach((g) => {
    const s = getGarmentShop(g);
    if (s) shopSet.add(normalizeShopName(s));
  });
  return Array.from(shopSet);
};
