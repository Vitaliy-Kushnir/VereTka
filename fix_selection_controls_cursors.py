import re

with open('components/SelectionControls.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'data-handle="true"\s*>', r'data-handle="true" style={{ cursor: action ? "inherit" : `${cursor}` }}>', content)

# For line-start and line-end:
content = re.sub(r'(data-handle="true" style=\{\{\s*cursor:\s*action\s*\?\s*"inherit"\s*:\s*)"default"', r'\1"grab"', content)

with open('components/SelectionControls.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
