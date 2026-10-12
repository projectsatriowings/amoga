import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Palette,
  Tag,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { BackButton } from '../../../components/ui/BackButton';

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

const COMMON_COLOR_PRESETS = [
  { name: 'Royal Wine', hex: '#451523' },
  { name: 'Temple Crimson', hex: '#7A1C28' },
  { name: 'Peacock Indigo', hex: '#1C3A4B' },
  { name: 'Antique Gold', hex: '#C5A46D' },
  { name: 'Forest Emerald', hex: '#1E4620' },
  { name: 'Rose Gold', hex: '#B76E79' },
  { name: 'Sterling Silver', hex: '#B9B8B5' },
  { name: 'Midnight Jet', hex: '#1A1817' },
];

const COMMON_SIZE_PRESETS = [
  'US 5',
  'US 6',
  'US 7',
  'US 8',
  'US 9',
  'Standard (6.3m)',
  'With Stitched Blouse',
];

const COMMON_WEIGHT_PRESETS = [
  '50 g',
  '100 g',
  '200 g',
  '250 g',
  '500 g',
  '1 kg',
  'Pack of 2',
];

export function AdminProductForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { adminFetch } = useAdminStore();

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    collectionId: 'food',
    category: 'soups',
    categoryName: 'Soup Mixes',
    price: '',
    originalPrice: '',
    stockQuantity: 50,
    inStock: true,
    isFeatured: false,
    badge: '',
    packSize: '',
    description: '',
    image: '',
    gallery: [],
    // Category Specific Specs
    specs: {},
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

          setFormData({
            name: p.name || '',
            slug: p.slug || '',
            collectionId: targetCollection,
            category: initialCategory,
            categoryName: p.categoryName || (matchedSub ? matchedSub.name : defaultSubcatName),
            price: p.price !== null ? String(p.price) : '',
            originalPrice: p.originalPrice !== null ? String(p.originalPrice) : '',
            stockQuantity: p.stockQuantity ?? 50,
            inStock: Boolean(p.inStock),
            isFeatured: Boolean(p.isFeatured),
            badge: p.badge || '',
            packSize: p.packSize || '',
            description: p.description || '',
            image: p.image || '',
            gallery: Array.isArray(p.gallery) ? p.gallery : [],
            specs: p.specs || {},
            variants: Array.isArray(p.variants)
              ? p.variants.map((v) => {
                  const attrs = typeof v.attributes === 'object' && v.attributes !== null ? v.attributes : {};
                  const hexVal = v.hex || attrs.hex || '';
                  const sizeVal = attrs.size || '';
                  const weightVal = attrs.weight || '';
                  const detectedType = attrs.type || (hexVal ? 'color' : sizeVal ? 'size' : weightVal ? 'weight' : 'custom');
                  return {
                    id: v.id,
                    name: v.name || '',
                    sku: v.sku || '',
                    type: detectedType,
                    hex: hexVal || (detectedType === 'color' ? '#451523' : ''),
                    size: sizeVal,
                    weight: weightVal,
                    price: v.price !== null ? String(v.price) : '',
                    stockQuantity: v.stockQuantity ?? 25,
                    inStock: v.inStock !== undefined ? Boolean(v.inStock) : true,
                  };
                })
              : [],
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [id, isEditing]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Auto-generate clean URL slug from product name in the background
      if (name === 'name') {
        const autoSlug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        // On new product creation or if previous slug matched previous name slug, auto-update
        const prevAutoSlug = prev.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        if (!isEditing || !prev.slug || prev.slug === prevAutoSlug) {
          updated.slug = autoSlug;
        }
      }

      // When collection changes, dynamically update subcategory dropdown to that collection
      if (name === 'collectionId') {
        const available = COLLECTION_SUBCATEGORIES[value] || [];
        if (available.length > 0) {
          updated.category = available[0].id;
          updated.categoryName = available[0].name;
        } else {
          updated.category = '';
          updated.categoryName = '';
        }
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

  // Gallery URL handlers
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const handleAddGalleryImage = () => {
    if (newGalleryUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        gallery: [...prev.gallery, newGalleryUrl.trim()],
      }));
      setNewGalleryUrl('');
    }
  };
  const handleRemoveGalleryImage = (idx) => {
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== idx),
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
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Variants handlers
  const handleAddVariant = (variantType = null) => {
    // Smart default type depending on collection if not specified
    const type = variantType || (
      formData.collectionId === 'sarees'
        ? 'color'
        : formData.collectionId === 'jewellery'
        ? 'size'
        : formData.collectionId === 'food' || formData.collectionId === 'tea'
        ? 'weight'
        : 'color'
    );

    const basePrefix = (formData.collectionId || 'PROD').substring(0, 3).toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);
    const suggestedSku = `${basePrefix}-${rand}-${formData.variants.length + 1}`;

    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: '',
          sku: suggestedSku,
          type,
          hex: type === 'color' ? '#7A1C28' : '',
          size: '',
          weight: '',
          price: prev.price || '',
          stockQuantity: 25,
          inStock: true,
        },
      ],
    }));
  };

  const handleGenerateVariantSku = (idx) => {
    const v = formData.variants[idx];
    const prefix = (formData.collectionId || 'PROD').substring(0, 3).toUpperCase();
    const nameSlug = (v.name || 'VAR').substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const rand = Math.floor(10 + Math.random() * 90);
    const sku = `${prefix}-${nameSlug || 'V'}-${rand}`;
    handleVariantChange(idx, 'sku', sku);
  };

  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  const handleRemoveVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (!formData.name.trim()) throw new Error('Product name is required');
      if (!formData.description.trim()) throw new Error('Product description is required');
      if (!formData.collectionId) throw new Error('Collection must be selected');

      const autoGeneratedSlug =
        formData.slug?.trim() ||
        formData.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      const payload = {
        name: formData.name.trim(),
        slug: autoGeneratedSlug || undefined,
        collectionId: formData.collectionId,
        category: formData.category || formData.collectionId,
        categoryName: formData.categoryName || formData.category,
        price: formData.price !== '' ? Number(formData.price) : null,
        originalPrice: formData.originalPrice !== '' ? Number(formData.originalPrice) : null,
        stockQuantity: Number(formData.stockQuantity) || 0,
        inStock: Boolean(formData.inStock),
        isFeatured: Boolean(formData.isFeatured),
        badge: formData.badge || null,
        packSize: formData.packSize || null,
        description: formData.description.trim(),
        image: formData.image.trim() || '/placeholder-luxury.jpg',
        gallery: formData.gallery,
        specs: formData.specs,
        variants: formData.variants.map((v) => {
          const attributes = {
            type: v.type || 'custom',
          };
          if (v.type === 'color' || v.hex) {
            attributes.hex = v.hex || '#451523';
          }
          if (v.type === 'size' || v.size) {
            attributes.size = v.size || v.name;
          }
          if (v.type === 'weight' || v.weight) {
            attributes.weight = v.weight || v.name;
          }

          return {
            ...(v.id ? { id: v.id } : {}),
            name: v.name.trim(),
            sku: v.sku ? v.sku.trim() : null,
            price: v.price !== '' ? Number(v.price) : null,
            stockQuantity: Number(v.stockQuantity) || 0,
            inStock: Boolean(v.inStock),
            attributes,
          };
        }),
      };

      const endpoint = isEditing ? `/api/admin/products/${id}` : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await adminFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save product');

      setSuccessMsg(isEditing ? 'Product updated successfully!' : 'Product created successfully!');
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
      <div className="p-12 text-center text-xs text-[#7A7167]">
        <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Loading product details...</span>
      </div>
    );
  }

  const availableSubcategories = COLLECTION_SUBCATEGORIES[formData.collectionId] || [];
  const isCustomSubcategory = Boolean(
    formData.category && !availableSubcategories.some((sub) => sub.id === formData.category)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <BackButton
          collection="admin"
          fallbackTo="/admin/products"
          label="Back to Products"
        />
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C6320]">
            {isEditing ? 'Editing Mode' : 'New Catalogue Addition'}
          </span>
        </div>
      </div>

      <div className="border-b border-[#E5E0D5] pb-4">
        <h1 className="font-serif text-2xl font-bold text-[#1A1817]">
          {isEditing ? `Edit: ${formData.name || 'Product'}` : 'Create Unified Product'}
        </h1>
        <p className="text-xs text-[#7A7167]">
          Manage pricing, collection attributes, variants, and stock across Wholesome Pantry, Wellness Tea, Heritage Sarees, or Silver Jewellery.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Core Details */}
        <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] space-y-4">
          <h2 className="font-serif text-base font-bold text-[#1A1817] border-b border-[#EAE4D9] pb-2">
            1. Collection & Identity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                Collection Category *
              </label>
              <select
                name="collectionId"
                value={formData.collectionId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
              >
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name} ({col.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                Subcategory Tag *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleSubcategoryChange}
                required
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
              >
                {isCustomSubcategory && (
                  <option value={formData.category}>
                    {formData.categoryName || formData.category} (Custom)
                  </option>
                )}
                {availableSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g. Royal Kashmiri Saffron or Kanchipuram Gold Silk"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
              Luxury Description *
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Describe the heritage, provenance, craftsmanship, aroma, or weave details..."
              className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
            />
          </div>
        </div>

        {/* Section 2: Pricing & Inventory */}
        <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] space-y-4">
          <h2 className="font-serif text-base font-bold text-[#1A1817] border-b border-[#EAE4D9] pb-2">
            2. Pricing & Stock Control
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                Price (INR ₹)
              </label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="e.g. 2500"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] font-mono focus:border-[#722F37] outline-none"
              />
              <p className="text-[10px] text-[#7A7167] mt-1">Leave empty for bespoke / unpriced items.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                Original Price (M.R.P)
              </label>
              <input
                type="number"
                name="originalPrice"
                min="0"
                step="0.01"
                value={formData.originalPrice}
                onChange={handleInputChange}
                placeholder="e.g. 3000"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] font-mono focus:border-[#722F37] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                Stock Quantity (Units)
              </label>
              <input
                type="number"
                name="stockQuantity"
                min="0"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] font-mono focus:border-[#722F37] outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="inStock"
                checked={formData.inStock}
                onChange={handleInputChange}
                className="rounded border-[#D5CEC2] text-[#722F37] focus:ring-[#722F37]"
              />
              <span className="text-xs font-medium text-[#1A1817]">Mark as Available / In Stock</span>
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

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#4A423B]">Badge:</span>
              <input
                type="text"
                name="badge"
                value={formData.badge}
                onChange={handleInputChange}
                placeholder="e.g. Bestseller, Artisanal"
                className="px-2 py-1 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Category Specific Dynamic Attributes */}
        <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] space-y-4">
          <div className="border-b border-[#EAE4D9] pb-2 flex items-center justify-between">
            <h2 className="font-serif text-base font-bold text-[#1A1817]">
              3. Category Specific Attributes ({formData.collectionId.toUpperCase()})
            </h2>
            <span className="text-[10px] font-mono text-[#8C6320]">Dynamic Schema Fields</span>
          </div>

          {/* GOURMET FOOD FIELDS */}
          {formData.collectionId === 'food' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Pack Size / Net Weight</label>
                <input
                  type="text"
                  value={formData.packSize || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, packSize: e.target.value }))}
                  placeholder="e.g. 500g Glass Jar, 1g Saffron Box"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Shelf Life</label>
                <input
                  type="text"
                  value={formData.specs?.shelfLife || ''}
                  onChange={(e) => handleSpecChange('shelfLife', e.target.value)}
                  placeholder="e.g. 12 Months from harvest"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Origin / Farm Source</label>
                <input
                  type="text"
                  value={formData.specs?.origin || ''}
                  onChange={(e) => handleSpecChange('origin', e.target.value)}
                  placeholder="e.g. Pampore, Kashmir (Single Harvest Valley)"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
            </div>
          )}

          {/* TEA FIELDS */}
          {formData.collectionId === 'tea' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Flush / Harvest Season</label>
                <input
                  type="text"
                  value={formData.specs?.harvestSeason || ''}
                  onChange={(e) => handleSpecChange('harvestSeason', e.target.value)}
                  placeholder="e.g. First Flush Spring 2026, Summer Calyces"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Steep Guide</label>
                <input
                  type="text"
                  value={formData.specs?.steepTime || ''}
                  onChange={(e) => handleSpecChange('steepTime', e.target.value)}
                  placeholder="e.g. 1-2 tsp in 90°C water for 4-5 mins"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Caffeine Level</label>
                <input
                  type="text"
                  value={formData.specs?.caffeineLevel || ''}
                  onChange={(e) => handleSpecChange('caffeineLevel', e.target.value)}
                  placeholder="e.g. Naturally Caffeine Free / Low Caffeine"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Botanical Aroma / Flavor Notes</label>
                <input
                  type="text"
                  value={formData.specs?.flavorNotes || ''}
                  onChange={(e) => handleSpecChange('flavorNotes', e.target.value)}
                  placeholder="e.g. Tart Berry, Single Origin Honey, Floral"
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
                  placeholder="e.g. Pure Mulberry Kanchipuram Silk / Katan Silk"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Zari Purity / Type</label>
                <input
                  type="text"
                  value={formData.specs?.zari || ''}
                  onChange={(e) => handleSpecChange('zari', e.target.value)}
                  placeholder="e.g. Authentic Pure Silver Zari / Tested Gold Zari"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Weave Technique</label>
                <input
                  type="text"
                  value={formData.specs?.weave || ''}
                  onChange={(e) => handleSpecChange('weave', e.target.value)}
                  placeholder="e.g. Korvai Interlocking Weave, Handloom Kadwa"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Blouse Piece Included?</label>
                <input
                  type="text"
                  value={formData.specs?.blousePiece || ''}
                  onChange={(e) => handleSpecChange('blousePiece', e.target.value)}
                  placeholder="e.g. Yes (80cm Contrast Mulberry Silk)"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
            </div>
          )}

          {/* SILVER JEWELLERY FIELDS */}
          {formData.collectionId === 'jewellery' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Metal & Purity</label>
                <input
                  type="text"
                  value={formData.specs?.metal || '925 Sterling Silver'}
                  onChange={(e) => handleSpecChange('metal', e.target.value)}
                  placeholder="e.g. 925 Hallmarked Sterling Silver"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Gemstone / Accent</label>
                <input
                  type="text"
                  value={formData.specs?.gemstone || ''}
                  onChange={(e) => handleSpecChange('gemstone', e.target.value)}
                  placeholder="e.g. Natural Moonstone, Swiss Blue Topaz"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Gross Weight (grams)</label>
                <input
                  type="text"
                  value={formData.specs?.weight || ''}
                  onChange={(e) => handleSpecChange('weight', e.target.value)}
                  placeholder="e.g. 14.2 g"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">Finish / Plating</label>
                <input
                  type="text"
                  value={formData.specs?.plating || ''}
                  onChange={(e) => handleSpecChange('plating', e.target.value)}
                  placeholder="e.g. Anti-tarnish Rhodium finish / 18K Gold Vermeil"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Imagery */}
        <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] space-y-5">
          <div className="border-b border-[#EAE4D9] pb-2 flex items-center justify-between">
            <h2 className="font-serif text-base font-bold text-[#1A1817]">
              4. Media & Gallery
            </h2>
            <span className="text-[10px] font-mono text-[#8C6320]">Instant Image Preview</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
              Primary Image URL *
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
                required
                placeholder="e.g. /images/sarees/saree-kanchipuram.jpg or https://..."
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
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1E1916] hover:bg-[#342D28] text-white rounded text-xs font-medium transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
            </div>

            {/* Quick Presets for current collection */}
            {PRESET_COLLECTION_IMAGES[formData.collectionId] && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase font-mono text-[#8C6320] font-semibold mr-1">
                  Catalogue Presets:
                </span>
                {PRESET_COLLECTION_IMAGES[formData.collectionId].map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => {
                      setFormData((p) => ({ ...p, image: preset.url }));
                      setImageError(false);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded border transition-all cursor-pointer ${
                      formData.image === preset.url
                        ? 'bg-[#722F37] text-white border-[#722F37] font-medium'
                        : 'bg-white hover:bg-[#F0ECE1] text-[#4A423B] border-[#D5CEC2]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}

            {/* Large Interactive Image Preview Box */}
            <div className="mt-4 p-4 rounded-xl border border-[#E5E0D5] bg-white/70">
              <span className="block text-[11px] font-semibold text-[#4A423B] uppercase mb-2">
                Live Image Preview
              </span>

              {formData.image ? (
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-[#D5CEC2] bg-[#FAF8F5] shadow-sm shrink-0">
                    <img
                      src={formData.image}
                      alt="Primary Preview"
                      onLoad={() => setImageError(false)}
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover"
                    />
                    {!imageError && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[9px] font-mono tracking-wider">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-xs">
                    {imageError ? (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>Could not load image at provided URL</span>
                        </div>
                        <p className="text-[11px] text-rose-700">
                          Please verify the URL or click <strong>Upload File</strong> above to choose an image from your computer.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Image successfully loaded</span>
                        </div>
                        <p className="text-[11px] font-mono text-emerald-700 truncate max-w-md">
                          {formData.image.startsWith('data:')
                            ? 'Uploaded local image file'
                            : formData.image}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setFormData((p) => ({ ...p, image: '' }));
                        setImageError(false);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-rose-700 hover:text-rose-900 font-medium cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove image</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#D5CEC2] rounded-xl text-center bg-[#FAF8F5]">
                  <ImageIcon className="w-8 h-8 text-[#A8A096] mb-2" />
                  <p className="text-xs text-[#7A7167]">No image selected yet.</p>
                  <p className="text-[11px] text-[#A8A096]">
                    Paste an image URL, click one of the presets above, or click <strong>Upload File</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
              Additional Gallery Images
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newGalleryUrl}
                onChange={(e) => setNewGalleryUrl(e.target.value)}
                placeholder="Paste extra image URL..."
                className="flex-1 px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs"
              />
              <button
                type="button"
                onClick={handleAddGalleryImage}
                className="px-3 py-1.5 bg-[#1E1916] text-white text-xs font-medium rounded hover:bg-[#2C2520] cursor-pointer"
              >
                Add Image
              </button>
            </div>

            {formData.gallery.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.gallery.map((url, idx) => (
                  <div key={idx} className="relative group border border-[#D5CEC2] rounded-lg overflow-hidden shadow-xs">
                    <img
                      src={url}
                      alt={`Gallery ${idx + 1}`}
                      className="w-16 h-16 object-cover bg-[#EAE4D9]"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/80x80/f5f2eb/1a1817?text=Image';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-300" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Variants Builder */}
        <div className="bg-[#FBF9F5] p-6 rounded-xl border border-[#E5E0D5] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE4D9] pb-3">
            <div>
              <h2 className="font-serif text-base font-bold text-[#1A1817] flex items-center gap-2">
                <span>5. Product Variants (Optional)</span>
                {formData.variants.length > 0 && (
                  <span className="text-xs font-normal text-[#7A7167] bg-[#EFEAE1] px-2 py-0.5 rounded-full">
                    {formData.variants.length} defined
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-[#7A7167] mt-0.5">
                Configure color shades with swatches, ring/chain sizes, net weights, SKUs, and inventory.
              </p>
            </div>

            {/* Quick Add Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddVariant('color')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#722F37] text-white rounded-lg text-xs font-medium hover:bg-[#5C242C] transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Color Shade</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddVariant('size')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D5CEC2] text-[#4A423B] rounded-lg text-xs font-medium hover:bg-[#F0ECE1] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Size</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddVariant('weight')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D5CEC2] text-[#4A423B] rounded-lg text-xs font-medium hover:bg-[#F0ECE1] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Weight / Pack</span>
              </button>
            </div>
          </div>

          {formData.variants.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-[#D5CEC2] text-center bg-white/60">
              <p className="text-xs text-[#7A7167] mb-2">
                No variants added yet. This product is currently sold as a standard single offering.
              </p>
              <p className="text-[11px] text-[#8C8377]">
                Click <strong>+ Color Shade</strong>, <strong>+ Size</strong>, or <strong>+ Weight / Pack</strong> above to create product options.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.variants.map((variant, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white rounded-xl border border-[#E5E0D5] shadow-xs space-y-3 relative hover:border-[#D5CEC2] transition-colors"
                >
                  {/* Variant Card Top Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#F0ECE1]">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#EFEAE1] text-[#4A423B] flex items-center justify-center text-xs font-mono font-bold">
                        {idx + 1}
                      </span>

                      {/* Variant Type Selector */}
                      <select
                        value={variant.type || 'color'}
                        onChange={(e) => handleVariantChange(idx, 'type', e.target.value)}
                        className="px-2 py-1 rounded bg-[#FAF8F5] border border-[#D5CEC2] text-xs font-medium text-[#4A423B]"
                      >
                        <option value="color">Color / Shade</option>
                        <option value="size">Size / Dimension</option>
                        <option value="weight">Weight / Pack</option>
                        <option value="custom">General / Custom</option>
                      </select>

                      {variant.type === 'color' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D5]">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: variant.hex || '#451523' }}
                          />
                          <span className="text-[10px] font-mono text-[#7A7167]">
                            {variant.hex || '#451523'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* In-Stock Status Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleVariantChange(idx, 'inStock', !variant.inStock)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-md border flex items-center gap-1.5 cursor-pointer transition-colors ${
                          variant.inStock
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                        }`}
                      >
                        {variant.inStock ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            <span>Out of Stock</span>
                          </>
                        )}
                      </button>

                      {/* Delete Variant */}
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Remove Variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Primary Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Variant Name Input (Spans 5 cols) */}
                    <div className="md:col-span-5">
                      <label className="block text-[10px] font-mono text-[#7A7167] uppercase mb-1">
                        {variant.type === 'color'
                          ? 'Color / Shade Name'
                          : variant.type === 'size'
                          ? 'Size Label'
                          : variant.type === 'weight'
                          ? 'Weight / Pack Label'
                          : 'Variant Name'} *
                      </label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                        placeholder={
                          variant.type === 'color'
                            ? 'e.g. Royal Wine, Temple Crimson'
                            : variant.type === 'size'
                            ? 'e.g. US 7, Standard (6.3m)'
                            : variant.type === 'weight'
                            ? 'e.g. 100g Pouch, Pack of 2'
                            : 'Variant Title'
                        }
                        className="w-full px-2.5 py-1.5 border border-[#D5CEC2] rounded-lg text-xs bg-white text-[#1A1817] focus:ring-1 focus:ring-[#722F37]"
                        required
                      />
                    </div>

                    {/* SKU Code (Spans 3 cols) */}
                    <div className="md:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-mono text-[#7A7167] uppercase">
                          SKU Code
                        </label>
                        <button
                          type="button"
                          onClick={() => handleGenerateVariantSku(idx)}
                          className="text-[9px] text-[#722F37] hover:underline cursor-pointer font-medium"
                        >
                          Auto Gen
                        </button>
                      </div>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                        placeholder="e.g. SAR-WINE-01"
                        className="w-full px-2.5 py-1.5 border border-[#D5CEC2] rounded-lg text-xs font-mono uppercase bg-white text-[#1A1817]"
                      />
                    </div>

                    {/* Price Override (Spans 2 cols) */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-mono text-[#7A7167] uppercase">
                          Price (₹)
                        </label>
                        {formData.price && (
                          <button
                            type="button"
                            onClick={() => handleVariantChange(idx, 'price', formData.price)}
                            className="text-[9px] text-[#722F37] hover:underline cursor-pointer font-medium"
                            title="Copy base product price"
                          >
                            Base
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                        placeholder={formData.price || 'Price'}
                        className="w-full px-2.5 py-1.5 border border-[#D5CEC2] rounded-lg text-xs font-mono bg-white text-[#1A1817]"
                      />
                    </div>

                    {/* Stock Units (Spans 2 cols) */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-[#7A7167] uppercase mb-1">
                        Stock (Units)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={variant.stockQuantity}
                        onChange={(e) => handleVariantChange(idx, 'stockQuantity', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-[#D5CEC2] rounded-lg text-xs font-mono bg-white text-[#1A1817]"
                      />
                    </div>
                  </div>

                  {/* Contextual Color Picker Row (Only when type === 'color') */}
                  {variant.type === 'color' && (
                    <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EAE4D9] flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-mono uppercase text-[#7A7167] font-semibold">
                          Color Swatch:
                        </label>
                        <input
                          type="color"
                          value={variant.hex || '#451523'}
                          onChange={(e) => handleVariantChange(idx, 'hex', e.target.value)}
                          className="w-7 h-7 rounded border border-[#D5CEC2] cursor-pointer p-0.5 bg-white"
                          title="Pick custom color"
                        />
                        <input
                          type="text"
                          value={variant.hex || ''}
                          onChange={(e) => handleVariantChange(idx, 'hex', e.target.value)}
                          placeholder="#451523"
                          className="w-20 px-2 py-1 border border-[#D5CEC2] rounded text-xs font-mono uppercase bg-white"
                        />
                      </div>

                      {/* Quick Palette Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-[#8C8377] font-medium mr-1">
                          Presets:
                        </span>
                        {COMMON_COLOR_PRESETS.map((clr) => (
                          <button
                            key={clr.hex}
                            type="button"
                            onClick={() => {
                              handleVariantChange(idx, 'hex', clr.hex);
                              if (!variant.name) handleVariantChange(idx, 'name', clr.name);
                            }}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-all cursor-pointer ${
                              variant.hex === clr.hex
                                ? 'border-[#722F37] bg-white font-semibold ring-1 ring-[#722F37]'
                                : 'border-[#E0D9CE] bg-white/80 hover:bg-white text-[#4A423B]'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: clr.hex }}
                            />
                            <span>{clr.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contextual Size Quick Chips (When type === 'size') */}
                  {variant.type === 'size' && (
                    <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#EAE4D9] flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[10px] text-[#8C8377] font-medium mr-1">
                        Common Sizes:
                      </span>
                      {COMMON_SIZE_PRESETS.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            handleVariantChange(idx, 'name', sz);
                            handleVariantChange(idx, 'size', sz);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] border transition-all cursor-pointer ${
                            variant.name === sz
                              ? 'border-[#722F37] bg-white font-semibold text-[#722F37]'
                              : 'border-[#E0D9CE] bg-white hover:bg-[#F0ECE1] text-[#4A423B]'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Contextual Weight Quick Chips (When type === 'weight') */}
                  {variant.type === 'weight' && (
                    <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#EAE4D9] flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[10px] text-[#8C8377] font-medium mr-1">
                        Common Weights:
                      </span>
                      {COMMON_WEIGHT_PRESETS.map((wt) => (
                        <button
                          key={wt}
                          type="button"
                          onClick={() => {
                            handleVariantChange(idx, 'name', wt);
                            handleVariantChange(idx, 'weight', wt);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] border transition-all cursor-pointer ${
                            variant.name === wt
                              ? 'border-[#722F37] bg-white font-semibold text-[#722F37]'
                              : 'border-[#E0D9CE] bg-white hover:bg-[#F0ECE1] text-[#4A423B]'
                          }`}
                        >
                          {wt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E0D5]">
          <Link
            to="/admin/products"
            className="px-4 py-2 border border-[#D5CEC2] rounded text-xs font-medium text-[#4A423B] hover:bg-[#EFEAE1]"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2 bg-[#722F37] text-white text-xs font-semibold rounded shadow-sm hover:bg-[#5E2229] disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving to Database...' : isEditing ? 'Update Product' : 'Publish Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
