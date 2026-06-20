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
                <SectionTitle id="hotkeys">8. Atajos de Teclado</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-secondary)]">
                        <h4 className="font-medium text-[var(--text-primary)] mb-2">Comunes</h4>
                        <ul className="space-y-1 text-sm">
                            <li><Key>Ctrl + Z</Key> : Deshacer</li>
                            <li><Key>Ctrl + Shift + Z</Key> : Rehacer</li>
                            <li><Key>Ctrl + S</Key> : Guardar</li>
                            <li><Key>Suprimir / Del</Key> : Borrar Objeto</li>
                            <li><Key>Ctrl + D</Key> : Duplicar</li>
                        </ul>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-secondary)]">
                        <h4 className="font-medium text-[var(--text-primary)] mb-2">Herramientas</h4>
                        <ul className="space-y-1 text-sm">
                            <li><Key>V</Key> : Cursor</li>
                            <li><Key>A</Key> : Puntos</li>
                            <li><Key>R</Key> : Rectángulo</li>
                            <li><Key>C</Key> : Círculo</li>
                            <li><Key>T</Key> : Texto</li>
                        </ul>
                    </div>
                </div>
            </section>
        </>
    );
};
