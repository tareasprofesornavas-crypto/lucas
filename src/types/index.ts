export type TaskDifficulty = 'leve' | 'moderada' | 'fuerte' | 'muy_fuerte';

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'entregada';

export interface Subject {
  id: string;
  name: string;
  color: string;
  textColor: string;
  iconName: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: number; // in bytes
  type: string; // MIME type
  dataUrl: string; // base64 / blob URL for offline storage
  uploadedAt: string;
}

export interface TaskMilestone {
  id: string;
  title: string;
  daysBefore: number;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  difficulty: TaskDifficulty;
  alertDaysBefore: number; // 1, 2, 3, 5, 7
  status: TaskStatus;
  attachments: TaskAttachment[];
  milestones?: TaskMilestone[];
  createdAt: string;
  updatedAt: string;
  lastNotifiedAt?: string;
  syncState?: 'synced' | 'pending_sync';
}

export type SoundOption = 
  | 'school_bell' 
  | 'urgent_alarm' 
  | 'soft_chime' 
  | 'warning_beep' 
  | 'zen_bowl';

export interface UserSettings {
  soundEnabled: boolean;
  selectedSound: SoundOption;
  volume: number; // 0 to 1
  browserNotificationsEnabled: boolean;
  defaultAlertDays: number; // 3, 5, 7
  autoSync: boolean;
  lastSyncTimestamp: string | null;
  studentName: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingChangesCount: number;
  lastSyncAt: Date | null;
  message: string;
}
