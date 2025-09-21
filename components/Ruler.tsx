import React, { useMemo } from 'react';
import { ViewTransform } from '../types';

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  transform: ViewTransform;
  length: number;
  canvasSize: { width: number; height: number };
}

const RULER_THICKNESS = 24;

const getNiceInterval = (targetPixelGap: number, scale: number): number => {
    if (scale <= 0) return 100; // Safety check
    const targetInterval = targetPixelGap / scale;
    const exponent = Math.floor(Math.log10(targetInterval));
    const powerOf10 = Math.pow(10, exponent);
    const mantissa = targetInterval / powerOf10;

    let niceMantissa;
    if (mantissa < 1.5) niceMantissa = 1;
    else if (mantissa < 3.5) niceMantissa = 2;
    else if (mantissa < 7.5) niceMantissa = 5;
    else niceMantissa = 10;
    
    return niceMantissa * powerOf10;
};


const Ruler: React.FC<RulerProps> = ({ orientation, transform, length, canvasSize }) => {
  const isHorizontal = orientation === 'horizontal';
  const width = isHorizontal ? length : RULER_THICKNESS;
  const height = isHorizontal ? RULER_THICKNESS : length;

  const ticks = useMemo(() => {
    if (length <= 0) return [];
    
    const majorInterval = getNiceInterval(60, transform.scale);
    const minorInterval = getNiceInterval(15, transform.scale);

    const viewMin = isHorizontal ? -transform.x / transform.scale : -transform.y / transform.scale;
    const viewMax = viewMin + length / transform.scale;
    
    const tickData = [];
    
    const firstValue = Math.floor(viewMin / minorInterval) * minorInterval;

    // Safety break to prevent infinite loops on extreme zoom levels
    const MAX_TICKS = 2000;
    let tickCount = 0;

    for (let v = firstValue; v <= viewMax && tickCount < MAX_TICKS; v += minorInterval) {
        tickCount++;
        const canvasMax = isHorizontal ? canvasSize.width : canvasSize.height;
        if (v < 0 || v > canvasMax) {
            continue;
        }

        const position = v * transform.scale + (isHorizontal ? transform.x : transform.y);
        
        if (position < 0 || position > length) {
            continue;
        }

        const epsilon = minorInterval / 100; // Use a relative epsilon for float comparisons
        const isMajor = Math.abs(v % majorInterval) < epsilon;
        
        let tickHeight: number;
        let labelValue: string | null = null;

        if (isMajor) {
            tickHeight = RULER_THICKNESS;
            labelValue = (Math.round(v * 100) / 100).toString();
        } else {
             // Don't draw minor ticks if they are too close together
            if (minorInterval * transform.scale < 5) continue;
            tickHeight = RULER_THICKNESS * 0.3;
        }
        
        tickData.push({
            value: labelValue,
            position,
            tickHeight,
        });
    }
    return tickData;
  }, [length, transform, isHorizontal, canvasSize.width, canvasSize.height]);
  
  if (width <= 0 || height <= 0) return null;

  return (
    <svg width={width} height={height} className="bg-[var(--ruler-bg)]">
      <g>
        {ticks.map(({ value, position, tickHeight }, index) => (
          <React.Fragment key={`${orientation}-${position}-${index}`}>
            <line
              x1={isHorizontal ? position : RULER_THICKNESS - tickHeight}
              y1={isHorizontal ? RULER_THICKNESS - tickHeight : position}
              x2={isHorizontal ? position : RULER_THICKNESS}
              y2={isHorizontal ? RULER_THICKNESS : position}
              stroke="var(--ruler-tick)"
              strokeWidth={1}
            />
            {value !== null && (
              <text
                x={isHorizontal ? position + 4 : (RULER_THICKNESS / 2)}
                y={isHorizontal ? (RULER_THICKNESS / 2) : position + 4}
                fill="var(--ruler-text)"
                fontSize={10}
                textAnchor={isHorizontal ? "start" : "middle"}
                dominantBaseline="middle"
              >
                {value}
              </text>
            )}
          </React.Fragment>
        ))}
      </g>
    </svg>
  );
};

export default Ruler;