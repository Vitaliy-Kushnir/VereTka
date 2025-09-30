import React, { useMemo } from 'react';
import { XIcon, MessageSquareIcon, ExternalLinkIcon } from './icons';

interface FeedbackModalProps {
  onClose: () => void;
  appVersion: string;
}

// Helper function to get basic browser and OS info from the user agent string.
const getBrowserAndOsInfo = (): { browser: string; os: string } => {
    if (typeof navigator === 'undefined') {
        return { browser: 'Unknown', os: 'Unknown' };
    }
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // OS Detection
    if (ua.includes("Win")) os = "Windows";
    if (ua.includes("Mac")) os = "macOS";
    if (ua.includes("Linux")) os = "Linux";
    if (ua.includes("Android")) os = "Android";
    if (/(iPhone|iPad|iPod)/.test(ua)) os = "iOS";

    // More specific Windows version
    if (/Windows NT 10.0/.test(ua)) os = "Windows 10/11";
    else if (/Windows NT 6.3/.test(ua)) os = "Windows 8.1";
    else if (/Windows NT 6.2/.test(ua)) os = "Windows 8";
    else if (/Windows NT 6.1/.test(ua)) os = "Windows 7";

    // Browser Detection (order matters)
    let match;
    if ((match = ua.match(/(Edg|Edge)\/([\d.]+)/))) {
        browser = `Edge ${match[2]}`;
    } else if ((match = ua.match(/Firefox\/([\d.]+)/))) {
        browser = `Firefox ${match[1]}`;
    } else if ((match = ua.match(/Chrome\/([\d.]+)/))) {
        browser = `Chrome ${match[1]}`;
    } else if ((match = ua.match(/Version\/([\d.]+).*Safari/))) {
        browser = `Safari ${match[1]}`;
    }

    return { browser, os };
};


const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, appVersion }) => {
  const { browser, os } = useMemo(() => getBrowserAndOsInfo(), []);

  // Base URL for the Google Form
  const FORM_BASE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdTUJruu59--TShiM49xMQYohQ53K3ULIf0VpcCLWylFS-uzQ/viewform';
  
  // Field IDs from the Google Form
  const VERSION_FIELD_ID = 'entry.1570252682';
  const OS_FIELD_ID = 'entry.271524049';
  const BROWSER_FIELD_ID = 'entry.1270693046';

  // Dynamically create the full URL with pre-filled fields
  const GOOGLE_FORM_URL = useMemo(() => {
    const params = new URLSearchParams({
        'usp': 'pp_url',
        [VERSION_FIELD_ID]: appVersion,
        [OS_FIELD_ID]: os,
        [BROWSER_FIELD_ID]: browser,
    });
    return `${FORM_BASE_URL}?${params.toString()}`;
  }, [appVersion, os, browser]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] flex-shrink-0">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Залишити відгук</h2>
          <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full" aria-label="Закрити">
            <XIcon />
          </button>
        </header>

        <div className="p-8 space-y-6 overflow-y-auto text-center">
            <div className="flex justify-center">
              <MessageSquareIcon size={48} className="text-[var(--accent-primary)]"/>
            </div>
            <p className="text-md text-[var(--text-secondary)]">
                Ваш відгук надзвичайно важливий для покращення редактора. Повідомлення про помилки, нові ідеї та просто враження допомагають робити "ВереTkа" кращою.
            </p>
            <p className="text-sm text-[var(--text-tertiary)]">
                Найзручніший спосіб поділитися думками — заповнити спеціальну Google Форму. Це займе лише кілька хвилин.
            </p>
             <div className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-secondary)] p-2 rounded-md">
                <strong>Примітка:</strong> Дані про версію редактора, вашу ОС та браузер будуть додані до форми автоматично.
            </div>
            <div>
              <a 
                href={GOOGLE_FORM_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={onClose}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-lg font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors text-lg"
              >
                  <span>Перейти до форми відгуків</span>
                  <ExternalLinkIcon size={20} />
              </a>
            </div>
        </div>

        <footer className="p-4 bg-[var(--bg-app)]/50 rounded-b-lg flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-semibold bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            Закрити
          </button>
        </footer>
      </div>
    </div>
  );
};

export default FeedbackModal;