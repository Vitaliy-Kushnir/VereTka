import React from 'react';
import { HelpComponents } from './HelpContentUK';

export const HelpContentES: React.FC<HelpComponents> = ({ SectionTitle, SubTitle, Para, Key, ListItem }) => {
    return (
        <>
            {/* 1. INTRODUCCIÓN */}
            <section>
                <SectionTitle id="intro">1. Introducción</SectionTitle>
                <Para>
                    <strong className="text-[var(--text-primary)]">Veretka</strong> es un editor de gráficos vectoriales basado en web, potente e intuitivo, diseñado especialmente para el diseño visual de interfaces, ilustraciones vectoriales y la generación automática de código Python limpio para la biblioteca <Key>Tkinter</Key>.
                </Para>
                <Para>
                    El editor actúa como puente entre el diseño gráfico y la programación: mientras dibujas formas en el lienzo interactivo, la aplicación genera al instante un script de Python optimizado y autónomo, listo para ejecutarse localmente o en entornos web de Python.
                </Para>
                <Para>
                    Este manual cubre todas las funciones de Veretka: desde formas vectoriales básicas y gestos táctiles en tabletas y móviles, hasta herramientas de máxima precisión (lupa, joystick virtual) y trabajo colaborativo en la nube.
                </Para>
            </section>

            {/* 2. DESCRIPCIÓN DE LA INTERFAZ */}
            <section>
                <SectionTitle id="interface">2. Descripción de la interfaz</SectionTitle>
                <Para>La interfaz está diseñada cuidadosamente tanto para computadoras de escritorio como para dispositivos táctiles y móviles:</Para>
                <ul className="list-decimal list-inside space-y-3 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Menú Principal (Barra Superior):</strong> Acceso a todas las operaciones globales:
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li><Key>Archivo</Key> — Crear proyectos, abrir, guardar, exportar imágenes (PNG, JPEG, SVG), publicar en la nube e importar imágenes de referencia.</li>
                            <li><Key>Editar</Key> — Deshacer (<Key>Ctrl+Z</Key>) y Rehacer (<Key>Ctrl+Y</Key>), cortar, copiar, pegar, seleccionar todo y línea de tiempo de historial.</li>
                            <li><Key>Objeto</Key> — Agrupar, desagrupar, orden de capas, volteo, alineación y distribución a lo largo de un trazado.</li>
                            <li><Key>Ver</Key> — Reglas, cuadrícula, guías magnéticas (Snapping), nivel láser y modo de pantalla completa.</li>
                            <li><Key>Ayuda</Key> — Consultar este manual, tabla de atajos y formulario de comentarios.</li>
                        </ul>
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Barra de Herramientas (Panel Izquierdo / Barra Inferior en Móvil):</strong> Herramienta Selección (<Key>V</Key>), Editor de Nodos (<Key>A</Key>), primitivas geométricas (rectángulo, círculo/elipse, triángulo, estrella, polígono), líneas, curvas Bézier, texto y cuentagotas.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Barra de Propiedades Dinámica (Superior):</strong> Muestra automáticamente las opciones de la herramienta u objeto activo: color de relleno, color de trazo, grosor de línea, estilo de trazo, radio de esquinas y modo de dibujo (desde esquina o centro).
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Lienzo de Trabajo (Canvas):</strong> Área central de dibujo con zoom fluido, desplazamiento y alineación inteligente. Al superar el 1000% de zoom, se activa automáticamente una microcuadrícula de 1 píxel.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Panel de Código Tkinter:</strong> Ubicado bajo la barra izquierda (o en un cajón deslizable en tabletas). Muestra el código Python en tiempo real con resaltado de sintaxis, copia en un clic, descarga y ejecución directa en intérpretes online.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Árbol de Capas y Objetos (Panel Derecho):</strong> Vista en árbol para reordenar capas mediante arrastrar y soltar, renombrar, bloquear contra ediciones accidentales y ocultar visibilidad.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Barra de Estado (Inferior):</strong> Muestra el nivel de zoom actual, coordenadas del cursor, botón HUD de coordenadas flotantes y botón de enfoque rápido.
                    </ListItem>
                </ul>

                <SubTitle>Modo Pantalla Completa</SubTitle>
                <Para>
                    Para concentrarte en el diseño sin distracciones del navegador, activa el modo pantalla completa desde <Key>Ver</Key> → <Key>Pantalla Completa</Key> o pulsando <Key>F11</Key>. Presiona <Key>F11</Key> de nuevo para salir.
                </Para>
            </section>

            {/* 3. TRABAJAR CON PROYECTOS */}
            <section>
                <SectionTitle id="projects">3. Trabajar con proyectos</SectionTitle>
                <SubTitle>Crear un nuevo proyecto</SubTitle>
                <Para>
                    Inicia un proyecto desde <Key>Archivo</Key> → <Key>Nuevo Proyecto...</Key> o desde la pantalla de bienvenida. Configura título, dimensiones en píxeles, color de fondo y nombre de variable del Canvas de Python.
                </Para>
                <SubTitle>Guardar y Cargar (.vec.json)</SubTitle>
                <Para>
                    El formato nativo <Key>.vec.json</Key> es un archivo JSON estructurado y ligero que almacena formas, capas, ajustes de cuadrícula e imágenes de referencia incrustadas.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Guardar</Key> (<Key>Ctrl+S</Key>) — Guarda los cambios en el archivo del proyecto.</ListItem>
                    <ListItem><Key>Guardar como...</Key> — Crea una copia con un nombre nuevo.</ListItem>
                    <ListItem><Key>Cargar proyecto...</Key> — Abre cualquier archivo <Key>.vec.json</Key> guardado con anterioridad.</ListItem>
                </ul>
                <SubTitle>Autoguardado y Recuperación de Sesión</SubTitle>
                <Para>
                    Veretka incluye protección contra pérdidas accidentales de datos:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Autoguardado en segundo plano:</strong> Cada 2 minutos se guarda el estado en el <Key>localStorage</Key> del navegador. Si cierras la pestaña por error, al volver verás un aviso para restaurar tu trabajo en un clic.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">«Volver al proyecto» en la pantalla de bienvenida:</strong> Si navegas al menú principal o a la galería, tu trabajo activo se mantiene listo para continuar.
                    </ListItem>
                </ul>
            </section>

            {/* 4. TRABAJAR CON PLANTILLAS */}
            <section>
                <SectionTitle id="templates">4. Trabajar con plantillas</SectionTitle>
                <SubTitle>Utilidad de las plantillas</SubTitle>
                <Para>
                    Las plantillas almacenan dimensiones de lienzo, paletas de colores, cuadrículas guía y formas iniciales (marcos de interfaz, sistemas de coordenadas o logotipos).
                </Para>
                <SubTitle>Creación y uso</SubTitle>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <ListItem>
                        Diseña tu estructura base en el lienzo y selecciona <Key>Archivo</Key> → <Key>Guardar como plantilla...</Key>.
                    </ListItem>
                    <ListItem>
                        Introduce un nombre descriptivo (ej. «Tablero de juego 800x600» o «Tarjeta de producto»).
                    </ListItem>
                    <ListItem>
                        Al crear nuevos proyectos, selecciona tu plantilla en la lista «Crear desde plantilla».
                    </ListItem>
                </ol>
                <Para>
                    Administra tus plantillas guardadas (renombrar o eliminar) en <Key>Configuración</Key> dentro de la pestaña <Key>Plantillas</Key>.
                </Para>
            </section>

            {/* 5. TRABAJAR CON FIGURAS */}
            <section>
                <SectionTitle id="shapes">5. Trabajar con figuras</SectionTitle>
                <SubTitle>Dibujo y Selección</SubTitle>
                <Para>
                    Selecciona una herramienta en el panel, luego haz clic y arrastra en el lienzo para definir el tamaño de la figura.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>Mantén <Key>Shift</Key> al dibujar rectángulos o elipses para forzar una proporción 1:1 perfecta (cuadrado / círculo).</ListItem>
                    <ListItem>Mantén <Key>Alt</Key> para dibujar la figura desde su centro en lugar de desde la esquina.</ListItem>
                    <ListItem>La herramienta <Key>Seleccionar</Key> (<Key>V</Key>) muestra los controles de transformación para redimensionar y rotar.</ListItem>
                </ul>

                <SubTitle>Edición de Nodos (Trazados Vectoriales)</SubTitle>
                <Para>
                    El <Key>Editor de Nodos</Key> (<Key>A</Key>) brinda control vectorial sobre curvas Bézier, líneas y polígonos: mover puntos de ancla, manipular tiradores de tangentes, añadir nuevos nodos haciendo clic en el trazo y eliminar con <Key>Supr</Key>.
                </Para>

                <SubTitle>Distribuir a lo largo de un trazado (Distribute along Path)</SubTitle>
                <Para>
                    Coloca un conjunto de objetos de manera uniforme a lo largo del contorno de otra forma o curva guía:
                </Para>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <ListItem>Selecciona los objetos a distribuir junto con la curva guía.</ListItem>
                    <ListItem>En el menú <Key>Objeto</Key>, elige <Key>Distribuir a lo largo del trazado</Key>.</ListItem>
                    <ListItem>Elige la orientación: <strong>Radial</strong> (hacia afuera desde el centro), <strong>Tangente</strong> (siguiendo la inclinación de la curva) o <strong>Paralela</strong> (ángulo fijo).</ListItem>
                </ol>

                <SubTitle>Agrupar, Alinear y Voltear</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Ctrl+G</Key> — Agrupar objetos seleccionados (doble clic para editar figuras dentro del grupo).</ListItem>
                    <ListItem><Key>Ctrl+Shift+G</Key> — Desagrupar objetos.</ListItem>
                    <ListItem><Key>Ctrl+H</Key> / <Key>Ctrl+V</Key> — Voltear horizontal o verticalmente.</ListItem>
                    <ListItem>Los botones de alineación de la barra superior alinean por bordes, centros o distribuyen equitativamente en la selección o el lienzo.</ListItem>
                </ul>

                <SubTitle>Paleta y Nombres de Colores Tkinter</SubTitle>
                <Para>
                    Soporta códigos HEX, RGB y un catálogo de más de 700 nombres oficiales de colores de Tkinter. Los nombres del sistema se verifican y mapean automáticamente para asegurar una total coincidencia visual entre la web y Tkinter.
                </Para>

                <SubTitle>Importación de Imágenes para Calco</SubTitle>
                <Para>
                    A través de <Key>Archivo</Key> → <Key>Importar imagen...</Key>, puedes cargar bocetos PNG/JPEG como fondos de referencia para calco vectorial manual.
                </Para>
            </section>

            {/* 6. PANTALLAS TÁCTILES, LUPA Y JOYSTICK */}
            <section>
                <SectionTitle id="touch-mobile">6. Pantallas táctiles, Lupa y Joystick</SectionTitle>
                <Para>
                    Veretka está completamente adaptado para dispositivos móviles, tabletas con lápiz óptico (iPad Apple Pencil, tabletas Android) y pantallas táctiles. Los modos táctiles y los asistentes de precisión facilitan el diseño en cualquier tamaño de pantalla.
                </Para>

                <SubTitle>Gestos Multitáctiles en el Lienzo</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Pinch-to-Zoom (Pellizcar para zoom):</strong> Acerca o aleja dos dedos para cambiar suavemente el zoom del 10% al 3000%.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Desplazamiento con dos dedos (Two-Finger Pan):</strong> Arrastra con dos dedos para moverte por el lienzo sin dibujar ni mover objetos por accidente.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Un solo dedo (Tocar y arrastrar):</strong> Seleccionar figuras, trazar nuevos vectores o mover elementos.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Pulsación prolongada (Long-Press):</strong> Mantén presionado sobre un objeto para abrir el menú contextual (Copiar, Eliminar, Traer al frente, Voltear).
                    </ListItem>
                </ul>

                <SubTitle>Barra Móvil y Cajones Desplegables</SubTitle>
                <Para>
                    En smartphones, la interfaz se adapta para un uso cómodo con el pulgar:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Barra inferior móvil:</strong> Acceso rápido a herramientas de dibujo, paleta de colores, deshacer/rehacer y widgets de precisión.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Cajones deslizables (Drawers):</strong> El árbol de capas, las propiedades de figuras y el código Tkinter se abren en paneles limpios sin tapar el lienzo.</ListItem>
                </ul>

                <SubTitle>Lupa de Precisión Táctil (Precision Loupe)</SubTitle>
                <Para>
                    Al dibujar con el dedo, este suele tapar el punto exacto de contacto. La lupa de precisión de Veretka resuelve este problema por completo:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Desplazamiento táctil (Touch Offset):</strong> La lupa proyecta la vista aumentada entre 60 y 90 píxeles por encima del punto de contacto del dedo.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Retícula y HUD de coordenadas:</strong> Muestra una retícula de alto contraste con las coordenadas píxel X/Y en vivo.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Fijar lupa (Pin):</strong> Ancla la lupa en una esquina de la pantalla para monitorear detalles continuamente.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Congelar imagen (Freeze):</strong> Pausa la ampliación para inspeccionar nodos y curvas complejas con calma.
                    </ListItem>
                </ul>

                <SubTitle>Joystick Virtual de Precisión (Control Nudge)</SubTitle>
                <Para>
                    Para realizar ajustes milimétricos de figuras o nodos en pantallas táctiles sin vibraciones:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Stick analógico táctil:</strong> Mueve suavemente los objetos seleccionados. La velocidad se adapta a la inclinación del stick.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Botones de paso (1px y 10px):</strong> Botones direccionales para desplazar exactamente 1 píxel (micropaso) o 10 píxeles (paso grande).
                    </ListItem>
                </ul>

                <SubTitle>Línea de Tiempo del Historial (History Popover)</SubTitle>
                <Para>
                    Una pulsación prolongada en <Key>Deshacer</Key> o <Key>Rehacer</Key> abre una línea de tiempo cronológica. Puedes ver los nombres y horas de cada acción y saltar a cualquier punto con un solo toque.
                </Para>
            </section>

            {/* 7. CÓDIGO Y EXPORTACIÓN */}
            <section>
                <SectionTitle id="code-export">7. Código y exportación</SectionTitle>
                <SubTitle>Generación de Código Python Tkinter</SubTitle>
                <Para>
                    El editor traduce automáticamente cada objeto gráfico a sus correspondientes llamadas de Tkinter Canvas (<Key>create_rectangle</Key>, <Key>create_oval</Key>, <Key>create_polygon</Key>, <Key>create_line</Key>, <Key>create_text</Key>, etc.).
                </Para>
                <Para>
                    El código generado es un programa Python autónomo que incluye inicialización de ventana (<Key>tk.Tk()</Key>), lienzo y ciclo de eventos (<Key>mainloop()</Key>).
                </Para>
                <SubTitle>Ejecución Directa en Línea</SubTitle>
                <Para>
                    Haz clic en <Key>Ejecutar en ЄPython</Key> en el panel de código para probar tu dibujo en el navegador sin instalar Python en tu equipo.
                </Para>
                <Para>
                    Si el proyecto contiene muchas figuras y supera el límite de URL del navegador, la aplicación copia el código completo al portapapeles y abre el entorno para pegar directamente (<Key>Ctrl+V</Key>).
                </Para>
                <SubTitle>Guardado de Archivos y Exportación de Imágenes</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Guardar script:</strong> Descarga de archivos ejecutables <Key>.py</Key> o <Key>.txt</Key> con números de línea opcionales.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">SVG vectorial:</strong> Exportación SVG limpia para flujos de diseño gráfico.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">PNG / JPEG ráster:</strong> Exportación en alta resolución con multiplicadores de escala (1x, 2x, 4x Retina) y ajuste de compresión.</ListItem>
                </ul>
            </section>

            {/* 8. ALMACENAMIENTO CLOUD Y GALERÍA */}
            <section>
                <SectionTitle id="cloud-storage">8. Almacenamiento Cloud y Galería</SectionTitle>
                <SubTitle>Descripción de la Plataforma Cloud</SubTitle>
                <Para>
                    Guarda proyectos de forma segura en la nube, ábrelos desde cualquier equipo o tableta, comparte tus creaciones en la Galería Pública y colabora dentro de Células de grupo.
                </Para>
                <SubTitle>Cofre Personal (Espacio Privado)</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong>Acceso:</strong> Inicio de sesión con usuario y contraseña o en 1 clic con cuenta de Google.</ListItem>
                    <ListItem><strong>Privacidad:</strong> Tu cofre es totalmente privado. Las tarjetas muestran fecha, recuento de figuras y vista previa.</ListItem>
                    <ListItem><strong>Versionado:</strong> Posibilidad de actualizar proyectos existentes o guardar nuevas versiones independientes.</ListItem>
                </ul>

                <SubTitle>Galería Pública Comunitaria</SubTitle>
                <Para>
                    Explora diseños compartidos por la comunidad, busca proyectos por título o autor, ábrelos en el editor y publica tus propias obras.
                </Para>

                <SubTitle>Células y Grupos (Educación y Equipos)</SubTitle>
                <Para>
                    Diseñado para clases de informática, talleres de diseño y equipos de trabajo:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong>Crear célula:</strong> El docente crea una célula con nombre de grupo y contraseña.</ListItem>
                    <ListItem><strong>Revisión sencilla:</strong> Los alumnos envían sus dibujos a la célula común, donde el docente puede abrirlos y evaluar el código Tkinter generado.</ListItem>
                </ul>
            </section>

            {/* 9. COMENTARIOS */}
            <section>
                <SectionTitle id="feedback">9. Comentarios</SectionTitle>
                <Para>
                    ¡Mejoramos Veretka continuamente y valoramos tus sugerencias! Envía propuestas de funciones o reporta problemas desde <Key>Ayuda</Key> → <Key>Enviar comentarios</Key>.
                </Para>
                <Para>
                    Para agilizar el diagnóstico, el formulario adjunta automáticamente datos técnicos del entorno (versión del editor, sistema operativo y navegador). No se transmite ningún dato personal ni confidencial.
                </Para>
            </section>

            {/* 10. ATAJOS DE TECLADO */}
            <section>
                <SectionTitle id="hotkeys">10. Atajos de teclado</SectionTitle>
                <Para>Utiliza estos atajos de teclado en computadoras de escritorio para trabajar a la máxima velocidad:</Para>

                <SubTitle>Archivos e Historial</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Ctrl+S</Key> — Guardar proyecto.</ListItem>
                    <ListItem><Key>Ctrl+Z</Key> — Deshacer última acción.</ListItem>
                    <ListItem><Key>Ctrl+Y</Key> o <Key>Ctrl+Shift+Z</Key> — Rehacer acción.</ListItem>
                </ul>

                <SubTitle>Herramientas y Manipulación</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>V</Key> — Herramienta Selección.</ListItem>
                    <ListItem><Key>A</Key> — Herramienta Editor de Nodos.</ListItem>
                    <ListItem><Key>Ctrl+G</Key> — Agrupar objetos seleccionados.</ListItem>
                    <ListItem><Key>Ctrl+Shift+G</Key> — Desagrupar.</ListItem>
                    <ListItem><Key>Ctrl+D</Key> — Duplicar objeto seleccionado.</ListItem>
                    <ListItem><Key>Ctrl+H</Key> — Voltear horizontalmente.</ListItem>
                    <ListItem><Key>Ctrl+V</Key> — Voltear verticalmente.</ListItem>
                    <ListItem><Key>Supr</Key> / <Key>Retroceso</Key> — Eliminar objeto o nodo seleccionado.</ListItem>
                </ul>

                <SubTitle>Desplazamiento Fino con Teclado (Nudging)</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Flechas</Key> — Mover el objeto seleccionado exactamente 1 píxel.</ListItem>
                    <ListItem><Key>Shift + Flechas</Key> — Mover el objeto 10 píxeles.</ListItem>
                    <ListItem><Key>Alt + Flechas</Key> — Mover sin alineación magnética (Snapping).</ListItem>
                </ul>

                <SubTitle>Navegación y Control del Lienzo</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Rueda del ratón</Key> — Zoom centrado en la posición del cursor.</ListItem>
                    <ListItem><Key>Botón central (o Espacio + Clic)</Key> — Desplazar el lienzo (Pan).</ListItem>
                    <ListItem><Key>F11</Key> — Entrar / salir del modo pantalla completa.</ListItem>
                    <ListItem><Key>Escape (Esc)</Key> — Cancelar trazado, deseleccionar o cerrar ventanas modales.</ListItem>
                    <ListItem><Key>?</Key> — Abrir ventana de resumen de atajos.</ListItem>
                </ul>
            </section>
        </>
    );
};
