import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { COLLECTION_THEMES, getCollectionTheme, getThemeCssVariables } from '../features/collections/themeConfig';

const STORAGE_KEY = 'amoga_active_collection_context';

/**
 * Persistently retrieves the last browsed collection from browser storage.
 */
function getPersistedCollectionId() {
  if (typeof window === 'undefined') return 'food';
  try {
    return sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY) || 'food';
  } catch {
    return 'food';
  }
}

/**
 * Safely persists the active browsed collection to storage.
 */
function setPersistedCollectionId(id) {
  if (typeof window === 'undefined' || !id) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Non-blocking
  }
}

/**
 * Hook to resolve the authoritative visual theme for any page in Amoga Commerce.
 * Guarantees that Cart, Checkout, Order Review, and Contact sections seamlessly blend
 * with the active collection's identity or render an elegant neutral multi-collection theme.
 */
export function useResolvedTheme(explicitCollectionId = null) {
  const location = useLocation();
  const cartState = useStore((state) => state.cart);
  const cartItems = useMemo(() => {
    return Array.isArray(cartState) ? cartState : (cartState?.items || []);
  }, [cartState]);

  const pathname = location.pathname;

  const resolution = useMemo(() => {
    // 1. Explicit override if provided (e.g. inside a collection section)
    if (explicitCollectionId) {
      const theme = getCollectionTheme(explicitCollectionId);
      return {
        themeId: theme.id,
        theme,
        isMixed: false,
        source: 'explicit',
      };
    }

    // 2. Direct Collection Storefront & Product Routes
    if (pathname.startsWith('/sarees')) {
      return {
        themeId: 'sarees',
        theme: COLLECTION_THEMES.sarees,
        isMixed: false,
        source: 'route',
      };
    }
    if (pathname.startsWith('/tea') || pathname === '/wellness-tea') {
      return {
        themeId: 'tea',
        theme: COLLECTION_THEMES.tea,
        isMixed: false,
        source: 'route',
      };
    }
    if (pathname.startsWith('/jewellery')) {
      return {
        themeId: 'jewellery',
        theme: COLLECTION_THEMES.jewellery,
        isMixed: false,
        source: 'route',
      };
    }
    if (
      pathname.startsWith('/food') ||
      pathname === '/pantry' ||
      pathname === '/wholesome-pantry'
    ) {
      return {
        themeId: 'food',
        theme: COLLECTION_THEMES.food,
        isMixed: false,
        source: 'route',
      };
    }

    // 3. Shared Commerce Flows: Cart, Checkout, Review, Confirmation
    const isCartOrCheckoutFlow =
      pathname === '/cart' ||
      pathname.startsWith('/checkout') ||
      pathname.startsWith('/order-confirmation');

    if (isCartOrCheckoutFlow) {
      if (cartItems.length > 0) {
        // Collect unique collections in bag
        const collectionSet = new Set();
        cartItems.forEach((item) => {
          const col =
            item.collectionId ||
            item.product?.collection ||
            (item.productId?.startsWith('s-')
              ? 'sarees'
              : item.productId?.startsWith('tea-')
              ? 'tea'
              : item.productId?.startsWith('j-')
              ? 'jewellery'
              : 'food');
          if (col) collectionSet.add(col);
        });

        const uniqueCollections = Array.from(collectionSet);

        // Case A: Exactly 1 collection in bag -> Use that collection's rich theme
        if (uniqueCollections.length === 1) {
          const matchedId = uniqueCollections[0];
          const matchedTheme = getCollectionTheme(matchedId);
          return {
            themeId: matchedTheme.id,
            theme: matchedTheme,
            isMixed: false,
            source: 'cart_single',
          };
        }

        // Case B: Multi-collection cart -> Use Amoga Unified Luxury Commerce Theme
        return {
          themeId: 'neutral',
          theme: COLLECTION_THEMES.neutral,
          isMixed: true,
          distinctCollections: uniqueCollections,
          source: 'cart_mixed',
        };
      }

      // Empty Cart or post-checkout confirmation: Use last browsed collection from storage
      const lastId = getPersistedCollectionId();
      const lastTheme = getCollectionTheme(lastId);
      return {
        themeId: lastTheme.id,
        theme: lastTheme,
        isMixed: false,
        source: 'persisted_history',
      };
    }

    // 4. Default Portal Gatekeeper fallback
    return {
      themeId: 'neutral',
      theme: COLLECTION_THEMES.neutral,
      isMixed: false,
      source: 'default',
    };
  }, [explicitCollectionId, pathname, cartItems]);

  // Persist browsed collection when visiting route or single collection cart
  useEffect(() => {
    if (resolution.source === 'route' && resolution.themeId) {
      setPersistedCollectionId(resolution.themeId);
    } else if (resolution.source === 'cart_single' && resolution.themeId) {
      setPersistedCollectionId(resolution.themeId);
    }
  }, [resolution.source, resolution.themeId]);

  const cssVariables = useMemo(() => {
    return getThemeCssVariables(resolution.theme);
  }, [resolution.theme]);

  return {
    themeId: resolution.themeId,
    theme: resolution.theme,
    palette: resolution.theme.palette,
    themeClass: `theme-${resolution.themeId}`,
    cssVariables,
    isMixed: resolution.isMixed,
    distinctCollections: resolution.distinctCollections || [],
    source: resolution.source,
  };
}
