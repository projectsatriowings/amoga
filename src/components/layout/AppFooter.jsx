import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PhoneCall, Mail, MapPin } from 'lucide-react';
import amogaLogo from '../../assets/images/amoga-logo.png';
import { COLLECTIONS } from '../../data/collections';
import { Container } from '../ui/Container';
import { CollectionContactSection } from '../../features/collections/components/CollectionContactSection';

const CURRENT_YEAR = 2026;


export function AppFooter({ activeCollection, resolvedTheme }) {
  const location = useLocation();
  const isCheckout =
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/order-confirmation') ||
    location.pathname === '/cart';

  const isFood = !isCheckout && activeCollection?.id === 'food';
  const isTea = !isCheckout && activeCollection?.id === 'tea';
  const isSarees = !isCheckout && activeCollection?.id === 'sarees';
  const isJewellery = !isCheckout && activeCollection?.id === 'jewellery';

  const isGatekeeper = location.pathname === '/';

  const footerBg = isCheckout
    ? 'bg-[#FAF8F5] text-[#292820] border-[#EAE3D5]'
    : isFood
    ? 'bg-[#F1EDE4] text-[#172B1C] border-[#172B1C]/10'
    : isTea
    ? 'bg-[#FAF1BB] text-[#2C1E11] border-[#B88E38]/25'
    : isSarees
    ? 'bg-[#1D0911] text-[#F6EBD8] border-[#C5A46D]/15'
    : isJewellery
    ? 'bg-[#1C1B1E] text-[#F7F3EB] border-[#B9B8B5]/15'
    : 'bg-[#0B0C0E] text-[#F4F4F2] border-white/10';

  return (
    <>
      {/* Reusable Themed Contact Section & Interactive Form for Collections (Hidden on checkout & cart) */}
      {activeCollection && !isCheckout && (
        <CollectionContactSection collectionId={activeCollection.id} />
      )}

      <footer
        className={`border-t py-12 sm:py-16 transition-colors duration-normal ease-smooth ${footerBg}`}
      >
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-current/10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <img
                src={amogaLogo}
                alt="Amoga"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-xs leading-relaxed max-w-sm opacity-80">
              {isFood
                ? 'Amoga Wholesome Pantry brings traditional soup mixes, nourishing millet mixes, and flavourful rice podis straight to everyday meals.'
                : isTea
                ? 'Amoga Wellness Tea curates botanical teas and herbal infusions for your everyday tea ritual.'
                : isSarees
                ? 'Amoga Heritage Sarees celebrates master handloom weavers, authentic temple Kanchipuram silks, Banarasi brocades, and traditional sarees.'
                : isJewellery
                ? 'Amoga Sterling Silver offers solid 925 sterling silver rings, fluid pendants, and handcrafted jewellery for everyday wear and gifting.'
                : 'Simple, authentic quality across four collections: Wholesome Pantry, Wellness Tea, Heritage Sarees, and Sterling Silver.'}
            </p>

            {isFood && (
              <div className="p-3.5 rounded-xl bg-white/60 border border-[#172B1C]/10 max-w-sm space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#287A25]">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Orders & Wholesale Enquiries:</span>
                </div>
                <div className="font-mono text-[#172B1C] flex items-center gap-2 flex-wrap">
                  <a href="tel:+919940018593" className="hover:underline font-semibold">+91 9940018593</a>
                  <span>&bull;</span>
                  <a href="tel:+918056700646" className="hover:underline font-semibold">+91 8056700646</a>
                </div>
                <div className="text-[11px] opacity-75 flex items-center gap-2 flex-wrap">
                  <span>Mon – Sat • 9:00 AM – 7:00 PM IST</span>
                </div>
              </div>
            )}

            {isTea && (
              <div className="p-3.5 rounded-xl bg-white/70 border border-[#B88E38]/25 max-w-sm space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#8C6320]">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Tea Orders & Botanical Inquiries:</span>
                </div>
                <div className="font-mono text-[#2C1E11] flex items-center gap-2 flex-wrap">
                  <a href="tel:+919940018593" className="hover:underline font-semibold">+91 9940018593</a>
                  <span>&bull;</span>
                  <a href="tel:+918056700646" className="hover:underline font-semibold">+91 8056700646</a>
                </div>
                <div className="text-[11px] opacity-75 flex items-center gap-2 flex-wrap">
                  <span>Mon – Sat • 9:00 AM – 7:00 PM IST</span>
                </div>
              </div>
            )}

            {isSarees && (
              <div className="p-3.5 rounded-xl bg-[#381222] border border-[#C5A46D]/20 max-w-sm space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#C5A46D]">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Customer Support & Bridal Orders:</span>
                </div>
                <div className="font-mono text-[#F6EBD8] flex items-center gap-2 flex-wrap">
                  <a href="tel:+919940018593" className="hover:underline font-semibold">+91 9940018593</a>
                  <span>&bull;</span>
                  <a href="tel:+918056700646" className="hover:underline font-semibold">+91 8056700646</a>
                </div>
                <div className="text-[11px] opacity-75 flex items-center gap-2 flex-wrap">
                  <span>Mon – Sat • 9:00 AM – 7:00 PM IST</span>
                </div>
              </div>
            )}

            {isJewellery && (
              <div className="p-3.5 rounded-xl bg-[#343238] border border-[#B9B8B5]/20 max-w-sm space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#B9B8B5]">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Customer Support & Jewellery Enquiries:</span>
                </div>
                <div className="font-mono text-[#F7F3EB] flex items-center gap-2 flex-wrap">
                  <a href="tel:+919940018593" className="hover:underline font-semibold">+91 9940018593</a>
                  <span>&bull;</span>
                  <a href="tel:+918056700646" className="hover:underline font-semibold">+91 8056700646</a>
                </div>
                <div className="text-[11px] opacity-75 flex items-center gap-2 flex-wrap">
                  <span>Mon – Sat • 9:00 AM – 7:00 PM IST</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Shop Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest font-semibold opacity-90">
              {isFood ? 'Food Categories' : isTea ? 'Herbal Brews' : isSarees ? 'Saree Collections' : isJewellery ? 'Jewellery Pieces' : 'Collections'}
            </h4>
            <ul className="space-y-2 text-xs opacity-75">
              {isFood ? (
                <>
                  <li>
                    <Link to="/food/products?category=soups" className="hover:text-[#287A25] hover:underline">
                      Soup Ready Mix (20 Recipes)
                    </Link>
                  </li>
                  <li>
                    <Link to="/food/products?category=millets" className="hover:text-[#287A25] hover:underline">
                      Millet Collection (10 Items)
                    </Link>
                  </li>
                  <li>
                    <Link to="/food/products?category=podis" className="hover:text-[#287A25] hover:underline">
                      Rice Podi Collection (25 Items)
                    </Link>
                  </li>
                  <li>
                    <Link to="/food/products" className="hover:text-[#287A25] hover:underline font-semibold">
                      All Pantry Blends
                    </Link>
                  </li>
                </>
              ) : isTea ? (
                <>
                  <li>
                    <Link to="/tea/products?category=flower" className="hover:text-[#8C6320] hover:underline">
                      Flower & Herbal Infusions
                    </Link>
                  </li>
                  <li>
                    <Link to="/tea/products?category=leaf" className="hover:text-[#8C6320] hover:underline">
                      Botanical Leaf Blends
                    </Link>
                  </li>
                  <li>
                    <Link to="/tea/products?category=herbal" className="hover:text-[#8C6320] hover:underline">
                      Ayurvedic Root Teas
                    </Link>
                  </li>
                  <li>
                    <Link to="/tea/products" className="hover:text-[#8C6320] hover:underline font-semibold">
                      All Botanical Brews
                    </Link>
                  </li>
                </>
              ) : isSarees ? (
                <>
                  <li>
                    <Link to="/sarees/products?category=silk" className="hover:text-[#C5A46D] hover:underline">
                      Silk Sarees
                    </Link>
                  </li>
                  <li>
                    <Link to="/sarees/products?category=traditional" className="hover:text-[#C5A46D] hover:underline">
                      Traditional Weaves
                    </Link>
                  </li>
                  <li>
                    <Link to="/sarees/products?category=festive" className="hover:text-[#C5A46D] hover:underline">
                      Festive Collection
                    </Link>
                  </li>
                  <li>
                    <Link to="/sarees/products?category=wedding" className="hover:text-[#C5A46D] hover:underline">
                      Wedding Sarees
                    </Link>
                  </li>
                  <li>
                    <Link to="/sarees/products?category=contemporary" className="hover:text-[#C5A46D] hover:underline">
                      Contemporary Designs
                    </Link>
                  </li>
                  <li>
                    <Link to="/sarees/products" className="hover:text-[#C5A46D] hover:underline font-semibold">
                      All Heritage Sarees
                    </Link>
                  </li>
                </>
              ) : isJewellery ? (
                <>
                  <li>
                    <Link to="/jewellery/products?category=rings" className="hover:text-[#B9B8B5] hover:underline">
                      Rings
                    </Link>
                  </li>
                  <li>
                    <Link to="/jewellery/products?category=necklaces" className="hover:text-[#B9B8B5] hover:underline">
                      Necklaces & Pendants
                    </Link>
                  </li>
                  <li>
                    <Link to="/jewellery/products?category=earrings" className="hover:text-[#B9B8B5] hover:underline">
                      Earrings
                    </Link>
                  </li>
                  <li>
                    <Link to="/jewellery/products?category=bracelets" className="hover:text-[#B9B8B5] hover:underline">
                      Bracelets & Cuffs
                    </Link>
                  </li>
                  <li>
                    <Link to="/jewellery/products?category=traditional" className="hover:text-[#B9B8B5] hover:underline">
                      Traditional Silver
                    </Link>
                  </li>
                  <li>
                    <Link to="/jewellery/products" className="hover:text-[#B9B8B5] hover:underline font-semibold">
                      All Silver Jewellery
                    </Link>
                  </li>
                </>
              ) : (
                COLLECTIONS.map((c) => (
                  <li key={c.id}>
                    <Link to={c.path} className="hover:opacity-100 hover:underline">
                      {c.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* About & Values */}
          <div id="our-story" className="space-y-3">
            <h4 id="sustainability" className="text-xs font-mono uppercase tracking-widest font-semibold opacity-90">
              Brand Values
            </h4>
            <ul className="space-y-2 text-xs opacity-75">
              {isJewellery ? (
                <>
                  <li>Solid 925 Sterling Silver Base</li>
                  <li>Anti-Tarnish Protective Sealing</li>
                  <li>Restrained Minimalist Geometry</li>
                  <li>Hypoallergenic & Nickel-Safe</li>
                  <li>Complimentary Insured Shipping</li>
                </>
              ) : isSarees ? (
                <>
                  <li>Verified Handloom Provenance</li>
                  <li>Pure Mulberry Silkmark Silks</li>
                  <li>Authentic Zari Craftsmanship</li>
                  <li>Temple & Traditional Motifs</li>
                  <li>Insured Pan-India Delivery</li>
                </>
              ) : (
                <>
                  <li>100% Farm-Direct Sourcing</li>
                  <li>No Artificial Additives</li>
                  <li>Sustainable Smallholder Mills</li>
                  <li>Handcrafted Recipe Formulations</li>
                  <li>Stone-Ground Preservation</li>
                </>
              )}
            </ul>
          </div>

          {/* Customer Support & Store Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest font-semibold opacity-90">
              Customer Support
            </h4>
            <ul className="space-y-2 text-xs opacity-75">
              <li>
                <Link to="/track" className="hover:opacity-100 hover:underline">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:opacity-100 hover:underline">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/account?tab=orders" className="hover:opacity-100 hover:underline">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:opacity-100 hover:underline">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/returns-policy" className="hover:opacity-100 hover:underline">
                  Returns and Product Care
                </Link>
              </li>
            </ul>

            {/* Social Media Links */}
            <div className="pt-2">
              <h5 className="text-[11px] font-mono uppercase tracking-widest font-semibold opacity-90 mb-2">
                Follow Amoga
              </h5>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.facebook.com/amogastores/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-current/5 hover:bg-current/15 transition-all text-current opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current/40"
                  aria-label="Visit Amoga on Facebook (opens in new tab)"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/amogastores/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-current/5 hover:bg-current/15 transition-all text-current opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current/40"
                  aria-label="Visit Amoga on Instagram (opens in new tab)"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Business, GST & FSSAI Food Safety Compliance Bar */}
        <div className="py-6 border-b border-current/10 text-xs opacity-85 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap font-medium">
                <span className="font-semibold text-current opacity-100">Amoga Luxury Private Limited</span>
                <span className="opacity-40">•</span>
                <span>Trade Name: <strong>Amoga</strong></span>
                <span className="opacity-40">•</span>
                <span className="font-mono">GSTIN: <strong>33AYMPK1833D1ZQ</strong> (Tamil Nadu, State Code 33)</span>
                <span className="opacity-40">•</span>
                <span className="font-mono">PAN: <strong>AYMPK1833D</strong></span>
              </div>
              <p className="text-[11px] opacity-75">
                Registered Office: 108, Heritage Walk, Anna Salai, T. Nagar, Chennai, Tamil Nadu - 600017, India
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 p-2.5 rounded-xl bg-current/5 border border-current/10 text-[11px]">
              <div className="bg-white rounded-md p-1 border border-current/15 flex items-center justify-center shrink-0 shadow-xs">
                <img
                  src="https://upload.wikimedia.org/wikipedia/en/e/e2/FSSAI_logo.png"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/fssai-logo.png';
                  }}
                  alt="FSSAI Food Safety Logo"
                  className="h-7 w-auto object-contain"
                  loading="lazy"
                />
              </div>
              <div className="space-y-0.5">
                <div className="font-mono font-bold tracking-tight text-xs">
                  Lic. No. 22425540000677
                </div>
                <div className="text-[10px] opacity-75">
                  Food Safety and Standards Authority of India
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] opacity-65 leading-relaxed">
            Amoga Wholesome Pantry and Wellness Tea items comply with Food Safety and Standards (Licensing and Registration of Food Businesses) Regulations. Return/replacement requests for transit defects may be submitted under our <Link to="/returns-policy" className="underline hover:opacity-100">Return Policy</Link>.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs opacity-60 gap-4">
          <div>{`© ${CURRENT_YEAR} Amoga E-Commerce. All rights reserved.`}</div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link to="/food" className="hover:underline">Wholesome Pantry</Link>
            <span>&bull;</span>
            <Link to="/tea" className="hover:underline">Wellness Tea</Link>
            <span>&bull;</span>
            <Link to="/sarees" className="hover:underline">Heritage Sarees</Link>
            <span>&bull;</span>
            <Link to="/jewellery" className="hover:underline">Sterling Silver</Link>
          </div>
        </div>
      </Container>
    </footer>
    </>
  );
}
