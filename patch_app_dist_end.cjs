const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetStr = `                        onDistributePathChange={setDistributePathState}
                        onConfirmDistributePath={() => {
                            setHistoryState(prev => {
                                const newShapes = applyDistributePathToShapes(prev.shapes, prev.distributePathState!);
                                return { ...prev, shapes: newShapes, distributePathState: null };
                            });
                        }}
                        onCancelDistributePath={() => setDistributePathState(null)}`;

const insertStr = `                        onDistributePathChange={setDistributePathState}
                        onConfirmDistributePath={() => {
                            if (distributePathState) {
                                setSelectedShapeIds(distributePathState.entities.flatMap(e => e.ids));
                            }
                            setHistoryState(prev => {
                                const newShapes = applyDistributePathToShapes(prev.shapes, prev.distributePathState!);
                                return { ...prev, shapes: newShapes, distributePathState: null };
                            });
                        }}
                        onCancelDistributePath={() => {
                            if (distributePathState) {
                                setSelectedShapeIds(distributePathState.entities.flatMap(e => e.ids));
                            }
                            setDistributePathState(null);
                        }}`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, insertStr);
} else {
    console.error('Target not found in App.tsx');
}

fs.writeFileSync('App.tsx', code);
console.log('patched App.tsx');
