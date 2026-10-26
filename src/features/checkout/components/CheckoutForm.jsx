import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  AlertCircle,
  Info,
  Check,
  Home,
  Building2,
  Bookmark,
  Plus,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { useCustomerStore } from '../../account/store/useCustomerStore';

export const CheckoutForm = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
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

  const { customer, isAuthenticated, addresses, fetchAddresses, addAddress } = useCustomerStore();
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Save address state
  const [shouldSaveAddress, setShouldSaveAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      fullName: addr.fullName || prev.fullName || '',
      phone: addr.phone || prev.phone || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    }));
    dirtyFieldsRef.current.add('fullName');
    dirtyFieldsRef.current.add('phone');
    dirtyFieldsRef.current.add('addressLine1');
    dirtyFieldsRef.current.add('city');
    dirtyFieldsRef.current.add('state');
    dirtyFieldsRef.current.add('pincode');
    setErrors((prev) => ({
      ...prev,
      fullName: null,
      phone: null,
      addressLine1: null,
      city: null,
      state: null,
      pincode: null,
    }));
  };

  const handleClearSelectedAddress = () => {
    setSelectedAddressId(null);
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
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        return null;

      case 'phone': {
        if (!value.trim()) return 'Mobile number is required';
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

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      const allTouched = fieldsToValidate.reduce((acc, f) => ({ ...acc, [f]: true }), {});
      setTouched(allTouched);

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

    setIsSubmitting(true);

    // If authenticated customer chose to save address, save it to their account
    if (isAuthenticated && shouldSaveAddress) {
      const finalLabel = addressLabel === 'Other' ? (customLabel.trim() || 'Other') : addressLabel;
      try {
        await addAddress({
          label: finalLabel,
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          addressLine1: formData.addressLine1.trim(),
          addressLine2: (formData.addressLine2 || '').trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          isDefault: false,
        });
      } catch (err) {
        console.warn('Address saving encountered error (non-blocking for checkout):', err);
      }
    }

    // Save into Zustand store
    setCustomerDetails(formData);
    setIsSubmitting(false);

    // Proceed to review
    navigate('/checkout/review');
  };

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.25,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-10"
      noValidate
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Notice Banner - Soft editorial banner */}
      <motion.div
        variants={itemVariants}
        className="p-4 rounded-xl border text-xs flex items-start gap-3 shadow-xs"
        style={{
          backgroundColor: 'var(--collection-notice-bg, #FAF8F5)',
          borderColor: 'var(--collection-notice-border, #EAE3D5)',
          color: 'var(--collection-notice-text, #5C5248)',
        }}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--collection-notice-icon, var(--collection-accent))' }} />
        <p className="leading-relaxed">
          <strong className="font-semibold" style={{ color: 'var(--collection-notice-title, var(--collection-heading))' }}>
            Curated Checkout:
          </strong>{' '}
          Your delivery details are protected with bank-grade encryption. Free standard shipping is automatically calculated based on your destination and cart eligibility.
        </p>
      </motion.div>

      {/* SECTION 1: CONTACT INFORMATION */}
      <motion.section variants={itemVariants} className="space-y-6">
        <div className="border-b pb-3 flex items-baseline justify-between" style={{ borderColor: 'var(--collection-border)' }}>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl tracking-tight" style={{ color: 'var(--collection-heading)' }}>
              1. Contact Information
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--collection-text-muted)' }}>
              Order confirmation and shipping updates will be sent to this email & mobile.
            </p>
          </div>
          {!isAuthenticated && (
            <a
              href="/account/login?redirect=/checkout"
              className="text-xs font-medium flex items-center gap-1 transition-colors hover:underline"
              style={{ color: 'var(--collection-accent)' }}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in</span>
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label
              htmlFor="fullName"
              className="block text-xs font-semibold tracking-wide mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              Full Name <span className="text-rose-500 font-bold">*</span>
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
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[var(--collection-accent)]/20 ${
                errors.fullName ? 'ring-1 ring-red-500' : ''
              }`}
              style={{
                backgroundColor: 'var(--collection-input-bg, #FAF8F5)',
                borderColor: errors.fullName ? '#DC2626' : 'var(--collection-input-border, #DDD5C7)',
                color: 'var(--collection-input-text, #1F0811)',
              }}
              placeholder="e.g. Radhika Sharma"
            />
            <AnimatePresence>
              {errors.fullName && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  id="fullName-error"
                  className="mt-1.5 text-xs text-rose-500 flex items-center gap-1.5 font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.fullName}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold tracking-wide mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              Email Address <span className="text-rose-500 font-bold">*</span>
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
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[var(--collection-accent)]/20 ${
                errors.email ? 'ring-1 ring-red-500' : ''
              }`}
              style={{
                backgroundColor: 'var(--collection-input-bg, #FAF8F5)',
                borderColor: errors.email ? '#DC2626' : 'var(--collection-input-border, #DDD5C7)',
                color: 'var(--collection-input-text, #1F0811)',
              }}
              placeholder="radhika@example.com"
            />
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  id="email-error"
                  className="mt-1.5 text-xs text-rose-500 flex items-center gap-1.5 font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.email}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Number */}
          <div>
            <label
              htmlFor="phone"
              className="block text-xs font-semibold tracking-wide mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              Mobile Number <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <span
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium"
                style={{ color: 'var(--collection-text-muted)' }}
              >
                +91
              </span>
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
                className={`w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[var(--collection-accent)]/20 ${
                  errors.phone ? 'ring-1 ring-red-500' : ''
                }`}
                style={{
                  backgroundColor: 'var(--collection-input-bg, #FAF8F5)',
                  borderColor: errors.phone ? '#DC2626' : 'var(--collection-input-border, #DDD5C7)',
                  color: 'var(--collection-input-text, #1F0811)',
                }}
                placeholder="9876543210"
              />
            </div>
            <AnimatePresence>
              {errors.phone && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  id="phone-error"
                  className="mt-1.5 text-xs text-rose-500 flex items-center gap-1.5 font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.phone}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.section>

      {/* SECTION 2: DELIVERY ADDRESS */}
      <motion.section variants={itemVariants} className="space-y-6">
        <div className="border-b pb-3 flex items-baseline justify-between" style={{ borderColor: 'var(--collection-border)' }}>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl tracking-tight" style={{ color: 'var(--collection-heading)' }}>
              2. Delivery Address
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--collection-text-muted)' }}>
              Where would you like us to deliver your parcel?
            </p>
          </div>
        </div>

        {/* Saved Addresses for Authenticated Customer */}
        {isAuthenticated && addresses && addresses.length > 0 && (
          <div
            className="rounded-2xl p-5 border space-y-3.5"
            style={{
              backgroundColor: 'var(--collection-section-bg)',
              borderColor: 'var(--collection-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--collection-accent)' }}>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved Delivery Addresses</span>
              </span>
              {selectedAddressId && (
                <button
                  type="button"
                  onClick={handleClearSelectedAddress}
                  className="text-xs underline underline-offset-2 transition-colors cursor-pointer"
                  style={{ color: 'var(--collection-text-muted)' }}
                >
                  Enter a different address
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                const labelIcon =
                  addr.label?.toLowerCase() === 'home' ? (
                    <Home className="w-3.5 h-3.5" />
                  ) : addr.label?.toLowerCase() === 'office' ? (
                    <Building2 className="w-3.5 h-3.5" />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5" />
                  );

                return (
                  <motion.button
                    key={addr.id}
                    type="button"
                    whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                    onClick={() => handleSelectAddress(addr)}
                    className="text-left p-4 rounded-xl border transition-all text-xs cursor-pointer relative"
                    style={{
                      backgroundColor: isSelected ? 'var(--collection-card-bg)' : 'var(--collection-section-bg)',
                      borderColor: isSelected ? 'var(--collection-accent)' : 'var(--collection-border)',
                      boxShadow: isSelected ? '0 0 0 2px var(--collection-accent)' : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--collection-heading)' }}>
                        <span style={{ color: 'var(--collection-accent)' }}>{labelIcon}</span>
                        <span>{addr.label || 'Home'}</span>
                      </span>
                      {isSelected ? (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{
                            backgroundColor: 'var(--collection-accent)',
                            color: 'var(--collection-button-text)',
                          }}
                        >
                          <Check className="w-3 h-3" /> Selected
                        </span>
                      ) : addr.isDefault ? (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded border"
                          style={{
                            borderColor: 'var(--collection-border)',
                            color: 'var(--collection-text-muted)',
                          }}
                        >
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="font-medium truncate" style={{ color: 'var(--collection-heading)' }}>
                      {addr.fullName || 'Recipient'}
                    </p>
                    <p className="line-clamp-1 mt-0.5" style={{ color: 'var(--collection-text)' }}>
                      {addr.addressLine1}
                    </p>
                    <p className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--collection-text-muted)' }}>
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {/* Address Line 1 */}
          <div className="sm:col-span-2">
            <label
              htmlFor="addressLine1"
              className="block text-xs font-semibold tracking-wide mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              Address Line 1 <span className="text-rose-500 font-bold">*</span>
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
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[var(--collection-accent)]/20 ${
                errors.addressLine1 ? 'ring-1 ring-red-500' : ''
              }`}
              style={{
                backgroundColor: 'var(--collection-input-bg, #FAF8F5)',
                borderColor: errors.addressLine1 ? '#DC2626' : 'var(--collection-input-border, #DDD5C7)',
                color: 'var(--collection-input-text, #1F0811)',
              }}
              placeholder="Flat, House no., Building, Street"
            />
            <AnimatePresence>
              {errors.addressLine1 && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  id="addressLine1-error"
                  className="mt-1.5 text-xs text-rose-500 flex items-center gap-1.5 font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.addressLine1}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Address Line 2 */}
          <div className="sm:col-span-2">
            <label
              htmlFor="addressLine2"
              className="block text-xs font-semibold tracking-wide mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              Address Line 2 <span style={{ color: 'var(--collection-text-muted)' }} className="font-normal">(Optional)</span>
            </label>
            <input
              id="addressLine2"
              name="addressLine2"
              type="text"
              autoComplete="address-line2"
              value={formData.addressLine2}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[var(--collection-accent)]/20"
              style={{
                backgroundColor: 'var(--collection-input-bg, #FAF8F5)',
                borderColor: 'var(--collection-input-border, #DDD5C7)',
                color: 'var(--collection-input-text, #1F0811)',
              }}
              placeholder="Area, Landmark, Colony, Floor"
            />
          </div>

          {/* City */}
          <div>
            <label
              htmlFor="city"
              className="block text-xs font-semibold tracking-wide mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              City <span className="text-rose-500 font-bold">*</span>
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
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[var(--collection-accent)]/20 ${
                errors.city ? 'ring-1 ring-red-500' : ''
              }`}
              style={{
                backgroundColor: 'var(--collection-input-bg, #FAF8F5)',
                borderColor: errors.city ? '#DC2626' : 'var(--collection-input-border, #DDD5C7)',
                color: 'var(--collection-input-text, #1F0811)',
              }}
              placeholder="e.g. Bangalore"
            />
            <AnimatePresence>
              {errors.city && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  id="city-error"
                  className="mt-1.5 text-xs text-rose-500 flex items-center gap-1.5 font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.city}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* State / Province */}
          <div>
            <label
              htmlFor="state"
              className="block text-xs font-semibold tracking-wide mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              State / Province <span className="text-rose-500 font-bold">*</span>
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
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[var(--collection-accent)]/20 ${
                errors.state ? 'ring-1 ring-red-500' : ''
              }`}
              style={{
                backgroundColor: 'var(--collection-input-bg, #FAF8F5)',
                borderColor: errors.state ? '#DC2626' : 'var(--collection-input-border, #DDD5C7)',
                color: 'var(--collection-input-text, #1F0811)',
              }}
              placeholder="e.g. Karnataka"
            />
            <AnimatePresence>
              {errors.state && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  id="state-error"
                  className="mt-1.5 text-xs text-rose-500 flex items-center gap-1.5 font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.state}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* PIN Code */}
          <div>
            <label
              htmlFor="pincode"
              className="block text-xs font-semibold tracking-wide mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              PIN Code <span className="text-rose-500 font-bold">*</span>
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
              className={`w-full px-4 py-3 rounded-xl border text-sm font-mono transition-all outline-none focus:ring-2 focus:ring-[var(--collection-accent)]/20 ${
                errors.pincode ? 'ring-1 ring-red-500' : ''
              }`}
              style={{
                backgroundColor: 'var(--collection-input-bg, #FAF8F5)',
                borderColor: errors.pincode ? '#DC2626' : 'var(--collection-input-border, #DDD5C7)',
                color: 'var(--collection-input-text, #1F0811)',
              }}
              placeholder="560001"
            />
            <AnimatePresence>
              {errors.pincode && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  id="pincode-error"
                  className="mt-1.5 text-xs text-rose-500 flex items-center gap-1.5 font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.pincode}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Delivery Instructions */}
          <div className="sm:col-span-2">
            <label
              htmlFor="instructions"
              className="block text-xs font-semibold tracking-wide mb-1.5"
              style={{ color: 'var(--collection-text)' }}
            >
              Delivery Instructions <span style={{ color: 'var(--collection-text-muted)' }} className="font-normal">(Optional)</span>
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows={2}
              value={formData.instructions}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none resize-none focus:ring-2 focus:ring-[var(--collection-accent)]/20"
              style={{
                backgroundColor: 'var(--collection-input-bg, #FAF8F5)',
                borderColor: 'var(--collection-input-border, #DDD5C7)',
                color: 'var(--collection-input-text, #1F0811)',
              }}
              placeholder="Gate code, ringing preferences, or landmark..."
            />
          </div>
        </div>

        {/* SAVE ADDRESS CONTROLS (PHASE 4) */}
        <div className="pt-2 border-t space-y-3" style={{ borderColor: 'var(--collection-border)' }}>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="saveAddressCheckbox"
              checked={shouldSaveAddress}
              onChange={(e) => setShouldSaveAddress(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--collection-accent)' }}
            />
            <span className="text-xs font-medium" style={{ color: 'var(--collection-heading)' }}>
              Save this address to my account
            </span>
          </label>

          <AnimatePresence>
            {shouldSaveAddress && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-3 pl-6"
              >
                {/* For Authenticated customer: Show Home, Office, Other selectors */}
                {isAuthenticated ? (
                  <div
                    className="space-y-3 p-3.5 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--collection-section-bg)',
                      borderColor: 'var(--collection-border)',
                    }}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--collection-text-muted)' }}>
                      Select Address Label:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'Home', icon: Home, label: 'Home' },
                        { id: 'Office', icon: Building2, label: 'Office' },
                        { id: 'Other', icon: Bookmark, label: 'Other' },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = addressLabel === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAddressLabel(item.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border"
                            style={{
                              backgroundColor: isSelected ? 'var(--collection-accent)' : 'var(--collection-card-bg)',
                              borderColor: isSelected ? 'var(--collection-accent)' : 'var(--collection-border)',
                              color: isSelected ? 'var(--collection-button-text)' : 'var(--collection-text)',
                            }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {addressLabel === 'Other' && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pt-1"
                      >
                        <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--collection-text-muted)' }}>
                          Custom Label:
                        </label>
                        <input
                          type="text"
                          value={customLabel}
                          onChange={(e) => setCustomLabel(e.target.value)}
                          placeholder="e.g. Studio, Farmhouse, Warehouse"
                          className="w-full max-w-xs px-3 py-1.5 rounded-lg text-xs outline-none border"
                          style={{
                            backgroundColor: 'var(--collection-input-bg)',
                            borderColor: 'var(--collection-input-border)',
                            color: 'var(--collection-input-text)',
                          }}
                        />
                      </motion.div>
                    )}
                  </div>
                ) : (
                  /* For Guest customer: Gentle prompt to sign in, without forcing */
                  <div
                    className="p-3.5 rounded-xl border text-xs space-y-1.5"
                    style={{
                      backgroundColor: 'var(--collection-section-bg)',
                      borderColor: 'var(--collection-border)',
                      color: 'var(--collection-text)',
                    }}
                  >
                    <p style={{ color: 'var(--collection-text)' }}>
                      An authenticated customer account is required to save addresses for 1-click future checkout.
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <a
                        href="/account/login?redirect=/checkout"
                        className="font-semibold hover:underline inline-flex items-center gap-1"
                        style={{ color: 'var(--collection-accent)' }}
                      >
                        <LogIn className="w-3 h-3" />
                        <span>Sign In or Register</span>
                      </a>
                      <span style={{ color: 'var(--collection-text-muted)' }}>&bull;</span>
                      <span style={{ color: 'var(--collection-text-muted)' }}>Or simply continue checkout as guest below.</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ACTION BUTTONS */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t"
        style={{ borderColor: 'var(--collection-border)' }}
      >
        <button
          type="button"
          onClick={() => navigate('/cart')}
          className="text-xs uppercase tracking-widest font-semibold transition-colors py-3 hover:underline cursor-pointer"
          style={{ color: 'var(--collection-text-muted)' }}
        >
          &larr; Return to Cart
        </button>

        <motion.button
          type="submit"
          disabled={hasUnpricedItems || payableItemsCount === 0 || isSubmitting}
          whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--collection-button-bg)',
            color: 'var(--collection-button-text)',
          }}
        >
          <span>{isSubmitting ? 'Validating...' : 'Continue to Payment'}</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </motion.form>
  );
};
