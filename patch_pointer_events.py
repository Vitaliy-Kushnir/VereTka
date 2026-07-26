with open("components/Canvas.tsx", "r") as f:
    text = f.read()

target = """                const finalStaticProps: any = {
                    ...staticProps,
                    strokeWidth: shape.strokeWidth, // Завжди використовуємо візуальну товщину
                    pointerEvents: (shape.type === 'line' || shape.type === 'pencil' || (shape.type === 'polyline' && !shape.isClosed)) ? 'stroke' : 'all',
                }"""

replacement = """                const finalStaticProps: any = {
                    ...staticProps,
                    strokeWidth: shape.strokeWidth, // Завжди використовуємо візуальну товщину
                    pointerEvents: lockedShapeIds.has(shape.id) || isHidden || isDisabled ? 'none' : ((shape.type === 'line' || shape.type === 'pencil' || (shape.type === 'polyline' && !shape.isClosed)) ? 'stroke' : 'all'),
                }"""

if target in text:
    text = text.replace(target, replacement)
else:
    print("TARGET NOT FOUND!")

with open("components/Canvas.tsx", "w") as f:
    f.write(text)
