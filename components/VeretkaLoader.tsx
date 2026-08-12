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

// 34 rich geometric shapes, every shape has EXACTLY 36 points
export const SHAPES: string[] = [
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
  samplePolygon([[30, 15], [70, 15], [90, 85], [10, 85]], N),

  // 21. Butterfly / Hourglass (Figure-8)
  Array.from({ length: N }, (_, i) => {
    const t = (i / N) * Math.PI * 2;
    const x = 50 + 36 * Math.sin(t);
    const y = 50 + 36 * Math.sin(2 * t);
    return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
  }).join(' '),

  // 22. Astroid (4-Cusp Star)
  Array.from({ length: N }, (_, i) => {
    const t = (i / N) * Math.PI * 2;
    const x = 50 + 38 * Math.pow(Math.cos(t), 3);
    const y = 50 + 38 * Math.pow(Math.sin(t), 3);
    return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
  }).join(' '),

  // 23. Sunflower (8 Petals)
  Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const r = 26 + 13 * Math.cos(8 * a);
    return `${Math.round((50 + r * Math.cos(a)) * 10) / 10},${Math.round((50 + r * Math.sin(a)) * 10) / 10}`;
  }).join(' '),

  // 24. Chevron Arrowhead
  samplePolygon([[50, 10], [88, 48], [68, 48], [68, 88], [32, 88], [32, 48], [12, 48]], N),

  // 25. Lightning Spark
  samplePolygon([[55, 10], [22, 50], [46, 50], [38, 88], [78, 45], [54, 45]], N),

  // 26. Organic Blob / Amoeba
  Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const r = 30 + 8 * Math.sin(3 * a) + 5 * Math.cos(5 * a);
    return `${Math.round((50 + r * Math.cos(a)) * 10) / 10},${Math.round((50 + r * Math.sin(a)) * 10) / 10}`;
  }).join(' '),

  // 27. Royal Crown
  samplePolygon([[15, 82], [85, 82], [88, 30], [68, 55], [50, 18], [32, 55], [12, 30]], N),

  // 28. Hexagram (12-pointed Star of David)
  samplePolygon(Array.from({ length: 12 }, (_, i) => {
    const r = i % 2 === 0 ? 40 : 22;
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
  }), N),

  // 29. Reuleaux Triangle
  Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const r = 32 + 8 * Math.cos(3 * a);
    return `${Math.round((50 + r * Math.cos(a)) * 10) / 10},${Math.round((50 + r * Math.sin(a)) * 10) / 10}`;
  }).join(' '),

  // 30. Trefoil Clover (3 Petals)
  Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const r = 26 + 14 * Math.sin(3 * a);
    return `${Math.round((50 + r * Math.cos(a)) * 10) / 10},${Math.round((50 + r * Math.sin(a)) * 10) / 10}`;
  }).join(' '),

  // 31. Flame / Drop Badge
  samplePolygon([[50, 10], [68, 28], [85, 48], [82, 75], [50, 90], [18, 75], [15, 48], [32, 28]], N),

  // 32. Deltoid (3-Cusp Hypocycloid)
  Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const x = 50 + 13 * (2 * Math.cos(a) + Math.cos(2 * a));
    const y = 50 + 13 * (2 * Math.sin(a) - Math.sin(2 * a));
    return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
  }).join(' '),

  // 33. Fish / Wave Loop
  Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const x = 50 + 38 * Math.cos(a);
    const y = 50 + 30 * Math.sin(2 * a);
    return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
  }).join(' '),

  // 34. Octagram Diamond
  samplePolygon([[50, 10], [78, 22], [90, 50], [78, 78], [50, 90], [22, 78], [10, 50], [22, 22]], N)
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

export interface ShapeInfo {
  id: number;
  nameUk: string;
  nameEn: string;
  pointsString: string;
}

export const SHAPE_INFOS: ShapeInfo[] = [
  { id: 1, nameUk: 'Коло', nameEn: 'Circle', pointsString: SHAPES[0] },
  { id: 2, nameUk: 'Квадрат', nameEn: 'Square', pointsString: SHAPES[1] },
  { id: 3, nameUk: 'Трикутник', nameEn: 'Triangle', pointsString: SHAPES[2] },
  { id: 4, nameUk: '5-променева зірка', nameEn: '5-Point Star', pointsString: SHAPES[3] },
  { id: 5, nameUk: '8-променевий спалах', nameEn: '8-Point Sparkle', pointsString: SHAPES[4] },
  { id: 6, nameUk: 'П\'ятикутник', nameEn: 'Pentagon', pointsString: SHAPES[5] },
  { id: 7, nameUk: 'Шестикутник', nameEn: 'Hexagon', pointsString: SHAPES[6] },
  { id: 8, nameUk: 'Восьмикутник', nameEn: 'Octagon', pointsString: SHAPES[7] },
  { id: 9, nameUk: 'Хрест / Плюс', nameEn: 'Plus Cross', pointsString: SHAPES[8] },
  { id: 10, nameUk: 'Серце', nameEn: 'Heart', pointsString: SHAPES[9] },
  { id: 11, nameUk: 'Квіткова розетка (6 пелюсток)', nameEn: '6-Petal Rosette', pointsString: SHAPES[10] },
  { id: 12, nameUk: 'Ромб / Алмаз', nameEn: 'Diamond Rhombus', pointsString: SHAPES[11] },
  { id: 13, nameUk: 'Сквіркл / Супереліпс', nameEn: 'Squircle Superellipse', pointsString: SHAPES[12] },
  { id: 14, nameUk: 'Крапля', nameEn: 'Teardrop', pointsString: SHAPES[13] },
  { id: 15, nameUk: 'Шестерня', nameEn: 'Gear Cogwheel', pointsString: SHAPES[14] },
  { id: 16, nameUk: 'Захисний щит', nameEn: 'Protection Shield', pointsString: SHAPES[15] },
  { id: 17, nameUk: 'Півмісяць', nameEn: 'Crescent Moon', pointsString: SHAPES[16] },
  { id: 18, nameUk: 'Капсула / Пігулка', nameEn: 'Capsule Pill', pointsString: SHAPES[17] },
  { id: 19, nameUk: 'Лемніската / Нескінченність', nameEn: 'Infinity Lemniscate', pointsString: SHAPES[18] },
  { id: 20, nameUk: 'Трапеція', nameEn: 'Trapezoid', pointsString: SHAPES[19] },
  { id: 21, nameUk: 'Метелик / Пісочний годинник', nameEn: 'Butterfly Hourglass', pointsString: SHAPES[20] },
  { id: 22, nameUk: 'Астроїда (4-вершинна зірка)', nameEn: 'Astroid 4-Cusp', pointsString: SHAPES[21] },
  { id: 23, nameUk: 'Соняшник (8 пелюсток)', nameEn: '8-Petal Sunflower', pointsString: SHAPES[22] },
  { id: 24, nameUk: 'Стрілка-шеврон', nameEn: 'Chevron Arrowhead', pointsString: SHAPES[23] },
  { id: 25, nameUk: 'Блискавка / Спалах', nameEn: 'Lightning Spark', pointsString: SHAPES[24] },
  { id: 26, nameUk: 'Органічна амеба', nameEn: 'Organic Amoeba', pointsString: SHAPES[25] },
  { id: 27, nameUk: 'Королівська корона', nameEn: 'Royal Crown', pointsString: SHAPES[26] },
  { id: 28, nameUk: 'Гексаграма (Зірка Давида)', nameEn: 'Hexagram Star', pointsString: SHAPES[27] },
  { id: 29, nameUk: 'Трикутник Рело', nameEn: 'Reuleaux Triangle', pointsString: SHAPES[28] },
  { id: 30, nameUk: 'Трилисник (3 пелюстки)', nameEn: 'Trefoil Clover', pointsString: SHAPES[29] },
  { id: 31, nameUk: 'Полум\'я / Символ', nameEn: 'Flame Badge', pointsString: SHAPES[30] },
  { id: 32, nameUk: 'Дельтоїда', nameEn: 'Deltoid 3-Cusp', pointsString: SHAPES[31] },
  { id: 33, nameUk: 'Хвильова петля / Рибка', nameEn: 'Wave Loop', pointsString: SHAPES[32] },
  { id: 34, nameUk: 'Октаграма-алмаз', nameEn: 'Octagram Diamond', pointsString: SHAPES[33] },
];

