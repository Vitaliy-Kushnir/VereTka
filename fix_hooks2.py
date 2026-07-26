import re

with open("App.tsx", "r") as f:
    text = f.read()

text = re.sub(r"  useEffect\(\(\) => \{\n\s*const handleFlip = useCallback", "  const handleFlip = useCallback", text)
text = re.sub(r"      \}\);\n  \}, \[selectedShapeIds\]\);\n\s*const handleKeyDown", "      });\n  }, [selectedShapeIds]);\n\n  useEffect(() => {\n    const handleKeyDown", text)

with open("App.tsx", "w") as f:
    f.write(text)
