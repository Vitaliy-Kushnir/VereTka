import React from 'react';
import { HelpComponents } from './HelpContentUK';

export const HelpContentIT: React.FC<HelpComponents> = ({ SectionTitle, SubTitle, Para, Key, ListItem }) => {
    return (
        <>
            {/* 1. INTRODUZIONE */}
            <section>
                <SectionTitle id="intro">1. Introduzione</SectionTitle>
                <Para>
                    <strong className="text-[var(--text-primary)]">Veretka</strong> è un editor di grafica vettoriale web avanzato e intuitivo, sviluppato appositamente per la progettazione visiva di interfacce, illustrazioni vettoriali e la generazione automatica di codice Python pulito e ottimizzato per la libreria <Key>Tkinter</Key>.
                </Para>
                <Para>
                    L'editor funge da ponte perfetto tra il design grafico e la programmazione: mentre disegni forme sull'area di lavoro interattiva, l'applicazione genera istantaneamente uno script Python pronto all'uso, sia sul tuo computer sia in ambienti web Python.
                </Para>
                <Para>
                    Questo manuale illustra tutte le potenzialità di Veretka: dalle forme geometriche di base ai gesti touch su tablet e smartphone, dalla lente di precisione al joystick virtuale fino alla collaborazione nel cloud.
                </Para>
            </section>

            {/* 2. PANORAMICA DELL'INTERFACCIA */}
            <section>
                <SectionTitle id="interface">2. Panoramica dell’interfaccia</SectionTitle>
                <Para>L'interfaccia dell'editor è strutturata con cura per postazioni desktop e dispositivi touch portatili:</Para>
                <ul className="list-decimal list-inside space-y-3 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Menu Principale (Barra Superiore):</strong> Accesso a tutti i comandi globali:
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li><Key>File</Key> — Crea nuovi progetti, apri, salva, esporta immagini (PNG, JPEG, SVG), pubblica nel cloud e importa immagini di riferimento.</li>
                            <li><Key>Modifica</Key> — Annulla (<Key>Ctrl+Z</Key>) e Ripeti (<Key>Ctrl+Y</Key>), taglia, copia, incolla, seleziona tutto e cronologia modifiche.</li>
                            <li><Key>Oggetto</Key> — Raggruppa, separa, ordine dei livelli, riflessione, allineamento e distribuzione lungo un tracciato.</li>
                            <li><Key>Visualizza</Key> — Righelli, griglia, guide magnetiche (Snapping), allineatore laser e modalità a schermo intero.</li>
                            <li><Key>Aiuto</Key> — Apri questo manuale, elenco tasti rapidi e modulo di feedback.</li>
                        </ul>
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Barra degli Strumenti (Sinistra / In basso su mobile):</strong> Strumento Selezione (<Key>V</Key>), Modifica Nodi (<Key>A</Key>), forme geometriche (rettangolo, cerchio/ellisse, triangolo, stella, poligono), linee, curve di Bézier, testo e contagocce.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Barra delle Proprietà Dinamica (In alto):</strong> Mostra automaticamente le impostazioni dello strumento o dell'oggetto attivo: colore di riempimento, colore del tratto, spessore, stile tratteggio, raggio degli angoli e modalità di disegno (da angolo o dal centro).
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Area di Lavoro (Canvas):</strong> La superficie centrale di disegno con zoom fluido, panoramica e allineamento intelligente. Superando il 1000% di zoom si attiva automaticamente una microgriglia di 1 pixel per la massima precisione.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Pannello del Codice Tkinter:</strong> Situato sotto la barra strumenti di sinistra (o in un cassetto a scomparsa sui tablet). Mostra il codice Python in tempo reale con evidenziazione della sintassi, copia con un clic, download ed esecuzione diretta negli interpreti online.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Albero dei Livelli e degli Oggetti (Destra):</strong> Struttura ad albero per riordinare i livelli tramite trascinamento (Drag-and-Drop), rinominare, bloccare le modifiche e nascondere la visibilità.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Barra di Stato (In basso):</strong> Mostra il livello di zoom attuale, le coordinate del cursore, l'interruttore HUD per le coordinate fluttuanti e il pulsante di messa a fuoco rapida.
                    </ListItem>
                </ul>

                <SubTitle>Modalità Schermo Intero</SubTitle>
                <Para>
                    Per eliminare qualsiasi distrazione dal browser, attiva la visualizzazione a schermo intero tramite <Key>Visualizza</Key> → <Key>Schermo intero</Key> o premendo <Key>F11</Key>. Premi nuovamente <Key>F11</Key> per uscire.
                </Para>
            </section>

            {/* 3. LAVORARE CON I PROGETTI */}
            <section>
                <SectionTitle id="projects">3. Lavorare con i progetti</SectionTitle>
                <SubTitle>Creare un nuovo progetto</SubTitle>
                <Para>
                    Inizia un nuovo progetto tramite <Key>File</Key> → <Key>Nuovo progetto...</Key> o dalla schermata iniziale. Imposta titolo, dimensioni in pixel, colore di sfondo e nome della variabile Canvas di Python.
                </Para>
                <SubTitle>Salvare e Aprire (.vec.json)</SubTitle>
                <Para>
                    Il formato proprietario <Key>.vec.json</Key> è un file JSON strutturato e compatto che contiene tutte le forme, i livelli, le impostazioni della griglia e le immagini di riferimento incorporate.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Salva</Key> (<Key>Ctrl+S</Key>) — Salva le modifiche attuali nel file del progetto.</ListItem>
                    <ListItem><Key>Salva con nome...</Key> — Crea una copia con un nuovo nome.</ListItem>
                    <ListItem><Key>Apri progetto...</Key> — Carica qualsiasi file <Key>.vec.json</Key> salvato in precedenza.</ListItem>
                </ul>
                <SubTitle>Salvataggio Automatico e Ripristino Sessione</SubTitle>
                <Para>
                    Veretka garantisce una protezione multilivello contro la chiusura accidentale della scheda:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Autosalvataggio in background:</strong> Lo stato del disegno viene registrato ogni 2 minuti nel <Key>localStorage</Key> del browser. In caso di interruzione, un banner all'avvio consentirà il ripristino istantaneo in un clic.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">«Torna al progetto» nella Home:</strong> Se torni alla schermata iniziale o alla galleria, la tua sessione di lavoro rimane attiva e pronta all'uso.
                    </ListItem>
                </ul>
            </section>

            {/* 4. LAVORARE CON I MODELLI */}
            <section>
                <SectionTitle id="templates">4. Lavorare con i modelli</SectionTitle>
                <SubTitle>Scopo dei modelli</SubTitle>
                <Para>
                    I modelli memorizzano dimensioni dell'area di lavoro, palette di colori, griglie guida e forme di partenza (cornici di layout, assi cartesiani o loghi).
                </Para>
                <SubTitle>Creare e utilizzare modelli</SubTitle>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <ListItem>
                        Componi il tuo layout di base sulla tela e scegli <Key>File</Key> → <Key>Salva come modello...</Key>.
                    </ListItem>
                    <ListItem>
                        Inserisci un nome descrittivo (es. «Campo di gioco 800x600» o «Scheda prodotto»).
                    </ListItem>
                    <ListItem>
                        Nei progetti successivi, seleziona il tuo modello dall'elenco «Crea da modello».
                    </ListItem>
                </ol>
                <Para>
                    Gestisci i tuoi modelli (rinomina o elimina) in <Key>Impostazioni</Key> nella scheda <Key>Modelli</Key>.
                </Para>
            </section>

            {/* 5. LAVORARE CON LE FORME */}
            <section>
                <SectionTitle id="shapes">5. Lavorare con le forme</SectionTitle>
                <SubTitle>Disegno e Selezione</SubTitle>
                <Para>
                    Scegli uno strumento dalla barra, quindi fai clic e trascina sull'area di lavoro per impostare le dimensioni della forma.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>Tieni premuto <Key>Shift</Key> mentre disegni rettangoli o ellissi per bloccare la proporzione 1:1 (quadrato / cerchio).</ListItem>
                    <ListItem>Tieni premuto <Key>Alt</Key> per costruire la forma a partire dal suo centro invece che dall'angolo.</ListItem>
                    <ListItem>Lo strumento <Key>Seleziona</Key> (<Key>V</Key>) mostra le maniglie di trasformazione per scalare e ruotare gli elementi.</ListItem>
                </ul>

                <SubTitle>Modifica dei Nodi (Tracciati Vettoriali)</SubTitle>
                <Para>
                    Lo strumento <Key>Modifica Nodi</Key> (<Key>A</Key>) offre il pieno controllo sulle curve di Bézier, linee e poligoni: spostamento dei punti di ancoraggio, gestione delle maniglie tangenti, aggiunta di nodi con un clic sulla linea ed eliminazione con <Key>Canc</Key>.
                </Para>

                <SubTitle>Distribuisci lungo un tracciato (Distribute along Path)</SubTitle>
                <Para>
                    Disponi una serie di oggetti in modo uniforme lungo il perimetro di un'altra forma o curva guida:
                </Para>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <ListItem>Seleziona gli oggetti da distribuire insieme alla curva di riferimento.</ListItem>
                    <ListItem>Nel menu <Key>Oggetto</Key>, scegli <Key>Distribuisci lungo il tracciato</Key>.</ListItem>
                    <ListItem>Scegli l'orientamento: <strong>Radiale</strong> (verso l'esterno dal centro), <strong>Tangenziale</strong> (seguendo la pendenza della curva) o <strong>Parallelo</strong> (angolo fisso).</ListItem>
                </ol>

                <SubTitle>Raggruppamento, Allineamento e Riflessione</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Ctrl+G</Key> — Raggruppa gli oggetti selezionati (doppio clic per modificare gli elementi all'interno del gruppo).</ListItem>
                    <ListItem><Key>Ctrl+Shift+G</Key> — Separa gli oggetti.</ListItem>
                    <ListItem><Key>Ctrl+H</Key> / <Key>Ctrl+V</Key> — Rifletti orizzontalmente o verticalmente.</ListItem>
                    <ListItem>I pulsanti di allineamento nella barra superiore allineano lungo i bordi, al centro o distribuiscono uniformemente.</ListItem>
                </ul>

                <SubTitle>Palette e Libreria Colori Tkinter</SubTitle>
                <Para>
                    Supporta codici HEX, RGB e un catalogo di oltre 700 colori con nome ufficiali Tkinter. I nomi di sistema vengono convertiti automaticamente per una corrispondenza visiva esatta tra il web e la finestra Tkinter.
                </Para>

                <SubTitle>Importazione Immagini per Ricalco</SubTitle>
                <Para>
                    Tramite <Key>File</Key> → <Key>Importa immagine...</Key>, carica bozze o immagini PNG/JPEG come sfondo per il ricalco vettoriale manuale.
                </Para>
            </section>

            {/* 6. SCHERMI TOUCH, LENTE E JOYSTICK */}
            <section>
                <SectionTitle id="touch-mobile">6. Schermi touch, Lente e Joystick</SectionTitle>
                <Para>
                    Veretka è pienamente ottimizzato per dispositivi mobili, tablet con pennino (iPad Apple Pencil, tablet Android) e touchscreen. Modalità touch dedicate e assistenti di precisione rendono il disegno fluido su qualsiasi schermo.
                </Para>

                <SubTitle>Gesti Multi-Touch sull'Area di Lavoro</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Pinch-to-Zoom (Pizzico a due dita):</strong> Allontana o avvicina due dita per variare lo zoom dal 10% fino al 3000%.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Panoramica a due dita (Two-Finger Pan):</strong> Trascina con due dita per scorrere la tela in qualunque direzione senza disegnare o spostare forme per errore.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Un solo dito (Tocca e Trascina):</strong> Seleziona forme, disegna nuovi elementi o sposta oggetti.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Pressione prolungata (Long-Press):</strong> Tieni premuto su un oggetto per aprire il menu contestuale (Copia, Elimina, Porta in primo piano, Rifletti).
                    </ListItem>
                </ul>

                <SubTitle>Barra Mobile e Cassetti a Scomparsa</SubTitle>
                <Para>
                    Sullo smartphone, l'interfaccia si adatta all'uso comodo con il pollice:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Barra inferiore mobile:</strong> Accesso rapido agli strumenti di disegno, selettore colori, annulla/ripeti e widget di precisione.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Cassetti scorrevoli (Drawers):</strong> L'albero dei livelli, le proprietà degli oggetti e il codice Tkinter si aprono in pratici cassetti senza ostacolare la visuale.</ListItem>
                </ul>

                <SubTitle>Lente d'Ingrandimento di Precisione (Precision Loupe)</SubTitle>
                <Para>
                    Quando si disegna con le dita, il dito stesso copre il punto esatto di contatto. La lente di precisione Veretka risolve brillantemente questo problema:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Offset tattile (Touch Offset):</strong> La lente proietta l'immagine ingrandita 60–90 pixel sopra il punto di contatto del dito.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Mirino & HUD Coordinate:</strong> Mostra un mirino ad alto contrasto con le coordinate pixel X/Y in tempo reale.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Blocca lente (Pin):</strong> Fissa la lente in un angolo dello schermo per monitorare i dettagli in modo continuativo.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Blocca fotogramma (Freeze):</strong> Metti in pausa l'ingrandimento per esaminare con calma nodi e curvature complesse.
                    </ListItem>
                </ul>

                <SubTitle>Joystick Virtuale di Precisione (Controllo Nudge)</SubTitle>
                <Para>
                    Per regolazioni al millimetro di forme o singoli nodi su schermi touch:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Stick analogico touch:</strong> Muovi gli oggetti selezionati inclinando lo stick. La velocità si adatta all'inclinazione.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Pulsanti a passi (1px e 10px):</strong> Tasti freccia per spostare di esattamente 1 pixel (micro-passo) o 10 pixel (passo grande).
                    </ListItem>
                </ul>

                <SubTitle>Cronologia delle Modifiche (History Popover)</SubTitle>
                <Para>
                    Tenendo premuto a lungo sui pulsanti <Key>Annulla</Key> o <Key>Ripeti</Key> si apre una cronologia visiva completa. Puoi visualizzare l'elenco degli stati precedenti con orario e saltare a qualunque fase con un solo tocco.
                </Para>
            </section>

            {/* 7. CODIFICA ED ESPORTAZIONE */}
            <section>
                <SectionTitle id="code-export">7. Codifica ed esportazione</SectionTitle>
                <SubTitle>Generazione Codice Python Tkinter</SubTitle>
                <Para>
                    L'editor converte automaticamente ogni elemento grafico nelle corrispondenti chiamate del Canvas Tkinter (<Key>create_rectangle</Key>, <Key>create_oval</Key>, <Key>create_polygon</Key>, <Key>create_line</Key>, <Key>create_text</Key>, ecc.).
                </Para>
                <Para>
                    Il codice finale è un programma Python autosufficiente completo di inizializzazione della finestra (<Key>tk.Tk()</Key>), layout e ciclo degli eventi (<Key>mainloop()</Key>).
                </Para>
                <SubTitle>Esecuzione Immediata Online</SubTitle>
                <Para>
                    Fai clic su <Key>Esegui in ЄPython</Key> nel pannello del codice per testare subito il tuo disegno nel browser senza installare Python in locale.
                </Para>
                <Para>
                    Se il progetto contiene moltissime forme che superano il limite dell'URL, il codice completo viene copiato automaticamente negli appunti e si apre l'ambiente per incollarlo (<Key>Ctrl+V</Key>).
                </Para>
                <SubTitle>Salvataggio File ed Esportazione Immagini</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Salva script:</strong> Scarica come file eseguibile <Key>.py</Key> o <Key>.txt</Key> con numeri di riga opzionali.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Vettoriale SVG:</strong> Esportazione SVG pulita per flussi di grafica professionale.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Raster PNG / JPEG:</strong> Esportazione ad alta risoluzione con moltiplicatori di scala (1x, 2x, 4x Retina) e controllo di qualità.</ListItem>
                </ul>
            </section>

            {/* 8. ARCHIVIAZIONE CLOUD E GALLERIA */}
            <section>
                <SectionTitle id="cloud-storage">8. Archiviazione Cloud e Galleria</SectionTitle>
                <SubTitle>Panoramica della Piattaforma Cloud</SubTitle>
                <Para>
                    Salva i tuoi progetti al sicuro nel cloud, aprili da qualsiasi computer o tablet, condividi le tue opere nella Galleria Pubblica e collabora all'interno delle Celle di gruppo.
                </Para>
                <SubTitle>Scrigno Personale (Spazio Privato)</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong>Accesso:</strong> Accesso con nome utente e password oppure con 1 clic tramite account Google.</ListItem>
                    <ListItem><strong>Riservatezza:</strong> Il tuo scrigno è accessibile solo a te. Le schede progetto mostrano data, numero di elementi e anteprima.</ListItem>
                    <ListItem><strong>Versionamento:</strong> Possibilità di aggiornare il progetto esistente o salvare una nuova versione separata.</ListItem>
                </ul>

                <SubTitle>Galleria Pubblica della Community</SubTitle>
                <Para>
                    Esplora i progetti condivisi dalla community, cerca per titolo o autore, apri i disegni nell'editor per studio e pubblica le tue creazioni.
                </Para>

                <SubTitle>Celle e Gruppi (Scuole e Team)</SubTitle>
                <Para>
                    Pensato per lezioni di informatica, laboratori di grafica e team di progettazione:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong>Crea cella:</strong> Il docente crea una cella specificando nome del gruppo e password.</ListItem>
                    <ListItem><strong>Revisione semplice:</strong> Gli studenti inviano i loro elaborati nella cella comune, dove il docente può aprirli e verificare il codice Tkinter generato.</ListItem>
                </ul>
            </section>

            {/* 9. FEEDBACK */}
            <section>
                <SectionTitle id="feedback">9. Feedback</SectionTitle>
                <Para>
                    Miglioriamo costantemente Veretka e accogliamo con piacere i vostri suggerimenti! Invia proposte di funzioni o segnala problemi tramite <Key>Aiuto</Key> → <Key>Invia feedback</Key>.
                </Para>
                <Para>
                    Per facilitare la diagnosi, il modulo include automaticamente dati tecnici dell'ambiente (versione dell'editor, sistema operativo e browser). Nessun file personale o riservato viene trasmesso.
                </Para>
            </section>

            {/* 10. TASTI DI SCELTA RAPIDA */}
            <section>
                <SectionTitle id="hotkeys">10. Tasti di scelta rapida</SectionTitle>
                <Para>Utilizza queste combinazioni su computer desktop per la massima produttività:</Para>

                <SubTitle>File e Cronologia</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Ctrl+S</Key> — Salva progetto.</ListItem>
                    <ListItem><Key>Ctrl+Z</Key> — Annulla ultima azione.</ListItem>
                    <ListItem><Key>Ctrl+Y</Key> o <Key>Ctrl+Shift+Z</Key> — Ripeti azione.</ListItem>
                </ul>

                <SubTitle>Strumenti e Manipolazione</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>V</Key> — Strumento Selezione.</ListItem>
                    <ListItem><Key>A</Key> — Strumento Modifica Nodi.</ListItem>
                    <ListItem><Key>Ctrl+G</Key> — Raggruppa oggetti selezionati.</ListItem>
                    <ListItem><Key>Ctrl+Shift+G</Key> — Separa.</ListItem>
                    <ListItem><Key>Ctrl+D</Key> — Duplica oggetto selezionato.</ListItem>
                    <ListItem><Key>Ctrl+H</Key> — Rifletti orizzontalmente.</ListItem>
                    <ListItem><Key>Ctrl+V</Key> — Rifletti verticalmente.</ListItem>
                    <ListItem><Key>Canc</Key> / <Key>Backspace</Key> — Elimina oggetto o nodo selezionato.</ListItem>
                </ul>

                <SubTitle>Spostamento Preciso da Tastiera (Nudging)</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Tasti freccia</Key> — Sposta l'oggetto selezionato esattamente di 1 pixel.</ListItem>
                    <ListItem><Key>Shift + Tasti freccia</Key> — Sposta l'oggetto di 10 pixel.</ListItem>
                    <ListItem><Key>Alt + Tasti freccia</Key> — Sposta senza allineamento magnetico (Snapping).</ListItem>
                </ul>

                <SubTitle>Navigazione e Controllo Canvas</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Rotellina del mouse</Key> — Zoom centrato sulla posizione del cursore.</ListItem>
                    <ListItem><Key>Pulsante centrale (o Spazio + Clic sinistro)</Key> — Sposta la tela (Pan).</ListItem>
                    <ListItem><Key>F11</Key> — Attiva / disattiva schermo intero.</ListItem>
                    <ListItem><Key>Escape (Esc)</Key> — Annulla il disegno in corso, deseleziona o chiudi finestre modali.</ListItem>
                    <ListItem><Key>?</Key> — Apri panoramica di tutte le scorciatoie.</ListItem>
                </ul>
            </section>
        </>
    );
};
