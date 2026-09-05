import React, { useState, useEffect, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Search, 
  Crosshair, 
  ChevronUp, 
  ChevronDown,
  Target,
  Pin
} from 'lucide-react';
import { JoystickGamepadIcon } from '../icons';
import { useLanguage } from '../LanguageContext';
import { MagnifierMode } from '../../types';

interface MobileQuickControlsProps {
  zoomLevel: number;
  onZoomChange: (newScale: number) => void;
  onResetZoom: () => void;
  onLocateSelectedShape?: () => void;
  hasSelectedShapes?: boolean;
  showCursorCoords: boolean;
  setShowCursorCoords: (show: boolean | ((prev: boolean) => boolean)) => void;
  showMagnifier?: MagnifierMode | boolean;
  setShowMagnifier?: (mode: MagnifierMode) => void;
  touchDrawingMode?: 'tap-drag' | 'virtual-joystick' | boolean;
  setTouchDrawingMode?: (mode: 'tap-drag' | 'virtual-joystick') => void;
  cursorPos: { x: number; y: number } | null;
}

export const MobileQuickControls: React.FC<MobileQuickControlsProps> = ({
  zoomLevel,
  onZoomChange,
  onResetZoom,
  onLocateSelectedShape,
  hasSelectedShapes = false,
  showCursorCoords,
  setShowCursorCoords,
  showMagnifier = 'auto',
  setShowMagnifier,
  touchDrawingMode = 'tap-drag',
  setTouchDrawingMode,
  cursorPos
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isExpanded) return;

    const handlePointerDownOutside = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  const zoomPercent = Math.round(zoomLevel * 100);

  const handleZoomIn = () => {
    onZoomChange(Math.min(zoomLevel * 1.25, 20));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoomLevel / 1.25, 0.05));
  };

  const magMode: MagnifierMode = typeof showMagnifier === 'string'
    ? showMagnifier
    : (showMagnifier ? 'auto' : 'off');

  const isMagnifierActive = magMode !== 'off';

  const handleToggleMagnifier = () => {
    if (!setShowMagnifier) return;
    if (magMode === 'off') {
      setShowMagnifier('auto');
    } else if (magMode === 'auto') {
      setShowMagnifier('pinned');
    } else {
      setShowMagnifier('off');
    }
  };

  const isJoystick = touchDrawingMode === 'virtual-joystick';
  const handleToggleTouchMode = () => {
    if (!setTouchDrawingMode) return;
    setTouchDrawingMode(isJoystick ? 'tap-drag' : 'virtual-joystick');
  };

  return (
    <div ref={containerRef} className="relative flex flex-col items-end pointer-events-auto select-none">
      {/* Floating Pill Trigger (stays fixed at top) */}
      <div className="flex items-center gap-1 bg-[var(--bg-primary)]/90 backdrop-blur-md border border-[var(--border-secondary)] rounded-full shadow-xl p-1 z-20">
        {/* Quick Reset Zoom Button */}
        <button
          type="button"
          onClick={onResetZoom}
          className="px-2.5 py-1 rounded-full text-xs font-mono font-bold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-95 transition-colors"
          title={t('resetZoom') || 'Скинути 100%'}
        >
          {zoomPercent}%
        </button>

        {/* Quick Magnifier Button */}
        <button
          type="button"
          onClick={handleToggleMagnifier}
          className={`w-7 h-7 flex items-center justify-center rounded-full active:scale-95 transition-all ${
            magMode === 'pinned'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
              : isMagnifierActive 
                ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
          }`}
          title={
            magMode === 'pinned'
              ? (t('status.magnifier.pinned.title') || 'Лупа: Зафіксовано 📌')
              : magMode === 'auto'
                ? (t('status.magnifier.auto.title') || 'Лупа: Авто')
                : (t('status.magnifier.off.title') || 'Лупа: Вимкнено')
          }
        >
          {magMode === 'pinned' ? <Pin size={13} className="text-amber-400" /> : <Search size={14} />}
        </button>

        {/* Expand/Collapse Menu Chevron */}
        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-all active:scale-95 ${
            isExpanded 
              ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
          }`}
          title={isExpanded ? (t('collapse') || 'Згорнути') : (t('more') || 'Більше')}
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded popup controls (Opens strictly UNDER the pill button without shifting it) */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 bg-[var(--bg-primary)]/95 backdrop-blur-md border border-[var(--border-secondary)] rounded-2xl shadow-2xl p-2.5 flex flex-col gap-2 min-w-[240px] text-xs animate-in fade-in slide-in-from-top-2 duration-150 z-30">
          {/* Zoom controls row */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-secondary)]">
            <span className="text-[var(--text-secondary)] font-semibold text-[11px] uppercase tracking-wider">
              {t('zoom')}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] active:scale-95 text-[var(--text-primary)] transition-colors"
                title={t('zoomOut')}
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                onClick={onResetZoom}
                className="px-2.5 h-7 flex items-center justify-center rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] font-mono text-[11px] font-bold text-[var(--text-primary)] transition-colors"
                title={t('resetZoom')}
              >
                {zoomPercent}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] active:scale-95 text-[var(--text-primary)] transition-colors"
                title={t('zoomIn')}
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </div>

          {/* Quick toggle grid */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            {/* Magnifier Toggle */}
            <button
              type="button"
              onClick={handleToggleMagnifier}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-left transition-all active:scale-95 ${
                magMode === 'pinned'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold shadow-sm'
                  : magMode === 'auto'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] border-[var(--accent-primary)] font-bold shadow-sm' 
                    : 'bg-[var(--bg-secondary)] border-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
              title={
                magMode === 'pinned'
                  ? (t('status.magnifier.pinned.title') || 'Лупа: Зафіксовано 📌')
                  : magMode === 'auto'
                    ? (t('status.magnifier.auto.title') || 'Лупа: Авто')
                    : (t('status.magnifier.off.title') || 'Лупа: Вимкнено')
              }
            >
              {magMode === 'pinned' ? (
                <Pin size={14} className="text-amber-400 shrink-0" />
              ) : (
                <Search size={14} className={`shrink-0 ${isMagnifierActive ? 'text-[var(--accent-text)]' : 'text-[var(--accent-primary)]'}`} />
              )}
              <span className="truncate font-medium">
                {t('magnifier')}
              </span>
            </button>

            {/* Joystick Mode Toggle (2 modes: on / off) */}
            <button
              type="button"
              onClick={handleToggleTouchMode}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-left transition-all active:scale-95 ${
                isJoystick 
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] border-[var(--accent-primary)] font-bold shadow-sm' 
                  : 'bg-[var(--bg-secondary)] border-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
              title={isJoystick ? (t('status.touch.joystick.title') || 'Джойстик: Увімкнено') : (t('status.touch.tap.title') || 'Джойстик: Вимкнено')}
            >
              <JoystickGamepadIcon size={14} className={`shrink-0 ${isJoystick ? 'text-[var(--accent-text)]' : 'text-[var(--accent-primary)]'}`} />
              <span className="truncate font-medium">{t('joystick')}</span>
            </button>

            {/* Coordinates display toggle */}
            <button
              type="button"
              onClick={() => setShowCursorCoords(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-left transition-all active:scale-95 ${
                showCursorCoords 
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] border-[var(--accent-primary)] font-bold shadow-sm' 
                  : 'bg-[var(--bg-secondary)] border-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
              title={showCursorCoords ? t('status.coords.on.title') : t('status.coords.off.title')}
            >
              <Crosshair size={14} className={`shrink-0 ${showCursorCoords ? 'text-[var(--accent-text)]' : 'text-[var(--accent-primary)]'}`} />
              <span className="truncate font-medium">{t('coords')}</span>
            </button>

            {/* Center on selected shape */}
            {hasSelectedShapes && onLocateSelectedShape && (
              <button
                type="button"
                onClick={onLocateSelectedShape}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-transparent active:scale-95 transition-all"
                title={t('locateSelected')}
              >
                <Target size={14} className="text-[var(--accent-primary)] shrink-0" />
                <span className="truncate font-medium">{t('locate')}</span>
              </button>
            )}
          </div>

          {/* Coordinates readout bar if enabled */}
          {showCursorCoords && (
            <div className="pt-1.5 border-t border-[var(--border-secondary)] flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)] font-medium">
              <span>X: {cursorPos ? Math.round(cursorPos.x) : '—'}</span>
              <span>Y: {cursorPos ? Math.round(cursorPos.y) : '—'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
