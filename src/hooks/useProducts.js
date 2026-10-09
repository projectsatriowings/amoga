import { useState, useEffect } from 'react';
import { fetchProducts, fetchProductBySlug } from '../services/productsApi';

/**
 * Hook to retrieve products for a specific collection from the API
 * with explicit loading and error handling.
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
            setProducts(res.data);
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
            setProduct(data);
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
