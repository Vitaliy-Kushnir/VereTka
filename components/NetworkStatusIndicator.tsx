import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useLanguage } from './LanguageContext';

export interface NetworkStatusIndicatorProps {
  isCached?: boolean;
  compact?: boolean;
  className?: string;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  isCached = false,
  compact = false,
  className = '',
}) => {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();

  let statusText = t('network.online') || 'Онлайн';
  let tooltipText = t('network.onlineTooltip') || 'Підключено до мережі (онлайн)';
  let badgeStyles = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  let dotStyles = 'bg-emerald-500';

  if (!isOnline) {
    statusText = t('network.offline') || 'Офлайн';
    tooltipText = t('network.offlineTooltip') || 'Немає підключення. Сервіс-воркер використовує збережений кеш.';
    badgeStyles = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    dotStyles = 'bg-rose-500';
  } else if (isCached) {
    statusText = t('network.cached') || 'Кеш SW';
    tooltipText = t('network.cachedTooltip') || 'Підключено до мережі. Сервіс-воркер відображає збережений кеш.';
    badgeStyles = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    dotStyles = 'bg-amber-500';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:py-1 rounded-full border text-[10px] sm:text-xs font-medium transition-all select-none ${badgeStyles} ${className}`}
      title={tooltipText}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {!isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotStyles}`} />
      </span>

      {!compact && (
        <span className="whitespace-nowrap font-semibold tracking-tight">
          {statusText}
        </span>
      )}
    </div>
  );
};
