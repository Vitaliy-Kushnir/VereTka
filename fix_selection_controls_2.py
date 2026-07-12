import re

with open('components/SelectionControls.tsx', 'r') as f:
    content = f.read()

# remove all pointerEvents: 'none' inside style={{...}} for rect, circle, line if they are handles.
content = re.sub(r'style=\{\{\s*pointerEvents:\s*[\'"]none[\'"]\s*\}\}', '', content)

with open('components/SelectionControls.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
