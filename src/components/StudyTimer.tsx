import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { playAlertSound } from '../services/audio';
import { Play, Pause, RotateCcw, X, Timer, CheckCircle, Coffee } from 'lucide-react';
import { NexaLogo } from './NexaLogo';

interface Props {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskCompleted?: (task: Task) => void;
}

export const StudyTimer: React.FC<Props> = ({ task, isOpen, onClose }) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 min
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Time is up! Play chime
      playAlertSound('school_bell', 0.85);

      if (mode === 'study') {
        setMode('break');
        setTimeLeft(5 * 60); // 5 min break
      } else {
        setMode('study');
        setTimeLeft(25 * 60);
      }
      setIsRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode]);

  const toggleRun = () => setIsRunning(!isRunning);

  const resetTimer = (newMode: 'study' | 'break' = mode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'study' ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalTime = mode === 'study' ? 25 * 60 : 5 * 60;
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <NexaLogo variant="icon-only" className="w-6 h-6" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Nexa Enfoque · Temporizador
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          {task && (
            <div className="mb-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-left">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                Trabajando en:
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {task.title}
              </h4>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-6">
            <button
              onClick={() => resetTimer('study')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'study'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              25m Estudio
            </button>
            <button
              onClick={() => resetTimer('break')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                mode === 'break'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              5m Descanso
            </button>
          </div>

          {/* Circular / Big Timer Display */}
          <div className="relative w-48 h-48 mx-auto flex items-center justify-center mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className={`transition-all duration-500 ${
                  mode === 'study' ? 'stroke-indigo-600' : 'stroke-emerald-500'
                }`}
                strokeWidth="6"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * progressPercent) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-mono font-extrabold text-slate-900 dark:text-white tracking-tight">
                {timeFormatted}
              </span>
              <span className="text-xs font-semibold text-slate-400 mt-1">
                {mode === 'study' ? 'Enfócate en tu tarea' : 'Momento de estirarte'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => resetTimer()}
              className="p-3 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
              title="Reiniciar temporizador"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={toggleRun}
              className={`px-8 py-3.5 rounded-full font-bold text-white shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-2 ${
                mode === 'study'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Iniciar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
