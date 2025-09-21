import React from 'react';

interface StatusBarProps {
  zoomLevel: number;
  cursorPos: { x: number; y: number } | null;
  onZoomChange: (newScale: number) => void;
  onResetZoom: () => void;
}

const MIN_SCALE = 0.05;
const MAX_SCALE = 30;

const StatusBar: React.FC<StatusBarProps> = ({ zoomLevel, cursorPos, onZoomChange, onResetZoom }) => {
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
      <div className="font-mono w-48">
        {cursorPos ? `X: ${formatNumber(cursorPos.x)} Y: ${formatNumber(cursorPos.y)}` : ''}
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
        <button
          onClick={onResetZoom}
          className="w-12 text-center hover:text-[var(--text-primary)]"
          title="Скинути масштаб до 100%"
        >
          {formattedZoom}
        </button>
      </div>
    </div>
  );
};

export default StatusBar;