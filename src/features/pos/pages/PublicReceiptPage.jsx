import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Receipt,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Building,
  Phone,
  Mail,
} from 'lucide-react';
import { posApi } from '../../admin/pos/services/posApiClient';
import amogaLogo from '../../../assets/images/amoga-logo.png';

export function PublicReceiptPage() {
  const { token } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchReceipt() {
      if (!token) return;
      setLoading(true);
      try {
        const res = await posApi.getPublicReceipt(token);
        if (res?.receipt) {
          setReceipt(res.receipt);
        } else {
          setError('Tax receipt not found or expired.');
        }
      } catch (err) {
        console.error('Failed to load public receipt:', err);
        setError(err.message || 'Tax receipt could not be loaded.');
      } finally {
        setLoading(false);
      }
    }
    fetchReceipt();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F0] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-[#762F39] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-serif text-sm font-semibold text-stone-700">Verifying Digital Tax Invoice...</p>
        <p className="text-xs text-stone-500 font-mono mt-1">Amoga Cryptographic Receipt Ledger</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-[#F8F6F0] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-md border border-stone-200 text-center">
          <AlertCircle className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h2 className="font-serif text-lg font-bold text-stone-800">Invoice Unavailable</h2>
          <p className="text-xs text-stone-500 mt-1 mb-4">
            {error || 'This receipt link is invalid, incomplete, or has expired.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#762F39] text-white hover:bg-[#8C3A46] transition"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Visit Amoga Storefront</span>
          </Link>
        </div>
      </div>
    );
  }

  const seller = receipt.sellerDetails || {
    tradeName: 'Amoga',
    legalName: 'Amoga Luxury Private Limited',
    gstin: '33AAACA1234A1Z5',
    pan: 'AAACA1234A',
    addressLine1: '108, Heritage Walk, Anna Salai',
    addressLine2: 'T. Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600017',
    contactPhone: '+91 98765 43210',
    contactEmail: 'amogastores05@gmail.com',
  };

  const formattedDate = new Date(receipt.createdAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="min-h-screen bg-[#F8F6F0] py-6 sm:py-12 px-3 sm:px-6 print:p-0 print:bg-white">
      
      {/* Top Banner (Hidden in print) */}
      <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <img src={amogaLogo} alt="Amoga" className="h-8 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          <span className="font-serif text-lg font-bold text-[#762F39] tracking-wider">AMOGA</span>
        </Link>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 shadow-sm transition active:scale-95"
        >
          <Printer className="w-4 h-4 text-[#762F39]" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Main Printable Tax Invoice Card */}
      <div
        id="public-tax-invoice"
        className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-stone-200/90 overflow-hidden print:shadow-none print:border-none print:rounded-none"
      >
        {/* Luxury Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#762F39] via-[#8C3A46] to-[#5C232B] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide">Official Tax Invoice</h1>
            <p className="text-xs text-amber-200/90 font-mono tracking-widest uppercase mt-0.5">
              Verified Point of Sale Receipt
            </p>
          </div>

          <div className="text-center sm:text-right bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-300 block">Bill Number</span>
            <span className="font-mono text-sm sm:text-base font-bold text-amber-200">{receipt.billNumber}</span>
          </div>
        </div>

        {/* Seller & Customer Meta Grid */}
        <div className="p-6 sm:p-8 border-b border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-stone-600">
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Seller Details
            </span>
            <p className="font-bold text-sm text-stone-900 font-serif">{seller.legalName}</p>
            <p className="text-stone-600">{seller.addressLine1}, {seller.addressLine2 ? `${seller.addressLine2}, ` : ''}{seller.city} - {seller.pincode}</p>
            <p className="font-mono text-stone-800 font-semibold mt-1">
              GSTIN: <span className="tracking-wide text-[#762F39]">{seller.gstin}</span>
            </p>
            <p className="font-mono text-stone-500 text-[11px]">PAN: {seller.pan}</p>

            {receipt.stallEvent && (
              <div className="mt-2.5 inline-block bg-amber-50 text-[#8C6320] px-2.5 py-1 rounded-lg text-[11px] font-medium border border-amber-200">
                📍 {receipt.stallEvent.name} ({receipt.stallEvent.venue})
              </div>
            )}
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Invoice Meta
            </span>
            <p className="font-mono text-stone-800 font-medium">
              Date & Time: <span className="font-bold">{formattedDate}</span>
            </p>
            <p className="mt-1">
              Customer: <span className="font-semibold text-stone-900">{receipt.customerName || 'Walk-in Customer'}</span>
            </p>
            {receipt.customerPhone && (
              <p className="font-mono text-stone-600">Mobile: +91 {receipt.customerPhone}</p>
            )}
            <p className="font-mono text-[11px] text-stone-500 mt-1">
              Payment: <span className="font-bold text-emerald-800">{receipt.paymentMethod || 'CASH'}</span> ({receipt.paymentStatus || 'PAID'})
            </p>
            {receipt.paymentReference && (
              <p className="font-mono text-[10px] text-stone-500">Ref: {receipt.paymentReference}</p>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="p-6 sm:p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-stone-600 uppercase font-bold text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-2 text-center font-mono">HSN</th>
                  <th className="py-3 px-2 text-center font-mono">GST Rate</th>
                  <th className="py-3 px-2 text-center font-mono">Qty</th>
                  <th className="py-3 px-3 text-right font-mono">Unit (₹)</th>
                  <th className="py-3 px-3 text-right font-mono">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(receipt.items || []).map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-stone-50/50">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-stone-900 leading-tight">{it.productName}</p>
                      {it.variantName && (
                        <p className="text-[11px] text-stone-500 font-mono">Variant: {it.variantName}</p>
                      )}
                      <p className="text-[10px] text-stone-400 font-mono">SKU: {it.sku}</p>
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-stone-600">
                      {it.hsnCode || '5007'}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-stone-600">
                      {Number(it.gstRate || 5)}%
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-stone-900">
                      {it.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-stone-700">
                      ₹{Number(it.unitPrice).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                      ₹{Number(it.lineTotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Card */}
          <div className="mt-6 pt-4 border-t border-stone-200 flex flex-col items-end">
            <div className="w-full sm:w-80 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal (Incl. GST):</span>
                <span className="font-mono">₹{Number(receipt.subtotal).toFixed(2)}</span>
              </div>

              {Number(receipt.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount {receipt.discountReason ? `(${receipt.discountReason})` : ''}:</span>
                  <span className="font-mono">-₹{Number(receipt.discountAmount).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-500 text-[11px] pt-1 border-t border-dashed border-stone-200">
                <span>Deconstructed Taxable Value:</span>
                <span className="font-mono">₹{Number(receipt.taxableAmount).toFixed(2)}</span>
              </div>

              {Number(receipt.cgstAmount) > 0 && (
                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>CGST (Intra-state):</span>
                  <span className="font-mono">₹{Number(receipt.cgstAmount).toFixed(2)}</span>
                </div>
              )}

              {Number(receipt.sgstAmount) > 0 && (
                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>SGST (Intra-state):</span>
                  <span className="font-mono">₹{Number(receipt.sgstAmount).toFixed(2)}</span>
                </div>
              )}

              {Number(receipt.igstAmount) > 0 && (
                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>IGST (Inter-state):</span>
                  <span className="font-mono">₹{Number(receipt.igstAmount).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-700 font-medium text-[11px] pt-1 border-t border-stone-200">
                <span>Total Statutory GST Included:</span>
                <span className="font-mono">₹{Number(receipt.totalTaxAmount).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-baseline pt-3 border-t-2 border-stone-900 text-stone-900">
                <span className="font-serif font-bold text-base">TOTAL PAID:</span>
                <span className="font-mono font-bold text-2xl text-[#762F39]">
                  ₹{Number(receipt.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Statutory Footer */}
          <div className="mt-8 pt-6 border-t border-dashed border-stone-200 text-center text-[11px] text-stone-500 leading-relaxed">
            <p className="font-serif italic text-stone-700 mb-1">
              Thank you for choosing Amoga. Handcrafted Indian heritage, wholesome living.
            </p>
            <p>
              This is a computer-generated tax invoice. Product prices include statutory GST under Indian Tax Laws.
            </p>
            <p className="font-mono text-[10px] text-stone-400 mt-2">
              Invoice Hash Token: {token}
            </p>
          </div>
        </div>

      </div>

      {/* Customer Support Footer (Hidden in print) */}
      <div className="max-w-2xl mx-auto mt-6 text-center text-xs text-stone-500 print:hidden">
        <p>Need assistance with this invoice? Contact Amoga Atelier:</p>
        <div className="flex items-center justify-center gap-4 mt-1 font-mono text-stone-700">
          <span>📞 {seller.contactPhone}</span>
          <span>
            <a href={`mailto:${seller.contactEmail || 'amogastores05@gmail.com'}`} className="hover:underline">
              ✉️ {seller.contactEmail || 'amogastores05@gmail.com'}
            </a>
          </span>
        </div>
      </div>

    </div>
  );
}
