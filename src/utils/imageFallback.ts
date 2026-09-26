import type React from 'react';

/** Keep image failures from leaving broken-image icons in public and CMS views. */
export const imageFallback = (fallback = '/image-fallback.svg') => (event: React.SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget;
  const fallbackUrl = new URL(fallback, window.location.href).href;
  if (image.src !== fallbackUrl) image.src = fallbackUrl;
};
