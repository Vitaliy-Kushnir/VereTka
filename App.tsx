
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { type Shape, type Tool, type DrawMode, PolylineShape, BezierCurveShape, ViewTransform, RectangleShape, ImageShape, IsoscelesTriangleShape, TrapezoidShape, ParallelogramShape, PathShape, CanvasAction, LineShape, PolygonShape, ArcShape, RightTriangleShape, TextShape, BitmapShape, RotatableShape, EllipseShape, type ProjectTemplate, type NewProjectSettings, FillableShape, DistributePathState, DistributeEntity, Layer, GroupShape, MagnifierMode } from './types';
import Canvas from './components/Canvas';
import { ErrorBoundary } from './components/ErrorBoundary';
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
import LoaderShowcaseModal from './components/LoaderShowcaseModal';
import HistoryPopover from './components/HistoryPopover';
import { useLongPress } from './hooks/useLongPress';
import { saveFile, generateSvg, exportToRaster, openProjectFile, saveToHandle } from './lib/exportUtils';
import { SquareIcon, CodeIcon, XIcon, AxesIcon, FitToScreenIcon, SelectIcon, EditPointsIcon, RectangleIcon, EllipseIcon, CircleIcon, LineIcon, PolylineIcon, BezierIcon, PolygonIcon, PencilIcon, TriangleIcon, RightTriangleIcon, RhombusIcon, TrapezoidIcon, ParallelogramIcon, PiesliceIcon, ChordIcon, ArcIcon, StarIcon, TextIcon, ImageIcon, BitmapIcon, UndoIcon, RedoIcon, DuplicateIcon, GroupIcon, UngroupIcon, ToolsIcon, TrashIcon, GridIcon, SettingsIcon, DrawFromCornerIcon, DrawFromCenterIcon, CheckIcon, MenuIcon, SunIcon, MoonIcon, HomeIcon, BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, SadMonitorIcon, FullscreenIcon, ExitFullscreenIcon, AlignShapesLeftIcon, AlignShapesCenterHIcon, AlignShapesRightIcon, AlignShapesTopIcon, AlignShapesCenterVIcon, AlignShapesBottomIcon, DistributeHorizontalIcon, DistributeVerticalIcon, ChevronDownIcon, ChevronUpIcon, ChevronRightIcon, DistributePathIcon, FlipHorizontalIcon, FlipVerticalIcon, EraserIcon, CloudGalleryIcon, HistoryIcon } from './components/icons';
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
import { CloudGalleryModal } from './components/CloudGalleryModal';
import { CloudProjectOpenModal, MergeProjectOptions } from './components/CloudProjectOpenModal';
import { getCloudProjectById } from './lib/firebase';
import { MobileBottomBar } from './components/mobile/MobileBottomBar';
import { MobileBottomSheet, SheetPinMode } from './components/mobile/MobileBottomSheet';
import { MobileTopHeader } from './components/mobile/MobileTopHeader';
import { MobileMenuDrawer } from './components/mobile/MobileMenuDrawer';
import { MobileShapesSheet } from './components/mobile/MobileShapesSheet';
import { MobileStyleSheet } from './components/mobile/MobileStyleSheet';
import { MobileLayersSheet } from './components/mobile/MobileLayersSheet';
import { MobileAlignSheet } from './components/mobile/MobileAlignSheet';
import { MobileQuickControls } from './components/mobile/MobileQuickControls';
import { FloatingModeControls } from './components/FloatingModeControls';
import { MultiSelectHUD } from './components/MultiSelectHUD';
import { useIsMobile, useIsLandscape } from './hooks/useIsMobile';

type Theme = 'dark' | 'light';
type GeneratorType = 'local' | 'gemini';
type SettingsTab = 'canvas' | 'grid' | 'appearance' | 'code' | 'templates';

const APP_VERSION = '1.4.3';
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
    onOpenHistory?: (mode: 'undo' | 'redo' | 'all') => void;
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
    onAlignShapes?: (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom' | 'center-both' | 'distribute-h' | 'distribute-v' | 'distribute-path', relativeTo: 'selection' | 'canvas') => void;
    onOpenCloudGallery?: (tab?: 'public' | 'personal' | 'group' | 'publish') => void;
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
                            <MenuItem onClick={() => handleMenuClick(() => props.onOpenCloudGallery?.('publish'), closeFile)}>
                                <div className="flex items-center gap-1.5"><CloudGalleryIcon size={16} /> {t('menu.file.publishCloud')}</div>
                            </MenuItem>
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
                            <MenuItem onClick={() => handleMenuClick(() => props.onOpenHistory?.('all'), closeEdit)}>
                                <div className="flex items-center gap-1.5"><HistoryIcon size={16} /> {t('history.title') || 'Історія змін...'}</div>
                            </MenuItem>
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
                            <MenuItem onClick={() => handleMenuClick(() => props.onAlignShapes?.('center-both', 'canvas'), closeObject)} disabled={!props.isShapeSelected}>🎯 {t('menu.object.centerCanvas') || 'В центр полотна'}</MenuItem>
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
                <button
                    onClick={() => props.onOpenCloudGallery?.('public')}
                    title={t('toolbar.cloudGalleryDesc')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors text-xs font-semibold"
                >
                    <CloudGalleryIcon size={16} />
                    <span>{t('toolbar.cloudGallery')}</span>
                </button>
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
        const s = allShapes.find(x => x && x.id === id);
        if (s && s.type) {
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
      if (s && s.type) {
        if (s.type === 'group') {
          res = res.concat(getChildren((s as any).shapeIds || []));
        } else {
          res.push(s);
        }
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
                                 onWheel={(e) => (e.target as HTMLElement).blur()}
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
                                 onWheel={(e) => (e.target as HTMLElement).blur()}
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
    onOpenHistory?: (mode: 'undo' | 'redo' | 'all') => void;
    onDuplicate: () => void; isShapeSelected: boolean;
    onGroup: () => void; canGroup?: boolean;
    onUngroup: () => void; canUngroup?: boolean;
    onExtractFromGroup?: () => void; canExtractFromGroup?: boolean;
    onFlipH: () => void; onFlipV: () => void; canFlip?: boolean;
    onAlignShapes: (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom' | 'center-both' | 'distribute-h' | 'distribute-v' | 'distribute-path', relativeTo: 'selection' | 'canvas', distributeOptions?: { orientAlongPath: boolean, orientationType: 'radial' | 'tangent' | 'parallel' | 'perpendicular' | 'custom', orientationAngle: number, rotateAlongPath: boolean }) => void;
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
        isGenerating, hasShapes, onUndo, onRedo, canUndo, canRedo, onOpenHistory, onDuplicate, onGroup, canGroup, onUngroup, canUngroup, onExtractFromGroup, canExtractFromGroup, onFlipH, onFlipV, canFlip, onAlignShapes, isShapeSelected, onOpenMobileLeft, onOpenMobileRight,
        selectedShapes, activeTool, setActiveTool, onGenerate, showGenerateButton, onClear, isDistributingPath, distributePathState, onDistributePathChange,
        isSelectingPathShape, onToggleSelectPathShape
    } = props;
    const { t } = useLanguage();
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
    const [isAlignMenuOpen, setIsAlignMenuOpen] = useState(false);
    const [alignRelativeTo, setAlignRelativeTo] = useState<'selection' | 'canvas'>('selection');

    const undoPressHandlers = useLongPress({
        threshold: 400,
        onLongPress: () => onOpenHistory?.('undo'),
        onClick: () => onUndo(),
        disabled: !canUndo && !onOpenHistory
    });

    const redoPressHandlers = useLongPress({
        threshold: 400,
        onLongPress: () => onOpenHistory?.('redo'),
        onClick: () => onRedo(),
        disabled: !canRedo && !onOpenHistory
    });

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
            <button 
                title={`${t('menu.edit.undo')} (Ctrl+Z) • ${t('history.tipLongPress') || 'Утримуйте для історії'}`} 
                {...undoPressHandlers} 
                disabled={!canUndo} 
                className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent transition-colors"
            >
                <UndoIcon/>
            </button>
            <button 
                title={`${t('menu.edit.redo')} (Ctrl+Y) • ${t('history.tipLongPress') || 'Утримуйте для історії'}`} 
                {...redoPressHandlers} 
                disabled={!canRedo} 
                className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent transition-colors"
            >
                <RedoIcon/>
            </button>
            <div className="w-px h-6 bg-[var(--border-secondary)] mx-1"></div>
            <button title={`${t('tool.select')} (V)`} onClick={() => setActiveTool('select')} className={`p-2 rounded-md ${activeTool === 'select' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}><SelectIcon /></button>
            <button title={`${t('tool.editPoints')} (A)`} onClick={() => setActiveTool('edit-points')} className={`p-2 rounded-md ${activeTool === 'edit-points' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:text-[var(--text-disabled)] disabled:hover:bg-transparent'}`}><EditPointsIcon /></button>
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
                                <div className="absolute left-full top-0 ml-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-md shadow-lg z-50 min-w-[210px] py-1.5 text-sm" onClick={(e) => e.stopPropagation()}>
                                    <div className="px-3 py-1 flex items-center justify-between border-b border-[var(--border-secondary)] pb-2 mb-1.5">
                                        <label className={`flex items-center gap-2 text-xs text-[var(--text-secondary)] ${isDistributingPath ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-[var(--text-primary)]'}`}>
                                            <input type="radio" name="alignRelativeTo" checked={alignRelativeTo === 'selection' && !isDistributingPath} disabled={isDistributingPath} onChange={() => setAlignRelativeTo('selection')} />
                                            {t('tool.align.selection') || 'Відносно виділення'}
                                        </label>
                                        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]">
                                            <input type="radio" name="alignRelativeTo" checked={alignRelativeTo === 'canvas'} onChange={() => setAlignRelativeTo('canvas')} />
                                            {t('tool.align.canvas') || 'Відносно полотна'}
                                        </label>
                                    </div>
                                    {alignRelativeTo === 'canvas' && (
                                        <div className="px-2 pb-1.5 mb-1.5 border-b border-[var(--border-secondary)]">
                                            <button
                                                type="button"
                                                onClick={() => onAlignShapes('center-both', 'canvas')}
                                                disabled={selectedShapes.length < 1}
                                                className="w-full py-1 px-2 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-md flex items-center justify-center gap-1.5 border border-[var(--accent-primary)]/30 hover:border-[var(--accent-primary)] transition-all disabled:opacity-40"
                                                title="Розмістити виділені об'єкти точно по центру полотна (X і Y)"
                                            >
                                                <span>🎯</span> {t('tool.align.centerBothCanvas') || 'В центр полотна'}
                                            </button>
                                        </div>
                                    )}
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
                
                const rotatePointCustom = (px: number, py: number) => {
                    const prX = px - currentCX;
                    const prY = py - currentCY;
                    const prrX = prX * cosA - prY * sinA;
                    const prrY = prX * sinA + prY * cosA;
                    return { x: targetCX + offsetX + prrX, y: targetCY + offsetY + prrY };
                };

                const center = getShapeCenter(originalS, pathState.originalShapes);
                if (center) {
                    const rotated = rotatePointCustom(center.x, center.y);
                    const extraDx = rotated.x - (center.x + dx);
                    const extraDy = rotated.y - (center.y + dy);
                    
                    switch (updatedS.type) {
                        case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap':
                            updatedS = { ...updatedS, x: (updatedS as any).x + extraDx, y: (updatedS as any).y + extraDy };
                            break;
                        case 'ellipse': case 'polygon': case 'star':
                            updatedS = { ...updatedS, cx: (updatedS as any).cx + extraDx, cy: (updatedS as any).cy + extraDy };
                            break;
                        case 'line': case 'bezier': case 'pencil': case 'polyline':
                            updatedS = { ...updatedS, points: (updatedS as any).points.map((p: any) => ({ x: p.x + extraDx, y: p.y + extraDy })) };
                            break;
                        case 'group':
                            if ((updatedS as any).rotationCenter) {
                                updatedS = { ...updatedS, rotationCenter: { x: (updatedS as any).rotationCenter.x + extraDx, y: (updatedS as any).rotationCenter.y + extraDy } };
                            }
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
            if (pathState.shapePathParams.isExisting === false && 'fill' in pShape) {
                pShape = { ...pShape, fill: 'none' } as any;
            }
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
  const { 
      state: historyState, 
      historyEntries, 
      currentIndex: historyCurrentIndex, 
      setState: _setHistoryState, 
      updateCurrentState: _updateCurrentState, 
      undo, 
      redo, 
      jumpToIndex: jumpToHistoryIndex, 
      canUndo, 
      canRedo, 
      reset: resetHistoryState 
  } = useHistoryState<{shapes: Shape[], distributePathState: DistributePathState | null, layers: Layer[], activeLayerId: string | null}>({ 
      shapes: [], 
      distributePathState: null,
      layers: [{ id: 'layer-1', name: t('layer.defaultName') || 'Шар 1', visible: true, locked: false, shapeIds: [] }],
      activeLayerId: 'layer-1'
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyMode, setHistoryMode] = useState<'undo' | 'redo' | 'all'>('all');

  const handleOpenHistory = useCallback((mode: 'undo' | 'redo' | 'all' = 'all') => {
      setHistoryMode(mode);
      setIsHistoryOpen(true);
  }, []);

  const [transientDistributePathState, setTransientDistributePathState] = useState<DistributePathState | null>(null);
  const shapes = historyState.shapes;
  const distributePathState = transientDistributePathState || historyState.distributePathState;
  const defaultLayers = useMemo(() => [{ id: 'layer-1', name: t('layer.defaultName') || 'Шар 1', visible: true, locked: false, shapeIds: [] }], [t]);
  const layers = historyState.layers || defaultLayers;
  const activeLayerId = historyState.activeLayerId || 'layer-1';

  const [projectName, setProjectName] = useState<string>(t('app.1069'));
  const [projectSessionId, setProjectSessionId] = useState<number>(0);
  const [rightPanelTab, setRightPanelTab] = useState<'layers' | 'shapes'>('shapes');
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
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
  const [isCloudGalleryOpen, setIsCloudGalleryOpen] = useState(false);
  const [cloudGalleryInitialTab, setCloudGalleryInitialTab] = useState<'public' | 'personal' | 'group' | 'publish'>('public');
  const [pendingCloudProjectOpen, setPendingCloudProjectOpen] = useState<{ data: any; name: string } | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  const [canvasWidth, setCanvasWidth] = useState<number>(800);
  const [canvasHeight, setCanvasHeight] = useState<number>(600);
  const [canvasBgColor, setCanvasBgColor] = useState<string>('#ffffff');
  const [canvasVarName, setCanvasVarName] = useState<string>('c');
  const [variableNamingTemplate, setVariableNamingTemplate] = useState<string>(() => {
    try {
      return localStorage.getItem('veretka-variable-template') || '';
    } catch {
      return '';
    }
  });
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [touchDrawingMode, setTouchDrawingMode] = useState<'tap-drag' | 'virtual-joystick'>(() => {
    const saved = localStorage.getItem('veretka-touch-mode');
    return (saved === 'virtual-joystick' || saved === 'tap-drag') ? saved : 'tap-drag';
  });
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
  const [showMagnifier, setShowMagnifier] = useState<MagnifierMode>(() => {
    const saved = localStorage.getItem('veretka-show-magnifier');
    if (saved === 'pinned' || saved === 'auto' || saved === 'off') {
      return saved;
    }
    if (saved === 'true') return 'auto';
    if (saved === 'false') return 'off';
    return 'auto';
  });
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
  const [openAsWebApp, setOpenAsWebApp] = useState<boolean>(false);

  // State for temporary visual overrides (e.g., color picking preview)
  const [previewOverrides, setPreviewOverrides] = useState<Record<string, Partial<Shape>>>({});
  const [previewFillColor, setPreviewFillColor] = useState<string | null>(null);
  const [previewStrokeColor, setPreviewStrokeColor] = useState<string | null>(null);
  const [previewCanvasBgColor, setPreviewCanvasBgColor] = useState<string | null>(null);

  const [viewTransform, setViewTransform] = useState<ViewTransform>({ scale: 1, x: 50, y: 50 });
  const [isFitToScreenMode, setIsFitToScreenMode] = useState<boolean>(true);

  const handleUserSetViewTransform = useCallback((action: React.SetStateAction<ViewTransform>) => {
      setIsFitToScreenMode(false);
      setViewTransform(action);
  }, []);
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
  
  const isMobile = useIsMobile(1024);
  const isLandscape = useIsLandscape();
  const [mobileSheet, setMobileSheet] = useState<'tools' | 'shapes' | 'palette' | 'layers' | 'code' | 'menu' | 'align' | null>(null);
  const [mobileSheetPinMode, setMobileSheetPinMode] = useState<SheetPinMode>('unpinned');
  const [mobileSheetHeightVh, setMobileSheetHeightVh] = useState<number>(54);
  const [mobileSheetWidthVw, setMobileSheetWidthVw] = useState<number>(48);

  const MOBILE_SHEET_TABS: Array<'shapes' | 'palette' | 'align' | 'layers' | 'code'> = useMemo(() => [
      'shapes',
      'palette',
      'align',
      'layers',
      'code'
  ], []);

  const handleNavigateSheetPrev = useCallback(() => {
      if (!mobileSheet || mobileSheet === 'menu') return;
      const currentIndex = MOBILE_SHEET_TABS.indexOf(mobileSheet as any);
      if (currentIndex === -1) return;
      const prevIndex = (currentIndex - 1 + MOBILE_SHEET_TABS.length) % MOBILE_SHEET_TABS.length;
      setMobileSheet(MOBILE_SHEET_TABS[prevIndex]);
  }, [mobileSheet, MOBILE_SHEET_TABS]);

  const handleNavigateSheetNext = useCallback(() => {
      if (!mobileSheet || mobileSheet === 'menu') return;
      const currentIndex = MOBILE_SHEET_TABS.indexOf(mobileSheet as any);
      if (currentIndex === -1) return;
      const nextIndex = (currentIndex + 1) % MOBILE_SHEET_TABS.length;
      setMobileSheet(MOBILE_SHEET_TABS[nextIndex]);
  }, [mobileSheet, MOBILE_SHEET_TABS]);
  const [isScreenTooSmall, setIsScreenTooSmall] = useState(false);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [projectWasEverActive, setProjectWasEverActive] = useState(false);
  const [autosavedProjectData, setAutosavedProjectData] = useState<string | null>(null);

  const [isCheatCodeModalOpen, setIsCheatCodeModalOpen] = useState(false);
  const [isLoaderShowcaseModalOpen, setIsLoaderShowcaseModalOpen] = useState(false);
  const [activeCheats, setActiveCheats] = useState<Set<string>>(new Set());


  const applyGroupCenters = useCallback((state: any) => {
        let changedCenter = false;
        const shapesCopy = [...(state.shapes || [])];
        for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i < shapesCopy.length; i++) {
                if (shapesCopy[i] && shapesCopy[i].type === 'group') {
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

  const handleDistributePathChange = useCallback((newPathOrFn: DistributePathState | null | ((prev: DistributePathState | null) => DistributePathState | null), isTransient?: boolean) => {
      if (isTransient) {
          setDistributePathStateWithoutHistory(newPathOrFn);
      } else {
          setDistributePathState(newPathOrFn);
      }
  }, [setDistributePathStateWithoutHistory, setDistributePathState]);

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
                if (typeof settings.openAsWebApp === 'boolean') {
                    setOpenAsWebApp(settings.openAsWebApp);
                }
            }
        } catch (e) { console.error("Failed to load app settings", e); }
    }, []);

    useEffect(() => {
        try {
            const settings = { maxRecentProjects, openAsWebApp };
            localStorage.setItem('veretka-app-settings', JSON.stringify(settings));
        } catch (e) { console.error("Failed to save app settings", e); }
    }, [maxRecentProjects, openAsWebApp]);

    useEffect(() => {
        if (!openAsWebApp) return;

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        const isPopup = !!window.opener || window.location.search.includes('mode=webapp');
        const alreadyAttempted = sessionStorage.getItem('veretka_launched_webapp') === 'true';

        if (!isStandalone && !isPopup && !alreadyAttempted) {
            sessionStorage.setItem('veretka_launched_webapp', 'true');
            const targetUrl = new URL(window.location.href);
            targetUrl.searchParams.set('mode', 'webapp');
            
            const popupWindow = window.open(
                targetUrl.toString(),
                'VeretkaWebAppWindow',
                'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
            );
            if (popupWindow) {
                popupWindow.focus();
            }
        }
    }, [openAsWebApp]);

  const handleActivateCheat = useCallback((code: string) => {
    if (code === '000') {
        setActiveCheats(new Set());
    } else if (code === '004') {
        setActiveCheats((prev: Set<string>) => new Set(prev).add(code));
        setIsLoaderShowcaseModalOpen(true);
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

    const handleCustomCheatTrigger = () => {
        setIsCheatCodeModalOpen(true);
    };

    window.addEventListener('keydown', handleCheatCodeHotKey);
    window.addEventListener('veretka:openCheatCodes', handleCustomCheatTrigger);
    return () => {
        window.removeEventListener('keydown', handleCheatCodeHotKey);
        window.removeEventListener('veretka:openCheatCodes', handleCustomCheatTrigger);
    };
  }, []);

  const codeStringForExport = useMemo(() => {
    const lines = showComments 
      ? generatedCodeLines 
      : generatedCodeLines.filter(line => !((line?.content || '').trim() || '').startsWith('#'));
    
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
        canvasSettings: { width: canvasWidth, height: canvasHeight, bgColor: canvasBgColor, varName: canvasVarName, variableNamingTemplate },
        uiSettings: { theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCenterGuides, enableSnapping, showCursorCoords, showMagnifier, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill, generateTkinterTags, showSystemTags, touchCurveMode: touchDrawingMode }
    });
  }, [canvasWidth, canvasHeight, canvasBgColor, canvasVarName, variableNamingTemplate, theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCenterGuides, enableSnapping, showCursorCoords, showMagnifier, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill, generateTkinterTags, showSystemTags, touchDrawingMode]);

  useEffect(() => {
    try {
      localStorage.setItem('veretka-variable-template', variableNamingTemplate);
    } catch {
      // ignore
    }
  }, [variableNamingTemplate]);

  useEffect(() => {
    try {
        localStorage.setItem('veretka-show-magnifier', String(showMagnifier));
    } catch {
        // ignore
    }
  }, [showMagnifier]);

  useEffect(() => {
    try {
        localStorage.setItem('veretka-touch-mode', touchDrawingMode);
    } catch {
        // ignore
    }
  }, [touchDrawingMode]);

  const lastSavedSignatureRef = useRef('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!isProjectActive) return;
    const currentSignature = getProjectSignature(projectName, shapes);
    if (lastSavedSignatureRef.current === '') {
        lastSavedSignatureRef.current = currentSignature;
    }
    const unsaved = currentSignature !== lastSavedSignatureRef.current;
    setHasUnsavedChanges(prev => (prev !== unsaved ? unsaved : prev));
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
      setPreviewOverrides(prev => (Object.keys(prev).length === 0 ? prev : {}));
  }, []);

  useEffect(() => {
      cancelShapePreview();
  }, [selectedShapeIds, cancelShapePreview]);


    const fitCanvasToView = useCallback((widthOverride?: number, heightOverride?: number) => {
        setIsFitToScreenMode(true);
        if (viewportSize.width === 0 || viewportSize.height === 0) return;
        const targetWidth = widthOverride ?? canvasWidth;
        const targetHeight = heightOverride ?? canvasHeight;
        if (targetWidth <= 0 || targetHeight <= 0) return;
        const padding = 20;
        const rulerOffset = showAxes ? RULER_THICKNESS : 0;
        const canvasContainerWidth = viewportSize.width - rulerOffset;
        const canvasContainerHeight = viewportSize.height - rulerOffset;
        if (canvasContainerWidth <= 0 || canvasContainerHeight <= 0) return;
        const scaleX = (canvasContainerWidth - padding * 2) / targetWidth;
        const scaleY = (canvasContainerHeight - padding * 2) / targetHeight;
        const newScale = Math.min(scaleX, scaleY, MAX_SCALE);
        const scaledCanvasWidth = targetWidth * newScale;
        const scaledCanvasHeight = targetHeight * newScale;
        const newX = (canvasContainerWidth - scaledCanvasWidth) / 2;
        const newY = (canvasContainerHeight - scaledCanvasHeight) / 2;
        setViewTransform(prev => {
            if (Math.abs(prev.scale - newScale) < 0.0001 && Math.abs(prev.x - newX) < 0.01 && Math.abs(prev.y - newY) < 0.01) {
                return prev;
            }
            return { scale: newScale, x: newX, y: newY };
        });
    }, [canvasWidth, canvasHeight, viewportSize.width, viewportSize.height, showAxes]);

    const initialFitDone = useRef(false);

    useEffect(() => {
        if (!initialFitDone.current && viewportSize.width > 0 && viewportSize.height > 0) {
            fitCanvasToView();
            initialFitDone.current = true;
        } else if (isFitToScreenMode && isProjectActive && viewportSize.width > 0 && viewportSize.height > 0) {
            fitCanvasToView();
        }
    }, [isFitToScreenMode, isProjectActive, viewportSize.width, viewportSize.height, fitCanvasToView]);


  useEffect(() => {
    const viewportElement = viewportRef.current;
    if (!viewportElement || !isProjectActive) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const w = Math.round(entry.contentRect.width);
        const h = Math.round(entry.contentRect.height);
        setViewportSize(prev => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
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
  const [isSelectionHUDCollapsed, setIsSelectionHUDCollapsed] = useState<boolean>(false);

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
              keepShape,
              isExisting: true
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
        let drawnPathShape = shape;
        if ('fill' in drawnPathShape) {
            drawnPathShape = { ...drawnPathShape, fill: 'none' } as any;
        }

        if (keepShape) {
            setShapes(prevShapes => [...prevShapes, drawnPathShape]);
        }
        setDistributePathState({
            ...distributePathState,
            type: 'shape',
            shapePathParams: {
                shapeId: drawnPathShape.id,
                pathShape: { ...drawnPathShape },
                keepShape,
                isExisting: false
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
    const validNewShapes = (newShapes || []).filter(Boolean);
    if (validNewShapes.length === 0) return;
    setShapes(prevShapes => [...prevShapes, ...validNewShapes]);
    if (isDuplication || (validNewShapes[0]?.type !== 'polyline' && validNewShapes[0]?.type !== 'bezier')) {
        const topLevelIds = validNewShapes.filter((s: any) => !s.groupId || !validNewShapes.some(ns => ns.id === s.groupId)).map((s: any) => s.id);
        setSelectedShapeIds(topLevelIds);
        setActiveTool('select');
    }
    setIgnoreHiddenWarningForLayer(null);
  }, [setShapes, isImportingImage]);

  const updateShape = useCallback((updatedShape: Shape, isTransient = false) => {
    cancelShapePreview();
    const updateFn = (prevShapes: Shape[]) => {
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
    };

    if (isTransient) {
        updateShapesWithoutHistory(updateFn);
    } else {
        setShapes(updateFn);
    }

    if (!isTransient && selectedShapeIds.length === 1 && updatedShape.id === selectedShapeIds[0] && updatedShape.state !== 'normal') {
        setSelectedShapeIds([]);
        setActivePointIndex(null);
    }
  }, [setShapes, updateShapesWithoutHistory, selectedShapeIds, cancelShapePreview]);

  const updateShapes = useCallback((updatedShapes: Shape[], isTransient = false) => {
    cancelShapePreview();
    const updateFn = (prevShapes: Shape[]) => {
      const updatesMap = new Map(updatedShapes.map((s: any) => [s.id, s]));
      return prevShapes.map((s: any) => updatesMap.get(s.id) || s);
    };

    if (isTransient) {
        updateShapesWithoutHistory(updateFn);
    } else {
        setShapes(updateFn);
    }

    if (!isTransient) {
        const idsToDeselect = updatedShapes.filter((s: any) => s.state !== 'normal').map((s: any) => s.id);
        if (idsToDeselect.some((id: string) => selectedShapeIds.includes(id))) {
            setSelectedShapeIds((prev: any) => prev.filter((p: any) => !idsToDeselect.includes(p)));
            setActivePointIndex(null);
        }
    }
  }, [setShapes, updateShapesWithoutHistory, selectedShapeIds, cancelShapePreview]);
  
  const setShapePreview = useCallback((shapeId: string, overrides: Partial<Shape>) => {
    setPreviewOverrides((prev: any) => ({ ...prev, [shapeId]: overrides }));
  }, []);

  const deleteShape = useCallback((idOrIds: string | string[]) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    setShapes(prevShapes => {
        let allIdsToDelete = [...ids];
        ids.forEach(id => {
            const shapeToDelete = prevShapes.find((s: any) => s.id === id);
            if (shapeToDelete?.type === 'group') {
                allIdsToDelete = [...allIdsToDelete, ...(shapeToDelete as any).shapeIds];
            }
        });
        return prevShapes.filter(shape => !allIdsToDelete.includes(shape.id));
    });
    setSelectedShapeIds((prev: any) => {
        const hasSelected = ids.some(id => prev.includes(id));
        if (hasSelected) {
            setActivePointIndex(null);
            return prev.filter((p: any) => !ids.includes(p));
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

        const draggedShapeIdx = newShapes.findIndex((s: any) => s && s.id === draggedId);
        const targetShapeIdx = newShapes.findIndex((s: any) => s && s.id === targetId);
        if (draggedShapeIdx === -1 || targetShapeIdx === -1) return prev;
        
        let draggedShape = { ...newShapes[draggedShapeIdx] };
        const targetShape = newShapes[targetShapeIdx];
        if (!targetShape || !draggedShape) return prev;
        
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
            const groupIdx = newShapes.findIndex((s: any) => s && s.id === shapeToMove.groupId);
            if (groupIdx !== -1 && newShapes[groupIdx] && newShapes[groupIdx].type === 'group') {
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
      
      let targetGroupId: string | undefined = undefined;
      if (!ignoreGroup && id) {
          const getRootId = (shapeId: string): string => {
              const shape = shapes.find((s: any) => s.id === shapeId);
              if (shape && shape.groupId) return getRootId(shape.groupId);
              const groupParent = shapes.find((g: any) => g.type === 'group' && g.shapeIds?.includes(shapeId));
              if (groupParent) return getRootId(groupParent.id);
              return shapeId;
          };
          const rootId = getRootId(id as string);
          if (rootId !== id) {
              targetGroupId = rootId;
          }
      }
      
      const idsToToggle = targetGroupId 
        ? [targetGroupId]
        : [id];

      if ((isShiftPressed || (isMultiSelectMode && isShiftPressed)) && lastSelectedShapeIdRef.current) {
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
              
              if (isCtrlPressed || isMultiSelectMode) {
                  return Array.from(new Set([...prev, ...rangeIds]));
              } else {
                  return Array.from(rangeIds);
              }
          }
      }

      lastSelectedShapeIdRef.current = id;

      if (isCtrlPressed || isMultiSelectMode) {
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
                showNotification(t('app.editPointsMultipleShapes') || 'Режим редагування вузлів недоступний для декількох фігур. Виділіть одну фігуру.', 'info');
                return;
            }

            if (selectedShapeIds.length === 1) {
                const shape = shapes.find((s: any) => s.id === selectedShapeIds[0]);
                if (shape?.type === 'group') {
                    showNotification(t('app.editPointsGroup') || 'Це група. Для редагування вузлів розгрупуйте її або виділіть конкретну фігуру.', 'info');
                    return;
                }
                if (shape?.type === 'text') {
                    showNotification(t('app.1107') || 'Режим редагування вузлів недоступний для тексту.', 'info');
                    return;
                }
                if (shape?.type === 'image' || shape?.type === 'bitmap') {
                    showNotification(t('app.editPointsImage') || 'Режим редагування вузлів недоступний для зображень.', 'info');
                    return;
                }
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
    }, [isDrawingPolyline, isDrawingBezier, handleCompletePolyline, handleCancelBezier, shapes, selectedShapeIds, showNotification, t]);

  const handleSelectAll = useCallback(() => {
    const allIds = shapes
      .filter((s: any) => s.state !== 'disabled' && s.state !== 'hidden' && !lockedShapeIds.has(s.id) && !s.groupId)
      .map((s: any) => s.id);
    setSelectedShapeIds(allIds);
    if (allIds.length > 1) {
      setIsMultiSelectMode(true);
    }
  }, [shapes, lockedShapeIds]);

  const selectedShapes = useMemo(() => {
    return shapes.filter((s: any) => selectedShapeIds.includes(s.id));
  }, [shapes, selectedShapeIds]);

  const selectedShape = selectedShapes.length === 1 ? selectedShapes[0] : null;
  
  const inlineEditingShape = useMemo(() => {
    if (!inlineEditingShapeId) return null;
    return shapes.find((s: any) => s.id === inlineEditingShapeId) as TextShape || null;
  }, [shapes, inlineEditingShapeId]);

  const handleGenerateCode = useCallback(async () => {
    if (isMobile) {
        setMobileSheet('code');
    }
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
        const { codeLines } = await generateTkinterCodeLocally(finalShapesForGeneration, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments, outlineWithFill, generateTkinterTags, showSystemTags, t, variableNamingTemplate);
        setGeneratedCodeLines(codeLines);
      } else {
        const code = await generateTkinterCode(apiKey!, finalShapesForGeneration, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments, outlineWithFill, generateTkinterTags, showSystemTags, variableNamingTemplate);
        const lines = code.split('\n');
        const codeLines = lines.map(line => {
            const match = line.match(/(.*?) # ID:([a-zA-Z0-9.-]+)/);
            if (match && match[1] !== undefined && match[2]) {
                return { content: (match[1] || '').trim(), shapeId: match[2] };
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
  }, [displayedShapes, canvasWidth, canvasHeight, canvasBgColor, projectName, generatorType, canvasVarName, variableNamingTemplate, autoGenerateComments, generateTkinterTags, showSystemTags, apiKey, activeCheats, outlineWithFill, showNotification, t]);

  const displayedShapesString = useMemo(() => JSON.stringify(displayedShapes), [displayedShapes]);
  const shapesString = useMemo(() => JSON.stringify(shapes), [shapes]);

  useEffect(() => {
    if (generatorType === 'local' && isProjectActive) {
        const generate = async () => {
            let shapesForGeneration = displayedShapes.filter((s: any) => !(s.type === 'image' && s.isImport) && s.state !== 'hidden');
            if (activeCheats.has('002')) {
                shapesForGeneration = shapesForGeneration.filter((s: any) => s.type !== 'image');
            }
            const { codeLines } = await generateTkinterCodeLocally(shapesForGeneration, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments, outlineWithFill, generateTkinterTags, showSystemTags, t, variableNamingTemplate);
            setGeneratedCodeLines(codeLines);
            setShapesAtGenerationTime(JSON.parse(displayedShapesString));
        };
        generate();
    }
  }, [displayedShapesString, shapesString, canvasWidth, canvasHeight, canvasBgColor, generatorType, projectName, isProjectActive, canvasVarName, variableNamingTemplate, autoGenerateComments, generateTkinterTags, showSystemTags, activeCheats, outlineWithFill, t]);
  
  const hasUnsyncedChangesWithCode = useMemo(() => {
    if (!shapesAtGenerationTime) return false;
    return displayedShapesString !== JSON.stringify(shapesAtGenerationTime);
  }, [displayedShapesString, shapesAtGenerationTime]);

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
    setProjectSessionId(prev => prev + 1);
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
    if (settings.variableNamingTemplate !== undefined) {
      setVariableNamingTemplate(settings.variableNamingTemplate);
    }

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
    setTimeout(() => fitCanvasToView(settings.width, settings.height), 0);
    setTimeout(() => fitCanvasToView(settings.width, settings.height), 100);
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
  }, [confirmAction, t]);

  const handleExitApp = useCallback(() => {
    confirmAction(
      () => {
        setIsProjectActive(false);

        const isStandalonePWA =
          (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
          (typeof navigator !== 'undefined' && (navigator as any).standalone === true);

        try {
          window.close();
        } catch (e) {
          console.warn('window.close() was prevented', e);
        }

        if (isStandalonePWA) {
          showNotification(t('app.exit.pwaSuccess') || 'Роботу завершено. Ви можете згорнути або закрити додаток.', 'info', 4500);
        } else {
          showNotification(t('app.exit.browserSuccess') || 'Роботу завершено. Ви можете безпечно закрити цю вкладку браузера.', 'info', 4500);
        }
      },
      t('app.exitConfirm.title') || 'Завершити роботу?',
      t('app.exitConfirm.message') || 'У вас є незбережені зміни. Ваша робота періодично автозберігається. Якщо ви вийдете, ви зможете відновити її пізніше. Завершити роботу та вийти?',
      t('app.exitConfirm.btn') || 'Так, завершити',
      t('app.1121') || 'Скасувати',
      'primary'
    );
  }, [confirmAction, showNotification, t]);

  const getSaveData = useCallback((pName: string) => {
    const shapesToSave = shapes;
    return {
        projectName: pName,
        shapes: shapesToSave,
        layers: layers,
        activeLayerId: activeLayerId,
        thumbnail: generateProjectThumbnail(displayedShapes, canvasWidth, canvasHeight, canvasBgColor),
        canvasSettings: { width: canvasWidth, height: canvasHeight, bgColor: canvasBgColor, varName: canvasVarName, variableNamingTemplate },
        viewTransform,
        uiSettings: { theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCenterGuides, enableSnapping, showCursorCoords, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill, generateTkinterTags, showSystemTags, touchCurveMode: touchDrawingMode }
    };
  }, [shapes, displayedShapes, layers, activeLayerId, canvasWidth, canvasHeight, canvasBgColor, canvasVarName, variableNamingTemplate, viewTransform, theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCenterGuides, enableSnapping, showCursorCoords, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill, generateTkinterTags, generateProjectThumbnail, touchDrawingMode]);

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
                
                const finalProjectName = newHandle ? newHandle.name.replace(/\.vec.json$/, '') : projectName;
                if (newHandle) {
                    setFileHandle(newHandle);
                    addRecentProject(newHandle, saveData.thumbnail);
                }
                setProjectName(finalProjectName);
                lastSavedSignatureRef.current = getProjectSignature(finalProjectName, shapes);
                setHasUnsavedChanges(false);
                showNotification(t('app.1001'), 'info');
                localStorage.removeItem(AUTOSAVE_KEY);
            } catch (error) {
                console.error(t('app.1002'), error);
                showNotification(t('app.1003'), 'error');
            }
        }
    }, [hasUnsavedChanges, fileHandle, getSaveData, projectName, getProjectSignature, shapes, addRecentProject, showNotification, t]);

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
            
            const finalProjectName = newHandle ? newHandle.name.replace(/\.vec.json$/, '') : newProjectNameFromModal;
            if (newHandle) {
                setFileHandle(newHandle);
                addRecentProject(newHandle, saveData.thumbnail);
            }
            setProjectName(finalProjectName);
            lastSavedSignatureRef.current = getProjectSignature(finalProjectName, shapes);
            setHasUnsavedChanges(false);
            showNotification(t('app.1001'), 'info');
            localStorage.removeItem(AUTOSAVE_KEY);
        } catch (error) {
            console.error(t('app.1002'), error);
            showNotification(t('app.1003'), 'error');
        }
    }, [getSaveData, shapes, addRecentProject, getProjectSignature, showNotification, t]);

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
        let savedData: any = null;
        if (typeof fileContent === 'string') {
            const trimmed = (fileContent || '').trim();
            if (trimmed.startsWith('from tkinter') || trimmed.startsWith('import tkinter') || fileName?.endsWith('.py')) {
                showNotification(t('file.import.isPythonScript'), 'error');
                return;
            }
            try {
                savedData = JSON.parse(fileContent);
            } catch (jsonErr) {
                showNotification(t('file.import.invalidJson'), 'error');
                return;
            }
        } else {
            savedData = fileContent;
        }

        if (savedData && (Array.isArray(savedData.shapes) || savedData.canvasSettings)) {
            const shapesToLoad = Array.isArray(savedData.shapes) ? savedData.shapes : [];
            const newProjectName = (fileName ? fileName.replace(/\.vec\.json$/, '') : savedData.projectName) || t('app.1014');
            
            performClear();
            resetHistory(shapesToLoad, savedData.layers, savedData.activeLayerId);
            setProjectName(newProjectName);

            const cs = savedData.canvasSettings || {};
            const loadedWidth = cs.width || 800;
            const loadedHeight = cs.height || 600;
            setCanvasWidth(loadedWidth);
            setCanvasHeight(loadedHeight);
            setCanvasBgColor(cs.bgColor || '#ffffff');
            setCanvasVarName(cs.varName || 'c');
            if (cs.variableNamingTemplate !== undefined) {
                setVariableNamingTemplate(cs.variableNamingTemplate);
            }
            
            // Automatically fit canvas scale to full visible area on project open
            setTimeout(() => fitCanvasToView(loadedWidth, loadedHeight), 0);
            setTimeout(() => fitCanvasToView(loadedWidth, loadedHeight), 100);
            setTimeout(() => fitCanvasToView(loadedWidth, loadedHeight), 300);

            const ui = savedData.uiSettings || {};
            setTheme(ui.theme || 'dark');
            setShowGrid(ui.showGrid ?? true);
            setGridSize(ui.gridSize || 10);
            setSnapToGrid(ui.snapToGrid ?? true);
            setGridSnapStep(ui.gridSnapStep || 1);
            setShowAxes(ui.showAxes ?? true);
            setTouchDrawingMode(ui.touchCurveMode ?? 'tap-drag');
            setShowCenterGuides(ui.showCenterGuides ?? false);
            setEnableSnapping(ui.enableSnapping ?? true);
            setShowCursorCoords(ui.showCursorCoords ?? true);
            if (ui.showMagnifier !== undefined) {
                if (typeof ui.showMagnifier === 'string' && (ui.showMagnifier === 'pinned' || ui.showMagnifier === 'auto' || ui.showMagnifier === 'off')) {
                    setShowMagnifier(ui.showMagnifier as MagnifierMode);
                } else {
                    setShowMagnifier(ui.showMagnifier ? 'auto' : 'off');
                }
            }
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
            setTimeout(() => fitCanvasToView(loadedWidth, loadedHeight), 50);
        } else {
            showNotification(t('app.1016'), 'error');
        }
    } catch (e) {
        console.error(t('app.1017'), e);
        showNotification(t('app.1018'), 'error');
    }
  }, [resetHistory, getProjectSignature, addRecentProject, fitCanvasToView, activeTool, showNotification, t]);

  const performMergeProject = useCallback((options: MergeProjectOptions) => {
    const { cloudData, cloudProjectTitle, resolvedProjectName, groupImportedShapes, preserveLayers, autoExpandCanvas } = options;
    
    const importedRawShapes: Shape[] = Array.isArray(cloudData?.shapes) ? cloudData.shapes : [];
    if (importedRawShapes.length === 0) {
      showNotification(t('cloud.merge.empty') || 'У вибраному проєкті немає фігур для імпорту', 'error');
      return;
    }

    const currentShapes = shapes || [];
    const currentLayers = layers && layers.length > 0 ? [...layers] : [{ id: 'layer-1', name: t('layer.defaultName') || 'Шар 1', visible: true, locked: false, shapeIds: [] }];
    const currentActiveLayer = activeLayerId || currentLayers[0]?.id || 'layer-1';

    // Effective title for group and layer naming
    const effectiveCloudTitle = cloudProjectTitle || cloudData?.projectName || t('cloud.project.untitled') || 'Хмарний проєкт';

    // 1. Check if current project is empty or only has 1 empty layer
    const isCurrentProjectEmpty = currentShapes.length === 0;
    const hasOnlyOneEmptyLayer = currentLayers.length === 1 && (currentShapes.length === 0 || (currentLayers[0].shapeIds || []).length === 0);

    // 2. Prepare Layer mapping
    const importedRawLayers: Layer[] = Array.isArray(cloudData?.layers) && cloudData.layers.length > 0
      ? cloudData.layers
      : [{ id: 'imported-layer-default', name: effectiveCloudTitle, visible: true, locked: false, shapeIds: [] }];

    const layerIdMap = new Map<string, string>();
    const newLayersToAdd: Layer[] = [];

    const generateUniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (isCurrentProjectEmpty || (hasOnlyOneEmptyLayer && preserveLayers)) {
      // If current project was empty or only has 1 empty layer, replace existing layer directly with imported ones
      importedRawLayers.forEach(l => {
        const newLId = generateUniqueId('layer');
        layerIdMap.set(l.id, newLId);
        newLayersToAdd.push({
          ...l,
          id: newLId,
          shapeIds: []
        });
      });
    } else {
      // Current project has multiple layers or existing shapes
      if (preserveLayers) {
        importedRawLayers.forEach(l => {
          const newLId = generateUniqueId('layer-cloud');
          layerIdMap.set(l.id, newLId);
          
          let finalName = l.name;
          if (currentLayers.some(existing => existing.name.toLowerCase() === l.name.toLowerCase())) {
            finalName = `${l.name} (${effectiveCloudTitle})`;
          }
          
          newLayersToAdd.push({
            id: newLId,
            name: finalName,
            visible: true,
            locked: false,
            shapeIds: []
          });
        });
      } else {
        importedRawLayers.forEach(l => {
          layerIdMap.set(l.id, currentActiveLayer);
        });
      }
    }

    // 3. Shape ID remapping & cloning
    const shapeIdMap = new Map<string, string>();
    const clonedShapes: Shape[] = JSON.parse(JSON.stringify(importedRawShapes));

    clonedShapes.forEach(shape => {
      const newShapeId = generateUniqueId(`shape-${shape.type}`);
      shapeIdMap.set(shape.id, newShapeId);
      shape.id = newShapeId;
    });

    const processedShapes: Shape[] = [];
    const rootImportedShapeIds: string[] = [];

    clonedShapes.forEach(shape => {
      if (preserveLayers && shape.layerId && layerIdMap.has(shape.layerId)) {
        shape.layerId = layerIdMap.get(shape.layerId);
      } else if (newLayersToAdd.length > 0) {
        shape.layerId = newLayersToAdd[0].id;
      } else {
        shape.layerId = currentActiveLayer;
      }

      if (shape.groupId && shapeIdMap.has(shape.groupId)) {
        shape.groupId = shapeIdMap.get(shape.groupId);
      } else if (shape.groupId) {
        delete shape.groupId;
      }

      if (shape.type === 'group' && Array.isArray((shape as any).shapeIds)) {
        (shape as any).shapeIds = (shape as any).shapeIds
          .map((childId: string) => shapeIdMap.get(childId))
          .filter(Boolean);
      }

      if (!shape.groupId) {
        rootImportedShapeIds.push(shape.id);
      }

      processedShapes.push(shape);
    });

    let masterGroupId: string | null = null;

    // 4. Group all imported shapes if requested and there are shapes
    if (groupImportedShapes && rootImportedShapeIds.length > 0) {
      masterGroupId = generateUniqueId('group-import');
      
      processedShapes.forEach(s => {
        if (rootImportedShapeIds.includes(s.id)) {
          s.groupId = masterGroupId!;
        }
      });

      const masterGroupShape: Shape = {
        type: 'group',
        id: masterGroupId,
        name: `${effectiveCloudTitle} (${t('prop.tags.group') || 'група'})`,
        tags: `cloud_import_${Date.now()}`,
        state: 'normal',
        stroke: 'none',
        strokeWidth: 0,
        shapeIds: [...rootImportedShapeIds],
        rotation: 0,
      };

      if (newLayersToAdd.length > 0) {
        masterGroupShape.layerId = newLayersToAdd[0].id;
      } else {
        masterGroupShape.layerId = currentActiveLayer;
      }

      processedShapes.push(masterGroupShape);
    }

    // 5. Update Layers shapeIds
    let finalLayers: Layer[];
    if (isCurrentProjectEmpty || (hasOnlyOneEmptyLayer && preserveLayers)) {
      finalLayers = newLayersToAdd.map(nl => ({
        ...nl,
        shapeIds: processedShapes.filter(s => s.layerId === nl.id).map(s => s.id)
      }));
    } else if (preserveLayers && newLayersToAdd.length > 0) {
      const updatedNewLayers = newLayersToAdd.map(nl => ({
        ...nl,
        shapeIds: processedShapes.filter(s => s.layerId === nl.id).map(s => s.id)
      }));
      finalLayers = [...updatedNewLayers, ...currentLayers];
    } else {
      finalLayers = currentLayers.map(l => {
        if (l.id === currentActiveLayer) {
          return {
            ...l,
            shapeIds: [...(l.shapeIds || []), ...processedShapes.map(s => s.id)]
          };
        }
        return l;
      });
    }

    // 6. Combine all shapes
    const finalShapes = isCurrentProjectEmpty
      ? processedShapes
      : [...currentShapes, ...processedShapes];

    const finalActiveLayerId = newLayersToAdd.length > 0 ? newLayersToAdd[0].id : currentActiveLayer;

    // 7. Update history state (single undo point!)
    setHistoryState({
      shapes: finalShapes,
      layers: finalLayers,
      activeLayerId: finalActiveLayerId,
      distributePathState: null
    });

    // 8. Auto expand canvas if needed
    if (autoExpandCanvas && cloudData.canvasSettings) {
      const cloudW = cloudData.canvasSettings.width || 800;
      const cloudH = cloudData.canvasSettings.height || 600;
      setCanvasWidth(prev => Math.max(prev, cloudW));
      setCanvasHeight(prev => Math.max(prev, cloudH));
    }

    // 9. Update Project Name
    if (resolvedProjectName) {
      setProjectName(resolvedProjectName);
    }

    // 10. Auto select the imported objects
    if (masterGroupId) {
      setSelectedShapeIds([masterGroupId]);
    } else if (rootImportedShapeIds.length > 0) {
      setSelectedShapeIds(rootImportedShapeIds);
    }

    setIsProjectActive(true);
    setProjectWasEverActive(true);
    showNotification(t('cloud.merge.success') || 'Проєкт успішно об\'єднано з поточним!', 'info');
  }, [shapes, layers, activeLayerId, setHistoryState, setCanvasWidth, setCanvasHeight, setProjectName, setSelectedShapeIds, setIsProjectActive, setProjectWasEverActive, showNotification, t]);

  const handleOpenCloudProject = useCallback((dataStrOrObj: string | object, projName?: string) => {
    try {
      let savedData: any = null;
      if (typeof dataStrOrObj === 'string') {
        savedData = JSON.parse(dataStrOrObj);
      } else {
        savedData = dataStrOrObj;
      }

      if (!savedData || (!Array.isArray(savedData.shapes) && !savedData.canvasSettings)) {
        showNotification(t('app.1016') || 'Помилка читання файлу проєкту', 'error');
        return;
      }

      const targetTitle = projName || savedData.projectName || t('cloud.project.untitled') || 'Хмарний проєкт';
      const hasShapesInEditor = (shapes && shapes.length > 0) || (isProjectActive && displayedShapes && displayedShapes.length > 0);

      if (!hasShapesInEditor) {
        processLoadedData(savedData, targetTitle);
        showNotification(t('cloud.open.success') || 'Проєкт успішно відкрито з хмари!', 'info');
      } else {
        setPendingCloudProjectOpen({
          data: savedData,
          name: targetTitle
        });
      }
    } catch (err) {
      console.error("Failed to parse cloud project data:", err);
      showNotification(t('file.import.readError'), 'error');
    }
  }, [shapes, isProjectActive, displayedShapes, processLoadedData, showNotification, t]);

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
                .filter(line => showComments || !((line?.content || '').trim() || '').startsWith('#'))
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
        
        // Always show external resource warning first
        setConfirmationAction({
            title: t('app.1055'),
            message: t('app.1056'),
            confirmText: t('app.1057'),
            cancelText: t('app.1058'),
            variant: 'primary',
            onConfirm: () => {
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
                    openUrl(codeString);
                    setConfirmationAction(null);
                }
            }
        });
    }, [codeStringForExport, showNotification, t]);


  const handleDuplicate = useCallback(() => { 
    if (distributePathState) return;
    if (selectedShapeIds.length > 0) {
        const newSelectedIds = duplicateShape(selectedShapeIds) as string[];
        setSelectedShapeIds(newSelectedIds);
        setIsMultiSelectMode(false);
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
                setIsMultiSelectMode(false);
                deleteShape(idsToDelete);
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
            if (selectedShapeIds.includes(id)) {
                deleteShape(selectedShapeIds);
            } else {
                deleteShape(id);
            }
            setIsMultiSelectMode(false);
            setConfirmationAction(null);
        },
        confirmText: t('action.confirm') || 'Підтвердити',
        cancelText: t('action.cancel') || 'Скасувати',
        variant: 'destructive'
    });
  }, [deleteShape, t, distributePathState, selectedShapeIds]);

  const handleAlignShapes = useCallback((alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom' | 'center-both' | 'distribute-h' | 'distribute-v' | 'distribute-path', relativeTo: 'selection' | 'canvas', distributeOptions?: { orientAlongPath: boolean, orientationType: 'radial' | 'tangent' | 'parallel' | 'perpendicular' | 'custom', orientationAngle: number, rotateAlongPath: boolean }) => {
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
          else if (alignment === 'center-h' || alignment === 'center-both') dx = (canvasWidth / 2) - (minX + width / 2);
          
          if (alignment === 'top') dy = 0 - minY;
          else if (alignment === 'bottom') dy = canvasHeight - maxY;
          else if (alignment === 'center-v' || alignment === 'center-both') dy = (canvasHeight / 2) - (minY + height / 2);

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
          else if (alignment === 'center-h' || alignment === 'center-both') targetX = canvasWidth / 2;
          
          if (alignment === 'top') targetY = 0;
          else if (alignment === 'bottom') targetY = canvasHeight;
          else if (alignment === 'center-v' || alignment === 'center-both') targetY = canvasHeight / 2;
      } else {
          if (alignment === 'left') targetX = Math.min(...topLevelEntities.map(e => e.bbox.x));
          else if (alignment === 'right') targetX = Math.max(...topLevelEntities.map(e => e.bbox.x + e.bbox.width));
          else if (alignment === 'center-h' || alignment === 'center-both') {
              const minX = Math.min(...topLevelEntities.map(e => e.bbox.x));
              const maxX = Math.max(...topLevelEntities.map(e => e.bbox.x + e.bbox.width));
              targetX = minX + (maxX - minX) / 2;
          }
          if (alignment === 'top') targetY = Math.min(...topLevelEntities.map(e => e.bbox.y));
          else if (alignment === 'bottom') targetY = Math.max(...topLevelEntities.map(e => e.bbox.y + e.bbox.height));
          else if (alignment === 'center-v' || alignment === 'center-both') {
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
              else if (alignment === 'center-h' || alignment === 'center-both') dx = targetX - (entity.bbox.x + entity.bbox.width / 2);
              
              if (alignment === 'top') dy = targetY - entity.bbox.y;
              else if (alignment === 'bottom') dy = targetY - (entity.bbox.y + entity.bbox.height);
              else if (alignment === 'center-v' || alignment === 'center-both') dy = targetY - (entity.bbox.y + entity.bbox.height / 2);

              if (dx === 0 && dy === 0) return s;

              switch (s.type) {
                  case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap':
                      return { ...s, x: s.x + dx, y: s.y + dy };
                  case 'ellipse': case 'polygon': case 'star':
                      return { ...s, cx: s.cx + dx, cy: s.cy + dy };
                  case 'line': case 'bezier': case 'pencil': case 'polyline':
                      return { ...s, points: (s as any).points.map((p: any) => ({ x: p.x + dx, y: p.y + dy })) };
                  case 'group':
                      if ((s as any).rotationCenter) {
                          return { ...s, rotationCenter: { x: (s as any).rotationCenter.x + dx, y: (s as any).rotationCenter.y + dy } };
                      }
                      return s;
                  default:
                      return s;
              }
          });
      });
  }, [selectedShapeIds, shapes, setShapes, canvasWidth, canvasHeight, distributePathState]);

  const handleConfirmDistributePath = useCallback(() => {
      if (distributePathState) {
          setSelectedShapeIds(distributePathState.entities.map(e => e.ids[0]));
      }
      setHistoryState((prev: any) => {
          const newShapes = applyDistributePathToShapes(prev.shapes, prev.distributePathState!);
          const addedShapes = newShapes.filter(ns => !prev.shapes.some((ps: any) => ps.id === ns.id));
          const removedShapeIds = prev.shapes.filter((ps: any) => !newShapes.some(ns => ns.id === ps.id)).map((s: any) => s.id);
          let newLayers = prev.layers;
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
          return { ...prev, shapes: newShapes, layers: newLayers, distributePathState: null };
      });
  }, [distributePathState, setHistoryState]);

  const handleCancelDistributePath = useCallback(() => {
      if (distributePathState) {
          setSelectedShapeIds(distributePathState.entities.map(e => e.ids[0]));
      }
      setDistributePathState(null);
  }, [distributePathState]);

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
        setIsMultiSelectMode(false);
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

        setIsFitToScreenMode(false);
        setViewTransform({ scale: newScale, x: newX, y: newY });
    }, [selectedShapeIds, displayedShapes, distributePathState, showAxes, viewportSize, setViewTransform]);

    useEffect(() => {
        if (activeTool === 'edit-points') {
            if (selectedShapeIds.length > 1) {
                setActiveTool('select');
            } else if (selectedShapeIds.length === 1) {
                const shape = shapes.find((s: any) => s.id === selectedShapeIds[0]);
                if (shape && (shape.type === 'text' || shape.type === 'group' || shape.type === 'image' || shape.type === 'bitmap')) {
                    setActiveTool('select');
                }
            }
        }
    }, [selectedShapeIds, activeTool, setActiveTool, shapes]);

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

                            // Snap to canvas edges
                            if (dx !== 0) {
                                const canvasXTargets = [
                                    { moving: movingBox.x, target: 0 },
                                    { moving: movingBox.x + movingBox.width, target: 0 },
                                    { moving: movingCenters.x, target: 0 },
                                    { moving: movingBox.x, target: canvasWidth },
                                    { moving: movingBox.x + movingBox.width, target: canvasWidth },
                                    { moving: movingCenters.x, target: canvasWidth }
                                ];
                                for (const t of canvasXTargets) {
                                    const diff = Math.abs(t.moving - t.target);
                                    if (diff < minSnapDistX) {
                                        minSnapDistX = diff;
                                        bestDx = dx - (t.moving - t.target);
                                        newSnapLines.x = t.target;
                                    }
                                }
                            }

                            if (dy !== 0) {
                                const canvasYTargets = [
                                    { moving: movingBox.y, target: 0 },
                                    { moving: movingBox.y + movingBox.height, target: 0 },
                                    { moving: movingCenters.y, target: 0 },
                                    { moving: movingBox.y, target: canvasHeight },
                                    { moving: movingBox.y + movingBox.height, target: canvasHeight },
                                    { moving: movingCenters.y, target: canvasHeight }
                                ];
                                for (const t of canvasYTargets) {
                                    const diff = Math.abs(t.moving - t.target);
                                    if (diff < minSnapDistY) {
                                        minSnapDistY = diff;
                                        bestDy = dy - (t.moving - t.target);
                                        newSnapLines.y = t.target;
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
                    deleteShape(selectedShapeIds);
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
        setIsFitToScreenMode(false);
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
        setIsFitToScreenMode(false);
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

  const handleCancelFillPreview = useCallback(() => {
      setPreviewFillColor(null);
  }, []);

  const handleSetStrokeColor = useCallback((color: string) => {
      setStrokeColor(color);
      setPreviewStrokeColor(null);
  }, []);

  const handleCancelStrokePreview = useCallback(() => {
      setPreviewStrokeColor(null);
  }, []);

  const handleSetTextColor = useCallback((color: string) => {
      setTextColor(color);
      setPreviewTextColor(null);
  }, []);

  const handleCancelTextPreview = useCallback(() => {
      setPreviewTextColor(null);
  }, []);

    const processLoadedDataRef = useRef(processLoadedData);
    useEffect(() => {
        processLoadedDataRef.current = processLoadedData;
    }, [processLoadedData]);

    // On initial load, check for an autosaved project or URL shared project (cloud ID or hash)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const cloudProjectId = urlParams.get('cloudProject') || urlParams.get('cp');

        if (cloudProjectId) {
            getCloudProjectById(cloudProjectId).then((proj) => {
                if (proj && proj.projectData) {
                    processLoadedDataRef.current(proj.projectData, proj.title);
                    showNotification(t('cloud.open.successWithName', { name: proj.title }), 'info');
                    window.history.replaceState(null, '', window.location.pathname);
                } else {
                    showNotification(t('cloud.open.notFound'), 'error');
                }
            }).catch((err) => {
                console.error("Error loading cloud project from URL:", err);
                showNotification(t('cloud.open.error'), 'error');
            });
            return;
        }

        const fullUrl = window.location.href;
        if (fullUrl.includes('project=') || fullUrl.includes('p=') || fullUrl.includes('%23project=')) {
            const decompressed = decompressProjectFromUrl(fullUrl);
            if (decompressed && decompressed.rawJson) {
                try {
                    processLoadedDataRef.current(decompressed.rawJson, decompressed.data?.projectName);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
    <div 
      className="w-full bg-[var(--bg-app)] text-[var(--text-primary)] font-sans flex flex-col selection:bg-[var(--accent-primary)] selection:text-[var(--accent-text)] overflow-hidden"
      style={{
        height: 'var(--app-height, 100dvh)',
        maxHeight: 'var(--app-height, 100dvh)'
      }}
    >
      
      <div className="w-full h-full flex flex-col min-h-0 flex-1 overflow-hidden">
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleFileSelect} />
          <input type="file" ref={projectLoadInputRef} style={{ display: 'none' }} accept=".json,.vec.json" onChange={handleProjectFileSelected} />
          {notification && (
            <div className={`fixed top-5 left-1/2 -translate-x-1/2 ${notification.type === 'error' ? 'bg-[var(--destructive-bg)]' : 'bg-[var(--accent-primary)]'} text-[var(--accent-text)] py-2 px-4 rounded-lg shadow-lg z-[99999] animate-fade-in-down`}>
              {notification.message}
            </div>
          )}
          
          {isMobile ? (
            <MobileTopHeader
              projectName={projectName}
              isProjectActive={isProjectActive}
              onOpenMenu={() => setMobileSheet('menu')}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              onOpenHistory={handleOpenHistory}
              onOpenPreview={() => {
                if (shapes.length > 0) {
                  setShapesAtGenerationTime(shapes);
                  setIsPreviewOpen(true);
                } else {
                  showNotification(t('simulation.noShapes'), 'info');
                }
              }}
              onOpenCloudGallery={() => {
                setCloudGalleryInitialTab('public');
                setIsCloudGalleryOpen(true);
              }}
              isLandscape={isLandscape}
            />
          ) : (
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
              onOpenCloudGallery={(tab) => {
                  setCloudGalleryInitialTab(tab || 'public');
                  setIsCloudGalleryOpen(true);
              }}
              onImportImage={handleImportImage}
              onExport={() => setIsExportModalOpen(true)}
              onShareLink={handleShareLink}
              showShareLink={activeCheats.has('003')}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              onOpenHistory={handleOpenHistory}
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
              onAlignShapes={handleAlignShapes}
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
          )}

          {isProjectActive && !isMobile && <TopToolbar
              allShapes={shapes}
              distributePathState={distributePathState}
              onDistributePathChange={handleDistributePathChange}
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
              onOpenHistory={handleOpenHistory}
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

           <main className={`flex-1 min-h-0 overflow-hidden ${isMobile ? 'flex flex-col' : 'grid grid-cols-1 md:grid-cols-[380px_1fr] lg:grid-cols-[380px_1fr_295px]'}`}>
             
            {/* Left Column */}
            {isProjectActive && !isMobile && <aside className={`${isLeftPanelVisible ? 'fixed inset-0 bg-[var(--bg-app)]/95 backdrop-blur-sm z-40 p-4 flex flex-col' : 'hidden'} md:static md:bg-transparent md:z-auto md:flex flex-col gap-4 min-h-0 bg-[var(--bg-primary)]/50 md:p-2`}>
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
                        allShapes={shapes}
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
            <div 
                className={`flex flex-col min-w-0 min-h-0 flex-1 transition-[padding] duration-150 ease-out overflow-hidden ${
                    !isProjectActive 
                        ? "p-0 sm:p-2 md:p-4 md:col-start-1 lg:col-start-1 md:col-span-3 lg:col-span-3 h-full overflow-hidden" 
                        : "p-1 sm:p-2 md:p-4"
                }`}
                style={
                    isProjectActive && isMobile
                        ? isLandscape
                            ? {
                                paddingRight: mobileSheet && mobileSheet !== 'menu' && mobileSheetPinMode === 'docked'
                                    ? `calc(${mobileSheetWidthVw}vw + 60px + env(safe-area-inset-right, 0px))`
                                    : `calc(60px + env(safe-area-inset-right, 0px))`,
                                paddingBottom: '4px'
                              }
                            : {
                                paddingBottom: mobileSheet && mobileSheet !== 'menu' && mobileSheetPinMode === 'docked'
                                    ? `calc(${mobileSheetHeightVh}vh + 60px + env(safe-area-inset-bottom, 0px))`
                                    : `calc(60px + env(safe-area-inset-bottom, 0px))`,
                                paddingRight: '0px'
                              }
                        : undefined
                }
            >
                {isProjectActive ? (
                    <>
                        <div ref={viewportRef} className="bg-[var(--bg-secondary)] rounded-lg shadow-inner flex-1 min-h-0 overflow-hidden relative grid" style={{
                            gridTemplateRows: showAxes ? `${RULER_THICKNESS}px 1fr` : '1fr',
                            gridTemplateColumns: showAxes ? `${RULER_THICKNESS}px 1fr` : '1fr',
                        }}>
                            {showAxes && <div className="bg-[var(--ruler-bg)] z-10 flex items-center justify-center p-1 select-none pointer-events-none touch-none"><AxesIcon size={16}/></div>}
                            {showAxes && <Ruler orientation="horizontal" transform={viewTransform} length={viewportSize.width - RULER_THICKNESS} canvasSize={{ width: canvasWidth, height: canvasHeight }} />}
                            {showAxes && <Ruler orientation="vertical" transform={viewTransform} length={viewportSize.height - RULER_THICKNESS} canvasSize={{ width: canvasWidth, height: canvasHeight }} />}
                            <div className="relative overflow-hidden" style={{ gridRow: showAxes ? 2 : '1 / -1', gridColumn: showAxes ? 2 : '1 / -1' }}>
                                 {/* Floating Mode Controls Hub (Active only during specific operations on mobile) */}
                                 {isMobile && (
                                     <FloatingModeControls
                                         distributePathState={distributePathState}
                                         onDistributePathChange={setDistributePathStateWithoutHistory}
                                         onConfirmDistributePath={handleConfirmDistributePath}
                                         onCancelDistributePath={handleCancelDistributePath}
                                         isSelectingPathShape={isSelectingPathShape}
                                         onToggleSelectPathShape={() => setIsSelectingPathShape(prev => !prev)}
                                         activeTool={activeTool}
                                         setActiveTool={handleSetActiveTool}
                                         selectedShapeIds={selectedShapeIds}
                                         selectedShapes={selectedShapes}
                                         allShapes={shapes}
                                         activePointIndex={activePointIndex}
                                         setActivePointIndex={setActivePointIndex}
                                         onDeletePoint={deletePoint}
                                         onAddPoint={addPoint}
                                         isDrawingPolyline={isDrawingPolyline}
                                         polylinePoints={polylinePoints}
                                         onCompletePolyline={(close) => handleCompletePolyline(close)}
                                         onCancelPolyline={handleCancelPolyline}
                                         onUndoPolylinePoint={() => setPolylinePoints(prev => prev.slice(0, -1))}
                                         isDrawingBezier={isDrawingBezier}
                                         bezierPoints={bezierPoints}
                                         onCompleteBezier={(close) => handleCompleteBezier(close ?? false)}
                                         onCancelBezier={handleCancelBezier}
                                         onUndoBezierPoint={() => setBezierPoints(prev => prev.slice(0, -1))}
                                         onGroup={handleGroup}
                                         onDeleteSelected={handleDelete}
                                         onOpenAlign={() => {
                                             if (isMobile) {
                                                 setMobileSheet('align');
                                             } else {
                                                 handleAlignShapes('center-h', 'canvas');
                                             }
                                         }}
                                         onStartDistributePath={() => handleAlignShapes('distribute-path', 'canvas')}
                                         isImportingImage={isImportingImage}
                                         pendingImage={pendingImage}
                                         onCancelImportImage={() => {
                                             setIsImportingImage(false);
                                             setPendingImage(null);
                                         }}
                                         canvasWidth={canvasWidth}
                                         canvasHeight={canvasHeight}
                                     />
                                 )}

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
                                <ErrorBoundary>
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
                                        touchDrawingMode={touchDrawingMode}
                                        setTouchDrawingMode={setTouchDrawingMode}
                                        projectSessionId={projectSessionId}
                                        onCompletePolyline={handleCompletePolyline} onCancelPolyline={handleCancelPolyline} onUndoPolylinePoint={() => setPolylinePoints(prev => prev.slice(0, -1))} isDrawingBezier={isDrawingBezier} bezierPoints={bezierPoints} setBezierPoints={setBezierPoints}
                                        onCompleteBezier={handleCompleteBezier} onCancelBezier={handleCancelBezier} onUndoBezierPoint={() => setBezierPoints(prev => prev.slice(0, -1))} showGrid={showGrid} gridSize={gridSize} snapStep={snapToGrid ? gridSnapStep : 1}
                                        activePointIndex={activePointIndex} setActivePointIndex={setActivePointIndex} showCursorCoords={showCursorCoords} showRotationAngle={showRotationAngle}
                                        showMagnifier={showMagnifier}
                                        setShowMagnifier={setShowMagnifier}
                                        pendingImage={pendingImage} setPendingImage={setPendingImage} setCursorPos={setCursorPos}
                                        isImportingImage={isImportingImage}
                                        showNotification={showNotification}
                                        onStartInlineEdit={handleStartInlineEdit}
                                        inlineEditingShapeId={inlineEditingShapeId}
                                        keyboardSnapLines={keyboardSnapLines}
                                        showCenterGuides={showCenterGuides}
                                        enableSnapping={enableSnapping}
                                        isMultiSelectMode={isMultiSelectMode}
                                        setIsMultiSelectMode={setIsMultiSelectMode}
                                        viewTransform={viewTransform}
                                        setViewTransform={handleUserSetViewTransform}
                                    />
                                </ErrorBoundary>
                            </div>

                            {selectedShapeIds.length > 0 && !distributePathState && isSelectionHUDCollapsed && (
                                <button
                                    type="button"
                                    onClick={() => setIsSelectionHUDCollapsed(false)}
                                    title={t('button.expand') || 'Розгорнути панель дій'}
                                    className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] active:scale-95 text-[var(--text-primary)] font-extrabold text-xs border border-[var(--border-secondary)] hover:border-[var(--accent-primary)] shadow-lg transition-all group cursor-pointer animate-in fade-in zoom-in-95 pointer-events-auto"
                                >
                                    <span className="flex h-2 w-2 relative shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    <span className="text-[var(--text-primary)] font-black tracking-wider text-xs">
                                        {selectedShapeIds.length}/{shapes.length}
                                    </span>
                                    <ChevronUpIcon size={14} className="text-[var(--accent-primary)] group-hover:-translate-y-0.5 transition-transform" />
                                </button>
                            )}

                            <button 
                                onClick={() => fitCanvasToView()} 
                                title={t('menu.view.fit')} 
                                className={`absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 p-2 rounded-full shadow-lg transition-colors ${
                                    isFitToScreenMode 
                                        ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' 
                                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                <FitToScreenIcon />
                            </button>

                            {isMobile && (
                                <div className="absolute top-3 right-3 z-20">
                                    <MobileQuickControls
                                        zoomLevel={viewTransform.scale}
                                        onZoomChange={handleZoomChange}
                                        onResetZoom={handleResetZoom}
                                        onLocateSelectedShape={handleLocateSelectedShape}
                                        hasSelectedShapes={selectedShapeIds.length > 0}
                                        showCursorCoords={showCursorCoords}
                                        setShowCursorCoords={setShowCursorCoords}
                                        showMagnifier={showMagnifier}
                                        setShowMagnifier={setShowMagnifier}
                                        touchDrawingMode={touchDrawingMode}
                                        setTouchDrawingMode={setTouchDrawingMode}
                                        cursorPos={cursorPos}
                                    />
                                </div>
                            )}
                        </div>
                            {selectedShapeIds.length > 0 && !distributePathState && !isSelectionHUDCollapsed && (
                                <MultiSelectHUD
                                    selectedCount={selectedShapeIds.length}
                                    totalSelectableCount={shapes.length}
                                    onCollapse={() => setIsSelectionHUDCollapsed(true)}
                                    onGroup={handleGroup}
                                    onUngroup={handleUngroup}
                                    onDelete={handleDelete}
                                    onDuplicate={handleDuplicate}
                                    onSelectAll={handleSelectAll}
                                    onOpenAlign={() => setMobileSheet('align')}
                                    onFlipH={() => handleFlip('horizontal')}
                                    onFlipV={() => handleFlip('vertical')}
                                    onDeselectAll={() => {
                                        handleSelectShape(null);
                                        setIsMultiSelectMode(false);
                                    }}
                                    canGroup={selectedShapeIds.length >= 2}
                                    canUngroup={selectedShapeIds.some((id: string) => shapes.find((s: any) => s.id === id)?.type === 'group' || shapes.find((s: any) => s.id === id)?.groupId !== undefined)}
                                    isMobile={isMobile}
                                />
                            )}
                        {!isMobile && (
                            <StatusBar 
                                zoomLevel={viewTransform.scale} 
                                cursorPos={cursorPos}
                                onZoomChange={handleZoomChange}
                                onResetZoom={handleResetZoom}
                                onLocateSelectedShape={handleLocateSelectedShape}
                                selectedShapeIds={selectedShapeIds}
                                showCursorCoords={showCursorCoords}
                                setShowCursorCoords={setShowCursorCoords}
                                showMagnifier={showMagnifier}
                                setShowMagnifier={setShowMagnifier}
                                touchDrawingMode={touchDrawingMode}
                                setTouchDrawingMode={setTouchDrawingMode}
                            />
                        )}
                    </>
                ) : (
                    <WelcomeScreen 
                        onCreateNew={handleOpenNewProjectModal}
                        onLoadProject={handleLoadProject}
                        onOpenCloudGallery={(tab) => {
                            setCloudGalleryInitialTab(tab || 'public');
                            setIsCloudGalleryOpen(true);
                        }}
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
            {isProjectActive && !isMobile && <aside className={`${isRightPanelVisible ? 'fixed inset-0 bg-[var(--bg-app)]/95 backdrop-blur-sm z-40 p-4 flex flex-col' : 'hidden'} lg:static lg:bg-transparent lg:z-auto lg:flex flex-col gap-3 min-h-0 overflow-hidden md:p-2`}>
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
                                isMultiSelectMode={isMultiSelectMode}
                                setIsMultiSelectMode={setIsMultiSelectMode}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex-[2_2_0%] min-h-0 flex flex-col overflow-hidden">
                    <PropertyEditor onExtractFromGroup={handleExtractFromGroup} handleFlip={handleFlip} showSystemTags={showSystemTags} 
                        distributePathState={distributePathState}
                        onDistributePathChange={handleDistributePathChange}
                        onConfirmDistributePath={handleConfirmDistributePath}
                        onCancelDistributePath={handleCancelDistributePath}
                        selectedShapes={selectedShapes} allShapes={shapes} updateShape={updateShape} updateShapes={updateShapes} deleteShape={deleteShape} duplicateShape={duplicateShape}
                        activeTool={activeTool} activePointIndex={activePointIndex} setActivePointIndex={setActivePointIndex}
                        deletePoint={deletePoint} addPoint={addPoint} convertToPath={convertToPath} showNotification={showNotification}
                        setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview}
                        fillColor={fillColor} strokeColor={strokeColor}
                    />
                </div>
            </aside>}
          </main>

          {isMobile && (
            <MobileMenuDrawer
              isOpen={mobileSheet === 'menu'}
              onClose={() => setMobileSheet(null)}
              projectName={projectName}
              isProjectActive={isProjectActive}
              appVersion={APP_VERSION}
              onGoHome={handleGoHome}
              onNewProject={handleOpenNewProjectModal}
              onSaveProject={handleSaveProject}
              canSave={isProjectActive && (hasUnsavedChanges || !fileHandle)}
              onSaveProjectAs={() => setIsSaveAsModalOpen(true)}
              onSaveAsTemplate={() => setIsSaveTemplateModalOpen(true)}
              onLoadProject={handleLoadProject}
              onOpenCloudGallery={(tab) => {
                setCloudGalleryInitialTab(tab || 'public');
                setIsCloudGalleryOpen(true);
              }}
              onImportImage={handleImportImage}
              onExport={() => setIsExportModalOpen(true)}
              onShareLink={handleShareLink}
              showShareLink={activeCheats.has('003')}
              onClearCanvas={handleClearCanvas}
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
              theme={theme}
              setTheme={setTheme}
              onOpenSettings={handleOpenSettings}
              onOpenCode={() => setMobileSheet('code')}
              onOpenPreview={() => {
                if (shapes.length > 0) {
                  setShapesAtGenerationTime(shapes);
                  setIsPreviewOpen(true);
                } else {
                  showNotification(t('test.noShapes'), 'info');
                }
              }}
              onOpenAlign={() => setMobileSheet('align')}
              onSaveCode={() => setIsSaveCodeModalOpen(true)}
              onRunOnline={() => handleOpenOrRunCodeOnline(true)}
              onOpenAbout={() => setIsAboutModalOpen(true)}
              onOpenHelp={() => setIsHelpModalOpen(true)}
              onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
              onOpenFeedback={() => setIsFeedbackModalOpen(true)}
              onExitApp={handleExitApp}
            />
          )}

          {isProjectActive && isMobile && (
              <>
                  <MobileBottomBar
                      activeTool={activeTool}
                      setActiveTool={handleSetActiveTool}
                      undo={undo}
                      redo={redo}
                      canUndo={canUndo}
                      canRedo={canRedo}
                      hasSelectedShapes={selectedShapeIds.length > 0}
                      selectedShapesCount={selectedShapeIds.length}
                      canGroup={canGroup}
                      canUngroup={canUngroup}
                      canFlip={canFlip}
                      onDeleteShape={handleDelete}
                      onDuplicateShape={handleDuplicate}
                      onGroup={handleGroup}
                      onUngroup={handleUngroup}
                      onFlipH={() => handleFlip('horizontal')}
                      onFlipV={() => handleFlip('vertical')}
                      onOpenLayers={() => setMobileSheet(prev => prev === 'layers' ? null : 'layers')}
                      onOpenShapes={() => setMobileSheet(prev => prev === 'shapes' ? null : 'shapes')}
                      onOpenPalette={() => setMobileSheet(prev => prev === 'palette' ? null : 'palette')}
                      onOpenCode={() => setMobileSheet(prev => prev === 'code' ? null : 'code')}
                      onOpenAlign={() => setMobileSheet(prev => prev === 'align' ? null : 'align')}
                      activeSheet={mobileSheet}
                      isLandscape={isLandscape}
                  />
                  
                  <MobileBottomSheet 
                      isOpen={mobileSheet === 'shapes'} 
                      onClose={() => setMobileSheet(null)} 
                      title={t('shape.list') || "Фігури та Інструменти"}
                      pinMode={mobileSheetPinMode}
                      onPinModeChange={setMobileSheetPinMode}
                      onHeightVhChange={setMobileSheetHeightVh}
                      onWidthVwChange={setMobileSheetWidthVw}
                      onNavigatePrev={handleNavigateSheetPrev}
                      onNavigateNext={handleNavigateSheetNext}
                      activeTabId="shapes"
                      isLandscape={isLandscape}
                  >
                      <MobileShapesSheet
                          activeTool={activeTool}
                          setActiveTool={handleSetActiveTool}
                          drawMode={drawMode}
                          setDrawMode={setDrawMode}
                          numberOfSides={numberOfSides}
                          setNumberOfSides={setNumberOfSides}
                          activeCheats={activeCheats}
                          onClose={() => {
                              if (mobileSheetPinMode !== 'docked') {
                                  setMobileSheet(null);
                              }
                          }}
                      />
                  </MobileBottomSheet>

                  <MobileBottomSheet 
                      isOpen={mobileSheet === 'palette'} 
                      onClose={() => setMobileSheet(null)} 
                      title={t('tool.color') || "Колір, Стиль та Властивості"}
                      pinMode={mobileSheetPinMode}
                      onPinModeChange={setMobileSheetPinMode}
                      onHeightVhChange={setMobileSheetHeightVh}
                      onWidthVwChange={setMobileSheetWidthVw}
                      onNavigatePrev={handleNavigateSheetPrev}
                      onNavigateNext={handleNavigateSheetNext}
                      activeTabId="palette"
                      isLandscape={isLandscape}
                  >
                      <MobileStyleSheet
                          fillColor={fillColor}
                          isFillEnabled={isFillEnabled}
                          setIsFillEnabled={setIsFillEnabled}
                          handleSetFillColor={handleSetFillColor}
                          setPreviewFillColor={setPreviewFillColor}
                          handleCancelFillPreview={handleCancelFillPreview}
                          strokeColor={strokeColor}
                          isStrokeEnabled={isStrokeEnabled}
                          setIsStrokeEnabled={setIsStrokeEnabled}
                          handleSetStrokeColor={handleSetStrokeColor}
                          setPreviewStrokeColor={setPreviewStrokeColor}
                          handleCancelStrokePreview={handleCancelStrokePreview}
                          strokeWidth={strokeWidth}
                          setStrokeWidth={setStrokeWidth}
                          textColor={textColor}
                          setTextColor={handleSetTextColor}
                          setPreviewTextColor={setPreviewTextColor}
                          handleCancelTextPreview={handleCancelTextPreview}
                          textFont={textFont}
                          setTextFont={setTextFont}
                          textFontSize={textFontSize}
                          setTextFontSize={setTextFontSize}
                          selectedShapes={selectedShapes}
                          allShapes={shapes}
                          canvasWidth={canvasWidth}
                          canvasHeight={canvasHeight}
                          updateShape={updateShape}
                          updateShapes={updateShapes}
                          deleteShape={deleteShape}
                          duplicateShape={duplicateShape}
                          handleExtractFromGroup={handleExtractFromGroup}
                          handleFlip={handleFlip}
                          showSystemTags={showSystemTags}
                          distributePathState={distributePathState}
                          setDistributePathState={setDistributePathState}
                          onConfirmDistributePath={handleConfirmDistributePath}
                          onCancelDistributePath={handleCancelDistributePath}
                          activeTool={activeTool}
                          activePointIndex={activePointIndex}
                          setActivePointIndex={setActivePointIndex}
                          deletePoint={deletePoint}
                          addPoint={addPoint}
                          convertToPath={convertToPath}
                          showNotification={showNotification}
                          setShapePreview={setShapePreview}
                          cancelShapePreview={cancelShapePreview}
                          onAlignShapes={handleAlignShapes}
                      />
                  </MobileBottomSheet>

                  <MobileBottomSheet 
                      isOpen={mobileSheet === 'align'} 
                      onClose={() => setMobileSheet(null)} 
                      title={t('menu.tools.align') || "Вирівнювання та розподіл"}
                      pinMode={mobileSheetPinMode}
                      onPinModeChange={setMobileSheetPinMode}
                      onHeightVhChange={setMobileSheetHeightVh}
                      onWidthVwChange={setMobileSheetWidthVw}
                      onNavigatePrev={handleNavigateSheetPrev}
                      onNavigateNext={handleNavigateSheetNext}
                      activeTabId="align"
                      isLandscape={isLandscape}
                  >
                      <MobileAlignSheet
                          selectedShapes={selectedShapes}
                          allShapes={shapes}
                          canvasWidth={canvasWidth}
                          canvasHeight={canvasHeight}
                          onAlignShapes={handleAlignShapes}
                          distributePathState={distributePathState}
                          onDistributePathChange={handleDistributePathChange}
                          onConfirmDistributePath={handleConfirmDistributePath}
                          onCancelDistributePath={handleCancelDistributePath}
                          onClose={() => setMobileSheet(null)}
                      />
                  </MobileBottomSheet>

                  <MobileBottomSheet 
                      isOpen={mobileSheet === 'layers'} 
                      onClose={() => setMobileSheet(null)} 
                      title="Об'єкти та Шари"
                      pinMode={mobileSheetPinMode}
                      onPinModeChange={setMobileSheetPinMode}
                      onHeightVhChange={setMobileSheetHeightVh}
                      onWidthVwChange={setMobileSheetWidthVw}
                      onNavigatePrev={handleNavigateSheetPrev}
                      onNavigateNext={handleNavigateSheetNext}
                      activeTabId="layers"
                      isLandscape={isLandscape}
                  >
                      <MobileLayersSheet
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
                          distributePathState={distributePathState}
                          onAddLayer={addLayer}
                          onDeleteLayer={deleteLayer}
                          onClearLayer={clearLayer}
                          onToggleLayerVisibility={toggleLayerVisibility}
                          onToggleLayerLock={toggleLayerLock}
                          onUpdateLayerName={updateLayerName}
                          onMoveLayer={moveLayer}
                          canvasWidth={canvasWidth}
                          canvasHeight={canvasHeight}
                          canvasBgColor={canvasBgColor}
                          isMultiSelectMode={isMultiSelectMode}
                          setIsMultiSelectMode={setIsMultiSelectMode}
                      />
                  </MobileBottomSheet>

                  <MobileBottomSheet 
                      isOpen={mobileSheet === 'code'} 
                      onClose={() => setMobileSheet(null)} 
                      title={t('menu.export.code') || "Код Tkinter"}
                      pinMode={mobileSheetPinMode}
                      onPinModeChange={setMobileSheetPinMode}
                      onHeightVhChange={setMobileSheetHeightVh}
                      onWidthVwChange={setMobileSheetWidthVw}
                      onNavigatePrev={handleNavigateSheetPrev}
                      onNavigateNext={handleNavigateSheetNext}
                      activeTabId="code"
                      isLandscape={isLandscape}
                  >
                      <div className={isLandscape ? "h-full flex flex-col min-h-[260px]" : "h-[75vh] flex flex-col"}>
                          <CodeDisplay 
                              codeLines={generatedCodeLines} isLoading={isLoading} error={error} onUpdate={handleGenerateCode}
                              onPreview={() => {
                                  if (shapes.length > 0) {
                                      setShapesAtGenerationTime(shapes);
                                      setIsPreviewOpen(true);
                                  } else {
                                      showNotification(t('test.noShapes'), 'info');
                                  }
                              }} 
                              hasUnsyncedChanges={hasUnsyncedChangesWithCode}
                              opacity={1} setOpacity={() => {}}
                              selectedShapeIds={selectedShapeIds}
                              allShapes={shapes}
                              highlightCodeOnSelection={highlightCodeOnSelection}
                              setHighlightCodeOnSelection={setHighlightCodeOnSelection}
                              showLineNumbers={showLineNumbers}
                              setShowLineNumbers={setShowLineNumbers}
                              showComments={showComments}
                              setShowComments={setShowComments}
                              generatorType={generatorType}
                              onSwitchToLocalGenerator={handleSwitchToLocalFromError}
                              onOpenSettingsToGenerator={handleOpenSettingsToCode}
                              onSaveCode={() => setIsSaveCodeModalOpen(true)}
                              onOpenOrRunCodeOnline={handleOpenOrRunCodeOnline}
                              codeStringForExport={codeStringForExport}
                          />
                      </div>
                  </MobileBottomSheet>
              </>
          )}
          
          {isCheatCodeModalOpen && (
            <CheatCodeModal
                isOpen={isCheatCodeModalOpen}
                onClose={() => setIsCheatCodeModalOpen(false)}
                onActivate={handleActivateCheat}
                showNotification={showNotification}
                activeCheats={activeCheats}
            />
          )}

          {isLoaderShowcaseModalOpen && (
            <LoaderShowcaseModal
              isOpen={isLoaderShowcaseModalOpen}
              onClose={() => setIsLoaderShowcaseModalOpen(false)}
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
              variableNamingTemplate={variableNamingTemplate}
              setVariableNamingTemplate={setVariableNamingTemplate}
              gridSize={gridSize} setGridSize={setGridSize} gridSnapStep={gridSnapStep} setGridSnapStep={setGridSnapStep} showTkinterNames={showTkinterNames} setShowTkinterNames={setShowTkinterNames}
              showAxes={showAxes} setShowAxes={setShowAxes} 
              showCenterGuides={showCenterGuides} setShowCenterGuides={setShowCenterGuides}
              enableSnapping={enableSnapping} setEnableSnapping={setEnableSnapping}
              showCursorCoords={showCursorCoords} setShowCursorCoords={setShowCursorCoords}
              showMagnifier={showMagnifier} setShowMagnifier={setShowMagnifier}
              touchDrawingMode={touchDrawingMode} setTouchDrawingMode={setTouchDrawingMode}
              showRotationAngle={showRotationAngle} setShowRotationAngle={setShowRotationAngle}
              openAsWebApp={openAsWebApp} setOpenAsWebApp={setOpenAsWebApp}
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
          {isHistoryOpen && (
            <HistoryPopover
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                historyEntries={historyEntries}
                currentIndex={historyCurrentIndex}
                onJumpToIndex={(index) => {
                    jumpToHistoryIndex(index);
                    setSelectedShapeIds([]);
                }}
                initialMode={historyMode}
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
          <CloudGalleryModal
            isOpen={isCloudGalleryOpen}
            initialTab={cloudGalleryInitialTab}
            onClose={() => setIsCloudGalleryOpen(false)}
            onLoadProject={(dataStr, projName) => {
              handleOpenCloudProject(dataStr, projName);
            }}
            currentProjectShapesCount={displayedShapes ? displayedShapes.length : shapes.length}
            getCurrentProjectDataStr={() => {
              const saveData = getSaveData(projectName);
              return JSON.stringify(saveData);
            }}
            currentProjectName={projectName}
          />
          {pendingCloudProjectOpen && (
            <CloudProjectOpenModal
              isOpen={!!pendingCloudProjectOpen}
              onClose={() => setPendingCloudProjectOpen(null)}
              cloudProjectTitle={pendingCloudProjectOpen.name}
              cloudProjectData={pendingCloudProjectOpen.data}
              currentProjectName={projectName}
              currentShapesCount={displayedShapes ? displayedShapes.length : shapes.length}
              currentLayersCount={layers ? layers.length : 1}
              onReplace={(cloudData, name) => {
                processLoadedData(cloudData, name);
                setPendingCloudProjectOpen(null);
                showNotification(t('cloud.open.success') || 'Проєкт успішно відкрито з хмари!', 'info');
              }}
              onMerge={(mergeOpts) => {
                performMergeProject(mergeOpts);
                setPendingCloudProjectOpen(null);
              }}
            />
          )}
          {drawingWarningModal && drawingWarningModal.show && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
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
