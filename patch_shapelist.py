import re

with open('components/ShapeList.tsx', 'r') as f:
    content = f.read()

# Add useLayoutEffect import
content = content.replace("import React, { useState, useRef, useEffect } from 'react';", "import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';")

# Add scrollFix state
target_state = "const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(false);"
replacement_state = """const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(false);
    const [scrollFix, setScrollFix] = useState<{ id: string, clientY: number } | null>(null);

    useLayoutEffect(() => {
        if (scrollFix && listContainerRef.current) {
            const item = itemRefs.current[scrollFix.id];
            if (item) {
                const currentY = item.getBoundingClientRect().top;
                const diff = currentY - scrollFix.clientY;
                if (diff !== 0) {
                    listContainerRef.current.scrollTop += diff;
                }
            }
            setScrollFix(null);
        }
    }, [shapes, scrollFix]);

    const handleMoveShape = (e: React.MouseEvent, id: string, direction: 'up' | 'down') => {
        e.stopPropagation();
        if (listContainerRef.current) {
            const item = itemRefs.current[id];
            if (item) {
                setScrollFix({ id, clientY: item.getBoundingClientRect().top });
            }
        }
        onMoveShape(id, direction);
    };"""
content = content.replace(target_state, replacement_state)

# Replace onMoveShape calls
content = content.replace("onClick={(e) => { e.stopPropagation(); onMoveShape(shape.id, 'up'); }}", "onClick={(e) => handleMoveShape(e, shape.id, 'up')}")
content = content.replace("onClick={(e) => { e.stopPropagation(); onMoveShape(shape.id, 'down'); }}", "onClick={(e) => handleMoveShape(e, shape.id, 'down')}")

with open('components/ShapeList.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
