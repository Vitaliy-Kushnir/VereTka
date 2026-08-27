import { useRef, useCallback } from 'react';

interface LongPressOptions {
    threshold?: number;
    onLongPress: (event: React.MouseEvent | React.TouchEvent | React.PointerEvent) => void;
    onClick?: (event: React.MouseEvent | React.TouchEvent | React.PointerEvent) => void;
    disabled?: boolean;
}

export function useLongPress({
    threshold = 420,
    onLongPress,
    onClick,
    disabled = false,
}: LongPressOptions) {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressRef = useRef(false);
    const startPosRef = useRef<{ x: number; y: number } | null>(null);

    const start = useCallback((event: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
        if (disabled) return;
        isLongPressRef.current = false;

        let clientX = 0;
        let clientY = 0;
        if ('touches' in event && event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else if ('clientX' in event) {
            clientX = (event as any).clientX;
            clientY = (event as any).clientY;
        }
        startPosRef.current = { x: clientX, y: clientY };

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            try {
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(35);
                }
            } catch (_) {}
            onLongPress(event);
        }, threshold);
    }, [disabled, onLongPress, threshold]);

    const clear = useCallback((event: React.MouseEvent | React.TouchEvent | React.PointerEvent, shouldTriggerClick = true) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (shouldTriggerClick && !isLongPressRef.current && onClick && !disabled) {
            onClick(event);
        }
    }, [disabled, onClick]);

    const move = useCallback((event: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
        if (!startPosRef.current || !timerRef.current) return;
        let clientX = 0;
        let clientY = 0;
        if ('touches' in event && event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else if ('clientX' in event) {
            clientX = (event as any).clientX;
            clientY = (event as any).clientY;
        }
        const dist = Math.hypot(clientX - startPosRef.current.x, clientY - startPosRef.current.y);
        if (dist > 10) {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }
    }, []);

    return {
        onPointerDown: (e: React.PointerEvent) => {
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            start(e);
        },
        onPointerUp: (e: React.PointerEvent) => clear(e, true),
        onPointerLeave: (e: React.PointerEvent) => clear(e, false),
        onPointerCancel: (e: React.PointerEvent) => clear(e, false),
        onPointerMove: move,
        onContextMenu: (e: React.MouseEvent) => {
            e.preventDefault();
            if (!disabled) {
                if (timerRef.current) clearTimeout(timerRef.current);
                onLongPress(e);
            }
        },
    };
}
