import React, { useState, useRef, useEffect, forwardRef, useCallback } from 'react';
import { DASH_STYLES } from '../lib/constants';
import { CheckIcon, XIcon } from './icons';

export const InputWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-2">{children}</div>
);

export const Label: React.FC<{ htmlFor: string; children: React.ReactNode; title?: string }> = ({ htmlFor, children, title }) => (
    <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--text-secondary)] w-24 flex-shrink-0" title={title}>{children}</label>
);

export const NumberInput = forwardRef<HTMLInputElement, { id: string; value: number; onChange: (value: number) => void, disabled?: boolean; step?: number; min?: number; max?: number; onFocus?: () => void, title?: string, className?: string }> (({ id, value, onChange, disabled, step = 1, min, max, onFocus, title, className }, ref) => (
    <input
        ref={ref}
        id={id}
        type="number"
        value={value}
        onChange={e => {
            const num = Number(e.target.value);
            if (!isNaN(num)) {
                 onChange(num);
            }
        }}
        disabled={disabled}
        step={step}
        min={min}
        max={max}
        onFocus={onFocus}
        title={title}
        className={`bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2 py-1 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className ?? ''}`}
    />
));
NumberInput.displayName = 'NumberInput';


// Custom hook to handle clicks outside a component
const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent) => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [ref, handler]);
};

export const ColorInput: React.FC<{
    id: string;
    value: string;
    onChange: (value: string) => void;
    onPreview: (value: string | null) => void;
    onCancel: () => void;
    disabled?: boolean;
    title?: string;
}> = ({ id, value, onChange, onPreview, onCancel, disabled, title }) => {
  const [tempValue, setTempValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const initialValue = useRef(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setTempValue(value);
      initialValue.current = value;
    }
  }, [value, isEditing]);

  const handleCancel = useCallback(() => {
    if (!isEditing) return;
    onCancel();
    setTempValue(initialValue.current);
    setIsEditing(false);
  }, [isEditing, onCancel]);

  useClickOutside(wrapperRef, handleCancel);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    if (!isEditing) {
        initialValue.current = value; // Capture the value before the first change
        setIsEditing(true);
    }
    setTempValue(newColor);
    onPreview(newColor);
  };
  
  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(tempValue);
    initialValue.current = tempValue;
    setIsEditing(false);
  };
  
  return (
    <div ref={wrapperRef} className="flex items-center gap-1">
      <input
        id={id}
        type="color"
        value={tempValue}
        onInput={handleInput}
        disabled={disabled}
        title={title}
        className="w-6 h-6 p-0 border-none rounded cursor-pointer bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <div className="flex items-center" style={{ width: 48, height: 24 }}>
        {isEditing && !disabled && (
            <div className="flex items-center bg-[var(--bg-tertiary)] rounded-md">
                <button 
                    onClick={handleConfirm} 
                    title="Застосувати колір"
                    className="p-1 rounded-l-md text-green-400 hover:bg-green-600 hover:text-white"
                >
                    <CheckIcon size={16} />
                </button>
                <button 
                    onClick={handleCancel} 
                    title="Скасувати зміну"
                    className="p-1 rounded-r-md text-red-400 hover:bg-red-600 hover:text-white"
                >
                    <XIcon size={16} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export const Checkbox: React.FC<{ id: string, checked: boolean, onChange: (checked: boolean) => void, label: string, disabled?: boolean, title?: string }> = ({ id, checked, onChange, label, disabled, title }) => (
    <div className="flex items-center gap-2" title={title}>
        <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)] disabled:opacity-50 disabled:cursor-not-allowed" />
        <label htmlFor={id} className={`text-sm font-medium ${disabled ? 'text-[var(--text-disabled)]' : 'text-[var(--text-secondary)]'}`}>{label}</label>
    </div>
);

export const Select: React.FC<{ id: string; value: string; onChange: (value: string) => void, children: React.ReactNode, disabled?: boolean, title?: string, className?: string }> = ({ id, value, onChange, children, disabled, title, className }) => (
    <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        title={title}
        className={`bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2 py-1.5 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className ?? ''}`}
    >
        {children}
    </select>
);

// FIX: Add 'placeholder' prop to TextArea component to allow placeholder text.
export const TextArea: React.FC<{ id: string; value: string; onChange: (value: string) => void; disabled?: boolean; rows?: number, title?: string, placeholder?: string }> = ({ id, value, onChange, disabled, rows = 3, title, placeholder }) => (
    <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        title={title}
        placeholder={placeholder}
        className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2 py-1 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
    />
);

export const DashSelect: React.FC<{
    id: string;
    value: number[] | undefined;
    onChange: (value: number[] | undefined) => void;
    disabled?: boolean;
    isCustom: boolean;
}> = ({ id, value, onChange, disabled, isCustom }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useClickOutside(dropdownRef, () => setIsOpen(false));
    
    const selectedStyle = isCustom 
        ? { name: "Користувацький", pattern: value ?? [], description: "Власний стиль штрихування." } 
        : (DASH_STYLES.find(style => JSON.stringify(style.pattern) === JSON.stringify(value ?? [])) ?? DASH_STYLES[0]);

    const handleSelect = (pattern: number[]) => {
        onChange(pattern.length > 0 ? pattern : undefined);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className="relative w-full" onMouseLeave={() => setIsOpen(false)}>
            <button
                id={id}
                type="button"
                onClick={() => setIsOpen(p => !p)}
                disabled={disabled}
                className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2 py-1 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                title="Вибрати готовий стиль штрихування або налаштувати власний"
            >
                <span className="truncate">{selectedStyle.name}</span>
                <span className="transform transition-transform text-[var(--text-tertiary)]">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
                <div className="absolute z-10 top-full left-0 mt-0 w-full bg-[var(--bg-tertiary)] rounded-md shadow-lg max-h-60 overflow-y-auto border border-[var(--border-secondary)]">
                    {DASH_STYLES.map(style => (
                        <button
                            key={style.name}
                            onClick={() => handleSelect(style.pattern)}
                            title={style.description}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)]"
                        >
                           <div className="w-20 flex-shrink-0 flex items-center justify-center h-4 mr-2">
                                <svg width="100%" height="100%" viewBox="0 0 100 4" preserveAspectRatio="none">
                                    <line 
                                        x1="0" y1="2" x2="100" y2="2" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeDasharray={style.pattern.join(' ')} 
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            <span className="flex-grow truncate">{style.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};