import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Clock,
  FileText,
  ChevronRight,
  Info,
  X,
  Sparkles,
  Lock,
} from 'lucide-react';

export function HsnClassificationWidget({
  productName = '',
  formData,
  setFormData,
  currentUser,
  adminFetch,
  fieldErrors = {},
}) {
  const [searchQuery, setSearchQuery] = useState(productName || formData.hsnCode || '');
  const [candidates, setCandidates] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const isAuthorized = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'CATALOGUE_MANAGER';
  const debounceTimerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync initial query if product name changes and search box was empty
  useEffect(() => {
    if (productName && !searchQuery) {
      setSearchQuery(productName);
    }
  }, [productName]);

  // Handle clicking outside dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  const executeSearch = async (term) => {
    const clean = String(term || '').trim();
    if (!clean || clean.length < 2) {
      setCandidates([]);
      setShowDropdown(false);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      const collectionParam = formData?.collectionId ? `&collectionId=${encodeURIComponent(formData.collectionId)}` : '';
      const res = await adminFetch(`/api/admin/tax/hsn/search?q=${encodeURIComponent(clean)}&limit=15${collectionParam}`);
      const data = await res.json();
      if (res.ok && data.candidates) {
        setCandidates(data.candidates);
        setShowDropdown(true);
      } else {
        setCandidates([]);
      }
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val);
    }, 300);
  };

  // Safe manual selection of a candidate
  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setShowDropdown(false);

    // Populate candidate details into form without blind auto-confirmation
    setFormData((prev) => {
      const updated = {
        ...prev,
        hsnCode: candidate.hsnCode,
      };

      // If exact verified rate master mapping exists, adopt it
      if (candidate.verifiedRateMapping) {
        updated.gstRate = String(candidate.verifiedRateMapping.gstRate.toFixed(2));
        updated.taxTreatment = candidate.verifiedRateMapping.taxTreatment || 'TAXABLE';
        updated.cessRate = String((candidate.verifiedRateMapping.cessRate || 0).toFixed(2));
      } else if (candidate.verifiedGstRate !== null && candidate.verifiedGstRate !== undefined) {
        updated.gstRate = String(Number(candidate.verifiedGstRate).toFixed(2));
        updated.taxTreatment = 'TAXABLE';
      }

      // Keep status as PENDING_VERIFICATION until authorized user explicitly confirms
      if (prev.taxVerificationStatus !== 'VERIFIED') {
        updated.taxVerificationStatus = 'PENDING_VERIFICATION';
      }

      return updated;
    });
  };

  // Confirm classification by authorized user
  const handleConfirmClassification = () => {
    if (!isAuthorized) return;
    setFormData((prev) => ({
      ...prev,
      taxVerificationStatus: 'VERIFIED',
      taxConfirmedBy: currentUser?.email || 'admin@amoga.com',
      taxConfirmedAt: new Date().toISOString(),
    }));
  };

  // Mark as pending
  const handleMarkAsPending = () => {
    setFormData((prev) => ({
      ...prev,
      taxVerificationStatus: 'PENDING_VERIFICATION',
      taxConfirmedBy: null,
      taxConfirmedAt: null,
    }));
  };

  const isVerified = formData.taxVerificationStatus === 'VERIFIED';
  const isPending = formData.taxVerificationStatus === 'PENDING_VERIFICATION' || !formData.taxVerificationStatus;

  return (
    <div className="space-y-4">
      {/* Search & Autocomplete Bar */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-[#4A423B] flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[#722F37]" />
            <span>Search HSN / SAC Reference Catalogue & Verified Rate Master</span>
          </label>
          <span className="text-[10px] text-[#7A7167] font-mono">
            Source: HSN_SAC.pdf (21,935 Records)
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => {
              if (candidates.length > 0) setShowDropdown(true);
            }}
            placeholder="Type product name (e.g. Soup mix, Millet mix, Silk saree, Herbal tea, Silver pendant) or HSN code..."
            className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#D5CEC2] rounded-lg text-xs text-[#1A1817] focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] outline-none shadow-sm font-sans"
          />
          <Search className="w-4 h-4 text-[#8C8377] absolute left-3 top-3 pointer-events-none" />

          {isSearching && (
            <div className="w-4 h-4 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin absolute right-3 top-3" />
          )}

          {searchQuery && !isSearching && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCandidates([]);
                setShowDropdown(false);
              }}
              className="absolute right-3 top-3 text-[#8C8377] hover:text-[#1A1817]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Helper Prompts */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[10px] text-[#8C8377]">Suggested test terms:</span>
          {['Soup mix', 'Millet mix', 'Rice podi', 'Herbal tea', 'Hibiscus tea', 'Silk saree', 'Cotton saree', 'Silver pendant'].map(
            (term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setSearchQuery(term);
                  executeSearch(term);
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-[#F0ECE1] hover:bg-[#E4DDCF] text-[#4A423B] transition-colors"
              >
                {term}
              </button>
            )
          )}
        </div>

        {/* Autocomplete Dropdown List */}
        {showDropdown && candidates.length > 0 && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-lg border border-[#D5CEC2] shadow-xl max-h-80 overflow-y-auto divide-y divide-[#F0ECE1]">
            <div className="p-2 bg-[#FBF9F5] text-[11px] text-[#7A7167] font-medium flex items-center justify-between border-b border-[#EAE4D9]">
              <span>Found {candidates.length} classification candidates:</span>
              <span className="text-[10px] text-amber-700 italic">Select relevant candidate to review</span>
            </div>

            {candidates.map((cand) => {
              const hasRate = Boolean(cand.verifiedRateMapping);
              return (
                <div
                  key={`${cand.hsnCode}-${cand.description}`}
                  onClick={() => handleSelectCandidate(cand)}
                  className="p-3 hover:bg-[#F9F7F2] transition-colors cursor-pointer group flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#722F37] bg-[#722F37]/10 px-2 py-0.5 rounded border border-[#722F37]/20">
                        {cand.hsnCode}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                        {cand.level}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          cand.confidence === 'HIGH'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : cand.confidence === 'MEDIUM'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-stone-50 text-stone-600 border border-stone-200'
                        }`}
                      >
                        {cand.confidence} Match
                      </span>
                    </div>

                    <button
                      type="button"
                      className="text-[11px] font-medium text-[#722F37] group-hover:underline flex items-center gap-0.5 shrink-0"
                    >
                      <span>Select</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-[#2A2522] leading-relaxed line-clamp-2">
                    {cand.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#7A7167] pt-1">
                    <span>Reason: <strong className="text-stone-700">{cand.matchReason}</strong></span>

                    {hasRate ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified GST: {cand.verifiedRateMapping.gstRate}% ({cand.verifiedRateMapping.taxTreatment})
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        No Rate in Master (Manual Review)
                      </span>
                    )}

                    <span className="text-stone-400 font-mono ml-auto">
                      Page {cand.sourcePage || 'N/A'} • {cand.sourceFileName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Classification Review & Verification Card */}
      <div className="p-4 bg-white rounded-lg border border-[#E5E0D5] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE4D9] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${isVerified ? 'text-emerald-600' : 'text-amber-600'}`} />
            <div>
              <h3 className="text-xs font-bold text-[#1A1817] uppercase tracking-wider">
                Assisted Classification Status
              </h3>
              <p className="text-[11px] text-[#7A7167]">
                Statutory confirmation required before enabling live taxable sales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                VERIFIED & APPROVED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                CLASSIFICATION PENDING
              </span>
            )}
          </div>
        </div>

        {/* Selected Candidate Details if populated */}
        {selectedCandidate && (
          <div className="p-3 bg-[#FBF9F5] rounded-md border border-[#EAE4D9] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#722F37]">Official Reference Details:</span>
              <span className="text-[10px] font-mono text-stone-500">Ref: {selectedCandidate.sourceFileName}</span>
            </div>
            <p className="text-xs text-[#1A1817] font-medium">
              [{selectedCandidate.hsnCode}] {selectedCandidate.description}
            </p>
            {selectedCandidate.verifiedRateMapping && (
              <div className="text-[11px] text-[#4A423B] bg-white p-2 rounded border border-[#E5E0D5] flex flex-col gap-0.5">
                <div className="font-semibold text-emerald-800">
                  Statutory Mapping: {selectedCandidate.verifiedRateMapping.gstRate}% GST ({selectedCandidate.verifiedRateMapping.taxTreatment})
                </div>
                <div className="text-[10px] text-[#7A7167]">
                  Authority: {selectedCandidate.verifiedRateMapping.officialSource || 'CBIC Central Tax Rate Schedule'}
                </div>
                <div className="text-[10px] text-stone-500 font-mono">
                  Verified by: {selectedCandidate.verifiedRateMapping.verifiedBy} on {new Date(selectedCandidate.verifiedRateMapping.verifiedAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Editable Tax Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#4A423B] mb-1">
              HSN Code <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              name="hsnCode"
              value={formData.hsnCode || ''}
              onChange={(e) => {
                setFormData((p) => ({ ...p, hsnCode: e.target.value.trim() }));
              }}
              placeholder="e.g. 5007"
              maxLength={8}
              className={`w-full px-3 py-2 bg-white border rounded text-xs font-mono text-[#1A1817] outline-none ${
                fieldErrors.hsnCode ? 'border-rose-400 bg-rose-50/20' : 'border-[#D5CEC2] focus:border-[#722F37]'
              }`}
            />
            {fieldErrors.hsnCode && <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.hsnCode}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A423B] mb-1">
              Statutory GST Rate (%) <span className="text-rose-600">*</span>
            </label>
            <select
              name="gstRate"
              value={formData.gstRate !== '' && formData.gstRate !== null ? Number(formData.gstRate).toFixed(2) : ''}
              onChange={(e) => {
                setFormData((p) => ({ ...p, gstRate: e.target.value }));
              }}
              className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
            >
              <option value="">-- Select GST Rate --</option>
              <option value="0.00">0% (Nil / Exempt)</option>
              <option value="3.00">3% (Silver & Jewellery)</option>
              <option value="5.00">5% (Sarees, Teas, Basic Food)</option>
              <option value="12.00">12% (Food Mixes, Dried Fruit)</option>
              <option value="18.00">18% (Soups, Herbal Preparations)</option>
              <option value="28.00">28% (Luxury items)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A423B] mb-1">Tax Treatment</label>
            <select
              name="taxTreatment"
              value={formData.taxTreatment || 'TAXABLE'}
              onChange={(e) => {
                setFormData((p) => ({ ...p, taxTreatment: e.target.value }));
              }}
              className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
            >
              <option value="TAXABLE">Taxable Supply</option>
              <option value="NIL_RATED">Nil Rated (0%)</option>
              <option value="EXEMPT">Exempt Supply</option>
              <option value="NON_GST">Non-GST Supply</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A423B] mb-1">Price Includes GST</label>
            <select
              name="isTaxInclusive"
              value={formData.isTaxInclusive ? 'true' : 'false'}
              onChange={(e) => setFormData((p) => ({ ...p, isTaxInclusive: e.target.value === 'true' }))}
              className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none"
            >
              <option value="true">Yes (Tax-Inclusive Pricing)</option>
              <option value="false">No (Tax-Exclusive Pricing)</option>
            </select>
          </div>
        </div>

        {/* Classification Notes & Composition Rationale */}
        <div>
          <label className="block text-xs font-semibold text-[#4A423B] mb-1 flex items-center justify-between">
            <span>Material, Ingredients & Classification Rationale Notes:</span>
            <span className="text-[10px] text-stone-500 font-normal">Audit Trail Documentation</span>
          </label>
          <textarea
            rows={2}
            value={formData.taxNotes || ''}
            onChange={(e) => setFormData((p) => ({ ...p, taxNotes: e.target.value }))}
            placeholder="Document composition, ingredients, or official CBIC notification reference (e.g. 100% Pure Mulberry Silk handloom; Schedule I Sl. No. 201)..."
            className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none font-sans"
          />
        </div>

        {/* Confirmation Metadata Display */}
        {isVerified && formData.taxConfirmedBy && (
          <div className="p-2.5 bg-emerald-50/70 rounded border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Confirmed by <strong>{formData.taxConfirmedBy}</strong></span>
            </span>
            <span className="font-mono text-emerald-700">
              {formData.taxConfirmedAt ? new Date(formData.taxConfirmedAt).toLocaleString() : ''}
            </span>
          </div>
        )}

        {/* Action Buttons: Confirm vs Mark as Pending */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EAE4D9]">
          <div className="text-[11px] text-[#7A7167]">
            {isAuthorized ? (
              <span className="text-stone-600">
                You are logged in as <strong>{currentUser?.role}</strong> and authorized to approve GST classifications.
              </span>
            ) : (
              <span className="text-amber-800 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Only Super Admin or Catalogue Manager can approve classifications.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAsPending}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer ${
                isPending
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                  : 'bg-white hover:bg-[#F0ECE1] text-[#4A423B] border-[#D5CEC2]'
              }`}
            >
              Mark as Pending Review
            </button>

            <button
              type="button"
              disabled={!isAuthorized || !formData.hsnCode}
              onClick={handleConfirmClassification}
              className={`px-4 py-1.5 text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                isVerified
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : !isAuthorized || !formData.hsnCode
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-[#722F37] hover:bg-[#5C242B] text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isVerified ? 'Classification Confirmed' : 'Confirm & Approve Classification'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
