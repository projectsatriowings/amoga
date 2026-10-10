import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, AlertCircle, CheckCircle2, ArrowRight, RefreshCw, Boxes } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function InventoryAlertsCard({ lowStockCount = 0, outOfStockCount = 0 }) {
  const { adminFetch } = useAdminStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadAlertItems() {
      setLoading(true);
      try {
        const res = await adminFetch('/api/admin/inventory?limit=5');
        const data = await res.json();
        if (data.success && isMounted) {
          // Filter to items that need attention first
          const attentionItems = (data.inventory || []).filter(
            (p) => !p.inStock || p.stockQuantity <= 10
          );
          setItems(attentionItems.slice(0, 4));
        }
      } catch (err) {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAlertItems();
    return () => {
      isMounted = false;
    };
  }, [adminFetch]);

  return (
    <div className="space-y-4">
      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-[#FBF8F5] border border-[#E5E0D5] rounded-lg">
          <div className="flex items-center gap-1.5 text-amber-700 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              Low Stock
            </span>
          </div>
          <p className="font-sans font-semibold text-xl text-amber-900 tabular-nums">{lowStockCount}</p>
          <p className="text-[10px] text-[#746F63]">≤ 10 units remaining</p>
        </div>

        <div className="p-3 bg-rose-50/60 border border-rose-200/70 rounded-lg">
          <div className="flex items-center gap-1.5 text-rose-700 mb-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              Out of Stock
            </span>
          </div>
          <p className="font-sans font-semibold text-xl text-rose-900 tabular-nums">{outOfStockCount}</p>
          <p className="text-[10px] text-rose-700/80">Immediate restock</p>
        </div>
      </div>

      {/* Items Preview List */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-[#746F63] mb-2">
          Critical Items Attention
        </p>
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-8 bg-[#F8F6F0] rounded" />
            <div className="h-8 bg-[#F8F6F0] rounded" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-4 px-3 bg-[#F8F6F0] rounded-lg border border-[#E5E0D5] flex items-center gap-2 text-xs text-[#3F5A35]">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>All inventory thresholds healthy. No immediate restock required.</span>
          </div>
        ) : (
          <div className="divide-y divide-[#F8F6F0] border border-[#E5E0D5] rounded-lg overflow-hidden bg-[#FFFFFF]">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-2.5 flex items-center justify-between text-xs hover:bg-[#F8F6F0] transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-medium text-[#292820] truncate">{item.name}</p>
                  <p className="text-[10px] font-mono text-[#746F63] capitalize">
                    {item.collection?.name || item.collectionId}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                      item.stockQuantity <= 0 || !item.inStock
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.stockQuantity} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-[#F8F6F0] flex items-center justify-between">
        <Link
          to="/admin/inventory"
          className="text-xs font-semibold text-[#762F39] hover:text-[#8F414B] inline-flex items-center gap-1.5 hover:underline"
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Open Inventory Manager</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
