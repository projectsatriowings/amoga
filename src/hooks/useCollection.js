import { useState, useEffect, useCallback } from 'react';
import { fetchCollections } from '../services/productsApi';
import { registerLiveCollections } from '../features/collections/themeConfig';

let inMemoryCollections = null;
const listeners = new Set();
const CHANNEL_NAME = 'amoga_collections_sync';

function broadcast(collections) {
  inMemoryCollections = collections;
  registerLiveCollections(collections);
  try {
    sessionStorage.setItem('amoga_active_collections_list', JSON.stringify(collections));
  } catch {
    // Non-blocking
  }
  listeners.forEach((listener) => {
    try {
      listener(collections);
    } catch (e) {
      console.warn('Listener error:', e);
    }
  });
}

/**
 * Invalidate cache across all tabs and force instant reload
 */
export function invalidateCollectionsCache() {
  inMemoryCollections = null;
  try {
    sessionStorage.removeItem('amoga_active_collections_list');
    sessionStorage.removeItem('amoga_gatekeeper_collections');
  } catch {
    // Non-blocking
  }

  // Refetch and broadcast locally
  fetchCollections()
    .then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        broadcast(data);
      }
    })
    .catch((err) => console.warn('Cache invalidation fetch error:', err));

  // Notify other tabs via BroadcastChannel
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: 'COLLECTIONS_INVALIDATED', timestamp: Date.now() });
      channel.close();
    } catch {
      // Non-blocking
    }
  }
}

// Initialize from session cache if available
try {
  const cached = sessionStorage.getItem('amoga_active_collections_list');
  if (cached) {
    const parsed = JSON.parse(cached);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryCollections = parsed;
      registerLiveCollections(parsed);
    }
  }
} catch {
  // Non-blocking
}

/**
 * Hook to retrieve all active collections from the database
 * with instant caching, window visibility re-verification, and cross-tab sync.
 */
export function useAllCollections() {
  const [collections, setCollections] = useState(inMemoryCollections || []);
  const [loading, setLoading] = useState(!inMemoryCollections);

  const reload = useCallback(() => {
    return fetchCollections()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          broadcast(data);
          setCollections(data);
          setLoading(false);
          return data;
        }
      })
      .catch((err) => {
        console.warn('Failed to load collections from API:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const listener = (updated) => setCollections(updated);
    listeners.add(listener);

    // Initial load
    reload();

    // Listen to cross-tab updates via BroadcastChannel
    let channel = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = (event) => {
          if (event.data?.type === 'COLLECTIONS_INVALIDATED') {
            reload();
          }
        };
      } catch {
        // Non-blocking
      }
    }

    // When user switches back to this tab, silently revalidate
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reload();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      listeners.delete(listener);
      if (channel) {
        channel.close();
      }
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [reload]);

  return { collections, loading, refetch: reload };
}

/**
 * Hook to retrieve a specific collection by id or slug
 */
export function useCollection(collectionIdOrSlug) {
  const { collections, loading, refetch } = useAllCollections();
  const key = String(collectionIdOrSlug || '').toLowerCase();

  const collection = collections.find(
    (c) => c.id?.toLowerCase() === key || c.slug?.toLowerCase() === key
  ) || null;

  return { collection, loading, refetch };
}
