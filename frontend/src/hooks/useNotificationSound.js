import { useCallback, useRef, useEffect } from 'react';

export const useNotificationSound = () => {
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    // Pre-load the audio
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.preload = 'auto';
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playSound = useCallback(async () => {
    if (isPlayingRef.current || !audioRef.current) return;
    
    try {
      isPlayingRef.current = true;
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1.0;
      await audioRef.current.play();
      
      // Reset after sound finishes
      setTimeout(() => {
        isPlayingRef.current = false;
      }, 2000);
    } catch (error) {
      console.log('Audio play failed:', error);
      isPlayingRef.current = false;
    }
  }, []);

  // Enable audio on user interaction
  const enableAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }).catch(() => {});
    }
  }, []);

  return { playSound, enableAudio };
};
