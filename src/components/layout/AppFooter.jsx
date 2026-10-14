import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PhoneCall, Mail, MapPin } from 'lucide-react';
import amogaLogo from '../../assets/images/amoga-logo.png';
import { COLLECTIONS } from '../../data/collections';
import { Container } from '../ui/Container';
import { CollectionContactSection } from '../../features/collections/components/CollectionContactSection';

const CURRENT_YEAR = 2026;


export function AppFooter({ activeCollection }) {
  const location = useLocation();
  const isFood = activeCollection?.id === 'food';
  const isTea = activeCollection?.id === 'tea';
  const isSarees = activeCollection?.id === 'sarees';
  const isJewellery = activeCollection?.id === 'jewellery';
  const isCheckout =
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/order-confirmation') ||
    location.pathname === '/cart';

  const isGatekeeper = location.pathname === '/';

  const footerBg = isFood
    ? 'bg-[#F1EDE4] text-[#172B1C] border-[#172B1C]/10'
    : isTea
    ? 'bg-[#FAF1BB] text-[#2C1E11] border-[#B88E38]/25'
    : isSarees
    ? 'bg-[#1D0911] text-[#F6EBD8] border-[#C5A46D]/15'
    : isJewellery
    ? 'bg-[#1C1B1E] text-[#F7F3EB] border-[#B9B8B5]/15'
    : isCheckout
    ? 'bg-[#F8F6F0] text-[#292820] border-[#E5E0D5]'
    : 'bg-[#0B0C0E] text-[#F4F4F2] border-white/10';

  return (
    <>
      {/* Reusable Themed Contact Section & Interactive Form for Collections */}
      {activeCollection && (
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
                ? 'Amoga Heritage Sarees celebrates master handloom weavers, authentic temple Kanchipuram silks, Banarasi brocades, and ceremonial textiles passed down through generations.'
                : isJewellery
                ? 'Amoga Silver Jewellery curates modern heirlooms, solid 925 sterling silver bands, fluid pendants, and architectural cuffs designed for quiet, lasting elegance.'
                : 'One unified luxury identity across four distinctive artisanal universes: Wholesome Pantry, Wellness Tea, Heritage Sarees, and Silver Jewellery.'}
            </p>

            {isFood && (
              <div className="p-3.5 rounded-xl bg-white/60 border border-[#172B1C]/10 max-w-sm space-y-1 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#287A25]">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Orders & Wholesale Enquiries:</span>
                </div>
                <div className="font-mono text-[#172B1C]">
                  +91 9940018593 &bull; +91 8056700646
                </div>
              </div>
            )}

            {isTea && (
              <div className="p-3.5 rounded-xl bg-white/70 border border-[#B88E38]/25 max-w-sm space-y-1 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#8C6320]">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Tea Orders & Botanical Inquiries:</span>
                </div>
                <div className="font-mono text-[#2C1E11]">
                  +91 9940018593 &bull; +91 8056700646
                </div>
              </div>
            )}

            {isSarees && (
              <div className="p-3.5 rounded-xl bg-[#381222] border border-[#C5A46D]/20 max-w-sm space-y-1 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#C5A46D]">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Bridal Concierge & Private Appointments:</span>
                </div>
                <div className="font-mono text-[#F6EBD8]">
                  +91 9940018593 &bull; +91 8056700646
                </div>
              </div>
            )}

            {isJewellery && (
              <div className="p-3.5 rounded-xl bg-[#343238] border border-[#B9B8B5]/20 max-w-sm space-y-1 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#B9B8B5]">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Silver Sizing & Care Consultations:</span>
                </div>
                <div className="font-mono text-[#F7F3EB]">
                  +91 9940018593 &bull; +91 8056700646
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
                      All Products (61 Items)
                    </Link>
                  </li>
                </>
              ) : isTea ? (
                <>
                  <li>
                    <Link to="/tea/products/hibiscus-tea" className="hover:text-[#8C6320] hover:underline">
                      Hibiscus Tea
                    </Link>
                  </li>
                  <li>
                    <Link to="/tea/products/butterfly-blue-pea-tea" className="hover:text-[#8C6320] hover:underline">
                      Butterfly Blue Pea Tea
                    </Link>
                  </li>
                  <li>
                    <Link to="/tea/products/cinnamon-tea" className="hover:text-[#8C6320] hover:underline">
                      Cinnamon Tea
                    </Link>
                  </li>
                  <li>
                    <Link to="/tea/products/sarsaparilla-tea" className="hover:text-[#8C6320] hover:underline">
                      Sarsaparilla Tea
                    </Link>
                  </li>
                  <li>
                    <Link to="/tea/products/moringa-leaf-tea" className="hover:text-[#8C6320] hover:underline">
                      Moringa Leaf Tea
                    </Link>
                  </li>
                  <li>
                    <Link to="/tea/products" className="hover:text-[#8C6320] hover:underline font-semibold">
                      All 5 Brews
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
                      All Sarees (12 Items)
                    </Link>
                  </li>
                </>
              ) : isJewellery ? (
                <>
                  <li>
                    <Link to="/jewellery/products?category=rings" className="hover:text-[#B9B8B5] hover:underline">
                      Rings (4 Designs)
                    </Link>
                  </li>
                  <li>
                    <Link to="/jewellery/products?category=necklaces" className="hover:text-[#B9B8B5] hover:underline">
                      Necklaces & Pendants (2 Designs)
                    </Link>
                  </li>
                  <li>
                    <Link to="/jewellery/products?category=earrings" className="hover:text-[#B9B8B5] hover:underline">
                      Earrings (2 Designs)
                    </Link>
                  </li>
                  <li>
                    <Link to="/jewellery/products?category=bracelets" className="hover:text-[#B9B8B5] hover:underline">
                      Bracelets & Cuffs (1 Design)
                    </Link>
                  </li>
                  <li>
                    <Link to="/jewellery/products?category=traditional" className="hover:text-[#B9B8B5] hover:underline">
                      Traditional Silver (1 Design)
                    </Link>
                  </li>
                  <li>
                    <Link to="/jewellery/products" className="hover:text-[#B9B8B5] hover:underline font-semibold">
                      All Jewellery (10 Pieces)
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
                  <li>Temple & Regal Motifs</li>
                  <li>Insured Nationwide White-Glove Care</li>
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

          {/* Client Concierge & Store Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest font-semibold opacity-90">
              Client Concierge
            </h4>
            <ul className="space-y-2 text-xs opacity-75">
              <li>
                <Link to="/track" className="hover:opacity-100 hover:underline">
                  Track Any Order
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:opacity-100 hover:underline">
                  My Patron Account
                </Link>
              </li>
              <li>
                <Link to="/account?tab=orders" className="hover:opacity-100 hover:underline">
                  Order History
                </Link>
              </li>
              <li>
                <span className="opacity-60 cursor-not-allowed" title="Client concierge document">
                  Shipping Terms
                </span>
              </li>
              <li>
                <span className="opacity-60 cursor-not-allowed" title="Client concierge document">
                  Returns & Care
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs opacity-60 gap-4">
          <div>&copy; {CURRENT_YEAR} Amoga E-Commerce. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link to="/food" className="hover:underline">Wholesome Pantry</Link>
            <span>&bull;</span>
            <Link to="/tea" className="hover:underline">Wellness Tea</Link>
            <span>&bull;</span>
            <Link to="/sarees" className="hover:underline">Heritage Sarees</Link>
            <span>&bull;</span>
            <Link to="/jewellery" className="hover:underline">Silver Jewellery</Link>
          </div>
        </div>
      </Container>
    </footer>
    </>
  );
}
