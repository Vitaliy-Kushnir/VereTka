import React from 'react';
import { HelpComponents } from './HelpContentUK';

export const HelpContentEN: React.FC<HelpComponents> = ({ SectionTitle, SubTitle, Para, Key, ListItem }) => {
    return (
        <>
            <section>
                <SectionTitle id="intro">1. Introduction</SectionTitle>
                <Para>
                    <strong className="text-[var(--text-primary)]">VereTka</strong> is a simple web tool designed for visual creation of graphic elements and automatic generation of code for the Tkinter library in Python. The editor serves as a bridge between design and development, allowing you to quickly prototype, create complex scenes, and get clean, ready-to-use code.
                </Para>
                <Para>
                    This guide will help you master all the features of the editor, from basic operations to advanced techniques.
                </Para>
            </section>

            <section>
                <SectionTitle id="interface">2. Interface Overview</SectionTitle>
                <Para>The editor's interface is logically divided into functional zones for maximum convenience:</Para>
                <ul className="list-decimal list-inside space-y-3 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Main Menu:</strong> Located at the top, provides access to global operations: file management (<Key>File</Key>), edit history and clipboard (<Key>Edit</Key>), object operations (<Key>Object</Key>), visibility settings (<Key>View</Key>), and help information (<Key>Help</Key>). On the right side of the menu are buttons for quick theme switching, entering fullscreen mode, and opening settings.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Toolbars:</strong>
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li><strong>Top Panel:</strong> A dynamic panel showing settings for the active tool (e.g., fill color for a rectangle) or properties of the selected object. This allows quick parameter changes without using the right panel.</li>
                            <li><strong>Left Panel:</strong> The main set of tools for creating shapes. Grouped by type: primitives, lines and curves, polygons, etc.</li>
                        </ul>
                    </ListItem>
                     <ListItem>
                        <strong className="text-[var(--text-primary)]">Workspace (Canvas):</strong> The central area where you draw and edit objects. The canvas has a customizable size and background color. Rulers can be displayed around it for precise positioning. At over 1000% zoom, an additional, lighter 1-pixel grid appears for ultra-precise alignment.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Tkinter Code Panel:</strong> Located on the left below the toolbar. It displays real-time Python code corresponding to your drawing (when using the local generator). It features buttons for copying, previewing, and updating code.
                    </ListItem>
                     <ListItem>
                        <strong className="text-[var(--text-primary)]">Right Panels (Objects and Properties):</strong>
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li><strong>Objects List:</strong> A hierarchical list of all shapes on the canvas. Here you can change their order (layers), rename, hide, and lock them.</li>
                            <li><strong>Property Editor:</strong> A detailed panel for configuring parameters of the selected object: coordinates, dimensions, colors, stroke width, specific attributes (e.g., number of sides for a polygon), and nodes for paths.</li>
                        </ul>
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Status Bar:</strong> The bottom panel displaying current zoom level and cursor coordinates. On the left is a checkbox to toggle coordinates displaying right next to the mouse cursor on the canvas. Click the zoom percentage value to manually input an exact value.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Help Window:</strong> Has its own controls in the header: a search field and a zoom slider for font size (from 75% to 200%). For convenience, the small letter 'A' decreases and the large 'A' increases the zoom by 5%. Clicking the percentage value instantly resets the zoom to 100%.
                    </ListItem>
                </ul>
                <SubTitle>Fullscreen Mode</SubTitle>
                <Para>
                    For maximum immersion, you can enable fullscreen mode via the menu <Key>View</Key> → <Key>Fullscreen Mode</Key> or by pressing <Key>F11</Key>. This hides the browser interface, providing more creative space.
                </Para>
                <Para>
                    To exit this mode, press <Key>F11</Key> again. The <Key>Escape (Esc)</Key> key is completely blocked in fullscreen mode to prevent accidental exit.
                </Para>
            </section>

            <section>
                <SectionTitle id="projects">3. Projects</SectionTitle>
                <SubTitle>Creating a New Project</SubTitle>
                <Para>
                    Create a new project via <Key>File</Key> → <Key>New Project...</Key> or from the home screen. Set the name, dimensions, background color, and the Tkinter Canvas variable name.
                </Para>
                <SubTitle>Saving and Loading</SubTitle>
                <Para>
                    Projects are saved in <Key>.vec.json</Key> format – a text file containing complete object data, canvas, and interface settings.
                </Para>
                 <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <Key>Save</Key> (<Key>Ctrl+S</Key>): Saves current changes to the opened file. Opens "Save As..." if it's a new project.
                    </ListItem>
                    <ListItem>
                        <Key>Save As...</Key>: Saves the project to a new file, possibly with a different name.
                    </ListItem>
                     <ListItem>
                        <Key>Load Project...</Key>: Opens a dialog to select and load a <Key>.vec.json</Key> file.
                    </ListItem>
                </ul>
                <Para>
                    The editor also maintains a list of recent projects on the home screen for quick access.
                </Para>
                <SubTitle>Returning to the Active Project</SubTitle>
                <Para>
                    If you return to the home screen without saving, your work is not deleted. A <strong className="text-[var(--text-primary)]">Return to Project</strong> button allows you to instantly resume editing.
                </Para>
                <SubTitle>Autosave and Recovery</SubTitle>
                <Para>
                    To prevent data loss, the editor autosaves every 2 minutes if there are unsaved changes. This backup is stored locally.
                </Para>
                <Para>
                    If you accidentally close the tab, a banner on the next launch will prompt you to restore the autosaved session.
                </Para>
                <Para>
                    The autosave is deleted after a successful manual save, creating a new project, or clearing the canvas.
                </Para>
            </section>

            <section>
                <SectionTitle id="templates">4. Templates</SectionTitle>
                <SubTitle>Purpose and Benefits</SubTitle>
                <Para>
                    Templates save the complete state of a project: canvas dimensions, background color, grid settings, and all drawn objects.
                </Para>
                <Para>Using templates is useful if you:</Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>Often create projects with the same canvas settings.</ListItem>
                    <ListItem>Want a starter set of objects (e.g., logo, frame, grid).</ListItem>
                    <ListItem>Develop a series of illustrations in a unified style.</ListItem>
                </ul>
                <SubTitle>Creation and Usage</SubTitle>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Creation:</strong> Setup your canvas. Go to <Key>File</Key> → <Key>Save As Template...</Key>. Name it and save.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Usage:</strong> When creating a new project, select a template from the "Create from:" dropdown.
                    </ListItem>
                </ol>
                <SubTitle>Managing Templates</SubTitle>
                <Para>
                    Manage templates in <Key>Settings</Key> under the <Key>Templates</Key> tab. Here you can rename or delete them.
                </Para>
                <SubTitle>Where are templates stored?</SubTitle>
                 <Para>
                    Templates are stored locally in your browser using <Key>localStorage</Key>.
                </Para>
                 <Para>
                    <strong className="text-[var(--destructive-text)]">Warning:</strong> Clearing site data (cache, cookies) will delete your templates.
                </Para>
            </section>

            <section>
                <SectionTitle id="shapes">5. Objects</SectionTitle>
                <SubTitle>Creating Objects</SubTitle>
                <Para>
                    Select a tool and click on the canvas. Drag to set the size. Tools like <Key>Polyline</Key> and <Key>Bezier Curve</Key> require consecutive clicks to add nodes.
                </Para>
                <Para>
                    <strong className="text-[var(--text-primary)]">Tip:</strong> Hold <Key>Shift</Key> to draw shapes with equal width and height (e.g., square or circle).
                </Para>
                <SubTitle>Selection and Transformation</SubTitle>
                <Para>
                    Use the <Key>Select</Key> tool to select objects. A bounding box with handles will appear.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>Drag handles to resize. Corner handles maintain proportions if <Key>Shift</Key> is held.</ListItem>
                    <ListItem>Hover slightly outside a corner to rotate the object.</ListItem>
                    <ListItem><Key>Shift + Click</Key> selects multiple objects for bulk moving.</ListItem>
                </ul>
                <SubTitle>Editing Nodes</SubTitle>
                <Para>
                    The <Key>Edit Points</Key> tool allows modification of individual nodes.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Move point:</strong> Drag any white node.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Bezier control points:</strong> Curve nodes display pink control handles with square markers. Drag these to change curvature.</ListItem>
                </ul>
                <Para>
                    The <Key>Edit</Key> panel in the right sidebar allows precise coordinate input for each node and deletion of points.
                </Para>
            </section>

            <section>
                <SectionTitle id="code-export">6. Code & Export</SectionTitle>
                <SubTitle>Code Generation</SubTitle>
                <Para>
                    Code generation happens automatically in the "Tkinter Code" panel using the local generator.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Local Generator (Default):</strong> Fast, offline, works instantly. Recommended for almost all tasks.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Gemini API:</strong> AI-powered generation requiring an API key. Slower but can understand complex intents. (Configured in Settings)</ListItem>
                </ul>
                <SubTitle>Export Options</SubTitle>
                <Para>
                    Via <Key>File</Key> → <Key>Export As...</Key>, you can export your canvas to:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>PNG Image:</Key> High-quality raster image with transparent background.</ListItem>
                    <ListItem><Key>SVG Vector:</Key> Scalable vector graphics layout.</ListItem>
                    <ListItem><Key>Python Code:</Key> Saves the generated Tkinter code as a <Key>.py</Key> file.</ListItem>
                </ul>
            </section>

            <section>
                <SectionTitle id="feedback">7. Feedback</SectionTitle>
                <Para>
                    Help improve VereTka! If you encounter a bug or have ideas, use <Key>Help</Key> → <Key>Send Feedback</Key>. This opens an email dialogue to directly contact the author.
                </Para>
            </section>

            <section>
                <SectionTitle id="hotkeys">8. Hotkeys</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-secondary)]">
                        <h4 className="font-medium text-[var(--text-primary)] mb-2">General</h4>
                        <ul className="space-y-1 text-sm">
                            <li><Key>Ctrl + Z</Key> : Undo</li>
                            <li><Key>Ctrl + Shift + Z</Key> : Redo</li>
                            <li><Key>Ctrl + S</Key> : Save</li>
                            <li><Key>Delete</Key> | <Key>Backspace</Key> : Delete Selected</li>
                            <li><Key>Ctrl + D</Key> : Duplicate</li>
                            <li><Key>Ctrl + A</Key> : Select All</li>
                            <li><Key>F11</Key> : Fullscreen</li>
                        </ul>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-secondary)]">
                        <h4 className="font-medium text-[var(--text-primary)] mb-2">Tools</h4>
                        <ul className="space-y-1 text-sm">
                            <li><Key>V</Key> : Select</li>
                            <li><Key>A</Key> : Edit Points</li>
                            <li><Key>R</Key> : Rectangle</li>
                            <li><Key>C</Key> : Circle</li>
                            <li><Key>E</Key> : Ellipse</li>
                            <li><Key>L</Key> : Line</li>
                            <li><Key>T</Key> : Text</li>
                        </ul>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-secondary)]">
                        <h4 className="font-medium text-[var(--text-primary)] mb-2">Drawing</h4>
                        <ul className="space-y-1 text-sm">
                            <li><Key>Shift</Key> (hold) : Proportional draw</li>
                            <li><Key>Alt</Key> (hold) : Draw from center</li>
                        </ul>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-secondary)]">
                        <h4 className="font-medium text-[var(--text-primary)] mb-2">View</h4>
                        <ul className="space-y-1 text-sm">
                            <li><Key>Space</Key> (hold) : Pan canvas</li>
                            <li><Key>Wheel</Key> : Scroll Y</li>
                            <li><Key>Shift + Wheel</Key> : Scroll X</li>
                            <li><Key>Ctrl + Wheel</Key> : Zoom</li>
                            <li><Key>Ctrl + 0</Key> : Fit canvas</li>
                        </ul>
                    </div>
                </div>
            </section>
        </>
    );
};
