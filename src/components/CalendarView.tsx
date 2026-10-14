import React, { useState } from 'react';
import { Task, TaskAttachment } from '../types';
import { DEFAULT_SUBJECTS, DIFFICULTY_CONFIG } from '../utils/constants';
import { calculateTaskUrgency } from '../services/notifications';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertTriangle, Paperclip } from 'lucide-react';

interface Props {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onViewAttachment: (att: TaskAttachment) => void;
  onNewTaskDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<Props> = ({
  tasks,
  onSelectTask,
  onViewAttachment,
  onNewTaskDate,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // In JavaScript getDay(): Sunday is 0, Monday is 1... adjust for Monday-first:
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const totalDays = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Helper to format day cell date YYYY-MM-DD
  const formatCellDate = (dayNumber: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNumber).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const calendarCells = [];
  // Blank padding cells for previous month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push(null);
  }
  // Real days of current month
  for (let day = 1; day <= totalDays; day++) {
    calendarCells.push(day);
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize">
            {monthNames[month]} {year}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            Hoy
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-center text-xs font-bold text-slate-500 py-2.5">
        {daysOfWeek.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/60 auto-rows-fr">
        {calendarCells.map((dayNum, idx) => {
          if (dayNum === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[90px] sm:min-h-[110px] bg-slate-50/30 dark:bg-slate-950/30 p-1.5"
              />
            );
          }

          const cellDateStr = formatCellDate(dayNum);
          const isToday = cellDateStr === todayStr;

          // Find tasks due on this date
          const tasksDueToday = tasks.filter((t) => t.dueDate === cellDateStr);

          return (
            <div
              key={`day-${dayNum}`}
              onClick={() => onNewTaskDate(cellDateStr)}
              className={`min-h-[90px] sm:min-h-[110px] p-1.5 transition group cursor-pointer hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 flex flex-col ${
                isToday ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isToday
                      ? 'bg-indigo-600 text-white font-extrabold shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-600'
                  }`}
                >
                  {dayNum}
                </span>

                {tasksDueToday.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {tasksDueToday.length}
                  </span>
                )}
              </div>

              {/* Task Chips */}
              <div className="space-y-1 flex-1 overflow-hidden">
                {tasksDueToday.slice(0, 3).map((task) => {
                  const subject = DEFAULT_SUBJECTS.find((s) => s.id === task.subjectId);
                  const isCompleted = task.status === 'completada' || task.status === 'entregada';
                  const urgency = calculateTaskUrgency(task);

                  return (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(task);
                      }}
                      className={`px-1.5 py-1 rounded-md text-[11px] font-semibold truncate transition cursor-pointer flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 line-through'
                          : urgency.level === 'critica' || urgency.level === 'vencida'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 font-bold border border-red-200'
                          : urgency.isAlertWindowActive
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      }`}
                      title={`${task.title} (${task.dueTime})`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${subject?.color || 'bg-indigo-500'}`} />
                      <span className="truncate">{task.title}</span>
                    </div>
                  );
                })}

                {tasksDueToday.length > 3 && (
                  <div className="text-[10px] font-semibold text-slate-400 pl-1">
                    +{tasksDueToday.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
