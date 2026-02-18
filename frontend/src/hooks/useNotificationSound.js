import { useCallback, useRef, useEffect } from 'react';

export const useNotificationSound = () => {
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);
  const loopIntervalRef = useRef(null);

  useEffect(() => {
    // Pre-load the audio
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.preload = 'auto';
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
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

  // Play sound in a loop until stopped
  const startLoopingSound = useCallback(() => {
    // Stop any existing loop
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
    }
    
    // Play immediately
    playSound();
    
    // Then play every 3 seconds
    loopIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 1.0;
        audioRef.current.play().catch(() => {});
      }
    }, 3000);
  }, [playSound]);

  // Stop the looping sound
  const stopLoopingSound = useCallback(() => {
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Check if sound is looping
  const isLooping = useCallback(() => {
    return loopIntervalRef.current !== null;
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

  return { playSound, startLoopingSound, stopLoopingSound, isLooping, enableAudio };
};
