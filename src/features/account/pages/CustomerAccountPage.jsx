import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useCustomerStore } from '../store/useCustomerStore';
import { Container } from '../../../components/ui/Container';
import {
  User,
  ShoppingBag,
  MapPin,
  Clock,
  Truck,
  Plus,
  Trash2,
  CheckCircle,
  LogOut,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Package,
} from 'lucide-react';

export function CustomerAccountPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'orders';

  const {
    customer,
    isAuthenticated,
    logout,
    updateProfile,
    addresses,
    fetchAddresses,
    addAddress,
    deleteAddress,
    setDefaultAddress,
    orders,
    fetchOrders,
    isLoading,
  } = useCustomerStore();

  const [activeTab, setActiveTab] = useState(initialTab);

  // Profile Edit State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState(null);

  // Address Modal / Form State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [addressFullName, setAddressFullName] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressPincode, setAddressPincode] = useState('');
  const [addressIsDefault, setAddressIsDefault] = useState(false);
  const [addressError, setAddressError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/account/login?redirect=/account', { replace: true });
      return;
    }
    fetchOrders();
    fetchAddresses();
  }, [isAuthenticated]);

  useEffect(() => {
    if (customer) {
      setEditName(customer.name || '');
      setEditPhone(customer.phone || '');
    }
  }, [customer]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    const res = await updateProfile({ name: editName, phone: editPhone });
    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Profile details updated successfully.' });
    } else {
      setProfileMsg({ type: 'error', text: res.error || 'Failed to update profile.' });
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddressError(null);
    const res = await addAddress({
      label: addressLabel,
      fullName: addressFullName,
      phone: addressPhone,
      addressLine1,
      addressLine2,
      city: addressCity,
      state: addressState,
      pincode: addressPincode,
      isDefault: addressIsDefault,
    });

    if (res.success) {
      setShowAddressModal(false);
      // Reset form
      setAddressFullName('');
      setAddressPhone('');
      setAddressLine1('');
      setAddressLine2('');
      setAddressCity('');
      setAddressState('');
      setAddressPincode('');
      setAddressIsDefault(false);
    } else {
      setAddressError(res.error || 'Failed to save address');
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'DISPATCHED':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'PROCESSING':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-stone-100 text-stone-900 border-stone-300';
    }
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#2C0E1A] pt-32 pb-24 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#7A7167] font-mono uppercase tracking-widest">
            Loading Amoga Client Atelier...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C0E1A] pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <Container className="max-w-6xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-[#2C0E1A] via-[#35121F] to-[#2C0E1A] text-[#F6EBD8] rounded-3xl p-6 sm:p-8 border border-[#C5A46D]/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#C5A46D]/20 border border-[#C5A46D]/50 flex items-center justify-center text-[#C5A46D] shrink-0 shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A46D]">
                  Amoga Patron Atelier
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C5A46D]" />
                <span className="text-[10px] font-mono text-[#D8C6AD]">Verified Client</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F6EBD8] mt-0.5">
                {customer.name}
              </h1>
              <p className="text-xs font-mono text-[#D8C6AD] mt-1">{customer.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/track"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-[#F6EBD8] border border-white/20 transition-all flex items-center gap-2"
            >
              <Truck className="w-3.5 h-3.5 text-[#C5A46D]" />
              <span>Track Any Shipment</span>
            </Link>
            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-[#722F37] hover:bg-[#5E2229] text-xs text-[#F6EBD8] border border-[#C5A46D]/30 transition-all flex items-center gap-2 shadow"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex border-b border-[#E0D7C9] gap-4 sm:gap-8 overflow-x-auto">
          <button
            onClick={() => handleTabChange('orders')}
            className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'orders'
                ? 'border-[#722F37] text-[#722F37]'
                : 'border-transparent text-[#7A7167] hover:text-[#2C0E1A]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Orders ({orders.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('addresses')}
            className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'addresses'
                ? 'border-[#722F37] text-[#722F37]'
                : 'border-transparent text-[#7A7167] hover:text-[#2C0E1A]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Delivery Residences ({addresses.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('profile')}
            className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'profile'
                ? 'border-[#722F37] text-[#722F37]'
                : 'border-transparent text-[#7A7167] hover:text-[#2C0E1A]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Account</span>
          </button>
        </div>

        {/* TAB 1: MY ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E6DFD3] p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-[#8C6320] flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1F0811]">
                  No orders placed yet
                </h3>
                <p className="text-xs text-[#7A7167] max-w-sm mx-auto">
                  Your artisanal order dossiers will appear here once you acquire creations from
                  Heritage Sarees, Wholesome Pantry, Wellness Tea, or Silver Jewellery.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#722F37] text-[#F6EBD8] rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#5E2229] transition-all shadow"
                >
                  <span>Explore Collections</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-[#E5E0D5] p-6 hover:shadow-md transition-shadow space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFECE6] gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase text-[#7A7167]">
                            Order Reference:
                          </span>
                          <span className="font-mono text-sm font-bold text-[#722F37]">
                            {order.orderReference}
                          </span>
                        </div>
                        <span className="text-xs text-[#7A7167]">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-medium ${
                            order.paymentStatus === 'SUCCEEDED'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {order.paymentStatus === 'SUCCEEDED' ? 'Payment Verified' : order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Line Items Preview */}
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs gap-4">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.productName}
                                className="w-12 h-12 object-cover rounded-lg border border-[#E5E0D5]"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-[#F5F2EB] flex items-center justify-center text-xs font-serif font-bold text-[#722F37]">
                                A
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-[#1A1817]">{item.productName}</p>
                              <span className="text-[11px] text-[#7A7167] font-mono">
                                Qty: {item.quantity} {item.variantName ? `(${item.variantName})` : ''}
                              </span>
                            </div>
                          </div>
                          <span className="font-medium text-[#1A1817] tabular-nums">
                            ₹{item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Info & Track CTA */}
                    <div className="pt-4 border-t border-[#EFECE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-[#7A7167]">Authoritative Total: </span>
                        <span className="font-sans text-base font-bold text-[#722F37] tabular-nums">
                          ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          to={`/track/${encodeURIComponent(order.orderReference)}`}
                          className="px-4 py-2 bg-[#722F37] hover:bg-[#5E2229] text-[#F6EBD8] text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track Order</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAVED ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#1F0811]">
                  Delivery Residences
                </h2>
                <p className="text-xs text-[#7A7167]">
                  Manage delivery addresses for seamless, 1-click checkout.
                </p>
              </div>

              <button
                onClick={() => setShowAddressModal(true)}
                className="px-4 py-2 bg-[#722F37] hover:bg-[#5E2229] text-[#F6EBD8] text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Residence</span>
              </button>
            </div>

            {/* Address Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`bg-white rounded-2xl p-6 border transition-all space-y-3 relative ${
                    addr.isDefault ? 'border-[#C5A46D] shadow-sm' : 'border-[#E5E0D5]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#FAF8F5] border border-[#DDD5C7] text-[#8C6320]">
                      {addr.label || 'Home'}
                    </span>
                    {addr.isDefault && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Default Address</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs space-y-1 text-[#4A423B]">
                    <p className="font-bold text-sm text-[#1A1817]">{addr.fullName}</p>
                    <p>{addr.addressLine1}</p>
                    {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                    <p>
                      {addr.city}, {addr.state} — <span className="font-mono">{addr.pincode}</span>
                    </p>
                    <p className="font-mono text-[#7A7167] pt-1">Phone: {addr.phone}</p>
                  </div>

                  <div className="pt-3 border-t border-[#EFECE6] flex items-center justify-between text-xs">
                    {!addr.isDefault ? (
                      <button
                        onClick={() => setDefaultAddress(addr.id)}
                        className="text-[#722F37] hover:underline font-medium text-[11px]"
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#7A7167] italic">Primary Address</span>
                    )}

                    <button
                      onClick={() => deleteAddress(addr.id)}
                      className="text-rose-700 hover:text-rose-900 flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Address Modal */}
            {showAddressModal && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-[#DDD5C7] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D5]">
                    <h3 className="font-serif text-lg font-bold text-[#1F0811]">
                      Add Delivery Residence
                    </h3>
                    <button
                      onClick={() => setShowAddressModal(false)}
                      className="text-xs text-[#7A7167] hover:text-[#2C0E1A]"
                    >
                      ✕ Close
                    </button>
                  </div>

                  {addressError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-xl">
                      {addressError}
                    </div>
                  )}

                  <form onSubmit={handleAddAddress} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#4A423B] mb-1">Residence Label</label>
                        <select
                          value={addressLabel}
                          onChange={(e) => setAddressLabel(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs"
                        >
                          <option value="Home">Home</option>
                          <option value="Work">Work</option>
                          <option value="Palace Estate">Palace Estate</option>
                          <option value="Summer Residence">Summer Residence</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#4A423B] mb-1">Recipient Name *</label>
                        <input
                          type="text"
                          required
                          value={addressFullName}
                          onChange={(e) => setAddressFullName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#4A423B] mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={addressPhone}
                        onChange={(e) => setAddressPhone(e.target.value)}
                        placeholder="10-digit mobile"
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[#4A423B] mb-1">Address Line 1 *</label>
                      <input
                        type="text"
                        required
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="Flat, Mansion, Street Name"
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[#4A423B] mb-1">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="Apartment, Landmark, Suite"
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[#4A423B] mb-1">City *</label>
                        <input
                          type="text"
                          required
                          value={addressCity}
                          onChange={(e) => setAddressCity(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[#4A423B] mb-1">State *</label>
                        <input
                          type="text"
                          required
                          value={addressState}
                          onChange={(e) => setAddressState(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[#4A423B] mb-1">PIN Code *</label>
                        <input
                          type="text"
                          required
                          value={addressPincode}
                          onChange={(e) => setAddressPincode(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="defAddressCheck"
                        checked={addressIsDefault}
                        onChange={(e) => setAddressIsDefault(e.target.checked)}
                        className="rounded border-[#DDD5C7] text-[#722F37] focus:ring-[#722F37]"
                      />
                      <label htmlFor="defAddressCheck" className="text-xs text-[#4A423B]">
                        Set as primary default residence
                      </label>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(false)}
                        className="px-4 py-2 border border-[#DDD5C7] rounded-xl text-xs text-[#7A7167]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#722F37] text-[#F6EBD8] rounded-xl text-xs font-semibold hover:bg-[#5E2229]"
                      >
                        Save Residence
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROFILE & ACCOUNT */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-[#E5E0D5] p-6 sm:p-8 max-w-2xl space-y-6">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#1F0811]">
                Patron Profile Information
              </h2>
              <p className="text-xs text-[#7A7167]">
                Update your registered patron name and primary telephone contact.
              </p>
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#4A423B] font-medium mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#1A1817]"
                />
              </div>

              <div>
                <label className="block text-[#4A423B] font-medium mb-1.5">
                  Email Address (Primary Identity)
                </label>
                <input
                  type="email"
                  disabled
                  value={customer.email}
                  className="w-full px-3.5 py-2.5 bg-[#EDE8E0] border border-[#DDD5C7] rounded-xl text-xs text-[#7A7167] cursor-not-allowed font-mono"
                />
                <span className="text-[11px] text-[#7A7167] mt-1 block">
                  To change your account email, please contact concierge support.
                </span>
              </div>

              <div>
                <label className="block text-[#4A423B] font-medium mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs text-[#1A1817]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-[#722F37] hover:bg-[#5E2229] text-[#F6EBD8] text-xs font-semibold rounded-xl transition-all shadow"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </Container>
    </div>
  );
}
