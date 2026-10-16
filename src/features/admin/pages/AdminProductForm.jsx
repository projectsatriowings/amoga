import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  Unlock,
  ShieldCheck,
  Layers,
  Info,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { BackButton } from '../../../components/ui/BackButton';
import { invalidateProductsCache } from '../../../hooks/useProducts';

// Stock imagery imported directly from src/assets/images
import imgFoodSoups from '../../../assets/images/food-soups-hero.jpg';
import imgFoodPantry from '../../../assets/images/gatekeeper-food.jpg';
import imgFoodPodi from '../../../assets/images/food-homepage-ref.jpg';
import imgTeaBluePea from '../../../assets/images/food-teas-hero.jpg';
import imgTeaStandee from '../../../assets/images/tea-standee-ref.jpg';
import imgSareeKanchipuram from '../../../assets/images/saree-kanchipuram.jpg';
import imgSareeBanarasi from '../../../assets/images/saree-banarasi.jpg';
import imgSareeTissue from '../../../assets/images/saree-tissue.jpg';
import imgSareeSoftSilk from '../../../assets/images/saree-soft-silk.jpg';
import imgJewellerySolstice from '../../../assets/images/jewellery-solstice-ring.jpg';
import imgJewelleryLumiere from '../../../assets/images/jewellery-lumiere-necklace.jpg';
import imgJewelleryAurora from '../../../assets/images/jewellery-aurora-ring.jpg';
import imgJewelleryLeaf from '../../../assets/images/jewellery-leaf-ring.jpg';

const PRESET_COLLECTION_IMAGES = {
  food: [
    { label: 'Spiced Moringa Soup', url: imgFoodSoups },
    { label: 'Millet Pantry Mix', url: imgFoodPantry },
    { label: 'Traditional Rice Podi', url: imgFoodPodi },
  ],
  tea: [
    { label: 'Butterfly Blue Pea', url: imgTeaBluePea },
    { label: 'Herbal Botanical Brew', url: imgTeaStandee },
  ],
  sarees: [
    { label: 'Kanchipuram Silk', url: imgSareeKanchipuram },
    { label: 'Banarasi Pure Brocade', url: imgSareeBanarasi },
    { label: 'Tissue Handloom Saree', url: imgSareeTissue },
    { label: 'Soft Silk Drape', url: imgSareeSoftSilk },
  ],
  jewellery: [
    { label: 'Solstice Moonstone Ring', url: imgJewellerySolstice },
    { label: 'Lumiere Sterling Necklace', url: imgJewelleryLumiere },
    { label: 'Aurora Sterling Ring', url: imgJewelleryAurora },
    { label: 'Leaf Motif Sterling Ring', url: imgJewelleryLeaf },
  ],
};

const COLLECTION_SUBCATEGORIES = {
  food: [
    { id: 'soups', name: 'Soup Mixes' },
    { id: 'millets', name: 'Millet Mixes' },
    { id: 'podis', name: 'Rice Podis' },
    { id: 'spices', name: 'Spices & Seasonings' },
    { id: 'oils', name: 'Cold-Pressed Oils' },
    { id: 'snacks', name: 'Traditional Snacks' },
    { id: 'superfoods', name: 'Superfoods' },
    { id: 'honey', name: 'Wild Honey & Preserves' },
  ],
  tea: [
    { id: 'flower', name: 'Botanical Flower Brews' },
    { id: 'leaf', name: 'Medicinal Leaf Brews' },
    { id: 'herbal', name: 'Herbal & Root Brews' },
  ],
  sarees: [
    { id: 'silk', name: 'Silk Sarees' },
    { id: 'traditional', name: 'Traditional Weaves' },
    { id: 'festive', name: 'Festive Collection' },
    { id: 'wedding', name: 'Bridal & Wedding Sarees' },
    { id: 'contemporary', name: 'Contemporary Weaves' },
  ],
  jewellery: [
    { id: 'rings', name: 'Rings' },
    { id: 'necklaces', name: 'Necklaces & Pendants' },
    { id: 'earrings', name: 'Earrings' },
    { id: 'bracelets', name: 'Bracelets & Cuffs' },
    { id: 'traditional', name: 'Traditional Silver' },
  ],
};

const CATEGORY_HSN_SUGGESTIONS = {
  sarees: [
    { code: '5007', label: 'Silk Sarees (5007)' },
    { code: '5208', label: 'Cotton Weaves (5208)' },
  ],
  tea: [
    { code: '0902', label: 'Teas & Herbal Brews (0902)' },
    { code: '2106', label: 'Nutraceuticals (2106)' },
  ],
  soups: [{ code: '2104', label: 'Soup Mixes (2104)' }],
  millets: [{ code: '1008', label: 'Millets (1008)' }],
  podis: [{ code: '2103', label: 'Rice Podis & Seasonings (2103)' }],
  spices: [{ code: '0910', label: 'Masalas & Spices (0910)' }],
  jewellery: [{ code: '7113', label: 'Silver Jewellery (7113)' }],
};

export function AdminProductForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { adminFetch } = useAdminStore();

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState(null);
  const [imageError, setImageError] = useState(false);

  // SKU state
  const [skuLoading, setSkuLoading] = useState(false);
  const [isSkuLocked, setIsSkuLocked] = useState(true);
  const [skuValidationMsg, setSkuValidationMsg] = useState(null);

  // Section toggle state
  const [showAdditionalSpecs, setShowAdditionalSpecs] = useState(false);
  const [showTaxSection, setShowTaxSection] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);

  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    collectionId: 'food',
    category: 'soups',
    categoryName: 'Soup Mixes',
    sku: '',
    description: '',
    image: '',
    gallery: [],
    status: 'draft', // 'draft' | 'active' | 'archived'

    // Pricing & Inventory
    price: '',
    originalPrice: '',
    stockQuantity: 25,
    lowStockThreshold: 5,
    inStock: true,
    isFeatured: false,
    badge: '',

    // Category-specific fields stored in specs
    packSize: '',
    specs: {},

    // Tax & Compliance
    hsnCode: '2104',
    gstRate: '5.00',
    isTaxInclusive: true,
    cessRate: '0.00',
    taxClassification: 'GOODS',

    // Variants
    variants: [],
  });

  // Load collections and product data if editing
  useEffect(() => {
    async function loadInitialData() {
      try {
        const colRes = await adminFetch('/api/admin/collections');
        const colJson = await colRes.json();
        if (colJson.collections) {
          setCollections(colJson.collections);
        }

        if (isEditing) {
          const prodRes = await adminFetch(`/api/admin/products/${id}`);
          const prodJson = await prodRes.json();
          if (!prodRes.ok) throw new Error(prodJson.message || 'Product not found');

          const p = prodJson.product;
          const targetCollection = p.collectionId || 'food';
          const defaultSubcat = COLLECTION_SUBCATEGORIES[targetCollection]?.[0]?.id || '';
          const defaultSubcatName = COLLECTION_SUBCATEGORIES[targetCollection]?.[0]?.name || '';
          const initialCategory = p.category || defaultSubcat;
          const matchedSub = COLLECTION_SUBCATEGORIES[targetCollection]?.find((s) => s.id === initialCategory);

          const existingVariants = Array.isArray(p.variants) ? p.variants : [];
          setHasVariants(existingVariants.length > 0);

          setFormData({
            name: p.name || '',
            collectionId: targetCollection,
            category: initialCategory,
            categoryName: p.categoryName || (matchedSub ? matchedSub.name : defaultSubcatName),
            sku: p.sku || '',
            description: p.description || '',
            image: p.image || '',
            gallery: Array.isArray(p.gallery) ? p.gallery : [],
            status: p.isActive ? 'active' : 'draft',
            price: p.price !== null && p.price !== undefined ? String(p.price) : '',
            originalPrice: p.originalPrice !== null && p.originalPrice !== undefined ? String(p.originalPrice) : '',
            stockQuantity: p.stockQuantity ?? 25,
            lowStockThreshold: p.lowStockThreshold ?? 5,
            inStock: Boolean(p.inStock),
            isFeatured: Boolean(p.isFeatured),
            badge: p.badge || '',
            packSize: p.packSize || '',
            specs: p.specs || {},
            hsnCode: p.hsnCode || '',
            gstRate: p.gstRate !== null && p.gstRate !== undefined ? String(p.gstRate) : '5.00',
            isTaxInclusive: p.isTaxInclusive !== undefined ? Boolean(p.isTaxInclusive) : true,
            cessRate: p.cessRate !== null && p.cessRate !== undefined ? String(p.cessRate) : '0.00',
            taxClassification: p.taxClassification || 'GOODS',
            variants: existingVariants.map((v) => ({
              id: v.id,
              name: v.name || '',
              sku: v.sku || '',
              price: v.price !== null && v.price !== undefined ? String(v.price) : '',
              stockQuantity: v.stockQuantity ?? 25,
              inStock: v.inStock !== undefined ? Boolean(v.inStock) : true,
            })),
          });

          // If product had custom SKU, allow user to keep it or edit
          if (p.sku) setIsSkuLocked(true);
        } else {
          // New product preview SKU
          fetchSkuPreview('food', 'soups');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [id, isEditing]);

  // Fetch SKU preview for collection/category
  const fetchSkuPreview = async (colId, catId) => {
    try {
      setSkuLoading(true);
      const res = await adminFetch(
        `/api/admin/products/sku/generate?collectionId=${colId}&category=${encodeURIComponent(catId || '')}`
      );
      const data = await res.json();
      if (res.ok && data.preview) {
        setFormData((prev) => ({
          ...prev,
          sku: prev.sku || data.preview,
        }));
      }
    } catch {
      // Non-blocking preview failure
    } finally {
      setSkuLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: null }));

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Collection changes update categories & default HSN suggestions
      if (name === 'collectionId') {
        const available = COLLECTION_SUBCATEGORIES[value] || [];
        const nextCat = available.length > 0 ? available[0].id : '';
        const nextCatName = available.length > 0 ? available[0].name : '';
        updated.category = nextCat;
        updated.categoryName = nextCatName;

        // Auto-update suggested HSN code if not explicitly changed
        if (CATEGORY_HSN_SUGGESTIONS[value]?.[0]?.code) {
          updated.hsnCode = CATEGORY_HSN_SUGGESTIONS[value][0].code;
        }

        // Fetch fresh SKU preview for new collection
        fetchSkuPreview(value, nextCat);
      }

      return updated;
    });
  };

  const handleSubcategoryChange = (e) => {
    const selectedId = e.target.value;
    const available = COLLECTION_SUBCATEGORIES[formData.collectionId] || [];
    const matched = available.find((sub) => sub.id === selectedId);
    setFormData((prev) => ({
      ...prev,
      category: selectedId,
      categoryName: matched ? matched.name : selectedId,
    }));
    fetchSkuPreview(formData.collectionId, selectedId);
  };

  const handleSpecChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      specs: {
        ...prev.specs,
        [key]: value,
      },
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setFormData((prev) => ({ ...prev, image: loadEvt.target.result }));
          setImageError(false);
          setFieldErrors((prev) => ({ ...prev, image: null }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleValidateSku = async () => {
    if (!formData.sku?.trim()) return;
    try {
      setSkuLoading(true);
      setSkuValidationMsg(null);
      const res = await adminFetch('/api/admin/products/sku/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: formData.sku.trim(),
          productId: id || null,
        }),
      });
      const data = await res.json();
      if (data.isValid) {
        setSkuValidationMsg({
          type: 'success',
          text: `SKU "${data.cleanSku}" is unique and valid!`,
        });
      } else {
        setSkuValidationMsg({
          type: 'error',
          text: data.message || 'SKU is already in use or invalid',
        });
      }
    } catch (err) {
      setSkuValidationMsg({ type: 'error', text: err.message });
    } finally {
      setSkuLoading(false);
    }
  };

  // Variants handlers
  const handleAddVariant = () => {
    const parentSku = formData.sku?.trim() || `AMOGA-${(formData.collectionId || 'PRD').substring(0, 3).toUpperCase()}001`;
    const vIndex = formData.variants.length + 1;
    const suggestedSku = `${parentSku}-V${String(vIndex).padStart(2, '0')}`;

    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: '',
          sku: suggestedSku,
          price: prev.price || '',
          stockQuantity: 25,
          inStock: true,
        },
      ],
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  const handleRemoveVariant = (index) => {
    setFormData((prev) => {
      const updated = prev.variants.filter((_, i) => i !== index);
      if (updated.length === 0) setHasVariants(false);
      return { ...prev, variants: updated };
    });
  };

  // Validation before submission
  const validateForm = (targetStatus) => {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = 'Product name is required';
    }

    if (!formData.collectionId) {
      errors.collectionId = 'Collection is required';
    }

    // If attempting to publish as Active, enforce price & tax requirements
    if (targetStatus === 'active') {
      const priceNum = Number(formData.price);
      if (!formData.price || isNaN(priceNum) || priceNum <= 0) {
        errors.price = 'A valid selling price (> 0) is required for active sale';
      }

      if (!formData.hsnCode?.trim()) {
        errors.hsnCode = 'HSN Code is required for live tax compliance';
      }

      if (formData.gstRate === '' || formData.gstRate === null || isNaN(Number(formData.gstRate))) {
        errors.gstRate = 'GST rate is required for live tax compliance';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (targetStatus) => {
    setError(null);
    setSuccessMsg(null);

    if (!validateForm(targetStatus)) {
      setError(
        targetStatus === 'active'
          ? 'Please correct the highlighted fields before publishing live.'
          : 'Please enter a product name and collection.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        collectionId: formData.collectionId,
        category: formData.category || formData.collectionId,
        categoryName: formData.categoryName || formData.category,
        description: formData.description?.trim() || '',
        price: formData.price !== '' ? Number(formData.price) : null,
        originalPrice: formData.originalPrice !== '' ? Number(formData.originalPrice) : null,
        stockQuantity: Number(formData.stockQuantity) || 0,
        lowStockThreshold: Number(formData.lowStockThreshold) || 5,
        inStock: Boolean(formData.inStock),
        isFeatured: Boolean(formData.isFeatured),
        badge: formData.badge || null,
        packSize: formData.packSize || null,
        image: formData.image?.trim() || '/placeholder-luxury.jpg',
        gallery: formData.gallery,
        specs: formData.specs,
        sku: formData.sku?.trim() || null,
        hsnCode: formData.hsnCode?.trim() || null,
        gstRate: formData.gstRate !== '' && formData.gstRate !== null ? Number(formData.gstRate) : null,
        isTaxInclusive: Boolean(formData.isTaxInclusive),
        cessRate: formData.cessRate !== '' && formData.cessRate !== null ? Number(formData.cessRate) : 0,
        taxClassification: formData.taxClassification || 'GOODS',
        isActive: targetStatus === 'active',
        status: targetStatus,
        variants: hasVariants
          ? formData.variants.map((v) => ({
              ...(v.id ? { id: v.id } : {}),
              name: v.name.trim(),
              sku: v.sku?.trim() || null,
              price: v.price !== '' ? Number(v.price) : null,
              stockQuantity: Number(v.stockQuantity) || 0,
              inStock: Boolean(v.inStock),
            }))
          : [],
      };

      const endpoint = isEditing ? `/api/admin/products/${id}` : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await adminFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save product');

      invalidateProductsCache(payload.collectionId);

      setSuccessMsg(
        isEditing
          ? `Product "${payload.name}" updated successfully as ${targetStatus.toUpperCase()}!`
          : `Product "${payload.name}" created successfully as ${targetStatus.toUpperCase()}!`
      );

      setTimeout(() => {
        navigate('/admin/products');
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <div className="w-8 h-8 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[#7A7167]">Loading product data...</span>
      </div>
    );
  }

  const availableSubcategories = COLLECTION_SUBCATEGORIES[formData.collectionId] || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Navigation & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <BackButton
          collection="admin"
          fallbackTo="/admin/products"
          label="Back to Products"
        />
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
              formData.status === 'active'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : formData.status === 'archived'
                ? 'bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {formData.status === 'active' ? '● Active (Live on Store)' : formData.status === 'archived' ? '● Archived' : '○ Draft'}
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="border-b border-[#E5E0D5] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">
            {isEditing ? `Edit: ${formData.name || 'Product'}` : 'Create Product'}
          </h1>
          <p className="text-xs text-[#7A7167] mt-0.5">
            Quick, streamlined entry for Wholesome Pantry, Wellness Tea, Heritage Sarees, and Silver Jewellery.
          </p>
        </div>

        {/* Quick Actions Header */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave('draft')}
            className="px-3.5 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs font-medium text-[#4A423B] hover:bg-[#F4F1EA] transition-colors cursor-pointer"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave('active')}
            className="px-4 py-1.5 bg-[#722F37] hover:bg-[#5E2229] text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Save & Publish
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-0.5">
            <span className="font-semibold">Unable to Save Product</span>
            <p className="text-[11px] text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* ================= SECTION A: BASIC INFORMATION ================= */}
        <div className="bg-[#FBF9F5] p-5 sm:p-6 rounded-lg border border-[#E5E0D5] space-y-4">
          <h2 className="font-serif text-sm font-bold text-[#1A1817] uppercase tracking-wider border-b border-[#EAE4D9] pb-2">
            A. Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                Product Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Traditional Idli Podi, Nilgiri Blue Pea Tea, Kanchipuram Gold Silk"
                className={`w-full px-3 py-2 bg-white border rounded text-xs text-[#1A1817] outline-none ${
                  fieldErrors.name ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-[#D5CEC2] focus:border-[#722F37]'
                }`}
              />
              {fieldErrors.name && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* Collection */}
            <div>
              <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                Collection <span className="text-rose-600">*</span>
              </label>
              <select
                name="collectionId"
                value={formData.collectionId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
              >
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                Category <span className="text-rose-600">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleSubcategoryChange}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
              >
                {availableSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SKU (Auto-generated by default, unlocked only on demand) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#4A423B]">
                  Product SKU
                </label>
                <button
                  type="button"
                  onClick={() => setIsSkuLocked(!isSkuLocked)}
                  className="inline-flex items-center gap-1 text-[10px] text-[#722F37] hover:underline cursor-pointer"
                >
                  {isSkuLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  <span>{isSkuLocked ? 'Edit Custom SKU' : 'Lock Auto-SKU'}</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku || ''}
                  onChange={handleInputChange}
                  disabled={isSkuLocked}
                  placeholder="Auto-generated on save"
                  className={`w-full px-3 py-2 border rounded text-xs font-mono uppercase outline-none ${
                    isSkuLocked
                      ? 'bg-[#F4F1EA] text-[#6B6358] border-[#E0D9CE] cursor-not-allowed'
                      : 'bg-white text-[#1A1817] border-[#D5CEC2] focus:border-[#722F37]'
                  }`}
                />
                {!isSkuLocked && formData.sku && (
                  <button
                    type="button"
                    onClick={handleValidateSku}
                    disabled={skuLoading}
                    className="px-2.5 py-2 bg-white border border-[#D5CEC2] text-[11px] font-medium text-[#4A423B] rounded hover:bg-[#F0ECE1] shrink-0 cursor-pointer"
                  >
                    Check
                  </button>
                )}
              </div>
              {skuValidationMsg && (
                <p className={`text-[10px] mt-1 ${skuValidationMsg.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {skuValidationMsg.text}
                </p>
              )}
              <p className="text-[10px] text-[#8C8377] mt-0.5">
                {isSkuLocked ? 'Generated automatically from category sequence.' : 'Enter custom alphanumeric SKU (3-40 chars).'}
              </p>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                Product Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
              >
                <option value="draft">Draft (Private, not purchasable)</option>
                <option value="active">Active (Visible & Purchasable)</option>
                <option value="archived">Archived (Retired from store)</option>
              </select>
              <p className="text-[10px] text-[#8C8377] mt-0.5">
                Draft products can be saved without prices or tax details.
              </p>
            </div>

            {/* Description (Optional) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                Product Description <span className="text-[#8C8377] font-normal">(Optional)</span>
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief summary of artisanal craft, taste notes, provenance, or drape..."
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
              />
            </div>

            {/* Product Image */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                Product Image
              </label>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={(e) => {
                    handleInputChange(e);
                    setImageError(false);
                  }}
                  placeholder="Paste image URL (https://... or /images/...)"
                  className="flex-1 px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#1E1916] hover:bg-[#342D28] text-white rounded text-xs font-medium transition-colors shrink-0 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              </div>

              {/* Image Preview & Presets */}
              <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                {/* Presets */}
                {PRESET_COLLECTION_IMAGES[formData.collectionId] && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-[#8C6320] font-semibold">Presets:</span>
                    {PRESET_COLLECTION_IMAGES[formData.collectionId].map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => {
                          setFormData((p) => ({ ...p, image: preset.url }));
                          setImageError(false);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          formData.image === preset.url
                            ? 'bg-[#722F37] text-white border-[#722F37]'
                            : 'bg-white hover:bg-[#F4F1EA] text-[#4A423B] border-[#D5CEC2]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Compact Thumbnail Preview */}
                {formData.image && (
                  <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded border border-[#E0D9CE] self-end sm:self-auto">
                    <img
                      src={formData.image}
                      alt="Thumbnail"
                      onLoad={() => setImageError(false)}
                      onError={() => setImageError(true)}
                      className="w-6 h-6 object-cover rounded"
                    />
                    <span className="text-[10px] text-[#4A423B] truncate max-w-[140px]">
                      {imageError ? 'Invalid image' : 'Image loaded'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, image: '' }))}
                      className="text-[#8C8377] hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION B: PRICING & INVENTORY ================= */}
        <div className="bg-[#FBF9F5] p-5 sm:p-6 rounded-lg border border-[#E5E0D5] space-y-4">
          <h2 className="font-serif text-sm font-bold text-[#1A1817] uppercase tracking-wider border-b border-[#EAE4D9] pb-2">
            B. Pricing & Inventory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                Selling Price (₹) {formData.status === 'active' && <span className="text-rose-600">*</span>}
              </label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="e.g. 1850"
                className={`w-full px-3 py-2 bg-white border rounded text-xs font-mono text-[#1A1817] outline-none ${
                  fieldErrors.price ? 'border-rose-400 bg-rose-50/20' : 'border-[#D5CEC2] focus:border-[#722F37]'
                }`}
              />
              {fieldErrors.price ? (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.price}</p>
              ) : (
                <p className="text-[10px] text-[#8C8377] mt-1">Retail selling price in INR</p>
              )}
            </div>

            {/* Compare-at Price */}
            <div>
              <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                Compare-at Price (₹)
              </label>
              <input
                type="number"
                name="originalPrice"
                min="0"
                step="0.01"
                value={formData.originalPrice}
                onChange={handleInputChange}
                placeholder="e.g. 2400"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs font-mono text-[#1A1817] focus:border-[#722F37] outline-none"
              />
              <p className="text-[10px] text-[#8C8377] mt-1">Strikethrough MRP for discounts</p>
            </div>

            {/* Initial Stock Quantity */}
            <div>
              <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                Stock Quantity (Units)
              </label>
              <input
                type="number"
                name="stockQuantity"
                min="0"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs font-mono text-[#1A1817] focus:border-[#722F37] outline-none"
              />
              <p className="text-[10px] text-[#8C8377] mt-1">On-hand physical stock</p>
            </div>

            {/* Low Stock Threshold */}
            <div>
              <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                Low Stock Alert At
              </label>
              <input
                type="number"
                name="lowStockThreshold"
                min="0"
                value={formData.lowStockThreshold}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs font-mono text-[#1A1817] focus:border-[#722F37] outline-none"
              />
              <p className="text-[10px] text-[#8C8377] mt-1">Triggers restock notification</p>
            </div>
          </div>

          {/* Inventory & Display Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-[#EAE4D9]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="inStock"
                checked={formData.inStock}
                onChange={handleInputChange}
                className="rounded border-[#D5CEC2] text-[#722F37] focus:ring-[#722F37]"
              />
              <span className="text-xs font-medium text-[#1A1817]">Available / In Stock for Purchase</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleInputChange}
                className="rounded border-[#D5CEC2] text-[#722F37] focus:ring-[#722F37]"
              />
              <span className="text-xs font-medium text-[#1A1817]">Feature on Storefront Homepage</span>
            </label>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-[#4A423B]">Badge:</span>
              <input
                type="text"
                name="badge"
                value={formData.badge}
                onChange={handleInputChange}
                placeholder="e.g. Artisanal, Bestseller"
                className="px-2 py-1 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] w-32"
              />
            </div>
          </div>
        </div>

        {/* ================= SECTION C: PRODUCT-SPECIFIC DETAILS ================= */}
        <div className="bg-[#FBF9F5] p-5 sm:p-6 rounded-lg border border-[#E5E0D5] space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-2">
            <h2 className="font-serif text-sm font-bold text-[#1A1817] uppercase tracking-wider">
              C. Product-Specific Details ({collections.find((c) => c.id === formData.collectionId)?.name || formData.collectionId})
            </h2>
            <span className="text-[10px] font-mono text-[#8C6320]">Contextual Fields</span>
          </div>

          {/* WHOLESOME PANTRY FIELDS */}
          {formData.collectionId === 'food' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Pack Size / Net Weight</label>
                <input
                  type="text"
                  value={formData.packSize || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, packSize: e.target.value }))}
                  placeholder="e.g. 250g Jar, 500g Pouch"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Shelf Life</label>
                <input
                  type="text"
                  value={formData.specs?.shelfLife || ''}
                  onChange={(e) => handleSpecChange('shelfLife', e.target.value)}
                  placeholder="e.g. 12 Months from packaging"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Storage Instructions</label>
                <input
                  type="text"
                  value={formData.specs?.storage || ''}
                  onChange={(e) => handleSpecChange('storage', e.target.value)}
                  placeholder="e.g. Store in an airtight container away from direct sunlight"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Dietary & Allergen Details</label>
                <input
                  type="text"
                  value={formData.specs?.dietary || ''}
                  onChange={(e) => handleSpecChange('dietary', e.target.value)}
                  placeholder="e.g. 100% Vegan, Gluten-Free, No Added Preservatives"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Ingredients</label>
                <textarea
                  rows={2}
                  value={formData.specs?.ingredients || ''}
                  onChange={(e) => handleSpecChange('ingredients', e.target.value)}
                  placeholder="e.g. Organic Moringa Leaves, Cumin, Black Pepper, Himalayan Pink Salt..."
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
            </div>
          )}

          {/* WELLNESS TEA FIELDS */}
          {formData.collectionId === 'tea' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Tea Form / Type</label>
                <input
                  type="text"
                  value={formData.specs?.teaForm || ''}
                  onChange={(e) => handleSpecChange('teaForm', e.target.value)}
                  placeholder="e.g. Whole Dried Calyces, Loose Herbal Leaf"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Net Weight</label>
                <input
                  type="text"
                  value={formData.packSize || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, packSize: e.target.value }))}
                  placeholder="e.g. 50g Glass Jar (25 Servings)"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Brewing Instructions</label>
                <input
                  type="text"
                  value={formData.specs?.steepTime || ''}
                  onChange={(e) => handleSpecChange('steepTime', e.target.value)}
                  placeholder="e.g. 1-2 tsp in 90°C water for 4-5 mins"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Shelf Life & Storage</label>
                <input
                  type="text"
                  value={formData.specs?.storage || ''}
                  onChange={(e) => handleSpecChange('storage', e.target.value)}
                  placeholder="e.g. 18 Months; keep airtight in a cool dry space"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Botanical Ingredients</label>
                <textarea
                  rows={2}
                  value={formData.specs?.ingredients || ''}
                  onChange={(e) => handleSpecChange('ingredients', e.target.value)}
                  placeholder="e.g. 100% Sun-Dried Clitoria Ternatea (Butterfly Blue Pea Flowers), Dried Lemongrass"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
            </div>
          )}

          {/* HERITAGE SAREES FIELDS */}
          {formData.collectionId === 'sarees' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Silk Fabric Type</label>
                <input
                  type="text"
                  value={formData.specs?.fabric || ''}
                  onChange={(e) => handleSpecChange('fabric', e.target.value)}
                  placeholder="e.g. Pure Mulberry Kanchipuram Silk, Katan Silk"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Saree Length</label>
                <input
                  type="text"
                  value={formData.specs?.sareeLength || ''}
                  onChange={(e) => handleSpecChange('sareeLength', e.target.value)}
                  placeholder="e.g. 6.3m (including 80cm blouse piece)"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Blouse Piece Included?</label>
                <input
                  type="text"
                  value={formData.specs?.blousePiece || ''}
                  onChange={(e) => handleSpecChange('blousePiece', e.target.value)}
                  placeholder="e.g. Yes (Contrast Silk with matching border)"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Primary Colour & Zari</label>
                <input
                  type="text"
                  value={formData.specs?.primaryColor || ''}
                  onChange={(e) => handleSpecChange('primaryColor', e.target.value)}
                  placeholder="e.g. Royal Wine & Tested Gold Zari"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Weave Technique</label>
                <input
                  type="text"
                  value={formData.specs?.weave || ''}
                  onChange={(e) => handleSpecChange('weave', e.target.value)}
                  placeholder="e.g. Korvai Interlocking Weave, Kadwa Motifs"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Care Instructions</label>
                <input
                  type="text"
                  value={formData.specs?.careInstructions || ''}
                  onChange={(e) => handleSpecChange('careInstructions', e.target.value)}
                  placeholder="e.g. Strictly Dry Clean Only. Store in muslin wrap."
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
            </div>
          )}

          {/* SILVER JEWELLERY FIELDS */}
          {formData.collectionId === 'jewellery' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Jewellery Type</label>
                <input
                  type="text"
                  value={formData.specs?.jewelType || ''}
                  onChange={(e) => handleSpecChange('jewelType', e.target.value)}
                  placeholder="e.g. Statement Ring, Pendant Necklace, Cuff"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Metal & Purity</label>
                <input
                  type="text"
                  value={formData.specs?.metal || '925 Sterling Silver'}
                  onChange={(e) => handleSpecChange('metal', e.target.value)}
                  placeholder="e.g. 925 Sterling Silver (BIS Hallmarked)"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Gross Weight (grams)</label>
                <input
                  type="text"
                  value={formData.specs?.weight || ''}
                  onChange={(e) => handleSpecChange('weight', e.target.value)}
                  placeholder="e.g. 6.4 g"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Dimensions / Size</label>
                <input
                  type="text"
                  value={formData.specs?.dimensions || ''}
                  onChange={(e) => handleSpecChange('dimensions', e.target.value)}
                  placeholder="e.g. US 7 / 18-inch chain / 12mm motif"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Plating & Finish</label>
                <input
                  type="text"
                  value={formData.specs?.plating || ''}
                  onChange={(e) => handleSpecChange('plating', e.target.value)}
                  placeholder="e.g. Anti-Tarnish Rhodium Plating"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Care Instructions</label>
                <input
                  type="text"
                  value={formData.specs?.careInstructions || ''}
                  onChange={(e) => handleSpecChange('careInstructions', e.target.value)}
                  placeholder="e.g. Store in provided airtight pouch away from perfumes"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
            </div>
          )}

          {/* Expandable Additional Details */}
          <div className="pt-2 border-t border-[#EAE4D9]">
            <button
              type="button"
              onClick={() => setShowAdditionalSpecs(!showAdditionalSpecs)}
              className="inline-flex items-center gap-1.5 text-xs text-[#722F37] font-medium hover:underline cursor-pointer"
            >
              {showAdditionalSpecs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showAdditionalSpecs ? 'Hide Extra Details' : 'Show Additional Craft & Provenance Details'}</span>
            </button>

            {showAdditionalSpecs && (
              <div className="mt-3 p-4 bg-white/70 rounded-lg border border-[#EAE4D9] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#4A423B] mb-1">Origin / Farm Source</label>
                  <input
                    type="text"
                    value={formData.specs?.origin || ''}
                    onChange={(e) => handleSpecChange('origin', e.target.value)}
                    placeholder="e.g. Kanchipuram, Tamil Nadu / Pampore, Kashmir"
                    className="w-full px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#4A423B] mb-1">Certification / Mark</label>
                  <input
                    type="text"
                    value={formData.specs?.authenticity || ''}
                    onChange={(e) => handleSpecChange('authenticity', e.target.value)}
                    placeholder="e.g. Silk Mark Certified, FSSAI Lic, BIS 925"
                    className="w-full px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= SECTION D: TAX & COMPLIANCE ================= */}
        <div className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden">
          {/* Collapsible Header */}
          <button
            type="button"
            onClick={() => setShowTaxSection(!showTaxSection)}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#F6F2EA] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#722F37]" />
              <div>
                <h2 className="font-serif text-sm font-bold text-[#1A1817] uppercase tracking-wider">
                  D. Tax & Compliance (HSN & GST)
                </h2>
                <p className="text-[11px] text-[#7A7167]">
                  HSN: {formData.hsnCode || 'Not set'} | GST: {formData.gstRate || 0}% | {formData.isTaxInclusive ? 'Inclusive' : 'Exclusive'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[#7A7167]">
              <span className="text-[11px] font-mono">{showTaxSection ? 'Collapse' : 'Configure'}</span>
              {showTaxSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showTaxSection && (
            <div className="p-5 sm:p-6 border-t border-[#EAE4D9] space-y-4 bg-white/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* HSN Code */}
                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                    HSN Code {formData.status === 'active' && <span className="text-rose-600">*</span>}
                  </label>
                  <input
                    type="text"
                    name="hsnCode"
                    value={formData.hsnCode || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. 5007"
                    maxLength={8}
                    className={`w-full px-3 py-2 bg-white border rounded text-xs font-mono text-[#1A1817] outline-none ${
                      fieldErrors.hsnCode ? 'border-rose-400 bg-rose-50/20' : 'border-[#D5CEC2] focus:border-[#722F37]'
                    }`}
                  />
                  {fieldErrors.hsnCode && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.hsnCode}</p>
                  )}
                </div>

                {/* GST Rate */}
                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                    GST Rate (%) {formData.status === 'active' && <span className="text-rose-600">*</span>}
                  </label>
                  <select
                    name="gstRate"
                    value={formData.gstRate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
                  >
                    <option value="0.00">0% (Nil / Exempt)</option>
                    <option value="3.00">3% (Silver & Jewellery)</option>
                    <option value="5.00">5% (Sarees, Teas, Basic Food)</option>
                    <option value="12.00">12% (Food Mixes, Soups)</option>
                    <option value="18.00">18% (Standard Rate)</option>
                    <option value="28.00">28% (Luxury items)</option>
                  </select>
                </div>

                {/* Price Includes GST */}
                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                    Price Includes GST
                  </label>
                  <select
                    name="isTaxInclusive"
                    value={formData.isTaxInclusive ? 'true' : 'false'}
                    onChange={(e) => setFormData((p) => ({ ...p, isTaxInclusive: e.target.value === 'true' }))}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
                  >
                    <option value="true">Yes (Tax-Inclusive)</option>
                    <option value="false">No (Tax-Exclusive)</option>
                  </select>
                </div>

                {/* Compensation Cess */}
                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                    Compensation Cess (%)
                  </label>
                  <input
                    type="number"
                    name="cessRate"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.cessRate}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs font-mono text-[#1A1817] focus:border-[#722F37] outline-none"
                  />
                </div>
              </div>

              {/* HSN quick presets for current collection */}
              {(CATEGORY_HSN_SUGGESTIONS[formData.category] || CATEGORY_HSN_SUGGESTIONS[formData.collectionId]) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                  <span className="text-[10px] text-[#7A7167]">Suggested HSN:</span>
                  {(CATEGORY_HSN_SUGGESTIONS[formData.category] || CATEGORY_HSN_SUGGESTIONS[formData.collectionId] || []).map((sug) => (
                    <button
                      key={sug.code}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, hsnCode: sug.code }))}
                      className={`px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${
                        formData.hsnCode === sug.code
                          ? 'bg-[#722F37] text-white border-[#722F37]'
                          : 'bg-white text-[#4A423B] border-[#D5CEC2] hover:bg-[#F0ECE1]'
                      }`}
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= SECTION E: VARIANTS ================= */}
        <div className="bg-[#FBF9F5] p-5 sm:p-6 rounded-lg border border-[#E5E0D5] space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-2">
            <div>
              <h2 className="font-serif text-sm font-bold text-[#1A1817] uppercase tracking-wider">
                E. Product Variants (Optional)
              </h2>
              <p className="text-[11px] text-[#7A7167]">
                Only needed if this item has multiple sizes, pack weights, or colours.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setHasVariants(checked);
                  if (checked && formData.variants.length === 0) {
                    handleAddVariant();
                  }
                }}
                className="rounded border-[#D5CEC2] text-[#722F37] focus:ring-[#722F37]"
              />
              <span className="text-xs font-medium text-[#1A1817]">Enable Variants</span>
            </label>
          </div>

          {hasVariants ? (
            <div className="space-y-3">
              {formData.variants.map((v, idx) => (
                <div key={idx} className="p-3 bg-white rounded border border-[#E5E0D5] grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-[#4A423B] uppercase mb-0.5">
                      Variant Name / Option
                    </label>
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                      placeholder="e.g. US 7, 100g Jar, Crimson Red"
                      className="w-full px-2.5 py-1.5 border border-[#D5CEC2] rounded text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#4A423B] uppercase mb-0.5">
                      Variant SKU
                    </label>
                    <input
                      type="text"
                      value={v.sku || ''}
                      onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                      placeholder="Auto SKU"
                      className="w-full px-2.5 py-1.5 border border-[#D5CEC2] rounded text-xs font-mono uppercase bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#4A423B] uppercase mb-0.5">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                      placeholder={formData.price || 'Same as base'}
                      className="w-full px-2.5 py-1.5 border border-[#D5CEC2] rounded text-xs font-mono bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#4A423B] uppercase mb-0.5">
                        Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={v.stockQuantity}
                        onChange={(e) => handleVariantChange(idx, 'stockQuantity', e.target.value)}
                        className="w-16 px-2 py-1.5 border border-[#D5CEC2] rounded text-xs font-mono bg-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 cursor-pointer mt-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D5CEC2] text-[#4A423B] rounded text-xs font-medium hover:bg-[#F4F1EA] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Variant</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-[#8C8377] italic py-1">
              Currently sold as a single standard product. Check "Enable Variants" if this product comes in multiple options.
            </p>
          )}
        </div>

        {/* ================= BOTTOM ACTION BAR ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E5E0D5]">
          <Link
            to="/admin/products"
            className="text-xs font-medium text-[#7A7167] hover:text-[#1A1817] hover:underline"
          >
            Cancel and Return to Catalogue
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave('draft')}
              className="px-4 py-2 bg-white border border-[#D5CEC2] text-[#4A423B] text-xs font-medium rounded hover:bg-[#F4F1EA] disabled:opacity-50 transition-colors cursor-pointer"
            >
              Save as Draft
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave('active')}
              className="inline-flex items-center gap-2 px-6 py-2 bg-[#722F37] text-white text-xs font-semibold rounded shadow-xs hover:bg-[#5E2229] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : isEditing ? 'Update & Publish' : 'Save & Publish Product'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
