import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../utils/formatters';
import {
  Layers,
  Sparkles,
  Check,
  Clock,
  Search,
  ExternalLink,
  Plus,
  Trash2,
  Database,
  RefreshCw,
  X,
  UploadCloud,
  Edit3,
  Image as ImageIcon,
  Upload,
  Palette,
  CheckCircle2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Package,
  DollarSign,
  Tag,
  Sliders,
  CheckCheck,
  Eye,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  Zap,
} from 'lucide-react';
import { Garment, GarmentVariation, GarmentSize } from '../../types';
import { GarmentImage } from '../common/GarmentImage';
import { getHexForColorName } from '../../services/firestoreProducts';
import { CachePerformanceModal } from './CachePerformanceModal';
import { HorizontalScrollStrip } from '../common/HorizontalScrollStrip';

export const AdminInventoryView: React.FC = () => {
  const {
    garments,
    orders,
    setSelectedGarment,
    switchToUser,
    saveGarment,
    deleteGarment,
    purgeDemoGarments,
    normalizeFirestoreDatabase,
    configuredDurations,
    setConfiguredDurations,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'all' | 'active' | 'paused' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [adminDurationInput, setAdminDurationInput] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCacheModalOpen, setIsCacheModalOpen] = useState(false);
  const [previewGarment, setPreviewGarment] = useState<Garment | null>(null);
  const [activePreviewImageIdx, setActivePreviewImageIdx] = useState(0);
  const [activePreviewVariationId, setActivePreviewVariationId] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [editingGarment, setEditingGarment] = useState<Garment | null>(null);
  const [quickAdjustGarment, setQuickAdjustGarment] = useState<Garment | null>(null);
  
  // Action status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [savingGarmentId, setSavingGarmentId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [normalizeReport, setNormalizeReport] = useState<{
    mergedCount: number;
    createdUnifiedCount: number;
    details: string[];
  } | null>(null);

  // New variation creation inputs inside modal
  const [newVarName, setNewVarName] = useState('');
  const [newVarHex, setNewVarHex] = useState('#800020');

  // Temp image input for Add/Edit
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Adding New Piece to Firestore
  const [newGarment, setNewGarment] = useState<Partial<Garment>>({
    name: '',
    designer: '',
    category: 'Gala & Black Tie',
    basePrice4Days: 4500,
    dailyExtraRate: 600,
    securityDeposit: 3000,
    retailValue: 65000,
    quantity: 1,
    is_available_for_rent: true,
    lowStockThreshold: 1,
    sizes: ['S', 'M', 'L'],
    fabric: 'Silk Organza & Crepe',
    silhouette: 'Modern Evening Column',
    images: [],
    variations: [],
    description: 'Custom tailored designer couture piece from our premier Manila studio collection.',
    featured: true,
  });

  const categories = [
    'All',
    'Gala & Black Tie',
    'Cocktail',
    'Bridal',
    'Modern Filipiniana',
    'Formal Evening',
    'Resort Couture',
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Lock body scroll when any modal or lightbox is active
  useEffect(() => {
    const isAnyModalOpen = Boolean(
      previewGarment || isLightboxOpen || quickAdjustGarment || editingGarment || isAddModalOpen
    );
    if (isAnyModalOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [previewGarment, isLightboxOpen, quickAdjustGarment, editingGarment, isAddModalOpen]);

  // Inventory Overview Calculations
  const inventoryStats = useMemo(() => {
    const totalPieces = garments.length;
    const totalVaultUnits = garments.reduce((acc, g) => acc + (typeof g.quantity === 'number' ? g.quantity : 1), 0);
    const listedCount = garments.filter((g) => g.status !== 'disabled' && g.status !== 'archived').length;
    const disabledCount = garments.filter((g) => g.status === 'disabled' || g.status === 'archived').length;
    const activeRentalCount = garments.filter((g) => g.is_available_for_rent !== false && g.status !== 'disabled').length;
    const pausedRentalCount = garments.filter((g) => g.is_available_for_rent === false || g.status === 'disabled').length;
    const outOfStockCount = garments.filter((g) => typeof g.quantity === 'number' && g.quantity <= 0).length;
    const lowStockCount = garments.filter((g) => typeof g.quantity === 'number' && g.quantity > 0 && g.quantity <= (g.lowStockThreshold || 2)).length;
    const avgBaseRate = totalPieces > 0 ? Math.round(garments.reduce((acc, g) => acc + (g.basePrice4Days || 0), 0) / totalPieces) : 0;
    
    return {
      totalPieces,
      totalVaultUnits,
      listedCount,
      disabledCount,
      activeRentalCount,
      pausedRentalCount,
      outOfStockCount,
      lowStockCount,
      avgBaseRate,
    };
  }, [garments]);

  // Filtered Garments
  const filteredGarments = useMemo(() => {
    return garments.filter((g) => {
      const matchesSearch =
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.designer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.variations && g.variations.some((v) => v.name.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesCat = selectedCategory === 'All' || g.category === selectedCategory;

      const garmentQty = typeof g.quantity === 'number' ? g.quantity : 1;
      const isAvailable = g.is_available_for_rent !== false;
      const isProductDisabled = g.status === 'disabled' || g.status === 'archived';

      let matchesStatus = true;
      if (inventoryStatusFilter === 'listed') {
        matchesStatus = !isProductDisabled;
      } else if (inventoryStatusFilter === 'disabled') {
        matchesStatus = isProductDisabled;
      } else if (inventoryStatusFilter === 'active') {
        matchesStatus = isAvailable && !isProductDisabled;
      } else if (inventoryStatusFilter === 'paused') {
        matchesStatus = !isAvailable || isProductDisabled;
      } else if (inventoryStatusFilter === 'in-stock') {
        matchesStatus = garmentQty > (g.lowStockThreshold || 1);
      } else if (inventoryStatusFilter === 'low-stock') {
        matchesStatus = garmentQty > 0 && garmentQty <= (g.lowStockThreshold || 2);
      } else if (inventoryStatusFilter === 'out-of-stock') {
        matchesStatus = garmentQty <= 0;
      }

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [garments, searchTerm, selectedCategory, inventoryStatusFilter]);

  // Fast inline toggle for rental availability
  const handleToggleRentalAvailability = async (garment: Garment) => {
    const nextVal = garment.is_available_for_rent === false ? true : false;
    const currentQty = typeof garment.quantity === 'number' ? garment.quantity : 1;
    setSavingGarmentId(garment.id);
    try {
      const updated: Garment = {
        ...garment,
        is_available_for_rent: nextVal,
        available_to_sell: nextVal ? currentQty : 0,
        status: !nextVal && garment.status === 'disabled' ? 'disabled' : nextVal ? 'active' : garment.status,
      };
      await saveGarment(updated);
      showToast(`${garment.name} rental is now ${nextVal ? 'ENABLED (Active in Storefront)' : 'PAUSED (Booking paused)'}`);
    } catch (err) {
      console.error('Failed to toggle rental availability:', err);
    } finally {
      setSavingGarmentId(null);
    }
  };

  // Fast inline toggle to Disable/Enable product entirely in catalog
  const handleToggleProductStatus = async (garment: Garment) => {
    const isCurrentlyDisabled = garment.status === 'disabled' || garment.status === 'archived';
    const nextStatus = isCurrentlyDisabled ? 'active' : 'disabled';
    const currentQty = typeof garment.quantity === 'number' ? garment.quantity : 1;
    setSavingGarmentId(garment.id);
    try {
      const updated: Garment = {
        ...garment,
        status: nextStatus,
        is_available_for_rent: nextStatus === 'active',
        available_to_sell: nextStatus === 'active' ? currentQty : 0,
      };
      await saveGarment(updated);
      showToast(
        nextStatus === 'active'
          ? `Enabled "${garment.name}" (Now visible in customer catalog)`
          : `Disabled "${garment.name}" (Hidden from customer catalog)`
      );
    } catch (err) {
      console.error('Failed to toggle product status:', err);
    } finally {
      setSavingGarmentId(null);
    }
  };

  // Fast inline stock quantity adjustment stepper
  const handleQuickAdjustQuantity = async (garment: Garment, delta: number) => {
    const currentQty = typeof garment.quantity === 'number' ? garment.quantity : 1;
    const newQty = Math.max(0, currentQty + delta);
    if (newQty === currentQty) return;

    setSavingGarmentId(garment.id);
    try {
      const updated: Garment = {
        ...garment,
        quantity: newQty,
        available_to_sell: garment.is_available_for_rent !== false ? newQty : 0,
      };
      await saveGarment(updated);
      showToast(`${garment.name} stock updated to ${newQty} units`);
    } catch (err) {
      console.error('Failed to adjust quantity:', err);
    } finally {
      setSavingGarmentId(null);
    }
  };

  // Handle local image file upload (converts to base64 Data URL)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const result = loadEvt.target?.result as string;
        if (result) {
          if (isEdit && editingGarment) {
            setEditingGarment((prev) =>
              prev ? { ...prev, images: [...prev.images, result] } : null
            );
          } else {
            setNewGarment((prev) => ({
              ...prev,
              images: [...(prev.images || []), result],
            }));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = (isEdit: boolean) => {
    if (!imageUrlInput.trim()) return;
    const cleanUrl = imageUrlInput.trim();

    if (isEdit && editingGarment) {
      setEditingGarment((prev) =>
        prev ? { ...prev, images: [...prev.images, cleanUrl] } : null
      );
    } else {
      setNewGarment((prev) => ({
        ...prev,
        images: [...(prev.images || []), cleanUrl],
      }));
    }
    setImageUrlInput('');
  };

  const handleRemoveImage = (indexToRemove: number, isEdit: boolean) => {
    if (isEdit && editingGarment) {
      setEditingGarment((prev) =>
        prev
          ? {
              ...prev,
              images: prev.images.filter((_, idx) => idx !== indexToRemove),
            }
          : null
      );
    } else {
      setNewGarment((prev) => ({
        ...prev,
        images: (prev.images || []).filter((_, idx) => idx !== indexToRemove),
      }));
    }
  };

  // Add a variation to the garment currently being edited
  const handleAddVariationToEditing = () => {
    if (!editingGarment || !newVarName.trim()) return;
    const varNameClean = newVarName.trim();
    const hex = newVarHex || getHexForColorName(varNameClean);

    const newVar: GarmentVariation = {
      id: `var-${Date.now()}`,
      name: varNameClean,
      colorName: varNameClean,
      hex,
      images: editingGarment.images.length > 0 ? [...editingGarment.images] : [],
      sizes: [...editingGarment.sizes],
      sku: `${editingGarment.name.replace(/\s+/g, '-').toUpperCase()}-${varNameClean.toUpperCase()}`,
      inStock: true,
      quantity: 1,
      is_available_for_rent: true,
      basePrice4Days: editingGarment.basePrice4Days,
    };

    const currentVariations = editingGarment.variations ? [...editingGarment.variations] : [];
    currentVariations.push(newVar);

    const currentColors = [...editingGarment.colors];
    if (!currentColors.some((c) => c.name.toLowerCase() === varNameClean.toLowerCase())) {
      currentColors.push({ name: varNameClean, hex, image: editingGarment.images[0] });
    }

    setEditingGarment({
      ...editingGarment,
      variations: currentVariations,
      colors: currentColors,
    });

    setNewVarName('');
  };

  // Remove variation from garment being edited
  const handleRemoveVariation = (varIndex: number) => {
    if (!editingGarment || !editingGarment.variations) return;
    const removedVar = editingGarment.variations[varIndex];
    const updatedVariations = editingGarment.variations.filter((_, i) => i !== varIndex);
    const updatedColors = editingGarment.colors.filter(
      (c) => c.name.toLowerCase() !== removedVar.name.toLowerCase()
    );

    setEditingGarment({
      ...editingGarment,
      variations: updatedVariations,
      colors: updatedColors.length > 0 ? updatedColors : [{ name: 'Standard', hex: '#141312' }],
    });
  };

  const getGarmentRentalStats = (garmentId: string) => {
    const activeRentals = orders.filter(
      (o) =>
        o.garmentId === garmentId &&
        ['confirmed', 'in-transit', 'delivered', 'in-rental'].includes(o.status)
    );
    const completedRentals = orders.filter(
      (o) => o.garmentId === garmentId && o.status === 'returned-cleared'
    );
    return {
      isCurrentlyRented: activeRentals.length > 0,
      activeRental: activeRentals[0] || null,
      totalRentalsCount: activeRentals.length + completedRentals.length,
    };
  };

  const handlePreviewInStore = (garment: Garment) => {
    setSelectedGarment(garment);
    switchToUser();
  };

  const handleCreateGarment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGarment.name || !newGarment.designer) return;

    setIsSubmitting(true);
    try {
      const gId = `garment-${Date.now()}`;
      const qty = Number(newGarment.quantity) || 1;
      const basePrice = Number(newGarment.basePrice4Days) || 4500;
      const dailyRate = Number(newGarment.dailyExtraRate) || Math.round(basePrice * 0.15);
      const isAvailable = newGarment.is_available_for_rent !== false;

      const payload: Garment = {
        id: gId,
        name: newGarment.name || 'Couture Piece',
        designer: newGarment.designer || 'Sinta Wardrobe',
        category: newGarment.category as any || 'Gala & Black Tie',
        retailValue: Number(newGarment.retailValue) || 65000,
        basePrice4Days: basePrice,
        dailyExtraRate: dailyRate,
        securityDeposit: Number(newGarment.securityDeposit) || 3000,
        quantity: qty,
        is_available_for_rent: isAvailable,
        available_to_sell: isAvailable && qty > 0 ? qty : 0,
        lowStockThreshold: Number(newGarment.lowStockThreshold) || 1,
        sizes: (newGarment.sizes as any) || ['S', 'M', 'L'],
        colors: [{ name: 'Noir', hex: '#141312' }],
        variations: [
          {
            id: `var-${gId}-1`,
            name: 'Original Noir',
            colorName: 'Original Noir',
            hex: '#141312',
            images: newGarment.images || [],
            sizes: (newGarment.sizes as any) || ['S', 'M', 'L'],
            sku: `${(newGarment.name || 'COUTURE').toUpperCase().replace(/\s+/g, '-')}-NOIR`,
            inStock: qty > 0,
            quantity: qty,
            is_available_for_rent: isAvailable,
            basePrice4Days: basePrice,
          },
        ],
        images: newGarment.images || [],
        description:
          newGarment.description ||
          'Handcrafted designer couture curated exclusively for luxury evening galas.',
        details: [
          'Hand-finished luxury couture tailoring',
          'Complimentary dry cleaning included',
          'Insured courier transport',
        ],
        fabric: newGarment.fabric || 'Mulberry Silk & Tulle',
        silhouette: newGarment.silhouette || 'Sculpted Column',
        occasion: 'Evening Gala & Premiere',
        modelMeasurements: {
          height: "5'9\" (175 cm)",
          bust: '33" (84 cm)',
          waist: '25" (63 cm)',
          hips: '35" (89 cm)',
          wearingSize: 'S',
        },
        careInstructions: 'Complimentary dry cleaning included with white glove delivery.',
        rating: 4.95,
        reviewCount: 12,
        featured: true,
      };

      await saveGarment(payload);
      setIsAddModalOpen(false);
      showToast(`Added ${payload.name} to Firestore catalog`);
      setNewGarment({
        name: '',
        designer: '',
        category: 'Gala & Black Tie',
        basePrice4Days: 4500,
        dailyExtraRate: 600,
        securityDeposit: 3000,
        retailValue: 65000,
        quantity: 1,
        is_available_for_rent: true,
        lowStockThreshold: 1,
        sizes: ['S', 'M', 'L'],
        fabric: 'Silk Organza & Crepe',
        silhouette: 'Modern Evening Column',
        images: [],
        description: 'Custom tailored designer couture piece from our premier Manila studio collection.',
        featured: true,
      });
    } catch (err) {
      console.error('Error creating garment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGarment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGarment) return;

    setIsSubmitting(true);
    try {
      await saveGarment(editingGarment);
      showToast(`Saved changes for ${editingGarment.name}`);
      setEditingGarment(null);
    } catch (err) {
      console.error('Error updating garment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveQuickAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAdjustGarment) return;

    setIsSubmitting(true);
    try {
      await saveGarment(quickAdjustGarment);
      showToast(`Updated pricing and stock for ${quickAdjustGarment.name}`);
      setQuickAdjustGarment(null);
    } catch (err) {
      console.error('Error in quick adjust:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (garment: Garment) => {
    if (window.confirm(`Are you sure you want to remove "${garment.name}" from Firestore?`)) {
      try {
        await deleteGarment(garment.id);
        showToast(`Removed ${garment.name} from catalog`);
      } catch (err) {
        console.error('Failed to delete garment:', err);
      }
    }
  };

  const handlePurgeDemo = async () => {
    if (
      window.confirm(
        'Clear all seeded demo pieces from Firestore? This will remove dummy sample items and leave only your authentic products.'
      )
    ) {
      setIsPurging(true);
      try {
        await purgeDemoGarments();
        showToast('Demo pieces cleared from Firestore');
      } catch (err) {
        console.error('Failed to purge demo garments:', err);
      } finally {
        setIsPurging(false);
      }
    }
  };

  const handleRunNormalization = async () => {
    if (
      window.confirm(
        'Normalize and unify product variations in Firestore? This will group duplicate/split color records into unified master pieces with clean colorway variations.'
      )
    ) {
      setIsNormalizing(true);
      try {
        const report = await normalizeFirestoreDatabase();
        setNormalizeReport(report);
        showToast(`Normalized ${report.mergedCount} variations into unified master pieces`);
      } catch (err) {
        console.error('Failed to normalize:', err);
      } finally {
        setIsNormalizing(false);
      }
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-50 bg-[#141312] text-white px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 border border-white/10 animate-slideUp">
            <CheckCheck className="w-4 h-4 text-[#4ADE80] shrink-0" />
            <span>{toastMessage}</span>
          </div>,
          document.body
        )}

      {/* Top Banner: Firestore Database Status & Action Bar */}
      <div className="bg-[#FFFFFF] border border-[#E8E4DF] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FAF9F6] border border-[#E8E4DF] flex items-center justify-center text-[#141312] shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-sm font-semibold text-[#141312]">
                Inventory & Rental Management
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] px-2 py-0.5 rounded font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                Live Firestore
              </span>
            </div>
            <p className="text-xs text-[#5C5854] mt-0.5">
              Manage product stock quantities, enable/pause rentals, adjust tier rates, and synchronize colorway variations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Cache & Bandwidth Optimization Modal Trigger */}
          <button
            id="btn-admin-cache-performance"
            onClick={() => setIsCacheModalOpen(true)}
            className="px-3 py-2 border border-[#E8E4DF] bg-[#FAF9F6] hover:bg-[#141312] hover:text-white text-[#141312] text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            title="View database & image cache telemetry and manage cache storage"
          >
            <Zap className="w-3.5 h-3.5 text-[#80232F]" />
            <span>Cache & Bandwidth</span>
          </button>

          {/* Normalize Variations Tool Button */}
          <button
            onClick={handleRunNormalization}
            disabled={isNormalizing}
            className="px-3 py-2 border border-[#E8E4DF] bg-[#FAF9F6] hover:bg-[#141312] hover:text-white text-[#141312] text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            title="Scan database and merge identical styles differing only in color/variation"
          >
            {isNormalizing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            )}
            <span>Normalize Variations</span>
          </button>

          <button
            id="btn-admin-add-garment"
            onClick={() => {
              setImageUrlInput('');
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Piece to Catalog</span>
          </button>
        </div>
      </div>

      {/* Normalization Report Notification if recently run */}
      {normalizeReport && (
        <div className="bg-[#FAF9F6] border border-[#BBF7D0] rounded-xl p-4 flex items-start gap-3 text-xs text-[#141312] animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">
              Firestore Data Normalization Complete: Merged {normalizeReport.mergedCount} duplicate documents into {normalizeReport.createdUnifiedCount} multi-variation master garments.
            </p>
            <ul className="list-disc list-inside text-[11px] text-[#5C5854] space-y-0.5">
              {normalizeReport.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setNormalizeReport(null)}
            className="text-[#948E88] hover:text-[#141312] p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DF] shadow-2xs">
          <span className="text-[10px] text-[#948E88] uppercase font-medium tracking-wider block">
            Master Styles
          </span>
          <span className="font-serif text-xl font-semibold text-[#141312] mt-0.5 block">
            {inventoryStats.totalPieces}
          </span>
          <span className="text-[10px] text-[#5C5854] mt-1 block">
            {garments.reduce((acc, g) => acc + (g.variations?.length || g.colors.length || 1), 0)} Colorway SKUs
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DF] shadow-2xs">
          <span className="text-[10px] text-[#948E88] uppercase font-medium tracking-wider block">
            Total Vault Units
          </span>
          <span className="font-serif text-xl font-semibold text-[#141312] mt-0.5 block">
            {inventoryStats.totalVaultUnits}
          </span>
          <span className="text-[10px] text-[#22C55E] mt-1 block">Physical Garment Stock</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DF] shadow-2xs">
          <span className="text-[10px] text-[#948E88] uppercase font-medium tracking-wider block">
            Rental Status
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-serif text-xl font-semibold text-[#16A34A]">
              {inventoryStats.activeRentalCount}
            </span>
            <span className="text-xs text-[#948E88]">active</span>
            {inventoryStats.pausedRentalCount > 0 && (
              <span className="text-xs text-[#D97706] font-medium">
                ({inventoryStats.pausedRentalCount} paused)
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#5C5854] mt-1 block">
            {garments.filter((g) => getGarmentRentalStats(g.id).isCurrentlyRented).length} out on active client bookings
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DF] shadow-2xs">
          <span className="text-[10px] text-[#948E88] uppercase font-medium tracking-wider block">
            Average 4-Day Rate
          </span>
          <span className="font-serif text-xl font-semibold text-[#141312] mt-0.5 block">
            {formatPHP(inventoryStats.avgBaseRate)}
          </span>
          <span className="text-[10px] text-[#5C5854] mt-1 block">Base Rental Yield</span>
        </div>
      </div>

      {/* Admin Rental Duration Presets Configuration */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E8E4DF] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#141312] uppercase tracking-wider">
              Customer Rental Duration Presets
            </span>
            <span className="text-[10px] bg-[#80232F]/10 text-[#80232F] font-medium px-2 py-0.5 rounded border border-[#80232F]/20">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-[#5C5854] mt-0.5">
            Configure preset rental duration pills presented to customers on product detail pages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {configuredDurations.map((days) => (
              <span
                key={days}
                className="bg-[#FAF9F6] border border-[#E8E4DF] px-2.5 py-1 rounded-full text-xs font-medium text-[#141312] flex items-center gap-1.5"
              >
                <span>{days} Days</span>
                {configuredDurations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setConfiguredDurations(configuredDurations.filter((d) => d !== days))}
                    className="text-[#948E88] hover:text-[#80232F] font-bold text-sm leading-none ml-0.5 cursor-pointer"
                    title={`Remove ${days} days preset`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = parseInt(adminDurationInput.trim(), 10);
              if (!isNaN(parsed) && parsed >= 1 && parsed <= 60 && !configuredDurations.includes(parsed)) {
                setConfiguredDurations([...configuredDurations, parsed].sort((a, b) => a - b));
                setAdminDurationInput('');
                showToast(`Added ${parsed} days duration preset`);
              }
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="number"
              min="1"
              max="60"
              placeholder="Add days (e.g. 7)"
              value={adminDurationInput}
              onChange={(e) => setAdminDurationInput(e.target.value)}
              className="w-28 bg-[#FAF9F6] border border-[#E8E4DF] rounded px-2.5 py-1 text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-[#141312] text-white rounded text-xs font-medium hover:bg-[#2A2725] transition-colors cursor-pointer"
            >
              Add
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setConfiguredDurations([4, 8, 12, 14]);
              showToast('Reset rental duration presets to defaults (4, 8, 12, 14 days)');
            }}
            className="text-[11px] text-[#80232F] hover:underline px-1 py-1 font-medium cursor-pointer"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Filter and Inventory Status Tabs */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DF] space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search garment, SKU, or designer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#FAF9F6] border border-[#E8E4DF] rounded-md text-xs text-[#141312] placeholder-[#948E88] focus:outline-none focus:border-[#141312]"
            />
            <Search className="w-3.5 h-3.5 text-[#948E88] absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Quick Inventory Status Filter Pills with Desktop Scroll Arrows & Dragging */}
          <HorizontalScrollStrip className="w-full sm:w-auto">
            <div className="flex items-center gap-1.5 min-w-max pb-0.5">
              {[
                { id: 'all', label: `All (${garments.length})` },
                { id: 'listed', label: `Listed (${inventoryStats.listedCount})` },
                { id: 'disabled', label: `Disabled (${inventoryStats.disabledCount})` },
                { id: 'active', label: `Rental Active (${inventoryStats.activeRentalCount})` },
                { id: 'paused', label: `Rental Paused (${inventoryStats.pausedRentalCount})` },
                { id: 'in-stock', label: 'In Stock' },
                { id: 'low-stock', label: `Low Stock (${inventoryStats.lowStockCount})` },
                { id: 'out-of-stock', label: `Out of Stock (${inventoryStats.outOfStockCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setInventoryStatusFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border cursor-pointer shrink-0 select-none ${
                    inventoryStatusFilter === tab.id
                      ? 'bg-[#141312] text-white border-[#141312]'
                      : 'bg-[#FAF9F6] text-[#5C5854] border-[#E8E4DF] hover:text-[#141312]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </HorizontalScrollStrip>
        </div>

        {/* Categories Bar with Desktop Scroll Arrows & Dragging */}
        <HorizontalScrollStrip className="w-full pt-1 border-t border-[#E8E4DF]">
          <div className="flex items-center gap-1 min-w-max">
            <span className="text-[10px] font-medium text-[#948E88] uppercase tracking-wider mr-1 shrink-0">
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded text-[10.5px] font-medium whitespace-nowrap transition-colors border cursor-pointer shrink-0 select-none ${
                  selectedCategory === cat
                    ? 'bg-[#80232F] text-white border-[#80232F]'
                    : 'bg-[#FAF9F6] text-[#5C5854] border-[#E8E4DF] hover:text-[#141312]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </HorizontalScrollStrip>
      </div>

      {/* Inventory Management Table */}
      <div className="bg-white rounded-xl border border-[#E8E4DF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#141312]">
            <thead className="bg-[#FAF9F6] text-[10px] uppercase tracking-wider text-[#948E88] font-medium border-b border-[#E8E4DF]">
              <tr>
                <th className="py-3 px-4">Garment & Photos</th>
                <th className="py-3 px-3">Status & Availability</th>
                <th className="py-3 px-3">Vault Stock</th>
                <th className="py-3 px-3">Pricing (4-Day / Extra)</th>
                <th className="py-3 px-3">Deposit</th>
                <th className="py-3 px-3">Category & Sizes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DF]">
              {filteredGarments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#948E88]">
                    No garments matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredGarments.map((garment) => {
                  const stats = getGarmentRentalStats(garment.id);
                  const hasMultiVars = garment.variations && garment.variations.length > 1;
                  const isAvailable = garment.is_available_for_rent !== false;
                  const isProductDisabled = garment.status === 'disabled' || garment.status === 'archived';
                  const currentQty = typeof garment.quantity === 'number' ? garment.quantity : 1;
                  const isSavingThis = savingGarmentId === garment.id;

                  return (
                    <tr
                      key={garment.id}
                      className={`hover:bg-[#FAF9F6]/60 transition-colors ${
                        isProductDisabled
                          ? 'bg-[#FEF2F2]/20'
                          : !isAvailable
                          ? 'bg-[#FFFBEB]/30'
                          : ''
                      }`}
                    >
                      {/* 1. Garment Info & Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => {
                              setActivePreviewImageIdx(0);
                              setActivePreviewVariationId(null);
                              setPreviewGarment(garment);
                            }}
                            className="relative group/thumb shrink-0 w-11 h-14 rounded-md overflow-hidden bg-[#FAF9F6] border border-[#E8E4DF] shadow-2xs cursor-pointer"
                            title="Click to view full dress details popup"
                          >
                            <GarmentImage
                              src={garment.images[0]}
                              alt={garment.name}
                              garmentName={garment.name}
                              designerName={garment.designer}
                              categoryName={garment.category}
                              aspectRatio="aspect-auto"
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                            />
                            {isProductDisabled && (
                              <div className="absolute inset-0 bg-[#DC2626]/40 backdrop-blur-2xs flex items-center justify-center">
                                <span className="text-[7.5px] font-bold text-white uppercase bg-[#DC2626] px-1 py-0.2 rounded">
                                  Disabled
                                </span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-[#141312]/50 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px]">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActivePreviewImageIdx(0);
                                  setActivePreviewVariationId(null);
                                  setPreviewGarment(garment);
                                }}
                                className="font-serif font-semibold text-xs text-[#141312] text-left hover:text-[#80232F] hover:underline cursor-pointer transition-colors"
                                title="Click to view dress details popup"
                              >
                                {garment.name}
                              </button>
                              {garment.featured && (
                                <span className="bg-[#FAF9F6] border border-[#E8E4DF] text-[#80232F] text-[8.5px] px-1 py-0.2 rounded font-medium">
                                  Featured
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#5C5854]">{garment.designer}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] text-[#948E88] font-mono">ID: {garment.id}</span>
                              {hasMultiVars ? (
                                <span className="text-[9px] text-[#80232F] bg-[#FDF2F2] px-1 py-0.2 rounded border border-[#FEE2E2] font-medium">
                                  {garment.variations!.length} Colors
                                </span>
                              ) : (
                                <span className="text-[9px] text-[#5C5854] bg-[#FAF9F6] px-1 py-0.2 rounded border border-[#E8E4DF]">
                                  {garment.images.length} photo{garment.images.length === 1 ? '' : 's'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Rental Availability Toggle & Catalog Status */}
                      <td className="py-3 px-3">
                        <div className="space-y-1.5">
                          {/* Rental Active / Paused Pill */}
                          <div>
                            <button
                              type="button"
                              disabled={isSavingThis}
                              onClick={() => handleToggleRentalAvailability(garment)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium transition-all border cursor-pointer ${
                                isAvailable && !isProductDisabled
                                  ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0] hover:bg-[#BBF7D0]'
                                  : 'bg-[#FEF3C7] text-[#78350F] border-[#FDE68A] hover:bg-[#FDE68A]'
                              } disabled:opacity-50`}
                              title="Click to toggle rental booking availability"
                            >
                              {isSavingThis ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-current" />
                              ) : isAvailable && !isProductDisabled ? (
                                <ToggleRight className="w-3.5 h-3.5 text-[#16A34A]" />
                              ) : (
                                <ToggleLeft className="w-3.5 h-3.5 text-[#78350F]" />
                              )}
                              <span>{isAvailable && !isProductDisabled ? 'Rental Active' : 'Rental Paused'}</span>
                            </button>
                          </div>

                          {/* Catalog Listing Status Pill (Disable / Enable Product) */}
                          <div>
                            <button
                              type="button"
                              disabled={isSavingThis}
                              onClick={() => handleToggleProductStatus(garment)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-medium transition-colors border cursor-pointer ${
                                isProductDisabled
                                  ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA] hover:bg-[#FECACA]'
                                  : 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7] hover:bg-[#DCFCE7]'
                              }`}
                              title={isProductDisabled ? 'Click to Enable and publish back to Storefront' : 'Click to Disable and hide from Storefront'}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isProductDisabled ? 'bg-[#DC2626]' : 'bg-[#15803D]'}`} />
                              <span>{isProductDisabled ? 'Product Disabled' : 'Listed in Catalog'}</span>
                            </button>
                          </div>

                          {stats.isCurrentlyRented && (
                            <div className="flex items-center gap-1 text-[9.5px] text-[#D97706] font-medium">
                              <Clock className="w-2.5 h-2.5" />
                              <span>1 Unit On Active Booking</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Quantity & Vault Stock Adjuster */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isSavingThis || currentQty <= 0}
                              onClick={() => handleQuickAdjustQuantity(garment, -1)}
                              className="w-6 h-6 rounded border border-[#E8E4DF] bg-[#FAF9F6] hover:bg-[#E8E4DF] text-[#141312] font-semibold text-xs flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Decrease stock by 1"
                            >
                              -
                            </button>
                            <span
                              className={`w-9 text-center font-serif text-sm font-semibold ${
                                currentQty <= 0
                                  ? 'text-[#DC2626]'
                                  : currentQty <= 2
                                  ? 'text-[#D97706]'
                                  : 'text-[#141312]'
                              }`}
                            >
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              disabled={isSavingThis}
                              onClick={() => handleQuickAdjustQuantity(garment, 1)}
                              className="w-6 h-6 rounded border border-[#E8E4DF] bg-[#FAF9F6] hover:bg-[#E8E4DF] text-[#141312] font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer"
                              title="Increase stock by 1"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {currentQty <= 0 ? (
                              <span className="text-[9px] text-[#DC2626] font-medium bg-[#FEE2E2] px-1.5 py-0.2 rounded">
                                Out of Stock
                              </span>
                            ) : currentQty <= (garment.lowStockThreshold || 2) ? (
                              <span className="text-[9px] text-[#D97706] font-medium bg-[#FEF3C7] px-1.5 py-0.2 rounded">
                                Low Stock ({currentQty})
                              </span>
                            ) : (
                              <span className="text-[9px] text-[#16A34A] font-medium bg-[#DCFCE7] px-1.5 py-0.2 rounded">
                                {currentQty} In Vault
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. Pricing & Rates */}
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-semibold text-xs text-[#141312]">
                            {formatPHP(garment.basePrice4Days)}
                            <span className="text-[9.5px] font-normal text-[#948E88]"> / 4d</span>
                          </p>
                          <p className="text-[10px] text-[#5C5854]">
                            +{formatPHP(garment.dailyExtraRate || Math.round(garment.basePrice4Days * 0.15))}/day extra
                          </p>
                        </div>
                      </td>

                      {/* 5. Deposit */}
                      <td className="py-3 px-3 text-[#5C5854]">
                        <span className="font-mono text-xs">
                          {formatPHP(garment.securityDeposit)}
                        </span>
                      </td>

                      {/* 6. Category & Sizes */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <span className="inline-block bg-[#FAF9F6] border border-[#E8E4DF] px-2 py-0.5 rounded text-[9.5px] text-[#5C5854]">
                            {garment.category}
                          </span>
                          <div className="flex flex-wrap items-center gap-0.5 max-w-[120px]">
                            {garment.sizes.map((s) => (
                              <span
                                key={s}
                                className="w-4 h-4 rounded border border-[#E8E4DF] bg-[#FAF9F6] text-[8.5px] font-medium flex items-center justify-center text-[#5C5854]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* 7. Action Controls */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View / Inspect Dress Popup */}
                          <button
                            type="button"
                            onClick={() => {
                              setActivePreviewImageIdx(0);
                              setActivePreviewVariationId(null);
                              setPreviewGarment(garment);
                            }}
                            className="p-1.5 rounded bg-[#FAF9F6] hover:bg-[#141312] text-[#141312] hover:text-white border border-[#E8E4DF] hover:border-[#141312] transition-colors inline-flex items-center gap-1 text-[10px] font-medium cursor-pointer shadow-2xs"
                            title="View Dress Details Popup"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">View</span>
                          </button>

                          {/* Quick Adjust Price & Stock */}
                          <button
                            type="button"
                            onClick={() => setQuickAdjustGarment(garment)}
                            className="px-2 py-1 rounded bg-[#FAF9F6] hover:bg-[#141312] text-[#141312] hover:text-white border border-[#E8E4DF] hover:border-[#141312] transition-colors inline-flex items-center gap-1 text-[10px] font-medium cursor-pointer shadow-2xs"
                            title="Quick Adjust Pricing & Stock"
                          >
                            <Sliders className="w-3 h-3" />
                            <span>Adjust</span>
                          </button>

                          {/* Full Edit Modal */}
                          <button
                            type="button"
                            onClick={() => {
                              setImageUrlInput('');
                              setEditingGarment(garment);
                            }}
                            className="p-1.5 rounded hover:bg-[#FAF9F6] text-[#5C5854] hover:text-[#141312] border border-transparent hover:border-[#E8E4DF] transition-colors inline-flex items-center gap-1 text-[10px] font-medium cursor-pointer"
                            title="Edit Full Piece Metadata & Photos"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>

                          {/* Quick Disable / Enable button */}
                          <button
                            type="button"
                            disabled={isSavingThis}
                            onClick={() => handleToggleProductStatus(garment)}
                            className={`p-1.5 rounded border transition-colors inline-flex items-center cursor-pointer ${
                              isProductDisabled
                                ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0] hover:bg-[#BBF7D0]'
                                : 'bg-[#FAF9F6] text-[#5C5854] border-transparent hover:border-[#E8E4DF] hover:text-[#DC2626]'
                            }`}
                            title={isProductDisabled ? 'Enable / Publish to Storefront' : 'Disable / Hide from Storefront'}
                          >
                            {isProductDisabled ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          </button>

                          {/* Preview in Storefront */}
                          <button
                            type="button"
                            onClick={() => handlePreviewInStore(garment)}
                            className="p-1.5 rounded hover:bg-[#FAF9F6] text-[#5C5854] hover:text-[#141312] border border-transparent hover:border-[#E8E4DF] transition-colors inline-flex items-center gap-1 text-[10px] font-medium cursor-pointer"
                            title="Preview in Storefront"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          {/* Delete from Firestore */}
                          <button
                            type="button"
                            onClick={() => handleDelete(garment)}
                            className="p-1.5 rounded hover:bg-[#FEF2F2] text-[#948E88] hover:text-[#B91C1C] border border-transparent hover:border-[#FEE2E2] transition-colors inline-flex items-center cursor-pointer"
                            title="Delete from Firestore"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRESS DETAILS & INSPECTION POPUP MODAL */}
      {previewGarment &&
        (() => {
          // Real-time garment binding
          const currentGarment = garments.find((g) => g.id === previewGarment.id) || previewGarment;
          const isProductDisabled = currentGarment.status === 'disabled' || currentGarment.status === 'archived';
          const isAvailable = currentGarment.is_available_for_rent !== false;
          const currentQty = typeof currentGarment.quantity === 'number' ? currentGarment.quantity : 1;

          // Build list of all unique images for this garment
          const variationImages = (currentGarment.variations || []).flatMap((v) => v.images || []);
          const colorImages = (currentGarment.colors || []).map((c) => c.image).filter(Boolean) as string[];
          const rawImagesList = [
            ...(currentGarment.images || []),
            ...variationImages,
            ...colorImages,
          ];
          const allImages = Array.from(new Set(rawImagesList.filter((img) => typeof img === 'string' && img.trim().length > 0)));
          const displayImages = allImages.length > 0 ? allImages : (currentGarment.images && currentGarment.images.length > 0 ? currentGarment.images : ['']);
          const activeImg = displayImages[Math.min(activePreviewImageIdx, displayImages.length - 1)] || displayImages[0] || '';

          return createPortal(
            <div className="fixed inset-0 z-50 bg-[#141312]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
              <div className="bg-white rounded-2xl border border-[#E8E4DF] w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
                {/* Modal Top Header */}
                <div className="px-5 py-3.5 border-b border-[#E8E4DF] bg-[#FAF9F6] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#80232F]/10 border border-[#80232F]/20 flex items-center justify-center text-[#80232F]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#80232F]">
                          {currentGarment.designer}
                        </span>
                        <span className="text-[9px] font-mono text-[#948E88] bg-white px-1.5 py-0.5 rounded border border-[#E8E4DF]">
                          ID: {currentGarment.id}
                        </span>
                        {currentGarment.featured && (
                          <span className="bg-[#FAF9F6] border border-[#E8E4DF] text-[#80232F] text-[9px] px-1.5 py-0.5 rounded font-medium">
                            Featured
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-base font-semibold text-[#141312] leading-tight">
                        {currentGarment.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewGarment(null);
                        handlePreviewInStore(currentGarment);
                      }}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E8E4DF] hover:border-[#141312] text-xs font-medium text-[#141312] transition-colors cursor-pointer"
                      title="View this dress in customer storefront PDP"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Storefront PDP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewGarment(null)}
                      className="p-1.5 rounded-lg text-[#948E88] hover:text-[#141312] hover:bg-white border border-transparent hover:border-[#E8E4DF] transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Scrollable Content */}
                <div className="p-5 overflow-y-auto space-y-6 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Dress Photos & Gallery */}
                    <div className="md:col-span-5 space-y-3">
                      <div
                        className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-[#FAF9F6] border border-[#E8E4DF] shadow-xs group cursor-pointer"
                        onClick={() => setIsLightboxOpen(true)}
                        title="Click to view full-resolution photo"
                      >
                        <GarmentImage
                          src={activeImg}
                          alt={currentGarment.name}
                          garmentName={currentGarment.name}
                          designerName={currentGarment.designer}
                          categoryName={currentGarment.category}
                          aspectRatio="aspect-auto"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Zoom Lightbox Trigger */}
                        {activeImg && (
                          <div className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-[#141312]/70 hover:bg-[#141312] text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs shadow-sm">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        )}
                        {/* Status Overlay if disabled */}
                        {isProductDisabled && (
                          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-[#DC2626] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            Product Disabled
                          </div>
                        )}
                      </div>

                      {/* Thumbnail strip */}
                      {displayImages.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {displayImages.map((img, idx) => {
                            const isSelected = activeImg === img;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setActivePreviewImageIdx(idx)}
                                className={`shrink-0 w-12 h-16 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-[#80232F] ring-2 ring-[#80232F]/20 scale-105'
                                    : 'border-[#E8E4DF] opacity-70 hover:opacity-100'
                                }`}
                              >
                                <GarmentImage
                                  src={img}
                                  alt={`Thumbnail ${idx + 1}`}
                                  garmentName={currentGarment.name}
                                  designerName={currentGarment.designer}
                                  categoryName={currentGarment.category}
                                  compact
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Color Variations Switcher if available */}
                      {currentGarment.variations && currentGarment.variations.length > 0 && (
                        <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl p-3 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C5854] block">
                            Color Variations ({currentGarment.variations.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {currentGarment.variations.map((v) => {
                              const isVarActive = activePreviewVariationId === v.id;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => {
                                    setActivePreviewVariationId(v.id);
                                    if (v.images && v.images.length > 0) {
                                      const matchIdx = displayImages.indexOf(v.images[0]);
                                      if (matchIdx >= 0) setActivePreviewImageIdx(matchIdx);
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                                    isVarActive
                                      ? 'bg-[#141312] text-white border-[#141312] shadow-xs'
                                      : 'bg-white text-[#5C5854] border-[#E8E4DF] hover:border-[#141312]'
                                  }`}
                                >
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-black/20"
                                    style={{ backgroundColor: v.colorHex || '#141312' }}
                                  />
                                  <span>{v.colorName || v.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Piece Specs, Live Status, Rates & Inventory */}
                    <div className="md:col-span-7 space-y-4">
                      {/* Live Status & Vault Stock Controls */}
                      <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl p-4 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#141312] flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-[#80232F]" />
                            Vault Inventory & Rental Status
                          </span>
                          <span className="text-[10px] text-[#948E88] font-mono">
                            Category: {currentGarment.category}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Rental Booking Toggle */}
                          <div className="bg-white p-3 rounded-lg border border-[#E8E4DF] flex flex-col justify-between">
                            <span className="text-[10px] font-medium text-[#5C5854] uppercase tracking-wider">
                              Rental Availability
                            </span>
                            <div className="mt-1.5 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleToggleRentalAvailability(currentGarment)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border cursor-pointer ${
                                  isAvailable && !isProductDisabled
                                    ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0] hover:bg-[#BBF7D0]'
                                    : 'bg-[#FEF3C7] text-[#78350F] border-[#FDE68A] hover:bg-[#FDE68A]'
                                }`}
                              >
                                {isAvailable && !isProductDisabled ? (
                                  <ToggleRight className="w-4 h-4 text-[#16A34A]" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4 text-[#78350F]" />
                                )}
                                <span>{isAvailable && !isProductDisabled ? 'Rental Active' : 'Rental Paused'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Catalog Status Toggle */}
                          <div className="bg-white p-3 rounded-lg border border-[#E8E4DF] flex flex-col justify-between">
                            <span className="text-[10px] font-medium text-[#5C5854] uppercase tracking-wider">
                              Storefront Listing
                            </span>
                            <div className="mt-1.5 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleToggleProductStatus(currentGarment)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border cursor-pointer ${
                                  isProductDisabled
                                    ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA] hover:bg-[#FECACA]'
                                    : 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7] hover:bg-[#DCFCE7]'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${isProductDisabled ? 'bg-[#DC2626]' : 'bg-[#15803D]'}`} />
                                <span>{isProductDisabled ? 'Product Disabled' : 'Listed in Catalog'}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Stock Stepper */}
                        <div className="bg-white p-3 rounded-lg border border-[#E8E4DF] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-medium text-[#5C5854] uppercase tracking-wider block">
                              Vault Stock Units
                            </span>
                            <span className="text-xs text-[#948E88]">
                              Low stock threshold: {currentGarment.lowStockThreshold || 2} units
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={currentQty <= 0}
                              onClick={() => handleQuickAdjustQuantity(currentGarment, -1)}
                              className="w-7 h-7 rounded-md border border-[#E8E4DF] bg-[#FAF9F6] hover:bg-[#E8E4DF] text-[#141312] font-semibold text-xs flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-serif text-base font-bold text-[#141312]">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustQuantity(currentGarment, 1)}
                              className="w-7 h-7 rounded-md border border-[#E8E4DF] bg-[#FAF9F6] hover:bg-[#E8E4DF] text-[#141312] font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Escrow Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl p-3">
                          <span className="text-[9px] uppercase font-bold text-[#948E88] tracking-wider block">
                            4-Day Rental
                          </span>
                          <span className="font-serif text-sm font-bold text-[#141312] mt-0.5 block">
                            {formatPHP(currentGarment.basePrice4Days)}
                          </span>
                        </div>
                        <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl p-3">
                          <span className="text-[9px] uppercase font-bold text-[#948E88] tracking-wider block">
                            Extra Day Rate
                          </span>
                          <span className="font-serif text-sm font-bold text-[#141312] mt-0.5 block">
                            +{formatPHP(currentGarment.dailyExtraRate || Math.round(currentGarment.basePrice4Days * 0.15))}/d
                          </span>
                        </div>
                        <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl p-3">
                          <span className="text-[9px] uppercase font-bold text-[#948E88] tracking-wider block">
                            Security Deposit
                          </span>
                          <span className="font-serif text-sm font-bold text-[#80232F] mt-0.5 block">
                            {formatPHP(currentGarment.securityDeposit)}
                          </span>
                        </div>
                        <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl p-3">
                          <span className="text-[9px] uppercase font-bold text-[#948E88] tracking-wider block">
                            Retail Value
                          </span>
                          <span className="font-serif text-sm font-bold text-[#5C5854] mt-0.5 block">
                            {formatPHP(currentGarment.retailValue)}
                          </span>
                        </div>
                      </div>

                      {/* Description & Specifications */}
                      <div className="bg-white border border-[#E8E4DF] rounded-xl p-4 space-y-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C5854] block mb-1">
                            Editorial Description
                          </span>
                          <p className="text-xs text-[#5C5854] leading-relaxed">
                            {currentGarment.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#E8E4DF] text-xs">
                          <div>
                            <span className="text-[9.5px] uppercase font-medium text-[#948E88] block">Category</span>
                            <span className="font-medium text-[#141312]">{currentGarment.category}</span>
                          </div>
                          <div>
                            <span className="text-[9.5px] uppercase font-medium text-[#948E88] block">Silhouette</span>
                            <span className="font-medium text-[#141312]">{currentGarment.silhouette || 'Standard'}</span>
                          </div>
                          <div>
                            <span className="text-[9.5px] uppercase font-medium text-[#948E88] block">Fabric</span>
                            <span className="font-medium text-[#141312]">{currentGarment.fabric || 'Luxury blend'}</span>
                          </div>
                        </div>

                        {/* Sizes */}
                        <div className="pt-2 border-t border-[#E8E4DF]">
                          <span className="text-[9.5px] uppercase font-medium text-[#948E88] block mb-1">
                            Available Sizes
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {currentGarment.sizes.map((s) => (
                              <span
                                key={s}
                                className="px-2.5 py-0.5 rounded-md border border-[#E8E4DF] bg-[#FAF9F6] text-xs font-semibold text-[#141312]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Bottom Footer Actions */}
                <div className="px-5 py-3.5 border-t border-[#E8E4DF] bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const g = currentGarment;
                        setPreviewGarment(null);
                        setQuickAdjustGarment(g);
                      }}
                      className="px-3.5 py-2 rounded-lg bg-white border border-[#E8E4DF] hover:border-[#141312] text-xs font-medium text-[#141312] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#80232F]" />
                      <span>Quick Adjust Price & Stock</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const g = currentGarment;
                        setPreviewGarment(null);
                        setImageUrlInput('');
                        setEditingGarment(g);
                      }}
                      className="px-3.5 py-2 rounded-lg bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Piece & Photos</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewGarment(null)}
                      className="px-4 py-2 rounded-lg text-xs font-medium text-[#5C5854] hover:text-[#141312] hover:bg-white border border-transparent hover:border-[#E8E4DF] transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          );
        })()}

      {/* HIGH-RES LIGHTBOX MODAL */}
      {isLightboxOpen &&
        previewGarment &&
        (() => {
          const currentGarment = garments.find((g) => g.id === previewGarment.id) || previewGarment;
          const variationImages = (currentGarment.variations || []).flatMap((v) => v.images || []);
          const colorImages = (currentGarment.colors || []).map((c) => c.image).filter(Boolean) as string[];
          const rawImagesList = [
            ...(currentGarment.images || []),
            ...variationImages,
            ...colorImages,
          ];
          const allImages = Array.from(new Set(rawImagesList.filter((img) => typeof img === 'string' && img.trim().length > 0)));
          const displayImages = allImages.length > 0 ? allImages : (currentGarment.images && currentGarment.images.length > 0 ? currentGarment.images : ['']);
          const activeImg = displayImages[Math.min(activePreviewImageIdx, displayImages.length - 1)] || displayImages[0] || '';

          if (!activeImg) return null;

          return createPortal(
            <div
              className="fixed inset-0 z-70 bg-black/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 sm:p-6 animate-fadeIn select-none"
              onClick={() => setIsLightboxOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-colors cursor-pointer z-20 shadow-lg"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>

              {displayImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePreviewImageIdx((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1));
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-colors cursor-pointer z-20 shadow-lg"
                    title="Previous Image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePreviewImageIdx((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-colors cursor-pointer z-20 shadow-lg"
                    title="Next Image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              <div
                className="relative max-h-[85vh] max-w-[92vw] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={activeImg}
                  alt={currentGarment.name}
                  className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
                  referrerPolicy="no-referrer"
                />
                <div className="mt-3 px-4 py-1.5 rounded-full bg-black/60 border border-white/20 text-white/90 text-xs font-medium text-center shadow-md">
                  {currentGarment.designer} — {currentGarment.name}
                  {displayImages.length > 1 && (
                    <span className="ml-2 text-white/60 font-mono">
                      ({activePreviewImageIdx + 1}/{displayImages.length})
                    </span>
                  )}
                </div>
              </div>
            </div>,
            document.body
          );
        })()}

      {/* QUICK ADJUST PRICE & STOCK MODAL */}
      {quickAdjustGarment &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-[#141312]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#E8E4DF] w-full max-w-lg shadow-xl p-5 space-y-4 my-8 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#80232F]" />
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[#141312]">
                    Quick Price & Inventory Adjuster
                  </h3>
                  <p className="text-[11px] text-[#5C5854]">{quickAdjustGarment.name} · {quickAdjustGarment.designer}</p>
                </div>
              </div>
              <button
                onClick={() => setQuickAdjustGarment(null)}
                className="text-[#948E88] hover:text-[#141312] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Piece Preview Card inside Quick Adjust */}
            <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-2.5 flex items-center gap-3">
              <div className="w-12 h-16 rounded-md overflow-hidden bg-white border border-[#E8E4DF] shrink-0">
                <GarmentImage
                  src={quickAdjustGarment.images[0]}
                  alt={quickAdjustGarment.name}
                  garmentName={quickAdjustGarment.name}
                  designerName={quickAdjustGarment.designer}
                  categoryName={quickAdjustGarment.category}
                  compact
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xs space-y-0.5 flex-1 min-w-0">
                <p className="font-serif font-semibold text-[#141312] truncate">
                  {quickAdjustGarment.name}
                </p>
                <p className="text-[10px] text-[#5C5854] truncate">
                  {quickAdjustGarment.designer} · {quickAdjustGarment.category}
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-[#948E88] font-mono">
                  <span>ID: {quickAdjustGarment.id}</span>
                  <span>·</span>
                  <span>{quickAdjustGarment.images.length} photo(s)</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveQuickAdjust} className="space-y-4">
              {/* 1. Rental Availability Switch */}
              <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#141312] block">
                    Rental Availability Status
                  </span>
                  <span className="text-[10px] text-[#5C5854]">
                    {quickAdjustGarment.is_available_for_rent !== false
                      ? 'Customers can browse and book this dress online'
                      : 'Rental is paused; disabled for customer booking'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQuickAdjustGarment({
                      ...quickAdjustGarment,
                      is_available_for_rent: quickAdjustGarment.is_available_for_rent === false ? true : false,
                      available_to_sell: quickAdjustGarment.is_available_for_rent === false ? true : false,
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                    quickAdjustGarment.is_available_for_rent !== false
                      ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]'
                      : 'bg-[#FEF3C7] text-[#78350F] border-[#FDE68A]'
                  }`}
                >
                  {quickAdjustGarment.is_available_for_rent !== false ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>Rental Active</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>Rental Paused</span>
                    </>
                  )}
                </button>
              </div>

              {/* 2. Stock Quantity Stepper */}
              <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#141312] flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#5C5854]" />
                    Vault Stock Quantity
                  </span>
                  <span className="text-[10px] text-[#5C5854]">
                    Total physical units in stock
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const current = typeof quickAdjustGarment.quantity === 'number' ? quickAdjustGarment.quantity : 1;
                        setQuickAdjustGarment({
                          ...quickAdjustGarment,
                          quantity: Math.max(0, current - 1),
                        });
                      }}
                      className="w-8 h-8 rounded border border-[#E8E4DF] bg-white hover:bg-[#FAF9F6] text-[#141312] font-bold text-sm flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={typeof quickAdjustGarment.quantity === 'number' ? quickAdjustGarment.quantity : 1}
                      onChange={(e) =>
                        setQuickAdjustGarment({
                          ...quickAdjustGarment,
                          quantity: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="w-16 text-center font-serif text-lg font-bold bg-white border border-[#E8E4DF] rounded py-1 text-[#141312] focus:outline-none focus:border-[#141312]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const current = typeof quickAdjustGarment.quantity === 'number' ? quickAdjustGarment.quantity : 1;
                        setQuickAdjustGarment({
                          ...quickAdjustGarment,
                          quantity: current + 1,
                        });
                      }}
                      className="w-8 h-8 rounded border border-[#E8E4DF] bg-white hover:bg-[#FAF9F6] text-[#141312] font-bold text-sm flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[1, 2, 5, 10].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          setQuickAdjustGarment({
                            ...quickAdjustGarment,
                            quantity: preset,
                          })
                        }
                        className="px-2 py-1 rounded bg-white hover:bg-[#141312] hover:text-white border border-[#E8E4DF] text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        {preset} units
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Pricing Adjustment Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    4-Day Base Rate (PHP) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={quickAdjustGarment.basePrice4Days}
                    onChange={(e) => {
                      const newBase = Number(e.target.value);
                      setQuickAdjustGarment({
                        ...quickAdjustGarment,
                        basePrice4Days: newBase,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] bg-white focus:outline-none focus:border-[#141312]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-medium uppercase text-[#5C5854] block">
                      Daily Extra Rate (PHP)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setQuickAdjustGarment({
                          ...quickAdjustGarment,
                          dailyExtraRate: Math.round((quickAdjustGarment.basePrice4Days || 4500) * 0.15),
                        })
                      }
                      className="text-[9px] text-[#80232F] hover:underline"
                    >
                      Auto 15%
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={quickAdjustGarment.dailyExtraRate || Math.round(quickAdjustGarment.basePrice4Days * 0.15)}
                    onChange={(e) =>
                      setQuickAdjustGarment({
                        ...quickAdjustGarment,
                        dailyExtraRate: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] bg-white focus:outline-none focus:border-[#141312]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-medium uppercase text-[#5C5854] block">
                      Security Deposit (PHP)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setQuickAdjustGarment({
                          ...quickAdjustGarment,
                          securityDeposit: Math.round((quickAdjustGarment.basePrice4Days || 4500) * 0.5),
                        })
                      }
                      className="text-[9px] text-[#80232F] hover:underline"
                    >
                      Auto 50%
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={quickAdjustGarment.securityDeposit}
                    onChange={(e) =>
                      setQuickAdjustGarment({
                        ...quickAdjustGarment,
                        securityDeposit: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] bg-white focus:outline-none focus:border-[#141312]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    Retail Replacement Value (PHP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quickAdjustGarment.retailValue || 65000}
                    onChange={(e) =>
                      setQuickAdjustGarment({
                        ...quickAdjustGarment,
                        retailValue: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] bg-white focus:outline-none focus:border-[#141312]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E8E4DF] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickAdjustGarment(null)}
                  className="px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#5C5854] hover:text-[#141312] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Saving to Firestore...</span>
                    </>
                  ) : (
                    <span>Save Updates</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* FULL EDIT PIECE & VARIATIONS MODAL */}
      {editingGarment &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-[#141312]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#E8E4DF] w-full max-w-2xl shadow-xl p-5 space-y-4 my-8 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#141312]" />
                <h3 className="font-serif text-sm font-semibold text-[#141312]">
                  Edit Piece, Inventory & Variations
                </h3>
              </div>
              <button
                onClick={() => setEditingGarment(null)}
                className="text-[#948E88] hover:text-[#141312] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Piece Preview Summary inside Full Edit Modal */}
            <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-2.5 flex items-center gap-3">
              <div className="w-12 h-16 rounded-md overflow-hidden bg-white border border-[#E8E4DF] shrink-0">
                <GarmentImage
                  src={editingGarment.images[0]}
                  alt={editingGarment.name || 'Garment'}
                  garmentName={editingGarment.name}
                  designerName={editingGarment.designer}
                  categoryName={editingGarment.category}
                  compact
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xs space-y-0.5 flex-1 min-w-0">
                <p className="font-serif font-semibold text-[#141312] truncate">
                  {editingGarment.name || 'Untitled Garment'}
                </p>
                <p className="text-[10px] text-[#5C5854] truncate">
                  {editingGarment.designer || 'Sinta Collection'} · {editingGarment.category}
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-[#948E88] font-mono">
                  <span>ID: {editingGarment.id}</span>
                  <span>·</span>
                  <span>{editingGarment.images.length} photo(s)</span>
                  <span>·</span>
                  <span>{editingGarment.variations?.length || 0} variation(s)</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateGarment} className="space-y-4">
              {/* Inventory Management Row in Edit */}
              <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg p-3.5 space-y-3">
                <span className="text-[11px] font-semibold text-[#141312] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#80232F]" />
                  Inventory & Rental Availability
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                      Rental Status
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingGarment({
                          ...editingGarment,
                          is_available_for_rent: editingGarment.is_available_for_rent === false ? true : false,
                          available_to_sell: editingGarment.is_available_for_rent === false ? true : false,
                        })
                      }
                      className={`w-full py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        editingGarment.is_available_for_rent !== false
                          ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]'
                          : 'bg-[#FEF3C7] text-[#78350F] border-[#FDE68A]'
                      }`}
                    >
                      {editingGarment.is_available_for_rent !== false ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          <span>Rental Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          <span>Rental Paused</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                      Vault Stock Quantity
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={typeof editingGarment.quantity === 'number' ? editingGarment.quantity : 1}
                      onChange={(e) =>
                        setEditingGarment({
                          ...editingGarment,
                          quantity: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] bg-white focus:outline-none focus:border-[#141312]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editingGarment.lowStockThreshold || 1}
                      onChange={(e) =>
                        setEditingGarment({
                          ...editingGarment,
                          lowStockThreshold: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] bg-white focus:outline-none focus:border-[#141312]"
                    />
                  </div>
                </div>
              </div>

              {/* Master Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    Master Garment Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingGarment.name}
                    onChange={(e) => setEditingGarment({ ...editingGarment, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    Designer / Fashion House *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingGarment.designer}
                    onChange={(e) => setEditingGarment({ ...editingGarment, designer: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    Category
                  </label>
                  <select
                    value={editingGarment.category}
                    onChange={(e) => setEditingGarment({ ...editingGarment, category: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312] bg-white"
                  >
                    {categories.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    4-Day Rate (PHP) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={editingGarment.basePrice4Days}
                    onChange={(e) => setEditingGarment({ ...editingGarment, basePrice4Days: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    Daily Extra Rate (PHP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingGarment.dailyExtraRate || Math.round(editingGarment.basePrice4Days * 0.15)}
                    onChange={(e) => setEditingGarment({ ...editingGarment, dailyExtraRate: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    Security Deposit (PHP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingGarment.securityDeposit}
                    onChange={(e) => setEditingGarment({ ...editingGarment, securityDeposit: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                </div>
              </div>

              {/* Style & Color Variations Management Section */}
              <div className="border border-[#E8E4DF] rounded-lg p-3.5 bg-[#FAF9F6] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#141312] flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#80232F]" />
                    Color Variations ({editingGarment.variations?.length || editingGarment.colors.length || 0})
                  </span>
                  <span className="text-[10px] text-[#5C5854]">
                    Each variation appears on the customer storefront as selectable swatch
                  </span>
                </div>

                {/* Existing variations list */}
                <div className="space-y-2">
                  {(editingGarment.variations || []).map((v, vIdx) => (
                    <div
                      key={v.id || vIdx}
                      className="flex items-center justify-between bg-white p-2 rounded-md border border-[#E8E4DF] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: v.hex || getHexForColorName(v.name) }}
                        />
                        <span className="font-semibold text-[#141312]">{v.name}</span>
                        <span className="text-[10px] text-[#948E88] font-mono">({v.sku || 'SKU'})</span>
                        <span className="text-[10px] bg-[#FAF9F6] px-1.5 py-0.5 rounded border border-[#E8E4DF] text-[#5C5854]">
                          {v.images?.length || 0} photos
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariation(vIdx)}
                        className="text-[#948E88] hover:text-[#B91C1C] p-1 cursor-pointer"
                        title="Remove Variation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new variation input row */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#E8E4DF]">
                  <input
                    type="text"
                    placeholder="New Variation Color (e.g. Olive Green, Burgundy, Champagne)..."
                    value={newVarName}
                    onChange={(e) => {
                      setNewVarName(e.target.value);
                      setNewVarHex(getHexForColorName(e.target.value));
                    }}
                    className="flex-1 px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs bg-white text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                  <input
                    type="color"
                    value={newVarHex}
                    onChange={(e) => setNewVarHex(e.target.value)}
                    className="w-8 h-8 rounded border border-[#E8E4DF] cursor-pointer bg-white p-0.5 shrink-0"
                    title="Choose Color Hex"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariationToEditing}
                    disabled={!newVarName.trim()}
                    className="px-3 py-1.5 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    Add Variation
                  </button>
                </div>
              </div>

              {/* Product Photos Section */}
              <div className="border border-[#E8E4DF] rounded-lg p-3.5 bg-[#FAF9F6] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#141312] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Product Photos ({editingGarment.images.length})
                  </span>
                  <span className="text-[10px] text-[#5C5854]">
                    First image is used as primary cover
                  </span>
                </div>

                {/* Image Thumbnails Grid */}
                <div className="flex flex-wrap gap-2.5">
                  {editingGarment.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-20 rounded-md border border-[#E8E4DF] overflow-hidden bg-white shadow-2xs group"
                    >
                      <GarmentImage
                        src={imgUrl}
                        alt={`Photo ${idx + 1}`}
                        garmentName={editingGarment.name}
                        designerName={editingGarment.designer}
                        categoryName={editingGarment.category}
                        compact
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-[#141312]/80 text-[8px] text-white text-center py-0.5 font-medium">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx, true)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove Photo"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}

                  {/* Upload from Local Computer */}
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-16 h-20 rounded-md border border-dashed border-[#948E88] bg-white hover:bg-[#FAF9F6] flex flex-col items-center justify-center text-[#5C5854] hover:text-[#141312] transition-colors p-1 text-center cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mb-1" />
                    <span className="text-[9px] font-medium leading-tight">Upload Photo</span>
                  </button>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, true)}
                  />
                </div>

                {/* Add Image by URL Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Or paste image URL (Firebase Storage, Google Drive, direct URL)..."
                    className="flex-1 px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs bg-white text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddImageUrl(true)}
                    className="px-3 py-1.5 bg-[#141312] text-white text-xs font-medium rounded-md hover:bg-[#2A2725] transition-colors shrink-0 cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingGarment.description}
                  onChange={(e) => setEditingGarment({ ...editingGarment, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E4DF] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingGarment(null)}
                  className="px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#5C5854] hover:text-[#141312] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save to Firestore</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ADD NEW PIECE MODAL */}
      {isAddModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-[#141312]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#E8E4DF] w-full max-w-lg shadow-xl p-5 space-y-4 my-8 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#141312]" />
                <h3 className="font-serif text-sm font-semibold text-[#141312]">
                  Add Designer Piece to Firestore
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#948E88] hover:text-[#141312] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGarment} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    Garment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Celine Pleated Gown"
                    value={newGarment.name}
                    onChange={(e) => setNewGarment({ ...newGarment, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    Designer / Fashion House *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Michael Leyva"
                    value={newGarment.designer}
                    onChange={(e) => setNewGarment({ ...newGarment, designer: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                </div>
              </div>

              {/* Initial Inventory & Rental Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAF9F6] p-3 rounded-lg border border-[#E8E4DF]">
                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    Initial Stock Quantity
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newGarment.quantity || 1}
                    onChange={(e) => setNewGarment({ ...newGarment, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] bg-white focus:outline-none focus:border-[#141312]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    Rental Availability
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewGarment({
                        ...newGarment,
                        is_available_for_rent: newGarment.is_available_for_rent === false ? true : false,
                      })
                    }
                    className={`w-full py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      newGarment.is_available_for_rent !== false
                        ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]'
                        : 'bg-[#FEF3C7] text-[#78350F] border-[#FDE68A]'
                    }`}
                  >
                    {newGarment.is_available_for_rent !== false ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        <span>Rental Enabled</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        <span>Rental Paused</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    Category
                  </label>
                  <select
                    value={newGarment.category}
                    onChange={(e) => setNewGarment({ ...newGarment, category: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312] bg-white"
                  >
                    {categories.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    4-Day Base Rental Rate (PHP) *
                  </label>
                  <input
                    type="number"
                    required
                    min={500}
                    value={newGarment.basePrice4Days}
                    onChange={(e) => setNewGarment({ ...newGarment, basePrice4Days: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    Refundable Security Deposit (PHP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newGarment.securityDeposit}
                    onChange={(e) => setNewGarment({ ...newGarment, securityDeposit: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    Retail Replacement Value (PHP)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    value={newGarment.retailValue}
                    onChange={(e) => setNewGarment({ ...newGarment, retailValue: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                </div>
              </div>

              {/* Product Photos Section in Add Modal */}
              <div className="border border-[#E8E4DF] rounded-lg p-3 bg-[#FAF9F6] space-y-2.5">
                <span className="text-[10px] font-semibold uppercase text-[#5C5854] block">
                  Product Photos ({newGarment.images?.length || 0})
                </span>

                <div className="flex flex-wrap gap-2">
                  {newGarment.images?.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative w-14 h-18 rounded-md border border-[#E8E4DF] overflow-hidden bg-white shadow-2xs group"
                    >
                      <img
                        src={imgUrl}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx, false)}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-18 rounded-md border border-dashed border-[#948E88] bg-white hover:bg-[#FAF9F6] flex flex-col items-center justify-center text-[#5C5854] hover:text-[#141312] transition-colors p-1 text-center cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 mb-0.5" />
                    <span className="text-[8px] font-medium leading-tight">Upload</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, false)}
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Or paste image URL (Firebase, Google Drive, URL)..."
                    className="flex-1 px-3 py-1 border border-[#E8E4DF] rounded-md text-xs bg-white text-[#141312] focus:outline-none focus:border-[#141312]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddImageUrl(false)}
                    className="px-2.5 py-1 bg-[#141312] text-white text-[11px] font-medium rounded-md hover:bg-[#2A2725] transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Details regarding cut, styling, and couture craftsmanship..."
                  value={newGarment.description}
                  onChange={(e) => setNewGarment({ ...newGarment, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E4DF] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#5C5854] hover:text-[#141312] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Saving to Firestore...</span>
                    </>
                  ) : (
                    <span>Save to Firestore Vault</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* System & Cache Performance Modal */}
      <CachePerformanceModal
        isOpen={isCacheModalOpen}
        onClose={() => setIsCacheModalOpen(false)}
        garments={garments}
      />
    </div>
  );
};
