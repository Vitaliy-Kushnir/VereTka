import React, { useState, useEffect, useMemo } from 'react';
import { XIcon } from './icons';
import { useLanguage } from './LanguageContext';

const SearchIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  key: string;
  category: 'tools' | 'file' | 'movement' | 'navigation';
  labelKey: string;
  keys: string[][];
}

const SHORTCUTS_DATA: ShortcutItem[] = [
  // File & History
  { key: 'save', category: 'file', labelKey: 'shortcuts.item.save', keys: [['Ctrl', 'S']] },
  { key: 'undo', category: 'file', labelKey: 'shortcuts.item.undo', keys: [['Ctrl', 'Z']] },
  { key: 'redo', category: 'file', labelKey: 'shortcuts.item.redo', keys: [['Ctrl', 'Y'], ['Ctrl', 'Shift', 'Z']] },
  
  // Tools & Selection
  { key: 'selectTool', category: 'tools', labelKey: 'shortcuts.item.selectTool', keys: [['V']] },
  { key: 'editPointsTool', category: 'tools', labelKey: 'shortcuts.item.editPointsTool', keys: [['A']] },
  { key: 'duplicate', category: 'tools', labelKey: 'shortcuts.item.duplicate', keys: [['Ctrl', 'D']] },
  { key: 'delete', category: 'tools', labelKey: 'shortcuts.item.delete', keys: [['Del'], ['Backspace']] },
  { key: 'group', category: 'tools', labelKey: 'shortcuts.item.group', keys: [['Ctrl', 'G']] },
  { key: 'ungroup', category: 'tools', labelKey: 'shortcuts.item.ungroup', keys: [['Ctrl', 'Shift', 'G']] },
  { key: 'flipH', category: 'tools', labelKey: 'shortcuts.item.flipH', keys: [['Ctrl', 'H']] },
  { key: 'flipV', category: 'tools', labelKey: 'shortcuts.item.flipV', keys: [['Ctrl', 'V']] },
  { key: 'cancel', category: 'tools', labelKey: 'shortcuts.item.cancel', keys: [['Esc']] },

  // Nudging & Movement
  { key: 'move1px', category: 'movement', labelKey: 'shortcuts.item.move1px', keys: [['↑'], ['↓'], ['←'], ['→']] },
  { key: 'move10px', category: 'movement', labelKey: 'shortcuts.item.move10px', keys: [['Shift', '↑↓←→']] },
  { key: 'moveNoSnap', category: 'movement', labelKey: 'shortcuts.item.moveNoSnap', keys: [['Alt', '↑↓←→']] },

  // Navigation & View
  { key: 'showShortcuts', category: 'navigation', labelKey: 'shortcuts.item.showShortcuts', keys: [['?']] },
  { key: 'zoom', category: 'navigation', labelKey: 'shortcuts.item.zoom', keys: [['Scroll']] },
  { key: 'pan', category: 'navigation', labelKey: 'shortcuts.item.pan', keys: [['Middle Click']] },
  { key: 'fullscreen', category: 'navigation', labelKey: 'shortcuts.item.fullscreen', keys: [['F11']] },
];

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const categories = useMemo(() => [
    { id: 'all', label: t('shortcuts.all') },
    { id: 'tools', label: t('shortcuts.cat.tools') },
    { id: 'file', label: t('shortcuts.cat.file') },
    { id: 'movement', label: t('shortcuts.cat.movement') },
    { id: 'navigation', label: t('shortcuts.cat.navigation') },
  ], [t]);

  const filteredShortcuts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return SHORTCUTS_DATA.filter(item => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (!term) return true;
      const label = t(item.labelKey).toLowerCase();
      const keysString = item.keys.map(k => k.join(' + ')).join(' ').toLowerCase();
      return label.includes(term) || keysString.includes(term);
    });
  }, [searchTerm, activeCategory, t]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="p-4 border-b border-[var(--border-secondary)] flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-0.5 text-xs font-mono font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] rounded shadow-sm">
              ?
            </kbd>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {t('shortcuts.title')}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full transition-colors" 
            aria-label={t('action.close')}
          >
            <XIcon size={18} />
          </button>
        </header>

        {/* Controls: Search and Category Tabs */}
        <div className="p-4 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30 flex flex-col gap-3 flex-shrink-0">
          <div className="relative w-full">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder={t('shortcuts.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm rounded-lg border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none placeholder-[var(--text-tertiary)]"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                title={t('help.clearSearch')}
              >
                <XIcon size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of Shortcuts */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredShortcuts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredShortcuts.map(item => (
                <div 
                  key={item.key} 
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-secondary)]/60 hover:border-[var(--accent-primary)]/50 transition-colors"
                >
                  <span className="text-sm font-medium text-[var(--text-secondary)] pr-2">
                    {t(item.labelKey)}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.keys.map((combo, comboIdx) => (
                      <React.Fragment key={comboIdx}>
                        {comboIdx > 0 && <span className="text-xs text-[var(--text-tertiary)]">/</span>}
                        <div className="flex items-center gap-1">
                          {combo.map((k, kIdx) => (
                            <kbd
                              key={kIdx}
                              className="px-2 py-1 text-xs font-mono font-semibold bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded shadow-xs"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-[var(--text-tertiary)] italic">
              {t('shortcuts.notFound')}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-3 border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)]/40 flex items-center justify-between text-xs text-[var(--text-tertiary)] flex-shrink-0">
          <span>{t('shortcuts.footerHint')}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
          >
            {t('action.close')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
