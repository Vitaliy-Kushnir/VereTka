import { useState, useCallback, useRef } from 'react';

export interface HistoryEntry<T> {
  id: string;
  state: T;
  timestamp: number;
  description?: string;
}

export interface HistoryState<T> {
  state: T;
  history: T[];
  historyEntries: HistoryEntry<T>[];
  currentIndex: number;
  setState: (newState: T | ((prevState: T) => T), description?: string) => void;
  updateCurrentState: (newState: T | ((prevState: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  jumpToIndex: (targetIndex: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (newState: T, description?: string) => void;
}

export function useHistoryState<T>(initialState: T, initialDescription?: string): HistoryState<T> {
  const [entries, setEntries] = useState<HistoryEntry<T>[]>([
    {
      id: `hist-init-${Date.now()}`,
      state: initialState,
      timestamp: Date.now(),
      description: initialDescription,
    }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const setState = useCallback((newStateOrFn: T | ((prevState: T) => T), description?: string) => {
    const curIdx = currentIndexRef.current;
    const curEntries = entriesRef.current;
    const prevState = curEntries[curIdx] ? curEntries[curIdx].state : curEntries[0]?.state;
    const newState = typeof newStateOrFn === 'function' 
      ? (newStateOrFn as (prevState: T) => T)(prevState) 
      : newStateOrFn;
      
    const newEntries = curEntries.slice(0, curIdx + 1);
    newEntries.push({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      state: newState,
      timestamp: Date.now(),
      description,
    });
    
    setEntries(newEntries);
    setCurrentIndex(newEntries.length - 1);
  }, []);

  const updateCurrentState = useCallback((newStateOrFn: T | ((prevState: T) => T)) => {
    const curIdx = currentIndexRef.current;
    setEntries(prev => {
        const newEntries = [...prev];
        if (!newEntries[curIdx]) return prev;
        const newState = typeof newStateOrFn === 'function' 
            ? (newStateOrFn as (prevState: T) => T)(newEntries[curIdx].state) 
            : newStateOrFn;
        newEntries[curIdx] = {
            ...newEntries[curIdx],
            state: newState,
        };
        return newEntries;
    });
  }, []);

  const undo = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
  }, []);

  const redo = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex < entriesRef.current.length - 1 ? prevIndex + 1 : prevIndex));
  }, []);

  const jumpToIndex = useCallback((targetIndex: number) => {
    const maxIdx = entriesRef.current.length - 1;
    const clamped = Math.max(0, Math.min(targetIndex, maxIdx));
    setCurrentIndex(clamped);
  }, []);

  const reset = useCallback((newState: T, description?: string) => {
    setEntries([
      {
        id: `hist-reset-${Date.now()}`,
        state: newState,
        timestamp: Date.now(),
        description,
      }
    ]);
    setCurrentIndex(0);
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < entries.length - 1;

  const history = entries.map(e => e.state);

  return {
    state: entries[currentIndex]?.state ?? initialState,
    history,
    historyEntries: entries,
    currentIndex,
    setState,
    updateCurrentState,
    undo,
    redo,
    jumpToIndex,
    canUndo,
    canRedo,
    reset,
  };
}
