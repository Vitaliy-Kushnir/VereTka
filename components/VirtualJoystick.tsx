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
  isActionActive?: boolean; // True if a drag/draw action is currently active
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
  isDrawingBezier,
  isActionActive
}) => {
  const { t } = useLanguage();
  const [isMinimized, setIsMinimized] = useState(false);
  const [dockPosition, setDockPosition] = useState<'left' | 'center' | 'right'>('right');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0); // 0.1x, 1x, 5x, 10x steps
  const [isKnobActive, setIsKnobActive] = useState(false);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const touchIdRef = useRef<number | null>(null);
  
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const aimPosRef = useRef(aimPos);
  
  // Ref for long press interval for continuous nudge arrows
  const nudgeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const nudgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleNudge = useCallback((dx: number, dy: number) => {
    triggerHaptic(10);
    const step = (enableSnapping && snapStep > 1 ? snapStep : 1) * speedMultiplier;
    updateAim(dx * step, dy * step);
  }, [enableSnapping, snapStep, speedMultiplier, triggerHaptic, updateAim]);

  const stopNudge = useCallback(() => {
    velocityRef.current = { x: 0, y: 0 };
    if (nudgeTimeoutRef.current) clearTimeout(nudgeTimeoutRef.current);
    if (nudgeIntervalRef.current) clearInterval(nudgeIntervalRef.current);
  }, []);

  const startNudge = (e: React.SyntheticEvent, dx: number, dy: number) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isKnobActive) return; // Ignore D-pad clicks if dragging the knob

    // Initial instant tap movement
    handleNudge(dx, dy);
    
    stopNudge();
    
    // Start cyclical discrete movement if held
    nudgeTimeoutRef.current = setTimeout(() => {
      nudgeIntervalRef.current = setInterval(() => {
        handleNudge(dx, dy);
      }, 150); // Fixed cyclical step repetition
    }, 400); // 400ms delay before repeating
  };

  // Joystick touch handlers
  const handleJoystickTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!joystickBaseRef.current) return;

    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsKnobActive(true);
    triggerHaptic(15);
    updateKnobVisual(touch.clientX, touch.clientY);
  };

  const updateKnobVisual = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    
    const maxRadius = rect.width / 2 - 20; // stick travel boundary

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
        updateKnobVisual(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
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
    updateKnobVisual(e.clientX, e.clientY);

    const handleMouseMove = (me: MouseEvent) => {
      updateKnobVisual(me.clientX, me.clientY);
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
    { mult: 0.1, label: '0.1×' },
    { mult: 1.0, label: '1.0×' },
    { mult: 5.0, label: '5.0×' },
    { mult: 10.0, label: '10.0×' }
  ];

  const dockClass = 
    dockPosition === 'left' 
      ? 'left-3 sm:left-6 bottom-14 max-md:portrait:bottom-[calc(5.5rem+env(safe-area-inset-bottom))]' 
      : dockPosition === 'center'
      ? 'left-1/2 -translate-x-1/2 bottom-14 max-md:portrait:bottom-[calc(5.5rem+env(safe-area-inset-bottom))]'
      : 'right-3 sm:right-6 bottom-14 max-md:portrait:bottom-[calc(5.5rem+env(safe-area-inset-bottom))]';

  // Do not show duplicate buttons for lines/curves since they are on the top bar
  const isPathTool = isDrawingPolyline || isDrawingBezier;

  const content = (
    <div
      className={`fixed ${dockClass} z-[9999] select-none pointer-events-auto flex flex-col items-center animate-in fade-in zoom-in-95`}
      style={{ touchAction: 'none' }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchCancel={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {isMinimized ? (
        <div className="flex items-center gap-2 p-1.5 px-3 bg-neutral-900/90 border-2 border-cyan-500/60 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl hover:bg-neutral-800">
          <button
            onTouchStart={(e) => { e.stopPropagation(); triggerHaptic(); setIsMinimized(false); }}
            onClick={(e) => { e.stopPropagation(); triggerHaptic(); setIsMinimized(false); }}
            className="flex items-center gap-2 text-cyan-400 text-xs font-bold"
            title={t('joystick.expandTitle') || 'Розгорнути вікно джойстика'}
          >
            <CrosshairIcon size={16} />
            <span>{t('joystick.reticle') || 'Приціл'} ({Math.round(aimPos.x)}, {Math.round(aimPos.y)})</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 rounded-full">{t('joystick.expand') || 'Розгорнути'}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col bg-neutral-950/80 border border-white/10 rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden transition-all">
          
          {/* Header */}
          <div className="flex items-center justify-between gap-1 px-2 py-1.5 bg-neutral-900/60 border-b border-white/5 text-xs text-zinc-300">
            <div className="flex items-center gap-1 font-mono text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-950/40 rounded border border-cyan-800/30 text-[10px]">
              <CrosshairIcon size={11} />
              <span>{Math.round(aimPos.x)}, {Math.round(aimPos.y)}</span>
            </div>

            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                triggerHaptic(10);
                const idx = speedLabels.findIndex(s => s.mult === speedMultiplier);
                const nextIdx = (idx + 1) % speedLabels.length;
                setSpeedMultiplier(speedLabels[nextIdx].mult);
              }}
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic(10);
                const idx = speedLabels.findIndex(s => s.mult === speedMultiplier);
                const nextIdx = (idx + 1) % speedLabels.length;
                setSpeedMultiplier(speedLabels[nextIdx].mult);
              }}
              className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-300 font-semibold text-[10px]"
              title={t('joystick.speedTitle') || 'Швидкість переміщення прицілу'}
            >
              {speedMultiplier === 0.1 ? '🎯 0.1×' : speedMultiplier === 5.0 ? '⚡ 5.0×' : speedMultiplier === 10.0 ? '🚀 10.0×' : '🚶 1.0×'}
            </button>

            {(() => {
              const magMode: MagnifierMode = typeof showMagnifier === 'string'
                ? showMagnifier
                : (showMagnifier === true ? 'auto' : 'off');

              const handleToggle = () => {
                triggerHaptic(15);
                if (magMode === 'off') setShowMagnifier('auto');
                else if (magMode === 'auto') setShowMagnifier('pinned');
                else setShowMagnifier('off');
              };

              return (
                <button
                  onTouchStart={(e) => { e.stopPropagation(); handleToggle(); }}
                  onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                  className={`p-0.5 px-1 rounded border flex items-center gap-0.5 text-[10px] font-medium ${
                    magMode === 'pinned' ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : magMode === 'auto' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-transparent border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  <MagnifierIcon size={11} className={magMode === 'pinned' ? 'text-amber-400' : magMode === 'auto' ? 'text-cyan-400' : 'opacity-60'} />
                </button>
              );
            })()}

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
              className="p-0.5 px-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 active:scale-95 text-[10px]"
            >
              {dockPosition === 'left' ? '◀' : dockPosition === 'center' ? '▲' : '▶'}
            </button>

            <button
              onTouchStart={(e) => { e.stopPropagation(); triggerHaptic(); setIsMinimized(true); }}
              onClick={(e) => { e.stopPropagation(); triggerHaptic(); setIsMinimized(true); }}
              className="p-0.5 px-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-400 font-bold text-xs"
            >
              —
            </button>
          </div>

          <div className="flex items-center gap-2 p-2">
            
            {/* Analog Stick Disc */}
            <div
              ref={joystickBaseRef}
              className={`relative w-28 h-28 rounded-full flex items-center justify-center select-none transition-colors border shadow-inner ${
                isKnobActive 
                  ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_24px_rgba(6,182,212,0.3)]' 
                  : 'bg-neutral-900/80 border-white/10'
              }`}
              style={{ touchAction: 'none' }}
            >
              {/* Center Reticle Ring */}
              <div className="absolute w-[48px] h-[48px] rounded-full border border-dashed border-white/20 pointer-events-none" />

              {/* D-Pad Arrow Buttons */}
              <button 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-8 flex items-start justify-center pt-1 text-zinc-500 hover:text-white active:bg-cyan-500/30 rounded-t-full transition-colors z-10 pointer-events-auto"
                onPointerDown={(e) => startNudge(e, 0, -1)}
                onPointerUp={stopNudge}
                onPointerLeave={stopNudge}
                onPointerCancel={stopNudge}
              >
                <span className="text-[10px]">▲</span>
              </button>
              <button 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-8 flex items-end justify-center pb-1 text-zinc-500 hover:text-white active:bg-cyan-500/30 rounded-b-full transition-colors z-10 pointer-events-auto"
                onPointerDown={(e) => startNudge(e, 0, 1)}
                onPointerUp={stopNudge}
                onPointerLeave={stopNudge}
                onPointerCancel={stopNudge}
              >
                <span className="text-[10px]">▼</span>
              </button>
              <button 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-14 flex items-center justify-start pl-1 text-zinc-500 hover:text-white active:bg-cyan-500/30 rounded-l-full transition-colors z-10 pointer-events-auto"
                onPointerDown={(e) => startNudge(e, -1, 0)}
                onPointerUp={stopNudge}
                onPointerLeave={stopNudge}
                onPointerCancel={stopNudge}
              >
                <span className="text-[10px]">◀</span>
              </button>
              <button 
                className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-14 flex items-center justify-end pr-1 text-zinc-500 hover:text-white active:bg-cyan-500/30 rounded-r-full transition-colors z-10 pointer-events-auto"
                onPointerDown={(e) => startNudge(e, 1, 0)}
                onPointerUp={stopNudge}
                onPointerLeave={stopNudge}
                onPointerCancel={stopNudge}
              >
                <span className="text-[10px]">▶</span>
              </button>

              {/* Draggable Knob */}
              <div
                onTouchStart={handleJoystickTouchStart}
                onTouchMove={handleJoystickTouchMove}
                onTouchEnd={handleJoystickTouchEnd}
                onTouchCancel={handleJoystickTouchEnd}
                onMouseDown={handleMouseDown}
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-75 shadow-xl border z-20 pointer-events-auto ${
                  isKnobActive
                    ? 'bg-cyan-500 border-white text-white scale-105 shadow-cyan-500/60'
                    : 'bg-neutral-700/80 border-white/30 text-zinc-300'
                }`}
                style={{
                  transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white/90 shadow-sm pointer-events-none" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-1.5 justify-center min-w-[70px]">
              {onAddPoint && (
                <button
                  onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); triggerHaptic([20, 40]); onAddPoint(); }}
                  className={`flex flex-col items-center justify-center py-2 px-1 ${
                    isActionActive 
                      ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50' 
                      : 'bg-cyan-600/30 text-cyan-300 border-cyan-400/50'
                    } active:scale-95 font-bold rounded-xl border transition-all pointer-events-auto`}
                >
                  <span className="text-sm leading-none">{isActionActive ? '✔️' : '📍'}</span>
                  <span className="text-[9px] mt-0.5">{isActionActive ? (t('joystick.actionFix') || 'Фіксація') : (isPathTool && pointsCount > 0 ? (t('joystick.actionPoint') || 'Точка') : (t('joystick.actionStart') || 'Старт'))}</span>
                </button>
              )}
              {onCancel && (isActionActive || (isPathTool && pointsCount > 0)) && (
                <button
                  onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); triggerHaptic(20); onCancel(); }}
                  className="flex items-center justify-center gap-1 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 active:scale-95 text-[10px] rounded-lg mt-1 pointer-events-auto"
                >
                  <XSquareIcon size={12} /> {t('joystick.actionReset') || 'скинути'}
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

