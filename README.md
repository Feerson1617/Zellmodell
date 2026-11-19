# Zellmodell

Interaktives Zellmodell für Biologie, Jahrgang 11. **Entwicklungsstand: Prototyp 0.2 (19.11.2026), nicht unterrichtlich abgenommen.**

## Start

- `index.html` zusammen mit `app.js` öffnen. Beide Dateien müssen im selben Verzeichnis liegen.
- Alternativ ist `standalone/Zellmodell_3D_eine_Datei.html` vollständig eigenständig und ohne Internetverbindung verwendbar.
- Der WebGL2-Modus bietet eine räumlich drehbare Darstellung; wo WebGL2 fehlt, erscheint eine ausdrücklich gekennzeichnete 2D-Ersatzansicht.

## Vorhandene Prototyp-Ansichten

- Pflanzenzelle
- Tierzelle
- Einzeller: Pantoffeltierchen (*Paramecium*, eukaryotischer Einzeller)

Organellinformationen (einschließlich aufklappbarer Abschnitte), Zelltypen-Auswahl, Kamera, Labels, Hüllen-Schalter und Tastatur-/Touch-Bedienung sind angelegt.

## Grenzen

Der Quellcode des ursprünglichen, über Canva veröffentlichten Projekts `Modell Zellen` ist nicht zugänglich. Dieser Prototyp ist daher eine Neuentwicklung anhand bekannter Anforderungen, **keine belegte 1:1-Rekonstruktion der Canva-Anwendung**.

Bei der letzten Prüfung waren JS-Syntax und die 2D-Ersatzansicht überprüft. Eine visuelle **echte WebGL2-Darstellung**, iPad-/Safari-Hardware und der SCORM-Import konnten nicht abgenommen werden. Vor schulischer Freigabe müssen diese Prüfungen erfolgen.

Alle biologischen Formen, Farben und Größenverhältnisse sind modellhaft. Es dürfen keine realen Maßstäbe oder experimentellen Belege vorgetäuscht werden. Der Nucleolus ist kein Speicher für Proteinbauanleitungen: Seine Kernfunktion betrifft rRNA und die Bildung ribosomaler Untereinheiten.

## Weiterentwicklung

Der nächste Auftrag für Codex steht in [docs/CODEX_AUFTRAG.md](docs/CODEX_AUFTRAG.md). Die ursprünglichen Canva-Ansichten und die vom Nutzer bereitgestellten Screenshots dienen als visuelle und funktionale Vergleichsreferenz.

**Datenschutz:** keine Nutzerkonten, keine Analytik, keine Speicherung von Lernergebnissen; SCORM-Version soll ebenfalls vollständig sitzungsflüchtig sein.
