import { getPendingSyncCount } from './db';
import { SyncStatus } from '../types';
type SyncListener = (status: SyncStatus) => void;
const listeners = new Set<SyncListener>();
let currentStatus: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingChangesCount: 0,
  lastSyncAt: null,
  message: 'Datos guardados en este dispositivo. Utiliza Exportar copia para respaldarlos.',
};
const notify = () => listeners.forEach(fn => fn({ ...currentStatus }));
export function subscribeToSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener); listener({ ...currentStatus });
  return () => { listeners.delete(listener); };
}
export async function refreshPendingCount() {
  currentStatus.pendingChangesCount = await getPendingSyncCount();
  notify();
}
export async function performSync(): Promise<{success: boolean; message: string}> {
  currentStatus.message = 'No hay sincronización en la nube configurada. Exporta una copia de seguridad para transferir tus datos.';
  notify();
  return { success: false, message: currentStatus.message };
}
export function initSyncManager() {
  if (typeof window === 'undefined') return;
  const update = () => {
    currentStatus.isOnline = navigator.onLine;
    currentStatus.message = 'Almacenamiento local: tus tareas no se transfieren automáticamente entre dispositivos.';
    notify();
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  void refreshPendingCount();
  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  };
}
