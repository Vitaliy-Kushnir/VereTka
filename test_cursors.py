import re

with open('components/SelectionControls.tsx', 'r') as f:
    content = f.read()

# Replace all cursor logic in SelectionControls to directly apply to the rect/circle
content = content.replace('style={{ pointerEvents: "all" }}', '')

with open('components/SelectionControls.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
