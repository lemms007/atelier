/**
 * Central Application Cache & Bandwidth Optimization Manager
 * Coordinates:
 * - Firestore Document & Query Caching (Products, Categories, Stores, Variations)
 * - Multi-tier Image Caching (CacheStorage + Blob Memory)
 * - Bandwidth & Firestore Read Reduction Telemetry
 */

import {
  getCacheMetrics,
  resetCacheMetrics,
  clearAllImageCache,
  getCachedImagesCount,
  preloadImage,
  preloadGarmentVariationImages,
  CacheMetrics,
} from '../utils/imageCache';
import { Garment } from '../types';

export interface SystemCacheStats {
  imageMetrics: CacheMetrics;
  cachedImagesCount: number;
  firestoreCachedProducts: number;
  firestoreCachedCategories: number;
  firestoreCachedStores: number;
  firestoreCachedVariations: number;
  estimatedBandwidthSavedMB: number;
  estimatedFirestoreReadsSaved: number;
}

const PRODUCTS_CACHE_STORAGE_KEY = 'atelier_products_cache_v7';
const CATEGORIES_CACHE_STORAGE_KEY = 'atelier_categories_cache_v2';
const STORES_CACHE_STORAGE_KEY = 'atelier_stores_cache_v2';
const VARIATIONS_CACHE_PREFIX = 'atelier_var_cache_';
const FIRESTORE_READS_SAVED_KEY = 'atelier_firestore_reads_saved_v1';

let firestoreReadsSaved = 0;
try {
  const saved = localStorage.getItem(FIRESTORE_READS_SAVED_KEY);
  if (saved) {
    firestoreReadsSaved = parseInt(saved, 10) || 0;
  }
} catch {}

export function recordFirestoreReadSaved(count: number = 1): void {
  firestoreReadsSaved += count;
  try {
    localStorage.setItem(FIRESTORE_READS_SAVED_KEY, firestoreReadsSaved.toString());
  } catch {}
}

/**
 * Get comprehensive snapshot of current cache performance & bandwidth savings
 */
export async function getSystemCacheStats(): Promise<SystemCacheStats> {
  const imageMetrics = getCacheMetrics();
  const cachedImagesCount = await getCachedImagesCount();

  let productsCount = 0;
  let categoriesCount = 0;
  let storesCount = 0;
  let variationsCount = 0;

  try {
    const p = localStorage.getItem(PRODUCTS_CACHE_STORAGE_KEY);
    if (p) productsCount = (JSON.parse(p) || []).length;

    const c = localStorage.getItem(CATEGORIES_CACHE_STORAGE_KEY);
    if (c) categoriesCount = (JSON.parse(c) || []).length;

    const s = localStorage.getItem(STORES_CACHE_STORAGE_KEY);
    if (s) storesCount = (JSON.parse(s) || []).length;

    // Count variation keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(VARIATIONS_CACHE_PREFIX)) {
        variationsCount++;
      }
    }
  } catch {}

  const imageBytesSaved = imageMetrics.bytesSaved;
  // Estimate ~3.5 KB saved per cached Firestore doc read
  const firestoreBytesSaved = firestoreReadsSaved * 3500;
  const totalMB = (imageBytesSaved + firestoreBytesSaved) / (1024 * 1024);

  return {
    imageMetrics,
    cachedImagesCount,
    firestoreCachedProducts: productsCount,
    firestoreCachedCategories: categoriesCount,
    firestoreCachedStores: storesCount,
    firestoreCachedVariations: variationsCount,
    estimatedBandwidthSavedMB: Number(totalMB.toFixed(2)),
    estimatedFirestoreReadsSaved: firestoreReadsSaved,
  };
}

/**
 * Warm up cache by preloading top catalog images into browser CacheStorage & memory
 */
export async function warmUpCatalogCache(garments: Garment[], onProgress?: (completed: number, total: number) => void): Promise<{ preloaded: number }> {
  if (!Array.isArray(garments) || garments.length === 0) return { preloaded: 0 };

  const allUrls: string[] = [];

  garments.forEach((g) => {
    if (Array.isArray(g.images)) {
      g.images.slice(0, 3).forEach((u) => u && allUrls.push(u));
    }
    if (Array.isArray(g.variations)) {
      g.variations.forEach((v) => {
        if (Array.isArray(v.images)) {
          v.images.slice(0, 2).forEach((u) => u && allUrls.push(u));
        }
      });
    }
  });

  const uniqueUrls = Array.from(new Set(allUrls.filter((u) => u && u.length > 5)));
  let completed = 0;

  // Process concurrently in chunks of 5
  const chunkSize = 5;
  for (let i = 0; i < uniqueUrls.length; i += chunkSize) {
    const chunk = uniqueUrls.slice(i, i + chunkSize);
    await Promise.all(chunk.map((url) => preloadImage(url)));
    completed += chunk.length;
    if (onProgress) {
      onProgress(completed, uniqueUrls.length);
    }
  }

  return { preloaded: uniqueUrls.length };
}

/**
 * Purge all application caches (Images, Firestore local tables, variations, and metrics)
 */
export async function purgeAllApplicationCaches(): Promise<{ success: boolean; details: string }> {
  try {
    // 1. Purge Image CacheStorage & Blob URLs
    await clearAllImageCache();

    // 2. Clear LocalStorage cache keys
    const keysToRemove = [
      PRODUCTS_CACHE_STORAGE_KEY,
      CATEGORIES_CACHE_STORAGE_KEY,
      STORES_CACHE_STORAGE_KEY,
      'atelier_products_cache_time_v7',
      'atelier_categories_cache_time_v2',
      'atelier_stores_cache_time_v2',
    ];

    keysToRemove.forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });

    // Remove variation cache keys
    const varKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(VARIATIONS_CACHE_PREFIX)) {
        varKeys.push(key);
      }
    }
    varKeys.forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });

    // Reset metrics
    resetCacheMetrics();
    firestoreReadsSaved = 0;
    try { localStorage.removeItem(FIRESTORE_READS_SAVED_KEY); } catch {}

    return {
      success: true,
      details: 'All local caches, CacheStorage assets, and Firestore index tables successfully purged.',
    };
  } catch (error) {
    return {
      success: false,
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
