const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetMenuBarProps = `    onOpenAbout: () => void;
    onOpenHelp: () => void;
    onOpenFeedback: () => void;
}> = React.memo((props) => {`;
const insertMenuBarProps = `    onOpenAbout: () => void;
    onOpenHelp: () => void;
    onOpenFeedback: () => void;
    isDistributingPath: boolean;
}> = React.memo((props) => {`;

const targetDeleteMenu = `                            <MenuItem onClick={() => handleMenuClick(props.onDelete, closeEdit)} disabled={!props.isShapeSelected} shortcut="Del">{t('menu.edit.delete')}</MenuItem>`;
const insertDeleteMenu = `                            <MenuItem onClick={() => handleMenuClick(props.onDelete, closeEdit)} disabled={!props.isShapeSelected || props.isDistributingPath} shortcut="Del">{t('menu.edit.delete')}</MenuItem>`;

const targetDuplicateMenu = `                            <MenuItem onClick={() => handleMenuClick(props.onDuplicate, closeEdit)} disabled={!props.isShapeSelected} shortcut="Ctrl+D">{t('menu.edit.duplicate')}</MenuItem>`;
const insertDuplicateMenu = `                            <MenuItem onClick={() => handleMenuClick(props.onDuplicate, closeEdit)} disabled={!props.isShapeSelected || props.isDistributingPath} shortcut="Ctrl+D">{t('menu.edit.duplicate')}</MenuItem>`;

const targetMenuBarUsage = `          <MenuBar
            onGenerate={handleGenerateCode}`;
const insertMenuBarUsage = `          <MenuBar
            isDistributingPath={!!distributePathState}
            onGenerate={handleGenerateCode}`;

if (code.includes(targetMenuBarProps) && code.includes(targetDeleteMenu) && code.includes(targetMenuBarUsage)) {
    code = code.replace(targetMenuBarProps, insertMenuBarProps);
    code = code.replace(targetDeleteMenu, insertDeleteMenu);
    code = code.replace(targetDuplicateMenu, insertDuplicateMenu);
    code = code.replace(targetMenuBarUsage, insertMenuBarUsage);
    fs.writeFileSync('App.tsx', code);
    console.log('patched MenuBar successfully');
} else {
    console.log('Targets not found!');
}
