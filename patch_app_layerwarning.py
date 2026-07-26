import re

with open("App.tsx", "r") as f:
    text = f.read()

target = """                                showTkinterNames={showTkinterNames}
                                layers={layers}
                                activeLayerId={activeLayerId}
                                onMoveToLayer={moveToLayer}
                                onSetActiveLayer={setActiveLayer}
                            />"""

replacement = """                                showTkinterNames={showTkinterNames}
                                layers={layers}
                                activeLayerId={activeLayerId}
                                onMoveToLayer={moveToLayer}
                                onSetActiveLayer={setActiveLayer}
                                onLayerWarning={(reason) => setDrawingWarningModal({ show: true, reason })}
                            />"""

if target in text:
    text = text.replace(target, replacement)
else:
    print("TARGET NOT FOUND in App.tsx")

with open("App.tsx", "w") as f:
    f.write(text)
