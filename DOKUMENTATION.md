# Lern-App – Dokumentation und Grundgerüst

Diese Dokumentation beschreibt die **Englisch-App** (Access 1, Klasse 5) und das daraus abgeleitete
**Grundgerüst** für weitere Fächer, z. B. Geografie. Das Grundgerüst läuft im Browser, auf iPhone, iPad und PC,
kann offline genutzt werden und braucht keinen Server und keine Installation.

---

## 1. Überblick: Was die App kann

| Reiter | Funktion |
|---|---|
| **Start** | Begrüßung, Auswahl der Units und Seitenzahlen, Kacheln, Lernzeit (Heute/Woche), Version/Copyright |
| **Begriffe** | Trainer: Frage lesen, Antwort tippen. Falsche Begriffe kommen häufiger (Leitner-Fächer) |
| **Quiz** | Multiple Choice, nach Thema wählbar, optional mit Kurztext über der Frage |
| **Lückentexte** | Wort in Satz ergänzen (Eingabe) |
| **Hören** | Vorlesen: „Hören und schreiben“ (Diktat) und „Hören und auswählen“ |
| **Test** | Gemischt aus Quiz, Lückentexten und Begriffen (10 oder 20 Fragen) |
| **Fortschritt** | Punkte, richtig/falsch pro Unit und Thema, schwierigste Begriffe |
| **Fehler** | „Meine Fehler“: falsch beantwortete Fragen wiederholen |
| **Einstellungen** | Hell/Dunkel/Automatisch, Farbe, Stimme/Tempo, Sicherung, eigene Begriffe |

Alles wird **nur auf dem Gerät** gespeichert (localStorage). Es gibt keine Konten und keine Datenübertragung.

---

## 2. Dateien im Paket

| Datei | Zweck | Ändern? |
|---|---|---|
| `content.js` | **Alle Inhalte** des Fachs (Units, Begriffe, Quiz, Lückentexte, Namen, Texte) | **Ja, das ist die Hauptarbeit** |
| `app.js` | Gesamte App-Logik (Auswahl, Quiz-Motor, Ansichten, Vorlesen, Einstellungen) | Normalerweise nein |
| `index.html` | Seitengerüst und Aussehen (CSS) | Nur Titel/Farben |
| `sw.js` | Offline-Speicher (Service Worker) | Bei jedem Update Versionsnamen erhöhen |
| `manifest.webmanifest` | Name, Farben, Vollbildmodus, Icons | Namen anpassen |
| `_headers` | Cache-Regeln (nur Netlify/Cloudflare, GitHub ignoriert sie) | Nein |
| `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | App-Symbol (Platzhalter: Globus) | Gern austauschen |
| `DOKUMENTATION.md` | Diese Datei | – |

---

## 3. Schnellstart: neues Fach in 10 Schritten

1. Ordner kopieren (z. B. `geografie-app`).
2. In `content.js` unter `app` ändern: `title`, `child`, `line`, `version`, `copyright`, `speechLang`.
3. **`storageKey` eindeutig setzen** (z. B. `"geografie"`). Sonst teilen sich zwei Apps auf derselben Adresse den Lernstand.
4. Units anlegen (`units`): `id` (kurz, intern), `name` (Anzeige), `title` (Kapitelname).
5. Inhalte eintragen: `terms`, `quiz`, `fill` (siehe Abschnitt 4). Jeder Eintrag bekommt `u` (Unit) und möglichst `p` (Buchseite).
6. In `manifest.webmanifest` `name` und `short_name` ändern. In `index.html` den Wert von `apple-mobile-web-app-title` und `<title>` ändern.
7. Optional: Icon austauschen (512 × 512 Pixel PNG und `icon.svg`).
8. Lokal testen: `index.html` im Browser öffnen (für Offline/Service Worker ist HTTPS nötig, siehe Abschnitt 12).
9. Auf GitHub Pages (oder Netlify/Cloudflare) hochladen.
10. Auf dem iPad in Safari öffnen, „Zum Home-Bildschirm“, „Als Web-App öffnen“ einschalten.

---

## 4. `content.js` – Aufbau und Regeln

### 4.1 `app`

| Feld | Bedeutung |
|---|---|
| `title` | Titel im Browser-Tab |
| `child` | Name in der Begrüßung („Hallo Mia!“) |
| `line` | Zeile unter der Begrüßung (z. B. „Klasse 5 · Geografie“) |
| `version`, `copyright` | Fußnote auf der Startseite |
| `speechLang` | Sprache der Vorlese-Stimme: `"de-DE"`, `"en-GB"`, `"fr-FR"` … |
| `storageKey` | Eindeutiger Speichername dieser App |
| `testSatz` | Satz für den „Probe“-Knopf der Stimme |

### 4.2 `units`
`{ id: "U1", name: "Unit 1", title: "Orientierung auf der Erde" }`
Die Anzahl ist beliebig. Auf der Startseite erscheint pro Unit ein Kästchen mit den Seitenzahlen darunter.

### 4.3 `terms` (Begriffe)
`{ u:"U2", p:30, q:"Hauptstadt von Deutschland", a:"Berlin", alt:["Berlin (Stadt)"], e:"Erklärung" }`

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `u` | ja | Unit-id |
| `p` | nein | Buchseite. Ohne `p` erscheint der Eintrag nur bei „Alle“ |
| `q` | ja | Frage oder Begriff (wird angezeigt und vorgelesen) |
| `a` | ja | Antwort. **Alternativen mit `|`**: `"Pazifik|Pazifischer Ozean"` |
| `alt` | nein | Weitere richtige Schreibweisen als Liste |
| `e` | nein | Kurze Erklärung, erscheint nach der Antwort |

Nutzung der Begriffe: Begriffe-Trainer (Eingabe), Test (Eingabe und Auswahl), Hören (Diktat), „Meine Fehler“.

### 4.3.1 Wie Antworten geprüft werden
Groß-/Kleinschreibung, Satzzeichen und führende Artikel (der/die/das) sind egal. Umlaute sind austauschbar (`ä` = `ae`, `ß` = `ss`).
So zählen „Aequator“, „äquator“ und „der Äquator“ als richtig.

### 4.4 `quiz` (Multiple Choice)
`{ u:"U2", p:30, topic:"Deutschland", q:"…?", a:"16", wrong:["12","20"], e:"…", ctx:"Kurztext" }`

| Feld | Bedeutung |
|---|---|
| `topic` | Themenname = eigene Schaltfläche im Quiz (außerdem „Alle Themen mischen“) |
| `wrong` | 1 bis 3 falsche Antworten (die richtige wird automatisch gemischt) |
| `ctx` | **Kurztext über der Frage.** Damit lassen sich Fragen auch ohne Buch lösen. Mehrere Fragen können denselben Text nutzen |

Wahr/falsch geht mit `a:"Falsch", wrong:["Wahr"]`.

### 4.5 `fill` (Lückentexte)
`{ u:"U1", p:12, q:"Der ___ ist der größte Ozean.", a:"Pazifik|Pazifische Ozean", e:"…" }`
`___` (drei Unterstriche) markiert die Lücke. Beim Vorlesen wird sie zu einer Pause.

### 4.6 Eigene Begriffe (nicht in `content.js`)
In „Einstellungen“ kann man Begriffe von Hand hinzufügen (einzeln oder viele auf einmal: `Frage = Antwort`). Sie gehören zu einer Unit, haben aber keine Seite und erscheinen nur bei „Alle“. Sie liegen im Gerätespeicher und werden mit gesichert.

---

## 5. Auswahl: Units und Seiten

- Auf der Startseite wählt man eine oder mehrere Units. Unter jeder gewählten Unit erscheinen die **Seitenzahlen**, die in `content.js` bei `p` vorkommen (automatisch aus den Daten gebildet, nur Zahlen als Beschriftung).
- Als letztes Kästchen steht **„Alle“**. Ist „Alle“ gesetzt, sind die einzelnen Seiten abgehakt. Wählt man eine Seite, geht „Alle“ aus. Nimmt man die letzte Seite weg, springt „Alle“ zurück.
- **Alle Reiter** (Begriffe, Quiz, Lückentexte, Hören, Test) benutzen nur Einträge, die zur Auswahl passen. Dafür gibt es in `app.js` die Funktion `inSel(x)`.
- Die Auswahl bleibt gespeichert (`S.sel`, `S.pg`).

---

## 6. Gespeicherte Daten (localStorage)

Schlüssel: `"lernapp-" + storageKey`. Inhalt (Objekt `S`):

| Feld | Inhalt |
|---|---|
| `pts` | Punkte (10 pro richtige Antwort) |
| `st` | Statistik `{ Schlüssel: [richtig, falsch] }`, Schlüssel = Unit-id oder `t:Thema` |
| `t` | Lernzeit in Sekunden pro Tag `{ "2026-11-17": 840 }` |
| `sel`, `pg` | gewählte Units und Seiten |
| `bad` | Lernstand je Begriff `{ "U2|Frage": { box, ok, bad } }` |
| `err` | Liste der Fehlerfragen („Meine Fehler“, max. 150) |
| `mine` | selbst hinzugefügte Begriffe |
| `set` | Einstellungen: `mode`, `color`, `voice`, `rate`, `auto` |

**Wichtig:** Der Speicher gehört zur Internetadresse. Wechselt die Adresse (anderer Anbieter, anderer Repository-Name), ist der Lernstand weg.
Deshalb vorher unter **Einstellungen → Sicherung** kopieren und danach wiederherstellen.

---

## 7. Der Quiz-Motor (`app.js`, Abschnitt 3)

Alle Aufgabenarten werden in **eine einheitliche Frage** umgewandelt und mit `start(fragen, titel)` gestartet:

```
{ q, a, opts[], e, k[], ty, acc[], vis, sp, spA, say, dict, listen }
```

| Feld | Bedeutung |
|---|---|
| `q` | Fragetext |
| `a` | richtige Antwort (Text) |
| `opts` | Auswahlantworten (Multiple Choice). Leer bei Eingabe |
| `ty:1`, `acc` | Eingabefrage mit Liste erlaubter Antworten |
| `e` | Erklärung nach der Antwort |
| `k` | Statistik-Schlüssel (Unit-id, `t:Thema`) |
| `vis` | HTML über der Frage (z. B. Kurztext, später Bild) |
| `sp`, `spA` | Text zum Vorlesen vor/nach der Antwort |
| `say`, `dict`, `listen` | Hör-Aufgaben (Diktat bzw. Auswahl) |

Erzeuger-Funktionen: `mcQ` (Quiz), `fillQ` (Lückentext), `termQ`/`termMC` (Begriffe), `dq` (Diktat).
**Neue Aufgabenart bauen** = eine neue Funktion, die so ein Objekt zurückgibt, und eine Schaltfläche, die `start()` aufruft. Anzeige, Punkte, Fehlerliste und Vorlesen funktionieren dann automatisch.

---

## 8. Fehlerliste, Fortschritt, Lernzeit

- **Meine Fehler:** Jede falsch beantwortete Frage wird gespeichert (außer in der Fehler-Übung selbst). Nach **zwei richtigen** Wiederholungen verschwindet sie. Zusätzlich gibt es im Begriffe-Trainer die Auswahl „Schwierige Begriffe“ und „Meine Fehler (alle Units)“.
- **Leitner-Fächer:** Pro Begriff `box` 0–4. Richtig erhöht, falsch setzt auf 0. Je niedriger das Fach, desto häufiger kommt der Begriff.
- **Fortschritt:** Balken pro Unit und pro Thema, dazu die zehn schwierigsten Begriffe.
- **Lernzeit:** Alle 5 Sekunden +5, solange die App sichtbar ist und in den letzten 2 Minuten etwas angetippt wurde. Anzeige „Heute“ und „Woche“ (Montag bis Sonntag) auf der Startseite.

---

## 9. Vorlesen und Hören

- Nutzt die **Sprachausgabe des Geräts** (kostenlos, offline). Sprache über `speechLang` in `content.js`.
- Stimmenwahl: exakt passende Sprache (z. B. `en-GB`), bessere „erweiterte/Premium/Siri“-Stimmen werden bevorzugt, sonst eine andere Stimme derselben Sprache. In den Einstellungen kann man Stimme und Tempo wählen und „Automatisch vorlesen“ einschalten.
- iPhone/iPad: Stummschalter muss aus sein. Bessere Stimmen: iOS-Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen.
- Vorlesen funktioniert nur nach einer Bedienung (Tippen), nicht automatisch beim Laden der Seite (Vorgabe von iOS).
- **Hören und schreiben** = Diktat der Begriffs-Antworten (gut für Rechtschreibung von Namen). **Hören und auswählen** = richtige Schreibweise aus vier Wörtern wählen.

---

## 10. Aussehen

Hell / Dunkel / Automatisch (folgt dem Gerät) und fünf Farben. Technisch: die Farbvariablen stehen im CSS in `index.html` (`--bg`, `--card`, `--tx`, `--pr` …). `--pr` (Hauptfarbe) wird von `applyTheme()` gesetzt. Neue Farbe = Eintrag in `COL` in `app.js`.

---

## 11. Offline, Vollbild und Hosting

### Offline
`sw.js` legt alle Dateien beim ersten Besuch im Gerät ab und liefert sie danach sofort aus. Bei Internet wird im Hintergrund die neueste Version geholt (sichtbar ab dem nächsten Start).
**Neue Dateien** (z. B. ein Bild) in die Liste `FILES` in `sw.js` eintragen.
**Bei jedem Update** den Namen `V` in `sw.js` hochzählen (`lernapp-v1` → `lernapp-v2`).

### Vollbild auf iPhone/iPad
Funktioniert über `manifest.webmanifest` (`"display": "standalone"`) und die `apple-mobile-web-app-*`-Angaben in `index.html`. Ablauf: Seite in **Safari** öffnen → Teilen → „Zum Home-Bildschirm“ → „Als Web-App öffnen“ einschalten. Ein geändertes Icon erscheint erst, wenn das Symbol gelöscht und neu angelegt wird.

### Hosting (GitHub Pages)
1. GitHub-Konto, neues Repository (Name = Teil der Adresse), **Public**.
2. „Add file → Upload files“, alle Dateien (nicht die ZIP selbst) direkt ins Hauptverzeichnis hochladen, „Commit changes“.
3. Settings → Pages → „Deploy from a branch“ → `main` / `(root)` → Save.
4. Nach etwa einer Minute ist die Adresse sichtbar: `https://NAME.github.io/REPO/`.
5. Update: geänderte Dateien erneut hochladen (ersetzen die alten), `V` in `sw.js` erhöhen.

**Hinweis zum Urheberrecht:** Das Repository ist öffentlich. Lege deshalb keine längeren Textstellen oder Abbildungen aus dem Schulbuch ab. Formuliere Fragen, Kurztexte und Erklärungen **in eigenen Worten**. Kurze Fakten (Namen, Zahlen) sind unkritisch.

Alternativen: Cloudflare Pages oder Netlify (Ordner per Drag & Drop, `_headers` wird dort genutzt).

---

## 12. Testen (Checkliste vor dem Hochladen)

- [ ] Startseite zeigt alle Units und Seitenzahlen, „Alle“ schaltet sich richtig um.
- [ ] Jeder Reiter öffnet ohne Fehlermeldung.
- [ ] Begriffe: richtige Antwort mit Umlaut/ohne Artikel wird akzeptiert.
- [ ] Quiz mit `ctx` zeigt den Kurztext.
- [ ] Falsche Antwort landet unter „Fehler“, zwei richtige entfernen sie.
- [ ] Vorlesen mit passender Stimme (Probe in den Einstellungen).
- [ ] Hell/Dunkel/Farbe wechseln.
- [ ] Sicherung kopieren und wiederherstellen.
- [ ] Flugmodus: App startet nach einmaligem Laden weiter.

---

## 13. Wie die Englisch-App aufgebaut ist (und was sie mehr kann)

Die Englisch-App ist **eine einzige HTML-Datei** (`index.html`, rund 150 KB), in der Code **und** Inhalte stehen. Das Grundgerüst trennt beides sauber (`app.js` und `content.js`). Gleich geblieben sind Aufbau, Speicherung, Quiz-Motor, Fehlerliste, Lernzeit, Themes, Vorlesen und Offline-Technik.

### 13.1 Inhalte in der Englisch-App
| Bereich | Englisch-App | im Grundgerüst |
|---|---|---|
| Vokabeln | Textlisten `en=de=Unit` (`SEED3` … `SEED8`), in Buchreihenfolge | `terms` (Frage/Antwort) |
| Seitenzahl je Vokabel | wird aus der Reihenfolge der Listen und „Seitenanfang“-Wörtern berechnet (`PGM`) | direkt als `p` am Eintrag (einfacher und genauer) |
| Aufgaben (Lückentexte, Übersetzen, Wörter ordnen, Grammatik) | Listen `LT`, `TR`, `WO`, `G` mit Unit-Kennzeichen | `fill`, `quiz` |
| Zuordnung der Aufgaben zu Seiten | automatisch über die Vokabelwörter im Satz (`pgOK`, Füllwörter-Liste `STOP`) | nicht nötig, `p` steht am Eintrag |
| Kurztexte zu Fragen | Objekt `TX` | `ctx` am Quiz-Eintrag |
| „Weitere Wörter“ | eigene Gruppe ohne Seiten (Obst, Gemüse, Tiere) | als eigene Unit anlegen |

### 13.2 Nur in der Englisch-App (englischspezifisch)
- **Uhrzeit-Bereich** (Zeigeruhr/Digitaluhr, englische Uhrzeitwörter), wird in Tests immer mit gemischt.
- **Wörter ordnen** (Satz aus durcheinandergewürfelten Wörtern).
- Wort-Normalisierung für Englisch (`to`-Präfix, Apostrophe, Kurzformen `isn't|is not`).
- Vorlesen: Zahlen und Uhrzeiten werden in englische Wörter umgewandelt.
- Logo (Möwe mit Flagge), Farbwahl-Texte und Anrede „Mia“ fest eingebaut.

### 13.3 Wenn du etwas davon im neuen Fach brauchst
- **Reihenfolge-Aufgabe** (z. B. Berge nach Höhe sortieren): neue Frage-Funktion schreiben, die eine Frage `q` mit mehreren `opts` erzeugt (richtige Reihenfolge als Text „A – B – C“), oder eine Eingabefrage, in der die Reihenfolge getippt wird.
- **Bilder/Karten:** Datei (SVG oder PNG) in den Ordner legen, in `FILES` von `sw.js` eintragen und in der Frage über `vis` einbinden: `vis: '<img src="karte-deutschland.svg" style="max-width:100%">'`.
  Dafür ein Feld `img` in `content.js` ergänzen und in `mcQ` zu `vis` umwandeln (eine Zeile).
- **Zuordnungsaufgaben** (Land → Hauptstadt): als `terms` anlegen (Land als `q`, Hauptstadt als `a`). Der Test erzeugt daraus automatisch Auswahlfragen mit den anderen Hauptstädten als falschen Antworten.

---

## 14. Empfehlungen für Geografie

1. **Begriffe** (`terms`): Länder, Hauptstädte, Flüsse, Gebirge, Fachwörter (Definition → Begriff). Möglichst kurze Antworten.
2. **Quiz** (`quiz`): Verständnisfragen mit `ctx`-Kurztext, Wahr/Falsch, Himmelsrichtungen, Maßstab, Klima.
3. **Lückentexte** (`fill`): Merksätze („Die ___ fließt durch Köln.“).
4. **Karten:** Eigene einfache SVG-Karten sind ideal (klein, scharf, offline). Beschriftete Karten als Quiz („Welches Land ist rot markiert?“).
5. **Seitenzahlen:** Immer die Buchseite eintragen, auf der der Stoff steht. Dann kann das Kind gezielt „Seite 30 und 31“ üben.
6. **Eigene Formulierungen** (Urheberrecht, siehe Abschnitt 11).
7. **Units:** Wie im Buch (Kapitel). Mit nur 1 Kapitel sieht die Startseite trotzdem passend aus.

---

## 15. Zusammenarbeit mit Claude (Arbeitsablauf)

1. **Seiten fotografieren:** eine Buchseite pro Foto, gerade von oben, ohne Schatten. **Seitenzahl und Kapitel müssen sichtbar sein.**
2. Dazu schreiben: Fach, Kapitel/Unit, Klassenstufe, Name des Kindes.
3. Claude liest die Seiten und erzeugt Einträge für `terms`, `quiz`, `fill` mit Seitenzahl.
4. Neue `content.js` herunterladen und hochladen (ersetzt die alte), `V` in `sw.js` erhöhen.
5. Auf dem Gerät App einmal öffnen und wieder schließen, beim zweiten Mal ist die neue Version da.

**Vorlage für die erste Nachricht an Claude:**
> Ich möchte eine Lern-App für Geografie (Klasse 5, Buch: …) auf Basis des Grundgerüsts bauen. Hier ist `content.js` und die Dokumentation. Kapitel 1 heißt …, Seiten … bis … Bitte erstelle Begriffe, Quizfragen mit Kurztext und Lückentexte in eigenen Worten und trage die Seitenzahlen ein. Fotos folgen.

---

## 16. Bekannte Stolpersteine

| Problem | Lösung |
|---|---|
| Lernstand weg | Adresse hat sich geändert → vorher sichern, danach wiederherstellen. Prüfen, ob `storageKey` einzigartig ist |
| Neue Version erscheint nicht | `V` in `sw.js` erhöhen. App zweimal öffnen. Notfalls Safari-Website-Daten löschen (Lernstand vorher sichern!) |
| Kein Ton | Stummschalter, Lautstärke, Stimme in Einstellungen, ggf. „Stimmen neu laden“ |
| Kein Vollbild | Seite in Safari (nicht im Chrome-iOS) öffnen, „Als Web-App öffnen“ einschalten, Symbol neu anlegen |
| Offline startet nicht | App muss einmal mit Internet geladen sein. Neue Dateien in `FILES` in `sw.js` eintragen |
| Antwort wird nicht erkannt | Alternativen mit `|` oder in `alt` ergänzen |
| Seiten fehlen auf der Startseite | Einträge ohne `p` erscheinen nur bei „Alle“ |
| Fehlermeldung beim Laden | `content.js` prüfen: Komma zwischen Einträgen, Anführungszeichen, Klammern (JavaScript ist streng) |

---

## 17. Versionen

- Version in `content.js` (`app.version`) und `sw.js` (`V`) zusammen hochzählen.
- Vor größeren Änderungen eine Kopie des Ordners aufbewahren.
- Lernstand ist unabhängig vom Code (nur auf dem Gerät).
