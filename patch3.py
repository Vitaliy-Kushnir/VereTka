with open("components/Canvas.tsx", "r") as f:
    text = f.read()

text = text.replace("selectedShapes.filter(s => s.state !== 'hidden').map((shape)", "selectedShapes.map((shape)")

with open("components/Canvas.tsx", "w") as f:
    f.write(text)
