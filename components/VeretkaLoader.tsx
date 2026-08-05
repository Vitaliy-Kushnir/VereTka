import React, { useMemo } from 'react';

const SHAPES = [
  "50,5 76.5,13.7 92.7,36.2 92.7,63.8 76.5,86.3 50,95 23.5,86.3 7.3,63.8 7.3,36.2 23.5,13.7", // 1. Circle
  "15,15 50,15 85,15 85,50 85,85 50,85 15,85 15,50 15,32.5 15,15", // 2. Square
  "50,10 63,36 76,63 90,90 50,90 10,90 24,63 37,36 50,10 50,10", // 3. Triangle
  "50,5 60,36 93,36 66,55 76,86 50,67 24,86 34,55 7,36 40,36", // 4. Star
  "50,5 72,21 93,36 85,61 76,86 50,86 24,86 16,61 7,36 29,21", // 5. Pentagon
  "50,10 70,10 90,45 90,45 70,80 50,80 30,80 10,45 10,45 30,10", // 6. Hexagon
  "50,10 67.5,30 85,50 67.5,70 50,90 32.5,70 15,50 32.5,30 50,10 50,10", // 7. Rhombus
  "30,20 50,20 70,20 77.5,50 85,80 50,80 15,80 22.5,50 30,20 30,20", // 8. Trapezoid
  "20,30 50,30 80,30 80,50 80,70 50,70 20,70 20,50 20,30 20,30", // 9. Rectangle
  "30,20 55,20 80,20 75,50 70,80 45,80 20,80 25,50 30,20 30,20", // 10. Parallelogram
  "50,25 70,27 85,35 90,50 85,65 70,73 50,75 30,73 15,65 10,50", // 11. Oval Horizontal
  "50,10 60,15 68,30 70,50 68,70 60,85 50,90 40,85 32,70 30,50", // 12. Oval Vertical
  "50,50 65,50 80,50 80,65 71,71 65,80 50,80 50,65 50,50 50,50", // 13. Sector
  "20,50 30,30 50,20 70,30 80,50 70,50 50,50 30,50 20,50 20,50", // 14. Chord
  "20,20 50,20 80,20 80,50 80,80 50,80 20,80 20,50 20,20 20,20"  // 15. Right Triangle
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
