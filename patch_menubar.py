import re

with open("App.tsx", "r") as f:
    text = f.read()

# Find the end of MenuBar interface
s = r"    isDistributingPath: boolean;\n\}> = React\.memo\(\(props\) => \{"
r_new = r"    isDistributingPath: boolean;\n    onGroup: () => void;\n    onUngroup: () => void;\n    onExtractFromGroup: () => void;\n    onFlipH: () => void;\n    onFlipV: () => void;\n}> = React.memo((props) => {"

text = re.sub(s, r_new, text)

# Add Flip to Object Menu
# <hr className="border-[var(--border-secondary)] my-1"/>
# <MenuItem onClick={() => handleMenuClick(props.onConvertToPath, closeObject)} disabled={!props.canConvertToPath}>{t('menu.object.toPath')}</MenuItem>
s2 = r"(<MenuItem onClick=\{\(\) => handleMenuClick\(props\.onExtractFromGroup, closeObject\)\} disabled=\{!props\.isShapeSelected \|\| props\.isDistributingPath\}\>\{t\('menu\.edit\.extractFromGroup'\)\}\<\/MenuItem\>)"
r2 = r"\1\n                            <hr className=\"border-[var(--border-secondary)] my-1\"/>\n                            <MenuItem onClick={() => handleMenuClick(props.onFlipH, closeObject)} disabled={!props.isShapeSelected || props.isDistributingPath}>{t('menu.object.flipHorizontal') || 'Віддзеркалити по горизонталі'}</MenuItem>\n                            <MenuItem onClick={() => handleMenuClick(props.onFlipV, closeObject)} disabled={!props.isShapeSelected || props.isDistributingPath}>{t('menu.object.flipVertical') || 'Віддзеркалити по вертикалі'}</MenuItem>"

text = re.sub(s2, r2, text)

with open("App.tsx", "w") as f:
    f.write(text)
