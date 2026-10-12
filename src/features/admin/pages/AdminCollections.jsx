import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Edit2, Plus, Trash2, ExternalLink } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { BackButton } from '../../../components/ui/BackButton';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';

export function AdminCollections() {
  const { adminFetch } = useAdminStore();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [editingCol, setEditingCol] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Create Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [newCol, setNewCol] = useState({
    name: '',
    slug: '',
    tagline: '',
    description: '',
  });

  // Lock body and background scrolling when any modal is open
  useBodyScrollLock(Boolean(isCreating || editingCol));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isCreating) setIsCreating(false);
        if (editingCol) setEditingCol(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreating, editingCol]);

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

  const handleToggle = async (col) => {
    try {
      const res = await adminFetch(`/api/admin/collections/${col.id}/toggle`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to toggle collection status');
      fetchCollections();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCol) return;
    setSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/collections/${editingCol.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingCol.name,
          tagline: editingCol.tagline,
          description: editingCol.description,
          accentColor: editingCol.accentColor,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to update collection');
      }
      setEditingCol(null);
      fetchCollections();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newCol.name.trim()) return;
    setSubmitting(true);
    try {
      const cleanSlug = (newCol.slug || newCol.name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const res = await adminFetch('/api/admin/collections', {
        method: 'POST',
        body: JSON.stringify({
          ...newCol,
          slug: cleanSlug,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create collection');

      setIsCreating(false);
      setNewCol({
        name: '',
        slug: '',
        tagline: '',
        description: '',
        accentColor: '#C5A46D',
      });
      fetchCollections();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
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
      fetchCollections();
    } catch (err) {
      alert(err.message);
    }
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
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#722F37] text-white rounded-lg text-xs font-semibold hover:bg-[#5C242C] cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Category</span>
          </button>
        </div>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              className="bg-[#FBF9F5] p-6 rounded-xl border border-[#E5E0D5] flex flex-col justify-between space-y-4 hover:border-[#D5CEC2] transition-colors shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
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

                <p className="text-xs font-mono mt-1.5 italic text-[#8C6320]">
                  "{col.tagline || 'Timeless Craftsmanship'}"
                </p>
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
                    onClick={() => setEditingCol({ ...col })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D5CEC2] rounded-lg text-xs font-medium text-[#4A423B] hover:bg-[#EFEAE1] cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#8C6320]" />
                    <span>Edit Copy & Color</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NEW COLLECTION MODAL */}
      {isCreating && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreating(false);
          }}
          onWheel={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            data-modal-dialog
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl overscroll-contain max-h-[90vh] overflow-y-auto select-text"
          >
            <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#1A1817]">
                Create New Collection / Category
              </h3>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={newCol.name}
                  onChange={(e) => {
                    const nameVal = e.target.value;
                    const autoSlug = nameVal
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    setNewCol((prev) => ({
                      ...prev,
                      name: nameVal,
                      slug: prev.slug === '' || prev.slug === autoSlug.slice(0, -1) ? autoSlug : prev.slug,
                    }));
                  }}
                  placeholder="e.g. Fine Fragrances, Artisan Pottery"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  URL Slug (Auto-generated) *
                </label>
                <div className="flex items-center">
                  <span className="px-2.5 py-2 bg-[#EFEAE1] border border-r-0 border-[#D5CEC2] rounded-l-lg text-xs font-mono text-[#7A7167]">
                    amoga.com/
                  </span>
                  <input
                    type="text"
                    value={newCol.slug}
                    onChange={(e) => setNewCol({ ...newCol, slug: e.target.value })}
                    placeholder="fragrances"
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded-r-lg text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Tagline / Subheading
                </label>
                <input
                  type="text"
                  value={newCol.tagline}
                  onChange={(e) => setNewCol({ ...newCol, tagline: e.target.value })}
                  placeholder="e.g. Rare Botanical Extractions"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newCol.description}
                  onChange={(e) => setNewCol({ ...newCol, description: e.target.value })}
                  placeholder="Artisanal fragrances distilled from sacred botanical harvests..."
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE4D9]">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-1.5 text-xs text-[#5C544C] hover:bg-[#EFEAE1] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#722F37] text-white text-xs font-semibold rounded-lg hover:bg-[#5E2229] disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COLLECTION MODAL */}
      {editingCol && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overscroll-contain select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingCol(null);
          }}
          onWheel={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            data-modal-dialog
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl overscroll-contain max-h-[90vh] overflow-y-auto select-text"
          >
            <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#1A1817]">
                Edit Collection: {editingCol.name}
              </h3>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Collection Title
                </label>
                <input
                  type="text"
                  value={editingCol.name}
                  onChange={(e) => setEditingCol({ ...editingCol, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Tagline / Subheading
                </label>
                <input
                  type="text"
                  value={editingCol.tagline || ''}
                  onChange={(e) => setEditingCol({ ...editingCol, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingCol.description || ''}
                  onChange={(e) => setEditingCol({ ...editingCol, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE4D9]">
                <button
                  type="button"
                  onClick={() => setEditingCol(null)}
                  className="px-3.5 py-1.5 text-xs text-[#5C544C] hover:bg-[#EFEAE1] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#722F37] text-white text-xs font-semibold rounded-lg hover:bg-[#5E2229] disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
