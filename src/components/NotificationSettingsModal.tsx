import React, { useState } from 'react';
import { UserSettings, SoundOption } from '../types';
import { SOUND_NAMES, playAlertSound } from '../services/audio';
import { requestNotificationPermission } from '../services/notifications';
import { X, Volume2, VolumeX, Bell, Play, Check, Sparkles, AlertCircle } from 'lucide-react';

import { NexaLogo } from './NexaLogo';

interface Props {
  settings: UserSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: UserSettings) => Promise<void>;
}

export const NotificationSettingsModal: React.FC<Props> = ({
  settings,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [selectedSound, setSelectedSound] = useState<SoundOption>(settings.selectedSound);
  const [volume, setVolume] = useState(settings.volume);
  const [defaultAlertDays, setDefaultAlertDays] = useState(settings.defaultAlertDays || 3);
  const [browserPerm, setBrowserPerm] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [previewingSound, setPreviewingSound] = useState<string | null>(null);

  const handleTestSound = (sound: SoundOption) => {
    setPreviewingSound(sound);
    playAlertSound(sound, volume);
    setTimeout(() => setPreviewingSound(null), 1000);
  };

  const handleRequestBrowserPerm = async () => {
    const granted = await requestNotificationPermission();
    setBrowserPerm(granted ? 'granted' : 'denied');
  };

  const handleSave = async () => {
    const updated: UserSettings = {
      ...settings,
      soundEnabled,
      selectedSound,
      volume,
      defaultAlertDays,
      browserNotificationsEnabled: browserPerm === 'granted',
    };
    await onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <NexaLogo variant="icon-only" className="w-8 h-8" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Nexa · Alertas y Sonidos
              </h2>
              <p className="text-xs text-slate-500">Configuración de aviso anticipado para tareas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Default Alert Timing (3, 5, 7 days) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Antelación Predeterminada de Aviso
            </label>
            <p className="text-xs text-slate-500 mb-3">
              ¿Con cuántos días de anticipación deseas que la app empiece a avisarte para realizar tareas pesadas?
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {[3, 5, 7].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDefaultAlertDays(days)}
                  className={`py-3 px-3 rounded-xl border text-center transition cursor-pointer ${
                    defaultAlertDays === days
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                    {days} días
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {days === 3 ? 'Estándar fuerte' : days === 5 ? 'Proyectos medios' : 'Proyectos finales'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sound enable & volume */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Sonidos de Alarma Offline
                  </span>
                  <p className="text-xs text-slate-500">
                    Sintetizados en tu equipo sin necesitar conexión a internet
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {soundEnabled && (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>Volumen del timbre</span>
                  <span className="font-mono font-bold">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Sound selection list with Preview Test Buttons */}
          {soundEnabled && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                Timbre de Notificación Personalizable
              </label>
              <div className="space-y-2">
                {(Object.keys(SOUND_NAMES) as SoundOption[]).map((sndKey) => {
                  const snd = SOUND_NAMES[sndKey];
                  const isSelected = selectedSound === sndKey;

                  return (
                    <div
                      key={sndKey}
                      onClick={() => setSelectedSound(sndKey)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-xl flex-shrink-0">{snd.emoji}</span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {snd.name}
                            {isSelected && <Check className="w-4 h-4 text-indigo-600 inline" />}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">{snd.description}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestSound(sndKey);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer flex-shrink-0 ${
                          previewingSound === sndKey
                            ? 'bg-indigo-600 text-white animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                        title="Probar sonido en este momento"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Probar</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Browser System Notifications */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Notificaciones del Sistema
                </h4>
                <p className="text-xs text-slate-500">
                  Muestra avisos mientras la aplicación sigue abierta y el navegador permite notificarlos. No garantiza alertas con la app cerrada.
                </p>
              </div>

              {browserPerm === 'granted' ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Activas
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestBrowserPerm}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Permitir
                </button>
              )}
            </div>

            {browserPerm === 'denied' && (
              <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Permiso bloqueado en el navegador. Puedes activarlo en los ajustes del sitio.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
          >
            Guardar Preferencias
          </button>
        </div>
      </div>
    </div>
  );
};
