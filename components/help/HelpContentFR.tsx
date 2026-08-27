import React from 'react';
import { HelpComponents } from './HelpContentUK';

export const HelpContentFR: React.FC<HelpComponents> = ({ SectionTitle, SubTitle, Para, Key, ListItem }) => {
    return (
        <>
            {/* 1. INTRODUCTION */}
            <section>
                <SectionTitle id="intro">1. Introduction</SectionTitle>
                <Para>
                    <strong className="text-[var(--text-primary)]">Veretka</strong> est un éditeur de graphisme vectoriel en ligne, performant et intuitif, spécialement conçu pour la conception visuelle d'interfaces, les illustrations vectorielles et la génération automatique de code Python propre pour la bibliothèque <Key>Tkinter</Key>.
                </Para>
                <Para>
                    L'éditeur fait le pont entre le design graphique et la programmation : pendant que vous dessinez des formes sur la zone de travail interactive, l'application génère instantanément un script Python optimisé et autonome, prêt à être exécuté sur votre machine ou dans un environnement Python web.
                </Para>
                <Para>
                    Ce manuel couvre toutes les fonctionnalités de Veretka : des formes vectorielles de base aux gestes tactiles sur tablettes, en passant par la loupe de précision, le joystick virtuel et le travail collaboratif sur le cloud.
                </Para>
            </section>

            {/* 2. PRÉSENTATION DE L'INTERFACE */}
            <section>
                <SectionTitle id="interface">2. Présentation de l’interface</SectionTitle>
                <Para>L'interface a été minutieusement pensée pour les postes de travail de bureau ainsi que pour les appareils mobiles tactiles :</Para>
                <ul className="list-decimal list-inside space-y-3 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Menu Principal (Barre Supérieure) :</strong> Accès à toutes les fonctions globales :
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li><Key>Fichier</Key> — Créer des projets, ouvrir, enregistrer, exporter des images (PNG, JPEG, SVG), publier sur le cloud et importer des images de référence.</li>
                            <li><Key>Édition</Key> — Annuler (<Key>Ctrl+Z</Key>) et Rétablir (<Key>Ctrl+Y</Key>), couper, copier, coller, tout sélectionner et chronologie de l'historique.</li>
                            <li><Key>Objet</Key> — Grouper, dégrouper, ordre des calques, retournement, alignement et répartition le long d'un tracé.</li>
                            <li><Key>Affichage</Key> — Règles, grille, guides magnétiques (Snapping), niveau laser et mode plein écran.</li>
                            <li><Key>Aide</Key> — Consulter ce manuel, le tableau des raccourcis et le formulaire de commentaires.</li>
                        </ul>
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Boîte à outils (Barre Gauche / Basse sur mobile) :</strong> Outil de sélection (<Key>V</Key>), Éditeur de nœuds (<Key>A</Key>), primitives géométriques (rectangle, cercle/ellipse, triangle, étoile, polygone), lignes, courbes de Bézier, texte et pipette.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Barre de propriétés dynamique (Haut) :</strong> Affiche automatiquement les options de l'outil ou de l'objet actif : couleur de remplissage, couleur du contour, épaisseur du trait, style de tirets, rayon des angles et mode de tracé (depuis le coin ou le centre).
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Zone de travail (Canvas) :</strong> Espace central de dessin avec zoom fluide, panoramique et alignement intelligent. Au-delà de 1000% de zoom, une micro-grille de 1 pixel s'active automatiquement pour une précision chirurgicale.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Panneau de code Tkinter :</strong> Situé sous la boîte à outils de gauche (ou dans un tiroir rétractable sur tablette). Affiche le code Python en temps réel avec coloration syntaxique, copie en un clic, export de fichier et lancement immédiat dans des interpréteurs en ligne.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Arborescence des calques et objets (Droite) :</strong> Vue arborescente pour réorganiser les calques par glisser-déposer, renommer, verrouiller contre les modifications accidentelles et masquer la visibilité.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Barre d'état (Bas) :</strong> Indique le niveau de zoom actuel, les coordonnées du curseur, le bouton HUD de coordonnées flottantes et le centrage rapide sur la sélection.
                    </ListItem>
                </ul>

                <SubTitle>Mode Plein Écran</SubTitle>
                <Para>
                    Pour une immersion totale sans encombrement de navigateur, activez le mode plein écran via <Key>Affichage</Key> → <Key>Plein écran</Key> ou avec <Key>F11</Key>. Réappuyez sur <Key>F11</Key> pour quitter.
                </Para>
            </section>

            {/* 3. TRAVAILLER AVEC DES PROJETS */}
            <section>
                <SectionTitle id="projects">3. Travailler avec des projets</SectionTitle>
                <SubTitle>Créer un nouveau projet</SubTitle>
                <Para>
                    Démarrez un projet via <Key>Fichier</Key> → <Key>Nouveau projet...</Key> ou depuis l'écran d'accueil. Définissez le titre, les dimensions en pixels, la couleur d'arrière-plan et le nom de variable du Canvas Python.
                </Para>
                <SubTitle>Enregistrer et Ouvrir (.vec.json)</SubTitle>
                <Para>
                    Le format propriétaire <Key>.vec.json</Key> est un fichier JSON structuré et léger contenant l'ensemble des formes, calques, réglages de grille et images de référence intégrées.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Enregistrer</Key> (<Key>Ctrl+S</Key>) — Enregistre les modifications actuelles dans le fichier projet.</ListItem>
                    <ListItem><Key>Enregistrer sous...</Key> — Crée une copie sous un nouveau nom.</ListItem>
                    <ListItem><Key>Ouvrir un projet...</Key> — Charge n'importe quel fichier <Key>.vec.json</Key>.</ListItem>
                </ul>
                <SubTitle>Sauvegarde automatique et Récupération</SubTitle>
                <Para>
                    Veretka intègre une protection renforcée contre les fermetures inattendues du navigateur :
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Sauvegarde auto en arrière-plan :</strong> L'état de votre dessin est enregistré toutes les 2 minutes dans le <Key>localStorage</Key> du navigateur. En cas de fermeture inopinée, une bannière de restauration en un clic s'affiche à votre prochaine visite.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">« Retour au projet » sur l'accueil :</strong> Si vous basculez vers le menu principal ou la galerie, votre session de travail reste active et prête à être reprise immédiatement.
                    </ListItem>
                </ul>
            </section>

            {/* 4. TRAVAILLER AVEC DES MODÈLES */}
            <section>
                <SectionTitle id="templates">4. Travailler avec des modèles</SectionTitle>
                <SubTitle>Utilité des modèles</SubTitle>
                <Para>
                    Les modèles conservent les dimensions de canevas, les palettes de couleurs, les grilles de guidage et les formes initiales (comme les cadres d'interface, grilles de coordonnées ou logos).
                </Para>
                <SubTitle>Créer et utiliser des modèles</SubTitle>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <ListItem>
                        Composez votre maquette de base sur la zone de dessin et choisissez <Key>Fichier</Key> → <Key>Enregistrer comme modèle...</Key>.
                    </ListItem>
                    <ListItem>
                        Saisissez un nom explicite (ex. « Plateau de jeu 800x600 » ou « Carte d'application »).
                    </ListItem>
                    <ListItem>
                        Lors de vos prochaines créations, sélectionnez votre modèle dans la liste « Créer depuis un modèle ».
                    </ListItem>
                </ol>
                <Para>
                    Gérez vos modèles enregistrés (renommer ou supprimer) dans <Key>Paramètres</Key> sous l'onglet <Key>Modèles</Key>.
                </Para>
            </section>

            {/* 5. TRAVAILLER AVEC DES FORMES */}
            <section>
                <SectionTitle id="shapes">5. Travailler avec des formes</SectionTitle>
                <SubTitle>Dessin et Sélection</SubTitle>
                <Para>
                    Choisissez un outil dans la palette, puis cliquez et glissez sur la zone de travail pour dimensionner la forme.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>Maintenez <Key>Maj</Key> lors du tracé d'un rectangle ou d'une ellipse pour forcer un ratio 1:1 parfait (carré / cercle).</ListItem>
                    <ListItem>Maintenez <Key>Alt</Key> pour dessiner la forme depuis son centre plutôt que depuis le coin.</ListItem>
                    <ListItem>L'outil <Key>Sélectionner</Key> (<Key>V</Key>) affiche les poignées de transformation pour le redimensionnement et la rotation.</ListItem>
                </ul>

                <SubTitle>Édition des Nœuds (Tracés Vectoriels)</SubTitle>
                <Para>
                    L'outil <Key>Modifier les nœuds</Key> (<Key>A</Key>) offre un contrôle vectoriel précis sur les courbes de Bézier, lignes et polygones : déplacement des points d'ancrage, réglage des poignées tangentes, ajout de nœuds en cliquant sur le tracé et suppression avec <Key>Suppr</Key>.
                </Para>

                <SubTitle>Répartir le long d'un tracé (Distribute along Path)</SubTitle>
                <Para>
                    Disposez une série d'objets de manière homogène le long du contour d'une autre forme ou ligne guide :
                </Para>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <ListItem>Sélectionnez les objets à répartir ainsi que la courbe guide.</ListItem>
                    <ListItem>Dans le menu <Key>Objet</Key>, choisissez <Key>Répartir le long d'un tracé</Key>.</ListItem>
                    <ListItem>Choisissez l'orientation : <strong>Radiale</strong> (orientée vers l'extérieur), <strong>Tangente</strong> (suivant la pente de la courbe) ou <strong>Parallèle</strong> (angle fixe).</ListItem>
                </ol>

                <SubTitle>Groupement, Alignement et Retournement</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Ctrl+G</Key> — Grouper les objets sélectionnés (double-clic pour éditer à l'intérieur du groupe).</ListItem>
                    <ListItem><Key>Ctrl+Maj+G</Key> — Dégrouper les éléments.</ListItem>
                    <ListItem><Key>Ctrl+H</Key> / <Key>Ctrl+V</Key> — Retourner horizontalement ou verticalement.</ListItem>
                    <ListItem>Les boutons d'alignement de la barre supérieure alignent sur les bords, les centres ou répartissent régulièrement sur la sélection ou le canevas.</ListItem>
                </ul>

                <SubTitle>Palette et Noms de Couleurs Tkinter</SubTitle>
                <Para>
                    Prend en charge les codes HEX, le RGB et un catalogue de plus de 700 noms officiels de couleurs Tkinter. Les noms système sont convertis automatiquement pour une parité visuelle totale entre le web et l'exécution Python Tkinter.
                </Para>

                <SubTitle>Import d'images pour le décalquage</SubTitle>
                <Para>
                    Via <Key>Fichier</Key> → <Key>Importer une image...</Key>, intégrez des croquis PNG/JPEG comme modèles d'arrière-plan pour le traçage vectoriel manuel.
                </Para>
            </section>

            {/* 6. ÉCRANS TACTILES, LOUPE ET JOYSTICK */}
            <section>
                <SectionTitle id="touch-mobile">6. Écrans tactiles, Loupe et Joystick</SectionTitle>
                <Para>
                    Veretka est intégralement optimisé pour les appareils mobiles, les tablettes avec stylet (iPad Apple Pencil, tablettes Android) et les écrans tactiles. Des modes tactiles dédiés et des assistants de précision facilitent le dessin sur toutes les tailles d'écran.
                </Para>

                <SubTitle>Gestes Multi-Touch sur le Canevas</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Pinch-to-Zoom (Pincement à deux doigts) :</strong> Écartez ou resserrez deux doigts pour zoomer en douceur de 10% à 3000%.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Panoramique à deux doigts :</strong> Faites glisser deux doigts pour naviguer sur la zone de dessin sans risquer de déplacer ou tracer d'objets par erreur.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Un seul doigt (Toucher & Glisser) :</strong> Sélectionner des formes, tracer de nouveaux éléments ou déplacer des objets.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Pression longue (Long-Press) :</strong> Maintenez le doigt sur un objet pour faire apparaître le menu contextuel (Copier, Supprimer, Mettre au premier plan, Retourner).
                    </ListItem>
                </ul>

                <SubTitle>Barre Mobile et Tiroirs Rétractables</SubTitle>
                <Para>
                    Sur smartphone, l'interface s'adapte pour un contrôle fluide au pouce :
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Barre d'outils basse mobile :</strong> Accès instantané aux outils de dessin, sélecteur de couleur, annulation et assistants de précision.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Tiroirs escamotables (Drawers) :</strong> L'arborescence des calques, les propriétés et le code Tkinter s'ouvrent dans des tiroirs pratiques sans encombrer la vue.</ListItem>
                </ul>

                <SubTitle>Loupe de Précision Tactile (Loupe Magnifier)</SubTitle>
                <Para>
                    Dessiner avec le doigt masque souvent le point de contact exact. La loupe de précision Veretka résout définitivement ce problème :
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Décalage tactile (Touch Offset) :</strong> La loupe projette une vue agrandie à 60–90 pixels au-dessus de votre point de contact.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Réticule & HUD de coordonnées :</strong> Affiche un réticule net avec les coordonnées pixels X/Y précises du point actif.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Épingler la loupe (Pin) :</strong> Fixez la loupe dans un coin de l'écran pour surveiller les détails en continu.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Image figée (Freeze) :</strong> Figez le grossissement pour analyser les tracés complexes en toute sérénité.
                    </ListItem>
                </ul>

                <SubTitle>Joystick Virtuel de Précision (Nudge Control)</SubTitle>
                <Para>
                    Pour ajuster les formes et les nœuds au pixel près sur écran tactile sans aucun tremblement :
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Stick analogique tactile :</strong> Déplacez les objets sélectionnés en inclinant le stick. La vitesse s'adapte à l'amplitude du geste.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Boutons pas-à-pas (1px et 10px) :</strong> Touches fléchées pour déplacer d'exactement 1 pixel (micro-pas) ou 10 pixels (grand pas).
                    </ListItem>
                </ul>

                <SubTitle>Chronologie de l'Historique (History Popover)</SubTitle>
                <Para>
                    Une pression longue sur <Key>Annuler</Key> ou <Key>Rétablir</Key> ouvre une chronologie visuelle complète. Vous pouvez visualiser l'historique horodaté des actions et revenir à n'importe quelle étape en un seul geste.
                </Para>
            </section>

            {/* 7. CODER ET EXPORTER */}
            <section>
                <SectionTitle id="code-export">7. Coder et exporter</SectionTitle>
                <SubTitle>Génération de code Python Tkinter</SubTitle>
                <Para>
                    L'éditeur convertit automatiquement chaque objet graphique en instructions Tkinter Canvas correspondantes (<Key>create_rectangle</Key>, <Key>create_oval</Key>, <Key>create_polygon</Key>, <Key>create_line</Key>, <Key>create_text</Key>, etc.).
                </Para>
                <Para>
                    Le code résultant est une application Python complète comprenant l'initialisation de fenêtre (<Key>tk.Tk()</Key>), le canvas et la boucle d'événements (<Key>mainloop()</Key>).
                </Para>
                <SubTitle>Exécution directe en ligne</SubTitle>
                <Para>
                    Cliquez sur <Key>Exécuter dans ЄPython</Key> sur le panneau de code pour tester immédiatement votre dessin dans le navigateur, sans installer Python sur votre appareil.
                </Para>
                <Para>
                    Si le projet comporte de très nombreuses formes dépassant la taille d'URL autorisée, le code complet est automatiquement copié dans le presse-papiers et la fenêtre d'exécution s'ouvre pour un collage immédiat (<Key>Ctrl+V</Key>).
                </Para>
                <SubTitle>Sauvegarde de fichiers et Export d'images</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Enregistrer le script :</strong> Téléchargez le fichier <Key>.py</Key> exécutable ou <Key>.txt</Key> avec numérotation de lignes optionnelle.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Format SVG vectoriel :</strong> Export SVG propre pour vos logiciels de graphisme.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Format matriciel PNG / JPEG :</strong> Export haute résolution avec multiplicateurs d'échelle (1x, 2x, 4x Retina) et réglage de compression.</ListItem>
                </ul>
            </section>

            {/* 8. STOCKAGE CLOUD ET GALERIE */}
            <section>
                <SectionTitle id="cloud-storage">8. Stockage Cloud et Galerie</SectionTitle>
                <SubTitle>Présentation de la plateforme Cloud</SubTitle>
                <Para>
                    Sauvegardez vos projets sur le cloud en toute sécurité, ouvrez-les sur n'importe quel ordinateur ou tablette, partagez vos créations dans la Galerie Publique et collaborez au sein de Cellules de groupe.
                </Para>
                <SubTitle>Coffre Personnel (Espace Privé)</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong>Connexion :</strong> Connexion par pseudonyme et mot de passe ou en 1 clic via votre compte Google.</ListItem>
                    <ListItem><strong>Confidentialité :</strong> Votre coffre est strictement privé. Les fiches de projets affichent la date, le nombre de formes et un aperçu miniature.</ListItem>
                    <ListItem><strong>Gestion des versions :</strong> Possibilité de mettre à jour un projet existant ou de créer une nouvelle version distincte.</ListItem>
                </ul>

                <SubTitle>Galerie Publique Communautaire</SubTitle>
                <Para>
                    Explorez les créations partagées par la communauté, effectuez des recherches par titre ou auteur, ouvrez des projets pour les analyser et publiez vos propres réalisations.
                </Para>

                <SubTitle>Cellules et Groupes (Éducation & Équipes)</SubTitle>
                <Para>
                    Idéal pour les cours d'informatique, les ateliers de design et le travail d'équipe :
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong>Créer une cellule :</strong> L'enseignant crée une cellule avec un nom de groupe et un mot de passe d'accès.</ListItem>
                    <ListItem><strong>Évaluation simplifiée :</strong> Les étudiants soumettent leurs travaux dans la cellule commune où l'enseignant peut immédiatement les ouvrir et inspecter le code Tkinter.</ListItem>
                </ul>
            </section>

            {/* 9. COMMENTAIRES */}
            <section>
                <SectionTitle id="feedback">9. Commentaires</SectionTitle>
                <Para>
                    Nous perfectionnons constamment Veretka et vos retours nous sont précieux ! Envoyez vos suggestions ou signalez un problème via <Key>Aide</Key> → <Key>Envoyer des commentaires</Key>.
                </Para>
                <Para>
                    Pour faciliter le diagnostic, le formulaire inclut automatiquement les caractéristiques techniques de votre environnement (version de l'éditeur, système d'exploitation et navigateur). Aucun fichier confidentiel n'est transmis.
                </Para>
            </section>

            {/* 10. RACCOURCIS CLAVIER */}
            <section>
                <SectionTitle id="hotkeys">10. Raccourcis clavier</SectionTitle>
                <Para>Utilisez ces raccourcis clavier sur ordinateur pour maximiser votre productivité :</Para>

                <SubTitle>Fichier & Historique</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Ctrl+S</Key> — Enregistrer le projet.</ListItem>
                    <ListItem><Key>Ctrl+Z</Key> — Annuler la dernière action.</ListItem>
                    <ListItem><Key>Ctrl+Y</Key> ou <Key>Ctrl+Maj+Z</Key> — Rétablir l'action.</ListItem>
                </ul>

                <SubTitle>Outils & Manipulation</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>V</Key> — Outil « Sélectionner ».</ListItem>
                    <ListItem><Key>A</Key> — Outil « Modifier les nœuds ».</ListItem>
                    <ListItem><Key>Ctrl+G</Key> — Grouper les objets sélectionnés.</ListItem>
                    <ListItem><Key>Ctrl+Maj+G</Key> — Dégrouper.</ListItem>
                    <ListItem><Key>Ctrl+D</Key> — Dupliquer l'objet sélectionné.</ListItem>
                    <ListItem><Key>Ctrl+H</Key> — Retourner horizontalement.</ListItem>
                    <ListItem><Key>Ctrl+V</Key> — Retourner verticalement.</ListItem>
                    <ListItem><Key>Suppr</Key> / <Key>Retour Arrière</Key> — Supprimer l'objet ou nœud sélectionné.</ListItem>
                </ul>

                <SubTitle>Déplacement fin au clavier (Nudging)</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Flèches</Key> — Déplacer l'objet sélectionné d'exactement 1 pixel.</ListItem>
                    <ListItem><Key>Maj + Flèches</Key> — Déplacer l'objet de 10 pixels.</ListItem>
                    <ListItem><Key>Alt + Flèches</Key> — Déplacer sans alignement magnétique (Snapping).</ListItem>
                </ul>

                <SubTitle>Navigation & Contrôle du Canevas</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Molette de la souris</Key> — Zoomer sur la position du curseur.</ListItem>
                    <ListItem><Key>Clic molette (ou Espace + Clic gauche)</Key> — Déplacer la zone de travail (Pan).</ListItem>
                    <ListItem><Key>F11</Key> — Activer / quitter le mode plein écran.</ListItem>
                    <ListItem><Key>Échap (Esc)</Key> — Annuler le tracé en cours, désélectionner ou fermer les fenêtres modales.</ListItem>
                    <ListItem><Key>?</Key> — Ouvrir le tableau récapitulatif des raccourcis.</ListItem>
                </ul>
            </section>
        </>
    );
};
