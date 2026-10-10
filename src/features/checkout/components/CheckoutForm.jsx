import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, Info } from 'lucide-react';
import { useStore } from '../../../store/useStore';

export const CheckoutForm = () => {
  const navigate = useNavigate();
  const customerDetails = useStore((state) => state.customerDetails || state.checkout?.customerDetails);
  const setCustomerDetails = useStore((state) => state.setCustomerDetails);
  const getCartTotals = useStore((state) => state.getCartTotals);

  const { payableItemsCount, hasUnpricedItems } = getCartTotals();

  // Local form state safely initialized with empty fallbacks
  const [formData, setFormData] = useState(() => ({
    fullName: customerDetails?.fullName || '',
    email: customerDetails?.email || '',
    phone: customerDetails?.phone || '',
    addressLine1: customerDetails?.addressLine1 || '',
    addressLine2: customerDetails?.addressLine2 || '',
    city: customerDetails?.city || '',
    state: customerDetails?.state || '',
    pincode: customerDetails?.pincode || '',
    instructions: customerDetails?.instructions || customerDetails?.deliveryInstructions || '',
  }));

  // Track fields modified by user to prevent asynchronous profile updates from overwriting user changes
  const dirtyFieldsRef = useRef(new Set());

  // Handle asynchronous customer / profile data arrival safely
  useEffect(() => {
    if (!customerDetails) return;
    setFormData((prev) => {
      let changed = false;
      const next = { ...prev };
      const fields = [
        'fullName',
        'email',
        'phone',
        'addressLine1',
        'addressLine2',
        'city',
        'state',
        'pincode',
      ];
      fields.forEach((field) => {
        if (!dirtyFieldsRef.current.has(field) && customerDetails[field] && !prev[field]) {
          next[field] = customerDetails[field];
          changed = true;
        }
      });
      const incomingInstructions = customerDetails.instructions || customerDetails.deliveryInstructions;
      if (!dirtyFieldsRef.current.has('instructions') && incomingInstructions && !prev.instructions) {
        next.instructions = incomingInstructions;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [customerDetails]);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 3) return 'Name must be at least 3 characters';
        return null;

      case 'email':
        if (!value.trim()) return 'Email address is required';
        // Basic RFC-compliant email regex
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        return null;

      case 'phone': {
        if (!value.trim()) return 'Phone number is required';
        // Indian phone format: optional +91 or 0, followed by 10 digits starting with 6,7,8,9
        const cleanPhone = value.replace(/[\s-]/g, '');
        if (!/^(?:\+91|0)?[6-9]\d{9}$/.test(cleanPhone)) {
          return 'Enter a valid 10-digit Indian mobile number';
        }
        return null;
      }

      case 'addressLine1':
        if (!value.trim()) return 'Street address is required';
        if (value.trim().length < 5) return 'Address must be at least 5 characters';
        return null;

      case 'city':
        if (!value.trim()) return 'City is required';
        return null;

      case 'state':
        if (!value.trim()) return 'State is required';
        return null;

      case 'pincode': {
        if (!value.trim()) return 'PIN code is required';
        const cleanPin = value.replace(/\s/g, '');
        if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
          return 'Enter a valid 6-digit Indian PIN code';
        }
        return null;
      }

      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    dirtyFieldsRef.current.add(name);
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Revalidate field if already touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check all fields
    const newErrors = {};
    const fieldsToValidate = [
      'fullName',
      'email',
      'phone',
      'addressLine1',
      'city',
      'state',
      'pincode',
    ];

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Mark all as touched to show errors
      const allTouched = fieldsToValidate.reduce((acc, f) => ({ ...acc, [f]: true }), {});
      setTouched(allTouched);

      // Focus first error field
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.focus();
      }
      return;
    }

    if (hasUnpricedItems || payableItemsCount === 0) {
      return;
    }

    // Save into Zustand store
    setCustomerDetails(formData);

    // Proceed to review
    navigate('/checkout/review');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Notice Banner */}
      <div className="p-4 bg-amoga-ivory rounded-xl border border-amoga-brass/30 text-xs text-amoga-charcoal/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-amoga-burgundy shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Frontend Demonstration:</strong> All delivery information entered here is stored in local memory only for this demo session. No personal data is sent to a remote fulfilment server or permanent database.
        </p>
      </div>

      {/* Customer Contact Information */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-amoga-brass/20 shadow-sm space-y-5">
        <h2 className="font-serif text-xl sm:text-2xl text-amoga-charcoal border-b border-amoga-brass/15 pb-3">
          1. Contact Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-amoga-charcoal mb-1.5">
              Full Name <span className="text-rose-600">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              className={`w-full px-4 py-3 rounded-xl border text-sm text-amoga-charcoal transition-all outline-none ${
                errors.fullName
                  ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200'
                  : 'border-amoga-brass/30 focus:border-amoga-burgundy focus:ring-2 focus:ring-amoga-burgundy/10'
              }`}
              placeholder="e.g. Radhika Sharma"
            />
            {errors.fullName && (
              <p id="fullName-error" className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-amoga-charcoal mb-1.5">
              Email Address <span className="text-rose-600">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`w-full px-4 py-3 rounded-xl border text-sm text-amoga-charcoal transition-all outline-none ${
                errors.email
                  ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200'
                  : 'border-amoga-brass/30 focus:border-amoga-burgundy focus:ring-2 focus:ring-amoga-burgundy/10'
              }`}
              placeholder="radhika@example.com"
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-amoga-charcoal mb-1.5">
              Phone Number <span className="text-rose-600">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
              className={`w-full px-4 py-3 rounded-xl border text-sm text-amoga-charcoal transition-all outline-none ${
                errors.phone
                  ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200'
                  : 'border-amoga-brass/30 focus:border-amoga-burgundy focus:ring-2 focus:ring-amoga-burgundy/10'
              }`}
              placeholder="9876543210"
            />
            {errors.phone && (
              <p id="phone-error" className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-amoga-brass/20 shadow-sm space-y-5">
        <h2 className="font-serif text-xl sm:text-2xl text-amoga-charcoal border-b border-amoga-brass/15 pb-3">
          2. Delivery Address
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Address Line 1 */}
          <div className="sm:col-span-2">
            <label htmlFor="addressLine1" className="block text-xs font-semibold uppercase tracking-wider text-amoga-charcoal mb-1.5">
              Address Line 1 <span className="text-rose-600">*</span>
            </label>
            <input
              id="addressLine1"
              name="addressLine1"
              type="text"
              autoComplete="address-line1"
              value={formData.addressLine1}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.addressLine1}
              aria-describedby={errors.addressLine1 ? 'addressLine1-error' : undefined}
              className={`w-full px-4 py-3 rounded-xl border text-sm text-amoga-charcoal transition-all outline-none ${
                errors.addressLine1
                  ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200'
                  : 'border-amoga-brass/30 focus:border-amoga-burgundy focus:ring-2 focus:ring-amoga-burgundy/10'
              }`}
              placeholder="House / Flat No., Apartment Name, Street"
            />
            {errors.addressLine1 && (
              <p id="addressLine1-error" className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.addressLine1}
              </p>
            )}
          </div>

          {/* Address Line 2 */}
          <div className="sm:col-span-2">
            <label htmlFor="addressLine2" className="block text-xs font-semibold uppercase tracking-wider text-amoga-charcoal mb-1.5">
              Address Line 2 <span className="text-amoga-charcoal/50 lowercase font-normal">(optional)</span>
            </label>
            <input
              id="addressLine2"
              name="addressLine2"
              type="text"
              autoComplete="address-line2"
              value={formData.addressLine2}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-amoga-brass/30 focus:border-amoga-burgundy focus:ring-2 focus:ring-amoga-burgundy/10 text-sm text-amoga-charcoal transition-all outline-none"
              placeholder="Landmark, Area or Colony"
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block text-xs font-semibold uppercase tracking-wider text-amoga-charcoal mb-1.5">
              City <span className="text-rose-600">*</span>
            </label>
            <input
              id="city"
              name="city"
              type="text"
              autoComplete="address-level2"
              value={formData.city}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.city}
              aria-describedby={errors.city ? 'city-error' : undefined}
              className={`w-full px-4 py-3 rounded-xl border text-sm text-amoga-charcoal transition-all outline-none ${
                errors.city
                  ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200'
                  : 'border-amoga-brass/30 focus:border-amoga-burgundy focus:ring-2 focus:ring-amoga-burgundy/10'
              }`}
              placeholder="e.g. Bangalore, Chennai, Mumbai"
            />
            {errors.city && (
              <p id="city-error" className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.city}
              </p>
            )}
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" className="block text-xs font-semibold uppercase tracking-wider text-amoga-charcoal mb-1.5">
              State / Province <span className="text-rose-600">*</span>
            </label>
            <input
              id="state"
              name="state"
              type="text"
              autoComplete="address-level1"
              value={formData.state}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.state}
              aria-describedby={errors.state ? 'state-error' : undefined}
              className={`w-full px-4 py-3 rounded-xl border text-sm text-amoga-charcoal transition-all outline-none ${
                errors.state
                  ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200'
                  : 'border-amoga-brass/30 focus:border-amoga-burgundy focus:ring-2 focus:ring-amoga-burgundy/10'
              }`}
              placeholder="e.g. Karnataka, Tamil Nadu"
            />
            {errors.state && (
              <p id="state-error" className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.state}
              </p>
            )}
          </div>

          {/* PIN code */}
          <div>
            <label htmlFor="pincode" className="block text-xs font-semibold uppercase tracking-wider text-amoga-charcoal mb-1.5">
              PIN / Postal Code <span className="text-rose-600">*</span>
            </label>
            <input
              id="pincode"
              name="pincode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="postal-code"
              value={formData.pincode}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.pincode}
              aria-describedby={errors.pincode ? 'pincode-error' : undefined}
              className={`w-full px-4 py-3 rounded-xl border text-sm text-amoga-charcoal transition-all outline-none ${
                errors.pincode
                  ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200'
                  : 'border-amoga-brass/30 focus:border-amoga-burgundy focus:ring-2 focus:ring-amoga-burgundy/10'
              }`}
              placeholder="560001"
            />
            {errors.pincode && (
              <p id="pincode-error" className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.pincode}
              </p>
            )}
          </div>

          {/* Delivery Instructions */}
          <div className="sm:col-span-2">
            <label htmlFor="instructions" className="block text-xs font-semibold uppercase tracking-wider text-amoga-charcoal mb-1.5">
              Delivery Instructions <span className="text-amoga-charcoal/50 lowercase font-normal">(optional)</span>
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows={2}
              value={formData.instructions}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-amoga-brass/30 focus:border-amoga-burgundy focus:ring-2 focus:ring-amoga-burgundy/10 text-sm text-amoga-charcoal transition-all outline-none"
              placeholder="Gate code, landmark, or delivery time preferences..."
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => navigate('/cart')}
          className="text-xs uppercase tracking-widest font-semibold text-amoga-charcoal/70 hover:text-amoga-burgundy transition-colors py-3"
        >
          ← Return to Shopping Bag
        </button>

        <button
          type="submit"
          disabled={hasUnpricedItems || payableItemsCount === 0}
          className="w-full sm:w-auto px-8 py-4 rounded-xl bg-amoga-burgundy hover:bg-amoga-burgundy/90 text-amoga-ivory font-medium tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-md shadow-amoga-burgundy/15 disabled:bg-amoga-charcoal/20 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <span>Continue to Order Review</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
