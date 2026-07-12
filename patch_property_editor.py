with open('components/PropertyEditor.tsx', 'r') as f:
    content = f.read()

import re
content = content.replace("({selectedShapes.length})", "({t('props.objectsCount') || 'Objects:'} {selectedShapes.length})")

with open('components/PropertyEditor.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
