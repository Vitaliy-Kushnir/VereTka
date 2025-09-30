import React, { useState, useEffect } from 'react';
import { XIcon } from './icons';
import { InputWrapper, Label, NumberInput, ColorInput, Select } from './FormControls';
import { type ProjectTemplate, type NewProjectSettings } from '../types';

interface NewProjectModalProps {
  onClose: () => void;
  onCreate: (settings: NewProjectSettings, templateId: string | null) => void;
  initialSettings: NewProjectSettings;
  templates: ProjectTemplate[];
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onCreate, initialSettings, templates }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | 'blank'>(templates.length > 0 ? 'blank' : 'blank');
    
    const [projectName, setProjectName] = useState('');
    const [width, setWidth] = useState(initialSettings.width);
    const [height, setHeight] = useState(initialSettings.height);
    const [bgColor, setBgColor] = useState(initialSettings.bgColor);
    const [canvasVarName, setCanvasVarName] = useState(initialSettings.canvasVarName);

    useEffect(() => {
        if (selectedTemplateId === 'blank') {
            setProjectName(initialSettings.projectName);
            setWidth(initialSettings.width);
            setHeight(initialSettings.height);
            setBgColor(initialSettings.bgColor);
            setCanvasVarName(initialSettings.canvasVarName);
        } else {
            const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
            if (selectedTemplate) {
                const { settings } = selectedTemplate;
                setProjectName(settings.projectName);
                setWidth(settings.width);
                setHeight(settings.height);
                setBgColor(settings.bgColor);
                setCanvasVarName(settings.canvasVarName);
            }
        }
    }, [selectedTemplateId, templates, initialSettings]);


    const handleCreate = () => {
        onCreate(
            { 
                projectName, 
                width, 
                height, 
                bgColor, 
                canvasVarName: canvasVarName.trim() || 'c' 
            },
            selectedTemplateId === 'blank' ? null : selectedTemplateId
        );
    };
    
    const handleCanvasNameChange = (value: string) => {
        // Remove invalid characters (allow only Latin letters, numbers, and underscore)
        let cleanedValue = value.replace(/[^a-zA-Z0-9_]/g, '');
        // Ensure it doesn't start with a number
        if (/^[0-9]/.test(cleanedValue)) {
            cleanedValue = '_' + cleanedValue;
        }
        setCanvasVarName(cleanedValue);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-md flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Новий проєкт</h2>
                    <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full">
                        <XIcon />
                    </button>
                </header>

                <div className="p-6 space-y-4">
                    {templates.length > 0 && (
                        <>
                             <InputWrapper>
                                <Label htmlFor="template-selection">Створити з:</Label>
                                <Select
                                    id="template-selection"
                                    value={selectedTemplateId}
                                    onChange={setSelectedTemplateId}
                                >
                                    <option value="blank">Чисте полотно</option>
                                    <optgroup label="Ваші шаблони">
                                        {templates.map(template => (
                                            <option key={template.id} value={template.id}>
                                                {template.name} ({template.settings.width}x{template.settings.height}, {template.shapes.length} об.)
                                            </option>
                                        ))}
                                    </optgroup>
                                </Select>
                            </InputWrapper>
                            <hr className="border-[var(--border-secondary)] my-2" />
                        </>
                    )}
                    <InputWrapper>
                        <Label htmlFor="projectName">Назва проєкту:</Label>
                        <input 
                            id="projectName"
                            type="text" 
                            value={projectName} 
                            onChange={e => setProjectName(e.target.value)}
                            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2 py-1 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                            autoFocus
                        />
                    </InputWrapper>
                    <h3 className="text-lg font-semibold text-[var(--text-tertiary)] pt-2">Налаштування полотна</h3>
                    <InputWrapper>
                        <Label htmlFor="canvasWidth">Ширина:</Label>
                        <NumberInput id="canvasWidth" value={width} onChange={setWidth} min={100} step={10} />
                    </InputWrapper>
                    <InputWrapper>
                        <Label htmlFor="canvasHeight">Висота:</Label>
                        <NumberInput id="canvasHeight" value={height} onChange={setHeight} min={100} step={10} />
                    </InputWrapper>
                    <InputWrapper>
                        <Label htmlFor="canvasVarName">Назва полотна:</Label>
                        <input 
                            id="canvasVarName"
                            type="text" 
                            value={canvasVarName} 
                            onChange={e => handleCanvasNameChange(e.target.value)}
                            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2 py-1 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                        />
                    </InputWrapper>
                    <div className="pl-28 -mt-3">
                        <p className="text-xs text-[var(--text-tertiary)]">(Лише латинські літери, цифри та "_". Не може починатись з цифри)</p>
                    </div>
                     <InputWrapper>
                        <Label htmlFor="canvasBgColor">Колір тла:</Label>
                        <ColorInput 
                            id="canvasBgColor" 
                            value={bgColor} 
                            onChange={setBgColor}
                            onPreview={() => {}}
                            onCancel={() => {}}
                        />
                    </InputWrapper>
                </div>

                <footer className="p-4 bg-[var(--bg-app)]/50 rounded-b-lg flex justify-end gap-3">
                     <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg font-semibold bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                        Скасувати
                    </button>
                     <button
                        onClick={handleCreate}
                        className="px-6 py-2 rounded-lg font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
                    >
                        Створити
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default NewProjectModal;