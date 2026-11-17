/* Geografie – content.js (Platzhalter-Inhalte, bitte prüfen und erweitern)
   Felder: u=Bereich, s=Thema (Häkchen), q=Frage, a=Antwort (Alternativen mit |), e=Erklärung */
const L = (u, s, txt) => txt.split("\n").filter(Boolean).map(l => { const [q, a, e] = l.split("="); return { u, s, q, a, e: e || "" }; });
const CAP = (u, s, pre, txt) => txt.split(";").map(p => { const [q, a] = p.split("="); return { u, s, q: pre + q, a }; });
window.CONTENT = {
  app: { title: "Geografie", child: "Mia", line: "Klasse 5 · Geografie", version: "Version 0.1", copyright: "Copyright by Patrick Uhle", storageKey: "geografie", speechLang: "de-DE" },
  units: [
    { id: "karte", name: "Kartenlesen", icon: "🧭" }, { id: "sachsen", name: "Sachsen", icon: "🏰" }, { id: "de", name: "Deutschland", icon: "🇩🇪" },
    { id: "land", name: "Großlandschaften", icon: "⛰️" }, { id: "meer", name: "Nord- und Ostsee", icon: "🌊" }, { id: "eu", name: "Europa", icon: "🇪🇺" },
    { id: "kont", name: "Kontinente und Ozeane", icon: "🌍" }, { id: "globus", name: "Globus", icon: "🌐" }
  ],
  terms: [].concat(
    L("karte", "Himmelsrichtungen", "Gegenteil von Norden=Süden\nGegenteil von Osten=Westen\nGegenteil von Nordosten=Südwesten\nIn welcher Himmelsrichtung geht die Sonne auf?=Osten\nWelches Gerät zeigt die Himmelsrichtungen?=Kompass"),
    L("karte", "Kartenzeichen", "Was erklärt die Zeichen auf einer Karte?=Legende\nWas zeigt der Maßstab?=Verkleinerung|Wie stark die Wirklichkeit verkleinert ist\nMaßstab 1:100 000: 1 cm auf der Karte sind wie viele km?=1\nWas bedeuten blaue Flächen auf Karten?=Wasser|Gewässer"),
    L("sachsen", "Städte", "Landeshauptstadt von Sachsen=Dresden\nGrößte Stadt in Sachsen=Leipzig\nStadt in Sachsen, früher Karl-Marx-Stadt=Chemnitz\nStadt an der Neiße an der Grenze zu Polen=Görlitz"),
    L("sachsen", "Flüsse und Berge", "Welcher große Fluss fließt durch Dresden?=Elbe\nHöchster Berg Sachsens=Fichtelberg\nGebirge an der Grenze zu Tschechien=Erzgebirge\nGebirge bei Bad Schandau=Elbsandsteingebirge"),
    L("sachsen", "Nachbarn", "Sachsen grenzt an Polen und welches weitere Land?=Tschechien\nWelches Bundesland liegt westlich von Sachsen (Erfurt)?=Thüringen"),
    CAP("de", "Hauptstädte", "Hauptstadt von ", "Baden-Württemberg=Stuttgart;Bayern=München;Brandenburg=Potsdam;Hessen=Wiesbaden;Mecklenburg-Vorpommern=Schwerin;Niedersachsen=Hannover;Nordrhein-Westfalen=Düsseldorf;Rheinland-Pfalz=Mainz;Saarland=Saarbrücken;Sachsen=Dresden;Sachsen-Anhalt=Magdeburg;Schleswig-Holstein=Kiel;Thüringen=Erfurt"),
    L("de", "Hauptstadt", "Hauptstadt von Deutschland=Berlin\nWie viele Bundesländer hat Deutschland?=16\nWelche drei Bundesländer sind Stadtstaaten?=Berlin, Hamburg, Bremen"),
    L("de", "Flüsse", "Welcher Fluss fließt durch Köln?=Rhein\nWelcher Fluss fließt durch Hamburg?=Elbe\nWelcher Fluss fließt durch Frankfurt am Main?=Main\nWelcher Fluss fließt durch Berlin?=Spree\nWelcher Fluss bildet mit der Neiße die Grenze zu Polen?=Oder\nWelcher Fluss mündet ins Schwarze Meer?=Donau\nWelcher Fluss fließt durch Bremen?=Weser"),
    L("de", "Gebirge und Seen", "Höchster Berg Deutschlands=Zugspitze\nHöchster Berg im Harz=Brocken\nHöchster Berg im Schwarzwald=Feldberg\nGrößter See Deutschlands, der ganz in Deutschland liegt=Müritz\nGrößter See an der Grenze zu Österreich und der Schweiz=Bodensee\nSee in Bayern, das „Bayerische Meer“=Chiemsee"),
    L("de", "Nachbarländer", "Land nördlich von Deutschland=Dänemark\nLand östlich von Deutschland (Warschau)=Polen\nLand südöstlich von Deutschland (Prag)=Tschechien\nLand südlich von Deutschland (Wien)=Österreich\nLand südlich von Deutschland (Bern)=Schweiz\nLand westlich von Deutschland (Paris)=Frankreich\nLand westlich von Deutschland (Amsterdam)=Niederlande\nLand westlich von Deutschland (Brüssel)=Belgien\nLand westlich von Deutschland (Luxemburg)=Luxemburg|Luxemburg"),
    L("land", "Großlandschaften", "Wie heißt die Großlandschaft im Norden Deutschlands?=Norddeutsches Tiefland\nWie heißt die Großlandschaft in der Mitte Deutschlands?=Mittelgebirge|Mittelgebirgsland\nWie heißt die Landschaft zwischen Donau und Alpen?=Alpenvorland\nWie heißt das höchste Gebirge im Süden?=Alpen"),
    L("meer", "Meere und Inseln", "Welches Meer liegt im Norden Deutschlands im Westen?=Nordsee\nWelches Meer liegt im Nordosten Deutschlands?=Ostsee\nGrößte deutsche Insel=Rügen\nWelche Insel liegt in der Nordsee (Nordfriesland)?=Sylt\nWelche Ostsee-Insel liegt bei Polen?=Usedom\nWas verbindet Nordsee und Ostsee?=Nord-Ostsee-Kanal\nWie heißt der Wechsel von Ebbe und Flut?=Gezeiten"),
    CAP("eu", "Hauptstädte Westeuropa", "Hauptstadt von ", "Frankreich=Paris;Spanien=Madrid;Portugal=Lissabon;Großbritannien=London;Irland=Dublin;Belgien=Brüssel;Niederlande=Amsterdam;Luxemburg=Luxemburg"),
    CAP("eu", "Hauptstädte Osteuropa", "Hauptstadt von ", "Polen=Warschau;Tschechien=Prag;Slowakei=Bratislava;Ungarn=Budapest;Rumänien=Bukarest;Bulgarien=Sofia;Ukraine=Kiew;Litauen=Vilnius;Lettland=Riga;Estland=Tallinn"),
    L("eu", "Flüsse Europas", "Längster Fluss Europas=Wolga\nFluss durch Paris=Seine\nFluss durch London=Themse\nFluss durch Wien und Budapest=Donau"),
    L("kont", "Kontinente", "Wie viele Kontinente gibt es?=7\nGrößter Kontinent=Asien\nKontinent, auf dem Deutschland liegt=Europa\nKontinent am Südpol=Antarktis"),
    L("kont", "Ozeane", "Größter Ozean=Pazifik|Pazifischer Ozean\nOzean zwischen Europa und Amerika=Atlantik|Atlantischer Ozean\nOzean vor Indien=Indischer Ozean"),
    L("globus", "Gradnetz", "Wie heißt der Breitenkreis bei 0 Grad?=Äquator\nDer Nullmeridian verläuft durch welchen Stadtteil von London?=Greenwich\nHalbkugel nördlich des Äquators=Nordhalbkugel\nHalbkugel südlich des Äquators=Südhalbkugel\nWie heißen die Linien von Pol zu Pol?=Längenkreise|Meridiane")
  ),
  quiz: [
    { u: "de", s: "Nachbarländer", topic: "Deutschland", q: "Wie viele Nachbarländer hat Deutschland?", a: "9", wrong: ["7", "8", "10"], e: "Dänemark, Polen, Tschechien, Österreich, Schweiz, Frankreich, Luxemburg, Belgien, Niederlande." },
    { u: "de", s: "Flüsse", topic: "Deutschland", q: "Welcher Fluss ist der Rhein-Nebenfluss in Frankfurt?", a: "Main", wrong: ["Elbe", "Oder", "Weser"], e: "" },
    { u: "sachsen", s: "Städte", topic: "Sachsen", q: "Wie heißt die Landeshauptstadt von Sachsen?", a: "Dresden", wrong: ["Leipzig", "Chemnitz", "Görlitz"], e: "" },
    { u: "kont", s: "Kontinente", topic: "Kontinente", q: "Auf welchem Kontinent liegt Brasilien?", a: "Südamerika", wrong: ["Afrika", "Asien", "Nordamerika"], e: "" },
    { u: "globus", s: "Gradnetz", topic: "Globus", q: "Wie heißt der Kreis, der die Erde in Nord und Süd teilt?", a: "Äquator", wrong: ["Nullmeridian", "Wendekreis", "Polarkreis"], e: "" },
    { u: "karte", s: "Kartenzeichen", topic: "Kartenlesen", q: "Wo steht, was die Zeichen auf der Karte bedeuten?", a: "In der Legende", wrong: ["Im Maßstab", "Im Titel", "Im Netz"], e: "" }
  ],
  fill: [
    { u: "sachsen", s: "Flüsse und Berge", q: "Durch Dresden fließt die ___.", a: "Elbe", e: "" },
    { u: "de", s: "Hauptstadt", q: "Die Hauptstadt von Deutschland heißt ___.", a: "Berlin", e: "" },
    { u: "meer", s: "Meere und Inseln", q: "Die größte deutsche Insel heißt ___.", a: "Rügen", e: "" },
    { u: "globus", s: "Gradnetz", q: "Der Nullmeridian verläuft durch ___.", a: "Greenwich", e: "" },
    { u: "karte", s: "Himmelsrichtungen", q: "Die Sonne geht im ___ auf.", a: "Osten", e: "" }
  ]
};
