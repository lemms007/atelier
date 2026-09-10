import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  Unsubscribe,
  Firestore,
} from 'firebase/firestore';
import { db, defaultDb, namedDb } from '../firebase';
import {
  Garment,
  GarmentVariation,
  GarmentColor,
  GarmentSize,
  RentalPricingConfig,
  FirestoreRentalProduct,
  FirestoreRawProduct,
  FirestoreProductVariation,
  FirestoreCategory,
  FirestoreStore,
} from '../types';
import { preloadGarmentVariationImages } from '../utils/imageCache';
import { recordFirestoreReadSaved } from './cacheManager';

// Local storage keys for persistent catalog caching
const PRODUCTS_CACHE_STORAGE_KEY = 'atelier_products_cache_v7';
const PRODUCTS_CACHE_TIMESTAMP_KEY = 'atelier_products_cache_time_v7';
const CATEGORIES_CACHE_STORAGE_KEY = 'atelier_categories_cache_v2';
const CATEGORIES_CACHE_TIMESTAMP_KEY = 'atelier_categories_cache_time_v2';
const STORES_CACHE_STORAGE_KEY = 'atelier_stores_cache_v2';
const STORES_CACHE_TIMESTAMP_KEY = 'atelier_stores_cache_time_v2';
const VARIATIONS_CACHE_PREFIX = 'atelier_var_cache_';

// 24 Hour Cache TTL
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * In-memory cache for fetched product subcollection variations to prevent redundant network trips
 */
const variationsMemoryCache = new Map<string, FirestoreProductVariation[]>();

/**
 * Retrieve cached garments synchronously from LocalStorage for instant 0ms rendering
 */
export function getCachedGarmentsFromLocalStorage(): Garment[] {
  try {
    // Purge outdated caches with previous discounted/calculated prices or duplicated images
    [
      'atelier_products_cache_v1',
      'atelier_products_cache_v2',
      'atelier_products_cache_v3',
      'atelier_products_cache_v4',
      'atelier_products_cache_v5',
      'atelier_products_cache_v6',
    ].forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
    const raw = localStorage.getItem(PRODUCTS_CACHE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      recordFirestoreReadSaved(parsed.length);
      return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Save normalized garments to LocalStorage cache
 */
export function setCachedGarmentsToLocalStorage(garments: Garment[]): void {
  try {
    if (Array.isArray(garments) && garments.length > 0) {
      localStorage.setItem(PRODUCTS_CACHE_STORAGE_KEY, JSON.stringify(garments));
      localStorage.setItem(PRODUCTS_CACHE_TIMESTAMP_KEY, Date.now().toString());
    }
  } catch {
    // Local storage full or restricted
  }
}

/**
 * Get cached categories from LocalStorage
 */
export function getCachedCategoriesFromLocalStorage(): FirestoreCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_CACHE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      recordFirestoreReadSaved(parsed.length);
      return parsed;
    }
  } catch {}
  return [];
}

export function setCachedCategoriesToLocalStorage(categories: FirestoreCategory[]): void {
  try {
    if (Array.isArray(categories) && categories.length > 0) {
      localStorage.setItem(CATEGORIES_CACHE_STORAGE_KEY, JSON.stringify(categories));
      localStorage.setItem(CATEGORIES_CACHE_TIMESTAMP_KEY, Date.now().toString());
    }
  } catch {}
}

/**
 * Get cached stores from LocalStorage
 */
export function getCachedStoresFromLocalStorage(): FirestoreStore[] {
  try {
    const raw = localStorage.getItem(STORES_CACHE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      recordFirestoreReadSaved(parsed.length);
      return parsed;
    }
  } catch {}
  return [];
}

export function setCachedStoresToLocalStorage(stores: FirestoreStore[]): void {
  try {
    if (Array.isArray(stores) && stores.length > 0) {
      localStorage.setItem(STORES_CACHE_STORAGE_KEY, JSON.stringify(stores));
      localStorage.setItem(STORES_CACHE_TIMESTAMP_KEY, Date.now().toString());
    }
  } catch {}
}

/**
 * Known fashion couture color palettes and hex definitions
 */
export const COUTURE_COLOR_MAP: Record<string, string> = {
  burgundy: '#800020',
  maroon: '#6A0C14',
  wine: '#722F37',
  bordeaux: '#5C0120',
  'olive green': '#556B2F',
  olive: '#556B2F',
  sage: '#9CAF88',
  'sage green': '#9CAF88',
  emerald: '#097969',
  'emerald green': '#046307',
  'forest green': '#228B22',
  champagne: '#F7E7CE',
  'champagne gold': '#E5D3B3',
  gold: '#D4AF37',
  'rose gold': '#B76E79',
  blush: '#DE5D83',
  'blush pink': '#FFD1DC',
  pink: '#FFB6C1',
  'beige pink': '#E8C5C8',
  magenta: '#D01C8B',
  fuchsia: '#C12267',
  coral: '#FF7F50',
  red: '#C41E3A',
  crimson: '#990000',
  ruby: '#9B111E',
  scarlet: '#FF2400',
  navy: '#000080',
  'navy blue': '#1B2A4A',
  midnight: '#191970',
  'midnight blue': '#101B42',
  royal: '#4169E1',
  'royal blue': '#4169E1',
  cobalt: '#0047AB',
  'sky blue': '#87CEEB',
  'powder blue': '#B0E0E6',
  baby: '#89CFF0',
  'baby blue': '#89CFF0',
  'dusty blue': '#779ECB',
  'dark dusty blue': '#4A6B82',
  'dusty rose': '#DCAE96',
  'dusty green': '#8A9A86',
  teal: '#008080',
  cyan: '#00FFFF',
  noir: '#141312',
  black: '#141312',
  onyx: '#0F0F0F',
  white: '#FFFFF0',
  'ivory white': '#FDFBF7',
  ivory: '#FDFBF7',
  cream: '#FFFDD0',
  ecru: '#C2B280',
  pearl: '#F8F6F0',
  silver: '#C0C0C0',
  platinum: '#E5E4E2',
  lavender: '#E6E6FA',
  lilac: '#C8A2C8',
  violet: '#7F00FF',
  purple: '#800080',
  plum: '#702963',
  rust: '#B7410E',
  terracotta: '#E2725B',
  copper: '#B87333',
  mustard: '#FFDB58',
  yellow: '#FADA5E',
  ochre: '#CC7722',
  taupe: '#B38B6D',
  nude: '#E8D8C8',
  beige: '#F5F5DC',
  mocha: '#8B5A2B',
  chocolate: '#5D3A1A',
};

/**
 * Resolve any image URL (Supabase, CDN, S3, Firebase Storage, HTTP/HTTPS)
 */
export function resolveFirebaseImageUrl(rawUrl: any): string {
  if (!rawUrl) return '';

  if (typeof rawUrl === 'object') {
    const candidate =
      rawUrl.downloadURL ||
      rawUrl.downloadUrl ||
      rawUrl.url ||
      rawUrl.src ||
      rawUrl.source ||
      rawUrl.supabase_image_url ||
      rawUrl.original_image_url ||
      '';
    if (candidate) return resolveFirebaseImageUrl(candidate);
    return '';
  }

  let str = String(rawUrl).trim();
  if (!str || str === 'null' || str === 'undefined' || str === '[object Object]' || str.length < 5) return '';

  if (str.startsWith('http://') || str.startsWith('https://')) {
    // If Firebase Storage URL, ensure alt=media
    if (str.includes('firebasestorage.googleapis.com') && !str.includes('alt=media')) {
      str = str.includes('?') ? `${str}&alt=media` : `${str}?alt=media`;
    }
    return str;
  }

  if (str.startsWith('data:image/') || str.startsWith('blob:')) {
    return str;
  }

  return '';
}

/**
 * Deduplicate image URLs by exact URL, normalized clean path, and unique asset filename.
 * Eliminates duplicate photos caused by Cloudfront vs S3 signed URLs, query parameters, or repeated database entries.
 */
export function deduplicateImageUrls(urls: (string | undefined | null)[]): string[] {
  if (!Array.isArray(urls)) return [];

  const valid = urls
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter(
      (u) =>
        u.length > 5 &&
        u !== 'null' &&
        u !== 'undefined' &&
        u !== '[object Object]' &&
        (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:'))
    );

  // Sort so that permanent CDN URLs (cloudfront, supabase, or URLs without expiration query params) are prioritized
  const sorted = [...valid].sort((a, b) => {
    const aIsExpiring = a.includes('AWSAccessKeyId') || a.includes('Signature=');
    const bIsExpiring = b.includes('AWSAccessKeyId') || b.includes('Signature=');
    if (aIsExpiring && !bIsExpiring) return 1;
    if (!aIsExpiring && bIsExpiring) return -1;

    const aIsCdn = a.includes('cloudfront.net') || a.includes('supabase.co') || a.includes('firebasestorage');
    const bIsCdn = b.includes('cloudfront.net') || b.includes('supabase.co') || b.includes('firebasestorage');
    if (aIsCdn && !bIsCdn) return -1;
    if (!aIsCdn && bIsCdn) return 1;

    return 0;
  });

  const result: string[] = [];
  const seenExact = new Set<string>();
  const seenKeys = new Set<string>();

  for (const url of sorted) {
    if (seenExact.has(url)) continue;
    seenExact.add(url);

    try {
      // 1. Strip query and hash
      const cleanPath = url.split('?')[0].split('#')[0].trim().toLowerCase();
      // 2. Extract filename
      const segments = cleanPath.split('/').filter(Boolean);
      const filename = segments[segments.length - 1] || cleanPath;

      // Generic names: 'image.png', 'photo.png', 'default.png', 'img.png'
      const isGeneric = ['image.png', 'photo.png', 'default.png', 'img.png', 'thumb.png', 'cover.png'].includes(
        filename
      );
      const assetKey = isGeneric ? cleanPath : filename;

      if (seenKeys.has(assetKey)) {
        continue;
      }

      seenKeys.add(assetKey);
      result.push(url);
    } catch {
      result.push(url);
    }
  }

  return result;
}

/**
 * Determine hex code from color string
 */
export function getHexForColorName(colorName: string): string {
  if (!colorName) return '#141312';
  const clean = colorName.toLowerCase().trim();
  if (COUTURE_COLOR_MAP[clean]) return COUTURE_COLOR_MAP[clean];

  for (const [key, hex] of Object.entries(COUTURE_COLOR_MAP)) {
    if (clean.includes(key)) return hex;
  }
  return '#141312';
}

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function normalizeBaseName(name: string): string {
  let clean = capitalizeWords(name.trim());
  if (
    !clean.toLowerCase().includes('dress') &&
    !clean.toLowerCase().includes('gown') &&
    !clean.toLowerCase().includes('terno') &&
    !clean.toLowerCase().includes('set') &&
    !clean.toLowerCase().includes('top') &&
    !clean.toLowerCase().includes('skirt')
  ) {
    if (clean.split(' ').length <= 2) {
      return `${clean} Gown`;
    }
  }
  return clean;
}

/**
 * Extract base product model name and variation color from product name
 * e.g. "AURORA BURGUNDY" -> base: "Aurora Gown", color: "Burgundy"
 * e.g. "AURORA OLIVE GREEN" -> base: "Aurora Gown", color: "Olive Green"
 * e.g. "TAMIRA WHITE" -> base: "Tamira Gown", color: "White"
 */
export function extractBaseModelAndVariation(rawName: string, rawColor?: string): {
  baseModelName: string;
  variationName: string;
  hex: string;
  hasDetectedVariation: boolean;
} {
  const trimmed = (rawName || '').trim();
  const lower = trimmed.toLowerCase();

  const colorKeys = Object.keys(COUTURE_COLOR_MAP).sort((a, b) => b.length - a.length);

  if (rawColor && rawColor.trim()) {
    const colorClean = rawColor.trim();
    const hex = getHexForColorName(colorClean);
    let base = trimmed;
    const colorRegex = new RegExp(`[\\s\\-_(]+${colorClean}[\\s\\-_)]*$`, 'i');
    base = base.replace(colorRegex, '').trim();
    if (!base) base = trimmed;
    return {
      baseModelName: normalizeBaseName(base),
      variationName: capitalizeWords(colorClean),
      hex,
      hasDetectedVariation: true,
    };
  }

  for (const colorKey of colorKeys) {
    const regexEnd = new RegExp(`[\\s\\-_(/]+${colorKey}([\\s\\-_)/]*)$`, 'i');
    const regexInParen = new RegExp(`\\(${colorKey}\\)`, 'i');
    const regexHyphen = new RegExp(`-\\s*${colorKey}`, 'i');

    if (regexEnd.test(lower) || regexInParen.test(lower) || regexHyphen.test(lower)) {
      let base = trimmed
        .replace(regexEnd, '')
        .replace(regexInParen, '')
        .replace(regexHyphen, '')
        .trim();

      base = base.replace(/[-_/\s]+$/, '').trim();
      if (!base) base = trimmed;

      return {
        baseModelName: normalizeBaseName(base),
        variationName: capitalizeWords(colorKey),
        hex: COUTURE_COLOR_MAP[colorKey],
        hasDetectedVariation: true,
      };
    }
  }

  return {
    baseModelName: normalizeBaseName(trimmed),
    variationName: 'Classic Edition',
    hex: '#141312',
    hasDetectedVariation: false,
  };
}

/**
 * Check if document is a sale product or invalid banner
 */
export function isSaleOrInvalidProduct(id: string, data: any): boolean {
  const name = String(data?.name || data?.title || data?.model_name || id || '').toLowerCase();
  if (name.includes('slide 1 of 1') || id.toLowerCase().includes('slide 1 of 1')) return true;
  if (name.includes('sale') || id.toLowerCase().includes('sale')) return true;
  if (data?.isSale || data?.is_sale || data?.onSale) return true;
  if (data?.category_name && data.category_name.toLowerCase().includes('sale')) return true;
  return false;
}

/**
 * Determine accurate dress category and product type from title, store, and original category
 */
export function determineDressCategoryAndType(
  name: string,
  store: string,
  rawCategory?: string
): { category: string; productType: string } {
  const n = (name || '').toLowerCase();
  const s = (store || '').toLowerCase();
  const rc = (rawCategory || '').toLowerCase();

  if (rc && rc !== 'sale' && !rc.includes('zsale') && !rc.includes('others')) {
    if (rc.includes('bridal') || rc.includes('wedding')) {
      return { category: 'Bridal Gowns', productType: 'Bridal Gown' };
    }
    if (rc.includes('infinity')) {
      return { category: 'Infinity & Multiway', productType: 'Multiway Infinity Dress' };
    }
    if (rc.includes('midi')) {
      return { category: 'Midi Dresses', productType: 'Midi Dress' };
    }
    if (rc.includes('long')) {
      return { category: 'Long Gowns', productType: 'Long Gown' };
    }
    if (rc.includes('corset') || s.includes('corset')) {
      return { category: 'Corset Gowns', productType: 'Corset Gown' };
    }
  }

  if (n.includes('bridal') || n.includes('wedding')) {
    return { category: 'Bridal Gowns', productType: 'Bridal Gown' };
  }
  if (n.includes('infinity') || n.includes('tulle') || n.includes('alexa')) {
    return { category: 'Infinity & Multiway', productType: 'Multiway Infinity Dress' };
  }
  if (n.includes('midi')) {
    return { category: 'Midi Dresses', productType: 'Midi Dress' };
  }
  if (
    s.includes('corset') ||
    n.includes('corset') ||
    n.includes('aurora') ||
    n.includes('beatrice') ||
    n.includes('areli') ||
    n.includes('cressida') ||
    n.includes('elodia') ||
    n.includes('marica') ||
    n.includes('claudette') ||
    n.includes('belle') ||
    n.includes('eula') ||
    n.includes('cecilia') ||
    n.includes('lucia')
  ) {
    return { category: 'Corset Gowns', productType: 'Corset Gown' };
  }
  if (
    n.includes('long') ||
    n.includes('amore') ||
    n.includes('deana') ||
    n.includes('fidela') ||
    n.includes('tamira') ||
    n.includes('adara') ||
    n.includes('gabriella') ||
    n.includes('antonia')
  ) {
    return { category: 'Long Gowns', productType: 'Long Gown' };
  }
  if (n.includes('set') || n.includes('terno') || n.includes('filipiniana')) {
    return { category: 'Formal Evening', productType: 'Modern Filipiniana Set' };
  }
  return { category: 'Formal Evening', productType: 'Evening Gown' };
}

/**
 * Fetch Admin Rental Pricing Configuration from Firestore doc ('settings/rental_pricing')
 */
export async function fetchRentalPricingConfigFromFirestore(): Promise<RentalPricingConfig | null> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'rental_pricing'));
    if (snap.exists()) {
      const data = snap.data();
      return {
        baseRentalDays: Number(data.baseRentalDays) || 4,
        baseMarkup: data.baseMarkup !== undefined ? Number(data.baseMarkup) : 500,
        extraRatePer4Days: data.extraRatePer4Days !== undefined ? Number(data.extraRatePer4Days) : 500,
        durationOptions:
          Array.isArray(data.durationOptions) && data.durationOptions.length > 0
            ? data.durationOptions
            : [4, 8, 12, 16],
      };
    }
  } catch (err) {
    console.warn('[Firestore] Could not fetch rental pricing config from Firestore:', err);
  }
  return null;
}

/**
 * Save Admin Rental Pricing Configuration to Firestore doc ('settings/rental_pricing')
 */
export async function saveRentalPricingConfigToFirestore(config: RentalPricingConfig): Promise<void> {
  try {
    await setDoc(
      doc(db, 'settings', 'rental_pricing'),
      {
        ...config,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('[Firestore] Failed to save rental pricing config to Firestore:', err);
  }
}

/**
 * Fetch all categories from Firestore collection '/categories' (48 docs)
 * Uses Stale-While-Revalidate pattern with local cache to save Firestore database reads.
 */
export async function fetchFirestoreCategories(): Promise<FirestoreCategory[]> {
  const cached = getCachedCategoriesFromLocalStorage();
  if (cached && cached.length > 0) {
    // Return cached immediately; perform background refresh if stale
    return cached;
  }

  try {
    const snap = await getDocs(collection(db, 'categories'));
    const categories: FirestoreCategory[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const name = data.name || docSnap.id;
      // Exclude sale or junk categories
      if (name.toLowerCase().includes('sale') || name.startsWith('ZZ')) {
        return;
      }
      categories.push({
        id: docSnap.id,
        store_id: data.store_id || '',
        name,
        sort_order: Number(data.sort_order ?? 0),
        scraped_at: data.scraped_at || '',
      });
    });
    categories.sort((a, b) => a.sort_order - b.sort_order);
    if (categories.length > 0) {
      setCachedCategoriesToLocalStorage(categories);
    }
    return categories;
  } catch (error) {
    console.warn('[Firestore] Error fetching categories:', error);
    return cached;
  }
}

/**
 * Subscribe to live category updates from Firestore with cache write-through
 */
export function subscribeToFirestoreCategories(
  onUpdate: (categories: FirestoreCategory[]) => void
): Unsubscribe {
  // Emit cached categories immediately for 0ms initial render
  const cached = getCachedCategoriesFromLocalStorage();
  if (cached && cached.length > 0) {
    onUpdate(cached);
  }

  try {
    return onSnapshot(
      collection(db, 'categories'),
      (snap) => {
        const categories: FirestoreCategory[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const name = data.name || docSnap.id;
          if (name.toLowerCase().includes('sale') || name.startsWith('ZZ')) return;
          categories.push({
            id: docSnap.id,
            store_id: data.store_id || '',
            name,
            sort_order: Number(data.sort_order ?? 0),
            scraped_at: data.scraped_at || '',
          });
        });
        categories.sort((a, b) => a.sort_order - b.sort_order);
        if (categories.length > 0) {
          setCachedCategoriesToLocalStorage(categories);
        }
        onUpdate(categories);
      },
      (error) => {
        console.warn('[Firestore] Categories subscription notice:', error);
      }
    );
  } catch (e) {
    return () => {};
  }
}

/**
 * Fetch all stores from Firestore collection '/stores' (2 docs: Corset Bloomfield and Love Humbly Shop)
 * Uses SWR local cache to save Firestore queries.
 */
export async function fetchFirestoreStores(): Promise<FirestoreStore[]> {
  const cached = getCachedStoresFromLocalStorage();
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    const snap = await getDocs(collection(db, 'stores'));
    const stores: FirestoreStore[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      let ownerParsed = data.owner;
      let socialsParsed = data.socials;
      let businessHoursParsed = data.business_hours;

      if (typeof ownerParsed === 'string' && ownerParsed.startsWith('{')) {
        try { ownerParsed = JSON.parse(ownerParsed); } catch {}
      }
      if (typeof socialsParsed === 'string' && socialsParsed.startsWith('{')) {
        try { socialsParsed = JSON.parse(socialsParsed); } catch {}
      }
      if (typeof businessHoursParsed === 'string' && businessHoursParsed.startsWith('{')) {
        try { businessHoursParsed = JSON.parse(businessHoursParsed); } catch {}
      }

      stores.push({
        id: docSnap.id,
        store_id: data.store_id || docSnap.id,
        slug: data.slug || docSnap.id,
        shop_name: data.shop_name || docSnap.id,
        shop_link: data.shop_link || '',
        shop_image_url: data.shop_image_url || '',
        shop_image_remote_url: data.shop_image_remote_url || '',
        is_vacation: Boolean(data.is_vacation),
        business_hours: businessHoursParsed,
        socials: socialsParsed,
        owner: ownerParsed,
        scraped_at: data.scraped_at || '',
      });
    });
    if (stores.length > 0) {
      setCachedStoresToLocalStorage(stores);
    }
    return stores;
  } catch (error) {
    console.warn('[Firestore] Error fetching stores:', error);
    return cached;
  }
}

/**
 * Subscribe to live stores from Firestore with cache write-through
 */
export function subscribeToFirestoreStores(
  onUpdate: (stores: FirestoreStore[]) => void
): Unsubscribe {
  // Emit cached stores immediately for 0ms initial load
  const cached = getCachedStoresFromLocalStorage();
  if (cached && cached.length > 0) {
    onUpdate(cached);
  }

  try {
    return onSnapshot(
      collection(db, 'stores'),
      (snap) => {
        const stores: FirestoreStore[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          let ownerParsed = data.owner;
          let socialsParsed = data.socials;
          let businessHoursParsed = data.business_hours;

          if (typeof ownerParsed === 'string' && ownerParsed.startsWith('{')) {
            try { ownerParsed = JSON.parse(ownerParsed); } catch {}
          }
          if (typeof socialsParsed === 'string' && socialsParsed.startsWith('{')) {
            try { socialsParsed = JSON.parse(socialsParsed); } catch {}
          }
          if (typeof businessHoursParsed === 'string' && businessHoursParsed.startsWith('{')) {
            try { businessHoursParsed = JSON.parse(businessHoursParsed); } catch {}
          }

          stores.push({
            id: docSnap.id,
            store_id: data.store_id || docSnap.id,
            slug: data.slug || docSnap.id,
            shop_name: data.shop_name || docSnap.id,
            shop_link: data.shop_link || '',
            shop_image_url: data.shop_image_url || '',
            shop_image_remote_url: data.shop_image_remote_url || '',
            is_vacation: Boolean(data.is_vacation),
            business_hours: businessHoursParsed,
            socials: socialsParsed,
            owner: ownerParsed,
            scraped_at: data.scraped_at || '',
          });
        });
        if (stores.length > 0) {
          setCachedStoresToLocalStorage(stores);
        }
        onUpdate(stores);
      },
      (error) => {
        console.warn('[Firestore] Stores subscription notice:', error);
      }
    );
  } catch (e) {
    return () => {};
  }
}

/**
 * Fetch subcollection variations for a product from Firestore:
 * `/products/{rawDocId}/variations`
 * Utilizes memory cache + LocalStorage persistent cache with TTL to eliminate repeated Firestore reads.
 */
export async function fetchProductVariationsFromFirestore(
  garment: Garment
): Promise<FirestoreProductVariation[]> {
  const docIdsToTry: string[] = [];
  if (garment.rawDocIds && garment.rawDocIds.length > 0) {
    const rawIds = garment.rawDocIds.filter((id) => /^[0-9]+-[0-9]+/.test(id));
    const otherIds = garment.rawDocIds.filter((id) => !/^[0-9]+-[0-9]+/.test(id));
    docIdsToTry.push(...rawIds, ...otherIds);
  }
  if (garment.sku) docIdsToTry.push(garment.sku);
  docIdsToTry.push(garment.id);

  const uniqueDocIds = Array.from(new Set(docIdsToTry));

  // 1. Check in-memory cache
  for (const docId of uniqueDocIds) {
    if (variationsMemoryCache.has(docId)) {
      const cached = variationsMemoryCache.get(docId)!;
      recordFirestoreReadSaved(cached.length || 1);
      return cached;
    }
  }

  // 2. Check LocalStorage persistent cache
  for (const docId of uniqueDocIds) {
    try {
      const stored = localStorage.getItem(`${VARIATIONS_CACHE_PREFIX}${docId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const id of uniqueDocIds) {
            variationsMemoryCache.set(id, parsed);
          }
          recordFirestoreReadSaved(parsed.length);
          return parsed;
        }
      }
    } catch {}
  }

  // 3. Query Firestore and cache result
  for (const docId of uniqueDocIds) {
    try {
      const snap = await getDocs(collection(db, 'products', docId, 'variations'));
      if (!snap.empty) {
        const variations: FirestoreProductVariation[] = [];
        snap.forEach((vDoc) => {
          const data = vDoc.data();
          variations.push({
            sku: data.sku || vDoc.id,
            store_id: data.store_id || garment.store_id || '',
            option_name: data.option_name || data.size || data.name || '',
            price: Number(data.price || 0),
            sale_price: Number(data.sale_price || 0),
            quantity: Number(data.quantity || 0),
            available_to_sell: Number(data.available_to_sell || 0),
            width: data.width,
            length: data.length,
            height: data.height,
            weight: data.weight,
            scraped_at: data.scraped_at,
          });
        });

        // Cache in memory and LocalStorage
        for (const id of uniqueDocIds) {
          variationsMemoryCache.set(id, variations);
          try {
            localStorage.setItem(`${VARIATIONS_CACHE_PREFIX}${id}`, JSON.stringify(variations));
          } catch {}
        }
        return variations;
      }
    } catch {
      // Continue to next candidate
    }
  }

  return [];
}

/**
 * Intelligent Aggregator & Normalizer:
 * Takes raw garment documents and groups identical styles (e.g. Aurora Burgundy & Aurora Olive Green)
 * into a single unified parent Garment with rich variations.
 */
export function groupAndNormalizeGarments(rawGarments: Garment[]): Garment[] {
  if (!rawGarments || rawGarments.length === 0) return [];

  const groupedMap = new Map<string, Garment>();

  for (const raw of rawGarments) {
    if (isSaleOrInvalidProduct(raw.id, raw)) {
      continue;
    }

    if (raw.variations && raw.variations.length > 1) {
      groupedMap.set(raw.id, raw);
      continue;
    }

    const { baseModelName, variationName, hex } = extractBaseModelAndVariation(
      raw.name,
      raw.colors[0]?.name
    );

    const storeKey = (raw.designer || raw.store || 'Love Humbly Shop').toLowerCase().trim();
    const groupKey = `${storeKey}:::${baseModelName.toLowerCase().trim()}`;

    const rawThumb = raw.images[0] || '';

    if (!groupedMap.has(groupKey)) {
      const variationObj: GarmentVariation = {
        id: `var-${raw.id}`,
        name: variationName,
        colorName: variationName,
        hex,
        images: deduplicateImageUrls(raw.images),
        sizes: raw.sizes && raw.sizes.length > 0 ? raw.sizes : ['XS', 'S', 'M', 'L', 'XL'],
        sku: raw.sku || `${baseModelName.replace(/\s+/g, '-').toUpperCase()}-${variationName.toUpperCase()}`,
        inStock: true,
        basePrice4Days: raw.basePrice4Days,
      };

      const unified: Garment = {
        ...raw,
        id: raw.id,
        name: baseModelName,
        variations: [variationObj],
        colors: [{ name: variationName, hex, image: rawThumb }],
        images: deduplicateImageUrls(raw.images),
        rawDocIds: raw.rawDocIds || [raw.id],
      };

      groupedMap.set(groupKey, unified);
    } else {
      const existing = groupedMap.get(groupKey)!;

      const newVariation: GarmentVariation = {
        id: `var-${raw.id}`,
        name: variationName,
        colorName: variationName,
        hex,
        images: deduplicateImageUrls(raw.images),
        sizes: raw.sizes && raw.sizes.length > 0 ? raw.sizes : existing.sizes,
        sku: raw.sku || `${baseModelName.replace(/\s+/g, '-').toUpperCase()}-${variationName.toUpperCase()}`,
        inStock: true,
        basePrice4Days: raw.basePrice4Days,
      };

      const currentVariations = existing.variations || [];
      const varExists = currentVariations.some(
        (v) => v.name.toLowerCase() === variationName.toLowerCase()
      );

      if (!varExists) {
        currentVariations.push(newVariation);
      }

      const currentColors = existing.colors || [];
      if (!currentColors.some((c) => c.name.toLowerCase() === variationName.toLowerCase())) {
        currentColors.push({ name: variationName, hex, image: rawThumb });
      }

      const combinedSizes = Array.from(
        new Set([...(existing.sizes || []), ...(raw.sizes || [])])
      ) as GarmentSize[];

      const combinedImages = deduplicateImageUrls([...existing.images, ...raw.images]);

      const rawDocIds = Array.from(new Set([...(existing.rawDocIds || []), ...(raw.rawDocIds || [raw.id])]));

      const mergedUpdatedAt = Math.max(existing.updatedAt || 0, raw.updatedAt || 0);
      const description =
        raw.description && raw.description.length > (existing.description?.length || 0)
          ? raw.description
          : existing.description;

      // Ensure disabled/paused rental status is strictly preserved
      let mergedIsAvailableForRent = true;
      if (existing.is_available_for_rent === false || raw.is_available_for_rent === false) {
        // If either is explicitly disabled, evaluate newer timestamp or default to disabled
        if ((existing.updatedAt || 0) > (raw.updatedAt || 0) && existing.is_available_for_rent !== undefined) {
          mergedIsAvailableForRent = existing.is_available_for_rent;
        } else if ((raw.updatedAt || 0) > (existing.updatedAt || 0) && raw.is_available_for_rent !== undefined) {
          mergedIsAvailableForRent = raw.is_available_for_rent;
        } else {
          mergedIsAvailableForRent = false;
        }
      } else if (existing.is_available_for_rent !== undefined) {
        mergedIsAvailableForRent = existing.is_available_for_rent;
      } else if (raw.is_available_for_rent !== undefined) {
        mergedIsAvailableForRent = raw.is_available_for_rent;
      }

      const mergedStatus =
        existing.status === 'disabled' || raw.status === 'disabled'
          ? 'disabled'
          : (existing.updatedAt || 0) >= (raw.updatedAt || 0)
          ? existing.status || 'active'
          : raw.status || 'active';

      const mergedQuantity =
        existing.quantity !== undefined
          ? existing.quantity
          : raw.quantity !== undefined
          ? raw.quantity
          : 1;

      groupedMap.set(groupKey, {
        ...existing,
        price_min: Math.min(existing.price_min || existing.basePrice4Days, raw.price_min || raw.basePrice4Days),
        price_max: Math.max(existing.price_max || existing.basePrice4Days, raw.price_max || raw.basePrice4Days),
        basePrice4Days: existing.basePrice4Days || raw.basePrice4Days,
        rental_price: existing.rental_price || raw.rental_price,
        retailValue: Math.max(existing.retailValue || 0, raw.retailValue || 0),
        variations: currentVariations,
        colors: currentColors,
        sizes: combinedSizes.length > 0 ? combinedSizes : ['XS', 'S', 'M', 'L', 'XL'],
        images: combinedImages,
        status: mergedStatus,
        is_available_for_rent: mergedIsAvailableForRent,
        quantity: mergedQuantity,
        available_to_sell: mergedIsAvailableForRent && mergedQuantity > 0 ? mergedQuantity : 0,
        rawDocIds,
        updatedAt: mergedUpdatedAt,
        description,
      });
    }
  }

  return Array.from(groupedMap.values());
}

/**
 * Fetch all products from Firestore collection '/products' (330 docs: 124 rental-normalized + 206 raw),
 * merging rental attributes with rich descriptions and photo galleries, then grouping variations.
 */
export async function fetchAllFirestoreProducts(): Promise<Garment[]> {
  try {
    const pSnap = await getDocs(collection(db, 'products'));
    if (pSnap.empty) return [];

    const rentalDocs: Array<{ id: string } & FirestoreRentalProduct> = [];
    const rawDocs: Array<{ id: string } & FirestoreRawProduct> = [];

    pSnap.forEach((d) => {
      const data = d.data() as any;
      if (isSaleOrInvalidProduct(d.id, data)) return;

      if (data.rental_price !== undefined || (data.title !== undefined && data.raw_price !== undefined)) {
        rentalDocs.push({ id: d.id, ...data });
      } else {
        rawDocs.push({ id: d.id, ...data });
      }
    });

    // Index raw documents by product_slug and model_name for instant matching
    const rawBySlug = new Map<string, { id: string } & FirestoreRawProduct>();
    const rawByExactName = new Map<string, { id: string } & FirestoreRawProduct>();
    const rawByCleanName = new Map<string, { id: string } & FirestoreRawProduct>();

    for (const raw of rawDocs) {
      if (raw.product_slug) rawBySlug.set(raw.product_slug.trim().toLowerCase(), raw);
      if (raw.model_name) {
        const nm = raw.model_name.trim().toLowerCase();
        rawByExactName.set(nm, raw);
        rawByCleanName.set(nm.replace(/[^a-z0-9]/g, ''), raw);
      }
    }

    const rawGarments: Garment[] = [];
    const processedRawIds = new Set<string>();

    // 1. Process 124 curated rental-normalized docs, merging matching raw doc metadata
    for (const r of rentalDocs) {
      let matchedRaw: ({ id: string } & FirestoreRawProduct) | null = null;
      if (r.product_url) {
        const parts = r.product_url.split('/');
        const slug = parts[parts.length - 1]?.trim().toLowerCase();
        if (slug && rawBySlug.has(slug)) {
          matchedRaw = rawBySlug.get(slug)!;
        }
      }

      if (!matchedRaw && r.title) {
        const nm = r.title.trim().toLowerCase();
        if (rawByExactName.has(nm)) {
          matchedRaw = rawByExactName.get(nm)!;
        } else {
          const clean = nm.replace(/[^a-z0-9]/g, '');
          if (rawByCleanName.has(clean)) {
            matchedRaw = rawByCleanName.get(clean)!;
          }
        }
      }

      if (matchedRaw) {
        processedRawIds.add(matchedRaw.id);
      }

      // Base pricing & deposit calculations:
      // dressPrice: catalog retail/purchase price of the dress
      const rawPriceClean = (r.raw_price || '').replace(/[^0-9.]/g, '');
      const dressPrice =
        (r.dressPrice ? Number(r.dressPrice) : null) ||
        (matchedRaw ? matchedRaw.price_min || matchedRaw.price_max : null) ||
        (rawPriceClean ? Number(rawPriceClean) : null) ||
        (r.retailValue ? Number(r.retailValue) : null) ||
        (r.basePrice4Days ? Math.max(500, Number(r.basePrice4Days) - 500) : null) ||
        Number(r.rental_price) ||
        2450;

      const retailValue =
        (r.retailValue ? Number(r.retailValue) : null) ||
        Number(rawPriceClean) ||
        dressPrice;

      // Base price for 4 days is dress price + 500 (or custom admin-saved basePrice4Days)
      const basePrice4Days =
        r.basePrice4Days !== undefined
          ? Number(r.basePrice4Days)
          : dressPrice + 500;

      // Rate per 4 extra days: 500 PHP -> 125 PHP/day
      const extraRatePer4Days =
        r.extraRatePer4Days !== undefined
          ? Number(r.extraRatePer4Days)
          : 500;
      const dailyExtraRate =
        r.dailyExtraRate !== undefined
          ? Number(r.dailyExtraRate)
          : Math.round(extraRatePer4Days / 4);

      const securityDeposit =
        r.securityDeposit !== undefined
          ? Number(r.securityDeposit)
          : Math.max(0, Math.round(basePrice4Days * 0.5));
      const quantity =
        r.quantity !== undefined
          ? Number(r.quantity)
          : matchedRaw?.variants_count !== undefined
          ? Number(matchedRaw.variants_count)
          : 1;
      const isAvailableForRent =
        r.is_available_for_rent !== undefined
          ? Boolean(r.is_available_for_rent)
          : matchedRaw?.is_available_for_rent !== false;

      // Build comprehensive image array: supabase_image_url > original_image_url > photos > image_remote_urls
      const rawImages: string[] = [];
      if (r.supabase_image_url) {
        const resolved = resolveFirebaseImageUrl(r.supabase_image_url);
        if (resolved) rawImages.push(resolved);
      }
      if (r.original_image_url) {
        const resolved = resolveFirebaseImageUrl(r.original_image_url);
        if (resolved) rawImages.push(resolved);
      }
      if (matchedRaw?.photos && Array.isArray(matchedRaw.photos)) {
        for (const p of matchedRaw.photos) {
          const resolved = resolveFirebaseImageUrl(p);
          if (resolved) rawImages.push(resolved);
        }
      }
      if (matchedRaw?.image_remote_urls && Array.isArray(matchedRaw.image_remote_urls)) {
        for (const p of matchedRaw.image_remote_urls) {
          const resolved = resolveFirebaseImageUrl(p);
          if (resolved) rawImages.push(resolved);
        }
      }
      const images = deduplicateImageUrls(rawImages);

      const storeOrigin =
        r.store ||
        (matchedRaw?.store_id === 'corsetbloomfield' ? 'Corset Bloomfield' : 'Love Humbly Shop');

      const storeId =
        matchedRaw?.store_id ||
        (storeOrigin.toLowerCase().includes('corset') ? 'corsetbloomfield' : 'love-humbly-shop');

      const { category, productType } = determineDressCategoryAndType(
        r.title,
        storeOrigin,
        matchedRaw?.category_name
      );

      const description =
        matchedRaw?.description ||
        `Handcrafted designer couture piece by ${storeOrigin}. Features refined architectural silhouettes and artisan finishing for premier galas, weddings, and formal occasions.`;

      const garmentSizes: GarmentSize[] = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

      const rawDocIds = matchedRaw ? [r.id, matchedRaw.id] : [r.id];

      const updatedAt =
        r.updated_at?.seconds ? r.updated_at.seconds * 1000 :
        typeof r.updated_at === 'number' ? r.updated_at :
        Date.now();

      rawGarments.push({
        id: r.id,
        sku: matchedRaw?.sku,
        store_id: storeId,
        model_name: matchedRaw?.model_name || r.title,
        title: r.title,
        name: r.title,
        designer: storeOrigin,
        store: storeOrigin,
        productType,
        category: matchedRaw?.category_name || category,
        category_name: matchedRaw?.category_name,
        product_slug: matchedRaw?.product_slug,
        product_url: r.product_url,
        status: matchedRaw?.status || 'active',
        dressPrice,
        price_min: matchedRaw?.price_min || dressPrice,
        price_max: matchedRaw?.price_max || dressPrice,
        raw_price: r.raw_price,
        rental_price: basePrice4Days,
        retailValue,
        basePrice4Days,
        dailyExtraRate,
        extraRatePer4Days,
        securityDeposit,
        sizes: garmentSizes,
        colors: [],
        images: images.length > 0 ? images : ['https://enstack.ph/default.png'],
        original_image_url: r.original_image_url,
        supabase_image_url: r.supabase_image_url,
        photos: matchedRaw?.photos,
        image_remote_urls: matchedRaw?.image_remote_urls,
        description,
        details: [
          'Hand-finished designer couture construction',
          'Premium mikado silk and boned tailoring',
          'Complimentary white-glove dry cleaning included',
        ],
        fabric: storeOrigin.includes('Corset') ? 'Mikado Silk & Structured Corset Boning' : 'Fluid Silk Organza & Crepe',
        silhouette: productType === 'Corset Gown' ? 'Sculpted Bodice Corset' : 'Fluid Column Evening Gown',
        occasion: 'Weddings, Black Tie Galas, Graduation & Formals',
        modelMeasurements: {
          height: "5'9\" (175 cm)",
          bust: '33" (84 cm)',
          waist: '25" (63 cm)',
          hips: '35" (89 cm)',
          wearingSize: 'S',
        },
        careInstructions: 'Complimentary dry cleaning included. Insured courier transit.',
        rating: 4.95,
        reviewCount: 24,
        featured: r.featured !== undefined ? r.featured : true,
        is_available_for_rent: isAvailableForRent,
        quantity,
        available_to_sell: quantity,
        variants_count: matchedRaw?.variants_count || (r.variations ? r.variations.length : 1),
        rawDocIds,
        updatedAt,
      });
    }

    // 2. Also incorporate any active raw products that did not have an existing rental doc
    for (const raw of rawDocs) {
      if (processedRawIds.has(raw.id)) continue;
      if (raw.status === 'sold-out' || raw.is_available_for_rent === false) continue;

      const storeOrigin =
        raw.store_id === 'corsetbloomfield' ? 'Corset Bloomfield' : 'Love Humbly Shop';

      const listPrice = Number(raw.price_min || raw.price_max || 2450);
      const dressPrice = listPrice;
      const basePrice4Days = dressPrice + 500;
      const extraRatePer4Days = 500;
      const dailyExtraRate = 125;
      const securityDeposit = Math.max(0, Math.round(basePrice4Days * 0.5));
      const rawQuantity = raw.variants_count || 1;

      const rawImages: string[] = [];
      if (Array.isArray(raw.photos)) {
        for (const p of raw.photos) {
          const resolved = resolveFirebaseImageUrl(p);
          if (resolved) rawImages.push(resolved);
        }
      }
      if (Array.isArray(raw.image_remote_urls)) {
        for (const p of raw.image_remote_urls) {
          const resolved = resolveFirebaseImageUrl(p);
          if (resolved) rawImages.push(resolved);
        }
      }
      const images = deduplicateImageUrls(rawImages);

      if (images.length === 0) continue;

      const { category, productType } = determineDressCategoryAndType(
        raw.model_name,
        storeOrigin,
        raw.category_name
      );

      rawGarments.push({
        id: raw.id,
        sku: raw.sku,
        store_id: raw.store_id,
        model_name: raw.model_name,
        title: raw.model_name,
        name: raw.model_name,
        designer: storeOrigin,
        store: storeOrigin,
        productType,
        category: raw.category_name || category,
        category_name: raw.category_name,
        product_slug: raw.product_slug,
        status: raw.status,
        dressPrice,
        price_min: raw.price_min || dressPrice,
        price_max: raw.price_max || dressPrice,
        raw_price: `₱${dressPrice.toLocaleString()}`,
        rental_price: basePrice4Days,
        retailValue: dressPrice,
        basePrice4Days,
        dailyExtraRate,
        extraRatePer4Days,
        securityDeposit,
        quantity: rawQuantity,
        available_to_sell: rawQuantity,
        sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
        colors: [],
        images,
        photos: raw.photos,
        image_remote_urls: raw.image_remote_urls,
        description: raw.description || `Handmade couture piece by ${storeOrigin}.`,
        details: [
          'Hand-finished designer couture construction',
          'Premium mikado silk and boned tailoring',
          'Complimentary white-glove dry cleaning included',
        ],
        fabric: storeOrigin.includes('Corset') ? 'Mikado Silk & Structured Corset Boning' : 'Silk Organza',
        silhouette: productType === 'Corset Gown' ? 'Sculpted Bodice Corset' : 'Fluid Column Evening Gown',
        occasion: 'Weddings, Black Tie Galas, Formals',
        modelMeasurements: {
          height: "5'9\" (175 cm)",
          bust: '33" (84 cm)',
          waist: '25" (63 cm)',
          hips: '35" (89 cm)',
          wearingSize: 'S',
        },
        careInstructions: 'Complimentary dry cleaning included.',
        rating: 4.95,
        reviewCount: 16,
        featured: false,
        is_available_for_rent: true,
        variants_count: raw.variants_count,
        rawDocIds: [raw.id],
        updatedAt: Date.now(),
      });
    }

    // 3. Group variants by model style to offer colorway selection on single parent pieces
    const normalizedGarments = groupAndNormalizeGarments(rawGarments);

    if (normalizedGarments.length > 0) {
      setCachedGarmentsToLocalStorage(normalizedGarments);
      normalizedGarments.slice(0, 6).forEach((g) => preloadGarmentVariationImages(g));
    }

    return normalizedGarments;
  } catch (error) {
    console.error('[Firestore] Error in fetchAllFirestoreProducts:', error);
    const cached = getCachedGarmentsFromLocalStorage();
    if (cached.length > 0) return cached;
    throw error;
  }
}

/**
 * Subscribe to real-time updates across Firestore collection '/products'
 */
export function subscribeToFirestoreProducts(
  onUpdate: (garments: Garment[], source: 'firestore' | 'seed') => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let isSubscribed = true;
  let debounceTimer: any = null;

  // 1. Immediately emit cached garments if available for 0ms initial load
  const localCached = getCachedGarmentsFromLocalStorage();
  if (localCached && localCached.length > 0) {
    onUpdate(localCached, 'firestore');
    localCached.slice(0, 4).forEach((g) => preloadGarmentVariationImages(g));
  }

  const triggerFetch = () => {
    if (!isSubscribed) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!isSubscribed) return;
      fetchAllFirestoreProducts()
        .then((garments) => {
          if (!isSubscribed) return;
          if (garments.length > 0) {
            onUpdate(garments, 'firestore');
          }
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    }, 200);
  };

  // Perform initial fetch
  fetchAllFirestoreProducts()
    .then((garments) => {
      if (!isSubscribed) return;
      if (garments.length > 0) {
        onUpdate(garments, 'firestore');
      }
    })
    .catch((err) => {
      console.warn('[Firestore] Initial fetch note:', err);
      if (onError) onError(err);
    });

  // Listen to '/products' collection
  let unsub: Unsubscribe = () => {};
  try {
    unsub = onSnapshot(
      collection(db, 'products'),
      () => {
        triggerFetch();
      },
      (err) => {
        console.warn('[Firestore] Realtime products subscription notice:', err.message);
      }
    );
  } catch (e) {
    // ignore
  }

  return () => {
    isSubscribed = false;
    if (debounceTimer) clearTimeout(debounceTimer);
    unsub();
  };
}

/**
 * Save a garment (with variations) to Firestore ('products' collection)
 */
export async function saveGarmentToFirestore(garment: Garment): Promise<void> {
  try {
    const updatedAt = Date.now();
    const toSave: Garment = {
      ...garment,
      updatedAt,
      is_available_for_rent: garment.is_available_for_rent !== false,
      available_to_sell:
        garment.is_available_for_rent !== false && (garment.quantity || 0) > 0
          ? garment.quantity || 0
          : 0,
      status: garment.status || (garment.is_available_for_rent === false ? 'paused' : 'active'),
    };

    const docRef = doc(db, 'products', garment.id);
    await setDoc(docRef, toSave, { merge: true });

    // Synchronize underlying linked raw doc variations if any
    if (garment.rawDocIds && Array.isArray(garment.rawDocIds)) {
      for (const rawId of garment.rawDocIds) {
        if (rawId && rawId !== garment.id) {
          try {
            const rawRef = doc(db, 'products', rawId);
            await setDoc(
              rawRef,
              {
                is_available_for_rent: toSave.is_available_for_rent,
                available_to_sell: toSave.available_to_sell,
                quantity: toSave.quantity,
                basePrice4Days: toSave.basePrice4Days,
                dailyExtraRate: toSave.dailyExtraRate,
                securityDeposit: toSave.securityDeposit,
                status: toSave.status,
                updated_at: updatedAt,
                updatedAt,
              },
              { merge: true }
            );
          } catch (err) {
            console.warn(`[Firestore] Could not sync sub-document ${rawId}:`, err);
          }
        }
      }
    }

    // Update local cache immediately
    const cached = getCachedGarmentsFromLocalStorage();
    if (cached && cached.length > 0) {
      const idx = cached.findIndex((g) => g.id === garment.id);
      if (idx >= 0) {
        cached[idx] = toSave;
      } else {
        cached.unshift(toSave);
      }
      setCachedGarmentsToLocalStorage(cached);
    }

    if (namedDb && defaultDb && namedDb !== defaultDb) {
      try {
        const defaultRef = doc(defaultDb, 'products', garment.id);
        await setDoc(defaultRef, toSave, { merge: true });
      } catch {}
    }
  } catch (error) {
    console.error('[Firestore] Error saving garment:', error);
    throw error;
  }
}

/**
 * Delete a garment from Firestore
 */
export async function deleteGarmentFromFirestore(garmentId: string): Promise<void> {
  try {
    const docRef = doc(db, 'products', garmentId);
    await deleteDoc(docRef);

    if (namedDb && defaultDb && namedDb !== defaultDb) {
      try {
        const defaultRef = doc(defaultDb, 'products', garmentId);
        await deleteDoc(defaultRef);
      } catch {}
    }
  } catch (error) {
    console.error('[Firestore] Error deleting garment:', error);
    throw error;
  }
}

/**
 * Update images of a specific garment in Firestore
 */
export async function updateGarmentImagesInFirestore(
  garmentId: string,
  newImages: string[]
): Promise<void> {
  try {
    const docRef = doc(db, 'products', garmentId);
    await setDoc(docRef, { images: newImages }, { merge: true });

    if (namedDb && defaultDb && namedDb !== defaultDb) {
      try {
        const defaultRef = doc(defaultDb, 'products', garmentId);
        await setDoc(defaultRef, { images: newImages }, { merge: true });
      } catch {}
    }
  } catch (error) {
    console.error('[Firestore] Error updating garment images:', error);
    throw error;
  }
}

/**
 * Permanent Database Normalization Tool
 */
export async function normalizeFirestoreCatalogDatabase(): Promise<{
  mergedCount: number;
  createdUnifiedCount: number;
  details: string[];
}> {
  const normalized = await fetchAllFirestoreProducts();
  const batch = writeBatch(db);
  const details: string[] = [];
  let mergedCount = 0;

  for (const unified of normalized) {
    const docRef = doc(db, 'products', unified.id);
    batch.set(docRef, unified, { merge: true });

    const varNames = (unified.variations || []).map((v) => v.name).join(', ');
    details.push(`Unified "${unified.name}" with variations: [${varNames}]`);

    if (unified.rawDocIds && unified.rawDocIds.length > 1) {
      for (const oldDocId of unified.rawDocIds) {
        if (oldDocId !== unified.id) {
          const oldRef = doc(db, 'products', oldDocId);
          batch.delete(oldRef);
          mergedCount++;
        }
      }
    }
  }

  await batch.commit();

  return {
    mergedCount,
    createdUnifiedCount: normalized.length,
    details,
  };
}

/**
 * Purge demo / mock seeded garments from Firestore
 */
export async function purgeDemoGarmentsFromFirestore(): Promise<void> {
  const demoIds = [
    'garment-1',
    'garment-2',
    'garment-3',
    'garment-4',
    'garment-5',
    'garment-6',
    'garment-7',
    'garment-8',
  ];
  for (const id of demoIds) {
    try {
      await deleteGarmentFromFirestore(id);
    } catch {}
  }
}
