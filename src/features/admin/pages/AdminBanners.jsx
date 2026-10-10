import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function AdminBanners() {
  const { adminFetch } = useAdminStore();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    mobileImageUrl: '',
    ctaLabel: '',
    ctaLink: '',
    displayOrder: 0,
    isPublished: true,
  });

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/banners');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load banners');
      setBanners(json.banners);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      imageUrl: '',
      mobileImageUrl: '',
      ctaLabel: '',
      ctaLink: '',
      displayOrder: banners.length + 1,
      isPublished: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBanner(b);
    setFormData({
      title: b.title,
      subtitle: b.subtitle || '',
      imageUrl: b.imageUrl,
      mobileImageUrl: b.mobileImageUrl || '',
      ctaLabel: b.ctaLabel || '',
      ctaLink: b.ctaLink || '',
      displayOrder: b.displayOrder,
      isPublished: b.isPublished,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = editingBanner
        ? `/api/admin/banners/${editingBanner.id}`
        : '/api/admin/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      const res = await adminFetch(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save banner');

      setModalOpen(false);
      fetchBanners();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await adminFetch(`/api/admin/banners/${id}/toggle`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to toggle status');
      fetchBanners();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this homepage banner?')) return;
    try {
      const res = await adminFetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete banner');
      fetchBanners();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Homepage Banners</h1>
          <p className="text-xs text-[#7A7167]">
            Curate hero banners, promotional showcases, and editorial photography for the storefront
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white text-xs font-semibold rounded shadow-sm hover:bg-[#5E2229] transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Banner</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#7A7167]">
          <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading homepage banners...</span>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-rose-800 bg-rose-50">{error}</div>
      ) : banners.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#7A7167]">No banners configured yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((b) => (
            <div
              key={b.id}
              className="bg-[#FBF9F5] rounded-lg border border-[#E5E0D5] overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 bg-[#EAE4D9]">
                  <img
                    src={b.imageUrl}
                    alt={b.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/600x300/f5f2eb/1a1817?text=Amoga+Banner';
                    }}
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/70 text-white backdrop-blur-xs">
                      Order: #{b.displayOrder}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium backdrop-blur-xs ${
                        b.isPublished ? 'bg-emerald-800/80 text-white' : 'bg-stone-800/80 text-stone-200'
                      }`}
                    >
                      {b.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-serif text-lg font-bold text-[#1A1817]">{b.title}</h3>
                  {b.subtitle && <p className="text-xs text-[#5C544C] leading-relaxed">{b.subtitle}</p>}
                  {b.ctaLabel && (
                    <p className="text-[11px] font-mono text-[#8C6320] pt-1">
                      CTA: {b.ctaLabel} → {b.ctaLink}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#F5F2EB] border-t border-[#E5E0D5] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggle(b.id)}
                  className={`px-3 py-1 text-xs rounded font-medium ${
                    b.isPublished ? 'bg-stone-200 text-stone-700' : 'bg-emerald-700 text-white'
                  }`}
                >
                  {b.isPublished ? 'Unpublish' : 'Publish'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(b)}
                    className="p-1.5 text-[#5C544C] hover:text-[#722F37] hover:bg-[#EAE4D9] rounded"
                    title="Edit Banner"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 text-[#8C8377] hover:text-rose-700 hover:bg-rose-50 rounded"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-[#1A1817]">
              {editingBanner ? 'Edit Homepage Banner' : 'Create Homepage Banner'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Headline Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. The Royal Harvest of Kashmir & Malabar"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Subtitle / Editorial Note
                </label>
                <textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Pure single-origin spices, cold-pressed elixirs & sacred botanical harvests."
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Banner Image URL *
                </label>
                <input
                  type="text"
                  required
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://... or /images/banners/hero.jpg"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">CTA Label</label>
                  <input
                    type="text"
                    value={formData.ctaLabel}
                    onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
                    placeholder="e.g. Explore Collection"
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">CTA Link</label>
                  <input
                    type="text"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                    placeholder="e.g. /food or /tea"
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs font-mono"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="rounded border-[#D5CEC2] text-[#722F37]"
                    />
                    <span>Publish Immediately</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#5C544C] hover:bg-[#EFEAE1] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#722F37] text-white text-xs font-semibold rounded hover:bg-[#5E2229]"
                >
                  {submitting ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
