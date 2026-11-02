import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  ChevronRight,
  Info,
  X,
  Sparkles,
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

    // Populate candidate details into form
    setFormData((prev) => {
      const updated = {
        ...prev,
        hsnCode: candidate.hsnCode,
        taxVerificationStatus: 'VERIFIED',
      };

      if (candidate.verifiedRateMapping) {
        updated.gstRate = String(candidate.verifiedRateMapping.gstRate.toFixed(2));
        updated.taxTreatment = candidate.verifiedRateMapping.taxTreatment || 'TAXABLE';
        updated.cessRate = String((candidate.verifiedRateMapping.cessRate || 0).toFixed(2));
      } else if (candidate.verifiedGstRate !== null && candidate.verifiedGstRate !== undefined) {
        updated.gstRate = String(Number(candidate.verifiedGstRate).toFixed(2));
        updated.taxTreatment = 'TAXABLE';
      }

      return updated;
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Autocomplete Bar */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-[#4A423B] flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[#722F37]" />
            <span>Search HSN / SAC Reference Catalogue</span>
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
              <span className="text-[10px] text-[#722F37] font-medium">Click to select HSN code</span>
            </div>

            {candidates.map((cand) => {
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

                  <div className="flex items-center justify-between text-[10px] text-[#7A7167] pt-1">
                    <span className="text-stone-500">
                      HSN Code: <strong className="text-stone-700 font-mono">{cand.hsnCode}</strong>
                    </span>
                    <span className="text-stone-400 font-mono">
                      Page {cand.sourcePage || 'N/A'} • {cand.sourceFileName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Classification & Tax Configuration Card */}
      <div className="p-4 bg-white rounded-lg border border-[#E5E0D5] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-3">
          <div>
            <h3 className="text-xs font-bold text-[#1A1817] uppercase tracking-wider">
              HSN & GST Configuration
            </h3>
            <p className="text-[11px] text-[#7A7167]">
              Specify the HSN code and applicable statutory GST rate for this product
            </p>
          </div>
          {formData.hsnCode && (
            <span className="text-xs font-mono font-medium text-[#722F37] bg-[#722F37]/10 px-2 py-0.5 rounded">
              HSN {formData.hsnCode}
            </span>
          )}
        </div>

        {/* Selected Candidate Details if populated */}
        {selectedCandidate && (
          <div className="p-3 bg-[#FBF9F5] rounded-md border border-[#EAE4D9] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#722F37]">Selected Reference:</span>
              <span className="text-[10px] font-mono text-stone-500">Ref: {selectedCandidate.sourceFileName}</span>
            </div>
            <p className="text-xs text-[#1A1817] font-medium">
              [{selectedCandidate.hsnCode}] {selectedCandidate.description}
            </p>
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
            <span>Material, Ingredients & Classification Notes:</span>
            <span className="text-[10px] text-stone-500 font-normal">Optional Documentation</span>
          </label>
          <textarea
            rows={2}
            value={formData.taxNotes || ''}
            onChange={(e) => setFormData((p) => ({ ...p, taxNotes: e.target.value }))}
            placeholder="Document composition, ingredients, or official reference (e.g. 100% Pure Mulberry Silk handloom; Schedule I)..."
            className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] focus:border-[#722F37] outline-none font-sans"
          />
        </div>
      </div>
    </div>
  );
}
