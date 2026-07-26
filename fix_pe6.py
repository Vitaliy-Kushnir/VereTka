import re

with open('components/PropertyEditor.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("<Select \n                              value={distributePathState.type}", "<Select id='dist-type'\n                              value={distributePathState.type}")
code = code.replace("<Select \n                              value={distributePathState.orientationType}", "<Select id='dist-orient'\n                              value={distributePathState.orientationType}")

with open('components/PropertyEditor.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
