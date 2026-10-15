import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchProducts, fetchProductBySlug } from '../services/productsApi';

const PRODUCTS_SYNC_CHANNEL = 'amoga_products_sync';
const PRODUCTS_SYNC_STORAGE_KEY = 'amoga_products_sync_timestamp';

/**
 * Invalidate products cache across all components and open tabs.
 * Called immediately after adding, updating, archiving, or adjusting inventory for any product.
 * @param {string} [collectionId] - Optional collection ID that was updated ('food', 'tea', 'sarees', 'jewellery', or 'all')
 */
export function invalidateProductsCache(collectionId = null) {
  const timestamp = Date.now();

  // 1. Cross-tab synchronization via BroadcastChannel
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(PRODUCTS_SYNC_CHANNEL);
      channel.postMessage({ type: 'PRODUCTS_UPDATED', collectionId, timestamp });
      channel.close();
    } catch {
      // Non-blocking
    }
  }

  // 2. Same-window custom event dispatch
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('amoga:products_updated', {
          detail: { collectionId, timestamp },
        })
      );
    } catch {
      // Non-blocking
    }

    // 3. Cross-tab fallback via storage event
    try {
      localStorage.setItem(PRODUCTS_SYNC_STORAGE_KEY, `${collectionId || 'all'}:${timestamp}`);
    } catch {
      // Non-blocking
    }
  }
}

/**
 * Merge an API product with a local static/fallback item so rich catalogue metadata
 * (e.g. botanical species, standee wellness notes, harvest highlights, origin, brewing time)
 * is never discarded by minimal database payloads.
 */
function mergeProductWithFallback(apiItem, fallbackItem) {
  if (!apiItem && !fallbackItem) return null;
  if (!apiItem) return fallbackItem;
  if (!fallbackItem) return apiItem;

  return {
    ...fallbackItem,
    ...apiItem,
    // Preserve rich artisanal, botanical & standee highlights
    botanicalName: apiItem.botanicalName || fallbackItem.botanicalName,
    standeeNotes: apiItem.standeeNotes || fallbackItem.standeeNotes,
    categoryName: fallbackItem.categoryName || apiItem.categoryName,
    origin: apiItem.origin || fallbackItem.origin,
    brewingTime: apiItem.brewingTime || fallbackItem.brewingTime,
    details: (Array.isArray(apiItem.details) && apiItem.details.length > 0)
      ? apiItem.details
      : fallbackItem.details,
    badge: apiItem.badge || fallbackItem.badge,
    packSize: apiItem.packSize || fallbackItem.packSize,
    originalPrice: apiItem.originalPrice || fallbackItem.originalPrice,
    image: fallbackItem.image || apiItem.image,
  };
}

/**
 * Hook to retrieve products for a specific collection from the API
 * with explicit loading, error handling, live cross-tab revalidation, and robust metadata preservation.
 */
export function useProducts({ collection, category, q, sort, fallbackData = [] } = {}) {
  const [products, setProducts] = useState(fallbackData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const refetch = useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  // Primary data fetching effect
  useEffect(() => {
    let isMounted = true;

    fetchProducts({ collection, category, q, sort })
      .then((res) => {
        if (isMounted) {
          if (res && Array.isArray(res.data)) {
            const mergedList = res.data.map((apiItem) => {
              const fallback = Array.isArray(fallbackData)
                ? fallbackData.find((f) => f.slug === apiItem.slug || f.id === apiItem.id)
                : null;
              return mergeProductWithFallback(apiItem, fallback);
            });
            setProducts(mergedList);
            setIsUsingFallback(false);
          } else {
            setProducts(fallbackData);
            setIsUsingFallback(true);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn(`[Amoga API] Could not load products for ${collection} from API:`, err.message);
          setError(err.message);
          // Safe explicit development fallback when API is starting or offline
          setProducts(fallbackData);
          setIsUsingFallback(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [collection, category, q, sort, fallbackData, refreshToken]);

  // Live synchronization effect: listen for updates from admin actions, other tabs, and window focus
  useEffect(() => {
    const shouldRefreshForCollection = (targetCol) => {
      if (!targetCol || targetCol === 'all') return true;
      if (!collection) return true;
      return targetCol.toLowerCase() === collection.toLowerCase();
    };

    const handleUpdate = (e) => {
      const targetCol = e?.detail?.collectionId;
      if (shouldRefreshForCollection(targetCol)) {
        refetch();
      }
    };

    let channel = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel(PRODUCTS_SYNC_CHANNEL);
        channel.onmessage = (msg) => {
          const targetCol = msg?.data?.collectionId;
          if (shouldRefreshForCollection(targetCol)) {
            refetch();
          }
        };
      } catch {
        // Non-blocking
      }
    }

    const handleStorage = (e) => {
      if (e.key === PRODUCTS_SYNC_STORAGE_KEY && e.newValue) {
        const [targetCol] = e.newValue.split(':');
        if (shouldRefreshForCollection(targetCol)) {
          refetch();
        }
      }
    };

    // Auto-revalidate when switching back to this window / tab
    let lastFocusTime = Date.now();
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFocusTime > 1500) {
        lastFocusTime = Date.now();
        refetch();
      }
    };

    window.addEventListener('amoga:products_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('amoga:products_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      if (channel) {
        try {
          channel.close();
        } catch {
          // Non-blocking
        }
      }
    };
  }, [collection, refetch]);

  return { products, isLoading, error, isUsingFallback, refetch };
}

/**
 * Hook to retrieve single product detail by collection and slug
 * with rich catalogue metadata retention and live revalidation.
 */
export function useProductDetail(collection, slug, fallbackItem = null) {
  const [product, setProduct] = useState(fallbackItem);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const refetch = useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!collection || !slug) return;

    let isMounted = true;

    fetchProductBySlug(collection, slug)
      .then((data) => {
        if (isMounted) {
          if (data) {
            const merged = mergeProductWithFallback(data, fallbackItem);
            setProduct(merged);
            setIsUsingFallback(false);
          } else {
            setProduct(fallbackItem);
            setIsUsingFallback(true);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn(`[Amoga API] Could not load product "${slug}" from API:`, err.message);
          setError(err.message);
          setProduct(fallbackItem);
          setIsUsingFallback(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [collection, slug, fallbackItem, refreshToken]);

  // Synchronize on global product updates
  useEffect(() => {
    const handleUpdate = () => refetch();
    window.addEventListener('amoga:products_updated', handleUpdate);
    return () => window.removeEventListener('amoga:products_updated', handleUpdate);
  }, [refetch]);

  return { product, isLoading, error, isUsingFallback, refetch };
}

