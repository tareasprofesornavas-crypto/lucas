import { Subject, TaskDifficulty, UserSettings } from '../types';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE_MB = 10;

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp'];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'math', name: 'Matemáticas', color: 'bg-blue-600', textColor: 'text-blue-700 dark:text-blue-300', iconName: 'Calculator' },
  { id: 'science', name: 'Ciencias / Biología', color: 'bg-emerald-600', textColor: 'text-emerald-700 dark:text-emerald-300', iconName: 'FlaskConical' },
  { id: 'history', name: 'Historia y Geografía', color: 'bg-amber-600', textColor: 'text-amber-700 dark:text-amber-300', iconName: 'Globe' },
  { id: 'literature', name: 'Lengua y Literatura', color: 'bg-purple-600', textColor: 'text-purple-700 dark:text-purple-300', iconName: 'BookOpen' },
  { id: 'english', name: 'Inglés / Idiomas', color: 'bg-rose-600', textColor: 'text-rose-700 dark:text-rose-300', iconName: 'Languages' },
  { id: 'physics_chemistry', name: 'Física y Química', color: 'bg-cyan-600', textColor: 'text-cyan-700 dark:text-cyan-300', iconName: 'Atom' },
  { id: 'technology', name: 'Tecnología e Informática', color: 'bg-teal-600', textColor: 'text-teal-700 dark:text-teal-300', iconName: 'Laptop' },
  { id: 'arts', name: 'Arte y Música', color: 'bg-indigo-600', textColor: 'text-indigo-700 dark:text-indigo-300', iconName: 'Palette' },
];

export interface DifficultyConfig {
  id: TaskDifficulty;
  name: string;
  badgeLabel: string;
  recommendedAlertDays: number;
  description: string;
  colorClass: string;
  bgLightClass: string;
  borderColorClass: string;
  suggestedSteps: string[];
}

export const DIFFICULTY_CONFIG: Record<TaskDifficulty, DifficultyConfig> = {
  leve: {
    id: 'leve',
    name: 'Leve (Baja Carga)',
    badgeLabel: 'Tarea Leve',
    recommendedAlertDays: 1,
    description: 'Ejercicios cortos, lectura breve o cuestionario sencillo.',
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    bgLightClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColorClass: 'border-emerald-200 dark:border-emerald-800',
    suggestedSteps: [
      'Revisar enunciados y material',
      'Desarrollar y pasar a limpio'
    ]
  },
  moderada: {
    id: 'moderada',
    name: 'Moderada (Media Carga)',
    badgeLabel: 'Tarea Moderada',
    recommendedAlertDays: 2,
    description: 'Taller de varios ejercicios, redacción o resumen analítico.',
    colorClass: 'text-blue-700 dark:text-blue-400',
    bgLightClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderColorClass: 'border-blue-200 dark:border-blue-800',
    suggestedSteps: [
      'Lectura de fuentes y esquema previo',
      'Resolución de ejercicios / redacción borrador',
      'Revisión ortográfica y formato final'
    ]
  },
  fuerte: {
    id: 'fuerte',
    name: 'Fuerte (Pesada / 3+ días)',
    badgeLabel: 'Tarea Fuerte',
    recommendedAlertDays: 3,
    description: 'Informe de laboratorio, maqueta, ensayo formal o exposición oral.',
    colorClass: 'text-amber-700 dark:text-amber-400',
    bgLightClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderColorClass: 'border-amber-200 dark:border-amber-800',
    suggestedSteps: [
      'Fase 1: Recopilación de material y lectura de rúbrica',
      'Fase 2: Elaboración de estructura / borrador experimental',
      'Fase 3: Desarrollo en limpio y corrección de dudas',
      'Fase 4: Verificación de criterios de evaluación y entrega'
    ]
  },
  muy_fuerte: {
    id: 'muy_fuerte',
    name: 'Muy Fuerte (Proyecto / Examen 5-7 días)',
    badgeLabel: 'Proyecto / Examen',
    recommendedAlertDays: 7,
    description: 'Proyecto bimestral, monografía de investigación o examen final.',
    colorClass: 'text-rose-700 dark:text-rose-400',
    bgLightClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderColorClass: 'border-rose-200 dark:border-rose-800',
    suggestedSteps: [
      'Día 1: Planificación, temas y cronograma de trabajo',
      'Día 2-3: Investigación profunda y toma de notas',
      'Día 4: Redacción del cuerpo principal y bibliografía',
      'Día 5: Ajustes, conclusiones y diseño visual',
      'Día 6-7: Simulacro/revisión con rúbrica del profesor y entrega'
    ]
  },
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  soundEnabled: true,
  selectedSound: 'school_bell',
  volume: 0.8,
  browserNotificationsEnabled: false,
  defaultAlertDays: 3,
  autoSync: true,
  lastSyncTimestamp: new Date().toISOString(),
  studentName: 'Estudiante',
};
