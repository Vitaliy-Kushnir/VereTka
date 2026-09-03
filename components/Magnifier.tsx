import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ViewTransform } from '../types';
import { MagnifierIcon, XIcon, PinIcon, TargetIcon } from './icons';
import { useLanguage } from './LanguageContext';

interface MagnifierProps {
  visible: boolean;
  canvasPos: { x: number; y: number } | null;
  rawPointerPos: { x: number; y: number } | null;
  viewTransform?: ViewTransform;
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasWidth: number;
  canvasHeight: number;
  canvasBgColor: string;
  showGrid: boolean;
  gridSize: number;
  zoomLevel?: number;
  isPinned?: boolean;
  onTogglePin?: () => void;
  isAnchored?: boolean;
  anchorPos?: { x: number; y: number } | null;
  onToggleAnchor?: () => void;
  onMagnifierCenterChange?: (center: { x: number; y: number; radius: number }) => void;
  onClose?: () => void;
}

const ZOOM_LEVELS = [2.0, 3.0, 4.5, 6.5, 10.0];
const SIZE_PRESETS = [100, 150, 200, 260, 320];

export const Magnifier: React.FC<MagnifierProps> = ({
  visible,
  canvasPos,
  rawPointerPos,
  viewTransform,
  containerRef,
  canvasWidth,
  canvasHeight,
  canvasBgColor,
  showGrid,
  gridSize,
  zoomLevel: initialZoom = 3.0,
  isPinned = false,
  onTogglePin,
  isAnchored = false,
  anchorPos = null,
  onToggleAnchor,
  onMagnifierCenterChange,
  onClose,
}) => {
  const { t } = useLanguage();
  const [currentZoom, setCurrentZoom] = useState<number>(initialZoom);
  const [loupeSize, setLoupeSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('vc_magnifier_size');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 100 && parsed <= 360) return parsed;
      }
    } catch {
      // fallback
    }
    return 170;
  });

  const [customPosition, setCustomPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Controls visibility state with auto-hide timer
  const [showControls, setShowControls] = useState<boolean>(false);
  const controlsTimeoutRef = useRef<number | null>(null);

  const revealControls = useCallback((duration = 3500) => {
    setShowControls(true);
    if (controlsTimeoutRef.current !== null) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current !== null) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Dragging states
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startX: number; startY: number } | null>(null);

  // Resizing states
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ pointerX: number; pointerY: number; startSize: number; startPosX: number; startPosY: number } | null>(null);

  const loupeRef = useRef<HTMLDivElement>(null);

  // Cycle zoom when clicking on zoom badge (up to 10x)
  const handleCycleZoom = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    revealControls(4000);
    setCurrentZoom(prev => {
      const idx = ZOOM_LEVELS.findIndex(z => Math.abs(z - prev) < 0.15);
      const nextIdx = (idx + 1) % ZOOM_LEVELS.length;
      return ZOOM_LEVELS[nextIdx];
    });
  };

  // Cycle size preset on click of resize button
  const handleCycleSize = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    revealControls(4000);
    setLoupeSize(prev => {
      const idx = SIZE_PRESETS.findIndex(s => Math.abs(s - prev) < 25);
      const nextIdx = (idx + 1) % SIZE_PRESETS.length;
      const newSize = SIZE_PRESETS[nextIdx];
      try {
        localStorage.setItem('vc_magnifier_size', String(newSize));
      } catch {}
      return newSize;
    });
  };

  // Move / Drag Handlers
  const startDrag = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    revealControls(4000);
    const curX = customPosition ? customPosition.x : 16;
    const curY = customPosition ? customPosition.y : 16;

    dragStartRef.current = {
      pointerX: clientX,
      pointerY: clientY,
      startX: curX,
      startY: curY,
    };
    setIsDragging(true);
  };

  const onDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragStartRef.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const deltaX = clientX - dragStartRef.current.pointerX;
    const deltaY = clientY - dragStartRef.current.pointerY;

    let nextX = dragStartRef.current.startX + deltaX;
    let nextY = dragStartRef.current.startY + deltaY;

    // Clamp within container
    nextX = Math.max(8, Math.min(containerRect.width - loupeSize - 8, nextX));
    nextY = Math.max(8, Math.min(containerRect.height - loupeSize - 8, nextY));

    setCustomPosition({ x: nextX, y: nextY });
  }, [containerRef, loupeSize]);

  // Resize Handlers
  const startResize = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    revealControls(4000);
    const curX = customPosition ? customPosition.x : 16;
    const curY = customPosition ? customPosition.y : 16;

    resizeStartRef.current = {
      pointerX: clientX,
      pointerY: clientY,
      startSize: loupeSize,
      startPosX: curX,
      startPosY: curY,
    };
    setIsResizing(true);
  };

  const onResizeMove = useCallback((clientX: number, clientY: number) => {
    if (!resizeStartRef.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const deltaX = clientX - resizeStartRef.current.pointerX;
    const deltaY = clientY - resizeStartRef.current.pointerY;
    
    // Average delta for smooth proportional circular expansion
    const delta = (deltaX + deltaY) / 1.4;
    let newSize = Math.round(resizeStartRef.current.startSize + delta);

    const maxSize = Math.min(360, containerRect.width - 32, containerRect.height - 32);
    newSize = Math.max(100, Math.min(maxSize, newSize));

    setLoupeSize(newSize);
    try {
      localStorage.setItem('vc_magnifier_size', String(newSize));
    } catch {}
  }, [containerRef]);

  const endDragOrResize = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    dragStartRef.current = null;
    resizeStartRef.current = null;
    revealControls(3000);
  }, [revealControls]);

  const [isGlobalPointerDown, setIsGlobalPointerDown] = useState(false);
  useEffect(() => {
    const onPtrDown = (e: PointerEvent) => {
      if ((e.target as Element | undefined)?.closest?.('[data-magnifier="true"]')) return;
      setIsGlobalPointerDown(true);
    };
    const onPtrUp = () => setIsGlobalPointerDown(false);
    
    window.addEventListener('pointerdown', onPtrDown, { capture: true });
    window.addEventListener('pointerup', onPtrUp, { capture: true });
    window.addEventListener('pointercancel', onPtrUp, { capture: true });
    
    return () => {
      window.removeEventListener('pointerdown', onPtrDown, { capture: true });
      window.removeEventListener('pointerup', onPtrUp, { capture: true });
      window.removeEventListener('pointercancel', onPtrUp, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (isDragging) onDragMove(e.clientX, e.clientY);
      if (isResizing) onResizeMove(e.clientX, e.clientY);
    };
    const handleMouseUp = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      endDragOrResize();
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.touches[0]) {
        if (isDragging) onDragMove(e.touches[0].clientX, e.touches[0].clientY);
        if (isResizing) onResizeMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      e.stopPropagation();
      endDragOrResize();
    };

    window.addEventListener('mousemove', handleMouseMove, { capture: true });
    window.addEventListener('mouseup', handleMouseUp, { capture: true });
    window.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });
    window.addEventListener('touchend', handleTouchEnd, { capture: true });
    window.addEventListener('touchcancel', handleTouchEnd, { capture: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
      window.removeEventListener('touchmove', handleTouchMove, { capture: true });
      window.removeEventListener('touchend', handleTouchEnd, { capture: true });
      window.removeEventListener('touchcancel', handleTouchEnd, { capture: true });
    };
  }, [isDragging, isResizing, onDragMove, onResizeMove, endDragOrResize]);

  useEffect(() => {
    if (!visible || !containerRef.current || isDragging || isResizing || !isGlobalPointerDown || !canvasPos) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerW = containerRect.width;
    const containerH = containerRect.height;
    
    let targetScreenX = rawPointerPos?.x;
    let targetScreenY = rawPointerPos?.y;

    if (targetScreenX === undefined || targetScreenY === undefined) {
      if (viewTransform) {
        targetScreenX = canvasPos.x * viewTransform.scale + viewTransform.x;
        targetScreenY = canvasPos.y * viewTransform.scale + viewTransform.y;
      } else {
        targetScreenX = containerW / 2;
        targetScreenY = containerH / 2;
      }
    }

    let posX = customPosition ? customPosition.x : 16;
    let posY = customPosition ? customPosition.y : 16;
    
    const loupeCenterX = posX + loupeSize / 2;
    const loupeCenterY = posY + loupeSize / 2;
    const distToTarget = Math.hypot(targetScreenX - loupeCenterX, targetScreenY - loupeCenterY);
    const dangerZoneRadius = loupeSize / 2 + 35; // 35px safety buffer around circle

    if (distToTarget < dangerZoneRadius) {
      const corners = [
        { x: 16, y: 16 }, // top-left
        { x: containerW - loupeSize - 16, y: 16 }, // top-right
        { x: containerW - loupeSize - 16, y: Math.max(16, containerH - loupeSize - 16) }, // bottom-right
        { x: 16, y: Math.max(16, containerH - loupeSize - 16) }, // bottom-left
      ];

      let bestCorner = corners[1];
      let maxDist = -1;

      for (const corner of corners) {
        const cX = corner.x + loupeSize / 2;
        const cY = corner.y + loupeSize / 2;
        const d = Math.hypot(targetScreenX - cX, targetScreenY - cY);
        if (d > maxDist) {
          maxDist = d;
          bestCorner = corner;
        }
      }

      setCustomPosition(bestCorner);
    }
  }, [visible, isDragging, isResizing, isGlobalPointerDown, rawPointerPos, canvasPos, viewTransform, customPosition, loupeSize, containerRef]);

  const effectiveMagnifierScale = (viewTransform?.scale || 1) * currentZoom;

  // Compute grid line colors identical to canvas zoom rendering
  const gridStrokeColor = useMemo(() => {
    const hex = (canvasBgColor || '#ffffff').replace('#', '');
    if (hex.length < 6) return 'rgba(0, 0, 0, 0.2)';
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    const baseOpacity = 0.15;
    const scaleFactor = Math.log10(Math.max(1, effectiveMagnifierScale));
    const finalOpacity = Math.min(baseOpacity + scaleFactor * 0.25, 0.75);

    return brightness < 128 ? `rgba(255, 255, 255, ${finalOpacity})` : `rgba(0, 0, 0, ${finalOpacity})`;
  }, [canvasBgColor, effectiveMagnifierScale]);

  const fineGridStrokeColor = useMemo(() => {
    const hex = (canvasBgColor || '#ffffff').replace('#', '');
    if (hex.length < 6) return 'rgba(0, 0, 0, 0.1)';
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    const baseOpacity = 0.07;
    const scaleFactor = Math.log10(Math.max(1, effectiveMagnifierScale));
    const finalOpacity = Math.min(baseOpacity + scaleFactor * 0.1, 0.5);

    return brightness < 128 ? `rgba(255, 255, 255, ${finalOpacity})` : `rgba(0, 0, 0, ${finalOpacity})`;
  }, [canvasBgColor, effectiveMagnifierScale]);

  const layout = useMemo(() => {
    if (!visible || !canvasPos || !containerRef.current) {
      return null;
    }

    const cx = canvasPos.x;
    const cy = canvasPos.y;

    if (isNaN(cx) || isNaN(cy) || !isFinite(cx) || !isFinite(cy)) {
      return null;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerW = containerRect.width;
    const containerH = containerRect.height;

    // Calculate pointer / target position in screen coords
    let targetScreenX = rawPointerPos?.x;
    let targetScreenY = rawPointerPos?.y;

    if (targetScreenX === undefined || targetScreenY === undefined) {
      if (viewTransform) {
        targetScreenX = cx * viewTransform.scale + viewTransform.x;
        targetScreenY = cy * viewTransform.scale + viewTransform.y;
      } else {
        targetScreenX = containerW / 2;
        targetScreenY = containerH / 2;
      }
    }

    // Base position: default top-left (16, 16) or user custom dragged pos
    let posX = customPosition ? customPosition.x : 16;
    let posY = customPosition ? customPosition.y : 16;

    // Clamping within container view
    posX = Math.max(8, Math.min(containerW - loupeSize - 8, posX));
    posY = Math.max(8, Math.min(containerH - loupeSize - 8, posY));

    return {
      cx,
      cy,
      containerW,
      containerH,
      posX,
      posY,
      center: {
        x: posX + loupeSize / 2,
        y: posY + loupeSize / 2,
        radius: loupeSize / 2,
      }
    };
  }, [visible, canvasPos, containerRef, rawPointerPos, viewTransform, customPosition, loupeSize]);

  const prevCenterRef = useRef<{ x: number; y: number; radius: number } | null>(null);

  useEffect(() => {
    if (layout?.center && onMagnifierCenterChange) {
      const prev = prevCenterRef.current;
      const cur = layout.center;
      if (!prev || Math.abs(prev.x - cur.x) > 0.5 || Math.abs(prev.y - cur.y) > 0.5 || prev.radius !== cur.radius) {
        prevCenterRef.current = cur;
        onMagnifierCenterChange(cur);
      }
    }
  }, [layout?.center?.x, layout?.center?.y, layout?.center?.radius, onMagnifierCenterChange]);

  if (!layout) {
    return null;
  }

  const { cx, cy, containerW, containerH, posX, posY } = layout;

  // Canvas visible radius in SVG units
  const canvasVisibleRadius = Math.max(4, (loupeSize / 2) / currentZoom);

  // Constant invariant stroke widths regardless of zoom factor (1px on screen)
  const crosshairStrokeWidth = 1.0 / currentZoom;
  const reticleRingStrokeWidth = 1.2 / currentZoom;
  const centerDotRadius = 1.8 / currentZoom;
  const targetRingRadius = 4.5 / currentZoom;
  const gridStrokeWidth = 1.0 / currentZoom;

  const areControlsActive = showControls || isDragging || isResizing;
  const reticleColor = isAnchored ? '#10b981' : (isPinned ? '#fbbf24' : '#00d2ff');

  return (
    <div
      ref={loupeRef}
      data-magnifier="true"
      className={`absolute z-[90] select-none pointer-events-auto transition-all ${
        isDragging || isResizing ? 'duration-0 cursor-grabbing shadow-2xl scale-102' : 'duration-300 ease-out cursor-grab'
      }`}
      style={{
        left: `${posX}px`,
        top: `${posY}px`,
        width: `${loupeSize}px`,
        height: `${loupeSize}px`,
        touchAction: 'none'
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        revealControls(3500);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        revealControls(3500);
        if ((e.target as HTMLElement | undefined)?.closest?.('button')) return;
        startDrag(e.clientX, e.clientY);
      }}
      onMouseMove={(e) => {
        e.stopPropagation();
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        revealControls(3500);
        if ((e.target as HTMLElement | undefined)?.closest?.('button')) return;
        if (e.touches[0]) {
          startDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        revealControls(3500);
      }}
      onMouseEnter={() => {
        revealControls(3500);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Outer Glow Ring & Circular Frame */}
      <div className={`relative w-full h-full rounded-full p-[3px] backdrop-blur-xl animate-in fade-in zoom-in-95 transition-all duration-300 ${
        isAnchored
          ? 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(16,185,129,0.5)]'
          : isPinned 
            ? 'bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-600 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(245,158,11,0.5)]' 
            : 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-500 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(6,182,212,0.4)]'
      }`}>
        
        {/* Inner Circular Lens */}
        <div className="w-full h-full rounded-full overflow-hidden relative border-2 border-white/70 bg-neutral-950 flex items-center justify-center shadow-inner">
          
          {/* SVG Canvas Area Mirror */}
          <div className="w-full h-full pointer-events-none">
            <svg
              viewBox={`${cx - canvasVisibleRadius} ${cy - canvasVisibleRadius} ${canvasVisibleRadius * 2} ${canvasVisibleRadius * 2}`}
              className="w-full h-full"
              style={{ shapeRendering: 'geometricPrecision' }}
            >
              <defs>
                {/* Canvas edge drop shadow */}
                <filter id="magnifier-canvas-shadow" x="-5%" y="-5%" width="110%" height="110%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.35" />
                </filter>
                {/* Scaled grid pattern matching canvas style */}
                {showGrid && (
                  <pattern
                    id="magnifier-grid-pattern"
                    width={gridSize}
                    height={gridSize}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                      fill="none"
                      stroke={gridStrokeColor}
                      strokeWidth={gridStrokeWidth}
                    />
                  </pattern>
                )}
                {showGrid && effectiveMagnifierScale > 10 && (
                  <pattern
                    id="magnifier-fine-grid-pattern"
                    width="1"
                    height="1"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 1 0 L 0 0 0 1"
                      fill="none"
                      stroke={fineGridStrokeColor}
                      strokeWidth={gridStrokeWidth}
                    />
                  </pattern>
                )}
              </defs>

              {/* Workspace / Outside Canvas Space Background (Gray area outside the canvas) */}
              <rect
                x={cx - canvasVisibleRadius}
                y={cy - canvasVisibleRadius}
                width={canvasVisibleRadius * 2}
                height={canvasVisibleRadius * 2}
                fill="var(--bg-secondary, #374151)"
              />

              {/* Canvas Sheet Rectangle (Only within workspace [0, 0, canvasWidth, canvasHeight]) */}
              <rect
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
                fill={canvasBgColor || '#ffffff'}
                filter="url(#magnifier-canvas-shadow)"
                stroke="rgba(0, 0, 0, 0.12)"
                strokeWidth={0.75 / currentZoom}
              />

              {/* Grid Overlay strictly constrained to the canvas sheet dimensions */}
              {showGrid && (
                <rect
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  fill="url(#magnifier-grid-pattern)"
                />
              )}
              {showGrid && effectiveMagnifierScale > 10 && (
                <rect
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  fill="url(#magnifier-fine-grid-pattern)"
                />
              )}

              {/* Canvas Shapes Mirror via SVG <use> */}
              <use href="#canvas-shapes-layer" />

              {/* Constant Precision Crosshair Lines */}
              <line
                x1={cx - canvasVisibleRadius}
                y1={cy}
                x2={cx + canvasVisibleRadius}
                y2={cy}
                stroke={reticleColor}
                strokeWidth={crosshairStrokeWidth}
                strokeDasharray={`${3 / currentZoom},${2 / currentZoom}`}
              />
              <line
                x1={cx}
                y1={cy - canvasVisibleRadius}
                x2={cx}
                y2={cy + canvasVisibleRadius}
                stroke={reticleColor}
                strokeWidth={crosshairStrokeWidth}
                strokeDasharray={`${3 / currentZoom},${2 / currentZoom}`}
              />

              {/* Center Target Rings & Invariant Dot */}
              <circle
                cx={cx}
                cy={cy}
                r={targetRingRadius}
                fill="none"
                stroke={reticleColor}
                strokeWidth={reticleRingStrokeWidth}
              />
              <circle
                cx={cx}
                cy={cy}
                r={centerDotRadius}
                fill={reticleColor}
                stroke="#ffffff"
                strokeWidth={0.5 / currentZoom}
              />
            </svg>
          </div>

          {/* Floating Zoom Switcher Button (Top Center of Lens) - Only shown on tap / interaction */}
          <button
            type="button"
            onTouchStart={handleCycleZoom}
            onClick={handleCycleZoom}
            className={`absolute top-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-neutral-950/90 hover:bg-neutral-850 border border-cyan-400/80 shadow-lg text-[9.5px] font-mono font-extrabold text-cyan-300 active:scale-90 flex items-center gap-1 z-30 transition-all duration-300 cursor-pointer backdrop-blur-md ${
              areControlsActive ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
            }`}
            title="Натисніть для зміни масштабу (2x → 3x → 4.5x → 6.5x → 10x)"
          >
            <MagnifierIcon size={10} className="text-cyan-400" />
            <span>{currentZoom >= 10 ? '10×' : `${currentZoom.toFixed(1)}×`}</span>
          </button>

          {/* Coordinates HUD (Bottom Center of Lens) - Fades in with controls or is subtle */}
          <div
            className={`notranslate absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full border text-[8.5px] font-mono font-bold shadow-md pointer-events-none backdrop-blur-md whitespace-nowrap z-20 transition-opacity duration-300 flex items-center gap-1 ${
              isAnchored
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                : isPinned
                  ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                  : 'bg-black/85 border-white/20 text-white'
            } ${
              areControlsActive ? 'opacity-100' : 'opacity-40'
            }`}
            translate="no"
          >
            {isAnchored ? <span key="hud-anchor-icon" className="text-[9px] select-none" translate="no">🎯</span> : null}
            <span key="hud-coords-text" className="select-none" translate="no">{Math.round(cx)}, {Math.round(cy)}</span>
          </div>

        </div>
      </div>

      {/* Floating Pin / Unpin Button (Snug top-left corner hugging the circular rim) */}
      {onTogglePin && (
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            revealControls(4000);
            onTogglePin();
          }}
          className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center border-[1.5px] z-50 active:scale-85 transition-all duration-300 cursor-pointer ${
            isPinned 
              ? 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black border-white shadow-[0_2px_8px_rgba(245,158,11,0.7),0_0_10px_rgba(245,158,11,0.5)]' 
              : 'bg-neutral-900/90 hover:bg-neutral-800 text-cyan-300 hover:text-white border-white/50 shadow-[0_2px_8px_rgba(0,0,0,0.6)]'
          } ${
            areControlsActive ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
          }`}
          title={isPinned ? 'Відшпилити лупу (режим авто)' : 'Пришпилити лупу (завжди на екрані)'}
          aria-label={isPinned ? 'Відшпилити лупу' : 'Пришпилити лупу'}
        >
          <PinIcon size={12} strokeWidth={isPinned ? 2.5 : 2} />
        </button>
      )}

      {/* Floating Anchor Target Button (Snug bottom-left corner hugging the circular rim) */}
      {onToggleAnchor && (
        <button
          key="magnifier-anchor-btn"
          type="button"
          translate="no"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            revealControls(4000);
            onToggleAnchor();
          }}
          className={`absolute bottom-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center border-[1.5px] z-50 active:scale-85 transition-all duration-300 cursor-pointer ${
            isAnchored 
              ? 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black border-white shadow-[0_2px_8px_rgba(16,185,129,0.7),0_0_10px_rgba(16,185,129,0.5)] font-bold' 
              : 'bg-neutral-900/90 hover:bg-neutral-800 text-emerald-300 hover:text-white border-white/50 shadow-[0_2px_8px_rgba(0,0,0,0.6)]'
          } ${
            areControlsActive ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
          }`}
          title={isAnchored 
            ? (t('magnifier.anchor.active.title') || 'Якір активний: фокус на точці полотна 🎯 (натисніть, щоб стежити за курсором)') 
            : (t('magnifier.anchor.inactive.title') || 'Зафіксувати точку огляду на полотні (Якір 🎯)')}
          aria-label={isAnchored 
            ? (t('magnifier.anchor.disable') || 'Вимкнути якір') 
            : (t('magnifier.anchor.enable') || 'Увімкнути якір')}
        >
          <TargetIcon size={12} strokeWidth={isAnchored ? 2.5 : 2} />
        </button>
      )}

      {/* Floating Close Button (Snug top-right corner hugging the circular rim) */}
      {onClose && (
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClose();
          }}
          className={`absolute top-0.5 right-0.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white flex items-center justify-center border-[1.5px] border-white shadow-[0_2px_8px_rgba(0,0,0,0.8),0_0_8px_rgba(239,68,68,0.6)] z-50 active:scale-85 transition-all duration-300 cursor-pointer ${
            areControlsActive ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
          }`}
          title={t('magnifier.close') || 'Закрити лупу'}
          aria-label={t('magnifier.close') || 'Закрити лупу'}
        >
          <XIcon size={12} strokeWidth={3} />
        </button>
      )}

      {/* Interactive Resize Handle Button (Snug bottom-right corner hugging the circular rim) */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          if (e.touches[0]) {
            startResize(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          startResize(e.clientX, e.clientY);
        }}
        onClick={handleCycleSize}
        className={`absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white flex items-center justify-center border-[1.5px] border-white shadow-[0_2px_8px_rgba(0,0,0,0.8),0_0_8px_rgba(6,182,212,0.6)] z-50 cursor-se-resize active:scale-90 transition-all duration-300 ${
          areControlsActive ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
        }`}
        title={t('magnifier.resize.title') || 'Потягніть для зміни розміру лупи або натисніть для перемикання (100 / 150 / 200 / 260 / 320 px)'}
        aria-label={t('magnifier.resize.label') || 'Змінити розмір лупи'}
      >
        <span className="text-[11px] font-black leading-none select-none">⤡</span>
      </button>

      {/* Visual Size Badge when resizing */}
      {isResizing && (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-neutral-900 border border-cyan-400 text-[9.5px] font-mono font-bold text-cyan-300 shadow-xl whitespace-nowrap z-50 animate-in fade-in">
          Ø {loupeSize}px
        </div>
      )}
    </div>
  );
};
