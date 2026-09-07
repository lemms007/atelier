import React, { useState, useRef } from 'react';
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
  Info,
} from 'lucide-react';
import { Garment, GarmentVariation, GarmentSize } from '../../types';
import { GarmentImage } from '../common/GarmentImage';
import { getHexForColorName } from '../../services/firestoreProducts';

export const AdminInventoryView: React.FC = () => {
  const {
    garments,
    orders,
    setSelectedGarment,
    switchToUser,
    isFirestoreLoading,
    firestoreSource,
    saveGarment,
    deleteGarment,
    purgeDemoGarments,
    normalizeFirestoreDatabase,
    configuredDurations,
    setConfiguredDurations,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [adminDurationInput, setAdminDurationInput] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGarment, setEditingGarment] = useState<Garment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
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

  const filteredGarments = garments.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.designer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.variations && g.variations.some(v => v.name.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCat = selectedCategory === 'All' || g.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Check if any demo items exist
  const hasDemoGarments = garments.some((g) =>
    ['garment-1', 'garment-2', 'garment-3', 'garment-4', 'garment-5', 'garment-6'].includes(g.id)
  );

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
      const payload: Garment = {
        id: gId,
        name: newGarment.name || 'Couture Piece',
        designer: newGarment.designer || 'Atelier Manila',
        category: newGarment.category as any || 'Gala & Black Tie',
        retailValue: Number(newGarment.retailValue) || 65000,
        basePrice4Days: Number(newGarment.basePrice4Days) || 4500,
        dailyExtraRate: Math.round((Number(newGarment.basePrice4Days) || 4500) * 0.15),
        securityDeposit: Number(newGarment.securityDeposit) || 3000,
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
            inStock: true,
            basePrice4Days: Number(newGarment.basePrice4Days) || 4500,
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
      setNewGarment({
        name: '',
        designer: '',
        category: 'Gala & Black Tie',
        basePrice4Days: 4500,
        dailyExtraRate: 600,
        securityDeposit: 3000,
        retailValue: 65000,
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
      setEditingGarment(null);
    } catch (err) {
      console.error('Error updating garment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (garment: Garment) => {
    if (window.confirm(`Are you sure you want to remove "${garment.name}" from Firestore?`)) {
      try {
        await deleteGarment(garment.id);
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
        'Normalize and unify product variations in Firestore? This will group duplicate/split color records (e.g., Aurora Burgundy & Aurora Olive Green) into unified master pieces with clean colorway variations.'
      )
    ) {
      setIsNormalizing(true);
      try {
        const report = await normalizeFirestoreDatabase();
        setNormalizeReport(report);
      } catch (err) {
        console.error('Failed to normalize:', err);
      } finally {
        setIsNormalizing(false);
      }
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Banner: Firestore Database Status & Variation Management */}
      <div className="bg-[#FFFFFF] border border-[#E8E4DF] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FAF9F6] border border-[#E8E4DF] flex items-center justify-center text-[#141312] shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-sm font-semibold text-[#141312]">
                Firestore Product Catalog & Variations
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] px-2 py-0.5 rounded font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                rent-to-slay
              </span>
            </div>
            <p className="text-xs text-[#5C5854] mt-0.5">
              Normalized Firestore catalog with dynamic multi-colorway variations and live inventory synchronization.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Normalize Variations Tool Button */}
          <button
            onClick={handleRunNormalization}
            disabled={isNormalizing}
            className="px-3 py-2 border border-[#E8E4DF] bg-[#FAF9F6] hover:bg-[#141312] hover:text-white text-[#141312] text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 shadow-sm"
            title="Scan database and merge identical styles differing only in color/variation"
          >
            {isNormalizing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            )}
            <span>Normalize Variations</span>
          </button>

          {hasDemoGarments && (
            <button
              onClick={handlePurgeDemo}
              disabled={isPurging}
              className="px-3 py-2 border border-[#FEE2E2] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              title="Remove dummy sample pieces from Firestore"
            >
              {isPurging ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Clear Demo Pieces</span>
            </button>
          )}

          <button
            id="btn-admin-add-garment"
            onClick={() => {
              setImageUrlInput('');
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Piece to Firestore</span>
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
            className="text-[#948E88] hover:text-[#141312] p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DF]">
          <span className="text-[10px] text-[#948E88] uppercase font-medium tracking-wider block">
            Master Garments
          </span>
          <span className="font-serif text-xl font-semibold text-[#141312] mt-0.5 block">
            {garments.length}
          </span>
          <span className="text-[10px] text-[#5C5854] mt-1 block">Unified Couture Styles</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DF]">
          <span className="text-[10px] text-[#948E88] uppercase font-medium tracking-wider block">
            Colorway Variations
          </span>
          <span className="font-serif text-xl font-semibold text-[#141312] mt-0.5 block">
            {garments.reduce((acc, g) => acc + (g.variations?.length || g.colors.length || 1), 0)}
          </span>
          <span className="text-[10px] text-[#22C55E] mt-1 block">Live Color SKU Options</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DF]">
          <span className="text-[10px] text-[#948E88] uppercase font-medium tracking-wider block">
            Currently Out on Rental
          </span>
          <span className="font-serif text-xl font-semibold text-[#141312] mt-0.5 block">
            {garments.filter((g) => getGarmentRentalStats(g.id).isCurrentlyRented).length}
          </span>
          <span className="text-[10px] text-[#D97706] mt-1 block">Active Deployments</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DF]">
          <span className="text-[10px] text-[#948E88] uppercase font-medium tracking-wider block">
            Average 4-Day Rate
          </span>
          <span className="font-serif text-xl font-semibold text-[#141312] mt-0.5 block">
            {garments.length > 0
              ? formatPHP(
                  Math.round(
                    garments.reduce((acc, g) => acc + (g.basePrice4Days || 0), 0) / garments.length
                  )
                )
              : formatPHP(0)}
          </span>
          <span className="text-[10px] text-[#5C5854] mt-1 block">Base Rental Yield</span>
        </div>
      </div>

      {/* Admin Rental Duration Presets Configuration */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E8E4DF] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
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
            onClick={() => setConfiguredDurations([4, 8, 12, 14])}
            className="text-[11px] text-[#80232F] hover:underline px-1 py-1 font-medium cursor-pointer"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DF] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search garment, variation or designer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#FAF9F6] border border-[#E8E4DF] rounded-md text-xs text-[#141312] placeholder-[#948E88] focus:outline-none focus:border-[#141312]"
          />
          <Search className="w-3.5 h-3.5 text-[#948E88] absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? 'bg-[#141312] text-white border-[#141312]'
                  : 'bg-[#FAF9F6] text-[#5C5854] border-[#E8E4DF] hover:text-[#141312]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-[#E8E4DF] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#141312]">
            <thead className="bg-[#FAF9F6] text-[10px] uppercase tracking-wider text-[#948E88] font-medium border-b border-[#E8E4DF]">
              <tr>
                <th className="py-3 px-4">Garment & Photos</th>
                <th className="py-3 px-3">Variations & Colors</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Sizes</th>
                <th className="py-3 px-3">4-Day Base</th>
                <th className="py-3 px-3">Deposit</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DF]">
              {filteredGarments.map((garment) => {
                const stats = getGarmentRentalStats(garment.id);
                const hasMultiVars = garment.variations && garment.variations.length > 1;

                return (
                  <tr key={garment.id} className="hover:bg-[#FAF9F6]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative group/thumb shrink-0 w-11 h-14 rounded-md overflow-hidden bg-[#FAF9F6] border border-[#E8E4DF] shadow-2xs">
                          <GarmentImage
                            src={garment.images[0]}
                            alt={garment.name}
                            garmentName={garment.name}
                            designerName={garment.designer}
                            categoryName={garment.category}
                            aspectRatio="aspect-auto"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => {
                              setImageUrlInput('');
                              setEditingGarment(garment);
                            }}
                            className="absolute inset-0 bg-[#141312]/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px]"
                            title="Edit Photos"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <p className="font-serif font-semibold text-xs text-[#141312]">
                            {garment.name}
                          </p>
                          <p className="text-[10px] text-[#5C5854]">{garment.designer}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] text-[#948E88] font-mono">ID: {garment.id}</span>
                            <span className="text-[9px] text-[#5C5854] bg-[#FAF9F6] px-1 py-0.2 rounded border border-[#E8E4DF]">
                              {garment.images.length} photo{garment.images.length === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Variations & Colors column */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {garment.colors.map((c) => (
                            <span
                              key={c.name}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#E8E4DF] bg-[#FAF9F6] text-[10px] text-[#141312]"
                              title={c.name}
                            >
                              <span
                                className="w-2 h-2 rounded-full border border-black/10"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span>{c.name}</span>
                            </span>
                          ))}
                        </div>
                        {hasMultiVars && (
                          <span className="inline-block text-[9px] font-semibold text-[#80232F] bg-[#FDF2F2] border border-[#FEE2E2] px-1.5 py-0.2 rounded">
                            {garment.variations!.length} Normalized Variations
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-[#5C5854]">
                      <span className="bg-[#FAF9F6] border border-[#E8E4DF] px-2 py-0.5 rounded text-[10px]">
                        {garment.category}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        {garment.sizes.map((s) => (
                          <span
                            key={s}
                            className="w-5 h-5 rounded border border-[#E8E4DF] bg-[#FAF9F6] text-[9px] font-medium flex items-center justify-center text-[#5C5854]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-medium text-[#141312]">
                      {formatPHP(garment.basePrice4Days)}
                    </td>

                    <td className="py-3 px-3 text-[#5C5854]">
                      {formatPHP(garment.securityDeposit)}
                    </td>

                    <td className="py-3 px-3">
                      {stats.isCurrentlyRented ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded">
                          <Clock className="w-2.5 h-2.5" />
                          Out on Rental
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#16A34A] bg-[#DCFCE7] border border-[#BBF7D0] px-2 py-0.5 rounded">
                          <Check className="w-2.5 h-2.5" />
                          Vault Ready
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setImageUrlInput('');
                            setEditingGarment(garment);
                          }}
                          className="p-1.5 rounded hover:bg-[#FAF9F6] text-[#5C5854] hover:text-[#141312] border border-transparent hover:border-[#E8E4DF] transition-colors inline-flex items-center gap-1 text-[10px] font-medium"
                          title="Edit Piece & Photos"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handlePreviewInStore(garment)}
                          className="p-1.5 rounded hover:bg-[#FAF9F6] text-[#5C5854] hover:text-[#141312] border border-transparent hover:border-[#E8E4DF] transition-colors inline-flex items-center gap-1 text-[10px] font-medium"
                          title="Preview in Storefront"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="hidden sm:inline">PDP</span>
                        </button>
                        <button
                          onClick={() => handleDelete(garment)}
                          className="p-1.5 rounded hover:bg-[#FEF2F2] text-[#948E88] hover:text-[#B91C1C] border border-transparent hover:border-[#FEE2E2] transition-colors inline-flex items-center"
                          title="Delete from Firestore"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Garment, Variations & Photos Modal */}
      {editingGarment && (
        <div className="fixed inset-0 z-50 bg-[#141312]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#E8E4DF] w-full max-w-2xl shadow-xl p-5 space-y-4 my-8 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#141312]" />
                <h3 className="font-serif text-sm font-semibold text-[#141312]">
                  Edit Piece & Style Variations
                </h3>
              </div>
              <button
                onClick={() => setEditingGarment(null)}
                className="text-[#948E88] hover:text-[#141312] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateGarment} className="space-y-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-medium uppercase text-[#5C5854] block mb-1">
                    Category
                  </label>
                  <select
                    value={editingGarment.category}
                    onChange={(e) => setEditingGarment({ ...editingGarment, category: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#141312] focus:outline-none focus:border-[#141312] bg-white"
                  >
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
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
                        className="text-[#948E88] hover:text-[#B91C1C] p-1"
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
                    className="px-3 py-1.5 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 shrink-0"
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
                      <img
                        src={imgUrl}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-[#141312]/80 text-[8px] text-white text-center py-0.5 font-medium">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx, true)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                    className="w-16 h-20 rounded-md border border-dashed border-[#948E88] bg-white hover:bg-[#FAF9F6] flex flex-col items-center justify-center text-[#5C5854] hover:text-[#141312] transition-colors p-1 text-center"
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
                    className="px-3 py-1.5 bg-[#141312] text-white text-xs font-medium rounded-md hover:bg-[#2A2725] transition-colors shrink-0"
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
                  className="px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#5C5854] hover:text-[#141312] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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
        </div>
      )}

      {/* Add Garment Modal */}
      {isAddModalOpen && (
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
                className="text-[#948E88] hover:text-[#141312] p-1"
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
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
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
                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-18 rounded-md border border-dashed border-[#948E88] bg-white hover:bg-[#FAF9F6] flex flex-col items-center justify-center text-[#5C5854] hover:text-[#141312] transition-colors p-1 text-center"
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
                    className="px-2.5 py-1 bg-[#141312] text-white text-[11px] font-medium rounded-md hover:bg-[#2A2725] transition-colors"
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
                  className="px-3 py-1.5 border border-[#E8E4DF] rounded-md text-xs text-[#5C5854] hover:text-[#141312] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#141312] hover:bg-[#2A2725] text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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
        </div>
      )}
    </div>
  );
};
