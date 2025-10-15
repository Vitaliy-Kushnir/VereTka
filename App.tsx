import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { type Shape, type Tool, type DrawMode, PolylineShape, BezierCurveShape, ViewTransform, RectangleShape, ImageShape, IsoscelesTriangleShape, TrapezoidShape, ParallelogramShape, PathShape, CanvasAction, LineShape, PolygonShape, ArcShape, RightTriangleShape, TextShape, BitmapShape, RotatableShape, EllipseShape, type ProjectTemplate, type NewProjectSettings, FillableShape } from './types';
import Canvas from './components/Canvas';
import CodeDisplay, { type CodeLine } from './components/CodeDisplay';
import PropertyEditor from './components/PropertyEditor';
import ShapeList from './components/ShapeList';
import { useHistoryState } from './hooks/useHistoryState';
import { generateTkinterCode } from './services/geminiService';
import { generateTkinterCodeLocally } from './services/localGeneratorService';
import SettingsModal from './components/SettingsModal';
import PreviewModal from './components/PreviewModal';
import ExportModal, { type ExportSettings } from './components/ExportModal';
import NewProjectModal from './components/NewProjectModal';
import ConfirmationModal from './components/ConfirmationModal';
import SaveAsModal from './components/SaveAsModal';
import AboutModal from './components/AboutModal';
import HelpModal from './components/HelpModal';
import ApiKeyModal from './components/ApiKeyModal';
import FeedbackModal from './components/FeedbackModal';
import { saveFile, generateSvg, exportToRaster, openProjectFile, saveToHandle } from './lib/exportUtils';
import { SquareIcon, CodeIcon, XIcon, AxesIcon, FitToScreenIcon, SelectIcon, EditPointsIcon, RectangleIcon, EllipseIcon, CircleIcon, LineIcon, PolylineIcon, BezierIcon, PolygonIcon, PencilIcon, TriangleIcon, RightTriangleIcon, RhombusIcon, TrapezoidIcon, ParallelogramIcon, PiesliceIcon, ChordIcon, ArcIcon, StarIcon, TextIcon, ImageIcon, BitmapIcon, UndoIcon, RedoIcon, DuplicateIcon, TrashIcon, GridIcon, SettingsIcon, DrawFromCornerIcon, DrawFromCenterIcon, CheckIcon, MenuIcon, SunIcon, MoonIcon, HomeIcon, BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, SadMonitorIcon, FullscreenIcon, ExitFullscreenIcon } from './components/icons';
import { getFinalPoints, getVisualBoundingBox, getBoundingBox, getEditablePoints, getShapeCenter } from './lib/geometry';
import { getDefaultNameForShape, isDefaultName } from './lib/constants';
import Ruler from './components/Ruler';
import { ColorInput, Select, NumberInput } from './components/FormControls';
import StatusBar from './components/StatusBar';
import WelcomeScreen from './components/WelcomeScreen';
import { useRecentProjects, type RecentProject } from './hooks/useRecentProjects';
import SaveCodeModal from './components/SaveCodeModal';
import InlineTextEditor from './components/InlineTextEditor';
import SaveTemplateModal from './components/SaveTemplateModal';

type Theme = 'dark' | 'light';
type GeneratorType = 'local' | 'gemini';
type SettingsTab = 'canvas' | 'grid' | 'appearance' | 'generator' | 'templates';

const APP_VERSION = '1.2.10';
const RULER_THICKNESS = 24;
const MIN_SCALE = 0.05;
const MAX_SCALE = 30;
const MIN_SCREEN_WIDTH = 1024; // Minimum width in pixels for the app to be usable

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

// Custom hook for dropdown menu logic
const useDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const close = useCallback(() => setIsOpen(false), []);
    useClickOutside(dropdownRef, close);
    const toggle = () => setIsOpen(prev => !prev);
    
    const wrapperProps = {
        ref: dropdownRef,
        onMouseLeave: close,
    };

    return { isOpen, toggle, close, wrapperProps };
};


const MenuBar: React.FC<{
    onGenerate: () => void;
    showGenerateButton: boolean;
    onNewProject: () => void;
    onSaveProject: () => void;
    canSave: boolean;
    onSaveProjectAs: () => void;
    onSaveAsTemplate: () => void;
    onLoadProject: () => void;
    onExport: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onDuplicate: () => void;
    isShapeSelected: boolean;
    onDelete: () => void;
    onConvertToPath: () => void;
    canConvertToPath: boolean;
    onFitCanvasToView: () => void;
    onToggleFullscreen: () => void;
    isFullscreen: boolean;
    showGrid: boolean;
    setShowGrid: (show: boolean) => void;
    snapToGrid: boolean;
    setSnapToGrid: (snap: boolean) => void;
    showAxes: boolean;
    setShowAxes: (show: boolean) => void;
    onOpenSettings: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    projectName: string;
    isProjectActive: boolean;
    onGoHome: () => void;
    onOpenAbout: () => void;
    onOpenHelp: () => void;
    onOpenFeedback: () => void;
}> = React.memo((props) => {
    const { isOpen: isFileOpen, toggle: toggleFile, close: closeFile, wrapperProps: fileProps } = useDropdown();
    const { isOpen: isEditOpen, toggle: toggleEdit, close: closeEdit, wrapperProps: editProps } = useDropdown();
    const { isOpen: isObjectOpen, toggle: toggleObject, close: closeObject, wrapperProps: objectProps } = useDropdown();
    const { isOpen: isViewOpen, toggle: toggleView, close: closeView, wrapperProps: viewProps } = useDropdown();
    const { isOpen: isHelpOpen, toggle: toggleHelp, close: closeHelp, wrapperProps: helpProps } = useDropdown();
    
    const handleMenuClick = (action: () => void, closeMenu: () => void) => {
        action();
        closeMenu();
    };

    const MenuItem: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean; shortcut?: string; selected?: boolean }> = ({ onClick, children, disabled, shortcut, selected }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex justify-between items-center w-full px-3 py-1.5 text-left text-sm ${selected ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)]'} disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent disabled:cursor-not-allowed`}
        >
            <span>{children}</span>
            {shortcut && <span className="text-xs text-[var(--text-tertiary)]">{shortcut}</span>}
        </button>
    );

    const MenuCheckbox: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode; }> = ({ checked, onChange, children }) => (
         <label className="flex items-center w-full px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)]">
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mr-3 h-4 w-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-secondary)]" />
            <span>{children}</span>
        </label>
    );
    
    return (
        <nav className="bg-[var(--bg-primary)] text-sm font-medium flex items-center px-2 select-none h-8 flex-shrink-0">
            <div className="flex items-center">
                 {props.isProjectActive && (
                    <>
                        <button 
                            onClick={props.onGoHome} 
                            title="На головну"
                            className="px-2 py-1 rounded-md hover:bg-[var(--bg-secondary)]"
                        >
                            <HomeIcon size={18}/>
                        </button>
                        <div className="w-px h-5 bg-[var(--border-secondary)] mx-1"></div>
                    </>
                )}
                {/* File Menu */}
                <div {...fileProps} className="relative">
                    <button onClick={toggleFile} className={`px-3 py-1 rounded-md ${isFileOpen ? 'bg-[var(--bg-secondary)]' : 'hover:bg-[var(--bg-secondary)]'}`}>Файл</button>
                    {isFileOpen && (
                        <div className="absolute top-full left-0 mt-0 w-56 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-50 border border-[var(--border-secondary)]">
                            <MenuItem onClick={() => handleMenuClick(props.onNewProject, closeFile)}>Новий проєкт...</MenuItem>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            <MenuItem onClick={() => handleMenuClick(props.onSaveProject, closeFile)} disabled={!props.canSave} shortcut="Ctrl+S">Зберегти</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onSaveProjectAs, closeFile)} disabled={!props.isProjectActive}>Зберегти як...</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onSaveAsTemplate, closeFile)} disabled={!props.isProjectActive}>Зберегти як шаблон...</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onLoadProject, closeFile)}>Завантажити проєкт...</MenuItem>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            <MenuItem onClick={() => handleMenuClick(props.onExport, closeFile)} disabled={!props.isProjectActive}>Експортувати як...</MenuItem>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            {props.showGenerateButton && <MenuItem onClick={() => handleMenuClick(props.onGenerate, closeFile)} disabled={!props.isProjectActive}>Згенерувати код...</MenuItem>}
                        </div>
                    )}
                </div>
                 {/* Edit Menu */}
                <div {...editProps} className="relative">
                    <button onClick={toggleEdit} disabled={!props.isProjectActive} className={`px-3 py-1 rounded-md ${isEditOpen ? 'bg-[var(--bg-secondary)]' : 'hover:bg-[var(--bg-secondary)]'} disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent`}>Редагувати</button>
                    {isEditOpen && props.isProjectActive && (
                        <div className="absolute top-full left-0 mt-0 w-56 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-50 border border-[var(--border-secondary)]">
                            <MenuItem onClick={() => handleMenuClick(props.onUndo, closeEdit)} disabled={!props.canUndo} shortcut="Ctrl+Z">Скасувати</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onRedo, closeEdit)} disabled={!props.canRedo} shortcut="Ctrl+Y">Повернути</MenuItem>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            <MenuItem onClick={() => handleMenuClick(props.onDuplicate, closeEdit)} disabled={!props.isShapeSelected} shortcut="Ctrl+D">Дублювати</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onDelete, closeEdit)} disabled={!props.isShapeSelected} shortcut="Del">Видалити</MenuItem>
                        </div>
                    )}
                </div>
                 {/* Object Menu */}
                <div {...objectProps} className="relative">
                    <button onClick={toggleObject} disabled={!props.isProjectActive} className={`px-3 py-1 rounded-md ${isObjectOpen ? 'bg-[var(--bg-secondary)]' : 'hover:bg-[var(--bg-secondary)]'} disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent`}>Об'єкт</button>
                    {isObjectOpen && props.isProjectActive && (
                        <div className="absolute top-full left-0 mt-0 w-56 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-50 border border-[var(--border-secondary)]">
                            <MenuItem onClick={() => handleMenuClick(props.onConvertToPath, closeObject)} disabled={!props.canConvertToPath}>Перетворити на контур</MenuItem>
                        </div>
                    )}
                </div>
                 {/* View Menu */}
                <div {...viewProps} className="relative">
                    <button onClick={toggleView} className={`px-3 py-1 rounded-md ${isViewOpen ? 'bg-[var(--bg-secondary)]' : 'hover:bg-[var(--bg-secondary)]'}`}>Вигляд</button>
                    {isViewOpen && (
                        <div className="absolute top-full left-0 mt-0 w-56 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-50 border border-[var(--border-secondary)]">
                            <MenuItem onClick={() => handleMenuClick(props.onFitCanvasToView, closeView)} disabled={!props.isProjectActive}>Показати все полотно</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onToggleFullscreen, closeView)} shortcut="F11">
                                {props.isFullscreen ? 'Вийти з повноекранного режиму' : 'Повноекранний режим'}
                            </MenuItem>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            <MenuCheckbox checked={props.showGrid} onChange={props.setShowGrid}>Сітка</MenuCheckbox>
                            <MenuCheckbox checked={props.snapToGrid} onChange={props.setSnapToGrid}>Прив'язка до сітки</MenuCheckbox>
                            <MenuCheckbox checked={props.showAxes} onChange={props.setShowAxes}>Лінійки</MenuCheckbox>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            <div className="px-3 py-1.5 text-xs text-[var(--text-tertiary)]">Тема</div>
                            <MenuItem onClick={() => {props.setTheme('dark'); closeView()}} selected={props.theme === 'dark'}>Темна</MenuItem>
                            <MenuItem onClick={() => {props.setTheme('light'); closeView()}} selected={props.theme === 'light'}>Світла</MenuItem>
                        </div>
                    )}
                </div>
                 {/* Help Menu */}
                <div {...helpProps} className="relative">
                    <button onClick={toggleHelp} className={`px-3 py-1 rounded-md ${isHelpOpen ? 'bg-[var(--bg-secondary)]' : 'hover:bg-[var(--bg-secondary)]'}`}>Довідка</button>
                    {isHelpOpen && (
                        <div className="absolute top-full left-0 mt-0 w-56 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-50 border border-[var(--border-secondary)]">
                            <MenuItem onClick={() => handleMenuClick(props.onOpenAbout, closeHelp)}>Про редактор</MenuItem>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            <MenuItem onClick={() => handleMenuClick(props.onOpenHelp, closeHelp)}>Довідка</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onOpenFeedback, closeHelp)}>Залишити відгук</MenuItem>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-grow flex justify-center items-center text-sm text-[var(--text-tertiary)] truncate px-4">
                <span className="truncate" title={props.projectName}>{props.isProjectActive ? props.projectName : ''}</span>
            </div>
            
            <div className="flex items-center gap-2">
                <button onClick={() => props.setTheme(props.theme === 'dark' ? 'light' : 'dark')} title="Змінити тему" className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
                    {props.theme === 'dark' ? <SunIcon size={18}/> : <MoonIcon size={18}/>}
                </button>
                <button onClick={props.onToggleFullscreen} title={props.isFullscreen ? 'Вийти з повноекранного режиму (F11)' : 'Повноекранний режим (F11)'} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
                    {props.isFullscreen ? <ExitFullscreenIcon size={18}/> : <FullscreenIcon size={18}/>}
                </button>
                <div className="relative">
                    <button onClick={props.onOpenSettings} className={`flex items-center gap-2 px-3 py-1 rounded-md hover:bg-[var(--bg-secondary)]`}>
                        <SettingsIcon size={16}/>
                        <span>Налаштування</span>
                    </button>
                </div>
            </div>
        </nav>
    );
});

const LeftToolbar: React.FC<{
    activeTool: Tool;
    setActiveTool: (tool: Tool) => void;
}> = React.memo(({ activeTool, setActiveTool }) => {
    const iconSize = 18;
    const tools: { name: Tool; label: string; icon: React.ReactNode; group: number; disabled?: boolean }[] = [
        // Group 1: Primitives
        { name: 'rectangle', label: 'Прямокутник', icon: <RectangleIcon size={iconSize} />, group: 1 },
        { name: 'square', label: 'Квадрат', icon: <SquareIcon size={iconSize} />, group: 1 },
        { name: 'ellipse', label: 'Еліпс', icon: <EllipseIcon size={iconSize} />, group: 1 },
        { name: 'circle', label: 'Коло', icon: <CircleIcon size={iconSize} />, group: 1 },
        { name: 'line', label: 'Лінія', icon: <LineIcon size={iconSize} />, group: 2 },
        { name: 'polyline', label: 'Ламана', icon: <PolylineIcon size={iconSize} />, group: 2 },
        { name: 'bezier', label: "Крива Без'є", icon: <BezierIcon size={iconSize} />, group: 2 },
        { name: 'arc', label: 'Дуга', icon: <ArcIcon size={iconSize} />, group: 2 },
        { name: 'pieslice', label: 'Сектор', icon: <PiesliceIcon size={iconSize} />, group: 2 },
        { name: 'chord', label: 'Сегмент', icon: <ChordIcon size={iconSize} />, group: 2 },
        // Group 3: Polygons
        { name: 'polygon', label: 'Багатокутник', icon: <PolygonIcon size={iconSize} />, group: 3 },
        { name: 'star', label: 'Зірка', icon: <StarIcon size={iconSize} />, group: 3 },
        { name: 'triangle', label: 'Трикутник', icon: <TriangleIcon size={iconSize} />, group: 3 },
        { name: 'right-triangle', label: 'Прямокутний трикутник', icon: <RightTriangleIcon size={iconSize} />, group: 3 },
        { name: 'rhombus', label: 'Ромб', icon: <RhombusIcon size={iconSize} />, group: 3 },
        { name: 'trapezoid', label: 'Трапеція', icon: <TrapezoidIcon size={iconSize} />, group: 3 },
        { name: 'parallelogram', label: 'Паралелограм', icon: <ParallelogramIcon size={iconSize} />, group: 3 },
        { name: 'text', label: 'Текст', icon: <TextIcon size={iconSize} />, group: 3 },
        // Group 4: Other
        { name: 'pencil', label: 'Олівець', icon: <PencilIcon size={iconSize} />, group: 4 },
        { name: 'image', label: 'Зображення', icon: <ImageIcon size={iconSize} />, group: 4, disabled: true },
        { name: 'bitmap', label: 'Bitmap', icon: <BitmapIcon size={iconSize} />, group: 4, disabled: true },
    ];

    return (
        <aside className="bg-[var(--bg-primary)] rounded-lg p-1 flex flex-col items-center">
            <div className="grid grid-cols-10 gap-0.5 w-full" role="group" aria-label="Інструменти">
                {tools.map((tool, index) => {
                    const prevToolGroup = index > 0 ? tools[index - 1].group : -1;
                    const needsSeparator = tool.group !== prevToolGroup && index > 0;
                    
                    return (
                        <React.Fragment key={tool.name}>
                            {needsSeparator && <div className="col-span-10 h-px bg-[var(--border-secondary)] my-0.5"></div>}
                            <button
                                onClick={() => setActiveTool(tool.name)}
                                aria-label={tool.label}
                                title={tool.label}
                                disabled={tool.disabled}
                                className={`p-1 rounded-md transition-colors duration-200 aspect-square flex items-center justify-center ${activeTool === tool.name ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--icon-hover-text)]'} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
                            >
                                {tool.icon}
                            </button>
                        </React.Fragment>
                    );
                })}
            </div>
        </aside>
    );
});

// --- Toolbar Controls ---
// Extracted to be stable components, preventing re-mounts and state loss.

const PropertyControl: React.FC<{label: string, htmlFor: string, children: React.ReactNode}> = ({label, htmlFor, children}) => (
    <div className="flex items-center gap-1">
        <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">{label}:</label>
        {children}
    </div>
);

type ToolControlsProps = {
  drawMode: DrawMode; setDrawMode: (m: DrawMode) => void;
  isFillEnabled: boolean; setIsFillEnabled: (e: boolean) => void;
  fillColor: string; setFillColor: (c: string) => void;
  setPreviewFillColor: (c: string | null) => void;
  isStrokeEnabled: boolean; setIsStrokeEnabled: (e: boolean) => void;
  strokeColor: string; setStrokeColor: (c: string) => void;
  setPreviewStrokeColor: (c: string | null) => void;
  strokeWidth: number; setStrokeWidth: (w: number) => void;
  numberOfSides: number; setNumberOfSides: (s: number) => void;
  activeTool: Tool;
  textColor: string; setTextColor: (c: string) => void;
  setPreviewTextColor: (c: string | null) => void;
  textFont: string; setTextFont: (f: string) => void;
  textFontSize: number; setTextFontSize: (s: number) => void;
};

const ToolControls: React.FC<ToolControlsProps> = ({
  drawMode, setDrawMode, isFillEnabled, setIsFillEnabled, fillColor, setFillColor, setPreviewFillColor, 
  isStrokeEnabled, setIsStrokeEnabled, strokeColor, setStrokeColor, setPreviewStrokeColor, 
  strokeWidth, setStrokeWidth, numberOfSides, setNumberOfSides, activeTool, 
  textColor, setTextColor, setPreviewTextColor, textFont, setTextFont, textFontSize, setTextFontSize
}) => {
  const handleCancelFillPreview = useCallback(() => setPreviewFillColor(null), [setPreviewFillColor]);
  const handleCancelStrokePreview = useCallback(() => setPreviewStrokeColor(null), [setPreviewStrokeColor]);
  const handleCancelTextPreview = useCallback(() => setPreviewTextColor(null), [setPreviewTextColor]);

  const showDrawMode = useMemo(() => ['rectangle', 'square', 'circle', 'ellipse', 'triangle', 'right-triangle', 'polygon', 'star', 'rhombus', 'trapezoid', 'parallelogram', 'arc', 'pieslice', 'chord'].includes(activeTool), [activeTool]);
  const showFill = useMemo(() => ['rectangle', 'square', 'circle', 'ellipse', 'triangle', 'right-triangle', 'rhombus', 'trapezoid', 'parallelogram', 'pieslice', 'chord', 'polygon', 'star', 'polyline', 'bezier'].includes(activeTool), [activeTool]);
  const showStroke = useMemo(() => !['select', 'edit-points', 'image', 'bitmap', 'text'].includes(activeTool), [activeTool]);
  const showSides = useMemo(() => ['polygon', 'star'].includes(activeTool), [activeTool]);
  const showTextControls = useMemo(() => activeTool === 'text', [activeTool]);

  const isFillForToolDisabled = useMemo(() => {
    // Corresponds to the logic in PropertyEditor: new polylines/beziers are open, and 'arc' tool creates an unfillable arc.
    // 'arc' is already excluded by showFill, so we only need to handle polyline and bezier.
    return ['polyline', 'bezier'].includes(activeTool);
  }, [activeTool]);

  const standardWebFonts = { "Sans-Serif": ["Arial", "Calibri", "Helvetica", "Segoe UI", "Tahoma", "Trebuchet MS", "Verdana"], "Serif": ["Times New Roman", "Georgia", "Garamond"], "Monospace": ["Courier New", "Consolas", "Lucida Console", "Monaco"], };
  const tkFonts = ["TkDefaultFont", "TkTextFont", "TkFixedFont", "TkMenuFont", "TkHeadingFont", "TkCaptionFont", "TkSmallCaptionFont", "TkIconFont", "TkTooltipFont"];

  return (
    <>
      {showDrawMode && (
        <div className="flex items-center gap-1 bg-[var(--bg-app)] p-1 rounded-lg">
          <button title="Малювати від кута" onClick={() => setDrawMode('corner')} className={`p-1.5 rounded ${drawMode === 'corner' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><DrawFromCornerIcon/></button>
          <button title="Малювати від центру" onClick={() => setDrawMode('center')} className={`p-1.5 rounded ${drawMode === 'center' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><DrawFromCenterIcon/></button>
        </div>
      )}
      {showFill && (
        <PropertyControl label="Заливка" htmlFor="fillColor">
          <input id="fillEnable" type="checkbox" checked={isFillEnabled && !isFillForToolDisabled} onChange={e => setIsFillEnabled(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" disabled={isFillForToolDisabled} />
          <ColorInput id="fillColor" value={fillColor} onChange={setFillColor} onPreview={setPreviewFillColor} onCancel={handleCancelFillPreview} disabled={!isFillEnabled || isFillForToolDisabled} />
        </PropertyControl>
      )}
      {showStroke && (
        <>
          <PropertyControl label="Контур" htmlFor="strokeColor">
            <input id="strokeEnable" type="checkbox" checked={isStrokeEnabled} onChange={e => setIsStrokeEnabled(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
            <ColorInput id="strokeColor" value={strokeColor} onChange={setStrokeColor} onPreview={setPreviewStrokeColor} onCancel={handleCancelStrokePreview} disabled={!isStrokeEnabled} />
          </PropertyControl>
          <PropertyControl label="Товщина" htmlFor="strokeWidth">
            <div className="w-16">
                <NumberInput id="strokeWidth" min={1} max={100} value={strokeWidth} onChange={setStrokeWidth} disabled={!isStrokeEnabled} />
            </div>
          </PropertyControl>
        </>
      )}
      {showSides && (
        <PropertyControl label="Сторони" htmlFor="sides">
          <div className="w-20">
            <NumberInput id="sides" min={3} max={50} value={numberOfSides} onChange={setNumberOfSides} />
          </div>
        </PropertyControl>
      )}
      {showTextControls && (
        <>
          <PropertyControl label="Колір" htmlFor="textColor">
            <ColorInput id="textColor" value={textColor} onChange={setTextColor} onPreview={setPreviewTextColor} onCancel={handleCancelTextPreview} />
          </PropertyControl>
          <PropertyControl label="Шрифт" htmlFor="textFont">
            <Select id="textFont" value={textFont} onChange={setTextFont} className="w-32 py-0.5">
              {Object.entries(standardWebFonts).map(([group, fonts]) => (
                <optgroup label={group} key={group}>{fonts.map(f => <option key={f} value={f}>{f}</option>)}</optgroup>
              ))}
              <optgroup label="Шрифти Tkinter">{tkFonts.map(f => <option key={f} value={f}>{f}</option>)}</optgroup>
            </Select>
          </PropertyControl>
          <PropertyControl label="Розмір" htmlFor="textFontSize">
            <div className="w-20">
                <NumberInput id="textFontSize" min={1} value={textFontSize} onChange={setTextFontSize} />
            </div>
          </PropertyControl>
        </>
      )}
    </>
  );
};

type ContextualControlsProps = {
  selectedShape: Shape;
  updateShape: (s: Shape) => void;
  setShapePreview: (shapeId: string, overrides: Partial<Shape>) => void;
  cancelShapePreview: () => void;
  fillColor: string;
  strokeColor: string;
};

const ContextualControls: React.FC<ContextualControlsProps> = ({ selectedShape, updateShape, setShapePreview, cancelShapePreview, fillColor, strokeColor }) => {
  const standardWebFonts = { "Sans-Serif": ["Arial", "Calibri", "Helvetica", "Segoe UI", "Tahoma", "Trebuchet MS", "Verdana"], "Serif": ["Times New Roman", "Georgia", "Garamond"], "Monospace": ["Courier New", "Consolas", "Lucida Console", "Monaco"], };
  const tkFonts = ["TkDefaultFont", "TkTextFont", "TkFixedFont", "TkMenuFont", "TkHeadingFont", "TkCaptionFont", "TkSmallCaptionFont", "TkIconFont", "TkTooltipFont"];

  const shape = selectedShape as TextShape;

  const handleUpdate = (propsToUpdate: Partial<Shape>) => {
      updateShape({ ...selectedShape, ...propsToUpdate } as Shape);
  }
  const handleFillToggle = (checked: boolean) => {
    // Fix: Add type guard to ensure selectedShape has fill properties before using them
    if ('fill' in selectedShape) {
      if (checked) {
        const colorToRestore = selectedShape._previousFill || fillColor;
        handleUpdate({ fill: colorToRestore });
    } else {
        handleUpdate({ fill: 'none', _previousFill: selectedShape.fill });
    }
    }
  };
  const handleStrokeToggle = (checked: boolean) => {
      if (checked) {
        const colorToRestore = selectedShape._previousStroke || strokeColor;
        handleUpdate({ stroke: colorToRestore });
    } else {
        handleUpdate({ stroke: 'none', _previousStroke: selectedShape.stroke });
    }
  };

  const hasFill = 'fill' in selectedShape && selectedShape.type !== 'text';
  const isFillDisabledForShape = useMemo(() => {
    if (!selectedShape) return true;
    if (selectedShape.type === 'arc' && selectedShape.style === 'arc') {
        return true;
    }
    if ((selectedShape.type === 'polyline' || selectedShape.type === 'bezier') && !selectedShape.isClosed) {
        return true;
    }
    return false;
  }, [selectedShape]);
  const hasStroke = 'stroke' in selectedShape && 'strokeWidth' in selectedShape && !['image', 'bitmap', 'text'].includes(selectedShape.type);
  const hasSides = selectedShape.type === 'polygon' || selectedShape.type === 'star';
  const isText = selectedShape.type === 'text';

  const round = (num: number) => Math.round(num * 100) / 100;

  return (
      <>
          {hasFill && (
              <PropertyControl label="Заливка" htmlFor={`${selectedShape.id}-ctx-fill`}>
                   <input type="checkbox" checked={selectedShape.fill !== 'none' && !isFillDisabledForShape} onChange={e => handleFillToggle(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" disabled={isFillDisabledForShape} />
                  <ColorInput id={`${selectedShape.id}-ctx-fill`} value={selectedShape.fill === 'none' ? '#000000' : selectedShape.fill} onChange={v => handleUpdate({ fill: v })} onPreview={v => setShapePreview(selectedShape.id, { fill: v })} onCancel={cancelShapePreview} disabled={selectedShape.fill === 'none' || isFillDisabledForShape} />
              </PropertyControl>
          )}
          {hasStroke && (
              <>
                  <PropertyControl label="Контур" htmlFor={`${selectedShape.id}-ctx-stroke`}>
                       <input type="checkbox" checked={selectedShape.stroke !== 'none'} onChange={e => handleStrokeToggle(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
                      <ColorInput id={`${selectedShape.id}-ctx-stroke`} value={selectedShape.stroke === 'none' ? '#ffffff' : selectedShape.stroke} onChange={v => handleUpdate({ stroke: v })} onPreview={v => setShapePreview(selectedShape.id, { stroke: v })} onCancel={cancelShapePreview} disabled={selectedShape.stroke === 'none'} />
                  </PropertyControl>
                  <PropertyControl label="Товщина" htmlFor={`${selectedShape.id}-ctx-strokeWidth`}>
                    <div className="w-16">
                      <NumberInput id={`${selectedShape.id}-ctx-strokeWidth`} min={0} value={selectedShape.strokeWidth} onChange={v => handleUpdate({ strokeWidth: v })} disabled={selectedShape.stroke === 'none'} />
                    </div>
                  </PropertyControl>
              </>
          )}
          {hasSides && (
               <PropertyControl label="Сторони" htmlFor={`${selectedShape.id}-ctx-sides`}>
                    <div className="w-20">
                        <NumberInput id={`${selectedShape.id}-ctx-sides`} min={3} max={50} value={(selectedShape as PolygonShape).sides} onChange={v => handleUpdate({ sides: v })} />
                    </div>
              </PropertyControl>
          )}
          {isText && (
              <>
                  <PropertyControl label="Колір" htmlFor={`${shape.id}-ctx-fill`}>
                      <ColorInput id={`${shape.id}-ctx-fill`} value={shape.fill} onChange={v => handleUpdate({ fill: v })} onPreview={v => setShapePreview(shape.id, { fill: v })} onCancel={cancelShapePreview} />
                  </PropertyControl>
                  <PropertyControl label="Шрифт" htmlFor={`${shape.id}-ctx-font`}>
                     <Select id={`${shape.id}-ctx-font`} value={shape.font} onChange={v => handleUpdate({ font: v })} className="w-32 py-0.5">
                          {Object.entries(standardWebFonts).map(([group, fonts]) => (<optgroup label={group} key={group}>{fonts.map(f => <option key={f} value={f}>{f}</option>)}</optgroup>))}
                          <optgroup label="Шрифти Tkinter">{tkFonts.map(f => <option key={f} value={f}>{f}</option>)}</optgroup>
                      </Select>
                  </PropertyControl>
                  <PropertyControl label="Розмір" htmlFor={`${shape.id}-ctx-fontSize`}>
                        <div className="w-20">
                            <NumberInput id={`${shape.id}-ctx-fontSize`} min={1} value={round(shape.fontSize)} onChange={v => handleUpdate({ fontSize: v })} />
                        </div>
                  </PropertyControl>
                  <div className="flex items-center gap-0.5 bg-[var(--bg-app)] p-0.5 rounded-md">
                      <button title="Виразний" onClick={() => handleUpdate({ weight: shape.weight === 'bold' ? 'normal' : 'bold' })} className={`p-1.5 rounded ${shape.weight === 'bold' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><BoldIcon size={16}/></button>
                      <button title="Курсив" onClick={() => handleUpdate({ slant: shape.slant === 'italic' ? 'roman' : 'italic' })} className={`p-1.5 rounded ${shape.slant === 'italic' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><ItalicIcon size={16}/></button>
                      <button title="Підкреслений" onClick={() => handleUpdate({ underline: !shape.underline })} className={`p-1.5 rounded ${shape.underline ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><UnderlineIcon size={16}/></button>
                      <button title="Закреслений" onClick={() => handleUpdate({ overstrike: !shape.overstrike })} className={`p-1.5 rounded ${shape.overstrike ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><StrikethroughIcon size={16}/></button>
                  </div>
                   <div className="flex items-center gap-0.5 bg-[var(--bg-app)] p-0.5 rounded-md">
                      <button title="Ліворуч" onClick={() => handleUpdate({ justify: 'left' })} className={`p-1.5 rounded ${shape.justify === 'left' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><AlignLeftIcon size={16}/></button>
                      <button title="Центр" onClick={() => handleUpdate({ justify: 'center' })} className={`p-1.5 rounded ${shape.justify === 'center' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><AlignCenterIcon size={16}/></button>
                      <button title="Праворуч" onClick={() => handleUpdate({ justify: 'right' })} className={`p-1.5 rounded ${shape.justify === 'right' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><AlignRightIcon size={16}/></button>
                  </div>
              </>
          )}
      </>
  );
}

const TopToolbar: React.FC<{
    drawMode: DrawMode; setDrawMode: (m: DrawMode) => void;
    isFillEnabled: boolean; setIsFillEnabled: (e: boolean) => void;
    fillColor: string; setFillColor: (c: string) => void;
    setPreviewFillColor: (c: string | null) => void;
    isStrokeEnabled: boolean; setIsStrokeEnabled: (e: boolean) => void;
    strokeColor: string; setStrokeColor: (c: string) => void;
    setPreviewStrokeColor: (c: string | null) => void;
    strokeWidth: number; setStrokeWidth: (w: number) => void;
    numberOfSides: number; setNumberOfSides: (s: number) => void;
    onGenerate: () => void; showGenerateButton: boolean;
    onClear: () => void; isGenerating: boolean; hasShapes: boolean;
    onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean;
    onDuplicate: () => void; isShapeSelected: boolean;
    activeTool: Tool; setActiveTool: (tool: Tool) => void;
    onOpenMobileLeft: () => void; onOpenMobileRight: () => void;
    selectedShape: Shape | null;
    updateShape: (s: Shape) => void;
    setShapePreview: (shapeId: string, overrides: Partial<Shape>) => void;
    cancelShapePreview: () => void;
    textColor: string; setTextColor: (c: string) => void;
    setPreviewTextColor: (c: string | null) => void;
    textFont: string; setTextFont: (f: string) => void;
    textFontSize: number; setTextFontSize: (s: number) => void;
}> = React.memo((props) => {
    const { 
        isGenerating, hasShapes, onUndo, onRedo, canUndo, canRedo, onDuplicate, isShapeSelected, onOpenMobileLeft, onOpenMobileRight,
        selectedShape, activeTool, setActiveTool, onGenerate, showGenerateButton, onClear
    } = props;
    
    return (
    <div className="bg-[var(--bg-primary)] p-2 flex-shrink-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 select-none">
        {/* Left side actions */}
        <div className="flex items-center gap-1">
            <button title="Скасувати (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent"><UndoIcon/></button>
            <button title="Повернути (Ctrl+Y)" onClick={onRedo} disabled={!canRedo} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent"><RedoIcon/></button>
            <div className="w-px h-6 bg-[var(--border-secondary)] mx-1"></div>
            <button title="Вибрати (V)" onClick={() => setActiveTool('select')} className={`p-2 rounded-md ${activeTool === 'select' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}><SelectIcon /></button>
            <button title="Редагувати вузли (A)" onClick={() => setActiveTool('edit-points')} className={`p-2 rounded-md ${activeTool === 'edit-points' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}><EditPointsIcon /></button>
            <button title="Дублювати (Ctrl+D)" onClick={onDuplicate} disabled={!isShapeSelected} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent"><DuplicateIcon /></button>
            <div className="w-px h-6 bg-[var(--border-secondary)] mx-1"></div>
            {/* Mobile Toggles */}
            <div className="md:hidden flex items-center gap-2">
                <button onClick={onOpenMobileLeft} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><MenuIcon/></button>
            </div>
        </div>

        {/* Center properties */}
        <div className="flex items-center gap-x-2 gap-y-2 flex-wrap">
            {selectedShape ? <ContextualControls {...props} /> : <ToolControls {...props} />}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
             {/* Mobile Toggles */}
             <div className="md:hidden flex items-center gap-2">
                <button onClick={onOpenMobileRight} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><CodeIcon/></button>
            </div>
            <div className="w-px h-6 bg-[var(--border-secondary)] mx-1 md:hidden"></div>
            <button onClick={onClear} disabled={!hasShapes} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md font-semibold transition-colors duration-200 bg-[var(--destructive-bg)] text-[var(--accent-text)] hover:bg-[var(--destructive-bg-hover)] disabled:bg-[var(--bg-disabled)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed"><TrashIcon size={16}/><span>Очистити</span></button>
            {showGenerateButton && (
                <button onClick={onGenerate} disabled={isGenerating || !hasShapes} className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-md font-semibold transition-colors duration-200 bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] disabled:bg-[var(--bg-disabled)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed">
                    <CodeIcon/>
                    <span>{isGenerating ? 'Генерація...' : 'Згенерувати код'}</span>
                </button>
            )}
        </div>
    </div>
    );
});

export default function App(): React.ReactNode {
  const { state: shapes, setState: setShapes, undo, redo, canUndo, canRedo, reset: resetHistory } = useHistoryState<Shape[]>([]);
  
  const [projectName, setProjectName] = useState<string>('Новий малюнок. ВереTkа');
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [inlineEditingShapeId, setInlineEditingShapeId] = useState<string | null>(null);

  const [isDrawingPolyline, setIsDrawingPolyline] = useState<boolean>(false);
  const [polylinePoints, setPolylinePoints] = useState<{ x: number, y: number }[]>([]);
  const [isDrawingBezier, setIsDrawingBezier] = useState<boolean>(false);
  const [bezierPoints, setBezierPoints] = useState<{ x: number, y: number }[]>([]);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  const [drawMode, setDrawMode] = useState<DrawMode>('corner');
  const [isFillEnabled, setIsFillEnabled] = useState<boolean>(true);
  const [isStrokeEnabled, setIsStrokeEnabled] = useState<boolean>(true);
  const [fillColor, setFillColor] = useState<string>('#4f46e5');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(1);
  const [numberOfSides, setNumberOfSides] = useState<number>(5);
  const [textColor, setTextColor] = useState<string>('#000000');
  const [previewTextColor, setPreviewTextColor] = useState<string | null>(null);
  const [textFont, setTextFont] = useState<string>('Arial');
  const [textFontSize, setTextFontSize] = useState<number>(24);

  const [generatedCodeLines, setGeneratedCodeLines] = useState<CodeLine[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' } | null>(null);
  const [shapesAtGenerationTime, setShapesAtGenerationTime] = useState<Shape[] | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('canvas');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState<boolean>(false);
  const [isSaveCodeModalOpen, setIsSaveCodeModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  const [canvasWidth, setCanvasWidth] = useState<number>(800);
  const [canvasHeight, setCanvasHeight] = useState<number>(600);
  const [canvasBgColor, setCanvasBgColor] = useState<string>('#ffffff');
  const [canvasVarName, setCanvasVarName] = useState<string>('c');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(10);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSnapStep, setGridSnapStep] = useState<number>(1);
  const [showTkinterNames, setShowTkinterNames] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true); 
  const [showCursorCoords, setShowCursorCoords] = useState<boolean>(true);
  const [showRotationAngle, setShowRotationAngle] = useState<boolean>(true);
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [showComments, setShowComments] = useState<boolean>(true);
  const [generatorType, setGeneratorType] = useState<GeneratorType>('local');
  const [highlightCodeOnSelection, setHighlightCodeOnSelection] = useState<boolean>(true);
  const [autoGenerateComments, setAutoGenerateComments] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);

  // State for temporary visual overrides (e.g., color picking preview)
  const [previewOverrides, setPreviewOverrides] = useState<Record<string, Partial<Shape>>>({});
  const [previewFillColor, setPreviewFillColor] = useState<string | null>(null);
  const [previewStrokeColor, setPreviewStrokeColor] = useState<string | null>(null);
  const [previewCanvasBgColor, setPreviewCanvasBgColor] = useState<string | null>(null);

  const [viewTransform, setViewTransform] = useState<ViewTransform>({ scale: 1, x: 50, y: 50 });
  const [cursorPos, setCursorPos] = useState<{x:number, y:number} | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(false);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);

  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectLoadInputRef = useRef<HTMLInputElement>(null);
  
  const [theme, setTheme] = useState<Theme>('dark');
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);

  const [confirmationAction, setConfirmationAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'primary' | 'destructive';
  } | null>(null);
  const [isProjectActive, setIsProjectActive] = useState(false);
  const { projects: recentProjects, addRecentProject, openRecentProject, removeRecentProject, clearAllProjects } = useRecentProjects();
  
  const [isScreenTooSmall, setIsScreenTooSmall] = useState(false);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const escapeHoldTimer = useRef<number | null>(null);
  const ESCAPE_HOLD_DURATION = 2000; // 2 seconds
  const [projectWasEverActive, setProjectWasEverActive] = useState(false);

  const codeStringForExport = useMemo(() => {
    const lines = showComments 
      ? generatedCodeLines 
      : generatedCodeLines.filter(line => !line.content.trim().startsWith('#'));
    
    return lines.map(line => line.content).join('\n');
  }, [generatedCodeLines, showComments]);


  useEffect(() => {
    try {
        const savedTemplatesJSON = localStorage.getItem('veretka-project-templates');
        if (savedTemplatesJSON) {
            const savedTemplates = JSON.parse(savedTemplatesJSON);
            if (Array.isArray(savedTemplates)) {
                setProjectTemplates(savedTemplates);
            }
        }
    } catch (e) {
        console.error("Failed to load project templates from localStorage", e);
    }
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsScreenTooSmall(window.innerWidth < MIN_SCREEN_WIDTH);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  useEffect(() => {
    document.body.className = `${theme}-theme bg-[var(--bg-app)] text-[var(--text-primary)] font-sans`;
  }, [theme]);
  
    // Automatically disable code highlighting when switching to Gemini
    useEffect(() => {
        if (generatorType === 'gemini') {
            setHighlightCodeOnSelection(false);
        }
    }, [generatorType]);

    const generateProjectThumbnail = useCallback((shapesToRender: Shape[], width: number, height: number, bgColor: string): string => {
        const svgString = generateSvg(shapesToRender, width, height, bgColor);
        return `data:image/svg+xml;base64,${btoa(svgString)}`;
    }, []);
    
  const getProjectSignature = useCallback((pName: string, s: Shape[]) => {
    return JSON.stringify({
        projectName: pName,
        shapes: s,
        canvasSettings: { width: canvasWidth, height: canvasHeight, bgColor: canvasBgColor, varName: canvasVarName },
        uiSettings: { theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCursorCoords, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments }
    });
  }, [canvasWidth, canvasHeight, canvasBgColor, canvasVarName, theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCursorCoords, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments]);

  const lastSavedSignatureRef = useRef('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!isProjectActive) return;
    const currentSignature = getProjectSignature(projectName, shapes);
    if (lastSavedSignatureRef.current === '') {
        lastSavedSignatureRef.current = currentSignature;
    }
    setHasUnsavedChanges(currentSignature !== lastSavedSignatureRef.current);
  }, [projectName, shapes, getProjectSignature, isProjectActive]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                event.preventDefault();
                event.returnValue = ''; // Required for Chrome
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);


  const displayedShapes = useMemo(() => {
    if (Object.keys(previewOverrides).length === 0) {
        return shapes;
    }
    return shapes.map(s => {
        const override = previewOverrides[s.id];
        return override ? { ...s, ...override } as Shape : s;
    });
  }, [shapes, previewOverrides]);

  const cancelShapePreview = useCallback(() => {
      setPreviewOverrides({});
  }, []);

  useEffect(() => {
      cancelShapePreview();
  }, [selectedShapeId, cancelShapePreview]);


    const fitCanvasToView = useCallback(() => {
        if (viewportSize.width === 0 || viewportSize.height === 0) return;
        const padding = 10;
        const rulerOffset = showAxes ? RULER_THICKNESS : 0;
        const canvasContainerWidth = viewportSize.width - rulerOffset;
        const canvasContainerHeight = viewportSize.height - rulerOffset;
        if (canvasContainerWidth <= 0 || canvasContainerHeight <= 0) return;
        const availableWidth = canvasContainerWidth - padding * 2;
        const availableHeight = canvasContainerHeight - padding * 2;
        const scaleX = availableWidth / canvasWidth;
        const scaleY = availableHeight / canvasHeight;
        const newScale = Math.min(scaleX, scaleY, MAX_SCALE);
        const scaledCanvasWidth = canvasWidth * newScale;
        const scaledCanvasHeight = canvasHeight * newScale;
        const newX = (canvasContainerWidth - scaledCanvasWidth) / 2;
        const newY = (canvasContainerHeight - scaledCanvasHeight) / 2;
        setViewTransform({ scale: newScale, x: newX, y: newY });
    }, [canvasWidth, canvasHeight, viewportSize, showAxes]);

    const initialFitDone = useRef(false);

    useEffect(() => {
        if (!initialFitDone.current && viewportSize.width > 0 && viewportSize.height > 0) {
            fitCanvasToView();
            initialFitDone.current = true;
        }
    }, [viewportSize, fitCanvasToView]);


  useEffect(() => {
    const viewportElement = viewportRef.current;
    if (!viewportElement || !isProjectActive) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setViewportSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(viewportElement);
    return () => resizeObserver.disconnect();
  }, [isProjectActive]);


  const showNotification = (message: string, type: 'info' | 'error' = 'info', duration: number = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  const addShape = useCallback((shape: Shape) => {
    setShapes(prevShapes => [...prevShapes, shape]);
    if (shape.type !== 'polyline' && shape.type !== 'bezier') {
        setSelectedShapeId(shape.id);
        setActiveTool('select');
    }
  }, [setShapes]);

  const updateShape = useCallback((updatedShape: Shape) => {
    cancelShapePreview();
    setShapes(prevShapes =>
      prevShapes.map(shape => (shape.id === updatedShape.id ? updatedShape : shape))
    );
    if (updatedShape.id === selectedShapeId && updatedShape.state !== 'normal') {
        setSelectedShapeId(null);
        setActivePointIndex(null);
    }
  }, [setShapes, selectedShapeId, cancelShapePreview]);
  
  const setShapePreview = useCallback((shapeId: string, overrides: Partial<Shape>) => {
    setPreviewOverrides({ [shapeId]: overrides });
  }, []);

  const deleteShape = useCallback((id: string) => {
    setShapes(prevShapes => prevShapes.filter(shape => shape.id !== id));
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
      setActivePointIndex(null);
    }
  }, [selectedShapeId, setShapes]);

  const deletePoint = useCallback((shapeId: string, pointIndex: number) => {
      setShapes(prevShapes => prevShapes.map(shape => {
          if (shape.id === shapeId && ('points' in shape) && shape.points.length > 2) {
              const newPoints = [...shape.points];
              newPoints.splice(pointIndex, 1);
              switch (shape.type) {
                  case 'pencil':
                  case 'polyline':
                  case 'bezier':
                      return { ...shape, points: newPoints };
                  default:
                      return shape;
              }
          }
          return shape;
      }));
      setActivePointIndex(null);
  }, [setShapes]);

    const addPoint = useCallback((shapeId: string, pointIndex: number) => {
        const convertToPolyIfNeeded = (shape: Shape): PolylineShape | null => {
            if (['polyline', 'bezier', 'line', 'pencil'].includes(shape.type)) {
                return shape as PolylineShape;
            }
            const points = getEditablePoints(shape);
            if (!points) return null;
            const isClosed = shape.type === 'arc' ? shape.style !== 'arc' : true;
            const newPolyline: PolylineShape = {
                id: shape.id, name: undefined, type: 'polyline', points, isClosed,
                rotation: 'rotation' in shape ? shape.rotation : 0, state: shape.state, stroke: shape.stroke, strokeWidth: shape.strokeWidth,
                fill: 'fill' in shape && typeof shape.fill === 'string' && isClosed ? shape.fill : 'none',
                joinstyle: 'joinstyle' in shape && shape.joinstyle ? shape.joinstyle : undefined,
            };
            newPolyline.name = getDefaultNameForShape(newPolyline);
            return newPolyline;
        };
        setShapes(prevShapes => {
            const shapeIndex = prevShapes.findIndex(s => s.id === shapeId);
            if (shapeIndex === -1) return prevShapes;
            let shape = prevShapes[shapeIndex];
            let polyShape = convertToPolyIfNeeded(shape);
            if (!polyShape) return prevShapes;
            const points = [...polyShape.points];
            const p1 = points[pointIndex - 1];
            const p2 = polyShape.isClosed ? points[pointIndex % points.length] : points[pointIndex];
            if (!p1 || !p2) return prevShapes;
            const newPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            points.splice(pointIndex, 0, newPoint);
            polyShape.points = points;
            const newShapes = [...prevShapes];
            newShapes[shapeIndex] = polyShape;
            return newShapes;
        });
        setActivePointIndex(pointIndex);
    }, [setShapes]);

  const duplicateShape = useCallback((id: string) => {
    const shapeToDuplicate = shapes.find(s => s.id === id);
    if (!shapeToDuplicate) return;
    let newShape: Shape;
    switch (shapeToDuplicate.type) {
        case 'line':
            newShape = {...shapeToDuplicate, points: [{...shapeToDuplicate.points[0]}, {...shapeToDuplicate.points[1]}]};
            break;
        case 'pencil':
        case 'polyline':
        case 'bezier':
            newShape = {...shapeToDuplicate, points: shapeToDuplicate.points.map(p => ({...p}))};
            break;
        default:
            newShape = {...shapeToDuplicate};
    }

    newShape.id = new Date().toISOString();
    const offset = 10;
    
    switch (newShape.type) {
        case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap': newShape.x += offset; newShape.y += offset; break;
        case 'ellipse': case 'polygon': case 'star': newShape.cx += offset; newShape.cy += offset; break;
        case 'line':
            newShape.points[0].x += offset; newShape.points[0].y += offset;
            newShape.points[1].x += offset; newShape.points[1].y += offset;
            break;
        case 'pencil': case 'polyline': case 'bezier': 
            newShape.points = newShape.points.map((p: {x: number, y: number}) => ({ x: p.x + offset, y: p.y + offset })); 
            break;
    }

    setShapes(prevShapes => [...prevShapes, newShape]);
    setSelectedShapeId(newShape.id);
    showNotification('Фігуру дубльовано.');
  }, [shapes, setShapes]);
  
  const moveShape = useCallback((id: string, direction: 'up' | 'down') => {
    setShapes(prevShapes => {
        const index = prevShapes.findIndex(s => s.id === id);
        if (index === -1) return prevShapes;
        const newShapes = [...prevShapes];
        const targetIndex = direction === 'up' ? index + 1 : index - 1;
        if (targetIndex < 0 || targetIndex >= newShapes.length) return prevShapes;
        [newShapes[index], newShapes[targetIndex]] = [newShapes[targetIndex], newShapes[index]];
        return newShapes;
    });
  }, [setShapes]);

  const reorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom') => {
    setShapes(prevShapes => {
        const draggedIndex = prevShapes.findIndex(s => s.id === draggedId);
        const targetIndex = prevShapes.findIndex(s => s.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
            return prevShapes;
        }

        const newShapes = [...prevShapes];
        const [draggedItem] = newShapes.splice(draggedIndex, 1);
        
        const newTargetIndex = newShapes.findIndex(s => s.id === targetId);

        const insertionIndex = position === 'top' ? newTargetIndex + 1 : newTargetIndex;
        
        newShapes.splice(insertionIndex, 0, draggedItem);

        return newShapes;
    });
  }, [setShapes]);

  const convertToPath = useCallback((shapeId: string) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    if (['polyline', 'bezier', 'pencil', 'line', 'text', 'image', 'bitmap'].includes(shape.type)) return;
    const finalPoints = getFinalPoints(shape);
    if (!finalPoints) return;
    const isClosed = shape.type !== 'arc' || shape.style !== 'arc';
    const newPolyline: PolylineShape = {
        id: shape.id, name: undefined, type: 'polyline', points: finalPoints, isClosed, rotation: 0, state: shape.state, stroke: shape.stroke, strokeWidth: shape.strokeWidth, fill: 'fill' in shape && typeof shape.fill === 'string' && isClosed ? shape.fill : 'none',
        joinstyle: 'joinstyle' in shape && shape.joinstyle ? shape.joinstyle : undefined, dash: 'dash' in shape ? shape.dash : undefined, dashoffset: 'dashoffset' in shape ? shape.dashoffset : undefined,
        smooth: 'smooth' in shape ? shape.smooth : undefined, stipple: 'stipple' in shape ? shape.stipple : undefined, capstyle: undefined, arrow: undefined, arrowshape: undefined, activeStroke: undefined,
        isAspectRatioLocked: 'isAspectRatioLocked' in shape ? shape.isAspectRatioLocked : false,
    };

    const oldName = shape.name;
    const isOldNameDefault = !oldName || isDefaultName(oldName);
    newPolyline.name = isOldNameDefault ? getDefaultNameForShape(newPolyline) : oldName;
    
    updateShape(newPolyline);
    setActiveTool('edit-points');
    showNotification('Фігуру перетворено на контур.');
  }, [shapes, updateShape]);


  const handleSelectShape = useCallback((id: string | null) => {
    setSelectedShapeId(id);
    setIsDrawingPolyline(false);
    setPolylinePoints([]);
    setIsDrawingBezier(false);
    setBezierPoints([]);
    setActivePointIndex(null);
    if (id === null && activeTool === 'edit-points') setActiveTool('select');
    else if (id && activeTool !== 'edit-points') setActiveTool('select');
  }, [activeTool]);

  const handleCompletePolyline = useCallback((isClosed: boolean) => {
    const cleanPoints = polylinePoints.filter(p => p);
    if (cleanPoints.length < 2) {
        setIsDrawingPolyline(false);
        setPolylinePoints([]);
        return;
    }
    let finalPoints = [...cleanPoints];
    if (finalPoints.length > 1) {
        const last = finalPoints[finalPoints.length - 1];
        const secondLast = finalPoints[finalPoints.length - 2];
        if (last && secondLast && last.x === secondLast.x && last.y === secondLast.y) finalPoints.pop();
    }
    if (finalPoints.length < 2) {
        setIsDrawingPolyline(false);
        setPolylinePoints([]);
        return;
    }
    const newShape: PolylineShape = {
        id: new Date().toISOString(), name: isClosed ? 'Багатокутник' : 'Ламана', type: 'polyline', points: finalPoints, isClosed,
        fill: isClosed && isFillEnabled ? (previewFillColor ?? fillColor) : 'none', stroke: isStrokeEnabled ? (previewStrokeColor ?? strokeColor) : 'none', strokeWidth: isStrokeEnabled ? strokeWidth : 0, state: 'normal', rotation: 0, capstyle: 'round',
        isAspectRatioLocked: false,
    };
    addShape(newShape);
    setIsDrawingPolyline(false);
    setPolylinePoints([]);
    setActiveTool('select');
    setSelectedShapeId(newShape.id);
  }, [polylinePoints, addShape, isFillEnabled, fillColor, isStrokeEnabled, strokeColor, strokeWidth, previewFillColor, previewStrokeColor]);
  
    const handleCancelPolyline = useCallback(() => {
        setIsDrawingPolyline(false);
        setPolylinePoints([]);
        setActiveTool('select');
    }, []);

    const handleCompleteBezier = useCallback((isClosed: boolean) => {
        const cleanPoints = bezierPoints.filter(Boolean);
        if (cleanPoints.length < 2) { setIsDrawingBezier(false); setBezierPoints([]); return; }
        let finalPoints = [...cleanPoints];
        if (finalPoints.length > 1) {
            const last = finalPoints[finalPoints.length - 1]; const secondLast = finalPoints[finalPoints.length - 2];
            if (last && secondLast && last.x === secondLast.x && last.y === secondLast.y) finalPoints.pop();
        }
        if (finalPoints.length < 2) { setIsDrawingBezier(false); setBezierPoints([]); return; }
        const newShape: BezierCurveShape = {
            id: new Date().toISOString(), name: isClosed ? "Багатокутник" : "Крива Без'є", type: 'bezier', points: finalPoints, smooth: true, splinesteps: 12, stroke: isStrokeEnabled ? (previewStrokeColor ?? strokeColor) : 'none',
            strokeWidth: isStrokeEnabled ? strokeWidth : 0, rotation: 0, capstyle: 'round', state: 'normal', isClosed: isClosed, fill: isClosed && isFillEnabled ? (previewFillColor ?? fillColor) : 'none',
            isAspectRatioLocked: false,
        };
        addShape(newShape);
        setIsDrawingBezier(false);
        setBezierPoints([]);
        setActiveTool('select');
        setSelectedShapeId(newShape.id);
    }, [bezierPoints, addShape, isStrokeEnabled, strokeColor, strokeWidth, isFillEnabled, fillColor, previewFillColor, previewStrokeColor]);
    
    const handleCancelBezier = useCallback(() => { setIsDrawingBezier(false); setBezierPoints([]); setActiveTool('select'); }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = event.target?.result as string;
                setPendingImage(base64String);
                setActiveTool('image'); 
                showNotification('Клацніть на полотні, щоб розмістити зображення.');
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const handleSetActiveTool = useCallback((tool: Tool) => {
        if (isDrawingPolyline) handleCompletePolyline(false);
        if (isDrawingBezier) handleCancelBezier();
        setActivePointIndex(null);
        const isSelectionPreservingTool = tool === 'select' || tool === 'edit-points';
        if (!isSelectionPreservingTool) setSelectedShapeId(null);
        if (tool === 'polyline') { setIsDrawingPolyline(true); setPolylinePoints([]);
        } else { setIsDrawingPolyline(false); }
        if (tool === 'bezier') { setIsDrawingBezier(true); setBezierPoints([]);
        } else { setIsDrawingBezier(false); }
        if (tool === 'image') fileInputRef.current?.click();
        else { setPendingImage(null); setActiveTool(tool); }
    }, [isDrawingPolyline, isDrawingBezier, handleCompletePolyline, handleCancelBezier]);

  const selectedShape = useMemo(() => {
    const foundShape = shapes.find((s) => s?.id === selectedShapeId) ?? null;
    return foundShape ? { ...foundShape } as Shape : null;
  }, [shapes, selectedShapeId]);
  
  const inlineEditingShape = useMemo(() => {
    if (!inlineEditingShapeId) return null;
    return shapes.find(s => s.id === inlineEditingShapeId) as TextShape || null;
  }, [shapes, inlineEditingShapeId]);

  const handleGenerateCode = useCallback(async () => {
    if (shapes.length === 0) { showNotification('Спочатку намалюйте щось на полотні!', 'info'); return; }
    
    if (generatorType === 'gemini' && !apiKey) {
        showNotification('Будь ласка, введіть ваш ключ Gemini API у налаштуваннях.', 'info');
        setIsApiKeyModalOpen(true);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedCodeLines([]);
    try {
      if (generatorType === 'local') {
        const { codeLines } = await generateTkinterCodeLocally(shapes, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments);
        setGeneratedCodeLines(codeLines);
      } else {
        const code = await generateTkinterCode(apiKey!, shapes, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments);
        const lines = code.split('\n');
        const codeLines = lines.map(line => {
            const match = line.match(/(.*?) # ID:([a-zA-Z0-9.-]+)/);
            if (match && match[1] && match[2]) {
                return { content: match[1].trim(), shapeId: match[2] };
            }
            return { content: line, shapeId: null };
        });
        setGeneratedCodeLines(codeLines);
      }
        
      setShapesAtGenerationTime(JSON.parse(JSON.stringify(shapes)));
      showNotification('Код успішно згенеровано!', 'info');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Сталася невідома помилка.';
      setError(`Не вдалося згенерувати код: ${errorMessage}`);
      showNotification('Помилка генерації коду.', 'error', 5000);
    } finally {
      setIsLoading(false);
    }
  }, [shapes, canvasWidth, canvasHeight, canvasBgColor, projectName, generatorType, canvasVarName, autoGenerateComments, apiKey]);

  useEffect(() => {
    if (generatorType === 'local' && isProjectActive) {
        const generate = async () => {
            const { codeLines } = await generateTkinterCodeLocally(shapes, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments);
            setGeneratedCodeLines(codeLines);
            setShapesAtGenerationTime(JSON.parse(JSON.stringify(shapes)));
        };
        generate();
    }
  }, [shapes, canvasWidth, canvasHeight, canvasBgColor, generatorType, projectName, isProjectActive, canvasVarName, autoGenerateComments]);
  
  const hasUnsyncedChangesWithCode = useMemo(() => {
    if (!shapesAtGenerationTime) return false;
    return JSON.stringify(shapes) !== JSON.stringify(shapesAtGenerationTime);
  }, [shapes, shapesAtGenerationTime]);

  const performClear = () => {
    resetHistory([]);
    setGeneratedCodeLines([]);
    setError(null);
    setSelectedShapeId(null);
    setActivePointIndex(null);
    setIsDrawingPolyline(false);
    setPolylinePoints([]);
    setIsDrawingBezier(false);
    setBezierPoints([]);
    setShapesAtGenerationTime(null);
    setFileHandle(null);
  };

  const confirmAction = useCallback((action: () => void, title: string, message: string) => {
    if (!hasUnsavedChanges) {
      action();
      return;
    }
    setConfirmationAction({
      title,
      message,
      onConfirm: () => {
        action();
        setConfirmationAction(null);
      }
    });
  }, [hasUnsavedChanges]);

  const handleClearCanvas = useCallback(() => {
    confirmAction(
      () => {
        performClear();
        showNotification('Полотно очищено.');
      },
      'Очистити полотно?',
      'Усі незбережені зміни буде втрачено. Ви впевнені?'
    );
  }, [confirmAction]);

  const handleNewProject = useCallback((settings: NewProjectSettings, templateId: string | null) => {
    performClear();
    setProjectName(settings.projectName);
    setCanvasWidth(settings.width);
    setCanvasHeight(settings.height);
    setCanvasBgColor(settings.bgColor);
    setCanvasVarName(settings.canvasVarName);

    if (templateId) {
        const template = projectTemplates.find(t => t.id === templateId);
        if (template) {
            const templateShapes = JSON.parse(JSON.stringify(template.shapes)); // deep copy
            resetHistory(templateShapes);
            lastSavedSignatureRef.current = getProjectSignature(settings.projectName, templateShapes);
        } else {
            resetHistory([]);
            lastSavedSignatureRef.current = getProjectSignature(settings.projectName, []);
        }
    } else {
        resetHistory([]);
        lastSavedSignatureRef.current = getProjectSignature(settings.projectName, []);
    }

    setProjectWasEverActive(true);
    setIsNewProjectModalOpen(false);
    setIsProjectActive(true);
    setTimeout(fitCanvasToView, 0);
  }, [getProjectSignature, fitCanvasToView, projectTemplates, resetHistory]);
  
  const handleOpenNewProjectModal = useCallback(() => {
    confirmAction(
      () => setIsNewProjectModalOpen(true),
      'Створити новий проєкт?',
      'Усі незбережені зміни в поточному проєкті буде втрачено. Ви впевнені?'
    );
  }, [confirmAction]);

  const handleGoHome = useCallback(() => {
    setIsProjectActive(false);
  }, []);

  const getSaveData = useCallback((pName: string) => ({
    projectName: pName,
    shapes,
    thumbnail: generateProjectThumbnail(shapes, canvasWidth, canvasHeight, canvasBgColor),
    canvasSettings: { width: canvasWidth, height: canvasHeight, bgColor: canvasBgColor, varName: canvasVarName },
    viewTransform,
    uiSettings: { theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCursorCoords, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments }
  }), [shapes, canvasWidth, canvasHeight, canvasBgColor, canvasVarName, viewTransform, theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCursorCoords, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, generateProjectThumbnail]);

    const handleSaveProject = useCallback(async () => {
        if (!hasUnsavedChanges && fileHandle) {
            showNotification('Незбережених змін немає.', 'info');
            return;
        }
        
        const saveData = getSaveData(projectName);
        
        if (fileHandle) {
            try {
                await saveToHandle(fileHandle, JSON.stringify(saveData, null, 2));
                lastSavedSignatureRef.current = getProjectSignature(projectName, shapes);
                addRecentProject(fileHandle, saveData.thumbnail);
                showNotification('Проєкт збережено.', 'info');
            } catch (error) {
                console.error("Не вдалося зберегти у файл", error);
                showNotification('Не вдалося зберегти у файл. Спробуйте "Зберегти як...".', 'error');
            }
        } else {
            // New project: "Save" acts like "Save As" but without the name modal.
            try {
                const jsonString = JSON.stringify(saveData, null, 2);
                
                const newHandle = await saveFile(
                    jsonString,
                    `${projectName}.vec.json`,
                    [{
                        description: 'Векторний проєкт',
                        accept: { 'application/json': ['.vec.json', '.json'] },
                    }],
                    'application/json'
                );
                
                if (newHandle) {
                    const finalProjectName = newHandle.name.replace(/\.vec.json$/, '');
                    setFileHandle(newHandle);
                    setProjectName(finalProjectName);
                    lastSavedSignatureRef.current = getProjectSignature(finalProjectName, shapes);
                    addRecentProject(newHandle, saveData.thumbnail);
                    showNotification('Проєкт збережено.', 'info');
                }
            } catch (error) {
                console.error("Не вдалося зберегти проєкт", error);
                showNotification('Не вдалося зберегти проєкт.', 'error');
            }
        }
    }, [hasUnsavedChanges, fileHandle, getSaveData, projectName, getProjectSignature, shapes, addRecentProject]);

    const handleSaveProjectAs = useCallback(async (newProjectNameFromModal: string) => {
        setIsSaveAsModalOpen(false);
        try {
            const saveData = getSaveData(newProjectNameFromModal);
            const jsonString = JSON.stringify(saveData, null, 2);
            
            const newHandle = await saveFile(
                jsonString,
                `${newProjectNameFromModal}.vec.json`,
                [{
                    description: 'Векторний проєкт',
                    accept: { 'application/json': ['.vec.json', '.json'] },
                }],
                'application/json'
            );
            
            if (newHandle) {
                const finalProjectName = newHandle.name.replace(/\.vec.json$/, '');
                setFileHandle(newHandle);
                setProjectName(finalProjectName);
                lastSavedSignatureRef.current = getProjectSignature(finalProjectName, shapes);
                addRecentProject(newHandle, saveData.thumbnail);
                showNotification('Проєкт збережено.', 'info');
            }
        } catch (error) {
            console.error("Не вдалося зберегти проєкт", error);
            showNotification('Не вдалося зберегти проєкт.', 'error');
        }
    }, [getSaveData, shapes, addRecentProject, getProjectSignature]);

    const handleSaveTemplate = useCallback((name: string) => {
        const newTemplate: ProjectTemplate = {
            id: Date.now().toString(),
            name,
            settings: {
                projectName: `Проєкт (з шаблону "${name}")`,
                width: canvasWidth,
                height: canvasHeight,
                bgColor: canvasBgColor,
                canvasVarName: canvasVarName,
            },
            shapes: JSON.parse(JSON.stringify(shapes)), // Deep copy
        };
    
        setProjectTemplates(prev => {
            const updatedTemplates = [...prev, newTemplate];
            try {
                localStorage.setItem('veretka-project-templates', JSON.stringify(updatedTemplates));
                showNotification(`Шаблон "${name}" збережено.`, 'info');
            } catch (e) {
                console.error("Failed to save project templates to localStorage", e);
                showNotification('Не вдалося зберегти шаблон.', 'error');
            }
            return updatedTemplates;
        });
        setIsSaveTemplateModalOpen(false);
    }, [shapes, canvasWidth, canvasHeight, canvasBgColor, canvasVarName]);

    const handleDeleteTemplate = useCallback((templateId: string) => {
        setConfirmationAction({
            title: "Видалити шаблон?",
            message: "Ця дія назавжди видалить цей шаблон. Ви впевнені?",
            onConfirm: () => {
                setProjectTemplates(prev => {
                    const updatedTemplates = prev.filter(t => t.id !== templateId);
                    try {
                        localStorage.setItem('veretka-project-templates', JSON.stringify(updatedTemplates));
                        showNotification('Шаблон видалено.', 'info');
                    } catch (e) {
                        console.error("Failed to delete project template from localStorage", e);
                        showNotification('Не вдалося видалити шаблон.', 'error');
                    }
                    return updatedTemplates;
                });
                setConfirmationAction(null);
            }
        });
    }, []);

    const handleRenameTemplate = useCallback((templateId: string, newName: string) => {
        setProjectTemplates(prev => {
            const updatedTemplates = prev.map(t => t.id === templateId ? { ...t, name: newName } : t);
            try {
                localStorage.setItem('veretka-project-templates', JSON.stringify(updatedTemplates));
                showNotification('Шаблон перейменовано.', 'info');
            } catch (e) {
                console.error("Failed to rename project template in localStorage", e);
                showNotification('Не вдалося перейменувати шаблон.', 'error');
            }
            return updatedTemplates;
        });
    }, []);

  const processLoadedData = useCallback((fileContent: string, fileName?: string, handle?: FileSystemFileHandle | null) => {
    try {
        const savedData = JSON.parse(fileContent);
        if (savedData.shapes && savedData.canvasSettings && savedData.viewTransform) {
            const newProjectName = savedData.projectName || (fileName ? fileName.replace(/\.vec.json$/, '') : 'Завантажений проєкт');
            
            performClear();
            resetHistory(savedData.shapes);
            setProjectName(newProjectName);
            setCanvasWidth(savedData.canvasSettings.width);
            setCanvasHeight(savedData.canvasSettings.height);
            setCanvasBgColor(savedData.canvasSettings.bgColor);
            setCanvasVarName(savedData.canvasSettings.varName || 'c');
            setViewTransform(savedData.viewTransform);

            const ui = savedData.uiSettings || {};
            setTheme(ui.theme || 'dark');
            setShowGrid(ui.showGrid ?? true);
            setGridSize(ui.gridSize || 10);
            setSnapToGrid(ui.snapToGrid ?? true);
            setGridSnapStep(ui.gridSnapStep || 1);
            setShowAxes(ui.showAxes ?? true);
            setShowCursorCoords(ui.showCursorCoords ?? true);
            setShowRotationAngle(ui.showRotationAngle ?? true);
            setShowLineNumbers(ui.showLineNumbers ?? true);
            setShowComments(ui.showComments ?? true);
            setShowTkinterNames(ui.showTkinterNames ?? true);
            setGeneratorType(ui.generatorType || 'local');
            setHighlightCodeOnSelection(ui.highlightCodeOnSelection ?? true);
            setAutoGenerateComments(ui.autoGenerateComments ?? true);
            
            lastSavedSignatureRef.current = getProjectSignature(newProjectName, savedData.shapes);

            if (activeTool === 'polyline' || activeTool === 'bezier') {
                setActiveTool('select');
            }
            setProjectWasEverActive(true);
            setIsProjectActive(true);
            if (handle) {
                addRecentProject(handle, savedData.thumbnail);
            }
            showNotification('Проєкт успішно завантажено.', 'info');
            setTimeout(fitCanvasToView, 0);
        } else {
            showNotification('Неправильний формат файлу проєкту.', 'error');
        }
    } catch (e) {
        console.error("Помилка парсингу файлу проєкту", e);
        showNotification('Не вдалося завантажити проєкт. Файл пошкоджено.', 'error');
    }
  }, [resetHistory, getProjectSignature, addRecentProject, fitCanvasToView, activeTool]);

  const loadProject = useCallback(async () => {
    let result: { handle: FileSystemFileHandle; content: string } | null = null;
    if (typeof (window as any).showOpenFilePicker === 'function') {
        try {
            result = await openProjectFile();
        } catch (err) {
            console.error("Не вдалося завантажити проєкт через API", err);
            showNotification('Не вдалося завантажити проєкт.', 'error');
            return;
        }
    }

    if (result) {
        processLoadedData(result.content, result.handle.name, result.handle);
        setFileHandle(result.handle);
    } else {
        projectLoadInputRef.current?.click();
    }
  }, [processLoadedData]);
  
  const handleLoadProject = useCallback(() => {
    confirmAction(
      loadProject,
      'Завантажити проєкт?',
      'Усі незбережені зміни буде втрачено. Ви впевнені?'
    );
  }, [confirmAction, loadProject]);

  const handleProjectFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const fileContent = event.target?.result as string;
            setFileHandle(null);
            processLoadedData(fileContent, file.name);
        } catch (error) {
            console.error("Не вдалося завантажити проєкт", error);
            showNotification('Не вдалося завантажити проєкт. Файл може бути пошкоджений.', 'error');
        }
    };
    reader.onerror = () => {
        showNotification('Не вдалося прочитати файл.', 'error');
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };
  
  const handleExport = useCallback(async (settings: ExportSettings) => {
    setIsExportModalOpen(false);
    showNotification('Експорт зображення...', 'info', 1500);
    try {
        const svgString = generateSvg(shapes, canvasWidth, canvasHeight, canvasBgColor);
        const suggestedName = `${projectName}.${settings.format}`;

        if (settings.format === 'svg') {
            await saveFile(
                svgString,
                suggestedName,
                [{
                    description: 'SVG Зображення',
                    accept: { 'image/svg+xml': ['.svg'] },
                }],
                'image/svg+xml'
            );
        } else {
            const dataUrl = await exportToRaster(
                settings.format,
                svgString,
                canvasWidth,
                canvasHeight,
                settings.scale,
                settings.quality
            );
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const mimeType = settings.format === 'png' ? 'image/png' : 'image/jpeg';
            const description = settings.format === 'png' ? 'PNG Зображення' : 'JPEG Зображення';
            await saveFile(
                blob,
                suggestedName,
                [{
                    description,
                    accept: { [mimeType]: [`.${settings.format}`] },
                }],
                mimeType
            );
        }
        showNotification('Зображення успішно експортовано!', 'info');
    } catch (err) {
        console.error('Помилка експорту:', err);
        showNotification('Не вдалося експортувати зображення.', 'error');
    }
  }, [shapes, canvasWidth, canvasHeight, canvasBgColor, projectName]);

  const handleOpenRecent = useCallback(async (project: RecentProject) => {
    try {
        const content = await openRecentProject(project);
        if (content) {
            processLoadedData(content, project.name, project.handle);
            setFileHandle(project.handle);
        }
    } catch (err) {
        console.error('Не вдалося відкрити останній проєкт:', err);
        showNotification(`Не вдалося відкрити проєкт: ${err instanceof Error ? err.message : 'Невідома помилка'}.`, 'error', 5000);
    }
  }, [openRecentProject, processLoadedData]);
  
  const handleRemoveRecentProject = useCallback((project: RecentProject) => {
    setConfirmationAction({
        title: `Видалити "${project.name.replace(/\.vec\.json$/, '')}"?`,
        message: 'Ця дія видалить проєкт лише зі списку останніх, а не сам файл. Ви впевнені?',
        onConfirm: () => {
            removeRecentProject(project.name);
            showNotification('Проєкт видалено зі списку.');
            setConfirmationAction(null);
        }
    });
  }, [removeRecentProject]);

  const handleClearAllRecentProjects = useCallback(() => {
    if (recentProjects.length === 0) return;
    setConfirmationAction({
        title: 'Очистити список останніх проєктів?',
        message: 'Ця дія видалить усі проєкти зі списку, але не самі файли. Ви впевнені?',
        onConfirm: () => {
            clearAllProjects();
            showNotification('Список останніх проєктів очищено.');
            setConfirmationAction(null);
        }
    });
  }, [clearAllProjects, recentProjects.length]);


    const handleSaveCode = useCallback(async (fileName: string, extension: '.py' | '.txt', includeLineNumbers: boolean) => {
        setIsSaveCodeModalOpen(false);
        
        let contentToSave: string;
        let fileDescription: string;
        let mimeType: string;
        let accept: Record<string, string[]>;

        if (extension === '.txt' && includeLineNumbers) {
            contentToSave = generatedCodeLines
                .filter(line => showComments || !line.content.trim().startsWith('#'))
                .map((line, index) => `${String(index + 1).padStart(4, ' ')} | ${line.content}`)
                .join('\n');
        } else {
            contentToSave = codeStringForExport;
        }

        if (!contentToSave) {
          showNotification('Немає коду для збереження.', 'error');
          return;
        }
        
        if (extension === '.py') {
            fileDescription = 'Python файл';
            mimeType = 'text/python';
            accept = { [mimeType]: ['.py'] };
        } else { // .txt
            fileDescription = 'Текстовий файл';
            mimeType = 'text/plain';
            accept = { [mimeType]: ['.txt'] };
        }

        try {
          await saveFile(
            contentToSave,
            `${fileName}${extension}`,
            [{
              description: fileDescription,
              accept: accept,
            }],
            mimeType
          );
          showNotification('Файл успішно збережено.', 'info');
        } catch (err) {
          console.error('Не вдалося зберегти файл:', err);
          showNotification('Не вдалося зберегти файл.', 'error');
        }
    }, [codeStringForExport, generatedCodeLines, showComments]);

    const handleOpenOrRunCodeOnline = useCallback((runImmediately: boolean) => {
        const codeString = codeStringForExport;
        if (!codeString) {
            showNotification('Немає коду для запуску.', 'error');
            return;
        }

        const openUrl = () => {
             try {
                const encoder = new TextEncoder();
                const uint8array = encoder.encode(codeString);
                let binaryString = '';
                uint8array.forEach((byte) => {
                    binaryString += String.fromCharCode(byte);
                });
                const base64 = btoa(binaryString);
                const param = runImmediately ? 'runcode' : 'code';
                const url = `https://yepython.pp.ua/?${param}=${base64}`;
                window.open(url, '_blank', 'noopener,noreferrer');
            } catch (e) {
                console.error("Error creating online IDE link:", e);
                showNotification('Не вдалося створити посилання для онлайн IDE.', 'error');
            }
        };

        setConfirmationAction({
            title: 'Перехід на зовнішній ресурс',
            message: 'Ви збираєтеся відкрити код у онлайн-редакторі ЄPython. Деякі елементи (напр. специфічні шрифти, кольори) можуть відображатися інакше, ніж у редакторі. Продовжити?',
            onConfirm: () => {
                openUrl();
                setConfirmationAction(null);
            },
            variant: 'primary',
            confirmText: 'Так, перейти',
            cancelText: 'Залишитись'
        });
    }, [codeStringForExport]);


  const handleDuplicate = useCallback(() => { if (selectedShapeId) duplicateShape(selectedShapeId); }, [selectedShapeId, duplicateShape]);
  const handleDelete = useCallback(() => { if (selectedShapeId) deleteShape(selectedShapeId); }, [selectedShapeId, deleteShape]);

  const canConvertToPath = useMemo(() => {
    if (!selectedShape) return false;
    return ['rectangle', 'ellipse', 'triangle', 'right-triangle', 'rhombus', 'trapezoid', 'parallelogram', 'polygon', 'star', 'arc'].includes(selectedShape.type);
  }, [selectedShape]);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            showNotification(`Не вдалося увійти в повноекранний режим: ${err.message}`, 'error');
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  }, []);

    const handleLocateSelectedShape = useCallback(() => {
        if (!selectedShapeId || !viewportRef.current) return;
        const shape = shapes.find(s => s.id === selectedShapeId);
        if (!shape) return;

        const shapeBbox = getVisualBoundingBox(shape);
        if (!shapeBbox || shapeBbox.width === 0 || shapeBbox.height === 0) return;

        const rulerOffset = showAxes ? RULER_THICKNESS : 0;
        const canvasViewportWidth = viewportSize.width - rulerOffset;
        const canvasViewportHeight = viewportSize.height - rulerOffset;
        
        const PADDING_FACTOR = 0.8; // Use 80% of the viewport to leave some margin
        const availableWidth = canvasViewportWidth * PADDING_FACTOR;
        const availableHeight = canvasViewportHeight * PADDING_FACTOR;

        const scaleX = availableWidth / shapeBbox.width;
        const scaleY = availableHeight / shapeBbox.height;
        let newScale = Math.min(scaleX, scaleY);
        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

        const shapeCenterX = shapeBbox.x + shapeBbox.width / 2;
        const shapeCenterY = shapeBbox.y + shapeBbox.height / 2;

        const viewportCenterX = canvasViewportWidth / 2;
        const viewportCenterY = canvasViewportHeight / 2;

        const newX = viewportCenterX - (shapeCenterX * newScale);
        const newY = viewportCenterY - (shapeCenterY * newScale);

        setViewTransform({ scale: newScale, x: newX, y: newY });
    }, [selectedShapeId, shapes, showAxes, viewportSize, setViewTransform]);

  useEffect(() => {
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'F11') {
            e.preventDefault();
            handleToggleFullscreen();
            return;
        }

        if (e.key === 'Escape' && isFullscreen) {
            e.preventDefault();
            if (escapeHoldTimer.current === null) {
                escapeHoldTimer.current = window.setTimeout(() => {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                    escapeHoldTimer.current = null;
                }, ESCAPE_HOLD_DURATION);
            }
        }

        const isEditingText = (e.target as HTMLElement).matches('input, textarea, [contenteditable="true"]');
        if (isEditingText || inlineEditingShapeId) return;

        // Modifier shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.code) {
                case 'KeyD':
                    if (selectedShapeId) {
                        e.preventDefault();
                        duplicateShape(selectedShapeId);
                    }
                    return;
                case 'KeyZ':
                    e.preventDefault();
                    if (e.shiftKey) {
                        if (canRedo) redo();
                    } else {
                        if (canUndo) undo();
                    }
                    return;
                case 'KeyY':
                    e.preventDefault();
                    if (canRedo) redo();
                    return;
                case 'KeyS':
                    e.preventDefault();
                    handleSaveProject();
                    return;
            }
        }
        
        // Arrow key movement
        if (selectedShapeId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
            const shapeToMove = shapes.find(s => s.id === selectedShapeId);
            if (!shapeToMove) return;

            const delta = e.shiftKey ? 10 : 1;
            let dx = 0;
            let dy = 0;

            switch (e.code) {
                case 'ArrowUp': dy = -delta; break;
                case 'ArrowDown': dy = delta; break;
                case 'ArrowLeft': dx = -delta; break;
                case 'ArrowRight': dx = delta; break;
            }

            if (dx === 0 && dy === 0) return;

            let newShape: Shape;
            switch (shapeToMove.type) {
                case 'line':
                    newShape = {...shapeToMove, points: [{...shapeToMove.points[0]}, {...shapeToMove.points[1]}]};
                    break;
                case 'pencil':
                case 'polyline':
                case 'bezier':
                    newShape = {...shapeToMove, points: shapeToMove.points.map(p => ({...p}))};
                    break;
                default:
                    newShape = {...shapeToMove};
            }
            
            // Apply transformation
            switch (newShape.type) {
                case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap':
                    newShape.x += dx;
                    newShape.y += dy;
                    break;
                case 'ellipse': case 'polygon': case 'star':
                    newShape.cx += dx;
                    newShape.cy += dy;
                    break;
                case 'line':
                case 'pencil': 
                case 'polyline':
                case 'bezier': 
                    newShape.points = newShape.points.map((p: {x: number, y: number}) => ({ x: p.x + dx, y: p.y + dy })); 
                    break;
            }

            updateShape(newShape);
            return;
        }


        // Non-modifier shortcuts
        switch (e.code) {
            case 'KeyV':
                e.preventDefault();
                handleSetActiveTool('select');
                return;
            case 'KeyA':
                e.preventDefault();
                handleSetActiveTool('edit-points');
                return;
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                if (activeTool === 'edit-points' && selectedShapeId && activePointIndex !== null) {
                    deletePoint(selectedShapeId, activePointIndex);
                } else if (selectedShapeId) {
                    deleteShape(selectedShapeId);
                }
                return;
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (escapeHoldTimer.current !== null) {
                clearTimeout(escapeHoldTimer.current);
                escapeHoldTimer.current = null;
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        if (escapeHoldTimer.current) {
            clearTimeout(escapeHoldTimer.current);
        }
    };
  }, [selectedShapeId, activeTool, activePointIndex, deletePoint, deleteShape, duplicateShape, undo, redo, canUndo, canRedo, handleSaveProject, handleSetActiveTool, shapes, updateShape, inlineEditingShapeId, handleToggleFullscreen, isFullscreen]);

    const handleZoomChange = useCallback((newScale: number) => {
        if (!viewportRef.current) return;
        const { width: viewportWidth, height: viewportHeight } = viewportRef.current.getBoundingClientRect();
        
        const { scale: oldScale, x, y } = viewTransform;

        const viewportCenterX = viewportWidth / 2;
        const viewportCenterY = viewportHeight / 2;

        const canvasCenterX = (viewportCenterX - x) / oldScale;
        const canvasCenterY = (viewportCenterY - y) / oldScale;
        
        const newX = viewportCenterX - canvasCenterX * newScale;
        const newY = viewportCenterY - canvasCenterY * newScale;

        setViewTransform({ scale: newScale, x: newX, y: newY });
    }, [viewTransform]);

    const handleResetZoom = useCallback(() => {
        handleZoomChange(1);
    }, [handleZoomChange]);

    const handleConvertToPath = useCallback(() => {
        if (selectedShapeId) {
            convertToPath(selectedShapeId);
        }
    }, [selectedShapeId, convertToPath]);

    const handleOpenSettings = useCallback(() => {
        setSettingsInitialTab('canvas');
        setIsSettingsOpen(true);
    }, []);

    const handleOpenMobileLeft = useCallback(() => {
        setIsLeftPanelVisible(p => !p);
    }, []);

    const handleOpenMobileRight = useCallback(() => {
        setIsRightPanelVisible(p => !p);
    }, []);
    
    const handleSwitchToLocalFromError = useCallback(() => {
        setGeneratorType('local');
        setError(null); // Clear the Gemini error
        showNotification('Перемкнено на локальний генератор. Код буде оновлено автоматично.', 'info');
    }, []);
    
    const handleOpenSettingsToGenerator = useCallback(() => {
        setSettingsInitialTab('generator');
        setIsSettingsOpen(true);
    }, []);
    
    const handleStartInlineEdit = useCallback((shapeId: string) => {
        setInlineEditingShapeId(shapeId);
        setSelectedShapeId(shapeId);
    }, []);

    const handleStopInlineEdit = useCallback(() => {
        // When editing stops, create a new history state with the final text.
        // This prevents creating a history entry for every single keystroke.
        const shapeToUpdate = shapes.find(s => s.id === inlineEditingShapeId);
        if (shapeToUpdate) {
            // By calling setShapes (from useHistoryState), we create a new history entry.
            setShapes(shapes);
        }
        setInlineEditingShapeId(null);
    }, [inlineEditingShapeId, shapes, setShapes]);

    const handleUpdateInlineText = useCallback((newText: string) => {
        if (!inlineEditingShapeId) return;
        // This is a "preview" update, it doesn't create a history state yet.
        const currentShapes = shapes.map(s => {
            if (s.id === inlineEditingShapeId && s.type === 'text') {
                return { ...s, text: newText };
            }
            return s;
        });
        // We use the internal setter of useHistoryState to update without creating a history entry.
        // This is a bit of a hack, but it's the simplest way to get the desired behavior.
        // The proper way would be to expose an `updateCurrentState` from the hook.
        const historySetter = (setShapes as any)._internal_setHistory;
        if(historySetter) {
            historySetter((prev: any) => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = currentShapes;
                return newHistory;
            });
        } else {
             // Fallback for safety, though it will create history entries
            setShapes(currentShapes);
        }

    }, [inlineEditingShapeId, shapes, setShapes]);
    
    const handleSaveApiKey = useCallback((key: string | null) => {
        setApiKey(key);
        setIsApiKeyModalOpen(false);
        if (key) {
            showNotification('Ключ API збережено для поточної сесії.', 'info');
        } else {
            showNotification('Ключ API видалено.', 'info');
        }
    }, []);

  const handleSetFillColor = useCallback((color: string) => {
      setFillColor(color);
      setPreviewFillColor(null);
  }, []);

  const handleSetStrokeColor = useCallback((color: string) => {
      setStrokeColor(color);
      setPreviewStrokeColor(null);
  }, []);

  const handleSetTextColor = useCallback((color: string) => {
      setTextColor(color);
      setPreviewTextColor(null);
  }, []);

  return (
    <div className="h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-sans flex flex-col selection:bg-[var(--accent-primary)] selection:text-[var(--accent-text)] overflow-hidden">
      {isScreenTooSmall && (
        <div className="fixed inset-0 bg-[var(--bg-app)] flex items-center justify-center z-[100] text-center p-8">
          <div className="flex flex-col items-center gap-6">
            <SadMonitorIcon size={96} className="text-[var(--text-tertiary)]" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Розмір екрана замалий</h1>
              <p className="text-[var(--text-secondary)]">
                На жаль, для коректної роботи редактора "ВереTkа" потрібен більший екран.
                <br />
                Будь ласка, відкрийте цей застосунок на комп'ютері чи планшеті або оберніть екран.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className={isScreenTooSmall ? 'hidden' : 'h-full flex flex-col'}>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleFileSelect} />
          <input type="file" ref={projectLoadInputRef} style={{ display: 'none' }} accept=".json,.vec.json" onChange={handleProjectFileSelected} />
          {notification && (
            <div className={`fixed top-5 left-1/2 -translate-x-1/2 ${notification.type === 'error' ? 'bg-[var(--destructive-bg)]' : 'bg-[var(--accent-primary)]'} text-[var(--accent-text)] py-2 px-4 rounded-lg shadow-lg z-50 animate-fade-in-down`}>
              {notification.message}
            </div>
          )}
          
          <MenuBar
            onGenerate={handleGenerateCode}
            showGenerateButton={generatorType === 'gemini'}
            onNewProject={handleOpenNewProjectModal}
            onSaveProject={handleSaveProject}
            canSave={isProjectActive && (hasUnsavedChanges || !fileHandle)}
            onSaveProjectAs={() => setIsSaveAsModalOpen(true)}
            onSaveAsTemplate={() => setIsSaveTemplateModalOpen(true)}
            onLoadProject={handleLoadProject}
            onExport={() => setIsExportModalOpen(true)}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onDuplicate={handleDuplicate}
            isShapeSelected={!!selectedShapeId}
            onDelete={handleDelete}
            onConvertToPath={handleConvertToPath}
            canConvertToPath={canConvertToPath}
            onFitCanvasToView={fitCanvasToView}
            onToggleFullscreen={handleToggleFullscreen}
            isFullscreen={isFullscreen}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            snapToGrid={snapToGrid}
            setSnapToGrid={setSnapToGrid}
            showAxes={showAxes}
            setShowAxes={setShowAxes}
            onOpenSettings={handleOpenSettings}
            theme={theme}
            setTheme={setTheme}
            projectName={projectName}
            isProjectActive={isProjectActive}
            onGoHome={handleGoHome}
            onOpenAbout={() => setIsAboutModalOpen(true)}
            onOpenHelp={() => setIsHelpModalOpen(true)}
            onOpenFeedback={() => setIsFeedbackModalOpen(true)}
          />

          {isProjectActive && <TopToolbar
              activeTool={activeTool}
              setActiveTool={handleSetActiveTool}
              drawMode={drawMode}
              setDrawMode={setDrawMode}
              isFillEnabled={isFillEnabled}
              setIsFillEnabled={setIsFillEnabled}
              isStrokeEnabled={isStrokeEnabled}
              setIsStrokeEnabled={setIsStrokeEnabled}
              fillColor={fillColor}
              setFillColor={handleSetFillColor}
              setPreviewFillColor={setPreviewFillColor}
              strokeColor={strokeColor}
              setStrokeColor={handleSetStrokeColor}
              setPreviewStrokeColor={setPreviewStrokeColor}
              strokeWidth={strokeWidth}
              setStrokeWidth={setStrokeWidth}
              numberOfSides={numberOfSides}
              setNumberOfSides={setNumberOfSides}
              onGenerate={handleGenerateCode}
              showGenerateButton={generatorType === 'gemini'}
              onClear={handleClearCanvas}
              isGenerating={isLoading}
              hasShapes={shapes.length > 0}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              onDuplicate={handleDuplicate}
              isShapeSelected={!!selectedShapeId}
              onOpenMobileLeft={handleOpenMobileLeft}
              onOpenMobileRight={handleOpenMobileRight}
              selectedShape={selectedShape}
              updateShape={updateShape}
              setShapePreview={setShapePreview}
              cancelShapePreview={cancelShapePreview}
              textColor={textColor}
              setTextColor={handleSetTextColor}
              setPreviewTextColor={setPreviewTextColor}
              textFont={textFont}
              setTextFont={setTextFont}
              textFontSize={textFontSize}
              setTextFontSize={setTextFontSize}
          />}

           <main className="flex-grow grid grid-cols-1 md:grid-cols-[380px_1fr] lg:grid-cols-[380px_1fr_340px] min-h-0">
             
            {/* Left Column */}
            {isProjectActive && <aside className={`${isLeftPanelVisible ? 'fixed inset-0 bg-[var(--bg-app)]/95 backdrop-blur-sm z-40 p-4 flex flex-col' : 'hidden'} md:static md:bg-transparent md:z-auto md:p-0 md:flex flex-col gap-4 min-h-0 bg-[var(--bg-primary)]/50 md:p-2`}>
                <div className="md:hidden flex justify-end mb-4">
                    <button onClick={() => setIsLeftPanelVisible(false)} className="p-2 rounded-lg text-[var(--accent-text)]"><XIcon/></button>
                </div>
                <LeftToolbar
                    activeTool={activeTool}
                    setActiveTool={handleSetActiveTool}
                />
                <div className="flex-1 min-h-0 mt-2">
                    <CodeDisplay 
                        codeLines={generatedCodeLines} isLoading={isLoading} error={error} onUpdate={handleGenerateCode}
                        onPreview={() => setIsPreviewOpen(true)} hasUnsyncedChanges={hasUnsyncedChangesWithCode}
                        opacity={1} setOpacity={() => {}}
                        selectedShapeId={selectedShapeId}
                        highlightCodeOnSelection={highlightCodeOnSelection}
                        setHighlightCodeOnSelection={setHighlightCodeOnSelection}
                        showLineNumbers={showLineNumbers}
                        setShowLineNumbers={setShowLineNumbers}
                        showComments={showComments}
                        setShowComments={setShowComments}
                        generatorType={generatorType}
                        // FIX: Changed prop name from `onSwitchToLocalFromError` to `onSwitchToLocalGenerator` to match `CodeDisplayProps`.
                        onSwitchToLocalGenerator={handleSwitchToLocalFromError}
                        onOpenSettingsToGenerator={handleOpenSettingsToGenerator}
                        onSaveCode={() => setIsSaveCodeModalOpen(true)}
                        onOpenOrRunCodeOnline={handleOpenOrRunCodeOnline}
                        codeStringForExport={codeStringForExport}
                    />
                </div>
            </aside>}

             {/* Center Content */}
            <div className={`flex flex-col min-w-0 min-h-0 p-2 md:p-4 ${!isProjectActive && "md:col-start-1 lg:col-start-1 md:col-span-3 lg:col-span-3"}`}>
                {isProjectActive ? (
                    <>
                        <div ref={viewportRef} className="bg-[var(--bg-secondary)] rounded-lg shadow-inner flex-grow overflow-hidden relative grid" style={{
                            gridTemplateRows: showAxes ? `${RULER_THICKNESS}px 1fr` : '1fr',
                            gridTemplateColumns: showAxes ? `${RULER_THICKNESS}px 1fr` : '1fr',
                        }}>
                            {showAxes && <div className="bg-[var(--ruler-bg)] z-10 flex items-center justify-center p-1"><AxesIcon size={16}/></div>}
                            {showAxes && <Ruler orientation="horizontal" transform={viewTransform} length={viewportSize.width - RULER_THICKNESS} canvasSize={{ width: canvasWidth, height: canvasHeight }} />}
                            {showAxes && <Ruler orientation="vertical" transform={viewTransform} length={viewportSize.height - RULER_THICKNESS} canvasSize={{ width: canvasWidth, height: canvasHeight }} />}
                            <div className="relative overflow-hidden" style={{ gridRow: showAxes ? 2 : '1 / -1', gridColumn: showAxes ? 2 : '1 / -1' }}>
                                 {inlineEditingShape && (
                                    <InlineTextEditor
                                        shape={inlineEditingShape}
                                        viewTransform={viewTransform}
                                        onUpdateText={handleUpdateInlineText}
                                        onStopEditing={handleStopInlineEdit}
                                        canvasOffset={{ 
                                            left: showAxes ? RULER_THICKNESS : 0, 
                                            top: showAxes ? RULER_THICKNESS : 0 
                                        }}
                                    />
                                )}
                                <Canvas
                                    width={canvasWidth} height={canvasHeight} backgroundColor={previewCanvasBgColor ?? canvasBgColor} shapes={displayedShapes} addShape={addShape} updateShape={updateShape} activeTool={activeTool} drawMode={drawMode}
                                    fillColor={isFillEnabled ? (previewFillColor ?? fillColor) : 'none'} strokeColor={isStrokeEnabled ? (previewStrokeColor ?? strokeColor) : 'none'} strokeWidth={isStrokeEnabled ? strokeWidth : 0}
                                    textColor={previewTextColor ?? textColor}
                                    textFont={textFont}
                                    textFontSize={textFontSize}
                                    numberOfSides={numberOfSides} selectedShapeId={selectedShapeId} onSelectShape={handleSelectShape} isDrawingPolyline={isDrawingPolyline} polylinePoints={polylinePoints} setPolylinePoints={setPolylinePoints}
                                    onCompletePolyline={handleCompletePolyline} onCancelPolyline={handleCancelPolyline} isDrawingBezier={isDrawingBezier} bezierPoints={bezierPoints} setBezierPoints={setBezierPoints}
                                    onCompleteBezier={handleCompleteBezier} onCancelBezier={handleCancelBezier} showGrid={showGrid} gridSize={gridSize} snapStep={snapToGrid ? gridSnapStep : 1} viewTransform={viewTransform}
                                    setViewTransform={setViewTransform} activePointIndex={activePointIndex} setActivePointIndex={setActivePointIndex} showCursorCoords={showCursorCoords} showRotationAngle={showRotationAngle}
                                    pendingImage={pendingImage} setPendingImage={setPendingImage} setCursorPos={setCursorPos}
                                    showNotification={showNotification}
                                    onStartInlineEdit={handleStartInlineEdit}
                                    inlineEditingShapeId={inlineEditingShapeId}
                                />
                            </div>
                            <button onClick={fitCanvasToView} title="Показати все полотно" className="absolute bottom-4 right-4 z-10 p-2 bg-[var(--bg-primary)] text-[var(--text-secondary)] rounded-full shadow-lg hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
                                <FitToScreenIcon />
                            </button>
                        </div>
                        <StatusBar 
                            zoomLevel={viewTransform.scale} 
                            cursorPos={cursorPos}
                            onZoomChange={handleZoomChange}
                            onResetZoom={handleResetZoom}
                            onLocateSelectedShape={handleLocateSelectedShape}
                            selectedShapeId={selectedShapeId}
                        />
                    </>
                ) : (
                    <WelcomeScreen 
                        onCreateNew={handleOpenNewProjectModal}
                        onLoadProject={handleLoadProject}
                        recentProjects={recentProjects}
                        onOpenRecent={handleOpenRecent}
                        onRemoveProject={handleRemoveRecentProject}
                        onClearAllProjects={handleClearAllRecentProjects}
                        hasActiveProject={projectWasEverActive}
                        onReturnToProject={() => setIsProjectActive(true)}
                    />
                )}
            </div>
            
             {/* Right Column */}
            {isProjectActive && <aside className={`${isRightPanelVisible ? 'fixed inset-0 bg-[var(--bg-app)]/95 backdrop-blur-sm z-40 p-4 flex flex-col' : 'hidden'} lg:static lg:bg-transparent lg:z-auto lg:p-0 lg:flex flex-col gap-4 overflow-y-auto md:p-2`}>
                 <div className="lg:hidden flex justify-end mb-4">
                    <button onClick={() => setIsRightPanelVisible(false)} className="p-2 rounded-lg text-[var(--accent-text)]"><XIcon /></button>
                </div>
                 <div className="flex-1 min-h-0">
                    <ShapeList
                        shapes={shapes}
                        selectedShapeId={selectedShapeId}
                        onSelectShape={handleSelectShape}
                        onDeleteShape={deleteShape}
                        onMoveShape={moveShape}
                        onUpdateShape={updateShape}
                        onReorderShape={reorderShape}
                        showTkinterNames={showTkinterNames}
                    />
                </div>
                <div className="flex-[2_2_0%] min-h-0">
                    <PropertyEditor 
                        selectedShape={selectedShape} updateShape={updateShape} deleteShape={deleteShape} duplicateShape={duplicateShape}
                        activeTool={activeTool} activePointIndex={activePointIndex} setActivePointIndex={setActivePointIndex}
                        deletePoint={deletePoint} addPoint={addPoint} convertToPath={convertToPath} showNotification={showNotification}
                        setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview}
                        fillColor={fillColor} strokeColor={strokeColor}
                    />
                </div>
            </aside>}
          </main>

           {isSettingsOpen && (
            <SettingsModal
              initialTab={settingsInitialTab}
              onClose={() => setIsSettingsOpen(false)}
              onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
              onDeleteTemplate={handleDeleteTemplate}
              onRenameTemplate={handleRenameTemplate}
              templates={projectTemplates}
              canvasWidth={canvasWidth} setCanvasWidth={setCanvasWidth} canvasHeight={canvasHeight} setCanvasHeight={setCanvasHeight} 
              canvasBgColor={canvasBgColor} 
              setCanvasBgColor={(color) => { setCanvasBgColor(color); setPreviewCanvasBgColor(null); }}
              setPreviewCanvasBgColor={setPreviewCanvasBgColor}
              canvasVarName={canvasVarName}
              setCanvasVarName={setCanvasVarName}
              gridSize={gridSize} setGridSize={setGridSize} gridSnapStep={gridSnapStep} setGridSnapStep={setGridSnapStep} showTkinterNames={showTkinterNames} setShowTkinterNames={setShowTkinterNames}
              showAxes={showAxes} setShowAxes={setShowAxes} showCursorCoords={showCursorCoords} setShowCursorCoords={setShowCursorCoords}
              showRotationAngle={showRotationAngle} setShowRotationAngle={setShowRotationAngle}
              showLineNumbers={showLineNumbers} setShowLineNumbers={setShowLineNumbers}
              generatorType={generatorType} setGeneratorType={setGeneratorType}
              highlightCodeOnSelection={highlightCodeOnSelection} setHighlightCodeOnSelection={setHighlightCodeOnSelection}
              autoGenerateComments={autoGenerateComments} setAutoGenerateComments={setAutoGenerateComments}
            />
          )}
          {isApiKeyModalOpen && (
            <ApiKeyModal
                isOpen={isApiKeyModalOpen}
                onClose={() => setIsApiKeyModalOpen(false)}
                onSave={handleSaveApiKey}
                currentApiKey={apiKey}
            />
          )}
          {isPreviewOpen && shapesAtGenerationTime && (
            <PreviewModal 
                projectName={projectName}
                shapes={shapesAtGenerationTime} 
                width={canvasWidth} 
                height={canvasHeight} 
                backgroundColor={canvasBgColor} 
                onClose={() => setIsPreviewOpen(false)} 
            />
          )}
           {isExportModalOpen && (
            <ExportModal
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
            />
          )}
           {isNewProjectModalOpen && (
            <NewProjectModal
                onClose={() => setIsNewProjectModalOpen(false)}
                onCreate={handleNewProject}
                initialSettings={{
                    projectName: 'Новий малюнок. ВереTkа',
                    width: canvasWidth,
                    height: canvasHeight,
                    bgColor: '#ffffff',
                    canvasVarName: 'c',
                }}
                templates={projectTemplates}
            />
          )}
          {confirmationAction && (
              <ConfirmationModal
                isOpen={true}
                title={confirmationAction.title}
                message={confirmationAction.message}
                onConfirm={confirmationAction.onConfirm}
                onClose={() => setConfirmationAction(null)}
                confirmText={confirmationAction.confirmText}
                cancelText={confirmationAction.cancelText}
                variant={confirmationAction.variant}
              />
          )}
          {isSaveAsModalOpen && (
            <SaveAsModal
                isOpen={true}
                onClose={() => setIsSaveAsModalOpen(false)}
                onSave={handleSaveProjectAs}
                currentProjectName={projectName}
            />
          )}
          {isSaveCodeModalOpen && (
            <SaveCodeModal
                isOpen={true}
                onClose={() => setIsSaveCodeModalOpen(false)}
                onSave={handleSaveCode}
                currentProjectName={projectName}
            />
          )}
          {isSaveTemplateModalOpen && (
            <SaveTemplateModal
                onClose={() => setIsSaveTemplateModalOpen(false)}
                onSave={handleSaveTemplate}
            />
          )}
          {isAboutModalOpen && (
            <AboutModal
                isOpen={isAboutModalOpen}
                onClose={() => setIsAboutModalOpen(false)}
                version={APP_VERSION}
            />
          )}
           {isHelpModalOpen && (
            <HelpModal
                isOpen={isHelpModalOpen}
                onClose={() => setIsHelpModalOpen(false)}
            />
          )}
          {isFeedbackModalOpen && (
            <FeedbackModal
                onClose={() => setIsFeedbackModalOpen(false)}
                appVersion={APP_VERSION}
            />
          )}
      </div>
    </div>
  );
}