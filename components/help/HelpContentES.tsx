import React from 'react';
import { HelpComponents } from './HelpContentUK';

export const HelpContentES: React.FC<HelpComponents> = ({ SectionTitle, SubTitle, Para, Key, ListItem }) => {
    return (
        <>
            <section>
                <SectionTitle id="intro">1. Introducción</SectionTitle>
                <Para>
                    <strong className="text-[var(--text-primary)]">VereTka</strong> es una herramienta web simple diseñada para la creación visual de elementos gráficos y la generación automática de código para la biblioteca Tkinter en Python. El editor sirve como un puente entre el diseño y el desarrollo, permitiendo hacer prototipos rápidamente, crear escenas complejas y obtener código limpio y listo para usar.
                </Para>
                <Para>
                    Esta guía te ayudará a dominar todas las funciones del editor, desde operaciones básicas hasta técnicas avanzadas.
                </Para>
            </section>

                        <section>
                <SectionTitle id="interface">2. Resumen de la Interfaz</SectionTitle>
                <Para>La interfaz del editor está lógicamente dividida en zonas funcionales para mayor comodidad:</Para>
                <ul className="list-decimal list-inside space-y-3 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Menú Principal:</strong> Ubicado en la parte superior, proporciona acceso a operaciones globales: gestión de archivos (<Key>Archivo</Key>), historial y portapapeles (<Key>Editar</Key>), operaciones de objetos (<Key>Objeto</Key>), vistas (<Key>Ver</Key>) y ayuda (<Key>Ayuda</Key>). A su derecha, controles para temas, pantalla completa y configuración.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Barras de Herramientas:</strong>
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li><strong>Panel Superior:</strong> Panel dinámico que muestra configuraciones de la herramienta activa (ej. color de relleno) o propiedades del objeto.</li>
                            <li><strong>Panel Izquierdo:</strong> Conjunto principal de herramientas para crear formas (primitivas, curvas, polígonos, etc.).</li>
                        </ul>
                    </ListItem>
                     <ListItem>
                        <strong className="text-[var(--text-primary)]">Área de trabajo (Lienzo/Canvas):</strong> El área central donde dibujas y editas. Tamaño y color de fondo son personalizables. Se pueden activar reglas y, con mucho zoom, una cuadrícula milimétrica.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Panel de Código Tkinter:</strong> Situado a la izquierda. Muestra código Python en tiempo real correspondiente a tu dibujo. Tiene botones de vista previa, copia y regeneración.
                    </ListItem>
                     <ListItem>
                        <strong className="text-[var(--text-primary)]">Paneles Derechos (Objetos y Propiedades):</strong>
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li><strong>Lista de Objetos:</strong> Lista jerárquica de formas. Modifica su orden de capas, nómbralos, bloquéalos o escóndelos.</li>
                            <li><strong>Editor de Propiedades:</strong> Panel detallado para configurar parámetros precisos (coordenadas, color, estilo de trazo, curvas, etc.).</li>
                        </ul>
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Barra de Estado:</strong> En la base, muestra el nivel de zoom y coordenadas del cursor.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Ventana de Ayuda:</strong> Posee su propio control de zoom (letras 'A') y barra de búsqueda.
                    </ListItem>
                </ul>
                <SubTitle>Modo Pantalla Completa</SubTitle>
                <Para>
                    Para máxima inmersión, puedes habilitar pantalla completa desde el menú <Key>Ver</Key> → <Key>Pantalla Completa</Key> o presionando <Key>F11</Key>. 
                </Para>
            </section>

                        <section>
                <SectionTitle id="projects">3. Proyectos</SectionTitle>
                <SubTitle>Creando un Proyecto Nuevo</SubTitle>
                <Para>
                    Crea un proyecto vía <Key>Archivo</Key> → <Key>Nuevo Proyecto...</Key>. Configura título, medidas y nombre de la variable de Tkinter.
                </Para>
                <SubTitle>Guardar y Cargar</SubTitle>
                <Para>
                    Los proyectos se guardan en formato de archivo <Key>.vec.json</Key>.
                </Para>
                 <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Guardar</Key> (<Key>Ctrl+S</Key>): Guarda los cambios en el archivo activo.</ListItem>
                    <ListItem><Key>Guardar Como...</Key>: Selecciona un nuevo nombre al guardar.</ListItem>
                     <ListItem><Key>Cargar Proyecto...</Key>: Carga tu archivo <Key>.vec.json</Key> desde el disco.</ListItem>
                </ul>
                <SubTitle>Volver al Proyecto Activo</SubTitle>
                <Para>
                    Si vas a la página de bienvenida, el botón <strong className="text-[var(--text-primary)]">Volver</strong> del panel superior te retornará al progreso sin perderlo.
                </Para>
                <SubTitle>Autoguardado</SubTitle>
                <Para>
                    El editor se autoguarda cada 2 minutos en el navegador (localmente) para evitar pérdida de datos si hay errores.
                </Para>
            </section>

                        <section>
                <SectionTitle id="templates">4. Plantillas (Templates)</SectionTitle>
                <SubTitle>Propósito y Beneficios</SubTitle>
                <Para>
                    Guardan el estado de todo (fondo, objetos existentes, grilla) para iniciar más rápido proyectos estándar o colecciones afines.
                </Para>
                <SubTitle>Uso</SubTitle>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Crear:</strong> Define tu lienzo y haz clic en <Key>Archivo</Key> → <Key>Guardar como Plantilla...</Key>.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Usar:</strong> Al pedir Nuevo Proyecto, elige la plantilla desde el menú desplegable.</ListItem>
                </ol>
                <SubTitle>Dónde se Cuidan los Datos</SubTitle>
                <Para>
                    Están en el caché local del navegador (<Key>localStorage</Key>). <strong className="text-[var(--destructive-text)]">Aviso:</strong> Limpiar el caché/cookies borrará tus plantillas.
                </Para>
            </section>

                        <section>
                <SectionTitle id="shapes">5. Objetos</SectionTitle>
                <SubTitle>Dibujar Objetos</SubTitle>
                <Para>
                    Elige herramienta, haz clic y arrastra. Herramientas complejas como "Bezier" requieren clics seguidos para formar las coordenadas de los nodos. <Key>Shift</Key> traza medidas proporcionales.
                </Para>
                <SubTitle>Selección Temporal y Transformación</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>Arrastra del borde para alterar altura o ancho.</ListItem>
                    <ListItem>Posita el cursor apenas fuera del punto final para rotar la imagen.</ListItem>
                    <ListItem><Key>Shift + Clic</Key> agrupa las visualizaciones deseadas en tu cursor.</ListItem>
                </ul>
                <SubTitle>Edición de Nodos a Puntos</SubTitle>
                <Para>
                    Utiliza la herramienta de <Key>Editar Puntos</Key> para ver los marcadores sobre los que giran o se desplazan los rincones. Control de tiradores de las curvas bezier logran suavidades concretas en el diseño.
                </Para>
            
                <SubTitle>Agrupación de Objetos</SubTitle>
                <Para>
                    Puede combinar múltiples formas en un <strong>Grupo</strong> para mover, escalar y rotar más fácilmente como una sola unidad.
                    Para agrupar objetos, selecciónelos, haga clic derecho y elija <Key>Agrupar</Key> (o use el botón de la barra de herramientas o <Key>Ctrl+G</Key>).
                    Para desagrupar, seleccione el grupo y elija <Key>Desagrupar</Key> (<Key>Ctrl+Shift+G</Key>).
                    Hacer doble clic en un grupo le permite ingresar para editar elementos individuales.
                </Para>
                <SubTitle>Alineación y Distribución</SubTitle>
                <Para>
                    La barra de herramientas superior proporciona funciones para alinear objetos seleccionados (borde izquierdo/derecho, centro, etc.). Puede alinear objetos <strong>en relación con la selección</strong> o <strong>en relación con el lienzo</strong>.
                    <br/><br/>
                    <strong>Distribución:</strong> Puede distribuir uniformemente los objetos seleccionados horizontal o verticalmente. La <strong>Distribución de trayectos</strong> también está disponible, una característica única para colocar objetos a lo largo de otro contorno seleccionado (línea, curva o cualquier forma).
                    Durante la distribución de la ruta, puede ajustar la orientación (radial, tangente, paralela) y el ángulo de rotación de los objetos.
                </Para>
                <SubTitle>Lista de Objetos y Capas</SubTitle>
                <Para>
                    El panel derecho contiene una lista de todas las formas en el lienzo. Puede cambiar el nombre de las formas (doble clic en el nombre), bloquearlas (para evitar cambios accidentales) o eliminarlas.
                    <br/><br/>
                    El orden en la lista corresponde al <strong>orden z (capas)</strong>: un objeto más arriba en la lista se dibujará encima de los que están debajo. Cambie el orden arrastrando formas en la lista.
                </Para>
                <SubTitle>Duplicación (Voltear)</SubTitle>
                <Para>
                    Los objetos seleccionados se pueden voltear horizontal o verticalmente utilizando los botones en el panel de propiedades o el menú contextual. Esto le permite crear dibujos simétricos fácilmente.
                </Para>
</section>

                        <section>
                <SectionTitle id="code-export">6. Exportación de Código</SectionTitle>
                <SubTitle>Generación</SubTitle>
                <Para>
                    Se usa un Creador Local por defecto que formula texto python al instante (<Key>Recomendado</Key>). Puede elegirse Gemini AI mediante la configuración.
                </Para>
                <SubTitle>Alternativas Visuales</SubTitle>
                <Para>
                    Mediante <Key>Archivo</Key> → <Key>Exportar Como...</Key>:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Imágenes PNG</Key> transparente de alta gama y tamaño.</ListItem>
                    <ListItem><Key>Vectores SVG</Key>.</ListItem>
                    <ListItem><Key>Fuente Ejecutable Python</Key> para descargar rápidamente los imports y root.</ListItem>
                </ul>
            </section>

                        <section>
                <SectionTitle id="feedback">7. Comentarios y Errores</SectionTitle>
                <Para>
                    Usa <Key>Ayuda</Key> → <Key>Enviar Comentarios</Key> para reportar errores puntuales a través del formulario.
                </Para>
            </section>

                        <section>
                <SectionTitle id="cloud-storage">8. Almacenamiento Cloud y Galería</SectionTitle>
                <SubTitle>Resumen de Funcionalidades</SubTitle>
                <Para>
                    El <strong className="text-[var(--text-primary)]">Almacenamiento Cloud y Galería</strong> es un ecosistema en línea integrado que le permite guardar sus proyectos en la nube, acceder a ellos desde cualquier dispositivo, compartirlos en la galería pública y colaborar en espacios grupales (Células/Grupos).
                </Para>
                <Para>
                    Puede abrir el almacenamiento en la nube de varias maneras:
                </Para>
                <ul className="list-disc list-inside space-y-1 pl-2">
                    <ListItem>Desde el menú principal: <Key>Archivo</Key> → <Key>Publicar en la nube...</Key></ListItem>
                    <ListItem>Haga clic en el botón <Key>Galería y Almacenamiento</Key> en la barra de herramientas superior.</ListItem>
                    <ListItem>Haga clic en el botón <Key>Galería Cloud</Key> en la pantalla de bienvenida.</ListItem>
                </ul>

                <SubTitle>Cofre Personal (Espacio Privado)</SubTitle>
                <Para>
                    Su <strong className="text-[var(--text-primary)]">Cofre</strong> es su espacio personal privado. Los proyectos guardados en su Cofre solo son visibles para usted.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Acceso y Seguridad:</strong> Inicie sesión con su apodo y contraseña únicos o a través de su cuenta de Google.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Guardar y Abrir:</strong> Guarde dibujos vectoriales con cualquier nombre. Las tarjetas de vista previa muestran la fecha de creación y el número de formas. Haga clic en una tarjeta para cargar el proyecto instantáneamente en el editor.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Gestión de Versiones:</strong> Al volver a guardar, puede actualizar el proyecto existente o guardarlo como una nueva versión independiente.
                    </ListItem>
                </ul>

                <SubTitle>Galería Pública</SubTitle>
                <Para>
                    La <strong className="text-[var(--text-primary)]">Galería Pública</strong> es un catálogo compartido accesible para todos los usuarios de Veretka.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Explorar y Abrir:</strong> Explore creaciones públicas, busque por título o autor y abra proyectos en su editor para estudiarlos o personalizarlos.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Publicación:</strong> ¡Comparta sus obras con la comunidad para inspirar a otros usuarios!
                    </ListItem>
                </ul>

                <SubTitle>Células y Grupos (Educación y Trabajo en Equipo)</SubTitle>
                <Para>
                    Las <strong className="text-[var(--text-primary)]">Células / Grupos</strong> son espacios dedicados para aulas, talleres, equipos de diseño o grupos de estudio.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Crear una Célula:</strong> Un profesor o líder de equipo puede crear un nuevo espacio de trabajo definiendo su nombre, reglas y contraseña de acceso.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Unirse:</strong> Los miembros solo necesitan ingresar el nombre del grupo y la contraseña para acceder al espacio compartido.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Galería de Grupo:</strong> Todos los proyectos enviados al grupo se muestran en un panel compartido, lo que facilita a los profesores revisar las tareas enviadas.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Reglas de la Célula:</strong> El creador del grupo puede establecer reglas de versión para mantener los derechos de autor y el orden de los proyectos.
                    </ListItem>
                </ul>

                <SubTitle>Publicación y Actualización de Proyectos</SubTitle>
                <Para>
                    Al enviar un dibujo a la nube, elija el destino (Galería Pública, Cofre Personal o Célula de Grupo). Si se detecta un nombre duplicado, el sistema le permitirá elegir si desea actualizar el proyecto existente o publicar una copia independiente.
                </Para>
            </section>

                        <section>
                <SectionTitle id="hotkeys">9. Teclas de Atajo</SectionTitle>
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
            </section>
        </>
    );
};
