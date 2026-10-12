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
  Sparkles,
  Layers,
  Zap,
} from 'lucide-react';
import { getJewelleryBySlug, JEWELLERY_PRODUCTS } from './data/products';
import { JewelleryProductCard } from './components/JewelleryProductCard';

import { useStore } from '../../store/useStore';
import { Container } from '../../components/ui/Container';
import { useProductDetail } from '../../hooks/useProducts';

export function JewelleryProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const staticProduct = getJewelleryBySlug(slug);
  const { product: apiProduct } = useProductDetail('jewellery', slug, staticProduct);
  const product = apiProduct || staticProduct;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  const { isInWishlist, toggleWishlistItem, addToCart, initiateBuyNow } = useStore();

  // State management for gallery, size variants, and quantity
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [addError, setAddError] = useState(null);

  // Derive active size directly during render
  const activeSize =
    selectedSize ||
    (product?.sizes && product.sizes.length > 0 ? product.sizes[0] : null);

  // Graceful 404 / Not Found state for unknown slug
  if (!product) {
    return (
      <div className="bg-[#242326] text-[#F7F3EB] min-h-[70vh] flex items-center justify-center py-16">
        <Container>
          <div className="max-w-md mx-auto text-center p-8 rounded-2xl bg-[#343238] border border-[#B9B8B5]/25 space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-[#242326] flex items-center justify-center mx-auto text-[#B9B8B5]">
              <Info className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl text-[#F7F3EB]">Jewellery Piece Not Found</h1>
            <p className="text-xs text-[#B9B8B5]">
              The requested jewellery record &ldquo;{slug}&rdquo; does not exist in the current catalogue archive.
            </p>
            <div className="pt-2">
              <Link
                to="/jewellery/products"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#B9B8B5] text-[#242326] text-xs font-medium uppercase tracking-wider hover:bg-white transition-colors"
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
    if (!hasPrice) {
      setAddError('This jewellery piece is currently awaiting confirmed retail pricing.');
      return;
    }

    // Use variant convention if size is selected
    const variantObj = activeSize ? { id: `size-${activeSize}`, name: `Size ${activeSize}` } : null;
    const res = addToCart(product, quantity, variantObj);
    if (res?.success) {
      setAddedNotice(true);
    } else {
      setAddError('Could not add piece to bag. Please try again.');
    }
  };

  const handleBuyNow = () => {
    setAddError(null);
    if (!hasPrice) {
      setAddError('This jewellery piece is currently awaiting confirmed retail pricing.');
      return;
    }

    const variantObj = activeSize ? { id: `size-${activeSize}`, name: `Size ${activeSize}` } : null;
    const res = initiateBuyNow(product, quantity, variantObj);
    if (res?.success) {
      navigate('/checkout');
    } else {
      setAddError('Could not initiate Buy Now for this jewellery piece.');
    }
  };

  // Related products from same category, excluding current
  const relatedProducts = JEWELLERY_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  return (
    <div className="bg-[#242326] text-[#F7F3EB] min-h-screen py-8 sm:py-12">
      <Container>
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Product Breadcrumb"
          className="flex items-center gap-2 text-xs font-mono mb-8 text-[#B9B8B5] overflow-x-auto whitespace-nowrap"
        >
          <Link to="/" className="hover:underline flex items-center gap-1 text-[#B9B8B5]/80">
            <Home className="w-3.5 h-3.5" />
            <span>Portal</span>
          </Link>
          <span>/</span>
          <Link to="/jewellery" className="hover:underline text-[#B9B8B5]/80">
            Silver Jewellery
          </Link>
          <span>/</span>
          <Link
            to={`/jewellery/products?category=${product.category}`}
            className="hover:underline text-[#B9B8B5]/80"
          >
            {product.categoryName}
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#F7F3EB]">{product.name}</span>
        </nav>

        {/* Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Gallery (6 Columns) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#343238] border border-[#B9B8B5]/25 shadow-2xl">
              <img
                src={activeImage}
                alt={`${product.name} - view ${activeImageIndex + 1}`}
                className="w-full h-full object-cover transition-opacity duration-300"
              />

              {/* Floating Badge */}
              {product.badge && (
                <div className="absolute top-4 left-4 pointer-events-none">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-3 py-1 rounded-full bg-[#242326]/65 backdrop-blur-md text-[#F7F3EB] border border-white/25 shadow-sm">
                    {product.badge}
                  </span>
                </div>
              )}

              {/* Floating Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleWishlistItem(product)}
                className="absolute top-4 right-4 p-3 rounded-full bg-[#242326]/85 hover:bg-[#242326] text-[#F7F3EB] border border-[#B9B8B5]/30 backdrop-blur-sm transition-transform active:scale-95"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted ? 'fill-red-500 text-red-500' : 'text-[#F7F3EB]'
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
                        ? 'border-[#B9B8B5] scale-105 shadow-md'
                        : 'border-[#B9B8B5]/20 opacity-70 hover:opacity-100'
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
            <div className="space-y-2 border-b border-[#B9B8B5]/15 pb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[#B9B8B5]">
                  {product.categoryName}
                </span>
                <span className="text-[#B9B8B5]/40">&bull;</span>
                <span className="text-xs font-mono text-[#B9B8B5]/80">
                  SKU: {product.id}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl text-[#F7F3EB]">
                {product.name}
              </h1>

              <p className="text-sm font-sans text-[#B9B8B5] italic">
                {product.tagline}
              </p>

              {/* Price Display */}
              <div className="pt-3">
                {hasPrice ? (
                  <div className="flex items-baseline gap-3">
                    <span className="font-sans text-3xl font-bold text-[#F7F3EB] tabular-nums">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-mono text-[#B9B8B5]">
                      Approved Price &bull; Taxes Included
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#343238] border border-[#B9B8B5]/25 text-[#B9B8B5] text-xs font-mono">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Price pending client catalogue approval</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#B9B8B5]">
                Design Details
              </h3>
              <p className="text-xs sm:text-sm text-[#B9B8B5] leading-relaxed font-sans">
                {product.description}
              </p>
            </div>

            {/* Ring / Size Selector if supported */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3 p-4 rounded-xl bg-[#343238]/70 border border-[#B9B8B5]/20">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#B9B8B5] uppercase tracking-wider">
                    Select Ring Size:
                  </span>
                  <span className="text-[#F7F3EB] font-bold">
                    {activeSize || 'Standard'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {product.sizes.map((sz) => {
                    const isSelected = activeSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`px-3.5 py-2 rounded-lg border text-xs font-mono transition-all ${
                          isSelected
                            ? 'bg-[#B9B8B5] text-[#242326] border-[#B9B8B5] font-bold shadow-md'
                            : 'bg-[#242326] text-[#F7F3EB] border-[#B9B8B5]/25 hover:border-[#B9B8B5]/60'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Quantity Controls */}
                <div className="flex items-center justify-between sm:justify-start gap-3 bg-[#343238] border border-[#B9B8B5]/25 rounded-xl p-2 shrink-0">
                  <span className="text-xs font-mono text-[#B9B8B5] px-2 sm:hidden">
                    Quantity:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2 rounded-lg hover:bg-white/10 text-[#F7F3EB] transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-mono font-bold text-[#F7F3EB] px-3 min-w-[28px] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-2 rounded-lg hover:bg-white/10 text-[#F7F3EB] transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                {hasPrice ? (
                  <>
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex-1 py-3.5 px-5 rounded-xl bg-[#B9B8B5] text-[#242326] font-medium text-xs uppercase tracking-wider hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {addedNotice ? 'Added to Bag!' : 'Add Piece to Bag'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="flex-1 py-3.5 px-5 rounded-xl bg-[#242326] border border-[#B9B8B5]/50 text-[#F7F3EB] font-medium text-xs uppercase tracking-wider hover:bg-[#343238] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-[#B9B8B5]" />
                      <span>Buy Now</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-3.5 px-6 rounded-xl bg-[#343238] text-[#B9B8B5]/50 border border-white/5 font-medium text-xs uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Price To Be Confirmed</span>
                  </button>
                )}

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlistItem(product)}
                  className={`p-3.5 rounded-xl border transition-colors flex items-center justify-center ${
                    isWishlisted
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-[#343238] border-[#B9B8B5]/25 text-[#F7F3EB] hover:border-[#B9B8B5]'
                  }`}
                  title={isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {addedNotice && (
                <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>
                    Successfully added {quantity} &times; {product.name}
                    {activeSize ? ` (${activeSize})` : ''} to your shared cart.
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
              <div className="pt-6 border-t border-[#B9B8B5]/15 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#B9B8B5]">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Verified Piece Specifications</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {product.specs.material && (
                    <div className="p-3 rounded-lg bg-[#343238]/60 border border-[#B9B8B5]/15">
                      <span className="text-[#B9B8B5] block font-mono text-[10px] uppercase">
                        Metal Composition
                      </span>
                      <span className="text-[#F7F3EB] font-medium mt-0.5 block">
                        {product.specs.material}
                      </span>
                    </div>
                  )}

                  {product.specs.finish && (
                    <div className="p-3 rounded-lg bg-[#343238]/60 border border-[#B9B8B5]/15">
                      <span className="text-[#B9B8B5] block font-mono text-[10px] uppercase">
                        Protective Finish
                      </span>
                      <span className="text-[#F7F3EB] font-medium mt-0.5 block">
                        {product.specs.finish}
                      </span>
                    </div>
                  )}

                  {product.specs.stone && (
                    <div className="p-3 rounded-lg bg-[#343238]/60 border border-[#B9B8B5]/15">
                      <span className="text-[#B9B8B5] block font-mono text-[10px] uppercase">
                        Stone Setting
                      </span>
                      <span className="text-[#F7F3EB] font-medium mt-0.5 block">
                        {product.specs.stone}
                      </span>
                    </div>
                  )}

                  {product.specs.dimensions && (
                    <div className="p-3 rounded-lg bg-[#343238]/60 border border-[#B9B8B5]/15">
                      <span className="text-[#B9B8B5] block font-mono text-[10px] uppercase">
                        Dimensions
                      </span>
                      <span className="text-[#F7F3EB] font-medium mt-0.5 block">
                        {product.specs.dimensions}
                      </span>
                    </div>
                  )}

                  {product.specs.care && (
                    <div className="p-3 rounded-lg bg-[#343238]/60 border border-[#B9B8B5]/15 sm:col-span-2">
                      <span className="text-[#B9B8B5] block font-mono text-[10px] uppercase">
                        Care Instructions
                      </span>
                      <span className="text-[#F7F3EB] font-medium mt-0.5 block">
                        {product.specs.care}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Authenticity Guarantee Note */}
            <div className="p-4 rounded-xl bg-[#343238]/40 border border-[#B9B8B5]/20 flex items-start gap-3 text-xs text-[#B9B8B5]">
              <ShieldCheck className="w-5 h-5 text-[#B9B8B5] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#F7F3EB] block">Solid Precious Metal Guarantee</span>
                Crafted in genuine solid sterling silver with hypoallergenic, nickel-safe finishes.
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[#B9B8B5]/15 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[#B9B8B5]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C6AD82]" />
                  <span>Coordinating Pieces</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#F7F3EB] mt-1">
                  More in {product.categoryName}
                </h2>
              </div>
              <Link
                to={`/jewellery/products?category=${product.category}`}
                className="text-xs font-medium text-[#B9B8B5] hover:text-white flex items-center gap-1"
              >
                <span>View More</span>
                <Eye className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <JewelleryProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
