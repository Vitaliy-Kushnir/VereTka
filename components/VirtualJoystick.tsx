import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from './LanguageContext';
import { 
  CheckSquareIcon, 
  ClosePathIcon, 
  XSquareIcon, 
  UndoIcon, 
  MagnifierIcon, 
  CrosshairIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PinIcon
} from './icons';
import { MagnifierMode } from '../types';

interface VirtualJoystickProps {
  aimPos: { x: number; y: number };
  setAimPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  canvasWidth: number;
  canvasHeight: number;
  snapStep: number;
  enableSnapping: boolean;
  isDrawing: boolean;
  pointsCount: number;
  onAddPoint?: () => void;
  onUndoPoint?: () => void;
  onComplete?: (isClosed: boolean) => void;
  onCancel?: () => void;
  showMagnifier: MagnifierMode | boolean;
  setShowMagnifier: (mode: MagnifierMode) => void;
  onAimMove?: (pos: { x: number; y: number }) => void;
  activeToolName?: string;
  isDrawingPolyline?: boolean;
  isDrawingBezier?: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  aimPos,
  setAimPos,
  canvasWidth,
  canvasHeight,
  snapStep,
  enableSnapping,
  isDrawing,
  pointsCount,
  onAddPoint,
  onUndoPoint,
  onComplete,
  onCancel,
  showMagnifier,
  setShowMagnifier,
  onAimMove,
  activeToolName,
  isDrawingPolyline,
  isDrawingBezier
}) => {
  const { t } = useLanguage();
  const [isMinimized, setIsMinimized] = useState(false);
  const [dockPosition, setDockPosition] = useState<'left' | 'center' | 'right'>('right');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0); // 0.4x (Fine), 1.0x (Standard), 2.2x (Fast)
  const [isKnobActive, setIsKnobActive] = useState(false);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const touchIdRef = useRef<number | null>(null);
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const aimPosRef = useRef(aimPos);

  // Keep aimPosRef in sync
  useEffect(() => {
    aimPosRef.current = aimPos;
  }, [aimPos]);

  // Haptic feedback helper
  const triggerHaptic = useCallback((pattern: number | number[] = 15) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // ignore
    }
  }, []);

  // Update aim coordinate safely
  const updateAim = useCallback((dx: number, dy: number) => {
    const cur = aimPosRef.current;
    let nx = cur.x + dx;
    let ny = cur.y + dy;

    nx = Math.max(0, Math.min(canvasWidth, nx));
    ny = Math.max(0, Math.min(canvasHeight, ny));

    if (enableSnapping && snapStep > 1) {
      nx = Math.round(nx / snapStep) * snapStep;
      ny = Math.round(ny / snapStep) * snapStep;
    } else {
      nx = Math.round(nx * 10) / 10;
      ny = Math.round(ny * 10) / 10;
    }

    if (nx === cur.x && ny === cur.y) return;

    const clamped = { x: nx, y: ny };
    aimPosRef.current = clamped;
    setAimPos(clamped);
    onAimMove?.(clamped);
  }, [canvasWidth, canvasHeight, enableSnapping, snapStep, setAimPos, onAimMove]);

  // Continuous animation loop for joystick movement
  useEffect(() => {
    const loop = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      const dt = Math.min(50, timestamp - lastTimeRef.current) / 1000; // in seconds
      lastTimeRef.current = timestamp;

      const vx = velocityRef.current.x;
      const vy = velocityRef.current.y;

      if (Math.abs(vx) > 0.001 || Math.abs(vy) > 0.001) {
        const baseSpeed = 230; // pixels per second on canvas at max stick deflection
        const dx = vx * baseSpeed * speedMultiplier * dt;
        const dy = vy * baseSpeed * speedMultiplier * dt;

        updateAim(dx, dy);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [speedMultiplier, updateAim]);

  // Discrete nudge handler
  const handleNudge = (e: React.SyntheticEvent, dx: number, dy: number) => {
    e.stopPropagation();
    e.preventDefault();
    triggerHaptic(10);
    const step = enableSnapping && snapStep > 1 ? snapStep : 1;
    updateAim(dx * step, dy * step);
  };

  // Joystick touch handlers
  const handleJoystickTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!joystickBaseRef.current) return;

    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsKnobActive(true);
    triggerHaptic(15);
    handleJoystickMove(touch.clientX, touch.clientY);
  };

  const handleJoystickMove = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2 - 16; // stick travel boundary

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, maxRadius);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setKnobOffset({ x: knobX, y: knobY });

    // Normalized velocity [-1, 1] with small deadzone
    const deadzone = 4;
    if (dist < deadzone) {
      velocityRef.current = { x: 0, y: 0 };
    } else {
      const normalizedMagnitude = Math.min(1, (clampedDist - deadzone) / (maxRadius - deadzone));
      // Exponential curve for fine precision at small stick tilt
      const curveMag = Math.pow(normalizedMagnitude, 1.35);
      velocityRef.current = {
        x: Math.cos(angle) * curveMag,
        y: Math.sin(angle) * curveMag
      };
    }
  };

  const handleJoystickTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        handleJoystickMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsKnobActive(false);
        setKnobOffset({ x: 0, y: 0 });
        velocityRef.current = { x: 0, y: 0 };
        break;
      }
    }
  };

  // Mouse fallback for desktop testing/emulators
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsKnobActive(true);
    handleJoystickMove(e.clientX, e.clientY);

    const handleMouseMove = (me: MouseEvent) => {
      handleJoystickMove(me.clientX, me.clientY);
    };

    const handleMouseUp = () => {
      setIsKnobActive(false);
      setKnobOffset({ x: 0, y: 0 });
      velocityRef.current = { x: 0, y: 0 };
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const speedLabels = [
    { mult: 0.4, label: '0.4×' },
    { mult: 1.0, label: '1×' },
    { mult: 2.2, label: '2.2×' }
  ];

  const dockClass = 
    dockPosition === 'left' 
      ? 'left-3 sm:left-6 bottom-14' 
      : dockPosition === 'center'
      ? 'left-1/2 -translate-x-1/2 bottom-14'
      : 'right-3 sm:right-6 bottom-14';

  const content = (
    <div
      className={`fixed ${dockClass} z-[9999] select-none pointer-events-auto flex flex-col items-center animate-in fade-in zoom-in-95`}
      style={{ touchAction: 'none' }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {isMinimized ? (
        /* Minimized floating pill */
        <div 
          className="flex items-center gap-2 p-1.5 px-3 bg-neutral-900/95 border-2 border-cyan-500/60 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-xl hover:bg-neutral-800"
        >
          <button
            onTouchStart={(e) => { e.stopPropagation(); triggerHaptic(); setIsMinimized(false); }}
            onClick={(e) => { e.stopPropagation(); triggerHaptic(); setIsMinimized(false); }}
            className="flex items-center gap-2 text-cyan-400 text-xs font-bold"
            title="Розгорнути вікно джойстика"
          >
            <CrosshairIcon size={16} />
            <span>Приціл ({Math.round(aimPos.x)}, {Math.round(aimPos.y)})</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 rounded-full">Розгорнути</span>
          </button>
        </div>
      ) : (
        /* Full Controller Window */
        <div className="flex flex-col bg-neutral-950/95 border-2 border-cyan-500/40 rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(6,182,212,0.2)] backdrop-blur-2xl overflow-hidden max-w-[340px] transition-all">
          
          {/* Window Header / Title Bar */}
          <div className="flex items-center justify-between gap-1.5 px-3 py-1.5 bg-neutral-900/90 border-b border-white/10 text-xs text-zinc-300">
            {/* Reticle Coordinates */}
            <div className="flex items-center gap-1.5 font-mono text-cyan-400 font-bold px-2 py-0.5 bg-cyan-950/70 rounded-lg border border-cyan-800/50 text-[11px]">
              <CrosshairIcon size={13} />
              <span>{Math.round(aimPos.x)}, {Math.round(aimPos.y)}</span>
            </div>

            {/* Speed Toggle */}
            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                triggerHaptic(10);
                const idx = speedLabels.findIndex(s => Math.abs(s.mult - speedMultiplier) < 0.05);
                const nextIdx = (idx + 1) % speedLabels.length;
                setSpeedMultiplier(speedLabels[nextIdx].mult);
              }}
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic(10);
                const idx = speedLabels.findIndex(s => Math.abs(s.mult - speedMultiplier) < 0.05);
                const nextIdx = (idx + 1) % speedLabels.length;
                setSpeedMultiplier(speedLabels[nextIdx].mult);
              }}
              className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-zinc-200 font-semibold text-[11px] transition-all"
              title="Швидкість переміщення прицілу"
            >
              {speedMultiplier === 0.4 ? '🎯 0.4×' : speedMultiplier === 2.2 ? '⚡ 2.2×' : '🚶 1×'}
            </button>

            {/* Magnifier 3-State Toggle (Off / Auto / Pinned) */}
            {(() => {
              const magMode: MagnifierMode = typeof showMagnifier === 'string'
                ? showMagnifier
                : (showMagnifier === true ? 'auto' : 'off');

              const handleToggle = () => {
                triggerHaptic(15);
                if (magMode === 'off') {
                  setShowMagnifier('auto');
                } else if (magMode === 'auto') {
                  setShowMagnifier('pinned');
                } else {
                  setShowMagnifier('off');
                }
              };

              return (
                <button
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleToggle();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle();
                  }}
                  className={`p-1 px-1.5 rounded-lg border flex items-center gap-1 transition-all text-[11px] font-medium ${
                    magMode === 'pinned'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)] font-semibold'
                      : magMode === 'auto'
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                  title={
                    magMode === 'pinned'
                      ? 'Лупа: Зафіксовано 📌 (завжди активна)'
                      : magMode === 'auto'
                        ? 'Лупа: Авто'
                        : 'Лупа: Вимк'
                  }
                >
                  {magMode === 'pinned' ? (
                    <PinIcon size={13} className="text-amber-400" />
                  ) : (
                    <MagnifierIcon size={13} className={magMode === 'auto' ? 'text-cyan-400' : 'opacity-60'} />
                  )}
                  <span className="text-[10px]">
                    {magMode === 'pinned' ? '📌 PIN' : magMode === 'auto' ? 'AUTO' : 'OFF'}
                  </span>
                </button>
              );
            })()}

            {/* Dock Position Switcher: Left -> Center -> Right */}
            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                triggerHaptic(10);
                setDockPosition(prev => prev === 'right' ? 'left' : prev === 'left' ? 'center' : 'right');
              }}
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic(10);
                setDockPosition(prev => prev === 'right' ? 'left' : prev === 'left' ? 'center' : 'right');
              }}
              className="p-1 px-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white active:scale-95 transition-all text-[10px] font-semibold flex items-center gap-0.5"
              title={`Позиція: ${dockPosition === 'left' ? 'Ліворуч' : dockPosition === 'center' ? 'По центру' : 'Праворуч'}`}
            >
              {dockPosition === 'left' ? '◀ Ліво' : dockPosition === 'center' ? '▲ Центр' : 'Право ▶'}
            </button>

            {/* Minimize */}
            <button
              onTouchStart={(e) => { e.stopPropagation(); triggerHaptic(); setIsMinimized(true); }}
              onClick={(e) => { e.stopPropagation(); triggerHaptic(); setIsMinimized(true); }}
              className="p-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white font-bold text-xs active:scale-95"
              title="Згорнути панель"
            >
              —
            </button>
          </div>

          {/* Window Body: Analog Stick + D-Pad + Action Buttons */}
          <div className="flex items-center gap-3.5 p-3.5">
            
            {/* Column 1: Analog Stick & Micro Nudge D-Pad */}
            <div className="relative flex flex-col items-center">
              {/* Analog Stick Disc */}
              <div
                ref={joystickBaseRef}
                onTouchStart={handleJoystickTouchStart}
                onTouchMove={handleJoystickTouchMove}
                onTouchEnd={handleJoystickTouchEnd}
                onMouseDown={handleMouseDown}
                className={`relative w-28 h-28 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-colors border-2 shadow-inner ${
                  isKnobActive 
                    ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.4)]' 
                    : 'bg-neutral-900 border-white/20'
                }`}
                style={{ touchAction: 'none' }}
              >
                {/* Cardinal Direction Guides */}
                <div className="absolute top-1 text-[8px] text-zinc-500 font-bold select-none pointer-events-none">▲</div>
                <div className="absolute bottom-1 text-[8px] text-zinc-500 font-bold select-none pointer-events-none">▼</div>
                <div className="absolute left-1 text-[8px] text-zinc-500 font-bold select-none pointer-events-none">◀</div>
                <div className="absolute right-1 text-[8px] text-zinc-500 font-bold select-none pointer-events-none">▶</div>
                
                {/* Center Reticle Ring */}
                <div className="absolute w-12 h-12 rounded-full border border-dashed border-white/20 pointer-events-none" />

                {/* Draggable Knob */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-75 shadow-xl border ${
                    isKnobActive
                      ? 'bg-gradient-to-b from-cyan-400 to-blue-600 border-white text-white scale-105 shadow-cyan-500/60'
                      : 'bg-gradient-to-b from-neutral-700 to-neutral-800 border-white/35 text-zinc-300'
                  }`}
                  style={{
                    transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white/90 shadow-sm" />
                </div>
              </div>

              {/* Micro-Nudge D-Pad Buttons (1px / 1step) */}
              <div className="grid grid-cols-3 gap-1 mt-2.5 w-28">
                <div />
                <button
                  onTouchStart={(e) => handleNudge(e, 0, -1)}
                  onClick={(e) => handleNudge(e, 0, -1)}
                  className="p-1.5 bg-white/10 hover:bg-cyan-500/30 active:bg-cyan-500 text-zinc-200 hover:text-white rounded-lg flex items-center justify-center active:scale-90 text-xs font-bold border border-white/15 shadow-sm"
                  title="Зсув вгору на 1px"
                >
                  ▲
                </button>
                <div />

                <button
                  onTouchStart={(e) => handleNudge(e, -1, 0)}
                  onClick={(e) => handleNudge(e, -1, 0)}
                  className="p-1.5 bg-white/10 hover:bg-cyan-500/30 active:bg-cyan-500 text-zinc-200 hover:text-white rounded-lg flex items-center justify-center active:scale-90 text-xs font-bold border border-white/15 shadow-sm"
                  title="Зсув вліво на 1px"
                >
                  ◀
                </button>
                <div className="flex items-center justify-center text-[10px] font-mono text-cyan-400 font-bold">
                  {snapStep > 1 && enableSnapping ? `${snapStep}p` : '1px'}
                </div>
                <button
                  onTouchStart={(e) => handleNudge(e, 1, 0)}
                  onClick={(e) => handleNudge(e, 1, 0)}
                  className="p-1.5 bg-white/10 hover:bg-cyan-500/30 active:bg-cyan-500 text-zinc-200 hover:text-white rounded-lg flex items-center justify-center active:scale-90 text-xs font-bold border border-white/15 shadow-sm"
                  title="Зсув вправо на 1px"
                >
                  ▶
                </button>

                <div />
                <button
                  onTouchStart={(e) => handleNudge(e, 0, 1)}
                  onClick={(e) => handleNudge(e, 0, 1)}
                  className="p-1.5 bg-white/10 hover:bg-cyan-500/30 active:bg-cyan-500 text-zinc-200 hover:text-white rounded-lg flex items-center justify-center active:scale-90 text-xs font-bold border border-white/15 shadow-sm"
                  title="Зсув вниз на 1px"
                >
                  ▼
                </button>
                <div />
              </div>
            </div>

            {/* Column 2: Action Pad Buttons */}
            <div className="flex flex-col gap-2.5 justify-center min-w-[100px]">
              {/* Main Action: Add / Commit Point */}
              {onAddPoint && (
                <button
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    triggerHaptic([20, 40, 20]);
                    onAddPoint();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic([20, 40, 20]);
                    onAddPoint();
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-[0_6px_20px_rgba(6,182,212,0.5)] border border-cyan-300/50 transition-transform"
                  title="Поставити точку на полотні (Add Point)"
                >
                  <span className="text-lg leading-none">✚</span>
                  <span>{isDrawing ? `Точка (${pointsCount})` : 'Поставити'}</span>
                </button>
              )}

              {/* Undo Point */}
              {onUndoPoint && pointsCount > 0 && (
                <button
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    triggerHaptic(15);
                    onUndoPoint();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic(15);
                    onUndoPoint();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 active:bg-amber-500/40 text-amber-300 border border-amber-400/40 active:scale-95 text-xs font-semibold rounded-xl transition-all shadow-sm"
                  title="Скасувати останню точку"
                >
                  <UndoIcon size={14} />
                  <span>Скасувати</span>
                </button>
              )}

              {/* Complete Open Path */}
              {onComplete && (isDrawingPolyline || isDrawingBezier) && pointsCount >= 2 && (
                <button
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    triggerHaptic([30, 30]);
                    onComplete(false);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic([30, 30]);
                    onComplete(false);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/25 hover:bg-emerald-500/35 active:bg-emerald-500/50 text-emerald-300 border border-emerald-400/40 active:scale-95 text-xs font-bold rounded-xl transition-all shadow-sm"
                  title="Завершити відкритий контур"
                >
                  <CheckSquareIcon size={15} />
                  <span>Завершити</span>
                </button>
              )}

              {/* Complete Closed Path */}
              {onComplete && (isDrawingPolyline || isDrawingBezier) && pointsCount >= 3 && (
                <button
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    triggerHaptic([30, 30]);
                    onComplete(true);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic([30, 30]);
                    onComplete(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/25 hover:bg-blue-500/35 active:bg-blue-500/50 text-cyan-300 border border-cyan-400/40 active:scale-95 text-xs font-bold rounded-xl transition-all shadow-sm"
                  title="Замкнути контур у фігуру"
                >
                  <ClosePathIcon size={15} />
                  <span>Замкнути</span>
                </button>
              )}

              {/* Cancel Drawing */}
              {onCancel && isDrawing && (
                <button
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    triggerHaptic(20);
                    onCancel();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic(20);
                    onCancel();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 text-red-400 border border-red-400/30 active:scale-95 text-[11px] font-semibold rounded-xl transition-all shadow-sm"
                  title="Скасувати малювання"
                >
                  <XSquareIcon size={14} />
                  <span>{t('action.cancel') || 'Скасувати'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
};
