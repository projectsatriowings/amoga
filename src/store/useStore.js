import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isValidPrice, isValidQuantity, calculateCartTotals } from '../utils/pricing.js';

// Safe storage wrapper to support Node.js test environments and browsers
const safeStorage = {
  getItem: (name) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(name);
      }
    } catch {
      // Ignored
    }
    return null;
  },
  setItem: (name, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(name, value);
      }
    } catch {
      // Ignored
    }
  },
  removeItem: (name) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(name);
      }
    } catch {
      // Ignored
    }
  },
};

/**
 * Global Store (Zustand)
 * Phase 6 & Selective Checkout: Multi-Collection Cart, Item Selection, Buy Now & Save for Later
 */
export const useStore = create(
  persist(
    (set, get) => ({
      // Active collection context
      activeCollectionId: 'food',
      setActiveCollectionId: (id) => set({ activeCollectionId: id }),

      // =========================================================================
      // Cart State Management (Unified Food, Tea, Sarees, Jewellery)
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

      // =========================================================================
      // Cart Item Selection State (Stored separately from product data)
      // =========================================================================
      selectedLineIds: [],

      toggleSelectItem: (lineId) =>
        set((state) => {
          const current = Array.isArray(state.selectedLineIds) ? state.selectedLineIds : [];
          const exists = current.includes(lineId);
          return {
            selectedLineIds: exists ? current.filter((id) => id !== lineId) : [...current, lineId],
          };
        }),

      selectItem: (lineId) =>
        set((state) => {
          const current = Array.isArray(state.selectedLineIds) ? state.selectedLineIds : [];
          return {
            selectedLineIds: current.includes(lineId) ? current : [...current, lineId],
          };
        }),

      deselectItem: (lineId) =>
        set((state) => {
          const current = Array.isArray(state.selectedLineIds) ? state.selectedLineIds : [];
          return {
            selectedLineIds: current.filter((id) => id !== lineId),
          };
        }),

      selectAllItems: () =>
        set((state) => ({
          selectedLineIds: state.cart.items.map((item) => item.id || item.lineId),
        })),

      deselectAllItems: () =>
        set({ selectedLineIds: [] }),

      isItemSelected: (lineId) => {
        const { selectedLineIds } = get();
        return Array.isArray(selectedLineIds) && selectedLineIds.includes(lineId);
      },

      getSelectedItems: () => {
        const { cart, selectedLineIds } = get();
        const ids = Array.isArray(selectedLineIds) ? selectedLineIds : [];
        return (cart.items || []).filter((item) => ids.includes(item.id || item.lineId));
      },

      getSelectedTotals: () => {
        return calculateCartTotals(get().getSelectedItems());
      },

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

        const price = selectedVariant?.price != null && isValidPrice(selectedVariant.price)
          ? selectedVariant.price
          : product.price;

        const lineId = selectedVariant
          ? `${collectionId}-${product.id}-${selectedVariant.id}`
          : (product.selectedVariantId
              ? `${collectionId}-${product.id}-${product.selectedVariantId}`
              : `${collectionId}-${product.id}`);

        set((state) => {
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
                lineId,
                productId: product.id,
                product: normalizedProduct,
                selectedVariant,
                quantity: sanitizedQty,
                name: normalizedProduct.name,
                price,
                image: normalizedProduct.image,
                packSize: selectedVariant?.attributes?.weight || selectedVariant?.attributes?.packSize || normalizedProduct.packSize || (collectionId === 'tea' ? '25 g' : null),
                collectionId,
              },
            ];
          }

          // Newly added item is selected by default
          const currentSelected = Array.isArray(state.selectedLineIds) ? state.selectedLineIds : [];
          const updatedSelected = currentSelected.includes(lineId)
            ? currentSelected
            : [...currentSelected, lineId];

          return {
            cart: {
              items: newItems,
              isOpen: true, // open drawer on add
            },
            selectedLineIds: updatedSelected,
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
              (item.id === lineId || item.lineId === lineId || item.product?.id === lineId)
                ? { ...item, quantity: parsedQty }
                : item
            ),
          },
        }));
      },

      removeFromCart: (lineId) => {
        set((state) => {
          const targetItem = state.cart.items.find(
            (item) => item.id === lineId || item.lineId === lineId || item.product?.id === lineId
          );
          const effectiveId = targetItem ? (targetItem.id || targetItem.lineId) : lineId;

          return {
            cart: {
              ...state.cart,
              items: state.cart.items.filter(
                (item) => item.id !== effectiveId && item.lineId !== effectiveId && item.product?.id !== effectiveId
              ),
            },
            selectedLineIds: (state.selectedLineIds || []).filter((id) => id !== effectiveId),
          };
        });
      },

      clearCart: () => {
        set((state) => ({
          cart: {
            ...state.cart,
            items: [],
          },
          selectedLineIds: [],
          checkoutContext: { type: 'selected', buyNowItem: null },
        }));
      },

      getCartTotals: () => {
        return calculateCartTotals(get().cart.items);
      },

      // =========================================================================
      // Save For Later Management
      // =========================================================================
      savedForLater: {
        items: [],
      },

      saveForLater: (lineId) => {
        set((state) => {
          const itemToSave = state.cart.items.find(
            (item) => item.id === lineId || item.lineId === lineId || item.product?.id === lineId
          );
          if (!itemToSave) return {};

          const targetId = itemToSave.id || itemToSave.lineId;
          const remainingCartItems = state.cart.items.filter(
            (item) => item.id !== targetId && item.lineId !== targetId
          );

          const existingSaved = state.savedForLater?.items || [];
          const updatedSaved = [
            ...existingSaved.filter((i) => (i.id || i.lineId) !== targetId),
            { ...itemToSave, savedAt: new Date().toISOString() },
          ];

          return {
            cart: {
              ...state.cart,
              items: remainingCartItems,
            },
            selectedLineIds: (state.selectedLineIds || []).filter((id) => id !== targetId),
            savedForLater: {
              items: updatedSaved,
            },
          };
        });
      },

      moveToBag: (savedItemId) => {
        const state = get();
        const savedItems = state.savedForLater?.items || [];
        const itemToMove = savedItems.find((i) => (i.id || i.lineId) === savedItemId);

        if (!itemToMove) {
          return { success: false, reason: 'not_found' };
        }

        // Pricing and availability check
        if (!isValidPrice(itemToMove.price)) {
          return { success: false, reason: 'unpriced' };
        }
        if (itemToMove.product && itemToMove.product.inStock === false) {
          return { success: false, reason: 'out_of_stock' };
        }

        // Add back to cart
        const addResult = get().addToCart(
          itemToMove.product || itemToMove,
          itemToMove.quantity || 1,
          itemToMove.selectedVariant || null
        );

        if (!addResult.success) return addResult;

        // Remove from saved list
        set((s) => ({
          savedForLater: {
            items: (s.savedForLater?.items || []).filter(
              (i) => (i.id || i.lineId) !== savedItemId
            ),
          },
        }));

        return { success: true };
      },

      removeFromSaved: (savedItemId) => {
        set((state) => ({
          savedForLater: {
            items: (state.savedForLater?.items || []).filter(
              (i) => (i.id || i.lineId) !== savedItemId
            ),
          },
        }));
      },

      // =========================================================================
      // Dedicated Checkout Context (Selective Checkout vs Buy Now)
      // =========================================================================
      checkoutContext: {
        type: 'selected', // 'selected' | 'buy_now'
        buyNowItem: null,
      },

      initiateSelectiveCheckout: (selectedIds = null) => {
        if (Array.isArray(selectedIds)) {
          set({ selectedLineIds: selectedIds });
        }
        const currentSelected = Array.isArray(selectedIds) ? selectedIds : (get().selectedLineIds || []);
        if (currentSelected.length === 0) {
          return { success: false, reason: 'empty_selection' };
        }
        set({
          checkoutContext: {
            type: 'selected',
            buyNowItem: null,
          },
        });
        return { success: true };
      },

      initiateBuyNow: (product, quantity = 1, selectedVariant = null) => {
        if (!isValidPrice(product?.price)) {
          return { success: false, reason: 'unpriced' };
        }
        const sanitizedQty = isValidQuantity(quantity) ? quantity : Math.max(1, parseInt(quantity, 10) || 1);
        const collectionId = product.collection ||
          (product.id?.startsWith('f-') ? 'food' : product.id?.startsWith('tea-') ? 'tea' : product.id?.startsWith('s-') ? 'sarees' : 'jewellery');
        const normalizedProduct = { ...product, collection: collectionId };

        const price = selectedVariant?.price != null && isValidPrice(selectedVariant.price)
          ? selectedVariant.price
          : product.price;

        const lineId = selectedVariant
          ? `buynow-${collectionId}-${product.id}-${selectedVariant.id}`
          : `buynow-${collectionId}-${product.id}`;

        const buyNowItem = {
          id: lineId,
          lineId,
          productId: product.id,
          product: normalizedProduct,
          selectedVariant,
          quantity: sanitizedQty,
          name: normalizedProduct.name,
          price,
          image: normalizedProduct.image,
          collectionId,
          isBuyNow: true,
        };

        set({
          checkoutContext: {
            type: 'buy_now',
            buyNowItem,
          },
        });

        return { success: true, buyNowItem };
      },

      resetCheckoutContext: () => {
        set({
          checkoutContext: {
            type: 'selected',
            buyNowItem: null,
          },
        });
      },

      getCheckoutItems: () => {
        const { checkoutContext, cart, selectedLineIds } = get();
        if (checkoutContext?.type === 'buy_now' && checkoutContext?.buyNowItem) {
          return [checkoutContext.buyNowItem];
        }
        const ids = Array.isArray(selectedLineIds) ? selectedLineIds : [];
        return (cart.items || []).filter((item) => ids.includes(item.id || item.lineId));
      },

      getCheckoutTotals: () => {
        return calculateCartTotals(get().getCheckoutItems());
      },

      /**
       * Reconcile cart after a successful order purchase.
       * - Buy Now: Leaves existing bag completely untouched.
       * - Selective checkout: Decrements purchased quantities, removes fully purchased lines,
       *   preserves all unselected lines and unpurchased quantities.
       */
      reconcileCartAfterPurchase: (purchasedItems = []) => {
        const { checkoutContext } = get();

        // 1. Buy Now purchase never modifies the active bag
        if (checkoutContext?.type === 'buy_now') {
          set({
            checkoutContext: { type: 'selected', buyNowItem: null },
          });
          return;
        }

        // 2. Selective checkout reconciliation
        set((state) => {
          let updatedItems = [...(state.cart.items || [])];
          let updatedSelected = [...(state.selectedLineIds || [])];

          for (const purchased of purchasedItems) {
            const pLineId = purchased.id || purchased.lineId;
            const pProductId = purchased.productId || purchased.product?.id;
            const pVariantId = purchased.selectedVariant?.id || purchased.variantId;
            const pQty = Number(purchased.quantity || 1);

            const index = updatedItems.findIndex((item) => {
              if (pLineId && (item.id === pLineId || item.lineId === pLineId)) return true;
              const itemPid = item.productId || item.product?.id;
              const itemVid = item.selectedVariant?.id || item.variantId;
              return itemPid === pProductId && (itemVid || null) === (pVariantId || null);
            });

            if (index > -1) {
              const existingItem = updatedItems[index];
              if (existingItem.quantity > pQty) {
                // Partial quantity purchased: decrement remaining quantity!
                updatedItems[index] = {
                  ...existingItem,
                  quantity: existingItem.quantity - pQty,
                };
              } else {
                // Fully purchased line: remove line and clear from selection!
                const lineIdToRemove = existingItem.id || existingItem.lineId;
                updatedItems.splice(index, 1);
                updatedSelected = updatedSelected.filter((id) => id !== lineIdToRemove);
              }
            }
          }

          return {
            cart: {
              ...state.cart,
              items: updatedItems,
            },
            selectedLineIds: updatedSelected.filter((id) =>
              updatedItems.some((item) => (item.id || item.lineId) === id)
            ),
            checkoutContext: { type: 'selected', buyNowItem: null },
          };
        });
      },

      // =========================================================================
      // Checkout State Management (Delivery Details & Demo Order State)
      // =========================================================================
      customerDetails: {
        fullName: '',
        email: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        instructions: '',
        deliveryInstructions: '',
      },
      lastCompletedOrder: null,

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
          instructions: '',
          deliveryInstructions: '',
        },
        lastCompletedOrder: null,
      },

      setCustomerDetails: (details) =>
        set((state) => {
          const currentDetails = state.customerDetails || state.checkout?.customerDetails || {};
          const instructions = details.instructions !== undefined
            ? details.instructions
            : (details.deliveryInstructions !== undefined ? details.deliveryInstructions : currentDetails.instructions || '');
          const deliveryInstructions = details.deliveryInstructions !== undefined
            ? details.deliveryInstructions
            : (details.instructions !== undefined ? details.instructions : currentDetails.deliveryInstructions || '');

          const merged = {
            ...currentDetails,
            ...details,
            instructions,
            deliveryInstructions,
          };

          return {
            customerDetails: merged,
            checkout: {
              ...state.checkout,
              customerDetails: merged,
            },
          };
        }),

      clearCustomerDetails: () =>
        set((state) => {
          const reset = {
            fullName: '',
            email: '',
            phone: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            pincode: '',
            instructions: '',
            deliveryInstructions: '',
          };
          return {
            customerDetails: reset,
            checkout: {
              ...state.checkout,
              customerDetails: reset,
            },
          };
        }),

      setLastCompletedOrder: (order) => {
        if (typeof window !== 'undefined' && order?.orderId) {
          try {
            sessionStorage.setItem(`amoga_last_completed_order_${order.orderId}`, JSON.stringify(order));
          } catch {
            // Non-blocking
          }
        }
        set((state) => ({
          lastCompletedOrder: order,
          checkout: {
            ...state.checkout,
            lastCompletedOrder: order,
          },
        }));
      },

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
    }),
    {
      name: 'amoga_unified_cart_storage',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => {
        const validLineIds = (state.cart?.items || []).map((i) => i.id || i.lineId);
        const reconciledSelected = (state.selectedLineIds || []).filter((id) => validLineIds.includes(id));

        return {
          cart: {
            items: Array.isArray(state.cart?.items) ? state.cart.items : [],
            isOpen: false,
          },
          selectedLineIds: reconciledSelected.length > 0 ? reconciledSelected : validLineIds,
          savedForLater: {
            items: Array.isArray(state.savedForLater?.items) ? state.savedForLater.items : [],
          },
          checkoutContext: state.checkoutContext || { type: 'selected', buyNowItem: null },
          customerDetails: state.customerDetails,
          checkout: {
            customerDetails: state.checkout?.customerDetails || state.customerDetails,
            lastCompletedOrder: null,
          },
          wishlist: {
            items: Array.isArray(state.wishlist?.items) ? state.wishlist.items : [],
            isOpen: false,
          },
        };
      },
    }
  )
);
