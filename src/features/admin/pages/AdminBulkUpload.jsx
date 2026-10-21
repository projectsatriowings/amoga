import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  X,
  FileCheck,
  Package,
  Layers,
  Boxes,
  ShieldCheck,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { BackButton } from '../../../components/ui/BackButton';
import { invalidateProductsCache } from '../../../hooks/useProducts';

export function AdminBulkUpload() {
  const { adminFetch } = useAdminStore();

  // Mode and Settings
  const [importMode, setImportMode] = useState('CREATE_NEW'); // 'CREATE_NEW' | 'UPDATE_EXISTING'
  const [selectedCollection, setSelectedCollection] = useState('all');

  // File Upload State
  const [file, setFile] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Validation & Processing State
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [activePreviewTab, setActivePreviewTab] = useState('products'); // 'products' | 'variants' | 'inventory' | 'errors'

  // Execution State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingErrors, setDownloadingErrors] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  // 1. Download Official Excel Template
  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    setGeneralError(null);
    try {
      const res = await adminFetch('/api/admin/products/import/template');
      if (!res.ok) throw new Error('Failed to download template spreadsheet');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Amoga_Bulk_Product_Import_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setGeneralError(err.message);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // 2. Download Error Report
  const handleDownloadErrorReport = async () => {
    if (!validationResult || !validationResult.errors?.length) return;
    setDownloadingErrors(true);
    try {
      const res = await adminFetch('/api/admin/products/import/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errors: validationResult.errors,
          warnings: validationResult.warnings || [],
        }),
      });
      if (!res.ok) throw new Error('Failed to generate error report');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Amoga_Validation_Errors_Report.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setGeneralError(err.message);
    } finally {
      setDownloadingErrors(false);
    }
  };

  // 3. Handle File Selection
  const processSelectedFile = (selectedFile) => {
    if (!selectedFile) return;
    setGeneralError(null);
    setValidationResult(null);
    setImportSummary(null);

    const validExtensions = ['.xlsx', '.xls'];
    const hasValidExt = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setGeneralError('Please upload a valid Microsoft Excel (.xlsx or .xls) file.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setGeneralError('File size exceeds the 10 MB maximum limit.');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target.result;
      setFileBase64(result);
    };
    reader.onerror = () => {
      setGeneralError('Failed to read the selected file.');
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileBase64(null);
    setValidationResult(null);
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 4. Validate File Action
  const handleValidateFile = async () => {
    if (!fileBase64) return;
    setValidating(true);
    setGeneralError(null);
    setValidationResult(null);

    try {
      const res = await adminFetch('/api/admin/products/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: fileBase64,
          mode: importMode,
          selectedCollection,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Validation request failed');

      setValidationResult(json);
      if (json.errors && json.errors.length > 0) {
        setActivePreviewTab('errors');
      } else if (importMode === 'INITIAL_INVENTORY') {
        setActivePreviewTab('inventory');
      } else {
        setActivePreviewTab('products');
      }
    } catch (err) {
      setGeneralError(err.message);
    } finally {
      setValidating(false);
    }
  };

  // 5. Execute Import Action
  const handleExecuteImport = async () => {
    if (!validationResult || !validationResult.valid) return;
    setImporting(true);
    setGeneralError(null);

    try {
      const res = await adminFetch('/api/admin/products/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          validationResult,
          mode: importMode,
          selectedCollection,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Import execution failed');

      setImportSummary(json);
      setConfirmModalOpen(false);

      // Invalidate frontend cache so storefront and catalogue immediately reflect changes
      invalidateProductsCache();
    } catch (err) {
      setGeneralError(err.message);
      setConfirmModalOpen(false);
    } finally {
      setImporting(false);
    }
  };

  const hasErrors = Boolean(validationResult && !validationResult.valid);
  const canImport = Boolean(
    validationResult &&
    validationResult.valid &&
    (validationResult.parsedProducts?.length > 0 || validationResult.parsedInventory?.length > 0)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-4">
        <div>
          <BackButton collection="admin" fallbackTo="/admin/products" label="Back to Product Catalogue" />
          <h1 className="font-serif text-2xl font-bold text-[#1A1817] mt-2 flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-[#722F37]" />
            <span>Bulk Product Import</span>
          </h1>
          <p className="text-xs text-[#7A7167] mt-1">
            Import, update, or establish stock across all 4 Amoga collections: Wholesome Pantry, Wellness Tea, Heritage Sarees, Sterling Silver
          </p>
        </div>

        {/* Download Template Button */}
        <button
          type="button"
          onClick={handleDownloadTemplate}
          disabled={downloadingTemplate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E1916] text-[#F5F2EB] text-xs font-semibold rounded shadow-sm hover:bg-[#332C27] transition-colors border border-[#4A4036] cursor-pointer disabled:opacity-50 shrink-0"
        >
          {downloadingTemplate ? (
            <RefreshCw className="w-4 h-4 animate-spin text-[#D1B072]" />
          ) : (
            <Download className="w-4 h-4 text-[#D1B072]" />
          )}
          <span>Download Excel Template (.xlsx)</span>
          <span className="text-[10px] bg-[#3B322B] px-1.5 py-0.5 rounded text-[#D1B072] font-mono">v1.0</span>
        </button>
      </div>

      {generalError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Import Notice</p>
            <p className="mt-0.5">{generalError}</p>
          </div>
          <button type="button" onClick={() => setGeneralError(null)} className="cursor-pointer text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Final Success Summary Card */}
      {importSummary && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-emerald-950">Bulk Import Completed Successfully</h3>
              <p className="text-xs text-emerald-700">All validated products and inventory records have been safely committed.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-white p-3.5 rounded-lg border border-emerald-200">
              <span className="text-[10px] font-semibold text-emerald-800 uppercase block">Products Created</span>
              <span className="text-2xl font-serif font-bold text-emerald-950">{importSummary.summary?.productsCreated || 0}</span>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-emerald-200">
              <span className="text-[10px] font-semibold text-emerald-800 uppercase block">Products Updated</span>
              <span className="text-2xl font-serif font-bold text-emerald-950">{importSummary.summary?.productsUpdated || 0}</span>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-emerald-200">
              <span className="text-[10px] font-semibold text-emerald-800 uppercase block">Variants Created</span>
              <span className="text-2xl font-serif font-bold text-emerald-950">{importSummary.summary?.variantsCreated || 0}</span>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-emerald-200">
              <span className="text-[10px] font-semibold text-emerald-800 uppercase block">Inventory Logs Written</span>
              <span className="text-2xl font-serif font-bold text-emerald-950">{importSummary.summary?.inventoryLogsCreated || 0}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded transition-colors shadow-sm"
            >
              <Package className="w-3.5 h-3.5" />
              <span>View Product Catalogue</span>
            </Link>
            <Link
              to="/admin/inventory"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold rounded transition-colors"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>View Inventory Ledger</span>
            </Link>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-transparent text-emerald-800 hover:underline text-xs font-semibold ml-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Import Another Spreadsheet</span>
            </button>
          </div>
        </div>
      )}

      {/* Configuration & Controls Bar */}
      {!importSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Mode Selection */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E0D5] shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-[#F0EBE1] pb-2">
              <span className="w-5 h-5 rounded-full bg-[#722F37] text-white text-[11px] font-bold flex items-center justify-center">1</span>
              <h3 className="font-serif text-sm font-bold text-[#1A1817]">Select Import Mode</h3>
            </div>

            <div className="space-y-2 pt-1">
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  importMode === 'CREATE_NEW'
                    ? 'border-[#722F37] bg-[#722F37]/5 shadow-xs'
                    : 'border-[#E5E0D5] hover:bg-[#FAF8F5]'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="CREATE_NEW"
                  checked={importMode === 'CREATE_NEW'}
                  onChange={() => {
                    setImportMode('CREATE_NEW');
                    setValidationResult(null);
                  }}
                  className="mt-0.5 text-[#722F37] focus:ring-[#722F37]"
                />
                <div>
                  <span className="text-xs font-bold text-[#1A1817] block">Create New Products</span>
                  <span className="text-[11px] text-[#7A7167] leading-relaxed block mt-0.5">
                    Safe mode. Inserts new products only. Rejects existing identifiers to prevent accidental overwrites.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  importMode === 'UPDATE_EXISTING'
                    ? 'border-[#722F37] bg-[#722F37]/5 shadow-xs'
                    : 'border-[#E5E0D5] hover:bg-[#FAF8F5]'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="UPDATE_EXISTING"
                  checked={importMode === 'UPDATE_EXISTING'}
                  onChange={() => {
                    setImportMode('UPDATE_EXISTING');
                    setValidationResult(null);
                  }}
                  className="mt-0.5 text-[#722F37] focus:ring-[#722F37]"
                />
                <div>
                  <span className="text-xs font-bold text-[#1A1817] block">Update Existing Products</span>
                  <span className="text-[11px] text-[#7A7167] leading-relaxed block mt-0.5">
                    Matches records by Product Code (sourceId) and updates details, descriptions, specs, and variants.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Step 2: Collection Filter & Publication Rules */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E0D5] shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-[#F0EBE1] pb-2">
              <span className="w-5 h-5 rounded-full bg-[#722F37] text-white text-[11px] font-bold flex items-center justify-center">2</span>
              <h3 className="font-serif text-sm font-bold text-[#1A1817]">Collection & Safety Rules</h3>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#4A423B] uppercase mb-1.5">
                  Collection Scope
                </label>
                <select
                  value={selectedCollection}
                  onChange={(e) => {
                    setSelectedCollection(e.target.value);
                    setValidationResult(null);
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded text-xs text-[#1A1817] outline-none focus:border-[#722F37]"
                >
                  <option value="all">All 4 Collections (Universal Multi-Store)</option>
                  <option value="food">Wholesome Pantry (food)</option>
                  <option value="tea">Wellness Tea (tea)</option>
                  <option value="sarees">Heritage Sarees (sarees)</option>
                  <option value="jewellery">Sterling Silver (jewellery)</option>
                </select>
                <p className="text-[10px] text-[#7A7167] mt-1">
                  Choose specific collection if your spreadsheet is targeted to one department.
                </p>
              </div>

              <div className="bg-[#FAF8F5] p-3.5 rounded-lg border border-[#EBE6DC] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1A1817]">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Authoritative Safety Rules</span>
                </div>
                <ul className="text-[11px] text-[#5C544C] space-y-1 pl-4 list-disc">
                  <li>Unpriced products are automatically held in <strong>Draft</strong> mode.</li>
                  <li>Prisma transactions guarantee all-or-nothing persistence.</li>
                  <li>Inventory changes create append-only audit entries.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3: Drag & Drop Upload Zone */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E0D5] shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-[#F0EBE1] pb-2">
                <span className="w-5 h-5 rounded-full bg-[#722F37] text-white text-[11px] font-bold flex items-center justify-center">3</span>
                <h3 className="font-serif text-sm font-bold text-[#1A1817]">Upload Workbook</h3>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-3 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[#722F37] bg-[#722F37]/5'
                    : file
                    ? 'border-emerald-400 bg-emerald-50/40'
                    : 'border-[#D5CEC2] hover:border-[#722F37] bg-[#FAF8F5]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => processSelectedFile(e.target.files?.[0])}
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-2">
                    <FileCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-[#1A1817] truncate max-w-[240px] mx-auto">{file.name}</p>
                    <p className="text-[10px] text-[#7A7167]">{(file.size / 1024).toFixed(1)} KB • Ready for validation</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <UploadCloud className="w-8 h-8 text-[#8C6320] mx-auto" />
                    <p className="text-xs font-bold text-[#1A1817]">Click to select or drag & drop</p>
                    <p className="text-[10px] text-[#7A7167]">Supported: .xlsx or .xls (Max 10 MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Validate Button */}
            <div className="pt-3">
              {file ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleValidateFile}
                    disabled={validating}
                    className="flex-1 py-2 px-4 bg-[#722F37] text-white text-xs font-semibold rounded hover:bg-[#5E2229] transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {validating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Validating Workbook...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Validate File</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 border border-[#D5CEC2] text-[#7A7167] hover:text-[#1A1817] rounded cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-2 px-4 bg-[#E5E0D5] text-[#8C857B] text-xs font-semibold rounded cursor-not-allowed"
                >
                  Select File to Validate
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation Status Banner */}
      {validationResult && !importSummary && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            validationResult.valid
              ? 'bg-emerald-50/80 border-emerald-300'
              : 'bg-rose-50/80 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {validationResult.valid ? (
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            <div>
              <h4 className="font-serif text-sm font-bold text-[#1A1817]">
                {validationResult.valid ? 'Validation Passed: Ready for Import' : 'Validation Issues Detected'}
              </h4>
              <p className="text-xs text-[#5C544C] mt-0.5">
                {validationResult.valid
                  ? `${validationResult.summary?.totalProducts || 0} Products and ${validationResult.summary?.totalVariants || 0} Variants parsed cleanly with zero blocking errors.`
                  : `${validationResult.errors?.length || 0} blocking errors must be resolved before products can be imported.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasErrors && (
              <button
                type="button"
                onClick={handleDownloadErrorReport}
                disabled={downloadingErrors}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
              >
                {downloadingErrors ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download Error Report (.xlsx)</span>
              </button>
            )}

            {canImport && (
              <button
                type="button"
                onClick={() => setConfirmModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded shadow-sm transition-colors cursor-pointer"
              >
                <span>Import Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabbed Preview Tables */}
      {validationResult && !importSummary && (
        <div className="bg-white rounded-xl border border-[#E5E0D5] shadow-xs overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-[#E5E0D5] bg-[#FAF8F5] px-4 pt-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActivePreviewTab('products')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activePreviewTab === 'products'
                  ? 'border-[#722F37] text-[#722F37] bg-white rounded-t-lg'
                  : 'border-transparent text-[#7A7167] hover:text-[#1A1817]'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products ({validationResult.parsedProducts?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePreviewTab('variants')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activePreviewTab === 'variants'
                  ? 'border-[#722F37] text-[#722F37] bg-white rounded-t-lg'
                  : 'border-transparent text-[#7A7167] hover:text-[#1A1817]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Variants ({validationResult.parsedVariants?.length || 0})</span>
            </button>

            {validationResult.parsedInventory?.length > 0 && (
              <button
                type="button"
                onClick={() => setActivePreviewTab('inventory')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activePreviewTab === 'inventory'
                    ? 'border-[#722F37] text-[#722F37] bg-white rounded-t-lg'
                    : 'border-transparent text-[#7A7167] hover:text-[#1A1817]'
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>Inventory ({validationResult.parsedInventory.length})</span>
              </button>
            )}

            {validationResult.errors?.length > 0 && (
              <button
                type="button"
                onClick={() => setActivePreviewTab('errors')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activePreviewTab === 'errors'
                    ? 'border-rose-600 text-rose-700 bg-white rounded-t-lg'
                    : 'border-transparent text-rose-600 hover:text-rose-800'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>Errors ({validationResult.errors.length})</span>
              </button>
            )}

            {validationResult.warnings?.length > 0 && (
              <button
                type="button"
                onClick={() => setActivePreviewTab('warnings')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activePreviewTab === 'warnings'
                    ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg'
                    : 'border-transparent text-amber-600 hover:text-amber-800'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Warnings ({validationResult.warnings.length})</span>
              </button>
            )}
          </div>

          {/* TAB CONTENT: PRODUCTS PREVIEW */}
          {activePreviewTab === 'products' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] text-[#4A423B] border-b border-[#E5E0D5]">
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Row</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Collection</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Code (sourceId)</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Name</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Category</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Selling Price</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Stock</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Status</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Specs Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {validationResult.parsedProducts?.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-2 px-3 font-mono text-[#7A7167]">#{p.rowNumber}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#722F37]/10 text-[#722F37]">
                          {p.collectionId}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-[#1A1817]">{p.sourceId}</td>
                      <td className="py-2 px-3 font-medium text-[#1A1817] max-w-[200px] truncate">{p.name}</td>
                      <td className="py-2 px-3 text-[#5C544C]">{p.categoryName || p.category}</td>
                      <td className="py-2 px-3 font-mono font-bold text-[#1A1817]">
                        {p.price !== null ? `₹${p.price.toLocaleString('en-IN')}` : <span className="text-amber-700 font-sans italic">Unpriced</span>}
                      </td>
                      <td className="py-2 px-3 font-mono text-[#1A1817]">{p.stockQuantity}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-800'
                          }`}
                        >
                          {p.isActive ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[11px] text-[#7A7167] max-w-[250px] truncate">
                        {Object.entries(p.specs || {})
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' • ') || 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB CONTENT: VARIANTS PREVIEW */}
          {activePreviewTab === 'variants' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] text-[#4A423B] border-b border-[#E5E0D5]">
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Row</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Parent Product Code</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Variant Name</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">SKU</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Type</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Option Value</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Price</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {validationResult.parsedVariants?.map((v, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-2 px-3 font-mono text-[#7A7167]">#{v.rowNumber}</td>
                      <td className="py-2 px-3 font-mono text-[#722F37] font-medium">{v.productCode}</td>
                      <td className="py-2 px-3 font-medium text-[#1A1817]">{v.variantName}</td>
                      <td className="py-2 px-3 font-mono font-bold text-[#1A1817]">{v.sku}</td>
                      <td className="py-2 px-3 text-[#5C544C] capitalize">{v.type}</td>
                      <td className="py-2 px-3 font-mono text-[#5C544C]">{v.optionValue || '-'}</td>
                      <td className="py-2 px-3 font-mono">{v.price ? `₹${v.price}` : 'Default'}</td>
                      <td className="py-2 px-3 font-mono">{v.stockQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB CONTENT: INVENTORY PREVIEW */}
          {activePreviewTab === 'inventory' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] text-[#4A423B] border-b border-[#E5E0D5]">
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Row</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Product Code</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Variant SKU</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">New Stock Count</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Low Stock Threshold</th>
                    <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Audit Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {validationResult.parsedInventory?.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-2 px-3 font-mono text-[#7A7167]">#{inv.rowNumber}</td>
                      <td className="py-2 px-3 font-mono font-bold text-[#1A1817]">{inv.productCode}</td>
                      <td className="py-2 px-3 font-mono text-[#5C544C]">{inv.sku || <span className="italic text-[#8C857B]">(Base Product)</span>}</td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-800">{inv.newStock}</td>
                      <td className="py-2 px-3 font-mono text-[#7A7167]">{inv.threshold ?? '-'}</td>
                      <td className="py-2 px-3 text-[#1A1817] max-w-[300px] truncate">{inv.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB CONTENT: ERRORS LIST */}
          {activePreviewTab === 'errors' && (
            <div className="p-4 space-y-2">
              {validationResult.errors?.map((err, idx) => (
                <div key={idx} className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg flex items-start gap-3 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-rose-950">Sheet: {err.sheet}</span>
                      {err.row > 0 && <span className="font-mono text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded">Row {err.row}</span>}
                      <span className="font-semibold text-rose-900 bg-rose-100/60 px-1.5 py-0.2 rounded">{err.column}</span>
                      <span className="text-[10px] font-mono text-rose-700 ml-auto">{err.code}</span>
                    </div>
                    <p className="text-rose-800 mt-1">{err.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB CONTENT: WARNINGS LIST */}
          {activePreviewTab === 'warnings' && (
            <div className="p-4 space-y-2">
              {validationResult.warnings?.map((warn, idx) => (
                <div key={idx} className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-3 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-amber-950">Sheet: {warn.sheet}</span>
                      {warn.row > 0 && <span className="font-mono text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">Row {warn.row}</span>}
                      <span className="font-semibold text-amber-900 bg-amber-100/60 px-1.5 py-0.2 rounded">{warn.column}</span>
                    </div>
                    <p className="text-amber-800 mt-1">{warn.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-[#E5E0D5] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#722F37]/10 flex items-center justify-center text-[#722F37]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1A1817]">Confirm Product Import</h3>
                <p className="text-xs text-[#7A7167]">Please review before committing to the database.</p>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-lg border border-[#E5E0D5] space-y-2 text-xs text-[#4A423B]">
              <div className="flex justify-between py-1 border-b border-[#F0EBE1]">
                <span className="text-[#7A7167]">Import Mode:</span>
                <span className="font-bold text-[#1A1817]">{importMode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE1]">
                <span className="text-[#7A7167]">Products to Process:</span>
                <span className="font-mono font-bold text-[#1A1817]">{validationResult?.parsedProducts?.length || 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE1]">
                <span className="text-[#7A7167]">Variants to Process:</span>
                <span className="font-mono font-bold text-[#1A1817]">{validationResult?.parsedVariants?.length || 0}</span>
              </div>
              {validationResult?.parsedInventory?.length > 0 && (
                <div className="flex justify-between py-1 border-b border-[#F0EBE1]">
                  <span className="text-[#7A7167]">Inventory Adjustments:</span>
                  <span className="font-mono font-bold text-[#1A1817]">{validationResult?.parsedInventory.length}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-[#7A7167]">Transaction Safety:</span>
                <span className="text-emerald-700 font-semibold">Atomic Transaction (Rollback on failure)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={importing}
                className="px-4 py-2 border border-[#D5CEC2] text-xs font-semibold rounded text-[#5C544C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importing}
                className="px-5 py-2 bg-[#722F37] hover:bg-[#5E2229] text-white text-xs font-bold rounded shadow-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Yes, Commit Import</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
