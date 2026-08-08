import React, { useMemo } from 'react';

const SHAPES = [
  "50,5 76.5,13.7 92.7,36.2 92.7,63.8 76.5,86.3 50,95 23.5,86.3 7.3,63.8 7.3,36.2 23.5,13.7", // 1. Circle
  "15,15 50,15 85,15 85,50 85,85 50,85 15,85 15,50 15,32.5 15,15", // 2. Square
  "50,10 63,32.5 76,55 89,77.5 50,77.5 11,77.5 24,55 37,32.5 50,10 50,10", // 3. Triangle
  "50,5 61.8,38.2 95,38.2 68.2,57.6 78.4,90.5 50,70 21.6,90.5 31.8,57.6 5,38.2 38.2,38.2", // 4. Star
  "50,8 75.3,26.4 91,50 81.6,79.6 50,85 18.4,79.6 9,50 24.7,26.4 50,8 50,8", // 5. Pentagon
  "50,8 70,8 87,45 87,55 70,92 50,92 30,92 13,55 13,45 30,8", // 6. Hexagon
  "35,10 65,10 90,35 90,65 65,90 35,90 10,65 10,35 35,10 35,10", // 7. Octagon
  "38,12 62,12 62,38 88,38 88,62 62,62 62,88 38,88 38,62 12,62", // 8. Plus / Cross
  "50,10 75,20 90,50 75,80 50,90 62,75 70,50 62,25 50,10 50,10", // 9. Crescent Moon
  "25,20 50,20 75,20 80,50 85,80 50,80 15,80 20,50 25,20 25,20", // 10. Trapezoid
  "50,20 70,23 88,33 92,50 88,67 70,77 50,80 30,77 12,67 8,50", // 11. Oval Horizontal
  "50,10 67.5,30 85,50 67.5,70 50,90 32.5,70 15,50 32.5,30 50,10 50,10", // 12. Rhombus
  "15,25 50,25 85,25 85,50 85,75 50,75 15,75 15,50 15,37.5 15,25", // 13. Rectangle
  "50,32 68,15 85,25 90,50 72,70 50,90 28,70 10,50 15,25 32,15"  // 14. Heart
];

export const VeretkaLoader: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => {
  const { values, keyTimes, keySplines } = useMemo(() => {
    const sequence: string[] = [];
    const times: string[] = [];
    const splines: string[] = [];
    
    // Choose a random starting shape
    const firstShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    let currentShape = firstShape;
    
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
      let nextShape;
      do {
        nextShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      } while (nextShape === currentShape);
      
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
    <div className={`relative flex items-center justify-center ${className}`}>
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
