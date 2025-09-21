
import React, { useState } from 'react';
import { XIcon } from './icons';
import { InputWrapper, Label, NumberInput } from './FormControls';

export interface ExportSettings {
  format: 'svg' | 'png' | 'jpeg';
  scale: number;
  quality: number; // 0-100 for JPEG
}

interface ExportModalProps {
  onClose: () => void;
  onExport: (settings: ExportSettings) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose, onExport }) => {
    const [format, setFormat] = useState<'svg' | 'png' | 'jpeg'>('png');
    const [scale, setScale] = useState(1);
    const [quality, setQuality] = useState(90);

    const handleExport = () => {
        onExport({ format, scale, quality });
    };

    const FormatButton: React.FC<{ value: 'svg' | 'png' | 'jpeg'; label: string }> = ({ value, label }) => (
        <button
            onClick={() => setFormat(value)}
            className={`flex-1 px-3 py-2 text-sm font-semibold rounded-md transition ${format === value ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
        >
            {label}
        </button>
    );

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-sm flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Експортувати зображення</h2>
                    <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full">
                        <XIcon />
                    </button>
                </header>

                <div className="p-6 space-y-6">
                    <div>
                        <Label htmlFor="format-group" title="Оберіть формат файлу для експорту.">Формат:</Label>
                        <div id="format-group" className="flex items-center gap-2 mt-2 p-1 bg-[var(--bg-app)] rounded-lg">
                           <FormatButton value="svg" label="SVG" />
                           <FormatButton value="png" label="PNG" />
                           <FormatButton value="jpeg" label="JPEG" />
                        </div>
                    </div>

                    <InputWrapper>
                        <Label htmlFor="export-scale" title="Множник розміру зображення. 2x зробить зображення вдвічі більшим.">Масштаб:</Label>
                        <NumberInput id="export-scale" value={scale} onChange={setScale} min={0.1} max={10} step={0.1} />
                    </InputWrapper>

                    {format === 'jpeg' && (
                         <div className="space-y-2">
                             <InputWrapper>
                                <Label htmlFor="export-quality" title="Якість стиснення JPEG від 0 (низька) до 100 (висока).">Якість:</Label>
                                <NumberInput id="export-quality" value={quality} onChange={setQuality} min={0} max={100} step={1} />
                            </InputWrapper>
                            <div className="flex items-center gap-2 ml-32">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={quality}
                                    onChange={e => setQuality(Number(e.target.value))}
                                    className="w-full h-2 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                         </div>
                    )}
                </div>

                <footer className="p-4 bg-[var(--bg-app)]/50 rounded-b-lg flex justify-end">
                     <button
                        onClick={handleExport}
                        className="px-6 py-2 rounded-lg font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
                    >
                        Експорт
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ExportModal;
