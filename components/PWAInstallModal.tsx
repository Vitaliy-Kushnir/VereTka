import React from 'react';
import { useLanguage } from './LanguageContext';
import { XIcon, VeretkaLogoIcon } from './icons';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<boolean>;
  isInstallable: boolean;
  isIOS: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isInstallable,
  isIOS,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await onInstall();
    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[var(--bg-primary)] rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-[var(--border-primary)] overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex justify-between items-center p-4 sm:p-5 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center p-1.5 shrink-0 shadow-xs">
              <VeretkaLogoIcon size={24} className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-tight">
                {t('pwa.modal.title') || 'Встановити додаток VereTka'}
              </h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                {t('pwa.modal.subtitle') || 'Швидкий запуск та робота без інтернету'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            aria-label={t('action.close') || 'Закрити'}
          >
            <XIcon size={18} />
          </button>
        </header>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-sm text-[var(--text-secondary)]">
          {/* iOS Safari Instructions */}
          {isIOS ? (
            <div className="space-y-3.5">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-500 font-medium">
                {t('pwa.ios.hint') || 'В Safari на iPhone та iPad для встановлення виконайте 3 простих кроки:'}
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)]/50">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs sm:text-sm text-[var(--text-primary)]">
                    <span className="font-semibold">{t('pwa.ios.step1.bold') || 'Натисніть кнопку «Поділитися»'}</span>
                    <span className="text-[var(--text-secondary)]"> ({t('pwa.ios.step1.sub') || 'іконка квадрата зі стрілкою вгору'}) у нижній панелі Safari.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)]/50">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs sm:text-sm text-[var(--text-primary)]">
                    <span className="font-semibold">{t('pwa.ios.step2.bold') || 'Прокрутіть меню та оберіть'}</span>
                    <span className="text-[var(--text-secondary)]"> «{t('pwa.ios.step2.action') || 'На початковий екран'}» (Add to Home Screen).</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)]/50">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs sm:text-sm text-[var(--text-primary)]">
                    <span className="font-semibold">{t('pwa.ios.step3.bold') || 'Підтвердіть'}</span>
                    <span className="text-[var(--text-secondary)]">: натисніть «{t('pwa.ios.step3.action') || 'Додати'}» у правому верхньому кутку.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : isInstallable ? (
            /* Android / Chrome One-Click Install */
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-primary)]">
                {t('pwa.android.intro') || 'Натисніть кнопку нижче, щоб додати редактор на головний екран вашого пристрою. Він працюватиме на весь екран як окрема програма!'}
              </p>

              <div className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-500 font-medium">
                  <span>✓</span>
                  <span>{t('pwa.feature.fullscreen') || 'Окреме вікно без рамок та адресного рядка'}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 font-medium">
                  <span>✓</span>
                  <span>{t('pwa.feature.offline') || 'Робота полотна без з\'єднання з інтернетом'}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 font-medium">
                  <span>✓</span>
                  <span>{t('pwa.feature.fast') || 'Миттєве відкриття та збереження ваших проєктів'}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Fallback instructions for other browsers / desktop */
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-primary)]">
                {t('pwa.generic.intro') || 'Ви можете додати «Веретку» на свій пристрій через меню вашого браузера.'}
              </p>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] text-xs space-y-2 text-[var(--text-secondary)]">
                <p>
                  • <strong>Chrome / Edge:</strong> {t('pwa.generic.chrome') || 'Натисніть значок встановлення в правому кутку адресного рядка або меню (⋮) ➔ «Встановити Веретку».'}
                </p>
                <p>
                  • <strong>Мобільні браузери:</strong> {t('pwa.generic.mobile') || 'Відкрийте меню браузера (три крапки) ➔ «Додати на головний екран».'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <footer className="p-4 sm:p-5 bg-[var(--bg-secondary)]/40 border-t border-[var(--border-primary)] flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            {t('action.close') || 'Закрити'}
          </button>
          {isInstallable && !isIOS && (
            <button
              onClick={handleInstallClick}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{t('pwa.btn.installNow') || 'Встановити зараз'}</span>
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
