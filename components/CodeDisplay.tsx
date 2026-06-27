
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CopyIcon, CheckIcon, RefreshIcon, PreviewIcon, WordWrapIcon, EllipsisIcon, SaveIcon, PlayIcon, CodeIcon, SettingsIcon } from './icons';
import { useLanguage } from './LanguageContext';

export interface CodeLine {
  content: string;
  shapeId: string | null;
}

interface CodeDisplayProps {
  codeLines: CodeLine[];
  isLoading: boolean;
  error: string | null;
  onUpdate: () => void;
  onPreview: () => void;
  onSaveCode: () => void;
  onOpenOrRunCodeOnline: (runImmediately: boolean) => void;
  hasUnsyncedChanges: boolean;
  opacity: number;
  setOpacity: (opacity: number) => void;
  selectedShapeIds: string[];
  highlightCodeOnSelection: boolean;
  setHighlightCodeOnSelection: (show: boolean) => void;
  showLineNumbers: boolean;
  setShowLineNumbers: (show: boolean) => void;
  showComments: boolean;
  setShowComments: (show: boolean) => void;
  generatorType: 'local' | 'gemini';
  onSwitchToLocalGenerator: () => void;
  onOpenSettingsToGenerator: () => void;
  codeStringForExport: string;
}

// Custom hook to handle clicks outside a component
const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent) => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [ref, handler]);
};

const CodeDisplay: React.FC<CodeDisplayProps> = ({ codeLines, isLoading, error, onUpdate, onPreview, onSaveCode, onOpenOrRunCodeOnline, hasUnsyncedChanges, selectedShapeIds, highlightCodeOnSelection, setHighlightCodeOnSelection, showLineNumbers, setShowLineNumbers, showComments, setShowComments, generatorType, onSwitchToLocalGenerator, onOpenSettingsToGenerator, codeStringForExport }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isWordWrapEnabled, setIsWordWrapEnabled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const highlightedLineRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  
  useClickOutside(menuRef, () => setIsMenuOpen(false));

  const hasVisibleLines = useMemo(() => {
    if (showComments) {
        return codeLines.length > 0;
    }
    return codeLines.some(line => !line.content.trim().startsWith('#'));
  }, [codeLines, showComments]);

  useEffect(() => {
    if (codeLines.length > 0) {
      setIsCopied(false);
    }
  }, [codeLines]);
  
  useEffect(() => {
    if (highlightCodeOnSelection) {
        highlightedLineRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    }
  }, [selectedShapeIds, codeLines, highlightCodeOnSelection]);

  const handleCopy = () => {
    if (codeStringForExport) {
      navigator.clipboard.writeText(codeStringForExport);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
          <div className="w-8 h-8 border-4 border-t-transparent border-[var(--accent-primary)] rounded-full animate-spin"></div>
          <p className="mt-4">{t('code.generating')}</p>
        </div>
      );
    }
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-400 p-4 text-center">
                <h3 className="font-bold text-lg mb-2">{t('code.error')}</h3>
                <p className="text-sm">{error}</p>
                 <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                    <button
                        onClick={onOpenSettingsToGenerator}
                        className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                        <SettingsIcon size={16}/>
                        <span>{t('code.settings')}</span>
                    </button>
                    {generatorType === 'gemini' && (
                        <button
                            onClick={onSwitchToLocalGenerator}
                            className="px-4 py-2 rounded-md font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
                        >
                            {t('code.switchToLocal')}
                        </button>
                    )}
                 </div>
            </div>
        );
    }
    if (!hasVisibleLines) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)] p-4">
                <h3 className="font-bold text-lg">{t('code.placeholder.title')}</h3>
                <p className="text-sm text-center mt-2">{!showComments && codeLines.length > 0 ? t('code.placeholder.commentsHidden') : t('code.placeholder.draw')}</p>
            </div>
        );
    }

    return (
      <div className={`p-4 overflow-auto text-sm h-full font-mono allow-selection`}>
        {codeLines.map((line, index) => {
            const isComment = line.content.trim().startsWith('#');
            if (!showComments && isComment) {
                return null;
            }

            const isHighlighted = highlightCodeOnSelection && selectedShapeIds.length > 0 && !!line.shapeId && selectedShapeIds.includes(line.shapeId);
            const highlightClass = isHighlighted
                ? (isComment ? 'code-line-comment-highlighted' : 'code-line-highlighted')
                : '';

            return (
                <div
                key={index}
                ref={isHighlighted ? highlightedLineRef : null}
                className={`flex items-start`}
                >
                {showLineNumbers && (
                    <span
                    className={`text-right text-[var(--text-tertiary)] select-none pr-4 w-12 flex-shrink-0 ${(isHighlighted && !isComment) ? 'line-number-highlighted' : ''}`}
                    aria-hidden="true"
                    >
                    {index + 1}
                    </span>
                )}
                <span
                    className={`code-line flex-grow ${isWordWrapEnabled ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'} ${highlightClass ? `${highlightClass} rounded` : ''}`}
                >
                    {line.content || ' '}
                </span>
                </div>
            );
        })}
      </div>
    );
  };

  const isGemini = generatorType === 'gemini';

  return (
    <div className="shadow-lg h-full flex flex-col rounded-lg bg-[var(--bg-primary)]">
      <div className="flex justify-between items-center p-2 px-3 bg-[var(--bg-app)]/50 rounded-t-lg border-b border-[var(--border-primary)] flex-shrink-0">
        <h2 className="font-semibold text-[var(--text-primary)] text-sm">{t('code.title')}</h2>
        <div className="flex items-center gap-2">
            <button
                onClick={() => setIsWordWrapEnabled(p => !p)}
                title={isWordWrapEnabled ? t('code.wordWrap.off') : t('code.wordWrap.on')}
                className={`p-1.5 rounded-md transition-colors duration-200 ${isWordWrapEnabled ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
            >
                <WordWrapIcon size={16} />
            </button>
            {hasUnsyncedChanges && codeLines.length > 0 && !isLoading && (
                <button
                    onClick={onUpdate}
                    title={t('code.update')}
                    className={`flex items-center gap-1.5 rounded-md transition-colors duration-200 bg-yellow-600 hover:bg-yellow-500 text-white ${isGemini ? 'p-1.5' : 'px-2.5 py-1 text-xs'}`}
                >
                    <RefreshIcon />
                    {!isGemini && <span>{t('code.update')}</span>}
                </button>
            )}
            {codeLines.length > 0 && !error && !isLoading && (
                <button
                    onClick={onPreview}
                    title={t('code.preview')}
                    className={`flex items-center gap-1.5 rounded-md transition-colors duration-200 bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] ${isGemini ? 'p-1.5' : 'px-2.5 py-1 text-xs'}`}
                >
                    <PreviewIcon />
                    {!isGemini && <span>{t('code.preview')}</span>}
                </button>
            )}
            {codeLines.length > 0 && !error && (
                <button
                onClick={handleCopy}
                disabled={isCopied}
                className={`flex items-center gap-1.5 rounded-md transition-colors duration-200 bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:bg-green-600 disabled:text-white ${isGemini ? 'p-1.5' : 'px-2.5 py-1 text-xs'}`}
                >
                {isCopied ? <CheckIcon /> : <CopyIcon />}
                {!isGemini && (isCopied ? <span>{t('code.copied')}</span> : <span>{t('code.copy')}</span>)}
                </button>
            )}
            <div ref={menuRef} className="relative" onMouseLeave={() => setIsMenuOpen(false)}>
                <button
                    onClick={() => setIsMenuOpen(p => !p)}
                    title={t('code.options')}
                    className="p-1.5 rounded-md transition-colors duration-200 bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                >
                    <EllipsisIcon size={16} />
                </button>
                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-0 w-64 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-20 border border-[var(--border-secondary)]">
                        <label className="flex items-center w-full px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)] cursor-pointer" title={t('code.showComments')}>
                            <input
                                type="checkbox"
                                checked={showComments}
                                onChange={e => setShowComments(e.target.checked)}
                                className="mr-3 h-4 w-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-secondary)]"
                            />
                            <span>{t('code.showComments')}</span>
                        </label>
                        <label className="flex items-center w-full px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)] cursor-pointer has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:hover:bg-transparent" title={t('code.showLineNumbers')}>
                            <input
                                type="checkbox"
                                checked={showLineNumbers}
                                onChange={e => setShowLineNumbers(e.target.checked)}
                                className="mr-3 h-4 w-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-secondary)]"
                            />
                            <span>{t('code.showLineNumbers')}</span>
                        </label>
                        <label className="flex items-center w-full px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)] cursor-pointer has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:hover:bg-transparent" title={t('code.highlightDesc')}>
                            <input
                                type="checkbox"
                                checked={highlightCodeOnSelection}
                                onChange={e => setHighlightCodeOnSelection(e.target.checked)}
                                disabled={isGemini}
                                className="mr-3 h-4 w-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-secondary)]"
                            />
                            <span>{t('code.highlight')}</span>
                        </label>
                        <hr className="border-[var(--border-secondary)] my-1"/>
                        <button
                            onClick={() => { onSaveCode(); setIsMenuOpen(false); }}
                            disabled={codeLines.length === 0 || !!error}
                            className="w-full flex items-center gap-3 px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            title={t('code.saveFileDesc')}
                        >
                            <SaveIcon size={16} />
                            <span>{t('code.saveFile')}</span>
                        </button>
                         <button
                            onClick={() => { onOpenOrRunCodeOnline(false); setIsMenuOpen(false); }}
                            disabled={codeLines.length === 0 || !!error}
                            className="w-full flex items-center gap-3 px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            title={t('code.openOnlineDesc')}
                        >
                            <CodeIcon size={16} />
                            <span>{t('code.openOnline')}</span>
                        </button>
                        <button
                            onClick={() => { onOpenOrRunCodeOnline(true); setIsMenuOpen(false); }}
                            disabled={codeLines.length === 0 || !!error}
                            className="w-full flex items-center gap-3 px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            title={t('code.runOnlineDesc')}
                        >
                            <PlayIcon size={16} />
                            <span>{t('code.runOnline')}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
      <div className="flex-grow min-h-[200px] lg:min-h-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default CodeDisplay;
