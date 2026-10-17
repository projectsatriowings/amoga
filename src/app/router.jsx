import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
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
import { CustomerAccountPage } from '../features/account/pages/CustomerAccountPage';
import { CustomerAuthPage } from '../features/account/pages/CustomerAuthPage';
import { OrderTrackingPage } from '../features/tracking/OrderTrackingPage';
import { ShippingPolicyPage } from '../features/policies/ShippingPolicyPage';
import { ReturnsCarePage } from '../features/policies/ReturnsCarePage';
import { NotFound } from '../components/feedback/NotFound';
import { RouteErrorBoundary } from '../components/feedback/RouteErrorBoundary';
import { DynamicStorefront } from '../features/collections/DynamicStorefront';

// Admin Panel Screens
import { AdminLayout } from '../features/admin/components/AdminLayout';
import { AdminLogin } from '../features/admin/pages/AdminLogin';
import { AdminDashboard } from '../features/admin/pages/AdminDashboard';
import { AdminProducts } from '../features/admin/pages/AdminProducts';
import { AdminBulkUpload } from '../features/admin/pages/AdminBulkUpload';
import { AdminProductForm } from '../features/admin/pages/AdminProductForm';
import { AdminCollections } from '../features/admin/pages/AdminCollections';
import { AdminInventory } from '../features/admin/pages/AdminInventory';
import { AdminOrders } from '../features/admin/pages/AdminOrders';
import { AdminOrderDetail } from '../features/admin/pages/AdminOrderDetail';
import { AdminPayments } from '../features/admin/pages/AdminPayments';
import { AdminCustomers } from '../features/admin/pages/AdminCustomers';
import { AdminPromotions } from '../features/admin/pages/AdminPromotions';
import { AdminReports } from '../features/admin/pages/AdminReports';
import { AdminSettings } from '../features/admin/pages/AdminSettings';
import { AdminAuditLogs } from '../features/admin/pages/AdminAuditLogs';
import { AdminCustomerInquiries } from '../features/admin/pages/AdminCustomerInquiries';
import { AdminReviews } from '../features/admin/pages/AdminReviews';
import { AdminTaxRates } from '../features/admin/pages/AdminTaxRates';
import { DeveloperOnlyRoute } from '../features/admin/components/DeveloperOnlyRoute';
import { AdminPosNewBill } from '../features/admin/pos/pages/AdminPosNewBill';
import { AdminPosHistory } from '../features/admin/pos/pages/AdminPosHistory';
import { AdminPosStalls } from '../features/admin/pos/pages/AdminPosStalls';
import { AdminPosReports } from '../features/admin/pos/pages/AdminPosReports';
import { AdminPosSettings } from '../features/admin/pos/pages/AdminPosSettings';
import { PublicReceiptPage } from '../features/pos/pages/PublicReceiptPage';

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
    path: '/collections',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/pantry',
    element: <Navigate to="/food" replace />,
  },
  {
    path: '/wholesome-pantry',
    element: <Navigate to="/food" replace />,
  },
  {
    path: '/wellness-tea',
    element: <Navigate to="/tea" replace />,
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

  // Customer Account & Profile Routes
  {
    path: '/account',
    element: (
      <AppShell>
        <CustomerAccountPage />
      </AppShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/account/login',
    element: (
      <AppShell>
        <CustomerAuthPage />
      </AppShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/account/register',
    element: (
      <AppShell>
        <CustomerAuthPage />
      </AppShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/login',
    element: <Navigate to="/account/login" replace />,
  },
  {
    path: '/register',
    element: <Navigate to="/account/login?mode=register" replace />,
  },
  {
    path: '/account/orders',
    element: <Navigate to="/account?tab=orders" replace />,
  },

  // Dedicated Order Tracking Routes
  {
    path: '/track',
    element: (
      <AppShell>
        <OrderTrackingPage />
      </AppShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/track/:orderReference',
    element: (
      <AppShell>
        <OrderTrackingPage />
      </AppShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/order-tracking',
    element: <Navigate to="/track" replace />,
  },

  // Store Policy Pages
  {
    path: '/shipping-policy',
    element: (
      <AppShell>
        <ShippingPolicyPage />
      </AppShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/shipping',
    element: <Navigate to="/shipping-policy" replace />,
  },
  {
    path: '/returns-policy',
    element: (
      <AppShell>
        <ReturnsCarePage />
      </AppShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/returns-care',
    element: <Navigate to="/returns-policy" replace />,
  },
  {
    path: '/returns',
    element: <Navigate to="/returns-policy" replace />,
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
      { path: 'products/bulk-upload', element: <AdminBulkUpload /> },
      { path: 'products/new', element: <AdminProductForm /> },
      { path: 'products/:id/edit', element: <AdminProductForm /> },
      { path: 'tax-rates', element: <AdminTaxRates /> },
      {
        path: 'collections',
        element: (
          <DeveloperOnlyRoute
            pageTitle="Collection Architecture"
            description="Collections and category mapping control storefront taxonomy and database routes. This page is protected for technical developers."
          >
            <AdminCollections />
          </DeveloperOnlyRoute>
        ),
      },
      { path: 'inventory', element: <AdminInventory /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'orders/:id', element: <AdminOrderDetail /> },
      { path: 'payments', element: <AdminPayments /> },
      { path: 'customers', element: <AdminCustomers /> },
      { path: 'customer-inquiries', element: <AdminCustomerInquiries /> },
      { path: 'reviews', element: <AdminReviews /> },
      { path: 'promotions', element: <AdminPromotions /> },
      { path: 'reports', element: <AdminReports /> },
      { path: 'settings', element: <AdminSettings /> },
      { path: 'users', element: <Navigate to="/admin" replace /> },
      { path: 'pos', element: <Navigate to="/admin/pos/new" replace /> },
      { path: 'pos/new', element: <AdminPosNewBill /> },
      { path: 'pos/history', element: <AdminPosHistory /> },
      { path: 'pos/stalls', element: <AdminPosStalls /> },
      { path: 'pos/reports', element: <AdminPosReports /> },
      { path: 'pos/settings', element: <AdminPosSettings /> },
      {
        path: 'audit-logs',
        element: (
          <DeveloperOnlyRoute
            pageTitle="System Audit Trail"
            description="The Audit Trail records administrative mutation telemetry, IP tracking, and system actor history. This page is protected for technical developers."
          >
            <AdminAuditLogs />
          </DeveloperOnlyRoute>
        ),
      },
    ],
  },

  // Dynamic Collection Storefronts (Supports any custom collection created in Admin)
  {
    path: '/collections/:collectionSlug',
    element: (
      <AppShell>
        <DynamicStorefront />
      </AppShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/:collectionSlug',
    element: (
      <AppShell>
        <DynamicStorefront />
      </AppShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/:collectionSlug/products',
    element: (
      <AppShell>
        <DynamicStorefront />
      </AppShell>
    ),
    errorElement: <RouteErrorBoundary />,
  },

  // Customer Digital WhatsApp Tax Invoice Receipt
  {
    path: '/receipt/:token',
    element: <PublicReceiptPage />,
    errorElement: <RouteErrorBoundary />,
  },

  // 404 Fallback
  {
    path: '*',
    element: <NotFound />,
  },
]);
