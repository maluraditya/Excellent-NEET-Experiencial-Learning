import React from 'react';

/**
 * Full-screen infographic backed by a static image file (placed in /public).
 * The image is contained (never cropped) so any aspect ratio — including tall,
 * portrait posters — fits the smartboard cleanly.
 */
const ImageScene: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <div className="flex h-full w-full items-center justify-center">
    <img src={src} alt={alt} className="h-full w-full object-contain" />
  </div>
);

export default ImageScene;
