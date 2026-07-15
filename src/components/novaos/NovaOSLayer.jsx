import React, { lazy, memo, Suspense } from 'react';
import { useNovaOS } from './NovaOSProvider';

const NovaOSPalette = lazy(() => import('./NovaOSPalette'));

const NovaOSLayer = memo(() => {
  const { isCommandOpen } = useNovaOS();
  return isCommandOpen ? <Suspense fallback={null}><NovaOSPalette /></Suspense> : null;
});

NovaOSLayer.displayName = 'NovaOSLayer';
export default NovaOSLayer;
