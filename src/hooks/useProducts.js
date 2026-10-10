import { useState, useEffect } from 'react';
import { fetchProducts, fetchProductBySlug } from '../services/productsApi';

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
 * with explicit loading, error handling, and robust metadata preservation.
 */
export function useProducts({ collection, category, q, sort, fallbackData = [] } = {}) {
  const [products, setProducts] = useState(fallbackData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

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
  }, [collection, category, q, sort, fallbackData]);

  return { products, isLoading, error, isUsingFallback };
}

/**
 * Hook to retrieve single product detail by collection and slug
 * with rich catalogue metadata retention.
 */
export function useProductDetail(collection, slug, fallbackItem = null) {
  const [product, setProduct] = useState(fallbackItem);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

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
  }, [collection, slug, fallbackItem]);

  return { product, isLoading, error, isUsingFallback };
}
