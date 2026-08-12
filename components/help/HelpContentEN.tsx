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
            
                <SubTitle>Grouping Objects</SubTitle>
                <Para>
                    You can combine multiple shapes into a <strong>Group</strong> for easier moving, scaling, and rotating as a single unit. 
                    To group objects, select them, right-click, and choose <Key>Group</Key> (or use the toolbar button or <Key>Ctrl+G</Key>). 
                    To ungroup, select the group and choose <Key>Ungroup</Key> (<Key>Ctrl+Shift+G</Key>). 
                    Double-clicking on a group allows you to enter it to edit individual elements.
                </Para>
                <SubTitle>Alignment and Distribution</SubTitle>
                <Para>
                    The top toolbar provides functions to align selected objects (left/right edge, center, etc.). You can align objects <strong>relative to the selection</strong> or <strong>relative to the canvas</strong>.
                    <br/><br/>
                    <strong>Distribution:</strong> You can evenly distribute selected objects horizontally or vertically. <strong>Path Distribution</strong> is also available — a unique feature to place objects along another selected contour (line, curve, or any shape). 
                    During path distribution, you can adjust the orientation (radial, tangent, parallel) and the rotation angle of the objects.
                </Para>
                <SubTitle>Object List and Layers</SubTitle>
                <Para>
                    The right panel contains a list of all shapes on the canvas. You can rename shapes (double-click on the name), lock them (to prevent accidental changes), or hide them (toggle visibility).
                    <br/><br/>
                    The order in the list corresponds to the <strong>z-order (layers)</strong>: an object higher in the list will be drawn on top of those below it. Change the order by dragging shapes in the list.
                </Para>
                <SubTitle>Mirroring (Flip)</SubTitle>
                <Para>
                    Selected objects can be flipped horizontally or vertically using the buttons in the properties panel or the context menu. This allows you to easily create symmetrical drawings.
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
                <SectionTitle id="cloud-storage">8. Cloud Storage and Gallery</SectionTitle>
                <SubTitle>Capabilities Overview</SubTitle>
                <Para>
                    <strong className="text-[var(--text-primary)]">Cloud Storage and Gallery</strong> is an integrated online ecosystem that lets you store your projects online, access them from any device, share them in the public gallery, and collaborate in group workspaces (Cells/Groups).
                </Para>
                <Para>
                    You can open Cloud Storage in several ways:
                </Para>
                <ul className="list-disc list-inside space-y-1 pl-2">
                    <ListItem>From the main menu: <Key>File</Key> → <Key>Publish to Cloud...</Key></ListItem>
                    <ListItem>Click the <Key>Gallery & Storage</Key> button on the top toolbar.</ListItem>
                    <ListItem>Click the <Key>Cloud Gallery</Key> button on the Welcome Screen.</ListItem>
                </ul>

                <SubTitle>Personal Chest (Workspace)</SubTitle>
                <Para>
                    Your <strong className="text-[var(--text-primary)]">Chest</strong> is your private personal storage. Projects saved in your Chest are visible only to you.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Access & Protection:</strong> Sign in with your unique Nickname and Password or via your Google account.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Saving & Opening:</strong> Save vector drawings under any name. Preview cards display project metadata (creation date, shape count). Click any card to load the project directly into the editor.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Version Control:</strong> When re-saving, you can either update the existing project or publish it as a new distinct copy.
                    </ListItem>
                </ul>

                <SubTitle>Public Gallery</SubTitle>
                <Para>
                    The <strong className="text-[var(--text-primary)]">Public Gallery</strong> is a community showcase accessible to all Veretka users.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Explore & Open:</strong> Browse public creations, search by title or author, and load projects into your editor to study or customize them.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Publishing:</strong> Share your artwork with the community to inspire others!
                    </ListItem>
                </ul>

                <SubTitle>Cells & Groups (Education & Teams)</SubTitle>
                <Para>
                    <strong className="text-[var(--text-primary)]">Cells / Groups</strong> are dedicated workspaces for classrooms, study clubs, design teams, or workshops.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Creating a Cell:</strong> An instructor or team lead can create a group workspace with a custom name, rules, and password.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Joining:</strong> Members simply enter the group name and password to join the shared room.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Group Gallery:</strong> All projects submitted to the group appear on a shared board, making it easy for instructors to inspect and review student assignments.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Cell Rules:</strong> Group creators can enforce versioning rules (e.g., allow updating existing files or require new version copies) to maintain author rights and project order.
                    </ListItem>
                </ul>

                <SubTitle>Publishing & Updating Projects</SubTitle>
                <Para>
                    When publishing a project, choose your target destination (Public Gallery, Personal Chest, or Group Cell). If a duplicate name is detected, you can either overwrite the project with an updated version or publish a separate version copy.
                </Para>
            </section>

                        <section>
                <SectionTitle id="hotkeys">9. Hotkeys</SectionTitle>
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
            </section>
        </>
    );
};
