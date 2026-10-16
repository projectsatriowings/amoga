import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit2,
  Power,
  X,
  FileText,
  Calendar,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function AdminTaxRates() {
  const { adminFetch, admin } = useAdminStore();
  const [rates, setRates] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [activeItem, setActiveItem] = useState(null);
  const [modalForm, setModalForm] = useState({
    hsnCode: '',
    description: '',
    gstRate: '5.00',
    taxTreatment: 'TAXABLE',
    cessRate: '0.00',
    sourceReference: 'CBIC GST Rate Schedule / HSN_SAC Reference',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    notes: '',
    status: 'ACTIVE',
  });
  const [modalError, setModalError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Quick statutory HSN lookup in modal
  const [hsnLookupResults, setHsnLookupResults] = useState([]);
  const [isLookingUpHsn, setIsLookingUpHsn] = useState(false);

  const isAuthorized = admin?.role === 'SUPER_ADMIN' || admin?.role === 'CATALOGUE_MANAGER';

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', String(pagination.page));
      params.append('limit', String(pagination.limit));

      const res = await adminFetch(`/api/admin/tax/rates?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch GST rate master');

      setRates(data.records || []);
      if (data.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [pagination.page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchRates();
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setActiveItem(null);
    setModalForm({
      hsnCode: '',
      description: '',
      gstRate: '5.00',
      taxTreatment: 'TAXABLE',
      cessRate: '0.00',
      sourceReference: 'CBIC GST Rate Schedule / HSN_SAC Reference',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      notes: '',
      status: 'ACTIVE',
    });
    setHsnLookupResults([]);
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setActiveItem(item);
    setModalForm({
      hsnCode: item.hsnCode,
      description: item.description,
      gstRate: String(item.gstRate),
      taxTreatment: item.taxTreatment || 'TAXABLE',
      cessRate: String(item.cessRate || 0),
      sourceReference: item.sourceReference || '',
      effectiveFrom: item.effectiveFrom ? item.effectiveFrom.split('T')[0] : '',
      effectiveTo: item.effectiveTo ? item.effectiveTo.split('T')[0] : '',
      notes: item.notes || '',
      status: item.status || 'ACTIVE',
    });
    setHsnLookupResults([]);
    setModalError(null);
    setShowModal(true);
  };

  const handleHsnLookup = async (code) => {
    if (!code || code.length < 2) {
      setHsnLookupResults([]);
      return;
    }
    try {
      setIsLookingUpHsn(true);
      const res = await adminFetch(`/api/admin/tax/hsn/search?q=${encodeURIComponent(code)}&limit=6`);
      const data = await res.json();
      if (data.candidates) {
        setHsnLookupResults(data.candidates);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLookingUpHsn(false);
    }
  };

  const handleSelectHsnCandidate = (cand) => {
    setModalForm((prev) => ({
      ...prev,
      hsnCode: cand.hsnCode,
      description: prev.description || cand.description,
    }));
    setHsnLookupResults([]);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!isAuthorized) {
      setModalError('Only Super Admins or Catalogue Leads have permission to alter statutory rate mappings.');
      return;
    }
    if (!modalForm.hsnCode?.trim()) {
      setModalError('HSN code is required.');
      return;
    }
    if (modalForm.gstRate === '' || isNaN(Number(modalForm.gstRate))) {
      setModalError('Valid GST Rate is required.');
      return;
    }

    try {
      setIsSaving(true);
      setModalError(null);

      const endpoint = modalMode === 'create'
        ? '/api/admin/tax/rates'
        : `/api/admin/tax/rates/${activeItem.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const payload = {
        hsnCode: modalForm.hsnCode.trim(),
        description: modalForm.description.trim(),
        gstRate: Number(modalForm.gstRate),
        taxTreatment: modalForm.taxTreatment,
        cessRate: Number(modalForm.cessRate) || 0,
        sourceReference: modalForm.sourceReference?.trim() || null,
        effectiveFrom: modalForm.effectiveFrom ? new Date(modalForm.effectiveFrom).toISOString() : null,
        effectiveTo: modalForm.effectiveTo ? new Date(modalForm.effectiveTo).toISOString() : null,
        notes: modalForm.notes?.trim() || null,
        status: modalForm.status,
      };

      const res = await adminFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save rate master mapping');

      setShowModal(false);
      fetchRates();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDeactivate = async (item) => {
    if (!isAuthorized) {
      alert('Only Super Admins or Catalogue Leads can deactivate statutory rate mappings.');
      return;
    }
    const isCurrentlyActive = item.status === 'ACTIVE';
    const confirmAction = window.confirm(
      isCurrentlyActive
        ? `Are you sure you want to deactivate mapping for HSN ${item.hsnCode}? It will no longer auto-apply during classification.`
        : `Are you sure you want to reactivate mapping for HSN ${item.hsnCode}?`
    );
    if (!confirmAction) return;

    try {
      const nextStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
      const res = await adminFetch(`/api/admin/tax/rates/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update mapping status');
      fetchRates();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#EAE4D9]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#722F37]" />
            <h1 className="font-serif text-2xl font-bold text-[#1A1817]">
              Verified GST Rate Master
            </h1>
          </div>
          <p className="text-xs text-[#7A7167] mt-1">
            Statutory CBIC rate mappings cross-referenced with the 21,935 HSN/SAC catalogue extracted from <code className="font-mono text-[#722F37]">HSN_SAC.pdf</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white text-xs font-semibold rounded shadow-sm hover:bg-[#5C252C] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Approved Rate Mapping</span>
        </button>
      </div>

      {/* Statutory Disclaimer Alert */}
      <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <p className="font-semibold text-amber-950">
            Statutory Compliance Notice (CGST & IGST Acts):
          </p>
          <p className="mt-0.5">
            The raw catalogue extracted from <strong>HSN_SAC.pdf</strong> provides classification nomenclature only.
            GST rates and tax treatments must be verified against current CBIC notifications and confirmed by an authorized
            accountant or GST practitioner before enabling products for live taxable checkout.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FBF9F5] p-4 rounded-lg border border-[#E5E0D5] flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7A7167] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by HSN code (e.g. 5007, 2104) or description..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-[#1A1817] text-white text-xs font-medium rounded hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#7A7167]" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING_REVIEW">Pending Review</option>
          </select>
        </div>
      </div>

      {/* Table of Rate Mappings */}
      <div className="bg-white rounded-lg border border-[#E5E0D5] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#7A7167]">
            <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#722F37]" />
            Loading rate master mappings...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            {error}
          </div>
        ) : rates.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#7A7167]">
            <FileText className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            <p className="font-medium text-stone-600">No GST rate mappings found.</p>
            <p className="mt-1">Try adjusting your search criteria or add a new statutory mapping.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8F5EE] border-b border-[#E5E0D5] text-[#4A423B] font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">HSN Code</th>
                  <th className="py-3 px-4">Classification Description</th>
                  <th className="py-3 px-4 text-center">GST Rate</th>
                  <th className="py-3 px-4 text-center">Tax Treatment</th>
                  <th className="py-3 px-4">Statutory Source & Period</th>
                  <th className="py-3 px-4">Verification Audit</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D9]">
                {rates.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FCFAF7] transition-colors">
                    {/* HSN Code */}
                    <td className="py-3 px-4 font-mono font-bold text-[#722F37] whitespace-nowrap">
                      {item.hsnCode}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 max-w-xs text-stone-800">
                      <p className="font-medium truncate" title={item.description}>
                        {item.description}
                      </p>
                      {item.notes && (
                        <p className="text-[10px] text-stone-500 italic mt-0.5 truncate" title={item.notes}>
                          Note: {item.notes}
                        </p>
                      )}
                    </td>

                    {/* Rate */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#722F37]/10 text-[#722F37]">
                        {Number(item.gstRate).toFixed(2)}%
                      </span>
                      {Number(item.cessRate) > 0 && (
                        <span className="block text-[10px] text-amber-700 mt-0.5">
                          +{Number(item.cessRate)}% Cess
                        </span>
                      )}
                    </td>

                    {/* Treatment */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="text-[11px] font-mono text-stone-700">
                        {item.taxTreatment || 'TAXABLE'}
                      </span>
                    </td>

                    {/* Source & Period */}
                    <td className="py-3 px-4 text-stone-600 text-[11px]">
                      <p className="font-medium truncate max-w-xs" title={item.sourceReference}>
                        {item.sourceReference || 'Statutory Schedule'}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        Eff: {item.effectiveFrom ? new Date(item.effectiveFrom).toLocaleDateString() : 'Immediate'}
                        {item.effectiveTo ? ` to ${new Date(item.effectiveTo).toLocaleDateString()}` : ' onwards'}
                      </p>
                    </td>

                    {/* Verification Audit */}
                    <td className="py-3 px-4 text-[11px] text-stone-600">
                      <p className="font-mono text-[10px] text-[#722F37]">
                        {item.verifiedBy || 'System Seed'}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {item.verifiedAt ? new Date(item.verifiedAt).toLocaleDateString() : 'Initial Setup'}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {item.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : item.status === 'PENDING_REVIEW' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-stone-600 hover:text-[#722F37] hover:bg-stone-100 rounded transition-colors cursor-pointer"
                          title="Edit mapping"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleDeactivate(item)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            item.status === 'ACTIVE'
                              ? 'text-stone-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-stone-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={item.status === 'ACTIVE' ? 'Deactivate mapping' : 'Reactivate mapping'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {pagination.totalPages > 1 && (
          <div className="p-3 bg-[#F8F5EE] border-t border-[#E5E0D5] flex items-center justify-between text-xs text-stone-600">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total approved mappings)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-2.5 py-1 bg-white border border-[#D5CEC2] rounded disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-2.5 py-1 bg-white border border-[#D5CEC2] rounded disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E5E0D5] w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-[#FBF9F5] border-b border-[#EAE4D9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#722F37]" />
                <h3 className="font-serif text-base font-bold text-[#1A1817]">
                  {modalMode === 'create' ? 'Add Approved GST Rate Mapping' : `Edit Rate Mapping: HSN ${activeItem?.hsnCode}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveModal} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* HSN Code & Lookup */}
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                  HSN Code <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={modalForm.hsnCode}
                    disabled={modalMode === 'edit'}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setModalForm((p) => ({ ...p, hsnCode: val }));
                      handleHsnLookup(val);
                    }}
                    placeholder="e.g. 5007 or 2104"
                    maxLength={8}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs font-mono text-[#1A1817] disabled:bg-stone-100"
                  />
                  {isLookingUpHsn && (
                    <Clock className="w-4 h-4 animate-spin text-[#722F37] absolute right-3 top-2.5" />
                  )}
                </div>

                {/* Candidate recommendations from PDF */}
                {hsnLookupResults.length > 0 && modalMode === 'create' && (
                  <div className="mt-1.5 p-2 bg-[#FBF9F5] border border-[#D5CEC2] rounded-md space-y-1">
                    <p className="text-[10px] text-[#7A7167] font-semibold uppercase">
                      Candidates found in HSN_SAC.pdf:
                    </p>
                    {hsnLookupResults.map((cand) => (
                      <button
                        type="button"
                        key={cand.id}
                        onClick={() => handleSelectHsnCandidate(cand)}
                        className="w-full text-left p-1.5 hover:bg-white rounded border border-transparent hover:border-[#D5CEC2] flex items-center justify-between text-xs cursor-pointer"
                      >
                        <span className="font-mono font-bold text-[#722F37]">{cand.hsnCode}</span>
                        <span className="truncate max-w-xs text-[11px] text-stone-700">{cand.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                  Classification Description <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={modalForm.description}
                  onChange={(e) => setModalForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Official classification description (e.g., Woven fabrics of silk or silk waste)"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817]"
                />
              </div>

              {/* Rates and Tax Treatment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                    GST Rate (%) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={modalForm.gstRate}
                    onChange={(e) => setModalForm((p) => ({ ...p, gstRate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817]"
                  >
                    <option value="0.00">0% (Nil / Exempt)</option>
                    <option value="3.00">3% (Silver & Jewellery)</option>
                    <option value="5.00">5% (Sarees, Teas, Basic Food)</option>
                    <option value="12.00">12% (Food Mixes, Soups)</option>
                    <option value="18.00">18% (Standard Rate)</option>
                    <option value="28.00">28% (Luxury items)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                    Tax Treatment
                  </label>
                  <select
                    value={modalForm.taxTreatment}
                    onChange={(e) => setModalForm((p) => ({ ...p, taxTreatment: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817]"
                  >
                    <option value="TAXABLE">Taxable</option>
                    <option value="EXEMPT">Exempt</option>
                    <option value="NIL_RATED">Nil Rated</option>
                    <option value="NON_GST">Non-GST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                    Cess (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={modalForm.cessRate}
                    onChange={(e) => setModalForm((p) => ({ ...p, cessRate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs font-mono text-[#1A1817]"
                  />
                </div>
              </div>

              {/* Source Reference */}
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                  Statutory Reference / Notification No.
                </label>
                <input
                  type="text"
                  value={modalForm.sourceReference}
                  onChange={(e) => setModalForm((p) => ({ ...p, sourceReference: e.target.value }))}
                  placeholder="e.g. Notification No. 01/2017-Central Tax (Rate), S.No. 201"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817]"
                />
              </div>

              {/* Effective Dates & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                    Effective From
                  </label>
                  <input
                    type="date"
                    value={modalForm.effectiveFrom}
                    onChange={(e) => setModalForm((p) => ({ ...p, effectiveFrom: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                    Effective To (Optional)
                  </label>
                  <input
                    type="date"
                    value={modalForm.effectiveTo}
                    onChange={(e) => setModalForm((p) => ({ ...p, effectiveTo: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                    Status
                  </label>
                  <select
                    value={modalForm.status}
                    onChange={(e) => setModalForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817]"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING_REVIEW">Pending Review</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] mb-1">
                  Auditor / Legal Notes
                </label>
                <input
                  type="text"
                  value={modalForm.notes}
                  onChange={(e) => setModalForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Verified against GST Council 53rd meeting rate recommendations"
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#EAE4D9] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-[#D5CEC2] text-stone-700 text-xs font-medium rounded hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#722F37] text-white text-xs font-semibold rounded shadow-sm hover:bg-[#5C252C] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSaving ? 'Saving...' : modalMode === 'create' ? 'Create Mapping' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
