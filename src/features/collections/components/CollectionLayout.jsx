import React from 'react';
import { CollectionNavbar } from './CollectionNavbar';
import { CollectionFooter } from './CollectionFooter';
import { CartDrawer } from '../../food/components/CartDrawer';
import { WishlistDrawer } from '../../food/components/WishlistDrawer';
import { getCollectionTheme } from '../themeConfig';

export function CollectionLayout({
  collectionId = 'food',
  children,
  showFooter = true,
  className = '',
}) {
  const theme = getCollectionTheme(collectionId);
  const palette = theme?.palette || {};

  return (
    <div
      data-collection={collectionId}
      className={`min-h-screen flex flex-col w-full overflow-x-hidden transition-colors ${className}`}
      style={{
        backgroundColor: palette.bg || '#F8F6F0',
        color: palette.text || '#292820',
      }}
    >
      <CollectionNavbar collectionId={collectionId} />
      <main className="flex-1 w-full flex flex-col">{children}</main>
      {showFooter && <CollectionFooter collectionId={collectionId} />}
      <CartDrawer />
      <WishlistDrawer />
    </div>
  );
}
