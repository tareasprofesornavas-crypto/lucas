import React, { useState, useRef, useMemo } from 'react';
import { Task, TaskAttachment, TaskDifficulty } from '../types';
import { DEFAULT_SUBJECTS, DIFFICULTY_CONFIG, MAX_FILE_SIZE_BYTES } from '../utils/constants';
import { parseAndAutoScheduleDocument, AutoParsedItem, formatDateISO, addDays } from '../services/autoScheduler';
import { saveTask } from '../services/db';
import { playDeliverySuccessSound } from '../services/audio';
import confetti from 'canvas-confetti';
import {
  X,
  Upload,
  Calendar,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  CalendarCheck,
  BookOpen,
  CalendarDays,
  FileCheck,
  Layers,
  Filter,
} from 'lucide-react';
import { NexaLogo } from './NexaLogo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTasksScheduled: () => void;
}

export const AutoScheduleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onTasksScheduled,
}) => {
  if (!isOpen) return null;

  const [file, setFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-scheduling configuration
  const [scheduleCadence, setScheduleCadence] = useState<'progressive' | 'weekly' | 'dense'>('progressive');
  const [startDateOffset, setStartDateOffset] = useState<number>(3); // 3 days from now

  // Parsed tasks list ready to preview and confirm (EACH HAS ITS OWN SUBJECT!)
  const [parsedItems, setParsedItems] = useState<AutoParsedItem[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`El archivo "${selectedFile.name}" supera el límite de 10 MB.`);
      return;
    }

    setErrorMessage(null);
    setFile(selectedFile);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = (e.target?.result as string) || '';
      setFileDataUrl(dataUrl);

      try {
        const spacing = scheduleCadence === 'weekly' ? 7 : scheduleCadence === 'dense' ? 3 : 4;
        const result = await parseAndAutoScheduleDocument(selectedFile, startDateOffset, spacing);
        setParsedItems(result.tasks);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'No se pudo leer el archivo.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  // Pre-load rich multi-subject demos for instant 1-click test
  const handleLoadDemo = async (
    type: 'pack_8_materias_16_tareas' | 'bimestral_completo' | 'agenda_semanal' | 'proyectos_ciclo'
  ) => {
    setIsProcessing(true);
    setErrorMessage(null);

    let dummyContent = '';
    let fileName = '';

    if (type === 'pack_8_materias_16_tareas') {
      fileName = 'Plan_Escolar_Completo_8_Materias_16_Actividades.txt';
      dummyContent = `PLAN ESCOLAR INTEGRAL - 8 MATERIAS ACADÉMICAS (16 TAREAS)
1. Matemáticas: Taller 1 de Álgebra y Ecuaciones Lineales
2. Matemáticas: Examen Parcial de Funciones y Geometría
3. Ciencias Naturales: Informe de Laboratorio de Estructura Celular
4. Ciencias Naturales: Proyecto de Ecosistemas y Conservación Ambiental
5. Historia y Geografía: Ensayo sobre Movimientos de Independencia
6. Historia y Geografía: Análisis de Cartografía y Geopolítica Global
7. Lengua y Literatura: Control de Lectura y Análisis Crítico de Novela
8. Lengua y Literatura: Redacción de Ensayo Argumentativo y Debate
9. Inglés: Guía de Vocabulario y Tiempos Verbales en Inglés
10. Inglés: Presentación Oral (Speaking) y Diálogo en Parejas
11. Física y Química: Problemas de Cinemática y Leyes de Newton
12. Física y Química: Informe de Práctica sobre Reacciones Químicas
13. Tecnología e Informática: Taller de Algoritmos y Lógica de Programación
14. Tecnología e Informática: Proyecto de Creación de Página Web Escolar
15. Arte y Música: Composición de Dibujo en Perspectiva y Teoría del Color
16. Arte y Música: Proyecto Creativo y Apreciación Musical`;
    } else if (type === 'bimestral_completo') {
      fileName = 'Cronograma_Escolar_Bimestral_2026_MultiMateria.txt';
      dummyContent = `CRONOGRAMA BIMESTRAL GENERAL - TODAS LAS MATERIAS 2026
1. Matemáticas: Taller de Álgebra y Ecuaciones Lineales
2. Ciencias Naturales: Informe de Laboratorio de Células y Organelos
3. Lengua y Literatura: Control de Lectura y Análisis Literario
4. Historia y Sociales: Ensayo sobre Movimientos de Independencia
5. Inglés: Proyecto de Vocabulario y Presentación Oral (Speaking)
6. Física y Química: Resolución de Problemas de Cinemática y Leyes de Newton
7. Tecnología e Informática: Programación de Algoritmos Escolares
8. Arte y Música: Maqueta Escolar y Composición Visual`;
    } else if (type === 'agenda_semanal') {
      fileName = 'Agenda_Semanal_Actividades_Escolares.txt';
      dummyContent = `PLAN SEMANAL ESCOLAR (TODAS LAS ASIGNATURAS)
- Lunes: Matemáticas - Taller de Ejercicios de Geometría
- Martes: Ciencias - Cuestionario de Ecosistemas y Biomas
- Miércoles: Lengua - Redacción de Ensayo Argumentativo
- Jueves: Historia - Exposición de Civilizaciones Antiguas
- Viernes: Inglés - Entrega de Listening and Grammar Worksheet`;
    } else {
      fileName = 'Plan_Proyectos_Escolares_Periodo_2026.txt';
      dummyContent = `PLAN DE PROYECTOS Y ENTREGAS DEL PERÍODO
- Fase 1: Proyecto de Ciencias - Experimento de Conservación y Huella Ecológica
- Fase 2: Matemáticas - Modelación Estadística y Gráficos de Datos
- Fase 3: Historia - Monografía Documental sobre la Revolución Industrial
- Fase 4: Literatura - Creación de Antología Poética y Comentario Crítico
- Fase 5: Tecnología - Programación de Sitio Web Informativo Escolar
- Fase 6: Arte - Exposición y Sustentación Creativa ante el Colegio`;
    }

    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const mockFile = new File([blob], fileName, { type: 'text/plain' });

    setFile(mockFile);
    setFileDataUrl('data:text/plain;base64,' + btoa(dummyContent));

    const spacing = scheduleCadence === 'weekly' ? 7 : scheduleCadence === 'dense' ? 3 : 4;
    const result = await parseAndAutoScheduleDocument(mockFile, startDateOffset, spacing);
    setParsedItems(result.tasks);
    setIsProcessing(false);
  };

  const handleUpdateItemDate = (id: string, newDate: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, dueDate: newDate, detectedDateFromDoc: false } : item))
    );
  };

  const handleUpdateItemTitle = (id: string, newTitle: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    );
  };

  const handleUpdateItemSubject = (id: string, newSubjectId: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, subjectId: newSubjectId } : item))
    );
  };

  const handleUpdateItemDifficulty = (id: string, newDiff: TaskDifficulty) => {
    const alertDays = DIFFICULTY_CONFIG[newDiff].recommendedAlertDays;
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, difficulty: newDiff, alertDaysBefore: alertDays } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setParsedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    const lastItem = parsedItems[parsedItems.length - 1];
    const baseDate = lastItem ? new Date(lastItem.dueDate) : new Date();
    const nextDate = addDays(baseDate, 4);

    // Pick a subject that doesn't have many items yet or default to math
    const newItem: AutoParsedItem = {
      id: `manual-add-${Date.now()}`,
      title: `Nueva Actividad ${parsedItems.length + 1}`,
      description: 'Actividad añadida manualmente al cronograma.',
      subjectId: 'math',
      dueDate: formatDateISO(nextDate),
      dueTime: '18:00',
      difficulty: 'moderada',
      alertDaysBefore: 2,
    };

    setParsedItems((prev) => [...prev, newItem]);
  };

  // Re-calculate dates with new cadence settings while preserving each item's subject
  const handleRecalculateCadence = (newCadence: 'progressive' | 'weekly' | 'dense') => {
    setScheduleCadence(newCadence);
    const spacing = newCadence === 'weekly' ? 7 : newCadence === 'dense' ? 3 : 4;
    const now = new Date();

    setParsedItems((prev) =>
      prev.map((item, idx) => {
        const diffOffset = item.difficulty === 'muy_fuerte' ? 2 : 0;
        const targetDate = addDays(now, startDateOffset + idx * spacing + diffOffset);
        return {
          ...item,
          dueDate: item.detectedDateFromDoc ? item.dueDate : formatDateISO(targetDate),
        };
      })
    );
  };

  // Subject statistics for the parsed tasks
  const subjectDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of parsedItems) {
      counts[item.subjectId] = (counts[item.subjectId] || 0) + 1;
    }
    return counts;
  }, [parsedItems]);

  // Filtered preview items by subject if user wants to narrow down
  const displayedItems = useMemo(() => {
    if (subjectFilter === 'all') return parsedItems;
    return parsedItems.filter((item) => item.subjectId === subjectFilter);
  }, [parsedItems, subjectFilter]);

  // Confirm and persist all tasks with the uploaded file attached to each
  const handleConfirmAndSave = async () => {
    if (parsedItems.length === 0 || !file) return;
    if (parsedItems.some(item => !item.detectedDateFromDoc) && !window.confirm("Hay fechas propuestas que NO aparecen en el documento. ¿Revisaste y confirmas las fechas de entrega?")) return;

    setIsSubmitting(true);
    try {
      const attachment: TaskAttachment = {
        id: `att-auto-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: fileDataUrl || '',
        uploadedAt: new Date().toISOString(),
      };

      for (const item of parsedItems) {
        const newTask: Task = {
          id: `task-auto-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          title: item.title,
          description: item.description,
          subjectId: item.subjectId,
          dueDate: item.dueDate,
          dueTime: item.dueTime,
          difficulty: item.difficulty,
          alertDaysBefore: item.alertDaysBefore,
          status: 'pendiente',
          attachments: [attachment],
          milestones: DIFFICULTY_CONFIG[item.difficulty].suggestedSteps.map((step, idx) => ({
            id: `m-auto-${Date.now()}-${idx}`,
            title: step,
            daysBefore: Math.max(1, item.alertDaysBefore - idx),
            completed: false,
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveTask(newTask);
      }

      // Fanfare and confetti
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#06b6d4'],
      });
      playDeliverySuccessSound(0.85);

      onTasksScheduled();
      onClose();
    } catch (err) {
      setErrorMessage('Error al guardar las tareas programadas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <NexaLogo variant="icon-only" className="w-8 h-8" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Carga de 1 Archivo: Todas las Materias y Actividades
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                  Multi-Materia
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sube un solo cronograma general. Nexa detecta cada materia por separado y programa todas las fechas con avisos de 3 a 7 días.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Step 1: Upload Single Multi-Subject Document */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>1. Sube tu archivo único (Cronograma escolar, temario o guía - Máx 10 MB)</span>
              </label>
              {file && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Archivo procesado
                </span>
              )}
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/30 border-slate-300 dark:border-slate-700 hover:bg-indigo-50/20"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.txt,.csv,.json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
                }}
              />

              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2.5">
                <CalendarDays className="w-5 h-5" />
              </div>

              {file ? (
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{file.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-1">
                    {(file.size / 1024).toFixed(1)} KB · Haz clic para cambiar de archivo
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Haz clic aquí o arrastra tu archivo con todas tus tareas
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Puede contener tareas de Matemáticas, Ciencias, Lengua, Historia, Inglés o cualquier otra materia. Nexa detectará cada una automáticamente.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Multi-Subject Demo Presets */}
            <div className="mt-3.5 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Prueba cronogramas multi-materia en 1 clic:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleLoadDemo('pack_8_materias_16_tareas')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>🌟 Pack 8 Materias (16 Tareas Completas)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemo('bimestral_completo')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition cursor-pointer shadow-xs active:scale-95"
                >
                  🎒 Bimestral (8 tareas · 8 materias)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemo('agenda_semanal')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition cursor-pointer shadow-xs active:scale-95"
                >
                  📅 Agenda Semanal (5 tareas distintas)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemo('proyectos_ciclo')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition cursor-pointer shadow-xs active:scale-95"
                >
                  📑 Plan de Proyectos (6 entregas fuertes)
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Step 2: Cadence & Date Spacing */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  2. Distribución y Cadencia de Fechas de Entrega
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleRecalculateCadence('progressive')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  scheduleCadence === 'progressive'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 ring-2 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">Progresivo (Recomendado)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Espaciado según dificultad (3 a 5 días)</div>
              </button>

              <button
                type="button"
                onClick={() => handleRecalculateCadence('weekly')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  scheduleCadence === 'weekly'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 ring-2 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">Semanal</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Entregas espaciadas cada 7 días</div>
              </button>

              <button
                type="button"
                onClick={() => handleRecalculateCadence('dense')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  scheduleCadence === 'dense'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 ring-2 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">Intensivo</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Entregas cada 2 a 3 días</div>
              </button>
            </div>
          </div>

          {/* Step 3: Generated Multi-Subject Activities Preview & Individual Editing */}
          {parsedItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    3. Actividades Detectadas ({parsedItems.length} Tareas Totales)
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir otra tarea</span>
                </button>
              </div>

              {/* Multi-subject coverage indicator badges */}
              <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-500 font-semibold text-[11px]">Materias cubiertas:</span>
                  {Object.entries(subjectDistribution).map(([subId, count]) => {
                    const sub = DEFAULT_SUBJECTS.find((s) => s.id === subId) || DEFAULT_SUBJECTS[0];
                    return (
                      <span
                        key={subId}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex items-center gap-1 shadow-2xs"
                        style={{ backgroundColor: sub.color.replace('bg-', '') === 'blue-600' ? '#2563eb' : sub.color.replace('bg-', '') === 'emerald-600' ? '#059669' : sub.color.replace('bg-', '') === 'amber-600' ? '#d97706' : sub.color.replace('bg-', '') === 'purple-600' ? '#9333ea' : sub.color.replace('bg-', '') === 'rose-600' ? '#e11d48' : sub.color.replace('bg-', '') === 'cyan-600' ? '#0891b2' : sub.color.replace('bg-', '') === 'teal-600' ? '#0d9488' : '#4f46e5' }}
                      >
                        <span>{sub.name}</span>
                        <span className="bg-black/25 px-1 rounded-full text-[9px]">{count}</span>
                      </span>
                    );
                  })}
                </div>

                {/* Filter dropdown if many items */}
                <div className="flex items-center gap-1">
                  <Filter className="w-3 h-3 text-slate-400" />
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="text-[11px] font-semibold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-0.5 text-slate-700 dark:text-slate-300"
                  >
                    <option value="all">Todas ({parsedItems.length})</option>
                    {DEFAULT_SUBJECTS.map((s) => {
                      const count = subjectDistribution[s.id] || 0;
                      if (count === 0) return null;
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-2">
                Cada actividad tiene su <strong>propia materia</strong> y fecha calculada. Puedes editar títulos, cambiar la materia o ajustar fechas libremente:
              </p>

              {/* Task list with individual subject and date controls */}
              <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                {displayedItems.map((item, idx) => {
                  const subject = DEFAULT_SUBJECTS.find((s) => s.id === item.subjectId) || DEFAULT_SUBJECTS[0];
                  const diffCfg = DIFFICULTY_CONFIG[item.difficulty];

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs mb-1.5 flex-wrap">
                          <span className="font-bold text-slate-500">#{idx + 1}</span>

                          {/* Individual Subject Dropdown per Activity! */}
                          <select
                            value={item.subjectId}
                            onChange={(e) => handleUpdateItemSubject(item.id, e.target.value)}
                            className="text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 text-slate-800 dark:text-slate-100 cursor-pointer shadow-2xs"
                          >
                            {DEFAULT_SUBJECTS.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>

                          {/* Difficulty & Alert Days */}
                          <select
                            value={item.difficulty}
                            onChange={(e) => handleUpdateItemDifficulty(item.id, e.target.value as TaskDifficulty)}
                            className="text-[11px] font-bold rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            <option value="leve">Leve (Aviso 1d)</option>
                            <option value="moderada">Moderada (Aviso 2d)</option>
                            <option value="fuerte">Fuerte (Aviso 3d)</option>
                            <option value="muy_fuerte">Muy Fuerte (Aviso 5d)</option>
                          </select>

                          {item.detectedDateFromDoc ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Fecha del archivo
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              Auto-Fecha
                            </span>
                          )}
                        </div>

                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateItemTitle(item.id, e.target.value)}
                          className="w-full text-xs sm:text-sm font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none py-0.5"
                          placeholder="Título de la tarea escolar..."
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <div className="flex items-center gap-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          <input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) => handleUpdateItemDate(item.id, e.target.value)}
                            className="bg-transparent text-slate-900 dark:text-white font-mono focus:outline-none cursor-pointer"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                          title="Eliminar tarea"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="text-xs text-slate-500">
            {parsedItems.length > 0
              ? `Se crearán ${parsedItems.length} tareas en ${Object.keys(subjectDistribution).length} materias con "${file?.name}" adjunto.`
              : 'Sube un archivo o prueba un ejemplo para comenzar.'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting || parsedItems.length === 0}
              onClick={handleConfirmAndSave}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-500" />
              <span>
                {isSubmitting
                  ? 'Guardando fechas...'
                  : `Crear las ${parsedItems.length} Tareas Multi-Materia`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
