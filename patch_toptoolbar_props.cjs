const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetProps = `    textFontSize: number; setTextFontSize: (s: number) => void;
    isDistributingPath: boolean;
}> = React.memo((props) => {
    const { 
        isGenerating, hasShapes, onUndo, onRedo, canUndo, canRedo, onDuplicate, onGroup, onUngroup, onAlignShapes, isShapeSelected, onOpenMobileLeft, onOpenMobileRight,
        selectedShapes, activeTool, setActiveTool, onGenerate, showGenerateButton, onClear, isDistributingPath
    } = props;`;

const newProps = `    textFontSize: number; setTextFontSize: (s: number) => void;
    isDistributingPath: boolean;
    distributePathState?: DistributePathState | null;
    onDistributePathChange?: (state: DistributePathState) => void;
}> = React.memo((props) => {
    const { 
        isGenerating, hasShapes, onUndo, onRedo, canUndo, canRedo, onDuplicate, onGroup, onUngroup, onAlignShapes, isShapeSelected, onOpenMobileLeft, onOpenMobileRight,
        selectedShapes, activeTool, setActiveTool, onGenerate, showGenerateButton, onClear, isDistributingPath, distributePathState, onDistributePathChange
    } = props;`;

const targetControls = `        {/* Center properties */}
        <div className="flex items-center gap-x-2 gap-y-2 flex-wrap">
            {hasSelectedShapes ? <ContextualControls {...props} /> : <ToolControls {...props} />}
        </div>`;

const newControls = `        {/* Center properties */}
        <div className="flex items-center gap-x-2 gap-y-2 flex-wrap">
            {distributePathState && onDistributePathChange ? (
                <DistributePathTopControls distributePathState={distributePathState} onDistributePathChange={onDistributePathChange} />
            ) : (
                hasSelectedShapes ? <ContextualControls {...props} /> : <ToolControls {...props} />
            )}
        </div>`;

if (code.includes(targetProps) && code.includes(targetControls)) {
    code = code.replace(targetProps, newProps);
    code = code.replace(targetControls, newControls);
    fs.writeFileSync('App.tsx', code);
    console.log('patched TopToolbar props and usage successfully');
} else {
    console.log('Targets not found in App.tsx');
}
