import React, { useMemo } from 'react';

// Sample polygon vertices into exactly N points along perimeter
function samplePolygon(vertices: [number, number][], totalPoints = 36): string {
  let totalLen = 0;
  const lengths: number[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const next = vertices[(i + 1) % vertices.length];
    const dx = next[0] - vertices[i][0];
    const dy = next[1] - vertices[i][1];
    const len = Math.hypot(dx, dy);
    lengths.push(len);
    totalLen += len;
  }
  const result: string[] = [];
  const step = totalLen / totalPoints;
  let currentVert = 0;
  let distInEdge = 0;
  
  for (let p = 0; p < totalPoints; p++) {
    const targetDist = p * step;
    while (distInEdge + lengths[currentVert] < targetDist && currentVert < vertices.length - 1) {
      distInEdge += lengths[currentVert];
      currentVert++;
    }
    const edgeLen = lengths[currentVert];
    const t = edgeLen > 0 ? Math.min(1, Math.max(0, (targetDist - distInEdge) / edgeLen)) : 0;
    const v1 = vertices[currentVert];
    const v2 = vertices[(currentVert + 1) % vertices.length];
    const x = v1[0] + (v2[0] - v1[0]) * t;
    const y = v1[1] + (v2[1] - v1[1]) * t;
    result.push(`${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`);
  }
  return result.join(' ');
}

const N = 36;

// 20 rich geometric shapes, every shape has EXACTLY 36 points
const SHAPES: string[] = [
  // 1. Circle
  Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return `${Math.round((50 + 40 * Math.cos(a)) * 10) / 10},${Math.round((50 + 40 * Math.sin(a)) * 10) / 10}`;
  }).join(' '),

  // 2. Square
  samplePolygon([[12, 12], [88, 12], [88, 88], [12, 88]], N),

  // 3. Triangle
  samplePolygon([[50, 10], [90, 85], [10, 85]], N),

  // 4. Star (5-pointed)
  samplePolygon(Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 42 : 18;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
  }), N),

  // 5. Star Sparkle (8-pointed)
  samplePolygon(Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 === 0 ? 42 : 14;
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
  }), N),

  // 6. Pentagon
  samplePolygon(Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return [50 + 40 * Math.cos(a), 50 + 40 * Math.sin(a)];
  }), N),

  // 7. Hexagon
  samplePolygon(Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return [50 + 40 * Math.cos(a), 50 + 40 * Math.sin(a)];
  }), N),

  // 8. Octagon
  samplePolygon(Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 8;
    return [50 + 40 * Math.cos(a), 50 + 40 * Math.sin(a)];
  }), N),

  // 9. Plus / Cross
  samplePolygon([
    [38, 12], [62, 12], [62, 38], [88, 38], [88, 62], [62, 62],
    [62, 88], [38, 88], [38, 62], [12, 62], [12, 38], [38, 38]
  ], N),

  // 10. Heart
  Array.from({ length: N }, (_, i) => {
    const t = (i / N) * Math.PI * 2;
    const x = 50 + 2.3 * (16 * Math.pow(Math.sin(t), 3));
    const y = 48 - 2.3 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
  }).join(' '),

  // 11. Flower Rosette (6 Petals)
  Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const r = 28 + 14 * Math.cos(6 * a);
    return `${Math.round((50 + r * Math.cos(a)) * 10) / 10},${Math.round((50 + r * Math.sin(a)) * 10) / 10}`;
  }).join(' '),

  // 12. Diamond / Rhombus
  samplePolygon([[50, 10], [90, 50], [50, 90], [10, 50]], N),

  // 13. Squircle / Superellipse
  Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const r = 40 / Math.pow(Math.pow(Math.abs(cosA), 4) + Math.pow(Math.abs(sinA), 4), 0.25);
    return `${Math.round((50 + r * cosA) * 10) / 10},${Math.round((50 + r * sinA) * 10) / 10}`;
  }).join(' '),

  // 14. Teardrop
  Array.from({ length: N }, (_, i) => {
    const t = (i / N) * Math.PI * 2 - Math.PI / 2;
    const x = 50 + 38 * Math.sin(t) * Math.pow(Math.sin(t / 2), 2);
    const y = 52 - 38 * Math.cos(t);
    return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
  }).join(' '),

  // 15. Gear / Cogwheel
  Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const cog = Math.sin(6 * a) > 0 ? 40 : 26;
    return `${Math.round((50 + cog * Math.cos(a)) * 10) / 10},${Math.round((50 + cog * Math.sin(a)) * 10) / 10}`;
  }).join(' '),

  // 16. Shield
  samplePolygon([
    [20, 15], [80, 15], [85, 45], [50, 90], [15, 45]
  ], N),

  // 17. Crescent Moon
  samplePolygon([
    [50, 10], [68, 18], [82, 38], [82, 62], [68, 82], [50, 90],
    [62, 72], [68, 50], [62, 28]
  ], N),

  // 18. Capsule / Oval
  Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    return `${Math.round((50 + 42 * Math.cos(a)) * 10) / 10},${Math.round((50 + 24 * Math.sin(a)) * 10) / 10}`;
  }).join(' '),

  // 19. Infinity / Lemniscate
  Array.from({ length: N }, (_, i) => {
    const t = (i / N) * Math.PI * 2;
    const scale = 38 / (1 + Math.sin(t) * Math.sin(t));
    const x = 50 + scale * Math.cos(t);
    const y = 50 + scale * Math.sin(t) * Math.cos(t);
    return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
  }).join(' '),

  // 20. Trapezoid
  samplePolygon([[30, 15], [70, 15], [90, 85], [10, 85]], N)
];

export interface VeretkaLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | string;
}

export const VeretkaLoader: React.FC<VeretkaLoaderProps> = ({ className, size }) => {
  let sizeClass = className;
  if (!sizeClass) {
    if (size === 'sm') sizeClass = 'w-6 h-6';
    else if (size === 'md') sizeClass = 'w-12 h-12';
    else if (size === 'lg') sizeClass = 'w-24 h-24';
    else sizeClass = 'w-16 h-16';
  }

  const { values, keyTimes, keySplines } = useMemo(() => {
    const sequence: string[] = [];
    const times: string[] = [];
    const splines: string[] = [];
    
    // Choose a random starting shape
    const firstShapeIndex = Math.floor(Math.random() * SHAPES.length);
    const firstShape = SHAPES[firstShapeIndex];
    let currentShape = firstShape;
    let lastIndex = firstShapeIndex;
    
    // 20 transitions to make it look highly dynamic
    const numTransitions = 20;
    const totalSegments = numTransitions + 1;
    
    let currentTime = 0;
    const timePerCycle = 1 / totalSegments;
    const holdRatio = 0.25; 
    const morphRatio = 0.75; 
    
    sequence.push(currentShape);
    times.push(currentTime.toFixed(4));
    
    for (let i = 0; i < numTransitions; i++) {
      let nextIndex: number;
      do {
        nextIndex = Math.floor(Math.random() * SHAPES.length);
      } while (nextIndex === lastIndex);
      
      const nextShape = SHAPES[nextIndex];
      lastIndex = nextIndex;
      
      // Hold state
      currentTime += timePerCycle * holdRatio;
      sequence.push(currentShape);
      times.push(currentTime.toFixed(4));
      splines.push("0.25 0.1 0.25 1"); 
      
      // Morph state
      currentTime += timePerCycle * morphRatio;
      sequence.push(nextShape);
      times.push(currentTime.toFixed(4));
      splines.push("0.4 0 0.2 1"); 
      
      currentShape = nextShape;
    }
    
    // Final cycle back to the first shape to loop seamlessly
    currentTime += timePerCycle * holdRatio;
    sequence.push(currentShape);
    times.push(currentTime.toFixed(4));
    splines.push("0.25 0.1 0.25 1");
    
    currentTime += timePerCycle * morphRatio;
    sequence.push(firstShape);
    times.push("1.0000"); // Must end exactly at 1
    splines.push("0.4 0 0.2 1");

    return { 
      values: sequence.join(';'), 
      keyTimes: times.join(';'),
      keySplines: splines.join(';')
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeClass}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="morph-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="morph-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        
        {/* Glow effect */}
        <polygon 
          fill="none" 
          stroke="url(#morph-glow)" 
          strokeWidth="6" 
          strokeLinejoin="round"
          className="blur-sm"
        >
          <animate
            attributeName="points"
            dur="8s"
            repeatCount="indefinite"
            calcMode="spline"
            values={values}
            keyTimes={keyTimes}
            keySplines={keySplines}
          />
        </polygon>

        {/* Main shape */}
        <polygon 
          fill="none" 
          stroke="url(#morph-gradient)" 
          strokeWidth="2.5" 
          strokeLinejoin="round" 
        >
          <animate
            attributeName="points"
            dur="8s"
            repeatCount="indefinite"
            calcMode="spline"
            values={values}
            keyTimes={keyTimes}
            keySplines={keySplines}
          />
        </polygon>
      </svg>
    </div>
  );
};

