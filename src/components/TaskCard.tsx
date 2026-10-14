import React from 'react';
import { Task, TaskAttachment } from '../types';
import { DEFAULT_SUBJECTS, DIFFICULTY_CONFIG } from '../utils/constants';
import { calculateTaskUrgency } from '../services/notifications';
import { playDeliverySuccessSound } from '../services/audio';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  Paperclip,
  CheckCircle2,
  Circle,
  MoreVertical,
  Edit2,
  Trash2,
  Timer,
  AlertTriangle,
  FileCheck2,
  FileText,
} from 'lucide-react';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (task: Task) => void;
  onViewAttachment: (att: TaskAttachment) => void;
  onStartStudyTimer: (task: Task) => void;
}

export const TaskCard: React.FC<Props> = ({
  task,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewAttachment,
  onStartStudyTimer,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const subject = DEFAULT_SUBJECTS.find((s) => s.id === task.subjectId) || DEFAULT_SUBJECTS[0];
  const diffCfg = DIFFICULTY_CONFIG[task.difficulty];
  const urgency = calculateTaskUrgency(task);
  const isCompleted = task.status === 'completada' || task.status === 'entregada';

  const completedMilestones = (task.milestones || []).filter((m) => m.completed).length;
  const totalMilestones = (task.milestones || []).length;
  const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#0f172a', '#3b82f6', '#10b981', '#f59e0b'],
      });
      playDeliverySuccessSound(0.8);
    }
    onToggleStatus(task);
  };

  return (
    <div
      className={`relative rounded-xl border transition-all duration-150 bg-white dark:bg-slate-900 ${
        isCompleted
          ? 'opacity-65 border-slate-200 dark:border-slate-800'
          : urgency.level === 'critica' || urgency.level === 'vencida'
          ? 'border-red-300 dark:border-red-900/60'
          : urgency.isAlertWindowActive
          ? 'border-amber-300 dark:border-amber-900/60'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Unboxed Metadata Header (Zero-Pill Discipline) */}
        <div className="flex items-center justify-between gap-2 mb-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 flex-wrap font-medium">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {subject.name}
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
            <span>{diffCfg.name.split(' ')[0]}</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
            <span className="font-mono tabular-nums">{task.alertDaysBefore}d aviso</span>
          </div>

          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-6 z-30 w-36 rounded-lg bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 py-1 text-xs">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(task);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onStartStudyTimer(task);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer font-medium"
                  >
                    <Timer className="w-3.5 h-3.5" />
                    Modo Enfoque
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(task.id);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Task Title & Checkbox */}
        <div className="flex items-start gap-3 mb-2">
          <button
            onClick={handleToggle}
            className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title={isCompleted ? 'Marcar como pendiente' : 'Marcar como entregada'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50 dark:fill-emerald-950" />
            ) : (
              <Circle className="w-5 h-5 hover:scale-105 transition-transform" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm sm:text-base font-bold leading-snug ${
                isCompleted
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Urgency Alert Message (Clean inline banner) */}
        {!isCompleted && urgency.isAlertWindowActive && (
          <div
            className={`mt-2 mb-3 px-3 py-2 rounded-lg border text-xs flex items-center justify-between ${
              urgency.level === 'critica' || urgency.level === 'vencida'
                ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-1.5 font-medium truncate pr-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{urgency.recommendedAction}</span>
            </div>
            <span className="font-mono font-bold text-[11px] tabular-nums whitespace-nowrap">
              {urgency.badgeText}
            </span>
          </div>
        )}

        {/* Milestones / Action Plan Progress */}
        {totalMilestones > 0 && (
          <div className="mt-2.5 mb-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 font-mono">
              <span className="font-sans">Etapas de avance</span>
              <span className="tabular-nums">{completedMilestones}/{totalMilestones} ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-slate-900 dark:bg-slate-100'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Attachments (Unboxed file items) */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            {task.attachments.map((att) => (
              <button
                key={att.id}
                onClick={() => onViewAttachment(att)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer max-w-[220px] truncate"
                title={`Ver / Descargar ${att.name}`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{att.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Card Footer */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3 font-mono tabular-nums">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {task.dueDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {task.dueTime || '23:59'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {!isCompleted && (
              <button
                onClick={() => onStartStudyTimer(task)}
                className="px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Comenzar sesión de estudio concentrado"
              >
                Enfoque
              </button>
            )}

            <button
              onClick={handleToggle}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                isCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{isCompleted ? 'Entregada' : 'Entregar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
