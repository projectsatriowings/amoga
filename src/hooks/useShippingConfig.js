import { useState, useEffect } from 'react';
import { getShippingConfigApi } from '../services/checkoutApi';

let cachedShippingConfig = null;
const listeners = new Set();

function broadcastConfig(config) {
  cachedShippingConfig = config;
  try {
    sessionStorage.setItem('amoga_shipping_config', JSON.stringify(config));
  } catch {
    // Non-blocking
  }
  listeners.forEach((fn) => {
    try {
      fn(config);
    } catch (e) {
      console.warn('Shipping config listener error:', e);
    }
  });
}

// Initialise from session storage if available
try {
  const stored = sessionStorage.getItem('amoga_shipping_config');
  if (stored) {
    cachedShippingConfig = JSON.parse(stored);
  }
} catch {
  // Ignore
}

const DEFAULT_CONFIG = {
  freeShippingThreshold: 2500,
  shippingThresholdOperator: 'GTE',
  shippingCarrierName: 'India Post',
  shippingStandardRate: 0,
  businessApprovalPending: true,
  status: 'PENDING_BUSINESS_CONFIRMATION',
  notes: 'Authoritative configuration loaded from StoreSetting database table. Standard threshold ₹2,500; Wellness Tea: ≥5 packs & ≥₹1,000.',
};

export function useShippingConfig() {
  const [config, setConfig] = useState(cachedShippingConfig || DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(!cachedShippingConfig);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const handleUpdate = (updatedConfig) => {
      if (isMounted) {
        setConfig(updatedConfig);
        setIsLoading(false);
      }
    };

    listeners.add(handleUpdate);

    // If not cached yet, fetch from API
    if (!cachedShippingConfig) {
      getShippingConfigApi()
        .then((fetchedConfig) => {
          if (fetchedConfig && isMounted) {
            const merged = {
              ...DEFAULT_CONFIG,
              ...fetchedConfig,
              freeShippingThreshold: Number(fetchedConfig.freeShippingThreshold ?? 2500),
            };
            broadcastConfig(merged);
          }
        })
        .catch((err) => {
          console.warn('[useShippingConfig] Failed to fetch shipping config:', err);
          if (isMounted) {
            setError(err);
            setIsLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
      listeners.delete(handleUpdate);
    };
  }, []);

  return {
    freeShippingThreshold: Number(config.freeShippingThreshold ?? 2500),
    shippingThresholdOperator: config.shippingThresholdOperator || 'GTE',
    shippingCarrierName: config.shippingCarrierName || 'India Post',
    shippingStandardRate: Number(config.shippingStandardRate || 0),
    businessApprovalPending: Boolean(config.businessApprovalPending),
    notes: config.notes,
    isLoading,
    error,
  };
}
