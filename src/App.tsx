/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, UserSettings, TaskAttachment, SyncStatus } from './types';
import {
  getTasks,
  saveTask,
  deleteTask,
  getUserSettings,
  saveUserSettings,
  seedInitialTasksIfEmpty,
} from './services/db';
import { initSyncManager, subscribeToSyncStatus } from './services/sync';
import { checkAndTriggerAlerts, calculateTaskUrgency } from './services/notifications';
import { playAlertSound } from './services/audio';
import { DEFAULT_SUBJECTS, DEFAULT_USER_SETTINGS } from './utils/constants';

import { Navbar } from './components/Navbar';
import { TaskCard } from './components/TaskCard';
import { TaskTableView } from './components/TaskTableView';
import { TaskModal } from './components/TaskModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { OfflineSyncModal } from './components/OfflineSyncModal';
import { StudyTimer } from './components/StudyTimer';
import { CalendarView } from './components/CalendarView';
import { AlertsBanner } from './components/AlertsBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { NexaLogo } from './components/NexaLogo';
import { AutoScheduleModal } from './components/AutoScheduleModal';

import {
  Search,
  Plus,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderOpen,
  CalendarSync,
  Upload,
} from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingChangesCount: 0,
    lastSyncAt: new Date(),
    message: 'Listo',
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'tasks' | 'calendar' | 'study'>('tasks');

  // View Mode: 'cards' or 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendientes' | 'alerta' | 'entregadas'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<TaskAttachment | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isStudyTimerOpen, setIsStudyTimerOpen] = useState(false);
  const [studyTask, setStudyTask] = useState<Task | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);
  const [isAutoScheduleOpen, setIsAutoScheduleOpen] = useState(false);

  // Initialize DB and Seed Data
  const loadAppData = useCallback(async () => {
    try {
      await seedInitialTasksIfEmpty();
      const loadedTasks = await getTasks();
      const loadedSettings = await getUserSettings();
      setTasks(loadedTasks);
      setSettings(loadedSettings);
    } catch (err) {
      console.error('Error loading app data:', err);
    }
  }, []);

  useEffect(() => {
    loadAppData();
    const cleanupSync = initSyncManager();
    const unsubscribeSync = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });

    return () => {
      cleanupSync?.();
      unsubscribeSync();
    };
  }, [loadAppData]);

  // Periodic alert check & trigger sound/notification every 30 seconds
  useEffect(() => {
    if (tasks.length === 0) return;

    checkAndTriggerAlerts(tasks, settings);

    const interval = setInterval(() => {
      checkAndTriggerAlerts(tasks, settings);
    }, 30000);

    return () => clearInterval(interval);
  }, [tasks, settings]);

  // Quick sound toggle from header
  const handleToggleSoundQuick = async () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(updated);
    await saveUserSettings(updated);
    if (updated.soundEnabled) {
      playAlertSound(updated.selectedSound, updated.volume);
    }
  };

  // Handlers for Tasks CRUD
  const handleSaveTask = async (task: Task) => {
    await saveTask(task);
    const updatedTasks = await getTasks();
    setTasks(updatedTasks);
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('¿Deseas eliminar esta tarea escolar?')) {
      await deleteTask(id);
      const updatedTasks = await getTasks();
      setTasks(updatedTasks);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'completada' || task.status === 'entregada' ? 'pendiente' : 'entregada';
    const updated: Task = {
      ...task,
      status: nextStatus,
    };
    await saveTask(updated);
    const updatedTasks = await getTasks();
    setTasks(updatedTasks);
  };

  const handleSaveSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    await saveUserSettings(newSettings);
  };

  const handleStartStudyTimer = (task: Task) => {
    setStudyTask(task);
    setIsStudyTimerOpen(true);
  };

  // Identify tasks currently in their warning alert window
  const alertTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === 'completada' || t.status === 'entregada') return false;
      const urgency = calculateTaskUrgency(t);
      return urgency.isAlertWindowActive;
    });
  }, [tasks]);

  // Filtered tasks for task list view
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = (t.description || '').toLowerCase().includes(query);
        const subject = DEFAULT_SUBJECTS.find((s) => s.id === t.subjectId);
        const matchesSubject = subject ? subject.name.toLowerCase().includes(query) : false;
        if (!matchesTitle && !matchesDesc && !matchesSubject) return false;
      }

      // Filter subject
      if (filterSubject !== 'all' && t.subjectId !== filterSubject) {
        return false;
      }

      // Segmented status filter
      if (filterStatus === 'pendientes' && (t.status === 'completada' || t.status === 'entregada')) {
        return false;
      }
      if (filterStatus === 'alerta') {
        const urgency = calculateTaskUrgency(t);
        if (!urgency.isAlertWindowActive || t.status === 'completada' || t.status === 'entregada') {
          return false;
        }
      }
      if (filterStatus === 'entregadas' && (t.status !== 'completada' && t.status !== 'entregada')) {
        return false;
      }

      // Filter difficulty
      if (filterDifficulty !== 'all' && t.difficulty !== filterDifficulty) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, filterSubject, filterStatus, filterDifficulty]);

  // Statistical indicators
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status !== 'completada' && t.status !== 'entregada').length;
  const inAlertCount = alertTasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completada' || t.status === 'entregada').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 pb-20 md:pb-12 text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans']">
      {/* Navbar with Nexa brand */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        syncStatus={syncStatus}
        settings={settings}
        onOpenNewTask={() => {
          setEditingTask(null);
          setPrefilledDate(null);
          setIsTaskModalOpen(true);
        }}
        onOpenAutoSchedule={() => setIsAutoScheduleOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onToggleSoundQuick={handleToggleSoundQuick}
        alertTasksCount={alertTasks.length}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Official Nexa Brand Hero Header */}
        <div className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 sm:gap-4.5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-white border border-slate-100 dark:border-slate-800 p-1 shadow-xs flex items-center justify-center overflow-hidden">
              <img
                src="/nexa-logo.png"
                alt="Nexa - Tu aliada en la productividad"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Nexa
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                  Tu aliada en la productividad
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
                Control escolar de actividades con subida de documentos, funcionamiento offline y avisos preventivos con 3 a 7 días de antelación.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Auto-Schedule Single File Button */}
            <button
              onClick={() => setIsAutoScheduleOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition shadow-xs hover:bg-indigo-100 dark:hover:bg-indigo-900 flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Sube un solo cronograma o guía y genera fechas automáticamente"
            >
              <CalendarSync className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Subir 1 Archivo (Auto-Fechas)</span>
            </button>

            <button
              onClick={() => {
                setEditingTask(null);
                setPrefilledDate(null);
                setIsTaskModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition shadow-xs hover:opacity-90 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Tarea</span>
            </button>
          </div>
        </div>

        {/* Urgent Alerts Banner */}
        <AlertsBanner
          alertTasks={alertTasks}
          onSelectTask={(task) => {
            setEditingTask(task);
            setIsTaskModalOpen(true);
          }}
          onStartStudy={(task) => handleStartStudyTimer(task)}
        />

        {/* Minimalist Tabular KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Total Actividades</span>
              <FolderOpen className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {totalCount}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-medium">
              <span>Alerta Preventiva (3-7d)</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
              {inAlertCount}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Por Entregar</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {pendingCount}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              <span>Entregadas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
              {completedCount}
            </div>
          </div>
        </div>

        {/* Tab 1: Tasks Workspace */}
        {activeTab === 'tasks' && (
          <div>
            {/* Quick Auto-Schedule Callout */}
            <div className="mb-4 p-3.5 sm:p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <CalendarSync className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      ¿Tienes un cronograma, temario o guía de actividades?
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                      ⚡ 1 solo archivo
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sube un solo archivo y Nexa detectará las materias, dividirá las actividades y calculará las fechas automáticamente con alertas de 3 a 7 días.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAutoScheduleOpen(true)}
                className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Programar con 1 Archivo</span>
              </button>
            </div>

            {/* Filter, Search & View Switcher Bar */}
            <div className="mb-5 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar tareas o materias..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
                />
              </div>

              {/* Segmented Status Controls (Zero-Pill, Functional Buttons) */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todas ({totalCount})
                </button>
                <button
                  onClick={() => setFilterStatus('alerta')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    filterStatus === 'alerta'
                      ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  En Alerta ({inAlertCount})
                </button>
                <button
                  onClick={() => setFilterStatus('pendientes')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    filterStatus === 'pendientes'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Pendientes ({pendingCount})
                </button>
                <button
                  onClick={() => setFilterStatus('entregadas')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    filterStatus === 'entregadas'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Entregadas ({completedCount})
                </button>
              </div>

              {/* View Switcher & Dropdowns */}
              <div className="flex items-center gap-2">
                {/* Subject dropdown */}
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">Todas las materias</option>
                  {DEFAULT_SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                {/* View Mode Toggle (Cards vs Table) */}
                <div className="hidden sm:flex items-center gap-0.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-1.5 rounded transition cursor-pointer ${
                      viewMode === 'cards'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Vista Cuadrícula"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded transition cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Vista Tabla"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {filteredTasks.length === 0 ? (
              <div className="text-center py-14 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-center mb-3">
                  <NexaLogo variant="compact" showTagline={true} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-1">
                  Sin tareas en este criterio
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
                  Agrega una actividad escolar con fecha de entrega y documentos adjuntos para activar las alertas.
                </p>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Tarea Escolar</span>
                </button>
              </div>
            ) : viewMode === 'table' ? (
              <TaskTableView
                tasks={filteredTasks}
                onEdit={(t) => {
                  setEditingTask(t);
                  setIsTaskModalOpen(true);
                }}
                onDelete={handleDeleteTask}
                onToggleStatus={handleToggleStatus}
                onViewAttachment={(att) => setViewingAttachment(att)}
                onStartStudyTimer={handleStartStudyTimer}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setIsTaskModalOpen(true);
                    }}
                    onDelete={handleDeleteTask}
                    onToggleStatus={handleToggleStatus}
                    onViewAttachment={(att) => setViewingAttachment(att)}
                    onStartStudyTimer={handleStartStudyTimer}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Calendar & Agenda View */}
        {activeTab === 'calendar' && (
          <CalendarView
            tasks={tasks}
            onSelectTask={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onViewAttachment={(att) => setViewingAttachment(att)}
            onNewTaskDate={(dateStr) => {
              setPrefilledDate(dateStr);
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
          />
        )}

        {/* Tab 3: Study Focus Mode */}
        {activeTab === 'study' && (
          <div className="max-w-2xl mx-auto py-4">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-2">
                <NexaLogo variant="compact" showTagline={true} />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-3">
                Modo Enfoque Escolar
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Bloques de 25 minutos con timbre sonoro para finalizar tus tareas a tiempo.
              </p>
            </div>

            <div className="space-y-2.5">
              {tasks.filter((t) => t.status !== 'completada' && t.status !== 'entregada').map((task) => {
                const subject = DEFAULT_SUBJECTS.find((s) => s.id === task.subjectId);
                return (
                  <div
                    key={task.id}
                    onClick={() => handleStartStudyTimer(task)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-0.5">
                        {subject?.name} · Vence: {task.dueDate} {task.dueTime}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {task.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition"
                    >
                      Iniciar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Task Create / Edit Modal */}
      <TaskModal
        task={editingTask ? editingTask : prefilledDate ? ({ dueDate: prefilledDate } as Task) : null}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
          setPrefilledDate(null);
        }}
        onSave={handleSaveTask}
        onViewAttachment={(att) => setViewingAttachment(att)}
        onOpenAutoSchedule={() => setIsAutoScheduleOpen(true)}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        attachment={viewingAttachment}
        onClose={() => setViewingAttachment(null)}
      />

      {/* Notification & Sounds Settings Modal */}
      <NotificationSettingsModal
        settings={settings}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
      />

      {/* Offline & Sync Status Modal */}
      <OfflineSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncStatus={syncStatus}
        tasksCount={tasks.length}
        onDataImported={loadAppData}
      />

      {/* Pomodoro Study Timer Modal */}
      <StudyTimer
        task={studyTask}
        isOpen={isStudyTimerOpen}
        onClose={() => {
          setIsStudyTimerOpen(false);
          setStudyTask(null);
        }}
      />

      {/* Auto-Schedule Single File Modal */}
      <AutoScheduleModal
        isOpen={isAutoScheduleOpen}
        onClose={() => setIsAutoScheduleOpen(false)}
        onTasksScheduled={loadAppData}
      />

      {/* Discrete Offline State Banner */}
      <OfflineIndicator syncStatus={syncStatus} />
    </div>
  );
}
