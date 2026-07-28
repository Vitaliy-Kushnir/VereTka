const fs = require('fs');

const fileContent = fs.readFileSync('components/SettingsModal.tsx', 'utf-8');

// I will extract everything from "import React" to "type Tab ="
const topPart = fileContent.substring(0, fileContent.indexOf('const TabButton:'));

// I will extract everything after the deleted block.
// Let's see what is after the deleted block.
const endPartIndex = fileContent.indexOf('<div className="flex items-start pt-2">');
const endPart = fileContent.substring(endPartIndex);

const reconstructed = `
${topPart}

const TabButton: React.FC<{ tab: Tab; label: string; activeTab: Tab; onSelect: (tab: Tab) => void }> = ({ tab, label, activeTab, onSelect }) => (
    <button
        onClick={() => onSelect(tab)}
        className={\`px-3 py-2 text-sm font-medium rounded-md transition-colors \${
            activeTab === tab
                ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
        }\`}
    >
        {label}
    </button>
);

const SettingsModal: React.FC<SettingsModalProps> = (props) => {
    const { t, language, setLanguage } = useLanguage();
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>(props.initialTab || 'canvas');
    
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [editingTemplateName, setEditingTemplateName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleStartEditing = (template: ProjectTemplate) => {
        setEditingTemplateId(template.id);
        setEditingTemplateName(template.name);
    };

    const handleConfirmEditing = () => {
        if (editingTemplateId && editingTemplateName.trim()) {
            props.onRenameTemplate(editingTemplateId, editingTemplateName.trim());
        }
        setEditingTemplateId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirmEditing();
        } else if (e.key === 'Escape') {
            setEditingTemplateId(null);
        }
    };

    useEffect(() => {
        if (editingTemplateId && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingTemplateId]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={props.onClose} aria-modal="true" role="dialog">
            <div className="bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-[var(--border-secondary)] flex items-center justify-between gap-4 flex-shrink-0">
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('settings.title')}</h2>
                    <button onClick={props.onClose} className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full transition-colors" aria-label={t('settings.close')}>
                        <XIcon size={18} />
                    </button>
                </header>
                
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-48 bg-[var(--bg-secondary)] border-r border-[var(--border-secondary)] flex flex-col p-2 space-y-1 overflow-y-auto">
                        <TabButton tab="canvas" label={t('settings.tabs.canvas')} activeTab={activeTab} onSelect={setActiveTab} />
                        <TabButton tab="grid" label={t('settings.tabs.grid')} activeTab={activeTab} onSelect={setActiveTab} />
                        <TabButton tab="appearance" label={t('settings.tabs.appearance')} activeTab={activeTab} onSelect={setActiveTab} />
                        <TabButton tab="code" label={t('settings.tabs.code')} activeTab={activeTab} onSelect={setActiveTab} />
                        <TabButton tab="templates" label={t('settings.tabs.templates')} activeTab={activeTab} onSelect={setActiveTab} />
                    </div>

                    <div className="flex-grow p-6 space-y-4 overflow-y-auto" onClick={() => setIsLanguageOpen(false)}>
                        {activeTab === 'canvas' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)]">{t('settings.canvas.title')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <NumberInput label={t('settings.canvas.width')} value={props.canvasWidth} onChange={props.setCanvasWidth} min={100} max={5000} />
                                    <NumberInput label={t('settings.canvas.height')} value={props.canvasHeight} onChange={props.setCanvasHeight} min={100} max={5000} />
                                    <ColorInput label={t('settings.canvas.bgColor')} value={props.canvasBgColor} onChange={props.setCanvasBgColor} />
                                    <Label title={t('settings.canvas.varName')}>
                                        <input type="text" value={props.canvasVarName} onChange={e => props.setCanvasVarName(e.target.value)} className="w-full bg-[var(--bg-app)] border border-[var(--border-secondary)] text-[var(--text-primary)] text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-shadow" />
                                    </Label>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'grid' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)]">{t('settings.grid.title')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <NumberInput label={t('settings.grid.size')} value={props.gridSize} onChange={props.setGridSize} min={5} max={100} />
                                    <NumberInput label={t('settings.grid.snapStep')} value={props.gridSnapStep} onChange={props.setGridSnapStep} min={1} max={50} />
                                </div>
                                <label className="flex items-start pt-2">
                                    <input type="checkbox" checked={props.enableSnapping} onChange={e => props.setEnableSnapping(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
                                    <div className="ml-3 text-sm font-medium text-[var(--text-secondary)]">{t('settings.grid.snapping')}</div>
                                </label>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)]">{t('settings.appearance.title')}</h3>
                                
                                <div className="space-y-3">
                                    <label className="flex items-start">
                                        <input type="checkbox" checked={props.showAxes} onChange={e => props.setShowAxes(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
                                        <span className="ml-3 text-sm font-medium text-[var(--text-secondary)]">{t('settings.appearance.axes')}</span>
                                    </label>
                                    <label className="flex items-start">
                                        <input type="checkbox" checked={props.showCenterGuides} onChange={e => props.setShowCenterGuides(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
                                        <span className="ml-3 text-sm font-medium text-[var(--text-secondary)]">{t('settings.appearance.centerGuides')}</span>
                                    </label>
                                    <label className="flex items-start">
                                        <input type="checkbox" checked={props.showCursorCoords} onChange={e => props.setShowCursorCoords(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
                                        <span className="ml-3 text-sm font-medium text-[var(--text-secondary)]">{t('settings.appearance.cursorCoords')}</span>
                                    </label>
                                    <label className="flex items-start">
                                        <input type="checkbox" checked={props.showRotationAngle} onChange={e => props.setShowRotationAngle(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
                                        <span className="ml-3 text-sm font-medium text-[var(--text-secondary)]">{t('settings.appearance.rotationAngle')}</span>
                                    </label>
                                </div>

                                <div className="pt-4 border-t border-[var(--border-secondary)]">
                                    <div className="flex flex-col space-y-2 relative">
                                        <label className="text-sm font-medium text-[var(--text-secondary)]">{t('settings.appearance.language')}</label>
                                        <div className="relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsLanguageOpen(!isLanguageOpen); }}
                                                className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-md pl-3 pr-8 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] flex items-center gap-2 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors shadow-sm"
                                            >
                                                {language === 'uk' ? 'Українська' : language === 'en' ? 'English' : language === 'de' ? 'Deutsch' : language === 'fr' ? 'Français' : language === 'it' ? 'Italiano' : 'Español'}
                                            </button>
                                            {isLanguageOpen && (
                                                <div className="absolute left-0 mt-1 w-36 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md shadow-lg py-1 z-50">
                                                    <button onClick={() => { setLanguage('uk'); setIsLanguageOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2">Українська</button>
                                                    <button onClick={() => { setLanguage('en'); setIsLanguageOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2">English</button>
                                                    <button onClick={() => { setLanguage('de'); setIsLanguageOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2">Deutsch</button>
                                                    <button onClick={() => { setLanguage('fr'); setIsLanguageOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2">Français</button>
                                                    <button onClick={() => { setLanguage('it'); setIsLanguageOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2">Italiano</button>
                                                    <button onClick={() => { setLanguage('es'); setIsLanguageOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2">Español</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'code' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)]">{t('settings.code.title')}</h3>
                                <div className="space-y-4">
                                    <Label title={t('settings.code.generator')}>
                                        <select value={props.generatorType} onChange={e => props.setGeneratorType(e.target.value as any)} className="w-full bg-[var(--bg-app)] border border-[var(--border-secondary)] text-[var(--text-primary)] text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-shadow">
                                            <option value="local">{t('settings.code.generator.local')}</option>
                                            <option value="gemini">{t('settings.code.generator.gemini')}</option>
                                        </select>
                                    </Label>
                                </div>
                                <div className="flex items-start pt-2">
${endPart.replace('<div className="flex items-start pt-2">', '')}
`;

fs.writeFileSync('components/SettingsModal.tsx', reconstructed);
