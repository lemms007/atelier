/**
 * High-performance client-side Image Caching & Preloading Engine
 * Prevents redundant network requests and saves bandwidth across catalog browsing and PDP variation switching.
 */

const MEMORY_LOADED_IMAGES = new Set<string>();
const FAILED_IMAGES = new Set<string>();
const ACTIVE_PRELOAD_PROMISES = new Map<string, Promise<boolean>>();

const IMAGE_CACHE_STORAGE_KEY = 'atelier_image_cache_manifest_v1';
const MAX_PERSISTED_URLS = 150;

// Initialize manifest from sessionStorage to know which images were already validated in this session
try {
  const cached = sessionStorage.getItem(IMAGE_CACHE_STORAGE_KEY);
  if (cached) {
    const list: string[] = JSON.parse(cached);
    list.forEach((url) => MEMORY_LOADED_IMAGES.add(url));
  }
} catch {
  // Session storage unavailable/restricted
}

function persistManifest() {
  try {
    const urls = Array.from(MEMORY_LOADED_IMAGES).slice(-MAX_PERSISTED_URLS);
    sessionStorage.setItem(IMAGE_CACHE_STORAGE_KEY, JSON.stringify(urls));
  } catch {
    // ignore
  }
}

/**
 * Check if an image URL is already loaded and cached in memory
 */
export function isImageCached(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.trim();
  return MEMORY_LOADED_IMAGES.has(cleanUrl);
}

/**
 * Mark an image URL as successfully loaded
 */
export function markImageLoaded(url?: string | null): void {
  if (!url || typeof url !== 'string') return;
  const cleanUrl = url.trim();
  if (cleanUrl.length > 5) {
    MEMORY_LOADED_IMAGES.add(cleanUrl);
    FAILED_IMAGES.delete(cleanUrl);
    // Debounced manifest write
    setTimeout(persistManifest, 1000);
  }
}

/**
 * Mark an image URL as failed/broken to avoid repeating network requests
 */
export function markImageFailed(url?: string | null): void {
  if (!url || typeof url !== 'string') return;
  const cleanUrl = url.trim();
  FAILED_IMAGES.add(cleanUrl);
  MEMORY_LOADED_IMAGES.delete(cleanUrl);
}

/**
 * Check if an image URL is known to be failing
 */
export function isImageFailed(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  return FAILED_IMAGES.has(url.trim());
}

/**
 * Preload a single image in background, deduplicating inflight requests
 */
export function preloadImage(url?: string | null): Promise<boolean> {
  if (!url || typeof url !== 'string') return Promise.resolve(false);
  const clean = url.trim();
  if (clean.length < 6 || clean === 'null' || clean === 'undefined' || clean === '[object Object]') {
    return Promise.resolve(false);
  }

  if (MEMORY_LOADED_IMAGES.has(clean)) {
    return Promise.resolve(true);
  }

  if (FAILED_IMAGES.has(clean)) {
    return Promise.resolve(false);
  }

  if (ACTIVE_PRELOAD_PROMISES.has(clean)) {
    return ACTIVE_PRELOAD_PROMISES.get(clean)!;
  }

  const promise = new Promise<boolean>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      markImageLoaded(clean);
      ACTIVE_PRELOAD_PROMISES.delete(clean);
      resolve(true);
    };

    img.onerror = () => {
      markImageFailed(clean);
      ACTIVE_PRELOAD_PROMISES.delete(clean);
      resolve(false);
    };

    img.src = clean;
  });

  ACTIVE_PRELOAD_PROMISES.set(clean, promise);
  return promise;
}

/**
 * Preload all variation images for a garment (e.g. when opening PDP or hovering a card)
 */
export function preloadGarmentVariationImages(garment: {
  images?: string[];
  variations?: Array<{ images?: string[] }>;
}): void {
  if (!garment) return;

  const urlsToPreload = new Set<string>();

  if (Array.isArray(garment.images)) {
    garment.images.slice(0, 3).forEach((u) => u && urlsToPreload.add(u));
  }

  if (Array.isArray(garment.variations)) {
    garment.variations.forEach((v) => {
      if (Array.isArray(v.images)) {
        v.images.slice(0, 2).forEach((u) => u && urlsToPreload.add(u));
      }
    });
  }

  // Preload in low-priority background sequence
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        urlsToPreload.forEach((url) => preloadImage(url));
      });
    } else {
      setTimeout(() => {
        urlsToPreload.forEach((url) => preloadImage(url));
      }, 200);
    }
  }
}
