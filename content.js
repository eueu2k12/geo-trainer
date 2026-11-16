/* =====================================================================
   content.js – HIER stehen alle Inhalte des Fachs (Beispiel: Geografie).
   Diese Datei ist das Einzige, was du für ein neues Fach austauschen musst.
   Format und Regeln: siehe DOKUMENTATION.md, Abschnitt „content.js“.
   Hinweis: Die Seitenzahlen (p) und Texte unten sind Beispiele zum Ersetzen.
   ===================================================================== */
window.CONTENT = {

  /* ----- App-Einstellungen ----- */
  app: {
    title: "Geografie Trainer",            // Name im Browser-Tab
    child: "Mia",                           // Name in der Begrüßung
    line: "Klasse 5 · Geografie",           // Zeile unter der Begrüßung
    version: "Version 0.1",                 // Fußnote Zeile 1
    copyright: "Copyright by Patrick Uhle", // Fußnote Zeile 2
    speechLang: "de-DE",                    // Sprache der Vorlese-Stimme (Englisch: "en-GB")
    storageKey: "geografie",                // EINDEUTIG pro App! Sonst teilen sich Apps den Lernstand
    testSatz: "Hallo Mia! Das ist meine Stimme."
  },

  /* ----- Units / Kapitel (id = interner Schlüssel, name = Anzeige) ----- */
  units: [
    { id: "U1", name: "Unit 1", title: "Orientierung auf der Erde" },
    { id: "U2", name: "Unit 2", title: "Deutschland" },
    { id: "U3", name: "Unit 3", title: "Europa" },
    { id: "U4", name: "Unit 4", title: "Die Welt" }
  ],

  /* ----- Begriffe: Frage/Begriff -> Antwort (Eingabe-Trainer, Diktat, Tests) -----
     u = Unit-id, p = Buchseite (optional), q = Frage, a = Antwort (Alternativen mit |),
     alt = weitere richtige Antworten (optional), e = Erklärung (optional) */
  terms: [
    { u: "U1", p: 12, q: "Größter Ozean der Erde", a: "Pazifik|Pazifischer Ozean" },
    { u: "U1", p: 12, q: "Kontinent, auf dem Deutschland liegt", a: "Europa" },
    { u: "U1", p: 13, q: "Linie, die die Erde in Nord- und Südhalbkugel teilt", a: "Äquator", e: "Sie liegt bei 0° Breite." },
    { u: "U1", p: 13, q: "Kältester Kontinent", a: "Antarktis" },
    { u: "U2", p: 30, q: "Hauptstadt von Deutschland", a: "Berlin" },
    { u: "U2", p: 30, q: "Höchster Berg Deutschlands", a: "Zugspitze" },
    { u: "U2", p: 31, q: "Meer im Norden Deutschlands (Westen)", a: "Nordsee" },
    { u: "U2", p: 31, q: "Gebirge im Süden Deutschlands", a: "Alpen" }
  ],

  /* ----- Quiz (Multiple Choice) -----
     topic = Themenname (Schaltfläche im Quiz), wrong = falsche Antworten (2–3),
     ctx = optionaler Text, der über der Frage steht (damit man ohne Buch antworten kann) */
  quiz: [
    { u: "U1", p: 12, topic: "Kontinente", q: "Wie viele Kontinente gibt es?", a: "7", wrong: ["5", "9"],
      e: "Europa, Asien, Afrika, Nordamerika, Südamerika, Australien/Ozeanien, Antarktis." },
    { u: "U1", p: 13, topic: "Himmelsrichtungen", q: "Wo geht die Sonne auf?", a: "Im Osten", wrong: ["Im Westen", "Im Süden"] },
    { u: "U2", p: 30, topic: "Deutschland", q: "Wie viele Bundesländer hat Deutschland?", a: "16", wrong: ["12", "20"],
      ctx: "Deutschland ist ein Bundesstaat mit 16 Bundesländern. Die Hauptstadt ist Berlin. Im Norden liegen Nord- und Ostsee, im Süden die Alpen." },
    { u: "U2", p: 30, topic: "Deutschland", q: "Welche Gewässer liegen im Norden?", a: "Nord- und Ostsee", wrong: ["Bodensee", "Mittelmeer"],
      ctx: "Deutschland ist ein Bundesstaat mit 16 Bundesländern. Die Hauptstadt ist Berlin. Im Norden liegen Nord- und Ostsee, im Süden die Alpen." },
    { u: "U2", p: 31, topic: "Wahr oder falsch", q: "Die Zugspitze liegt im Norden Deutschlands.", a: "Falsch", wrong: ["Wahr"], e: "Sie liegt in den Alpen im Süden." }
  ],

  /* ----- Lückentexte (Eingabe) -----
     ___ = Lücke, a = Antwort (Alternativen mit |) */
  fill: [
    { u: "U1", p: 12, q: "Der ___ ist der größte Ozean der Erde.", a: "Pazifik|Pazifische Ozean" },
    { u: "U1", p: 13, q: "Die Erde dreht sich in 24 Stunden um die eigene ___.", a: "Achse" },
    { u: "U2", p: 30, q: "Die Hauptstadt von Deutschland heißt ___.", a: "Berlin" },
    { u: "U2", p: 31, q: "Im Süden Deutschlands liegen die ___.", a: "Alpen" }
  ]
};
