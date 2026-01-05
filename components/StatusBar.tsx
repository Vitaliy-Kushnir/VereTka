import React, { useState, useEffect } from 'react';
import { LocateIcon } from './icons';
import { NumberInput } from './FormControls';

interface StatusBarProps {
  zoomLevel: number;
  cursorPos: { x: number; y: number } | null;
  onZoomChange: (newScale: number) => void;
  onResetZoom: () => void;
  onLocateSelectedShape: () => void;
  selectedShapeId: string | null;
  showCursorCoords: boolean;
  setShowCursorCoords: (show: boolean) => void;
}

const MIN_SCALE = 0.05;
const MAX_SCALE = 30;

const StatusBar: React.FC<StatusBarProps> = ({ 
  zoomLevel, 
  cursorPos, 
  onZoomChange, 
  onResetZoom, 
  onLocateSelectedShape, 
  selectedShapeId,
  showCursorCoords,
  setShowCursorCoords
}) => {
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  
  const formatNumber = (num: number) => Math.round(num * 100) / 100;
  const formattedZoom = `${Math.round(zoomLevel * 100)}%`;

  // Logarithmic scale for the slider to feel more natural.
  const minLog = Math.log(MIN_SCALE);
  const maxLog = Math.log(MAX_SCALE);
  const scaleRange = maxLog - minLog;

  const zoomToSliderValue = (zoom: number): number => {
    if (scaleRange === 0) return 0;
    const clampedZoom = Math.max(MIN_SCALE, Math.min(MAX_SCALE, zoom));
    return ((Math.log(clampedZoom) - minLog) / scaleRange) * 100;
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
            title="Показувати/приховувати координати біля курсора"
        />
        <label htmlFor="statusbar-show-coords" className="font-mono cursor-pointer" title="Координати курсора на полотні">
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
          title={`Масштаб: ${formattedZoom}`}
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
                />
            </div>
        ) : (
            <button
                onClick={() => setIsEditingZoom(true)}
                className="w-16 text-center hover:text-[var(--text-primary)]"
                title="Натисніть, щоб змінити масштаб"
            >
                {formattedZoom}
            </button>
        )}
        <button
            onClick={onLocateSelectedShape}
            disabled={!selectedShapeId}
            className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-[var(--text-tertiary)]"
            title="Показати виділений об'єкт"
        >
            <LocateIcon size={14} />
        </button>
      </div>
    </div>
  );
};

export default StatusBar;