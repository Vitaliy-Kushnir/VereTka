import re

with open('components/SelectionControls.tsx', 'r') as f:
    content = f.read()

# Make sure all transparent hit areas have the cursor and pointerEvents explicit
content = re.sub(r'style=\{\{ cursor: action \? \'inherit\' : `\$\{cursor\}` \}\}', '', content)
content = re.sub(r'style=\{\{ cursor: action \? \'inherit\' : (.*?) \}\}', '', content)

content = content.replace('fill="transparent"', 'fill="transparent" style={{ pointerEvents: "all", cursor: action ? "inherit" : cursor }}')

with open('components/SelectionControls.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
