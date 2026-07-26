with open("components/Canvas.tsx", "r") as f:
    text = f.read()

target = """        return;
    }
    
    onSelectShape(null);"""

replacement = """        return;
    }
    
    if (activeTool !== 'edit-points' && activeTool !== 'pan') {
        if (props.onDrawingAttempt && !props.onDrawingAttempt()) {
            return;
        }
    }

    onSelectShape(null);"""

if target in text:
    text = text.replace(target, replacement)
else:
    print("TARGET NOT FOUND! 1")

with open("components/Canvas.tsx", "w") as f:
    f.write(text)
