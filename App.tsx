
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { type Shape, type Tool, type DrawMode, PolylineShape, BezierCurveShape, ViewTransform, RectangleShape, ImageShape, IsoscelesTriangleShape, TrapezoidShape, ParallelogramShape, PathShape, CanvasAction, LineShape, PolygonShape, ArcShape, RightTriangleShape, TextShape, BitmapShape, RotatableShape, EllipseShape, type ProjectTemplate, type NewProjectSettings, FillableShape, DistributePathState, DistributeEntity, Layer, GroupShape } from './types';
import Canvas from './components/Canvas';
import CodeDisplay, { type CodeLine } from './components/CodeDisplay';
import PropertyEditor from './components/PropertyEditor';
import ShapeList from './components/ShapeList';
import LayerList from './components/LayerList';
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
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import ApiKeyModal from './components/ApiKeyModal';
import FeedbackModal from './components/FeedbackModal';
import CheatCodeModal from './components/CheatCodeModal';
import { saveFile, generateSvg, exportToRaster, openProjectFile, saveToHandle } from './lib/exportUtils';
import { SquareIcon, CodeIcon, XIcon, AxesIcon, FitToScreenIcon, SelectIcon, EditPointsIcon, RectangleIcon, EllipseIcon, CircleIcon, LineIcon, PolylineIcon, BezierIcon, PolygonIcon, PencilIcon, TriangleIcon, RightTriangleIcon, RhombusIcon, TrapezoidIcon, ParallelogramIcon, PiesliceIcon, ChordIcon, ArcIcon, StarIcon, TextIcon, ImageIcon, BitmapIcon, UndoIcon, RedoIcon, DuplicateIcon, GroupIcon, UngroupIcon, ToolsIcon, TrashIcon, GridIcon, SettingsIcon, DrawFromCornerIcon, DrawFromCenterIcon, CheckIcon, MenuIcon, SunIcon, MoonIcon, HomeIcon, BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, SadMonitorIcon, FullscreenIcon, ExitFullscreenIcon, AlignShapesLeftIcon, AlignShapesCenterHIcon, AlignShapesRightIcon, AlignShapesTopIcon, AlignShapesCenterVIcon, AlignShapesBottomIcon, DistributeHorizontalIcon, DistributeVerticalIcon, ChevronDownIcon, ChevronRightIcon, DistributePathIcon, FlipHorizontalIcon, FlipVerticalIcon, EraserIcon } from './components/icons';
import { getFinalPoints, getVisualBoundingBox, getBoundingBox, getEditablePoints, getShapeCenter, rotatePoint, isShapeClosed, isPathClosed, evaluateShapeContourPointAndTangent } from './lib/geometry';
import { getDefaultNameForShape, isDefaultName } from './lib/constants';
import Ruler from './components/Ruler';
import { ColorInput, Select, NumberInput } from './components/FormControls';
import StatusBar from './components/StatusBar';
import WelcomeScreen from './components/WelcomeScreen';
import { useRecentProjects, type RecentProject } from './hooks/useRecentProjects';
import SaveCodeModal from './components/SaveCodeModal';
import InlineTextEditor from './components/InlineTextEditor';
import SaveTemplateModal from './components/SaveTemplateModal';
import ShareModal from './components/ShareModal';
import { compressProjectToUrl, decompressProjectFromUrl } from './lib/shareUtils';
import { useLanguage } from './components/LanguageContext';

type Theme = 'dark' | 'light';
type GeneratorType = 'local' | 'gemini';
type SettingsTab = 'canvas' | 'grid' | 'appearance' | 'code' | 'templates';

const APP_VERSION = '1.3.15';
const RULER_THICKNESS = 24;
const MIN_SCALE = 0.05;
const MAX_SCALE = 30;
const MIN_SCREEN_WIDTH = 1024; // Minimum width in pixels for the app to be usable
const AUTOSAVE_KEY = 'veretka-autosave-session';
const AUTOSAVE_INTERVAL = 2 * 60 * 1000; // 2 minutes

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
    const toggle = () => setIsOpen((prev: any) => !prev);
    
    const wrapperProps = {
        ref: dropdownRef,
        onMouseLeave: close,
    };

    return { isOpen, toggle, close, wrapperProps };
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

const MenuBar: React.FC<{
    onGenerate: () => void;
    showGenerateButton: boolean;
    onNewProject: () => void;
    onSaveProject: () => void;
    canSave: boolean;
    onSaveProjectAs: () => void;
    onSaveAsTemplate: () => void;
    onLoadProject: () => void;
    onImportImage: () => void;
    onExport: () => void;
    onShareLink?: () => void;
    showShareLink?: boolean;
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
    showCenterGuides: boolean;
    setShowCenterGuides: (show: boolean) => void;
    enableSnapping: boolean;
    setEnableSnapping: (show: boolean) => void;
    onOpenSettings: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    projectName: string;
    isProjectActive: boolean;
    onGoHome: () => void;
    onOpenAbout: () => void;
    onOpenHelp: () => void;
    onOpenShortcuts: () => void;
    onOpenFeedback: () => void;
    isDistributingPath: boolean;
    onGroup?: () => void;
    canGroup?: boolean;
    onUngroup?: () => void;
    canUngroup?: boolean;
    onExtractFromGroup?: () => void;
    canExtractFromGroup?: boolean;
    onFlipH?: () => void;
    onFlipV?: () => void;
    canFlip?: boolean;
}> = React.memo((props) => {
    const { isOpen: isFileOpen, toggle: toggleFile, close: closeFile, wrapperProps: fileProps } = useDropdown();
    const { isOpen: isEditOpen, toggle: toggleEdit, close: closeEdit, wrapperProps: editProps } = useDropdown();
    const { isOpen: isObjectOpen, toggle: toggleObject, close: closeObject, wrapperProps: objectProps } = useDropdown();
    const { isOpen: isViewOpen, toggle: toggleView, close: closeView, wrapperProps: viewProps } = useDropdown();
    const { isOpen: isHelpOpen, toggle: toggleHelp, close: closeHelp, wrapperProps: helpProps } = useDropdown();
    const { t } = useLanguage();
    
    const handleMenuClick = (action: (() => void) | undefined, closeMenu: () => void) => {
        if (typeof action === 'function') {
            action();
        }
        closeMenu();
    };
    
    return (
        <nav className="bg-[var(--bg-primary)] text-sm font-medium flex items-center px-2 select-none h-8 flex-shrink-0">
            <div className="flex items-center">
                 {props.isProjectActive && (
                    <>
                        <button 
                            onClick={props.onGoHome} 
                            title={t('menu.home')}
                            className="px-2 py-1 rounded-md hover:bg-[var(--bg-secondary)]"
                        >
                            <HomeIcon size={18}/>
                        </button>
                        <div className="w-px h-5 bg-[var(--border-secondary)] mx-1"></div>
                    </>
                )}
                {/* File Menu */}
                <div {...fileProps} className="relative">
                    <button onClick={toggleFile} className={`px-3 py-1 rounded-md ${isFileOpen ? 'bg-[var(--bg-secondary)]' : 'hover:bg-[var(--bg-secondary)]'}`}>{t('menu.file')}</button>
                    {isFileOpen && (
                        <div className="absolute top-full left-0 mt-0 w-56 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-50 border border-[var(--border-secondary)]">
                            <MenuItem onClick={() => handleMenuClick(props.onNewProject, closeFile)}>{t('menu.file.new')}</MenuItem>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            <MenuItem onClick={() => handleMenuClick(props.onSaveProject, closeFile)} disabled={!props.canSave} shortcut="Ctrl+S">{t('menu.file.save')}</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onSaveProjectAs, closeFile)} disabled={!props.isProjectActive}>{t('menu.file.saveAs')}</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onSaveAsTemplate, closeFile)} disabled={!props.isProjectActive}>{t('menu.file.saveTemplate')}</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onLoadProject, closeFile)}>{t('menu.file.load')}</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onImportImage, closeFile)} disabled={!props.isProjectActive}>{t('menu.file.importImage')}</MenuItem>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            <MenuItem onClick={() => handleMenuClick(props.onExport, closeFile)} disabled={!props.isProjectActive}>{t('menu.file.export')}</MenuItem>
                            {props.showShareLink && <MenuItem onClick={() => handleMenuClick(props.onShareLink, closeFile)} disabled={!props.isProjectActive}>{t('menu.file.shareLink')}</MenuItem>}
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            {props.showGenerateButton && <MenuItem onClick={() => handleMenuClick(props.onGenerate, closeFile)} disabled={!props.isProjectActive}>{t('menu.file.generate')}</MenuItem>}
                        </div>
                    )}
                </div>
                 {/* Edit Menu */}
                <div {...editProps} className="relative">
                    <button onClick={toggleEdit} disabled={!props.isProjectActive} className={`px-3 py-1 rounded-md ${isEditOpen ? 'bg-[var(--bg-secondary)]' : 'hover:bg-[var(--bg-secondary)]'} disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent`}>{t('menu.edit')}</button>
                    {isEditOpen && props.isProjectActive && (
                        <div className="absolute top-full left-0 mt-0 w-56 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-50 border border-[var(--border-secondary)]">
                            <MenuItem onClick={() => handleMenuClick(props.onUndo, closeEdit)} disabled={!props.canUndo} shortcut="Ctrl+Z">{t('menu.edit.undo')}</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onRedo, closeEdit)} disabled={!props.canRedo} shortcut="Ctrl+Y">{t('menu.edit.redo')}</MenuItem>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            <MenuItem onClick={() => handleMenuClick(props.onDuplicate, closeEdit)} disabled={!props.isShapeSelected || props.isDistributingPath} shortcut="Ctrl+D">{t('menu.edit.duplicate')}</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onDelete, closeEdit)} disabled={!props.isShapeSelected || props.isDistributingPath} shortcut="Del">{t('menu.edit.delete')}</MenuItem>
                        </div>
                    )}
                </div>
                 {/* Object Menu */}
                <div {...objectProps} className="relative">
                    <button onClick={toggleObject} disabled={!props.isProjectActive} className={`px-3 py-1 rounded-md ${isObjectOpen ? 'bg-[var(--bg-secondary)]' : 'hover:bg-[var(--bg-secondary)]'} disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent`}>{t('menu.object')}</button>
                    {isObjectOpen && props.isProjectActive && (
                        <div className="absolute top-full left-0 mt-0 w-56 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-50 border border-[var(--border-secondary)]">
                            <MenuItem onClick={() => handleMenuClick(props.onGroup, closeObject)} disabled={!props.canGroup} shortcut="Ctrl+G">{t('menu.edit.group')}</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onUngroup, closeObject)} disabled={!props.canUngroup} shortcut="Ctrl+Shift+G">{t('menu.edit.ungroup')}</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onExtractFromGroup, closeObject)} disabled={!props.canExtractFromGroup}>{t('menu.edit.extractFromGroup')}</MenuItem>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            <MenuItem onClick={() => handleMenuClick(props.onFlipH, closeObject)} disabled={!props.canFlip} shortcut="Ctrl+H">{t('menu.edit.flipH')}</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onFlipV, closeObject)} disabled={!props.canFlip} shortcut="Ctrl+V">{t('menu.edit.flipV')}</MenuItem>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            <MenuItem onClick={() => handleMenuClick(props.onConvertToPath, closeObject)} disabled={!props.canConvertToPath}>{t('menu.object.toPath')}</MenuItem>
                        </div>
                    )}
                </div>
                 {/* View Menu */}
                <div {...viewProps} className="relative">
                    <button onClick={toggleView} className={`px-3 py-1 rounded-md ${isViewOpen ? 'bg-[var(--bg-secondary)]' : 'hover:bg-[var(--bg-secondary)]'}`}>{t('menu.view')}</button>
                    {isViewOpen && (
                        <div className="absolute top-full left-0 mt-0 w-56 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-50 border border-[var(--border-secondary)]">
                            <MenuItem onClick={() => handleMenuClick(props.onFitCanvasToView, closeView)} disabled={!props.isProjectActive}>{t('menu.view.fit')}</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onToggleFullscreen, closeView)} shortcut="F11">
                                {props.isFullscreen ? t('menu.view.exitFullscreen') : t('menu.view.fullscreen')}
                            </MenuItem>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            <MenuCheckbox checked={props.showGrid} onChange={props.setShowGrid}>{t('menu.view.grid')}</MenuCheckbox>
                            <MenuCheckbox checked={props.snapToGrid} onChange={props.setSnapToGrid}>{t('menu.view.snap')}</MenuCheckbox>
                            <MenuCheckbox checked={props.showAxes} onChange={props.setShowAxes}>{t('menu.view.rulers')}</MenuCheckbox>
                            <MenuCheckbox checked={props.showCenterGuides} onChange={props.setShowCenterGuides}>{t('settings.appearance.showCenterGuides')}</MenuCheckbox>
                            <MenuCheckbox checked={props.enableSnapping} onChange={props.setEnableSnapping}>{t('settings.appearance.enableSnapping')}</MenuCheckbox>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            <div className="px-3 py-1.5 text-xs text-[var(--text-tertiary)]">{t('menu.view.theme')}</div>
                            <MenuItem onClick={() => {props.setTheme('dark'); closeView()}} selected={props.theme === 'dark'}>{t('menu.view.theme.dark')}</MenuItem>
                            <MenuItem onClick={() => {props.setTheme('light'); closeView()}} selected={props.theme === 'light'}>{t('menu.view.theme.light')}</MenuItem>
                        </div>
                    )}
                </div>
                 {/* Help Menu */}
                <div {...helpProps} className="relative">
                    <button onClick={toggleHelp} className={`px-3 py-1 rounded-md ${isHelpOpen ? 'bg-[var(--bg-secondary)]' : 'hover:bg-[var(--bg-secondary)]'}`}>{t('menu.help')}</button>
                    {isHelpOpen && (
                        <div className="absolute top-full left-0 mt-0 w-56 bg-[var(--bg-secondary)] rounded-md shadow-lg py-1 z-50 border border-[var(--border-secondary)]">
                            <MenuItem onClick={() => handleMenuClick(props.onOpenAbout, closeHelp)}>{t('menu.help.about')}</MenuItem>
                            <hr className="border-[var(--border-secondary)] my-1"/>
                            <MenuItem onClick={() => handleMenuClick(props.onOpenHelp, closeHelp)}>{t('menu.help.manual')}</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onOpenShortcuts, closeHelp)} shortcut="?">{t('menu.help.shortcuts')}</MenuItem>
                            <MenuItem onClick={() => handleMenuClick(props.onOpenFeedback, closeHelp)}>{t('menu.help.feedback')}</MenuItem>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-grow flex justify-center items-center text-sm text-[var(--text-tertiary)] truncate px-4">
                <span className="truncate" title={props.projectName}>{props.isProjectActive ? props.projectName : ''}</span>
            </div>
            
            <div className="flex items-center gap-2">
                <button onClick={() => props.setTheme(props.theme === 'dark' ? 'light' : 'dark')} title={t('menu.view.theme')} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
                    {props.theme === 'dark' ? <SunIcon size={18}/> : <MoonIcon size={18}/>}
                </button>
                <button onClick={props.onToggleFullscreen} title={props.isFullscreen ? `${t('menu.view.exitFullscreen')} (F11)` : `${t('menu.view.fullscreen')} (F11)`} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
                    {props.isFullscreen ? <ExitFullscreenIcon size={18}/> : <FullscreenIcon size={18}/>}
                </button>
                <div className="relative">
                    <button onClick={props.onOpenSettings} className={`flex items-center gap-2 px-3 py-1 rounded-md hover:bg-[var(--bg-secondary)]`}>
                        <SettingsIcon size={16}/>
                        <span>{t('menu.settings')}</span>
                    </button>
                </div>
            </div>
        </nav>
    );
});

const LeftToolbar: React.FC<{
    activeTool: Tool;
    setActiveTool: (tool: Tool) => void;
    activeCheats: Set<string>;
}> = React.memo(({ activeTool, setActiveTool, activeCheats }) => {
    const iconSize = 18;
    const { t } = useLanguage();
    
    const tools: { name: Tool; label: string; icon: React.ReactNode; group: number; disabled?: boolean }[] = [
        // Group 1: Primitives
        { name: 'rectangle', label: t('tool.rectangle'), icon: <RectangleIcon size={iconSize} />, group: 1 },
        { name: 'square', label: t('tool.square'), icon: <SquareIcon size={iconSize} />, group: 1 },
        { name: 'ellipse', label: t('tool.ellipse'), icon: <EllipseIcon size={iconSize} />, group: 1 },
        { name: 'circle', label: t('tool.circle'), icon: <CircleIcon size={iconSize} />, group: 1 },
        { name: 'line', label: t('tool.line'), icon: <LineIcon size={iconSize} />, group: 2 },
        { name: 'polyline', label: t('tool.polyline'), icon: <PolylineIcon size={iconSize} />, group: 2 },
        { name: 'bezier', label: t('tool.bezier'), icon: <BezierIcon size={iconSize} />, group: 2 },
        { name: 'arc', label: t('tool.arc'), icon: <ArcIcon size={iconSize} />, group: 2 },
        { name: 'pieslice', label: t('tool.pieslice'), icon: <PiesliceIcon size={iconSize} />, group: 2 },
        { name: 'chord', label: t('tool.chord'), icon: <ChordIcon size={iconSize} />, group: 2 },
        // Group 3: Polygons
        { name: 'polygon', label: t('tool.polygon'), icon: <PolygonIcon size={iconSize} />, group: 3 },
        { name: 'star', label: t('tool.star'), icon: <StarIcon size={iconSize} />, group: 3 },
        { name: 'triangle', label: t('tool.triangle'), icon: <TriangleIcon size={iconSize} />, group: 3 },
        { name: 'right-triangle', label: t('tool.rightTriangle'), icon: <RightTriangleIcon size={iconSize} />, group: 3 },
        { name: 'rhombus', label: t('tool.rhombus'), icon: <RhombusIcon size={iconSize} />, group: 3 },
        { name: 'trapezoid', label: t('tool.trapezoid'), icon: <TrapezoidIcon size={iconSize} />, group: 3 },
        { name: 'parallelogram', label: t('tool.parallelogram'), icon: <ParallelogramIcon size={iconSize} />, group: 3 },
        { name: 'text', label: t('tool.text'), icon: <TextIcon size={iconSize} />, group: 3 },
        // Group 4: Other
        { name: 'pencil', label: t('tool.pencil'), icon: <PencilIcon size={iconSize} />, group: 4 },
        { name: 'image', label: t('tool.image'), icon: <ImageIcon size={iconSize} />, group: 4, disabled: !activeCheats.has('001') && !activeCheats.has('002') },
        { name: 'bitmap', label: t('tool.bitmap'), icon: <BitmapIcon size={iconSize} />, group: 4, disabled: true },
    ];

    return (
        <aside className="bg-[var(--bg-primary)] rounded-lg p-1 flex flex-col items-center">
            <div className="grid grid-cols-10 gap-0.5 w-full" role="group" aria-label={t('app.1100')}>
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

const PropertyControl: React.FC<{label: string, htmlFor: string, children: React.ReactNode, className?: string}> = ({label, htmlFor, children, className}) => (
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
  const { t } = useLanguage();
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
          <button title={t('prop.drawMode.corner')} onClick={() => setDrawMode('corner')} className={`p-1.5 rounded ${drawMode === 'corner' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><DrawFromCornerIcon/></button>
          <button title={t('prop.drawMode.center')} onClick={() => setDrawMode('center')} className={`p-1.5 rounded ${drawMode === 'center' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><DrawFromCenterIcon/></button>
        </div>
      )}
      {showFill && (
        <PropertyControl label={t('prop.fill')} htmlFor="fillColor">
          <input id="fillEnable" type="checkbox" checked={isFillEnabled && !isFillForToolDisabled} onChange={e => setIsFillEnabled(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" disabled={isFillForToolDisabled} />
          <ColorInput id="fillColor" value={fillColor} onChange={setFillColor} onPreview={setPreviewFillColor} onCancel={handleCancelFillPreview} disabled={!isFillEnabled || isFillForToolDisabled} />
        </PropertyControl>
      )}
      {showStroke && (
        <>
          <PropertyControl label={t('prop.stroke')} htmlFor="strokeColor">
            <input id="strokeEnable" type="checkbox" checked={isStrokeEnabled} onChange={e => setIsStrokeEnabled(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
            <ColorInput id="strokeColor" value={strokeColor} onChange={setStrokeColor} onPreview={setPreviewStrokeColor} onCancel={handleCancelStrokePreview} disabled={!isStrokeEnabled} />
          </PropertyControl>
          <PropertyControl label={t('prop.width')} htmlFor="strokeWidth">
            <div className="w-16">
                <NumberInput id="strokeWidth" min={1} max={100} value={strokeWidth} onChange={setStrokeWidth} disabled={!isStrokeEnabled} />
            </div>
          </PropertyControl>
        </>
      )}
      {showSides && (
        <PropertyControl label={t('prop.sides')} htmlFor="sides">
          <div className="w-20">
            <NumberInput id="sides" min={3} max={50} value={numberOfSides} onChange={setNumberOfSides} />
          </div>
        </PropertyControl>
      )}
      {showTextControls && (
        <>
          <PropertyControl label={t('prop.color')} htmlFor="textColor">
            <ColorInput id="textColor" value={textColor} onChange={setTextColor} onPreview={setPreviewTextColor} onCancel={handleCancelTextPreview} />
          </PropertyControl>
          <PropertyControl label={t('prop.font')} htmlFor="textFont">
            <Select id="textFont" value={textFont} onChange={setTextFont} className="w-32 py-0.5">
              {Object.entries(standardWebFonts).map(([group, fonts]) => (
                <optgroup label={group} key={group}>{fonts.map(f => <option key={f} value={f}>{f}</option>)}</optgroup>
              ))}
              <optgroup label={t('app.1101')}>{tkFonts.map(f => <option key={f} value={f}>{f}</option>)}</optgroup>
            </Select>
          </PropertyControl>
          <PropertyControl label={t('prop.size')} htmlFor="textFontSize">
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
  allShapes: Shape[];
  selectedShapes: Shape[];
  updateShape: (s: Shape) => void;
  updateShapes: (shapes: Shape[]) => void;
  setShapePreview: (shapeId: string, overrides: Partial<Shape>) => void;
  cancelShapePreview: () => void;
  fillColor: string;
  strokeColor: string;
};

const ContextualControls: React.FC<ContextualControlsProps> = ({ allShapes, selectedShapes, updateShape, updateShapes, setShapePreview, cancelShapePreview, fillColor, strokeColor }) => {
  const { t } = useLanguage();
  const standardWebFonts = { "Sans-Serif": ["Arial", "Calibri", "Helvetica", "Segoe UI", "Tahoma", "Trebuchet MS", "Verdana"], "Serif": ["Times New Roman", "Georgia", "Garamond"], "Monospace": ["Courier New", "Consolas", "Lucida Console", "Monaco"], };
  const tkFonts = ["TkDefaultFont", "TkTextFont", "TkFixedFont", "TkMenuFont", "TkHeadingFont", "TkCaptionFont", "TkSmallCaptionFont", "TkIconFont", "TkTooltipFont"];

  const effectiveShapes = useMemo(() => {
    const getChildren = (shapeIds: string[]): Shape[] => {
      let res: Shape[] = [];
      shapeIds.forEach((id: string) => {
        const s = allShapes.find(x => x.id === id);
        if (s) {
          if (s.type === 'group') {
            res = res.concat(getChildren((s as any).shapeIds || []));
          } else {
            res.push(s);
          }
        }
      });
      return res;
    };
    
    let res: Shape[] = [];
    selectedShapes.forEach((s: any) => {
      if (s.type === 'group') {
        res = res.concat(getChildren((s as any).shapeIds || []));
      } else {
        res.push(s);
      }
    });
    return res;
  }, [selectedShapes, allShapes]);

  const handleUpdate = (propsToUpdate: Partial<Shape>) => {
      if (!effectiveShapes.length) return;
      const updatedShapes = effectiveShapes.map((s: any) => ({ ...s, ...propsToUpdate } as Shape));
      if (typeof updateShapes === 'function') {
          updateShapes(updatedShapes);
      } else {
          updatedShapes.forEach((s: any) => updateShape(s));
      }
  }
  const handleFillToggle = (checked: boolean) => {
    const fillable = effectiveShapes.find((s: any) => 'fill' in s);
    if (fillable) {
      if (checked) {
        const colorToRestore = (fillable as any)._previousFill || fillColor;
        handleUpdate({ fill: colorToRestore });
      } else {
        handleUpdate({ fill: 'none', _previousFill: (fillable as any).fill });
      }
    }
  };
  const handleStrokeToggle = (checked: boolean) => {
      const strokable = effectiveShapes.find((s: any) => 'stroke' in s);
      if (!strokable) return;
      if (checked) {
        const colorToRestore = (strokable as any)._previousStroke || strokeColor;
        handleUpdate({ stroke: colorToRestore });
    } else {
        handleUpdate({ stroke: 'none', _previousStroke: strokable.stroke });
    }
  };

  const hasFill = effectiveShapes.some((s: any) => 'fill' in s && s.type !== 'text');
  const isFillDisabledForShape = useMemo(() => {
    if (!effectiveShapes.length) return true;
    return effectiveShapes.every((s: any) => {
        if (s.type === 'arc' && (s as any).style === 'arc') return true;
        if ((s.type === 'polyline' || s.type === 'bezier') && !(s as any).isClosed) return true;
        return false;
    });
  }, [effectiveShapes]);
  const hasStroke = effectiveShapes.some((s: any) => 'stroke' in s && 'strokeWidth' in s && !['image', 'bitmap', 'text'].includes(s.type));
  const hasSides = effectiveShapes.some((s: any) => s.type === 'polygon' || s.type === 'star');
  const isText = effectiveShapes.some((s: any) => s.type === 'text');

  // Compute common properties for multi selection
  const commonFill = hasFill && effectiveShapes.filter((s: any) => 'fill' in s && s.type !== 'text').every((s: any, _, arr) => (s as any).fill === (arr[0] as any).fill) ? (effectiveShapes.find((s: any) => 'fill' in s && s.type !== 'text') as any)?.fill : '';
  const commonStroke = hasStroke && effectiveShapes.filter((s: any) => 'stroke' in s && 'strokeWidth' in s).every((s: any, _, arr) => s.stroke === arr[0].stroke) ? effectiveShapes.find((s: any) => 'stroke' in s)?.stroke : '';
  const commonStrokeWidth = hasStroke && effectiveShapes.filter((s: any) => 'strokeWidth' in s).every((s: any, _, arr) => (s as any).strokeWidth === (arr[0] as any).strokeWidth) ? (effectiveShapes.find((s: any) => 'strokeWidth' in s) as any)?.strokeWidth : '';
  const commonSides = hasSides && effectiveShapes.filter((s: any) => 'sides' in s).every((s: any, _, arr) => (s as any).sides === (arr[0] as any).sides) ? (effectiveShapes.find((s: any) => 'sides' in s) as any)?.sides : '';

  const firstTextShape = effectiveShapes.find((s: any) => s.type === 'text') as TextShape | undefined;

  const round = (num: number) => Math.round(num * 100) / 100;

  return (
      <>
          {hasFill && (
              <PropertyControl label={t('prop.fill')} htmlFor={'ctx-fill'}>
                   <input type="checkbox" checked={commonFill !== 'none' && !isFillDisabledForShape} onChange={e => handleFillToggle(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" disabled={isFillDisabledForShape} />
                  <ColorInput id={'ctx-fill'} value={commonFill === 'none' ? '#000000' : commonFill} onChange={v => handleUpdate({ fill: v })} onPreview={v => effectiveShapes.forEach((s: any) => setShapePreview(s.id, { fill: v ?? undefined }))} onCancel={cancelShapePreview} disabled={commonFill === 'none' || isFillDisabledForShape} placeholder={commonFill === '' ? (t('props.mixed') || 'Різні') : undefined} />
              </PropertyControl>
          )}
          {hasStroke && (
              <>
                  <PropertyControl label={t('prop.stroke')} htmlFor={'ctx-stroke'}>
                       <input type="checkbox" checked={commonStroke !== 'none'} onChange={e => handleStrokeToggle(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
                      <ColorInput id={'ctx-stroke'} value={commonStroke === 'none' ? '#ffffff' : commonStroke} onChange={v => handleUpdate({ stroke: v })} onPreview={v => effectiveShapes.forEach((s: any) => setShapePreview(s.id, { stroke: v ?? undefined }))} onCancel={cancelShapePreview} disabled={commonStroke === 'none'} placeholder={commonStroke === '' ? (t('props.mixed') || 'Різні') : undefined} />
                  </PropertyControl>
                  <PropertyControl label={t('prop.width')} htmlFor={'ctx-strokeWidth'}>
                    <div className="w-20">
                      <NumberInput id={'ctx-strokeWidth'} min={0} value={commonStrokeWidth as any} onChange={v => handleUpdate({ strokeWidth: v })} disabled={commonStroke === 'none'} placeholder={commonStrokeWidth === '' ? (t('props.mixed') || 'Різні') : undefined} />
                    </div>
                  </PropertyControl>
              </>
          )}
          {hasSides && (
               <PropertyControl label={t('prop.sides')} htmlFor={'ctx-sides'}>
                    <div className="w-20">
                        <NumberInput id={'ctx-sides'} min={3} max={50} value={commonSides as any} onChange={v => handleUpdate({ sides: v })} placeholder={commonSides === '' ? (t('props.mixed') || 'Різні') : undefined} />
                    </div>
              </PropertyControl>
          )}
          {isText && firstTextShape && (
              <>
                  <PropertyControl label={t('prop.color')} htmlFor={`${firstTextShape.id}-ctx-fill`}>
                      <ColorInput id={`${firstTextShape.id}-ctx-fill`} value={firstTextShape.fill} onChange={v => handleUpdate({ fill: v })} onPreview={v => effectiveShapes.forEach((s: any) => { if (s.type === 'text') setShapePreview(s.id, { fill: v ?? undefined }); })} onCancel={cancelShapePreview} />
                  </PropertyControl>
                  <PropertyControl label={t('prop.font')} htmlFor={`${firstTextShape.id}-ctx-font`}>
                     <Select id={`${firstTextShape.id}-ctx-font`} value={firstTextShape.font} onChange={v => handleUpdate({ font: v })} className="w-32 py-0.5">
                          {Object.entries(standardWebFonts).map(([group, fonts]) => (<optgroup label={group} key={group}>{fonts.map(f => <option key={f} value={f}>{f}</option>)}</optgroup>))}
                          <optgroup label={t('app.1101')}>{tkFonts.map(f => <option key={f} value={f}>{f}</option>)}</optgroup>
                      </Select>
                  </PropertyControl>
                  <PropertyControl label={t('prop.size')} htmlFor={`${firstTextShape.id}-ctx-fontSize`}>
                        <div className="w-20">
                            <NumberInput id={`${firstTextShape.id}-ctx-fontSize`} min={1} value={round(firstTextShape.fontSize)} onChange={v => handleUpdate({ fontSize: v })} />
                        </div>
                  </PropertyControl>
                  <div className="flex items-center gap-0.5 bg-[var(--bg-app)] p-0.5 rounded-md">
                      <button title={t('style.bold')} onClick={() => handleUpdate({ weight: firstTextShape.weight === 'bold' ? 'normal' : 'bold' })} className={`p-1.5 rounded ${firstTextShape.weight === 'bold' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><BoldIcon size={16}/></button>
                      <button title={t('style.italic')} onClick={() => handleUpdate({ slant: firstTextShape.slant === 'italic' ? 'roman' : 'italic' })} className={`p-1.5 rounded ${firstTextShape.slant === 'italic' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><ItalicIcon size={16}/></button>
                      <button title={t('style.underline')} onClick={() => handleUpdate({ underline: !firstTextShape.underline })} className={`p-1.5 rounded ${firstTextShape.underline ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><UnderlineIcon size={16}/></button>
                      <button title={t('style.strikethrough')} onClick={() => handleUpdate({ overstrike: !firstTextShape.overstrike })} className={`p-1.5 rounded ${firstTextShape.overstrike ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><StrikethroughIcon size={16}/></button>
                  </div>
                   <div className="flex items-center gap-0.5 bg-[var(--bg-app)] p-0.5 rounded-md ml-2">
                      <button title={t('align.left')} onClick={() => handleUpdate({ justify: 'left' })} className={`p-1.5 rounded ${firstTextShape.justify === 'left' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><AlignLeftIcon size={16}/></button>
                      <button title={t('align.center')} onClick={() => handleUpdate({ justify: 'center' })} className={`p-1.5 rounded ${firstTextShape.justify === 'center' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><AlignCenterIcon size={16}/></button>
                      <button title={t('align.right')} onClick={() => handleUpdate({ justify: 'right' })} className={`p-1.5 rounded ${firstTextShape.justify === 'right' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}><AlignRightIcon size={16}/></button>
                  </div>
              </>
          )}
      </>
  );
}


const DistributePathTopControls: React.FC<{
    distributePathState: DistributePathState,
    onDistributePathChange: (s: DistributePathState) => void,
    isSelectingPathShape?: boolean,
    onToggleSelectPathShape?: () => void
}> = ({ distributePathState, onDistributePathChange, isSelectingPathShape, onToggleSelectPathShape }) => {
    const { t } = useLanguage();
    return (
        <div className="flex items-center gap-3">
             <PropertyControl label={t('prop.pathType') || 'Тип шляху'} htmlFor="dist-path-type">
                  <Select id="dist-path-type" className="w-32 py-1" value={distributePathState.type} onChange={(v) => {
                      const newType = v as 'circle' | 'line' | 'shape';
                      let newOrientationType = distributePathState.orientationType;
                      if (newType === 'circle' && (newOrientationType === 'parallel' || newOrientationType === 'perpendicular')) {
                          newOrientationType = newOrientationType === 'parallel' ? 'tangent' : 'radial';
                      } else if ((newType === 'line' || newType === 'shape') && (newOrientationType === 'tangent' || newOrientationType === 'radial')) {
                          newOrientationType = newOrientationType === 'tangent' ? 'parallel' : 'perpendicular';
                      }
                      const updatedState: DistributePathState = {
                          ...distributePathState,
                          type: newType,
                          orientationType: newOrientationType
                      };
                      if (newType === 'shape' && !updatedState.shapePathParams) {
                          updatedState.shapePathParams = { keepShape: false };
                      }
                      onDistributePathChange(updatedState);
                  }}>
                      <option value="circle">{t('tool.distribute.path.circle') || 'Коло'}</option>
                      <option value="line">{t('tool.distribute.path.line') || 'Пряма'}</option>
                      <option value="shape">{t('tool.distribute.path.shape') || 'Фігура (контур)'}</option>
                  </Select>
             </PropertyControl>

             {distributePathState.type === 'shape' && (
                 <>
                     <button
                         type="button"
                         onClick={onToggleSelectPathShape}
                         className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 ${
                             isSelectingPathShape
                                 ? 'bg-[var(--accent-primary)] text-white border-transparent animate-pulse'
                                 : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                         }`}
                         title={t('tool.distribute.path.selectShapeBtn') || 'Обрати фігуру'}
                     >
                         <span>
                             {isSelectingPathShape
                                 ? (t('tool.distribute.path.selectShapeActive') || 'Клікніть фігуру...')
                                 : (distributePathState.shapePathParams?.pathShape
                                     ? `${t('tool.distribute.path.shape')}: ${distributePathState.shapePathParams.pathShape.name || distributePathState.shapePathParams.pathShape.type}`
                                     : (t('tool.distribute.path.selectShapeBtn') || 'Обрати фігуру на полотні'))}
                         </span>
                     </button>

                     {distributePathState.shapePathParams?.pathShape && (distributePathState.shapePathParams.pathShape.type === 'polygon' || distributePathState.shapePathParams.pathShape.type === 'star') && (
                         <PropertyControl label={t('prop.sides') || 'Сторони'} htmlFor="dist-top-path-sides">
                             <input 
                                 id="dist-top-path-sides"
                                 type="number"
                                 className="w-16 py-1 px-2 rounded border bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] text-xs"
                                 value={(distributePathState.shapePathParams.pathShape as any).sides}
                                 min={3}
                                 onChange={e => onDistributePathChange({
                                     ...distributePathState,
                                     shapePathParams: {
                                         ...distributePathState.shapePathParams,
                                         pathShape: {
                                             ...distributePathState.shapePathParams!.pathShape!,
                                             sides: parseInt(e.target.value) || 3
                                         } as any
                                     }
                                 })}
                             />
                         </PropertyControl>
                     )}

                     {distributePathState.shapePathParams?.pathShape && distributePathState.shapePathParams.pathShape.type === 'star' && (
                         <PropertyControl label={t('prop.innerRadius') || 'Внутрішній радіус'} htmlFor="dist-top-path-inner-radius">
                             <input 
                                 id="dist-top-path-inner-radius"
                                 type="number"
                                 className="w-16 py-1 px-2 rounded border bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] text-xs"
                                 value={Math.round((distributePathState.shapePathParams.pathShape as any).innerRadius ?? ((distributePathState.shapePathParams.pathShape as any).radius / 2))}
                                 min={0}
                                 onChange={e => onDistributePathChange({
                                     ...distributePathState,
                                     shapePathParams: {
                                         ...distributePathState.shapePathParams,
                                         pathShape: {
                                             ...distributePathState.shapePathParams!.pathShape!,
                                             innerRadius: parseInt(e.target.value) || 0
                                         } as any
                                     }
                                 })}
                             />
                         </PropertyControl>
                     )}
                 </>
             )}
             
             <PropertyControl label={t('prop.orientAlongPath') || 'Орієнтувати'} htmlFor="dist-orient-check">
                  <input type="checkbox" id="dist-orient-check" checked={!!distributePathState.orientAlongPath} onChange={(e) => onDistributePathChange({ ...distributePathState, orientAlongPath: e.target.checked })} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
             </PropertyControl>

             {distributePathState.orientAlongPath && (
                  <PropertyControl label="" htmlFor="dist-orient-type">
                      <Select id="dist-orient-type" className="w-28 py-1" value={distributePathState.orientationType} onChange={(v) => onDistributePathChange({ ...distributePathState, orientationType: v as any })}>
                          {distributePathState.type === 'circle' ? (
                              <>
                                  <option value="radial">{t('tool.distribute.path.radial') || 'Радіально'}</option>
                                  <option value="tangent">{t('tool.distribute.path.tangent') || 'Дотично'}</option>
                                  <option value="custom">{t('tool.distribute.path.customAngle') || 'Власний кут'}</option>
                              </>
                          ) : (
                              <>
                                  <option value="parallel">{t('tool.distribute.path.parallel') || 'Паралельно'}</option>
                                  <option value="perpendicular">{t('tool.distribute.path.perpendicular') || 'Перпендикулярно'}</option>
                                  <option value="custom">{t('tool.distribute.path.customAngle') || 'Власний кут'}</option>
                              </>
                          )}
                      </Select>
                  </PropertyControl>
             )}

             <PropertyControl label={t('prop.rotateAlongPath') || 'Обертати'} htmlFor="dist-rotate-check" className={distributePathState.orientAlongPath ? 'opacity-50 pointer-events-none' : ''}>
                  <input type="checkbox" id="dist-rotate-check" checked={!!distributePathState.rotateAlongPath} disabled={!!distributePathState.orientAlongPath} onChange={(e) => onDistributePathChange({ ...distributePathState, rotateAlongPath: e.target.checked })} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
             </PropertyControl>
        </div>
    );
};

const TopToolbar: React.FC<{
    allShapes: Shape[];
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
    onGroup: () => void; canGroup?: boolean;
    onUngroup: () => void; canUngroup?: boolean;
    onExtractFromGroup?: () => void; canExtractFromGroup?: boolean;
    onFlipH: () => void; onFlipV: () => void; canFlip?: boolean;
    onAlignShapes: (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom' | 'distribute-h' | 'distribute-v' | 'distribute-path', relativeTo: 'selection' | 'canvas', distributeOptions?: { orientAlongPath: boolean, orientationType: 'radial' | 'tangent' | 'parallel' | 'perpendicular' | 'custom', orientationAngle: number, rotateAlongPath: boolean }) => void;
    activeTool: Tool; setActiveTool: (tool: Tool) => void;
    onOpenMobileLeft: () => void; onOpenMobileRight: () => void;
    selectedShapes: Shape[];
    updateShape: (s: Shape) => void;
    updateShapes: (shapes: Shape[]) => void;
    setShapePreview: (shapeId: string, overrides: Partial<Shape>) => void;
    cancelShapePreview: () => void;
    textColor: string; setTextColor: (c: string) => void;
    setPreviewTextColor: (c: string | null) => void;
    textFont: string; setTextFont: (f: string) => void;
    textFontSize: number; setTextFontSize: (s: number) => void;
    isDistributingPath: boolean;
    distributePathState?: DistributePathState | null;
    onDistributePathChange?: (state: DistributePathState) => void;
    isSelectingPathShape?: boolean;
    onToggleSelectPathShape?: () => void;
}> = React.memo((props) => {
    const { 
        isGenerating, hasShapes, onUndo, onRedo, canUndo, canRedo, onDuplicate, onGroup, canGroup, onUngroup, canUngroup, onExtractFromGroup, canExtractFromGroup, onFlipH, onFlipV, canFlip, onAlignShapes, isShapeSelected, onOpenMobileLeft, onOpenMobileRight,
        selectedShapes, activeTool, setActiveTool, onGenerate, showGenerateButton, onClear, isDistributingPath, distributePathState, onDistributePathChange,
        isSelectingPathShape, onToggleSelectPathShape
    } = props;
    const { t } = useLanguage();
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
    const [isAlignMenuOpen, setIsAlignMenuOpen] = useState(false);
    const [alignRelativeTo, setAlignRelativeTo] = useState<'selection' | 'canvas'>('selection');

    useEffect(() => {
        if (isDistributingPath) {
            setAlignRelativeTo('canvas');
        }
    }, [isDistributingPath]);
    
    // Distribute path settings
    const [orientAlongPath, setOrientAlongPath] = useState(false);
    const [orientationType, setOrientationType] = useState<'radial' | 'tangent' | 'parallel' | 'perpendicular' | 'custom'>('radial');
    const [orientationAngle, setOrientationAngle] = useState(0);
    const [rotateAlongPath, setRotateAlongPath] = useState(false);

    const toolsMenuRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
                setIsToolsMenuOpen(false);
                setIsAlignMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasSelectedShapes = selectedShapes.length > 0;
    
    return (
    <div className="bg-[var(--bg-primary)] p-2 flex-shrink-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 select-none">
        {/* Left side actions */}
        <div className="flex items-center gap-1">
            <button title={`${t('menu.edit.undo')} (Ctrl+Z)`} onClick={onUndo} disabled={!canUndo} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent"><UndoIcon/></button>
            <button title={`${t('menu.edit.redo')} (Ctrl+Y)`} onClick={onRedo} disabled={!canRedo} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent"><RedoIcon/></button>
            <div className="w-px h-6 bg-[var(--border-secondary)] mx-1"></div>
            <button title={`${t('tool.select')} (V)`} onClick={() => setActiveTool('select')} className={`p-2 rounded-md ${activeTool === 'select' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}><SelectIcon /></button>
            <button title={`${t('tool.editPoints')} (A)`} onClick={() => setActiveTool('edit-points')} disabled={selectedShapes.length > 1} className={`p-2 rounded-md ${activeTool === 'edit-points' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent'}`}><EditPointsIcon /></button>
            <button title={`${t('menu.edit.duplicate')} (Ctrl+D)`} onClick={onDuplicate} disabled={!isShapeSelected || isDistributingPath} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent"><DuplicateIcon /></button>

            <div className="relative" ref={toolsMenuRef}>
                <button 
                  title={t('menu.tools')} 
                  onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)} 
                  disabled={!isShapeSelected} 
                  className={`p-2 rounded-md transition-colors ${isToolsMenuOpen ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent'}`}
                >
                    <ToolsIcon />
                </button>
                {isToolsMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-md shadow-lg z-50 min-w-[200px] py-1 text-sm">
                        <button 
                          onClick={() => { onGroup(); setIsToolsMenuOpen(false); }} 
                          disabled={!canGroup}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-primary)]"
                        >
                          <GroupIcon size={16} /> {t('menu.edit.group')}
                        </button>
                        <button 
                          onClick={() => { onUngroup(); setIsToolsMenuOpen(false); }} 
                          disabled={!canUngroup}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-primary)]"
                        >
                          <UngroupIcon size={16} /> {t('menu.edit.ungroup')}
                        </button>
                        <button 
                          onClick={() => { onExtractFromGroup?.(); setIsToolsMenuOpen(false); }} 
                          disabled={!canExtractFromGroup}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-primary)]"
                        >
                          <UngroupIcon size={16} /> {t('menu.edit.extractFromGroup')}
                        </button>
                        
                        <div className="w-full h-px bg-[var(--border-secondary)] my-1"></div>
                        <button 
                          onClick={() => { onFlipH(); setIsToolsMenuOpen(false); }} 
                          disabled={!canFlip}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-primary)]"
                        >
                          <FlipHorizontalIcon size={16} /> {t('menu.edit.flipH')}
                        </button>
                        <button 
                          onClick={() => { onFlipV(); setIsToolsMenuOpen(false); }} 
                          disabled={!canFlip}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-primary)]"
                        >
                          <FlipVerticalIcon size={16} /> {t('menu.edit.flipV')}
                        </button>
                        <div className="w-full h-px bg-[var(--border-secondary)] my-1"></div>
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsAlignMenuOpen(!isAlignMenuOpen); }}
                                className="flex items-center justify-between w-full text-left px-3 py-2 hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                            >
                                <div className="flex items-center gap-2"><AlignShapesCenterHIcon size={16} /> {t('menu.tools.align') || 'Вирівняти'}</div>
                                <ChevronRightIcon size={16} />
                            </button>
                            {isAlignMenuOpen && (
                                <div className="absolute left-full top-0 ml-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-md shadow-lg z-50 min-w-[200px] py-1 text-sm" onClick={(e) => e.stopPropagation()}>
                                    <div className="px-3 py-1 flex items-center justify-between border-b border-[var(--border-secondary)] pb-2 mb-2">
                                        <label className={`flex items-center gap-2 text-xs text-[var(--text-secondary)] ${isDistributingPath ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-[var(--text-primary)]'}`}>
                                            <input type="radio" name="alignRelativeTo" checked={alignRelativeTo === 'selection' && !isDistributingPath} disabled={isDistributingPath} onChange={() => setAlignRelativeTo('selection')} />
                                            {t('tool.align.selection') || 'Відносно виділення'}
                                        </label>
                                        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]">
                                            <input type="radio" name="alignRelativeTo" checked={alignRelativeTo === 'canvas'} onChange={() => setAlignRelativeTo('canvas')} />
                                            {t('tool.align.canvas') || 'Відносно полотна'}
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 px-2">
                                       <button title={t('tool.align.left') || 'Align Left'} onClick={() => onAlignShapes('left', alignRelativeTo)} disabled={alignRelativeTo === 'selection' && selectedShapes.length < 2} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"><AlignShapesLeftIcon /></button>
                                       <button title={t('tool.align.centerH') || 'Align Horizontal Center'} onClick={() => onAlignShapes('center-h', alignRelativeTo)} disabled={alignRelativeTo === 'selection' && selectedShapes.length < 2} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"><AlignShapesCenterHIcon /></button>
                                       <button title={t('tool.align.right') || 'Align Right'} onClick={() => onAlignShapes('right', alignRelativeTo)} disabled={alignRelativeTo === 'selection' && selectedShapes.length < 2} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"><AlignShapesRightIcon /></button>
                                       <button title={t('tool.align.top') || 'Align Top'} onClick={() => onAlignShapes('top', alignRelativeTo)} disabled={alignRelativeTo === 'selection' && selectedShapes.length < 2} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"><AlignShapesTopIcon /></button>
                                       <button title={t('tool.align.centerV') || 'Align Vertical Center'} onClick={() => onAlignShapes('center-v', alignRelativeTo)} disabled={alignRelativeTo === 'selection' && selectedShapes.length < 2} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"><AlignShapesCenterVIcon /></button>
                                       <button title={t('tool.align.bottom') || 'Align Bottom'} onClick={() => onAlignShapes('bottom', alignRelativeTo)} disabled={alignRelativeTo === 'selection' && selectedShapes.length < 2} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"><AlignShapesBottomIcon /></button>
                                    </div>
                                    <div className="w-full h-px bg-[var(--border-secondary)] my-2"></div>
                                    <div className="grid grid-cols-3 gap-1 px-2 pb-1">
                                        <button title={t('tool.distribute.h') || 'Розподілити горизонтально'} onClick={() => onAlignShapes('distribute-h', alignRelativeTo)} disabled={isDistributingPath || (alignRelativeTo === 'selection' && selectedShapes.length < 3) || (alignRelativeTo === 'canvas' && selectedShapes.length < 2)} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 flex justify-center"><DistributeHorizontalIcon /></button>
                                        <button title={t('tool.distribute.v') || 'Розподілити вертикально'} onClick={() => onAlignShapes('distribute-v', alignRelativeTo)} disabled={isDistributingPath || (alignRelativeTo === 'selection' && selectedShapes.length < 3) || (alignRelativeTo === 'canvas' && selectedShapes.length < 2)} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 flex justify-center"><DistributeVerticalIcon /></button>
                                        <button title={t('tool.distribute.path') || 'Розподілити за шляхом'} onClick={() => onAlignShapes('distribute-path', alignRelativeTo, { orientAlongPath: false, orientationType: 'radial', orientationAngle: 0, rotateAlongPath: false })} disabled={isDistributingPath || selectedShapes.length < 2} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 flex justify-center"><DistributePathIcon /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="w-px h-6 bg-[var(--border-secondary)] mx-1"></div>
            {/* Mobile Toggles */}
            <div className="md:hidden flex items-center gap-2">
                <button onClick={onOpenMobileLeft} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><MenuIcon/></button>
            </div>
        </div>

        {/* Center properties */}
        <div className="flex items-center gap-x-2 gap-y-2 flex-wrap">
            {distributePathState && onDistributePathChange ? (
                <DistributePathTopControls
                    distributePathState={distributePathState}
                    onDistributePathChange={onDistributePathChange}
                    isSelectingPathShape={isSelectingPathShape}
                    onToggleSelectPathShape={onToggleSelectPathShape}
                />
            ) : (
                hasSelectedShapes ? <ContextualControls {...props} /> : <ToolControls {...props} />
            )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
             {/* Mobile Toggles */}
             <div className="md:hidden flex items-center gap-2">
                <button onClick={onOpenMobileRight} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><CodeIcon/></button>
            </div>
            <div className="w-px h-6 bg-[var(--border-secondary)] mx-1 md:hidden"></div>
            <button onClick={onClear} disabled={!hasShapes} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md font-semibold transition-colors duration-200 bg-[var(--destructive-bg)] text-[var(--accent-text)] hover:bg-[var(--destructive-bg-hover)] disabled:bg-[var(--bg-disabled)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed"><EraserIcon size={16}/><span>{t('action.clear')}</span></button>
            {showGenerateButton && (
                <button onClick={onGenerate} disabled={isGenerating || !hasShapes} className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-md font-semibold transition-colors duration-200 bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] disabled:bg-[var(--bg-disabled)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed">
                    <CodeIcon/>
                    <span>{isGenerating ? t('action.generating') : t('action.generate')}</span>
                </button>
            )}
        </div>
    </div>
    );
});

const applyDistributePathToShapes = (currentShapes: Shape[], pathState: DistributePathState): Shape[] => {
    let newShapes = [...currentShapes];
    const isClosed = isPathClosed(pathState);
    const count = pathState.entities.length;
    
    pathState.entities.forEach((entity, idx) => {
        let fraction = 0;
        if (count > 1) {
            fraction = isClosed ? idx / count : idx / (count - 1);
        }
        
        let targetCX = 0;
        let targetCY = 0;
        let tangentAngle = 0;
        
        if (pathState.type === 'circle') {
            const angle = fraction * Math.PI * 2 - Math.PI / 2 + (pathState.angleOffset * Math.PI / 180); 
            targetCX = pathState.circleParams.cx + Math.cos(angle) * pathState.circleParams.radius;
            targetCY = pathState.circleParams.cy + Math.sin(angle) * pathState.circleParams.radius;
            tangentAngle = angle + Math.PI / 2;
        } else if (pathState.type === 'line') {
            const mx = (pathState.lineParams.x1 + pathState.lineParams.x2) / 2;
            const my = (pathState.lineParams.y1 + pathState.lineParams.y2) / 2;
            const len = Math.hypot(pathState.lineParams.x2 - pathState.lineParams.x1, pathState.lineParams.y2 - pathState.lineParams.y1);
            const baseAngle = Math.atan2(pathState.lineParams.y2 - pathState.lineParams.y1, pathState.lineParams.x2 - pathState.lineParams.x1);
            const finalAngle = baseAngle + pathState.angleOffset * Math.PI / 180;
            
            const startX = mx - Math.cos(finalAngle) * (len / 2);
            const startY = my - Math.sin(finalAngle) * (len / 2);
            const endX = mx + Math.cos(finalAngle) * (len / 2);
            const endY = my + Math.sin(finalAngle) * (len / 2);

            targetCX = startX + (endX - startX) * fraction;
            targetCY = startY + (endY - startY) * fraction;
            tangentAngle = finalAngle;
        } else if (pathState.type === 'shape' && pathState.shapePathParams?.pathShape) {
            const contourShift = pathState.shapePathParams.contourShift ?? 0;
            const res = evaluateShapeContourPointAndTangent(
                pathState.shapePathParams.pathShape,
                fraction,
                pathState.angleOffset,
                contourShift
            );
            targetCX = res.targetCX;
            targetCY = res.targetCY;
            tangentAngle = res.tangentAngle;
        }
        
        let normalAngle = 0;
        let pathAngle = 0;
        if (pathState.type === 'circle') {
            pathAngle = fraction * Math.PI * 2 - Math.PI / 2 + (pathState.angleOffset * Math.PI / 180); 
            normalAngle = pathAngle;
        } else {
            pathAngle = tangentAngle;
            normalAngle = tangentAngle - Math.PI / 2;
        }

        const normalX = Math.cos(normalAngle);
        const normalY = Math.sin(normalAngle);
        
        let screenAngleRad = 0;
        let rotationAngleDeg = 0;
        
        if (pathState.orientAlongPath) {
            let A = 0;
            if (pathState.type === 'circle') {
                if (pathState.orientationType === 'radial' || pathState.orientationType === 'perpendicular') {
                    A = pathAngle + Math.PI / 2;
                } else if (pathState.orientationType === 'tangent' || pathState.orientationType === 'parallel') {
                    A = pathAngle;
                } else if (pathState.orientationType === 'custom') {
                    A = pathAngle + pathState.orientationAngle * (Math.PI / 180);
                }
            } else {
                if (pathState.orientationType === 'parallel' || pathState.orientationType === 'tangent') {
                    A = pathAngle + Math.PI / 2;
                } else if (pathState.orientationType === 'perpendicular' || pathState.orientationType === 'radial') {
                    A = pathAngle;
                } else if (pathState.orientationType === 'custom') {
                    A = pathAngle + Math.PI / 2 + pathState.orientationAngle * (Math.PI / 180);
                }
            }
            
            screenAngleRad = A;
            rotationAngleDeg = -screenAngleRad * (180 / Math.PI);
        } else if (pathState.rotateAlongPath) {
            screenAngleRad = pathState.angleOffset * (Math.PI / 180);
            rotationAngleDeg = -pathState.angleOffset;
        }

        let offsetX = 0;
        let offsetY = 0;

        let currentCX = entity.originalBbox.x + entity.originalBbox.width / 2;
        let currentCY = entity.originalBbox.y + entity.originalBbox.height / 2;
        if (entity.ids.length === 1) {
            const originalS = pathState.originalShapes.find(os => os.id === entity.ids[0]);
            if (originalS) {
                const center = getShapeCenter(originalS);
                if (center) {
                    currentCX = center.x;
                    currentCY = center.y;
                }
            }
        }
        
        const dx = (targetCX + offsetX) - currentCX;
        const dy = (targetCY + offsetY) - currentCY;

        entity.ids.forEach((id: string) => {
            const sIndex = newShapes.findIndex((s: any) => s.id === id);
            if (sIndex === -1) return;
            
            const originalS = pathState.originalShapes.find(os => os.id === id);
            if (!originalS) return;
            
            let updatedS = { ...originalS };
            
            if (dx !== 0 || dy !== 0) {
                switch (updatedS.type) {
                    case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap':
                        updatedS = { ...updatedS, x: (updatedS as any).x + dx, y: (updatedS as any).y + dy };
                        break;
                    case 'ellipse': case 'polygon': case 'star':
                        updatedS = { ...updatedS, cx: (updatedS as any).cx + dx, cy: (updatedS as any).cy + dy };
                        break;
                    case 'line': case 'bezier': case 'pencil': case 'polyline':
                        updatedS = { ...updatedS, points: (updatedS as any).points.map((p: any) => ({ x: p.x + dx, y: p.y + dy })) };
                        break;
                    case 'group':
                        if ((updatedS as any).rotationCenter) {
                            updatedS = { ...updatedS, rotationCenter: { x: (updatedS as any).rotationCenter.x + dx, y: (updatedS as any).rotationCenter.y + dy } };
                        }
                        break;
                }
            }
            
            if (screenAngleRad !== 0 && entity.ids.length > 1) {
                // Rotate group components around group center using CW matrix in screen space
                const cosA = Math.cos(screenAngleRad);
                const sinA = Math.sin(screenAngleRad);
                
                let scx = 0, scy = 0;
                switch (originalS.type) {
                    case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap':
                        scx = originalS.x + (originalS.width || 0) / 2;
                        scy = originalS.y + ((originalS as any).height || 0) / 2;
                        break;
                    case 'ellipse': case 'polygon': case 'star':
                        scx = originalS.cx;
                        scy = originalS.cy;
                        break;
                }
                
                if (scx !== 0 || scy !== 0) {
                    const relX = scx - currentCX;
                    const relY = scy - currentCY;
                    const rotRelX = relX * cosA - relY * sinA;
                    const rotRelY = relX * sinA + relY * cosA;
                    
                    const finalCX = targetCX + offsetX + rotRelX;
                    const finalCY = targetCY + offsetY + rotRelY;
                    
                    switch (updatedS.type) {
                        case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap':
                            updatedS = { ...updatedS, x: finalCX - (updatedS.width || 0) / 2, y: finalCY - ((updatedS as any).height || 0) / 2 };
                            break;
                        case 'ellipse': case 'polygon': case 'star':
                            updatedS = { ...updatedS, cx: finalCX, cy: finalCY };
                            break;
                        case 'line': case 'bezier': case 'pencil': case 'polyline':
                            updatedS = { ...updatedS, points: (originalS as any).points.map((p: any) => {
                                const prX = p.x - currentCX;
                                const prY = p.y - currentCY;
                                const prrX = prX * cosA - prY * sinA;
                                const prrY = prX * sinA + prY * cosA;
                                return { x: targetCX + offsetX + prrX, y: targetCY + offsetY + prrY };
                            }) };
                            break;
                    }
                }
            }
            
            if (pathState.orientAlongPath || pathState.rotateAlongPath) {
                if (pathState.orientAlongPath) {
                    if (entity.ids.length > 1) {
                        // For groups, preserve relative rotation by adding absolute group rotation
                        updatedS = { ...updatedS, rotation: (originalS.rotation || 0) + rotationAngleDeg };
                    } else {
                        updatedS = { ...updatedS, rotation: rotationAngleDeg };
                    }
                } else {
                    updatedS = { ...updatedS, rotation: (originalS.rotation || 0) + rotationAngleDeg };
                }
            }
            
            newShapes[sIndex] = updatedS as Shape;
        });
    });
    
    if (pathState.type === 'shape' && pathState.shapePathParams?.pathShape) {
        let pShape = pathState.shapePathParams.pathShape;
        if ('rotation' in pShape) {
            pShape = { ...pShape, rotation: pathState.angleOffset } as any;
        }
        const keepShape = !!pathState.shapePathParams.keepShape;
        if (keepShape) {
            if (!newShapes.some(s => s.id === pShape.id)) {
                newShapes.push(pShape);
            } else {
                newShapes = newShapes.map(s => s.id === pShape.id ? pShape : s);
            }
        } else {
            newShapes = newShapes.filter(s => s.id !== pShape.id);
        }
    }

    return newShapes;
};

export default function App(): React.ReactNode {
  const { t } = useLanguage();
  const { state: historyState, setState: _setHistoryState, updateCurrentState: _updateCurrentState, undo, redo, canUndo, canRedo, reset: resetHistoryState } = useHistoryState<{shapes: Shape[], distributePathState: DistributePathState | null, layers: Layer[], activeLayerId: string | null}>({ 
      shapes: [], 
      distributePathState: null,
      layers: [{ id: 'layer-1', name: t('layer.defaultName') || 'Шар 1', visible: true, locked: false, shapeIds: [] }],
      activeLayerId: 'layer-1'
  });
  const [transientDistributePathState, setTransientDistributePathState] = useState<DistributePathState | null>(null);
  const shapes = historyState.shapes;
  const distributePathState = transientDistributePathState || historyState.distributePathState;
  const defaultLayers = useMemo(() => [{ id: 'layer-1', name: t('layer.defaultName') || 'Шар 1', visible: true, locked: false, shapeIds: [] }], [t]);
  const layers = historyState.layers || defaultLayers;
  const activeLayerId = historyState.activeLayerId || 'layer-1';

  const [projectName, setProjectName] = useState<string>(t('app.1069'));
  const [rightPanelTab, setRightPanelTab] = useState<'layers' | 'shapes'>('shapes');
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [reorderConfirmInfo, setReorderConfirmInfo] = useState<{
      draggedId: string,
      targetId: string,
      position: 'top' | 'bottom',
      action: 'add' | 'remove',
      groupId: string
  } | null>(null);
  const [extractConfirmInfo, setExtractConfirmInfo] = useState<boolean>(false);
  const [inlineEditingShapeId, setInlineEditingShapeId] = useState<string | null>(null);
  const [keyboardSnapLines, setKeyboardSnapLines] = useState<{x: number | null, y: number | null}>({x: null, y: null});
  const keyboardSnapLinesTimeout = useRef<NodeJS.Timeout | null>(null);

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
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState<boolean>(false);
  const [isSaveCodeModalOpen, setIsSaveCodeModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
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
  const [drawingWarningModal, setDrawingWarningModal] = useState<{ show: boolean, reason: 'hidden' | 'locked', layerId?: string, action?: () => void } | null>(null);
  const [ignoreHiddenWarningForLayer, setIgnoreHiddenWarningForLayer] = useState<string | null>(null); 
  const [groupConfirmationModal, setGroupConfirmationModal] = useState<{ show: boolean, title: string, message: string, onConfirm: () => void } | null>(null);
  const [showCenterGuides, setShowCenterGuides] = useState<boolean>(false);
  const [enableSnapping, setEnableSnapping] = useState<boolean>(true);
  const [showCursorCoords, setShowCursorCoords] = useState<boolean>(true);
  const [showRotationAngle, setShowRotationAngle] = useState<boolean>(true);
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [showComments, setShowComments] = useState<boolean>(true);
  const [generatorType, setGeneratorType] = useState<GeneratorType>('local');
  const [highlightCodeOnSelection, setHighlightCodeOnSelection] = useState<boolean>(true);
  const [autoGenerateComments, setAutoGenerateComments] = useState<boolean>(true);
  const [generateTkinterTags, setGenerateTkinterTags] = useState<boolean>(false);
  const [showSystemTags, setShowSystemTags] = useState<boolean>(false);
  const [outlineWithFill, setOutlineWithFill] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  const [maxRecentProjects, setMaxRecentProjects] = useState(12);

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
  const [isImportingImage, setIsImportingImage] = useState(false);
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
    alternativeAction?: {
      text: string;
      onClick: () => void;
      title?: string;
    };
  } | null>(null);
  const [isProjectActive, setIsProjectActive] = useState(false);
  const { projects: recentProjects, addRecentProject, openRecentProject, removeRecentProject, clearAllProjects } = useRecentProjects(maxRecentProjects);
  
  const [isScreenTooSmall, setIsScreenTooSmall] = useState(false);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [projectWasEverActive, setProjectWasEverActive] = useState(false);
  const [autosavedProjectData, setAutosavedProjectData] = useState<string | null>(null);

  const [isCheatCodeModalOpen, setIsCheatCodeModalOpen] = useState(false);
  const [activeCheats, setActiveCheats] = useState<Set<string>>(new Set());


  const applyGroupCenters = useCallback((state: any) => {
        let changedCenter = false;
        const shapesCopy = [...state.shapes];
        for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i < shapesCopy.length; i++) {
                if (shapesCopy[i].type === 'group') {
                    const groupShape = shapesCopy[i];
                    const tempGroup = { ...groupShape, rotationCenter: undefined };
                    const newCenter = getShapeCenter(tempGroup as any, shapesCopy);
                    const currentCenter = (groupShape as any).rotationCenter;
                    if (newCenter) {
                        if (!currentCenter || Math.abs(currentCenter.x - newCenter.x) > 0.01 || Math.abs(currentCenter.y - newCenter.y) > 0.01) {
                            shapesCopy[i] = { ...groupShape, rotationCenter: newCenter } as any;
                            changedCenter = true;
                        }
                    }
                }
            }
        }
        return changedCenter ? { ...state, shapes: shapesCopy } : state;
  }, []);

  const setHistoryState = useCallback((newStateOrFn: any) => {
      _setHistoryState((prev: any) => {
          const next = typeof newStateOrFn === 'function' ? newStateOrFn(prev) : newStateOrFn;
          return applyGroupCenters(next);
      });
  }, [_setHistoryState, applyGroupCenters]);

  const updateCurrentState = useCallback((newStateOrFn: any) => {
      _updateCurrentState((prev: any) => {
          const next = typeof newStateOrFn === 'function' ? newStateOrFn(prev) : newStateOrFn;
          return applyGroupCenters(next);
      });
  }, [_updateCurrentState, applyGroupCenters]);

  const setShapes = useCallback((newShapesOrFn: Shape[] | ((prev: Shape[]) => Shape[])) => {
    setHistoryState((prev: any) => {
        const newShapes = typeof newShapesOrFn === 'function' ? newShapesOrFn(prev.shapes) : newShapesOrFn;
        

        
        const addedShapes = newShapes.filter(ns => !prev.shapes.some((ps: any) => ps.id === ns.id));
        const removedShapeIds = prev.shapes.filter((ps: any) => !newShapes.some(ns => ns.id === ps.id)).map((s: any) => s.id);

        let newLayers = prev.layers || [{ id: 'layer-1', name: t('layer.defaultName') || 'Шар 1', visible: true, locked: false, shapeIds: [] }];
        if (addedShapes.length > 0 || removedShapeIds.length > 0) {
            newLayers = newLayers.map((layer: any) => {
                let updatedShapeIds = layer.shapeIds || [];
                if (removedShapeIds.length > 0) {
                    updatedShapeIds = updatedShapeIds.filter((id: string) => !removedShapeIds.includes(id));
                }
                if (addedShapes.length > 0 && layer.id === (prev.activeLayerId || newLayers[0].id)) {
                    updatedShapeIds = [...updatedShapeIds, ...addedShapes.map((s: any) => s.id)];
                }
                return { ...layer, shapeIds: updatedShapeIds };
            });
        }

        return { ...prev, shapes: newShapes, layers: newLayers };
    });
  }, [setHistoryState, t]);

  const updateShapesWithoutHistory = useCallback((newShapesOrFn: Shape[] | ((prev: Shape[]) => Shape[])) => {
      updateCurrentState((prev: any) => {
          const newShapes = typeof newShapesOrFn === 'function' ? newShapesOrFn(prev.shapes) : newShapesOrFn;
        

          
          const addedShapes = newShapes.filter(ns => !prev.shapes.some((ps: any) => ps.id === ns.id));
          const removedShapeIds = prev.shapes.filter((ps: any) => !newShapes.some(ns => ns.id === ps.id)).map((s: any) => s.id);

          let newLayers = prev.layers || [{ id: 'layer-1', name: t('layer.defaultName') || 'Шар 1', visible: true, locked: false, shapeIds: [] }];
          if (addedShapes.length > 0 || removedShapeIds.length > 0) {
              newLayers = newLayers.map((layer: any) => {
                  let updatedShapeIds = layer.shapeIds || [];
                  if (removedShapeIds.length > 0) {
                      updatedShapeIds = updatedShapeIds.filter((id: string) => !removedShapeIds.includes(id));
                  }
                  if (addedShapes.length > 0 && layer.id === (prev.activeLayerId || newLayers[0].id)) {
                      updatedShapeIds = [...updatedShapeIds, ...addedShapes.map((s: any) => s.id)];
                  }
                  return { ...layer, shapeIds: updatedShapeIds };
              });
          }

          return { ...prev, shapes: newShapes, layers: newLayers };
      });
  }, [updateCurrentState, t]);

  const setDistributePathState = useCallback((newPathOrFn: DistributePathState | null | ((prev: DistributePathState | null) => DistributePathState | null)) => {
      setTransientDistributePathState(null);
      setHistoryState((prev: any) => {
          const newPath = typeof newPathOrFn === 'function' ? newPathOrFn(prev.distributePathState) : newPathOrFn;
          return { ...prev, distributePathState: newPath };
      });
  }, [setHistoryState]);
  
  const setDistributePathStateWithoutHistory = useCallback((newPathOrFn: DistributePathState | null | ((prev: DistributePathState | null) => DistributePathState | null)) => {
      setTransientDistributePathState((prev: DistributePathState | null) => {
          const current = prev || historyState.distributePathState;
          return typeof newPathOrFn === 'function' ? newPathOrFn(current) : newPathOrFn;
      });
  }, [historyState.distributePathState]);

  const handleDistributePathChangeEnd = useCallback(() => {
      setTransientDistributePathState((currentTransient) => {
          if (currentTransient) {
              setHistoryState((prev: any) => ({ ...prev, distributePathState: currentTransient }));
          }
          return null;
      });
  }, [setHistoryState]);

  const resetHistory = useCallback((newShapes: Shape[], newLayers?: Layer[], newActiveLayerId?: string) => {
      resetHistoryState({ 
          shapes: newShapes, 
          distributePathState: null,
          layers: newLayers || [{ id: 'layer-1', name: t('layer.defaultName') || 'Шар 1', visible: true, locked: false, shapeIds: newShapes.map((s: any) => s.id) }],
          activeLayerId: newActiveLayerId || 'layer-1'
      });
  }, [resetHistoryState, t]);

  const addLayer = useCallback(() => {
      setHistoryState((prev: any) => {
          const currentLayers = prev.layers || [];
          let newIndex = currentLayers.length + 1;
          let newName = `${t('layer.defaultName') || 'Шар'} ${newIndex}`;
          while (currentLayers.some((l: any) => l.name === newName)) {
              newIndex++;
              newName = `${t('layer.defaultName') || 'Шар'} ${newIndex}`;
          }
          
          const newLayer: Layer = {
              id: `layer-${Date.now()}`,
              name: newName,
              visible: true,
              locked: false,
              shapeIds: []
          };
          return {
              ...prev,
              layers: [newLayer, ...currentLayers],
              activeLayerId: newLayer.id
          };
      });
  }, [setHistoryState, t]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
      setHistoryState((prev: any) => {
          const targetLayer = (prev.layers || []).find((l: any) => l.id === layerId);
          const willBeHidden = targetLayer && targetLayer.visible;
          
          let newSelectedShapeIds = prev.selectedShapeIds || [];
          if (willBeHidden && prev.shapes) {
              const shapesOnLayer = prev.shapes.filter((s: any) => s.layerId === layerId).map((s: any) => s.id);
              newSelectedShapeIds = newSelectedShapeIds.filter((id: string) => !shapesOnLayer.includes(id));
          }

          return {
              ...prev,
              selectedShapeIds: newSelectedShapeIds,
              layers: (prev.layers || []).map((l: any) => l.id === layerId ? { ...l, visible: !l.visible } : l)
          };
      });
  }, [setHistoryState]);

  const toggleLayerLock = useCallback((layerId: string) => {
      let isLocking = false;
      let shapeIdsToDeselect: string[] = [];

      setHistoryState((prev: any) => {
          const layers = prev.layers || [];
          const targetLayer = layers.find((l: any) => l.id === layerId);
          if (targetLayer) {
              isLocking = !targetLayer.locked;
              shapeIdsToDeselect = targetLayer.shapeIds || [];
          }
          
          return {
              ...prev,
              layers: layers.map((l: any) => l.id === layerId ? { ...l, locked: !l.locked } : l)
          };
      });

      if (isLocking && shapeIdsToDeselect.length > 0) {
          setSelectedShapeIds((prev: any) => {
              const idsToRemove = new Set(shapeIdsToDeselect);
              const newSelected = prev.filter((id: string) => !idsToRemove.has(id));
              return newSelected.length !== prev.length ? newSelected : prev;
          });
          setActivePointIndex(null);
      }
  }, [setHistoryState, setSelectedShapeIds]);

  const setActiveLayer = useCallback((layerId: string) => {
      setHistoryState((prev: any) => ({ ...prev, activeLayerId: layerId }));
  }, [setHistoryState]);

  const deleteLayer = useCallback((layerId: string) => {
      setHistoryState((prev: any) => {
          const layers = prev.layers || [];
          if (layers.length <= 1) return prev; // Don't delete the last layer
          
          const layerToDelete = layers.find((l: any) => l.id === layerId);
          const newShapes = prev.shapes.filter((s: any) => !layerToDelete?.shapeIds.includes(s.id));
          const newLayers = layers.filter((l: any) => l.id !== layerId);
          const newActiveLayerId = prev.activeLayerId === layerId ? newLayers[0].id : prev.activeLayerId;
          
          return {
              ...prev,
              shapes: newShapes,
              layers: newLayers,
              activeLayerId: newActiveLayerId
          };
      });
  }, [setHistoryState]);

  const clearLayer = useCallback((layerId: string) => {
      setHistoryState((prev: any) => {
          const layers = prev.layers || [];
          const layerToClear = layers.find((l: any) => l.id === layerId);
          if (!layerToClear || !layerToClear.shapeIds || layerToClear.shapeIds.length === 0) return prev;
          if (layerToClear.locked) return prev;

          const shapeIdsToRemove = new Set<string>(layerToClear.shapeIds);
          const newShapes = prev.shapes.filter((s: any) => !shapeIdsToRemove.has(s.id));
          const newLayers = layers.map((l: any) => l.id === layerId ? { ...l, shapeIds: [] } : l);
          const newSelectedIds = (prev.selectedShapeIds || []).filter((id: string) => !shapeIdsToRemove.has(id));

          return {
              ...prev,
              shapes: newShapes,
              layers: newLayers,
              selectedShapeIds: newSelectedIds,
          };
      });
  }, [setHistoryState]);

  const updateLayerName = useCallback((layerId: string, newName: string) => {
      setHistoryState((prev: any) => ({
          ...prev,
          layers: (prev.layers || []).map((l: any) => l.id === layerId ? { ...l, name: newName } : l)
      }));
  }, [setHistoryState]);

  const moveLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
      setHistoryState((prev: any) => {
          const layers = [...(prev.layers || [])];
          const index = layers.findIndex((l: any) => l.id === layerId);
          if (index === -1) return prev;
          
          if (direction === 'up' && index > 0) {
              const temp = layers[index];
              layers[index] = layers[index - 1];
              layers[index - 1] = temp;
          } else if (direction === 'down' && index < layers.length - 1) {
              const temp = layers[index];
              layers[index] = layers[index + 1];
              layers[index + 1] = temp;
          } else {
              return prev;
          }
          
          return { ...prev, layers };
      });
  }, [setHistoryState]);


    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('veretka-app-settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                if (typeof settings.maxRecentProjects === 'number') {
                    setMaxRecentProjects(settings.maxRecentProjects);
                }
            }
        } catch (e) { console.error("Failed to load app settings", e); }
    }, []);

    useEffect(() => {
        try {
            const settings = { maxRecentProjects };
            localStorage.setItem('veretka-app-settings', JSON.stringify(settings));
        } catch (e) { console.error("Failed to save app settings", e); }
    }, [maxRecentProjects]);

  const handleActivateCheat = useCallback((code: string) => {
    if (code === '000') {
        setActiveCheats(new Set());
    } else {
        setActiveCheats((prev: Set<string>) => new Set(prev).add(code));
    }
  }, []);

  useEffect(() => {
    const handleCheatCodeHotKey = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            setIsCheatCodeModalOpen(true);
        }
    };

    window.addEventListener('keydown', handleCheatCodeHotKey);
    return () => {
        window.removeEventListener('keydown', handleCheatCodeHotKey);
    };
  }, []);

  const codeStringForExport = useMemo(() => {
    const lines = showComments 
      ? generatedCodeLines 
      : generatedCodeLines.filter(line => !(line?.content?.trim() || '').startsWith('#'));
    
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
        // FIX: Correctly encode UTF-8 strings for btoa to prevent errors with non-Latin characters in text shapes.
        const correctlyEncoded = unescape(encodeURIComponent(svgString));
        return `data:image/svg+xml;base64,${btoa(correctlyEncoded)}`;
    }, []);
    
  const getProjectSignature = useCallback((pName: string, s: Shape[]) => {
    return JSON.stringify({
        projectName: pName,
        shapes: s,
        canvasSettings: { width: canvasWidth, height: canvasHeight, bgColor: canvasBgColor, varName: canvasVarName },
        uiSettings: { theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCenterGuides, enableSnapping, showCursorCoords, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill, generateTkinterTags, showSystemTags }
    });
  }, [canvasWidth, canvasHeight, canvasBgColor, canvasVarName, theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCenterGuides, enableSnapping, showCursorCoords, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill, generateTkinterTags, showSystemTags]);

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
    let currentShapes = shapes;
    
    // Apply layer visibility and ordering
    if (layers && layers.length > 0) {
        const shapeMap = new Map(currentShapes.map((s: any) => [s.id, s]));
        const orderedShapes: Shape[] = [];
        
        const processShape = (shapeId: string, parentHidden: boolean, targetArray: Shape[]) => {
            let shape = shapeMap.get(shapeId);
            if (shape) {
                let newShape = shape;
                if (parentHidden) {
                    newShape = { ...shape, layerHidden: true } as any;
                }
                targetArray.push(newShape);
                shapeMap.delete(shapeId);
                
                if (newShape.type === 'group' && (newShape as any).shapeIds) {
                    for (const childId of (newShape as any).shapeIds) {
                        processShape(childId, parentHidden || newShape.state === 'hidden', targetArray);
                    }
                }
            }
        };

        // Render from bottom layer to top layer
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            for (const shapeId of layer.shapeIds || []) {
                processShape(shapeId, !layer.visible, orderedShapes);
            }
        }
        
        // Unassigned shapes fall back to rendering at the bottom
        const unassignedShapes: Shape[] = [];
        for (const shapeId of shapeMap.keys()) {
            processShape(shapeId, false, unassignedShapes);
        }
        
        currentShapes = [...unassignedShapes, ...orderedShapes];
    }

    if (distributePathState) {
        currentShapes = applyDistributePathToShapes(currentShapes, distributePathState);
    }
    if (Object.keys(previewOverrides).length === 0) {
        return currentShapes;
    }
    return currentShapes.map((s: any) => {
        const override = previewOverrides[s.id];
        return override ? { ...s, ...override } as Shape : s;
    });
  }, [shapes, previewOverrides, distributePathState, layers]);

  const lockedShapeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const layer of layers || []) {
      if (layer.locked) {
        for (const id of layer.shapeIds || []) {
          ids.add(id);
        }
      }
    }
    return ids;
  }, [layers]);

  const cancelShapePreview = useCallback(() => {
      setPreviewOverrides({});
  }, []);

  useEffect(() => {
      cancelShapePreview();
  }, [selectedShapeIds, cancelShapePreview]);


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


  const showNotification = useCallback((message: string, type: 'info' | 'error' = 'info', duration: number = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  }, []);

  const [isSelectingPathShape, setIsSelectingPathShape] = useState<boolean>(false);

  const handleSelectPathShape = useCallback((clickedShape: Shape) => {
      if (!distributePathState) return;

      if (clickedShape.type === 'text') {
          showNotification(t('tool.distribute.path.errText') || 'Фігуру "Текст" не можна використовувати як шлях');
          return;
      }

      if (clickedShape.type === 'group' || clickedShape.groupId != null) {
          showNotification(t('tool.distribute.path.errGroup') || 'Групи та фігури всередині груп не можна використовувати як шлях');
          return;
      }

      const isInDistribution = distributePathState.entities.some(e => e.ids.includes(clickedShape.id));
      if (isInDistribution) {
          showNotification(t('tool.distribute.path.errInDistribution') || 'Фігуру, що бере участь у розподілі, не можна обрати як шлях');
          return;
      }

      const keepShape = distributePathState.shapePathParams?.keepShape ?? true;

      if (!keepShape) {
          setShapes(prev => prev.filter(s => s.id !== clickedShape.id));
      }

      setDistributePathState({
          ...distributePathState,
          type: 'shape',
          angleOffset: ('rotation' in clickedShape) ? (clickedShape.rotation || 0) : 0,
          shapePathParams: {
              shapeId: clickedShape.id,
              pathShape: { ...clickedShape },
              keepShape
          }
      });

      setIsSelectingPathShape(false);
  }, [distributePathState, showNotification, t, setShapes, setDistributePathState]);

  const addShape = useCallback((shape: Shape, isDuplication = false) => {
    if (isImportingImage) {
        setIsImportingImage(false);
    }

    if (distributePathState && (distributePathState.type === 'shape' || isSelectingPathShape)) {
        if (shape.type === 'text') {
            showNotification(t('tool.distribute.path.errText') || 'Фігуру "Текст" не можна використовувати як шлях');
            return;
        }
        if (shape.type === 'group' || shape.groupId != null) {
            showNotification(t('tool.distribute.path.errGroup') || 'Групи та фігури всередині груп не можна використовувати як шлях');
            return;
        }
        const keepShape = distributePathState.shapePathParams?.keepShape ?? true;
        if (keepShape) {
            setShapes(prevShapes => [...prevShapes, shape]);
        }
        setDistributePathState({
            ...distributePathState,
            type: 'shape',
            shapePathParams: {
                shapeId: shape.id,
                pathShape: { ...shape },
                keepShape
            }
        });
        setIsSelectingPathShape(false);
        setActiveTool('select');
        return;
    }

    setShapes(prevShapes => [...prevShapes, shape]);
    if (isDuplication || (shape.type !== 'polyline' && shape.type !== 'bezier')) {
        setSelectedShapeIds([shape.id]);
        setActiveTool('select');
    }
    setIgnoreHiddenWarningForLayer(null);
  }, [setShapes, isImportingImage, distributePathState, isSelectingPathShape, showNotification, t, setDistributePathState]);

  const addShapes = useCallback((newShapes: Shape[], isDuplication = false) => {
    if (isImportingImage) {
        setIsImportingImage(false);
    }
    if (newShapes.length === 0) return;
    setShapes(prevShapes => [...prevShapes, ...newShapes]);
    if (isDuplication || (newShapes[0].type !== 'polyline' && newShapes[0].type !== 'bezier')) {
        const topLevelIds = newShapes.filter((s: any) => !s.groupId || !newShapes.some(ns => ns.id === s.groupId)).map((s: any) => s.id);
        setSelectedShapeIds(topLevelIds);
        setActiveTool('select');
    }
    setIgnoreHiddenWarningForLayer(null);
  }, [setShapes, isImportingImage]);

  const updateShape = useCallback((updatedShape: Shape) => {
    cancelShapePreview();
    setShapes(prevShapes => {
      const oldShape = prevShapes.find((s: any) => s.id === updatedShape.id);
      
      let nextShapes = prevShapes.map(shape => (shape.id === updatedShape.id ? updatedShape : shape));
      
      // If a group was updated, check if any generic styling properties changed,
      // and if so, apply them to its children.
      if (updatedShape.type === 'group' && oldShape && oldShape.type === 'group') {
          const changedProps: Partial<Shape> = {};
          if (updatedShape.stroke !== oldShape.stroke) changedProps.stroke = updatedShape.stroke;
          if (updatedShape.strokeWidth !== oldShape.strokeWidth) changedProps.strokeWidth = updatedShape.strokeWidth;
          if (updatedShape.state !== oldShape.state) changedProps.state = updatedShape.state;
          
          if (Object.keys(changedProps).length > 0) {
              nextShapes = nextShapes.map(shape => {
                  if (updatedShape.shapeIds.includes(shape.id)) {
                      return { ...shape, ...changedProps } as Shape;
                  }
                  return shape;
              });
          }

          if (updatedShape.rotation !== oldShape.rotation) {
             const deltaRot = (updatedShape.rotation || 0) - (oldShape.rotation || 0);
             const rotCenter = getShapeCenter(oldShape, prevShapes);

             if (rotCenter) {
                 const getAffectedIds = (id: string, arr: string[] = []) => {
                     if (!arr.includes(id)) arr.push(id);
                     const s = prevShapes.find(sh => sh.id === id);
                     if (s?.type === 'group' && s.shapeIds) {
                         s.shapeIds.forEach((childId: string) => getAffectedIds(childId, arr));
                     }
                     return arr;
                 };

                 const childIds = updatedShape.shapeIds.reduce((acc, id) => getAffectedIds(id, acc), [] as string[]);
                 
                 nextShapes = nextShapes.map(shape => {
                     if (childIds.includes(shape.id)) {
                        const s = shape;
                        const c = getShapeCenter(s, prevShapes);
                        if (!c) return s;
                        const rotatedC = rotatePoint(c, rotCenter, deltaRot);
                        const dx = rotatedC.x - c.x;
                        const dy = rotatedC.y - c.y;

                        let newS = { ...s };
                        if ('rotation' in newS && newS.type !== 'group') {
                            newS.rotation = ((newS.rotation || 0) + deltaRot) % 360;
                        }
                        if (s.type === 'line' || s.type === 'polyline' || s.type === 'bezier' || s.type === 'pencil' || s.type === 'polygon' || s.type === 'star') {
                            (newS as any).points = (s as any).points.map((p: any) => ({ x: p.x + dx, y: p.y + dy }));
                        } else if (s.type === 'text') {
                            (newS as any).x = s.x + dx;
                            (newS as any).y = s.y + dy;
                        } else if ('x' in s && 'y' in s) {
                            (newS as any).x = s.x + dx;
                            (newS as any).y = s.y + dy;
                        } else if ('cx' in s && 'cy' in s) {
                            (newS as any).cx = s.cx + dx;
                            (newS as any).cy = s.cy + dy;
                        }
                        return newS;
                     }
                     return shape;
                 });
             }
          }
      }
      
      return nextShapes;
    });
    if (selectedShapeIds.length === 1 && updatedShape.id === selectedShapeIds[0] && updatedShape.state !== 'normal') {
        setSelectedShapeIds([]);
        setActivePointIndex(null);
    }
  }, [setShapes, selectedShapeIds, cancelShapePreview]);

  const updateShapes = useCallback((updatedShapes: Shape[]) => {
    cancelShapePreview();
    setShapes(prevShapes => {
      const updatesMap = new Map(updatedShapes.map((s: any) => [s.id, s]));
      return prevShapes.map((s: any) => updatesMap.get(s.id) || s);
    });
    const idsToDeselect = updatedShapes.filter((s: any) => s.state !== 'normal').map((s: any) => s.id);
    if (idsToDeselect.some((id: string) => selectedShapeIds.includes(id))) {
        setSelectedShapeIds((prev: any) => prev.filter((p: any) => !idsToDeselect.includes(p)));
        setActivePointIndex(null);
    }
  }, [setShapes, selectedShapeIds, cancelShapePreview]);
  
  const setShapePreview = useCallback((shapeId: string, overrides: Partial<Shape>) => {
    setPreviewOverrides((prev: any) => ({ ...prev, [shapeId]: overrides }));
  }, []);

  const deleteShape = useCallback((id: string) => {
    setShapes(prevShapes => {
        const shapeToDelete = prevShapes.find((s: any) => s.id === id);
        let idsToDelete = [id];
        if (shapeToDelete?.type === 'group') {
            idsToDelete = [...idsToDelete, ...(shapeToDelete as any).shapeIds];
        }
        return prevShapes.filter(shape => !idsToDelete.includes(shape.id));
    });
    setSelectedShapeIds((prev: any) => {
        if (prev.includes(id)) {
            setActivePointIndex(null);
            return prev.filter((p: any) => p !== id);
        }
        return prev;
    });
  }, [setShapes]);

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
            newPolyline.name = getDefaultNameForShape(newPolyline, t);
            return newPolyline;
        };
        setShapes(prevShapes => {
            const shapeIndex = prevShapes.findIndex((s: any) => s.id === shapeId);
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

  const duplicateShape = useCallback((idOrIds: string | string[]) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    
    const shapesToAdd: Shape[] = [];
    const offset = 10;
    const newRootIds: string[] = [];

    const duplicateSingleShape = (original: Shape, newGroupId?: string): Shape => {
        let newShape: Shape;
        switch (original.type) {
            case 'line':
                newShape = {...original, points: [{...original.points[0]}, {...original.points[1]}]};
                break;
            case 'pencil':
            case 'polyline':
            case 'bezier':
                newShape = {...original, points: original.points.map((p: any) => ({...p}))};
                break;
            case 'group':
                newShape = {...original, shapeIds: [...original.shapeIds]};
                break;
            default:
                newShape = {...original};
        }

        newShape.id = `copy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        if (newGroupId) newShape.groupId = newGroupId;
        
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
        return newShape;
    };

    setHistoryState((prev: any) => {
        const newShapes = [...prev.shapes];
        const newLayers = (prev.layers || []).map((l: any) => ({ ...l, shapeIds: [...(l.shapeIds || [])] }));

        ids.forEach((id: string) => {
            const shapeToDuplicate = prev.shapes.find((s: any) => s.id === id);
            if (!shapeToDuplicate) return;
            
            const originalLayer = newLayers.find((l: any) => l.shapeIds.includes(id));
            const layerId = originalLayer ? originalLayer.id : (prev.activeLayerId || (newLayers.length > 0 ? newLayers[0].id : 'layer-1'));
            
            const rootCopy = duplicateSingleShape(shapeToDuplicate);
            newShapes.push(rootCopy);
            newRootIds.push(rootCopy.id);
            
            const targetLayer = newLayers.find((l: any) => l.id === layerId);
            if (targetLayer) {
                targetLayer.shapeIds.push(rootCopy.id);
            }
            
            if (rootCopy.type === 'group') {
                const children = prev.shapes.filter((s: any) => shapeToDuplicate.shapeIds?.includes(s.id));
                const newChildIds: string[] = [];
                children.forEach((child: any) => {
                    const childLayer = newLayers.find((l: any) => l.shapeIds.includes(child.id));
                    const childLayerId = childLayer ? childLayer.id : layerId;

                    const childCopy = duplicateSingleShape(child, rootCopy.id);
                    newShapes.push(childCopy);
                    newChildIds.push(childCopy.id);
                    
                    const childTargetLayer = newLayers.find((l: any) => l.id === childLayerId);
                    if (childTargetLayer) {
                        childTargetLayer.shapeIds.push(childCopy.id);
                    }
                });
                rootCopy.shapeIds = newChildIds;
            }
        });

        if (newRootIds.length > 0) {
            showNotification(t('app.1102'));
        }

        return { ...prev, shapes: newShapes, layers: newLayers };
    });
    
    return Array.isArray(idOrIds) ? newRootIds : newRootIds[0];
  }, [setHistoryState, showNotification, t]);
  
  const executeReorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom', newAction?: 'add' | 'remove') => {
    setHistoryState((prev: any) => {
        let newLayers = [...(prev.layers || [])];
        let newShapes = [...prev.shapes];

        const draggedShapeIdx = newShapes.findIndex((s: any) => s.id === draggedId);
        const targetShapeIdx = newShapes.findIndex((s: any) => s.id === targetId);
        if (draggedShapeIdx === -1 || targetShapeIdx === -1) return prev;
        
        let draggedShape = { ...newShapes[draggedShapeIdx] };
        const targetShape = newShapes[targetShapeIdx];
        
        const oldGroupId = draggedShape.groupId;
        let finalGroupId = draggedShape.groupId;

        if (newAction === 'add') {
            finalGroupId = targetShape.type === 'group' ? targetShape.id : targetShape.groupId;
        } else if (newAction === 'remove') {
            finalGroupId = undefined;
        }

        // Handle adding/removing from group
        if (oldGroupId !== finalGroupId) {
            draggedShape.groupId = finalGroupId;
            newShapes[draggedShapeIdx] = draggedShape;
            
            if (oldGroupId) {
                const oldGroupIdx = newShapes.findIndex((s: any) => s.id === oldGroupId);
                if (oldGroupIdx !== -1) {
                    const oldGroup = { ...newShapes[oldGroupIdx] };
                    oldGroup.shapeIds = oldGroup.shapeIds.filter((id: string) => id !== draggedId);
                    if (oldGroup.shapeIds.length === 0) {
                        newShapes.splice(oldGroupIdx, 1);
                        newLayers = newLayers.map((layer: any) => ({
                            ...layer,
                            shapeIds: layer.shapeIds ? layer.shapeIds.filter((id: string) => id !== oldGroupId) : []
                        }));
                    } else {
                        newShapes[oldGroupIdx] = oldGroup;
                    }
                }
            }
            if (finalGroupId) {
                const newGroupIdx = newShapes.findIndex((s: any) => s.id === finalGroupId);
                if (newGroupIdx !== -1) {
                    const newGroup = { ...newShapes[newGroupIdx] };
                    newGroup.shapeIds = [...newGroup.shapeIds, draggedId];
                    newShapes[newGroupIdx] = newGroup;
                }
            }
        }

        // Now both draggedShape and targetShape are in their final respective groups.
        // We need to reorder them visually in `newShapes` and `layer.shapeIds`.
        
        const getBlock = (startId: string): string[] => {
            const shape = newShapes.find((s: any) => s.id === startId);
            if (!shape) return [];
            // ONLY treat as a block if it's a top-level group or we just made it a group
            // If it's an inner shape, we ONLY move the inner shape!
            if (shape.type === 'group') {
                const childIds = (shape.shapeIds || []).flatMap((childId: string) => getBlock(childId));
                return [shape.id, ...childIds];
            }
            return [shape.id];
        };

        // If draggedShape is an inner shape, myBlockIds is just [draggedId]
        const myBlockIds = getBlock(draggedId);
        // Abort if trying to drop a block onto itself or its own children
        if (myBlockIds.includes(targetId)) return prev;

        // Target can be a group header or a shape
        const targetBlockIds = getBlock(targetId);

        let draggedLayerIndex = -1;
        let draggedItemIndex = -1;
        for (let i = 0; i < newLayers.length; i++) {
            const ids = newLayers[i].shapeIds || [];
            const index = ids.indexOf(draggedId);
            if (index !== -1) { draggedLayerIndex = i; draggedItemIndex = index; break; }
        }
        
        if (draggedLayerIndex !== -1) {
            newLayers[draggedLayerIndex] = {
                ...newLayers[draggedLayerIndex],
                shapeIds: newLayers[draggedLayerIndex].shapeIds.filter((id: string) => !myBlockIds.includes(id))
            };
        }
        
        let targetLayerIndex = -1;
        let targetItemIndex = -1;
        for (let i = 0; i < newLayers.length; i++) {
            const ids = newLayers[i].shapeIds || [];
            const index = ids.indexOf(targetId);
            if (index !== -1) { targetLayerIndex = i; targetItemIndex = index; break; }
        }
        
        if (targetLayerIndex !== -1) {
            const targetLayerIds = [...newLayers[targetLayerIndex].shapeIds];
            
            const insertIdx = position === 'top' ? targetItemIndex + 1 : targetItemIndex;
            targetLayerIds.splice(insertIdx, 0, ...myBlockIds);
            newLayers[targetLayerIndex] = { ...newLayers[targetLayerIndex], shapeIds: targetLayerIds };
        }
        
        const myShapes = newShapes.filter((s: any) => myBlockIds.includes(s.id));
        newShapes = newShapes.filter((s: any) => !myBlockIds.includes(s.id));
        
        const targetShapesIndex = newShapes.findIndex((s: any) => s.id === targetId);
        if (targetShapesIndex !== -1) {
            const tBlockIds = getBlock(targetId);
            const targetIndices = tBlockIds.map(bid => newShapes.findIndex((s: any) => s.id === bid)).filter((idx: number) => idx !== -1).sort((a,b) => a - b);
            
            if (targetIndices.length > 0) {
                const shapeInsertionIndex = position === 'top' ? targetIndices[targetIndices.length - 1] + 1 : targetIndices[0];
                newShapes.splice(shapeInsertionIndex, 0, ...myShapes);
            } else {
                newShapes.push(...myShapes);
            }
        } else {
            newShapes.push(...myShapes);
        }
        
        const finalDraggedIdx = newShapes.findIndex((s: any) => s.id === draggedId);
        if (finalDraggedIdx !== -1) {
            newShapes[finalDraggedIdx] = draggedShape;
        }

        // Re-sort (group as GroupShape).shapeIds to match their actual visual rendering order (newShapes order)
        // This fixes the issue where added shapes were just appended to the end of the group.
        newShapes.forEach((s: any, idx) => {
            if (s.type === 'group' && s.shapeIds) {
                newShapes[idx] = {
                    ...s,
                    shapeIds: [...s.shapeIds].sort((a, b) => {
                        const aIdx = newShapes.findIndex(xs => xs.id === a);
                        const bIdx = newShapes.findIndex(xs => xs.id === b);
                        return aIdx - bIdx;
                    })
                };
            }
        });

        return { ...prev, shapes: newShapes, layers: newLayers };
    });
  }, [setHistoryState]);

  const reorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom' | 'inside') => {
      const draggedShape = shapes.find((s: any) => s.id === draggedId);
      const targetShape = shapes.find((s: any) => s.id === targetId);
      
      if (!draggedShape || !targetShape) return;
      
      // If we drag a group, we can't put it inside another group (no nested groups).
      if (draggedShape.type === 'group') {
          // Just reorder it normally
          executeReorderShape(draggedId, targetId, position === 'inside' ? 'top' : position);
          return;
      }
      
      if (position === 'inside') {
          const targetGroupId = targetShape.type === 'group' ? targetShape.id : targetShape.groupId;
          if (targetGroupId && draggedShape.groupId !== targetGroupId) {
              setReorderConfirmInfo({ draggedId, targetId, position: 'top', action: 'add', groupId: targetGroupId });
          } else {
              executeReorderShape(draggedId, targetId, 'top');
          }
          return;
      }

      const targetGroupId = targetShape.type === 'group' ? undefined : targetShape.groupId;

      if (draggedShape.groupId !== targetGroupId) {
          if (targetGroupId) {
              setReorderConfirmInfo({ draggedId, targetId, position, action: 'add', groupId: targetGroupId });
              return;
          } else if (draggedShape.groupId) {
              setReorderConfirmInfo({ draggedId, targetId, position, action: 'remove', groupId: draggedShape.groupId });
              return;
          }
      }
      
      executeReorderShape(draggedId, targetId, position);
  }, [shapes, executeReorderShape]);

  const moveToLayer = useCallback((shapeId: string, layerId: string) => {
      setHistoryState((prev: any) => {
          let newShapes = [...(prev.shapes || [])];
          let newLayers = [...(prev.layers || [])];
          
          const shapeIdx = newShapes.findIndex((s: any) => s.id === shapeId);
          if (shapeIdx === -1) return prev;
          
          let shape = { ...newShapes[shapeIdx] };

          // Determine which IDs need to be moved
          let idsToMove = [shapeId];
          if (shape.type === 'group' && shape.shapeIds) {
              idsToMove = [...shape.shapeIds, shapeId];
          } else if (shape.groupId) {
              // Handle if it's a child - we need to remove it from the group
              const oldGroupId = shape.groupId;
              shape.groupId = undefined;
              
              const oldGroupIdx = newShapes.findIndex((s: any) => s.id === oldGroupId);
              if (oldGroupIdx !== -1) {
                  const oldGroup = { ...newShapes[oldGroupIdx] };
                  oldGroup.shapeIds = oldGroup.shapeIds.filter((id: string) => id !== shapeId);
                  if (oldGroup.shapeIds.length === 0) {
                      newShapes.splice(oldGroupIdx, 1);
                      newLayers = newLayers.map((layer: any) => ({
                          ...layer,
                          shapeIds: layer.shapeIds ? layer.shapeIds.filter((id: string) => id !== oldGroupId) : []
                      }));
                  } else {
                      newShapes[oldGroupIdx] = oldGroup;
                  }
              }
          }
          
          newShapes[shapeIdx] = shape;

          // Remove shapes from their old layers and add to new
          newLayers = newLayers.map((l: any) => {
              if (l.id === layerId) {
                  // Add only IDs that aren't already there
                  const toAdd = idsToMove.filter((id: string) => !l.shapeIds.includes(id));
                  return { ...l, shapeIds: [...l.shapeIds, ...toAdd] };
              } else {
                  return { ...l, shapeIds: l.shapeIds.filter((id: string) => !idsToMove.includes(id)) };
              }
          });

          return { ...prev, shapes: newShapes, layers: newLayers };
      });
      setIgnoreHiddenWarningForLayer(null);
  }, [setHistoryState]);

  const moveShape = useCallback((id: string, direction: 'up' | 'down') => {
    setHistoryState((prev: any) => {
        const shapeToMove = prev.shapes.find((s: any) => s.id === id);
        if (!shapeToMove) return prev;

        let newLayers = [...(prev.layers || [])];
        let newShapes = [...prev.shapes];

        // CASE 1: shape is inside a group
        if (shapeToMove.groupId) {
            const groupIdx = newShapes.findIndex((s: any) => s.id === shapeToMove.groupId);
            if (groupIdx !== -1 && newShapes[groupIdx].type === 'group') {
                const groupShape = { ...newShapes[groupIdx] };
                const groupShapeIds = [...(groupShape.shapeIds || [])];
                const myIndex = groupShapeIds.indexOf(id);
                if (myIndex !== -1) {
                    let targetIndex = direction === 'up' ? myIndex + 1 : myIndex - 1;
                    if (targetIndex >= 0 && targetIndex < groupShapeIds.length) {
                        // Swap
                        const temp = groupShapeIds[myIndex];
                        groupShapeIds[myIndex] = groupShapeIds[targetIndex];
                        groupShapeIds[targetIndex] = temp;
                        
                        groupShape.shapeIds = groupShapeIds;
                        newShapes[groupIdx] = groupShape;
                        
                        // Also swap in newShapes array
                        const s1Idx = newShapes.findIndex((s: any) => s.id === groupShapeIds[myIndex]);
                        const s2Idx = newShapes.findIndex((s: any) => s.id === groupShapeIds[targetIndex]);
                        if (s1Idx !== -1 && s2Idx !== -1) {
                            const tempShape = newShapes[s1Idx];
                            newShapes[s1Idx] = newShapes[s2Idx];
                            newShapes[s2Idx] = tempShape;
                        }

                        // Also swap in layer.shapeIds
                        for (let i = 0; i < newLayers.length; i++) {
                            const lShapeIds = newLayers[i].shapeIds;
                            if (lShapeIds) {
                                const l1Idx = lShapeIds.indexOf(groupShapeIds[myIndex]);
                                const l2Idx = lShapeIds.indexOf(groupShapeIds[targetIndex]);
                                if (l1Idx !== -1 && l2Idx !== -1) {
                                    newLayers[i] = { ...newLayers[i], shapeIds: [...lShapeIds] };
                                    const tempId = newLayers[i].shapeIds[l1Idx];
                                    newLayers[i].shapeIds[l1Idx] = newLayers[i].shapeIds[l2Idx];
                                    newLayers[i].shapeIds[l2Idx] = tempId;
                                }
                            }
                        }

                        return { ...prev, shapes: newShapes, layers: newLayers };
                    }
                }
            }
            return prev;
        }

        // CASE 2: shape is a top-level shape or a group itself
        let myLayerIndex = -1;
        for (let i = 0; i < newLayers.length; i++) {
            if (newLayers[i].shapeIds && newLayers[i].shapeIds.includes(id)) {
                myLayerIndex = i;
                break;
            }
        }
        if (myLayerIndex === -1) return prev;

        const layerShapeIds = newLayers[myLayerIndex].shapeIds || [];
        
        // Get ALL top-level IDs in this layer
        const topLevelIds = layerShapeIds.filter((sid: string) => {
            const s = newShapes.find(xs => xs.id === sid);
            return s && !s.groupId;
        });

        const myTopIndex = topLevelIds.indexOf(id);
        if (myTopIndex === -1) return prev;

        let targetTopIndex = direction === 'up' ? myTopIndex + 1 : myTopIndex - 1;
        if (targetTopIndex >= 0 && targetTopIndex < topLevelIds.length) {
            const targetId = topLevelIds[targetTopIndex];
            
            const getBlock = (startId: string): string[] => {
                const s = newShapes.find(xs => xs.id === startId);
                if (!s) return [];
                if (s.type === 'group') {
                    const childIds = (s.shapeIds || []).flatMap((childId: string) => getBlock(childId));
                    return [s.id, ...childIds];
                }
                return [s.id];
            };

            const myBlock = getBlock(id);
            const targetBlock = getBlock(targetId);

            // Reorder in layerShapeIds
            let newLayerShapeIds = [...layerShapeIds];
            newLayerShapeIds = newLayerShapeIds.filter((sid: string) => !myBlock.includes(sid) && !targetBlock.includes(sid));
            
            const origIndices = [...myBlock, ...targetBlock].map((sid: string) => layerShapeIds.indexOf(sid)).filter((idx: number) => idx !== -1);
            if (origIndices.length > 0) {
                const insertIdx = Math.min(...origIndices);
                if (direction === 'up') {
                    newLayerShapeIds.splice(insertIdx, 0, ...targetBlock, ...myBlock);
                } else {
                    newLayerShapeIds.splice(insertIdx, 0, ...myBlock, ...targetBlock);
                }
                newLayers[myLayerIndex] = { ...newLayers[myLayerIndex], shapeIds: newLayerShapeIds };
            }

            // Reorder in newShapes
            const myShapes = myBlock.map((sid: string) => newShapes.find((s: any) => s.id === sid)).filter(Boolean) as Shape[];
            const targetShapes = targetBlock.map((sid: string) => newShapes.find((s: any) => s.id === sid)).filter(Boolean) as Shape[];
            
            const filteredShapes = newShapes.filter((s: any) => !myBlock.includes(s.id) && !targetBlock.includes(s.id));
            const origShapeIndices = [...myBlock, ...targetBlock].map((sid: string) => newShapes.findIndex((s: any) => s.id === sid)).filter((idx: number) => idx !== -1);
            
            if (origShapeIndices.length > 0) {
                const insertShapeIdx = Math.min(...origShapeIndices);
                if (direction === 'up') {
                    filteredShapes.splice(insertShapeIdx, 0, ...targetShapes, ...myShapes);
                } else {
                    filteredShapes.splice(insertShapeIdx, 0, ...myShapes, ...targetShapes);
                }
                newShapes = filteredShapes;
            }

            return { ...prev, shapes: newShapes, layers: newLayers };
        }

        return prev;
    });
  }, [setHistoryState]);

  const convertToPath = useCallback((shapeId: string) => {
    const shape = shapes.find((s: any) => s.id === shapeId);
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
    newPolyline.name = isOldNameDefault ? getDefaultNameForShape(newPolyline, t) : oldName;
    
    updateShape(newPolyline);
    setActiveTool('edit-points');
    showNotification(t('app.1103'));
  }, [shapes, updateShape, showNotification]);


  const lastSelectedShapeIdRef = useRef<string | null>(null);

    const handleDrawingAttempt = useCallback(() => {
      const activeLayer = layers?.find((l: any) => l.id === activeLayerId);
      if (!activeLayer) return true;
      
      if (activeLayer.locked) {
          setDrawingWarningModal({ show: true, reason: 'locked', layerId: activeLayerId });
          return false;
      }
      if (!activeLayer.visible) {
          if (ignoreHiddenWarningForLayer === activeLayerId) return true;
          setDrawingWarningModal({ show: true, reason: 'hidden', layerId: activeLayerId });
          return false;
      }
      return true;
  }, [layers, activeLayerId, ignoreHiddenWarningForLayer]);

  const handleSelectShape = useCallback((id: string | string[] | null, isCtrlPressed: boolean = false, isShiftPressed: boolean = false, ignoreGroup: boolean = false) => {
    if (distributePathState) return;
    if (Array.isArray(id)) {
        if (isCtrlPressed) {
            setSelectedShapeIds((prev: string[]) => Array.from(new Set([...prev, ...id])));
        } else {
            setSelectedShapeIds(id);
        }
        if (id.length > 0) lastSelectedShapeIdRef.current = id[id.length - 1];
        return;
    }

    setSelectedShapeIds((prev: any) => {
      if (!id) {
          lastSelectedShapeIdRef.current = null;
          return [];
      }
      
      const targetShape = shapes.find((s: any) => s.id === id);
      const targetGroupId = !ignoreGroup ? targetShape?.groupId : undefined;
      
      const idsToToggle = targetGroupId 
        ? [targetGroupId]
        : [id];

      if (isShiftPressed && lastSelectedShapeIdRef.current) {
          const startIndex = shapes.findIndex((s: any) => s.id === lastSelectedShapeIdRef.current);
          const endIndex = shapes.findIndex((s: any) => s.id === id);
          
          if (startIndex !== -1 && endIndex !== -1) {
              const minIndex = Math.min(startIndex, endIndex);
              const maxIndex = Math.max(startIndex, endIndex);
              
              const rangeIds = new Set<string>();
              for (let i = minIndex; i <= maxIndex; i++) {
                  const s = shapes[i];
                  if (s.groupId && !ignoreGroup) {
                      rangeIds.add(s.groupId);
                  } else {
                      rangeIds.add(s.id);
                  }
              }
              
              if (isCtrlPressed) {
                  return Array.from(new Set([...prev, ...rangeIds]));
              } else {
                  return Array.from(rangeIds);
              }
          }
      }

      lastSelectedShapeIdRef.current = id;

      if (isCtrlPressed) {
        const isAlreadySelected = idsToToggle.some(toggleId => prev.includes(toggleId)) || prev.includes(id);
        if (isAlreadySelected) {
            return prev.filter((p: any) => !idsToToggle.includes(p) && p !== id);
        } else {
            return Array.from(new Set([...prev, ...idsToToggle]));
        }
      }
      return Array.from(new Set(idsToToggle));
    });

    setIsDrawingPolyline(false);
    setPolylinePoints([]);
    setIsDrawingBezier(false);
    setBezierPoints([]);
  }, [shapes, distributePathState]);

  const handleCompletePolyline = useCallback((isClosed: boolean) => {
    const cleanPoints = polylinePoints.filter((p: any) => p);
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
        id: new Date().toISOString(), name: isClosed ? t('app.1104') : t('app.1105'), type: 'polyline', points: finalPoints, isClosed,
        fill: isClosed && isFillEnabled ? (previewFillColor ?? fillColor) : 'none', stroke: isStrokeEnabled ? (previewStrokeColor ?? strokeColor) : 'none', strokeWidth: isStrokeEnabled ? strokeWidth : 0, state: 'normal', rotation: 0, capstyle: 'round',
        isAspectRatioLocked: false,
    };
    addShape(newShape);
    setIsDrawingPolyline(false);
    setPolylinePoints([]);
    setActiveTool('select');
    setSelectedShapeIds([newShape.id]);
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
            id: new Date().toISOString(), name: isClosed ? t('app.1104') : t('app.1106'), type: 'bezier', points: finalPoints, smooth: true, splinesteps: 12, stroke: isStrokeEnabled ? (previewStrokeColor ?? strokeColor) : 'none',
            strokeWidth: isStrokeEnabled ? strokeWidth : 0, rotation: 0, capstyle: 'round', state: 'normal', isClosed: isClosed, fill: isClosed && isFillEnabled ? (previewFillColor ?? fillColor) : 'none',
            isAspectRatioLocked: false,
        };
        addShape(newShape);
        setIsDrawingBezier(false);
        setBezierPoints([]);
        setActiveTool('select');
        setSelectedShapeIds([newShape.id]);
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
                showNotification(t('action.placeImage'));
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const handleImportImage = useCallback(() => {
        setIsImportingImage(true);
        fileInputRef.current?.click();
    }, []);

    const handleSetActiveTool = useCallback((tool: Tool) => {
        if (tool === 'edit-points') {
            if (selectedShapeIds.length > 1) {
                showNotification(t('app.1107') || 'Cannot edit points for multiple shapes', 'info');
                return;
            }
            const shape = selectedShapeIds.length === 1 ? shapes.find((s: any) => s.id === selectedShapeIds[0]) : undefined;
            if (shape?.type === 'text') {
                showNotification(t('app.1107'), 'info');
                return;
            }
        }
        
        if (isDrawingPolyline) handleCompletePolyline(false);
        if (isDrawingBezier) handleCancelBezier();
        setActivePointIndex(null);
        const isSelectionPreservingTool = tool === 'select' || tool === 'edit-points';
        if (!isSelectionPreservingTool) setSelectedShapeIds([]);
        if (tool === 'polyline') { setIsDrawingPolyline(true); setPolylinePoints([]);
        } else { setIsDrawingPolyline(false); }
        if (tool === 'bezier') { setIsDrawingBezier(true); setBezierPoints([]);
        } else { setIsDrawingBezier(false); }
        if (tool === 'image') fileInputRef.current?.click();
        else { setPendingImage(null); setActiveTool(tool); }
    }, [isDrawingPolyline, isDrawingBezier, handleCompletePolyline, handleCancelBezier, shapes, selectedShapeIds, showNotification]);

  const selectedShapes = useMemo(() => {
    return shapes.filter((s: any) => selectedShapeIds.includes(s.id));
  }, [shapes, selectedShapeIds]);

  const selectedShape = selectedShapes.length === 1 ? selectedShapes[0] : null;
  
  const inlineEditingShape = useMemo(() => {
    if (!inlineEditingShapeId) return null;
    return shapes.find((s: any) => s.id === inlineEditingShapeId) as TextShape || null;
  }, [shapes, inlineEditingShapeId]);

  const handleGenerateCode = useCallback(async () => {
    const shapesForGeneration = displayedShapes.filter((s: any) => !(s.type === 'image' && s.isImport) && s.state !== 'hidden');
    if (shapesForGeneration.length === 0) { showNotification(t('app.1108'), 'info'); return; }
    
    if (generatorType === 'gemini' && !apiKey) {
        showNotification(t('app.1109'), 'info');
        setIsApiKeyModalOpen(true);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedCodeLines([]);

    let finalShapesForGeneration = shapesForGeneration;
    if (activeCheats.has('002')) {
        finalShapesForGeneration = shapesForGeneration.filter((s: any) => s.type !== 'image');
    }

    try {
      if (generatorType === 'local') {
        const { codeLines } = await generateTkinterCodeLocally(finalShapesForGeneration, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments, outlineWithFill, generateTkinterTags, showSystemTags, t);
        setGeneratedCodeLines(codeLines);
      } else {
        const code = await generateTkinterCode(apiKey!, finalShapesForGeneration, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments, outlineWithFill, generateTkinterTags, showSystemTags);
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
        
      setShapesAtGenerationTime(JSON.parse(JSON.stringify(displayedShapes)));
      showNotification(t('app.1110'), 'info');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('app.1111');
      setError(`${t('app.1112')} ${errorMessage}`);
      showNotification(t('app.1113'), 'error', 5000);
    } finally {
      setIsLoading(false);
    }
  }, [displayedShapes, canvasWidth, canvasHeight, canvasBgColor, projectName, generatorType, canvasVarName, autoGenerateComments, generateTkinterTags, showSystemTags, apiKey, activeCheats, outlineWithFill, showNotification, t]);

  const displayedShapesString = useMemo(() => JSON.stringify(displayedShapes), [displayedShapes]);
  const shapesString = useMemo(() => JSON.stringify(shapes), [shapes]);

  useEffect(() => {
    if (generatorType === 'local' && isProjectActive) {
        const generate = async () => {
            let shapesForGeneration = displayedShapes.filter((s: any) => !(s.type === 'image' && s.isImport) && s.state !== 'hidden');
            if (activeCheats.has('002')) {
                shapesForGeneration = shapesForGeneration.filter((s: any) => s.type !== 'image');
            }
            const { codeLines } = await generateTkinterCodeLocally(shapesForGeneration, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments, outlineWithFill, generateTkinterTags, showSystemTags, t);
            setGeneratedCodeLines(codeLines);
            setShapesAtGenerationTime(JSON.parse(displayedShapesString));
        };
        generate();
    }
  }, [displayedShapesString, shapesString, canvasWidth, canvasHeight, canvasBgColor, generatorType, projectName, isProjectActive, canvasVarName, autoGenerateComments, generateTkinterTags, showSystemTags, activeCheats, outlineWithFill, t]);
  
  const hasUnsyncedChangesWithCode = useMemo(() => {
    if (!shapesAtGenerationTime) return false;
    return JSON.stringify(shapes) !== JSON.stringify(shapesAtGenerationTime);
  }, [shapes, shapesAtGenerationTime]);

  const performClear = () => {
    resetHistory([]);
    setGeneratedCodeLines([]);
    setError(null);
    setSelectedShapeIds([]);
    setActivePointIndex(null);
    setIsDrawingPolyline(false);
    setPolylinePoints([]);
    setIsDrawingBezier(false);
    setBezierPoints([]);
    setShapesAtGenerationTime(null);
    setActiveCheats(new Set());
    setFileHandle(null);
    localStorage.removeItem(AUTOSAVE_KEY);
  };

  const confirmAction = useCallback((action: (() => void) | undefined, title: string, message: string, confirmText?: string, cancelText?: string, variant?: 'primary' | 'destructive', alternativeAction?: { text: string, onClick: () => void, title?: string }) => {
    if (!hasUnsavedChanges) {
      if (typeof action === 'function') {
        action();
      }
      return;
    }
    setConfirmationAction({
      title,
      message,
      onConfirm: () => {
        if (typeof action === 'function') {
          action();
        }
        setConfirmationAction(null);
      },
      confirmText,
      cancelText,
      variant,
      alternativeAction,
    });
  }, [hasUnsavedChanges]);

  const handleClearCanvas = useCallback(() => {
    confirmAction(
      () => {
        performClear();
        showNotification(t('app.1114'));
      },
      t('app.1115'),
      t('app.1021')
    );
  }, [confirmAction, showNotification]);

  const handleNewProject = useCallback((settings: NewProjectSettings, templateId: string | null) => {
    performClear();
    setProjectName(settings.projectName);
    setCanvasWidth(settings.width);
    setCanvasHeight(settings.height);
    setCanvasBgColor(settings.bgColor);
    setCanvasVarName(settings.canvasVarName);

    if (templateId) {
        const template = projectTemplates.find((t: any) => t.id === templateId);
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
    
    localStorage.removeItem(AUTOSAVE_KEY);
    setProjectWasEverActive(true);
    setIsNewProjectModalOpen(false);
    setIsProjectActive(true);
    setTimeout(fitCanvasToView, 0);
  }, [getProjectSignature, fitCanvasToView, projectTemplates, resetHistory]);
  
  const handleOpenNewProjectModal = useCallback(() => {
    confirmAction(
      () => setIsNewProjectModalOpen(true),
      t('app.1116'),
      t('app.1117')
    );
  }, [confirmAction]);

  const handleGoHome = useCallback(() => {
    confirmAction(
      () => setIsProjectActive(false),
      t('app.1118'),
      t('app.1119'),
      t('app.1120'),
      t('app.1121'),
      'primary'
    );
  }, [confirmAction]);

  const getSaveData = useCallback((pName: string) => {
    const shapesToSave = shapes;
    return {
        projectName: pName,
        shapes: shapesToSave,
        layers: layers,
        activeLayerId: activeLayerId,
        thumbnail: generateProjectThumbnail(displayedShapes, canvasWidth, canvasHeight, canvasBgColor),
        canvasSettings: { width: canvasWidth, height: canvasHeight, bgColor: canvasBgColor, varName: canvasVarName },
        viewTransform,
        uiSettings: { theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCenterGuides, enableSnapping, showCursorCoords, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill, generateTkinterTags, showSystemTags }
    };
  }, [shapes, displayedShapes, layers, activeLayerId, canvasWidth, canvasHeight, canvasBgColor, canvasVarName, viewTransform, theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCenterGuides, enableSnapping, showCursorCoords, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill, generateTkinterTags, generateProjectThumbnail]);

    const handleSaveProject = useCallback(async () => {
        if (!hasUnsavedChanges && fileHandle) {
            showNotification(t('app.1122'), 'info');
            return;
        }
        
        const saveData = getSaveData(projectName);
        
        if (fileHandle) {
            try {
                await saveToHandle(fileHandle, JSON.stringify(saveData, null, 2));
                lastSavedSignatureRef.current = getProjectSignature(projectName, shapes);
                addRecentProject(fileHandle, saveData.thumbnail);
                showNotification(t('app.1001'), 'info');
                localStorage.removeItem(AUTOSAVE_KEY);
            } catch (error) {
                console.error(t('app.1123'), error);
                showNotification(t('app.1124'), 'error');
            }
        } else {
            // New project: "Save" acts like "Save As" but without the name modal.
            try {
                const jsonString = JSON.stringify(saveData, null, 2);
                
                const newHandle = await saveFile(
                    jsonString,
                    `${projectName}.vec.json`,
                    [{
                        description: t('app.1000'),
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
                    showNotification(t('app.1001'), 'info');
                    localStorage.removeItem(AUTOSAVE_KEY);
                }
            } catch (error) {
                console.error(t('app.1002'), error);
                showNotification(t('app.1003'), 'error');
            }
        }
    }, [hasUnsavedChanges, fileHandle, getSaveData, projectName, getProjectSignature, shapes, addRecentProject, showNotification]);

    const handleSaveProjectAs = useCallback(async (newProjectNameFromModal: string) => {
        setIsSaveAsModalOpen(false);
        try {
            const saveData = getSaveData(newProjectNameFromModal);
            const jsonString = JSON.stringify(saveData, null, 2);
            
            const newHandle = await saveFile(
                jsonString,
                `${newProjectNameFromModal}.vec.json`,
                [{
                    description: t('app.1000'),
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
                showNotification(t('app.1001'), 'info');
                localStorage.removeItem(AUTOSAVE_KEY);
            }
        } catch (error) {
            console.error(t('app.1002'), error);
            showNotification(t('app.1003'), 'error');
        }
    }, [getSaveData, shapes, addRecentProject, getProjectSignature, showNotification]);

    const handleShareLink = useCallback(() => {
        if (!isProjectActive) return;
        const projectData = getSaveData(projectName);
        const url = compressProjectToUrl(projectData);
        setShareUrl(url);
        setIsShareModalOpen(true);
    }, [isProjectActive, getSaveData, projectName]);

    const handleSaveTemplate = useCallback((name: string) => {
        const shapesToSave = shapes;
        const newTemplate: ProjectTemplate = {
            id: Date.now().toString(),
            name,
            settings: {
                projectName: `${t('app.1004')} "${name}")`,
                width: canvasWidth,
                height: canvasHeight,
                bgColor: canvasBgColor,
                canvasVarName: canvasVarName,
            },
            shapes: JSON.parse(JSON.stringify(shapesToSave)), // Deep copy
        };
    
        setProjectTemplates((prev: any) => {
            const updatedTemplates = [...prev, newTemplate];
            try {
                localStorage.setItem('veretka-project-templates', JSON.stringify(updatedTemplates));
                showNotification(`${t('app.1005')}${name}${t('app.1006')}`, 'info');
            } catch (e) {
                console.error("Failed to save project templates to localStorage", e);
                showNotification(t('app.1007'), 'error');
            }
            return updatedTemplates;
        });
        setIsSaveTemplateModalOpen(false);
    }, [shapes, canvasWidth, canvasHeight, canvasBgColor, canvasVarName, showNotification]);

    const handleDeleteTemplate = useCallback((templateId: string) => {
        setConfirmationAction({
            title: t('app.1008'),
            message: t('app.1009'),
            onConfirm: () => {
                setProjectTemplates((prev: any) => {
                    const updatedTemplates = prev.filter((t: any) => t.id !== templateId);
                    try {
                        localStorage.setItem('veretka-project-templates', JSON.stringify(updatedTemplates));
                        showNotification(t('app.1010'), 'info');
                    } catch (e) {
                        console.error("Failed to delete project template from localStorage", e);
                        showNotification(t('app.1011'), 'error');
                    }
                    return updatedTemplates;
                });
                setConfirmationAction(null);
            }
        });
    }, [showNotification]);

    const handleRenameTemplate = useCallback((templateId: string, newName: string) => {
        setProjectTemplates((prev: any) => {
            const updatedTemplates = prev.map((t: any) => t.id === templateId ? { ...t, name: newName } : t);
            try {
                localStorage.setItem('veretka-project-templates', JSON.stringify(updatedTemplates));
                showNotification(t('app.1012'), 'info');
            } catch (e) {
                console.error("Failed to rename project template in localStorage", e);
                showNotification(t('app.1013'), 'error');
            }
            return updatedTemplates;
        });
    }, [showNotification]);

  const processLoadedData = useCallback((fileContent: string | object, fileName?: string, handle?: FileSystemFileHandle | null) => {
    try {
        const savedData = typeof fileContent === 'string' ? JSON.parse(fileContent) : fileContent;
        if (savedData && (Array.isArray(savedData.shapes) || savedData.canvasSettings)) {
            const shapesToLoad = Array.isArray(savedData.shapes) ? savedData.shapes : [];
            const newProjectName = savedData.projectName || (fileName ? fileName.replace(/\.vec\.json$/, '') : t('app.1014'));
            
            performClear();
            resetHistory(shapesToLoad, savedData.layers, savedData.activeLayerId);
            setProjectName(newProjectName);

            const cs = savedData.canvasSettings || {};
            setCanvasWidth(cs.width || 800);
            setCanvasHeight(cs.height || 600);
            setCanvasBgColor(cs.bgColor || '#ffffff');
            setCanvasVarName(cs.varName || 'c');
            
            if (savedData.viewTransform) {
                setViewTransform(savedData.viewTransform);
            } else {
                setViewTransform({ x: 0, y: 0, zoom: 1 });
            }

            const ui = savedData.uiSettings || {};
            setTheme(ui.theme || 'dark');
            setShowGrid(ui.showGrid ?? true);
            setGridSize(ui.gridSize || 10);
            setSnapToGrid(ui.snapToGrid ?? true);
            setGridSnapStep(ui.gridSnapStep || 1);
            setShowAxes(ui.showAxes ?? true);
            setShowCenterGuides(ui.showCenterGuides ?? false);
            setEnableSnapping(ui.enableSnapping ?? true);
            setShowCursorCoords(ui.showCursorCoords ?? true);
            setShowRotationAngle(ui.showRotationAngle ?? true);
            setShowLineNumbers(ui.showLineNumbers ?? true);
            setShowComments(ui.showComments ?? true);
            setShowTkinterNames(ui.showTkinterNames ?? true);
            setGeneratorType(ui.generatorType || 'local');
            setHighlightCodeOnSelection(ui.highlightCodeOnSelection ?? true);
            setAutoGenerateComments(ui.autoGenerateComments ?? true);
            setGenerateTkinterTags(ui.generateTkinterTags ?? false);
            setShowSystemTags(ui.showSystemTags ?? false);
            setOutlineWithFill(ui.outlineWithFill ?? true);
            
            lastSavedSignatureRef.current = getProjectSignature(newProjectName, shapesToLoad);

            if (activeTool === 'polyline' || activeTool === 'bezier') {
                setActiveTool('select');
            }
            setProjectWasEverActive(true);
            setIsProjectActive(true);
            if (handle) {
                addRecentProject(handle, savedData.thumbnail);
            }
            showNotification(t('app.1015'), 'info');
            localStorage.removeItem(AUTOSAVE_KEY);
            setTimeout(fitCanvasToView, 0);
        } else {
            showNotification(t('app.1016'), 'error');
        }
    } catch (e) {
        console.error(t('app.1017'), e);
        showNotification(t('app.1018'), 'error');
    }
  }, [resetHistory, getProjectSignature, addRecentProject, fitCanvasToView, activeTool, showNotification, t]);

  const loadProject = useCallback(async () => {
    let result: { handle: FileSystemFileHandle; content: string } | null = null;
    if (typeof (window as any).showOpenFilePicker === 'function') {
        try {
            result = await openProjectFile();
        } catch (err) {
            console.error(t('app.1019'), err);
            showNotification(t('app.1070'), 'error');
            return;
        }
    }

    if (result) {
        processLoadedData(result.content, result.handle.name, result.handle);
        setFileHandle(result.handle);
    } else {
        projectLoadInputRef.current?.click();
    }
  }, [processLoadedData, showNotification]);
  
  const handleLoadProject = useCallback(() => {
    confirmAction(
      loadProject,
      t('app.1020'),
      t('app.1021')
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
            showNotification(t('app.1022'), 'error');
        }
    };
    reader.onerror = () => {
        showNotification(t('app.1023'), 'error');
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };
  
  const handleExport = useCallback(async (settings: ExportSettings) => {
    setIsExportModalOpen(false);
    showNotification(t('app.1024'), 'info', 1500);
    try {
        const shapesToExport = displayedShapes;
        const svgString = generateSvg(shapesToExport, canvasWidth, canvasHeight, canvasBgColor);
        const suggestedName = `${projectName}.${settings.format}`;

        if (settings.format === 'svg') {
            await saveFile(
                svgString,
                suggestedName,
                [{
                    description: t('app.1025'),
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
            const description = settings.format === 'png' ? t('app.1026') : t('app.1027');
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
        showNotification(t('app.1028'), 'info');
    } catch (err) {
        console.error(t('app.1029'), err);
        showNotification(t('app.1030'), 'error');
    }
  }, [displayedShapes, canvasWidth, canvasHeight, canvasBgColor, projectName, showNotification]);

  const handleOpenRecent = useCallback(async (project: RecentProject) => {
    try {
        const content = await openRecentProject(project);
        if (content) {
            processLoadedData(content, project.name, project.handle);
            setFileHandle(project.handle);
        }
    } catch (err) {
        console.error(t('app.1031'), err);
        showNotification(`${t('app.1032')} ${err instanceof Error ? err.message : t('app.1033')}.`, 'error', 5000);
    }
  }, [openRecentProject, processLoadedData, showNotification]);
  
  const handleRemoveRecentProject = useCallback((project: RecentProject) => {
    setConfirmationAction({
        title: `${t('app.1034')}${project.name.replace(/\.vec\.json$/, '')}${t('app.1035')}`,
        message: t('app.1036'),
        onConfirm: () => {
            removeRecentProject(project.name);
            showNotification(t('app.1037'));
            setConfirmationAction(null);
        }
    });
  }, [removeRecentProject, showNotification]);

  const handleClearAllRecentProjects = useCallback(() => {
    if (recentProjects.length === 0) return;
    setConfirmationAction({
        title: t('app.1038'),
        message: t('app.1039'),
        onConfirm: () => {
            clearAllProjects();
            showNotification(t('app.1040'));
            setConfirmationAction(null);
        }
    });
  }, [clearAllProjects, recentProjects.length, showNotification]);


    const handleSaveCode = useCallback(async (fileName: string, extension: '.py' | '.txt', includeLineNumbers: boolean) => {
        setIsSaveCodeModalOpen(false);
        
        let contentToSave: string;
        let fileDescription: string;
        let mimeType: string;
        let accept: Record<string, string[]>;

        if (extension === '.txt' && includeLineNumbers) {
            contentToSave = generatedCodeLines
                .filter(line => showComments || !(line?.content?.trim() || '').startsWith('#'))
                .map((line, index) => `${String(index + 1).padStart(4, ' ')} | ${line.content}`)
                .join('\n');
        } else {
            contentToSave = codeStringForExport;
        }

        if (!contentToSave) {
          showNotification(t('app.1041'), 'error');
          return;
        }
        
        if (extension === '.py') {
            fileDescription = t('app.1042');
            mimeType = 'text/python';
            accept = { [mimeType]: ['.py'] };
        } else { // .txt
            fileDescription = t('app.1043');
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
          showNotification(t('app.1044'), 'info');
        } catch (err) {
          console.error(t('app.1045'), err);
          showNotification(t('app.1046'), 'error');
        }
    }, [codeStringForExport, generatedCodeLines, showComments, showNotification]);

    const handleOpenOrRunCodeOnline = useCallback((runImmediately: boolean) => {
        const codeString = codeStringForExport;
        if (!codeString) {
            showNotification(t('app.1047'), 'error');
            return;
        }

        const handleCopyAndGo = () => {
            navigator.clipboard.writeText(codeString);
            showNotification(t('app.1048'), 'info');
            window.open('https://yepython.pp.ua/', '_blank', 'noopener,noreferrer');
            setConfirmationAction(null);
        };

        const openUrl = (code?: string) => {
             try {
                let url = 'https://yepython.pp.ua/';
                if (code) {
                    const encoder = new TextEncoder();
                    const uint8array = encoder.encode(code);
                    let binaryString = '';
                    uint8array.forEach((byte) => {
                        binaryString += String.fromCharCode(byte);
                    });
                    const base64 = btoa(binaryString);
                    const param = runImmediately ? 'runcode' : 'code';
                    url += `?${param}=${base64}`;
                }
                window.open(url, '_blank', 'noopener,noreferrer');
            } catch (e) {
                console.error("Error creating online IDE link:", e);
                showNotification(t('app.1049'), 'error');
            }
        };
        
        // A conservative limit for URL length. Base64 encoding adds ~33%.
        // 1500 * 4/3 = 2000. Most browsers support at least 2048 characters.
        const CODE_LENGTH_THRESHOLD = 1500;
        
        if (codeString.length > CODE_LENGTH_THRESHOLD) {
            setConfirmationAction({
                title: t('app.1050'),
                message: t('app.1051'),
                onConfirm: () => {
                    openUrl(codeString);
                    setConfirmationAction(null);
                },
                variant: 'primary',
                confirmText: t('app.1052'),
                cancelText: t('app.1121'),
                alternativeAction: {
                    text: t('app.1053'),
                    onClick: handleCopyAndGo,
                    title: t('app.1054')
                }
            });
        } else {
             confirmAction(
                () => openUrl(codeString),
                t('app.1055'),
                t('app.1056'),
                t('app.1057'),
                t('app.1058'),
                'primary'
            );
        }
    }, [codeStringForExport, showNotification, confirmAction]);


  const handleDuplicate = useCallback(() => { 
    if (distributePathState) return;
    if (selectedShapeIds.length > 0) {
        const newSelectedIds = duplicateShape(selectedShapeIds) as string[];
        setSelectedShapeIds(newSelectedIds);
    }
  }, [selectedShapeIds, duplicateShape]);

  const handleDelete = useCallback(() => { 
    if (distributePathState) return;
    if (selectedShapeIds.length > 0) {
        setConfirmationAction({
            title: t('app.1125'),
            message: t('app.1126'),
            onConfirm: () => {
                const idsToDelete = [...selectedShapeIds];
                setSelectedShapeIds([]);
                idsToDelete.forEach((id: string) => deleteShape(id));
                setConfirmationAction(null);
            },
            confirmText: t('action.confirm') || 'Підтвердити',
            cancelText: t('action.cancel') || 'Скасувати',
            variant: 'destructive'
        });
    }
  }, [selectedShapeIds, deleteShape, t, distributePathState]);

  const confirmDeleteShape = useCallback((id: string) => {
    if (distributePathState) return;
    setConfirmationAction({
        title: t('app.1125'),
        message: t('app.1126'),
        onConfirm: () => {
            deleteShape(id);
            setConfirmationAction(null);
        },
        confirmText: t('action.confirm') || 'Підтвердити',
        cancelText: t('action.cancel') || 'Скасувати',
        variant: 'destructive'
    });
  }, [deleteShape, t, distributePathState]);

  const handleAlignShapes = useCallback((alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom' | 'distribute-h' | 'distribute-v' | 'distribute-path', relativeTo: 'selection' | 'canvas', distributeOptions?: { orientAlongPath: boolean, orientationType: 'radial' | 'tangent' | 'parallel' | 'perpendicular' | 'custom', orientationAngle: number, rotateAlongPath: boolean }) => {
      if (distributePathState) {
          if (relativeTo !== 'canvas') return;
          if (alignment === 'distribute-h' || alignment === 'distribute-v' || alignment === 'distribute-path') return;
          
          const distributedShapes = applyDistributePathToShapes(shapes, distributePathState);
          const entityIds = new Set(distributePathState.entities.flatMap(e => e.ids));
          const shapesToAlign = distributedShapes.filter((s: any) => entityIds.has(s.id));
          
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          
          shapesToAlign.forEach(shape => {
              const bbox = getVisualBoundingBox(shape, undefined, distributedShapes);
              if (bbox) {
                  minX = Math.min(minX, bbox.x);
                  minY = Math.min(minY, bbox.y);
                  maxX = Math.max(maxX, bbox.x + bbox.width);
                  maxY = Math.max(maxY, bbox.y + bbox.height);
              }
          });
          
          if (minX === Infinity) return;
          
          const width = maxX - minX;
          const height = maxY - minY;
          let dx = 0;
          let dy = 0;

          if (alignment === 'left') dx = 0 - minX;
          else if (alignment === 'right') dx = canvasWidth - maxX;
          else if (alignment === 'center-h') dx = (canvasWidth / 2) - (minX + width / 2);
          else if (alignment === 'top') dy = 0 - minY;
          else if (alignment === 'bottom') dy = canvasHeight - maxY;
          else if (alignment === 'center-v') dy = (canvasHeight / 2) - (minY + height / 2);

          const newState = { ...distributePathState };
          if (distributePathState.type === 'circle') {
              newState.circleParams = { ...newState.circleParams, cx: newState.circleParams.cx + dx, cy: newState.circleParams.cy + dy };
          } else {
              newState.lineParams = { ...newState.lineParams, x1: newState.lineParams.x1 + dx, y1: newState.lineParams.y1 + dy, x2: newState.lineParams.x2 + dx, y2: newState.lineParams.y2 + dy };
          }
          setDistributePathState(newState);
          return;
      }

      const topLevelEntities: { ids: string[], bbox: { x: number, y: number, width: number, height: number } }[] = [];
      const processedIds = new Set<string>();
      
      for (const id of selectedShapeIds) {
          if (processedIds.has(id)) continue;
          const shape = shapes.find((s: any) => s.id === id);
          if (!shape) continue;
          
          if (shape.type === 'group') {
              const bbox = getVisualBoundingBox(shape, undefined, shapes);
              if (bbox) topLevelEntities.push({ ids: [id, ...(shape.shapeIds || [])], bbox });
              processedIds.add(id);
              (shape.shapeIds || []).forEach((cid: string) => processedIds.add(cid));
          } else if (shape.groupId) {
              const group = shapes.find((s: any) => s.id === shape.groupId && s.type === 'group');
              if (group) {
                  const bbox = getVisualBoundingBox(group, undefined, shapes);
                  if (bbox) topLevelEntities.push({ ids: [group.id, ...((group as GroupShape).shapeIds || [])], bbox });
                  processedIds.add(group.id);
                  ((group as GroupShape).shapeIds || []).forEach((cid: string) => processedIds.add(cid));
              } else {
                  const bbox = getVisualBoundingBox(shape, undefined, shapes);
                  if (bbox) topLevelEntities.push({ ids: [id], bbox });
                  processedIds.add(id);
              }
          } else {
              const bbox = getVisualBoundingBox(shape, undefined, shapes);
              if (bbox) topLevelEntities.push({ ids: [id], bbox });
              processedIds.add(id);
          }
      }

      if (alignment === 'distribute-path') {
          if (topLevelEntities.length < 2) return;
          
          const minX = Math.min(...topLevelEntities.map(e => e.bbox.x));
          const maxX = Math.max(...topLevelEntities.map(e => e.bbox.x + e.bbox.width));
          const minY = Math.min(...topLevelEntities.map(e => e.bbox.y));
          const maxY = Math.max(...topLevelEntities.map(e => e.bbox.y + e.bbox.height));
          
          const cx = relativeTo === 'canvas' ? canvasWidth / 2 : minX + (maxX - minX) / 2;
          const cy = relativeTo === 'canvas' ? canvasHeight / 2 : minY + (maxY - minY) / 2;
          const radius = relativeTo === 'canvas' ? Math.min(canvasWidth, canvasHeight) * 0.4 : Math.max(maxX - minX, maxY - minY) / 2;
          
          const originalShapes = shapes.map((s: any) => ({...s}));
          const newPathState: DistributePathState = {
              type: 'circle',
              circleParams: { cx, cy, radius: radius || 100 },
              lineParams: { x1: minX, y1: cy, x2: maxX, y2: cy },
              angleOffset: 0,
              orientAlongPath: distributeOptions?.orientAlongPath ?? false,
              orientationType: distributeOptions?.orientationType ?? 'radial',
              orientationAngle: distributeOptions?.orientationAngle ?? 0,
              rotateAlongPath: distributeOptions?.rotateAlongPath ?? false,
              alignment: 'center',
              originalShapes,
              entities: topLevelEntities.map(e => ({ ids: e.ids, originalBbox: { ...e.bbox } }))
          };
          
          setDistributePathState(newPathState);
          return;
      }

      if (relativeTo === 'selection' && topLevelEntities.length < 2) return;
      if (relativeTo === 'canvas' && topLevelEntities.length < 1) return;

      let targetX = 0;
      let targetY = 0;

      if (relativeTo === 'canvas') {
          if (alignment === 'left') targetX = 0;
          else if (alignment === 'right') targetX = canvasWidth;
          else if (alignment === 'center-h') targetX = canvasWidth / 2;
          else if (alignment === 'top') targetY = 0;
          else if (alignment === 'bottom') targetY = canvasHeight;
          else if (alignment === 'center-v') targetY = canvasHeight / 2;
      } else {
          if (alignment === 'left') targetX = Math.min(...topLevelEntities.map(e => e.bbox.x));
          else if (alignment === 'right') targetX = Math.max(...topLevelEntities.map(e => e.bbox.x + e.bbox.width));
          else if (alignment === 'center-h') {
              const minX = Math.min(...topLevelEntities.map(e => e.bbox.x));
              const maxX = Math.max(...topLevelEntities.map(e => e.bbox.x + e.bbox.width));
              targetX = minX + (maxX - minX) / 2;
          } else if (alignment === 'top') targetY = Math.min(...topLevelEntities.map(e => e.bbox.y));
          else if (alignment === 'bottom') targetY = Math.max(...topLevelEntities.map(e => e.bbox.y + e.bbox.height));
          else if (alignment === 'center-v') {
              const minY = Math.min(...topLevelEntities.map(e => e.bbox.y));
              const maxY = Math.max(...topLevelEntities.map(e => e.bbox.y + e.bbox.height));
              targetY = minY + (maxY - minY) / 2;
          }
      }

      setShapes((prev: any) => {
          if (alignment === 'distribute-h' || alignment === 'distribute-v') {
              if (topLevelEntities.length < 2 || (relativeTo === 'selection' && topLevelEntities.length < 3)) return prev;
              
              if (alignment === 'distribute-h') {
                  const sorted = [...topLevelEntities].sort((a, b) => a.bbox.x - b.bbox.x);
                  const minX = relativeTo === 'canvas' ? 0 : sorted[0].bbox.x;
                  const maxX = relativeTo === 'canvas' ? canvasWidth : sorted[sorted.length - 1].bbox.x + sorted[sorted.length - 1].bbox.width;
                  
                  let totalWidth = 0;
                  sorted.forEach(e => totalWidth += e.bbox.width);
                  
                  const spacing = (maxX - minX - totalWidth) / (relativeTo === 'canvas' ? sorted.length + 1 : sorted.length - 1);
                  
                  return prev.map((s: any) => {
                      const idx = sorted.findIndex(e => e.ids.includes(s.id));
                      if (idx === -1) return s;
                      if (relativeTo === 'selection' && (idx === 0 || idx === sorted.length - 1)) return s;
                      
                      let targetXForElement = minX + (relativeTo === 'canvas' ? spacing : 0);
                      for(let i=0; i<idx; i++) {
                         targetXForElement += sorted[i].bbox.width + spacing;
                      }
                      const dx = targetXForElement - sorted[idx].bbox.x;
                      
                      if (dx === 0) return s;
                      switch (s.type) {
                          case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap':
                              return { ...s, x: s.x + dx };
                          case 'ellipse': case 'polygon': case 'star':
                              return { ...s, cx: s.cx + dx };
                          case 'line': case 'bezier': case 'pencil': case 'polyline':
                              return { ...s, points: (s as any).points.map((p: any) => ({ ...p, x: p.x + dx })) };
                          default:
                              return s;
                      }
                  });
              } else {
                  const sorted = [...topLevelEntities].sort((a, b) => a.bbox.y - b.bbox.y);
                  const minY = relativeTo === 'canvas' ? 0 : sorted[0].bbox.y;
                  const maxY = relativeTo === 'canvas' ? canvasHeight : sorted[sorted.length - 1].bbox.y + sorted[sorted.length - 1].bbox.height;
                  
                  let totalHeight = 0;
                  sorted.forEach(e => totalHeight += e.bbox.height);
                  
                  const spacing = (maxY - minY - totalHeight) / (relativeTo === 'canvas' ? sorted.length + 1 : sorted.length - 1);
                  
                  return prev.map((s: any) => {
                      const idx = sorted.findIndex(e => e.ids.includes(s.id));
                      if (idx === -1) return s;
                      if (relativeTo === 'selection' && (idx === 0 || idx === sorted.length - 1)) return s;
                      
                      let targetYForElement = minY + (relativeTo === 'canvas' ? spacing : 0);
                      for(let i=0; i<idx; i++) {
                         targetYForElement += sorted[i].bbox.height + spacing;
                      }
                      const dy = targetYForElement - sorted[idx].bbox.y;
                      
                      if (dy === 0) return s;
                      switch (s.type) {
                          case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap':
                              return { ...s, y: s.y + dy };
                          case 'ellipse': case 'polygon': case 'star':
                              return { ...s, cy: s.cy + dy };
                          case 'line': case 'bezier': case 'pencil': case 'polyline':
                              return { ...s, points: (s as any).points.map((p: any) => ({ ...p, y: p.y + dy })) };
                          default:
                              return s;
                      }
                  });
              }
          }

          return prev.map((s: any) => {
              const entity = topLevelEntities.find(e => e.ids.includes(s.id));
              if (!entity) return s;

              let dx = 0;
              let dy = 0;

              if (alignment === 'left') dx = targetX - entity.bbox.x;
              else if (alignment === 'right') dx = targetX - (entity.bbox.x + entity.bbox.width);
              else if (alignment === 'center-h') dx = targetX - (entity.bbox.x + entity.bbox.width / 2);
              else if (alignment === 'top') dy = targetY - entity.bbox.y;
              else if (alignment === 'bottom') dy = targetY - (entity.bbox.y + entity.bbox.height);
              else if (alignment === 'center-v') dy = targetY - (entity.bbox.y + entity.bbox.height / 2);

              if (dx === 0 && dy === 0) return s;

              switch (s.type) {
                  case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap':
                      return { ...s, x: s.x + dx, y: s.y + dy };
                  case 'ellipse': case 'polygon': case 'star':
                      return { ...s, cx: s.cx + dx, cy: s.cy + dy };
                  case 'line': case 'bezier': case 'pencil': case 'polyline':
                      return { ...s, points: (s as any).points.map((p: any) => ({ x: p.x + dx, y: p.y + dy })) };
                  default:
                      return s;
              }
          });
      });
  }, [selectedShapeIds, shapes, setShapes, canvasWidth, canvasHeight]);

  const handleGroup = useCallback(() => {
    if (distributePathState) return;
    if (selectedShapeIds.length < 2) return;

    const targetLayerId = activeLayerId || (layers && layers.length > 0 ? layers[0].id : 'layer-1');
    const targetLayer = layers.find((l: any) => l.id === targetLayerId);

    if (targetLayer && targetLayer.locked) {
        setDrawingWarningModal({ show: true, reason: 'locked', layerId: targetLayerId });
        return;
    }

    const layersOfSelectedShapes = new Set<string>();
    const layerNamesOfSelectedShapes = new Set<string>();
    layers.forEach((layer: any) => {
        if (layer.shapeIds && layer.shapeIds.some((id: string) => selectedShapeIds.includes(id))) {
            layersOfSelectedShapes.add(layer.id);
            layerNamesOfSelectedShapes.add(layer.name);
        }
    });

    const executeGroup = () => {
        const newGroupId = `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        
        setHistoryState((prev: any) => {
            // Find max index of selected shapes in the shapes array
            const selectedIndices = prev.shapes
                .map((s: any, idx: number) => selectedShapeIds.includes(s.id) ? idx : -1)
                .filter((idx: number) => idx !== -1);
            const maxIndex = Math.max(...selectedIndices);
            
            // Extract selected shapes and update them with the new groupId
            const selectedShapes = prev.shapes
                .filter((s: any) => selectedShapeIds.includes(s.id))
                .map((s: any) => ({ ...s, groupId: newGroupId }));
            
            // Filter out selected shapes to get non-selected shapes
            let nonSelectedShapes = prev.shapes.filter((s: any) => !selectedShapeIds.includes(s.id));
            
            const groupIdsToRemove = new Set<string>();

            nonSelectedShapes = nonSelectedShapes.map((s: any) => {
                if (s.type === 'group' && s.shapeIds) {
                    const newShapeIds = s.shapeIds.filter((id: string) => !selectedShapeIds.includes(id));
                    if (newShapeIds.length !== s.shapeIds.length) {
                        if (newShapeIds.length < 2) {
                            groupIdsToRemove.add(s.id);
                        }
                        return { ...s, shapeIds: newShapeIds };
                    }
                }
                return s;
            }).filter((s: any) => !(s.type === 'group' && groupIdsToRemove.has(s.id)));
            
            if (groupIdsToRemove.size > 0) {
                nonSelectedShapes = nonSelectedShapes.map((s: any) => {
                    if (s.groupId && groupIdsToRemove.has(s.groupId)) {
                        return { ...s, groupId: undefined };
                    }
                    return s;
                });
            }

            // The insertion index in the nonSelectedShapes array
            // maxIndex is the index in the original array. The number of selected shapes before or at maxIndex is exactly selectedIndices.length.
            const insertIndex = maxIndex - selectedIndices.length + 1;
            
            const sortedSelectedShapeIds = selectedShapes.map((s: any) => s.id);
            const groupIndex = prev.shapes.filter((s: any) => s.type === 'group').length + 1;
            
            const groupShape: Shape = {
                type: 'group',
                id: newGroupId,
                name: `${t('group.defaultName') || 'Group'} ${groupIndex}`,
                tags: `group_${groupIndex}`,
                state: 'normal',
                stroke: 'none',
                strokeWidth: 0,
                shapeIds: sortedSelectedShapeIds, rotation: 0,
            };
            
            // Construct the new shapes array by inserting the selected shapes back at the maxIndex
            const newShapes = [
                ...nonSelectedShapes.slice(0, insertIndex),
                ...selectedShapes,
                ...nonSelectedShapes.slice(insertIndex)
            ];
            
            (groupShape as any).rotationCenter = getShapeCenter(groupShape, newShapes);
            newShapes.push(groupShape); // group element itself usually stays at the end or doesn't matter since it's just a logical container
            
            let newLayers = (prev.layers || []).map((layer: any) => {
                let shapeIds = layer.shapeIds || [];
                
                if (groupIdsToRemove.size > 0) {
                    shapeIds = shapeIds.filter((id: string) => !groupIdsToRemove.has(id));
                }

                if (layer.id !== targetLayerId) {
                    shapeIds = shapeIds.filter((id: string) => !selectedShapeIds.includes(id));
                } else {
                    // To maintain the logical ordering in the layer shapeIds as well, we should also extract and insert at max index
                    const layerSelectedIndices = shapeIds
                        .map((id: string, idx: number) => selectedShapeIds.includes(id) ? idx : -1)
                        .filter((idx: number) => idx !== -1);
                    
                    if (layerSelectedIndices.length > 0) {
                        const maxLayerIndex = Math.max(...layerSelectedIndices);
                        const layerInsertIndex = maxLayerIndex - layerSelectedIndices.length + 1;
                        
                        const nonSelectedShapeIds = shapeIds.filter((id: string) => !selectedShapeIds.includes(id));
                        
                        // The shapes to add might not all be in this layer originally, but we bring them here
                        // Maintain the order they had in the overall selection
                        shapeIds = [
                            ...nonSelectedShapeIds.slice(0, layerInsertIndex),
                            ...sortedSelectedShapeIds,
                            newGroupId,
                            ...nonSelectedShapeIds.slice(layerInsertIndex)
                        ];
                    } else {
                        // Fallback if none of the selected shapes were in this layer but we're moving them here
                        const shapesToAdd = selectedShapeIds.filter((id: string) => !shapeIds.includes(id));
                        shapeIds = [...shapeIds, ...shapesToAdd, newGroupId];
                    }
                }
                
                return { ...layer, shapeIds };
            });

            return { ...prev, shapes: newShapes, layers: newLayers };
        });
        
        setSelectedShapeIds([newGroupId]);
        showNotification(t('menu.edit.group') || 'Об\'єкти згруповано');
    };

    const checkGroupAndExecute = () => {
        const shapesWithGroup = shapes.filter((s: any) => selectedShapeIds.includes(s.id) && s.groupId !== undefined);
        if (shapesWithGroup.length > 0) {
            setGroupConfirmationModal({
                show: true,
                title: t('app.confirmGroupTitle') || 'Групування об\'єктів',
                message: t('app.confirmExtractAndGroup') || 'Деякі з вибраних об\'єктів вже належать до існуючих груп. Ви дійсно бажаєте вилучити їх з цих груп та згрупувати в нову?',
                onConfirm: () => {
                    executeGroup();
                    setGroupConfirmationModal(null);
                }
            });
        } else {
            executeGroup();
        }
    };

    if (layersOfSelectedShapes.size > 1 || (layersOfSelectedShapes.size === 1 && !layersOfSelectedShapes.has(targetLayerId))) {
        const fromLayers = Array.from(layerNamesOfSelectedShapes).join(', ');
        const toLayer = targetLayer ? targetLayer.name : targetLayerId;
        const msg = (t('app.confirmGroupDifferentLayers') || 'Об\'єкти з шарів "{from}" будуть згруповані та розміщені на активному шарі "{to}". Продовжити?').replace('{from}', fromLayers).replace('{to}', toLayer);
        
        setGroupConfirmationModal({
            show: true,
            title: t('app.confirmGroupTitle') || 'Групування об\'єктів',
            message: msg,
            onConfirm: () => {
                setGroupConfirmationModal(null);
                setTimeout(() => checkGroupAndExecute(), 0);
            }
        });
    } else {
        checkGroupAndExecute();
    }
  }, [selectedShapeIds, distributePathState, setHistoryState, showNotification, t, activeLayerId, layers]);

  const handleUngroup = useCallback(() => {
    if (distributePathState) return;
    if (selectedShapeIds.length === 0) return;
    
    setHistoryState((prev: any) => {
        const groupIdsToClear = new Set<string>();
        prev.shapes.forEach((s: any) => {
            if (selectedShapeIds.includes(s.id)) {
                if (s.type === 'group') groupIdsToClear.add(s.id);
                else if (s.groupId) groupIdsToClear.add(s.groupId);
            }
        });

        if (groupIdsToClear.size === 0) return prev;

        const newShapes = prev.shapes
            .filter((s: any) => !groupIdsToClear.has(s.id))
            .map((s: any) => {
                if (s.groupId && groupIdsToClear.has(s.groupId)) {
                    let newS = { ...s, groupId: undefined };
                    if (newS.rotationCenter) {
                        const C1 = newS.rotationCenter;
                        const C2 = getShapeCenter({ ...newS, rotationCenter: undefined }, prev.shapes);
                        if (C2) {
                            const C2_new = rotatePoint(C2, C1, newS.rotation || 0);
                            const dx = C2_new.x - C2.x;
                            const dy = C2_new.y - C2.y;
                            
                            switch (newS.type) {
                                case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap':
                                    newS.x += dx; newS.y += dy; break;
                                case 'ellipse': case 'polygon': case 'star':
                                    newS.cx += dx; newS.cy += dy; break;
                                case 'line': case 'bezier': case 'pencil': case 'polyline':
                                    newS.points = newS.points.map((p: any) => ({ x: p.x + dx, y: p.y + dy })); break;
                            }
                        }
                        delete newS.rotationCenter;
                    }
                    return newS;
                }
                return s;
            });
            
        let newLayers = (prev.layers || []).map((layer: any) => {
            if (!layer.shapeIds) return layer;
            return {
                ...layer,
                shapeIds: layer.shapeIds.filter((id: string) => !groupIdsToClear.has(id))
            };
        });

        const newlyUngroupedIds = prev.shapes.filter((s: any) => s.groupId && groupIdsToClear.has(s.groupId)).map((s: any) => s.id);
        setSelectedShapeIds(newlyUngroupedIds);
        showNotification(t('menu.edit.ungroup') || 'Групу розформовано');

        return { ...prev, shapes: newShapes, layers: newLayers };
    });
  }, [selectedShapeIds, distributePathState, setHistoryState, showNotification, t]);

  const handleExtractFromGroup = useCallback(() => {
    setExtractConfirmInfo(true);
  }, []);

  const confirmExtractFromGroup = useCallback(() => {
    setHistoryState((prev: any) => {
        let newShapes = [...prev.shapes];
        let newLayers = [...(prev.layers || [])];
        
        const groupsToUpdate = new Set<string>();
        selectedShapeIds.forEach((id: string) => {
            const shape = newShapes.find((s: any) => s.id === id);
            if (shape && shape.groupId) {
                groupsToUpdate.add(shape.groupId);
                const sIdx = newShapes.findIndex((s: any) => s.id === id);
                if (sIdx !== -1) {
                    newShapes[sIdx] = { ...shape, groupId: undefined };
                }
            }
        });
        
        groupsToUpdate.forEach(gid => {
            const gIdx = newShapes.findIndex((s: any) => s.id === gid);
            if (gIdx !== -1) {
                const groupShape = { ...newShapes[gIdx] };
                groupShape.shapeIds = groupShape.shapeIds.filter((id: string) => !selectedShapeIds.includes(id));
                if (groupShape.shapeIds.length === 0) {
                    newShapes.splice(gIdx, 1);
                    newLayers = newLayers.map((layer: any) => ({
                        ...layer,
                        shapeIds: layer.shapeIds ? layer.shapeIds.filter((id: string) => id !== gid) : []
                    }));
                } else {
                    newShapes[gIdx] = groupShape;
                }
            }
        });
        
        return { ...prev, shapes: newShapes, layers: newLayers };
    });
    setExtractConfirmInfo(false);
  }, [selectedShapeIds, setHistoryState]);

  const canGroup = useMemo(() => {
    return selectedShapeIds.length >= 2 && !distributePathState;
  }, [selectedShapeIds.length, distributePathState]);

  const canUngroup = useMemo(() => {
    if (selectedShapeIds.length === 0 || distributePathState) return false;
    return selectedShapes.some((s: any) => s.type === 'group' || !!s.groupId);
  }, [selectedShapeIds.length, distributePathState, selectedShapes]);

  const canExtractFromGroup = useMemo(() => {
    if (selectedShapeIds.length === 0 || distributePathState) return false;
    return selectedShapes.some((s: any) => !!s.groupId);
  }, [selectedShapeIds.length, distributePathState, selectedShapes]);

  const canFlip = useMemo(() => {
    return selectedShapeIds.length > 0 && !distributePathState;
  }, [selectedShapeIds.length, distributePathState]);

  const canConvertToPath = useMemo(() => {
    if (!selectedShape) return false;
    return ['rectangle', 'ellipse', 'triangle', 'right-triangle', 'rhombus', 'trapezoid', 'parallelogram', 'polygon', 'star', 'arc'].includes(selectedShape.type);
  }, [selectedShape]);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            showNotification(`${t('app.1059')} ${err.message}`, 'error');
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  }, [showNotification]);

    const handleLocateSelectedShape = useCallback(() => {
        if ((selectedShapeIds.length === 0 && !distributePathState) || !viewportRef.current) return;
        
        let selectedShapes = displayedShapes.filter((s: any) => selectedShapeIds.includes(s.id));
        
        if (distributePathState) {
            const distributedIds = new Set(distributePathState.entities.flatMap(e => e.ids));
            selectedShapes = displayedShapes.filter((s: any) => distributedIds.has(s.id));
            
            if (distributePathState.type === 'shape' && distributePathState.shapePathParams?.pathShape) {
                selectedShapes.push(distributePathState.shapePathParams.pathShape as any);
            } else if (distributePathState.type === 'line') {
                 selectedShapes.push({
                     id: 'dummy-line',
                     type: 'line',
                     points: [{x: distributePathState.lineParams.x1, y: distributePathState.lineParams.y1}, {x: distributePathState.lineParams.x2, y: distributePathState.lineParams.y2}],
                     strokeWidth: 1
                 } as any);
            } else if (distributePathState.type === 'circle') {
                 selectedShapes.push({
                     id: 'dummy-circle',
                     type: 'ellipse',
                     cx: distributePathState.circleParams.cx,
                     cy: distributePathState.circleParams.cy,
                     rx: distributePathState.circleParams.radius,
                     ry: distributePathState.circleParams.radius,
                     strokeWidth: 1,
                     rotation: 0
                 } as any);
            }
        }

        if (selectedShapes.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const shape of selectedShapes) {
            const bbox = getVisualBoundingBox(shape, undefined, displayedShapes);
            if (bbox) {
                minX = Math.min(minX, bbox.x);
                minY = Math.min(minY, bbox.y);
                maxX = Math.max(maxX, bbox.x + bbox.width);
                maxY = Math.max(maxY, bbox.y + bbox.height);
            }
        }

        if (minX === Infinity || maxX <= minX || maxY <= minY) return;

        const shapeBbox = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };

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
    }, [selectedShapeIds, displayedShapes, distributePathState, showAxes, viewportSize, setViewTransform]);

    useEffect(() => {
        if (selectedShapeIds.length > 1 && activeTool === 'edit-points') {
            setActiveTool('select');
        }
    }, [selectedShapeIds, activeTool, setActiveTool]);

  useEffect(() => {
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {
      if (selectedShapeIds.length === 0) return;

      setShapes(prevShapes => {
          let hasChanges = false;
          let newShapes = [...prevShapes];
          
          const getAffectedIds = (ids: string[]): string[] => {
              let affected: string[] = [];
              const addId = (id: string) => {
                  if (!affected.includes(id)) affected.push(id);
                  const s = newShapes.find(sh => sh.id === id);
                  if (s?.type === 'group' && s.shapeIds) {
                      s.shapeIds.forEach(addId);
                  }
              };
              ids.forEach(addId);
              return affected;
          };
          
          const topLevelIds = selectedShapeIds;
          
          for (const topId of topLevelIds) {
              const rootShape = newShapes.find(s => s.id === topId);
              if (!rootShape) continue;

              const bbox = getVisualBoundingBox(rootShape, undefined, newShapes);
              if (!bbox) continue;

              const centerAxis = direction === 'horizontal' ? bbox.x + bbox.width / 2 : bbox.y + bbox.height / 2;

              const idsToFlip = getAffectedIds([topId]);
              
              for (let i = 0; i < newShapes.length; i++) {
                  if (idsToFlip.includes(newShapes[i].id)) {
                      hasChanges = true;
                      let newS = { ...newShapes[i] } as any;

                      if ('rotation' in newS && typeof newS.rotation === 'number') {
                          newS.rotation = (360 - newS.rotation) % 360;
                      }

                      if (direction === 'vertical') {
                          if (newS.rotationHandlePosition === 'bottom') {
                              delete newS.rotationHandlePosition;
                          } else {
                              newS.rotationHandlePosition = 'bottom';
                          }
                      }
                      if (direction === 'horizontal') {
                          if (newS.type === 'text') {
                              newS.x = 2 * centerAxis - newS.x;
                          } else if ('x' in newS && 'width' in newS) {
                              newS.x = 2 * centerAxis - newS.x - newS.width;
                          } else if ('cx' in newS) {
                              newS.cx = 2 * centerAxis - newS.cx;
                          } else if (['line', 'polyline', 'bezier', 'pencil'].includes(newS.type)) {
                              newS.points = newS.points.map((p: any) => ({ x: 2 * centerAxis - p.x, y: p.y }));
                          }
                      } else {
                          if (newS.type === 'text') {
                              newS.y = 2 * centerAxis - newS.y;
                          } else if ('y' in newS && 'height' in newS) {
                              newS.y = 2 * centerAxis - newS.y - newS.height;
                          } else if ('cy' in newS) {
                              newS.cy = 2 * centerAxis - newS.cy;
                          } else if (['line', 'polyline', 'bezier', 'pencil'].includes(newS.type)) {
                              newS.points = newS.points.map((p: any) => ({ x: p.x, y: 2 * centerAxis - p.y }));
                          }
                      }

                      if (newS.rotationCenter) {
                          if (direction === 'horizontal') {
                              newS.rotationCenter = { x: 2 * centerAxis - newS.rotationCenter.x, y: newS.rotationCenter.y };
                          } else {
                              newS.rotationCenter = { x: newS.rotationCenter.x, y: 2 * centerAxis - newS.rotationCenter.y };
                          }
                      }

                      if (direction === 'horizontal' && newS.type === 'triangle') {
                          newS.topVertexOffset = -(newS.topVertexOffset || 0);
                      }
                      if (direction === 'horizontal' && newS.type === 'parallelogram') {
                          newS.angle = 180 - (newS.angle || 90);
                      }
                      if (direction === 'horizontal' && newS.type === 'trapezoid') {
                          const temp = newS.topLeftOffsetRatio;
                          newS.topLeftOffsetRatio = newS.topRightOffsetRatio;
                          newS.topRightOffsetRatio = temp;
                      }
                      if (['polygon', 'star', 'triangle', 'right-triangle', 'trapezoid', 'parallelogram', 'image', 'bitmap', 'arc'].includes(newS.type)) {
                          if (direction === 'horizontal') {
                              newS.isFlippedHorizontally = !newS.isFlippedHorizontally;
                          } else {
                              newS.isFlippedVertically = !newS.isFlippedVertically;
                          }
                      }

                      newShapes[i] = newS;
                  }
              }
          }
          
          return hasChanges ? newShapes : prevShapes;
      });
  }, [selectedShapeIds, setShapes, getVisualBoundingBox]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {

        if (e.key === 'F11') {
            e.preventDefault();
            handleToggleFullscreen();
            return;
        }

        if (e.key === 'Escape' && isFullscreen) {
            e.preventDefault(); // Block the default browser action of exiting fullscreen.
        }

        const isEditingText = (e.target as HTMLElement).matches('input, textarea, [contenteditable="true"]');
        if (isEditingText || inlineEditingShapeId) return;

        if (e.key === '?' || e.code === 'Slash') {
            e.preventDefault();
            setIsShortcutsModalOpen(prev => !prev);
            return;
        }

        // Modifier shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.code) {
                case 'KeyH':
                    if (selectedShapeIds.length > 0) {
                        e.preventDefault();
                        handleFlip('horizontal');
                    }
                    return;
                case 'KeyV':
                    if (selectedShapeIds.length > 0) {
                        e.preventDefault();
                        handleFlip('vertical');
                    }
                    return;
                case 'KeyD':
                    if (selectedShapeIds.length > 0 && !distributePathState) {
                        e.preventDefault();
                        const newIds = duplicateShape(selectedShapeIds) as string[];
                        setSelectedShapeIds(newIds);
                    }
                    return;
                case 'KeyG':
                    if (selectedShapeIds.length > 0 && !distributePathState) {
                        e.preventDefault();
                        if (e.shiftKey) {
                            handleUngroup();
                        } else {
                            handleGroup();
                        }
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
        if (selectedShapeIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();

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

            if (selectedShapeIds.length === 1) {
                const shapeToMove = shapes.find((s: any) => s.id === selectedShapeIds[0]);
                if (!shapeToMove) return;

                let bestDx = dx;
                let bestDy = dy;
                let newSnapLines = { x: null as number | null, y: null as number | null };

                if ((enableSnapping || showCenterGuides) && !e.altKey) {
                    const movingBboxOriginal = getVisualBoundingBox(shapeToMove, undefined, shapes);
                    if (movingBboxOriginal) {
                        const movingBox = {
                            x: movingBboxOriginal.x + dx,
                            y: movingBboxOriginal.y + dy,
                            width: movingBboxOriginal.width,
                            height: movingBboxOriginal.height
                        };
                        const movingCenters = {
                            x: movingBox.x + movingBox.width / 2,
                            y: movingBox.y + movingBox.height / 2
                        };

                        const SNAP_DIST = 5 / viewTransform.scale;
                        let minSnapDistX = SNAP_DIST;
                        let minSnapDistY = SNAP_DIST;

                        if (enableSnapping) {
                            const otherShapes = shapes.filter((s: any) => !selectedShapeIds.includes(s.id) && s.groupId === undefined);

                            for (const other of otherShapes) {
                                const otherBox = getVisualBoundingBox(other, undefined, shapes);
                                if (!otherBox) continue;

                                const otherCenters = { x: otherBox.x + otherBox.width/2, y: otherBox.y + otherBox.height/2 };
                                
                                if (dx !== 0) {
                                    const xTargets = [
                                        { moving: movingBox.x, target: otherBox.x },
                                        { moving: movingBox.x, target: otherBox.x + otherBox.width },
                                        { moving: movingCenters.x, target: otherCenters.x },
                                        { moving: movingBox.x + movingBox.width, target: otherBox.x },
                                        { moving: movingBox.x + movingBox.width, target: otherBox.x + otherBox.width }
                                    ];
                                    for (const t of xTargets) {
                                        const diff = Math.abs(t.moving - t.target);
                                        if (diff < minSnapDistX) {
                                            minSnapDistX = diff;
                                            bestDx = dx - (t.moving - t.target);
                                            newSnapLines.x = t.target;
                                        }
                                    }
                                }

                                if (dy !== 0) {
                                    const yTargets = [
                                        { moving: movingBox.y, target: otherBox.y },
                                        { moving: movingBox.y, target: otherBox.y + otherBox.height },
                                        { moving: movingCenters.y, target: otherCenters.y },
                                        { moving: movingBox.y + movingBox.height, target: otherBox.y },
                                        { moving: movingBox.y + movingBox.height, target: otherBox.y + otherBox.height }
                                    ];
                                    for (const t of yTargets) {
                                        const diff = Math.abs(t.moving - t.target);
                                        if (diff < minSnapDistY) {
                                            minSnapDistY = diff;
                                            bestDy = dy - (t.moving - t.target);
                                            newSnapLines.y = t.target;
                                        }
                                    }
                                }
                            }
                        }

                        if (showCenterGuides) {
                            if (dx !== 0) {
                                const diff = Math.abs(movingCenters.x - canvasWidth / 2);
                                if (diff < minSnapDistX) {
                                    minSnapDistX = diff;
                                    bestDx = dx - (movingCenters.x - canvasWidth / 2);
                                    newSnapLines.x = canvasWidth / 2;
                                }
                            }
                            if (dy !== 0) {
                                const diff = Math.abs(movingCenters.y - canvasHeight / 2);
                                if (diff < minSnapDistY) {
                                    minSnapDistY = diff;
                                    bestDy = dy - (movingCenters.y - canvasHeight / 2);
                                    newSnapLines.y = canvasHeight / 2;
                                }
                            }
                        }
                    }
                }

                dx = bestDx;
                dy = bestDy;

                setKeyboardSnapLines(newSnapLines);
                if (keyboardSnapLinesTimeout.current) clearTimeout(keyboardSnapLinesTimeout.current);
                keyboardSnapLinesTimeout.current = setTimeout(() => {
                    setKeyboardSnapLines({ x: null, y: null });
                }, 1000);
            }

            const moveSingleShape = (shape: Shape, dx: number, dy: number): Shape => {
                let newShape: Shape;
                switch (shape.type) {
                    case 'line':
                        newShape = {...shape, points: [{...shape.points[0]}, {...shape.points[1]}]};
                        break;
                    case 'pencil':
                    case 'polyline':
                    case 'bezier':
                        newShape = {...shape, points: shape.points.map((p: any) => ({...p}))};
                        break;
                    case 'group':
                        newShape = {...shape};
                        break;
                    default:
                        newShape = {...shape};
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
                    case 'group':
                        // Do not move group directly, move children
                        break;
                }
                return newShape;
            };

            const updatedShapes = shapes.map((s: any) => {
                if (selectedShapeIds.includes(s.id) && s.type !== 'group') {
                    return moveSingleShape(s, dx, dy);
                }
                // also move children of selected groups
                const parentGroup = shapes.find(g => g.type === 'group' && selectedShapeIds.includes(g.id) && g.shapeIds.includes(s.id));
                if (parentGroup) {
                    return moveSingleShape(s, dx, dy);
                }
                return s;
            });

            const shapesToUpdate = updatedShapes.filter((s: any) => {
                if (selectedShapeIds.includes(s.id)) return true;
                const parentGroup = shapes.find(g => g.type === 'group' && selectedShapeIds.includes(g.id));
                if (parentGroup && parentGroup.type === 'group' && parentGroup.shapeIds.includes(s.id)) return true;
                return false;
            });
            updateShapes(shapesToUpdate);
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
                if (distributePathState) {
                    e.preventDefault();
                    return;
                }
                e.preventDefault();
                if (activeTool === 'edit-points' && selectedShapeIds.length === 1 && activePointIndex !== null) {
                    deletePoint(selectedShapeIds[0], activePointIndex);
                } else if (selectedShapeIds.length > 0) {
                    selectedShapeIds.forEach((id: string) => deleteShape(id));
                }
                return;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedShapeIds, activeTool, activePointIndex, deletePoint, deleteShape, duplicateShape, undo, redo, canUndo, canRedo, handleSaveProject, handleSetActiveTool, shapes, updateShape, inlineEditingShapeId, handleToggleFullscreen, isFullscreen, handleGroup, handleUngroup]);

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
        if (selectedShapeIds.length > 0) {
            selectedShapeIds.forEach((id: string) => convertToPath(id));
        }
    }, [selectedShapeIds, convertToPath]);

    const handleOpenSettings = useCallback(() => {
        setSettingsInitialTab('canvas');
        setIsSettingsOpen(true);
    }, []);

    const handleOpenMobileLeft = useCallback(() => {
        setIsLeftPanelVisible((p: any) => !p);
    }, []);

    const handleOpenMobileRight = useCallback(() => {
        setIsRightPanelVisible((p: any) => !p);
    }, []);
    
    const handleSwitchToLocalFromError = useCallback(() => {
        setGeneratorType('local');
        setError(null); // Clear the Gemini error
        showNotification(t('app.1060'), 'info');
    }, [showNotification]);
    
    const handleOpenSettingsToCode = useCallback(() => {
        setSettingsInitialTab('code');
        setIsSettingsOpen(true);
    }, []);
    
    const handleStartInlineEdit = useCallback((shapeId: string) => {
        setInlineEditingShapeId(shapeId);
        setSelectedShapeIds([shapeId]);
    }, []);

    const handleStopInlineEdit = useCallback(() => {
        // When editing stops, create a new history state with the final text.
        // This prevents creating a history entry for every single keystroke.
        const shapeToUpdate = shapes.find((s: any) => s.id === inlineEditingShapeId);
        if (shapeToUpdate) {
            // By calling setShapes (from useHistoryState), we create a new history entry.
            setShapes(shapes);
        }
        setInlineEditingShapeId(null);
    }, [inlineEditingShapeId, shapes, setShapes]);

    const handleUpdateInlineText = useCallback((newText: string) => {
        if (!inlineEditingShapeId) return;
        // This is a "preview" update, it doesn't create a history state yet.
        const currentShapes = shapes.map((s: any) => {
            if (s.id === inlineEditingShapeId && s.type === 'text') {
                return { ...s, text: newText };
            }
            return s;
        });
        // We use updateShapesWithoutHistory to update without creating a history entry.
        // This is the proper way to get the desired behavior.
        updateShapesWithoutHistory(currentShapes);

    }, [inlineEditingShapeId, shapes, setShapes]);
    
    const handleSaveApiKey = useCallback((key: string | null) => {
        setApiKey(key);
        setIsApiKeyModalOpen(false);
        if (key) {
            showNotification(t('app.1061'), 'info');
        } else {
            showNotification(t('app.1062'), 'info');
        }
    }, [showNotification]);

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

    // On initial load, check for an autosaved project or URL shared project
    useEffect(() => {
        const fullUrl = window.location.href;
        if (fullUrl.includes('project=') || fullUrl.includes('p=') || fullUrl.includes('%23project=')) {
            const decompressed = decompressProjectFromUrl(fullUrl);
            if (decompressed && decompressed.rawJson) {
                try {
                    processLoadedData(decompressed.rawJson, decompressed.data?.projectName);
                    showNotification(t('share.loaded') || 'Проєкт успішно завантажено за посиланням!', 'info');
                    window.history.replaceState(null, '', window.location.pathname);
                    return;
                } catch (err) {
                    console.error("Failed to load project from URL share link:", err);
                    showNotification(t('share.error') || 'Помилка відкриття проєкту за посиланням', 'error');
                }
            }
        }

        try {
            const data = localStorage.getItem(AUTOSAVE_KEY);
            if (data) {
                setAutosavedProjectData(data);
            }
        } catch (e) {
            console.error("Failed to read autosave from localStorage", e);
        }
    }, [processLoadedData, showNotification, t]);

    // Autosave interval
    useEffect(() => {
        if (!isProjectActive || !hasUnsavedChanges) {
            return;
        }

        const handler = setInterval(() => {
            try {
                const saveData = getSaveData(projectName);
                const autosavePayload = { ...saveData, autosaveTimestamp: new Date().toISOString() };
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosavePayload));
                showNotification(t('app.1063'), 'info', 1500);
            } catch (e) {
                console.error("Failed to autosave project to localStorage", e);
                showNotification(t('app.1064'), 'error');
            }
        }, AUTOSAVE_INTERVAL);

        return () => clearInterval(handler);
    }, [isProjectActive, hasUnsavedChanges, getSaveData, projectName, showNotification]);

    const handleRestoreAutosave = () => {
        if (autosavedProjectData) {
            processLoadedData(autosavedProjectData);
            setAutosavedProjectData(null);
            // processLoadedData already clears the key, but to be safe:
            localStorage.removeItem(AUTOSAVE_KEY);
        }
    };

    const handleDismissAutosave = () => {
        localStorage.removeItem(AUTOSAVE_KEY);
        setAutosavedProjectData(null);
        showNotification(t('app.1065'), 'info');
    };

  return (
    <div className="h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-sans flex flex-col selection:bg-[var(--accent-primary)] selection:text-[var(--accent-text)] overflow-hidden">
      {isScreenTooSmall && (
        <div className="fixed inset-0 bg-[var(--bg-app)] flex items-center justify-center z-[100] text-center p-8">
          <div className="flex flex-col items-center gap-6">
            <SadMonitorIcon size={96} className="text-[var(--text-tertiary)]" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t('app.1066')}</h1>
              <p className="text-[var(--text-secondary)]">
                {t('app.1067')}
                <br />
                {t('app.1068')}
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
            isDistributingPath={!!distributePathState}
            onGenerate={handleGenerateCode}
            showGenerateButton={generatorType === 'gemini'}
            onNewProject={handleOpenNewProjectModal}
            onSaveProject={handleSaveProject}
            canSave={isProjectActive && (hasUnsavedChanges || !fileHandle)}
            onSaveProjectAs={() => setIsSaveAsModalOpen(true)}
            onSaveAsTemplate={() => setIsSaveTemplateModalOpen(true)}
            onLoadProject={handleLoadProject}
            onImportImage={handleImportImage}
            onExport={() => setIsExportModalOpen(true)}
            onShareLink={handleShareLink}
            showShareLink={activeCheats.has('003')}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onDuplicate={handleDuplicate}
            isShapeSelected={!(selectedShapeIds.length === 0)}
            onDelete={handleDelete}
            onGroup={handleGroup}
            canGroup={canGroup}
            onUngroup={handleUngroup}
            canUngroup={canUngroup}
            onExtractFromGroup={handleExtractFromGroup}
            canExtractFromGroup={canExtractFromGroup}
            onFlipH={() => handleFlip('horizontal')}
            onFlipV={() => handleFlip('vertical')}
            canFlip={canFlip}
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
            showCenterGuides={showCenterGuides}
            setShowCenterGuides={setShowCenterGuides}
            enableSnapping={enableSnapping}
            setEnableSnapping={setEnableSnapping}
            onOpenSettings={handleOpenSettings}
            theme={theme}
            setTheme={setTheme}
            projectName={projectName}
            isProjectActive={isProjectActive}
            onGoHome={handleGoHome}
            onOpenAbout={() => setIsAboutModalOpen(true)}
            onOpenHelp={() => setIsHelpModalOpen(true)}
            onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
            onOpenFeedback={() => setIsFeedbackModalOpen(true)}
          />

          {isProjectActive && <TopToolbar
              allShapes={shapes}
              distributePathState={distributePathState}
              onDistributePathChange={setDistributePathState}
              isSelectingPathShape={isSelectingPathShape}
              onToggleSelectPathShape={() => setIsSelectingPathShape(prev => !prev)}
              isDistributingPath={!!distributePathState}
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
              onGroup={handleGroup}
              canGroup={canGroup}
              onUngroup={handleUngroup}
              canUngroup={canUngroup}
              onExtractFromGroup={handleExtractFromGroup}
              canExtractFromGroup={canExtractFromGroup}
              onFlipH={() => handleFlip('horizontal')}
              onFlipV={() => handleFlip('vertical')}
              canFlip={canFlip}
              onAlignShapes={handleAlignShapes}
              isShapeSelected={selectedShapeIds.length > 0}
              onOpenMobileLeft={handleOpenMobileLeft}
              onOpenMobileRight={handleOpenMobileRight}
              selectedShapes={selectedShapes}
              updateShape={updateShape}
              updateShapes={updateShapes}
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

           <main className="flex-grow grid grid-cols-1 md:grid-cols-[380px_1fr] lg:grid-cols-[380px_1fr_295px] min-h-0">
             
            {/* Left Column */}
            {isProjectActive && <aside className={`${isLeftPanelVisible ? 'fixed inset-0 bg-[var(--bg-app)]/95 backdrop-blur-sm z-40 p-4 flex flex-col' : 'hidden'} md:static md:bg-transparent md:z-auto md:flex flex-col gap-4 min-h-0 bg-[var(--bg-primary)]/50 md:p-2`}>
                <div className="md:hidden flex justify-end mb-4">
                    <button onClick={() => setIsLeftPanelVisible(false)} className="p-2 rounded-lg text-[var(--accent-text)]"><XIcon/></button>
                </div>
                <LeftToolbar
                    activeTool={activeTool}
                    setActiveTool={handleSetActiveTool}
                    activeCheats={activeCheats}
                />
                <div className="flex-1 min-h-0 mt-2">
                    <CodeDisplay 
                        codeLines={generatedCodeLines} isLoading={isLoading} error={error} onUpdate={handleGenerateCode}
                        onPreview={() => setIsPreviewOpen(true)} hasUnsyncedChanges={hasUnsyncedChangesWithCode}
                        opacity={1} setOpacity={() => {}}
                        selectedShapeIds={selectedShapeIds}
                        highlightCodeOnSelection={highlightCodeOnSelection}
                        setHighlightCodeOnSelection={setHighlightCodeOnSelection}
                        showLineNumbers={showLineNumbers}
                        setShowLineNumbers={setShowLineNumbers}
                        showComments={showComments}
                        setShowComments={setShowComments}
                        generatorType={generatorType}
                        // FIX: Changed prop name from `onSwitchToLocalFromError` to `onSwitchToLocalGenerator` to match `CodeDisplayProps`.
                        onSwitchToLocalGenerator={handleSwitchToLocalFromError}
                        onOpenSettingsToGenerator={handleOpenSettingsToCode}
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
                                    onDrawingAttempt={handleDrawingAttempt}
                                    distributePathState={distributePathState}
                                    onDistributePathChange={setDistributePathStateWithoutHistory}
                                    onDistributePathChangeEnd={handleDistributePathChangeEnd}
                                    isSelectingPathShape={isSelectingPathShape}
                                    onSelectPathShape={handleSelectPathShape}
                                    width={canvasWidth} height={canvasHeight} backgroundColor={previewCanvasBgColor ?? canvasBgColor} shapes={displayedShapes} lockedShapeIds={lockedShapeIds} addShape={addShape} addShapes={addShapes} updateShape={updateShape} updateShapes={updateShapes} activeTool={activeTool} drawMode={drawMode}
                                    fillColor={isFillEnabled ? (previewFillColor ?? fillColor) : 'none'} strokeColor={isStrokeEnabled ? (previewStrokeColor ?? strokeColor) : 'none'} strokeWidth={isStrokeEnabled ? strokeWidth : 0}
                                    textColor={previewTextColor ?? textColor}
                                    textFont={textFont}
                                    textFontSize={textFontSize}
                                    numberOfSides={numberOfSides} selectedShapeIds={selectedShapeIds} onSelectShape={handleSelectShape} isDrawingPolyline={isDrawingPolyline} polylinePoints={polylinePoints} setPolylinePoints={setPolylinePoints}
                                    onCompletePolyline={handleCompletePolyline} onCancelPolyline={handleCancelPolyline} isDrawingBezier={isDrawingBezier} bezierPoints={bezierPoints} setBezierPoints={setBezierPoints}
                                    onCompleteBezier={handleCompleteBezier} onCancelBezier={handleCancelBezier} showGrid={showGrid} gridSize={gridSize} snapStep={snapToGrid ? gridSnapStep : 1} viewTransform={viewTransform}
                                    setViewTransform={setViewTransform} activePointIndex={activePointIndex} setActivePointIndex={setActivePointIndex} showCursorCoords={showCursorCoords} showRotationAngle={showRotationAngle}
                                    pendingImage={pendingImage} setPendingImage={setPendingImage} setCursorPos={setCursorPos}
                                    isImportingImage={isImportingImage}
                                    showNotification={showNotification}
                                    onStartInlineEdit={handleStartInlineEdit}
                                    inlineEditingShapeId={inlineEditingShapeId}
                                    keyboardSnapLines={keyboardSnapLines}
                                    showCenterGuides={showCenterGuides}
                                    enableSnapping={enableSnapping}
                                />
                            </div>
                            <button onClick={fitCanvasToView} title={t('menu.view.fit')} className="absolute bottom-4 right-4 z-10 p-2 bg-[var(--bg-primary)] text-[var(--text-secondary)] rounded-full shadow-lg hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
                                <FitToScreenIcon />
                            </button>
                        </div>
                        <StatusBar 
                            zoomLevel={viewTransform.scale} 
                            cursorPos={cursorPos}
                            onZoomChange={handleZoomChange}
                            onResetZoom={handleResetZoom}
                            onLocateSelectedShape={handleLocateSelectedShape}
                            selectedShapeIds={selectedShapeIds}
                            showCursorCoords={showCursorCoords}
                            setShowCursorCoords={setShowCursorCoords}
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
                        autosavedProjectData={autosavedProjectData}
                        onRestoreAutosave={handleRestoreAutosave}
                        onDismissAutosave={handleDismissAutosave}
                    />
                )}
            </div>
            
             {/* Right Column */}
            {isProjectActive && <aside className={`${isRightPanelVisible ? 'fixed inset-0 bg-[var(--bg-app)]/95 backdrop-blur-sm z-40 p-4 flex flex-col' : 'hidden'} lg:static lg:bg-transparent lg:z-auto lg:flex flex-col gap-4 overflow-y-auto md:p-2`}>
                 <div className="lg:hidden flex justify-end mb-4">
                    <button onClick={() => setIsRightPanelVisible(false)} className="p-2 rounded-lg text-[var(--accent-text)]"><XIcon /></button>
                </div>
                 <div className="flex-[3_3_0%] min-h-0 flex flex-col shadow-lg bg-[var(--bg-primary)] rounded-lg overflow-hidden mt-1">
                    <div className="flex border-b border-[var(--border-primary)] flex-shrink-0">
                        <button 
                            className={`flex-1 py-2 text-sm font-medium ${rightPanelTab === 'shapes' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
                            onClick={() => setRightPanelTab('shapes')}
                        >
                            {t('shape.list') || 'Фігури'}
                        </button>
                        <button 
                            className={`flex-1 py-2 text-sm font-medium ${rightPanelTab === 'layers' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
                            onClick={() => setRightPanelTab('layers')}
                        >
                            {t('layer.title') || 'Шари'}
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        <div className={`absolute inset-0 ${rightPanelTab === 'layers' ? 'block' : 'hidden'}`}>
                            <LayerList
                                layers={layers}
                                activeLayerId={activeLayerId}
                                onAddLayer={addLayer}
                                onDeleteLayer={deleteLayer}
                                onClearLayer={clearLayer}
                                onToggleVisibility={toggleLayerVisibility}
                                onToggleLock={toggleLayerLock}
                                onSetActiveLayer={setActiveLayer}
                                onUpdateLayerName={updateLayerName}
                                onMoveLayer={moveLayer}
                                shapes={shapes}
                                canvasWidth={canvasWidth}
                                canvasHeight={canvasHeight}
                                canvasBgColor={canvasBgColor}
                            />
                        </div>
                        <div className={`absolute inset-0 ${rightPanelTab === 'shapes' ? 'block' : 'hidden'}`}>
                            <ShapeList
                                distributePathState={distributePathState}
                                shapes={shapes}
                                lockedShapeIds={lockedShapeIds}
                                selectedShapeIds={selectedShapeIds}
                                onSelectShape={handleSelectShape}
                                onDeleteShape={confirmDeleteShape}
                                onMoveShape={moveShape}
                                onUpdateShape={updateShape}
                                onReorderShape={reorderShape}
                                showTkinterNames={showTkinterNames}
                                layers={layers}
                                activeLayerId={activeLayerId}
                                onMoveToLayer={moveToLayer}
                                onSetActiveLayer={setActiveLayer}
                                onLayerWarning={(reason, layerId, action) => setDrawingWarningModal({ show: true, reason, layerId, action })}
                                ignoreHiddenWarningForLayer={ignoreHiddenWarningForLayer}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex-[2_2_0%] min-h-0">
                    <PropertyEditor onExtractFromGroup={handleExtractFromGroup} handleFlip={handleFlip} showSystemTags={showSystemTags} 
                        distributePathState={distributePathState}
                        onDistributePathChange={setDistributePathState}
                        onConfirmDistributePath={() => {
                            if (distributePathState) {
                                setSelectedShapeIds(distributePathState.entities.map(e => e.ids[0]));
                            }
                            setHistoryState((prev: any) => {
                                const newShapes = applyDistributePathToShapes(prev.shapes, prev.distributePathState!);
                                return { ...prev, shapes: newShapes, distributePathState: null };
                            });
                        }}
                        onCancelDistributePath={() => {
                            if (distributePathState) {
                                setSelectedShapeIds(distributePathState.entities.map(e => e.ids[0]));
                            }
                            setDistributePathState(null);
                        }}
                        selectedShapes={selectedShapes} allShapes={shapes} updateShape={updateShape} updateShapes={updateShapes} deleteShape={deleteShape} duplicateShape={duplicateShape}
                        activeTool={activeTool} activePointIndex={activePointIndex} setActivePointIndex={setActivePointIndex}
                        deletePoint={deletePoint} addPoint={addPoint} convertToPath={convertToPath} showNotification={showNotification}
                        setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview}
                        fillColor={fillColor} strokeColor={strokeColor}
                    />
                </div>
            </aside>}
          </main>
          
          {isCheatCodeModalOpen && (
            <CheatCodeModal
                isOpen={isCheatCodeModalOpen}
                onClose={() => setIsCheatCodeModalOpen(false)}
                onActivate={handleActivateCheat}
                showNotification={showNotification}
                activeCheats={activeCheats}
            />
          )}

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
              showAxes={showAxes} setShowAxes={setShowAxes} 
              showCenterGuides={showCenterGuides} setShowCenterGuides={setShowCenterGuides}
              enableSnapping={enableSnapping} setEnableSnapping={setEnableSnapping}
              showCursorCoords={showCursorCoords} setShowCursorCoords={setShowCursorCoords}
              showRotationAngle={showRotationAngle} setShowRotationAngle={setShowRotationAngle}
              showLineNumbers={showLineNumbers} setShowLineNumbers={setShowLineNumbers}
              generatorType={generatorType} setGeneratorType={setGeneratorType}
              highlightCodeOnSelection={highlightCodeOnSelection} setHighlightCodeOnSelection={setHighlightCodeOnSelection}
              autoGenerateComments={autoGenerateComments} setAutoGenerateComments={setAutoGenerateComments}
              showComments={showComments} setShowComments={setShowComments}
              generateTkinterTags={generateTkinterTags} setGenerateTkinterTags={setGenerateTkinterTags}
              showSystemTags={showSystemTags} setShowSystemTags={setShowSystemTags}
              outlineWithFill={outlineWithFill} setOutlineWithFill={setOutlineWithFill}
              maxRecentProjects={maxRecentProjects}
              setMaxRecentProjects={setMaxRecentProjects}
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
                shapes={shapesAtGenerationTime.filter((s: any) => !(s.type === 'image' && s.isImport))} 
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
                    projectName: t('app.1069'),
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
                alternativeAction={confirmationAction.alternativeAction}
              />
          )}
          {reorderConfirmInfo && (
              <ConfirmationModal
                isOpen={true}
                title={t('app.confirmReorderTitle') || 'Підтвердження дії'}
                message={reorderConfirmInfo.action === 'add' 
                    ? (t('app.confirmGroupAdd') || 'Ви збираєтесь додати фігуру до групи. Продовжити?') 
                    : (t('app.confirmGroupRemove') || 'Ви збираєтесь вилучити фігуру з групи. Продовжити?')}
                onConfirm={() => {
                    executeReorderShape(reorderConfirmInfo.draggedId, reorderConfirmInfo.targetId, reorderConfirmInfo.position, reorderConfirmInfo.action);
                    setReorderConfirmInfo(null);
                }}
                onClose={() => setReorderConfirmInfo(null)}
                confirmText={t('action.confirm') || 'Підтвердити'}
                cancelText={t('action.cancel') || 'Скасувати'}
              />
          )}
          {extractConfirmInfo && (
              <ConfirmationModal
                isOpen={true}
                title={t('app.confirmExtractTitle') || 'Вилучення з групи'}
                message={t('app.confirmExtractMessage') || 'Ви дійсно бажаєте вилучити вибрану фігуру (або фігури) з групи?'}
                onConfirm={() => {
                    confirmExtractFromGroup();
                    setExtractConfirmInfo(false);
                }}
                onClose={() => setExtractConfirmInfo(false)}
                confirmText={t('action.confirm') || 'Підтвердити'}
                cancelText={t('action.cancel') || 'Скасувати'}
              />
          )}
          {groupConfirmationModal && (
              <ConfirmationModal
                isOpen={true}
                title={groupConfirmationModal.title}
                message={groupConfirmationModal.message}
                onConfirm={() => {
                    groupConfirmationModal.onConfirm();
                }}
                onClose={() => setGroupConfirmationModal(null)}
                confirmText={t('action.confirm') || 'Підтвердити'}
                cancelText={t('action.cancel') || 'Скасувати'}
                variant="primary"
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
          {isShortcutsModalOpen && (
            <KeyboardShortcutsModal
                isOpen={isShortcutsModalOpen}
                onClose={() => setIsShortcutsModalOpen(false)}
            />
          )}
          {drawingWarningModal && drawingWarningModal.show && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-[var(--bg-app)] border border-[var(--border-color)] p-6 rounded-lg shadow-xl w-[400px] relative">
                    <button 
                        className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        onClick={() => setDrawingWarningModal(null)}
                    >
                        <XIcon size={20} />
                    </button>
                    <h2 className="text-lg font-bold mb-4 text-[var(--text-primary)]">
                        {drawingWarningModal.reason === 'hidden' ? t('warning.layerHidden.title') || "Шар прихований" : t('warning.layerLocked.title') || "Шар заблокований"}
                    </h2>
                    <p className="mb-6 text-sm text-[var(--text-secondary)]">
                        {(() => {
                            const targetLayerId = drawingWarningModal.layerId || activeLayerId;
                            const targetLayer = layers.find((l: any) => l.id === targetLayerId);
                            const layerNameStr = targetLayer ? ` "${targetLayer.name}"` : '';
                            if (drawingWarningModal.reason === 'hidden') {
                                const baseMsg = (t('warning.layerHidden.message') || "Ви намагаєтесь виконати дію на прихованому шарі").replace(/\.$/, '');
                                return `${baseMsg}${layerNameStr}.`;
                            } else {
                                const baseMsg = (t('warning.layerLocked.message') || "Ви намагаєтесь виконати дію на заблокованому шарі").replace(/\.$/, '');
                                return `${baseMsg}${layerNameStr}.`;
                            }
                        })()}
                    </p>
                    <div className="flex justify-end gap-2">
                        <button 
                            className="px-4 py-2 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)]"
                            onClick={() => setDrawingWarningModal(null)}
                        >
                            {t('action.cancel') || 'Скасувати'}
                        </button>
                        {drawingWarningModal.reason === 'hidden' ? (
                            <button 
                                className="px-4 py-2 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
                                onClick={() => {
                                    if (drawingWarningModal.action) {
                                        drawingWarningModal.action();
                                    } else {
                                        setIgnoreHiddenWarningForLayer(drawingWarningModal.layerId || activeLayerId);
                                    }
                                    setDrawingWarningModal(null);
                                }}
                            >
                                {t('action.drawOnHiddenLayer') || 'Створити на прихованому шарі'}
                            </button>
                        ) : (
                            <button 
                                className="px-4 py-2 text-sm bg-[var(--accent-primary)] text-[var(--accent-text)] rounded hover:bg-[var(--accent-primary-hover)]"
                                onClick={() => setDrawingWarningModal(null)}
                            >
                                {t('action.ok') || 'ОК'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
          )}
          {isFeedbackModalOpen && (
            <FeedbackModal
                onClose={() => setIsFeedbackModalOpen(false)}
                appVersion={APP_VERSION}
            />
          )}
          {isShareModalOpen && (
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                shareUrl={shareUrl}
            />
          )}
      </div>
    </div>
  );
}
