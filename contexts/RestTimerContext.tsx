"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface RestTimerState {
  sessionId: string | null;
  startTime: number | null;
  totalDuration: number;
  isActive: boolean;
}

interface RestTimerContextType {
  currentTime: number;
  isActive: boolean;
  sessionId: string | null;
  startRestTimer: (sessionId: string, duration: number) => void;
  stopRestTimer: () => void;
  addTime: (seconds: number) => void;
  skipTimer: () => void;
}

const RestTimerContext = createContext<RestTimerContextType | undefined>(undefined);

const STORAGE_KEY = 'dallatrack_rest_timer';

export function RestTimerProvider({ children }: { children: React.ReactNode }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadTimerState = (): RestTimerState | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const saveTimerState = (state: RestTimerState) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error guardando estado del cronómetro:', error);
    }
  };

  const clearTimerState = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  };

  const calculateRemainingTime = (state: RestTimerState): number => {
    if (!state.startTime || !state.isActive) return 0;
    
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const remaining = Math.max(0, state.totalDuration - elapsed);
    
    return remaining;
  };

  const startRestTimer = (newSessionId: string, duration: number) => {
    const state: RestTimerState = {
      sessionId: newSessionId,
      startTime: Date.now(),
      totalDuration: duration,
      isActive: true,
    };

    setSessionId(newSessionId);
    setCurrentTime(duration);
    setIsActive(true);
    saveTimerState(state);
  };

  const stopRestTimer = () => {
    setIsActive(false);
    setCurrentTime(0);
    setSessionId(null);
    clearTimerState();
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const addTime = (seconds: number) => {
    const state = loadTimerState();
    if (!state || !state.isActive) return;

    const newTotalDuration = state.totalDuration + seconds;
    const updatedState: RestTimerState = {
      ...state,
      totalDuration: newTotalDuration,
    };

    setCurrentTime(prev => prev + seconds);
    saveTimerState(updatedState);
  };

  const skipTimer = () => {
    stopRestTimer();
  };

  useEffect(() => {
    const state = loadTimerState();
    
    if (state && state.isActive) {
      const remaining = calculateRemainingTime(state);
      
      if (remaining > 0) {
        setSessionId(state.sessionId);
        setCurrentTime(remaining);
        setIsActive(true);
      } else {
        clearTimerState();
      }
    }
  }, []);

  useEffect(() => {
    if (isActive && currentTime > 0) {
      intervalRef.current = setInterval(() => {
        const state = loadTimerState();
        if (state && state.isActive) {
          const remaining = calculateRemainingTime(state);
          if (remaining > 0) {
            setCurrentTime(remaining);
          } else {
            stopRestTimer();
          }
        } else {
          stopRestTimer();
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, currentTime]);

  const value: RestTimerContextType = {
    currentTime,
    isActive,
    sessionId,
    startRestTimer,
    stopRestTimer,
    addTime,
    skipTimer,
  };

  return (
    <RestTimerContext.Provider value={value}>
      {children}
    </RestTimerContext.Provider>
  );
}

export function useRestTimer() {
  const context = useContext(RestTimerContext);
  if (context === undefined) {
    throw new Error('useRestTimer debe usarse dentro de RestTimerProvider');
  }
  return context;
} 