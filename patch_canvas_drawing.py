with open("components/Canvas.tsx", "r") as f:
    text = f.read()

target = """    if (activeTool === 'select') {
        if (clickedShape && clickedShape.state !== 'disabled') {"""

replacement = """    if (activeTool === 'select') {
        if (clickedShape && clickedShape.state !== 'disabled' && clickedShape.state !== 'hidden') {"""
text = text.replace(target, replacement)

target2 = """        return;
    }

    onSelectShape(null);
    const id = new Date().toISOString();"""

replacement2 = """        return;
    }
    
    if (activeTool !== 'edit-points' && activeTool !== 'pan') {
        if (props.onDrawingAttempt && !props.onDrawingAttempt()) {
            return;
        }
    }

    onSelectShape(null);
    const id = new Date().toISOString();"""

text = text.replace(target2, replacement2)

target3 = """interface CanvasProps {
  width: number;"""

replacement3 = """interface CanvasProps {
  onDrawingAttempt?: () => boolean;
  width: number;"""

text = text.replace(target3, replacement3)

with open("components/Canvas.tsx", "w") as f:
    f.write(text)
