import { Task, UserSettings } from '../types';
import { DIFFICULTY_CONFIG, DEFAULT_SUBJECTS } from '../utils/constants';
import { playAlertSound } from './audio';
import { saveTask } from './db';

export type TaskUrgencyLevel = 'alerta_preventiva' | 'critica' | 'vencida' | 'a_tiempo' | 'completada';

export interface TaskUrgencyInfo {
  level: TaskUrgencyLevel;
  daysRemaining: number;
  hoursRemaining: number;
  isAlertWindowActive: boolean; // within 3, 5, or 7 days
  recommendedAction: string;
  badgeText: string;
  colorClass: string;
  bgClass: string;
}

export function calculateTaskUrgency(task: Task): TaskUrgencyInfo {
  if (task.status === 'completada' || task.status === 'entregada') {
    return {
      level: 'completada',
      daysRemaining: 0,
      hoursRemaining: 0,
      isAlertWindowActive: false,
      recommendedAction: 'Tarea finalizada y lista.',
      badgeText: 'Entregada',
      colorClass: 'text-emerald-700 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    };
  }

  const dueDateTimeString = `${task.dueDate}T${task.dueTime || '23:59'}:00`;
  let dueDateTime = new Date(dueDateTimeString).getTime();
  if (isNaN(dueDateTime)) {
    dueDateTime = new Date(`${task.dueDate}T23:59:00`).getTime();
    if (isNaN(dueDateTime)) {
      dueDateTime = Date.now() + 86400000;
    }
  }
  const now = Date.now();
  const diffMs = dueDateTime - now;

  const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const alertDays = task.alertDaysBefore || 3;

  if (diffMs < 0) {
    return {
      level: 'vencida',
      daysRemaining,
      hoursRemaining,
      isAlertWindowActive: true,
      recommendedAction: 'Fecha límite superada. Contacta al profesor o entrega de inmediato.',
      badgeText: '¡Vencida!',
      colorClass: 'text-rose-700 dark:text-rose-400',
      bgClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800',
    };
  }

  if (hoursRemaining <= 24) {
    return {
      level: 'critica',
      daysRemaining,
      hoursRemaining,
      isAlertWindowActive: true,
      recommendedAction: `¡Quedan solo ${Math.max(1, hoursRemaining)} horas! Finaliza y sube tus documentos hoy.`,
      badgeText: `Entrega Hoy (${Math.max(1, hoursRemaining)}h)`,
      colorClass: 'text-red-700 dark:text-red-400',
      bgClass: 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 animate-pulse',
    };
  }

  if (daysRemaining <= alertDays) {
    const diffCfg = DIFFICULTY_CONFIG[task.difficulty];
    return {
      level: 'alerta_preventiva',
      daysRemaining,
      hoursRemaining,
      isAlertWindowActive: true,
      recommendedAction: `Alerta activa (${alertDays} días antes). Tarea ${diffCfg.name}: se aconseja iniciar ahora.`,
      badgeText: `Aviso: Faltan ${daysRemaining} días`,
      colorClass: 'text-amber-700 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800',
    };
  }

  return {
    level: 'a_tiempo',
    daysRemaining,
    hoursRemaining,
    isAlertWindowActive: false,
    recommendedAction: `Tiempo suficiente (${daysRemaining} días). La alerta sonará ${alertDays} días antes de la entrega.`,
    badgeText: `${daysRemaining} días restantes`,
    colorClass: 'text-slate-700 dark:text-slate-300',
    bgClass: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
  };
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  return false;
}

export function sendBrowserNotification(task: Task, titleText: string, bodyText: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const options: NotificationOptions = {
      body: bodyText,
      icon: '/pwa-192x192.png',
      badge: '/icon.svg',
      tag: `nexa-task-${task.id}`,
      requireInteraction: false,
    };
    new Notification(titleText, options);
  } catch (err) {
    console.warn('Could not display system notification:', err);
  }
}

/**
 * Checks all tasks and triggers alerts (audio + browser notification)
 * for tasks that have crossed their alert window and haven't notified today
 */
export function checkAndTriggerAlerts(tasks: Task[], settings: UserSettings): Task[] {
  const alertedTasks: Task[] = [];
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  for (const task of tasks) {
    if (task.status === 'completada' || task.status === 'entregada') continue;

    const urgency = calculateTaskUrgency(task);
    if (!urgency.isAlertWindowActive) continue;

    alertedTasks.push(task);

    // Check if already notified today
    const lastNotifiedDay = task.lastNotifiedAt ? (() => { const d = new Date(task.lastNotifiedAt!); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() : null;
    const shouldNotify = lastNotifiedDay !== todayStr;

    const canNotify = settings.soundEnabled || (settings.browserNotificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted');
    if (shouldNotify && canNotify) {
      task.lastNotifiedAt = new Date().toISOString();
      // Persist to IndexedDB so reloads don't re-trigger alerts repeatedly
      saveTask(task).catch((err) => console.warn('Could not persist lastNotifiedAt:', err));

      // Trigger Web Audio sound if enabled
      if (settings.soundEnabled) {
        // If critical (< 24h) use urgent alarm, otherwise user's selected sound
        const soundToPlay = urgency.level === 'critica' || urgency.level === 'vencida' 
          ? 'urgent_alarm' 
          : settings.selectedSound;
        playAlertSound(soundToPlay, settings.volume);
      }

      // Trigger browser notification
      if (settings.browserNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        const subject = DEFAULT_SUBJECTS.find(s => s.id === task.subjectId);
        const subjectName = subject ? `[${subject.name}]` : '';
        const title = `⚠️ ${subjectName} ${task.title}`;
        const body = `Vence el ${task.dueDate} a las ${task.dueTime}. Dificultad: ${task.difficulty.toUpperCase()}. ¡Inicia ahora para entregar a tiempo!`;
        sendBrowserNotification(task, title, body);
      }
    }
  }

  return alertedTasks;
}
