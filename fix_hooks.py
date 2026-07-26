import re

with open("App.tsx", "r") as f:
    text = f.read()

# Replace:
#   useEffect(() => {
#     const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {
# with:
#   const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {

# And replace:
#   }, [selectedShapeIds]);
#   const handleKeyDown = (e: KeyboardEvent) => {
# with:
#   }, [selectedShapeIds]);
#
#   useEffect(() => {
#     const handleKeyDown = (e: KeyboardEvent) => {

s1 = """  useEffect(() => {
    const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {"""
r1 = """  const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {"""

s2 = """      });
  }, [selectedShapeIds]);

  const handleKeyDown = (e: KeyboardEvent) => {"""
r2 = """      });
  }, [selectedShapeIds, setShapes, getVisualBoundingBox]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {"""

if s1 in text:
    text = text.replace(s1, r1)
else:
    # Try another matching
    s1_alt = """  useEffect(() => {\n  const handleFlip"""
    if s1_alt in text:
        text = text.replace(s1_alt, """  const handleFlip""")

if s2 in text:
    text = text.replace(s2, r2)
else:
    s2_alt = """      });\n  }, [selectedShapeIds]);\n\n  const handleKeyDown = (e: KeyboardEvent) => {"""
    if s2_alt in text:
        text = text.replace(s2_alt, r2)

with open("App.tsx", "w") as f:
    f.write(text)

