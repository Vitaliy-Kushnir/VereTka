import re

with open("App.tsx", "r") as f:
    text = f.read()

text = text.replace("const [drawingWarningModal, setDrawingWarningModal] = useState<{ show: boolean, reason: 'hidden' | 'locked' } | null>(null);", 
                    "const [drawingWarningModal, setDrawingWarningModal] = useState<{ show: boolean, reason: 'hidden' | 'locked', layerId?: string } | null>(null);")

text = text.replace("setDrawingWarningModal({ show: true, reason: 'locked' });", 
                    "setDrawingWarningModal({ show: true, reason: 'locked', layerId: activeLayerId });")

text = text.replace("setDrawingWarningModal({ show: true, reason: 'hidden' });", 
                    "setDrawingWarningModal({ show: true, reason: 'hidden', layerId: activeLayerId });")

text = text.replace("onLayerWarning={(reason) => setDrawingWarningModal({ show: true, reason })}",
                    "onLayerWarning={(reason, layerId) => setDrawingWarningModal({ show: true, reason, layerId })}")

modal_text = """                    <p className="mb-4 text-sm text-[var(--text-secondary)]">
                        {drawingWarningModal.reason === 'hidden' 
                            ? t('warning.layerHidden.message') || "Ви намагаєтесь створити об'єкт на прихованому шарі. Будь ласка, виберіть інший."
                            : t('warning.layerLocked.message') || "Ви намагаєтесь створити об'єкт на заблокованому шарі. Будь ласка, виберіть інший."}
                    </p>"""

new_modal_text = """                    <p className="mb-4 text-sm text-[var(--text-secondary)]">
                        {drawingWarningModal.reason === 'hidden' 
                            ? (t('warning.layerHidden.message') || "Ви намагаєтесь створити об'єкт на прихованому шарі. Будь ласка, виберіть інший.") + (drawingWarningModal.layerId && layers.find((l: any) => l.id === drawingWarningModal.layerId) ? ` "${layers.find((l: any) => l.id === drawingWarningModal.layerId)?.name}"` : "")
                            : (t('warning.layerLocked.message') || "Ви намагаєтесь створити об'єкт на заблокованому шарі. Будь ласка, виберіть інший.") + (drawingWarningModal.layerId && layers.find((l: any) => l.id === drawingWarningModal.layerId) ? ` "${layers.find((l: any) => l.id === drawingWarningModal.layerId)?.name}"` : "")}
                    </p>"""

text = text.replace(modal_text, new_modal_text)

with open("App.tsx", "w") as f:
    f.write(text)
