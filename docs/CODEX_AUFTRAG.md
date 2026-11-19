# Codex-Auftrag: Zellmodell – hochwertiger 3D-Neubau auf Basis des Prototyps 0.2

## Ausgangslage
Repository: `Feerson1617/Zellmodell`. **Ausgangsbranch: `feature/zellmodell-prototyp-v02`**, nicht ein älterer oder leerer `main`. Lege für die Weiterentwicklung einen eigenen Branch aus diesem Stand an und öffne einen überprüfbaren Pull Request, zunächst gegen den Ausgangsbranch. Erhalte den bestehenden Stand als Vergleich und verschiebe nichts in `main`, bevor die neue Version geprüft wurde.

Die Dateien `index.html`, `app.js` sowie `standalone/Zellmodell_3D_eine_Datei.html` sind der vollständige Code des aktuellen Prototyps. Der separate Ein-Datei-Export ist funktional äquivalent zu HTML + JS, kein anderer Projektstand. Der ursprüngliche Canva-Quellcode ist verloren. Die veröffentlichte Referenz: https://canva.link/zynvv0uucpwq1hs. Drei Screenshots aus dem Unterrichtsprojekt zeigen Tierzelle, Zellkern und Mitochondrium; falls du sie nicht im Codex-Kontext erhältst, fordere sie **nur bei Bedarf** an und dokumentiere unbekannte Originalfunktionen statt sie zu erfinden.

## Zentrales Ziel
Aus dem derzeit technisch angelegten, aber optisch noch nicht abgenommenen WebGL2-Prototypen ein **sehr hochwertiges, biologisch präzises, echtes interaktives 3D-Zellmodell** entwickeln. Mehr effektiver Raum für die Zelle (Orientierung: rund 85–90 % des Bildschirms bei geschlossenem Infopanel), wesentlich reduzierte und bei Bedarf einblendbare Bedienelemente. **Fachliche Inhalte und sinnvolle Funktionen erhalten, keine neuen Spielmechaniken.**

## Zu rekonstruierender sichtbarer Originalumfang
- Drei auswählbare Zellansichten: Tierzelle, Pflanzenzelle und ein konkreter eukaryotischer Einzeller (aktuell Pantoffeltierchen). Das Wort „Einzeller“ ist keine Zellbauart; im Modell den Organismus benennen.
- Navigation über Ebenen **Zelle → Organell → Feinbau**, mit klar erkennbarem Zurückweg und optionalem Ebenenwechsel durch Zoom. Stufenwechsel darf nicht versehentlich bei gewöhnlichem Zoomen passieren; Nutzersteuerung prüfbar.
- **Schnittansicht / ganzes Modell** umschaltbar; bei Schnittansichten die Schnittebene erkennbar machen. Zoom, Drehen, Fokussieren, Zurücksetzen und Vollbild.
- Kontextinformationen zu Organellen mit ausklappbaren **Bau-, Funktions- und ggf. Modellgrenzen-Texten**, verständlich für Jahrgang 11, aber fachlich korrekt.
- Sichtbarkeit einzelner Strukturen per Augensymbol/Checkbox, „Alle einblenden“, klare hervorgehobene Auswahl und optionale Beschriftungen.
- Quellen/Modellgrenzen sowie, wo schon im Original sichtbar, Verweis zur Endosymbiontentheorie. Kein Layout, das dauerhaft mit Seitenleisten und Schaltflächen die Bildfläche verkleinert.
- Vorhandene und gewünschte Funktionen anhand von Quellcode und sichtbarer Canva-Referenz tabellarisch abgleichen; unsicher übernommene Funktionen kennzeichnen.

## Fachwissenschaftliche Anforderungen
Beachte Fachanforderungen Biologie Schleswig-Holstein 2026, aktuelles schulinternes Curriculum ETS (Jg. 11, Zellorganellen/Kompartimentierung) und KMK-Standards. Modelle dürfen nicht allein aus ästhetischen Gründen fachlich verfälscht werden:
- Zellkern: **zwei Kernhüllmembranen**, Kernporenkomplexe, Chromatin; Nucleolus dient der rRNA-Bildung und dem Zusammenbau ribosomaler Untereinheiten, **nicht als Tresor für Bauanleitungen**.
- Mitochondrium: äußere und innere Membran, Matrix, Intermembranraum, echte Cristae-Topologie, ATP-Synthase nur korrekt platziert; eigene DNA und Ribosomen nicht überdimensionieren.
- Chloroplast: Doppelhülle, Stroma, Thylakoidmembran mit Grana/Stromathylakoiden, Plastiden-DNA; nicht jede Pflanzenzelle besitzt Chloroplasten.
- Raues/glattes ER, Golgi-Apparat, Vesikel und Ribosomen räumlich unterscheiden; „Proteinfabrik“-Analogie nur als begrenztes Modell, keine falsche Gleichsetzung von ER und ausschließlicher Transportfunktion.
- Tierzelle ohne Zellwand/Chloroplasten, Pflanzenzelle mit großer Zentralvakuole und Tonoplast; Pantoffeltierchen mit plausiblen Cilien, Mundfeld, kontraktiler und Nahrungsvakuole.
- Beschriftungen und Info-Texte dürfen nichts behaupten, was in der jeweiligen Ansicht nicht sichtbar/erkennbar ist. Modellgrenzen bei Größenverhältnissen, Anzahl, Beweglichkeit, Transparenz und Färbung erklären.

## Grafische/technische Umsetzung
- Priorität liegt auf **sichtbarer 3D-Qualität**: hochwertiges Licht, realistische räumliche Geometrie, glaubwürdige Materialoberflächen, subtiler Tiefeneindruck; Wissenschaftsdarstellung statt Comic-Überzeichnung oder verwaschener Symbolkörper.
- Prüfe ehrlich, ob der reine WebGL2-Renderer dafür sinnvoll weiterentwickelt werden kann. Falls ein Wechsel zu **Three.js + lokal eingebundenen GLB/glTF-Modellen** (ggf. kostenlos mit Blender erzeugt) die Qualität, Wartbarkeit und iPad-Kompatibilität deutlich verbessert, setze ihn begründet um. Keine CDN-/API-Abhängigkeiten zur Laufzeit. Lizenzen von Assets dokumentieren.
- Keine Täuschung durch pseudo-reale Texturen oder künstliche EM-Bilder; echte wissenschaftliche Bildquellen, sofern eingesetzt, als solche kennzeichnen.
- Zelle bei Start groß im Zentrum; bei geschlossenem Panel möglichst nahezu bildschirmfüllend. Aufgeklappte Info darf das Organell möglichst nicht verdecken; Kontextpanel als Drawer/Overlay, das sich sofort schließen lässt.
- Touch (ein Finger drehen, Pinch zoomen, Tippen auswählen), Maus, Tastatur, Tastatur-Fokus, lesbare Schrift und Touchziele berücksichtigen; Layout für Desktop, Tablet quer und hochkant.
- Kein Login, keine Cookies, keine Analytics und keine persistente Speicherung von Antworten/Spielständen. SCORM 1.2 ohne Leistungsdaten und ohne Browserpersistenz.

## Prüfgates und Abgabe
1. **Iststand inventarisieren**: vorhandene Quellcodefunktionen, sichtbare Canva-Funktionen, fachliche Schwachstellen, fehlende Elemente. Keine unbelegte Freigabe.
2. **Implementieren**: funktional vollständiger, optisch klar verbesserter 3D-Aufbau mit stabiler Navigation, Info- und Sichtbarkeitssystem.
3. **Echte 3D-Sichtprüfung**: Falls technisch möglich Browser/WebGL mit echten Screenshots aller drei Zellen sowie Kern/Mitochondrium/Chloroplast, auch mit geöffneten Infos. Prüfe Desktop und iPad-Viewport, Interaktionen inkl. Touch und Layer-Zoom. Wenn WebGL/Safari nicht ausführbar, als ungetestet dokumentieren, keinesfalls 2D-Fallback als 3D-Nachweis ausgeben.
4. **Automatisierte Tests**: Ladefehler, Renderstart, Zellwechsel, Organellwahl, Label-/Sichtbarkeitsschalter, Schnittansicht, Ebenennavigation, Panel, Resize/Touch, offline; fachliche Inhaltskontrollen.
5. **Auslieferung im Repository**: lauffähige App/Website, kleine eigenständige HTML-/Desktop-Sichtprüfungs-ZIP, vollständige offline-fähige SCORM-1.2-ZIP für itslearning, reproduzierbarer ZIP-Build (z. B. GitHub Actions), kompakter Prüfbericht mit Screenshots/Logs. Import auf echten Schul-iPads und itslearning nicht behaupten, wenn nicht getestet.
6. **Pull Request** mit Kurzbericht: Implementiertes, visueller Vorher-Nachher-Vergleich, Quellen/Lizenzen, automatische Tests, reale vs. nicht ausgeführte Tests, bekannte Grenzen.

Arbeite bis zu einer tatsächlich laufenden, überprüften Version; stoppe nicht nach einer bloßen Konzeptskizze. Größere fachliche oder technische Abweichungen von den Vorgaben begründet kennzeichnen.
