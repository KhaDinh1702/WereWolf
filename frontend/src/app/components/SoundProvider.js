'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';

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
  const buttonAudioRef = useRef(null);
  const bgAudioRef = useRef(null);
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

    document.addEventListener('click', handleInteraction);
    return () => {
      document.removeEventListener('click', handleInteraction);
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }
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
    saveSoundSettings({
      volume,
      isMuted: !isMuted
    });
  };

  const displayVolume = Math.round(volume * 100);

  return (
    <>
      {children}
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-1.5 rounded border border-outline-variant/50 bg-black/75 px-2 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.55)] backdrop-blur-sm">
        <button
          type="button"
          onClick={decreaseVolume}
          disabled={volume === 0}
          aria-label="Giảm âm lượng"
          title="Giảm âm lượng"
          className="h-8 w-8 border border-outline-variant/40 text-primary hover:border-primary hover:bg-secondary/30 disabled:cursor-not-allowed disabled:opacity-35 font-mono-gothic text-base leading-none transition-colors"
        >
          -
        </button>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className={`h-8 w-12 border font-mono-gothic text-[11px] leading-none transition-colors ${
            isMuted || volume === 0
              ? 'border-red-900/70 bg-red-950/40 text-red-300'
              : 'border-primary/60 bg-secondary/20 text-primary hover:bg-secondary/40'
          }`}
        >
          {isMuted || volume === 0 ? 'TẮT' : 'BẬT'}
        </button>
        <button
          type="button"
          onClick={increaseVolume}
          disabled={volume === 1}
          aria-label="Tăng âm lượng"
          title="Tăng âm lượng"
          className="h-8 w-8 border border-outline-variant/40 text-primary hover:border-primary hover:bg-secondary/30 disabled:cursor-not-allowed disabled:opacity-35 font-mono-gothic text-base leading-none transition-colors"
        >
          +
        </button>
        <span className="min-w-10 text-center font-mono-gothic text-[10px] text-on-surface-variant">
          {displayVolume}%
        </span>
      </div>
    </>
  );
}
