'use client';

import { useEffect, useRef } from 'react';

export default function SoundProvider({ children }) {
  const buttonAudioRef = useRef(null);
  const bgAudioRef = useRef(null);
  const hasStartedBgRef = useRef(false);

  useEffect(() => {
    buttonAudioRef.current = new Audio('/sound/button.mp3');
    buttonAudioRef.current.volume = 0.5;

    bgAudioRef.current = new Audio('/sound/bg.mp3');
    bgAudioRef.current.volume = 0.3; // Nhạc nền volume nhỏ hơn
    bgAudioRef.current.loop = true;

    const handleInteraction = (e) => {
      // Khởi động nhạc nền nếu chưa chạy
      if (!hasStartedBgRef.current && bgAudioRef.current) {
        hasStartedBgRef.current = true;
        bgAudioRef.current.play().catch(() => {
          hasStartedBgRef.current = false; // Thử lại nếu lỗi
        });
      }

      // Xử lý âm thanh nút bấm
      const target = e.target.closest('button, [role="button"]');
      if (!target || target.disabled) return;

      try {
        const sound = buttonAudioRef.current.cloneNode();
        sound.volume = 0.5;
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

  return children;
}
