import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint || (window.innerHeight <= 560 && window.innerWidth <= 1180);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      // Ignore viewport resize caused by virtual keyboard opening on mobile
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && 
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || (activeEl as HTMLElement).isContentEditable);
      
      if (isInputFocused) return;

      const mobile = window.innerWidth <= breakpoint || (window.innerHeight <= 560 && window.innerWidth <= 1180);
      setIsMobile(mobile);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}

export function useIsLandscape() {
  const [isLandscape, setIsLandscape] = useState(() => {
    if (typeof window === 'undefined') return false;
    const mediaQuery = window.matchMedia('(orientation: landscape)');
    if (mediaQuery && typeof mediaQuery.matches === 'boolean') {
      return mediaQuery.matches;
    }
    return window.innerWidth > window.innerHeight;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(orientation: landscape)');

    const handleOrientation = () => {
      // Ignore viewport resize caused by virtual keyboard opening on mobile
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && 
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || (activeEl as HTMLElement).isContentEditable);
      
      if (isInputFocused) return;

      if (mediaQuery && typeof mediaQuery.matches === 'boolean') {
        setIsLandscape(mediaQuery.matches);
      } else {
        setIsLandscape(window.innerWidth > window.innerHeight);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleOrientation);
    }
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleOrientation);
      }
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  return isLandscape;
}


