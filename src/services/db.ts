import { Task, UserSettings, TaskAttachment } from '../types';
import { DEFAULT_USER_SETTINGS, DEFAULT_SUBJECTS } from '../utils/constants';

const DB_NAME = 'eduplan_school_v1';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export async function getDb(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('dueDate', 'dueDate', { unique: false });
        taskStore.createIndex('subjectId', 'subjectId', { unique: false });
        taskStore.createIndex('status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Helper to seed initial sample tasks if database is empty
export async function seedInitialTasksIfEmpty(): Promise<void> {
  // New accounts intentionally start empty. Demonstration items are opt-in only.
}

export async function getTasks(): Promise<Task[]> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tasks', 'readonly');
      const store = tx.objectStore('tasks');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Fallback to localStorage for getTasks', err);
    const raw = localStorage.getItem('eduplan_tasks_backup');
    return raw ? JSON.parse(raw) : [];
  }
}

export async function getTask(id: string): Promise<Task | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTask(task: Task, recordSync = true): Promise<void> {
  const taskToSave: Task = {
    ...task,
    updatedAt: new Date().toISOString(),
    syncState: recordSync ? 'pending_sync' : 'synced',
  };

  try {
    const db = await getDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['tasks', 'syncQueue'], 'readwrite');
      const taskStore = tx.objectStore('tasks');
      taskStore.put(taskToSave);

      if (recordSync) {
        const syncStore = tx.objectStore('syncQueue');
        syncStore.add({
          action: 'SAVE_TASK',
          taskId: taskToSave.id,
          timestamp: new Date().toISOString(),
          data: taskToSave,
        });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Also mirror to localStorage as backup
    const all = await getTasks();
    localStorage.setItem('eduplan_tasks_backup', JSON.stringify(all));
  } catch (err) {
    console.error('Error in saveTask IndexedDB', err);
    // LocalStorage fallback
    const raw = localStorage.getItem('eduplan_tasks_backup');
    const list: Task[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(t => t.id === taskToSave.id);
    if (idx >= 0) list[idx] = taskToSave;
    else list.push(taskToSave);
    localStorage.setItem('eduplan_tasks_backup', JSON.stringify(list));
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    const db = await getDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['tasks', 'syncQueue'], 'readwrite');
      const store = tx.objectStore('tasks');
      store.delete(id);

      const syncStore = tx.objectStore('syncQueue');
      syncStore.add({
        action: 'DELETE_TASK',
        taskId: id,
        timestamp: new Date().toISOString(),
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    const all = await getTasks();
    localStorage.setItem('eduplan_tasks_backup', JSON.stringify(all));
  } catch (err) {
    console.error('Error in deleteTask', err);
    const raw = localStorage.getItem('eduplan_tasks_backup');
    if (raw) {
      const list: Task[] = JSON.parse(raw);
      const filtered = list.filter(t => t.id !== id);
      localStorage.setItem('eduplan_tasks_backup', JSON.stringify(filtered));
    }
  }
}

export async function getUserSettings(): Promise<UserSettings> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get('user_settings');

      request.onsuccess = () => {
        if (request.result && request.result.value) {
          resolve({ ...DEFAULT_USER_SETTINGS, ...request.result.value });
        } else {
          const raw = localStorage.getItem('eduplan_user_settings');
          resolve(raw ? { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) } : DEFAULT_USER_SETTINGS);
        }
      };
      request.onerror = () => {
        resolve(DEFAULT_USER_SETTINGS);
      };
    });
  } catch {
    const raw = localStorage.getItem('eduplan_user_settings');
    return raw ? { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) } : DEFAULT_USER_SETTINGS;
  }
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  try {
    const db = await getDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      store.put({ key: 'user_settings', value: settings });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error saving user settings to IndexedDB', err);
  }
  localStorage.setItem('eduplan_user_settings', JSON.stringify(settings));
}

export async function getPendingSyncCount(): Promise<number> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction('syncQueue', 'readonly');
      const store = tx.objectStore('syncQueue');
      const countReq = store.count();
      countReq.onsuccess = () => resolve(countReq.result || 0);
      countReq.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

export async function clearSyncQueue(): Promise<void> {
  try {
    const db = await getDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['syncQueue', 'tasks'], 'readwrite');
      const syncStore = tx.objectStore('syncQueue');
      syncStore.clear();

      const taskStore = tx.objectStore('tasks');
      const allReq = taskStore.getAll();
      allReq.onsuccess = () => {
        const tasks: Task[] = allReq.result || [];
        for (const t of tasks) {
          if (t.syncState === 'pending_sync') {
            t.syncState = 'synced';
            taskStore.put(t);
          }
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not clear sync queue', err);
  }
}

// Backup & Restore for easy multi-device transfer
export async function exportAllData(): Promise<string> {
  const tasks = await getTasks();
  const settings = await getUserSettings();
  const data = {
    app: 'Nexa',
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    tasks,
    settings,
  };
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      return { success: false, count: 0, error: 'Formato de archivo inválido.' };
    }

    let importedCount = 0;
    for (const t of parsed.tasks) {
      if (t.id && t.title && t.dueDate) {
        await saveTask(t, false);
        importedCount++;
      }
    }

    if (parsed.settings) {
      await saveUserSettings(parsed.settings);
    }

    return { success: true, count: importedCount };
  } catch (err) {
    return { success: false, count: 0, error: (err as Error).message };
  }
}
