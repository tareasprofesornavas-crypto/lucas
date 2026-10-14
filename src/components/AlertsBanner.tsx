import React, { useState } from 'react';
import { Task } from '../types';
import { calculateTaskUrgency } from '../services/notifications';
import { DEFAULT_SUBJECTS } from '../utils/constants';
import { AlertTriangle, Clock, ChevronDown, ChevronUp, ArrowRight, Timer } from 'lucide-react';

interface Props {
  alertTasks: Task[];
  onSelectTask: (task: Task) => void;
  onStartStudy: (task: Task) => void;
}

export const AlertsBanner: React.FC<Props> = ({
  alertTasks,
  onSelectTask,
  onStartStudy,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (alertTasks.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-amber-200/60 dark:border-amber-900/40">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
              Avisos Preventivos ({alertTasks.length})
            </h3>
            <span aria-hidden="true" className="text-amber-400 hidden sm:inline">·</span>
            <p className="text-xs text-amber-800/80 dark:text-amber-400/90 hidden sm:inline">
              Tareas que alcanzaron la ventana de 3 a 7 días de antelación
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded text-amber-700 dark:text-amber-400 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition cursor-pointer"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="divide-y divide-amber-200/40 dark:divide-amber-900/30">
          {alertTasks.map((task) => {
            const urgency = calculateTaskUrgency(task);
            const subject = DEFAULT_SUBJECTS.find((s) => s.id === task.subjectId);

            return (
              <div
                key={task.id}
                className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {subject?.name}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <h4
                      onClick={() => onSelectTask(task)}
                      className="font-bold text-slate-900 dark:text-white truncate hover:underline cursor-pointer"
                    >
                      {task.title}
                    </h4>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono tabular-nums text-amber-800 dark:text-amber-300 font-semibold">
                      {urgency.badgeText}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono tabular-nums mt-0.5">
                    <span>Vence: {task.dueDate} {task.dueTime}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-700 dark:text-amber-400 font-sans">{urgency.recommendedAction}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onStartStudy(task)}
                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>Iniciar</span>
                  </button>
                  <button
                    onClick={() => onSelectTask(task)}
                    className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                    title="Ver detalles"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
