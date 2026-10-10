import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

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

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    collectionId: 'food',
    category: '',
    categoryName: '',
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
          setFormData({
            name: p.name || '',
            slug: p.slug || '',
            collectionId: p.collectionId || 'food',
            category: p.category || '',
            categoryName: p.categoryName || '',
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
              ? p.variants.map((v) => ({
                  id: v.id,
                  name: v.name,
                  sku: v.sku || '',
                  price: v.price !== null ? String(v.price) : '',
                  stockQuantity: v.stockQuantity ?? 25,
                  inStock: Boolean(v.inStock),
                }))
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

  // Variants handlers
  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: '',
          sku: '',
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

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
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
        variants: formData.variants.map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          name: v.name.trim(),
          sku: v.sku ? v.sku.trim() : null,
          price: v.price !== '' ? Number(v.price) : null,
          stockQuantity: Number(v.stockQuantity) || 0,
          inStock: Boolean(v.inStock),
        })),
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs text-[#7A7167] hover:text-[#1A1817] font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products</span>
        </Link>
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

            <div>
              <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                Custom URL Slug
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="Auto-generated if left blank"
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] font-mono focus:border-[#722F37] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                Subcategory / Tag
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g. Rare Spice, Botanical Brew, Bridal Katan"
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
        <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] space-y-4">
          <h2 className="font-serif text-base font-bold text-[#1A1817] border-b border-[#EAE4D9] pb-2">
            4. Media & Gallery
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
              Primary Image URL *
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                required
                placeholder="https://... or /images/tea/tea-hibiscus.jpg"
                className="flex-1 px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
              />
              {formData.image && (
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-10 h-10 object-cover rounded border border-[#D5CEC2] bg-[#EAE4D9]"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/80x80/f5f2eb/1a1817?text=Preview';
                  }}
                />
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
                className="px-3 py-1.5 bg-[#1E1916] text-white text-xs font-medium rounded hover:bg-[#2C2520]"
              >
                Add Image
              </button>
            </div>

            {formData.gallery.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.gallery.map((url, idx) => (
                  <div key={idx} className="relative group border border-[#D5CEC2] rounded overflow-hidden">
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
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
        <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-2">
            <div>
              <h2 className="font-serif text-base font-bold text-[#1A1817]">5. Product Variants (Optional)</h2>
              <p className="text-[11px] text-[#7A7167]">For sizes, packs, weights, colors, or ring sizes.</p>
            </div>
            <button
              type="button"
              onClick={handleAddVariant}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EFEAE1] border border-[#DFD8CC] rounded text-xs font-medium text-[#4A423B] hover:bg-[#E5E0D5]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Variant</span>
            </button>
          </div>

          {formData.variants.length === 0 ? (
            <p className="text-xs text-[#8C8377] italic py-2">
              No specific variants defined. This product is sold as a standard single offering.
            </p>
          ) : (
            <div className="space-y-3">
              {formData.variants.map((variant, idx) => (
                <div key={idx} className="p-3 bg-white rounded border border-[#E5E0D5] grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono text-[#7A7167] uppercase mb-0.5">Variant Name</label>
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                      placeholder="e.g. 100g Pouch / Size US 7"
                      className="w-full px-2.5 py-1.5 border border-[#D5CEC2] rounded text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#7A7167] uppercase mb-0.5">Price (₹)</label>
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                      placeholder="e.g. 1850"
                      className="w-full px-2.5 py-1.5 border border-[#D5CEC2] rounded text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#7A7167] uppercase mb-0.5">Stock (Units)</label>
                    <input
                      type="number"
                      value={variant.stockQuantity}
                      onChange={(e) => handleVariantChange(idx, 'stockQuantity', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#D5CEC2] rounded text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-end pt-3 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-1.5 text-rose-700 hover:bg-rose-50 rounded"
                      title="Remove Variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
