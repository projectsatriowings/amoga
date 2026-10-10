import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { GatekeeperHub } from '../features/gatekeeper/GatekeeperHub';
import { FoodStorefront } from '../features/food/FoodStorefront';
import { FoodProductList } from '../features/food/FoodProductList';
import { FoodProductDetail } from '../features/food/FoodProductDetail';
import { TeaStorefront } from '../features/tea/TeaStorefront';
import { TeaProductList } from '../features/tea/TeaProductList';
import { TeaProductDetail } from '../features/tea/TeaProductDetail';
import { SareesStorefront } from '../features/sarees/SareesStorefront';
import { SareesProductList } from '../features/sarees/SareesProductList';
import { SareesProductDetail } from '../features/sarees/SareesProductDetail';
import { JewelleryStorefront } from '../features/jewellery/JewelleryStorefront';
import { JewelleryProductList } from '../features/jewellery/JewelleryProductList';
import { JewelleryProductDetail } from '../features/jewellery/JewelleryProductDetail';
import { CartPage } from '../features/cart/CartPage';
import { CheckoutPage } from '../features/checkout/CheckoutPage';
import { OrderReviewPage } from '../features/checkout/OrderReviewPage';
import { DemoOrderConfirmation } from '../features/checkout/DemoOrderConfirmation';
import { NotFound } from '../components/feedback/NotFound';
import { RouteErrorBoundary } from '../components/feedback/RouteErrorBoundary';

// Admin Panel Screens
import { AdminLayout } from '../features/admin/components/AdminLayout';
import { AdminLogin } from '../features/admin/pages/AdminLogin';
import { AdminDashboard } from '../features/admin/pages/AdminDashboard';
import { AdminProducts } from '../features/admin/pages/AdminProducts';
import { AdminProductForm } from '../features/admin/pages/AdminProductForm';
import { AdminCollections } from '../features/admin/pages/AdminCollections';
import { AdminInventory } from '../features/admin/pages/AdminInventory';
import { AdminOrders } from '../features/admin/pages/AdminOrders';
import { AdminOrderDetail } from '../features/admin/pages/AdminOrderDetail';
import { AdminPayments } from '../features/admin/pages/AdminPayments';
import { AdminCustomers } from '../features/admin/pages/AdminCustomers';
import { AdminBanners } from '../features/admin/pages/AdminBanners';
import { AdminHomepage } from '../features/admin/pages/AdminHomepage';
import { AdminPromotions } from '../features/admin/pages/AdminPromotions';
import { AdminReports } from '../features/admin/pages/AdminReports';
import { AdminSettings } from '../features/admin/pages/AdminSettings';
import { AdminUsers } from '../features/admin/pages/AdminUsers';
import { AdminAuditLogs } from '../features/admin/pages/AdminAuditLogs';

/**
 * React Router Configuration for Amoga E-Commerce Storefront & Admin Atelier
 */
export const router = createBrowserRouter([
  // Customer Storefront Routes
  {
    path: '/',
    element: (
      <AppShell>
        <GatekeeperHub />
      </AppShell>
    ),
  },
  {
    path: '/food',
    element: (
      <AppShell>
        <FoodStorefront />
      </AppShell>
    ),
  },
  {
    path: '/food/products',
    element: (
      <AppShell>
        <FoodProductList />
      </AppShell>
    ),
  },
  {
    path: '/food/products/:slug',
    element: (
      <AppShell>
        <FoodProductDetail />
      </AppShell>
    ),
  },
  {
    path: '/tea',
    element: (
      <AppShell>
        <TeaStorefront />
      </AppShell>
    ),
  },
  {
    path: '/tea/products',
    element: (
      <AppShell>
        <TeaProductList />
      </AppShell>
    ),
  },
  {
    path: '/tea/products/:slug',
    element: (
      <AppShell>
        <TeaProductDetail />
      </AppShell>
    ),
  },
  {
    path: '/sarees',
    element: (
      <AppShell>
        <SareesStorefront />
      </AppShell>
    ),
  },
  {
    path: '/sarees/products',
    element: (
      <AppShell>
        <SareesProductList />
      </AppShell>
    ),
  },
  {
    path: '/sarees/products/:slug',
    element: (
      <AppShell>
        <SareesProductDetail />
      </AppShell>
    ),
  },
  {
    path: '/jewellery',
    element: (
      <AppShell>
        <JewelleryStorefront />
      </AppShell>
    ),
  },
  {
    path: '/jewellery/products',
    element: (
      <AppShell>
        <JewelleryProductList />
      </AppShell>
    ),
  },
  {
    path: '/jewellery/products/:slug',
    element: (
      <AppShell>
        <JewelleryProductDetail />
      </AppShell>
    ),
  },
  {
    path: '/cart',
    element: (
      <AppShell>
        <CartPage />
      </AppShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/checkout',
    element: (
      <AppShell>
        <CheckoutPage />
      </AppShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/checkout/review',
    element: (
      <AppShell>
        <OrderReviewPage />
      </AppShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/order-confirmation/:orderId',
    element: (
      <AppShell>
        <DemoOrderConfirmation />
      </AppShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },

  // Dedicated Admin Atelier Routes
  {
    path: '/admin/login',
    element: <AdminLogin />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'products', element: <AdminProducts /> },
      { path: 'products/new', element: <AdminProductForm /> },
      { path: 'products/:id/edit', element: <AdminProductForm /> },
      { path: 'collections', element: <AdminCollections /> },
      { path: 'inventory', element: <AdminInventory /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'orders/:id', element: <AdminOrderDetail /> },
      { path: 'payments', element: <AdminPayments /> },
      { path: 'customers', element: <AdminCustomers /> },
      { path: 'banners', element: <AdminBanners /> },
      { path: 'homepage', element: <AdminHomepage /> },
      { path: 'promotions', element: <AdminPromotions /> },
      { path: 'reports', element: <AdminReports /> },
      { path: 'settings', element: <AdminSettings /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'audit-logs', element: <AdminAuditLogs /> },
    ],
  },

  // 404 Fallback
  {
    path: '*',
    element: <NotFound />,
  },
]);
