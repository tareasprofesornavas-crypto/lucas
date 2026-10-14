import { SoundOption } from '../types';

let audioCtx: AudioContext | null = null;
let unlockListenerAdded = false;

function ensureAudioUnlock() {
  if (typeof window === 'undefined' || unlockListenerAdded) return;
  unlockListenerAdded = true;
  const unlock = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    window.removeEventListener('click', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('click', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
    ensureAudioUnlock();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const SOUND_NAMES: Record<SoundOption, { name: string; description: string; emoji: string }> = {
  school_bell: {
    name: 'Campana Escolar Clásica',
    description: 'Campanada tradicional de dos tiempos clara y agradable.',
    emoji: '🔔',
  },
  urgent_alarm: {
    name: 'Alarma de Entrega Urgente',
    description: 'Pulsos rápidos para tareas que vencen pronto.',
    emoji: '⏰',
  },
  soft_chime: {
    name: 'Chime Armónico Suave',
    description: 'Arpegio suave para avisos con días de anticipación.',
    emoji: '🎵',
  },
  warning_beep: {
    name: 'Bip Preventivo Dinámico',
    description: 'Doble tono ascendente para recordar inicio de tareas.',
    emoji: '⚡',
  },
  zen_bowl: {
    name: 'Campanada de Enfoque Zen',
    description: 'Tono acústico profundo ideal para sesiones de estudio.',
    emoji: '🧘',
  },
};

/**
 * 1. Classic School Bell (Ding-Dong with warm harmonics)
 */
function playSchoolBell(ctx: AudioContext, masterGain: GainNode) {
  const notes = [659.25, 523.25]; // E5, C5
  notes.forEach((freq, idx) => {
    const startTime = ctx.currentTime + idx * 0.35;
    
    // Fundamental
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    // Harmonic for bell resonance
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.7, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

    gain2.gain.setValueAtTime(0, startTime);
    gain2.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.8);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(masterGain);
    gain2.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + 1.2);
    osc2.start(startTime);
    osc2.stop(startTime + 0.8);
  });
}

/**
 * 2. Urgent Alarm (Triple rapid pulse)
 */
function playUrgentAlarm(ctx: AudioContext, masterGain: GainNode) {
  const pulses = [0, 0.18, 0.36];
  pulses.forEach((timeOffset) => {
    const startTime = ctx.currentTime + timeOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, startTime); // A5
    osc.frequency.setValueAtTime(987.77, startTime + 0.06); // B5

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.6, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + 0.15);
  });
}

/**
 * 3. Soft Chime (C-E-G-C ascending chord)
 */
function playSoftChime(ctx: AudioContext, masterGain: GainNode) {
  const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  chord.forEach((freq, idx) => {
    const startTime = ctx.currentTime + idx * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.5, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + 1.0);
  });
}

/**
 * 4. Warning Beep (Dual rising tone)
 */
function playWarningBeep(ctx: AudioContext, masterGain: GainNode) {
  const tones = [587.33, 880]; // D5, A5
  tones.forEach((freq, idx) => {
    const startTime = ctx.currentTime + idx * 0.2;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.7, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + 0.45);
  });
}

/**
 * 5. Zen Bowl (Deep sustained resonance)
 */
function playZenBowl(ctx: AudioContext, masterGain: GainNode) {
  const baseFreq = 432;
  const startTime = ctx.currentTime;
  
  [1, 2.76, 5.4].forEach((multiplier, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * multiplier, startTime);

    const amp = 0.6 / (idx + 1);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(amp, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.5);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + 2.5);
  });
}

/**
 * Success / Delivery celebration sound (plays on task completed)
 */
export function playDeliverySuccessSound(volume = 0.8) {
  try {
    const ctx = getAudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime);
    masterGain.connect(ctx.destination);

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const duration = idx === notes.length - 1 ? 0.9 : 0.25;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (err) {
    console.warn('Audio playback error', err);
  }
}

/**
 * Main playSound function that works 100% offline
 */
export function playAlertSound(sound: SoundOption, volume = 0.8) {
  try {
    const ctx = getAudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime);
    masterGain.connect(ctx.destination);

    switch (sound) {
      case 'school_bell':
        playSchoolBell(ctx, masterGain);
        break;
      case 'urgent_alarm':
        playUrgentAlarm(ctx, masterGain);
        break;
      case 'soft_chime':
        playSoftChime(ctx, masterGain);
        break;
      case 'warning_beep':
        playWarningBeep(ctx, masterGain);
        break;
      case 'zen_bowl':
        playZenBowl(ctx, masterGain);
        break;
      default:
        playSchoolBell(ctx, masterGain);
    }
  } catch (err) {
    console.warn('AudioContext playback error', err);
  }
}
