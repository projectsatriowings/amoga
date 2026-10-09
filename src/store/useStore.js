import { create } from 'zustand';
import { isValidPrice, isValidQuantity, calculateCartTotals } from '../utils/pricing';

/**
 * Global Store (Zustand)
 * Phase 6: Unified Multi-Collection Cart, Checkout State & Safeguards
 */
export const useStore = create((set, get) => ({
  // Active collection context
  activeCollectionId: 'food',
  setActiveCollectionId: (id) => set({ activeCollectionId: id }),

  // =========================================================================
  // Cart State Management (Unified Food, Sarees, Jewellery)
  // =========================================================================
  cart: {
    items: [],
    isOpen: false,
  },
  openCart: () =>
    set((state) => ({ cart: { ...state.cart, isOpen: true } })),
  closeCart: () =>
    set((state) => ({ cart: { ...state.cart, isOpen: false } })),
  toggleCart: () =>
    set((state) => ({ cart: { ...state.cart, isOpen: !state.cart.isOpen } })),

  /**
   * Add an eligible product to the unified shopping cart.
   * Safeguard: Rejects unpriced or invalidly priced products.
   */
  addToCart: (product, quantity = 1, selectedVariant = null) => {
    // Pricing Safeguard: Reject products without confirmed, valid price
    if (!isValidPrice(product?.price)) {
      console.warn(`[Amoga Cart] Rejection: Cannot add unpriced item "${product?.name}" to cart.`);
      return { success: false, reason: 'unpriced' };
    }

    // Quantity Sanitization
    const sanitizedQty = isValidQuantity(quantity) ? quantity : Math.max(1, parseInt(quantity, 10) || 1);

    const collectionId = product.collection ||
      (product.id?.startsWith('f-') ? 'food' : product.id?.startsWith('tea-') ? 'tea' : product.id?.startsWith('s-') ? 'sarees' : 'jewellery');
    const normalizedProduct = { ...product, collection: collectionId };

    set((state) => {
      const lineId = selectedVariant
        ? `${collectionId}-${product.id}-${selectedVariant.id}`
        : (product.selectedVariantId
            ? `${collectionId}-${product.id}-${product.selectedVariantId}`
            : `${collectionId}-${product.id}`);

      const existingIndex = state.cart.items.findIndex(
        (item) => item.id === lineId || (!item.id && item.product.id === product.id)
      );

      let newItems;
      if (existingIndex > -1) {
        newItems = [...state.cart.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + sanitizedQty,
        };
      } else {
        newItems = [
          ...state.cart.items,
          {
            id: lineId,
            product: normalizedProduct,
            selectedVariant,
            quantity: sanitizedQty,
          },
        ];
      }

      return {
        cart: {
          items: newItems,
          isOpen: true, // open drawer on add
        },
      };
    });

    return { success: true };
  },

  updateQuantity: (lineId, quantity) => {
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      get().removeFromCart(lineId);
      return;
    }

    set((state) => ({
      cart: {
        ...state.cart,
        items: state.cart.items.map((item) =>
          (item.id === lineId || item.product.id === lineId)
            ? { ...item, quantity: parsedQty }
            : item
        ),
      },
    }));
  },

  removeFromCart: (lineId) => {
    set((state) => ({
      cart: {
        ...state.cart,
        items: state.cart.items.filter(
          (item) => item.id !== lineId && item.product.id !== lineId
        ),
      },
    }));
  },

  clearCart: () => {
    set((state) => ({
      cart: {
        ...state.cart,
        items: [],
      },
    }));
  },

  getCartTotals: () => {
    return calculateCartTotals(get().cart.items);
  },

  // =========================================================================
  // Checkout State Management (Delivery Details & Demo Order State)
  // =========================================================================
  checkout: {
    customerDetails: {
      fullName: '',
      email: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      deliveryInstructions: '',
    },
    lastCompletedOrder: null,
  },

  setCustomerDetails: (details) =>
    set((state) => ({
      checkout: {
        ...state.checkout,
        customerDetails: {
          ...state.checkout.customerDetails,
          ...details,
        },
      },
    })),

  clearCustomerDetails: () =>
    set((state) => ({
      checkout: {
        ...state.checkout,
        customerDetails: {
          fullName: '',
          email: '',
          phone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          pincode: '',
          deliveryInstructions: '',
        },
      },
    })),

  setLastCompletedOrder: (order) =>
    set((state) => ({
      checkout: {
        ...state.checkout,
        lastCompletedOrder: order,
      },
    })),

  // =========================================================================
  // Wishlist State Management
  // =========================================================================
  wishlist: {
    items: [],
    isOpen: false,
  },
  openWishlist: () =>
    set((state) => ({ wishlist: { ...state.wishlist, isOpen: true } })),
  closeWishlist: () =>
    set((state) => ({ wishlist: { ...state.wishlist, isOpen: false } })),
  toggleWishlistDrawer: () =>
    set((state) => ({
      wishlist: { ...state.wishlist, isOpen: !state.wishlist.isOpen },
    })),

  toggleWishlistItem: (product) => {
    set((state) => {
      const productId = typeof product === 'string' ? product : product.id;
      const exists = state.wishlist.items.some(
        (item) => (typeof item === 'string' ? item : item.id) === productId
      );

      return {
        wishlist: {
          ...state.wishlist,
          items: exists
            ? state.wishlist.items.filter(
                (item) => (typeof item === 'string' ? item : item.id) !== productId
              )
            : [...state.wishlist.items, product],
        },
      };
    });
  },

  isInWishlist: (productId) => {
    return get().wishlist.items.some(
      (item) => (typeof item === 'string' ? item : item.id) === productId
    );
  },
}));
