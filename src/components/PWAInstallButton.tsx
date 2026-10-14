import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-blue-700 transition active:scale-95 cursor-pointer"
        title="Instalar Nexa en tu dispositivo"
      >
        <Download className="w-4 h-4" />
        <span>Instalar Nexa</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 transition cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold tracking-wider">
                  N
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Instalar Nexa en iPhone</h3>
                  <p className="text-xs text-slate-500">Úsala sin conexión desde tu pantalla de inicio</p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">1</span>
                  <p>Toca el botón <span className="font-semibold inline-flex items-center gap-1"><Share2 className="w-3.5 h-3.5 inline text-blue-500" /> Compartir</span> en la barra inferior de Safari.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">2</span>
                  <p>Baja en el menú y selecciona <span className="font-semibold inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 inline text-indigo-500" /> "Añadir a la pantalla de inicio"</span>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">3</span>
                  <p>Presiona <span className="font-semibold text-indigo-600 dark:text-indigo-400">Añadir</span> arriba a la derecha. ¡Listo!</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 text-xs sm:text-sm font-semibold hover:opacity-90 transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
