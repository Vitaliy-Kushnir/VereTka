import React, { useState, useRef, useEffect, forwardRef, useCallback, useMemo } from 'react';
import { DASH_STYLES } from '../lib/constants';
import { CheckIcon, XIcon, RefreshIcon, ChevronDownIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

import { useLanguage } from './LanguageContext';

export const InputWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-2">{children}</div>
);

export const Label: React.FC<{ htmlFor?: string; children?: React.ReactNode; title?: string; className?: string }> = ({ htmlFor, children, title, className }) => (
    <label 
        htmlFor={htmlFor} 
        onClick={(e) => {
            // Prevent default label click behavior so tapping on label does not focus input or trigger mobile virtual keyboard
            e.preventDefault();
        }}
        className={`text-sm font-medium text-[var(--text-secondary)] w-28 flex-shrink-0 select-none cursor-default ${className || ""}`} 
        title={title}
    >
        {children}
    </label>
);

// Interactive Circular Angle Picker Component for Rotations and Angles
export const CircularAnglePicker: React.FC<{
    value: number;
    onChange: (val: number, isFinal: boolean) => void;
    onChangeEnd?: (val: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
}> = ({ value, onChange, onChangeEnd, min = -360, max = 360, step = 1, disabled }) => {
    const { t } = useLanguage();
    const dialRef = useRef<SVGSVGElement>(null);
    const isDraggingRef = useRef(false);
    const [isHovered, setIsHovered] = useState(false);

    const safeAngle = typeof value === 'number' && !isNaN(value) ? value : 0;
    // Normalize display angle into 0..360 for dial visualization
    const normalizedDeg = ((safeAngle % 360) + 360) % 360;
    const rad = (normalizedDeg * Math.PI) / 180;

    const size = 140;
    const center = size / 2;
    const radius = 50;
    const handleRadius = 7;

    // Handle position on the circle (0 deg pointing right / East, negative angle goes clockwise per Tkinter)
    const handleX = center + radius * Math.cos(-rad);
    const handleY = center + radius * Math.sin(-rad);

    const computeAngleFromEvent = (e: PointerEvent | React.PointerEvent) => {
        if (!dialRef.current) return safeAngle;
        const rect = dialRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        // Note: Math.atan2(dy, dx) returns angle in radians, clockwise positive.
        // We negate it to match Tkinter's counter-clockwise positive convention.
        let deg = Math.round((-Math.atan2(dy, dx) * 180) / Math.PI);
        if (deg < 0) deg += 360;

        // Snapping: snap to 15-degree increments if within 4 degrees
        const snapThreshold = 4;
        const snapStep = 15;
        const remainder = deg % snapStep;
        if (remainder <= snapThreshold) {
            deg -= remainder;
        } else if (remainder >= snapStep - snapThreshold) {
            deg += (snapStep - remainder);
        }

        deg = ((deg % 360) + 360) % 360;

        // If min < 0 and original safeAngle was negative, preserve sign convention
        if (min < 0 && safeAngle < 0 && deg > 180) {
            deg = deg - 360;
        }

        if (min !== undefined) deg = Math.max(min, deg);
        if (max !== undefined) deg = Math.min(max, deg);

        return deg;
    };

    const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
        if (disabled || e.button !== 0) return;
        e.preventDefault();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        isDraggingRef.current = true;

        const newAngle = computeAngleFromEvent(e);
        onChange(newAngle, false);

        const onPointerMove = (moveE: PointerEvent) => {
            if (!isDraggingRef.current) return;
            moveE.preventDefault();
            const angle = computeAngleFromEvent(moveE);
            onChange(angle, false);
        };

        const onPointerUp = (upE: PointerEvent) => {
            isDraggingRef.current = false;
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);

            const finalAngle = computeAngleFromEvent(upE);
            onChange(finalAngle, true);
            onChangeEnd?.(finalAngle);
        };

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
    };

    const cardinalTicks = [0, 45, 90, 135, 180, 225, 270, 315];

    return (
        <div className="flex flex-col items-center gap-2 select-none">
            <div className="relative flex items-center justify-center">
                <svg
                    ref={dialRef}
                    width={size}
                    height={size}
                    onPointerDown={handlePointerDown}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="cursor-crosshair touch-none"
                >
                    {/* Background Dial Circle */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        className="fill-[var(--bg-secondary)] stroke-[var(--border-primary)]"
                        strokeWidth="2"
                    />

                    {/* Outer Track Ring */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius + 8}
                        className="fill-none stroke-[var(--border-secondary)]"
                        strokeWidth="1"
                        strokeDasharray="2,3"
                    />

                    {/* Cardinal Angle Ticks */}
                    {cardinalTicks.map(angle => {
                        const tickRad = (-angle * Math.PI) / 180;
                        const isMajor = angle % 90 === 0;
                        const tickLen = isMajor ? 8 : 4;
                        const innerR = radius - tickLen;
                        const x1 = center + innerR * Math.cos(tickRad);
                        const y1 = center + innerR * Math.sin(tickRad);
                        const x2 = center + radius * Math.cos(tickRad);
                        const y2 = center + radius * Math.sin(tickRad);
                        return (
                            <line
                                key={angle}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="currentColor"
                                strokeWidth={isMajor ? "1.75" : "1"}
                                className={isMajor ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)] opacity-60"}
                            />
                        );
                    })}

                    {/* Angle labels (0°, 90°, 180°, 270°) */}
                    <text x={center + radius - 14} y={center + 3} className="fill-[var(--text-tertiary)] text-[9px] font-bold" textAnchor="end">0°</text>
                    <text x={center} y={center - radius + 13} className="fill-[var(--text-tertiary)] text-[9px] font-bold" textAnchor="middle">90°</text>
                    <text x={center - radius + 14} y={center + 3} className="fill-[var(--text-tertiary)] text-[9px] font-bold" textAnchor="start">180°</text>
                    <text x={center} y={center + radius - 6} className="fill-[var(--text-tertiary)] text-[9px] font-bold" textAnchor="middle">270°</text>

                    {/* Radius Needle Indicator */}
                    <line
                        x1={center}
                        y1={center}
                        x2={handleX}
                        y2={handleY}
                        className="stroke-[var(--accent-primary)]"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />

                    {/* Center Hub */}
                    <circle
                        cx={center}
                        cy={center}
                        r="4"
                        className="fill-[var(--accent-primary)]"
                    />

                    {/* Draggable Knob Handle */}
                    <circle
                        cx={handleX}
                        cy={handleY}
                        r={handleRadius}
                        className="fill-[var(--accent-primary)] stroke-[var(--bg-primary)] shadow-md transition-transform"
                        strokeWidth="2.5"
                    />
                </svg>

                {/* Center Badge showing active angle value */}
                <div className="absolute pointer-events-none flex flex-col items-center justify-center">
                    <span className="text-xs font-black text-[var(--accent-primary)] bg-[var(--bg-primary)]/90 px-1.5 py-0.5 rounded shadow-xs border border-[var(--border-secondary)]">
                        {safeAngle}°
                    </span>
                </div>
            </div>

            {/* Quick Angle Jump Actions */}
            <div className="flex items-center justify-center gap-1 w-full pt-1">
                <button
                    type="button"
                    onClick={() => {
                        const next = safeAngle - 90;
                        onChange(next, true);
                        onChangeEnd?.(next);
                    }}
                    title={t('form.rotateCCW') || "Повернути на -90°"}
                    className="px-1.5 py-1 text-[11px] font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded border border-[var(--border-secondary)] transition-colors"
                >
                    ⟲ -90°
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const next = safeAngle + 90;
                        onChange(next, true);
                        onChangeEnd?.(next);
                    }}
                    title={t('form.rotateCW') || "Повернути на +90°"}
                    className="px-1.5 py-1 text-[11px] font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded border border-[var(--border-secondary)] transition-colors"
                >
                    ⟳ +90°
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const next = safeAngle === 0 ? 180 : 0;
                        onChange(next, true);
                        onChangeEnd?.(next);
                    }}
                    title="0° / 180°"
                    className="px-1.5 py-1 text-[11px] font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded border border-[var(--border-secondary)] transition-colors"
                >
                    {safeAngle === 0 ? '180°' : '0°'}
                </button>
            </div>
        </div>
    );
};

export const NumberInput = forwardRef<HTMLInputElement, { 
    id: string; 
    value: number | ''; 
    onChange: (value: number, isFinal?: boolean) => void; 
    onChangeEnd?: (value: number) => void;
    disabled?: boolean; 
    step?: number; 
    min?: number; 
    max?: number; 
    onFocus?: React.FocusEventHandler<HTMLInputElement>; 
    title?: string; 
    className?: string; 
    smartRound?: boolean; 
    unit?: string; 
    onBlur?: React.FocusEventHandler<HTMLInputElement>; 
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>; 
    autoFocus?: boolean; 
    stepLogic?: 'grid'; 
    placeholder?: string;
    showSlider?: boolean;
    sliderMin?: number;
    sliderMax?: number;
    presets?: number[];
    showQuickPopup?: boolean;
    isAngle?: boolean;
}> (
    ({ 
        id, 
        value, 
        onChange, 
        onChangeEnd,
        disabled, 
        step = 1, 
        min, 
        max, 
        onFocus, 
        title, 
        className, 
        smartRound = true, 
        unit, 
        onBlur, 
        onKeyDown, 
        autoFocus, 
        stepLogic, 
        placeholder, 
        showSlider, 
        sliderMin, 
        sliderMax,
        presets,
        showQuickPopup = true,
        isAngle
    }, forwardedRef) => {
    
    const { t } = useLanguage();
    
    const getSafeString = (v: any) => {
        if (v === '' || v === null || v === undefined) return '';
        if (typeof v === 'number' && isNaN(v)) return '';
        return String(v);
    };

    const [displayValue, setDisplayValue] = useState<string>(() => getSafeString(value));
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [isHolding, setIsHolding] = useState(false);
    const [isTouchKeyboardOpen, setIsTouchKeyboardOpen] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [modifierState, setModifierState] = useState({ shift: false, alt: false, ctrl: false });
    const dragStartedRef = useRef(false);
    const holdTimeoutRef = useRef<any>(null);
    const initialPopupValueRef = useRef<number | null>(null);
    const internalRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const isAngleField = Boolean(isAngle);

    // Track modifier keys for dynamic button labels (+10, -10, +0.1, -0.1)
    useEffect(() => {
        const updateModifiers = (e: KeyboardEvent) => {
            setModifierState({
                shift: e.shiftKey,
                alt: e.altKey,
                ctrl: e.ctrlKey,
            });
        };

        const handleWindowBlur = () => {
            setModifierState({ shift: false, alt: false, ctrl: false });
        };

        window.addEventListener('keydown', updateModifiers);
        window.addEventListener('keyup', updateModifiers);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            window.removeEventListener('keydown', updateModifiers);
            window.removeEventListener('keyup', updateModifiers);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, []);

    const activeMultiplier = modifierState.shift ? 10 : ((modifierState.alt || modifierState.ctrl) ? 0.1 : 1);
    const computedStep = Math.round((step * activeMultiplier) * 100) / 100;

    // Combine forwardedRef and internalRef
    useEffect(() => {
        const ref = internalRef.current;
        if (!forwardedRef || !ref) return;
        if (typeof forwardedRef === 'function') {
            forwardedRef(ref);
        } else {
            forwardedRef.current = ref;
        }
    }, [forwardedRef]);

    // Track initial value when popup opens
    const handleTogglePopup = () => {
        if (!isPopupOpen) {
            const currentParsed = typeof value === 'number' && !isNaN(value) ? value : (parseFloat(displayValue) || 0);
            initialPopupValueRef.current = currentParsed;
            setIsPopupOpen(true);
        } else {
            setIsPopupOpen(false);
        }
    };

    // Reset to value prior to opening the popup window
    const handleResetToInitial = () => {
        if (initialPopupValueRef.current === null) return;
        const initialVal = initialPopupValueRef.current;
        setDisplayValue(String(initialVal));
        onChange(initialVal, true);
        onChangeEnd?.(initialVal);
    };

    // Close popup on outside click
    useEffect(() => {
        if (!isPopupOpen) return;
        const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
            if (
                popupRef.current && 
                !popupRef.current.contains(e.target as Node) &&
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsPopupOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
        };
    }, [isPopupOpen]);

    // Sync with external value changes, but only if not focused to avoid disrupting user input.
    useEffect(() => {
        if (document.activeElement !== internalRef.current && !isScrubbing) {
            const nextStr = getSafeString(value);
            if (nextStr === '' && displayValue !== '') {
                setDisplayValue('');
            } else if (nextStr !== '' && Number(displayValue) !== Number(value)) {
                setDisplayValue(nextStr);
            }
        }
    }, [value, displayValue, isScrubbing]);

    // Safe math expression parser (e.g. "100/2", "45+15", "360-90", "2.5*4")
    const evaluateExpression = (expr: string): number | null => {
        const trimmed = expr.trim();
        if (!trimmed) return null;
        const directNum = Number(trimmed);
        if (!isNaN(directNum)) return directNum;

        // Allow basic arithmetic characters only
        if (/^[0-9+\-*/().\s]+$/.test(trimmed)) {
            try {
                // eslint-disable-next-line no-new-func
                const result = Function(`"use strict"; return (${trimmed});`)();
                if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                    return result;
                }
            } catch {
                return null;
            }
        }
        return null;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setDisplayValue(newValue);
        const parsed = evaluateExpression(newValue);
        if (parsed !== null) {
            let bounded = parsed;
            if (min !== undefined) bounded = Math.max(min, bounded);
            if (max !== undefined) bounded = Math.min(max, bounded);
            // Live preview while typing (transient)
            onChange(bounded, false);
        }
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsHolding(false);
        setIsTouchKeyboardOpen(false);
        let num = evaluateExpression(displayValue);

        // If input is invalid or empty, revert to the last valid value from props.
        if (num === null) {
            const safeValue = isNaN(value as any) ? 0 : value;
            setDisplayValue((safeValue as any) === '' ? '' : String(safeValue));
            if ((safeValue as any) !== '' && safeValue !== Number(displayValue)) {
                onChange(Number(safeValue), true);
                onChangeEnd?.(Number(safeValue));
            }
            return;
        }

        if (min !== undefined) num = Math.max(min, num);
        if (max !== undefined) num = Math.min(max, num);

        // Smart round to hundredths for display if decimal
        num = Math.round(num * 100) / 100;

        onChange(num, true);
        onChangeEnd?.(num);
        
        setDisplayValue(String(num));
        if (onBlur) {
            onBlur(e);
        }
    };

    const handleStep = useCallback((direction: 'up' | 'down', multiplier = 1, isFinal = true) => {
        let currentValue = parseFloat(displayValue);
        if (isNaN(currentValue)) {
            currentValue = typeof value === 'number' && !isNaN(value) ? value : (min ?? 0);
        }

        let nextValue: number;
        const effectiveStep = (step || 1) * multiplier;
        
        if (stepLogic === 'grid') {
            const isUp = direction === 'up';
            if (isUp) {
                if (currentValue < 1) {
                    nextValue = currentValue + (0.1 * multiplier);
                } else {
                    nextValue = Math.floor(currentValue) + effectiveStep;
                }
            } else {
                if (currentValue <= 1) {
                    nextValue = currentValue - (0.1 * multiplier);
                } else {
                    nextValue = Math.ceil(currentValue) - effectiveStep;
                }
            }
            nextValue = Math.round(nextValue * 10) / 10;
        } else if (smartRound && currentValue % 1 !== 0 && multiplier === 1) {
            nextValue = direction === 'up' ? Math.ceil(currentValue) : Math.floor(currentValue);
        } else {
            nextValue = currentValue + (direction === 'up' ? effectiveStep : -effectiveStep);
            nextValue = Math.round(nextValue * 100) / 100;
        }

        if (min !== undefined) nextValue = Math.max(min, nextValue);
        if (max !== undefined) nextValue = Math.min(max, nextValue);
        
        setDisplayValue(String(nextValue));
        onChange(nextValue, isFinal);
        if (isFinal) {
            onChangeEnd?.(nextValue);
        }
    }, [displayValue, value, min, max, step, stepLogic, smartRound, onChange, onChangeEnd]);

    // Continuous stepping with long-press acceleration
    const startContinuousStep = (direction: 'up' | 'down', e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const isShift = ('shiftKey' in e && (e as React.MouseEvent).shiftKey) || modifierState.shift;
        const isAlt = ('altKey' in e && ((e as React.MouseEvent).altKey || (e as React.MouseEvent).ctrlKey)) || modifierState.alt || modifierState.ctrl;
        const mult = isShift ? 10 : (isAlt ? 0.1 : 1);
        
        let didContinuous = false;
        let timeoutId: any = null;
        let intervalId: any = null;
        let count = 0;

        const stop = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
            window.removeEventListener('mouseup', stop);
            window.removeEventListener('touchend', stop);
            window.removeEventListener('touchcancel', stop);

            if (didContinuous) {
                // Commit final value on release to history
                handleStep(direction, 0, true);
            }
        };

        window.addEventListener('mouseup', stop);
        window.addEventListener('touchend', stop);
        window.addEventListener('touchcancel', stop);

        // Immediate single step with isFinal=true unless continuously held
        handleStep(direction, mult, true);

        timeoutId = setTimeout(() => {
            didContinuous = true;
            intervalId = setInterval(() => {
                count++;
                const accMult = count > 20 ? 5 : (count > 8 ? 2 : 1);
                handleStep(direction, accMult * mult, false);
            }, 60);
        }, 280);
    };

    // Velocity-Sensitive Continuous Gesture Detection & Hold-to-Type
    const handlePointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
        if (disabled || e.button !== 0) return;

        const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
        if (isTouch) setIsTouchDevice(true);

        const startX = e.clientX;
        const startY = e.clientY;
        let isDrag = false;
        let lastX = startX;
        let lastTime = performance.now();
        let currentContinuousValue = parseFloat(displayValue);
        if (isNaN(currentContinuousValue)) {
            currentContinuousValue = typeof value === 'number' && !isNaN(value) ? value : (min ?? 0);
        }

        const targetInput = internalRef.current;
        const wasFocused = document.activeElement === targetInput;

        // Start Hold-to-Type timer (opens keyboard on long press for touch or holding still)
        if (isTouch && !isTouchKeyboardOpen) {
            setIsHolding(true);
            holdTimeoutRef.current = setTimeout(() => {
                setIsHolding(false);
                if (targetInput && !isDrag) {
                    setIsTouchKeyboardOpen(true);
                    setTimeout(() => {
                        targetInput.focus();
                        targetInput.select();
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                            try { navigator.vibrate(35); } catch {}
                        }
                    }, 20);
                }
            }, 380);
        }

        const onPointerMove = (moveE: PointerEvent) => {
            const deltaTotalX = moveE.clientX - startX;
            const deltaTotalY = moveE.clientY - startY;

            if (!isDrag) {
                // If moved beyond 4px, cancel hold timer and engage continuous drag
                if (Math.abs(deltaTotalX) > 4 && Math.abs(deltaTotalX) >= Math.abs(deltaTotalY)) {
                    isDrag = true;
                    dragStartedRef.current = true;
                    setIsScrubbing(true);
                    setIsHolding(false);
                    if (holdTimeoutRef.current) {
                        clearTimeout(holdTimeoutRef.current);
                        holdTimeoutRef.current = null;
                    }
                    if (isTouch && document.activeElement === targetInput) {
                        targetInput?.blur();
                    }
                }
            }

            if (isDrag) {
                moveE.preventDefault();
                const now = performance.now();
                const dt = Math.max(1, now - lastTime);
                const deltaX = moveE.clientX - lastX;
                lastX = moveE.clientX;
                lastTime = now;

                // Calculate movement speed in pixels per millisecond
                const speed = Math.abs(deltaX) / dt;

                // Dynamic velocity acceleration curve:
                // - Slow gentle moves (<0.2 px/ms): high precision (0.25x - 0.7x step)
                // - Normal moves (0.2 - 0.7 px/ms): standard step (1.0x - 2.0x)
                // - Fast flicks (>0.8 px/ms): exponential acceleration up to 20x
                let velocityMultiplier = 1;
                if (speed < 0.2) {
                    velocityMultiplier = 0.4;
                } else if (speed < 0.6) {
                    velocityMultiplier = 1.0 + (speed - 0.2) * 2.5;
                } else {
                    velocityMultiplier = 2.0 + Math.min(18, Math.pow(speed, 1.7) * 4.5);
                }

                const modifierMultiplier = moveE.shiftKey ? 10 : (moveE.altKey || moveE.ctrlKey ? 0.1 : 1);
                const stepSize = step || 1;

                // Continuous real-time value addition
                const deltaValue = deltaX * stepSize * velocityMultiplier * modifierMultiplier * 0.15;
                currentContinuousValue += deltaValue;

                let next = currentContinuousValue;
                if (min !== undefined) next = Math.max(min, next);
                if (max !== undefined) next = Math.min(max, next);
                currentContinuousValue = next;

                // Round to hundredths or integer depending on step
                const roundedNext = stepSize >= 1 ? Math.round(next * 10) / 10 : Math.round(next * 100) / 100;

                setDisplayValue(String(roundedNext));
                // Transient real-time update during drag gesture (isFinal = false)
                onChange(roundedNext, false);
            }
        };

        const onPointerUp = (upE: PointerEvent) => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);

            setIsHolding(false);
            if (holdTimeoutRef.current) {
                clearTimeout(holdTimeoutRef.current);
                holdTimeoutRef.current = null;
            }

            if (isDrag) {
                upE.preventDefault();
                upE.stopPropagation();
                setTimeout(() => {
                    setIsScrubbing(false);
                    dragStartedRef.current = false;
                }, 60);

                const stepSize = step || 1;
                const roundedFinal = stepSize >= 1 ? Math.round(currentContinuousValue * 10) / 10 : Math.round(currentContinuousValue * 100) / 100;
                setDisplayValue(String(roundedFinal));
                // Final commit when finger / mouse is released!
                onChange(roundedFinal, true);
                onChangeEnd?.(roundedFinal);
            } else {
                setIsScrubbing(false);
                dragStartedRef.current = false;
                
                if (isTouch) {
                    if (wasFocused && !isTouchKeyboardOpen) {
                        // Second tap on touch: open virtual keyboard
                        setIsTouchKeyboardOpen(true);
                        setTimeout(() => {
                            targetInput?.focus();
                            targetInput?.select();
                        }, 20);
                    } else if (!wasFocused) {
                        // First tap on touch: focus visually, keep keyboard hidden (inputMode="none")
                        targetInput?.focus();
                    }
                } else {
                    // Mouse on PC single click: focus & place cursor where clicked
                    if (!wasFocused && targetInput) {
                        targetInput.focus();
                    }
                }
            }
        };

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
    };

    // Double click to directly edit on PC / Touch
    const handleDoubleClick = () => {
        if (!disabled && internalRef.current) {
            setIsTouchKeyboardOpen(true);
            internalRef.current.focus();
            internalRef.current.select();
        }
    };

    // Mouse Wheel value adjustments on PC
    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
        if (disabled) return;
        const mult = e.shiftKey ? 10 : (e.altKey || e.ctrlKey ? 0.1 : 1);
        const direction = e.deltaY < 0 ? 'up' : 'down';
        handleStep(direction, mult, true);
    };

    const handleLocalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const mult = e.shiftKey ? 10 : (e.altKey || e.ctrlKey ? 0.1 : 1);
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleStep('up', mult, true);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleStep('down', mult, true);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
        }

        if (onKeyDown) {
            onKeyDown(e);
        }
    };

    const currentNum = typeof value === 'number' && !isNaN(value) ? value : (min ?? 0);
    const effMin = sliderMin ?? min ?? (isAngleField ? -360 : 0);
    const effMax = sliderMax ?? max ?? (isAngleField ? 360 : Math.max(100, Math.ceil((currentNum || 10) * 2)));
    const shouldShowInlineSlider = Boolean(showSlider);
    
    // Effective presets list
    const effectivePresets = useMemo(() => {
        if (presets && presets.length > 0) return presets;
        if (isAngleField) return [0, 30, 45, 60, 90, 120, 135, 180, 270, 360];
        if (min !== undefined && max !== undefined && max > min) {
            const span = max - min;
            if (span <= 10) {
                const list: number[] = [];
                for (let v = min; v <= max; v += (step || 1)) list.push(v);
                return list.length <= 8 ? list : undefined;
            }
            return [
                min,
                Math.round(min + span * 0.25),
                Math.round(min + span * 0.5),
                Math.round(min + span * 0.75),
                max
            ];
        }
        return undefined;
    }, [presets, isAngleField, min, max, step]);

    return (
        <div ref={containerRef} className={`relative flex items-center gap-1.5 w-full ${disabled ? 'opacity-50' : ''}`}>
            <div className="relative flex-1 group min-w-[60px] flex items-center">
                <input
                    ref={internalRef}
                    id={id}
                    type="text"
                    inputMode={isTouchKeyboardOpen ? "decimal" : (isTouchDevice ? "none" : "decimal")}
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onPointerDown={handlePointerDown}
                    onDoubleClick={handleDoubleClick}
                    disabled={disabled}
                    onFocus={onFocus}
                    title={title || (t('form.dragToAdjust') || "Потягніть для плавного регулювання (швидкість впливає на крок). Затисніть (або 2x клік) для ручного вводу")}
                    placeholder={placeholder}
                    className={`bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2.5 py-1 w-full h-8 border border-[var(--border-secondary)] transition-all ${
                        isScrubbing 
                            ? 'ring-2 ring-[var(--accent-primary)] bg-[var(--accent-primary)]/15 cursor-ew-resize select-none border-[var(--accent-primary)] shadow-sm' 
                            : isHolding 
                                ? 'ring-2 ring-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/10 scale-[1.02]'
                                : 'focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none cursor-ew-resize sm:cursor-default'
                    } disabled:cursor-not-allowed ${unit ? 'pr-14' : 'pr-7'} ${className ?? ''}`}
                    onKeyDown={handleLocalKeyDown}
                    autoFocus={autoFocus}
                />
                
                {unit && !disabled && (
                    <span className="absolute right-7 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none text-xs font-semibold">
                        {unit}
                    </span>
                )}

                {/* Stepper Buttons (Up / Down) */}
                {!disabled && (
                    <div className="absolute right-1 top-0 h-full flex flex-col justify-center items-center opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                        <button 
                            onMouseDown={(e) => startContinuousStep('up', e)} 
                            onTouchStart={(e) => startContinuousStep('up', e)}
                            className="px-1 h-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] active:text-[var(--accent-primary)] select-none flex items-center justify-center" 
                            tabIndex={-1}
                            title={t('form.increaseValue') || "Збільшити (Shift=x10, Alt=x0.1, утримуйте для прискорення)"}
                        >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
                        </button>
                        <button 
                            onMouseDown={(e) => startContinuousStep('down', e)} 
                            onTouchStart={(e) => startContinuousStep('down', e)}
                            className="px-1 h-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] active:text-[var(--accent-primary)] select-none flex items-center justify-center" 
                            tabIndex={-1}
                            title={t('form.decreaseValue') || "Зменшити (Shift=x10, Alt=x0.1, утримуйте для прискорення)"}
                        >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Inline Slider if enabled */}
            {shouldShowInlineSlider && (
                <input
                    type="range"
                    min={effMin}
                    max={effMax}
                    step={step}
                    value={currentNum}
                    disabled={disabled}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setDisplayValue(String(val));
                        onChange(val, false);
                    }}
                    onPointerUp={(e) => {
                        const val = parseFloat((e.target as HTMLInputElement).value);
                        onChange(val, true);
                        onChangeEnd?.(val);
                    }}
                    onTouchEnd={(e) => {
                        const val = parseFloat((e.target as HTMLInputElement).value);
                        onChange(val, true);
                        onChangeEnd?.(val);
                    }}
                    onMouseUp={(e) => {
                        const val = parseFloat((e.target as HTMLInputElement).value);
                        onChange(val, true);
                        onChangeEnd?.(val);
                    }}
                    className="w-16 sm:w-24 h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)] touch-none flex-shrink-0"
                    title={title}
                />
            )}

            {/* Quick Controls Popover Toggle Button (Mobile & Desktop) */}
            {showQuickPopup && !shouldShowInlineSlider && !disabled && (
                <button
                    type="button"
                    onClick={handleTogglePopup}
                    title={t('form.quickSettings') || "Швидкі налаштування: слайдер, пресети та скидання"}
                    className={`h-8 w-7 shrink-0 flex items-center justify-center rounded border transition-colors ${
                        isPopupOpen 
                            ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-xs' 
                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-secondary)]'
                    }`}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="21" x2="4" y2="14" />
                        <line x1="4" y1="10" x2="4" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12" y2="3" />
                        <line x1="20" y1="21" x2="20" y2="16" />
                        <line x1="20" y1="12" x2="20" y2="3" />
                        <line x1="1" y1="14" x2="7" y2="14" />
                        <line x1="9" y1="8" x2="15" y2="8" />
                        <line x1="17" y1="16" x2="23" y2="16" />
                    </svg>
                </button>
            )}

            {/* Quick Floating Controls Popover */}
            {isPopupOpen && !disabled && (
                <div 
                    ref={popupRef}
                    className="absolute right-0 top-full mt-1.5 z-50 p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl shadow-2xl space-y-3 min-w-[240px] max-w-[300px] backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
                >
                    {/* Header with Title, Reset Button & Current Value */}
                    <div className="flex items-center justify-between text-xs border-b border-[var(--border-secondary)] pb-2 gap-2">
                        <span className="font-bold text-[var(--text-secondary)] truncate max-w-[90px]">{title || (t('form.value') || 'Значення')}</span>
                        
                        <div className="flex items-center gap-1.5">
                            {initialPopupValueRef.current !== null && (
                                <button
                                    type="button"
                                    onClick={handleResetToInitial}
                                    title={(t('form.resetToInitial') || "Скинути до початкового значення ({val})").replace('{val}', `${initialPopupValueRef.current}${unit || ''}`)}
                                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)] transition-all shadow-xs"
                                >
                                    <RefreshIcon size={11} />
                                    <span>{t('button.reset') || 'Скинути'}</span>
                                </button>
                            )}
                            <span className="font-extrabold text-[var(--accent-primary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded border border-[var(--border-secondary)]">
                                {displayValue}{unit || ''}
                            </span>
                        </div>
                    </div>

                    {/* Circular Angle Dial if Angle Field */}
                    {isAngleField ? (
                        <div className="py-1">
                            <CircularAnglePicker
                                value={currentNum}
                                onChange={(val, isFinal) => {
                                    setDisplayValue(String(val));
                                    onChange(val, isFinal);
                                }}
                                onChangeEnd={onChangeEnd}
                                min={min ?? -360}
                                max={max ?? 360}
                                step={step}
                                disabled={disabled}
                            />
                        </div>
                    ) : (
                        /* Touch-Friendly Steppers for non-angle fields */
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onMouseDown={(e) => startContinuousStep('down', e)}
                                onTouchStart={(e) => startContinuousStep('down', e)}
                                className={`touch-none flex-1 py-1.5 rounded-lg font-bold text-sm border transition-all shadow-xs flex items-center justify-center gap-1 select-none active:scale-95 ${
                                    activeMultiplier !== 1
                                        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/50'
                                        : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-secondary)]'
                                }`}
                                title={t('form.decreaseValue') || "Зменшити (Shift=x10, Alt=x0.1)"}
                            >
                                <span>−{computedStep}</span>
                            </button>
                            <button
                                type="button"
                                onMouseDown={(e) => startContinuousStep('up', e)}
                                onTouchStart={(e) => startContinuousStep('up', e)}
                                className={`touch-none flex-1 py-1.5 rounded-lg font-bold text-sm border transition-all shadow-xs flex items-center justify-center gap-1 select-none active:scale-95 ${
                                    activeMultiplier !== 1
                                        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/50'
                                        : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-secondary)]'
                                }`}
                                title={t('form.increaseValue') || "Збільшити (Shift=x10, Alt=x0.1)"}
                            >
                                <span>+{computedStep}</span>
                            </button>
                        </div>
                    )}

                    {/* Range Slider */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-[var(--text-tertiary)]">
                            <span>{effMin}{unit || ''}</span>
                            <span>{effMax}{unit || ''}</span>
                        </div>
                        <input
                            type="range"
                            min={effMin}
                            max={effMax}
                            step={step}
                            value={currentNum}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setDisplayValue(String(val));
                                onChange(val, false);
                            }}
                            onPointerUp={(e) => {
                                const val = parseFloat((e.target as HTMLInputElement).value);
                                onChange(val, true);
                                onChangeEnd?.(val);
                            }}
                            onTouchEnd={(e) => {
                                const val = parseFloat((e.target as HTMLInputElement).value);
                                onChange(val, true);
                                onChangeEnd?.(val);
                            }}
                            onMouseUp={(e) => {
                                const val = parseFloat((e.target as HTMLInputElement).value);
                                onChange(val, true);
                                onChangeEnd?.(val);
                            }}
                            className="w-full h-2.5 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)] touch-none"
                        />
                    </div>

                    {/* Quick Preset Chips */}
                    {effectivePresets && effectivePresets.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-[var(--border-secondary)]">
                            <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                                {t('form.quickValues') || 'Швидкі значення:'}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {effectivePresets.map((presetVal) => (
                                    <button
                                        key={presetVal}
                                        type="button"
                                        onClick={() => {
                                            setDisplayValue(String(presetVal));
                                            onChange(presetVal, true);
                                            onChangeEnd?.(presetVal);
                                        }}
                                        className={`px-2 py-1 text-xs font-semibold rounded-md border transition-all ${
                                            Number(displayValue) === presetVal
                                                ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border-[var(--border-secondary)]'
                                        }`}
                                    >
                                        {presetVal}{unit || ''}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
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

const PRIMARY_WEB_COLORS = [
    // Whites
    { name: 'Snow', hex: '#fffafa' },
    { name: 'White', hex: '#ffffff' },
    // Grays
    { name: 'Gainsboro', hex: '#dcdcdc' },
    { name: 'LightGray', hex: '#d3d3d3' },
    { name: 'Silver', hex: '#c0c0c0' },
    { name: 'DarkGray', hex: '#a9a9a9' },
    { name: 'Gray', hex: '#808080' },
    { name: 'DimGray', hex: '#696969' },
    { name: 'Black', hex: '#000000' },
    // Reds & Pinks
    { name: 'LightCoral', hex: '#f08080' },
    { name: 'Salmon', hex: '#fa8072' },
    { name: 'Crimson', hex: '#dc143c' },
    { name: 'Red', hex: '#ff0000' },
    { name: 'FireBrick', hex: '#b22222' },
    { name: 'DarkRed', hex: '#8b0000' },
    { name: 'LightPink', hex: '#ffb6c1' },
    { name: 'Pink', hex: '#ffc0cb' },
    { name: 'HotPink', hex: '#ff69b4' },
    { name: 'DeepPink', hex: '#ff1493' },
    // Oranges
    { name: 'Coral', hex: '#ff7f50' },
    { name: 'Tomato', hex: '#ff6347' },
    { name: 'OrangeRed', hex: '#ff4500' },
    { name: 'DarkOrange', hex: '#ff8c00' },
    { name: 'Orange', hex: '#ffa500' },
    // Yellows
    { name: 'Gold', hex: '#ffd700' },
    { name: 'Yellow', hex: '#ffff00' },
    { name: 'LightYellow', hex: '#ffffe0' },
    { name: 'LemonChiffon', hex: '#fffacd' },
    { name: 'Khaki', hex: '#f0e68c' },
    // Purples
    { name: 'Lavender', hex: '#e6e6fa' },
    { name: 'Plum', hex: '#dda0dd' },
    { name: 'Violet', hex: '#ee82ee' },
    { name: 'Fuchsia', hex: '#ff00ff' },
    { name: 'Orchid', hex: '#da70d6' },
    { name: 'MediumPurple', hex: '#9370db' },
    { name: 'BlueViolet', hex: '#8a2be2' },
    { name: 'Purple', hex: '#800080' },
    { name: 'Indigo', hex: '#4b0082' },
    // Greens
    { name: 'GreenYellow', hex: '#adff2f' },
    { name: 'LawnGreen', hex: '#7cfc00' },
    { name: 'Lime', hex: '#00ff00' },
    { name: 'LimeGreen', hex: '#32cd32' },
    { name: 'PaleGreen', hex: '#98fb98' },
    { name: 'SpringGreen', hex: '#00ff7f' },
    { name: 'SeaGreen', hex: '#2e8b57' },
    { name: 'Green', hex: '#008000' },
    { name: 'OliveDrab', hex: '#6b8e23' },
    { name: 'Olive', hex: '#808000' },
    { name: 'DarkSlateGray', hex: '#2f4f4f' },
    // Blues & Cyans
    { name: 'LightCyan', hex: '#e0ffff' },
    { name: 'Aqua', hex: '#00ffff' },
    { name: 'PowderBlue', hex: '#b0e0e6' },
    { name: 'LightBlue', hex: '#add8e6' },
    { name: 'SkyBlue', hex: '#87ceeb' },
    { name: 'DeepSkyBlue', hex: '#00bfff' },
    { name: 'DodgerBlue', hex: '#1e90ff' },
    { name: 'CornflowerBlue', hex: '#6495ed' },
    { name: 'SteelBlue', hex: '#4682b4' },
    { name: 'RoyalBlue', hex: '#4169e1' },
    { name: 'Blue', hex: '#0000ff' },
    { name: 'MediumBlue', hex: '#0000cd' },
    { name: 'DarkBlue', hex: '#00008b' },
    { name: 'Navy', hex: '#000080' },
    { name: 'MidnightBlue', hex: '#191970' },
    { name: 'Teal', hex: '#008080' },
    // Browns
    { name: 'Cornsilk', hex: '#fff8dc' },
    { name: 'Tan', hex: '#d2b48c' },
    { name: 'RosyBrown', hex: '#bc8f8f' },
    { name: 'SaddleBrown', hex: '#8b4513' },
    { name: 'Peru', hex: '#cd853f' },
    { name: 'Chocolate', hex: '#d2691e' },
    { name: 'Sienna', hex: '#a0522d' },
    { name: 'Brown', hex: '#a52a2a' },
    { name: 'Maroon', hex: '#800000' },
];

const TKINTER_NAMED_COLORS = [
    { name: 'AliceBlue', hex: '#f0f8ff' },
    { name: 'AntiqueWhite', hex: '#faebd7' },
    { name: 'AntiqueWhite1', hex: '#ffefdb' },
    { name: 'AntiqueWhite2', hex: '#eedfcc' },
    { name: 'AntiqueWhite3', hex: '#cdc0b0' },
    { name: 'AntiqueWhite4', hex: '#8b8378' },
    { name: 'aqua', hex: '#00ffff' },
    { name: 'aquamarine', hex: '#7fffd4' },
    { name: 'aquamarine1', hex: '#7fffd4' },
    { name: 'aquamarine2', hex: '#76eec6' },
    { name: 'aquamarine3', hex: '#66cdaa' },
    { name: 'aquamarine4', hex: '#458b74' },
    { name: 'azure', hex: '#f0ffff' },
    { name: 'azure1', hex: '#f0ffff' },
    { name: 'azure2', hex: '#e0eeee' },
    { name: 'azure3', hex: '#c1cdcd' },
    { name: 'azure4', hex: '#838b8b' },
    { name: 'beige', hex: '#f5f5dc' },
    { name: 'bisque', hex: '#ffe4c4' },
    { name: 'bisque1', hex: '#ffe4c4' },
    { name: 'bisque2', hex: '#eed5b7' },
    { name: 'bisque3', hex: '#cdb79e' },
    { name: 'bisque4', hex: '#8b7d6b' },
    { name: 'black', hex: '#000000' },
    { name: 'BlanchedAlmond', hex: '#ffebcd' },
    { name: 'blue', hex: '#0000ff' },
    { name: 'blue1', hex: '#0000ff' },
    { name: 'blue2', hex: '#0000ee' },
    { name: 'blue3', hex: '#0000cd' },
    { name: 'blue4', hex: '#00008b' },
    { name: 'BlueViolet', hex: '#8a2be2' },
    { name: 'brown', hex: '#a52a2a' },
    { name: 'brown1', hex: '#ff4040' },
    { name: 'brown2', hex: '#ee3b3b' },
    { name: 'brown3', hex: '#cd3333' },
    { name: 'brown4', hex: '#8b2323' },
    { name: 'burlywood', hex: '#deb887' },
    { name: 'burlywood1', hex: '#ffd39b' },
    { name: 'burlywood2', hex: '#eec591' },
    { name: 'burlywood3', hex: '#cdaa7d' },
    { name: 'burlywood4', hex: '#8b7355' },
    { name: 'CadetBlue', hex: '#5f9ea0' },
    { name: 'CadetBlue1', hex: '#98f5ff' },
    { name: 'CadetBlue2', hex: '#8ee5ee' },
    { name: 'CadetBlue3', hex: '#7ac5cd' },
    { name: 'CadetBlue4', hex: '#53868b' },
    { name: 'chartreuse', hex: '#7fff00' },
    { name: 'chartreuse1', hex: '#7fff00' },
    { name: 'chartreuse2', hex: '#76ee00' },
    { name: 'chartreuse3', hex: '#66cd00' },
    { name: 'chartreuse4', hex: '#458b00' },
    { name: 'chocolate', hex: '#d2691e' },
    { name: 'chocolate1', hex: '#ff7f24' },
    { name: 'chocolate2', hex: '#ee7621' },
    { name: 'chocolate3', hex: '#cd661d' },
    { name: 'chocolate4', hex: '#8b4513' },
    { name: 'coral', hex: '#ff7f50' },
    { name: 'coral1', hex: '#ff7256' },
    { name: 'coral2', hex: '#ee6a50' },
    { name: 'coral3', hex: '#cd5b45' },
    { name: 'coral4', hex: '#8b3e2f' },
    { name: 'CornflowerBlue', hex: '#6495ed' },
    { name: 'cornsilk', hex: '#fff8dc' },
    { name: 'cornsilk1', hex: '#fff8dc' },
    { name: 'cornsilk2', hex: '#eee8cd' },
    { name: 'cornsilk3', hex: '#cdc8b1' },
    { name: 'cornsilk4', hex: '#8b8878' },
    { name: 'crimson', hex: '#dc143c' },
    { name: 'cyan', hex: '#00ffff' },
    { name: 'cyan1', hex: '#00ffff' },
    { name: 'cyan2', hex: '#00eeee' },
    { name: 'cyan3', hex: '#00cdcd' },
    { name: 'cyan4', hex: '#008b8b' },
    { name: 'DarkBlue', hex: '#00008b' },
    { name: 'DarkCyan', hex: '#008b8b' },
    { name: 'DarkGoldenrod', hex: '#b8860b' },
    { name: 'DarkGoldenrod1', hex: '#ffb90f' },
    { name: 'DarkGoldenrod2', hex: '#eead0e' },
    { name: 'DarkGoldenrod3', hex: '#cd950c' },
    { name: 'DarkGoldenrod4', hex: '#8b6508' },
    { name: 'DarkGray', hex: '#a9a9a9' },
    { name: 'DarkGreen', hex: '#006400' },
    { name: 'DarkGrey', hex: '#a9a9a9' },
    { name: 'DarkKhaki', hex: '#bdb76b' },
    { name: 'DarkMagenta', hex: '#8b008b' },
    { name: 'DarkOliveGreen', hex: '#556b2f' },
    { name: 'DarkOliveGreen1', hex: '#caff70' },
    { name: 'DarkOliveGreen2', hex: '#bcee68' },
    { name: 'DarkOliveGreen3', hex: '#a2cd5a' },
    { name: 'DarkOliveGreen4', hex: '#6e8b3d' },
    { name: 'DarkOrange', hex: '#ff8c00' },
    { name: 'DarkOrange1', hex: '#ff7f00' },
    { name: 'DarkOrange2', hex: '#ee7600' },
    { name: 'DarkOrange3', hex: '#cd6600' },
    { name: 'DarkOrange4', hex: '#8b4500' },
    { name: 'DarkOrchid', hex: '#9932cc' },
    { name: 'DarkOrchid1', hex: '#bf3eff' },
    { name: 'DarkOrchid2', hex: '#b23aee' },
    { name: 'DarkOrchid3', hex: '#9a32cd' },
    { name: 'DarkOrchid4', hex: '#68228b' },
    { name: 'DarkRed', hex: '#8b0000' },
    { name: 'DarkSalmon', hex: '#e9967a' },
    { name: 'DarkSeaGreen', hex: '#8fbc8f' },
    { name: 'DarkSeaGreen1', hex: '#c1ffc1' },
    { name: 'DarkSeaGreen2', hex: '#b4eeb4' },
    { name: 'DarkSeaGreen3', hex: '#9bcd9b' },
    { name: 'DarkSeaGreen4', hex: '#698b69' },
    { name: 'DarkSlateBlue', hex: '#483d8b' },
    { name: 'DarkSlateGray', hex: '#2f4f4f' },
    { name: 'DarkSlateGray1', hex: '#97ffff' },
    { name: 'DarkSlateGray2', hex: '#8deeee' },
    { name: 'DarkSlateGray3', hex: '#79cdcd' },
    { name: 'DarkSlateGray4', hex: '#528b8b' },
    { name: 'DarkSlateGrey', hex: '#2f4f4f' },
    { name: 'DarkTurquoise', hex: '#00ced1' },
    { name: 'DarkViolet', hex: '#9400d3' },
    { name: 'DeepPink', hex: '#ff1493' },
    { name: 'DeepPink1', hex: '#ff1493' },
    { name: 'DeepPink2', hex: '#ee1289' },
    { name: 'DeepPink3', hex: '#cd1076' },
    { name: 'DeepPink4', hex: '#8b0a50' },
    { name: 'DeepSkyBlue', hex: '#00bfff' },
    { name: 'DeepSkyBlue1', hex: '#00bfff' },
    { name: 'DeepSkyBlue2', hex: '#00b2ee' },
    { name: 'DeepSkyBlue3', hex: '#009acd' },
    { name: 'DeepSkyBlue4', hex: '#00688b' },
    { name: 'DimGray', hex: '#696969' },
    { name: 'DimGrey', hex: '#696969' },
    { name: 'DodgerBlue', hex: '#1e90ff' },
    { name: 'DodgerBlue1', hex: '#1e90ff' },
    { name: 'DodgerBlue2', hex: '#1c86ee' },
    { name: 'DodgerBlue3', hex: '#1874cd' },
    { name: 'DodgerBlue4', hex: '#104e8b' },
    { name: 'firebrick', hex: '#b22222' },
    { name: 'firebrick1', hex: '#ff3030' },
    { name: 'firebrick2', hex: '#ee2c2c' },
    { name: 'firebrick3', hex: '#cd2626' },
    { name: 'firebrick4', hex: '#8b1a1a' },
    { name: 'FloralWhite', hex: '#fffaf0' },
    { name: 'ForestGreen', hex: '#228b22' },
    { name: 'fuchsia', hex: '#ff00ff' },
    { name: 'gainsboro', hex: '#dcdcdc' },
    { name: 'GhostWhite', hex: '#f8f8ff' },
    { name: 'gold', hex: '#ffd700' },
    { name: 'gold1', hex: '#ffd700' },
    { name: 'gold2', hex: '#eec900' },
    { name: 'gold3', hex: '#cdad00' },
    { name: 'gold4', hex: '#8b7500' },
    { name: 'goldenrod', hex: '#daa520' },
    { name: 'goldenrod1', hex: '#ffc125' },
    { name: 'goldenrod2', hex: '#eeb422' },
    { name: 'goldenrod3', hex: '#cd9b1d' },
    { name: 'goldenrod4', hex: '#8b6914' },
    { name: 'gray', hex: '#808080' },
    { name: 'gray0', hex: '#000000' },
    { name: 'gray1', hex: '#030303' },
    { name: 'gray2', hex: '#050505' },
    { name: 'gray3', hex: '#080808' },
    { name: 'gray4', hex: '#0a0a0a' },
    { name: 'gray5', hex: '#0d0d0d' },
    { name: 'gray6', hex: '#0f0f0f' },
    { name: 'gray7', hex: '#121212' },
    { name: 'gray8', hex: '#141414' },
    { name: 'gray9', hex: '#171717' },
    { name: 'gray10', hex: '#1a1a1a' },
    { name: 'gray11', hex: '#1c1c1c' },
    { name: 'gray12', hex: '#1f1f1f' },
    { name: 'gray13', hex: '#212121' },
    { name: 'gray14', hex: '#242424' },
    { name: 'gray15', hex: '#262626' },
    { name: 'gray16', hex: '#292929' },
    { name: 'gray17', hex: '#2b2b2b' },
    { name: 'gray18', hex: '#2e2e2e' },
    { name: 'gray19', hex: '#303030' },
    { name: 'gray20', hex: '#333333' },
    { name: 'gray21', hex: '#363636' },
    { name: 'gray22', hex: '#383838' },
    { name: 'gray23', hex: '#3b3b3b' },
    { name: 'gray24', hex: '#3d3d3d' },
    { name: 'gray25', hex: '#404040' },
    { name: 'gray26', hex: '#424242' },
    { name: 'gray27', hex: '#454545' },
    { name: 'gray28', hex: '#474747' },
    { name: 'gray29', hex: '#4a4a4a' },
    { name: 'gray30', hex: '#4d4d4d' },
    { name: 'gray31', hex: '#4f4f4f' },
    { name: 'gray32', hex: '#525252' },
    { name: 'gray33', hex: '#545454' },
    { name: 'gray34', hex: '#575757' },
    { name: 'gray35', hex: '#595959' },
    { name: 'gray36', hex: '#5c5c5c' },
    { name: 'gray37', hex: '#5e5e5e' },
    { name: 'gray38', hex: '#616161' },
    { name: 'gray39', hex: '#636363' },
    { name: 'gray40', hex: '#666666' },
    { name: 'gray41', hex: '#696969' },
    { name: 'gray42', hex: '#6b6b6b' },
    { name: 'gray43', hex: '#6e6e6e' },
    { name: 'gray44', hex: '#707070' },
    { name: 'gray45', hex: '#737373' },
    { name: 'gray46', hex: '#757575' },
    { name: 'gray47', hex: '#787878' },
    { name: 'gray48', hex: '#7a7a7a' },
    { name: 'gray49', hex: '#7d7d7d' },
    { name: 'gray50', hex: '#7f7f7f' },
    { name: 'gray51', hex: '#828282' },
    { name: 'gray52', hex: '#858585' },
    { name: 'gray53', hex: '#878787' },
    { name: 'gray54', hex: '#8a8a8a' },
    { name: 'gray55', hex: '#8c8c8c' },
    { name: 'gray56', hex: '#8f8f8f' },
    { name: 'gray57', hex: '#919191' },
    { name: 'gray58', hex: '#949494' },
    { name: 'gray59', hex: '#969696' },
    { name: 'gray60', hex: '#999999' },
    { name: 'gray61', hex: '#9c9c9c' },
    { name: 'gray62', hex: '#9e9e9e' },
    { name: 'gray63', hex: '#a1a1a1' },
    { name: 'gray64', hex: '#a3a3a3' },
    { name: 'gray65', hex: '#a6a6a6' },
    { name: 'gray66', hex: '#a8a8a8' },
    { name: 'gray67', hex: '#ababab' },
    { name: 'gray68', hex: '#adadad' },
    { name: 'gray69', hex: '#b0b0b0' },
    { name: 'gray70', hex: '#b3b3b3' },
    { name: 'gray71', hex: '#b5b5b5' },
    { name: 'gray72', hex: '#b8b8b8' },
    { name: 'gray73', hex: '#bababa' },
    { name: 'gray74', hex: '#bdbdbd' },
    { name: 'gray75', hex: '#bfbfbf' },
    { name: 'gray76', hex: '#c2c2c2' },
    { name: 'gray77', hex: '#c4c4c4' },
    { name: 'gray78', hex: '#c7c7c7' },
    { name: 'gray79', hex: '#c9c9c9' },
    { name: 'gray80', hex: '#cccccc' },
    { name: 'gray81', hex: '#cfcfcf' },
    { name: 'gray82', hex: '#d1d1d1' },
    { name: 'gray83', hex: '#d4d4d4' },
    { name: 'gray84', hex: '#d6d6d6' },
    { name: 'gray85', hex: '#d9d9d9' },
    { name: 'gray86', hex: '#dbdbdb' },
    { name: 'gray87', hex: '#dedede' },
    { name: 'gray88', hex: '#e0e0e0' },
    { name: 'gray89', hex: '#e3e3e3' },
    { name: 'gray90', hex: '#e5e5e5' },
    { name: 'gray91', hex: '#e8e8e8' },
    { name: 'gray92', hex: '#ebebeb' },
    { name: 'gray93', hex: '#ededed' },
    { name: 'gray94', hex: '#f0f0f0' },
    { name: 'gray95', hex: '#f2f2f2' },
    { name: 'gray96', hex: '#f5f5f5' },
    { name: 'gray97', hex: '#f7f7f7' },
    { name: 'gray98', hex: '#fafafa' },
    { name: 'gray99', hex: '#fcfcfc' },
    { name: 'gray100', hex: '#ffffff' },
    { name: 'green', hex: '#008000' },
    { name: 'green1', hex: '#00ff00' },
    { name: 'green2', hex: '#00ee00' },
    { name: 'green3', hex: '#00cd00' },
    { name: 'green4', hex: '#008b00' },
    { name: 'GreenYellow', hex: '#adff2f' },
    { name: 'grey', hex: '#808080' },
    { name: 'grey0', hex: '#000000' },
    { name: 'grey1', hex: '#030303' },
    { name: 'grey2', hex: '#050505' },
    { name: 'grey3', hex: '#080808' },
    { name: 'grey4', hex: '#0a0a0a' },
    { name: 'grey5', hex: '#0d0d0d' },
    { name: 'grey6', hex: '#0f0f0f' },
    { name: 'grey7', hex: '#121212' },
    { name: 'grey8', hex: '#141414' },
    { name: 'grey9', hex: '#171717' },
    { name: 'grey10', hex: '#1a1a1a' },
    { name: 'grey11', hex: '#1c1c1c' },
    { name: 'grey12', hex: '#1f1f1f' },
    { name: 'grey13', hex: '#212121' },
    { name: 'grey14', hex: '#242424' },
    { name: 'grey15', hex: '#262626' },
    { name: 'grey16', hex: '#292929' },
    { name: 'grey17', hex: '#2b2b2b' },
    { name: 'grey18', hex: '#2e2e2e' },
    { name: 'grey19', hex: '#303030' },
    { name: 'grey20', hex: '#333333' },
    { name: 'grey21', hex: '#363636' },
    { name: 'grey22', hex: '#383838' },
    { name: 'grey23', hex: '#3b3b3b' },
    { name: 'grey24', hex: '#3d3d3d' },
    { name: 'grey25', hex: '#404040' },
    { name: 'grey26', hex: '#424242' },
    { name: 'grey27', hex: '#454545' },
    { name: 'grey28', hex: '#474747' },
    { name: 'grey29', hex: '#4a4a4a' },
    { name: 'grey30', hex: '#4d4d4d' },
    { name: 'grey31', hex: '#4f4f4f' },
    { name: 'grey32', hex: '#525252' },
    { name: 'grey33', hex: '#545454' },
    { name: 'grey34', hex: '#575757' },
    { name: 'grey35', hex: '#595959' },
    { name: 'grey36', hex: '#5c5c5c' },
    { name: 'grey37', hex: '#5e5e5e' },
    { name: 'grey38', hex: '#616161' },
    { name: 'grey39', hex: '#636363' },
    { name: 'grey40', hex: '#666666' },
    { name: 'grey41', hex: '#696969' },
    { name: 'grey42', hex: '#6b6b6b' },
    { name: 'grey43', hex: '#6e6e6e' },
    { name: 'grey44', hex: '#707070' },
    { name: 'grey45', hex: '#737373' },
    { name: 'grey46', hex: '#757575' },
    { name: 'grey47', hex: '#787878' },
    { name: 'grey48', hex: '#7a7a7a' },
    { name: 'grey49', hex: '#7d7d7d' },
    { name: 'grey50', hex: '#7f7f7f' },
    { name: 'grey51', hex: '#828282' },
    { name: 'grey52', hex: '#858585' },
    { name: 'grey53', hex: '#878787' },
    { name: 'grey54', hex: '#8a8a8a' },
    { name: 'grey55', hex: '#8c8c8c' },
    { name: 'grey56', hex: '#8f8f8f' },
    { name: 'grey57', hex: '#919191' },
    { name: 'grey58', hex: '#949494' },
    { name: 'grey59', hex: '#969696' },
    { name: 'grey60', hex: '#999999' },
    { name: 'grey61', hex: '#9c9c9c' },
    { name: 'grey62', hex: '#9e9e9e' },
    { name: 'grey63', hex: '#a1a1a1' },
    { name: 'grey64', hex: '#a3a3a3' },
    { name: 'grey65', hex: '#a6a6a6' },
    { name: 'grey66', hex: '#a8a8a8' },
    { name: 'grey67', hex: '#ababab' },
    { name: 'grey68', hex: '#adadad' },
    { name: 'grey69', hex: '#b0b0b0' },
    { name: 'grey70', hex: '#b3b3b3' },
    { name: 'grey71', hex: '#b5b5b5' },
    { name: 'grey72', hex: '#b8b8b8' },
    { name: 'grey73', hex: '#bababa' },
    { name: 'grey74', hex: '#bdbdbd' },
    { name: 'grey75', hex: '#bfbfbf' },
    { name: 'grey76', hex: '#c2c2c2' },
    { name: 'grey77', hex: '#c4c4c4' },
    { name: 'grey78', hex: '#c7c7c7' },
    { name: 'grey79', hex: '#c9c9c9' },
    { name: 'grey80', hex: '#cccccc' },
    { name: 'grey81', hex: '#cfcfcf' },
    { name: 'grey82', hex: '#d1d1d1' },
    { name: 'grey83', hex: '#d4d4d4' },
    { name: 'grey84', hex: '#d6d6d6' },
    { name: 'grey85', hex: '#d9d9d9' },
    { name: 'grey86', hex: '#dbdbdb' },
    { name: 'grey87', hex: '#dedede' },
    { name: 'grey88', hex: '#e0e0e0' },
    { name: 'grey89', hex: '#e3e3e3' },
    { name: 'grey90', hex: '#e5e5e5' },
    { name: 'grey91', hex: '#e8e8e8' },
    { name: 'grey92', hex: '#ebebeb' },
    { name: 'grey93', hex: '#ededed' },
    { name: 'grey94', hex: '#f0f0f0' },
    { name: 'grey95', hex: '#f2f2f2' },
    { name: 'grey96', hex: '#f5f5f5' },
    { name: 'grey97', hex: '#f7f7f7' },
    { name: 'grey98', hex: '#fafafa' },
    { name: 'grey99', hex: '#fcfcfc' },
    { name: 'grey100', hex: '#ffffff' },
    { name: 'honeydew', hex: '#f0fff0' },
    { name: 'honeydew1', hex: '#f0fff0' },
    { name: 'honeydew2', hex: '#e0eee0' },
    { name: 'honeydew3', hex: '#c1cdc1' },
    { name: 'honeydew4', hex: '#838b83' },
    { name: 'HotPink', hex: '#ff69b4' },
    { name: 'HotPink1', hex: '#ff6eb4' },
    { name: 'HotPink2', hex: '#ee6aa7' },
    { name: 'HotPink3', hex: '#cd6090' },
    { name: 'HotPink4', hex: '#8b3a62' },
    { name: 'IndianRed', hex: '#cd5c5c' },
    { name: 'IndianRed1', hex: '#ff6a6a' },
    { name: 'IndianRed2', hex: '#ee6363' },
    { name: 'IndianRed3', hex: '#cd5555' },
    { name: 'IndianRed4', hex: '#8b3a3a' },
    { name: 'indigo', hex: '#4b0082' },
    { name: 'ivory', hex: '#fffff0' },
    { name: 'ivory1', hex: '#fffff0' },
    { name: 'ivory2', hex: '#eeeee0' },
    { name: 'ivory3', hex: '#cdcdc1' },
    { name: 'ivory4', hex: '#8b8b83' },
    { name: 'khaki', hex: '#f0e68c' },
    { name: 'khaki1', hex: '#fff68f' },
    { name: 'khaki2', hex: '#eee685' },
    { name: 'khaki3', hex: '#cdc673' },
    { name: 'khaki4', hex: '#8b864e' },
    { name: 'lavender', hex: '#e6e6fa' },
    { name: 'LavenderBlush', hex: '#fff0f5' },
    { name: 'LavenderBlush1', hex: '#fff0f5' },
    { name: 'LavenderBlush2', hex: '#eee0e5' },
    { name: 'LavenderBlush3', hex: '#cdc1c5' },
    { name: 'LavenderBlush4', hex: '#8b8386' },
    { name: 'LawnGreen', hex: '#7cfc00' },
    { name: 'LemonChiffon', hex: '#fffacd' },
    { name: 'LemonChiffon1', hex: '#fffacd' },
    { name: 'LemonChiffon2', hex: '#eee9bf' },
    { name: 'LemonChiffon3', hex: '#cdc9a5' },
    { name: 'LemonChiffon4', hex: '#8b8970' },
    { name: 'LightBlue', hex: '#add8e6' },
    { name: 'LightBlue1', hex: '#bfefff' },
    { name: 'LightBlue2', hex: '#b2dfee' },
    { name: 'LightBlue3', hex: '#9ac0cd' },
    { name: 'LightBlue4', hex: '#68838b' },
    { name: 'LightCoral', hex: '#f08080' },
    { name: 'LightCyan', hex: '#e0ffff' },
    { name: 'LightCyan1', hex: '#e0ffff' },
    { name: 'LightCyan2', hex: '#d1eeee' },
    { name: 'LightCyan3', hex: '#b4cdcd' },
    { name: 'LightCyan4', hex: '#7a8b8b' },
    { name: 'LightGoldenrod', hex: '#eedd82' },
    { name: 'LightGoldenrod1', hex: '#ffec8b' },
    { name: 'LightGoldenrod2', hex: '#eedc82' },
    { name: 'LightGoldenrod3', hex: '#cdbe70' },
    { name: 'LightGoldenrod4', hex: '#8b814c' },
    { name: 'LightGoldenrodYellow', hex: '#fafad2' },
    { name: 'LightGray', hex: '#d3d3d3' },
    { name: 'LightGreen', hex: '#90ee90' },
    { name: 'LightGrey', hex: '#d3d3d3' },
    { name: 'LightPink', hex: '#ffb6c1' },
    { name: 'LightPink1', hex: '#ffaeb9' },
    { name: 'LightPink2', hex: '#eea2ad' },
    { name: 'LightPink3', hex: '#cd8c95' },
    { name: 'LightPink4', hex: '#8b5f65' },
    { name: 'LightSalmon', hex: '#ffa07a' },
    { name: 'LightSalmon1', hex: '#ffa07a' },
    { name: 'LightSalmon2', hex: '#ee9572' },
    { name: 'LightSalmon3', hex: '#cd8162' },
    { name: 'LightSalmon4', hex: '#8b5742' },
    { name: 'LightSeaGreen', hex: '#20b2aa' },
    { name: 'LightSkyBlue', hex: '#87cefa' },
    { name: 'LightSkyBlue1', hex: '#b0e2ff' },
    { name: 'LightSkyBlue2', hex: '#a4d3ee' },
    { name: 'LightSkyBlue3', hex: '#8db6cd' },
    { name: 'LightSkyBlue4', hex: '#607b8b' },
    { name: 'LightSlateBlue', hex: '#8470ff' },
    { name: 'LightSlateGray', hex: '#778899' },
    { name: 'LightSlateGrey', hex: '#778899' },
    { name: 'LightSteelBlue', hex: '#b0c4de' },
    { name: 'LightSteelBlue1', hex: '#cae1ff' },
    { name: 'LightSteelBlue2', hex: '#bcd2ee' },
    { name: 'LightSteelBlue3', hex: '#a2b5cd' },
    { name: 'LightSteelBlue4', hex: '#6e7b8b' },
    { name: 'LightYellow', hex: '#ffffe0' },
    { name: 'LightYellow1', hex: '#ffffe0' },
    { name: 'LightYellow2', hex: '#eeeed1' },
    { name: 'LightYellow3', hex: '#cdcdb4' },
    { name: 'LightYellow4', hex: '#8b8b7a' },
    { name: 'lime', hex: '#00ff00' },
    { name: 'LimeGreen', hex: '#32cd32' },
    { name: 'linen', hex: '#faf0e6' },
    { name: 'magenta', hex: '#ff00ff' },
    { name: 'magenta1', hex: '#ff00ff' },
    { name: 'magenta2', hex: '#ee00ee' },
    { name: 'magenta3', hex: '#cd00cd' },
    { name: 'magenta4', hex: '#8b008b' },
    { name: 'maroon', hex: '#800000' },
    { name: 'maroon1', hex: '#ff34b3' },
    { name: 'maroon2', hex: '#ee30a7' },
    { name: 'maroon3', hex: '#cd2990' },
    { name: 'maroon4', hex: '#8b1c62' },
    { name: 'MediumAquamarine', hex: '#66cdaa' },
    { name: 'MediumBlue', hex: '#0000cd' },
    { name: 'MediumOrchid', hex: '#ba55d3' },
    { name: 'MediumOrchid1', hex: '#e066ff' },
    { name: 'MediumOrchid2', hex: '#d15fee' },
    { name: 'MediumOrchid3', hex: '#b452cd' },
    { name: 'MediumOrchid4', hex: '#7a378b' },
    { name: 'MediumPurple', hex: '#9370db' },
    { name: 'MediumPurple1', hex: '#ab82ff' },
    { name: 'MediumPurple2', hex: '#9f79ee' },
    { name: 'MediumPurple3', hex: '#8968cd' },
    { name: 'MediumPurple4', hex: '#5d478b' },
    { name: 'MediumSeaGreen', hex: '#3cb371' },
    { name: 'MediumSlateBlue', hex: '#7b68ee' },
    { name: 'MediumSpringGreen', hex: '#00fa9a' },
    { name: 'MediumTurquoise', hex: '#48d1cc' },
    { name: 'MediumVioletRed', hex: '#c71585' },
    { name: 'MidnightBlue', hex: '#191970' },
    { name: 'MintCream', hex: '#f5fffa' },
    { name: 'MistyRose', hex: '#ffe4e1' },
    { name: 'MistyRose1', hex: '#ffe4e1' },
    { name: 'MistyRose2', hex: '#eed5d2' },
    { name: 'MistyRose3', hex: '#cdb7b5' },
    { name: 'MistyRose4', hex: '#8b7d7b' },
    { name: 'moccasin', hex: '#ffe4b5' },
    { name: 'NavajoWhite', hex: '#ffdead' },
    { name: 'NavajoWhite1', hex: '#ffdead' },
    { name: 'NavajoWhite2', hex: '#eecfa1' },
    { name: 'NavajoWhite3', hex: '#cdb38b' },
    { name: 'NavajoWhite4', hex: '#8b795e' },
    { name: 'navy', hex: '#000080' },
    { name: 'NavyBlue', hex: '#000080' },
    { name: 'OldLace', hex: '#fdf5e6' },
    { name: 'olive', hex: '#808000' },
    { name: 'OliveDrab', hex: '#6b8e23' },
    { name: 'OliveDrab1', hex: '#c0ff3e' },
    { name: 'OliveDrab2', hex: '#b3ee3a' },
    { name: 'OliveDrab3', hex: '#9acd32' },
    { name: 'OliveDrab4', hex: '#698b22' },
    { name: 'orange', hex: '#ffa500' },
    { name: 'orange1', hex: '#ffa500' },
    { name: 'orange2', hex: '#ee9a00' },
    { name: 'orange3', hex: '#cd8500' },
    { name: 'orange4', hex: '#8b5a00' },
    { name: 'OrangeRed', hex: '#ff4500' },
    { name: 'OrangeRed1', hex: '#ff4500' },
    { name: 'OrangeRed2', hex: '#ee4000' },
    { name: 'OrangeRed3', hex: '#cd3700' },
    { name: 'OrangeRed4', hex: '#8b2500' },
    { name: 'orchid', hex: '#da70d6' },
    { name: 'orchid1', hex: '#ff83fa' },
    { name: 'orchid2', hex: '#ee7ae9' },
    { name: 'orchid3', hex: '#cd69c9' },
    { name: 'orchid4', hex: '#8b4789' },
    { name: 'PaleGoldenrod', hex: '#eee8aa' },
    { name: 'PaleGreen', hex: '#98fb98' },
    { name: 'PaleGreen1', hex: '#9aff9a' },
    { name: 'PaleGreen2', hex: '#90ee90' },
    { name: 'PaleGreen3', hex: '#7ccd7c' },
    { name: 'PaleGreen4', hex: '#548b54' },
    { name: 'PaleTurquoise', hex: '#afeeee' },
    { name: 'PaleTurquoise1', hex: '#bbffff' },
    { name: 'PaleTurquoise2', hex: '#aeeeee' },
    { name: 'PaleTurquoise3', hex: '#96cdcd' },
    { name: 'PaleTurquoise4', hex: '#668b8b' },
    { name: 'PaleVioletRed', hex: '#db7093' },
    { name: 'PaleVioletRed1', hex: '#ff82ab' },
    { name: 'PaleVioletRed2', hex: '#ee799f' },
    { name: 'PaleVioletRed3', hex: '#cd6889' },
    { name: 'PaleVioletRed4', hex: '#8b475d' },
    { name: 'PapayaWhip', hex: '#ffefd5' },
    { name: 'PeachPuff', hex: '#ffdab9' },
    { name: 'PeachPuff1', hex: '#ffdab9' },
    { name: 'PeachPuff2', hex: '#eecbad' },
    { name: 'PeachPuff3', hex: '#cdaf95' },
    { name: 'PeachPuff4', hex: '#8b7765' },
    { name: 'peru', hex: '#cd853f' },
    { name: 'pink', hex: '#ffc0cb' },
    { name: 'pink1', hex: '#ffb5c5' },
    { name: 'pink2', hex: '#eea9b8' },
    { name: 'pink3', hex: '#cd919e' },
    { name: 'pink4', hex: '#8b636c' },
    { name: 'plum', hex: '#dda0dd' },
    { name: 'plum1', hex: '#ffbbff' },
    { name: 'plum2', hex: '#eeaeee' },
    { name: 'plum3', hex: '#cd96cd' },
    { name: 'plum4', hex: '#8b668b' },
    { name: 'PowderBlue', hex: '#b0e0e6' },
    { name: 'purple', hex: '#800080' },
    { name: 'purple1', hex: '#9b30ff' },
    { name: 'purple2', hex: '#912cee' },
    { name: 'purple3', hex: '#7d26cd' },
    { name: 'purple4', hex: '#551a8b' },
    { name: 'red', hex: '#ff0000' },
    { name: 'red1', hex: '#ff0000' },
    { name: 'red2', hex: '#ee0000' },
    { name: 'red3', hex: '#cd0000' },
    { name: 'red4', hex: '#8b0000' },
    { name: 'RosyBrown', hex: '#bc8f8f' },
    { name: 'RosyBrown1', hex: '#ffc1c1' },
    { name: 'RosyBrown2', hex: '#eeb4b4' },
    { name: 'RosyBrown3', hex: '#cd9b9b' },
    { name: 'RosyBrown4', hex: '#8b6969' },
    { name: 'RoyalBlue', hex: '#4169e1' },
    { name: 'RoyalBlue1', hex: '#4876ff' },
    { name: 'RoyalBlue2', hex: '#436eee' },
    { name: 'RoyalBlue3', hex: '#3a5fcd' },
    { name: 'RoyalBlue4', hex: '#27408b' },
    { name: 'SaddleBrown', hex: '#8b4513' },
    { name: 'salmon', hex: '#fa8072' },
    { name: 'salmon1', hex: '#ff8c69' },
    { name: 'salmon2', hex: '#ee8262' },
    { name: 'salmon3', hex: '#cd7054' },
    { name: 'salmon4', hex: '#8b4c39' },
    { name: 'SandyBrown', hex: '#f4a460' },
    { name: 'SeaGreen', hex: '#2e8b57' },
    { name: 'SeaGreen1', hex: '#54ff9f' },
    { name: 'SeaGreen2', hex: '#4eee94' },
    { name: 'SeaGreen3', hex: '#43cd80' },
    { name: 'SeaGreen4', hex: '#2e8b57' },
    { name: 'seashell', hex: '#fff5ee' },
    { name: 'seashell1', hex: '#fff5ee' },
    { name: 'seashell2', hex: '#eee5de' },
    { name: 'seashell3', hex: '#cdc5bf' },
    { name: 'seashell4', hex: '#8b8682' },
    { name: 'sienna', hex: '#a0522d' },
    { name: 'sienna1', hex: '#ff8247' },
    { name: 'sienna2', hex: '#ee7942' },
    { name: 'sienna3', hex: '#cd6839' },
    { name: 'sienna4', hex: '#8b4726' },
    { name: 'silver', hex: '#c0c0c0' },
    { name: 'SkyBlue', hex: '#87ceeb' },
    { name: 'SkyBlue1', hex: '#87ceff' },
    { name: 'SkyBlue2', hex: '#7ec0ee' },
    { name: 'SkyBlue3', hex: '#6ca6cd' },
    { name: 'SkyBlue4', hex: '#4a708b' },
    { name: 'SlateBlue', hex: '#6a5acd' },
    { name: 'SlateBlue1', hex: '#836fff' },
    { name: 'SlateBlue2', hex: '#7a67ee' },
    { name: 'SlateBlue3', hex: '#6959cd' },
    { name: 'SlateBlue4', hex: '#473c8b' },
    { name: 'SlateGray', hex: '#708090' },
    { name: 'SlateGray1', hex: '#c6e2ff' },
    { name: 'SlateGray2', hex: '#b9d3ee' },
    { name: 'SlateGray3', hex: '#9fb6cd' },
    { name: 'SlateGray4', hex: '#6c7b8b' },
    { name: 'SlateGrey', hex: '#708090' },
    { name: 'snow', hex: '#fffafa' },
    { name: 'snow1', hex: '#fffafa' },
    { name: 'snow2', hex: '#eee9e9' },
    { name: 'snow3', hex: '#cdc9c9' },
    { name: 'snow4', hex: '#8b8989' },
    { name: 'SpringGreen', hex: '#00ff7f' },
    { name: 'SpringGreen1', hex: '#00ff7f' },
    { name: 'SpringGreen2', hex: '#00ee76' },
    { name: 'SpringGreen3', hex: '#00cd66' },
    { name: 'SpringGreen4', hex: '#008b45' },
    { name: 'SteelBlue', hex: '#4682b4' },
    { name: 'SteelBlue1', hex: '#63b8ff' },
    { name: 'SteelBlue2', hex: '#5cacee' },
    { name: 'SteelBlue3', hex: '#4f94cd' },
    { name: 'SteelBlue4', hex: '#36648b' },
    { name: 'tan', hex: '#d2b48c' },
    { name: 'tan1', hex: '#ffa54f' },
    { name: 'tan2', hex: '#ee9a49' },
    { name: 'tan3', hex: '#cd853f' },
    { name: 'tan4', hex: '#8b5a2b' },
    { name: 'teal', hex: '#008080' },
    { name: 'thistle', hex: '#d8bfd8' },
    { name: 'thistle1', hex: '#ffe1ff' },
    { name: 'thistle2', hex: '#eed2ee' },
    { name: 'thistle3', hex: '#cdb5cd' },
    { name: 'thistle4', hex: '#8b7b8b' },
    { name: 'tomato', hex: '#ff6347' },
    { name: 'tomato1', hex: '#ff6347' },
    { name: 'tomato2', hex: '#ee5c42' },
    { name: 'tomato3', hex: '#cd4f39' },
    { name: 'tomato4', hex: '#8b3626' },
    { name: 'turquoise', hex: '#40e0d0' },
    { name: 'turquoise1', hex: '#00f5ff' },
    { name: 'turquoise2', hex: '#00e5ee' },
    { name: 'turquoise3', hex: '#00c5cd' },
    { name: 'turquoise4', hex: '#00868b' },
    { name: 'violet', hex: '#ee82ee' },
    { name: 'VioletRed', hex: '#d02090' },
    { name: 'VioletRed1', hex: '#ff3e96' },
    { name: 'VioletRed2', hex: '#ee3a8c' },
    { name: 'VioletRed3', hex: '#cd3278' },
    { name: 'VioletRed4', hex: '#8b2252' },
    { name: 'wheat', hex: '#f5deb3' },
    { name: 'wheat1', hex: '#ffe1ff' },
    { name: 'wheat2', hex: '#eed2ee' },
    { name: 'wheat3', hex: '#cdb5cd' },
    { name: 'wheat4', hex: '#8b7b8b' },
    { name: 'white', hex: '#ffffff' },
    { name: 'WhiteSmoke', hex: '#f5f5f5' },
    { name: 'yellow', hex: '#ffff00' },
    { name: 'yellow1', hex: '#ffff00' },
    { name: 'yellow2', hex: '#eeee00' },
    { name: 'yellow3', hex: '#cdcd00' },
    { name: 'yellow4', hex: '#8b8b00' },
    { name: 'YellowGreen', hex: '#9acd32' }
];

const nameToHexMap = new Map(TKINTER_NAMED_COLORS.map(c => [c.name.toLowerCase(), c.hex]));
const hexToNameMap = new Map<string, string>();
for (const color of TKINTER_NAMED_COLORS) {
    const lowerHex = color.hex.toLowerCase();
    if (!hexToNameMap.has(lowerHex)) {
        hexToNameMap.set(lowerHex, color.name);
    }
}

// Utility to convert color names/rgb to hex. Returns null if invalid.
const toHex = (color: string): string | null => {
    if (!color || typeof color !== 'string') return null;
    const trimmedColor = ((color) || "").trim();
    const lowerColor = trimmedColor.toLowerCase();

    // Check map first
    if (nameToHexMap.has(lowerColor)) {
        return nameToHexMap.get(lowerColor)!;
    }

    // Now check for hex format
    if (trimmedColor.startsWith('#')) {
        if (/^#([0-9a-f]{3}){1,2}$/i.test(trimmedColor)) {
            if (trimmedColor.length === 4) {
                 const r = trimmedColor[1];
                 const g = trimmedColor[2];
                 const b = trimmedColor[3];
                 return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
            }
            return trimmedColor.toLowerCase();
        }
        return null; // Invalid hex format
    }

    // Fallback to browser rendering for other CSS color formats (rgb, etc.)
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return null;
    
    // Set a known invalid color to get the browser's failure value
    ctx.fillStyle = '__invalid_color__';
    const invalidColorResult = ctx.fillStyle;

    ctx.fillStyle = trimmedColor;
    const resolvedColorHex = ctx.fillStyle;
    
    // If the browser resolves to the invalid color's value, or transparent (for empty string), it's invalid
    if (resolvedColorHex === invalidColorResult || resolvedColorHex === 'rgba(0, 0, 0, 0)') {
        return null;
    }

    return resolvedColorHex;
};

interface AllColorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (hex: string) => void;
  allColors: { name: string; hex: string }[];
}

const SortButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    title: string;
}> = ({ label, isActive, onClick, title }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            isActive
                ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]'
                : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
        }`}
        title={title}
    >
        {label}
    </button>
);

const AllColorsModal: React.FC<AllColorsModalProps> = ({ isOpen, onClose, onSelect, allColors }) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [sortType, setSortType] = useState<'group' | 'alpha' | 'hex'>('group');

    const selectedColorName = useMemo(() => {
        if (!selectedColor) return null;
        return hexToNameMap.get(selectedColor.toLowerCase()) || null;
    }, [selectedColor]);

    const sortedColors = useMemo(() => {
        const colorsCopy = [...allColors];
        switch (sortType) {
            case 'alpha':
                return colorsCopy.sort((a, b) => a.name.localeCompare(b.name));
            case 'hex':
                return colorsCopy.sort((a, b) => parseInt(a.hex.substring(1), 16) - parseInt(b.hex.substring(1), 16));
            case 'group':
            default:
                return allColors; 
        }
    }, [sortType, allColors]);

    const filteredColors = useMemo(() => {
        if (!searchTerm) return sortedColors;
        const lowerTerm = searchTerm.toLowerCase();
        return sortedColors.filter(c => c.name.toLowerCase().includes(lowerTerm) || c.hex.toLowerCase().includes(lowerTerm));
    }, [searchTerm, sortedColors]);


    const handleConfirm = () => {
        if (selectedColor) {
            onSelect(selectedColor);
        }
        onClose();
    };
    
    useEffect(() => {
        if (isOpen) {
            setSelectedColor(null);
            setSearchTerm('');
            setSortType('group');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999] p-4" onClick={onClose}>
            <div className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] flex-shrink-0">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('color.allColorsTitle')}</h2>
                    <div className="relative w-64">
                        <input
                            type="text"
                            placeholder={t('color.searchPlaceholder')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-md border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none pr-8"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 px-2 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                title={t('help.clearSearch')}
                                aria-label={t('help.clearSearch')}
                            >
                                <XIcon size={16} />
                            </button>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full" aria-label={t('action.close')}>
                        <XIcon />
                    </button>
                </header>
                <div className="flex justify-start items-center p-2 px-4 border-b border-[var(--border-primary)] flex-shrink-0 gap-2">
                    <span className="text-sm font-semibold text-[var(--text-tertiary)]">{t('color.sortBy')}</span>
                    <div className="flex items-center gap-1">
                        <SortButton
                            label={t('color.sortGroup')}
                            isActive={sortType === 'group'}
                            onClick={() => setSortType('group')}
                            title={t('color.sortGroupTitle')}
                        />
                        <SortButton
                            label={t('color.sortAlpha')}
                            isActive={sortType === 'alpha'}
                            onClick={() => setSortType('alpha')}
                            title={t('color.sortAlphaTitle')}
                        />
                        <SortButton
                            label={t('color.sortHex')}
                            isActive={sortType === 'hex'}
                            onClick={() => setSortType('hex')}
                            title={t('color.sortHexTitle')}
                        />
                    </div>
                </div>
                <div className="flex-grow p-4 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {filteredColors.map(color => (
                            <button
                                key={color.name}
                                onClick={() => setSelectedColor(color.hex)}
                                className={`p-2 rounded-md transition-all duration-150 border-2 ${selectedColor === color.hex ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]' : 'border-transparent hover:border-white/30'}`}
                                title={`${color.name} (${color.hex})`}
                            >
                                <div className="w-full h-10 rounded-md border border-white/20" style={{ backgroundColor: color.hex }}></div>
                                <div className="text-center">
                                    <div className="text-xs mt-1.5 truncate text-[var(--text-secondary)]">{color.name}</div>
                                    <div className="text-xs font-mono text-[var(--text-tertiary)] opacity-75">{color.hex}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                 <footer className="p-4 bg-[var(--bg-app)]/50 rounded-b-lg flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-[var(--text-tertiary)]">{t('color.selected')}</span>
                        {selectedColor ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded border border-white/20" style={{backgroundColor: selectedColor}}></div>
                                <span className="text-sm text-[var(--text-primary)]">
                                    {selectedColorName ? `${selectedColorName} ` : ''}
                                    <span className="font-mono text-[var(--text-tertiary)]">{selectedColor}</span>
                                </span>
                            </div>
                        ) : (
                            <span className="text-sm text-[var(--text-tertiary)] italic">{t('color.none')}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-6 py-2 rounded-lg font-semibold bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
                            {t('action.cancel')}
                        </button>
                        <button onClick={handleConfirm} disabled={!selectedColor} className="px-6 py-2 rounded-lg font-semibold bg-green-600 text-[var(--accent-text)] hover:bg-green-500 transition-colors disabled:bg-[var(--bg-disabled)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed">
                            {t('action.apply')}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};


export const ColorInput: React.FC<{
    id?: string;
    value: string;
    onChange: (value: string) => void;
    onPreview?: (value: string | null) => void;
    onCancel?: () => void;
    disabled?: boolean;
    title?: string;
    placeholder?: string;
    showNotification?: (message: string, type?: 'info' | 'error', duration?: number) => void;
}> = ({ id, value, onChange, onPreview, onCancel, disabled, title, placeholder, showNotification }) => {
    const { t } = useLanguage();
    const [inputValue, setInputValue] = useState(value);
    const [isEditing, setIsEditing] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAllColorsModalOpen, setIsAllColorsModalOpen] = useState(false);
    const [originalValue, setOriginalValue] = useState(value);
    const [conversionChoice, setConversionChoice] = useState<{ name: string; hex: string } | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({ left: '40px' });

    useEffect(() => {
        if (isDropdownOpen && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const screenWidth = window.innerWidth;
            const dropdownWidth = 224; // Corresponds to w-[224px]

            // Default position starts 40px from the left of the wrapper component
            const dropdownRightX = rect.left + 40 + dropdownWidth;

            if (dropdownRightX > screenWidth - 16) { // Check for overflow with a 1rem margin
                // The dropdown overflows, so align its right edge with the parent's right edge
                setDropdownStyle({ right: '0px' });
            } else {
                // The dropdown fits, use the default left alignment
                setDropdownStyle({ left: '40px' });
            }
        }
    }, [isDropdownOpen]);

    useEffect(() => {
        if (!isEditing) {
            setInputValue(value);
        }
    }, [value, isEditing]);

    const filteredColors = useMemo(() => {
        if (!inputValue) return PRIMARY_WEB_COLORS;
        const searchTerm = inputValue.toLowerCase().trim();
        if (searchTerm.startsWith('#') || searchTerm === '') return PRIMARY_WEB_COLORS;
        return TKINTER_NAMED_COLORS.filter(color => color.name.toLowerCase().includes(searchTerm) || color.hex.toLowerCase().includes(searchTerm));
    }, [inputValue]);

    const hexValue = useMemo(() => toHex(inputValue) || '#000000', [inputValue]);
    
    const { convertibleTo, conversionTarget } = useMemo(() => {
        const trimmedInput = ((inputValue) || "").trim();
        const lowerInput = trimmedInput.toLowerCase();

        if (nameToHexMap.has(lowerInput)) {
            return { convertibleTo: 'hex', conversionTarget: nameToHexMap.get(lowerInput)! };
        }

        const hex = toHex(trimmedInput);
        if (hex && hexToNameMap.has(hex.toLowerCase())) {
            return { convertibleTo: 'name', conversionTarget: hexToNameMap.get(hex.toLowerCase())! };
        }
        
        return { convertibleTo: null, conversionTarget: null };
    }, [inputValue]);

    const inputTitle = useMemo(() => {
        if (((inputValue) || "").trim().startsWith('#')) {
            return "HEX code in #RRGGBB or #RGB format. Allowed characters: 0-9, a-f.";
        }
        return "Enter color name (e.g. 'Red', 'LightBlue') or HEX code.";
    }, [inputValue]);

    const isValidWebColorName = (name: string): boolean => {
        if (!name || typeof name !== 'string' || ((name) || "").trim().startsWith('#')) return false;
        
        const ctx = document.createElement('canvas').getContext('2d');
        if (!ctx) return false;

        ctx.fillStyle = '__invalid_color__';
        const invalidColorResult = ctx.fillStyle;
        
        ctx.fillStyle = ((name) || "").trim();
        const resolvedColorHex = ctx.fillStyle;
        
        return resolvedColorHex !== invalidColorResult && resolvedColorHex !== 'rgba(0, 0, 0, 0)';
    };

    const startEditing = useCallback(() => {
        if (!isEditing) {
            setOriginalValue(value);
            setIsEditing(true);
        }
    }, [isEditing, value]);

    const handleFocus = () => {
        startEditing();
        setIsDropdownOpen(true);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        startEditing();
        const rawValue = e.target.value;
        let sanitizedValue = '';

        if (rawValue.startsWith('#')) {
            sanitizedValue = '#' + rawValue.substring(1).replace(/[^0-9a-fA-F]/g, '');
            if (sanitizedValue.length > 7) {
                sanitizedValue = sanitizedValue.substring(0, 7);
            }
        } else {
            sanitizedValue = rawValue.replace(/[^a-zA-Z0-9\s]/g, '');
        }

        setInputValue(sanitizedValue);
        onPreview?.(toHex(sanitizedValue));
        if (!isDropdownOpen) {
            setIsDropdownOpen(true);
        }
    };

    const handlePickerPreview = (e: React.FormEvent<HTMLInputElement>) => {
        const newColor = (e.target as HTMLInputElement).value;
        startEditing();
        setInputValue(newColor);
        onPreview?.(newColor);
    };
    
    const handlePickerClick = () => {
        startEditing();
        setIsDropdownOpen(false);
    };

    const handleItemClick = (colorName: string) => {
        startEditing();
        setInputValue(colorName);
        onPreview?.(toHex(colorName));
        setIsDropdownOpen(false);
        inputRef.current?.focus();
    };
    
    const handleConversion = () => {
        if (conversionTarget) {
            startEditing();
            setInputValue(conversionTarget);
            onPreview?.(toHex(conversionTarget));
        }
    };

    const handleCancelClick = useCallback(() => {
        if (!isEditing) return;

        setInputValue(originalValue);
        onCancel?.();
        setIsEditing(false);
        setIsDropdownOpen(false);
        inputRef.current?.blur();
    }, [originalValue, onCancel, isEditing]);

    const handleCommit = useCallback(() => {
        if (!isEditing || conversionChoice) return;
        
        const trimmedInput = ((inputValue) || "").trim();

        if (trimmedInput === '') {
            handleCancelClick();
            return;
        }

        const finalHex = toHex(trimmedInput);

        if (!finalHex) {
            setInputValue(originalValue);
            onCancel?.();
        } else {
             if (trimmedInput.startsWith('#')) {
                onChange(finalHex);
            } else {
                if (isValidWebColorName(trimmedInput)) {
                    onChange(trimmedInput);
                } else if (nameToHexMap.has(trimmedInput.toLowerCase())) {
                    setConversionChoice({ name: trimmedInput, hex: finalHex });
                    return; 
                } else {
                     setInputValue(originalValue);
                     onCancel?.();
                }
            }
        }

        setIsEditing(false);
        setIsDropdownOpen(false);
    }, [inputValue, onChange, onCancel, isEditing, originalValue, conversionChoice, handleCancelClick]);

    const handleConversionConfirm = () => {
        if (!conversionChoice) return;
        onChange(conversionChoice.hex);
        setConversionChoice(null);
        setIsEditing(false);
        setIsDropdownOpen(false);
    };

    const handleConversionCancel = () => {
        if (!conversionChoice) return;
        onChange(conversionChoice.name);
        setConversionChoice(null);
        setIsEditing(false);
        setIsDropdownOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCommit();
            inputRef.current?.blur();
        } else if (e.key === 'Escape') {
            handleCancelClick();
        }
    };

    useClickOutside(wrapperRef, () => {
        if (isEditing) {
            handleCommit();
        }
    });

  return (
    <>
        <div ref={wrapperRef} className="relative flex items-center gap-2">
            <input
                id={id}
                type="color"
                value={hexValue}
                onInput={handlePickerPreview}
                onClick={handlePickerClick}
                disabled={disabled}
                title={title}
                className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="relative w-28">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder={placeholder || "#rrggbb or name"}
                    className={`bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2 py-1 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none text-sm disabled:opacity-50 ${convertibleTo ? 'pr-8' : ''}`}
                    title={inputTitle}
                    autoComplete="off"
                />
                {convertibleTo && !disabled && (
                    <button
                        type="button"
                        onClick={handleConversion}
                        className="absolute inset-y-0 right-0 px-2 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] z-10"
                        title={`Convert to ${convertibleTo === 'hex' ? 'HEX code' : 'name'}`}
                    >
                        <RefreshIcon size={16} />
                    </button>
                )}
            </div>
            
            {isEditing && !disabled && (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handleCancelClick}
                        className="p-2 rounded-md font-semibold transition-colors duration-200 text-red-500 hover:bg-[var(--destructive-bg)] hover:text-[var(--accent-text)]"
                        title="Cancel (Esc)"
                    >
                        <XIcon size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={handleCommit}
                        className="p-2 rounded-md font-semibold transition-colors duration-200 bg-green-600 text-[var(--accent-text)] hover:bg-green-500"
                        title="Confirm (Enter)"
                    >
                        <CheckIcon size={16} />
                    </button>
                </div>
            )}

            {isDropdownOpen && !disabled && (
                    <div 
                        className="absolute z-20 top-full mt-1 w-[224px] bg-[var(--bg-secondary)] rounded-md shadow-lg border border-[var(--border-secondary)] animate-fade-in-down flex flex-col" 
                        style={{ ...dropdownStyle, animationDuration: '150ms' }}
                    >
                        <div className="max-h-52 overflow-y-auto">
                            {filteredColors.length > 0 ? (
                                filteredColors.map(color => (
                                    <button
                                        key={color.name}
                                        onClick={() => handleItemClick(color.name)}
                                        className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)]"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <div className="w-4 h-4 rounded-sm border border-white/20 flex-shrink-0" style={{ backgroundColor: color.hex }}></div>
                                            <span className="truncate">{color.name}</span>
                                        </div>
                                        <span className="font-mono text-xs text-[var(--text-tertiary)] opacity-75 flex-shrink-0">{color.hex}</span>
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-sm text-[var(--text-tertiary)]">{t('color.notFound')}</div>
                            )}
                        </div>
                         <div className="p-1 border-t border-[var(--border-secondary)]">
                            <button
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    setIsAllColorsModalOpen(true);
                                }}
                                className="w-full text-center px-3 py-2 text-sm text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-md"
                            >
                                {t('color.allColorsShort')}
                            </button>
                        </div>
                    </div>
            )}
            </div>

            {isAllColorsModalOpen && (
                <AllColorsModal
                    isOpen={isAllColorsModalOpen}
                    onClose={() => setIsAllColorsModalOpen(false)}
                    onSelect={(hex) => {
                        const name = hexToNameMap.get(hex.toLowerCase());
                        if (name) {
                            handleItemClick(name);
                            handleCommit();
                        }
                    }}
                    allColors={TKINTER_NAMED_COLORS}
                />
            )}
            {conversionChoice && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={handleConversionCancel}
                    onConfirm={handleConversionConfirm}
                    title="Non-standard color"
                    message={`Color "${conversionChoice.name}" is not a standard web color. It might be black in the editor. Save keeping the name or convert to HEX (${conversionChoice.hex})?`}
                    confirmText="Convert to HEX"
                    cancelText="Keep name"
                    variant="primary"
                />
            )}
    </>
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

export const TextArea: React.FC<{ id: string; value: string; onChange: (value: string) => void; onFocus?: () => void; onBlur?: () => void; disabled?: boolean; rows?: number, title?: string, placeholder?: string }> = ({ id, value, onChange, onFocus, onBlur, disabled, rows = 3, title, placeholder }) => (
    <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
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
    isCustom?: boolean;
    isMixed?: boolean;
}> = ({ id, value, onChange, disabled, isCustom, isMixed }) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useClickOutside(dropdownRef, () => setIsOpen(false));
    
    const selectedStyle = isCustom 
        ? { nameKey: "prop.dash.custom", pattern: value ?? [], descKey: "Custom dash style." } 
        : (DASH_STYLES.find(style => JSON.stringify(style.pattern) === JSON.stringify(value ?? [])) ?? DASH_STYLES[0]);

    const handleSelect = (pattern: number[]) => {
        onChange(pattern.length > 0 ? pattern : undefined);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className="relative w-full">
            <button
                id={id}
                type="button"
                onClick={() => setIsOpen(p => !p)}
                disabled={disabled}
                className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2 py-1 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                title="Select preset dash style or configure custom"
            >
                <span className="truncate">{isMixed ? (t('props.mixed') || 'Різні') : (isCustom ? (t('prop.dash.custom') || 'Свій...') : t(selectedStyle.nameKey))}</span>
                <ChevronDownIcon size={16} className={`transform transition-transform text-[var(--text-tertiary)] ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 top-full right-0 mt-0 bg-[var(--bg-tertiary)] rounded-md shadow-lg max-h-60 overflow-y-auto border border-[var(--border-secondary)] w-[calc(100%+7.5rem)]">
                    {DASH_STYLES.map(style => (
                        <button
                            key={style.nameKey}
                            onClick={() => handleSelect(style.pattern)}
                            title={t(style.descKey)}
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
                            <span className="flex-grow">{t(style.nameKey)}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};