
import React, { useState, useRef, useEffect } from 'react';
import { XIcon } from './icons';
import { InputWrapper, Label, NumberInput, ColorInput } from './FormControls';
import { type ProjectTemplate } from '../types';
import { useLanguage } from './LanguageContext';
import { translations } from '../lib/translations';

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
  showCursorCoords: boolean;
  setShowCursorCoords: (show: boolean) => void;
  showRotationAngle: boolean;
  setShowRotationAngle: (show: boolean) => void;
  showLineNumbers: boolean;
  setShowLineNumbers: (show: boolean) => void;
  generatorType: 'local' | 'gemini';
  setGeneratorType: (type: 'local' | 'gemini') => void;
  highlightCodeOnSelection: boolean;
  setHighlightCodeOnSelection: (show: boolean) => void;
  autoGenerateComments: boolean;
  setAutoGenerateComments: (show: boolean) => void;
  outlineWithFill: boolean;
  setOutlineWithFill: (show: boolean) => void;
  maxRecentProjects: number;
  setMaxRecentProjects: (count: number) => void;
  initialTab?: 'canvas' | 'grid' | 'appearance' | 'code' | 'templates';
}

type Tab = 'canvas' | 'grid' | 'appearance' | 'code' | 'templates';

const SettingsModal: React.FC<SettingsModalProps> = (props) => {
    const [activeTab, setActiveTab] = useState<Tab>(props.initialTab || 'canvas');
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [editingTemplateName, setEditingTemplateName] = useState('');
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { t, language, setLanguage } = useLanguage();

    useEffect(() => {
        if (editingTemplateId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingTemplateId]);

    const handleStartEditing = (template: ProjectTemplate) => {
        setEditingTemplateId(template.id);
        setEditingTemplateName(template.name);
    };

    const handleCancelEditing = () => {
        setEditingTemplateId(null);
        setEditingTemplateName('');
    };

    const handleConfirmEditing = () => {
        if (editingTemplateId && editingTemplateName.trim() !== '') {
            props.onRenameTemplate(editingTemplateId, editingTemplateName.trim());
        }
        handleCancelEditing();
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirmEditing();
        } else if (e.key === 'Escape') {
            handleCancelEditing();
        }
    };

    const handleCanvasNameChange = (value: string) => {
        // Remove invalid characters (allow only Latin letters, numbers, and underscore)
        let cleanedValue = value.replace(/[^a-zA-Z0-9_]/g, '');
        // Ensure it doesn't start with a number
        if (/^[0-9]/.test(cleanedValue)) {
            cleanedValue = '_' + cleanedValue;
        }
        props.setCanvasVarName(cleanedValue);
    };

    const handleGeneratorChange = (type: 'local' | 'gemini') => {
        props.setGeneratorType(type);
    };

    const TabButton: React.FC<{ tab: Tab; label: string }> = ({ tab, label }) => (
        <button 
            onClick={() => setActiveTab(tab)}
            className={`w-full text-left px-3 py-2 rounded-md font-semibold transition ${activeTab === tab ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
        >
            {label}
        </button>
    );

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={props.onClose}
        >
            <div 
                className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-2xl h-[600px] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] flex-shrink-0">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('settings.title')}</h2>
                    <button onClick={props.onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full">
                        <XIcon />
                    </button>
                </header>
                
                <div className="flex flex-grow min-h-0">
                    <nav className="w-48 flex-shrink-0 border-r border-[var(--border-primary)] p-4 space-y-2">
                        <TabButton tab="canvas" label={t('settings.tab.canvas')} />
                        <TabButton tab="grid" label={t('settings.tab.grid')} />
                        <TabButton tab="appearance" label={t('settings.tab.appearance')} />
                        <TabButton tab="code" label={t('settings.tab.code')} />
                        <TabButton tab="templates" label={t('settings.tab.templates')} />
                    </nav>

                    <div className="flex-grow p-6 space-y-4 overflow-y-auto" onClick={() => setIsLanguageOpen(false)}>
                        {activeTab === 'canvas' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)]">{t('settings.canvas.size')}</h3>
                                <InputWrapper>
                                    <Label htmlFor="canvasWidth">{t('settings.canvas.width')}</Label>
                                    <NumberInput id="canvasWidth" value={props.canvasWidth} onChange={props.setCanvasWidth} min={100} step={10} />
                                </InputWrapper>
                                <InputWrapper>
                                    <Label htmlFor="canvasHeight">{t('settings.canvas.height')}</Label>
                                    <NumberInput id="canvasHeight" value={props.canvasHeight} onChange={props.setCanvasHeight} min={100} step={10} />
                                </InputWrapper>
                                
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)] pt-2">{t('settings.canvas.background')}</h3>
                                <InputWrapper>
                                    <Label htmlFor="canvasBgColor">{t('settings.canvas.bgColor')}</Label>
                                    <ColorInput 
                                        id="canvasBgColor" 
                                        value={props.canvasBgColor} 
                                        onChange={props.setCanvasBgColor}
                                        onPreview={props.setPreviewCanvasBgColor}
                                        onCancel={() => props.setPreviewCanvasBgColor(null)}
                                    />
                                </InputWrapper>
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)] pt-2">{t('settings.canvas.codeDisplay')}</h3>
                                <InputWrapper>
                                    <Label htmlFor="canvasVarName">{t('settings.canvas.varName')}</Label>
                                    <input id="canvasVarName" type="text" value={props.canvasVarName} onChange={e => handleCanvasNameChange(e.target.value)} onBlur={e => { if (e.target.value.trim() === '') { props.setCanvasVarName('c'); } }} className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2 py-1 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none" />
                                </InputWrapper>
                                <div className="pl-32 -mt-3"><p className="text-xs text-[var(--text-tertiary)]">{t('settings.canvas.varNameDesc')}</p></div>
                            </div>
                        )}
                        {activeTab === 'grid' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)]">{t('settings.grid.settings')}</h3>
                                <InputWrapper>
                                    <Label htmlFor="gridSize">{t('settings.grid.size')}</Label>
                                    <NumberInput id="gridSize" value={props.gridSize} onChange={props.setGridSize} min={1} step={1} />
                                </InputWrapper>
                                <InputWrapper>
                                    <Label htmlFor="gridSnapStep">{t('settings.grid.snapStep')}</Label>
                                    <NumberInput id="gridSnapStep" value={props.gridSnapStep} onChange={props.setGridSnapStep} min={0.1} max={10} stepLogic="grid" />
                                </InputWrapper>
                            </div>
                        )}
                        {activeTab === 'appearance' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[var(--text-secondary)]">{t('settings.appearance.interface')}</h3>
                                <div className="flex items-center justify-between py-2 border-b border-[var(--border-secondary)] mb-2">
                                    <label className="text-sm font-medium text-[var(--text-secondary)]">{t('settings.appearance.language')}</label>
                                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                                            className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-md pl-3 pr-8 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors shadow-sm"
                                        >
                                            {language === 'uk' ? (
                                                <svg viewBox="0 0 24 16" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                    <rect width="24" height="8" fill="#0057B7"/>
                                                    <rect y="8" width="24" height="8" fill="#FFDD00"/>
                                                </svg>
                                            ) : language === 'es' ? (
                                                <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                    <rect width="3" height="2" fill="#AA151B"/>
                                                    <rect y="0.5" width="3" height="1" fill="#F1BF00"/>
                                                </svg>
                                            ) : language === 'it' ? (
                                                <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                    <rect width="1" height="2" fill="#009246"/>
                                                    <rect x="1" width="1" height="2" fill="#F1F2F1"/>
                                                    <rect x="2" width="1" height="2" fill="#CE2B37"/>
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 60 30" width="18" height="12" className="rounded-[1px] flex-shrink-0 bg-[#012169]" preserveAspectRatio="none">
                                                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6"/>
                                                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
                                                    <path d="M30,0 L30,30 M0,15 L60,15" stroke="#FFF" strokeWidth="10"/>
                                                    <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6"/>
                                                </svg>
                                            )}
                                            {language === 'uk' ? 'Українська' : language === 'it' ? 'Italiano' : language === 'es' ? 'Español' : 'English'}
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--text-secondary)]">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>
                                        {isLanguageOpen && (
                                            <div className="absolute right-0 mt-1 w-36 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md shadow-lg py-1 z-50">
                                                <button
                                                    onClick={() => { setLanguage('uk'); setIsLanguageOpen(false); }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                                >
                                                    <svg viewBox="0 0 24 16" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                        <rect width="24" height="8" fill="#0057B7"/>
                                                        <rect y="8" width="24" height="8" fill="#FFDD00"/>
                                                    </svg>
                                                    Українська
                                                </button>
                                                <button
                                                    onClick={() => { setLanguage('en'); setIsLanguageOpen(false); }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                                >
                                                    <svg viewBox="0 0 60 30" width="18" height="12" className="rounded-[1px] flex-shrink-0 bg-[#012169]" preserveAspectRatio="none">
                                                        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6"/>
                                                        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
                                                        <path d="M30,0 L30,30 M0,15 L60,15" stroke="#FFF" strokeWidth="10"/>
                                                        <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6"/>
                                                    </svg>
                                                    English
                                                </button>
                                                <button
                                                    onClick={() => { setLanguage('it'); setIsLanguageOpen(false); }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                                >
                                                    <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                        <rect width="1" height="2" fill="#009246"/>
                                                        <rect x="1" width="1" height="2" fill="#F1F2F1"/>
                                                        <rect x="2" width="1" height="2" fill="#CE2B37"/>
                                                    </svg>
                                                    Italiano
                                                </button>
                                                <button
                                                    onClick={() => { setLanguage('es'); setIsLanguageOpen(false); }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                                >
                                                    <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                        <rect width="3" height="2" fill="#AA151B"/>
                                                        <rect y="0.5" width="3" height="1" fill="#F1BF00"/>
                                                    </svg>
                                                    Español
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start pt-2">
                                    <input
                                        id="showTkinterNames"
                                        type="checkbox"
                                        checked={props.showTkinterNames}
                                        onChange={e => props.setShowTkinterNames(e.target.checked)}
                                        className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]"
                                    />
                                    <label htmlFor="showTkinterNames" className="ml-3 text-sm font-medium text-[var(--text-secondary)]">
                                        {t('settings.appearance.showTkinterNames')}
                                        <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.appearance.showTkinterNamesDesc')}</p>
                                    </label>
                                </div>
                                <div className="flex items-start pt-2">
                                    <input
                                        id="showAxes"
                                        type="checkbox"
                                        checked={props.showAxes}
                                        onChange={e => props.setShowAxes(e.target.checked)}
                                        className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]"
                                    />
                                    <label htmlFor="showAxes" className="ml-3 text-sm font-medium text-[var(--text-secondary)]">
                                        {t('settings.appearance.showAxes')}
                                        <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.appearance.showAxesDesc')}</p>
                                    </label>
                                </div>
                                <div className="flex items-start pt-2">
                                    <input
                                        id="showCursorCoords"
                                        type="checkbox"
                                        checked={props.showCursorCoords}
                                        onChange={e => props.setShowCursorCoords(e.target.checked)}
                                        className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]"
                                    />
                                    <label htmlFor="showCursorCoords" className="ml-3 text-sm font-medium text-[var(--text-secondary)]">
                                        {t('settings.appearance.showCursorCoords')}
                                        <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.appearance.showCursorCoordsDesc')}</p>
                                    </label>
                                </div>
                                <div className="flex items-start pt-2">
                                    <input
                                        id="showRotationAngle"
                                        type="checkbox"
                                        checked={props.showRotationAngle}
                                        onChange={e => props.setShowRotationAngle(e.target.checked)}
                                        className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]"
                                    />
                                    <label htmlFor="showRotationAngle" className="ml-3 text-sm font-medium text-[var(--text-secondary)]">
                                        {t('settings.appearance.showRotationAngle')}
                                        <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.appearance.showRotationAngleDesc')}</p>
                                    </label>
                                </div>

                                <h3 className="text-lg font-semibold text-[var(--text-secondary)] pt-4">{t('settings.appearance.homeScreen')}</h3>
                                <InputWrapper>
                                    <Label htmlFor="maxRecentProjects" title={t('settings.appearance.maxRecentProjectsDesc')}>{t('settings.appearance.maxRecentProjects')}</Label>
                                    <NumberInput id="maxRecentProjects" value={props.maxRecentProjects} onChange={props.setMaxRecentProjects} min={0} max={50} step={1} />
                                </InputWrapper>
                                <div className="pl-32 -mt-3"><p className="text-xs text-[var(--text-tertiary)]">{t('settings.appearance.maxRecentProjectsDesc')}</p></div>
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
                                <label htmlFor="outlineWithFill" className="flex items-start pt-2"><input id="outlineWithFill" type="checkbox" checked={props.outlineWithFill} onChange={e => props.setOutlineWithFill(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" /><div className="ml-3 text-sm font-medium text-[var(--text-secondary)]">{t('settings.code.outline')}<p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.code.outlineDesc')}</p></div></label>
                                <label htmlFor="autoGenerateComments" className="flex items-start pt-2"><input id="autoGenerateComments" type="checkbox" checked={props.autoGenerateComments} onChange={e => props.setAutoGenerateComments(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" /><div className="ml-3 text-sm font-medium text-[var(--text-secondary)]">{t('settings.code.comments')}<p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.code.commentsDesc')}</p></div></label>
                                <label htmlFor="showLineNumbers" className="flex items-start pt-2"><input id="showLineNumbers" type="checkbox" checked={props.showLineNumbers} onChange={e => props.setShowLineNumbers(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" /><div className="ml-3 text-sm font-medium text-[var(--text-secondary)]">{t('settings.code.lineNumbers')}<p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.code.lineNumbersDesc')}</p></div></label>
                                <label htmlFor="highlightCodeOnSelection" className="flex items-start pt-2 has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed"><input id="highlightCodeOnSelection" type="checkbox" checked={props.highlightCodeOnSelection} onChange={e => props.setHighlightCodeOnSelection(e.target.checked)} disabled={props.generatorType === 'gemini'} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" /><div className="ml-3 text-sm font-medium text-[var(--text-secondary)]">{t('settings.code.highlight')}<p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.code.highlightDesc')}</p></div></label>
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
}

export default SettingsModal;
