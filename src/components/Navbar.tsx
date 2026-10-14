import React from 'react';
import { SyncStatus, UserSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Calendar,
  Timer,
  Bell,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Plus,
  CheckSquare,
  CalendarSync,
} from 'lucide-react';

import { NexaLogo } from './NexaLogo';

interface Props {
  activeTab: 'tasks' | 'calendar' | 'study';
  setActiveTab: (tab: 'tasks' | 'calendar' | 'study') => void;
  syncStatus: SyncStatus;
  settings: UserSettings;
  onOpenNewTask: () => void;
  onOpenAutoSchedule: () => void;
  onOpenSettings: () => void;
  onOpenSyncModal: () => void;
  onToggleSoundQuick: () => void;
  alertTasksCount: number;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  syncStatus,
  settings,
  onOpenNewTask,
  onOpenAutoSchedule,
  onOpenSettings,
  onOpenSyncModal,
  onToggleSoundQuick,
  alertTasksCount,
}) => {
  return (
    <>
      {/* Top Bar following Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4 sm:gap-8">
            {/* Zone 1: Official Nexa Brand Logo & Wordmark */}
            <div className="flex items-center shrink-0 cursor-pointer" onClick={() => setActiveTab('tasks')}>
              <NexaLogo variant="compact" showTagline={false} />
            </div>

            {/* Zone 2: Navigation Links (Clean single-line text links) */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'tasks'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Tareas</span>
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'calendar'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendario</span>
              </button>
              <button
                onClick={() => setActiveTab('study')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'study'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Modo Enfoque</span>
              </button>
            </nav>

            {/* Zone 3: Actions & Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Online/Offline Status */}
              <button
                onClick={onOpenSyncModal}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  syncStatus.isOnline
                    ? 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                }`}
                title={syncStatus.isOnline ? 'En línea (Guardado local)' : 'Modo Offline (Guardado local)'}
              >
                {syncStatus.isOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span className="hidden sm:inline font-mono">
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </span>
                {syncStatus.pendingChangesCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                    {syncStatus.pendingChangesCount}
                  </span>
                )}
              </button>

              {/* Sound quick mute/unmute */}
              <button
                onClick={onToggleSoundQuick}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title={settings.soundEnabled ? 'Sonidos de alerta activos (clic para silenciar)' : 'Sonidos desactivados'}
              >
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* Alerts Configuration */}
              <button
                onClick={onOpenSettings}
                className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Configurar avisos de 3, 5 o 7 días y timbres"
              >
                <Bell className="w-4 h-4" />
                {alertTasksCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {/* PWA Install */}
              <PWAInstallButton />


              {/* Auto-Schedule Single File Button */}
              <button
                onClick={onOpenAutoSchedule}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition shadow-xs hover:border-indigo-400 cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
                title="Subir un solo cronograma y programar fechas automáticamente"
              >
                <CalendarSync className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Auto-Fechas</span>
              </button>

              {/* Primary Action Button */}
              <button
                onClick={onOpenNewTask}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Tarea</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Action Button for Mobile */}
      <div className="sm:hidden fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2.5">
        <button
          onClick={onOpenAutoSchedule}
          className="px-3.5 py-2 rounded-full bg-indigo-600 text-white shadow-lg flex items-center gap-1.5 active:scale-95 transition cursor-pointer text-xs font-bold border border-indigo-400/30"
          title="Subir un archivo con fechas automáticas"
        >
          <CalendarSync className="w-4 h-4" />
          <span>Auto-Fechas</span>
        </button>
        <button
          onClick={onOpenNewTask}
          className="w-13 h-13 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl flex items-center justify-center active:scale-90 transition cursor-pointer border border-slate-700/20"
          title="Crear nueva tarea escolar"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 transition-colors">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'tasks'
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span>Tareas</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'calendar'
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Calendario</span>
          </button>

          <button
            onClick={onOpenAutoSchedule}
            className="flex flex-col items-center gap-1 py-1 px-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition cursor-pointer"
            title="Subir archivo y crear fechas automáticas"
          >
            <CalendarSync className="w-5 h-5" />
            <span>Auto-Fechas</span>
          </button>

          <button
            onClick={() => setActiveTab('study')}
            className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'study'
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Timer className="w-5 h-5" />
            <span>Enfoque</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center gap-1 py-1 px-2 text-xs font-semibold text-slate-400 dark:text-slate-500 transition cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span>Avisos</span>
          </button>
        </div>
      </nav>
    </>
  );
};
