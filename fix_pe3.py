import re

with open('components/PropertyEditor.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace circle props
code = code.replace('<Label>{t(\'prop.cx\')}</Label>', '<Label htmlFor="dist-cx">{t(\'prop.cx\')}</Label>')
code = code.replace('<NumberInput value={Math.round(distributePathState.circleParams.cx)}', '<NumberInput id="dist-cx" value={Math.round(distributePathState.circleParams.cx)}')

code = code.replace('<Label>{t(\'prop.cy\')}</Label>', '<Label htmlFor="dist-cy">{t(\'prop.cy\')}</Label>')
code = code.replace('<NumberInput value={Math.round(distributePathState.circleParams.cy)}', '<NumberInput id="dist-cy" value={Math.round(distributePathState.circleParams.cy)}')

code = code.replace('<Label>{t(\'prop.r\')}</Label>', '<Label htmlFor="dist-r">{t(\'prop.r\')}</Label>')
code = code.replace('<NumberInput value={Math.round(distributePathState.circleParams.radius)}', '<NumberInput id="dist-r" value={Math.round(distributePathState.circleParams.radius)}')

# Replace line props
code = code.replace('<Label>X1</Label>', '<Label htmlFor="dist-x1">X1</Label>')
code = code.replace('<NumberInput value={Math.round(distributePathState.lineParams.x1)}', '<NumberInput id="dist-x1" value={Math.round(distributePathState.lineParams.x1)}')

code = code.replace('<Label>Y1</Label>', '<Label htmlFor="dist-y1">Y1</Label>')
code = code.replace('<NumberInput value={Math.round(distributePathState.lineParams.y1)}', '<NumberInput id="dist-y1" value={Math.round(distributePathState.lineParams.y1)}')

code = code.replace('<Label>X2</Label>', '<Label htmlFor="dist-x2">X2</Label>')
code = code.replace('<NumberInput value={Math.round(distributePathState.lineParams.x2)}', '<NumberInput id="dist-x2" value={Math.round(distributePathState.lineParams.x2)}')

code = code.replace('<Label>Y2</Label>', '<Label htmlFor="dist-y2">Y2</Label>')
code = code.replace('<NumberInput value={Math.round(distributePathState.lineParams.y2)}', '<NumberInput id="dist-y2" value={Math.round(distributePathState.lineParams.y2)}')

with open('components/PropertyEditor.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
