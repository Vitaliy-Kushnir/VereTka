import React, {useContext} from 'react';
import { useLanguage } from './LanguageContext';
import { useState, useEffect } from 'react';
import { LocateIcon, MagnifierIcon, JoystickIcon, CrosshairIcon, PinIcon } from './icons';
import { NumberInput } from './FormControls';
import { MagnifierMode } from '../types';

interface StatusBarProps {
  zoomLevel: number;
  cursorPos: { x: number; y: number } | null;
  onZoomChange: (newScale: number) => void;
  onResetZoom: () => void;
  onLocateSelectedShape: () => void;
  selectedShapeIds: string[];
  showCursorCoords: boolean;
  setShowCursorCoords: (show: boolean) => void;
  showMagnifier?: MagnifierMode | boolean;
  setShowMagnifier?: (mode: MagnifierMode) => void;
  touchDrawingMode?: 'tap-drag' | 'virtual-joystick';
  setTouchDrawingMode?: (mode: 'tap-drag' | 'virtual-joystick') => void;
}

const MIN_SCALE = 0.05;
const MAX_SCALE = 30;

const StatusBar: React.FC<StatusBarProps> = ({ 
  zoomLevel, 
  cursorPos, 
  onZoomChange, 
  onResetZoom, 
  onLocateSelectedShape, 
  selectedShapeIds,
  showCursorCoords,
  setShowCursorCoords,
  showMagnifier,
  setShowMagnifier,
  touchDrawingMode,
  setTouchDrawingMode
}) => {
  const { t } = useLanguage();
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  
  const formatNumber = (num: number) => Math.round(num * 100) / 100;
  const formattedZoom = `${Math.round(zoomLevel * 100)}%`;

  // Logarithmic scale for the slider to feel more natural.
  const minLog = Math.log(MIN_SCALE);
  const maxLog = Math.log(MAX_SCALE);
  const scaleRange = maxLog - minLog;

  const zoomToSliderValue = (zoom: number): number => {
    if (isNaN(zoom) || !isFinite(zoom) || zoom <= 0 || scaleRange === 0) return 50;
    const clampedZoom = Math.max(MIN_SCALE, Math.min(MAX_SCALE, zoom));
    const val = ((Math.log(clampedZoom) - minLog) / scaleRange) * 100;
    return isNaN(val) ? 50 : val;
  };

  const sliderValueToZoom = (value: number): number => {
    return Math.exp(minLog + (scaleRange * value) / 100);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = sliderValueToZoom(Number(e.target.value));
    onZoomChange(newZoom);
  };

  return (
    <div className="bg-[var(--bg-primary)]/80 h-6 flex-shrink-0 px-3 flex items-center justify-between text-xs text-[var(--text-tertiary)] select-none">
      <div className="flex items-center gap-2 w-48">
        <input
            id="statusbar-show-coords"
            type="checkbox"
            checked={showCursorCoords}
            onChange={(e) => setShowCursorCoords(e.target.checked)}
            className="w-3 h-3 rounded-sm text-[var(--accent-primary)] focus:ring-0 focus:ring-offset-0 bg-[var(--bg-secondary)] border-[var(--border-primary)] cursor-pointer"
            title={t('status.toggleCoords')}
        />
        <label htmlFor="statusbar-show-coords" className="font-mono cursor-pointer" title={t('status.coords')}>
            {cursorPos ? `X: ${formatNumber(cursorPos.x)} Y: ${formatNumber(cursorPos.y)}` : ''}
        </label>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={zoomToSliderValue(zoomLevel)}
          onChange={handleSliderChange}
          className="w-24 h-1 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-primary)]"
          title={`${t('status.zoom')}: ${formattedZoom}`}
        />
        {isEditingZoom ? (
            <div className="w-20">
                 <NumberInput
                    id="zoom-input"
                    value={Math.round(zoomLevel * 100)}
                    onChange={(val) => onZoomChange(val / 100)}
                    onBlur={() => setIsEditingZoom(false)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                             (e.target as HTMLInputElement).blur();
                        }
                    }}
                    autoFocus
                    min={Math.round(MIN_SCALE * 100)}
                    max={Math.round(MAX_SCALE * 100)}
                    unit="%"
                    smartRound={false}
                    showQuickPopup={false}
                />
            </div>
        ) : (
            <button
                onClick={() => setIsEditingZoom(true)}
                className="w-16 text-center hover:text-[var(--text-primary)]"
                title={t('status.zoomClick')}
            >
                {formattedZoom}
            </button>
        )}
        {setShowMagnifier && (() => {
            const magMode: MagnifierMode = typeof showMagnifier === 'string'
                ? showMagnifier
                : (showMagnifier === true ? 'auto' : 'off');

            const handleToggle = () => {
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
                    onClick={handleToggle}
                    className={`px-1.5 py-0.5 rounded-md transition-all flex items-center gap-1 border ${
                        magMode === 'pinned'
                            ? 'text-amber-300 bg-amber-500/20 border-amber-500/50 font-semibold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                            : magMode === 'auto'
                                ? 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30 font-medium shadow-[0_0_6px_rgba(6,182,212,0.2)]'
                                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border-transparent'
                    }`}
                    title={
                        magMode === 'pinned'
                            ? (t('status.magnifier.pinned.title') || 'Лупа: Зафіксовано 📌 (завжди на екрані). Натисніть для вимкнення')
                            : magMode === 'auto'
                                ? (t('status.magnifier.auto.title') || 'Лупа: Авто (при контакті). Натисніть для фіксації')
                                : (t('status.magnifier.off.title') || 'Лупа: Вимкнено. Натисніть для увімкнення')
                    }
                >
                    {magMode === 'pinned' ? (
                        <PinIcon size={12} className="text-amber-400" />
                    ) : (
                        <MagnifierIcon size={12} className={magMode === 'auto' ? 'text-cyan-400' : 'opacity-60'} />
                    )}
                    <span className="text-[10px] hidden md:inline">
                        {magMode === 'pinned' 
                            ? (t('status.magnifier.pinned') || 'Лупа 📌') 
                            : magMode === 'auto' 
                                ? (t('status.magnifier.auto') || 'Лупа (Авто)') 
                                : (t('status.magnifier.off') || 'Лупа (Вимк)')}
                    </span>
                </button>
            );
        })()}
        {setTouchDrawingMode && typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0) && (
            <button
                onClick={() => setTouchDrawingMode(touchDrawingMode === 'virtual-joystick' ? 'tap-drag' : 'virtual-joystick')}
                className={`px-1.5 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                    touchDrawingMode === 'virtual-joystick'
                        ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 font-medium'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
                title={touchDrawingMode === 'virtual-joystick' 
                    ? (t('status.touch.joystick.title') || 'Режим: Джойстик / Приціл (натисніть для перемикання)') 
                    : (t('status.touch.tap.title') || 'Режим: Прямий дотик (натисніть для джойстика)')}
            >
                <JoystickIcon size={12} />
                <span className="text-[10px] hidden md:inline">
                    {touchDrawingMode === 'virtual-joystick' 
                        ? (t('status.touch.joystick') || 'Джойстик') 
                        : (t('status.touch.tap') || 'Дотик')}
                </span>
            </button>
        )}
        <button
            onClick={onLocateSelectedShape}
            disabled={(selectedShapeIds.length === 0)}
            className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-[var(--text-tertiary)]"
            title={t('status.showSelected')}
        >
            <LocateIcon size={14} />
        </button>
      </div>
    </div>
  );
};

export default StatusBar;