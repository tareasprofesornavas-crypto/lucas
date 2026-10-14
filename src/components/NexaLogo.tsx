import React, { useState } from 'react';

interface Props {
  variant?: 'full' | 'compact' | 'icon-only';
  className?: string;
  showTagline?: boolean;
}

export const NexaLogo: React.FC<Props> = ({
  variant = 'compact',
  className = '',
  showTagline = false,
}) => {
  const [imgError, setImgError] = useState(false);

  // If image loads fine, render the high-res official logo image
  if (!imgError) {
    if (variant === 'full') {
      return (
        <div className={`flex flex-col items-center text-center ${className}`}>
          <img
            src="/nexa-logo.png"
            alt="Nexa - Tu aliada en la productividad"
            className="w-40 h-40 object-contain rounded-2xl shadow-sm"
            onError={() => setImgError(true)}
          />
        </div>
      );
    }

    if (variant === 'icon-only') {
      return (
        <div className={`w-9 h-9 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white shadow-xs ${className}`}>
          <img
            src="/nexa-logo.png"
            alt="Nexa Mascot"
            className="w-full h-full object-cover scale-150 -translate-y-2"
            onError={() => setImgError(true)}
          />
        </div>
      );
    }

    // Default: compact (in navbar)
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className="w-10 h-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white p-0.5 shadow-xs">
          <img
            src="/nexa-logo.png"
            alt="Nexa Logo"
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center leading-none">
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Ne
            </span>
            <span className="text-xl font-black bg-gradient-to-tr from-indigo-500 via-purple-500 to-fuchsia-400 bg-clip-text text-transparent px-0.5">
              x
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              a
            </span>
          </div>
          {showTagline && (
            <span className="text-[10px] text-slate-500 font-medium tracking-wide">
              Tu aliada en la productividad
            </span>
          )}
        </div>
      </div>
    );
  }

  // Fallback SVG in case image fails to load
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
        N
      </div>
      <span className="text-xl font-black text-slate-900 dark:text-white">Nexa</span>
    </div>
  );
};
