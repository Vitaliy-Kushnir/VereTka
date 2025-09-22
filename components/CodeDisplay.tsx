import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CopyIcon, CheckIcon, RefreshIcon, PreviewIcon, WordWrapIcon, EllipsisIcon, SaveIcon, PlayIcon, CodeIcon } from './icons';

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
  selectedShapeId: string | null;
  highlightCodeOnSelection: boolean;
  setHighlightCodeOnSelection: (show: boolean) => void;
  showLineNumbers: boolean;
  setShowLineNumbers: (show: boolean) => void;
  showComments: boolean;
  setShowComments: (show: boolean) => void;
  generatorType: 'local' | 'gemini';
  onSwitchToLocalGenerator: () => void;
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

const CodeDisplay: React.FC<CodeDisplayProps> = ({ codeLines, isLoading, error, onUpdate, onPreview, onSaveCode, onOpenOrRunCodeOnline, hasUnsyncedChanges, selectedShapeId, highlightCodeOnSelection, setHighlightCodeOnSelection, showLineNumbers, setShowLineNumbers, showComments, setShowComments, generatorType, onSwitchToLocalGenerator }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isWordWrapEnabled, setIsWordWrapEnabled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const highlightedLineRef = useRef<HTMLDivElement>(null);
  
  useClickOutside(menuRef, () => setIsMenuOpen(false));

  const codeAsString = useMemo(() => codeLines.map(line => line.content).join('\n'), [codeLines]);
  
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
  }, [selectedShapeId, codeLines, highlightCodeOnSelection]);

  const handleCopy = () => {
    if (codeAsString) {
      navigator.clipboard.writeText(codeAsString);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
          <div className="w-8 h-8 border-4 border-t-transparent border-[var(--accent-primary)] rounded-full animate-spin"></div>
          <p className="mt-4">Генеруємо Python код...</p>
        </div>
      );
    }
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-400 p-4 text-center">
                <h3 className="font-bold text-lg mb-2">Помилка генерації</h3>
                <p className="text-sm">{error}</p>
                {generatorType === 'gemini' && (
                    <button
                        onClick={onSwitchToLocalGenerator}
                        className="mt-4 px-4 py-2 rounded-md font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
                    >
                        Перемкнутись на локальний генератор
                    </button>
                )}
            </div>
        );
    }
    if (!hasVisibleLines) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)] p-4">
                <h3 className="font-bold text-lg">Код з'явиться тут</h3>
                <p className="text-sm text-center mt-2">{!showComments && codeLines.length > 0 ? "Коментарі приховані. Увімкніть їх, щоб побачити код." : "Намалюйте фігури та згенеруйте код."}</p>
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

            const isHighlighted = highlightCodeOnSelection && selectedShapeId !== null && line.shapeId === selectedShapeId;
            return (
                <div
                key={index}
                ref={isHighlighted ? highlightedLineRef : null}
                className={`flex items-start`}
                >
                {showLineNumbers && (
                    <span
                    className={`text-right text-[var(--text-tertiary)] select-none pr-4 w-12 flex-shrink-0 ${isHighlighted ? 'line-number-highlighted' : ''}`}
                    aria-hidden="true"
                    >
                    {index + 1}
                    </span>
                )}
                <span
                    className={`code-line flex-grow ${isWordWrapEnabled ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'} ${isHighlighted ? 'code-line-highlighted rounded' : ''}`}
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
        <h2 className="font-semibold text-[var(--text-primary)] text-sm">Код Tkinter</h2>
        <div className="flex items-center gap-2">
            <button
                onClick={() => setIsWordWrapEnabled(p => !p)}
                title={isWordWrapEnabled ? "Вимкнути перенесення рядків" : "Увімкнути перенесення рядків"}
                className={`p-1.5 rounded-md transition-colors duration-200 ${isWordWrapEnabled ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
            >
                <WordWrapIcon size={16} />
            </button>
            {hasUnsyncedChanges && codeLines.length > 0 && !isLoading && (
                <button
                    onClick={onUpdate}
                    title="Оновити код"
                    className={`flex items-center gap-1.5 rounded-md transition-colors duration-200 bg-yellow-600 hover:bg-yellow-500 text-white ${isGemini ? 'p-1.5' : 'px-2.5 py-1 text-xs'}`}
                >
                    <RefreshIcon />
                    {!isGemini && <span>Оновити</span>}
                </button>
            )}
            {codeLines.length > 0 && !error && !isLoading && (
                <button
                    onClick={onPreview}
                    title="Попередній перегляд"
                    className={`flex items-center gap-1.5 rounded-md transition-colors duration-200 bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] ${isGemini ? 'p-1.5' : 'px-2.5 py-1 text-xs'}`}
                >
                    <PreviewIcon />
                    {!isGemini && <span>Перегляд</span>}
                </button>
            )}
            {codeLines.length > 0 && !error && (
                <button
                onClick={handleCopy}
                disabled={isCopied}
                className={`flex items-center gap-1.5 rounded-md transition-colors duration-200 bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:bg-green-600 disabled:text-white ${isGemini ? 'p-1.5' : 'px-2.5 py-1 text-xs'}`}
                >
                {isCopied ? <CheckIcon /> : <CopyIcon />}
                {!isGemini && (isCopied ? <span>Скопійовано!</span> : <span>Копіювати</span>)}
                </button>
            )}
            <div ref={menuRef} className="relative" onMouseLeave={() => setIsMenuOpen(false)}>
                <button
                    onClick={() => setIsMenuOpen(p => !p)}
                    title="Додаткові опції"
                    className="p-1.5 rounded-md transition-colors duration-200 bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                >
                    <EllipsisIcon size={16} />
                </button>
                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-0 w-64 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-20 border border-[var(--border-secondary)]">
                        <label className="flex items-center w-full px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)] cursor-pointer" title="Показувати або приховувати коментарі у коді.">
                            <input
                                type="checkbox"
                                checked={showComments}
                                onChange={e => setShowComments(e.target.checked)}
                                className="mr-3 h-4 w-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-secondary)]"
                            />
                            <span>Показувати коментарі</span>
                        </label>
                        <label className="flex items-center w-full px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)] cursor-pointer has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:hover:bg-transparent" title="Показувати або приховувати номери рядків у вікні коду.">
                            <input
                                type="checkbox"
                                checked={showLineNumbers}
                                onChange={e => setShowLineNumbers(e.target.checked)}
                                className="mr-3 h-4 w-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-secondary)]"
                            />
                            <span>Показувати номери рядків</span>
                        </label>
                        <label className="flex items-center w-full px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)] cursor-pointer has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:hover:bg-transparent" title="Автоматично підсвічувати рядок коду, що відповідає вибраній фігурі на полотні. Працює лише з локальним генератором.">
                            <input
                                type="checkbox"
                                checked={highlightCodeOnSelection}
                                onChange={e => setHighlightCodeOnSelection(e.target.checked)}
                                disabled={isGemini}
                                className="mr-3 h-4 w-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-secondary)]"
                            />
                            <span>Підсвічувати код при виділенні</span>
                        </label>
                        <hr className="border-[var(--border-secondary)] my-1"/>
                        <button
                            onClick={() => { onSaveCode(); setIsMenuOpen(false); }}
                            disabled={codeLines.length === 0 || !!error}
                            className="w-full flex items-center gap-3 px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            title="Зберегти згенерований Python код у .py файл."
                        >
                            <SaveIcon size={16} />
                            <span>Зберегти у файл...</span>
                        </button>
                         <button
                            onClick={() => { onOpenOrRunCodeOnline(false); setIsMenuOpen(false); }}
                            disabled={codeLines.length === 0 || !!error}
                            className="w-full flex items-center gap-3 px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            title="Відкрити код у онлайн-редакторі ЄPython без запуску."
                        >
                            <CodeIcon size={16} />
                            <span>Відкрити в онлайн IDE...</span>
                        </button>
                        <button
                            onClick={() => { onOpenOrRunCodeOnline(true); setIsMenuOpen(false); }}
                            disabled={codeLines.length === 0 || !!error}
                            className="w-full flex items-center gap-3 px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            title="Відкрити та одразу запустити код у онлайн-редакторі ЄPython."
                        >
                            <PlayIcon size={16} />
                            <span>Запустити в онлайн IDE...</span>
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