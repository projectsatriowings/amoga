import React, { useState } from 'react';
import {
  X,
  Printer,
  Share2,
  Download,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Receipt,
  FileText,
} from 'lucide-react';
import amogaLogo from '../../../../assets/images/amoga-logo.png';

/**
 * Professional Amoga Tax Invoice / POS Receipt Modal
 * Supports:
 * - Full A4 Standard Print
 * - 80mm / 58mm Thermal Receipt Roll Print
 * - Instant WhatsApp Dispatch (Meta API or Verified Manual Fallback)
 * - Public Unguessable Token Link Sharing
 */
export function PosReceiptModal({
  isOpen,
  onClose,
  sale,
  onResendWhatsApp,
  isSendingWhatsApp = false,
}) {
  const [printFormat, setPrintFormat] = useState('80mm'); // '80mm' | '58mm' | 'a4'
  const [copiedLink, setCopiedLink] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [overridePhone, setOverridePhone] = useState(sale?.customerPhone || '');
  const [manualLink, setManualLink] = useState(null);

  if (!isOpen || !sale) return null;

  const publicUrl = `${window.location.origin}/receipt/${sale.publicReceiptToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const seller = sale.sellerDetails || {
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

  const formattedDate = new Date(sale.createdAt || Date.now()).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-[#FAF9F5] w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        
        {/* Modal Header (Hidden during native printing) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#762F39] via-[#8C3A46] to-[#5C232B] text-white flex items-center justify-between shadow-md print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Receipt className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg tracking-wide font-medium">Amoga Tax Invoice</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-200 font-mono px-2 py-0.5 rounded-full border border-amber-300/30">
                  {sale.paymentStatus || 'PAID'}
                </span>
              </div>
              <p className="text-xs text-stone-200 font-mono tracking-wider">{sale.billNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Selector */}
            <div className="hidden sm:flex bg-black/20 p-1 rounded-lg border border-white/15 text-xs font-mono">
              <button
                type="button"
                onClick={() => setPrintFormat('80mm')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  printFormat === '80mm' ? 'bg-white text-[#762F39] font-bold shadow-sm' : 'text-stone-300 hover:text-white'
                }`}
              >
                80mm Thermal
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('58mm')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  printFormat === '58mm' ? 'bg-white text-[#762F39] font-bold shadow-sm' : 'text-stone-300 hover:text-white'
                }`}
              >
                58mm Thermal
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  printFormat === 'a4' ? 'bg-white text-[#762F39] font-bold shadow-sm' : 'text-stone-300 hover:text-white'
                }`}
              >
                A4 Standard
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0 print:overflow-visible bg-[#F8F6F0]">
          
          <div
            id="amoga-pos-receipt"
            className={`mx-auto bg-white border border-stone-200 p-6 shadow-sm print:border-none print:shadow-none ${
              printFormat === '58mm'
                ? 'max-w-[280px] text-[11px] font-mono leading-tight'
                : printFormat === '80mm'
                ? 'max-w-[360px] text-[12px] font-mono leading-snug'
                : 'max-w-2xl text-[13px] font-sans'
            }`}
          >
            {/* Header Branding */}
            <div className="text-center pb-4 border-b border-dashed border-stone-300">
              <div className="flex justify-center mb-2">
                <img
                  src={amogaLogo}
                  alt="Amoga"
                  className="h-10 w-auto object-contain filter drop-shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <h2 className="font-serif text-xl tracking-wider font-bold text-[#762F39]">
                {seller.tradeName || 'AMOGA'}
              </h2>
              <p className="text-[11px] text-stone-600 font-medium">{seller.legalName}</p>
              <p className="text-[11px] text-stone-500">
                {seller.addressLine1}, {seller.addressLine2 ? `${seller.addressLine2}, ` : ''}{seller.city} - {seller.pincode}
              </p>
              <p className="text-[11px] font-mono text-stone-700 font-semibold mt-1">
                GSTIN: <span className="tracking-wide">{seller.gstin}</span>
              </p>
              <p className="text-[10px] text-stone-500 font-mono">PAN: {seller.pan}</p>
              
              {sale.stallEvent && (
                <div className="mt-2 bg-stone-100 py-1 px-2 rounded text-[11px] text-[#762F39] font-medium border border-stone-200">
                  📍 {sale.stallEvent.name} ({sale.stallEvent.venue})
                </div>
              )}
            </div>

            {/* Bill Metadata */}
            <div className="py-3 border-b border-dashed border-stone-300 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-stone-500 block">TAX INVOICE / BILL NO:</span>
                <span className="font-bold font-mono text-stone-900">{sale.billNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-stone-500 block">DATE & TIME:</span>
                <span className="font-mono text-stone-800">{formattedDate}</span>
              </div>
              <div>
                <span className="text-stone-500 block">CUSTOMER:</span>
                <span className="font-semibold text-stone-800">
                  {sale.customerName || 'Walk-in Customer'}
                </span>
                {sale.customerPhone && (
                  <span className="block font-mono text-stone-600">📱 +91 {sale.customerPhone}</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-stone-500 block">CASHIER / STAFF:</span>
                <span className="font-medium text-stone-800">
                  {sale.staff?.name || sale.staffName || 'Stall Staff'}
                </span>
                <span className="block text-[10px] text-stone-500 font-mono">POS Terminal 01</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-3 border-b border-dashed border-stone-300">
              <div className="grid grid-cols-12 text-[10px] uppercase font-bold text-stone-500 border-b border-stone-200 pb-1 mb-2 tracking-wider">
                <div className="col-span-6">Item / Variant</div>
                <div className="col-span-2 text-center">HSN/Rate</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Total (₹)</div>
              </div>

              <div className="space-y-2">
                {(sale.items || []).map((it, idx) => (
                  <div key={it.id || idx} className="grid grid-cols-12 text-[11px] items-start">
                    <div className="col-span-6 pr-1">
                      <p className="font-medium text-stone-900 leading-tight">{it.productName}</p>
                      {it.variantName && (
                        <p className="text-[10px] text-stone-500 font-mono">({it.variantName})</p>
                      )}
                      <p className="text-[9px] text-stone-400 font-mono">SKU: {it.sku}</p>
                    </div>
                    <div className="col-span-2 text-center text-[10px] font-mono text-stone-600">
                      <span>{it.hsnCode || '5007'}</span>
                      <span className="block text-[9px] text-stone-400">{Number(it.gstRate || 5)}%</span>
                    </div>
                    <div className="col-span-2 text-center font-mono text-stone-800">
                      {it.quantity} × {Number(it.unitPrice).toFixed(0)}
                    </div>
                    <div className="col-span-2 text-right font-mono font-semibold text-stone-900">
                      {Number(it.lineTotal).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax & Financial Breakdown */}
            <div className="py-3 border-b border-dashed border-stone-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-stone-600">
                <span>Gross Subtotal (Incl. GST):</span>
                <span className="font-mono">₹{Number(sale.subtotal).toFixed(2)}</span>
              </div>

              {Number(sale.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount {sale.discountReason ? `(${sale.discountReason})` : ''}:</span>
                  <span className="font-mono">-₹{Number(sale.discountAmount).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-500 text-[10px] pt-1">
                <span>Taxable Value (Deconstructed):</span>
                <span className="font-mono">₹{Number(sale.taxableAmount).toFixed(2)}</span>
              </div>

              {Number(sale.cgstAmount) > 0 && (
                <div className="flex justify-between text-stone-500 text-[10px]">
                  <span>CGST (Intra-state):</span>
                  <span className="font-mono">₹{Number(sale.cgstAmount).toFixed(2)}</span>
                </div>
              )}

              {Number(sale.sgstAmount) > 0 && (
                <div className="flex justify-between text-stone-500 text-[10px]">
                  <span>SGST (Intra-state):</span>
                  <span className="font-mono">₹{Number(sale.sgstAmount).toFixed(2)}</span>
                </div>
              )}

              {Number(sale.igstAmount) > 0 && (
                <div className="flex justify-between text-stone-500 text-[10px]">
                  <span>IGST (Inter-state):</span>
                  <span className="font-mono">₹{Number(sale.igstAmount).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600 font-medium text-[10px] pt-1 border-t border-stone-200">
                <span>Total Statutory GST Included:</span>
                <span className="font-mono">₹{Number(sale.totalTaxAmount).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-baseline pt-2 text-base font-bold text-stone-900 border-t-2 border-stone-800">
                <span className="font-serif">TOTAL NET AMOUNT:</span>
                <span className="font-mono text-lg text-[#762F39]">₹{Number(sale.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2.5 border-b border-dashed border-stone-300 text-[11px] font-mono flex justify-between items-center">
              <div>
                <span className="text-stone-500">PAYMENT METHOD: </span>
                <span className="font-bold text-stone-800">{sale.paymentMethod || 'CASH'}</span>
                {sale.paymentReference && (
                  <span className="block text-[10px] text-stone-500">Ref: {sale.paymentReference}</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-stone-500">PAID: </span>
                <span className="font-bold text-stone-800">₹{Number(sale.amountPaid || sale.totalAmount).toFixed(2)}</span>
                {Number(sale.changeDue) > 0 && (
                  <span className="block text-[10px] text-emerald-600 font-bold">Change Due: ₹{Number(sale.changeDue).toFixed(2)}</span>
                )}
              </div>
            </div>

            {/* Statutory Footer & QR Placeholder */}
            <div className="text-center pt-3 text-[10px] text-stone-500 leading-tight">
              <p className="font-serif italic text-stone-600 mb-1">
                "Pure ingredients, traditional craftsmanship, authentic luxury."
              </p>
              <p>Prices are inclusive of all statutory Goods and Services Taxes.</p>
              <p>Tax invoice generated authoritatively by Amoga POS Atelier.</p>
              <p className="font-mono text-[9px] text-stone-400 mt-2">
                Verify receipt online: {publicUrl}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer (Hidden during native printing) */}
        <div className="p-4 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition"
              title="Copy secure link to public tax receipt"
            >
              {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied' : 'Copy Link'}
            </button>

            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition"
              title="View in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Online</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp Send Action */}
            <button
              type="button"
              onClick={() => {
                setWhatsAppModalOpen(true);
              }}
              disabled={isSendingWhatsApp}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>

            {/* Print Action */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#762F39] hover:bg-[#8C3A46] text-white shadow-sm transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>

      </div>

      {/* WhatsApp Dispatch Confirmation Modal */}
      {whatsAppModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">WhatsApp Bill Delivery</h3>
                  <p className="text-xs text-stone-500 font-mono">Bill {sale.billNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsAppModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Recipient Indian Mobile (+91)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-stone-500 font-mono">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={overridePhone}
                    onChange={(e) => setOverridePhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-3 py-2 text-sm border border-stone-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Valid 10-digit mobile number required for dispatch.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                <p className="font-semibold text-stone-800">What the customer receives:</p>
                <p className="font-mono text-[11px] text-stone-500 bg-white p-2 rounded border border-stone-200">
                  🧾 AMOGA — STORE RECEIPT<br/>
                  Bill No: {sale.billNumber}<br/>
                  Total Paid: ₹{Number(sale.totalAmount).toLocaleString('en-IN')}<br/>
                  Tax Invoice: {publicUrl}
                </p>
                <p className="text-[10px] text-stone-400 italic">
                  * Transactional receipt with opt-out ("reply STOP").
                </p>
              </div>

              {manualLink && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <p className="font-bold mb-1">Direct WhatsApp Link Ready:</p>
                  <p className="text-[11px] text-stone-600 mb-2">
                    Cloud API credentials are not set up. Click below to launch WhatsApp with the pre-filled invoice message:
                  </p>
                  <a
                    href={manualLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg font-medium text-xs hover:bg-emerald-700 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open WhatsApp Web / App</span>
                  </a>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setWhatsAppModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingWhatsApp || overridePhone.length !== 10}
                onClick={async () => {
                  if (onResendWhatsApp) {
                    const res = await onResendWhatsApp(sale.id, overridePhone);
                    if (res?.whatsAppResult?.actionUrl) {
                      setManualLink(res.whatsAppResult.actionUrl);
                    } else if (res?.success) {
                      setWhatsAppModalOpen(false);
                    }
                  }
                }}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSendingWhatsApp ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
                <span>Send WhatsApp Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Native Print Styles for 80mm / 58mm / A4 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #amoga-pos-receipt, #amoga-pos-receipt * {
            visibility: visible;
          }
          #amoga-pos-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 8px;
            box-shadow: none;
            border: none;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>
    </div>
  );
}
