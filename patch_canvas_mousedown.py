with open("components/Canvas.tsx", "r") as f:
    text = f.read()

target = """    if (e.button !== 0) return;
    
    const targetElement = e.target as SVGElement;
    // Important: Check if the click is on a resize/rotate handle *first*.
    if (targetElement.closest('[data-handle="true"]')) {
      // The logic for this is handled by the onMouseDown in SelectionControls
      return;
    }

    if (isDrawingBezier) {"""

replacement = """    if (e.button !== 0) return;
    
    if (activeTool !== 'select' && activeTool !== 'edit-points' && activeTool !== 'pan') {
        if (props.onDrawingAttempt && !props.onDrawingAttempt()) {
            return;
        }
    }
    
    const targetElement = e.target as SVGElement;
    // Important: Check if the click is on a resize/rotate handle *first*.
    if (targetElement.closest('[data-handle="true"]')) {
      // The logic for this is handled by the onMouseDown in SelectionControls
      return;
    }

    if (isDrawingBezier) {"""

if target in text:
    text = text.replace(target, replacement)
else:
    print("TARGET 1 NOT FOUND")

# Remove the old check
old_check = """    if (activeTool !== 'edit-points' && activeTool !== 'pan') {
        if (props.onDrawingAttempt && !props.onDrawingAttempt()) {
            return;
        }
    }

    onSelectShape(null);"""
if old_check in text:
    text = text.replace(old_check, "    onSelectShape(null);")
else:
    print("OLD CHECK NOT FOUND")

with open("components/Canvas.tsx", "w") as f:
    f.write(text)
