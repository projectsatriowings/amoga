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

/**
 * React Router Configuration for Amoga E-Commerce Phase 1-6
 * Defines conventions for all collections, catalogue lists, detail routes, unified cart, checkout, and 404 handler.
 */
export const router = createBrowserRouter([
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
  },
  {
    path: '/checkout',
    element: (
      <AppShell>
        <CheckoutPage />
      </AppShell>
    ),
  },
  {
    path: '/checkout/review',
    element: (
      <AppShell>
        <OrderReviewPage />
      </AppShell>
    ),
  },
  {
    path: '/order-confirmation/:orderId',
    element: (
      <AppShell>
        <DemoOrderConfirmation />
      </AppShell>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
