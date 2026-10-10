import React from 'react';
import { useLocation } from 'react-router-dom';
import { getCollectionByPath } from '../../data/collections';
import { AppHeader } from './AppHeader';
import { FoodHeader } from '../../features/food/components/FoodHeader';
import { TeaHeader } from '../../features/tea/components/TeaHeader';
import { SareeHeader } from '../../features/sarees/components/SareeHeader';
import { JewelleryHeader } from '../../features/jewellery/components/JewelleryHeader';
import { AppFooter } from './AppFooter';
import { CartDrawer } from '../../features/food/components/CartDrawer';
import { WishlistDrawer } from '../../features/food/components/WishlistDrawer';

import { useResolvedTheme } from '../../hooks/useResolvedTheme';

export function AppShell({ children }) {
  const location = useLocation();
  const resolved = useResolvedTheme();
  const activeCollection = getCollectionByPath(location.pathname);
  const isGatekeeper = location.pathname === '/';
  const isFoodRoute = location.pathname.startsWith('/food');
  const isTeaRoute = location.pathname.startsWith('/tea');
  const isSareeRoute = location.pathname.startsWith('/sarees');
  const isJewelleryRoute = location.pathname.startsWith('/jewellery');
  const isCollectionRoute = isFoodRoute || isTeaRoute || isSareeRoute || isJewelleryRoute;
  const isCheckoutRoute =
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/order-confirmation') ||
    location.pathname === '/cart';

  // Apply collection theme data-attribute for tokens.css
  const collectionTheme = isCollectionRoute && activeCollection
    ? activeCollection.theme
    : resolved.themeId;

  return (
    <div
      data-collection={collectionTheme}
      className={`min-h-screen flex flex-col w-full overflow-x-hidden transition-colors duration-normal ease-smooth ${resolved.themeClass}`}
      style={{
        ...resolved.cssVariables,
        backgroundColor: 'var(--collection-page-bg, var(--bg-primary))',
        color: 'var(--collection-text, var(--text-primary))',
      }}
    >
      {!isGatekeeper && (
        isFoodRoute ? (
          <FoodHeader />
        ) : isTeaRoute ? (
          <TeaHeader />
        ) : isSareeRoute ? (
          <SareeHeader />
        ) : isJewelleryRoute ? (
          <JewelleryHeader />
        ) : (
          <AppHeader activeCollection={activeCollection || resolved.theme} />
        )
      )}
      <main className="flex-1 w-full flex flex-col">{children}</main>
      {!isGatekeeper && (
        <AppFooter
          activeCollection={activeCollection || resolved.theme}
          resolvedTheme={resolved}
        />
      )}
      {!isGatekeeper && !isCollectionRoute && (
        <>
          <CartDrawer />
          <WishlistDrawer />
        </>
      )}
    </div>
  );
}
