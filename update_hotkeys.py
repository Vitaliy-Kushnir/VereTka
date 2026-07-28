import re

uk_hotkeys = """
                            <SectionTitle id="hotkeys">8. Гарячі клавіші</SectionTitle>
                            <Para>Використовуйте ці комбінації для прискорення робочого процесу.</Para>
                            
                            <SubTitle>Робота з файлами та історією</SubTitle>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem><Key>Ctrl+S</Key> — Зберегти проєкт.</ListItem>
                                <ListItem><Key>Ctrl+Z</Key> — Скасувати останню дію.</ListItem>
                                <ListItem><Key>Ctrl+Y</Key> (або <Key>Ctrl+Shift+Z</Key>) — Повернути скасовану дію.</ListItem>
                            </ul>

                            <SubTitle>Інструменти та виділення</SubTitle> 
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem><Key>V</Key> — Активувати інструмент "Вибрати".</ListItem>
                                <ListItem><Key>A</Key> — Активувати інструмент "Редагувати вузли".</ListItem>
                                <ListItem><Key>Ctrl+G</Key> — Згрупувати виділені об'єкти.</ListItem>
                                <ListItem><Key>Ctrl+Shift+G</Key> — Розгрупувати.</ListItem>
                                <ListItem><Key>Ctrl+D</Key> — Дублювати виділений об'єкт.</ListItem>
                                <ListItem><Key>Ctrl+H</Key> — Віддзеркалити по горизонталі.</ListItem>
                                <ListItem><Key>Ctrl+V</Key> — Віддзеркалити по вертикалі.</ListItem>
                                <ListItem><Key>Delete</Key> / <Key>Backspace</Key> — Видалити виділений об'єкт або вузол.</ListItem>
                            </ul>
                            
                            <SubTitle>Переміщення (Nudging)</SubTitle>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                 <ListItem><Key>Стрілки</Key> — Перемістити виділений об'єкт на 1 піксель.</ListItem>
                                 <ListItem><Key>Shift + Стрілки</Key> — Перемістити виділений об'єкт на 10 пікселів.</ListItem>
                                 <ListItem><Key>Alt + Стрілки</Key> — Перемістити об'єкт без прив'язки (snapping).</ListItem>
                            </ul>
                            
                            <SubTitle>Навігація та Загальне</SubTitle>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem>
                                    <Key>?</Key> — Показати всі гарячі клавіші.
                                </ListItem>
                                <ListItem>
                                    <Key>Коліщатко миші</Key> — Масштабування полотна.
                                </ListItem>
                                <ListItem>
                                    <Key>Середня кнопка (коліщатко) миші</Key> — Панорамування полотна.
                                </ListItem>
                                 <ListItem>
                                    <Key>F11</Key> — Вхід / вихід з повноекранного режиму.
                                </ListItem>
                                <ListItem>
                                    <Key>Escape (Esc)</Key> — Скасовує поточну дію (малювання), знімає виділення або закриває модальні вікна.
                                </ListItem>
                            </ul>
                        </section>"""

en_hotkeys = """
                <SectionTitle id="hotkeys">8. Hotkeys</SectionTitle>
                <Para>Use these combinations to speed up your workflow.</Para>
                
                <SubTitle>File & History</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Ctrl+S</Key> — Save project.</ListItem>
                    <ListItem><Key>Ctrl+Z</Key> — Undo last action.</ListItem>
                    <ListItem><Key>Ctrl+Y</Key> (or <Key>Ctrl+Shift+Z</Key>) — Redo action.</ListItem>
                </ul>

                <SubTitle>Tools & Selection</SubTitle> 
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>V</Key> — Activate "Select" tool.</ListItem>
                    <ListItem><Key>A</Key> — Activate "Edit Nodes" tool.</ListItem>
                    <ListItem><Key>Ctrl+G</Key> — Group selected objects.</ListItem>
                    <ListItem><Key>Ctrl+Shift+G</Key> — Ungroup.</ListItem>
                    <ListItem><Key>Ctrl+D</Key> — Duplicate selected object.</ListItem>
                    <ListItem><Key>Ctrl+H</Key> — Flip Horizontal.</ListItem>
                    <ListItem><Key>Ctrl+V</Key> — Flip Vertical.</ListItem>
                    <ListItem><Key>Delete</Key> / <Key>Backspace</Key> — Delete selected object or node.</ListItem>
                </ul>
                
                <SubTitle>Movement</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                     <ListItem><Key>Arrows</Key> — Move selected object by 1 pixel.</ListItem>
                     <ListItem><Key>Shift + Arrows</Key> — Move selected object by 10 pixels.</ListItem>
                     <ListItem><Key>Alt + Arrows</Key> — Move without snapping.</ListItem>
                </ul>
                
                <SubTitle>Navigation & General</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <Key>?</Key> — Show all hotkeys.
                    </ListItem>
                    <ListItem>
                        <Key>Mouse Wheel</Key> — Zoom canvas.
                    </ListItem>
                    <ListItem>
                        <Key>Middle Mouse Button</Key> — Pan canvas.
                    </ListItem>
                     <ListItem>
                        <Key>F11</Key> — Enter / exit fullscreen mode.
                    </ListItem>
                    <ListItem>
                        <Key>Escape (Esc)</Key> — Cancel current action (drawing), deselect, or close modals.
                    </ListItem>
                </ul>
            </section>"""

es_hotkeys = """
                <SectionTitle id="hotkeys">8. Teclas de Atajo</SectionTitle>
                <Para>Use estas combinaciones para acelerar su flujo de trabajo.</Para>
                
                <SubTitle>Archivo e Historial</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Ctrl+S</Key> — Guardar proyecto.</ListItem>
                    <ListItem><Key>Ctrl+Z</Key> — Deshacer la última acción.</ListItem>
                    <ListItem><Key>Ctrl+Y</Key> (o <Key>Ctrl+Shift+Z</Key>) — Rehacer acción.</ListItem>
                </ul>

                <SubTitle>Herramientas y Selección</SubTitle> 
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>V</Key> — Activar herramienta "Seleccionar".</ListItem>
                    <ListItem><Key>A</Key> — Activar herramienta "Editar Nodos".</ListItem>
                    <ListItem><Key>Ctrl+G</Key> — Agrupar objetos seleccionados.</ListItem>
                    <ListItem><Key>Ctrl+Shift+G</Key> — Desagrupar.</ListItem>
                    <ListItem><Key>Ctrl+D</Key> — Duplicar objeto seleccionado.</ListItem>
                    <ListItem><Key>Ctrl+H</Key> — Voltear Horizontalmente.</ListItem>
                    <ListItem><Key>Ctrl+V</Key> — Voltear Verticalmente.</ListItem>
                    <ListItem><Key>Delete</Key> / <Key>Backspace</Key> — Eliminar objeto o nodo seleccionado.</ListItem>
                </ul>
                
                <SubTitle>Movimiento</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                     <ListItem><Key>Flechas</Key> — Mover objeto seleccionado 1 píxel.</ListItem>
                     <ListItem><Key>Shift + Flechas</Key> — Mover objeto seleccionado 10 píxeles.</ListItem>
                     <ListItem><Key>Alt + Flechas</Key> — Mover sin ajustar (snapping).</ListItem>
                </ul>
                
                <SubTitle>Navegación y General</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <Key>?</Key> — Mostrar todos los atajos.
                    </ListItem>
                    <ListItem>
                        <Key>Rueda del Ratón</Key> — Acercar/alejar lienzo.
                    </ListItem>
                    <ListItem>
                        <Key>Botón Central del Ratón</Key> — Desplazar lienzo (pan).
                    </ListItem>
                     <ListItem>
                        <Key>F11</Key> — Entrar / salir de pantalla completa.
                    </ListItem>
                    <ListItem>
                        <Key>Escape (Esc)</Key> — Cancelar acción actual, deseleccionar o cerrar modales.
                    </ListItem>
                </ul>
            </section>"""

it_hotkeys = """
                <SectionTitle id="hotkeys">8. Scorciatoie da Tastiera</SectionTitle>
                <Para>Usa queste combinazioni per velocizzare il tuo flusso di lavoro.</Para>
                
                <SubTitle>File e Cronologia</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Ctrl+S</Key> — Salva progetto.</ListItem>
                    <ListItem><Key>Ctrl+Z</Key> — Annulla l'ultima azione.</ListItem>
                    <ListItem><Key>Ctrl+Y</Key> (o <Key>Ctrl+Shift+Z</Key>) — Ripristina azione.</ListItem>
                </ul>

                <SubTitle>Strumenti e Selezione</SubTitle> 
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>V</Key> — Attiva strumento "Seleziona".</ListItem>
                    <ListItem><Key>A</Key> — Attiva strumento "Modifica Nodi".</ListItem>
                    <ListItem><Key>Ctrl+G</Key> — Raggruppa oggetti selezionati.</ListItem>
                    <ListItem><Key>Ctrl+Shift+G</Key> — Separa.</ListItem>
                    <ListItem><Key>Ctrl+D</Key> — Duplica oggetto selezionato.</ListItem>
                    <ListItem><Key>Ctrl+H</Key> — Capovolgi Orizzontalmente.</ListItem>
                    <ListItem><Key>Ctrl+V</Key> — Capovolgi Verticalmente.</ListItem>
                    <ListItem><Key>Delete</Key> / <Key>Backspace</Key> — Elimina oggetto o nodo selezionato.</ListItem>
                </ul>
                
                <SubTitle>Movimento</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                     <ListItem><Key>Frecce</Key> — Muovi oggetto selezionato di 1 pixel.</ListItem>
                     <ListItem><Key>Shift + Frecce</Key> — Muovi oggetto selezionato di 10 pixel.</ListItem>
                     <ListItem><Key>Alt + Frecce</Key> — Muovi senza ancoraggio (snapping).</ListItem>
                </ul>
                
                <SubTitle>Navigazione e Generale</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <Key>?</Key> — Mostra tutte le scorciatoie.
                    </ListItem>
                    <ListItem>
                        <Key>Rotellina del Mouse</Key> — Zoom della tela.
                    </ListItem>
                    <ListItem>
                        <Key>Tasto Centrale del Mouse</Key> — Panoramica della tela.
                    </ListItem>
                     <ListItem>
                        <Key>F11</Key> — Entra / esci da schermo intero.
                    </ListItem>
                    <ListItem>
                        <Key>Escape (Esc)</Key> — Annulla l'azione corrente, deseleziona o chiudi modali.
                    </ListItem>
                </ul>
            </section>"""


def patch_file(filename, replacement_text, tag_start='<SectionTitle id="hotkeys">', tag_end='</section>'):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the hotkeys section
    start_idx = content.find(tag_start)
    if start_idx == -1:
        return
        
    end_idx = content.find(tag_end, start_idx)
    if end_idx == -1:
        return
        
    end_idx += len(tag_end)
    
    # Replace it
    new_content = content[:start_idx] + replacement_text.strip() + content[end_idx:]
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)

patch_file('components/help/HelpContentUK.tsx', uk_hotkeys)
patch_file('components/help/HelpContentEN.tsx', en_hotkeys)
patch_file('components/help/HelpContentES.tsx', es_hotkeys)
patch_file('components/help/HelpContentIT.tsx', it_hotkeys)

