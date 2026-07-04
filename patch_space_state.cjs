const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf-8');

const targetHook = `  const isSpacePressedRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            isSpacePressedRef.current = true;`;

const replaceHook = `  const isSpacePressedRef = useRef(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            isSpacePressedRef.current = true;
            if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                setIsSpacePressed(true);
                e.preventDefault();
            }
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            isSpacePressedRef.current = false;
            setIsSpacePressed(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);`;

const targetCursor = `    const getCursorStyle = () => {
        if (!action) {
          if (activeTool === 'select') return 'grab';`;

const replaceCursor = `    const getCursorStyle = () => {
        if (!action) {
          if (isSpacePressed) return 'grab';
          if (activeTool === 'select') return 'default'; // In select mode, empty space is default until hover (or box select)
`;

if (code.includes(targetHook) && code.includes(targetCursor)) {
    code = code.replace(targetHook, replaceHook).replace(targetCursor, replaceCursor);
    fs.writeFileSync('components/Canvas.tsx', code);
    console.log('patched space state and cursor');
} else {
    console.log('Target hook or cursor not found');
}
