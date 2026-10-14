import React, { useState } from 'react';
import { SyncStatus } from '../types';
import { exportAllData, importData } from '../services/db';
import { performSync } from '../services/sync';
import {
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  HardDrive,
  DownloadCloud,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { NexaLogo } from './NexaLogo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: SyncStatus;
  tasksCount: number;
  onDataImported: () => void;
}

export const OfflineSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  syncStatus,
  tasksCount,
  onDataImported,
}) => {
  if (!isOpen) return null;

  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await performSync();
    setIsManualSyncing(false);
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const dataStr = await exportAllData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Nexa_Backup_Escolar_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = await importData(content);
        if (result.success) {
          setImportStatus(`¡Éxito! Se importaron ${result.count} tareas escolares.`);
          onDataImported();
        } else {
          setImportStatus(`Error al importar: ${result.error || 'Formato inválido'}`);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <NexaLogo variant="icon-only" className="w-8 h-8" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Nexa · Datos locales y copias de seguridad
              </h2>
              <p className="text-xs text-slate-500">Gestión de datos con y sin internet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Connection Status Card */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              syncStatus.isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  syncStatus.isOnline
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'
                }`}
              >
                {syncStatus.isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {syncStatus.isOnline ? 'Conectado a Internet' : 'Modo Offline Activo'}
                </h4>
                <p className="text-xs text-slate-500">
                  {syncStatus.isOnline
                    ? 'Los cambios permanecen en este dispositivo hasta exportar una copia.'
                    : 'Tus datos siguen disponibles en este dispositivo sin conexión.'}
                </p>
              </div>
            </div>

            {syncStatus.isOnline && (
              <button
                type="button"
                disabled={isManualSyncing}
                onClick={handleManualSync}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-500 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                <span>Comprobar nube</span>
              </button>
            )}
          </div>

          {/* Sync Stats */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500">Tareas en Dispositivo</div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {tasksCount}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500">Cambios sin respaldo remoto</div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {syncStatus.pendingChangesCount}
              </div>
            </div>
          </div>

          {/* Backup / Export / Import Between Devices */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Transferencia entre Teléfono y Compu
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Exporta un respaldo con todas tus tareas, documentos adjuntos y configuraciones para abrirlo en otro dispositivo sin necesidad de internet.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isExporting}
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Exportar Respaldo</span>
              </button>

              <label className="flex-1 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>Restaurar Archivo</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportBackup}
                />
              </label>
            </div>

            {importStatus && (
              <div className="mt-3 p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
