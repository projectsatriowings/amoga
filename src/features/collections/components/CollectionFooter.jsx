import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, Mail } from 'lucide-react';
import amogaLogo from '../../../assets/images/amoga-logo.png';
import { Container } from '../../../components/ui/Container';
import { getCollectionTheme } from '../themeConfig';
import { CollectionContactSection } from './CollectionContactSection';

const CURRENT_YEAR = 2026;

export function CollectionFooter({ collectionId = 'food' }) {
  const theme = getCollectionTheme(collectionId);
  const palette = theme?.palette || {};
  const contact = theme?.contact || {};

  return (
    <footer
      className="border-t py-12 sm:py-16 transition-colors duration-normal ease-smooth"
      style={{
        backgroundColor: palette.bg || '#F8F6F0',
        borderColor: palette.border || '#E5E0D5',
        color: palette.text || '#292820',
      }}
    >
      <Container>
        {/* Unified Interactive Contact Section */}
        <div className="mb-12 pb-12 border-b" style={{ borderColor: palette.border || '#E5E0D5' }}>
          <CollectionContactSection collectionId={collectionId} />
        </div>

        {/* Brand, Links & Provenance Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b"
          style={{ borderColor: palette.border || '#E5E0D5' }}
        >
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to={theme.homePath} className="inline-block">
              <img
                src={amogaLogo}
                alt={theme.name}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-xs leading-relaxed max-w-sm opacity-80">
              {theme.subtitle}. Curated with obsessive dedication to heritage quality, artisanal authenticity, and uncompromised provenance.
            </p>

            <div
              className="p-3.5 rounded-xl border max-w-sm space-y-1 text-xs"
              style={{
                backgroundColor: palette.cardBg || '#FFFFFF',
                borderColor: palette.border || '#E5E0D5',
              }}
            >
              <div
                className="flex items-center gap-2 font-semibold"
                style={{ color: palette.accent || palette.accentGold || '#3F7B43' }}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Orders & Wholesale Enquiries:</span>
              </div>
              <div className="font-mono" style={{ color: palette.heading || '#173B2A' }}>
                {contact.phone1} • {contact.phone2}
              </div>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4
              className="font-serif text-sm font-semibold mb-3 tracking-wider uppercase"
              style={{ color: palette.heading || '#173B2A' }}
            >
              Categories
            </h4>
            <ul className="space-y-2 text-xs">
              {theme.categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={cat.path}
                    className="hover:underline transition-colors opacity-80 hover:opacity-100"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Collections Universe */}
          <div>
            <h4
              className="font-serif text-sm font-semibold mb-3 tracking-wider uppercase"
              style={{ color: palette.heading || '#173B2A' }}
            >
              Artisanal Houses
            </h4>
            <ul className="space-y-2 text-xs opacity-80">
              <li>
                <Link to="/food" className="hover:underline hover:opacity-100">
                  Wholesome Pantry
                </Link>
              </li>
              <li>
                <Link to="/tea" className="hover:underline hover:opacity-100">
                  Wellness Tea
                </Link>
              </li>
              <li>
                <Link to="/sarees" className="hover:underline hover:opacity-100">
                  Heritage Sarees
                </Link>
              </li>
              <li>
                <Link to="/jewellery" className="hover:underline hover:opacity-100">
                  Sterling Silver
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:underline hover:opacity-100">
                  Gatekeeper Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Concierge */}
          <div>
            <h4
              className="font-serif text-sm font-semibold mb-3 tracking-wider uppercase"
              style={{ color: palette.heading || '#173B2A' }}
            >
              Client Care
            </h4>
            <ul className="space-y-2 text-xs opacity-80">
              <li>
                <a href="#contact" className="hover:underline hover:opacity-100">
                  Concierge Desk
                </a>
              </li>
              <li>
                <Link to="/cart" className="hover:underline hover:opacity-100">
                  Cart & Checkout
                </Link>
              </li>
              <li>
                <span className="opacity-60">Pan-India Insured Dispatch</span>
              </li>
              <li>
                <span className="opacity-60">Authenticity Guarantee</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs opacity-70">
          <div>
            {`© ${CURRENT_YEAR} AMOGA Luxury & Heritage Commerce. All rights reserved.`}
          </div>
          <div className="flex items-center gap-6 text-[11px] font-mono">
            <span>Razorpay Sandbox Active</span>
            <span>SSL Secured</span>
            <span>Pan-India Logistics</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
