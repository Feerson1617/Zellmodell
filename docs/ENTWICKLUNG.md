# Entwicklungs- und Fachabgleich

Grundlage ist Commit `a4c2443` aus `feature/zellmodell-prototyp-v02`. Der Ein-Datei-Export enthielt den Anwendungscode aus `app.js`. Der Canva-Link führte zum veröffentlichten Design „Modell Zellen“. Im ausgelieferten Designdokument ließen sich sichtbare Bezeichnungen wie „Schnittansicht“, „Feinbau entdecken“, „Ebenenwechsel“ und „Die Endosymbiontentheorie“ bestätigen. Die drei bereitgestellten Unterrichtsbilder zeigen die Tierzelle, den Zellkern und das Mitochondrium. Das interne Interaktionsverhalten des früheren Programms bleibt für den Vergleich unbekannt. [Canva-Referenz](https://canva.link/zynvv0uucpwq1hs)

| Funktion | Prototyp 0.2 | Canva-Beleg | Umsetzung |
| --- | --- | --- | --- |
| Zelltypen | Pflanze, Tier, Paramecium | Zelltypwechsel im Screenshot, Tier- und Pflanzenzelle im Designdokument | Alle drei direkt erreichbar. Paramecium ist ein konkreter einzelliger Eukaryot. |
| Untersuchungsebenen | Fokus auf eine Gruppe im Zellmodell | Pfad Zelle / Organell / Feinbau und Rückweg sichtbar | Eigenständige Organellgeometrie, isolierter Teil, Rückweg und Kamerafokus |
| Ebenenwechsel durch Zoom | Kamera-Zoom | Schalter und Hinweis sichtbar, Schwellen unbekannt | Abschaltbar, standardmäßig aus, Auswahl beim Einstieg erforderlich, getrennte Schwellen und kurze Sperrzeit |
| Schnitt | Transparente Hüllen mit Hüllenschalter | Schnittansicht / Ganzes Modell | Geöffnete Oberflächen und Schnittkanten, geschlossene Hüllen, ebener Schnitt für weitere Einzelstrukturen |
| Zeigen und Auswählen | Gruppen, Liste, Auswahl, einige Labels | Namen, Augen, Führungslinien und „Alle einblenden“ | Geometrisches Picking, Farbakzent, Beschriftungen, Sichtbarkeit pro Zelltyp und Ebene |
| Informationen | Aufklappbare Abschnitte und Zellübersicht | Kontextkarten, Theorie und Quellen sichtbar | Bau, Funktion, Grenzen, Herkunft der Organellen und Quellen im schließbaren Bereich |
| Bedienung | Maus, Touch, Tastatur, Vollbild | Zoom und Reset sichtbar. Verhalten auf realer Hardware unbekannt. | Einfingerrotation, Zweifingerzoom, Tippen, Tastatur, expliziter Reset und Vollbild |
| Auslieferung | HTML + JS und Einzeldatei | Kein Beleg für SCORM | Einzeldatei, zwei ZIPs, lokaler Build und CI-Artefakt |

## Geometrie und Darstellung

Der Prototyp konnte echte 3D-Geometrie zeichnen. Seine Mitochondrien verwendeten röhrenförmige Schleifen als Cristae, Poren waren Punkte, und ein Hüllenschalter ersetzte den Schnitt. Für echte Membranflächen, korrekt transformierte Gruppen, Tiefentests und Raycasting wurde Three.js r160 lokal eingebunden. Übersicht und Vergrößerung werden aus denselben Formfunktionen aufgebaut. Ein zusätzlicher Blender-/GLB-Export hätte hier eine zweite Repräsentation für Schnitt, Auswahl und Sichtbarkeit erfordert. Alle Geometrien und Farbmaterialien entstehen im Browser aus dem mitgelieferten Code.

Die Kernhülle hat zwei Flächen mit Porenöffnungen. Im Tiermodell liegt ein schematisches Lamina-Netz an der Innenseite. Chromatinfäden und der membranlose Nucleolus sind getrennt auswählbar. Die innere Mitochondrienmembran ist bei Tier und Pflanze eine eingefaltete parametrische Fläche. Grenzmembran und Cristae teilen sich die Koordinaten ihrer Patchgrenzen. Beim Pantoffeltierchen ragen tubuläre Einstülpungen in die Matrix. ATP-Synthasen sind als vergrößerte Stiel-Kopf-Symbole an der inneren Membran modelliert. Chloroplasten zeigen zwei Hüllen, abgeflachte gestapelte Thylakoide, verbindende Lamellen und das umgebende Stroma.

Schnittansichten öffnen die Hüllen und zusätzlich einzelne Organellen zur Einsicht. Die Lage beweglicher Organellen, Farben, Transparenzen, Molekülgrößen, Porendichte und Anzahlen sind didaktisch gewählt. Die räumlichen Kompartimente erklären Struktur-Funktions-Beziehungen. Membrandynamik, reale Konzentrationsgradienten, molekulare Feinstruktur und exakte Volumenanteile lassen sich aus dem Modell nicht messen.

## Fachlicher Abgleich

| Gegenstand | Konsequenz für das Modell | Grundlage |
| --- | --- | --- |
| Kern, Kernhülle, Nucleolus | Zwei Kernmembranen. Selektiver Porentransport. Im Nucleolus Bildung und Prozessierung der meisten rRNAs und Zusammenbau von Vorstufen ribosomaler Untereinheiten. | [OpenStax Biology 2e, 4.3](https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells) |
| ER, Golgi, Lysosom, Vesikel, Ribosomen | Ribosomen auf der cytosolischen Seite des rauen ER. Lipidsynthese im glatten ER. Golgi-Zisternen und Transportvesikel unterscheidbar. Lysosomen enthalten abbauende Enzyme. | [OpenStax 4.4](https://openstax.org/books/biology-2e/pages/4-4-the-endomembrane-system-and-proteins) |
| Membranen, Cytosol, Peroxisom, Centrosom, Cytoskelett | Zellgrenze und wässrige Phase getrennt. Oxidative Reaktionen im Peroxisom. Centriolenpaar und Proteinfasern exemplarisch. | [OpenStax 4.3](https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells), [4.5](https://openstax.org/books/biology-2e/pages/4-5-the-cytoskeleton) |
| Mitochondrien | Matrix und Intermembranraum getrennt, ATP-Bildung am matrixseitigen Kopf. Lamellare und tubuläre Cristae nach Zelltyp. Dimere und molekulare Architektur sind abstrahiert. | [OpenStax 7.4](https://openstax.org/books/biology-2e/pages/7-4-oxidative-phosphorylation), [Mühleip et al., PNAS 2016](https://doi.org/10.1073/pnas.1525430113) |
| Chloroplast, Zellwand und Vakuole | Beispiel einer grünen Blattzelle. Getrennte Hülle und Thylakoidsystem, Grana und Stromathylakoide. Calvin-Zyklus im Stroma. Tonoplast um den Zellsaft, Zellwand außerhalb der Zellmembran. | [OpenStax 4.3](https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells), [8.2](https://openstax.org/books/biology-2e/pages/8-2-the-light-dependent-reactions-of-photosynthesis) |
| Pantoffeltierchen | Bewimperte Oberfläche und Mundfeld, Verdauungsvakuolen, kontraktile Vakuolen mit Zuführungskanälen, Makro- und Mikronucleus. | [OpenStax 23.3](https://openstax.org/books/biology-2e/pages/23-3-groups-of-protists) |
| Kompartimentierung und Modellkompetenz | Vergleich von Tier- und Pflanzenzelle sowie Untersuchung des Feinbaus von Chloroplasten und Mitochondrien. Die Modellgrenzen sind beim jeweiligen Objekt erreichbar. | [Fachanforderungen Biologie SH 2026, Sek. II, S. 59–60 und 65–66, SF2 und SF5](https://fachportal.lernnetz.de/sh/fachanforderungen/biologie.html), [KMK AHR 2020, E12 und 2.5.1](https://www.kmk.org/fileadmin/Dateien/veroeffentlichungen_beschluesse/2020/2020_06_18-BildungsstandardsAHR_Biologie.pdf) |
| Jahrgang 11 | Eucyte, tierische und pflanzliche Zellorganellen, Biomembranen und Endosymbiontentheorie. Als ETS wurde die Eider-Treene-Schule Tönning zugrunde gelegt. Ihr Fachcurricula-Verzeichnis verlinkte beim Abgleich die Fassung 2025/26. | [ETS, Fachcurriculum Biologie, PDF-S. 23](https://ets-toenning.de/wp-content/uploads/2025/07/Schulinternes-Fachcurriculum-Biologie-SJ-2025-26.pdf), [Verzeichnis der Schule](https://ets-toenning.de/fachcurricula/) |

Die OpenStax-Abschnitte wurden auch im offiziellen Quellbestand geprüft. Die Unterrichtstexte sind eigenständig formuliert. [OpenStax-Quellstand](https://github.com/openstax/osbooks-biology-bundle/tree/5ae2f953cfe924469a6618578a00b3160439fc43)

## Bestand und Lizenzen

- Three.js 0.160.1 aus dem Paket `three`, unveränderte lokale Browserdistribution. MIT-Lizenz. [Lizenztext](../vendor/THREE-LICENSE.txt)
- DM Sans und Instrument Serif, lokale lateinische WOFF2-Dateien aus `@fontsource-variable/dm-sans@5.3.0` und `@fontsource/instrument-serif@5.3.0`. SIL Open Font License 1.1. Beide Lizenztexte sind auch in der Einzeldatei enthalten. [DM Sans](../vendor/DMSans-OFL.txt) · [Instrument Serif](../vendor/Instrument-OFL.txt)
- 3D-Formen, Oberflächen, Bedienelemente und Prüfbilder wurden für dieses Projekt erstellt. Die 2D-Ersatzschemata stammen aus dem Ausgangsbranch. Es wurden keine Canva-Grafiken, Mikroskopiebilder oder externen 3D-Assets übernommen.
- Das SCORM-Paket enthält die unveränderten SCORM-1.2-/IMS-Schemadateien mit den Originalhinweisen aus dem Single-SCO-Referenzpaket. Manifest und Sitzungsadapter sind projektspezifisch. [Referenzpakete von Rustici Software](https://scorm.com/scorm-explained/technical-scorm/golf-examples/)
