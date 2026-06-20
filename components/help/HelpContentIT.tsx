import React from 'react';
import { HelpComponents } from './HelpContentUK';

export const HelpContentIT: React.FC<HelpComponents> = ({ SectionTitle, SubTitle, Para, Key, ListItem }) => {
    return (
        <>
            <section>
                <SectionTitle id="intro">1. Introduzione</SectionTitle>
                <Para>
                    <strong className="text-[var(--text-primary)]">VereTka</strong> è uno strumento web semplice progettato per la creazione visiva di elementi grafici e la generazione automatica di codice per la libreria Tkinter in Python. L'editor funge da ponte tra design e sviluppo, consentendo di prototipare rapidamente, creare scene complesse e ottenere codice pulito e pronto all'uso.
                </Para>
                <Para>
                    Questa guida ti aiuterà a padroneggiare tutte le funzionalità dell'editor, dalle operazioni di base alle tecniche avanzate.
                </Para>
            </section>

            <section>
                <SectionTitle id="interface">2. Panoramica dell'interfaccia</SectionTitle>
                <Para>L'interfaccia dell'editor è suddivisa logicamente in zone funzionali per la massima comodità:</Para>
                <ul className="list-decimal list-inside space-y-3 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Menu principale:</strong> Situato in alto, fornisce accesso alle operazioni globali: gestione dei file (<Key>File</Key>), cronologia modifiche e appunti (<Key>Modifica</Key>), operazioni sugli oggetti (<Key>Oggetto</Key>), impostazioni di visibilità (<Key>Visualizza</Key>) e informazioni di aiuto (<Key>Aiuto</Key>). Sul lato destro del menu ci sono pulsanti per il cambio rapido del tema, la modalità schermo intero e l'apertura delle impostazioni.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Barre degli strumenti:</strong>
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li><strong>Pannello superiore:</strong> Un pannello dinamico che mostra le impostazioni per lo strumento attivo (es. colore di riempimento) o le proprietà dell'oggetto selezionato.</li>
                            <li><strong>Pannello sinistro:</strong> Il set principale di strumenti per creare forme. Raggruppati per tipo: primitive, linee, poligoni, ecc.</li>
                        </ul>
                    </ListItem>
                     <ListItem>
                        <strong className="text-[var(--text-primary)]">Area di lavoro (Canvas):</strong> L'area centrale per disegnare e modificare. Il canvas ha dimensioni e colore di sfondo personalizzabili. I righelli possono essere visualizzati. A uno zoom superiore al 1000%, appare una griglia per l'allineamento ultra-preciso.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Pannello Codice Tkinter:</strong> Situato a sinistra. Mostra in tempo reale il codice Python (quando si usa il generatore locale). Contiene pulsanti per copiare, visualizzare in anteprima o aggiornare il codice.
                    </ListItem>
                     <ListItem>
                        <strong className="text-[var(--text-primary)]">Pannelli di destra (Oggetti e Proprietà):</strong>
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li><strong>Lista Oggetti:</strong> Un elenco gerarchico di tutte le forme. Qui puoi cambiarne l'ordine (livelli), rinominarle, nasconderle e bloccarle.</li>
                            <li><strong>Editor di Proprietà:</strong> Un pannello dettagliato per configurare i parametri dell'oggetto selezionato: coordinate, dimensioni, colori, spessore del tratto, attributi e nodi.</li>
                        </ul>
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Barra di stato:</strong> Il pannello inferiore che mostra il livello di zoom e le coordinate del cursore. A sinistra c'è una casella di controllo per attivare le coordinate visibili accanto al mouse. Clicca sulla percentuale di zoom per inserire un valore esatto.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Finestra di Aiuto:</strong> Ha propri controlli: un campo di ricerca o uno slider di zoom per la dimensione dei caratteri. Cliccando sulla percentuale ripristini rapidamente lo zoom.
                    </ListItem>
                </ul>
                <SubTitle>Modalità a Schermo Intero</SubTitle>
                <Para>
                    Per la massima immersione, puoi attivare la modalità a schermo intero tramite <Key>Visualizza</Key> → <Key>Schermo intero</Key> o premendo <Key>F11</Key>. 
                </Para>
            </section>

            <section>
                <SectionTitle id="projects">3. Progetti</SectionTitle>
                <SubTitle>Creare un Nuovo Progetto</SubTitle>
                <Para>
                    Crea un nuovo progetto tramite <Key>File</Key> → <Key>Nuovo Progetto...</Key>. Imposta nome, dimensioni, sfondo e nome della variabile Canvas.
                </Para>
                <SubTitle>Salvataggio e Caricamento</SubTitle>
                <Para>
                    I progetti vengono salvati in formato <Key>.vec.json</Key>.
                </Para>
                 <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Salva</Key> (<Key>Ctrl+S</Key>): Salva le modifiche al file aperto.</ListItem>
                    <ListItem><Key>Salva come...</Key>: Salva il progetto in un nuovo file.</ListItem>
                     <ListItem><Key>Carica Progetto...</Key>: Apre un file <Key>.vec.json</Key> esistente.</ListItem>
                </ul>
                <SubTitle>Ritorno al Progetto Attivo</SubTitle>
                <Para>
                    Se torni alla schermata iniziale senza salvare, puoi usare il pulsante <strong className="text-[var(--text-primary)]">Ritorna</strong> per riprendere dal tuo lavoro.
                </Para>
                <SubTitle>Salvataggio Automatico (Autosave)</SubTitle>
                <Para>
                    L'editor salva automaticamente ogni 2 minuti, conservando un backup locale, per evitare la perdita di dati.
                </Para>
            </section>

            <section>
                <SectionTitle id="templates">4. Modelli (Templates)</SectionTitle>
                <SubTitle>Scopo e Vantaggi</SubTitle>
                <Para>
                    I modelli salvano lo stato completo di un progetto: dimensioni, sfondo, griglia e forme. Utili per partire da basi preconfigurate.
                </Para>
                <SubTitle>Creazione e Utilizzo</SubTitle>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Creazione:</strong> Modifica dal <Key>File</Key> → <Key>Salva come Modello...</Key>.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Utilizzo:</strong> Durante la creazione di un progetto, selezionalo dal menu "Crea da:".</ListItem>
                </ol>
                <SubTitle>Gestione dei Modelli</SubTitle>
                <Para>
                    Gestiscili nelle <Key>Impostazioni</Key> nella scheda <Key>Modelli</Key>. Sono salvati nel tuo browser (localStorage). <strong className="text-[var(--destructive-text)]">Attenzione:</strong> La pulizia della cache del browser eliminerà i modelli.
                </Para>
            </section>

            <section>
                <SectionTitle id="shapes">5. Oggetti</SectionTitle>
                <SubTitle>Creare Oggetti</SubTitle>
                <Para>
                    Seleziona uno strumento e clicca sul canvas. Trascina per ridimensionare. Tieni premuto <Key>Shift</Key> per disegnare in modo proporzionale.
                </Para>
                <SubTitle>Selezione e Trasformazione</SubTitle>
                <Para>
                    Usa <Key>Seleziona</Key>. Comparirà un riquadro con le maniglie.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>Trascina i bordi per ridimensionare. Tieni <Key>Shift</Key> per mantenere la proporzione.</ListItem>
                    <ListItem>Passa con il mouse vicino agli angoli per ruotare.</ListItem>
                    <ListItem><Key>Shift + Clic</Key> seleziona elementi multipli.</ListItem>
                </ul>
                <SubTitle>Modificare Nodi</SubTitle>
                <Para>
                    Usa lo strumento <Key>Modifica Punti</Key> per alterare i vertici individuali e visualizzare i punti di controllo Bezier. Usa la lista laterale per eliminare punti specifici o cambiarne le coordinate col mouse.
                </Para>
            </section>

            <section>
                <SectionTitle id="code-export">6. Codice ed Esportazione</SectionTitle>
                <SubTitle>Generazione del Codice</SubTitle>
                <Para>
                    Il codice Tkinter viene generato istantaneamente dal Generatore Locale per velocizzare lo sviluppo. L'API Gemini è opzionale per casi spinti dall'IA.
                </Para>
                <SubTitle>Opzioni di Esportazione</SubTitle>
                <Para>
                    Tramite <Key>File</Key> → <Key>Esporta come...</Key>:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Immagine PNG</Key> ad alta risoluzione con sfondo trasparente.</ListItem>
                    <ListItem><Key>Vettore SVG</Key> per ridimensionare al massimo livello.</ListItem>
                    <ListItem><Key>Codice Python (.py)</Key> contenente la programmazione Tkinter.</ListItem>
                </ul>
            </section>

            <section>
                <SectionTitle id="feedback">7. Feedback</SectionTitle>
                <Para>
                    Aiuta a migliorare VereTka! Se trovi un bug, usa <Key>Aiuto</Key> → <Key>Invia feedback</Key>.
                </Para>
            </section>

            <section>
                <SectionTitle id="hotkeys">8. Scorciatoie da tastiera</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-secondary)]">
                        <h4 className="font-medium text-[var(--text-primary)] mb-2">Generali</h4>
                        <ul className="space-y-1 text-sm">
                            <li><Key>Ctrl + Z</Key> : Annulla</li>
                            <li><Key>Ctrl + Shift + Z</Key> : Ripeti</li>
                            <li><Key>Ctrl + S</Key> : Salva</li>
                            <li><Key>Canc</Key> | <Key>Backspace</Key> : Elimina selezione</li>
                            <li><Key>Ctrl + D</Key> : Duplica</li>
                            <li><Key>Ctrl + A</Key> : Seleziona Tutto</li>
                            <li><Key>F11</Key> : Schermo Intero</li>
                        </ul>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-secondary)]">
                        <h4 className="font-medium text-[var(--text-primary)] mb-2">Strumenti</h4>
                        <ul className="space-y-1 text-sm">
                            <li><Key>V</Key> : Seleziona</li>
                            <li><Key>A</Key> : Modifica Punti</li>
                            <li><Key>R</Key> : Rettangolo</li>
                            <li><Key>C</Key> : Cerchio</li>
                            <li><Key>L</Key> : Linea</li>
                            <li><Key>T</Key> : Testo</li>
                        </ul>
                    </div>
                </div>
            </section>
        </>
    );
};
