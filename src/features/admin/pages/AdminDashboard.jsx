import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  TrendingUp,
  Truck,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { BentoCard } from '../components/BentoCard';
import { BentoKpiCard } from '../components/BentoKpiCard';
import { SecondaryKpiRow } from '../components/SecondaryKpiRow';
import { SalesAnalyticsChart } from '../components/SalesAnalyticsChart';
import { CollectionDonutChart } from '../components/CollectionDonutChart';
import { SupportingPerformanceCard } from '../components/SupportingPerformanceCard';
import { TopSellingProductsTable } from '../components/TopSellingProductsTable';
import { OrderLifecycleCard } from '../components/OrderLifecycleCard';
import { CollectionContributionCard } from '../components/CollectionContributionCard';
import { InventoryAlertsCard } from '../components/InventoryAlertsCard';
import { RecentOrdersTable } from '../components/RecentOrdersTable';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.03,
    },
  },
};

const RANGE_LABELS = {
  today: 'Today',
  '7d': 'Last 7 Days',
  '14d': 'Last 14 Days',
  '30d': 'Last 30 Days',
  all: 'All Time',
};

export function AdminDashboard() {
  const { adminFetch, admin } = useAdminStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRange, setSelectedRange] = useState('7d');

  const fetchStats = async (isManual = false, rangeToFetch = selectedRange) => {
    if (isManual || data !== null) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await adminFetch(`/api/admin/dashboard/stats?range=${rangeToFetch}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load executive dashboard metrics');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats(false, selectedRange);
  }, [selectedRange]);

  const handleRangeChange = (newRange) => {
    setSelectedRange(newRange);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-[#E5E0D5]/70 rounded-lg animate-pulse" />
          <div className="h-8 w-48 bg-[#E5E0D5]/70 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#E5E0D5]/60 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 h-80 bg-[#E5E0D5]/60 rounded-xl animate-pulse" />
          <div className="lg:col-span-4 h-80 bg-[#E5E0D5]/60 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-[#FFFFFF] border border-rose-200 rounded-xl text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-lg text-[#292820]">Metrics Unavailable</h3>
          <p className="text-xs text-[#746F63] mt-1 max-w-md mx-auto">{error}</p>
        </div>
        <button
          onClick={() => fetchStats(true, selectedRange)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#762F39] text-white text-xs font-semibold rounded-lg hover:bg-[#8F414B] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const {
    metrics,
    recentOrders = [],
    salesTrends = [],
    collectionPerformance = [],
    topSellingProducts = [],
    lowStockList = [],
    period = {},
  } = data || {};

  const rangeBadgeText = RANGE_LABELS[selectedRange] || selectedRange;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Editorial Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E0D5]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#292820]">
              Executive Bento Dashboard
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#3F5A35]/10 text-[#3F5A35] border border-[#3F5A35]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3F5A35] animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-[#746F63] mt-0.5 font-sans">
            Authoritative commerce intelligence reconciled from PostgreSQL • Scope: {rangeBadgeText}
          </p>
        </div>

        {/* Global Reporting Range Filter & Refresh Button */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1 bg-[#F8F6F0] p-1 rounded-lg border border-[#E5E0D5]">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7D' },
              { id: '14d', label: '14D' },
              { id: '30d', label: '30D' },
              { id: 'all', label: 'All' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => handleRangeChange(pill.id)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                  selectedRange === pill.id
                    ? 'bg-[#762F39] text-white shadow-2xs font-semibold'
                    : 'text-[#746F63] hover:text-[#292820] hover:bg-[#FFFFFF]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchStats(true, selectedRange)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] border border-[#E5E0D5] hover:border-[#D5CEC2] rounded-lg text-xs font-medium text-[#292820] hover:bg-[#FAF8F5] transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#B08A4D] ${refreshing ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Row 1: Primary KPI Cards Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Captured Revenue */}
        <BentoKpiCard
          title="Captured Revenue"
          value={metrics.paidRevenue}
          isCurrency={true}
          icon={CreditCard}
          accentColor="#3F5A35"
          bgAccent="#3F5A3515"
          supportingLabel={`Authoritative verified payments (${rangeBadgeText})`}
        />

        {/* 2. Gross Sales */}
        <BentoKpiCard
          title="Gross Sales"
          value={metrics.grossSales}
          isCurrency={true}
          icon={TrendingUp}
          accentColor="#762F39"
          bgAccent="#762F3915"
          supportingLabel={`Completed orders (${rangeBadgeText})`}
        />

        {/* 3. Fulfilment Queue */}
        <BentoKpiCard
          title="Fulfilment Queue"
          value={metrics.ordersRequiringFulfilment}
          isCurrency={false}
          icon={Truck}
          accentColor="#B08A4D"
          bgAccent="#B08A4D15"
          supportingLabel="Live Queue: Confirmed & Processing"
          actionText="View Queue"
          actionLink="/admin/orders?status=CONFIRMED"
        />

        {/* 4. Stock Attention */}
        <BentoKpiCard
          title="Stock Attention"
          value={metrics.stockAttentionTotal ?? (metrics.lowStockCount + metrics.outOfStockCount)}
          isCurrency={false}
          icon={AlertTriangle}
          accentColor="#991B1B"
          bgAccent="#991B1B15"
          supportingLabel={`${metrics.lowStockCount} low • ${metrics.outOfStockCount} out (Live Snapshot)`}
          actionText="Adjust Stock"
          actionLink="/admin/inventory"
        />
      </div>

      {/* Row 2: Secondary Compact KPI Operational Row */}
      <SecondaryKpiRow metrics={metrics} />

      {/* Row 3: Sales Analytics Chart (8 Cols) & Collection Donut Chart (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <BentoCard
          title="Sales Volume Trend"
          subtitle={`Daily completed sales velocity (${rangeBadgeText})`}
          className="lg:col-span-8"
          badge={
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#762F39]/10 text-[#762F39] border border-[#762F39]/20 font-medium">
              Authoritative
            </span>
          }
        >
          <SalesAnalyticsChart
            salesTrends={salesTrends}
            activeRange={selectedRange}
            onRangeChange={handleRangeChange}
          />
        </BentoCard>

        <BentoCard
          title="Collection Sales Donut"
          subtitle={`Revenue distribution across 4 luxury categories (${rangeBadgeText})`}
          className="lg:col-span-4"
          badge={
            <span className="text-[10px] font-mono text-[#746F63]">
              4 Collections
            </span>
          }
        >
          <CollectionDonutChart collectionPerformance={collectionPerformance} />
        </BentoCard>
      </div>

      {/* Row 4: Top-Selling Products Performance Table (8 Cols) & Supporting Performance / Stock Attention (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <BentoCard
          title="Top-Selling Products Performance"
          subtitle={`Verified completed order sales and SKU status (${rangeBadgeText})`}
          className="lg:col-span-8"
          action={
            <Link
              to="/admin/products"
              className="text-xs text-[#762F39] hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>Manage Catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <TopSellingProductsTable products={topSellingProducts} />
        </BentoCard>

        <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
          <BentoCard
            title="Commercial Efficiency"
            subtitle={`Average ticket & conversion (${rangeBadgeText})`}
            className="flex-1"
          >
            <SupportingPerformanceCard
              averageOrderValue={metrics.averageOrderValue}
              paymentSuccessRate={metrics.paymentSuccessRate}
              grossSales={metrics.grossSales}
            />
          </BentoCard>

          <BentoCard
            title="Stock & Operational Health"
            subtitle="Active SKU threshold monitoring (Live Snapshot)"
            className="flex-1"
          >
            <InventoryAlertsCard
              lowStockCount={metrics.lowStockCount}
              outOfStockCount={metrics.outOfStockCount}
              lowStockList={lowStockList}
            />
          </BentoCard>
        </div>
      </div>

      {/* Row 5: Collection Sales Contribution (8 Cols) & Orders by Lifecycle State (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <BentoCard
          title="Collection Sales Contribution"
          subtitle={`Proportional performance from verified sales (${rangeBadgeText})`}
          className="lg:col-span-8"
          action={
            <Link
              to="/admin/products"
              className="text-xs text-[#762F39] hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>View Catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <CollectionContributionCard collectionPerformance={collectionPerformance} />
        </BentoCard>

        <BentoCard
          title="Orders by Lifecycle State"
          subtitle={`Pipeline distribution within ${rangeBadgeText}`}
          className="lg:col-span-4"
          badge={
            <span className="text-[10px] font-mono text-[#746F63]">
              {metrics.totalOrders} in scope
            </span>
          }
        >
          <OrderLifecycleCard ordersByStatus={metrics.ordersByStatus} />
        </BentoCard>
      </div>

      {/* Row 6: Recent Orders Stream (Full Width 12-Columns with 10-Item Pagination) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <BentoCard
          title="Recent Order Stream"
          subtitle="Authoritative live transaction feed from PostgreSQL"
          className="lg:col-span-12"
          action={
            <Link
              to="/admin/orders"
              className="text-xs text-[#762F39] hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <RecentOrdersTable orders={recentOrders} />
        </BentoCard>
      </div>
    </motion.div>
  );
}
