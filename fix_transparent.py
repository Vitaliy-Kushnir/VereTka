import re

with open('components/SelectionControls.tsx', 'r') as f:
    content = f.read()

content = content.replace('fill="transparent"', 'fill="rgba(0,0,0,0)"')

with open('components/SelectionControls.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
