import re

with open("App.tsx", "r") as f:
    text = f.read()

text = text.replace(
    "<option key={l.id} value={l.id} disabled={l.locked || !l.visible}>",
    "<option key={l.id} value={l.id} disabled={l.locked}>"
)

old_onchange = """                            onChange={(e) => {
                                setActiveLayer(e.target.value);
                            }}"""

new_onchange = """                            onChange={(e) => {
                                const newLayerId = e.target.value;
                                setActiveLayer(newLayerId);
                                const newLayer = layers.find((l: any) => l.id === newLayerId);
                                if (newLayer && !newLayer.visible) {
                                    setDrawingWarningModal(prev => prev ? { ...prev, layerId: undefined, reason: 'hidden' } : null);
                                } else {
                                    setDrawingWarningModal(prev => prev ? { ...prev, layerId: undefined } : null);
                                }
                            }}"""

text = text.replace(old_onchange, new_onchange)

with open("App.tsx", "w") as f:
    f.write(text)
