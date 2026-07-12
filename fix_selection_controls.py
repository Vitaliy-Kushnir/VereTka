import re

with open('components/SelectionControls.tsx', 'r') as f:
    content = f.read()

# 1. Remove pointerEvents: 'none' from visible handles
content = re.sub(r'style=\{\{\s*pointerEvents:\s*\'none\'\s*\}\}\s*(/>|>)', r'\1', content)

# 2. Change invisible handles to be painted but invisible
content = content.replace('fill="rgba(0,0,0,0)" style={{ pointerEvents: "all",', 'fill="#ffffff" fillOpacity={0.01} style={{ ')

with open('components/SelectionControls.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
