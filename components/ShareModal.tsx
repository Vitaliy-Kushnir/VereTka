import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { XIcon, CopyIcon, CheckIcon, ExternalLinkIcon, ShareLinkIcon } from './icons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareUrl }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [useLocalUrl, setUseLocalUrl] = useState(false);

  if (!isOpen) return null;

  // Extract compressed part from shareUrl
  const compressedPart = shareUrl.includes('#project=') ? shareUrl.split('#project=')[1] : '';
  
  // Local preview URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const cleanCurrentOrigin = currentOrigin.endsWith('/') ? currentOrigin : currentOrigin + '/';
  const localPreviewUrl = `${cleanCurrentOrigin}#project=${compressedPart}`;

  const activeUrl = useLocalUrl ? localPreviewUrl : shareUrl;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const handleOpenNewTab = () => {
    window.open(activeUrl, '_blank', 'noopener,noreferrer');
  };

  const urlLength = activeUrl.length;
  const isTooLong = urlLength > 8000;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-[var(--border-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-2 text-[var(--accent-primary)]">
            <ShareLinkIcon size={22} />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('share.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full transition-colors"
            aria-label={t('action.close')}
          >
            <XIcon size={20} />
          </button>
        </header>

        <div className="p-6 space-y-4">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {t('share.desc')}
          </p>

          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-secondary)] text-xs font-medium">
            <button
              onClick={() => setUseLocalUrl(false)}
              className={`flex-1 py-1.5 px-3 rounded-md transition-colors ${
                !useLocalUrl
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              GitHub Pages (для поширення)
            </button>
            <button
              onClick={() => setUseLocalUrl(true)}
              className={`flex-1 py-1.5 px-3 rounded-md transition-colors ${
                useLocalUrl
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Поточний сайт (для тестування)
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] flex justify-between">
              <span>{useLocalUrl ? 'Тестове посилання (поточний прев’ю)' : t('share.urlLabel')}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={activeUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-3 py-2 text-xs font-mono w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-md font-medium text-sm flex items-center gap-1.5 shrink-0 transition-colors ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)]'
                }`}
              >
                {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                <span>{copied ? t('share.copied') : t('share.copy')}</span>
              </button>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg p-3 text-xs text-[var(--text-secondary)] leading-relaxed space-y-1">
            <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1">
              <span>💡 Чому сайт на GitHub Pages відкрив стартову сторінку?</span>
            </div>
            <p>
              На GitHub Pages зараз завантажена раніша версія редактора. Вона ще не містить оновленого коду зчитування посилань.
            </p>
            <p className="text-[var(--text-tertiary)]">
              Опублікуйте/оновіть збірку проекту на GitHub Pages, і посилання відкриватиме проєкт там бездоганно. Для миттєвої перевірки оберіть вкладку <strong>«Поточний сайт (для тестування)»</strong> і натисніть <strong>«Перевірити посилання»</strong>.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] pt-1">
            <span>
              {t('share.size')}: {(urlLength / 1024).toFixed(1)} KB ({urlLength} {t('share.chars')})
            </span>
            <button
              onClick={handleOpenNewTab}
              className="text-[var(--accent-primary)] hover:underline flex items-center gap-1 font-medium"
            >
              <ExternalLinkIcon size={14} />
              <span>{t('share.testOpen')}</span>
            </button>
          </div>

          {isTooLong && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 text-xs text-amber-200/90 leading-relaxed">
              {t('share.tooLongWarning')}
            </div>
          )}
        </div>

        <footer className="p-4 bg-[var(--bg-app)]/50 border-t border-[var(--border-primary)] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-semibold bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors text-sm"
          >
            {t('action.close')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ShareModal;
