import React from 'react';
import { SyncStatus } from '../types';
import { WifiOff, RefreshCw } from 'lucide-react';

interface Props {
  syncStatus: SyncStatus;
}

export const OfflineIndicator: React.FC<Props> = ({ syncStatus }) => {
  if (syncStatus.isOnline && !syncStatus.isSyncing) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 px-3.5 py-2 text-xs font-semibold shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-2">
      {syncStatus.isSyncing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400 dark:text-indigo-600" />
          <span>Sincronizando tareas y documentos...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>Modo Offline — Datos y documentos guardados localmente</span>
        </>
      )}
    </div>
  );
};
