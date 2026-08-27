import React from 'react';
import { HelpComponents } from './HelpContentUK';

export const HelpContentEN: React.FC<HelpComponents> = ({ SectionTitle, SubTitle, Para, Key, ListItem }) => {
    return (
        <>
            {/* 1. INTRODUCTION */}
            <section>
                <SectionTitle id="intro">1. Introduction</SectionTitle>
                <Para>
                    <strong className="text-[var(--text-primary)]">Veretka</strong> is a powerful yet intuitive web-based vector graphics editor designed specifically for visual UI design, vector illustration, and automatic generation of clean, production-ready Python code for the <Key>Tkinter</Key> library.
                </Para>
                <Para>
                    The editor bridges graphic design and programming: as you draw shapes on the interactive canvas, the application instantly outputs an optimized, self-contained Python script ready to run locally or in online web Python environments.
                </Para>
                <Para>
                    This manual covers all features of Veretka: from basic vector primitives to touch screen & tablet gestures, precision loupe and virtual joystick controls, and cloud collaboration.
                </Para>
            </section>

            {/* 2. INTERFACE OVERVIEW */}
            <section>
                <SectionTitle id="interface">2. Interface Overview</SectionTitle>
                <Para>The editor interface is carefully designed for both desktop workstations and mobile touch devices:</Para>
                <ul className="list-decimal list-inside space-y-3 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Main Menu (Top Bar):</strong> Access all global commands:
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li><Key>File</Key> — Create new projects, open, save, export images (PNG, JPEG, SVG), publish to cloud, and import background reference images.</li>
                            <li><Key>Edit</Key> — Undo (<Key>Ctrl+Z</Key>) and Redo (<Key>Ctrl+Y</Key>), cut, copy, paste, select all, and history timeline.</li>
                            <li><Key>Object</Key> — Grouping, ungrouping, layer ordering, flipping, alignment, and distribute along path.</li>
                            <li><Key>View</Key> — Toggle rulers, grid, smart snapping guides, laser level, and full screen mode.</li>
                            <li><Key>Help</Key> — Open this manual, hotkeys cheatsheet, and feedback form.</li>
                        </ul>
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Toolbox (Left Toolbar / Bottom Bar on Mobile):</strong> Select tool (<Key>V</Key>), Node Editor (<Key>A</Key>), geometric primitives (rectangle, circle/ellipse, triangle, star, polygon), lines, Bezier curves, text, and color dropper.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Dynamic Property Bar (Top):</strong> Automatically displays settings for the active tool or selected object: fill color, stroke color, stroke width, dash style, corner radius, and drawing mode (corner vs center).
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Canvas Workspace:</strong> The central drawing area. Supports smooth zoom, pan, and smart alignment. When zooming in past 1000%, a high-precision 1px pixel grid is automatically activated.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Tkinter Code Panel:</strong> Located under the left toolbar (or in a sliding drawer on tablets). Shows real-time formatted Python code with syntax highlighting, one-click copy, file export, and instant launch in online interpreters.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Layers & Object Tree (Right Panel):</strong> Tree view for easy Drag-and-Drop layer reordering, renaming, locking against accidental edits, and toggling visibility.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Status Bar (Bottom):</strong> Displays current zoom level, cursor coordinates, floating coordinate HUD toggle, and quick focus button.
                    </ListItem>
                </ul>

                <SubTitle>Full Screen Mode</SubTitle>
                <Para>
                    To eliminate browser clutter and maximize your creative workspace, toggle Full Screen via <Key>View</Key> → <Key>Full Screen</Key> or press <Key>F11</Key>. Press <Key>F11</Key> again to exit.
                </Para>
            </section>

            {/* 3. WORKING WITH PROJECTS */}
            <section>
                <SectionTitle id="projects">3. Working with Projects</SectionTitle>
                <SubTitle>Creating a New Project</SubTitle>
                <Para>
                    Start a new project via <Key>File</Key> → <Key>New Project...</Key> or from the welcome screen. Configure project title, canvas dimensions in pixels, background color, and the Python Canvas variable name.
                </Para>
                <SubTitle>Saving and Opening (.vec.json)</SubTitle>
                <Para>
                    The native <Key>.vec.json</Key> format is a structured, lightweight JSON file containing all shapes, layers, grid settings, and embedded reference images.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Save</Key> (<Key>Ctrl+S</Key>) — Saves current work to the project file.</ListItem>
                    <ListItem><Key>Save As...</Key> — Creates a separate file with a new name.</ListItem>
                    <ListItem><Key>Open Project...</Key> — Loads any previously saved <Key>.vec.json</Key> file.</ListItem>
                </ul>
                <SubTitle>Auto-Save and Session Recovery</SubTitle>
                <Para>
                    Veretka features multi-layered data protection against unexpected browser closes or crashes:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Background Auto-Save:</strong> Every 2 minutes your canvas state is saved to browser <Key>localStorage</Key>. If your tab is closed, a recovery banner will offer instant one-click restoration on your next visit.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">"Return to Project" on Home Screen:</strong> If you navigate back to the home screen or gallery, your work-in-progress remains active and ready to resume immediately.
                    </ListItem>
                </ul>
            </section>

            {/* 4. WORKING WITH TEMPLATES */}
            <section>
                <SectionTitle id="templates">4. Working with Templates</SectionTitle>
                <SubTitle>Purpose of Templates</SubTitle>
                <Para>
                    Templates store canvas dimensions, color palettes, guide grids, and starter shapes (such as UI framing, coordinate systems, or company branding).
                </Para>
                <SubTitle>Creating and Using Templates</SubTitle>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <ListItem>
                        Design your base layout on the canvas and choose <Key>File</Key> → <Key>Save as Template...</Key>.
                    </ListItem>
                    <ListItem>
                        Enter a descriptive name (e.g., "Game Board 800x600" or "Mobile App Card").
                    </ListItem>
                    <ListItem>
                        When creating future projects, select your template from the "Start from Template" list.
                    </ListItem>
                </ol>
                <Para>
                    Manage saved templates (rename or delete) under <Key>Settings</Key> on the <Key>Templates</Key> tab.
                </Para>
            </section>

            {/* 5. WORKING WITH SHAPES */}
            <section>
                <SectionTitle id="shapes">5. Working with Shapes</SectionTitle>
                <SubTitle>Drawing and Selecting</SubTitle>
                <Para>
                    Pick a tool from the toolbox, then click and drag on the canvas to define shape dimensions.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>Hold <Key>Shift</Key> while drawing rectangles or ellipses to constrain proportions to a perfect 1:1 square or circle.</ListItem>
                    <ListItem>Hold <Key>Alt</Key> to draw shapes originating from their center rather than corner.</ListItem>
                    <ListItem>The <Key>Select</Key> tool (<Key>V</Key>) displays bounding box handles for resizing and rotation.</ListItem>
                </ul>

                <SubTitle>Node Editing (Vector Paths)</SubTitle>
                <Para>
                    The <Key>Node Editor</Key> (<Key>A</Key>) provides fine vector control over Bezier curves, lines, and polygons: drag node points, manipulate tangent handles, add nodes by clicking on path segments, or delete nodes with <Key>Delete</Key>.
                </Para>

                <SubTitle>Distribute Along Path</SubTitle>
                <Para>
                    Arrange any set of objects evenly along the perimeter of another shape (line, curve, circle, or star):
                </Para>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <ListItem>Select the objects you want to arrange together with the guide curve.</ListItem>
                    <ListItem>In the <Key>Object</Key> menu, click <Key>Distribute along path</Key>.</ListItem>
                    <ListItem>Choose the orientation: <strong>Radial</strong> (pointing outward), <strong>Tangent</strong> (aligned with curve angle), or <strong>Parallel</strong> (fixed orientation).</ListItem>
                </ol>

                <SubTitle>Grouping, Alignment, and Flipping</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Ctrl+G</Key> — Group selected shapes. Double-click to edit shapes inside a group.</ListItem>
                    <ListItem><Key>Ctrl+Shift+G</Key> — Ungroup objects.</ListItem>
                    <ListItem><Key>Ctrl+H</Key> / <Key>Ctrl+V</Key> — Flip horizontally or vertically.</ListItem>
                    <ListItem>Alignment buttons on the top bar align objects by edges, centers, or evenly distribute them across selection or canvas.</ListItem>
                </ul>

                <SubTitle>Tkinter Color Palette & Library</SubTitle>
                <Para>
                    Includes support for HEX color codes, RGB, and a catalog of over 700 standard Tkinter color names. System color names are automatically verified and mapped for exact visual parity between the web canvas and Python runtime.
                </Para>

                <SubTitle>Image Tracing Support</SubTitle>
                <Para>
                    Via <Key>File</Key> → <Key>Import Image...</Key>, import PNG/JPEG sketches as reference backdrops for manual tracing or visual alignment.
                </Para>
            </section>

            {/* 6. TOUCH SCREENS, LOUPE & JOYSTICK */}
            <section>
                <SectionTitle id="touch-mobile">6. Touch screens, Loupe & Joystick</SectionTitle>
                <Para>
                    Veretka is fully optimized for mobile devices, tablets with styluses (iPad Apple Pencil, Android tablets), and touchscreens. Dedicated mobile touch modes and precision assistants make vector design smooth on any screen size.
                </Para>

                <SubTitle>Multi-touch Gestures on Canvas</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Pinch-to-Zoom:</strong> Pinch with two fingers to smoothly scale the canvas from 10% up to 3000%.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Two-Finger Pan:</strong> Drag with two fingers to glide across the canvas in any direction without accidentally drawing or moving shapes.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Single Finger (Tap & Drag):</strong> Select shapes, draw new vector primitives, or move elements.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Long-Press:</strong> Press and hold on an object to trigger the context menu (Copy, Delete, Bring to Front, Flip).
                    </ListItem>
                </ul>

                <SubTitle>Mobile Bottom Bar and Drawer Panels</SubTitle>
                <Para>
                    On smartphone screens, the UI shifts to thumb-friendly bottom-anchored controls:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Mobile Bottom Toolbar:</strong> Rapid access to tools, color palette, undo/redo, and precision widgets.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Sliding Drawers:</strong> Layers tree, shape properties, and Tkinter code pop up in clean drawers from the bottom or side without blocking canvas view.</ListItem>
                </ul>

                <SubTitle>Precision Loupe (Touch Magnifier)</SubTitle>
                <Para>
                    Drawing with fingers can obstruct the exact touch point. The Veretka Precision Loupe eliminates this obstacle:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Touch Offset:</strong> The loupe projects a magnified view 60–90 pixels above your finger contact point so you always see exactly what you are drawing.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Crosshair & Pixel HUD:</strong> Displays a high-contrast crosshair with live X/Y pixel coordinates of the active point.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Pin Loupe:</strong> Click the pin icon to anchor the magnifier in a chosen screen corner for continuous monitoring.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Freeze Frame:</strong> Pause the magnifier to inspect intricate node clusters and curve curvatures calmly.
                    </ListItem>
                </ul>

                <SubTitle>Virtual Precision Joystick (Nudge Control)</SubTitle>
                <Para>
                    For pixel-perfect adjustments on touch screens without finger jitter:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Analog Touch Stick:</strong> Drag the thumb stick to move selected shapes or vector nodes with speed proportional to displacement.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Step Buttons (1px and 10px):</strong> Discrete directional arrow buttons to nudge shapes by exactly 1px (micro-step) or 10px (large step).
                    </ListItem>
                </ul>

                <SubTitle>History Timeline Popover</SubTitle>
                <Para>
                    Long-press on the <Key>Undo</Key> or <Key>Redo</Key> buttons (or select from the Edit menu) to open a full visual timeline of edits. View time-stamped action names and jump to any previous or future state in a single tap.
                </Para>
            </section>

            {/* 7. CODE AND EXPORT */}
            <section>
                <SectionTitle id="code-export">7. Code and Export</SectionTitle>
                <SubTitle>Python Tkinter Code Generation</SubTitle>
                <Para>
                    The editor automatically translates every shape into standard Tkinter Canvas calls (<Key>create_rectangle</Key>, <Key>create_oval</Key>, <Key>create_polygon</Key>, <Key>create_line</Key>, <Key>create_text</Key>, etc.).
                </Para>
                <Para>
                    The output code is a complete, self-contained Python program with window initialization (<Key>tk.Tk()</Key>), canvas layout, and event loop (<Key>mainloop()</Key>).
                </Para>
                <SubTitle>Run in Online Interpreter</SubTitle>
                <Para>
                    Click <Key>Run in ЄPython</Key> on the code panel to test your canvas script immediately in an online browser environment without installing Python locally.
                </Para>
                <Para>
                    If the project contains a large number of shapes exceeding URL limits, the app automatically copies the code to your clipboard and opens the runner window for instant pasting (<Key>Ctrl+V</Key>).
                </Para>
                <SubTitle>File Saving and Image Export</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Save Script:</strong> Download as executable <Key>.py</Key> or formatted <Key>.txt</Key> with optional line numbers.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Vector SVG:</strong> Clean SVG export for vector design workflows.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Raster PNG / JPEG:</strong> High-resolution raster export with scale multipliers (1x, 2x, 4x Retina) and quality controls.</ListItem>
                </ul>
            </section>

            {/* 8. CLOUD STORAGE AND GALLERY */}
            <section>
                <SectionTitle id="cloud-storage">8. Cloud Storage and Gallery</SectionTitle>
                <SubTitle>Cloud Platform Overview</SubTitle>
                <Para>
                    Store projects securely in the cloud, access them from any computer or tablet, share creations in the Public Gallery, and collaborate within Group Cells.
                </Para>
                <SubTitle>Personal Locker (Private Workspace)</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong>Authentication:</strong> Sign in with username and password or one-click Google account.</ListItem>
                    <ListItem><strong>Privacy:</strong> Your locker is completely private. Project cards show date, element count, and thumbnail preview.</ListItem>
                    <ListItem><strong>Versioning:</strong> Option to update existing projects or save distinct new versions.</ListItem>
                </ul>

                <SubTitle>Public Community Gallery</SubTitle>
                <Para>
                    Explore shared community artworks, search projects by title or author, open them in the editor for study, and publish your own designs.
                </Para>

                <SubTitle>Group Cells (Classrooms & Teams)</SubTitle>
                <Para>
                    Tailored for computer science classes, design workshops, and collaborative teams:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong>Create Cell:</strong> Instructors create a cell with group name and password.</ListItem>
                    <ListItem><strong>Seamless Review:</strong> Students publish assignments into the shared cell where instructors can open, review, and evaluate the generated Tkinter code.</ListItem>
                </ul>
            </section>

            {/* 9. FEEDBACK */}
            <section>
                <SectionTitle id="feedback">9. Feedback</SectionTitle>
                <Para>
                    We continuously improve Veretka and welcome your suggestions! Send feature requests or report issues via <Key>Help</Key> → <Key>Send Feedback</Key>.
                </Para>
                <Para>
                    To speed up diagnostics, the form automatically attaches technical environment details (editor version, operating system, and browser version). No personal or confidential files are transmitted.
                </Para>
            </section>

            {/* 10. HOTKEYS */}
            <section>
                <SectionTitle id="hotkeys">10. Hotkeys</SectionTitle>
                <Para>Use these keyboard shortcuts on desktop computers for maximum efficiency:</Para>

                <SubTitle>File & History</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Ctrl+S</Key> — Save project.</ListItem>
                    <ListItem><Key>Ctrl+Z</Key> — Undo last action.</ListItem>
                    <ListItem><Key>Ctrl+Y</Key> or <Key>Ctrl+Shift+Z</Key> — Redo action.</ListItem>
                </ul>

                <SubTitle>Tools & Manipulation</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>V</Key> — Select tool.</ListItem>
                    <ListItem><Key>A</Key> — Node Editor tool.</ListItem>
                    <ListItem><Key>Ctrl+G</Key> — Group selected objects.</ListItem>
                    <ListItem><Key>Ctrl+Shift+G</Key> — Ungroup.</ListItem>
                    <ListItem><Key>Ctrl+D</Key> — Duplicate selected object.</ListItem>
                    <ListItem><Key>Ctrl+H</Key> — Flip horizontally.</ListItem>
                    <ListItem><Key>Ctrl+V</Key> — Flip vertically.</ListItem>
                    <ListItem><Key>Delete</Key> / <Key>Backspace</Key> — Delete selected object or node.</ListItem>
                </ul>

                <SubTitle>Keyboard Nudging</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Arrow Keys</Key> — Move selected object by 1 pixel.</ListItem>
                    <ListItem><Key>Shift + Arrow Keys</Key> — Move object by 10 pixels.</ListItem>
                    <ListItem><Key>Alt + Arrow Keys</Key> — Move without snapping.</ListItem>
                </ul>

                <SubTitle>Navigation & Canvas Controls</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Mouse Wheel</Key> — Zoom canvas at cursor position.</ListItem>
                    <ListItem><Key>Middle Click (or Space + Left Click)</Key> — Pan canvas.</ListItem>
                    <ListItem><Key>F11</Key> — Toggle Full Screen mode.</ListItem>
                    <ListItem><Key>Escape (Esc)</Key> — Cancel current draw, deselect, or close modal dialogs.</ListItem>
                    <ListItem><Key>?</Key> — Open shortcuts reference modal.</ListItem>
                </ul>
            </section>
        </>
    );
};
