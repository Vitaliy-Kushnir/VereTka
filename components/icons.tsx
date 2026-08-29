import React from 'react';

// Common Icon Props
interface IconProps {
    size?: number;
    className?: string;
}

export const SelectIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
        <path d="M13 13l6 6" />
    </svg>
);

export const LayersIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 12 12 17 22 12" />
        <polyline points="2 17 12 22 22 17" />
    </svg>
);

export const PaletteIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
);
export const SelectOffIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
        <path d="M13 13l6 6" />
        <line x1="5" y1="22" x2="19" y2="2" />
    </svg>
);

export const EditPointsIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Dashed path representing the original shape's corner */}
        <path d="M20 4H4v16" strokeDasharray="4 4" />
        
        {/* New solid path after editing */}
        <path d="M4 20L12 12L20 4v16H4" />
        
        {/* Nodes of the new shape */}
        <circle cx="20" cy="4" r="2" fill="currentColor" strokeWidth="0" />
        <circle cx="12" cy="12" r="2" fill="currentColor" strokeWidth="0" />
        <circle cx="4" cy="20" r="2" fill="currentColor" strokeWidth="0" />
        <circle cx="20" cy="20" r="2" fill="currentColor" strokeWidth="0" />
        
        {/* Hollow node indicating the original position of the moved node */}
        <circle cx="4" cy="4" r="2" fill="var(--bg-primary)" />
    </svg>
);


export const SquareIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" />
  </svg>
);

export const RectangleIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
    </svg>
  );

export const CircleIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export const EllipseIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="10" ry="7" />
    </svg>
);

export const CodeIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
    </svg>
);

export const XIcon: React.FC<IconProps> = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export const AxesIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Vertical Line */}
        <path d="M4 4v16" />
        {/* Horizontal Line */}
        <path d="M4 4h16" />
        {/* Y Arrow Head (filled) - Made larger */}
        <path d="M4 20l-4-5h8z" fill="currentColor" strokeWidth="0" />
        {/* X Arrow Head (filled) - Made larger */}
        <path d="M20 4l-5-4v8z" fill="currentColor" strokeWidth="0" />
    </svg>
);

export const FitToScreenIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14h-2v6h6v-2H4v-4zm16 0v4h-4v2h6v-6h-2zM4 10V4h6V2H2v8h2zm16-6v6h2V2h-8v2h6z"/>
    </svg>
);

export const LineIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="20" x2="20" y2="4" />
    </svg>
);

export const PolylineIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l5-7 7 11 5-4"/>
        <circle cx="3" cy="12" r="1.5"/>
        <circle cx="8" cy="5" r="1.5"/>
        <circle cx="15" cy="16" r="1.5"/>
        <circle cx="20" cy="12" r="1.5"/>
    </svg>
);

export const BezierIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 2 20.7 C 4 10, 8 9.4, 15 12.6 S 22 3.5, 22 3.5" fill="none" />
        <circle cx="2" cy="20.7" r="2.7" strokeWidth="0" fill="currentColor" />
        <circle cx="22" cy="3.5" r="2.7" strokeWidth="0" fill="currentColor" />
        <circle cx="8" cy="9.4" r="2.7" strokeWidth="0" fill="currentColor" />
        <circle cx="15" cy="12.6" r="2.7" strokeWidth="0" fill="currentColor" />
    </svg>
);

export const PolygonIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l10 7.5-4 12.5H6L2 9.5z"/>
    </svg>
);

export const PencilIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    </svg>
);

export const TriangleIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 22h20L12 2z"/>
    </svg>
);

export const RightTriangleIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 22L21 22L3 4z"/>
    </svg>
);

export const RhombusIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l8 10-8 10-8-10z"/>
    </svg>
);

export const TrapezoidIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h20L18 4H6z"/>
    </svg>
);

export const ParallelogramIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20l6-16h14l-6 16H2z"/>
    </svg>
);

export const PiesliceIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 12,22 A 10,10 0 1 1 22,12 L 12,12 Z"/>
    </svg>
);

export const ChordIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 22 12 A 10 10 0 1 0 12 22 Z"/>
    </svg>
);

export const ArcIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 2 8 C 13 8, 22 12.5, 22 18"/>
    </svg>
);

export const StarIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
);

export const TextIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M 3 4 H 21 V 7 H 14 V 19 H 17 V 21 H 7 V 19 H 10 V 7 H 3 Z" />
    </svg>
);

export const ImageIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
    </svg>
);

export const BitmapIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 6l5 5-5 5M10 18l-5-5 5-5"/>
    </svg>
);

export const UndoIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 17a5 5 0 1 0 0-10H5.5" />
        <path d="M9.5 11L5.5 7l4-4" />
    </svg>
);

export const RedoIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 17a5 5 0 1 1 0-10h8.5" />
        <path d="M14.5 11L18.5 7l-4-4" />
    </svg>
);

export const DuplicateIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
    </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

export const GridIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <line x1="3" y1="15" x2="21" y2="15"></line>
        <line x1="9" y1="3" x2="9" y2="21"></line>
        <line x1="15" y1="3" x2="15" y2="21"></line>
    </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);

export const DrawFromCornerIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {/* Dashed Bounding Box (expanded) */}
        <path d="M22 2 V22 H2" fill="none" strokeDasharray="3 3" />

        {/* Starting Dot (at new corner) */}
        <circle cx="2" cy="2" r="2" stroke="none" />

        {/* Arrow Shafts (thinner) */}
        <g fill="none">
            <line x1="2" y1="2" x2="22" y2="2" />
            <line x1="2" y1="2" x2="2" y2="22" />
            <line x1="2" y1="2" x2="22" y2="22" />
        </g>
        
        {/* Arrowheads (cleaner style) */}
        <g stroke="none">
            <polygon points="22,2 19,0.5 19,3.5" />
            <polygon points="2,22 0.5,19 3.5,19" />
            <polygon points="22,22 22,19 19,22" />
        </g>
    </svg>
);


export const DrawFromCenterIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {/* Dashed Bounding Box (expanded) */}
        <rect x="2" y="2" width="20" height="20" fill="none" strokeDasharray="3 3" />

        {/* Center Dot */}
        <circle cx="12" cy="12" r="2" stroke="none" />

        {/* Arrow Shafts (thinner) */}
        <g fill="none">
            <line x1="3" y1="3" x2="21" y2="21" />
            <line x1="21" y1="3" x2="3" y2="21" />
        </g>
        
        {/* Arrowheads (cleaner style) */}
        <g stroke="none">
            <polygon points="3,3 5.5,3 3,5.5" />
            <polygon points="21,21 18.5,21 21,18.5" />
            <polygon points="21,3 18.5,3 21,5.5" />
            <polygon points="3,21 5.5,21 3,18.5" />
        </g>
    </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export const MenuIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

export const CheckSquareIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

export const ClosePathIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l5-7 7 11 5-4" />
        <path d="M20 12 L3 12" strokeDasharray="4 2" />
    </svg>
);

export const XSquareIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="9" x2="15" y2="15" />
        <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
);

export const LockIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

export const UnlockIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
);

export const ConvertToPathIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 2v2.5"/>
        <path d="M12 22v-2.5"/>
        <path d="M22 12h-2.5"/>
        <path d="M2 12h2.5"/>
    </svg>
);

export const ArrowUpIcon: React.FC<IconProps> = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
    </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
    </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

export const CopyIcon: React.FC<IconProps> = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
        <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
    </svg>
);

export const PreviewIcon: React.FC<IconProps> = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export const FlipHorizontalIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <path d="M28.35,10 L39.75,10 L39.75,90 L1.75,90 Z" strokeWidth="7" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" />
        <path d="M50,0 L50,100" strokeWidth="5" strokeLinecap="round" strokeLinejoin="miter" strokeMiterlimit="10" />
        <path d="M60.25,10 L71.65,10 L98.25,90 L60.25,90 Z" strokeWidth="7" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" />
    </svg>
);

export const FlipVerticalIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <g transform="rotate(-90 50 50)">
            <path d="M28.35,10 L39.75,10 L39.75,90 L1.75,90 Z" strokeWidth="7" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" />
            <path d="M50,0 L50,100" strokeWidth="5" strokeLinecap="round" strokeLinejoin="miter" strokeMiterlimit="10" />
            <path d="M60.25,10 L71.65,10 L98.25,90 L60.25,90 Z" strokeWidth="7" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" />
        </g>
    </svg>
);

export const SunIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

export const MoonIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

export const WordWrapIcon: React.FC<IconProps> = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 10h4v4"/>
        <path d="M21 14l-4-4"/>
        <path d="M3 6h12"/>
        <path d="M3 12h12"/>
        <path d="M3 18h12"/>
    </svg>
);

export const EllipsisIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
    </svg>
);

export const NewFileIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
);

export const OpenFileIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 12v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5" />
        <path d="M18 8V2l-4 4" />
        <path d="M14 2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

export const HistoryIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 3v5h5" />
        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        <path d="M12 7v5l4 2" />
    </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

export const SaveIcon: React.FC<IconProps> = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3l14 9-14 9V3z"/>
    </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

export const BoldIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
    </svg>
);

export const ItalicIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="4" x2="10" y2="4"/>
        <line x1="14" y1="20" x2="5" y2="20"/>
        <line x1="15" y1="4" x2="9" y2="20"/>
    </svg>
);

export const UnderlineIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
        <line x1="4" y1="21" x2="20" y2="21"/>
    </svg>
);

export const StrikethroughIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4H9a3 3 0 0 0-2.83 4"/>
        <path d="M14 12a4 4 0 0 1 0 8H6"/>
        <line x1="4" y1="12" x2="18" y2="12"/>
    </svg>
);

export const AlignLeftIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="17" y1="10" x2="3" y2="10"/>
        <line x1="21" y1="6" x2="3" y2="6"/>
        <line x1="21" y1="14" x2="3" y2="14"/>
        <line x1="17" y1="18" x2="3" y2="18"/>
    </svg>
);

export const AlignCenterIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="10" x2="6" y2="10"/>
        <line x1="21" y1="6" x2="3" y2="6"/>
        <line x1="21" y1="14" x2="3" y2="14"/>
        <line x1="18" y1="18" x2="6" y2="18"/>
    </svg>
);

export const AlignRightIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="21" y1="10" x2="7" y2="10"/>
        <line x1="21" y1="6" x2="3" y2="6"/>
        <line x1="21" y1="14" x2="3" y2="14"/>
        <line x1="21" y1="18" x2="7" y2="18"/>
    </svg>
);

export const AlignShapesLeftIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="22" x2="4" y2="2" />
        <rect x="8" y="6" width="12" height="4" rx="1" />
        <rect x="8" y="14" width="8" height="4" rx="1" />
    </svg>
);

export const AlignShapesCenterHIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="22" x2="12" y2="2" />
        <rect x="6" y="6" width="12" height="4" rx="1" />
        <rect x="8" y="14" width="8" height="4" rx="1" />
    </svg>
);

export const AlignShapesRightIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="20" y1="22" x2="20" y2="2" />
        <rect x="4" y="6" width="12" height="4" rx="1" />
        <rect x="8" y="14" width="8" height="4" rx="1" />
    </svg>
);

export const AlignShapesTopIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="4" x2="2" y2="4" />
        <rect x="6" y="8" width="4" height="12" rx="1" />
        <rect x="14" y="8" width="4" height="8" rx="1" />
    </svg>
);

export const AlignShapesCenterVIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="12" x2="2" y2="12" />
        <rect x="6" y="6" width="4" height="12" rx="1" />
        <rect x="14" y="8" width="4" height="8" rx="1" />
    </svg>
);

export const AlignShapesBottomIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="20" x2="2" y2="20" />
        <rect x="6" y="4" width="4" height="12" rx="1" />
        <rect x="14" y="8" width="4" height="8" rx="1" />
    </svg>
);

export const DistributeHorizontalIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="22" x2="4" y2="2" />
        <line x1="20" y1="22" x2="20" y2="2" />
        <rect x="8" y="6" width="8" height="4" rx="1" />
        <rect x="10" y="14" width="4" height="4" rx="1" />
    </svg>
);

export const DistributeVerticalIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="4" x2="2" y2="4" />
        <line x1="22" y1="20" x2="2" y2="20" />
        <rect x="6" y="8" width="4" height="8" rx="1" />
        <rect x="14" y="10" width="4" height="4" rx="1" />
    </svg>
);

export const SadMonitorIcon: React.FC<IconProps> = ({ size = 96, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
        <path d="M9 8h.01"/>
        <path d="M15 8h.01"/>
        <path d="M9.5 13a4.6 4.6 0 0 0 5 0"/>
    </svg>
);

export const FullscreenIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
    </svg>
);

export const ExitFullscreenIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
    </svg>
);

export const BugIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 9V7a2 2 0 00-2-2h-3.93a2 2 0 00-1.66.9l-.82 1.2a2 2 0 01-3.18 0l-.82-1.2A2 2 0 007.93 5H4a2 2 0 00-2 2v2"/>
        <path d="M12 10a4 4 0 00-4 4v4a4 4 0 004 4h0a4 4 0 004-4v-4a4 4 0 00-4-4z"/>
        <path d="M8 14h8"/>
        <path d="M8 18h8"/>
        <path d="M15 5l-1-2"/>
        <path d="M9 5l1-2"/>
    </svg>
);

export const LightbulbIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M15.09 16.05A6.49 6.49 0 0012 21.5a6.49 6.49 0 00-3.09-5.45"/>
        <path d="M9 16.05V13h6v3.05"/>
        <path d="M12 13a3.5 3.5 0 003.5-3.5C15.5 5.36 12 2.5 12 2.5S8.5 5.36 8.5 9.5A3.5 3.5 0 0012 13z"/>
    </svg>
);

export const MessageSquareIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
);

export const ExternalLinkIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
);

export const GroupIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
);

export const UngroupIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="4" y="4" width="5" height="5" rx="1" />
        <rect x="15" y="4" width="5" height="5" rx="1" />
        <rect x="15" y="15" width="5" height="5" rx="1" />
        <rect x="4" y="15" width="5" height="5" rx="1" />
        <path d="M9 9l6 6M15 9L9 15" strokeDasharray="2 2" />
    </svg>
);

export const ToolsIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
);

export const LocateIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="8" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
);
export const EraserIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 20H7L3 16C2.5 15.5 2.5 14.7 3 14.2L13.2 4C13.7 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.3 20 10.8L10.5 20.3" />
        <path d="M6 13L11 18" />
    </svg>
);

export const DistributePathIcon: React.FC<IconProps> = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20c1.5-6 6-9 16-9" />
        <circle cx="4" cy="20" r="2" fill="currentColor" />
        <circle cx="12" cy="14" r="2" fill="currentColor" />
        <circle cx="20" cy="11" r="2" fill="currentColor" />
    </svg>
);

export const ShareLinkIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

export const KeyIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4.1a1 1 0 0 0-1.4 0l-2.1 2.1a1 1 0 0 0 0 1.3" />
        <path d="m15.5 7.5-6.6 6.6" />
        <circle cx="5.5" cy="18.5" r="3.5" />
    </svg>
);

export const ListIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);

export const ChevronUpIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m18 15-6-6-6 6"/>
    </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m15 18-6-6 6-6"/>
    </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/>
        <path d="M5 3v4"/>
        <path d="M19 17v4"/>
        <path d="M3 5h4"/>
        <path d="M17 19h4"/>
    </svg>
);

export const PauseIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="6" y="4" width="4" height="16"/>
        <rect x="14" y="4" width="4" height="16"/>
    </svg>
);

export const MagnifierIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="14"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
);

export const PinIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="17" x2="12" y2="22" />
        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
);

export const PinOffIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="2" y1="2" x2="22" y2="22" />
        <line x1="12" y1="17" x2="12" y2="22" />
        <path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h12" />
        <path d="M15 9.34V6h1a2 2 0 0 0 0-4H7.89" />
    </svg>
);

export const CrosshairIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="9"/>
        <line x1="12" y1="3" x2="12" y2="7"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
        <line x1="3" y1="12" x2="7" y2="12"/>
        <line x1="17" y1="12" x2="21" y2="12"/>
        <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
    </svg>
);

export const AnchorIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="5" r="3"/>
        <line x1="12" y1="8" x2="12" y2="21"/>
        <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
    </svg>
);

export const JoystickIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v3"/>
        <path d="M12 19v3"/>
        <path d="M2 12h3"/>
        <path d="M19 12h3"/>
    </svg>
);

export const RefreshCwIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
        <path d="M21 3v5h-5"/>
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
        <path d="M3 21v-5h5"/>
    </svg>
);

export const CloudGalleryIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => ( <svg className={className || 'w-6 h-6 stroke-current fill-none'} width={size} height={size} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.3-1.7-4.1-3.9-4.5-.4-3.5-3.4-6-6.9-6-3.2 0-6 2.2-6.7 5.2C2.2 9.7 0 11.9 0 14.5 0 17 2 19 4.5 19h13z" /> <rect x="8" y="11" width="8" height="6" rx="1" /> <circle cx="10.5" cy="13" r="0.8" /> <path d="M8 16l2.5-2.5 2 2 1.5-1.5 2 2" /> </svg> );

export const VeretkaLogoIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="342 42 615 610" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
    >
        <path d="M0 377 167.354 0 382 0 214.646 377Z" fill="#6e6e6e" transform="matrix(-1 -8.74228e-08 -8.74228e-08 1 745 274)"/>
        <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#6e6e6e" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 566.02 303.751)"/>
        <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#6e6e6e" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 518.456 303.751)"/>
        <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#6e6e6e" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 470.892 303.751)"/>
        <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#6e6e6e" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 423.328 303.751)"/>
        <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#6e6e6e" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 375.764 303.751)"/>
        <path d="M719.154 224 935 224 745.846 651 530 651Z" fill="#FFC000"/>
        <path d="M718.88 224 936 224 745.774 651C740.758 520.059 718.505 482.011 660 355.825Z" fill="#0070C0"/>
        <path d="M736.193 243.192C733.561 249.104 726.635 251.762 720.724 249.13L720.724 249.13C714.812 246.498 712.154 239.572 714.786 233.661L741.966 172.613C744.598 166.702 751.524 164.043 757.435 166.675L757.435 166.675C763.346 169.307 766.005 176.233 763.373 182.145Z" fill="#0070C0"/>
        <path d="M784.072 243.192C781.44 249.104 774.514 251.762 768.603 249.13L768.603 249.13C762.691 246.498 760.033 239.572 762.665 233.661L789.845 172.613C792.477 166.702 799.403 164.043 805.314 166.675L805.314 166.675C811.226 169.307 813.884 176.233 811.252 182.145Z" fill="#0070C0"/>
        <path d="M831.951 243.192C829.319 249.104 822.393 251.762 816.482 249.13L816.482 249.13C810.571 246.498 807.912 239.572 810.544 233.661L837.724 172.613C840.356 166.702 847.282 164.043 853.193 166.675L853.193 166.675C859.105 169.307 861.763 176.233 859.131 182.145Z" fill="#0070C0"/>
        <path d="M879.83 243.192C877.198 249.104 870.273 251.762 864.361 249.13L864.361 249.13C858.45 246.498 855.791 239.572 858.423 233.661L885.603 172.613C888.235 166.702 895.161 164.043 901.073 166.675L901.072 166.675C906.984 169.307 909.642 176.233 907.01 182.145Z" fill="#0070C0"/>
        <path d="M927.71 243.192C925.078 249.104 918.152 251.762 912.24 249.13L912.24 249.13C906.329 246.498 903.67 239.573 906.302 233.661L933.483 172.613C936.115 166.702 943.04 164.043 948.952 166.675L948.952 166.675C954.863 169.307 957.522 176.233 954.89 182.145Z" fill="#0070C0"/>
        <path d="M0.955665-6.59781 395.318 50.5239 393.407 63.7195-0.955665 6.59781ZM-4.77833 32.9891C-22.9977 30.3501-35.6281 13.441-32.9891-4.77833-30.3501-22.9977-13.441-35.6281 4.77833-32.9891 22.9977-30.3501 35.6281-13.441 32.9891 4.77833 30.3501 22.9977 13.441 35.6281-4.77833 32.9891ZM399.141 24.1326C417.36 26.7716 429.99 43.6806 427.351 61.9 424.712 80.1194 407.803 92.7497 389.584 90.1107 371.365 87.4717 358.734 70.5627 361.373 52.3434 364.012 34.124 380.921 21.4936 399.141 24.1326Z" fill="#0070C0" transform="matrix(1 0 0 -1 434.5 133.622)"/>
        <path d="M220.27 30.5573C192.814 23.3587 144.253-8.25427 80.72 2.04285 17.1869 12.34-0.996792 71.4324 0.0414646 89.5092 1.07972 107.586 6.28948 135.309 15.8645 153.298 30.0006 179.858 56.4739 190.887 78.0564 183.531 99.6389 176.175 105.088 139.242 86.2557 123.988 67.423 108.734 38.8872 120.07 32.6043 134.374 26.3214 148.678 31.1916 168.911 48.5587 209.813 62.0437 243.951 85.9893 284.104 71.4443 348.273" stroke="#0070C0" strokeWidth="5.33333" strokeMiterlimit="8" fill="none" transform="matrix(-0.944285 0.329128 0.329128 0.944285 627.56 27.8097)"/>
    </svg>
);

export const HelpCircleIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

export const LogOutIcon: React.FC<IconProps> = ({ size = 20, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);


