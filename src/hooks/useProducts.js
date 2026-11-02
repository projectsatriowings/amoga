import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchProducts, fetchProductBySlug } from '../services/productsApi';

import foodSoupsHero from '../assets/images/food-soups-hero.jpg';
import gatekeeperFood from '../assets/images/gatekeeper-food.jpg';
import foodTeasHero from '../assets/images/food-teas-hero.jpg';
import sareeBanarasi from '../assets/images/saree-banarasi.jpg';
import sareeKanchipuram from '../assets/images/saree-kanchipuram.jpg';
import sareeSoftSilk from '../assets/images/saree-soft-silk.jpg';
import sareeTissue from '../assets/images/saree-tissue.jpg';
import jewelleryAuroraRing from '../assets/images/jewellery-aurora-ring.jpg';
import jewelleryLeafRing from '../assets/images/jewellery-leaf-ring.jpg';
import jewelleryLumiereNecklace from '../assets/images/jewellery-lumiere-necklace.jpg';
import jewellerySolsticeRing from '../assets/images/jewellery-solstice-ring.jpg';
import jewelleryVeriteNecklace from '../assets/images/jewellery-verite-necklace.jpg';

const ASSET_PATH_MAP = {
  '/src/assets/images/food-soups-hero.jpg': foodSoupsHero,
  'src/assets/images/food-soups-hero.jpg': foodSoupsHero,
  '/src/assets/images/gatekeeper-food.jpg': gatekeeperFood,
  'src/assets/images/gatekeeper-food.jpg': gatekeeperFood,
  '/src/assets/images/food-teas-hero.jpg': foodTeasHero,
  'src/assets/images/food-teas-hero.jpg': foodTeasHero,
  '/src/assets/images/saree-banarasi.jpg': sareeBanarasi,
  'src/assets/images/saree-banarasi.jpg': sareeBanarasi,
  '/src/assets/images/saree-kanchipuram.jpg': sareeKanchipuram,
  'src/assets/images/saree-kanchipuram.jpg': sareeKanchipuram,
  '/src/assets/images/saree-soft-silk.jpg': sareeSoftSilk,
  'src/assets/images/saree-soft-silk.jpg': sareeSoftSilk,
  '/src/assets/images/saree-tissue.jpg': sareeTissue,
  'src/assets/images/saree-tissue.jpg': sareeTissue,
  '/src/assets/images/jewellery-aurora-ring.jpg': jewelleryAuroraRing,
  'src/assets/images/jewellery-aurora-ring.jpg': jewelleryAuroraRing,
  '/src/assets/images/jewellery-leaf-ring.jpg': jewelleryLeafRing,
  'src/assets/images/jewellery-leaf-ring.jpg': jewelleryLeafRing,
  '/src/assets/images/jewellery-lumiere-necklace.jpg': jewelleryLumiereNecklace,
  'src/assets/images/jewellery-lumiere-necklace.jpg': jewelleryLumiereNecklace,
  '/src/assets/images/jewellery-solstice-ring.jpg': jewellerySolsticeRing,
  'src/assets/images/jewellery-solstice-ring.jpg': jewellerySolsticeRing,
  '/src/assets/images/jewellery-verite-necklace.jpg': jewelleryVeriteNecklace,
  'src/assets/images/jewellery-verite-necklace.jpg': jewelleryVeriteNecklace,
};

function resolveProductImage(apiImage, fallbackImage) {
  if (!apiImage) return fallbackImage;
  if (typeof apiImage === 'string' && ASSET_PATH_MAP[apiImage]) {
    return ASSET_PATH_MAP[apiImage];
  }
  if (typeof apiImage === 'string' && (apiImage.startsWith('/src/') || apiImage.startsWith('src/'))) {
    return fallbackImage || apiImage;
  }
  return apiImage;
}

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

// Client-side cache for instant zero-latency renders across page navigations & refreshes
const clientProductsMemoryCache = new Map();

function getCachedProducts(key) {
  if (clientProductsMemoryCache.has(key)) {
    return clientProductsMemoryCache.get(key);
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`amoga_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.data)) {
          clientProductsMemoryCache.set(key, parsed.data);
          return parsed.data;
        }
      }
    } catch {
      // Non-blocking
    }
  }
  return null;
}

function setCachedProducts(key, data) {
  clientProductsMemoryCache.set(key, data);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(
        `amoga_cache_${key}`,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch {
      // Non-blocking
    }
  }
}

export function clearClientProductsCache() {
  clientProductsMemoryCache.clear();
  inFlightRequests.clear();
  if (typeof window !== 'undefined') {
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('amoga_cache_')) {
          sessionStorage.removeItem(key);
        }
      }
    } catch {
      // Non-blocking
    }
  }
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
  clearClientProductsCache();
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
    // API data takes precedence, but dev asset paths are safely resolved to bundled assets
    image: resolveProductImage(apiItem.image, fallbackItem.image),
    botanicalName: apiItem.botanicalName || fallbackItem.botanicalName,
    standeeNotes: apiItem.standeeNotes || fallbackItem.standeeNotes,
    categoryName: apiItem.categoryName || fallbackItem.categoryName,
    origin: apiItem.origin || fallbackItem.origin,
    brewingTime: apiItem.brewingTime || fallbackItem.brewingTime,
    details: (Array.isArray(apiItem.details) && apiItem.details.length > 0)
      ? apiItem.details
      : fallbackItem.details,
    badge: apiItem.badge || fallbackItem.badge,
    packSize: apiItem.packSize || fallbackItem.packSize || ((apiItem.collection === 'tea' || fallbackItem.collection === 'tea') ? '25 g' : null),
  };
}

/**
 * Hook to retrieve products for a specific collection from the API
 * with explicit loading, error handling, live cross-session revalidation, and zero mock fallback fabrication.
 */
export function useProducts({ collection, category, q, sort } = {}) {
  const cacheKey = `${collection || 'all'}:${category || 'all'}:${q || ''}:${sort || 'default'}`;

  // Initialize immediately from client cache if available
  const [products, setProducts] = useState(() => {
    const cached = getCachedProducts(cacheKey);
    return Array.isArray(cached) ? cached : [];
  });
  const [isLoading, setIsLoading] = useState(() => {
    const cached = getCachedProducts(cacheKey);
    return cached === null;
  });
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  // Sync state if cacheKey changes
  const prevKeyRef = useRef(cacheKey);
  useEffect(() => {
    if (prevKeyRef.current !== cacheKey) {
      prevKeyRef.current = cacheKey;
      const cached = getCachedProducts(cacheKey);
      if (Array.isArray(cached)) {
        setProducts(cached);
        setIsLoading(false);
      } else {
        setProducts([]);
        setIsLoading(true);
      }
    }
  }, [cacheKey]);

  // Initialize global SSE and bounded visibility revalidator once
  useEffect(() => {
    initCatalogueSynchronizer();
  }, []);

  const refetch = useCallback(() => {
    clearClientProductsCache();
    setRefreshToken((prev) => prev + 1);
  }, []);

  // Primary data fetching effect with request deduplication
  useEffect(() => {
    let isMounted = true;

    deduplicatedFetchProducts({ collection, category, q, sort, limit: 100 })
      .then((res) => {
        if (isMounted) {
          if (res && Array.isArray(res.data)) {
            const list = res.data.map((apiItem) => ({
              ...apiItem,
              image: resolveProductImage(apiItem.image, apiItem.image),
            }));
            setCachedProducts(cacheKey, list);
            setProducts(list);
          } else {
            setCachedProducts(cacheKey, []);
            setProducts([]);
          }
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn(`[Amoga API] Could not load products for ${collection} from API:`, err.message);
          setError(err.message);
          const cached = getCachedProducts(cacheKey);
          if (Array.isArray(cached)) {
            setProducts(cached);
          } else {
            setProducts([]);
          }
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [collection, category, q, sort, refreshToken, cacheKey]);

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

  return { products, isLoading, error, isUsingFallback: false, refetch };
}

/**
 * Hook to retrieve single product detail by collection and slug from the database API.
 */
export function useProductDetail(collection, slug) {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    initCatalogueSynchronizer();
  }, []);

  const refetch = useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!collection || !slug) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchProductBySlug(collection, slug)
      .then((data) => {
        if (isMounted) {
          if (data) {
            setProduct({
              ...data,
              image: resolveProductImage(data.image, data.image),
            });
          } else {
            setProduct(null);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn(`[Amoga API] Could not load product "${slug}" from API:`, err.message);
          setError(err.message);
          setProduct(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [collection, slug, refreshToken]);

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

  return { product, isLoading, error, isUsingFallback: false, refetch };
}
