import React, { useState, useRef, useEffect } from 'react';
import { XIcon } from './icons';
import { InputWrapper, Label, NumberInput, ColorInput } from './FormControls';
import { type ProjectTemplate } from '../types';
import { useLanguage } from './LanguageContext';

interface SettingsModalProps {
  onClose: () => void;
  onOpenApiKeyModal: () => void;
  onDeleteTemplate: (templateId: string) => void;
  onRenameTemplate: (templateId: string, newName: string) => void;
  templates: ProjectTemplate[];
  canvasWidth: number;
  setCanvasWidth: (w: number) => void;
  canvasHeight: number;
  setCanvasHeight: (h: number) => void;
  canvasBgColor: string;
  setCanvasBgColor: (c: string) => void;
  setPreviewCanvasBgColor: (c: string | null) => void;
  canvasVarName: string;
  setCanvasVarName: (name: string) => void;
  gridSize: number;
  setGridSize: (s: number) => void;
  gridSnapStep: number;
  setGridSnapStep: (s: number) => void;
  showTkinterNames: boolean;
  setShowTkinterNames: (show: boolean) => void;
  showAxes: boolean;
  setShowAxes: (show: boolean) => void;
  showCenterGuides: boolean;
  setShowCenterGuides: (show: boolean) => void;
  enableSnapping: boolean;
  setEnableSnapping: (show: boolean) => void;
  showCursorCoords: boolean;
  setShowCursorCoords: (show: boolean) => void;
  showRotationAngle: boolean;
  setShowRotationAngle: (show: boolean) => void;
  openAsWebApp: boolean;
  setOpenAsWebApp: (open: boolean) => void;
  showLineNumbers: boolean;
  setShowLineNumbers: (show: boolean) => void;
  generatorType: 'local' | 'gemini';
  setGeneratorType: (type: 'local' | 'gemini') => void;
  highlightCodeOnSelection: boolean;
  setHighlightCodeOnSelection: (show: boolean) => void;
  autoGenerateComments: boolean;
  showComments: boolean;
  generateTkinterTags: boolean;
  showSystemTags: boolean;
  setAutoGenerateComments: (show: boolean) => void;
  setShowComments: (show: boolean) => void;
  setGenerateTkinterTags: (show: boolean) => void;
  setShowSystemTags: (show: boolean) => void;
  outlineWithFill: boolean;
  setOutlineWithFill: (show: boolean) => void;
  maxRecentProjects: number;
  setMaxRecentProjects: (count: number) => void;
  initialTab?: 'canvas' | 'grid' | 'appearance' | 'code' | 'templates';
}

type Tab = 'canvas' | 'grid' | 'appearance' | 'code' | 'templates';

const TabButton: React.FC<{ tab: Tab; label: string; activeTab: Tab; onSelect: (tab: Tab) => void }> = ({ tab, label, activeTab, onSelect }) => (
    <button
        onClick={() => onSelect(tab)}
        className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === tab
                ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
        }`}
    >
        {label}
    </button>
);

const FlagIcon: React.FC<{ lang: string }> = ({ lang }) => {
    switch (lang) {
        case 'uk':
            return (
                <svg viewBox="0 0 24 16" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                    <rect width="24" height="8" fill="#0057B7"/>
                    <rect y="8" width="24" height="8" fill="#FFDD00"/>
                </svg>
            );
        case 'en':
            return (
                <svg viewBox="0 0 60 30" width="18" height="12" className="rounded-[1px] flex-shrink-0 bg-[#012169]" preserveAspectRatio="none">
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6"/>
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
                    <path d="M30,0 L30,30 M0,15 L60,15" stroke="#FFF" strokeWidth="10"/>
                    <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6"/>
                </svg>
            );
        case 'de':
            return (
                <svg viewBox="0 0 3 3" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                    <rect width="3" height="1" fill="#000000"/>
                    <rect y="1" width="3" height="1" fill="#DD0000"/>
                    <rect y="2" width="3" height="1" fill="#FFCE00"/>
                </svg>
            );
        case 'fr':
            return (
                <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                    <rect width="1" height="2" fill="#002395"/>
                    <rect x="1" width="1" height="2" fill="#FFFFFF"/>
                    <rect x="2" width="1" height="2" fill="#ED2939"/>
                </svg>
            );
        case 'it':
            return (
                <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                    <rect width="1" height="2" fill="#009246"/>
                    <rect x="1" width="1" height="2" fill="#F1F2F1"/>
                    <rect x="2" width="1" height="2" fill="#CE2B37"/>
                </svg>
            );
        case 'es':
        default:
            return (
                <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                    <rect width="3" height="2" fill="#AA151B"/>
                    <rect y="0.5" width="3" height="1" fill="#F1BF00"/>
                </svg>
            );
    }
};

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
        if (editingTemplateId && ((editingTemplateName) || "").trim()) {
            props.onRenameTemplate(editingTemplateId, ((editingTemplateName) || "").trim());
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

    const handleGeneratorChange = (type: 'local' | 'gemini') => {
        props.setGeneratorType(type);
    };

    const handleCanvasVarNameChange = (value: string) => {
        let cleanedValue = value.replace(/[^a-zA-Z0-9_]/g, '');
        if (/^[0-9]/.test(cleanedValue)) {
            cleanedValue = '_' + cleanedValue;
        }
        props.setCanvasVarName(cleanedValue);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4" onClick={props.onClose} aria-modal="true" role="dialog">
            <div className="bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-[var(--border-secondary)] flex items-center justify-between gap-4 flex-shrink-0">
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('settings.title')}</h2>
                    <button onClick={props.onClose} className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full transition-colors" aria-label={t('settings.close')}>
                        <XIcon size={18} />
                    </button>
                </header>
                
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-48 bg-[var(--bg-secondary)] border-r border-[var(--border-secondary)] flex flex-col p-2 space-y-1 overflow-y-auto">
                        <TabButton tab="canvas" label={t('settings.tab.canvas')} activeTab={activeTab} onSelect={setActiveTab} />
                        <TabButton tab="grid" label={t('settings.tab.grid')} activeTab={activeTab} onSelect={setActiveTab} />
                        <TabButton tab="appearance" label={t('settings.tab.appearance')} activeTab={activeTab} onSelect={setActiveTab} />
                        <TabButton tab="code" label={t('settings.tab.code')} activeTab={activeTab} onSelect={setActiveTab} />
                        <TabButton tab="templates" label={t('settings.tab.templates')} activeTab={activeTab} onSelect={setActiveTab} />
                    </div>

                    <div className="flex-grow p-6 space-y-4 overflow-y-auto" onClick={() => setIsLanguageOpen(false)}>
                        {activeTab === 'canvas' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)]">{t('settings.canvas.size')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputWrapper>
                                        <Label htmlFor="canvasWidth">{t('settings.canvas.width')}</Label>
                                        <NumberInput id="canvasWidth" value={props.canvasWidth} onChange={props.setCanvasWidth} min={100} max={5000} unit="px" presets={[640, 800, 1024, 1280, 1920]} />
                                    </InputWrapper>
                                    <InputWrapper>
                                        <Label htmlFor="canvasHeight">{t('settings.canvas.height')}</Label>
                                        <NumberInput id="canvasHeight" value={props.canvasHeight} onChange={props.setCanvasHeight} min={100} max={5000} unit="px" presets={[480, 600, 720, 1080]} />
                                    </InputWrapper>
                                </div>

                                <h3 className="text-lg font-semibold text-[var(--text-secondary)] pt-2">{t('settings.canvas.background')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputWrapper>
                                        <Label htmlFor="canvasBgColor">{t('settings.canvas.bgColor')}</Label>
                                        <ColorInput id="canvasBgColor" value={props.canvasBgColor} onChange={props.setCanvasBgColor} />
                                    </InputWrapper>
                                </div>

                                <h3 className="text-lg font-semibold text-[var(--text-secondary)] pt-2">{t('settings.canvas.codeDisplay')}</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="canvasVarName" title={t('settings.canvas.varName')}>
                                        <input id="canvasVarName" type="text" value={props.canvasVarName} onChange={e => handleCanvasVarNameChange(e.target.value)} className="w-full bg-[var(--bg-app)] border border-[var(--border-secondary)] text-[var(--text-primary)] text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-shadow" />
                                    </Label>
                                    <p className="text-xs text-[var(--text-tertiary)]">{t('settings.canvas.varNameDesc')}</p>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'grid' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)]">{t('settings.grid.settings')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputWrapper>
                                        <Label htmlFor="gridSize">{t('settings.grid.size')}</Label>
                                        <NumberInput id="gridSize" value={props.gridSize} onChange={props.setGridSize} min={5} max={100} unit="px" presets={[5, 10, 20, 25, 50]} />
                                    </InputWrapper>
                                    <InputWrapper>
                                        <Label htmlFor="gridSnapStep">{t('settings.grid.snapStep')}</Label>
                                        <NumberInput id="gridSnapStep" value={props.gridSnapStep} onChange={props.setGridSnapStep} min={1} max={50} unit="px" presets={[1, 2, 5, 10, 20]} />
                                    </InputWrapper>
                                </div>
                                <div className="flex items-start pt-2">
                                    <input id="enableSnappingGrid" type="checkbox" checked={props.enableSnapping} onChange={e => props.setEnableSnapping(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                    <label htmlFor="enableSnappingGrid" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                        {t('settings.appearance.enableSnapping')}
                                        <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.appearance.enableSnappingDesc')}</p>
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)]">{t('settings.appearance.interface')}</h3>
                                
                                <div className="space-y-3">
                                    <div className="flex items-start">
                                        <input id="showTkinterNames" type="checkbox" checked={props.showTkinterNames} onChange={e => props.setShowTkinterNames(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                        <label htmlFor="showTkinterNames" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            {t('settings.appearance.showTkinterNames')}
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.appearance.showTkinterNamesDesc')}</p>
                                        </label>
                                    </div>
                                    <div className="flex items-start pt-1">
                                        <input id="showAxes" type="checkbox" checked={props.showAxes} onChange={e => props.setShowAxes(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                        <label htmlFor="showAxes" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            {t('settings.appearance.showAxes')}
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.appearance.showAxesDesc')}</p>
                                        </label>
                                    </div>
                                    <div className="flex items-start pt-1">
                                        <input id="showCenterGuides" type="checkbox" checked={props.showCenterGuides} onChange={e => props.setShowCenterGuides(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                        <label htmlFor="showCenterGuides" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            {t('settings.appearance.showCenterGuides')}
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.appearance.showCenterGuidesDesc')}</p>
                                        </label>
                                    </div>
                                    <div className="flex items-start pt-1">
                                        <input id="enableSnapping" type="checkbox" checked={props.enableSnapping} onChange={e => props.setEnableSnapping(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                        <label htmlFor="enableSnapping" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            {t('settings.appearance.enableSnapping')}
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.appearance.enableSnappingDesc')}</p>
                                        </label>
                                    </div>
                                    <div className="flex items-start pt-1">
                                        <input id="showCursorCoords" type="checkbox" checked={props.showCursorCoords} onChange={e => props.setShowCursorCoords(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                        <label htmlFor="showCursorCoords" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            {t('settings.appearance.showCursorCoords')}
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.appearance.showCursorCoordsDesc')}</p>
                                        </label>
                                    </div>
                                    <div className="flex items-start pt-1">
                                        <input id="showRotationAngle" type="checkbox" checked={props.showRotationAngle} onChange={e => props.setShowRotationAngle(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                        <label htmlFor="showRotationAngle" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            {t('settings.appearance.showRotationAngle')}
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.appearance.showRotationAngleDesc')}</p>
                                        </label>
                                    </div>
                                    <div className="flex items-start pt-1">
                                        <input id="openAsWebApp" type="checkbox" checked={props.openAsWebApp} onChange={e => props.setOpenAsWebApp(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                        <label htmlFor="openAsWebApp" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            {t('settings.appearance.openAsWebApp')}
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.appearance.openAsWebAppDesc')}</p>
                                        </label>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-[var(--text-secondary)] pt-4 border-t border-[var(--border-secondary)]">{t('settings.appearance.homeScreen')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputWrapper>
                                        <Label htmlFor="maxRecentProjects">{t('settings.appearance.maxRecentProjects')}</Label>
                                        <NumberInput id="maxRecentProjects" value={props.maxRecentProjects} onChange={props.setMaxRecentProjects} min={0} max={120} step={1} showQuickPopup={false} />
                                    </InputWrapper>
                                </div>
                                <p className="text-xs text-[var(--text-tertiary)] -mt-2">{t('settings.appearance.maxRecentProjectsDesc')}</p>

                                <div className="pt-4 border-t border-[var(--border-secondary)]">
                                    <div className="flex flex-col space-y-2 relative">
                                        <label className="text-sm font-medium text-[var(--text-secondary)]">{t('settings.appearance.language')}</label>
                                        <div className="relative inline-block w-48">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setIsLanguageOpen(!isLanguageOpen); }}
                                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] flex items-center justify-between gap-2 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors shadow-sm"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <FlagIcon lang={language} />
                                                    {language === 'uk' ? 'Українська' : language === 'en' ? 'English' : language === 'de' ? 'Deutsch' : language === 'fr' ? 'Français' : language === 'it' ? 'Italiano' : 'Español'}
                                                </span>
                                                <span className="text-xs text-[var(--text-tertiary)]">▼</span>
                                            </button>
                                            {isLanguageOpen && (
                                                <div className="absolute left-0 mt-1 w-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md shadow-lg py-1 z-50">
                                                    <button onClick={() => { setLanguage('uk'); setIsLanguageOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2">
                                                        <FlagIcon lang="uk" /> Українська
                                                    </button>
                                                    <button onClick={() => { setLanguage('en'); setIsLanguageOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2">
                                                        <FlagIcon lang="en" /> English
                                                    </button>
                                                    <button onClick={() => { setLanguage('de'); setIsLanguageOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2">
                                                        <FlagIcon lang="de" /> Deutsch
                                                    </button>
                                                    <button onClick={() => { setLanguage('fr'); setIsLanguageOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2">
                                                        <FlagIcon lang="fr" /> Français
                                                    </button>
                                                    <button onClick={() => { setLanguage('it'); setIsLanguageOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2">
                                                        <FlagIcon lang="it" /> Italiano
                                                    </button>
                                                    <button onClick={() => { setLanguage('es'); setIsLanguageOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2">
                                                        <FlagIcon lang="es" /> Español
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'code' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)]">{t('settings.code.generatorMethod')}</h3>
                                <div className="space-y-2">
                                    <label className="flex items-start p-3 rounded-lg border-2 border-transparent has-[:checked]:border-[var(--accent-primary)] has-[:checked]:bg-[var(--accent-primary)]/10 transition-colors cursor-pointer">
                                        <input type="radio" name="generatorType" value="local" checked={props.generatorType === 'local'} onChange={() => handleGeneratorChange('local')} className="w-4 h-4 mt-1 text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
                                        <div className="ml-3">
                                            <span className="font-semibold text-sm text-[var(--text-primary)]">{t('settings.code.local')}</span>
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.code.localDesc')}</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-3 rounded-lg border-2 border-transparent has-[:checked]:border-[var(--accent-primary)] has-[:checked]:bg-[var(--accent-primary)]/10 transition-colors cursor-pointer">
                                        <input type="radio" name="generatorType" value="gemini" checked={props.generatorType === 'gemini'} onChange={() => handleGeneratorChange('gemini')} className="w-4 h-4 mt-1 text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
                                        <div className="ml-3">
                                            <span className="font-semibold text-sm text-[var(--text-primary)]">{t('settings.code.gemini')}</span>
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.code.geminiDesc')}</p>
                                        </div>
                                    </label>
                                </div>

                                {props.generatorType === 'gemini' && (
                                    <button onClick={props.onOpenApiKeyModal} className="w-full text-center px-4 py-2 rounded-md font-semibold bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
                                        {t('settings.code.manageKey')}
                                    </button>
                                )}

                                <hr className="border-[var(--border-secondary)] my-4" />
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)]">{t('settings.code.settings')}</h3>
                                
                                <div className="space-y-3">
                                    <div className="flex items-start">
                                        <input id="outlineWithFill" type="checkbox" checked={props.outlineWithFill} onChange={e => props.setOutlineWithFill(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                        <label htmlFor="outlineWithFill" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            {t('settings.code.outline')}
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.code.outlineDesc')}</p>
                                        </label>
                                    </div>
                                    <div className="flex items-start pt-1">
                                        <input id="autoGenerateComments" type="checkbox" checked={props.autoGenerateComments} onChange={e => props.setAutoGenerateComments(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                        <label htmlFor="autoGenerateComments" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            {t('settings.code.comments')}
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.code.commentsDesc')}</p>
                                        </label>
                                    </div>
                                    <div className="flex items-start pt-1">
                                        <input id="showComments" type="checkbox" checked={props.showComments} onChange={e => props.setShowComments(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                        <label htmlFor="showComments" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            {t('settings.code.showComments')}
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.code.showCommentsDesc')}</p>
                                        </label>
                                    </div>
                                    <div className="flex items-start pt-1">
                                        <input id="generateTkinterTags" type="checkbox" checked={props.generateTkinterTags} onChange={e => props.setGenerateTkinterTags(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                        <label htmlFor="generateTkinterTags" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            {t('settings.code.generateTags')}
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.code.generateTagsDesc')}</p>
                                        </label>
                                    </div>
                                    <div className="flex items-start pt-1">
                                        <input id="showSystemTags" type="checkbox" checked={props.showSystemTags} onChange={e => props.setShowSystemTags(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                        <label htmlFor="showSystemTags" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            Відображати системні теги
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">Додавати автоматичні ідентифікатори фігур і груп у теги.</p>
                                        </label>
                                    </div>
                                    <div className="flex items-start pt-1">
                                        <input id="showLineNumbers" type="checkbox" checked={props.showLineNumbers} onChange={e => props.setShowLineNumbers(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                        <label htmlFor="showLineNumbers" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            {t('settings.code.lineNumbers')}
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.code.lineNumbersDesc')}</p>
                                        </label>
                                    </div>
                                    <div className="flex items-start pt-1 has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed">
                                        <input id="highlightCodeOnSelection" type="checkbox" checked={props.highlightCodeOnSelection} onChange={e => props.setHighlightCodeOnSelection(e.target.checked)} disabled={props.generatorType === 'gemini'} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)] mt-0.5" />
                                        <label htmlFor="highlightCodeOnSelection" className="ml-3 text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                                            {t('settings.code.highlight')}
                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.code.highlightDesc')}</p>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'templates' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)]">{t('settings.templates.title')}</h3>
                                {props.templates.length > 0 ? (
                                    <div className="space-y-2">
                                        {props.templates.map(template => (
                                            <div key={template.id} className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded-md">
                                                {editingTemplateId === template.id ? (
                                                    <input
                                                        ref={inputRef}
                                                        type="text"
                                                        value={editingTemplateName}
                                                        onChange={e => setEditingTemplateName(e.target.value)}
                                                        onBlur={handleConfirmEditing}
                                                        onKeyDown={handleKeyDown}
                                                        className="bg-[var(--bg-app)] text-sm text-[var(--text-primary)] p-0.5 -m-0.5 rounded outline-none ring-2 ring-[var(--accent-primary)] w-full"
                                                    />
                                                ) : (
                                                    <span className="text-sm text-[var(--text-primary)] truncate" title={template.name}>{template.name}</span>
                                                )}
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleStartEditing(template)}
                                                        disabled={!!editingTemplateId}
                                                        className="text-xs px-2 py-1 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {t('settings.templates.rename')}
                                                    </button>
                                                    <button
                                                        onClick={() => props.onDeleteTemplate(template.id)}
                                                        disabled={!!editingTemplateId}
                                                        className="text-xs px-2 py-1 rounded-md bg-[var(--destructive-bg)] text-[var(--accent-text)] hover:bg-[var(--destructive-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {t('settings.templates.delete')}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-[var(--text-tertiary)]">{t('settings.templates.empty')}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <footer className="p-4 bg-[var(--bg-app)]/50 rounded-b-lg flex justify-end flex-shrink-0 border-t border-[var(--border-primary)]">
                    <button
                        onClick={props.onClose}
                        className="px-6 py-2 rounded-lg font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
                    >
                        {t('settings.close')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SettingsModal;
