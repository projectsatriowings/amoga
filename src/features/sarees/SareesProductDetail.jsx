import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Heart,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  Info,
  ArrowRight,
  Eye,
  Scissors,
  Sparkles,
  Zap,
  Bell,
} from 'lucide-react';
import { getSareeBySlug, SAREE_PRODUCTS } from './data/products';
import { SareeProductCard } from './components/SareeProductCard';
import { resolveAvailability } from '../../utils/inventory.js';
import { RestockModal } from '../../components/ui/RestockModal.jsx';

import { useStore } from '../../store/useStore';
import { Container } from '../../components/ui/Container';
import { useProductDetail } from '../../hooks/useProducts';
import { BackButton } from '../../components/ui/BackButton';
import { CallToOrderAssistance } from '../../components/common/CallToOrderAssistance';

export function SareesProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const staticProduct = getSareeBySlug(slug);
  const { product: apiProduct } = useProductDetail('sarees', slug, staticProduct);
  const product = apiProduct || staticProduct;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  const { isInWishlist, toggleWishlistItem, addToCart, initiateBuyNow } = useStore();

  // State management for gallery, variants, and quantity
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [addError, setAddError] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);

  // Derive active variant directly during render
  const selectedVariant =
    product?.variants?.find((v) => v.id === selectedVariantId) ||
    product?.variants?.[0] ||
    null;

  const availability = resolveAvailability(product, selectedVariant);

  // Graceful 404 / Not Found state for unknown slug
  if (!product) {
    return (
      <div className="bg-[#2C0E1A] text-[#F6EBD8] min-h-[70vh] flex items-center justify-center py-16">
        <Container>
          <div className="max-w-md mx-auto text-center p-8 rounded-2xl bg-[#381222] border border-[#C5A46D]/25 space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-[#451523] flex items-center justify-center mx-auto text-[#C5A46D]">
              <Info className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl text-[#F6EBD8]">Saree Design Not Found</h1>
            <p className="text-xs text-[#D4C2A7]">
              The requested handloom record &ldquo;{slug}&rdquo; does not exist in the current catalogue archive.
            </p>
            <div className="pt-2">
              <Link
                to="/sarees/products"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C5A46D] text-[#2C0E1A] text-xs font-medium uppercase tracking-wider hover:bg-[#d9bb85] transition-colors"
              >
                <span>Return to Catalogue</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const gallery = product.gallery || [product.image];
  const activeImage = gallery[activeImageIndex] || product.image;
  const hasPrice = product.price !== null;

  const handleAddToCart = () => {
    setAddError(null);
    if (availability.isOutOfStock) {
      setShowRestockModal(true);
      return;
    }
    if (!hasPrice) {
      setAddError('This saree design is currently awaiting confirmed retail pricing.');
      return;
    }
    const res = addToCart(product, quantity, selectedVariant);
    if (res?.success) {
      setAddedNotice(true);
    } else {
      setAddError('Could not add saree to bag. Please try again.');
    }
  };

  const handleBuyNow = () => {
    setAddError(null);
    if (availability.isOutOfStock) {
      setShowRestockModal(true);
      return;
    }
    if (!hasPrice) {
      setAddError('This saree design is currently awaiting confirmed retail pricing.');
      return;
    }
    const res = initiateBuyNow(product, quantity, selectedVariant);
    if (res?.success) {
      navigate('/checkout');
    } else {
      setAddError('Could not initiate Buy Now for this saree.');
    }
  };

  // Related products from same category, excluding current
  const relatedProducts = SAREE_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  return (
    <div className="bg-[#2C0E1A] text-[#F6EBD8] min-h-screen pt-2 sm:pt-3 pb-12">
      <Container>
        {/* Breadcrumb Navigation & Theme-Colored Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <BackButton
            collection="sarees"
            fallbackTo="/sarees/products"
            label="Back to Sarees"
          />

          <nav
            aria-label="Product Breadcrumb"
            className="flex items-center gap-2 text-xs font-mono text-[#C5A46D] overflow-x-auto whitespace-nowrap"
          >
            <Link to="/" className="hover:underline flex items-center gap-1 text-[#D4C2A7]">
              <Home className="w-3.5 h-3.5" />
              <span>Portal</span>
            </Link>
            <span>/</span>
            <Link to="/sarees" className="hover:underline text-[#D4C2A7]">
              Heritage Sarees
            </Link>
            <span>/</span>
            <Link
              to={`/sarees/products?category=${product.category}`}
              className="hover:underline text-[#D4C2A7]"
            >
              {product.categoryName}
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#F6EBD8]">{product.name}</span>
          </nav>
        </div>

        {/* Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Gallery (6 Columns on Large) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#381222] border-2 border-[#C5A46D]/30 shadow-2xl">
              <img
                src={activeImage}
                alt={`${product.name} - view ${activeImageIndex + 1}`}
                className="w-full h-full object-cover transition-opacity duration-300"
              />

              {/* Floating Badge */}
              {product.badge && (
                <div className="absolute top-4 left-4 pointer-events-none">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-3 py-1 rounded-full bg-[#2C0E1A]/65 backdrop-blur-md text-[#F6EBD8] border border-[#C5A46D]/40 shadow-sm">
                    {product.badge}
                  </span>
                </div>
              )}

              {/* Floating Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleWishlistItem(product)}
                className="absolute top-4 right-4 p-3 rounded-full bg-[#2C0E1A]/85 hover:bg-[#2C0E1A] text-[#F6EBD8] border border-[#C5A46D]/40 backdrop-blur-sm transition-transform active:scale-95"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted ? 'fill-red-500 text-red-500' : 'text-[#F6EBD8]'
                  }`}
                />
              </button>
            </div>

            {/* Clickable Thumbnail Gallery */}
            {gallery.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 aspect-square rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-[#C5A46D] scale-105 shadow-md'
                        : 'border-[#C5A46D]/20 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details & Purchase Form (6 Columns) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2 border-b border-[#C5A46D]/20 pb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[#C5A46D]">
                  {product.categoryName}
                </span>
                <span className="text-[#C5A46D]/40">&bull;</span>
                <span className="text-xs font-mono text-[#D4C2A7]">
                  SKU: {product.id}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl text-[#F6EBD8]">
                {product.name}
              </h1>

              <p className="text-sm font-sans text-[#D4C2A7] italic">
                {product.tagline}
              </p>

              {/* Live Availability Badge */}
              <div className="pt-2">
                {availability.isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 text-rose-200 border border-rose-400/40 text-xs font-mono font-semibold">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    <span>Out of Stock</span>
                  </span>
                ) : availability.isLowStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 text-amber-200 border border-amber-400/40 text-xs font-mono font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Low Stock — Only {availability.availableQuantity} left</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#381222] text-[#F6EBD8] border border-[#C5A46D]/40 text-xs font-mono font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#C5A46D]" />
                    <span>In Stock — {availability.availableQuantity} available</span>
                  </span>
                )}
              </div>

              {/* Price Display */}
              <div className="pt-3">
                {hasPrice ? (
                  <div className="flex items-baseline gap-3">
                    <span className="font-sans text-3xl font-bold text-[#F6EBD8] tabular-nums">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-mono text-[#C5A46D]">
                      Verified Catalogue Price (All Taxes Included)
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#451523] border border-[#C5A46D]/30 text-[#C5A46D] text-xs font-mono">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Price pending client catalogue approval</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#C5A46D]">
                Weave Description
              </h3>
              <p className="text-xs sm:text-sm text-[#D4C2A7] leading-relaxed font-sans">
                {product.description}
              </p>
            </div>

            {/* Colour / Design Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3 p-4 rounded-xl bg-[#381222]/80 border border-[#C5A46D]/25">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#C5A46D] uppercase tracking-wider">
                    Selected Shade:
                  </span>
                  <span className="text-[#F6EBD8] font-bold">
                    {selectedVariant ? selectedVariant.name : 'Choose Option'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all ${
                          isSelected
                            ? 'bg-[#451523] border-[#C5A46D] shadow-md ring-1 ring-[#C5A46D]'
                            : 'bg-[#2C0E1A] border-[#C5A46D]/30 text-[#D4C2A7] hover:border-[#C5A46D]/60'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/30 shrink-0"
                          style={{ backgroundColor: v.hex }}
                        />
                        <span className="font-medium text-[#F6EBD8]">{v.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#C5A46D]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {!availability.isOutOfStock && (
                  <div className="flex items-center justify-between sm:justify-start gap-3 bg-[#381222] border border-[#C5A46D]/30 rounded-xl p-2 shrink-0">
                    <span className="text-xs font-mono text-[#D4C2A7] px-2 sm:hidden">
                      Quantity:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-2 rounded-lg hover:bg-white/10 text-[#F6EBD8] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-mono font-bold text-[#F6EBD8] px-3 min-w-[28px] text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(availability.availableQuantity || 99, q + 1))}
                        className="p-2 rounded-lg hover:bg-white/10 text-[#F6EBD8] transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {availability.isOutOfStock ? (
                  <button
                    type="button"
                    onClick={() => setShowRestockModal(true)}
                    className="flex-1 py-3.5 px-5 rounded-xl bg-[#451523] border border-[#C5A46D]/60 text-[#F6EBD8] font-medium text-xs uppercase tracking-wider hover:bg-[#5a1b2d] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] cursor-pointer"
                  >
                    <Bell className="w-4 h-4 text-[#C5A46D]" />
                    <span>Notify Me When Available</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex-1 py-3.5 px-5 rounded-xl bg-[#C5A46D] text-[#2C0E1A] font-medium text-xs uppercase tracking-wider hover:bg-[#d9bb85] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {addedNotice ? 'Added to Cart!' : 'Add Saree to Bag'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="flex-1 py-3.5 px-5 rounded-xl bg-[#451523] border border-[#C5A46D]/60 text-[#F6EBD8] font-medium text-xs uppercase tracking-wider hover:bg-[#5a1b2d] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-[#C5A46D]" />
                      <span>Buy Now</span>
                    </button>
                  </>
                )}

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlistItem(product)}
                  className={`p-3.5 rounded-xl border transition-colors flex items-center justify-center ${
                    isWishlisted
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-[#381222] border-[#C5A46D]/30 text-[#F6EBD8] hover:border-[#C5A46D]'
                  }`}
                  title={isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Call to Order Assistance */}
              <CallToOrderAssistance variant="pdp" className="mt-2 bg-[#381222] border-[#C5A46D]/30 text-[#F6EBD8]" />

              {addedNotice && (
                <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>
                    Successfully added {quantity} &times; {product.name}
                    {selectedVariant ? ` (${selectedVariant.name})` : ''} to your shared cart.
                  </span>
                </div>
              )}

              {addError && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 text-rose-400" />
                  <span>{addError}</span>
                </div>
              )}
            </div>

            {/* Specifications Table */}
            {product.specs && (
              <div className="pt-6 border-t border-[#C5A46D]/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C5A46D]">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Technical & Fabric Specifications</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {product.specs.fabric && (
                    <div className="p-3 rounded-lg bg-[#381222]/60 border border-[#C5A46D]/20">
                      <span className="text-[#C5A46D] block font-mono text-[10px] uppercase">
                        Fabric Composition
                      </span>
                      <span className="text-[#F6EBD8] font-medium mt-0.5 block">
                        {product.specs.fabric}
                      </span>
                    </div>
                  )}

                  {product.specs.weaveType && (
                    <div className="p-3 rounded-lg bg-[#381222]/60 border border-[#C5A46D]/20">
                      <span className="text-[#C5A46D] block font-mono text-[10px] uppercase">
                        Loom / Weave Technique
                      </span>
                      <span className="text-[#F6EBD8] font-medium mt-0.5 block">
                        {product.specs.weaveType}
                      </span>
                    </div>
                  )}

                  {product.specs.zariType && (
                    <div className="p-3 rounded-lg bg-[#381222]/60 border border-[#C5A46D]/20">
                      <span className="text-[#C5A46D] block font-mono text-[10px] uppercase">
                        Zari Thread Grade
                      </span>
                      <span className="text-[#F6EBD8] font-medium mt-0.5 block">
                        {product.specs.zariType}
                      </span>
                    </div>
                  )}

                  {product.specs.length && (
                    <div className="p-3 rounded-lg bg-[#381222]/60 border border-[#C5A46D]/20">
                      <span className="text-[#C5A46D] block font-mono text-[10px] uppercase">
                        Length & Blouse
                      </span>
                      <span className="text-[#F6EBD8] font-medium mt-0.5 block">
                        {product.specs.length}
                      </span>
                    </div>
                  )}

                  {product.specs.careInstructions && (
                    <div className="p-3 rounded-lg bg-[#381222]/60 border border-[#C5A46D]/20 sm:col-span-2">
                      <span className="text-[#C5A46D] block font-mono text-[10px] uppercase">
                        Care Instructions
                      </span>
                      <span className="text-[#F6EBD8] font-medium mt-0.5 block">
                        {product.specs.careInstructions}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Authenticity Guarantee Note */}
            <div className="p-4 rounded-xl bg-[#451523]/40 border border-[#C5A46D]/25 flex items-start gap-3 text-xs text-[#D4C2A7]">
              <ShieldCheck className="w-5 h-5 text-[#C5A46D] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#F6EBD8] block">Amoga Authenticity Guarantee</span>
                Direct from verified handloom clusters. Tested materials and certified weaving provenance.
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[#C5A46D]/20 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[#C5A46D]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Complete Your Selection</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#F6EBD8] mt-1">
                  Related Weaves in {product.categoryName}
                </h2>
              </div>
              <Link
                to={`/sarees/products?category=${product.category}`}
                className="text-xs font-medium text-[#C5A46D] hover:underline flex items-center gap-1"
              >
                <span>View More</span>
                <Eye className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <SareeProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </div>
        )}
      </Container>

      <RestockModal
        isOpen={showRestockModal}
        onClose={() => setShowRestockModal(false)}
        product={product}
        selectedVariant={selectedVariant}
      />
    </div>
  );
}
