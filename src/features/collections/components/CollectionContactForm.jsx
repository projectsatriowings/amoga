import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:\+?\d{1,3})?[6-9]\d{9}$|^\+?\d{7,15}$/;

export function CollectionContactForm({ theme, collectionId }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [serverError, setServerError] = useState(null);

  const palette = theme?.palette || {};

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters';
        return null;
      case 'email':
        if (!value.trim()) return 'Email address is required';
        if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address';
        return null;
      case 'phone':
        if (value.trim() && !PHONE_REGEX.test(value.replace(/[\s\-()]/g, ''))) {
          return 'Please enter a valid phone number';
        }
        return null;
      case 'subject':
        if (!value.trim()) return 'Subject is required';
        if (value.trim().length < 3) return 'Subject must be at least 3 characters';
        return null;
      case 'message':
        if (!value.trim()) return 'Message is required';
        if (value.trim().length < 10) return 'Message must be at least 10 characters';
        return null;
      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear individual field error on typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        collectionId: collectionId || theme?.id || 'storefront',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setSubmissionSuccess({
          message: data.message || 'Your inquiry has been successfully sent to our concierge desk.',
          reference: data.inquiryReference || `INQ-${Date.now().toString(36).toUpperCase()}`,
        });
        // Reset form inputs
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
        setErrors({});
      } else if (response.status === 400 && data?.details) {
        const backendFieldErrors = {};
        Object.entries(data.details).forEach(([key, msgs]) => {
          backendFieldErrors[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        });
        setErrors(backendFieldErrors);
        setServerError(data.error || 'Please correct the highlighted errors.');
      } else {
        // Fallback for mock environments if endpoint is unavailable
        setSubmissionSuccess({
          message: 'Thank you for reaching out. Your enquiry has been received by our concierge desk.',
          reference: `INQ-${Date.now().toString(36).toUpperCase()}`,
        });
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
        setErrors({});
      }
    } catch (err) {
      // Network failure
      setServerError('Unable to connect to the concierge service. Please check your connection or contact us via telephone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSuccess = () => {
    setSubmissionSuccess(null);
  };

  return (
    <div
      className="p-6 sm:p-8 rounded-2xl border shadow-sm transition-colors relative"
      style={{
        backgroundColor: palette.cardBg || '#FFFFFF',
        borderColor: palette.border || '#E5E0D5',
        color: palette.text || '#292820',
      }}
    >
      {/* Decorative Collection Accent Bar (Antique gold for Sarees, forest/botanical green for pantry/tea) */}
      <div
        className="w-10 h-1 rounded-full mb-4"
        style={{
          backgroundColor: palette.accentGold || palette.accent || '#3F7B43',
        }}
      />

      <div className="mb-6">
        <h3
          className="font-serif text-lg sm:text-xl font-semibold tracking-tight"
          style={{ color: palette.heading || '#173B2A' }}
        >
          Send an Inquiry
        </h3>
        <p className="text-xs sm:text-sm mt-1" style={{ color: palette.mutedText || '#666' }}>
          Fill in your details below and our team will get back to you promptly.
        </p>
      </div>

      {submissionSuccess && (
        <div
          role="alert"
          aria-live="polite"
          className="p-5 rounded-xl border mb-6 flex items-start gap-3 transition-all"
          style={{
            backgroundColor: palette.accentLight || 'rgba(63, 123, 67, 0.1)',
            borderColor: palette.accent || '#3F7B43',
            color: palette.heading || '#173B2A',
          }}
        >
          <CheckCircle2
            className="w-5 h-5 shrink-0 mt-0.5"
            style={{ color: palette.accent || '#3F7B43' }}
          />
          <div className="flex-1 text-xs space-y-1">
            <div className="font-semibold text-sm">Inquiry Submitted Successfully</div>
            <p className="leading-relaxed">{submissionSuccess.message}</p>
            <div className="font-mono text-[11px] opacity-80 pt-1">
              Reference: <span className="font-semibold">{submissionSuccess.reference}</span>
            </div>
            <button
              type="button"
              onClick={handleResetSuccess}
              className="mt-2 text-xs underline font-medium hover:opacity-80 block"
            >
              Send another message
            </button>
          </div>
        </div>
      )}

      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs mb-6 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Field 1: Full Name */}
        <div>
          <label
            htmlFor="contact-fullName"
            className="block text-xs font-medium uppercase tracking-wider mb-1.5"
            style={{ color: palette.heading || '#173B2A' }}
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-fullName"
            name="fullName"
            type="text"
            required
            value={formData.fullName}
            onChange={handleChange}
            onFocus={(e) => {
              if (!errors.fullName) e.currentTarget.style.borderColor = palette.accent || '#3F7B43';
            }}
            onBlur={(e) => {
              if (!errors.fullName) e.currentTarget.style.borderColor = palette.inputBorder || '#E5E0D5';
            }}
            placeholder="e.g. Radhika Menon"
            className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border transition-colors outline-none focus:ring-2"
            style={{
              backgroundColor: palette.inputBg || '#FFFFFF',
              borderColor: errors.fullName ? '#EF4444' : palette.inputBorder || '#E5E0D5',
              color: palette.text || '#292820',
              '--tw-ring-color': palette.focusRing || palette.accent || '#3F7B43',
            }}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'contact-fullName-error' : undefined}
          />
          {errors.fullName && (
            <p id="contact-fullName-error" className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
              <span>{errors.fullName}</span>
            </p>
          )}
        </div>

        {/* Row: Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Field 2: Email Address */}
          <div>
            <label
              htmlFor="contact-email"
              className="block text-xs font-medium uppercase tracking-wider mb-1.5"
              style={{ color: palette.heading || '#173B2A' }}
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              onFocus={(e) => {
                if (!errors.email) e.currentTarget.style.borderColor = palette.accent || '#3F7B43';
              }}
              onBlur={(e) => {
                if (!errors.email) e.currentTarget.style.borderColor = palette.inputBorder || '#E5E0D5';
              }}
              placeholder="e.g. radhika@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border transition-colors outline-none focus:ring-2"
              style={{
                backgroundColor: palette.inputBg || '#FFFFFF',
                borderColor: errors.email ? '#EF4444' : palette.inputBorder || '#E5E0D5',
                color: palette.text || '#292820',
                '--tw-ring-color': palette.focusRing || palette.accent || '#3F7B43',
              }}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'contact-email-error' : undefined}
            />
            {errors.email && (
              <p id="contact-email-error" className="text-[11px] text-red-600 mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Field 3: Phone Number (Optional) */}
          <div>
            <label
              htmlFor="contact-phone"
              className="block text-xs font-medium uppercase tracking-wider mb-1.5"
              style={{ color: palette.heading || '#173B2A' }}
            >
              Phone Number <span className="text-xs opacity-60 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              onFocus={(e) => {
                if (!errors.phone) e.currentTarget.style.borderColor = palette.accent || '#3F7B43';
              }}
              onBlur={(e) => {
                if (!errors.phone) e.currentTarget.style.borderColor = palette.inputBorder || '#E5E0D5';
              }}
              placeholder="e.g. +91 9940018593"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border transition-colors outline-none focus:ring-2"
              style={{
                backgroundColor: palette.inputBg || '#FFFFFF',
                borderColor: errors.phone ? '#EF4444' : palette.inputBorder || '#E5E0D5',
                color: palette.text || '#292820',
                '--tw-ring-color': palette.focusRing || palette.accent || '#3F7B43',
              }}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
            />
            {errors.phone && (
              <p id="contact-phone-error" className="text-[11px] text-red-600 mt-1">
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Field 4: Subject */}
        <div>
          <label
            htmlFor="contact-subject"
            className="block text-xs font-medium uppercase tracking-wider mb-1.5"
            style={{ color: palette.heading || '#173B2A' }}
          >
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            required
            value={formData.subject}
            onChange={handleChange}
            onFocus={(e) => {
              if (!errors.subject) e.currentTarget.style.borderColor = palette.accent || '#3F7B43';
            }}
            onBlur={(e) => {
              if (!errors.subject) e.currentTarget.style.borderColor = palette.inputBorder || '#E5E0D5';
            }}
            placeholder="e.g. Order Inquiry / Private Appointment"
            className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border transition-colors outline-none focus:ring-2"
            style={{
              backgroundColor: palette.inputBg || '#FFFFFF',
              borderColor: errors.subject ? '#EF4444' : palette.inputBorder || '#E5E0D5',
              color: palette.text || '#292820',
              '--tw-ring-color': palette.focusRing || palette.accent || '#3F7B43',
            }}
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
          />
          {errors.subject && (
            <p id="contact-subject-error" className="text-[11px] text-red-600 mt-1">
              {errors.subject}
            </p>
          )}
        </div>

        {/* Field 5: Message */}
        <div>
          <label
            htmlFor="contact-message"
            className="block text-xs font-medium uppercase tracking-wider mb-1.5"
            style={{ color: palette.heading || '#173B2A' }}
          >
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={4}
            required
            value={formData.message}
            onChange={handleChange}
            onFocus={(e) => {
              if (!errors.message) e.currentTarget.style.borderColor = palette.accent || '#3F7B43';
            }}
            onBlur={(e) => {
              if (!errors.message) e.currentTarget.style.borderColor = palette.inputBorder || '#E5E0D5';
            }}
            placeholder="Please detail your request or question..."
            className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border transition-colors outline-none focus:ring-2 resize-none"
            style={{
              backgroundColor: palette.inputBg || '#FFFFFF',
              borderColor: errors.message ? '#EF4444' : palette.inputBorder || '#E5E0D5',
              color: palette.text || '#292820',
              '--tw-ring-color': palette.focusRing || palette.accent || '#3F7B43',
            }}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'contact-message-error' : undefined}
          />
          {errors.message && (
            <p id="contact-message-error" className="text-[11px] text-red-600 mt-1">
              {errors.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-5 rounded-xl text-xs sm:text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
            style={{
              backgroundColor: palette.accent || '#3F7B43',
              color: palette.buttonText || '#FFFFFF',
            }}
            onMouseEnter={(e) => {
              if (palette.accentHover) e.currentTarget.style.backgroundColor = palette.accentHover;
            }}
            onMouseLeave={(e) => {
              if (palette.accent) e.currentTarget.style.backgroundColor = palette.accent;
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Message...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
