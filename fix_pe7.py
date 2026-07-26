import re

with open('components/PropertyEditor.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("<Select \n                      onChange={(e)", "<Select id='dist-type'\n                      onChange={(e)")

with open('components/PropertyEditor.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
