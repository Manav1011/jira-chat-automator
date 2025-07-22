import React from 'react';

interface MobileOverlayProps {
  isMobile: boolean;
}

export const MobileOverlay: React.FC<MobileOverlayProps> = ({ isMobile }) => {
  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 text-center text-white">
      <div className="px-6">
        <h2 className="mb-4 text-2xl font-bold">Desktop Only</h2>
        <p>
          This application is optimized for desktop use. Please access it from a
          desktop browser for the best experience.
        </p>
      </div>
    </div>
  );
};
