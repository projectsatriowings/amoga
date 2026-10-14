import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, Info } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { useCustomerStore } from '../../account/store/useCustomerStore';

export const CheckoutForm = () => {
  const navigate = useNavigate();
  const customerDetails = useStore((state) => state.customerDetails || state.checkout?.customerDetails);
  const setCustomerDetails = useStore((state) => state.setCustomerDetails);
  const getCheckoutTotals = useStore((state) => state.getCheckoutTotals);

  const { payableItemsCount, hasUnpricedItems } = getCheckoutTotals();

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

  const { customer, isAuthenticated, addresses, fetchAddresses } = useCustomerStore();
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Load customer addresses if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated, fetchAddresses]);

  // Autofill from logged-in customer profile if fields are empty
  useEffect(() => {
    if (!customer) return;
    setFormData((prev) => {
      let changed = false;
      const next = { ...prev };
      if (!dirtyFieldsRef.current.has('fullName') && !prev.fullName && customer.name) {
        next.fullName = customer.name;
        changed = true;
      }
      if (!dirtyFieldsRef.current.has('email') && !prev.email && customer.email) {
        next.email = customer.email;
        changed = true;
      }
      if (!dirtyFieldsRef.current.has('phone') && !prev.phone && customer.phone) {
        next.phone = customer.phone;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [customer]);

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setFormData((prev) => ({
      ...prev,
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      phone: prev.phone || addr.phone || '',
    }));
    dirtyFieldsRef.current.add('addressLine1');
    dirtyFieldsRef.current.add('city');
    dirtyFieldsRef.current.add('state');
    dirtyFieldsRef.current.add('pincode');
    setErrors((prev) => ({
      ...prev,
      addressLine1: null,
      city: null,
      state: null,
      pincode: null,
    }));
  };

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
      {/* Coordinated Notice Banner */}
      <div
        className="p-4 rounded-xl border text-xs flex items-start gap-3 shadow-xs transition-colors"
        style={{
          backgroundColor: 'var(--collection-notice-bg)',
          borderColor: 'var(--collection-notice-border)',
          color: 'var(--collection-notice-text)',
        }}
      >
        <Info
          className="w-4 h-4 shrink-0 mt-0.5"
          style={{ color: 'var(--collection-notice-icon)' }}
        />
        <p className="leading-relaxed">
          <strong
            className="font-semibold"
            style={{ color: 'var(--collection-notice-title)' }}
          >
            Checkout Simulation Notice:
          </strong>{' '}
          All customer and delivery information entered below is securely kept for your checkout session. No permanent profile data is shared or stored without verified authorization.
        </p>
      </div>

      {/* Customer Contact Information Card */}
      <div
        className="rounded-2xl p-6 sm:p-8 border shadow-sm space-y-5 transition-colors"
        style={{
          backgroundColor: 'var(--collection-card-bg)',
          borderColor: 'var(--collection-card-border, var(--collection-border))',
        }}
      >
        <h2
          className="font-serif text-xl sm:text-2xl border-b pb-3"
          style={{
            color: 'var(--collection-heading)',
            borderColor: 'var(--collection-border)',
          }}
        >
          1. Contact Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label
              htmlFor="fullName"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              Full Name <span className="text-[#DC2626] font-bold">*</span>
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
              className={`checkout-input w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                errors.fullName
                  ? 'border-[#DC2626] bg-red-500/10 focus:ring-2 focus:ring-[#DC2626]/30'
                  : 'focus:ring-2 focus:ring-[var(--collection-focus-ring)]'
              }`}
              style={{
                backgroundColor: 'var(--collection-input-bg)',
                color: 'var(--collection-input-text, #292820)',
                borderColor: errors.fullName ? '#DC2626' : 'var(--collection-input-border, var(--collection-border))',
              }}
              placeholder="e.g. Radhika Sharma"
            />
            {errors.fullName && (
              <p id="fullName-error" className="mt-1 text-xs text-[#DC2626] flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.fullName}</span>
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              Email Address <span className="text-[#DC2626] font-bold">*</span>
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
              className={`checkout-input w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                errors.email
                  ? 'border-[#DC2626] bg-red-500/10 focus:ring-2 focus:ring-[#DC2626]/30'
                  : 'focus:ring-2 focus:ring-[var(--collection-focus-ring)]'
              }`}
              style={{
                backgroundColor: 'var(--collection-input-bg)',
                color: 'var(--collection-input-text, #292820)',
                borderColor: errors.email ? '#DC2626' : 'var(--collection-input-border, var(--collection-border))',
              }}
              placeholder="radhika@example.com"
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs text-[#DC2626] flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              Phone Number <span className="text-[#DC2626] font-bold">*</span>
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
              className={`checkout-input w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                errors.phone
                  ? 'border-[#DC2626] bg-red-500/10 focus:ring-2 focus:ring-[#DC2626]/30'
                  : 'focus:ring-2 focus:ring-[var(--collection-focus-ring)]'
              }`}
              style={{
                backgroundColor: 'var(--collection-input-bg)',
                color: 'var(--collection-input-text, #292820)',
                borderColor: errors.phone ? '#DC2626' : 'var(--collection-input-border, var(--collection-border))',
              }}
              placeholder="9876543210"
            />
            {errors.phone && (
              <p id="phone-error" className="mt-1 text-xs text-[#DC2626] flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.phone}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Address Card */}
      <div
        className="rounded-2xl p-6 sm:p-8 border shadow-sm space-y-5 transition-colors"
        style={{
          backgroundColor: 'var(--collection-card-bg)',
          borderColor: 'var(--collection-card-border, var(--collection-border))',
        }}
      >
        <h2
          className="font-serif text-xl sm:text-2xl border-b pb-3"
          style={{
            color: 'var(--collection-heading)',
            borderColor: 'var(--collection-border)',
          }}
        >
          2. Delivery Address
        </h2>

        {/* Authenticated Patron Saved Addresses Selector */}
        {isAuthenticated && addresses && addresses.length > 0 && (
          <div
            className="p-4 rounded-xl border space-y-3"
            style={{
              backgroundColor: 'var(--collection-input-bg)',
              borderColor: 'var(--collection-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-serif tracking-widest text-[#722F37] font-semibold">
                Saved Delivery Addresses
              </span>
              <span className="text-[11px] text-[#8C7A6B]">
                Click an address to autofill
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectAddress(addr)}
                    className={`text-left p-3 rounded-lg border transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'border-[#722F37] bg-[#722F37]/10 ring-1 ring-[#722F37]'
                        : 'border-[#E6DCCD] hover:border-[#C5A46D] bg-white/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#2C0E1A]">
                        {addr.label || 'Residence'}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#C5A46D]/20 text-[#722F37] font-semibold">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[#5C554E] truncate">{addr.addressLine1}</p>
                    <p className="text-[#8C7A6B] text-[11px]">
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[#E6DCCD] bg-[#FAF7F2]/60 text-xs text-[#6A635B]">
            <span>Checking out as guest?</span>
            <a
              href="/account/login?redirect=/checkout"
              className="text-[#722F37] font-semibold hover:underline"
            >
              Sign In to use Saved Residences →
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Address Line 1 */}
          <div className="sm:col-span-2">
            <label
              htmlFor="addressLine1"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              Address Line 1 <span className="text-[#DC2626] font-bold">*</span>
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
              className={`checkout-input w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                errors.addressLine1
                  ? 'border-[#DC2626] bg-red-500/10 focus:ring-2 focus:ring-[#DC2626]/30'
                  : 'focus:ring-2 focus:ring-[var(--collection-focus-ring)]'
              }`}
              style={{
                backgroundColor: 'var(--collection-input-bg)',
                color: 'var(--collection-input-text, #292820)',
                borderColor: errors.addressLine1 ? '#DC2626' : 'var(--collection-input-border, var(--collection-border))',
              }}
              placeholder="House / Flat No., Apartment Name, Street"
            />
            {errors.addressLine1 && (
              <p id="addressLine1-error" className="mt-1 text-xs text-[#DC2626] flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.addressLine1}</span>
              </p>
            )}
          </div>

          {/* Address Line 2 */}
          <div className="sm:col-span-2">
            <label
              htmlFor="addressLine2"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              Address Line 2 <span className="lowercase font-normal" style={{ color: 'var(--collection-text-muted)' }}>(optional)</span>
            </label>
            <input
              id="addressLine2"
              name="addressLine2"
              type="text"
              autoComplete="address-line2"
              value={formData.addressLine2}
              onChange={handleChange}
              className="checkout-input w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[var(--collection-focus-ring)] text-sm transition-all outline-none"
              style={{
                backgroundColor: 'var(--collection-input-bg)',
                color: 'var(--collection-input-text, #292820)',
                borderColor: 'var(--collection-input-border, var(--collection-border))',
              }}
              placeholder="Landmark, Area or Colony"
            />
          </div>

          {/* City */}
          <div>
            <label
              htmlFor="city"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              City <span className="text-[#DC2626] font-bold">*</span>
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
              className={`checkout-input w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                errors.city
                  ? 'border-[#DC2626] bg-red-500/10 focus:ring-2 focus:ring-[#DC2626]/30'
                  : 'focus:ring-2 focus:ring-[var(--collection-focus-ring)]'
              }`}
              style={{
                backgroundColor: 'var(--collection-input-bg)',
                color: 'var(--collection-input-text, #292820)',
                borderColor: errors.city ? '#DC2626' : 'var(--collection-input-border, var(--collection-border))',
              }}
              placeholder="e.g. Bangalore, Chennai, Mumbai"
            />
            {errors.city && (
              <p id="city-error" className="mt-1 text-xs text-[#DC2626] flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.city}</span>
              </p>
            )}
          </div>

          {/* State */}
          <div>
            <label
              htmlFor="state"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              State / Province <span className="text-[#DC2626] font-bold">*</span>
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
              className={`checkout-input w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                errors.state
                  ? 'border-[#DC2626] bg-red-500/10 focus:ring-2 focus:ring-[#DC2626]/30'
                  : 'focus:ring-2 focus:ring-[var(--collection-focus-ring)]'
              }`}
              style={{
                backgroundColor: 'var(--collection-input-bg)',
                color: 'var(--collection-input-text, #292820)',
                borderColor: errors.state ? '#DC2626' : 'var(--collection-input-border, var(--collection-border))',
              }}
              placeholder="e.g. Karnataka, Tamil Nadu"
            />
            {errors.state && (
              <p id="state-error" className="mt-1 text-xs text-[#DC2626] flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.state}</span>
              </p>
            )}
          </div>

          {/* PIN code */}
          <div>
            <label
              htmlFor="pincode"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              PIN / Postal Code <span className="text-[#DC2626] font-bold">*</span>
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
              className={`checkout-input w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                errors.pincode
                  ? 'border-[#DC2626] bg-red-500/10 focus:ring-2 focus:ring-[#DC2626]/30'
                  : 'focus:ring-2 focus:ring-[var(--collection-focus-ring)]'
              }`}
              style={{
                backgroundColor: 'var(--collection-input-bg)',
                color: 'var(--collection-input-text, #292820)',
                borderColor: errors.pincode ? '#DC2626' : 'var(--collection-input-border, var(--collection-border))',
              }}
              placeholder="560001"
            />
            {errors.pincode && (
              <p id="pincode-error" className="mt-1 text-xs text-[#DC2626] flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.pincode}</span>
              </p>
            )}
          </div>

          {/* Delivery Instructions */}
          <div className="sm:col-span-2">
            <label
              htmlFor="instructions"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              Delivery Instructions <span className="lowercase font-normal" style={{ color: 'var(--collection-text-muted)' }}>(optional)</span>
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows={2}
              value={formData.instructions}
              onChange={handleChange}
              className="checkout-input w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[var(--collection-focus-ring)] text-sm transition-all outline-none resize-none"
              style={{
                backgroundColor: 'var(--collection-input-bg)',
                color: 'var(--collection-input-text, #292820)',
                borderColor: 'var(--collection-input-border, var(--collection-border))',
              }}
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
          className="text-xs uppercase tracking-widest font-semibold transition-colors py-3 hover:underline cursor-pointer"
          style={{ color: 'var(--collection-text-muted)' }}
        >
          &larr; Return to Shopping Bag
        </button>

        <button
          type="submit"
          disabled={hasUnpricedItems || payableItemsCount === 0}
          className="w-full sm:w-auto px-8 py-4 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          style={{
            backgroundColor: 'var(--collection-button-bg, var(--collection-accent))',
            color: 'var(--collection-button-text, #FFFFFF)',
          }}
        >
          <span>Continue to Order Review</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
