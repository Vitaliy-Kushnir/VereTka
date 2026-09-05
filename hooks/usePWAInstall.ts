import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredPromptGlobal: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPromptGlobal = e as BeforeInstallPromptEvent;
    listeners.forEach((cb) => cb());
  });

  window.addEventListener('appinstalled', () => {
    deferredPromptGlobal = null;
    listeners.forEach((cb) => cb());
  });
}

export function usePWAInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(deferredPromptGlobal);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')
    );
  });
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const updatePrompt = () => {
      setPromptEvent(deferredPromptGlobal);
    };

    listeners.add(updatePrompt);

    // Standalone check
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(standalone);
    };

    checkStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener?.('change', checkStandalone);

    // Device detection
    const ua = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isMobileDevice = isIOSDevice || /android|webos|blackberry|iemobile|opera mini/i.test(ua) || window.innerWidth <= 768;

    setIsIOS(isIOSDevice);
    setIsMobile(isMobileDevice);

    return () => {
      listeners.delete(updatePrompt);
      mediaQuery.removeEventListener?.('change', checkStandalone);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPromptGlobal) {
      return false;
    }
    try {
      await deferredPromptGlobal.prompt();
      const choice = await deferredPromptGlobal.userChoice;
      if (choice.outcome === 'accepted') {
        deferredPromptGlobal = null;
        setPromptEvent(null);
        setIsInstalled(true);
        listeners.forEach((cb) => cb());
        return true;
      }
    } catch (err) {
      console.error('PWA install prompt failed:', err);
    }
    return false;
  }, []);

  return {
    isInstallable: !!promptEvent,
    isInstalled,
    isIOS,
    isMobile,
    install,
  };
}
