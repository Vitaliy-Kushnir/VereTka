with open("App.tsx", "r") as f:
    text = f.read()

target = """    if (Array.isArray(id)) {
        setSelectedShapeIds(id);
        if (id.length > 0) lastSelectedShapeIdRef.current = id[id.length - 1];
        return;
    }"""

replacement = """    if (Array.isArray(id)) {
        if (isCtrlPressed) {
            setSelectedShapeIds((prev: string[]) => Array.from(new Set([...prev, ...id])));
        } else {
            setSelectedShapeIds(id);
        }
        if (id.length > 0) lastSelectedShapeIdRef.current = id[id.length - 1];
        return;
    }"""

text = text.replace(target, replacement)

with open("App.tsx", "w") as f:
    f.write(text)
