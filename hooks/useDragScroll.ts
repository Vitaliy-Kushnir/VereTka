import { useRef, useCallback, useEffect } from 'react';

export function useDragScroll() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isDown = useRef(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const scrollLeft = useRef(0);
    const scrollTop = useRef(0);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!scrollRef.current) return;
        isDown.current = true;
        scrollRef.current.classList.add('cursor-grabbing');
        startX.current = e.pageX - scrollRef.current.offsetLeft;
        startY.current = e.pageY - scrollRef.current.offsetTop;
        scrollLeft.current = scrollRef.current.scrollLeft;
        scrollTop.current = scrollRef.current.scrollTop;
    }, []);

    const handleMouseLeave = useCallback(() => {
        isDown.current = false;
        if (scrollRef.current) {
            scrollRef.current.classList.remove('cursor-grabbing');
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        isDown.current = false;
        if (scrollRef.current) {
            scrollRef.current.classList.remove('cursor-grabbing');
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDown.current || !scrollRef.current) return;
        
        e.preventDefault(); // Prevents text selection while dragging
        
        const x = e.pageX - scrollRef.current.offsetLeft;
        const y = e.pageY - scrollRef.current.offsetTop;
        const walkX = (x - startX.current) * 1.5; // Scroll fast
        const walkY = (y - startY.current) * 1.5;

        scrollRef.current.scrollLeft = scrollLeft.current - walkX;
        scrollRef.current.scrollTop = scrollTop.current - walkY;
    }, []);

    // Clean up
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            isDown.current = false;
            if (scrollRef.current) {
                scrollRef.current.classList.remove('cursor-grabbing');
            }
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    return {
        scrollRef,
        onMouseDown: handleMouseDown,
        onMouseLeave: handleMouseLeave,
        onMouseUp: handleMouseUp,
        onMouseMove: handleMouseMove
    };
}
