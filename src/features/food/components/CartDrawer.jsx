import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, AlertCircle } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { Button } from '../../../components/ui/Button';

export function CartDrawer() {
  const { cart, closeCart, updateQuantity, removeFromCart, clearCart } = useStore();
  const { items, isOpen } = cart;

  // Calculate totals ONLY for verified priced items
  const pricedItems = items.filter((item) => item.product.price !== null);
  const unpricedItems = items.filter((item) => item.product.price === null);

  const verifiedSubtotal = pricedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#FDFBF7] text-[#172B1C] shadow-2xl z-50 flex flex-col justify-between overflow-hidden border-l border-[#172B1C]/10"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping Cart Drawer"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#172B1C]/10 flex items-center justify-between bg-white/60 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#287A25]" />
                <h2 className="text-lg font-serif font-medium text-[#172B1C]">
                  Your Cart ({totalCount})
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#172B1C] transition-colors focus-visible:ring-2 focus-visible:ring-[#287A25]"
                aria-label="Close cart drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#EAE6D9] flex items-center justify-center text-[#557C36]">
                    <ShoppingBag className="w-8 h-8 opacity-60" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-serif font-medium">Your basket is currently empty</p>
                    <p className="text-xs text-[#557C36] max-w-xs">
                      Explore Amoga's authentic soups, herbal teas, and pantry organics.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
                    <Link to="/food/products" onClick={closeCart}>
                      <Button variant="primary" size="sm" collection="food" className="w-full text-xs">
                        Browse Gourmet Food
                      </Button>
                    </Link>
                    <Link to="/sarees/products" onClick={closeCart}>
                      <Button variant="outline" size="sm" collection="sarees" className="w-full text-xs">
                        Browse Heritage Sarees
                      </Button>
                    </Link>
                    <Link to="/jewellery/products" onClick={closeCart}>
                      <Button variant="outline" size="sm" collection="jewellery" className="w-full text-xs">
                        Browse Silver Jewellery
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {items.map((item) => {
                    const { product, quantity, selectedVariant } = item;
                    const lineKey = item.id || product.id;
                    const hasPrice = product.price !== null;
                    const productUrl =
                      product.collection === 'jewellery'
                        ? `/jewellery/products/${product.slug}`
                        : product.collection === 'sarees'
                        ? `/sarees/products/${product.slug}`
                        : `/food/products/${product.slug}`;

                    return (
                      <div
                        key={lineKey}
                        className="p-3.5 rounded-xl bg-white border border-[#172B1C]/8 flex items-start gap-3 shadow-sm hover:border-[#287A25]/30 transition-colors"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover shrink-0 bg-[#EAE6D9]"
                        />

                        <div className="flex-1 min-w-0 space-y-1">
                          <Link
                            to={productUrl}
                            onClick={closeCart}
                            className="text-sm font-medium hover:text-[#287A25] transition-colors line-clamp-1 block"
                          >
                            {product.name}
                          </Link>

                          <div className="flex items-center gap-2 text-[11px] text-[#557C36] font-mono">
                            <span>{product.categoryName}</span>
                            {selectedVariant && (
                              <span className="flex items-center gap-1 text-black/60">
                                &bull;
                                <span
                                  className="w-2 h-2 rounded-full inline-block border border-black/20"
                                  style={{ backgroundColor: selectedVariant.hex }}
                                />
                                {selectedVariant.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            {hasPrice ? (
                              <div className="text-sm font-semibold text-[#172B1C]">
                                ₹{(product.price * quantity).toLocaleString()}
                                {quantity > 1 && (
                                  <span className="text-[10px] font-normal text-black/50 ml-1">
                                    (₹{product.price.toLocaleString()} each)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-mono text-[#557C36] bg-[#557C36]/10 px-2 py-0.5 rounded font-medium">
                                Price to be confirmed
                              </span>
                            )}

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1.5 bg-[#F5F1E8] rounded-md px-1.5 py-0.5">
                              <button
                                type="button"
                                onClick={() => updateQuantity(lineKey, quantity - 1)}
                                className="p-1 hover:text-[#287A25] transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-mono font-medium px-1.5 min-w-[16px] text-center">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(lineKey, quantity + 1)}
                                className="p-1 hover:text-[#287A25] transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(lineKey)}
                          className="text-black/30 hover:text-red-600 transition-colors p-1"
                          aria-label={`Remove ${product.name} from cart`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Pending Price Notice if catalogue items are in cart */}
                  {unpricedItems.length > 0 && (
                    <div className="p-3 rounded-lg bg-[#EAE6D9]/50 border border-[#287A25]/20 flex items-start gap-2.5 text-xs text-[#405244]">
                      <AlertCircle className="w-4 h-4 text-[#287A25] shrink-0 mt-0.5" />
                      <span>
                        {unpricedItems.length} item(s) in your basket are currently awaiting catalogue price confirmation. Subtotal reflects only verified products.
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Summary */}
            {items.length > 0 && (
              <div className="p-5 border-t border-[#172B1C]/10 bg-white/70 backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-black/70">Verified Subtotal</span>
                  <span className="font-semibold text-base text-[#172B1C]">
                    ₹{verifiedSubtotal.toLocaleString()}
                  </span>
                </div>

                <div className="text-[11px] text-[#557C36]">
                  Taxes calculated at checkout in Phase 4. Free shipping available above ₹999.
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex gap-2">
                    <Link to="/cart" onClick={closeCart} className="flex-1">
                      <Button
                        variant="outline"
                        size="md"
                        collection="food"
                        className="w-full text-xs"
                      >
                        View Full Bag
                      </Button>
                    </Link>
                    <Link to="/checkout" onClick={closeCart} className="flex-1">
                      <Button
                        variant="primary"
                        size="md"
                        collection="food"
                        className="w-full text-xs"
                      >
                        Proceed to Checkout
                      </Button>
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[11px] text-black/50 hover:text-red-600 transition-colors py-1 text-center font-mono"
                  >
                    Clear All Items
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
