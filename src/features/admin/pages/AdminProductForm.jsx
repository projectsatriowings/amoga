import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { HsnClassificationWidget } from '../components/HsnClassificationWidget';
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
    { id: 'saree', name: 'Saree' },
    { id: 'salwar', name: 'Salwar' },
    { id: 'half-saree', name: 'Half Saree' },
  ],
  jewellery: [
    { id: 'chain-with-pendant', name: 'Chain with Pendant' },
    { id: 'chain-pendant-earring', name: 'Chain Pendant Earring' },
    { id: 'earring', name: 'Earring' },
    { id: 'anklets', name: 'Anklets' },
    { id: 'toe-rings', name: 'Toe Rings' },
    { id: 'bracelet', name: 'Bracelet' },
    { id: 'necklace', name: 'Necklace' },
  ],
};

const CATEGORY_DEFAULT_TAX = {
  soups: { hsnCode: '2104', gstRate: '18.00' },
  millets: { hsnCode: '1008', gstRate: '5.00' },
  podis: { hsnCode: '2103', gstRate: '12.00' },
  spices: { hsnCode: '0910', gstRate: '5.00' },
  tea: { hsnCode: '0902', gstRate: '5.00' },
  sarees: { hsnCode: '5007', gstRate: '5.00' },
  saree: { hsnCode: '5007', gstRate: '5.00' },
  salwar: { hsnCode: '6204', gstRate: '5.00' },
  'half-saree': { hsnCode: '5007', gstRate: '5.00' },
  silk: { hsnCode: '5007', gstRate: '5.00' },
  cotton: { hsnCode: '5208', gstRate: '5.00' },
  jewellery: { hsnCode: '7113', gstRate: '3.00' },
  'chain-with-pendant': { hsnCode: '7113', gstRate: '3.00' },
  'chain-pendant-earring': { hsnCode: '7113', gstRate: '3.00' },
  earring: { hsnCode: '7113', gstRate: '3.00' },
  earrings: { hsnCode: '7113', gstRate: '3.00' },
  anklets: { hsnCode: '7113', gstRate: '3.00' },
  'toe-rings': { hsnCode: '7113', gstRate: '3.00' },
  bracelet: { hsnCode: '7113', gstRate: '3.00' },
  bracelets: { hsnCode: '7113', gstRate: '3.00' },
  necklace: { hsnCode: '7113', gstRate: '3.00' },
  necklaces: { hsnCode: '7113', gstRate: '3.00' },
  rings: { hsnCode: '7113', gstRate: '3.00' },
  traditional: { hsnCode: '7113', gstRate: '3.00' },
  food: { hsnCode: '2104', gstRate: '18.00' },
};

const COLLECTION_DEFAULT_SKU = {
  food: 'AMOGA-SOUP001',
  soups: 'AMOGA-SOUP001',
  millets: 'AMOGA-MIL001',
  podis: 'AMOGA-POD001',
  spices: 'AMOGA-MAS001',
  oils: 'AMOGA-OIL001',
  snacks: 'AMOGA-SNK001',
  superfoods: 'AMOGA-SPF001',
  honey: 'AMOGA-HNY001',
  tea: 'AMOGA-TEA001',
  flower: 'AMOGA-TEA001',
  leaf: 'AMOGA-TEA001',
  herbal: 'AMOGA-TEA001',
  sarees: 'AMOGA-SAR001',
  saree: 'AMOGA-SAR001',
  salwar: 'AMOGA-SLW001',
  'half-saree': 'AMOGA-HFS001',
  silk: 'AMOGA-SAR001',
  traditional: 'AMOGA-SAR001',
  festive: 'AMOGA-SAR001',
  wedding: 'AMOGA-SAR001',
  contemporary: 'AMOGA-SAR001',
  jewellery: 'AMOGA-SIL001',
  'chain-with-pendant': 'AMOGA-CWP001',
  'chain-pendant-earring': 'AMOGA-CPE001',
  earring: 'AMOGA-EAR001',
  earrings: 'AMOGA-EAR001',
  anklets: 'AMOGA-ANK001',
  'toe-rings': 'AMOGA-TOE001',
  bracelet: 'AMOGA-BRC001',
  bracelets: 'AMOGA-BRC001',
  necklace: 'AMOGA-NCK001',
  necklaces: 'AMOGA-NCK001',
  rings: 'AMOGA-SIL001',
};

export function AdminProductForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { adminFetch, admin } = useAdminStore();
  const isAuthorizedToEditWeight = admin?.role === 'SUPER_ADMIN' || admin?.role === 'CATALOGUE_MANAGER';

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
  const isSkuLockedRef = useRef(isSkuLocked);
  useEffect(() => {
    isSkuLockedRef.current = isSkuLocked;
  }, [isSkuLocked]);
  const [skuValidationMsg, setSkuValidationMsg] = useState(null);

  // Section toggle state
  const [showTaxSection, setShowTaxSection] = useState(true);
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
    sellingUnit: 'Pack',
    stockQuantity: 25,
    lowStockThreshold: 5,
    inStock: true,
    isFeatured: false,
    badge: '',

    // Category-specific fields stored in specs
    packSize: '',
    specs: {},

    // Tax & Compliance (Assisted Classification via HSN_SAC.pdf reference & Rate Master)
    hsnCode: '2104',
    gstRate: '18.00',
    isTaxInclusive: true,
    cessRate: '0.00',
    taxClassification: 'GOODS',
    taxTreatment: 'TAXABLE',
    taxVerificationStatus: 'VERIFIED',
    taxConfirmedBy: null,
    taxConfirmedAt: null,
    taxNotes: '',

    // Variants
    variants: [],
  });

  // Fetch SKU preview for collection/category
  const fetchSkuPreview = async (colId, catId, force = false) => {
    try {
      setSkuLoading(true);
      const res = await adminFetch(
        `/api/admin/products/sku/generate?collectionId=${colId}&category=${encodeURIComponent(catId || '')}`
      );
      const data = await res.json();
      if (res.ok && data.preview) {
        setFormData((prev) => {
          if (isSkuLockedRef.current || force || !prev.sku) {
            return {
              ...prev,
              sku: data.preview,
            };
          }
          return prev;
        });
      }
    } catch {
      // Non-blocking preview failure
    } finally {
      setSkuLoading(false);
    }
  };

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
            sellingUnit: p.sellingUnit || (targetCollection === 'tea' ? 'Pack' : 'Piece'),
            stockQuantity: p.stockQuantity ?? 25,
            lowStockThreshold: p.lowStockThreshold ?? 5,
            inStock: Boolean(p.inStock),
            isFeatured: Boolean(p.isFeatured),
            badge: p.badge || '',
            packSize: p.packSize || '',
            specs: p.specs || {},
            hsnCode: p.hsnCode || '',
            gstRate: p.gstRate !== null && p.gstRate !== undefined ? String(p.gstRate) : '',
            isTaxInclusive: p.isTaxInclusive !== undefined ? Boolean(p.isTaxInclusive) : true,
            cessRate: p.cessRate !== null && p.cessRate !== undefined ? String(p.cessRate) : '0.00',
            taxClassification: p.taxClassification || 'GOODS',
            taxTreatment: p.taxTreatment || 'TAXABLE',
            taxVerificationStatus: p.taxVerificationStatus || 'PENDING',
            taxConfirmedBy: p.taxConfirmedBy || null,
            taxConfirmedAt: p.taxConfirmedAt || null,
            taxNotes: p.taxNotes || '',
            variants: existingVariants.map((v) => ({
              id: v.id,
              name: v.name || '',
              sku: v.sku || '',
              price: v.price !== null && v.price !== undefined ? String(v.price) : '',
              image: v.image || '',
              stockQuantity: v.stockQuantity ?? 25,
              inStock: v.inStock !== undefined ? Boolean(v.inStock) : true,
              hsnCode: v.hsnCode || '',
              gstRate: v.gstRate !== null && v.gstRate !== undefined ? String(v.gstRate) : '',
              taxTreatment: v.taxTreatment || '',
              taxVerificationStatus: v.taxVerificationStatus || '',
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: null }));

    if (name === 'collectionId') {
      const available = COLLECTION_SUBCATEGORIES[value] || [];
      const nextCat = available.length > 0 ? available[0].id : '';
      const nextCatName = available.length > 0 ? available[0].name : '';
      const immediateSku = COLLECTION_DEFAULT_SKU[nextCat] || COLLECTION_DEFAULT_SKU[value] || `AMOGA-${value.substring(0, 3).toUpperCase()}001`;
      const defaultTax = CATEGORY_DEFAULT_TAX[nextCat] || CATEGORY_DEFAULT_TAX[value];

      setFormData((prev) => ({
        ...prev,
        collectionId: value,
        category: nextCat,
        categoryName: nextCatName,
        packSize: value === 'tea' ? (!isEditing || !prev.packSize ? '25 g' : prev.packSize) : prev.packSize,
        sku: isSkuLockedRef.current ? immediateSku : prev.sku,
        ...(defaultTax && (!prev.hsnCode || prev.taxVerificationStatus !== 'VERIFIED') ? {
          hsnCode: defaultTax.hsnCode,
          gstRate: defaultTax.gstRate,
        } : {}),
      }));

      // Fetch fresh exact sequential SKU preview from server outside the state updater
      fetchSkuPreview(value, nextCat, true);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubcategoryChange = (e) => {
    const selectedId = e.target.value;
    const available = COLLECTION_SUBCATEGORIES[formData.collectionId] || [];
    const matched = available.find((sub) => sub.id === selectedId);
    const immediateSku = COLLECTION_DEFAULT_SKU[selectedId] || COLLECTION_DEFAULT_SKU[formData.collectionId] || `AMOGA-${(formData.collectionId || 'PRD').substring(0, 3).toUpperCase()}001`;
    const defaultTax = CATEGORY_DEFAULT_TAX[selectedId] || CATEGORY_DEFAULT_TAX[formData.collectionId];

    setFormData((prev) => ({
      ...prev,
      category: selectedId,
      categoryName: matched ? matched.name : selectedId,
      sku: isSkuLockedRef.current ? immediateSku : prev.sku,
      ...(defaultTax && (!prev.hsnCode || prev.taxVerificationStatus !== 'VERIFIED') ? {
        hsnCode: defaultTax.hsnCode,
        gstRate: defaultTax.gstRate,
      } : {}),
    }));

    // Fetch fresh exact sequential SKU preview from server outside the state updater
    fetchSkuPreview(formData.collectionId, selectedId, true);
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

  const [uploadError, setUploadError] = useState(null);
  const [uploadingSlot, setUploadingSlot] = useState(null);

  // Helper to upload an image file to /api/admin/upload and return the permanent URL
  const uploadImageFile = async (file) => {
    if (!file) return null;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`File "${file.name}" exceeds the maximum 5MB size limit.`);
    }

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid file type "${file.type}". Allowed: JPG, PNG, WEBP, GIF, SVG.`);
    }

    // Convert file to base64
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    const res = await adminFetch('/api/admin/upload', {
      method: 'POST',
      body: JSON.stringify({
        data: base64Data,
        filename: file.name,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.url) {
      throw new Error(json.message || 'Image upload failed.');
    }

    return json.url;
  };

  const handleSlotUpload = async (slotIndex, file) => {
    if (!file) return;
    try {
      setUploadingSlot(slotIndex);
      setUploadError(null);
      const publicUrl = await uploadImageFile(file);

      if (slotIndex === 0) {
        // Main product image
        setFormData((prev) => ({ ...prev, image: publicUrl }));
        setImageError(false);
        setFieldErrors((prev) => ({ ...prev, image: null }));
      } else {
        // Gallery slot 1, 2, or 3 (index 1 => gallery[0], index 2 => gallery[1], index 3 => gallery[2])
        const galleryIndex = slotIndex - 1;
        setFormData((prev) => {
          const gallery = Array.isArray(prev.gallery) ? [...prev.gallery] : [];
          gallery[galleryIndex] = publicUrl;
          return { ...prev, gallery };
        });
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to upload image.');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleRemoveSlot = (slotIndex) => {
    if (slotIndex === 0) {
      setFormData((prev) => ({ ...prev, image: '' }));
    } else {
      const galleryIndex = slotIndex - 1;
      setFormData((prev) => {
        const gallery = Array.isArray(prev.gallery) ? [...prev.gallery] : [];
        gallery[galleryIndex] = '';
        return { ...prev, gallery };
      });
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

    if (formData.collectionId === 'tea') {
      const rawWeight = formData.packSize ? String(formData.packSize).replace(/[^\d.]/g, '') : '';
      const weightNum = parseFloat(rawWeight);
      if (!rawWeight || isNaN(weightNum) || weightNum <= 0) {
        errors.packWeight = 'Pack weight must be a positive number in grams (e.g. 25).';
      } else if (weightNum > 5000) {
        errors.packWeight = 'Pack weight cannot exceed 5,000 g.';
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
          ? 'Please correct the highlighted fields and confirm tax verification before publishing live.'
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
        sellingUnit: formData.sellingUnit || (formData.collectionId === 'tea' ? 'Pack' : 'Piece'),
        stockQuantity: Number(formData.stockQuantity) || 0,
        lowStockThreshold: Number(formData.lowStockThreshold) || 5,
        inStock: Boolean(formData.inStock),
        isFeatured: Boolean(formData.isFeatured),
        badge: formData.badge || null,
        packSize: formData.collectionId === 'tea'
          ? (formData.packSize
              ? (String(formData.packSize).trim().match(/^(\d+(?:\.\d+)?)\s*(?:g|gm|grams?)?$/i)
                  ? `${String(formData.packSize).replace(/[^\d.]/g, '')} g`
                  : String(formData.packSize).trim())
              : '25 g')
          : (formData.packSize || null),
        image: formData.image?.trim() || '/placeholder-luxury.jpg',
        gallery: Array.isArray(formData.gallery) ? formData.gallery : [],
        specs: formData.specs,
        sku: formData.sku?.trim() || null,
        hsnCode: formData.hsnCode?.trim() || null,
        gstRate: formData.gstRate !== '' && formData.gstRate !== null ? Number(formData.gstRate) : null,
        isTaxInclusive: Boolean(formData.isTaxInclusive),
        cessRate: formData.cessRate !== '' && formData.cessRate !== null ? Number(formData.cessRate) : 0,
        taxClassification: formData.taxClassification || 'GOODS',
        taxTreatment: formData.taxTreatment || 'TAXABLE',
        taxVerificationStatus: formData.taxVerificationStatus || 'PENDING',
        taxConfirmedBy: formData.taxConfirmedBy || null,
        taxConfirmedAt: formData.taxConfirmedAt || null,
        taxNotes: formData.taxNotes || null,
        isActive: targetStatus === 'active',
        status: targetStatus,
        variants: hasVariants
          ? formData.variants.map((v) => ({
              ...(v.id ? { id: v.id } : {}),
              name: v.name.trim(),
              sku: v.sku?.trim() || null,
              price: v.price !== '' ? Number(v.price) : null,
              image: v.image ? v.image.trim() : null,
              stockQuantity: Number(v.stockQuantity) || 0,
              inStock: Boolean(v.inStock),
              hsnCode: v.hsnCode?.trim() || null,
              gstRate: v.gstRate !== '' && v.gstRate !== null && v.gstRate !== undefined ? Number(v.gstRate) : null,
              taxTreatment: v.taxTreatment || null,
              taxVerificationStatus: v.taxVerificationStatus || null,
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
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <BackButton
          collection="admin"
          fallbackTo="/admin/products"
          label="Back to Products"
        />
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

          {formData.specs?.categoryReviewRequired && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-semibold">Category Review Required: </span>
                <span>{formData.specs?.reviewReason || 'Please select one of the updated categories below.'}</span>
              </div>
            </div>
          )}

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
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#4A423B]">
                  Product SKU
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextLocked = !isSkuLocked;
                    setIsSkuLocked(nextLocked);
                    if (nextLocked) {
                      fetchSkuPreview(formData.collectionId, formData.category, true);
                    }
                  }}
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

            {/* Up to 4 Product Images (Main + 3 Gallery slots) */}
            <div className="sm:col-span-2 space-y-3 pt-2 border-t border-[#EAE4D9]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-semibold text-[#4A423B]">
                    Product Images (Up to 4 Slots)
                  </label>
                  <p className="text-[11px] text-[#8C8377]">
                    Provide up to four product images. Main Product Image is the primary catalogue visual.
                  </p>
                </div>
                {uploadingSlot !== null && (
                  <span className="text-[11px] text-[#722F37] font-medium flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Uploading slot #{uploadingSlot + 1}...
                  </span>
                )}
              </div>

              {uploadError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                  <span>{uploadError}</span>
                  <button type="button" onClick={() => setUploadError(null)} className="text-rose-600 hover:text-rose-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 4 Image Slots Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Main Product Image', index: 0, url: formData.image },
                  { label: 'Product Image 2', index: 1, url: formData.gallery?.[0] || '' },
                  { label: 'Product Image 3', index: 2, url: formData.gallery?.[1] || '' },
                  { label: 'Product Image 4', index: 3, url: formData.gallery?.[2] || '' },
                ].map((slot) => {
                  const inputId = `slot-file-${slot.index}`;
                  return (
                    <div
                      key={slot.index}
                      className="p-3 bg-white rounded-xl border border-[#D5CEC2] flex flex-col justify-between space-y-2.5 relative group hover:border-[#722F37] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#2C1E11] font-mono">
                          {slot.label}
                        </span>
                        {slot.index === 0 && (
                          <span className="text-[9px] uppercase font-mono tracking-wider font-bold px-1.5 py-0.5 rounded bg-[#722F37] text-white">
                            Primary
                          </span>
                        )}
                      </div>

                      {/* Image Preview Box */}
                      <div className="aspect-square rounded-lg bg-[#FAF8F5] border border-dashed border-[#D5CEC2] overflow-hidden flex items-center justify-center relative">
                        {slot.url ? (
                          <>
                            <img
                              src={slot.url}
                              alt={slot.label}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-luxury.jpg';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <label
                                htmlFor={inputId}
                                className="p-1.5 bg-white/90 rounded-full text-stone-800 hover:bg-white cursor-pointer shadow-xs"
                                title="Replace image"
                              >
                                <Upload className="w-3.5 h-3.5" />
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveSlot(slot.index)}
                                className="p-1.5 bg-white/90 rounded-full text-rose-600 hover:bg-white cursor-pointer shadow-xs"
                                title="Remove image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <label
                            htmlFor={inputId}
                            className="w-full h-full flex flex-col items-center justify-center text-stone-400 hover:text-[#722F37] hover:bg-stone-50 cursor-pointer p-2 text-center transition-colors"
                          >
                            <Upload className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-medium">Click to upload</span>
                            <span className="text-[9px] text-stone-400">Max 5MB</span>
                          </label>
                        )}
                      </div>

                      {/* URL input or Upload button */}
                      <div className="space-y-1">
                        <input
                          type="file"
                          id={inputId}
                          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSlotUpload(slot.index, file);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                        <input
                          type="text"
                          value={slot.url}
                          placeholder="Or paste URL"
                          onChange={(e) => {
                            const val = e.target.value;
                            if (slot.index === 0) {
                              setFormData((p) => ({ ...p, image: val }));
                            } else {
                              const gIdx = slot.index - 1;
                              setFormData((p) => {
                                const gallery = Array.isArray(p.gallery) ? [...p.gallery] : [];
                                gallery[gIdx] = val;
                                return { ...p, gallery };
                              });
                            }
                          }}
                          className="w-full px-2 py-1 text-[10px] border border-[#D5CEC2] rounded bg-white text-[#1A1817] font-mono truncate focus:border-[#722F37] outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Presets Row for Primary Image */}
              {PRESET_COLLECTION_IMAGES[formData.collectionId] && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#8C6320] font-semibold">Catalogue Presets:</span>
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
            </div>
          </div>
        </div>

        {/* ================= SECTION B: PRICING & INVENTORY ================= */}
        <div className="bg-[#FBF9F5] p-5 sm:p-6 rounded-lg border border-[#E5E0D5] space-y-4">
          <h2 className="font-serif text-sm font-bold text-[#1A1817] uppercase tracking-wider border-b border-[#EAE4D9] pb-2">
            B. Pricing & Inventory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                Selling Price (₹) {formData.collectionId === 'tea' ? '(Per Pack)' : ''} {formData.status === 'active' && <span className="text-rose-600">*</span>}
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
                <p className="text-[10px] text-[#8C8377] mt-1">
                  {formData.collectionId === 'tea' ? 'Approved selling price per pack in INR (Incl. GST)' : 'Authoritative selling price in INR (Incl. GST)'}
                </p>
              )}
            </div>

            {/* Selling Unit */}
            <div>
              <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                Selling Unit
              </label>
              <select
                name="sellingUnit"
                value={formData.sellingUnit || (formData.collectionId === 'tea' ? 'Pack' : 'Piece')}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
              >
                <option value="Pack">Pack (Standard for Teas & Pantry Packs)</option>
                <option value="Piece">Piece (Standard for Sarees & Jewellery)</option>
                <option value="Unit">Unit (General)</option>
                <option value="Set">Set</option>
              </select>
              <p className="text-[10px] text-[#8C8377] mt-1">
                {formData.collectionId === 'tea' ? 'Wellness Tea uses piece-based Pack pricing.' : 'Commercial unit displayed across cart, orders, and POS.'}
              </p>
            </div>

            {/* Initial Stock Quantity */}
            <div>
              <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                Stock Quantity ({formData.sellingUnit || (formData.collectionId === 'tea' ? 'Packs' : 'Units')})
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
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                  Pack Weight (g) <span className="text-[#8C6320] font-normal">(Default: 25 g)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    step="1"
                    disabled={!isAuthorizedToEditWeight}
                    value={formData.packSize ? (formData.packSize.replace(/[^\d.]/g, '') || '') : '25'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFieldErrors((prev) => ({ ...prev, packWeight: null }));
                      setFormData((p) => ({ ...p, packSize: val ? `${val} g` : '' }));
                    }}
                    placeholder="25"
                    className={`w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs pr-14 ${
                      !isAuthorizedToEditWeight ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-[#8C6320] pointer-events-none">
                    grams
                  </span>
                </div>
                {!isAuthorizedToEditWeight ? (
                  <p className="text-[10px] text-stone-500 mt-1">
                    Only Catalogue Managers and Super Admins are authorized to edit tea pack weight.
                  </p>
                ) : (
                  <p className="text-[10px] text-[#7A7167] mt-1">
                    Standard Amoga Wellness Tea default is 25 g.
                  </p>
                )}
                {fieldErrors.packWeight && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.packWeight}</p>
                )}
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
                  D. GST & HSN Classification
                </h2>
                <p className="text-[11px] text-[#7A7167]">
                  HSN: <span className="font-mono font-medium">{formData.hsnCode || 'Not classified'}</span> | GST:{' '}
                  <span className="font-medium">{formData.gstRate !== '' && formData.gstRate !== null ? `${formData.gstRate}%` : 'Unassigned'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[#7A7167]">
              <span className="text-[11px] font-mono">{showTaxSection ? 'Collapse' : 'Configure'}</span>
              {showTaxSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showTaxSection && (
            <div className="p-5 sm:p-6 border-t border-[#EAE4D9] bg-white/60">
              <HsnClassificationWidget
                productName={formData.name}
                formData={formData}
                setFormData={setFormData}
                currentUser={admin}
                adminFetch={adminFetch}
                fieldErrors={fieldErrors}
              />
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

                  {/* Variant Image & Optional Tax Override */}
                  <div className="sm:col-span-5 pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#7A7167]">
                    {/* Variant Specific Image Upload */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold uppercase text-[10px] text-stone-500">Variant Image:</span>
                      {v.image ? (
                        <div className="flex items-center gap-2 bg-stone-50 px-2 py-1 rounded border border-stone-200">
                          <img
                            src={v.image}
                            alt={v.name || 'Variant preview'}
                            className="w-6 h-6 object-cover rounded"
                            onError={(e) => { e.currentTarget.src = '/placeholder-luxury.jpg'; }}
                          />
                          <span className="text-[10px] text-stone-600 truncate max-w-[120px]">
                            {v.image.startsWith('/uploads/') ? 'Uploaded' : 'URL set'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleVariantChange(idx, 'image', '')}
                            className="text-stone-400 hover:text-rose-600"
                            title="Remove variant image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="file"
                            id={`variant-file-${idx}`}
                            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const url = await uploadImageFile(file);
                                  handleVariantChange(idx, 'image', url);
                                } catch (err) {
                                  setUploadError(err.message || 'Variant image upload failed');
                                }
                              }
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor={`variant-file-${idx}`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[10px] font-medium cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload Image</span>
                          </label>
                          <input
                            type="text"
                            value={v.image || ''}
                            onChange={(e) => handleVariantChange(idx, 'image', e.target.value)}
                            placeholder="or paste image URL"
                            className="w-36 px-2 py-0.5 border border-[#D5CEC2] rounded text-[10px] bg-white font-mono"
                          />
                        </div>
                      )}
                    </div>

                    {/* Tax Override */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold uppercase text-[10px] text-stone-500">Tax Override:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]">HSN:</span>
                        <input
                          type="text"
                          value={v.hsnCode || ''}
                          onChange={(e) => handleVariantChange(idx, 'hsnCode', e.target.value)}
                          placeholder={formData.hsnCode || 'Inherit parent'}
                          maxLength={8}
                          className="w-24 px-2 py-1 border border-[#D5CEC2] rounded text-xs font-mono bg-white"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]">GST %:</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={v.gstRate || ''}
                          onChange={(e) => handleVariantChange(idx, 'gstRate', e.target.value)}
                          placeholder={formData.gstRate ? `${formData.gstRate}%` : 'Inherit'}
                          className="w-20 px-2 py-1 border border-[#D5CEC2] rounded text-xs font-mono bg-white"
                        />
                      </div>
                      {v.hsnCode && (
                        <span className="text-[10px] text-[#722F37] font-medium">
                          Variant-specific tax rate active
                        </span>
                      )}
                    </div>
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
