import re

with open('components/PropertyEditor.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("<Label>{t('prop.rotation') || 'Кут обертання'}</Label>", "<Label htmlFor='dist-rotation'>{t('prop.rotation') || 'Кут обертання'}</Label>")
code = code.replace("<NumberInput value={Math.round(distributePathState.angleOffset || 0)}", "<NumberInput id='dist-rotation' value={Math.round(distributePathState.angleOffset || 0)}")

with open('components/PropertyEditor.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
