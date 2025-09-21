
import { useState, useCallback } from 'react';

interface HistoryState<T> {
  state: T;
  setState: (newState: T | ((prevState: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (newState: T) => void;
}

export function useHistoryState<T>(initialState: T): HistoryState<T> {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const setState = useCallback((newStateOrFn: T | ((prevState: T) => T)) => {
    const newState = typeof newStateOrFn === 'function' 
      ? (newStateOrFn as (prevState: T) => T)(history[currentIndex]) 
      : newStateOrFn;
      
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [currentIndex, history]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  }, [currentIndex, history.length]);

  const reset = useCallback((newState: T) => {
    setHistory([newState]);
    setCurrentIndex(0);
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    state: history[currentIndex],
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  };
}
