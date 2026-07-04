const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf-8');

const targetHook = `  const touchStateRef = useRef<{ initialDist: number, initialMidpoint: {x:number, y:number}, initialTransform: ViewTransform } | null>(null);`;
const insertHook = `  const touchStateRef = useRef<{ initialDist: number, initialMidpoint: {x:number, y:number}, initialTransform: ViewTransform } | null>(null);
  const isSpacePressedRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            isSpacePressedRef.current = true;
            if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            isSpacePressedRef.current = false;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);`;

if (code.includes(targetHook)) {
    code = code.replace(targetHook, insertHook);
    fs.writeFileSync('components/Canvas.tsx', code);
    console.log('patched Canvas hooks');
} else {
    console.log('Target hook not found');
}
