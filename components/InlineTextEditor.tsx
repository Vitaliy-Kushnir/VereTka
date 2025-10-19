import React, { useRef, useEffect, useState, useMemo } from 'react';
import { TextShape, ViewTransform } from '../types';
import { getTextBoundingBox } from '../lib/geometry';
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
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdateText(e.target.value);
      // Auto-resize on text change
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
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
  // and the relative position of the anchor point.
  const bbox = useMemo(() => getTextBoundingBox({ ...shape, rotation: 0 }), [shape]);
  
  if (!bbox) return null;

  const { scale, x: viewX, y: viewY } = viewTransform;
  
  // 2. Calculate the vector from the anchor point (shape.x, shape.y) to the visual top-left (bbox.x, bbox.y).
  const vecAnchorToTopLeft = {
      x: bbox.x - shape.x,
      y: bbox.y - shape.y,
  };

  // 3. Rotate this vector by the shape's rotation angle. This tells us where the
  // final top-left corner of the textarea should be relative to the final anchor point.
  const angleRad = (shape.rotation * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  const rotatedVec = {
      x: vecAnchorToTopLeft.x * cos - vecAnchorToTopLeft.y * sin,
      y: vecAnchorToTopLeft.x * sin + vecAnchorToTopLeft.y * cos,
  };

  // 4. Calculate the final on-screen position of the anchor point.
  const anchorScreen = {
      x: shape.x * scale + viewX,
      y: shape.y * scale + viewY,
  };
  
  // 5. The final top-left of the textarea is the anchor's screen position plus the rotated vector.
  const left = anchorScreen.x + rotatedVec.x * scale;
  const top = anchorScreen.y + rotatedVec.y * scale;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: `${bbox.width * scale}px`,
    height: `${Math.max(bbox.height * scale, shape.fontSize * 1.2 * scale)}px`,
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
    fontSize: `${shape.fontSize * scale}px`,
    fontWeight: shape.weight,
    fontStyle: shape.slant === 'italic' ? 'italic' : 'normal',
    textAlign: shape.justify,
    // The textarea itself is now positioned correctly, so we just rotate it around its top-left corner.
    transform: `rotate(${-shape.rotation}deg)`,
    transformOrigin: `0 0`,
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
