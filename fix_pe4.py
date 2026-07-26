import re

with open('components/PropertyEditor.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("<Label title={t('tool.distributePath.type') || 'Тип шляху'}>{t('tool.distributePath.type') || 'Тип шляху'}</Label>", "<Label htmlFor='dist-type' title={t('tool.distributePath.type') || 'Тип шляху'}>{t('tool.distributePath.type') || 'Тип шляху'}</Label>")
code = code.replace("<Select ", "<Select id='dist-type' ")

code = code.replace("<Label title={t('tool.distributePath.orientation') || 'Орієнтація'}>{t('tool.distributePath.orientation') || 'Орієнтація'}</Label>", "<Label htmlFor='dist-orient' title={t('tool.distributePath.orientation') || 'Орієнтація'}>{t('tool.distributePath.orientation') || 'Орієнтація'}</Label>")

code = code.replace("<Label>{t('prop.startAngle') || 'Поч. кут'}</Label>", "<Label htmlFor='dist-start-angle'>{t('prop.startAngle') || 'Поч. кут'}</Label>")
code = code.replace("<NumberInput value={distributePathState.circleParams.startAngle}", "<NumberInput id='dist-start-angle' value={distributePathState.circleParams.startAngle}")

code = code.replace("<Label>{t('prop.endAngle') || 'Кін. кут'}</Label>", "<Label htmlFor='dist-end-angle'>{t('prop.endAngle') || 'Кін. кут'}</Label>")
code = code.replace("<NumberInput value={distributePathState.circleParams.endAngle}", "<NumberInput id='dist-end-angle' value={distributePathState.circleParams.endAngle}")


with open('components/PropertyEditor.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
