const fs = require('fs');
let code = fs.readFileSync('components/InlineTextEditor.tsx', 'utf8');

const newCode = `import React, { useRef, useEffect, useState, useMemo } from 'react';
import { TextShape, ViewTransform } from '../types';
import { getTextBoundingBox, rotatePoint } from '../lib/geometry';
import { getVisualFontFamily } from '../lib/constants';

interface InlineTextEditorProps {
  shape: TextShape;
  viewTransform: ViewTransform;
  onUpdateText: (newText: string) => void;
  onStopEditing: () => void;
  canvasOffset: { left: number, top: number };
}

const InlineTextEditor: React.FC<InlineTextEditorProps> = ({ shape, viewTransform, onUpdateText, onStopEditing }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [initialText] = useState(shape.text);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      textarea.select();
      
      // Auto-resize textarea height to fit content
      textarea.style.height = 'auto';
      textarea.style.height = \`\${textarea.scrollHeight}px\`;
    }
  }, []);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdateText(e.target.value);
      // Auto-resize on text change
      e.target.style.height = 'auto';
      e.target.style.height = \`\${e.target.scrollHeight}px\`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      onUpdateText(initialText); // Revert to initial text
      onStopEditing();
    }
  };

  const handleBlur = () => {
    onStopEditing();
  };
  
  // 1. We need the bounding box of the unrotated shape to determine its dimensions
  const bbox = useMemo(() => getTextBoundingBox({ ...shape, rotation: 0 }), [shape]);
  
  if (!bbox) return null;

  const { scale, x: viewX, y: viewY } = viewTransform;

  // 1.5 The anchor point is shape.x, shape.y, which is what the shape rotates around.
  const center = { x: shape.x, y: shape.y };

  // HTML textareas with line-height vertically center the text in the line-box.
  // For line-height 1.2, there is a top gap of approximately (1.2 - 1) / 2 = 0.1 em.
  // We need to shift the textarea UP by this amount so its text aligns with the SVG text 
  // (which is rendered at exactly bbox.y due to dominantBaseline="hanging").
  const topGap = shape.fontSize * 0.1;
  const leftGap = 1; // Slight left adjustment if needed, usually 0 or 1px

  // 2. Determine unrotated visual top-left
  const unrotatedTopLeft = { x: bbox.x - leftGap, y: bbox.y - topGap };

  // 3. Rotate the top-left point by the shape's rotation angle
  const rotatedTopLeft = rotatePoint(unrotatedTopLeft, center, shape.rotation);

  // 4. Calculate the final on-screen position
  const left = rotatedTopLeft.x * scale + viewX;
  const top = rotatedTopLeft.y * scale + viewY;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: \`\${left}px\`,
    top: \`\${top}px\`,
    width: \`\${(bbox.width + leftGap * 2) * scale}px\`,
    height: \`\${Math.max(bbox.height * scale, shape.fontSize * 1.2 * scale)}px\`,
    padding: 0,
    margin: 0,
    border: 'none',
    outline: '1px dashed var(--selection-stroke)',
    overflow: 'hidden',
    resize: 'none',
    backgroundColor: 'transparent',
    color: shape.fill,
    lineHeight: 1.2,
    fontFamily: getVisualFontFamily(shape.font),
    fontSize: \`\${shape.fontSize * scale}px\`,
    fontWeight: shape.weight,
    fontStyle: shape.slant === 'italic' ? 'italic' : 'normal',
    textAlign: shape.justify,
    // The textarea itself is now positioned correctly, so we just rotate it around its top-left corner.
    transform: \`rotate(\${-shape.rotation}deg)\`,
    transformOrigin: \`0 0\`,
    whiteSpace: 'pre-wrap',
    cursor: 'text',
    zIndex: 10,
  };

  return (
    <textarea
      ref={textareaRef}
      value={shape.text}
      onChange={handleTextChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={style}
      className="allow-selection"
    />
  );
};

export default InlineTextEditor;
`;

fs.writeFileSync('components/InlineTextEditor.tsx', newCode);
console.log("Replaced InlineTextEditor.tsx");
