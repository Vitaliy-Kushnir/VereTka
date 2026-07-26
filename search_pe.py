import re
with open('components/PropertyEditor.tsx', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'Зсув' in line or 'Симетрична' in line or 'label=' in line:
            print(f"{i+1}: {line.strip()}")
