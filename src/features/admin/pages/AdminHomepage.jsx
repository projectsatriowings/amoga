import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function AdminHomepage() {
  const { adminFetch } = useAdminStore();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch('/api/banners');
        const json = await res.json();
        if (json.banners) setBanners(json.banners);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1817]">Storefront CMS & Layout</h1>
          <p className="text-xs text-[#7A7167]">
            Configure and preview customer-facing homepage sections and published editorial content
          </p>
        </div>
        <Link
          to="/"
          target="_blank"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#722F37] text-white rounded text-xs font-semibold hover:bg-[#5E2229] w-fit"
        >
          <span>Open Live Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Live Banner Reel Preview */}
      <div className="bg-[#FBF9F5] p-6 rounded-lg border border-[#E5E0D5] space-y-4">
        <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-3">
          <div>
            <h2 className="font-serif text-base font-bold text-[#1A1817]">Active Published Hero Banners ({banners.length})</h2>
            <p className="text-xs text-[#7A7167]">These banners are currently loaded by the customer storefront</p>
          </div>
          <Link
            to="/admin/banners"
            className="text-xs text-[#722F37] hover:underline font-semibold flex items-center gap-1"
          >
            <span>Manage All Banners</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#7A7167]">Loading published banners...</div>
        ) : banners.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#7A7167]">No published banners found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {banners.map((b) => (
              <div key={b.id} className="relative rounded overflow-hidden border border-[#D5CEC2] group">
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="w-full h-40 object-cover bg-[#EAE4D9]"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/600x300/f5f2eb/1a1817?text=Hero+Banner';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end text-white">
                  <span className="text-[10px] font-mono text-[#C5A46D] uppercase">Order #{b.displayOrder}</span>
                  <h3 className="font-serif text-sm font-bold">{b.title}</h3>
                  {b.ctaLabel && (
                    <span className="text-[10px] font-mono text-[#E8E2D8] mt-1">
                      Link: {b.ctaLink}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storefront Sections Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5] space-y-2">
          <h3 className="font-serif text-sm font-bold text-[#1A1817]">1. Four Luxury Portals</h3>
          <p className="text-xs text-[#5C544C] leading-relaxed">
            The Gatekeeper displays Wholesome Pantry, Wellness Tea, Heritage Sarees, and Silver Jewellery.
          </p>
          <Link to="/admin/collections" className="text-xs text-[#722F37] font-semibold hover:underline block pt-2">
            Configure Collections →
          </Link>
        </div>

        <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5] space-y-2">
          <h3 className="font-serif text-sm font-bold text-[#1A1817]">2. Featured Showcases</h3>
          <p className="text-xs text-[#5C544C] leading-relaxed">
            Highlighted products selected via the unified product editor appear with "Bestseller" & artisanal badges.
          </p>
          <Link to="/admin/products" className="text-xs text-[#722F37] font-semibold hover:underline block pt-2">
            Edit Featured Products →
          </Link>
        </div>

        <div className="bg-[#FBF9F5] p-5 rounded-lg border border-[#E5E0D5] space-y-2">
          <h3 className="font-serif text-sm font-bold text-[#1A1817]">3. Promotional Discounts</h3>
          <p className="text-xs text-[#5C544C] leading-relaxed">
            Active promotional coupons validate on checkout with minimum order amounts and maximum caps.
          </p>
          <Link to="/admin/promotions" className="text-xs text-[#722F37] font-semibold hover:underline block pt-2">
            Manage Coupons →
          </Link>
        </div>
      </div>
    </div>
  );
}
