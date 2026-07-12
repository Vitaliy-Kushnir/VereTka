import re

with open('components/SelectionControls.tsx', 'r') as f:
    content = f.read()

# For point handles:
content = re.sub(
    r'(<g key=\{`point-\$\{index\}`\} .*? data-handle="true" style=\{\{\s*cursor:\s*action\s*\?\s*"inherit"\s*:\s*"grab"\s*\}\}>.*?<circle\s*cx=\{p\.x\}\s*cy=\{p\.y\}\s*r=\{scaledTouchHandleSize / 2\}\s*fill="transparent"\s*style=\{\{) pointerEvents: "all"(\}\})',
    r'\1 pointerEvents: "all", cursor: action ? "inherit" : "grab" \2',
    content, flags=re.DOTALL
)

# For line-start handle:
content = re.sub(
    r'(<g onMouseDown=\{\(e\) => handleLineResizeDown\(e, \'line-start\'\)\}.*?data-handle="true" style=\{\{\s*cursor:\s*action\s*\?\s*"inherit"\s*:\s*"grab"\s*\}\}>.*?<circle cx=\{rotatedStart\.x\} cy=\{rotatedStart\.y\} r=\{scaledTouchHandleSize / 2\} fill="transparent" style=\{\{) pointerEvents: "all"(\}\})',
    r'\1 pointerEvents: "all", cursor: action ? "inherit" : "grab" \2',
    content, flags=re.DOTALL
)

# For line-end handle:
content = re.sub(
    r'(<g onMouseDown=\{\(e\) => handleLineResizeDown\(e, \'line-end\'\)\}.*?data-handle="true" style=\{\{\s*cursor:\s*action\s*\?\s*"inherit"\s*:\s*"grab"\s*\}\}>.*?<circle cx=\{rotatedEnd\.x\} cy=\{rotatedEnd\.y\} r=\{scaledTouchHandleSize / 2\} fill="transparent" style=\{\{) pointerEvents: "all"(\}\})',
    r'\1 pointerEvents: "all", cursor: action ? "inherit" : "grab" \2',
    content, flags=re.DOTALL
)

# For rotation handles:
content = re.sub(
    r'(<g onMouseDown=\{handleRotateDown\} onTouchStart=\{handleRotateDown\} data-handle="true" style=\{\{\s*cursor:\s*action\s*\?\s*"inherit"\s*:\s*ROTATE_CURSOR_STYLE\s*\}\}>.*?<circle cx=\{rotationHandlePos\.x\} cy=\{rotationHandlePos\.y\} r=\{scaledTouchHandleSize / 2\} fill="transparent" style=\{\{) pointerEvents: "all"(\}\})',
    r'\1 pointerEvents: "all", cursor: action ? "inherit" : ROTATE_CURSOR_STYLE \2',
    content, flags=re.DOTALL
)

# For adjust handle:
content = re.sub(
    r'(<g onMouseDown=\{onMouseDown\} onTouchStart=\{onMouseDown\} data-handle="true" style=\{\{\s*cursor:\s*action\s*\?\s*"inherit"\s*:\s*ADJUST_CURSOR_STYLE\s*\}\}>.*?<circle\s*cx=\{pos\.x\}\s*cy=\{pos\.y\}\s*r=\{scaledTouchHandleSize / 2\}\s*fill="transparent"\s*style=\{\{) pointerEvents: "all"(\}\})',
    r'\1 pointerEvents: "all", cursor: action ? "inherit" : ADJUST_CURSOR_STYLE \2',
    content, flags=re.DOTALL
)

# For resize handles:
content = re.sub(
    r'(<g\s*key=\{name\}\s*onMouseDown=\{\(e\) => handleResizeDown\(e, name\)\}\s*onTouchStart=\{\(e\) => handleResizeDown\(e as any, name\)\}\s*data-handle="true" style=\{\{\s*cursor:\s*action\s*\?\s*"inherit"\s*:\s*`\$\{cursor\}`\s*\}\}>.*?<rect\s*x=\{rotatedPos\.x - scaledTouchHandleSize / 2\}\s*y=\{rotatedPos\.y - scaledTouchHandleSize / 2\}\s*width=\{scaledTouchHandleSize\}\s*height=\{scaledTouchHandleSize\}\s*fill="transparent" style=\{\{) pointerEvents: "all"(\}\})',
    r'\1 pointerEvents: "all", cursor: action ? "inherit" : cursor \2',
    content, flags=re.DOTALL
)

with open('components/SelectionControls.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
