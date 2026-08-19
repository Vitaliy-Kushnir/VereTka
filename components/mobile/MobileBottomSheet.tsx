import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronUp, ChevronLeft, ChevronRight, Maximize2, Minimize2, Pin, Rows2, Columns2 } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useIsLandscape } from '../../hooks/useIsMobile';
import { useDragScroll } from '../../hooks/useDragScroll';

export type SheetPinMode = 'unpinned' | 'float' | 'docked';

interface MobileBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    initialHeightVh?: number; // Portrait height (e.g. 54vh)
    initialWidthVw?: number;  // Landscape width (e.g. 48vw)
    pinMode?: SheetPinMode;
    onPinModeChange?: (mode: SheetPinMode) => void;
    onHeightVhChange?: (heightVh: number) => void;
    onWidthVwChange?: (widthVw: number) => void;
    // Legacy pin props fallback
    isPinned?: boolean;
    onPinChange?: (pinned: boolean) => void;
    // Tab switching props
    onNavigatePrev?: () => void;
    onNavigateNext?: () => void;
    activeTabId?: 'shapes' | 'palette' | 'align' | 'layers' | 'code' | null;
    isLandscape?: boolean;
}

const PRESET_PORTRAIT_HEIGHTS = [32, 54, 82]; // Compact, Medium, Full (vh)
const PRESET_LANDSCAPE_WIDTHS = [32, 48, 72]; // Compact, Medium, Full (vw)

const TAB_ICONS: Record<string, string> = {
    shapes: '🔷',
    palette: '🎨',
    align: '📐',
    layers: '📑',
    code: '💻'
};

export function MobileBottomSheet({ 
    isOpen, 
    onClose, 
    title, 
    children,
    initialHeightVh = 54,
    initialWidthVw = 48,
    pinMode: pinModeProp,
    onPinModeChange,
    onHeightVhChange,
    onWidthVwChange,
    isPinned: isPinnedProp,
    onPinChange,
    onNavigatePrev,
    onNavigateNext,
    activeTabId,
    isLandscape: isLandscapeProp
}: MobileBottomSheetProps) {
    const { t } = useLanguage();
    const isLandscapeDetected = useIsLandscape();
    const isLandscape = isLandscapeProp !== undefined ? isLandscapeProp : isLandscapeDetected;

    const [heightVh, setHeightVh] = useState<number>(initialHeightVh);
    const [widthVw, setWidthVw] = useState<number>(initialWidthVw);
    const [dragTranslate, setDragTranslate] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [internalPinMode, setInternalPinMode] = useState<SheetPinMode>(
        isPinnedProp ? 'float' : 'unpinned'
    );

    const activePinMode: SheetPinMode = pinModeProp !== undefined 
        ? pinModeProp 
        : (isPinnedProp !== undefined ? (isPinnedProp ? 'float' : 'unpinned') : internalPinMode);
    
    const dragStartYRef = useRef<number>(0);
    const dragStartXRef = useRef<number>(0);
    const dragStartDimensionRef = useRef<number>(isLandscape ? initialWidthVw : initialHeightVh);
    const lastYRef = useRef<number>(0);
    const lastXRef = useRef<number>(0);
    const velocityYRef = useRef<number>(0);
    const velocityXRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const isSwipeGestureRef = useRef<boolean>(false);
    const gestureDecidedRef = useRef<boolean>(false);
    const dragScrollProps = useDragScroll();

    // Notify parent of dimension changes
    useEffect(() => {
        if (isOpen) {
            onHeightVhChange?.(heightVh);
            onWidthVwChange?.(widthVw);
        }
    }, [heightVh, widthVw, isOpen, onHeightVhChange, onWidthVwChange]);

    // Reset translation when opened
    useEffect(() => {
        if (isOpen) {
            setDragTranslate(0);
            setIsDragging(false);
        }
    }, [isOpen]);

    const setNextPinMode = useCallback((mode: SheetPinMode) => {
        if (pinModeProp === undefined) {
            setInternalPinMode(mode);
        }
        onPinModeChange?.(mode);
        onPinChange?.(mode !== 'unpinned');
    }, [pinModeProp, onPinModeChange, onPinChange]);

    const handleCyclePinMode = useCallback(() => {
        // Cycle: unpinned -> float (поверх) -> docked (поруч / розділений) -> unpinned
        if (activePinMode === 'unpinned') {
            setNextPinMode('float');
        } else if (activePinMode === 'float') {
            setNextPinMode('docked');
        } else {
            setNextPinMode('unpinned');
        }
    }, [activePinMode, setNextPinMode]);

    // Touch & Mouse Drag handlers
    const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        dragStartYRef.current = clientY;
        dragStartXRef.current = clientX;
        lastYRef.current = clientY;
        lastXRef.current = clientX;
        lastTimeRef.current = Date.now();
        dragStartDimensionRef.current = isLandscape ? widthVw : heightVh;
        velocityYRef.current = 0;
        velocityXRef.current = 0;
        isSwipeGestureRef.current = false;
        gestureDecidedRef.current = false;
        setIsDragging(true);
    }, [isLandscape, widthVw, heightVh]);

    const handleTouchMove = useCallback((e: TouchEvent | MouseEvent) => {
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const deltaY = clientY - dragStartYRef.current;
        const deltaX = clientX - dragStartXRef.current;
        const now = Date.now();
        const dt = now - lastTimeRef.current;
        
        if (dt > 0) {
            velocityYRef.current = (clientY - lastYRef.current) / dt;
            velocityXRef.current = (clientX - lastXRef.current) / dt;
            lastYRef.current = clientY;
            lastXRef.current = clientX;
            lastTimeRef.current = now;
        }

        if (isLandscape) {
            // ---------------------------------------------
            // LANDSCAPE: Horizontal resizing & gestures
            // ---------------------------------------------
            // Vertical movement in grab area = tab switch gesture
            if (!gestureDecidedRef.current && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
                gestureDecidedRef.current = true;
                if (Math.abs(deltaY) > Math.abs(deltaX) * 1.3) {
                    isSwipeGestureRef.current = true;
                }
            }

            if (isSwipeGestureRef.current) {
                return;
            }

            const windowWidth = window.innerWidth || 1000;
            // Dragging left (negative deltaX) INCREASES widthVw
            const deltaVw = (-deltaX / windowWidth) * 100;
            const newVw = dragStartDimensionRef.current + deltaVw;

            if (newVw > 85) {
                // Rubberband at maximum
                const clamped = 85 + (newVw - 85) * 0.2;
                setWidthVw(clamped);
                setDragTranslate(0);
            } else if (newVw < 24) {
                // Dragging right beyond minimum -> translate right for dismiss feedback
                setWidthVw(24);
                setDragTranslate(Math.max(0, (24 - newVw) * (windowWidth / 100)));
            } else {
                setWidthVw(newVw);
                setDragTranslate(0);
            }
        } else {
            // ---------------------------------------------
            // PORTRAIT: Vertical resizing & gestures
            // ---------------------------------------------
            if (!gestureDecidedRef.current && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
                gestureDecidedRef.current = true;
                if (Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
                    isSwipeGestureRef.current = true;
                }
            }

            if (isSwipeGestureRef.current) {
                return;
            }

            const windowHeight = window.innerHeight || 800;
            const deltaVh = (deltaY / windowHeight) * 100;
            const newVh = dragStartDimensionRef.current - deltaVh;

            if (newVh > 90) {
                const clamped = 90 + (newVh - 90) * 0.2;
                setHeightVh(clamped);
                setDragTranslate(0);
            } else if (newVh < 20) {
                setHeightVh(20);
                setDragTranslate(Math.max(0, (20 - newVh) * (windowHeight / 100)));
            } else {
                setHeightVh(newVh);
                setDragTranslate(0);
            }
        }
    }, [isLandscape]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);

        if (isLandscape) {
            // Check for vertical or horizontal swipe gesture on tab switch
            const totalDeltaY = lastYRef.current - dragStartYRef.current;
            const totalDeltaX = lastXRef.current - dragStartXRef.current;
            const vY = velocityYRef.current;
            const vX = velocityXRef.current;

            if (isSwipeGestureRef.current || Math.abs(totalDeltaY) > 40) {
                if (totalDeltaY < -35 || vY < -0.3) {
                    onNavigateNext?.();
                } else if (totalDeltaY > 35 || vY > 0.3) {
                    onNavigatePrev?.();
                }
                setDragTranslate(0);
                return;
            }

            // Dismiss condition on rightward drag/flick
            if (activePinMode === 'unpinned' && (vX > 0.65 || dragTranslate > 80 || widthVw < 25)) {
                onClose();
                return;
            }

            const clampedVw = Math.min(80, Math.max(28, widthVw));
            setWidthVw(clampedVw);
            setDragTranslate(0);
        } else {
            const totalDeltaX = lastXRef.current - dragStartXRef.current;
            const vX = velocityXRef.current;
            const vY = velocityYRef.current;

            if (isSwipeGestureRef.current || (Math.abs(totalDeltaX) > 40 && Math.abs(vX) > 0.25)) {
                if (totalDeltaX < -40 || vX < -0.3) {
                    onNavigateNext?.();
                } else if (totalDeltaX > 40 || vX > 0.3) {
                    onNavigatePrev?.();
                }
                setDragTranslate(0);
                return;
            }

            if (activePinMode === 'unpinned' && (vY > 0.65 || dragTranslate > 90 || heightVh < 20)) {
                onClose();
                return;
            }

            const clampedVh = Math.min(88, Math.max(26, heightVh));
            setHeightVh(clampedVh);
            setDragTranslate(0);
        }
    }, [isLandscape, activePinMode, dragTranslate, widthVw, heightVh, onClose, onNavigateNext, onNavigatePrev]);

    // Attach global move/end listeners during active drag
    useEffect(() => {
        if (!isDragging) return;

        const onMove = (e: TouchEvent | MouseEvent) => handleTouchMove(e);
        const onEnd = () => handleTouchEnd();

        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);

        return () => {
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onEnd);
        };
    }, [isDragging, handleTouchMove, handleTouchEnd]);

    // Preset sizing toggles
    const togglePresetSize = () => {
        if (isLandscape) {
            if (widthVw < 40) {
                setWidthVw(PRESET_LANDSCAPE_WIDTHS[1]); // to Medium (~48vw)
            } else if (widthVw < 62) {
                setWidthVw(PRESET_LANDSCAPE_WIDTHS[2]); // to Full (~72vw)
            } else {
                setWidthVw(PRESET_LANDSCAPE_WIDTHS[0]); // to Compact (~32vw)
            }
        } else {
            if (heightVh < 44) {
                setHeightVh(PRESET_PORTRAIT_HEIGHTS[1]); // to Medium (~54vh)
            } else if (heightVh < 72) {
                setHeightVh(PRESET_PORTRAIT_HEIGHTS[2]); // to Full (~82vh)
            } else {
                setHeightVh(PRESET_PORTRAIT_HEIGHTS[0]); // to Compact (~32vh)
            }
        }
    };

    if (!isOpen) return null;

    const isPinnedOrDocked = activePinMode === 'float' || activePinMode === 'docked';

    // -------------------------------------------------------------
    // LANDSCAPE MODE: Right-Side Sheet (Slides out from right)
    // -------------------------------------------------------------
    if (isLandscape) {
        const isCompactWidth = widthVw <= 36;
        const isExpandedWidth = widthVw >= 68;

        return (
            <div className="fixed top-12 bottom-0 left-0 right-0 z-[100] flex flex-row justify-end pointer-events-none">
                {/* Backdrop */}
                <div 
                    className={`absolute inset-0 transition-all duration-200 ${
                        isPinnedOrDocked 
                            ? 'opacity-0 pointer-events-none' 
                            : (isCompactWidth ? 'bg-black/20 backdrop-blur-[1px] pointer-events-auto' : 'bg-black/45 backdrop-blur-xs pointer-events-auto')
                    }`}
                    onClick={isPinnedOrDocked ? undefined : onClose}
                />

                {/* Right Side Sheet Container */}
                <div 
                    className={`relative bg-[var(--bg-app)] h-full rounded-l-2xl sm:rounded-l-3xl pointer-events-auto flex flex-row border-l transition-[box-shadow,border-color] duration-75 ease-out select-none ${
                        activePinMode === 'docked'
                            ? 'border-l-2 border-indigo-500 shadow-[-12px_0_40px_rgba(79,70,229,0.25)]'
                            : activePinMode === 'float'
                                ? 'border-l-2 border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30 shadow-[-10px_0_35px_rgba(0,0,0,0.45)]' 
                                : 'border-[var(--border-primary)] shadow-2xl'
                    }`}
                    style={{ 
                        width: `${widthVw}vw`,
                        maxWidth: 'calc(100vw - 72px)',
                        marginRight: 'calc(56px + env(safe-area-inset-right, 0px))',
                        transform: dragTranslate > 0 ? `translateX(${dragTranslate}px)` : 'none',
                        transition: isDragging ? 'none' : 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s ease-out'
                    }}
                >
                    {/* Left Grab Handle Bar for Horizontal Resizing */}
                    <div 
                        className="w-4 shrink-0 flex items-center justify-center cursor-ew-resize active:cursor-grabbing touch-none select-none hover:bg-[var(--accent-primary)]/10 transition-colors border-r border-[var(--border-secondary)]/40"
                        onTouchStart={handleTouchStart}
                        onMouseDown={handleTouchStart}
                        title="Потягніть вліво/вправо для зміни ширини або свайпайте для зміни вкладок"
                    >
                        <div className={`w-1.5 h-12 rounded-full transition-colors ${
                            activePinMode === 'docked'
                                ? 'bg-indigo-500'
                                : activePinMode === 'float' 
                                    ? 'bg-[var(--accent-primary)]/80' 
                                    : 'bg-[var(--border-secondary)] hover:bg-[var(--accent-primary)]/70'
                        }`} />
                    </div>

                    {/* Main Inner Content Column */}
                    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                        {/* Header with Navigation & Mode Controls */}
                        <div 
                            className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-primary)] shrink-0 touch-none"
                            onTouchStart={handleTouchStart}
                            onMouseDown={handleTouchStart}
                        >
                            {/* Left: Tab Switcher & Title */}
                            <div className="flex items-center gap-1 min-w-0 pr-1">
                                {onNavigatePrev && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigatePrev();
                                        }}
                                        className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] active:scale-95 transition-colors"
                                        title="Попередня вкладка"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                )}

                                <h3 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] tracking-tight truncate flex items-center gap-1.5">
                                    {activeTabId && <span>{TAB_ICONS[activeTabId] || '🎨'}</span>}
                                    <span>{title}</span>
                                </h3>

                                {onNavigateNext && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigateNext();
                                        }}
                                        className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] active:scale-95 transition-colors"
                                        title="Наступна вкладка"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                )}

                            </div>

                            {/* Right Controls: Mode, Width Preset, Close */}
                            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                {/* 3-State Pin Mode Toggle Button */}
                                <button
                                    type="button"
                                    onClick={handleCyclePinMode}
                                    className={`p-1.5 rounded-lg active:scale-95 transition-all flex items-center justify-center ${
                                        activePinMode === 'docked'
                                            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/40'
                                            : activePinMode === 'float'
                                                ? 'bg-[var(--accent-primary)] text-white shadow-xs ring-2 ring-[var(--accent-primary)]/40'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-secondary)]'
                                    }`}
                                    title={
                                        activePinMode === 'unpinned'
                                            ? (t('sheet.mode.modal') || 'Звичайний. Натисніть для режиму «Плаваюче поверх»')
                                            : activePinMode === 'float'
                                                ? (t('sheet.mode.float') || 'Плаваюче поверх. Натисніть для режиму «Розділений екран / Поруч»')
                                                : (t('sheet.mode.docked') || 'Розділений екран (Поруч). Натисніть, щоб відшпилити')
                                    }
                                    aria-label="Режим пришпилення"
                                >
                                    {activePinMode === 'docked' ? (
                                        <Columns2 size={15} className="animate-pulse" />
                                    ) : activePinMode === 'float' ? (
                                        <Pin size={15} className="rotate-45" />
                                    ) : (
                                        <Pin size={15} className="-rotate-12 opacity-80" />
                                    )}
                                </button>

                                {/* Width Preset Toggle */}
                                <button
                                    type="button"
                                    onClick={togglePresetSize}
                                    className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center justify-center border border-transparent hover:border-[var(--border-secondary)]"
                                    title={isExpandedWidth ? 'Звузити шторку' : isCompactWidth ? 'Розширити шторку' : 'Змінити ширину'}
                                    aria-label="Змінити ширину"
                                >
                                    {isExpandedWidth ? (
                                        <Minimize2 size={14} />
                                    ) : isCompactWidth ? (
                                        <Maximize2 size={14} />
                                    ) : (
                                        <ChevronLeft size={15} />
                                    )}
                                </button>

                                {/* Close Button */}
                                <button 
                                    type="button"
                                    onClick={onClose}
                                    className="p-1.5 rounded-full hover:bg-[var(--bg-secondary)] active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all ml-0.5"
                                    title={t('help.close') || 'Закрити'}
                                    aria-label="Закрити"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content inside Landscape Side Sheet */}
                        <div 
                            className="overflow-y-auto overflow-x-auto px-3.5 py-2.5 overscroll-contain flex-1 select-text custom-scrollbar"
                            ref={dragScrollProps.scrollRef}
                            onMouseDown={dragScrollProps.onMouseDown}
                            onMouseLeave={dragScrollProps.onMouseLeave}
                            onMouseUp={dragScrollProps.onMouseUp}
                            onMouseMove={dragScrollProps.onMouseMove}
                        >
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // PORTRAIT MODE: Bottom Sheet
    // -------------------------------------------------------------
    const isCompactHeight = heightVh <= 36;
    const isExpandedHeight = heightVh >= 76;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-none">
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 transition-all duration-200 ${
                    isPinnedOrDocked 
                        ? 'opacity-0 pointer-events-none' 
                        : (isCompactHeight ? 'bg-black/25 backdrop-blur-[1px] pointer-events-auto' : 'bg-black/50 backdrop-blur-xs pointer-events-auto')
                }`}
                onClick={isPinnedOrDocked ? undefined : onClose}
            />
            
            {/* Sheet Container - Sits directly above MobileBottomBar */}
            <div 
                className={`relative bg-[var(--bg-app)] w-full rounded-t-3xl pointer-events-auto flex flex-col border-t transition-[height,box-shadow,border-color] duration-75 ease-out select-none ${
                    activePinMode === 'docked'
                        ? 'border-t-2 border-indigo-500 shadow-[0_-12px_40px_rgba(79,70,229,0.25)]'
                        : activePinMode === 'float'
                            ? 'border-t-2 border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30 shadow-[0_-10px_35px_rgba(0,0,0,0.45)]' 
                            : 'border-[var(--border-primary)] shadow-2xl'
                } bottom-[calc(52px+env(safe-area-inset-bottom,0px))]`}
                style={{ 
                    height: `${heightVh}vh`,
                    maxHeight: 'calc(92vh - 54px)',
                    transform: dragTranslate > 0 ? `translateY(${dragTranslate}px)` : 'none',
                    transition: isDragging ? 'none' : 'height 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s ease-out'
                }}
            >
                {/* Grab Handle Header Bar */}
                <div 
                    className="pt-2 pb-1 flex flex-col items-center justify-center shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
                    onTouchStart={handleTouchStart}
                    onMouseDown={handleTouchStart}
                >
                    <div className={`w-12 h-1.5 rounded-full mb-1 transition-colors ${
                        activePinMode === 'docked'
                            ? 'bg-indigo-500'
                            : activePinMode === 'float' 
                                ? 'bg-[var(--accent-primary)]/80' 
                                : 'bg-[var(--border-secondary)] hover:bg-[var(--accent-primary)]/70'
                    }`} />
                </div>

                {/* Header with Navigation & Mode Controls */}
                <div 
                    className="flex items-center justify-between px-3.5 py-1.5 border-b border-[var(--border-primary)] shrink-0 touch-none"
                    onTouchStart={handleTouchStart}
                    onMouseDown={handleTouchStart}
                >
                    {/* Left: Tab Switcher & Title */}
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        {onNavigatePrev && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigatePrev();
                                }}
                                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] active:scale-95 transition-colors"
                                title="Попередня вкладка"
                            >
                                <ChevronLeft size={16} />
                            </button>
                        )}

                        <h3 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] tracking-tight truncate flex items-center gap-1.5">
                            {activeTabId && <span>{TAB_ICONS[activeTabId] || '🎨'}</span>}
                            <span>{title}</span>
                        </h3>

                        {onNavigateNext && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateNext();
                                }}
                                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] active:scale-95 transition-colors"
                                title="Наступна вкладка"
                            >
                                <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                    
                    {/* Right: Actions Controls */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        {/* 3-State Pin Mode Toggle Button */}
                        <button
                            type="button"
                            onClick={handleCyclePinMode}
                            className={`p-1.5 rounded-lg active:scale-95 transition-all flex items-center justify-center ${
                                activePinMode === 'docked'
                                    ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/40'
                                    : activePinMode === 'float'
                                        ? 'bg-[var(--accent-primary)] text-white shadow-xs ring-2 ring-[var(--accent-primary)]/40'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-secondary)]'
                            }`}
                            title={
                                activePinMode === 'unpinned'
                                    ? (t('sheet.mode.modal') || 'Звичайний. Натисніть для режиму «Плаваюче поверх»')
                                    : activePinMode === 'float'
                                        ? (t('sheet.mode.float') || 'Плаваюче поверх. Натисніть для режиму «Розділений екран / Поруч»')
                                        : (t('sheet.mode.docked') || 'Розділений екран (Поруч). Натисніть, щоб відшпилити')
                            }
                            aria-label="Режим пришпилення"
                        >
                            {activePinMode === 'docked' ? (
                                <Rows2 size={16} className="animate-pulse" />
                            ) : activePinMode === 'float' ? (
                                <Pin size={16} className="rotate-45" />
                            ) : (
                                <Pin size={16} className="-rotate-12 opacity-80" />
                            )}
                        </button>

                        {/* Quick Height Preset Toggle Button */}
                        <button
                            type="button"
                            onClick={togglePresetSize}
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center justify-center border border-transparent hover:border-[var(--border-secondary)]"
                            title={isExpandedHeight ? 'Зменшити шторку' : isCompactHeight ? 'Розгорнути шторку' : 'Змінити висоту шторки'}
                            aria-label="Змінити розмір"
                        >
                            {isExpandedHeight ? (
                                <Minimize2 size={15} />
                            ) : isCompactHeight ? (
                                <Maximize2 size={15} />
                            ) : (
                                <ChevronUp size={16} />
                            )}
                        </button>

                        {/* Close Button */}
                        <button 
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-[var(--bg-secondary)] active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all ml-0.5"
                            title={t('help.close') || 'Закрити'}
                            aria-label="Закрити"
                        >
                            <X size={17} />
                        </button>
                    </div>
                </div>
                
                {/* Scrollable Content */}
                <div 
                    className="overflow-y-auto overflow-x-auto px-4 py-3 overscroll-contain flex-1 select-text custom-scrollbar"
                    ref={dragScrollProps.scrollRef}
                    onMouseDown={dragScrollProps.onMouseDown}
                    onMouseLeave={dragScrollProps.onMouseLeave}
                    onMouseUp={dragScrollProps.onMouseUp}
                    onMouseMove={dragScrollProps.onMouseMove}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
