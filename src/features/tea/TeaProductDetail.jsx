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
} from 'lucide-react';
import { getTeaProductBySlug, TEA_PRODUCTS } from './data/products';
import { TeaProductCard } from './components/TeaProductCard';
import { BotanicalSideAnimations } from './components/BotanicalAnimations';

import { useStore } from '../../store/useStore';
import { Container } from '../../components/ui/Container';
import { useProductDetail } from '../../hooks/useProducts';
import { BackButton } from '../../components/ui/BackButton';

export function TeaProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const staticProduct = getTeaProductBySlug(slug);
  const { product: apiProduct } = useProductDetail('tea', slug, staticProduct);

  // Always reset scroll to top on mount or when navigating to another brew
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  // Safely combine API updates with rich static botanical catalogue metadata
  const product = useMemo(() => {
    if (!staticProduct && !apiProduct) return null;
    if (!apiProduct) return staticProduct;
    if (!staticProduct) return apiProduct;

    return {
      ...staticProduct,
      ...apiProduct,
      botanicalName: apiProduct.botanicalName || staticProduct.botanicalName,
      standeeNotes: apiProduct.standeeNotes || staticProduct.standeeNotes,
      categoryName: staticProduct.categoryName || apiProduct.categoryName,
      origin: apiProduct.origin || staticProduct.origin,
      brewingTime: apiProduct.brewingTime || staticProduct.brewingTime,
      details: (Array.isArray(apiProduct.details) && apiProduct.details.length > 0)
        ? apiProduct.details
        : staticProduct.details,
      originalPrice: apiProduct.originalPrice || staticProduct.originalPrice,
      packSize: apiProduct.packSize || staticProduct.packSize,
      badge: apiProduct.badge || staticProduct.badge,
      image: staticProduct.image || apiProduct.image,
    };
  }, [staticProduct, apiProduct]);

  const { addToCart, toggleWishlistItem, isInWishlist, initiateBuyNow, openCart } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [addError, setAddError] = useState(null);

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

  // Other teas in the collection
  const otherTeas = TEA_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  const handleAddToCart = () => {
    if (addedSuccess) {
      openCart();
      return;
    }
    setAddError(null);
    if (!hasPrice) {
      setAddError('This botanical brew is currently awaiting price confirmation.');
      return;
    }
    const res = addToCart(product, quantity);
    if (res?.success) {
      setAddedSuccess(true);
      setTimeout(() => {
        setAddedSuccess(false);
      }, 3000);
    } else {
      setAddError('Could not add brew to bag. Please try again.');
    }
  };

  const handleBuyNow = () => {
    setAddError(null);
    if (!hasPrice) {
      setAddError('This botanical brew is currently awaiting price confirmation.');
      return;
    }
    const res = initiateBuyNow(product, quantity);
    if (res?.success) {
      navigate('/checkout');
    } else {
      setAddError('Could not initiate Buy Now for this brew.');
    }
  };

  return (
    <div className="relative bg-[#FAF1BB] text-[#2C1E11] min-h-screen py-8 sm:py-12 overflow-hidden">
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
          {/* Left Column: Product Photography */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-2xl overflow-hidden aspect-square bg-[#FAF1BB]/60 border border-[#B88E38]/20 shadow-md">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />

              {product.badge && (
                <div className="absolute top-4 left-4">
                  <span className="px-3.5 py-1 rounded-full bg-white/75 backdrop-blur-md text-[#2C1E11] text-xs font-mono font-bold uppercase tracking-wider shadow-sm border border-white/60">
                    {product.badge}
                  </span>
                </div>
              )}
            </div>

            {/* Standee Reference Callout */}
            <div className="p-4 rounded-xl bg-white/70 border border-[#B88E38]/20 text-xs text-[#543B25] flex items-center justify-between">
              <span className="font-medium text-[#2C1E11]">Source Document:</span>
              <span className="font-mono text-[11px] text-[#8C6320] font-semibold">
                Amoga Herbal Tea Standee Reference
              </span>
            </div>
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

              {/* Standee Wellness Feature */}
              {product.standeeNotes && (
                <div className="p-3.5 rounded-xl bg-[#FAF1BB] border border-[#B88E38]/30 text-xs text-[#2C1E11] space-y-1">
                  <div className="font-semibold uppercase tracking-wider text-[11px] text-[#8C6320]">
                    Verified Herbal Benefit
                  </div>
                  <p className="font-serif text-sm italic">{product.standeeNotes}</p>
                </div>
              )}

              {/* Pricing Display */}
              <div className="pt-2 border-t border-[#B88E38]/20 flex items-baseline gap-3">
                {hasPrice ? (
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-3xl font-sans font-bold text-[#2C1E11] tabular-nums font-numeric">
                      ₹{typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-[#7D5C3F] line-through font-sans tabular-nums font-numeric">
                        ₹{typeof product.originalPrice === 'number' ? product.originalPrice.toLocaleString('en-IN') : product.originalPrice}
                      </span>
                    )}
                    {product.packSize && (
                      <span className="text-xs font-sans font-medium text-[#8C6320] bg-white/80 px-2.5 py-0.5 rounded-full border border-[#B88E38]/25 tabular-nums font-numeric">
                        {product.packSize}
                      </span>
                    )}
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C6320] bg-[#FAF1BB] px-2 py-0.5 rounded border border-[#B88E38]/30">
                      Development Test Price
                    </span>
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
              </div>

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
              {hasPrice ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  {/* Quantity selector */}
                  <div className="flex items-center justify-between border border-[#B88E38]/30 rounded-full px-3 py-1.5 bg-white w-32 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-1 hover:text-[#8C6320] text-[#2C1E11]"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-sans text-sm font-semibold tabular-nums font-numeric">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-1 hover:text-[#8C6320] text-[#2C1E11]"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Bag CTA */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-[#2C1E11] text-[#FAF1BB] text-xs font-semibold uppercase tracking-wider hover:bg-[#8C6320] hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{addedSuccess ? 'Added to Bag!' : 'Add to Shopping Bag'}</span>
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
              ) : (
                <div className="p-4 rounded-xl bg-[#FFFDF5] border border-[#B88E38]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#2C1E11] font-medium">
                    <PhoneCall className="w-4 h-4 text-[#8C6320]" />
                    <span>Inquire / Direct Orders: +91 9940018593 / +91 8056700646</span>
                  </div>
                  <Link
                    to="/tea/products"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#B88E38] text-[#2C1E11] font-semibold uppercase tracking-wider text-[11px] hover:bg-[#8C6320] hover:text-white transition-colors"
                  >
                    <span>Browse All Teas</span>
                  </Link>
                </div>
              )}
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
                View all 5 brews &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {otherTeas.map((other) => (
                <TeaProductCard key={other.id} product={other} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
