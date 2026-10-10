import React, { useState, useEffect } from 'react';
import { RefreshCw, Edit2 } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function AdminCollections() {
  const { adminFetch } = useAdminStore();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [editingCol, setEditingCol] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/collections');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load collections');
      setCollections(json.collections);
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
      if (!res.ok) throw new Error('Failed to toggle collection');
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
      if (!res.ok) throw new Error('Failed to update collection');
      setEditingCol(null);
      fetchCollections();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Collections Management</h1>
          <p className="text-xs text-[#7A7167]">
            Active categories displayed across Amoga luxury navigation and storefronts
          </p>
        </div>
        <button
          onClick={fetchCollections}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FBF9F5] border border-[#D5CEC2] rounded text-xs font-medium text-[#4A423B] hover:bg-[#EFEAE1] w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#8C6320]" />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#7A7167]">
          <div className="w-6 h-6 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading collections...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded text-xs text-red-800">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: col.accentColor || '#722F37' }}
                    />
                    <h2 className="font-serif text-lg font-bold text-[#1A1817]">{col.name}</h2>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      col.isActive
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {col.isActive ? 'Active on Storefront' : 'Hidden'}
                  </span>
                </div>

                <p className="text-xs font-mono text-[#8C6320] mt-1 italic">
                  "{col.tagline || 'Timeless Craftsmanship'}"
                </p>
                <p className="text-xs text-[#5C544C] mt-2 line-clamp-2 leading-relaxed">
                  {col.description || 'Curated luxury collection crafted for discernment.'}
                </p>

                <div className="mt-4 pt-3 border-t border-[#EAE4D9] flex items-center justify-between text-xs text-[#7A7167] font-mono">
                  <span>Slug: /{col.slug}</span>
                  <span className="font-semibold text-[#1A1817]">
                    {col.productCount} Registered Products
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleToggle(col)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    col.isActive
                      ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      : 'bg-emerald-700 text-white hover:bg-emerald-800'
                  }`}
                >
                  {col.isActive ? 'Deactivate' : 'Publish Collection'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditingCol(col)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#D5CEC2] rounded text-xs font-medium text-[#4A423B] hover:bg-[#EFEAE1]"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#8C6320]" />
                  <span>Edit Copy</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Collection Modal */}
      {editingCol && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FBF9F5] border border-[#E5E0D5] rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-[#1A1817]">
              Edit Collection: {editingCol.name}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Collection Title
                </label>
                <input
                  type="text"
                  value={editingCol.name}
                  onChange={(e) => setEditingCol({ ...editingCol, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
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
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
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
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1">
                  Accent Color Hex
                </label>
                <input
                  type="text"
                  value={editingCol.accentColor || ''}
                  onChange={(e) => setEditingCol({ ...editingCol, accentColor: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCol(null)}
                  className="px-3 py-1.5 text-xs text-[#5C544C] hover:bg-[#EFEAE1] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#722F37] text-white text-xs font-semibold rounded hover:bg-[#5E2229]"
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
