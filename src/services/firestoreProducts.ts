import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  Unsubscribe,
  Firestore,
} from 'firebase/firestore';
import { db, defaultDb, namedDb } from '../firebase';
import { Garment, GarmentVariation, GarmentColor, GarmentSize } from '../types';
import { MOCK_GARMENTS } from '../data/garments';
import { preloadGarmentVariationImages } from '../utils/imageCache';

// Local storage key for persistent catalog caching
const PRODUCTS_CACHE_STORAGE_KEY = 'atelier_products_cache_v2';
const PRODUCTS_CACHE_TIMESTAMP_KEY = 'atelier_products_cache_time_v2';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours

/**
 * Retrieve cached garments synchronously from LocalStorage for instant 0ms rendering
 */
export function getCachedGarmentsFromLocalStorage(): Garment[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
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

// Target Firestore collections to scan and listen to
const SCAN_COLLECTIONS = [
  'products',
  'dresses',
  'garments',
  'items',
  'inventory',
  'catalog',
  'rentals',
  'clothing',
  'gowns',
  'outfits',
];

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
  teal: '#008080',
  cyan: '#00FFFF',
  noir: '#141312',
  black: '#141312',
  onyx: '#0F0F0F',
  white: '#FFFFF0',
  ivory: '#FDFBF7',
  cream: '#FFFDD0',
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
 * Resolve any Firebase Storage URI, Google Drive link, or raw URL to a valid loadable image URL
 */
export function resolveFirebaseImageUrl(rawUrl: any, defaultBucket = 'rent-to-slay.firebasestorage.app'): string {
  if (!rawUrl) return '';
  
  if (typeof rawUrl === 'object') {
    const candidate =
      rawUrl.downloadURL ||
      rawUrl.downloadUrl ||
      rawUrl.download_url ||
      rawUrl.url ||
      rawUrl.src ||
      rawUrl.source ||
      rawUrl.storageUrl ||
      rawUrl.storage_url ||
      rawUrl.mediaUrl ||
      rawUrl.media_url ||
      rawUrl.secure_url ||
      rawUrl.path ||
      rawUrl.fullPath ||
      rawUrl.link ||
      rawUrl.uri ||
      rawUrl.file ||
      rawUrl.original ||
      rawUrl.large ||
      rawUrl.thumb ||
      '';
    if (candidate) return resolveFirebaseImageUrl(candidate, defaultBucket);
    return '';
  }

  let str = String(rawUrl).trim();
  if (!str || str === 'null' || str === 'undefined' || str === '[object Object]' || str.length < 5) return '';

  // Handle Google Drive shared link
  if (str.includes('drive.google.com')) {
    const match = str.match(/\/d\/([a-zA-Z0-9_-]+)/) || str.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }

  // Base64 or Blob
  if (str.startsWith('data:image/') || str.startsWith('blob:')) {
    return str;
  }

  // Firebase Storage direct URL - ensure alt=media is present
  if (str.includes('firebasestorage.googleapis.com')) {
    if (!str.includes('alt=media')) {
      str = str.includes('?') ? `${str}&alt=media` : `${str}?alt=media`;
    }
    return str;
  }

  // If gs:// storage protocol (e.g. gs://rent-to-slay.appspot.com/dresses/item1.jpg)
  if (str.startsWith('gs://')) {
    const parts = str.slice(5).split('/');
    const bucket = parts[0] || defaultBucket;
    const filePath = parts.slice(1).join('/');
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filePath)}?alt=media`;
  }

  // If already standard web URL (http/https)
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }

  // Storage path like "images/dress1.jpg" or "products/couture.png" or "uploads/photo.jpg"
  if (
    (str.includes('/') && !str.includes('://')) ||
    /\.(jpg|jpeg|png|webp|avif|gif|heic|bmp)(\?.*)?$/i.test(str)
  ) {
    const cleanPath = str.replace(/^\/+/, '');
    return `https://firebasestorage.googleapis.com/v0/b/${defaultBucket}/o/${encodeURIComponent(cleanPath)}?alt=media`;
  }

  return '';
}

/**
 * Determine hex code from color string
 */
export function getHexForColorName(colorName: string): string {
  if (!colorName) return '#141312';
  const clean = colorName.toLowerCase().trim();
  if (COUTURE_COLOR_MAP[clean]) return COUTURE_COLOR_MAP[clean];
  
  // Try sub-matches (e.g. "Burgundy Silk" -> Burgundy)
  for (const [key, hex] of Object.entries(COUTURE_COLOR_MAP)) {
    if (clean.includes(key)) return hex;
  }
  return '#141312';
}

/**
 * Extract base product model name and variation color from product name
 * e.g. "AURORA BURGUNDY" -> base: "Aurora Gown", color: "Burgundy"
 * e.g. "AURORA OLIVE GREEN" -> base: "Aurora Gown", color: "Olive Green"
 * e.g. "BEATRICE CHAMPAGNE" -> base: "Beatrice Gown", color: "Champagne"
 */
export function extractBaseModelAndVariation(rawName: string, rawColor?: string): {
  baseModelName: string;
  variationName: string;
  hex: string;
  hasDetectedVariation: boolean;
} {
  const trimmed = (rawName || '').trim();
  const lower = trimmed.toLowerCase();

  // Sort color keys by length descending to match compound colors first (e.g., "olive green" before "green")
  const colorKeys = Object.keys(COUTURE_COLOR_MAP).sort((a, b) => b.length - a.length);

  // Check explicit color string first if passed
  if (rawColor && rawColor.trim()) {
    const colorClean = rawColor.trim();
    const hex = getHexForColorName(colorClean);
    let base = trimmed;
    // Strip color from name if it is at the end
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
    // Check if name ends with or contains color indicator
    const regexEnd = new RegExp(`[\\s\\-_(/]+${colorKey}([\\s\\-_)/]*)$`, 'i');
    const regexInParen = new RegExp(`\\(${colorKey}\\)`, 'i');
    const regexHyphen = new RegExp(`-\\s*${colorKey}`, 'i');

    if (regexEnd.test(lower) || regexInParen.test(lower) || regexHyphen.test(lower)) {
      let base = trimmed
        .replace(regexEnd, '')
        .replace(regexInParen, '')
        .replace(regexHyphen, '')
        .trim();
      
      // Clean trailing dashes/slashes
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
    variationName: 'Original Noir',
    hex: '#141312',
    hasDetectedVariation: false,
  };
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
  // If short 1-word name like "Aurora", "Beatrice", add "Gown" for couture elegance if not present
  if (!clean.toLowerCase().includes('dress') && !clean.toLowerCase().includes('gown') && !clean.toLowerCase().includes('terno') && !clean.toLowerCase().includes('set') && !clean.toLowerCase().includes('suit')) {
    if (clean.split(' ').length <= 2) {
      return `${clean} Gown`;
    }
  }
  return clean;
}

/**
 * Check if document is a sale product or invalid banner
 */
export function isSaleOrInvalidProduct(id: string, data: any): boolean {
  const name = String(data?.name || data?.title || id || '').toLowerCase();
  if (name.includes('sale') || id.toLowerCase().includes('sale')) return true;
  if (name.includes('slide 1 of 1') || id.toLowerCase().includes('slide 1 of 1')) return true;
  if (data?.isSale || data?.is_sale || data?.onSale) return true;
  return false;
}

/**
 * Determine accurate dress category and product type from title and store
 */
export function determineDressCategoryAndType(name: string, store: string): { category: string; productType: string } {
  const n = (name || '').toLowerCase();
  const s = (store || '').toLowerCase();

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
    n.includes('cecilia')
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
 * Robust parser for single Firestore document
 */
export function normalizeFirestoreDocToGarment(id: string, data: any): Garment | null {
  // Filter out sale products and invalid items
  if (isSaleOrInvalidProduct(id, data)) {
    return null;
  }

  const rawImageCandidates: any[] = [];

  // Priority 1: Explicit image arrays
  const explicitArrays = [
    data?.images,
    data?.photos,
    data?.imageUrls,
    data?.photoUrls,
    data?.gallery,
    data?.pictures,
    data?.attachments,
    data?.media,
    data?.product?.images,
    data?.details?.images,
  ];
  for (const arr of explicitArrays) {
    if (Array.isArray(arr)) {
      rawImageCandidates.push(...arr);
    }
  }

  // Priority 2: Explicit single image fields
  const explicitSingles = [
    data?.image,
    data?.photo,
    data?.imageUrl,
    data?.photoUrl,
    data?.coverImage,
    data?.coverPhoto,
    data?.heroImage,
    data?.mainImage,
    data?.featuredImage,
    data?.thumbnail,
    data?.thumb,
    data?.downloadURL,
    data?.downloadUrl,
    data?.product?.image,
    data?.details?.image,
  ];
  for (const single of explicitSingles) {
    if (single && !Array.isArray(single)) {
      rawImageCandidates.push(single);
    }
  }

  // Priority 3: Scan remaining properties only if nothing found yet
  if (rawImageCandidates.length === 0 && data && typeof data === 'object') {
    for (const [k, v] of Object.entries(data)) {
      const keyLower = k.toLowerCase();
      if (keyLower === 'url' || keyLower === 'link' || keyLower === 'id' || keyLower === 'href') continue;
      if (
        keyLower.includes('image') ||
        keyLower.includes('photo') ||
        keyLower.includes('picture') ||
        keyLower.includes('gallery') ||
        keyLower.includes('thumb')
      ) {
        if (Array.isArray(v)) rawImageCandidates.push(...v);
        else if (v) rawImageCandidates.push(v);
      }
    }
  }

  // Resolve and filter unique valid image URLs
  const resolvedImages = rawImageCandidates
    .map((cand) => resolveFirebaseImageUrl(cand))
    .filter((url) => {
      if (!url || typeof url !== 'string') return false;
      const trimmed = url.trim();
      if (trimmed.length < 6) return false;
      if (
        trimmed === 'null' ||
        trimmed === 'undefined' ||
        trimmed === '[object Object]' ||
        trimmed === 'true' ||
        trimmed === 'false'
      ) {
        return false;
      }
      return true;
    });

  const uniqueImages = Array.from(new Set(resolvedImages));
  const images: string[] = uniqueImages;

  // Calculate pricing
  const rawPrice =
    data.basePrice4Days ??
    data.rentalPrice ??
    data.rental_price ??
    data.price ??
    data.rentPrice ??
    data.rate ??
    data.cost ??
    3800;
  const basePrice4Days = Math.max(100, Number(rawPrice) || 3800);

  const rawDaily =
    data.dailyExtraRate ??
    data.extraDayRate ??
    data.dailyRate ??
    data.extraPerDay ??
    Math.round(basePrice4Days * 0.15);
  const dailyExtraRate = Math.max(50, Number(rawDaily) || 500);

  const rawDeposit =
    data.securityDeposit ??
    data.deposit ??
    data.depositAmount ??
    data.bond ??
    Math.round(basePrice4Days * 0.7);
  const securityDeposit = Math.max(0, Number(rawDeposit) || 2500);

  const rawRetail =
    data.retailValue ??
    data.originalPrice ??
    data.retailPrice ??
    data.value ??
    data.replacementValue ??
    basePrice4Days * 12;
  const retailValue = Math.max(basePrice4Days, Number(rawRetail) || 55000);

  // Extract sizes
  let sizes: GarmentSize[] = ['XS', 'S', 'M', 'L'];
  if (Array.isArray(data.sizes) && data.sizes.length > 0) {
    sizes = data.sizes.map((s: any) => String(s).trim() as GarmentSize);
  } else if (Array.isArray(data.availableSizes) && data.availableSizes.length > 0) {
    sizes = data.availableSizes.map((s: any) => String(s).trim() as GarmentSize);
  } else if (typeof data.size === 'string' && data.size) {
    sizes = data.size.includes(',')
      ? (data.size.split(',').map((s: string) => s.trim()) as GarmentSize[])
      : ([data.size.trim()] as GarmentSize[]);
  } else if (typeof data.sizes === 'string' && data.sizes) {
    sizes = data.sizes.split(',').map((s: string) => s.trim()) as GarmentSize[];
  }

  // Name / Title with smart formatting
  let rawName =
    data.name ||
    data.title ||
    data.dressName ||
    data.productName ||
    data.item_name ||
    data.label ||
    id ||
    'Designer Couture Gown';

  if (typeof rawName === 'string') {
    rawName = rawName.trim();
  }

  // Designer / Brand / Store Origin
  const rawStore =
    data.store ||
    data.shop ||
    data.source ||
    data.vendor ||
    data.brand ||
    data.brandName ||
    data.designer ||
    data.fashionHouse;

  let storeOrigin = 'Love Humbly Shop';
  const checkStr = `${id} ${rawName} ${rawStore || ''}`.toLowerCase();
  if (checkStr.includes('corset') || checkStr.includes('bloomfield')) {
    storeOrigin = 'Corset Bloomfields';
  } else {
    storeOrigin = 'Love Humbly Shop';
  }

  const designer = storeOrigin;

  // Category and Product Type normalization
  const { category, productType } = determineDressCategoryAndType(rawName, storeOrigin);

  // Check if variations already stored explicitly in Firestore document
  let variations: GarmentVariation[] | undefined = undefined;
  if (Array.isArray(data.variations) && data.variations.length > 0) {
    variations = data.variations.map((v: any, index: number) => {
      const vImages = Array.isArray(v.images)
        ? v.images.map((img: any) => resolveFirebaseImageUrl(img)).filter(Boolean)
        : v.image
        ? [resolveFirebaseImageUrl(v.image)]
        : [];
      const vName = v.name || v.colorName || v.color || `Variation ${index + 1}`;
      const vHex = v.hex || getHexForColorName(vName);
      return {
        id: v.id || `var-${index}-${Date.now()}`,
        name: vName,
        colorName: v.colorName || vName,
        hex: vHex,
        images: vImages.length > 0 ? vImages : images,
        sizes: Array.isArray(v.sizes) ? v.sizes : sizes,
        sku: v.sku || `${id}-V${index + 1}`,
        inStock: v.inStock ?? true,
        basePrice4Days: v.basePrice4Days || basePrice4Days,
      };
    });
  }

  // Extract / derive colors
  let colors: GarmentColor[] = [];
  if (variations && variations.length > 0) {
    colors = variations.map((v) => ({
      name: v.name,
      hex: v.hex || getHexForColorName(v.name),
      image: v.images[0],
    }));
  } else if (Array.isArray(data.colors) && data.colors.length > 0) {
    colors = data.colors.map((c: any) =>
      typeof c === 'string'
        ? { name: c, hex: getHexForColorName(c) }
        : { name: c.name || 'Noir', hex: c.hex || getHexForColorName(c.name || 'Noir') }
    );
  } else if (typeof data.color === 'string' && data.color) {
    colors = [{ name: data.color, hex: getHexForColorName(data.color) }];
  } else {
    // Try extract from product name
    const detected = extractBaseModelAndVariation(rawName, data.color);
    if (detected.hasDetectedVariation) {
      colors = [{ name: detected.variationName, hex: detected.hex }];
    } else {
      colors = [{ name: 'Onyx Noir', hex: '#141312' }];
    }
  }

  // Description directly from Firestore if available
  let description =
    data.description ||
    data.detailsText ||
    data.desc ||
    data.product_description ||
    data.details_text ||
    data.caption ||
    data.summary;

  if (typeof description === 'string' && description.trim().length > 0) {
    description = description.trim();
  } else {
    // Tailored description for dress type and store
    if (storeOrigin === 'Corset Bloomfields') {
      description = `Sculpted with artisanal corset boning, structured bodice architecture, and romantic couture draping. Designed by Corset Bloomfields for weddings, galas, and momentous celebrations.`;
    } else {
      description = `An effortlessly graceful silhouette crafted from fluid fabric with luminous drape and timeless movement. Curated by Love Humbly Shop for premier formal events.`;
    }
  }

  const details = Array.isArray(data.details)
    ? data.details
    : [
        'Hand-finished couture construction',
        'Premium silk and structured boning',
        'Complimentary white-glove dry cleaning',
      ];

  const updatedAt =
    data.updated_at?.seconds ? data.updated_at.seconds * 1000 :
    data.updatedAt?.seconds ? data.updatedAt.seconds * 1000 :
    typeof data.updatedAt === 'number' ? data.updatedAt :
    typeof data.createdAt === 'number' ? data.createdAt :
    Date.now();

  return {
    id: id || data.id || `garment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: rawName,
    designer,
    store: storeOrigin,
    productType,
    category,
    retailValue,
    basePrice4Days,
    dailyExtraRate,
    securityDeposit,
    sizes,
    colors,
    variations,
    images,
    description,
    details,
    fabric: data.fabric || data.material || (storeOrigin === 'Corset Bloomfields' ? 'Structured Satin & Boned Tulle' : 'Mulberry Silk & Organza'),
    silhouette: data.silhouette || data.cut || (productType === 'Corset Gown' ? 'Sculpted Bodice Corset' : productType === 'Multiway Infinity Dress' ? 'Convertible Flared A-Line' : 'Sculpted Column'),
    occasion: data.occasion || 'Evening Gala, Black Tie Events, Weddings',
    modelMeasurements: data.modelMeasurements || {
      height: "5'9\" (175 cm)",
      bust: '33" (84 cm)',
      waist: '25" (63 cm)',
      hips: '35" (89 cm)',
      wearingSize: 'S',
    },
    careInstructions:
      data.careInstructions ||
      'Complimentary dry cleaning included. Insured white glove courier transit.',
    rating: Number(data.rating) || 4.95,
    reviewCount: Number(data.reviewCount) || 18,
    featured: Boolean(data.featured ?? true),
    rawDocIds: [id],
    updatedAt,
  };
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

    // If the document already has explicit multi-variations stored from Firestore, keep it as is
    if (raw.variations && raw.variations.length > 1) {
      groupedMap.set(raw.id, raw);
      continue;
    }

    const { baseModelName, variationName, hex } = extractBaseModelAndVariation(raw.name, raw.colors[0]?.name);

    // Grouping key: Normalized Designer + Base Model Name
    const groupKey = `${(raw.designer || raw.store || 'Love Humbly Shop').toLowerCase().trim()}:::${baseModelName.toLowerCase().trim()}`;

    if (!groupedMap.has(groupKey)) {
      // First variation for this base model
      const variationObj: GarmentVariation = {
        id: `var-${raw.id}`,
        name: variationName,
        colorName: variationName,
        hex,
        images: raw.images.length > 0 ? raw.images : [],
        sizes: raw.sizes,
        sku: `${baseModelName.replace(/\s+/g, '-').toUpperCase()}-${variationName.toUpperCase()}`,
        inStock: true,
        basePrice4Days: raw.basePrice4Days,
      };

      const unified: Garment = {
        ...raw,
        id: raw.id,
        name: baseModelName,
        variations: [variationObj],
        colors: [{ name: variationName, hex, image: raw.images[0] }],
        images: [...raw.images],
        rawDocIds: [raw.id],
      };

      groupedMap.set(groupKey, unified);
    } else {
      // Merge into existing parent base model
      const existing = groupedMap.get(groupKey)!;

      const newVariation: GarmentVariation = {
        id: `var-${raw.id}`,
        name: variationName,
        colorName: variationName,
        hex,
        images: raw.images.length > 0 ? raw.images : [],
        sizes: raw.sizes,
        sku: `${baseModelName.replace(/\s+/g, '-').toUpperCase()}-${variationName.toUpperCase()}`,
        inStock: true,
        basePrice4Days: raw.basePrice4Days,
      };

      // Check if this variation already exists in parent
      const currentVariations = existing.variations || [];
      const varExists = currentVariations.some(
        (v) => v.name.toLowerCase() === variationName.toLowerCase()
      );

      if (!varExists) {
        currentVariations.push(newVariation);
      }

      // Merge unique colors
      const currentColors = existing.colors || [];
      if (!currentColors.some((c) => c.name.toLowerCase() === variationName.toLowerCase())) {
        currentColors.push({ name: variationName, hex, image: raw.images[0] });
      }

      // Merge unique sizes
      const combinedSizes = Array.from(new Set([...existing.sizes, ...raw.sizes])) as GarmentSize[];

      // Merge unique images
      const combinedImages = Array.from(new Set([...existing.images, ...raw.images]));

      // Merge raw doc IDs
      const rawDocIds = Array.from(new Set([...(existing.rawDocIds || []), raw.id]));

      // Keep latest updatedAt and preferred description
      const updatedAt = Math.max(existing.updatedAt || 0, raw.updatedAt || 0);
      const description = (raw.description && raw.description.length > (existing.description?.length || 0))
        ? raw.description
        : existing.description;

      groupedMap.set(groupKey, {
        ...existing,
        variations: currentVariations,
        colors: currentColors,
        sizes: combinedSizes,
        images: combinedImages,
        rawDocIds,
        updatedAt,
        description,
      });
    }
  }

  return Array.from(groupedMap.values());
}

/**
 * Fetch all products across known collections and databases in Firestore, with automatic normalization and local caching
 */
export async function fetchAllFirestoreProducts(): Promise<Garment[]> {
  const databasesToScan: Firestore[] = [db];
  if (namedDb && defaultDb && namedDb !== defaultDb) {
    databasesToScan.push(defaultDb);
  }

  const rawGarmentsMap = new Map<string, Garment>();

  for (const currentDb of databasesToScan) {
    // Check main collections first to save bandwidth
    const priorityCollections = ['products', 'dresses', 'garments'];
    for (const colName of priorityCollections) {
      try {
        const snap = await getDocs(collection(currentDb, colName));
        if (!snap.empty) {
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            const garment = normalizeFirestoreDocToGarment(docSnap.id, data);
            if (garment && !rawGarmentsMap.has(garment.id)) {
              rawGarmentsMap.set(garment.id, garment);
            }
          });
        }
      } catch {
        // Continue
      }
    }

    // Only scan secondary collections if nothing was found in priority collections
    if (rawGarmentsMap.size === 0) {
      const secondaryCollections = ['items', 'inventory', 'catalog', 'rentals', 'clothing', 'gowns', 'outfits'];
      for (const colName of secondaryCollections) {
        try {
          const snap = await getDocs(collection(currentDb, colName));
          if (!snap.empty) {
            snap.forEach((docSnap) => {
              const data = docSnap.data();
              const garment = normalizeFirestoreDocToGarment(docSnap.id, data);
              if (garment && !rawGarmentsMap.has(garment.id)) {
                rawGarmentsMap.set(garment.id, garment);
              }
            });
          }
        } catch {
          // Continue
        }
      }
    }
  }

  const rawList = Array.from(rawGarmentsMap.values());
  // Apply smart variation normalization across all discovered garments
  const normalized = groupAndNormalizeGarments(rawList);

  if (normalized.length > 0) {
    setCachedGarmentsToLocalStorage(normalized);
    // Preload cover images for the top garments in the background
    normalized.slice(0, 6).forEach((g) => preloadGarmentVariationImages(g));
  }

  return normalized;
}

/**
 * Subscribe to real-time updates across Firestore collections with automatic variation grouping,
 * local storage caching, and debounced snapshot dispatching.
 */
export function subscribeToFirestoreProducts(
  onUpdate: (garments: Garment[], source: 'firestore' | 'seed') => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let isSubscribed = true;
  const unsubs: Unsubscribe[] = [];
  const rawDocMap = new Map<string, Garment>();
  let debounceTimer: any = null;

  // 1. Immediately emit cached garments if available to eliminate loading latency and unnecessary network reliance
  const localCached = getCachedGarmentsFromLocalStorage();
  if (localCached && localCached.length > 0) {
    onUpdate(localCached, 'firestore');
    // Preload top images from cache
    localCached.slice(0, 4).forEach((g) => preloadGarmentVariationImages(g));
  }

  const triggerUpdate = () => {
    if (!isSubscribed) return;
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      if (!isSubscribed) return;
      const rawList = Array.from(rawDocMap.values());
      const normalized = groupAndNormalizeGarments(rawList);
      if (normalized.length > 0) {
        setCachedGarmentsToLocalStorage(normalized);
        normalized.slice(0, 6).forEach((g) => preloadGarmentVariationImages(g));
        onUpdate(normalized, 'firestore');
      }
    }, 150);
  };

  // Perform initial deep scan
  fetchAllFirestoreProducts()
    .then((initialNormalizedGarments) => {
      if (!isSubscribed) return;
      if (initialNormalizedGarments.length > 0) {
        onUpdate(initialNormalizedGarments, 'firestore');
      }
    })
    .catch((err) => {
      console.warn('[Firestore] Initial fetch note:', err);
      if (onError) onError(err);
      if (isSubscribed && localCached.length === 0) {
        onUpdate([], 'firestore');
      }
    });

  // Setup real-time listeners for primary collections only
  const primaryCollections = ['products', 'dresses', 'garments'];
  const targetDatabases: Firestore[] = [db];
  if (namedDb && defaultDb && namedDb !== defaultDb) {
    targetDatabases.push(defaultDb);
  }

  targetDatabases.forEach((database) => {
    primaryCollections.forEach((colName) => {
      try {
        const unsub = onSnapshot(
          collection(database, colName),
          (snapshot) => {
            if (!isSubscribed) return;
            if (!snapshot.empty) {
              snapshot.docChanges().forEach((change) => {
                const docId = change.doc.id;
                if (change.type === 'removed') {
                  rawDocMap.delete(docId);
                } else {
                  const garment = normalizeFirestoreDocToGarment(docId, change.doc.data());
                  if (garment) {
                    rawDocMap.set(docId, garment);
                  } else {
                    rawDocMap.delete(docId);
                  }
                }
              });
              triggerUpdate();
            }
          },
          (err) => {
            console.log(`[Firestore] Notice on ${colName}:`, err.message);
          }
        );
        unsubs.push(unsub);
      } catch {
        // ignore
      }
    });
  });

  return () => {
    isSubscribed = false;
    if (debounceTimer) clearTimeout(debounceTimer);
    unsubs.forEach((u) => {
      try {
        u();
      } catch {
        // ignore
      }
    });
  };
}

/**
 * Seed initial garments to both primary and default databases
 */
export async function seedInitialGarmentsToFirestore(): Promise<Garment[]> {
  try {
    const batch = writeBatch(db);
    for (const garment of MOCK_GARMENTS) {
      const docRef = doc(db, 'products', garment.id);
      batch.set(docRef, garment, { merge: true });
    }
    await batch.commit();
    console.log('[Firestore] Successfully seeded garments to Firestore');
    return MOCK_GARMENTS;
  } catch (error) {
    console.error('[Firestore] Seeding error:', error);
    return MOCK_GARMENTS;
  }
}

/**
 * Save a garment (with its variations) to Firestore ('products' collection)
 */
export async function saveGarmentToFirestore(garment: Garment): Promise<void> {
  try {
    const docRef = doc(db, 'products', garment.id);
    await setDoc(docRef, garment, { merge: true });

    // Also write to defaultDb if separate
    if (namedDb && defaultDb && namedDb !== defaultDb) {
      try {
        const defaultRef = doc(defaultDb, 'products', garment.id);
        await setDoc(defaultRef, garment, { merge: true });
      } catch {
        // ignore
      }
    }
    console.log(`[Firestore] Saved garment "${garment.name}" (${garment.id}) with variations to Firestore`);
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
      } catch {
        // ignore
      }
    }
    console.log(`[Firestore] Deleted garment ${garmentId} from Firestore`);
  } catch (error) {
    console.error('[Firestore] Error deleting garment:', error);
    throw error;
  }
}

/**
 * Update images of a specific garment in Firestore
 */
export async function updateGarmentImagesInFirestore(garmentId: string, newImages: string[]): Promise<void> {
  try {
    const docRef = doc(db, 'products', garmentId);
    await setDoc(docRef, { images: newImages, image: newImages[0] || '' }, { merge: true });

    if (namedDb && defaultDb && namedDb !== defaultDb) {
      try {
        const defaultRef = doc(defaultDb, 'products', garmentId);
        await setDoc(defaultRef, { images: newImages, image: newImages[0] || '' }, { merge: true });
      } catch {
        // ignore
      }
    }
    console.log(`[Firestore] Updated images for garment ${garmentId}`);
  } catch (error) {
    console.error('[Firestore] Error updating garment images:', error);
    throw error;
  }
}

/**
 * Permanent Database Normalization Tool:
 * Reads all existing raw documents in Firestore, consolidates variant documents into
 * unified master documents with variations, writes them to Firestore, and archives
 * redundant fragmented records.
 */
export async function normalizeFirestoreCatalogDatabase(): Promise<{
  mergedCount: number;
  createdUnifiedCount: number;
  details: string[];
}> {
  const rawGarmentsMap = new Map<string, Garment>();

  // 1. Fetch all raw documents from 'products' collection
  const snap = await getDocs(collection(db, 'products'));
  snap.forEach((docSnap) => {
    const g = normalizeFirestoreDocToGarment(docSnap.id, docSnap.data());
    rawGarmentsMap.set(g.id, g);
  });

  const rawList = Array.from(rawGarmentsMap.values());
  const normalized = groupAndNormalizeGarments(rawList);

  const batch = writeBatch(db);
  const details: string[] = [];
  let mergedCount = 0;

  for (const unified of normalized) {
    const docRef = doc(db, 'products', unified.id);
    batch.set(docRef, unified, { merge: true });
    
    const varNames = (unified.variations || []).map((v) => v.name).join(', ');
    details.push(`Unified "${unified.name}" with variations: [${varNames}]`);

    // Clean up fragmented duplicate docs that were merged into this parent
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
  const demoIds = ['garment-1', 'garment-2', 'garment-3', 'garment-4', 'garment-5', 'garment-6', 'garment-7', 'garment-8'];
  for (const id of demoIds) {
    try {
      await deleteGarmentFromFirestore(id);
    } catch {
      // ignore
    }
  }
}
