import re

with open('components/SelectionControls.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'cursor:\s*action\s*\?\s*"inherit"\s*:\s*([^ }]+)', r'cursor: \1', content)
content = re.sub(r'cursor:\s*action\s*\?\s*"inherit"\s*:\s*`([^`]+)`', r'cursor: `\1`', content)
content = re.sub(r'cursor:\s*action\s*\?\s*"inherit"\s*:\s*"([^"]+)"', r'cursor: "\1"', content)

with open('components/SelectionControls.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
