with open("components/Canvas.tsx", "r") as f:
    text = f.read()

target = "             {!props.distributePathState && selectedShapes.map((shape) => ("
replacement = "             {!props.distributePathState && selectedShapes.filter(s => s.state !== 'hidden').map((shape) => ("

text = text.replace(target, replacement)

with open("components/Canvas.tsx", "w") as f:
    f.write(text)
