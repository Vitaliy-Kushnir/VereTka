import re

with open('components/SelectionControls.tsx', 'r') as f:
    content = f.read()

content = content.replace('fill="transparent"', 'fill="transparent" style={{ pointerEvents: "all" }}')

with open('components/SelectionControls.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
