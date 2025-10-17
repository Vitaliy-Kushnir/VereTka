import React, { useState, useRef, useEffect } from 'react';
import { XIcon } from './icons';
import { InputWrapper, Label, NumberInput, ColorInput } from './FormControls';
import { type ProjectTemplate } from '../types';

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
  initialTab?: 'canvas' | 'grid' | 'appearance' | 'code' | 'templates';
}

type Tab = 'canvas' | 'grid' | 'appearance' | 'code' | 'templates';

const SettingsModal: React.FC<SettingsModalProps> = (props) => {
    const [activeTab, setActiveTab] = useState<Tab>(props.initialTab || 'canvas');
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [editingTemplateName, setEditingTemplateName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

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

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={props.onClose}
        >
            <div 
                className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-md flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Налаштування</h2>
                    <button onClick={props.onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full">
                        <XIcon />
                    </button>
                </header>
                
                <div className="p-4 border-b border-[var(--border-primary)]">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button 
                            onClick={() => setActiveTab('canvas')}
                            className={`px-4 py-2 rounded-md font-semibold transition ${activeTab === 'canvas' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                        >
                            Полотно
                        </button>
                        <button
                             onClick={() => setActiveTab('grid')}
                             className={`px-4 py-2 rounded-md font-semibold transition ${activeTab === 'grid' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                        >
                            Сітка
                        </button>
                         <button
                             onClick={() => setActiveTab('appearance')}
                             className={`px-4 py-2 rounded-md font-semibold transition ${activeTab === 'appearance' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                        >
                            Вигляд
                        </button>
                         <button
                             onClick={() => setActiveTab('code')}
                             className={`px-4 py-2 rounded-md font-semibold transition ${activeTab === 'code' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                        >
                            Код
                        </button>
                         <button
                             onClick={() => setActiveTab('templates')}
                             className={`px-4 py-2 rounded-md font-semibold transition ${activeTab === 'templates' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                        >
                            Шаблони
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {activeTab === 'canvas' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[var(--text-secondary)]">Розмір полотна</h3>
                            <InputWrapper>
                                <Label htmlFor="canvasWidth">Ширина:</Label>
                                <NumberInput id="canvasWidth" value={props.canvasWidth} onChange={props.setCanvasWidth} min={100} step={10} />
                            </InputWrapper>
                            <InputWrapper>
                                <Label htmlFor="canvasHeight">Висота:</Label>
                                <NumberInput id="canvasHeight" value={props.canvasHeight} onChange={props.setCanvasHeight} min={100} step={10} />
                            </InputWrapper>
                            
                             <h3 className="text-lg font-semibold text-[var(--text-secondary)] pt-2">Тло</h3>
                             <InputWrapper>
                                <Label htmlFor="canvasBgColor">Колір тла:</Label>
                                <ColorInput 
                                    id="canvasBgColor" 
                                    value={props.canvasBgColor} 
                                    onChange={props.setCanvasBgColor}
                                    onPreview={props.setPreviewCanvasBgColor}
                                    onCancel={() => props.setPreviewCanvasBgColor(null)}
                                />
                            </InputWrapper>
                            <h3 className="text-lg font-semibold text-[var(--text-secondary)] pt-2">Генерація коду</h3>
                            <InputWrapper>
                                <Label htmlFor="canvasVarName">Назва полотна:</Label>
                                <input id="canvasVarName" type="text" value={props.canvasVarName} onChange={e => handleCanvasNameChange(e.target.value)} onBlur={e => { if (e.target.value.trim() === '') { props.setCanvasVarName('c'); } }} className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2 py-1 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none" />
                            </InputWrapper>
                            <div className="pl-32 -mt-3"><p className="text-xs text-[var(--text-tertiary)]">(Лише латинські літери, цифри та "_". Не може починатись з цифри)</p></div>
                        </div>
                    )}
                     {activeTab === 'grid' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[var(--text-secondary)]">Налаштування сітки</h3>
                             <InputWrapper>
                                <Label htmlFor="gridSize">Крок сітки:</Label>
                                <NumberInput id="gridSize" value={props.gridSize} onChange={props.setGridSize} min={1} step={1} />
                            </InputWrapper>
                             <InputWrapper>
                                <Label htmlFor="gridSnapStep">Крок прив'язки:</Label>
                                <NumberInput id="gridSnapStep" value={props.gridSnapStep} onChange={props.setGridSnapStep} min={1} step={1} />
                            </InputWrapper>
                        </div>
                    )}
                    {activeTab === 'appearance' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[var(--text-secondary)]">Інтерфейс</h3>
                            <div className="flex items-start pt-2">
                                <input
                                    id="showTkinterNames"
                                    type="checkbox"
                                    checked={props.showTkinterNames}
                                    onChange={e => props.setShowTkinterNames(e.target.checked)}
                                    className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]"
                                />
                                <label htmlFor="showTkinterNames" className="ml-3 text-sm font-medium text-[var(--text-secondary)]">
                                    Показувати назви команд Tkinter
                                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Наприклад: "Прямокутник [rectangle]".</p>
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
                                    Показувати лінійки
                                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Відображає лінійки зліва та зверху від полотна.</p>
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
                                    Показувати координати біля курсора
                                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Динамічно відображає координати X/Y поруч з курсором.</p>
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
                                    Показувати кут при обертанні
                                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Динамічно відображає кут у підказці біля курсора.</p>
                                </label>
                            </div>
                        </div>
                    )}
                    {activeTab === 'code' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[var(--text-secondary)]">Метод генерації</h3>
                            <div className="space-y-2">
                                <label className="flex items-start p-3 rounded-lg border-2 border-transparent has-[:checked]:border-[var(--accent-primary)] has-[:checked]:bg-[var(--accent-primary)]/10 transition-colors cursor-pointer">
                                    <input type="radio" name="generatorType" value="local" checked={props.generatorType === 'local'} onChange={() => handleGeneratorChange('local')} className="w-4 h-4 mt-1 text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
                                    <div className="ml-3">
                                        <span className="font-semibold text-sm text-[var(--text-primary)]">Локальний генератор</span>
                                        <p className="text-xs text-[var(--text-tertiary)] mt-1">Швидко, працює офлайн. Рекомендовано.</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-3 rounded-lg border-2 border-transparent has-[:checked]:border-[var(--accent-primary)] has-[:checked]:bg-[var(--accent-primary)]/10 transition-colors cursor-pointer">
                                    <input type="radio" name="generatorType" value="gemini" checked={props.generatorType === 'gemini'} onChange={() => handleGeneratorChange('gemini')} className="w-4 h-4 mt-1 text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
                                    <div className="ml-3">
                                        <span className="font-semibold text-sm text-[var(--text-primary)]">Gemini API</span>
                                        <p className="text-xs text-[var(--text-tertiary)] mt-1">Вимагає ключ API та інтернет-з'єднання.</p>
                                    </div>
                                </label>
                            </div>

                            {props.generatorType === 'gemini' && (
                                <button onClick={() => { props.onOpenApiKeyModal(); props.onClose(); }} className="w-full text-center px-4 py-2 rounded-md font-semibold bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
                                    Керувати ключем API
                                </button>
                            )}

                            <hr className="border-[var(--border-secondary)] my-4" />
                            <h3 className="text-lg font-semibold text-[var(--text-secondary)]">Налаштування коду</h3>
                            <label htmlFor="outlineWithFill" className="flex items-start pt-2"><input id="outlineWithFill" type="checkbox" checked={props.outlineWithFill} onChange={e => props.setOutlineWithFill(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" /><div className="ml-3 text-sm font-medium text-[var(--text-secondary)]">Додавати `outline=""`<p className="text-xs text-[var(--text-tertiary)] mt-1">Для фігур із заливкою, але без контуру, щоб уникнути рамки в 1px.</p></div></label>
                            <label htmlFor="autoGenerateComments" className="flex items-start pt-2"><input id="autoGenerateComments" type="checkbox" checked={props.autoGenerateComments} onChange={e => props.setAutoGenerateComments(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" /><div className="ml-3 text-sm font-medium text-[var(--text-secondary)]">Автоматичні коментарі<p className="text-xs text-[var(--text-tertiary)] mt-1">Додає опис для кожної фігури у коді.</p></div></label>
                            <label htmlFor="showLineNumbers" className="flex items-start pt-2"><input id="showLineNumbers" type="checkbox" checked={props.showLineNumbers} onChange={e => props.setShowLineNumbers(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" /><div className="ml-3 text-sm font-medium text-[var(--text-secondary)]">Номери рядків<p className="text-xs text-[var(--text-tertiary)] mt-1">Показувати номери рядків у вікні коду.</p></div></label>
                            <label htmlFor="highlightCodeOnSelection" className="flex items-start pt-2 has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed"><input id="highlightCodeOnSelection" type="checkbox" checked={props.highlightCodeOnSelection} onChange={e => props.setHighlightCodeOnSelection(e.target.checked)} disabled={props.generatorType === 'gemini'} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" /><div className="ml-3 text-sm font-medium text-[var(--text-secondary)]">Підсвічувати код<p className="text-xs text-[var(--text-tertiary)] mt-1">Підсвічувати рядок коду, що відповідає вибраній фігурі.</p></div></label>
                        </div>
                    )}
                    {activeTab === 'templates' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[var(--text-secondary)]">Шаблони проєктів</h3>
                            {props.templates.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
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
                                                    Перейменувати
                                                </button>
                                                <button
                                                    onClick={() => props.onDeleteTemplate(template.id)}
                                                    disabled={!!editingTemplateId}
                                                    className="text-xs px-2 py-1 rounded-md bg-[var(--destructive-bg)] text-[var(--accent-text)] hover:bg-[var(--destructive-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Видалити
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--text-tertiary)]">Шаблони не збережено. Ви можете зберегти поточне полотно як шаблон через меню "Файл".</p>
                            )}
                        </div>
                    )}
                </div>

                <footer className="p-4 bg-[var(--bg-app)]/50 rounded-b-lg flex justify-end">
                     <button
                        onClick={props.onClose}
                        className="px-6 py-2 rounded-lg font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
                    >
                        Закрити
                    </button>
                </footer>
            </div>
        </div>
    );
}

export default SettingsModal;