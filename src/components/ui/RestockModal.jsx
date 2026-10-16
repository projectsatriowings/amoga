import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Mail, Phone, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';

export function RestockModal({ isOpen, onClose, product, selectedVariant = null }) {
  const [channel, setChannel] = useState('EMAIL'); // 'EMAIL' | 'SMS'
  const [destination, setDestination] = useState('');
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setDestination('');
      setConsent(true);
      setError(null);
      setSuccessData(null);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!destination.trim()) {
      setError(channel === 'EMAIL' ? 'Please enter your email address' : 'Please enter your mobile phone number');
      return;
    }

    if (!consent) {
      setError('Please check the consent box to receive notification when this item is restocked');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/products/restock-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.dbId || product.id,
          variantId: selectedVariant?.variantId || selectedVariant?.id || null,
          destination: destination.trim(),
          channel,
          consent: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to register notification request');
      }

      setSuccessData(data);
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !submitting && onClose()}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="restock-modal-title"
          className="relative w-full max-w-md bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#E5E0D5] p-6 sm:p-7 overflow-hidden z-10"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="absolute top-4 right-4 p-2 text-[#7A7167] hover:text-[#1A1817] hover:bg-[#EFEAE1] rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {successData ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-xl font-semibold text-[#1A1817]">
                  {successData.alreadySubscribed ? 'Already Registered' : 'Notification Set'}
                </h3>
                <p className="text-xs text-[#5C544C] leading-relaxed max-w-xs mx-auto">
                  {successData.message}
                </p>
              </div>

              <div className="p-3 bg-[#F0EDE6] rounded-xl border border-[#DFD8CC] text-left text-xs space-y-1">
                <div className="font-medium text-[#1A1817] line-clamp-1">{product.name}</div>
                {selectedVariant && (
                  <div className="text-[#7A7167]">Variant: {selectedVariant.name}</div>
                )}
                <div className="text-[#7A7167] font-mono text-[11px] truncate">
                  Channel: {channel} ({destination})
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-[#1E1916] text-[#F4EBE1] hover:bg-[#2C2520] font-sans font-medium text-xs rounded-xl tracking-wider uppercase transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header */}
              <div className="space-y-1.5 pr-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-mono font-medium">
                  <Bell className="w-3.5 h-3.5 text-amber-700" />
                  <span>Back in Stock Alert</span>
                </div>
                <h3 id="restock-modal-title" className="font-serif text-xl font-bold text-[#1A1817]">
                  Notify Me When Back in Stock
                </h3>
                <p className="text-xs text-[#6B6359] leading-relaxed">
                  Enter your contact details to receive an alert when this product is back in stock.
                </p>
              </div>

              {/* Product Summary Preview */}
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E5E0D5]">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover bg-[#F8F6F0] shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-[#1A1817] truncate">{product.name}</h4>
                  {selectedVariant && (
                    <p className="text-[11px] text-[#7A7167] truncate">
                      Option: <span className="font-medium text-[#1A1817]">{selectedVariant.name}</span>
                    </p>
                  )}
                  <span className="inline-block mt-0.5 text-[10px] font-mono uppercase text-rose-700 font-semibold">
                    Currently Out of Stock
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Channel Selector */}
                <div className="flex rounded-xl bg-[#EFEAE1] p-1 border border-[#DFD8CC]">
                  <button
                    type="button"
                    onClick={() => {
                      setChannel('EMAIL');
                      setError(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      channel === 'EMAIL'
                        ? 'bg-white text-[#1A1817] shadow-2xs font-semibold'
                        : 'text-[#6B6359] hover:text-[#1A1817]'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Address</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChannel('SMS');
                      setError(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      channel === 'SMS'
                        ? 'bg-white text-[#1A1817] shadow-2xs font-semibold'
                        : 'text-[#6B6359] hover:text-[#1A1817]'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>SMS / Mobile</span>
                  </button>
                </div>

                {/* Input field */}
                <div>
                  <label htmlFor="restock-destination" className="block text-xs font-semibold text-[#4A423B] uppercase tracking-wider mb-1">
                    {channel === 'EMAIL' ? 'Your Email Address' : 'Your Mobile Number'}
                  </label>
                  <input
                    id="restock-destination"
                    type={channel === 'EMAIL' ? 'email' : 'tel'}
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder={channel === 'EMAIL' ? 'yourname@example.com' : 'e.g. 98765 43210'}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D5CEC2] rounded-xl text-xs text-[#1A1817] placeholder-[#A0988C] focus:outline-none focus:border-[#722F37] transition-colors shadow-2xs"
                  />
                </div>

                {/* Consent Checkbox */}
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded border-[#C5BDB0] text-[#722F37] focus:ring-[#722F37] h-4 w-4"
                  />
                  <span className="text-[11px] text-[#6B6359] leading-tight">
                    I agree to receive a one-time restock alert notification for this item. Amoga respects your privacy and will never spam.
                  </span>
                </label>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-[#1E1916] hover:bg-[#2C2520] disabled:opacity-50 text-[#F4EBE1] font-sans font-medium text-xs tracking-wider uppercase rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5 text-[#C5A46D]" />
                      <span>Notify Me When Back in Stock</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#8C8377]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>100% Privacy &bull; No Spam Guarantee</span>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
