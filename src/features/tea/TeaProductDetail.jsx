import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  Heart,
  Plus,
  Minus,
  Leaf,
  Clock,
  MapPin,
  HelpCircle,
  PhoneCall,
  Zap,
  Bell,
} from 'lucide-react';
import { TeaProductCard } from './components/TeaProductCard';
import { BotanicalSideAnimations } from './components/BotanicalAnimations';

import { useStore } from '../../store/useStore';
import { Container } from '../../components/ui/Container';
import { useProductDetail, useProducts } from '../../hooks/useProducts';
import { BackButton } from '../../components/ui/BackButton';
import { resolveAvailability } from '../../utils/inventory';
import { RestockModal } from '../../components/ui/RestockModal';
import { ProductReviewsSection } from '../../components/reviews/ProductReviewsSection.jsx';

export function TeaProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { product, isLoading } = useProductDetail('tea', slug);
  const { products: allTeas } = useProducts({ collection: 'tea' });

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  const { addToCart, toggleWishlistItem, isInWishlist, initiateBuyNow, openCart } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [addError, setAddError] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);

  // Set default variant if available
  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && !selectedVariant) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product, selectedVariant]);

  const availability = resolveAvailability(product, selectedVariant);

  const gallery = useMemo(() => {
    if (!product) return [];
    const list = [product.image];
    if (Array.isArray(product.gallery)) {
      product.gallery.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list;
  }, [product]);

  const activeImage = selectedVariant?.image || gallery[activeImageIndex] || product?.image;

  // While loading from API for newly created or dynamic products, render skeleton/loader instead of premature not-found
  if (isLoading && !product) {
    return (
      <div className="bg-[#FAF1BB] text-[#2C1E11] min-h-[70vh] flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 border-3 border-[#8C6320] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs uppercase font-mono tracking-widest text-[#8C6320]">Brewing Tea Details...</span>
      </div>
    );
  }

  // If unknown slug, display graceful not-found state
  if (!product) {
    return (
      <div className="bg-[#FAF1BB] text-[#2C1E11] min-h-[70vh] flex items-center justify-center py-16">
        <Container size="narrow" className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF1BB] text-[#8C6320] flex items-center justify-center mx-auto border border-[#B88E38]/30">
            <HelpCircle className="w-8 h-8 opacity-70" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#2C1E11]">
            Botanical Brew Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[#543B25] max-w-md mx-auto">
            The herbal tea with identifier <code className="font-mono text-[#8C6320]">"{slug}"</code> is not found in the active Amoga Tea catalogue.
          </p>
          <div className="pt-2">
            <Link
              to="/tea/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2C1E11] text-[#FAF1BB] text-xs font-semibold uppercase tracking-wider hover:bg-[#8C6320]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Tea Catalogue</span>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const hasPrice = product.price !== null;

  // Other teas in the collection from database
  const otherTeas = (allTeas || []).filter((p) => p.id !== product.id && p.slug !== slug).slice(0, 4);

  const handleAddToCart = () => {
    if (addedSuccess) {
      openCart();
      return;
    }
    setAddError(null);
    if (availability.isOutOfStock) {
      setShowRestockModal(true);
      return;
    }
    if (!hasPrice) {
      setAddError('This botanical brew is currently awaiting price confirmation.');
      return;
    }
    if (availability.availableQuantity > 0 && quantity > availability.availableQuantity) {
      setAddError(`Only ${availability.availableQuantity} pack(s) currently available.`);
      return;
    }
    const res = addToCart(product, quantity, selectedVariant);
    if (res?.success) {
      setAddedSuccess(true);
      setTimeout(() => {
        setAddedSuccess(false);
      }, 3000);
    } else {
      setAddError('Could not add tea to cart. Please try again.');
    }
  };

  const handleBuyNow = () => {
    setAddError(null);
    if (availability.isOutOfStock) {
      setShowRestockModal(true);
      return;
    }
    if (!hasPrice) {
      setAddError('This tea is currently awaiting price confirmation.');
      return;
    }
    if (availability.availableQuantity > 0 && quantity > availability.availableQuantity) {
      setAddError(`Only ${availability.availableQuantity} pack(s) currently available.`);
      return;
    }
    const res = initiateBuyNow(product, quantity, selectedVariant);
    if (res?.success) {
      navigate('/checkout');
    } else {
      setAddError('Could not initiate Buy Now for this brew.');
    }
  };

  return (
    <div className="relative bg-[#FAF1BB] text-[#2C1E11] min-h-screen pt-2 sm:pt-3 pb-12 overflow-hidden">
      {/* Decorative Botanical Side Animations */}
      <BotanicalSideAnimations />

      <Container className="relative z-10">
        {/* Breadcrumb Navigation & Theme-Colored Back Button */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <BackButton
            collection="tea"
            fallbackTo="/tea/products"
            label="Back to Teas"
          />

          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#543B25]">
            <Link to="/" className="hover:text-[#2C1E11] transition-colors">
              Portal
            </Link>
            <span>/</span>
            <Link to="/tea" className="hover:text-[#2C1E11] transition-colors">
              Wellness Tea
            </Link>
            <span>/</span>
            <Link to="/tea/products" className="hover:text-[#2C1E11] transition-colors">
              Botanical Brews
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#8C6320] truncate">{product.name}</span>
          </nav>
        </div>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 bg-[#FFFDF5] p-6 sm:p-10 rounded-3xl border border-[#B88E38]/30 shadow-lg mb-16">
          {/* Left Column: Product Photography & Thumbnail Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-2xl overflow-hidden aspect-square bg-[#FAF1BB]/60 border border-[#B88E38]/20 shadow-md">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-opacity duration-300"
              />

              {product.badge && (
                <div className="absolute top-4 left-4">
                  <span className="px-3.5 py-1 rounded-full bg-white/75 backdrop-blur-md text-[#2C1E11] text-xs font-mono font-bold uppercase tracking-wider shadow-sm border border-white/60">
                    {product.badge}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery (Up to 4 images, with smooth mobile swipe/scroll) */}
            {gallery.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(idx);
                      // If user selects thumbnail, clear active variant override to show clicked image
                      if (selectedVariant?.image && selectedVariant.image !== img) {
                        // User explicitly clicked a thumbnail
                      }
                    }}
                    className={`relative w-20 aspect-square rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImage === img
                        ? 'border-[#8C6320] scale-105 shadow-md'
                        : 'border-[#B88E38]/20 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Narrative, Details & Actions */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-mono uppercase tracking-widest text-[#8C6320] font-semibold flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-[#B88E38]" />
                  <span>{product.categoryName || 'Single-Origin Herbal Tea'}</span>
                </span>

                <button
                  type="button"
                  onClick={() => toggleWishlistItem(product)}
                  className={`p-2.5 rounded-full border transition-all ${
                    inWishlist
                      ? 'bg-red-50 text-red-500 border-red-200'
                      : 'bg-white text-black/60 border-black/10 hover:text-red-500'
                  }`}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif text-[#2C1E11] leading-tight">
                {product.name}
              </h1>

              {product.botanicalName && (
                <div className="text-xs font-mono text-[#8C6320] italic">
                  Botanical Species: {product.botanicalName}
                </div>
              )}

              {/* Pricing Display */}
              <div className="pt-2 border-t border-[#B88E38]/20 space-y-2">
                {hasPrice ? (
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="text-3xl font-sans font-bold text-[#2C1E11] tabular-nums font-numeric">
                        ₹{typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}
                      </span>
                      <span className="text-sm font-sans font-medium text-[#8C6320]">
                        / Pack
                      </span>
                      <span className="text-xs font-sans font-medium text-[#8C6320] bg-white/80 px-2.5 py-0.5 rounded-full border border-[#B88E38]/25 tabular-nums font-numeric">
                        Net Weight: {selectedVariant?.attributes?.weight || selectedVariant?.attributes?.packSize || product.packSize || '25 g'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8C6320] font-medium">
                      Inclusive of GST • Sold per pack • India Post delivery calculated at checkout
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-lg font-serif italic text-[#8C6320]">
                      Artisanal Reserve &bull; Price to be confirmed
                    </span>
                    <p className="text-[11px] text-[#7D5C3F]">
                      Seasonal botanical harvests are batched to order. Contact our desk for packaging options.
                    </p>
                  </div>
                )}

                {/* Stock Status Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium ${
                      availability.badgeVariant === 'success'
                        ? 'bg-emerald-900/10 text-emerald-800 border border-emerald-500/30'
                        : availability.badgeVariant === 'warning'
                        ? 'bg-amber-900/10 text-amber-800 border border-amber-500/30'
                        : 'bg-rose-900/10 text-rose-800 border border-rose-500/30'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        availability.badgeVariant === 'success'
                          ? 'bg-emerald-600'
                          : availability.badgeVariant === 'warning'
                          ? 'bg-amber-600 animate-pulse'
                          : 'bg-rose-600'
                      }`}
                    />
                    {availability.label}
                  </span>
                </div>
              </div>

              {/* Variant Selector (if product has variants) */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#B88E38]/20">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#8C6320] font-semibold">
                    Select Pack / Option:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id || selectedVariant?.name === variant.name;
                      return (
                        <button
                          key={variant.id || variant.name}
                          type="button"
                          onClick={() => {
                            setSelectedVariant(variant);
                            if (variant.image) {
                              // Variant image immediately displays
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#2C1E11] text-[#FAF1BB] border-[#2C1E11] shadow-xs'
                              : 'bg-white text-[#4A423B] border-[#D5CEC2] hover:border-[#8C6320]'
                          }`}
                        >
                          {variant.name} {variant.price ? `(₹${variant.price})` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#543B25] leading-relaxed">
                {product.description}
              </p>

              {/* Botanical Spec Matrix */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                {product.origin && (
                  <div className="p-3 rounded-xl bg-white/60 border border-[#B88E38]/15 space-y-1">
                    <div className="flex items-center gap-1.5 text-[#8C6320] font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Single Origin</span>
                    </div>
                    <div className="text-[11px] text-[#2C1E11]">{product.origin}</div>
                  </div>
                )}
                {product.brewingTime && (
                  <div className="p-3 rounded-xl bg-white/60 border border-[#B88E38]/15 space-y-1">
                    <div className="flex items-center gap-1.5 text-[#8C6320] font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Steeping Time</span>
                    </div>
                    <div className="text-[11px] text-[#2C1E11]">{product.brewingTime}</div>
                  </div>
                )}
              </div>

              {/* Feature Bullet Points */}
              {product.details && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#8C6320] font-semibold">
                    Harvest & Craft Highlights:
                  </div>
                  <ul className="space-y-1 text-xs text-[#543B25]">
                    {product.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#B88E38] font-bold">&bull;</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-6 border-t border-[#B88E38]/20 space-y-4">
              {availability.isOutOfStock ? (
                <button
                  type="button"
                  onClick={() => setShowRestockModal(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-amber-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-amber-700 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-amber-100" />
                  <span>Notify Me When Back in Stock</span>
                </button>
              ) : hasPrice ? (
                <>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Quantity selector */}
                    <div className="flex items-center justify-between border border-[#B88E38]/30 rounded-full px-3 py-1.5 bg-white w-36 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-1 hover:text-[#8C6320] text-[#2C1E11]"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-sans text-xs font-semibold tabular-nums font-numeric text-[#2C1E11]">
                        {quantity} {quantity === 1 ? 'Pack' : 'Packs'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) =>
                            availability.availableQuantity > 0
                              ? Math.min(availability.availableQuantity, q + 1)
                              : q + 1
                          )
                        }
                        className="p-1 hover:text-[#8C6320] text-[#2C1E11]"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Add to Cart CTA */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-[#2C1E11] text-[#FAF1BB] text-xs font-semibold uppercase tracking-wider hover:bg-[#8C6320] hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{addedSuccess ? 'Added to Cart!' : 'Add to Cart'}</span>
                    </button>

                    {/* Buy Now CTA */}
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-[#B88E38] text-[#2C1E11] text-xs font-semibold uppercase tracking-wider hover:bg-[#8C6320] hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-xl bg-[#FFFDF5] border border-[#B88E38]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#2C1E11] font-medium">
                    <PhoneCall className="w-4 h-4 text-[#8C6320]" />
                    <span>
                      Customer Inquiries:{' '}
                      <a href="tel:+919940018593" className="underline font-mono">+91 9940018593</a>
                      {' '}&bull;{' '}
                      <a href="tel:+918056700646" className="underline font-mono">+91 8056700646</a>
                    </span>
                  </div>
                  <Link
                    to="/tea/products"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#B88E38] text-[#2C1E11] font-semibold uppercase tracking-wider text-[11px] hover:bg-[#8C6320] hover:text-white transition-colors"
                  >
                    <span>Browse All Teas</span>
                  </Link>
                </div>
              )}

              {addError && (
                <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs">
                  {addError}
                </div>
              )}

              {/* FSSAI Food Safety & Transit Guarantee */}
              <div className="p-3.5 rounded-2xl bg-white/70 border border-[#B88E38]/25 text-xs space-y-1.5 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-[#2C1E11]">
                    <div className="bg-white rounded px-1.5 py-0.5 border border-[#B88E38]/25 flex items-center">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/en/e/e2/FSSAI_logo.png"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/fssai-logo.png';
                        }}
                        alt="FSSAI"
                        className="h-4 w-auto object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="font-mono text-xs">Lic. No. 22425540000677</span>
                  </div>
                  <Link
                    to="/returns-policy"
                    className="text-[11px] font-semibold text-[#8C6320] hover:underline"
                  >
                    Transit Policy &rarr;
                  </Link>
                </div>
                <p className="text-[11px] text-[#5C544C] leading-relaxed">
                  Aroma-sealed botanical tea. Non-returnable once opened; 100% immediate replacement or refund guarantee for transit seal damage or defect.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Teas Showcase */}
        {otherTeas.length > 0 && (
          <div className="space-y-6">
            <div className="border-b border-[#B88E38]/20 pb-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#8C6320]">
                  Complete The Collection
                </span>
                <h2 className="text-2xl font-serif text-[#2C1E11]">
                  Other Herbal Brews in this Range
                </h2>
              </div>
              <Link
                to="/tea/products"
                className="text-xs font-medium text-[#8C6320] hover:text-[#2C1E11] underline"
              >
                View all brews &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {otherTeas.map((other) => (
                <TeaProductCard key={other.id} product={other} />
              ))}
            </div>
          </div>
        )}

        {/* Patron Reviews & Ratings */}
        <ProductReviewsSection
          productId={product.id || product.slug}
          productName={product.name}
          collectionId="tea"
          palette={{ accent: '#8C6320', heading: '#2C1E11' }}
        />
      </Container>

      <RestockModal
        isOpen={showRestockModal}
        onClose={() => setShowRestockModal(false)}
        product={product}
      />
    </div>
  );
}
