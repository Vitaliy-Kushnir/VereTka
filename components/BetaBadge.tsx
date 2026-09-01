import React, { useRef } from 'react';
import { useLanguage } from './LanguageContext';

interface BetaBadgeProps {
    size?: 'sm' | 'md' | 'lg';
    compact?: boolean;
    className?: string;
    showGlow?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    onCheatCodeTrigger?: () => void;
}

export const BetaBadge: React.FC<BetaBadgeProps> = ({ 
    size = 'lg', 
    compact = false,
    className = '',
    showGlow = true,
    onClick,
    onCheatCodeTrigger
}) => {
    const { language } = useLanguage();
    const clickCountRef = useRef<number>(0);
    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleBadgeClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
        }

        clickCountRef.current += 1;

        if (clickCountRef.current >= 12) {
            clickCountRef.current = 0;
            window.dispatchEvent(new CustomEvent('veretka:openCheatCodes'));
            if (onCheatCodeTrigger) {
                onCheatCodeTrigger();
            }
        } else {
            // Reset counter after 4 seconds of inactivity
            resetTimeoutRef.current = setTimeout(() => {
                clickCountRef.current = 0;
            }, 4000);
        }

        if (onClick) {
            onClick(e);
        }
    };

    const versionTextMap: Record<string, string> = {
        uk: 'версія',
        en: 'version',
        de: 'Version',
        fr: 'version',
        es: 'versión',
        it: 'versione',
    };
    const versionText = versionTextMap[language] || 'версія';

    const tooltipTextMap: Record<string, string> = {
        uk: 'ВереTkа знаходиться на етапі активної розробки (β-версія)',
        en: 'VereTka is in active beta preview (β-version)',
        de: 'VereTka befindet sich in aktiver Beta-Entwicklung (β-Version)',
        fr: 'VereTka est en version bêta active (β-version)',
        es: 'VereTka está en desarrollo beta activo (β-versión)',
        it: 'VereTka è in fase di sviluppo beta attivo (β-versione)',
    };
    const tooltipText = tooltipTextMap[language] || tooltipTextMap.uk;

    if (size === 'sm') {
        if (compact) {
            return (
                <button
                    type="button"
                    onClick={handleBadgeClick}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--brand-badge-bg)] border border-[var(--brand-badge-border)] shadow-xs select-none cursor-pointer active:scale-90 transition-transform ${className}`}
                    title={tooltipText}
                    aria-label={tooltipText}
                >
                    <span 
                        className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" 
                        style={{ backgroundColor: 'var(--brand-badge-dot-inner)' }}
                    />
                    <span className="font-serif italic text-xs font-bold text-[var(--brand-badge-symbol)] leading-none">
                        β
                    </span>
                </button>
            );
        }

        return (
            <button
                type="button"
                onClick={handleBadgeClick}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--brand-badge-bg)] border border-[var(--brand-badge-border)] shadow-xs select-none cursor-pointer active:scale-90 transition-transform ${className}`}
                title={tooltipText}
            >
                <span 
                    className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" 
                    style={{ backgroundColor: 'var(--brand-badge-dot-inner)' }}
                />
                <span className="font-serif italic text-[11px] font-bold text-[var(--brand-badge-symbol)] leading-none">
                    β-
                </span>
                <span 
                    className="font-handwriting text-xs font-bold lowercase tracking-wide leading-none bg-clip-text text-transparent"
                    style={{
                        backgroundImage: 'linear-gradient(135deg, var(--brand-badge-text-start), var(--brand-badge-text-mid), var(--brand-badge-text-end))'
                    }}
                >
                    {versionText}
                </span>
            </button>
        );
    }

    if (size === 'lg') {
        return (
            <div 
                role="button"
                tabIndex={0}
                onClick={handleBadgeClick}
                className={`inline-flex flex-col items-center select-none group cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${className}`}
                title={tooltipText}
            >
                <div 
                    className={`relative inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl transform -rotate-3 hover:rotate-0 transition-all duration-300 ease-out bg-[var(--brand-badge-bg)] backdrop-blur-md border border-[var(--brand-badge-border)] hover:border-[var(--brand-badge-border-hover)] shadow-[0_2px_14px_var(--brand-badge-shadow)] hover:shadow-[0_4px_20px_var(--brand-badge-shadow)] ${
                        showGlow ? 'ring-1 ring-[var(--brand-badge-border)]' : ''
                    }`}
                >
                    {/* Live indicator dot with pulse ring */}
                    <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
                        <span 
                            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ backgroundColor: 'var(--brand-badge-dot-outer)' }}
                        />
                        <span 
                            className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 shadow-xs" 
                            style={{ backgroundColor: 'var(--brand-badge-dot-inner)' }}
                        />
                    </span>

                    {/* Stylized Greek Beta symbol + Hyphen + Handwritten text */}
                    <div className="flex items-baseline gap-0.5">
                        <span className="font-serif italic font-extrabold text-sm sm:text-base text-[var(--brand-badge-symbol)] drop-shadow-xs">
                            β
                        </span>
                        <span className="font-sans font-bold text-xs sm:text-sm text-[var(--brand-badge-symbol)] opacity-80 mr-0.5">
                            -
                        </span>
                        <span 
                            className="font-handwriting text-base sm:text-lg md:text-xl font-bold tracking-wide bg-clip-text text-transparent drop-shadow-xs lowercase"
                            style={{
                                backgroundImage: 'linear-gradient(135deg, var(--brand-badge-text-start), var(--brand-badge-text-mid), var(--brand-badge-text-end))'
                            }}
                        >
                            {versionText}
                        </span>
                    </div>

                    {/* Stylized corner highlight reflection */}
                    <div className="absolute top-0 left-1 right-1 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full pointer-events-none" />
                </div>

                {/* Hand-drawn underline vector flourish */}
                <div className="w-full max-w-[85px] sm:max-w-[100px] -mt-0.5 sm:-mt-1 px-1 opacity-75 group-hover:opacity-100 transition-opacity">
                    <svg 
                        viewBox="0 0 100 12" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-2 sm:h-2.5 text-[var(--brand-badge-flourish)] drop-shadow-xs"
                    >
                        <path 
                            d="M2 7C22 1.5 48 10 72 4C84 1 93 6 98 3.5" 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </div>
        );
    }

    // Default medium badge
    return (
        <button
            type="button"
            onClick={handleBadgeClick}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl transform -rotate-2 bg-[var(--brand-badge-bg)] backdrop-blur-xs border border-[var(--brand-badge-border)] shadow-[0_0_10px_var(--brand-badge-shadow)] select-none cursor-pointer active:scale-90 transition-transform ${className}`}
            title={tooltipText}
        >
            <span 
                className="w-2 h-2 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: 'var(--brand-badge-dot-inner)' }}
            />
            <span className="font-serif italic font-bold text-xs text-[var(--brand-badge-symbol)]">β-</span>
            <span 
                className="font-handwriting text-sm font-bold bg-clip-text text-transparent lowercase"
                style={{
                    backgroundImage: 'linear-gradient(135deg, var(--brand-badge-text-start), var(--brand-badge-text-mid), var(--brand-badge-text-end))'
                }}
            >
                {versionText}
            </span>
        </button>
    );
};

export default BetaBadge;
