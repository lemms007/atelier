/**
 * High-performance Multi-Tier Image Caching & Bandwidth Saver Engine
 * 
 * Tiers:
 * 1. In-Memory Blob URL / Data URL Cache (Instant 0ms synchronous render)
 * 2. Browser CacheStorage API ('atelier-images-v2') for persistent offline/cached binary responses
 * 3. In-Flight Request Deduplication Pool (Prevents concurrent duplicate network trips)
 * 4. Background Preload Queue with requestIdleCallback / IntersectionObserver
 * 5. Bandwidth & Cache Telemetry Tracker (Calculates saved bytes and hit rates)
 */

const CACHE_NAME = 'atelier-images-v2';
const METRICS_STORAGE_KEY = 'atelier_cache_metrics_v2';
const MEMORY_BLOB_CACHE = new Map<string, string>(); // url -> blob/objectUrl
const MEMORY_LOADED_SET = new Set<string>();
const FAILED_IMAGES_SET = new Set<string>();
const ACTIVE_FETCH_PROMISES = new Map<string, Promise<string | null>>();

export interface CacheMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  bytesSaved: number; // in bytes
  lastUpdated: number;
}

let metrics: CacheMetrics = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  bytesSaved: 0,
  lastUpdated: Date.now(),
};

// Initialize metrics from localStorage
try {
  const savedMetrics = localStorage.getItem(METRICS_STORAGE_KEY);
  if (savedMetrics) {
    const parsed = JSON.parse(savedMetrics);
    if (parsed && typeof parsed.cacheHits === 'number') {
      metrics = parsed;
    }
  }
} catch {
  // Local storage restricted
}

function persistMetrics(): void {
  try {
    metrics.lastUpdated = Date.now();
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    // ignore
  }
}

export function getCacheMetrics(): CacheMetrics {
  return { ...metrics };
}

export function resetCacheMetrics(): void {
  metrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    bytesSaved: 0,
    lastUpdated: Date.now(),
  };
  persistMetrics();
}

/**
 * Check if the browser supports CacheStorage API
 */
const hasCacheStorage = typeof window !== 'undefined' && 'caches' in window;

/**
 * Check if an image is already in memory cache
 */
export function isImageCached(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  return MEMORY_LOADED_SET.has(clean) || MEMORY_BLOB_CACHE.has(clean);
}

/**
 * Get memory blob URL if cached
 */
export function getCachedBlobUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  return MEMORY_BLOB_CACHE.get(url.trim()) || null;
}

/**
 * Mark image loaded and record cache hit/save
 */
export function markImageLoaded(url?: string | null, fromCache: boolean = false, estimatedBytes: number = 180000): void {
  if (!url || typeof url !== 'string') return;
  const clean = url.trim();
  if (clean.length < 6) return;

  MEMORY_LOADED_SET.add(clean);
  FAILED_IMAGES_SET.delete(clean);

  metrics.totalRequests += 1;
  if (fromCache) {
    metrics.cacheHits += 1;
    metrics.bytesSaved += estimatedBytes;
  } else {
    metrics.cacheMisses += 1;
  }
  persistMetrics();
}

/**
 * Mark image failed
 */
export function markImageFailed(url?: string | null): void {
  if (!url || typeof url !== 'string') return;
  const clean = url.trim();
  FAILED_IMAGES_SET.add(clean);
  MEMORY_LOADED_SET.delete(clean);
  MEMORY_BLOB_CACHE.delete(clean);
}

/**
 * Check if image is known broken
 */
export function isImageFailed(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  return FAILED_IMAGES_SET.has(url.trim());
}

/**
 * Fetch and cache an image using CacheStorage and Object URL for maximum bandwidth reduction.
 * If CacheStorage is unavailable or CORS blocks fetch, falls back seamlessly to standard Image element preloading.
 */
export async function getCachedOrFetchImage(url?: string | null): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  if (clean.length < 6 || clean.startsWith('blob:') || clean.startsWith('data:')) {
    return clean;
  }

  if (FAILED_IMAGES_SET.has(clean)) {
    return null;
  }

  // Tier 1: Check In-Memory Blob Cache
  if (MEMORY_BLOB_CACHE.has(clean)) {
    markImageLoaded(clean, true, 180000);
    return MEMORY_BLOB_CACHE.get(clean)!;
  }

  // Deduplicate in-flight requests
  if (ACTIVE_FETCH_PROMISES.has(clean)) {
    return ACTIVE_FETCH_PROMISES.get(clean)!;
  }

  const fetchPromise = (async (): Promise<string | null> => {
    try {
      // Tier 2: Check CacheStorage
      if (hasCacheStorage) {
        try {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(clean);

          if (cachedResponse && cachedResponse.ok) {
            const blob = await cachedResponse.blob();
            const blobUrl = URL.createObjectURL(blob);
            MEMORY_BLOB_CACHE.set(clean, blobUrl);
            markImageLoaded(clean, true, blob.size || 200000);
            return blobUrl;
          }

          // Fetch from network with CORS mode to store in cache
          const response = await fetch(clean, {
            mode: 'cors',
            credentials: 'omit',
            cache: 'force-cache',
          });

          if (response.ok) {
            // Clone before putting into cache
            const responseClone = response.clone();
            const blob = await response.blob();
            
            try {
              await cache.put(clean, responseClone);
            } catch {
              // Cache put failed (e.g. storage full)
            }

            const blobUrl = URL.createObjectURL(blob);
            MEMORY_BLOB_CACHE.set(clean, blobUrl);
            markImageLoaded(clean, false, 0);
            return blobUrl;
          }
        } catch {
          // CORS or CacheStorage restricted, fallback to standard img loading
        }
      }

      // Tier 3: Standard Image Preloader Fallback
      return new Promise<string | null>((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';

        img.onload = () => {
          markImageLoaded(clean, false, 0);
          resolve(clean);
        };

        img.onerror = () => {
          markImageFailed(clean);
          resolve(null);
        };

        img.src = clean;
      });
    } catch {
      markImageFailed(clean);
      return null;
    } finally {
      ACTIVE_FETCH_PROMISES.delete(clean);
    }
  })();

  ACTIVE_FETCH_PROMISES.set(clean, fetchPromise);
  return fetchPromise;
}

/**
 * Preload a single image in background
 */
export function preloadImage(url?: string | null): Promise<boolean> {
  if (!url || typeof url !== 'string') return Promise.resolve(false);
  const clean = url.trim();
  if (clean.length < 6 || clean === 'null' || clean === 'undefined' || clean === '[object Object]') {
    return Promise.resolve(false);
  }

  if (isImageCached(clean)) {
    return Promise.resolve(true);
  }

  return getCachedOrFetchImage(clean).then((res) => !!res);
}

/**
 * Preload all images for a garment's variations (for hover & PDP pre-warming)
 */
export function preloadGarmentVariationImages(garment: {
  images?: string[];
  variations?: Array<{ images?: string[] }>;
}): void {
  if (!garment) return;

  const urlsToPreload = new Set<string>();

  if (Array.isArray(garment.images)) {
    garment.images.slice(0, 4).forEach((u) => u && urlsToPreload.add(u));
  }

  if (Array.isArray(garment.variations)) {
    garment.variations.forEach((v) => {
      if (Array.isArray(v.images)) {
        v.images.slice(0, 3).forEach((u) => u && urlsToPreload.add(u));
      }
    });
  }

  if (typeof window !== 'undefined') {
    const queuePreloads = () => {
      urlsToPreload.forEach((url) => {
        preloadImage(url);
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(queuePreloads);
    } else {
      setTimeout(queuePreloads, 150);
    }
  }
}

/**
 * Purge entire browser image cache
 */
export async function clearAllImageCache(): Promise<{ deleted: boolean; count: number }> {
  let count = MEMORY_BLOB_CACHE.size + MEMORY_LOADED_SET.size;
  MEMORY_BLOB_CACHE.forEach((blobUrl) => {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch {}
  });
  MEMORY_BLOB_CACHE.clear();
  MEMORY_LOADED_SET.clear();
  FAILED_IMAGES_SET.clear();

  if (hasCacheStorage) {
    try {
      const deleted = await caches.delete(CACHE_NAME);
      return { deleted, count };
    } catch {
      return { deleted: false, count };
    }
  }

  return { deleted: true, count };
}

/**
 * Get total number of cached image entries across memory & storage
 */
export async function getCachedImagesCount(): Promise<number> {
  let count = MEMORY_LOADED_SET.size;
  if (hasCacheStorage) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      count = Math.max(count, keys.length);
    } catch {}
  }
  return count;
}
