import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  Heart,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  Leaf,
  HelpCircle,
} from 'lucide-react';
import { getProductBySlug, getProductsByCategory } from './data/products';
import { FoodProductCard } from './components/FoodProductCard';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { useStore } from '../../store/useStore';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';

export function FoodProductDetail() {
  const { slug } = useParams();
  const product = getProductBySlug(slug);

  const { addToCart, toggleWishlistItem, isInWishlist } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // If unknown slug, display graceful not-found state
  if (!product) {
    return (
      <div className="bg-[#FDFBF7] text-[#172B1C] min-h-[70vh] flex items-center justify-center py-16">
        <Container size="narrow" className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#EAE6D9] text-[#287A25] flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8 opacity-70" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#172B1C]">
            Product Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[#405244] max-w-md mx-auto">
            The culinary item with identifier <code className="font-mono text-[#287A25]">"{slug}"</code> does not exist in the active Amoga product catalogue.
          </p>
          <div className="pt-2">
            <Link to="/food/products">
              <Button variant="primary" size="md" collection="food" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Return to Food Catalogue
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const hasPrice = product.price !== null;

  // Related products from the same category
  const relatedProducts = getProductsByCategory(product.category)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  return (
    <div className="bg-[#FDFBF7] text-[#172B1C] min-h-screen py-8 sm:py-12">
      {/* Drawers */}
      <CartDrawer />
      <WishlistDrawer />

      <Container>
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumbs"
          className="flex items-center gap-2 text-xs font-mono text-[#557C36] mb-8 overflow-x-auto whitespace-nowrap pb-1"
        >
          <Link to="/" className="hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Amoga
          </Link>
          <span>/</span>
          <Link to="/food" className="hover:underline">
            Gourmet Food
          </Link>
          <span>/</span>
          <Link
            to={`/food/products?category=${product.category}`}
            className="hover:underline"
          >
            {product.categoryName}
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#172B1C]">{product.name}</span>
        </nav>

        {/* Main Product Presentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-white border border-[#172B1C]/10 shadow-lg aspect-square">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.badge && (
                  <span className="text-xs uppercase font-mono tracking-wider font-semibold px-3 py-1 rounded-full bg-[#287A25] text-white shadow-md">
                    {product.badge}
                  </span>
                )}
                {product.discount && (
                  <span className="text-xs uppercase font-mono tracking-wider font-semibold px-3 py-1 rounded-full bg-orange-600 text-white shadow-md">
                    {product.discount}
                  </span>
                )}
              </div>
            </div>

            {/* Source Reference Metadata Pill */}
            <div className="p-3.5 rounded-xl bg-[#EAE6D9]/50 border border-[#172B1C]/10 flex items-center justify-between text-xs font-mono text-[#557C36]">
              <span>Verified Source:</span>
              <span className="font-semibold text-[#172B1C]">
                {product.sourceCatalogue || 'Amoga Organic Food Specification'}
              </span>
            </div>
          </div>

          {/* Right Column: Product Details & Purchase Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <div className="text-xs uppercase font-mono tracking-widest text-[#287A25] font-semibold">
                {product.categoryName} {product.catalogueTheme && `• ${product.catalogueTheme}`}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#172B1C] leading-tight">
                {product.name}
              </h1>

              {/* Standee Notes if available */}
              {product.standeeNotes && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#287A25]/10 text-[#287A25] text-xs font-medium">
                  <Leaf className="w-3.5 h-3.5" />
                  <span>{product.standeeNotes}</span>
                </div>
              )}
            </div>

            {/* Price Display */}
            <div className="p-4 rounded-2xl bg-white border border-[#172B1C]/10 shadow-sm flex items-center justify-between">
              {hasPrice ? (
                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#172B1C]">
                      ₹{product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-black/40 line-through">
                        ₹{product.originalPrice}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#557C36]">
                    Inclusive of all local taxes. Free shipping over ₹999.
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="inline-block text-xs font-mono font-medium text-[#557C36] bg-[#557C36]/10 px-3 py-1 rounded-md">
                    Price to be confirmed
                  </span>
                  <div className="text-[11px] text-[#405244]">
                    Retail pack pricing awaiting final catalogue sign-off. Add to basket to reserve.
                  </div>
                </div>
              )}

              {product.packSize && (
                <div className="text-right">
                  <div className="text-[10px] font-mono text-black/40 uppercase">Net Quantity</div>
                  <div className="text-xs font-semibold text-[#172B1C]">{product.packSize}</div>
                </div>
              )}
            </div>

            {/* Product Narrative Description */}
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-mono tracking-wider text-black/50 font-semibold">
                Recipe & Flavour Profile
              </h3>
              <p className="text-sm sm:text-base text-[#405244] leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="pt-4 border-t border-[#172B1C]/10 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-black/70">Quantity:</span>
                <div className="flex items-center gap-2 bg-white border border-[#172B1C]/15 rounded-xl px-2.5 py-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 hover:text-[#287A25] transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-mono font-semibold px-2 min-w-[20px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1 hover:text-[#287A25] transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  collection="food"
                  onClick={handleAddToCart}
                  leftIcon={<ShoppingBag className="w-5 h-5" />}
                  className="flex-1 text-sm"
                >
                  {addedSuccess ? 'Added to Basket!' : 'Add to Cart'}
                </Button>

                <button
                  type="button"
                  onClick={() => toggleWishlistItem(product)}
                  className={`p-3.5 rounded-xl border transition-all ${
                    inWishlist
                      ? 'bg-red-50 border-red-200 text-red-500 shadow-sm'
                      : 'bg-white border-[#172B1C]/15 text-black/60 hover:text-red-500'
                  }`}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                  title="Toggle Wishlist"
                >
                  <Heart className={`w-5 h-5 ${inWishlist ? 'fill-red-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* Trust Assurances */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-[#557C36]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#287A25]" />
                <span>100% Honest Ingredients</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#287A25]" />
                <span>Dispatched Fresh from Origin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products from the Same Category */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[#172B1C]/10 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-[#287A25] font-semibold">
                  Complementary Selection
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif text-[#172B1C]">
                  More from {product.categoryName}
                </h2>
              </div>
              <Link
                to={`/food/products?category=${product.category}`}
                className="text-xs uppercase font-mono tracking-wider font-semibold text-[#287A25] hover:underline"
              >
                View Category
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <FoodProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
