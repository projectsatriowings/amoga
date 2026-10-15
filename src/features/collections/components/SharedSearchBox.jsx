import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';

export function SharedSearchBox({
  collectionId = 'food',
  palette = {},
  theme = {},
  isMobile = false,
  onNavigate,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Sync with URL 'q' parameter if currently on products page
  useEffect(() => {
    if (location.pathname === theme.productsPath) {
      const urlQ = new URLSearchParams(location.search).get('q') || '';
      if (urlQ !== query.trim() && !query.startsWith(urlQ)) {
        setQuery(urlQ);
      }
    }
  }, [location.pathname, location.search, theme.productsPath]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Fetch search results debounced
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      setSelectedIndex(-1);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products?collection=${encodeURIComponent(collectionId)}&q=${encodeURIComponent(trimmed)}&limit=6`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          throw new Error(`Search request failed with status ${res.status}`);
        }
        const data = await res.json();
        if (data && Array.isArray(data.data)) {
          setResults(data.data);
          setIsOpen(true);
        } else {
          setResults([]);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Search query error:', err.message);
          setError('Unable to load suggestions');
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, collectionId]);

  const handleSelectProduct = (product) => {
    setIsOpen(false);
    if (onNavigate) onNavigate();
    const targetPath = `/${product.collection || collectionId}/products/${product.slug}`;
    navigate(targetPath);
  };

  const handleViewAllResults = () => {
    setIsOpen(false);
    if (onNavigate) onNavigate();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`${theme.productsPath}?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate(theme.productsPath);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedIndex >= 0 && results[selectedIndex]) {
      handleSelectProduct(results[selectedIndex]);
      return;
    }
    handleViewAllResults();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();

    if (location.pathname === theme.productsPath) {
      const sp = new URLSearchParams(location.search);
      sp.delete('q');
      const newSearch = sp.toString() ? `?${sp.toString()}` : '';
      navigate(`${theme.productsPath}${newSearch}`, { replace: true });
    }
  };

  const accentColor = palette.accent || palette.accentGold || '#3F7B43';
  const cardBg = palette.cardBg || '#FFFFFF';
  const borderColor = palette.border || '#E5E0D5';
  const textColor = palette.text || '#292820';

  return (
    <div
      ref={containerRef}
      className={`relative ${isMobile ? 'w-full' : 'w-44 sm:w-48 lg:w-56 xl:w-64'}`}
    >
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim().length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Search ${theme.name || 'catalogue'}...`}
          aria-label={`Search products in ${theme.name || 'catalogue'}`}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
          className={`w-full pl-9 pr-8 text-xs rounded-full border transition-all outline-none focus:ring-1 ${
            isMobile ? 'py-2.5 h-10' : 'py-1.5 h-9'
          }`}
          style={{
            backgroundColor: isMobile ? palette.inputBg || '#FFFFFF' : cardBg,
            borderColor: borderColor,
            color: textColor,
          }}
        />

        <Search
          className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: accentColor }}
        />

        {isLoading ? (
          <Loader2
            className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin opacity-60"
            style={{ color: accentColor }}
          />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800 p-0.5 cursor-pointer rounded-full"
            title="Clear search"
            aria-label="Clear search input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </form>

      {/* Live Search Suggestions Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div
          role="listbox"
          className="absolute left-0 right-0 mt-2 rounded-2xl shadow-2xl border overflow-hidden z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150"
          style={{
            backgroundColor: cardBg,
            borderColor: borderColor,
            color: textColor,
            maxHeight: '400px',
          }}
        >
          {isLoading && results.length === 0 ? (
            <div className="py-6 px-4 text-center text-xs opacity-70 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: accentColor }} />
              <span>Searching catalogue...</span>
            </div>
          ) : error ? (
            <div className="py-4 px-4 text-center text-xs text-rose-500 font-mono">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 px-4 text-center text-xs space-y-1">
              <p className="font-medium">No products found</p>
              <p className="text-[11px] opacity-70">
                No matching items in {theme.name || 'this collection'} for &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            <div>
              <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider opacity-60 border-b" style={{ borderColor }}>
                Matching Products ({results.length})
              </div>
              <div className="divide-y divide-current/10 max-h-64 overflow-y-auto">
                {results.map((product, idx) => {
                  const isSelected = selectedIndex === idx;
                  const hasPrice = product.price !== null && Number(product.price) > 0;
                  return (
                    <button
                      key={product.id || product.slug}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectProduct(product)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left p-2.5 flex items-center gap-3 transition-colors cursor-pointer ${
                        isSelected ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {/* Product Thumbnail */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-stone-200/50 border border-current/10">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] opacity-40">
                            Amoga
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate font-serif">
                          {product.name}
                        </div>
                        <div className="text-[10px] opacity-70 truncate font-mono">
                          {product.categoryName || product.category || theme.name}
                        </div>
                      </div>

                      {/* Price & Stock */}
                      <div className="text-right shrink-0">
                        {hasPrice ? (
                          <div className="text-xs font-semibold tabular-nums">
                            ₹{Number(product.price).toLocaleString('en-IN')}
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono opacity-60">
                            On Request
                          </div>
                        )}
                        {product.isOutOfStock ? (
                          <span className="text-[9px] font-mono text-rose-500 font-semibold block">
                            Out of stock
                          </span>
                        ) : product.isLowStock ? (
                          <span className="text-[9px] font-mono text-amber-500 font-semibold block">
                            Low stock
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* View all search results button */}
              <button
                type="button"
                onClick={handleViewAllResults}
                className="w-full py-2.5 px-4 text-xs font-medium flex items-center justify-between border-t transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                style={{
                  borderColor,
                  color: accentColor,
                }}
              >
                <span>View all results for &ldquo;{query}&rdquo;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
