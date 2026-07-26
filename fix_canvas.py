import re

with open('components/Canvas.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace onTouchStart={(e) => { ... getPointerPosition(e) ... }} with getPointerPosition(e.touches[0])
code = re.sub(r'(onTouchStart=\{\(e\) => \{.*?getPointerPosition\()e(\).*?\})', r'\1e.touches[0]\2', code, flags=re.DOTALL)

with open('components/Canvas.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
