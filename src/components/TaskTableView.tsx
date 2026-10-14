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
} from 'lucide-react';

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (task: Task) => void;
  onViewAttachment: (att: TaskAttachment) => void;
  onStartStudyTimer: (task: Task) => void;
}

export const TaskTableView: React.FC<Props> = ({
  tasks,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewAttachment,
  onStartStudyTimer,
}) => {
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  const handleToggle = (task: Task) => {
    const isCompleted = task.status === 'completada' || task.status === 'entregada';
    if (!isCompleted) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#0f172a', '#3b82f6', '#10b981'],
      });
      playDeliverySuccessSound(0.8);
    }
    onToggleStatus(task);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 text-slate-500 font-semibold tracking-wider">
              <th className="py-3 px-4 w-10"></th>
              <th className="py-3 px-4">Tarea</th>
              <th className="py-3 px-4">Materia</th>
              <th className="py-3 px-4">Dificultad</th>
              <th className="py-3 px-4">Alerta Preventiva</th>
              <th className="py-3 px-4">Fecha Límite</th>
              <th className="py-3 px-4">Documentos</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {tasks.map((task) => {
              const subject = DEFAULT_SUBJECTS.find((s) => s.id === task.subjectId) || DEFAULT_SUBJECTS[0];
              const diffCfg = DIFFICULTY_CONFIG[task.difficulty];
              const urgency = calculateTaskUrgency(task);
              const isCompleted = task.status === 'completada' || task.status === 'entregada';

              return (
                <tr
                  key={task.id}
                  className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                    isCompleted ? 'opacity-60 bg-slate-50/20' : ''
                  }`}
                >
                  {/* Status Toggle */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleToggle(task)}
                      className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="w-4 h-4 hover:scale-105" />
                      )}
                    </button>
                  </td>

                  {/* Title & Description */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {task.description}
                      </div>
                    )}
                  </td>

                  {/* Subject */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                    {subject.name}
                  </td>

                  {/* Difficulty */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {diffCfg.name.split(' ')[0]}
                    </span>
                  </td>

                  {/* Smart Alert Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums">
                    {!isCompleted && urgency.isAlertWindowActive ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {urgency.badgeText}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">
                        {task.alertDaysBefore}d antes
                      </span>
                    )}
                  </td>

                  {/* Due Date & Time */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    <div>{task.dueDate}</div>
                    <div className="text-[11px] text-slate-400">{task.dueTime}</div>
                  </td>

                  {/* Attachments */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {task.attachments && task.attachments.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {task.attachments.slice(0, 2).map((att) => (
                          <button
                            key={att.id}
                            onClick={() => onViewAttachment(att)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:text-indigo-600 truncate max-w-[120px]"
                            title={att.name}
                          >
                            <Paperclip className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{att.name}</span>
                          </button>
                        ))}
                        {task.attachments.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            +{task.attachments.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onStartStudyTimer(task)}
                        className="px-2 py-1 rounded text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Modo Enfoque con temporizador"
                      >
                        Enfoque
                      </button>
                      <button
                        onClick={() => onEdit(task)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(task.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
