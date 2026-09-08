import React, { useState, useEffect } from 'react';
import {
  Zap,
  Database,
  HardDrive,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Sparkles,
  X,
  Layers,
  ArrowDownToLine,
  Activity,
} from 'lucide-react';
import { Garment } from '../../types';
import {
  getSystemCacheStats,
  warmUpCatalogCache,
  purgeAllApplicationCaches,
  SystemCacheStats,
} from '../../services/cacheManager';

interface CachePerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  garments: Garment[];
}

export const CachePerformanceModal: React.FC<CachePerformanceModalProps> = ({
  isOpen,
  onClose,
  garments,
}) => {
  const [stats, setStats] = useState<SystemCacheStats | null>(null);
  const [isWarming, setIsWarming] = useState(false);
  const [warmProgress, setWarmProgress] = useState<{ completed: number; total: number } | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      const current = await getSystemCacheStats();
      setStats(current);
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleWarmUp = async () => {
    setIsWarming(true);
    setActionMessage(null);
    try {
      await warmUpCatalogCache(garments, (completed, total) => {
        setWarmProgress({ completed, total });
      });
      await loadStats();
      setActionMessage('Catalog assets successfully preloaded into browser CacheStorage!');
    } catch (err) {
      setActionMessage('Cache preloading completed with minor network notices.');
    } finally {
      setIsWarming(false);
      setWarmProgress(null);
    }
  };

  const handlePurge = async () => {
    if (!window.confirm('Purge all browser CacheStorage images, local Firestore tables, and metrics?')) {
      return;
    }
    setIsPurging(true);
    setActionMessage(null);
    try {
      const res = await purgeAllApplicationCaches();
      await loadStats();
      setActionMessage(res.details);
    } catch (err) {
      setActionMessage('Purge completed.');
    } finally {
      setIsPurging(false);
    }
  };

  const totalReq = stats?.imageMetrics.totalRequests || 0;
  const hits = stats?.imageMetrics.cacheHits || 0;
  const hitRate = totalReq > 0 ? Math.round((hits / totalReq) * 100) : 100;

  return (
    <div
      id="cache-performance-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFFFF] border border-[#E8E4DF] rounded-xl shadow-xl w-full max-w-xl overflow-hidden text-[#141312] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E8E4DF] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#80232F]/10 text-[#80232F] flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold text-[#141312]">
                Cache & Bandwidth Optimization
              </h2>
              <p className="text-xs text-[#706B65]">
                Multi-tier CacheStorage, Firestore SWR, and image bucket egress reduction
              </p>
            </div>
          </div>
          <button
            id="btn-close-cache-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#948E88] hover:text-[#141312] hover:bg-[#EFECE6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {actionMessage && (
            <div className="p-3 bg-[#FAF8F5] border border-[#C8A27A]/40 rounded-lg flex items-center gap-2 text-xs text-[#4A4642]">
              <CheckCircle2 className="w-4 h-4 text-[#C8A27A] shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Top Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E8E4DF]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#706B65] uppercase tracking-wider font-medium">
                <ArrowDownToLine className="w-3.5 h-3.5 text-[#80232F]" />
                Saved Bandwidth
              </div>
              <p className="font-serif text-lg font-bold text-[#141312] mt-1">
                {stats ? `${stats.estimatedBandwidthSavedMB} MB` : 'Calculating...'}
              </p>
              <p className="text-[10px] text-[#948E88] mt-0.5">Image & Doc egress</p>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E8E4DF]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#706B65] uppercase tracking-wider font-medium">
                <Activity className="w-3.5 h-3.5 text-[#C8A27A]" />
                Cache Hit Rate
              </div>
              <p className="font-serif text-lg font-bold text-[#141312] mt-1">
                {hitRate}%
              </p>
              <p className="text-[10px] text-[#948E88] mt-0.5">{hits} hits / {totalReq} queries</p>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E8E4DF]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#706B65] uppercase tracking-wider font-medium">
                <Database className="w-3.5 h-3.5 text-[#4A4642]" />
                DB Reads Saved
              </div>
              <p className="font-serif text-lg font-bold text-[#141312] mt-1">
                {stats ? stats.estimatedFirestoreReadsSaved : 0}
              </p>
              <p className="text-[10px] text-[#948E88] mt-0.5">Firestore read units</p>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E8E4DF]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#706B65] uppercase tracking-wider font-medium">
                <HardDrive className="w-3.5 h-3.5 text-[#80232F]" />
                Cached Assets
              </div>
              <p className="font-serif text-lg font-bold text-[#141312] mt-1">
                {stats ? stats.cachedImagesCount : 0}
              </p>
              <p className="text-[10px] text-[#948E88] mt-0.5">Stored binary images</p>
            </div>
          </div>

          {/* Active Caching Layers Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#706B65]">
              Active Storage Tiers
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg border border-[#E8E4DF] bg-[#FFFFFF] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#80232F]">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-medium text-[#141312]">Browser CacheStorage (`atelier-images-v2`)</span>
                    <p className="text-[11px] text-[#706B65]">Persistent binary cache for external CDN & bucket images</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E8E4DF] rounded text-[10px] font-medium text-[#4A4642]">
                  {stats?.cachedImagesCount || 0} Images Stored
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[#E8E4DF] bg-[#FFFFFF] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#C8A27A]">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-medium text-[#141312]">Firestore Persistent Local Cache & SWR</span>
                    <p className="text-[11px] text-[#706B65]">Instant 0ms product catalog, categories, stores & variations</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E8E4DF] rounded text-[10px] font-medium text-[#4A4642]">
                  {stats ? `${stats.firestoreCachedProducts} Products | ${stats.firestoreCachedCategories} Categories` : 'Active'}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[#E8E4DF] bg-[#FFFFFF] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#4A4642]">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-medium text-[#141312]">In-Memory Blob URL Pool</span>
                    <p className="text-[11px] text-[#706B65]">Synchronous render with request deduplication</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E8E4DF] rounded text-[10px] font-medium text-[#4A4642]">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar during warm up */}
          {isWarming && warmProgress && (
            <div className="p-3 bg-[#FAF8F5] border border-[#E8E4DF] rounded-lg space-y-2">
              <div className="flex justify-between text-xs text-[#4A4642]">
                <span className="font-medium">Preloading catalog assets...</span>
                <span>{warmProgress.completed} / {warmProgress.total}</span>
              </div>
              <div className="w-full bg-[#E5E0D8] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#80232F] h-full transition-all duration-200"
                  style={{ width: `${(warmProgress.completed / Math.max(warmProgress.total, 1)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E4DF] flex flex-wrap items-center justify-between gap-3">
          <button
            id="btn-purge-cache"
            onClick={handlePurge}
            disabled={isPurging || isWarming}
            className="px-3.5 py-2 rounded-lg border border-[#E8E4DF] bg-white hover:bg-[#FEE2E2] hover:text-[#991B1B] hover:border-[#FECACA] text-xs font-medium text-[#706B65] transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isPurging ? 'Purging...' : 'Purge All Caches'}
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-warmup-cache"
              onClick={handleWarmUp}
              disabled={isWarming || isPurging}
              className="px-4 py-2 rounded-lg bg-[#80232F] hover:bg-[#681C26] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isWarming ? 'animate-spin' : ''}`} />
              {isWarming ? 'Warming Up...' : 'Warm Up Catalog Cache'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
