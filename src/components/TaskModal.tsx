import React, { useState, useRef } from 'react';
import { Task, TaskDifficulty, TaskAttachment, TaskMilestone } from '../types';
import { DEFAULT_SUBJECTS, DIFFICULTY_CONFIG, MAX_FILE_SIZE_BYTES, ALLOWED_FILE_EXTENSIONS, ALLOWED_MIME_TYPES } from '../utils/constants';
import { X, Upload, FileText, Trash2, Eye, AlertCircle, CheckCircle2, Plus, Sparkles, Clock, Calendar, BookOpen } from 'lucide-react';
import { NexaLogo } from './NexaLogo';

interface Props {
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => Promise<void>;
  onViewAttachment: (att: TaskAttachment) => void;
  onOpenAutoSchedule?: () => void;
}

export const TaskModal: React.FC<Props> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onViewAttachment,
  onOpenAutoSchedule,
}) => {
  if (!isOpen) return null;

  // Form state
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [subjectId, setSubjectId] = useState(task?.subjectId || DEFAULT_SUBJECTS[0].id);
  
  // Default deadline: tomorrow at 18:00
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  };

  const [dueDate, setDueDate] = useState(task?.dueDate || defaultDueDate());
  const [dueTime, setDueTime] = useState(task?.dueTime || '18:00');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(task?.difficulty || 'fuerte');
  const [alertDaysBefore, setAlertDaysBefore] = useState<number>(task?.alertDaysBefore ?? 3);
  const [attachments, setAttachments] = useState<TaskAttachment[]>(task?.attachments || []);
  const [milestones, setMilestones] = useState<TaskMilestone[]>(
    task?.milestones || DIFFICULTY_CONFIG[task?.difficulty || 'fuerte'].suggestedSteps.map((step, idx) => ({
      id: `m-init-${idx}`,
      title: step,
      daysBefore: Math.max(1, (task?.alertDaysBefore ?? 3) - idx),
      completed: false,
    }))
  );
  const [newMilestoneText, setNewMilestoneText] = useState('');

  // Upload feedback state
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle difficulty change & auto-suggest alert days
  const handleDifficultyChange = (newDiff: TaskDifficulty) => {
    setDifficulty(newDiff);
    const recommended = DIFFICULTY_CONFIG[newDiff].recommendedAlertDays;
    setAlertDaysBefore(recommended);

    // Auto-update suggested milestones if user hasn't heavily modified them
    const suggested = DIFFICULTY_CONFIG[newDiff].suggestedSteps.map((step, idx) => ({
      id: `m-gen-${Date.now()}-${idx}`,
      title: step,
      daysBefore: Math.max(1, recommended - idx),
      completed: false,
    }));
    setMilestones(suggested);
  };

  // File upload processing
  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const newAttachmentsList: TaskAttachment[] = [...attachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 1. Validate File Size (< 10MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setUploadError(`El archivo "${file.name}" supera el límite permitido de 10 MB.`);
        continue;
      }

      // 2. Validate File Extension / Type
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidExt = ALLOWED_FILE_EXTENSIONS.includes(ext);
      const isValidMime = ALLOWED_MIME_TYPES.includes(file.type) || file.type.startsWith('image/');

      if (!isValidExt && !isValidMime) {
        setUploadError(`Formato no compatible en "${file.name}". Se aceptan archivos PDF, DOCX, DOC y fotos JPG/PNG.`);
        continue;
      }

      // Read as Data URL for offline storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          const newAtt: TaskAttachment = {
            id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            dataUrl: result,
            uploadedAt: new Date().toISOString(),
          };
          setAttachments(prev => [...prev, newAtt]);
        }
      };
      reader.onerror = () => {
        setUploadError(`Error al leer el archivo "${file.name}".`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const addMilestone = () => {
    if (!newMilestoneText.trim()) return;
    const newM: TaskMilestone = {
      id: `m-custom-${Date.now()}`,
      title: newMilestoneText.trim(),
      daysBefore: alertDaysBefore,
      completed: false,
    };
    setMilestones(prev => [...prev, newM]);
    setNewMilestoneText('');
  };

  const toggleMilestone = (id: string) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
  };

  const removeMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const taskPayload: Task = {
        id: task?.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim(),
        description: description.trim(),
        subjectId,
        dueDate,
        dueTime,
        difficulty,
        alertDaysBefore,
        status: task?.status || 'pendiente',
        attachments,
        milestones,
        createdAt: task?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(taskPayload);
      onClose();
    } catch (err) {
      console.error(err);
      setUploadError('Ocurrió un error al guardar la tarea.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <NexaLogo variant="icon-only" className="w-8 h-8" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {task ? 'Editar Tarea Escolar' : 'Nueva Tarea Escolar'}
              </h2>
              <p className="text-xs text-slate-500">
                Nexa: Alertas anticipadas y gestión de documentos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {!task?.id && onOpenAutoSchedule && (
            <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  ¿Tienes un cronograma completo? Puedes <strong>subir 1 solo archivo</strong> y crear todas las fechas de una vez.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAutoSchedule();
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold whitespace-nowrap transition cursor-pointer"
              >
                Auto-Fechas
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Título de la Tarea / Actividad *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Taller de Trigonometría, Maqueta de Célula, Ensayo..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>

          {/* Subject & Difficulty row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Materia / Asignatura
              </label>
              <div className="relative">
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer appearance-none"
                >
                  {DEFAULT_SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nivel de Carga / Dificultad
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['leve', 'moderada', 'fuerte', 'muy_fuerte'] as TaskDifficulty[]).map((d) => {
                  const cfg = DIFFICULTY_CONFIG[d];
                  const isSelected = difficulty === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleDifficultyChange(d)}
                      className={`px-2 py-2 rounded-xl text-xs font-bold text-center border transition cursor-pointer ${
                        isSelected
                          ? `${cfg.bgLightClass} ${cfg.colorClass} ${cfg.borderColorClass} ring-2 ring-indigo-500`
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cfg.badgeLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Smart Alert Configuration Banner */}
          <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Aviso preventivo automático según dificultad:
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 5, 7].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setAlertDaysBefore(days)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          alertDaysBefore === days
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        {days} {days === 1 ? 'día' : 'días'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  {DIFFICULTY_CONFIG[difficulty].description} Sonará y avisará <strong>{alertDaysBefore} días antes</strong> de la fecha límite para evitar entregas a última hora.
                </p>
              </div>
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Fecha Límite de Entrega *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <Calendar className="pointer-events-none absolute right-3 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Hora Límite
              </label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <Clock className="pointer-events-none absolute right-3 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Instrucciones / Apuntes del Profesor
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escribe los requisitos, páginas del libro o indicaciones de entrega..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
            />
          </div>

          {/* Upload Documents Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Documentos de la Tarea (PDF, DOCX, JPG - Máx 10 MB)
              </label>
              <span className="text-xs text-slate-500">
                {attachments.length} {attachments.length === 1 ? 'archivo' : 'archivos'}
              </span>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => processFiles(e.target.files)}
              />
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Arrastra aquí tus guías, rúbricas o fotos del cuaderno
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Soporta <span className="font-semibold text-indigo-600 dark:text-indigo-400">PDF, Word (.docx/.doc) y JPG/PNG</span> hasta 10 MB por archivo
              </p>
            </div>

            {/* Error notice */}
            {uploadError && (
              <div className="mt-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Attachment Chips List */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att) => {
                  const sizeDisplay = att.size >= 1024 * 1024 
                    ? `${(att.size / (1024 * 1024)).toFixed(1)} MB` 
                    : `${Math.round(att.size / 1024)} KB`;

                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                        <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {att.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                          ({sizeDisplay})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onViewAttachment(att)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                          title="Ver archivo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                          title="Eliminar archivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Plan Milestones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Plan de Acción / Hitos Sugeridos por Días
            </label>
            <div className="space-y-1.5 mb-2">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleMilestone(m.id)}
                    className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                  >
                    <CheckCircle2
                      className={`w-4 h-4 flex-shrink-0 ${
                        m.completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                    <span className={m.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'}>
                      {m.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMilestone(m.id)}
                    className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newMilestoneText}
                onChange={(e) => setNewMilestoneText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMilestone(); } }}
                placeholder="Añadir un paso específico (ej: Comprar cartulina)"
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={addMilestone}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSubmitting || !title.trim()}
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-indigo-500/25 transition cursor-pointer"
          >
            {isSubmitting ? 'Guardando...' : task ? 'Guardar Cambios' : 'Crear Tarea'}
          </button>
        </div>
      </div>
    </div>
  );
};
