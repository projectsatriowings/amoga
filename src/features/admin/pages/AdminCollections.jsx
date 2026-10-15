import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RefreshCw,
  Edit2,
  Plus,
  Trash2,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  Eye,
  EyeOff,
  Palette,
  X,
  Search,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { BackButton } from '../../../components/ui/BackButton';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { invalidateCollectionsCache } from '../../../hooks/useCollection';

// Preset default color themes for Amoga categories
const DEFAULT_PALETTES = {
  food: {
    primaryColor: '#3F7B43',
    secondaryColor: '#173B2A',
    bgColor: '#F3F0E7',
    surfaceColor: '#FAF9F4',
    textColor: '#292820',
    mutedTextColor: '#65675A',
    accentColor: '#3F7B43',
    buttonBg: '#173B2A',
    buttonText: '#FFFFFF',
    borderColor: '#D9DCCD',
  },
  tea: {
    primaryColor: '#65815A',
    secondaryColor: '#173B2A',
    bgColor: '#FAF1BB',
    surfaceColor: '#FFFDF5',
    textColor: '#2C1E11',
    mutedTextColor: '#7D5C3F',
    accentColor: '#65815A',
    buttonBg: '#173B2A',
    buttonText: '#FFFFFF',
    borderColor: '#B88E38',
  },
  sarees: {
    primaryColor: '#C5A46D',
    secondaryColor: '#451523',
    bgColor: '#2C0E1A',
    surfaceColor: '#381222',
    textColor: '#F6EBD8',
    mutedTextColor: '#D4C2A7',
    accentColor: '#C5A46D',
    buttonBg: '#C5A46D',
    buttonText: '#2C0E1A',
    borderColor: '#C5A46D',
  },
  jewellery: {
    primaryColor: '#B9B8B5',
    secondaryColor: '#343238',
    bgColor: '#242326',
    surfaceColor: '#343238',
    textColor: '#F7F3EB',
    mutedTextColor: '#B9B8B5',
    accentColor: '#B9B8B5',
    buttonBg: '#F7F3EB',
    buttonText: '#111215',
    borderColor: '#B9B8B5',
  },
  custom: {
    primaryColor: '#722F37',
    secondaryColor: '#1A1817',
    bgColor: '#FAF8F5',
    surfaceColor: '#FFFFFF',
    textColor: '#1A1817',
    mutedTextColor: '#5C544C',
    accentColor: '#722F37',
    buttonBg: '#722F37',
    buttonText: '#FFFFFF',
    borderColor: '#E5E0D5',
  },
};

// Calculate WCAG contrast ratio
function getLuminance(hex) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return 0.5;
  const rgb = [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ].map((val) => (val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function CollectionImagePreview({ src, alt, onRemove, aspectRatio = 'aspect-video', maxWidth = 'max-w-xs' }) {
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
  }, [src]);

  if (!src) return null;

  return (
    <div className={`relative rounded-xl overflow-hidden border border-[#D5CEC2] ${maxWidth} ${aspectRatio} bg-stone-100 mt-2 flex items-center justify-center`}>
      {loadError ? (
        <div className="flex flex-col items-center justify-center text-center p-3 text-stone-400 select-none">
          <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
          <span className="text-[10px]">Preview unavailable</span>
        </div>
      ) : (
        <img
          key={src}
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setLoadError(true)}
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-md cursor-pointer transition-colors shadow-sm"
        title="Remove Image"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * Shared Collection Create/Edit Form Modal
 */
function CollectionModal({ isOpen, onClose, onSaved, initialData }) {
  const { adminFetch } = useAdminStore();
  const isEditing = Boolean(initialData?.id);
  const fileInputHeroRef = useRef(null);
  const fileInputCardRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tagline: '',
    heroHeading: '',
    heroSubheading: '',
    description: '',
    shortDescription: '',
    heroImage: '',
    cardImage: '',
    isActive: true,
    accentColor: '#722F37',
    themeConfig: { ...DEFAULT_PALETTES.custom },
  });

  const [isManualSlug, setIsManualSlug] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingCard, setUploadingCard] = useState(false);
  const [formError, setFormError] = useState(null);
  const [activeTab, setActiveTab] = useState('identity'); // 'identity' | 'content' | 'theme' | 'images'

  useEffect(() => {
    if (initialData) {
      const tc = initialData.themeConfig || DEFAULT_PALETTES[initialData.id] || DEFAULT_PALETTES.custom;
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || initialData.id || '',
        tagline: initialData.tagline || '',
        heroHeading: initialData.heroHeading || initialData.name || '',
        heroSubheading: initialData.heroSubheading || '',
        description: initialData.description || '',
        shortDescription: initialData.shortDescription || '',
        heroImage: initialData.heroImage || '',
        cardImage: initialData.cardImage || '',
        isActive: initialData.isActive !== undefined ? Boolean(initialData.isActive) : true,
        accentColor: initialData.accentColor || tc.accentColor || '#722F37',
        themeConfig: {
          primaryColor: tc.primaryColor || '#722F37',
          secondaryColor: tc.secondaryColor || '#1A1817',
          bgColor: tc.bgColor || '#FAF8F5',
          surfaceColor: tc.surfaceColor || '#FFFFFF',
          textColor: tc.textColor || '#1A1817',
          mutedTextColor: tc.mutedTextColor || '#5C544C',
          accentColor: tc.accentColor || initialData.accentColor || '#722F37',
          buttonBg: tc.buttonBg || '#722F37',
          buttonText: tc.buttonText || '#FFFFFF',
          borderColor: tc.borderColor || '#E5E0D5',
        },
      });
      setIsManualSlug(true);
    } else {
      setFormData({
        name: '',
        slug: '',
        tagline: '',
        heroHeading: '',
        heroSubheading: '',
        description: '',
        shortDescription: '',
        heroImage: '',
        cardImage: '',
        isActive: true,
        accentColor: '#722F37',
        themeConfig: { ...DEFAULT_PALETTES.custom },
      });
      setIsManualSlug(false);
    }
    setFormError(null);
    setActiveTab('identity');
  }, [initialData, isOpen]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, name: val };
      if (!isEditing && !isManualSlug) {
        const autoSlug = val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        next.slug = autoSlug;
      }
      if (!prev.heroHeading || prev.heroHeading === prev.name) {
        next.heroHeading = val;
      }
      return next;
    });
  };

  const handleSlugChange = (e) => {
    setIsManualSlug(true);
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData((prev) => ({ ...prev, slug: val }));
  };

  const handleColorChange = (key, value) => {
    let cleanHex = value;
    if (!cleanHex.startsWith('#') && /^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      cleanHex = `#${cleanHex}`;
    }

    setFormData((prev) => {
      const nextConfig = { ...prev.themeConfig, [key]: cleanHex };
      const next = { ...prev, themeConfig: nextConfig };
      if (key === 'accentColor' || key === 'primaryColor') {
        next.accentColor = cleanHex;
      }
      return next;
    });
  };

  const handlePresetApply = (paletteKey) => {
    const preset = DEFAULT_PALETTES[paletteKey] || DEFAULT_PALETTES.custom;
    setFormData((prev) => ({
      ...prev,
      accentColor: preset.accentColor,
      themeConfig: { ...preset },
    }));
  };

  const handleImageUpload = async (file, fieldName, setUploading) => {
    if (!file) return;
    setUploading(true);
    setFormError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const base64Data = evt.target.result;
          const res = await adminFetch('/api/admin/upload', {
            method: 'POST',
            body: JSON.stringify({ data: base64Data, filename: file.name }),
          });

          const json = await res.json();
          if (!res.ok) throw new Error(json.message || 'Image upload failed');

          setFormData((prev) => ({ ...prev, [fieldName]: json.url }));
        } catch (uploadErr) {
          setFormError(`Upload error: ${uploadErr.message}`);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setFormError(`File reading error: ${err.message}`);
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Collection name is required');
      setActiveTab('identity');
      return;
    }

    const cleanSlug = (formData.slug || formData.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug) {
      setFormError('A valid URL slug is required');
      setActiveTab('identity');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      name: formData.name.trim(),
      slug: cleanSlug,
      tagline: formData.tagline.trim(),
      heroHeading: (formData.heroHeading || formData.name).trim(),
      heroSubheading: formData.heroSubheading.trim(),
      description: formData.description.trim(),
      shortDescription: formData.shortDescription.trim(),
      heroImage: formData.heroImage.trim(),
      cardImage: formData.cardImage.trim(),
      accentColor: formData.accentColor,
      themeConfig: formData.themeConfig,
      isActive: Boolean(formData.isActive),
    };

    try {
      let res;
      if (isEditing) {
        res = await adminFetch(`/api/admin/collections/${initialData.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await adminFetch('/api/admin/collections', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save collection');
      }

      onSaved(json.collection);
      invalidateCollectionsCache();
      onClose();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Live Contrast Calculations
  const textBgContrast = getContrastRatio(formData.themeConfig.textColor, formData.themeConfig.bgColor);
  const buttonContrast = getContrastRatio(formData.themeConfig.buttonText, formData.themeConfig.buttonBg);

  return (
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-2xl max-w-4xl w-full p-5 sm:p-7 space-y-5 shadow-2xl overscroll-contain max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-3 shrink-0">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1A1817]">
              {isEditing ? `Edit Collection: ${initialData.name}` : 'Create New Collection & Storefront Category'}
            </h3>
            <p className="text-xs text-[#7A7167] mt-0.5">
              Configurable identity, copy, theme palette, and imagery synchronized directly to the database and storefront.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 text-[#7A7167] hover:text-[#1A1817] hover:bg-[#EFEAE1] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-[#EAE4D9] pb-2 text-xs font-medium shrink-0">
          {[
            { id: 'identity', label: '1. Identity & Routing' },
            { id: 'content', label: '2. Storefront Copy' },
            { id: 'theme', label: '3. Theme & Appearance' },
            { id: 'images', label: '4. Imagery & Media' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#722F37] text-white shadow-xs font-semibold'
                  : 'text-[#5C544C] hover:bg-[#EFEAE1]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-6">
          {/* TAB 1: IDENTITY */}
          {activeTab === 'identity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Wholesome Pantry, Heritage Sarees, Artisanal Potteries"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D5CEC2] rounded-xl text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                    URL Slug *
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-[#EFEAE1] border border-r-0 border-[#D5CEC2] rounded-l-xl text-xs font-mono text-[#7A7167]">
                      amoga.com/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={handleSlugChange}
                      placeholder="pantry"
                      required
                      className="w-full px-3 py-2.5 bg-white border border-[#D5CEC2] rounded-r-xl text-xs font-mono text-[#1A1817] focus:border-[#722F37] outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-[#7A7167] mt-1 font-mono">
                    Unique route slug used in navigation links, URLs, and storefront routing.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                    Storefront Visibility
                  </label>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, isActive: !p.isActive }))}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                        formData.isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-stone-100 text-stone-600 border-stone-300'
                      }`}
                    >
                      {formData.isActive ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-stone-500" />}
                      <span>{formData.isActive ? 'Active on Storefront & Gatekeeper' : 'Hidden from Customers'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STOREFRONT COPY */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Tagline (Eyebrow Badge) *
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. The Goodness of Tradition, Timeless Weaves, Modern Heirlooms"
                  className="w-full px-3.5 py-2 bg-white border border-[#D5CEC2] rounded-xl text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
                />
                <p className="text-[10px] text-[#7A7167] mt-1">
                  Displayed as the badge/eyebrow in Gatekeeper panels and hero sections.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                    Hero Heading *
                  </label>
                  <input
                    type="text"
                    value={formData.heroHeading}
                    onChange={(e) => setFormData({ ...formData, heroHeading: e.target.value })}
                    placeholder="e.g. Wholesome Pantry, The Heritage in Every Drape"
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CEC2] rounded-xl text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
                  />
                  <p className="text-[10px] text-[#7A7167] mt-1">
                    Main prominent collection title displayed on the category landing page.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                    Hero Subheading
                  </label>
                  <input
                    type="text"
                    value={formData.heroSubheading}
                    onChange={(e) => setFormData({ ...formData, heroSubheading: e.target.value })}
                    placeholder="e.g. Traditional blends for everyday nourishment."
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CEC2] rounded-xl text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
                  />
                  <p className="text-[10px] text-[#7A7167] mt-1">
                    Supporting italic subtitle positioned directly beneath the main heading.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Full Collection Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Discover traditional Indian blends made for everyday cooking, from comforting soup mixes to nourishing millet blends..."
                  className="w-full px-3.5 py-2 bg-white border border-[#D5CEC2] rounded-xl text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Short Description (Cards, Badges & Gatekeeper Preview)
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Traditional stone-ground pantry blends, wholesome grain mixes, and comforting broths."
                  className="w-full px-3.5 py-2 bg-white border border-[#D5CEC2] rounded-xl text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: THEME & COLOR CUSTOMIZATION */}
          {activeTab === 'theme' && (
            <div className="space-y-5">
              {/* Preset Shortcuts */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-[#E5E0D5] rounded-xl">
                <span className="text-[10px] font-mono text-[#8C6320] font-semibold uppercase mr-2">
                  Amoga Curated Presets:
                </span>
                {['food', 'tea', 'sarees', 'jewellery', 'custom'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handlePresetApply(k)}
                    className="px-2.5 py-1 text-[11px] bg-[#FBF9F5] hover:bg-[#EFEAE1] border border-[#D5CEC2] rounded-md font-medium text-[#4A423B] cursor-pointer capitalize transition-colors"
                  >
                    {k} Theme
                  </button>
                ))}
              </div>

              {/* Color Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[
                  { key: 'primaryColor', label: 'Primary Brand Color' },
                  { key: 'secondaryColor', label: 'Secondary / Heading' },
                  { key: 'bgColor', label: 'Page Background' },
                  { key: 'surfaceColor', label: 'Card / Surface Background' },
                  { key: 'textColor', label: 'Main Text Color' },
                  { key: 'mutedTextColor', label: 'Muted Text Color' },
                  { key: 'accentColor', label: 'Accent Highlight' },
                  { key: 'buttonBg', label: 'CTA Button Background' },
                  { key: 'buttonText', label: 'CTA Button Text' },
                  { key: 'borderColor', label: 'Border Color' },
                ].map(({ key, label }) => {
                  const currentHex = formData.themeConfig[key] || '#722F37';
                  return (
                    <div key={key} className="p-3 bg-white border border-[#E5E0D5] rounded-xl space-y-1.5 shadow-2xs">
                      <label className="block text-[11px] font-semibold text-[#4A423B]">
                        {label}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={isValidHex(currentHex) ? currentHex : '#722F37'}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer shrink-0 p-0"
                        />
                        <input
                          type="text"
                          value={currentHex}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          placeholder="#000000"
                          className="w-full px-2 py-1 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-mono text-[#1A1817] outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Contrast Guidance */}
              <div className="p-4 bg-white border border-[#E5E0D5] rounded-xl space-y-2 text-xs">
                <span className="font-semibold text-[#1A1817] flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-[#8C6320]" />
                  Accessibility & Contrast Verification (WCAG AA):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FBF9F5] border border-[#EAE4D9]">
                    <span>Text on Background ({textBgContrast.toFixed(1)}:1)</span>
                    <span
                      className={`font-semibold font-mono text-[11px] ${
                        textBgContrast >= 4.5 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {textBgContrast >= 4.5 ? '✓ Compliant' : '⚠ Warning: Low Contrast'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FBF9F5] border border-[#EAE4D9]">
                    <span>Button Text on CTA ({buttonContrast.toFixed(1)}:1)</span>
                    <span
                      className={`font-semibold font-mono text-[11px] ${
                        buttonContrast >= 4.5 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {buttonContrast >= 4.5 ? '✓ Compliant' : '⚠ Warning: Low Contrast'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-5 rounded-2xl border transition-all" style={{
                backgroundColor: formData.themeConfig.bgColor,
                borderColor: formData.themeConfig.borderColor,
                color: formData.themeConfig.textColor,
              }}>
                <span className="text-[10px] font-mono tracking-widest uppercase block mb-1" style={{ color: formData.themeConfig.accentColor }}>
                  {formData.tagline || 'COLLECTION TAGLINE'}
                </span>
                <h4 className="font-serif text-2xl font-bold uppercase" style={{ color: formData.themeConfig.secondaryColor }}>
                  {formData.heroHeading || formData.name || 'COLLECTION TITLE'}
                </h4>
                {formData.heroSubheading && (
                  <p className="font-serif italic text-sm mt-0.5" style={{ color: formData.themeConfig.secondaryColor }}>
                    {formData.heroSubheading}
                  </p>
                )}
                <p className="text-xs mt-2 line-clamp-2 max-w-lg leading-relaxed" style={{ color: formData.themeConfig.mutedTextColor }}>
                  {formData.description || 'Preview of description text styled using your configured collection typography tokens.'}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full text-xs font-semibold shadow-xs"
                    style={{
                      backgroundColor: formData.themeConfig.buttonBg,
                      color: formData.themeConfig.buttonText,
                    }}
                  >
                    EXPLORE COLLECTION
                  </button>
                  <span className="text-xs px-3 py-1.5 rounded-xl border" style={{
                    backgroundColor: formData.themeConfig.surfaceColor,
                    borderColor: formData.themeConfig.borderColor,
                    color: formData.themeConfig.textColor,
                  }}>
                    Card Surface
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: IMAGERY & MEDIA */}
          {activeTab === 'images' && (
            <div className="space-y-5">
              {/* Hero Image */}
              <div className="p-4 bg-white border border-[#E5E0D5] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#4A423B] uppercase">
                    Hero / Banner Image
                  </label>
                  <span className="text-[10px] font-mono text-[#8C6320]">Storefront Hero & Gatekeeper Fullsize</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={formData.heroImage}
                    onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                    placeholder="/images/gatekeeper-food.jpg or https://..."
                    className="flex-1 px-3 py-2 bg-[#FBF9F5] border border-[#D5CEC2] rounded-lg text-xs font-mono outline-none"
                  />
                  <input
                    type="file"
                    ref={fileInputHeroRef}
                    accept="image/*"
                    onChange={(e) => {
                      handleImageUpload(e.target.files?.[0], 'heroImage', setUploadingHero);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingHero}
                    onClick={() => fileInputHeroRef.current?.click()}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#1E1916] hover:bg-[#342D28] text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingHero ? 'Uploading...' : 'Upload File'}</span>
                  </button>
                </div>

                <CollectionImagePreview
                  src={formData.heroImage}
                  alt="Hero Preview"
                  aspectRatio="aspect-video"
                  maxWidth="max-w-xs"
                  onRemove={() => setFormData({ ...formData, heroImage: '' })}
                />
              </div>

              {/* Card Image */}
              <div className="p-4 bg-white border border-[#E5E0D5] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#4A423B] uppercase">
                    Collection Card Thumbnail
                  </label>
                  <span className="text-[10px] font-mono text-[#8C6320]">Navigation and Category Tile</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={formData.cardImage}
                    onChange={(e) => setFormData({ ...formData, cardImage: e.target.value })}
                    placeholder="/images/gatekeeper-food.jpg or https://..."
                    className="flex-1 px-3 py-2 bg-[#FBF9F5] border border-[#D5CEC2] rounded-lg text-xs font-mono outline-none"
                  />
                  <input
                    type="file"
                    ref={fileInputCardRef}
                    accept="image/*"
                    onChange={(e) => {
                      handleImageUpload(e.target.files?.[0], 'cardImage', setUploadingCard);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingCard}
                    onClick={() => fileInputCardRef.current?.click()}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#1E1916] hover:bg-[#342D28] text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingCard ? 'Uploading...' : 'Upload File'}</span>
                  </button>
                </div>

                <CollectionImagePreview
                  src={formData.cardImage}
                  alt="Card Preview"
                  aspectRatio="aspect-square"
                  maxWidth="max-w-[160px]"
                  onRemove={() => setFormData({ ...formData, cardImage: '' })}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#EAE4D9]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#7A7167]">
                {activeTab !== 'images' ? 'Tab ' + (activeTab === 'identity' ? '1 of 4' : activeTab === 'content' ? '2 of 4' : '3 of 4') : 'Ready to save'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs text-[#5C544C] hover:bg-[#EFEAE1] rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingHero || uploadingCard}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#722F37] text-white text-xs font-semibold rounded-xl hover:bg-[#5C242C] disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
              >
                {submitting ? 'Saving to Database...' : isEditing ? 'Save Changes' : 'Create Collection'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminCollections() {
  const { adminFetch } = useAdminStore();
  const [collections, setCollections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);

  // Body Scroll Lock when modal is active
  useBodyScrollLock(Boolean(modalOpen));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalOpen) {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/collections');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load collections');
      setCollections(json.collections || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;
    const q = searchQuery.toLowerCase().trim();
    return collections.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.slug && c.slug.toLowerCase().includes(q)) ||
        (c.tagline && c.tagline.toLowerCase().includes(q)) ||
        (c.heroHeading && c.heroHeading.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [collections, searchQuery]);

  const handleToggle = async (col) => {
    try {
      const res = await adminFetch(`/api/admin/collections/${col.id}/toggle`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to toggle collection status');
      invalidateCollectionsCache();
      fetchCollections();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (col) => {
    if (col.productCount > 0) {
      alert(`Cannot delete '${col.name}' because it contains ${col.productCount} active products. Please delete or reassign its products first.`);
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to delete the collection '${col.name}'? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const res = await adminFetch(`/api/admin/collections/${col.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete collection');
      invalidateCollectionsCache();
      fetchCollections();
    } catch (err) {
      alert(err.message);
    }
  };

  const openCreateModal = () => {
    setModalInitialData(null);
    setModalOpen(true);
  };

  const openEditModal = (col) => {
    setModalInitialData(col);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton collection="admin" fallbackTo="/admin" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Collections Architecture</h1>
          <p className="text-xs text-[#7A7167]">
            Active categories displayed across Amoga luxury navigation, Gatekeeper hub, and storefronts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCollections}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded-lg text-xs font-medium text-[#4A423B] hover:bg-[#EFEAE1] cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#8C6320]" />
            <span>Refresh</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#722F37] text-white rounded-lg text-xs font-semibold hover:bg-[#5C242C] cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Category</span>
          </button>
        </div>
      </div>

      {/* Live Search Toolbar */}
      <div className="bg-[#FBF9F5] p-3 rounded-lg border border-[#E5E0D5] flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C8377]" />
          <input
            type="text"
            placeholder="Search collections by name, slug, tagline, or copy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:outline-none focus:border-[#722F37]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[#8C8377] hover:text-[#1A1817] p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="text-[11px] font-mono text-[#7A7167]">
          {filteredCollections.length} of {collections.length} collection{collections.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#7A7167]">
          <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading collections...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
          {error}
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#7A7167] bg-[#FBF9F5] rounded-2xl border border-[#E5E0D5] space-y-2">
          <p>No collections matching &ldquo;{searchQuery}&rdquo;</p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-3.5 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#722F37] hover:bg-[#F5F2EB]"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCollections.map((col) => {
            const tc = col.themeConfig || {};
            const colAccent = col.accentColor || tc.accentColor || '#722F37';

            return (
              <div
                key={col.id}
                className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#E5E0D5] flex flex-col justify-between space-y-4 hover:border-[#D5CEC2] transition-colors shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: colAccent }}
                        title={`Accent Color: ${colAccent}`}
                      />
                      <h2 className="font-serif text-lg font-bold text-[#1A1817]">{col.name}</h2>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider ${
                        col.isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {col.isActive ? 'Active on Storefront' : 'Hidden'}
                    </span>
                  </div>

                  {col.tagline && (
                    <p className="text-xs font-mono mt-1.5 italic text-[#8C6320]">
                      "{col.tagline}"
                    </p>
                  )}

                  {col.heroHeading && col.heroHeading !== col.name && (
                    <p className="text-xs font-serif font-bold text-[#1A1817] mt-1">
                      Hero: {col.heroHeading}
                    </p>
                  )}

                  <p className="text-xs text-[#5C544C] mt-2 line-clamp-2 leading-relaxed">
                    {col.description || 'Curated luxury collection crafted for discernment.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#EAE4D9] flex items-center justify-between text-xs text-[#7A7167]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#E5E0D5]">
                        /{col.slug}
                      </span>
                      <a
                        href={`/${col.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#722F37] hover:underline flex items-center gap-1 text-[11px]"
                        title="Preview Storefront"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </a>
                    </div>

                    <span className="font-sans font-semibold tabular-nums text-[#1A1817]">
                      {col.productCount} Registered Products
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F0ECE1]">
                  <button
                    type="button"
                    onClick={() => handleToggle(col)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      col.isActive
                        ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        : 'bg-emerald-700 text-white hover:bg-emerald-800'
                    }`}
                  >
                    {col.isActive ? 'Deactivate' : 'Publish Collection'}
                  </button>

                  <div className="flex items-center gap-2">
                    {col.productCount === 0 && !['food', 'tea', 'sarees', 'jewellery'].includes(col.id) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(col)}
                        className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete Empty Collection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditModal(col)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D5CEC2] rounded-lg text-xs font-medium text-[#4A423B] hover:bg-[#EFEAE1] cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#8C6320]" />
                      <span>Edit Content & Theme</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shared Create / Edit Modal Dialog */}
      <CollectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchCollections}
        initialData={modalInitialData}
      />
    </div>
  );
}
