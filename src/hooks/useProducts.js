import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchProducts, fetchProductBySlug } from '../services/productsApi';

const PRODUCTS_SYNC_CHANNEL = 'amoga_products_sync';
const PRODUCTS_SYNC_STORAGE_KEY = 'amoga_products_sync_timestamp';

// Track in-flight requests to eliminate duplicate API calls across multiple components
const inFlightRequests = new Map();

function deduplicatedFetchProducts(params) {
  const key = JSON.stringify(params);
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }
  const promise = fetchProducts(params).finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, promise);
  return promise;
}

// Global real-time catalogue synchronizer (SSE + Bounded Visibility Revalidation)
let isSynchronizerInitialized = false;
let lastKnownCatalogueVersion = Date.now();

function initCatalogueSynchronizer() {
  if (typeof window === 'undefined' || isSynchronizerInitialized) return;
  isSynchronizerInitialized = true;

  // 1. Server-Sent Events (SSE) Stream
  let eventSource = null;
  let reconnectTimer = null;

  function connectSSE() {
    if (typeof EventSource === 'undefined') return;

    try {
      eventSource = new EventSource('/api/products/events');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === 'PRODUCTS_UPDATED') {
            if (data.version) lastKnownCatalogueVersion = data.version;
            window.dispatchEvent(
              new CustomEvent('amoga:products_updated', {
                detail: {
                  collectionId: data.collectionId || 'all',
                  timestamp: data.timestamp || Date.now(),
                },
              })
            );
          } else if (data && data.type === 'CONNECTED' && data.version) {
            lastKnownCatalogueVersion = data.version;
          }
        } catch {
          // Non-blocking parse error
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Graceful reconnect after 5s backoff
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectSSE, 5000);
      };
    } catch {
      // Non-blocking
    }
  }

  connectSSE();

  // 2. Bounded Visibility Polling (Checks lightweight /api/products/version only while tab is active)
  let pollingInterval = null;

  async function checkCatalogueVersion() {
    if (document.visibilityState !== 'visible') return;

    try {
      const res = await fetch('/api/products/version', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.version && json.version > lastKnownCatalogueVersion) {
        lastKnownCatalogueVersion = json.version;
        window.dispatchEvent(
          new CustomEvent('amoga:products_updated', {
            detail: { collectionId: 'all', timestamp: json.version },
          })
        );
      }
    } catch {
      // Safe offline ignore
    }
  }

  function startVisibilityPolling() {
    stopVisibilityPolling();
    if (document.visibilityState === 'visible') {
      pollingInterval = setInterval(checkCatalogueVersion, 8000);
    }
  }

  function stopVisibilityPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkCatalogueVersion();
      startVisibilityPolling();
      if (!eventSource) connectSSE();
    } else {
      stopVisibilityPolling();
    }
  });

  window.addEventListener('focus', () => {
    checkCatalogueVersion();
  });

  startVisibilityPolling();
}

/**
 * Invalidate products cache across all components, open tabs, and browser windows.
 * Called immediately after adding, updating, archiving, or adjusting inventory for any product.
 * @param {string} [collectionId] - Optional collection ID that was updated ('food', 'tea', 'sarees', 'jewellery', or 'all')
 */
export function invalidateProductsCache(collectionId = null) {
  const timestamp = Date.now();
  lastKnownCatalogueVersion = timestamp;

  if (typeof window !== 'undefined') {
    // 1. Cross-tab synchronization via BroadcastChannel
    if ('BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel(PRODUCTS_SYNC_CHANNEL);
        channel.postMessage({ type: 'PRODUCTS_UPDATED', collectionId, timestamp });
        channel.close();
      } catch {
        // Non-blocking
      }
    }

    // 2. Same-window custom event dispatch
    try {
      window.dispatchEvent(
        new CustomEvent('amoga:products_updated', {
          detail: { collectionId: collectionId || 'all', timestamp },
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
    // API data takes precedence, fallback supplies rich botanical highlights
    image: apiItem.image || fallbackItem.image,
    botanicalName: apiItem.botanicalName || fallbackItem.botanicalName,
    standeeNotes: apiItem.standeeNotes || fallbackItem.standeeNotes,
    categoryName: apiItem.categoryName || fallbackItem.categoryName,
    origin: apiItem.origin || fallbackItem.origin,
    brewingTime: apiItem.brewingTime || fallbackItem.brewingTime,
    details: (Array.isArray(apiItem.details) && apiItem.details.length > 0)
      ? apiItem.details
      : fallbackItem.details,
    badge: apiItem.badge || fallbackItem.badge,
    packSize: apiItem.packSize || fallbackItem.packSize,
    originalPrice: apiItem.originalPrice || fallbackItem.originalPrice,
  };
}

/**
 * Hook to retrieve products for a specific collection from the API
 * with explicit loading, error handling, live cross-session revalidation, and robust metadata preservation.
 */
export function useProducts({ collection, category, q, sort, fallbackData = [] } = {}) {
  const [products, setProducts] = useState(fallbackData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  // Initialize global SSE and bounded visibility revalidator once
  useEffect(() => {
    initCatalogueSynchronizer();
  }, []);

  const refetch = useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  // Primary data fetching effect with request deduplication
  useEffect(() => {
    let isMounted = true;

    deduplicatedFetchProducts({ collection, category, q, sort, limit: 100 })
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
          setProducts(fallbackData);
          setIsUsingFallback(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [collection, category, q, sort, fallbackData, refreshToken]);

  // Live synchronization effect: listen for updates from admin actions, SSE, other tabs, and window focus
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

    window.addEventListener('amoga:products_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('amoga:products_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
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

  useEffect(() => {
    initCatalogueSynchronizer();
  }, []);

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
    const handleUpdate = (e) => {
      const targetCol = e?.detail?.collectionId;
      if (!targetCol || targetCol === 'all' || targetCol.toLowerCase() === collection?.toLowerCase()) {
        refetch();
      }
    };
    window.addEventListener('amoga:products_updated', handleUpdate);
    return () => window.removeEventListener('amoga:products_updated', handleUpdate);
  }, [collection, refetch]);

  return { product, isLoading, error, isUsingFallback, refetch };
}
