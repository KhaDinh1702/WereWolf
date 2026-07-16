'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { usePathname } from 'next/navigation';

const VOLUME_KEY = 'werewolf_sound_volume';
const MUTED_KEY = 'werewolf_sound_muted';
const DEFAULT_VOLUME = 0.3;
const DEFAULT_MUTED = false;
const DEFAULT_SNAPSHOT = `${DEFAULT_VOLUME}|${DEFAULT_MUTED}`;
const soundSettingListeners = new Set();

const clampVolume = (value) => Math.min(1, Math.max(0, value));

const getSoundSnapshot = () => {
  if (typeof window === 'undefined') return DEFAULT_SNAPSHOT;

  const savedVolume = Number(localStorage.getItem(VOLUME_KEY));
  const volume = Number.isFinite(savedVolume) ? clampVolume(savedVolume) : DEFAULT_VOLUME;
  const isMuted = localStorage.getItem(MUTED_KEY) === 'true';
  return `${volume}|${isMuted}`;
};

const subscribeSoundSettings = (listener) => {
  soundSettingListeners.add(listener);
  return () => soundSettingListeners.delete(listener);
};

const parseSoundSnapshot = (snapshot) => {
  const [volumeValue, mutedValue] = snapshot.split('|');
  const volume = Number(volumeValue);

  return {
    volume: Number.isFinite(volume) ? clampVolume(volume) : DEFAULT_VOLUME,
    isMuted: mutedValue === 'true'
  };
};

const saveSoundSettings = ({ volume, isMuted }) => {
  localStorage.setItem(VOLUME_KEY, String(volume));
  localStorage.setItem(MUTED_KEY, String(isMuted));
  soundSettingListeners.forEach((listener) => listener());
};

export default function SoundProvider({ children }) {
  const pathname = usePathname();
  const isRoomRoute = pathname?.startsWith('/room/');
  const buttonAudioRef = useRef(null);
  const bgAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const hasStartedBgRef = useRef(false);
  const volumeRef = useRef(DEFAULT_VOLUME);
  const mutedRef = useRef(DEFAULT_MUTED);
  const soundSnapshot = useSyncExternalStore(
    subscribeSoundSettings,
    getSoundSnapshot,
    () => DEFAULT_SNAPSHOT
  );
  const { volume, isMuted } = parseSoundSnapshot(soundSnapshot);

  useEffect(() => {
    volumeRef.current = volume;
    mutedRef.current = isMuted;

    if (buttonAudioRef.current) {
      buttonAudioRef.current.volume = volume;
      buttonAudioRef.current.muted = isMuted || volume === 0;
    }

    if (bgAudioRef.current) {
      bgAudioRef.current.volume = volume;
      bgAudioRef.current.muted = isMuted || volume === 0;

      if (isMuted || volume === 0) {
        bgAudioRef.current.pause();
      } else if (hasStartedBgRef.current) {
        bgAudioRef.current.play().catch(() => {});
      }
    }
  }, [volume, isMuted]);

  useEffect(() => {
    buttonAudioRef.current = new Audio('/sound/button.mp3');
    buttonAudioRef.current.volume = volumeRef.current;
    buttonAudioRef.current.muted = mutedRef.current || volumeRef.current === 0;

    bgAudioRef.current = new Audio('/sound/bg.mp3');
    bgAudioRef.current.volume = volumeRef.current;
    bgAudioRef.current.muted = mutedRef.current || volumeRef.current === 0;
    bgAudioRef.current.loop = true;

    const getAudioContext = () => {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioContextRef.current = new AudioContextClass();
      }
      return audioContextRef.current;
    };

    const playTone = ({ frequency, duration = 0.35, type = 'sine', gain = 0.16, delay = 0 }) => {
      if (mutedRef.current || volumeRef.current === 0) return;

      const audioContext = getAudioContext();
      if (!audioContext) return;

      const startTime = audioContext.currentTime + delay;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain * volumeRef.current, startTime + 0.025);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.03);
    };

    const playEffect = (effect) => {
      if (mutedRef.current || volumeRef.current === 0) return;

      const audioContext = getAudioContext();
      audioContext?.resume?.();

      switch (effect) {
        case 'night':
          playTone({ frequency: 92, duration: 0.9, type: 'sawtooth', gain: 0.12 });
          playTone({ frequency: 138, duration: 0.7, type: 'sine', gain: 0.08, delay: 0.16 });
          break;
        case 'day':
          playTone({ frequency: 392, duration: 0.28, type: 'triangle', gain: 0.09 });
          playTone({ frequency: 587, duration: 0.34, type: 'triangle', gain: 0.08, delay: 0.12 });
          break;
        case 'vote':
        case 'mark':
          playTone({ frequency: 128, duration: 0.18, type: 'square', gain: 0.14 });
          playTone({ frequency: 74, duration: 0.32, type: 'sine', gain: 0.1, delay: 0.08 });
          break;
        case 'wolf':
          playTone({ frequency: 58, duration: 0.42, type: 'sawtooth', gain: 0.18 });
          playTone({ frequency: 87, duration: 0.36, type: 'sawtooth', gain: 0.11, delay: 0.05 });
          break;
        case 'seer':
          playTone({ frequency: 523, duration: 0.24, type: 'sine', gain: 0.08 });
          playTone({ frequency: 784, duration: 0.38, type: 'triangle', gain: 0.08, delay: 0.06 });
          playTone({ frequency: 1046, duration: 0.3, type: 'sine', gain: 0.05, delay: 0.12 });
          break;
        case 'guard':
          playTone({ frequency: 220, duration: 0.25, type: 'triangle', gain: 0.11 });
          playTone({ frequency: 330, duration: 0.35, type: 'triangle', gain: 0.08, delay: 0.1 });
          break;
        case 'reveal':
          playTone({ frequency: 196, duration: 0.18, type: 'triangle', gain: 0.08 });
          playTone({ frequency: 392, duration: 0.34, type: 'triangle', gain: 0.1, delay: 0.1 });
          break;
        case 'start':
          playTone({ frequency: 110, duration: 0.32, type: 'sawtooth', gain: 0.12 });
          playTone({ frequency: 220, duration: 0.45, type: 'triangle', gain: 0.1, delay: 0.16 });
          break;
        case 'end':
          playTone({ frequency: 196, duration: 0.42, type: 'triangle', gain: 0.1 });
          playTone({ frequency: 98, duration: 0.8, type: 'sine', gain: 0.1, delay: 0.18 });
          break;
        case 'whisper':
          playTone({ frequency: 660, duration: 0.08, type: 'sine', gain: 0.035 });
          break;
        default:
          break;
      }
    };

    const handleSoundEffect = (event) => {
      playEffect(event.detail?.effect);
    };

    const handleInteraction = (e) => {
      if (
        !hasStartedBgRef.current &&
        bgAudioRef.current &&
        !mutedRef.current &&
        volumeRef.current > 0
      ) {
        hasStartedBgRef.current = true;
        bgAudioRef.current.play().catch(() => {
          hasStartedBgRef.current = false;
        });
      }

      const target = e.target.closest('button, [role="button"]');
      if (!target || target.disabled || mutedRef.current || volumeRef.current === 0) return;

      try {
        const sound = buttonAudioRef.current.cloneNode();
        sound.volume = volumeRef.current;
        sound.muted = mutedRef.current;
        sound.play().catch(() => {});
      } catch (_) {}
    };

    window.addEventListener('werewolf_sound_effect', handleSoundEffect);
    document.addEventListener('click', handleInteraction);
    return () => {
      window.removeEventListener('werewolf_sound_effect', handleSoundEffect);
      document.removeEventListener('click', handleInteraction);
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }
      audioContextRef.current?.close?.();
    };
  }, []);

  const decreaseVolume = () => {
    saveSoundSettings({
      volume: clampVolume(Number((volume - 0.1).toFixed(2))),
      isMuted
    });
  };

  const increaseVolume = () => {
    saveSoundSettings({
      volume: clampVolume(Number((volume + 0.1).toFixed(2))),
      isMuted: false
    });
  };

  const toggleMute = () => {
    const nextVolume = volume === 0 ? DEFAULT_VOLUME : volume;
    const nextMuted = volume === 0 ? false : !isMuted;

    volumeRef.current = nextVolume;
    mutedRef.current = nextMuted;

    saveSoundSettings({
      volume: nextVolume,
      isMuted: nextMuted
    });

    if (!bgAudioRef.current) return;

    bgAudioRef.current.volume = nextVolume;
    bgAudioRef.current.muted = nextMuted;

    if (nextMuted) {
      bgAudioRef.current.pause();
    } else {
      hasStartedBgRef.current = true;
      bgAudioRef.current.play().catch(() => {
        hasStartedBgRef.current = false;
      });
    }
  };

  const displayVolume = Math.round(volume * 100);
  const isSoundOff = isMuted || volume === 0;

  return (
    <>
      {children}
      <div className={`sound-controls ${isRoomRoute ? 'sound-controls--room' : ''} fixed bottom-4 left-4 z-40 flex items-center gap-1.5 rounded border border-outline-variant/50 bg-black/75 px-2 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.55)] backdrop-blur-sm`}>
        <button
          type="button"
          onClick={decreaseVolume}
          disabled={volume === 0}
          aria-label="Giảm âm lượng"
          title="Giảm âm lượng"
          className="sound-controls__step h-8 w-8 border border-outline-variant/40 text-primary hover:border-primary hover:bg-secondary/30 disabled:cursor-not-allowed disabled:opacity-35 font-body-gothic text-base leading-none transition-colors"
        >
          -
        </button>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isSoundOff ? 'Bật âm thanh' : 'Tắt âm thanh'}
          aria-pressed={isSoundOff}
          title={isSoundOff ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className={`sound-controls__toggle h-8 w-12 border font-body-gothic text-[11px] leading-none transition-colors ${
            isSoundOff
              ? 'border-red-900/70 bg-red-950/40 text-red-300'
              : 'border-primary/60 bg-secondary/20 text-primary hover:bg-secondary/40'
          }`}
        >
          {isSoundOff
            ? <VolumeX aria-hidden="true" />
            : <Volume2 aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={increaseVolume}
          disabled={volume === 1}
          aria-label="Tăng âm lượng"
          title="Tăng âm lượng"
          className="sound-controls__step h-8 w-8 border border-outline-variant/40 text-primary hover:border-primary hover:bg-secondary/30 disabled:cursor-not-allowed disabled:opacity-35 font-body-gothic text-base leading-none transition-colors"
        >
          +
        </button>
        <span className="sound-controls__value min-w-10 text-center font-body-gothic text-[10px] text-on-surface-variant">
          {displayVolume}%
        </span>
      </div>
    </>
  );
}
