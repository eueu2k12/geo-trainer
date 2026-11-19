/* =====================================================================
   Lern-App Grundgerüst – app.js
   Allgemeine Logik. Fachinhalte stehen NUR in content.js.
   Aufbau: 1 Zustand/Speicher · 2 Auswahl (Units/Seiten) · 3 Quiz-Motor
           4 Ansichten · 5 Vorlesen · 6 Einstellungen/Theme · 7 Lernzeit
   ===================================================================== */

/* ---------- 1. Grundlagen & Zustand ---------- */
const C = window.CONTENT, A = C.app;
const K = "lernapp-" + (A.storageKey || "standard");      // Speicherschlüssel (pro App eindeutig!)
const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sh = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
const pad = x => String(x).padStart(2, "0");
const UN = C.units.map(u => u.id), UNAME = {};
C.units.forEach(u => { UNAME[u.id] = u.name; });
document.title = A.title;

const COL = {
  blau: ["#2f6fed", "#6b9bff", "Blau"], gruen: ["#1f9d55", "#43c47c", "Grün"],
  lila: ["#7c4dff", "#a98bff", "Lila"], pink: ["#e0409a", "#ff7cc4", "Pink"],
  orange: ["#e8720c", "#ffa14d", "Orange"]
};
const LOGO = `<svg width="60" height="60" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-label="Logo"><rect width="512" height="512" rx="96" fill="#8fd0ff"/><circle cx="256" cy="256" r="190" fill="#2f6fed" stroke="#1b1b1b" stroke-width="14"/><path d="M150 190c30-40 90-50 120-20 20 20-10 45-30 60-30 20-30 50-60 40-30-10-60-50-30-80z" fill="#43c47c" stroke="#1b1b1b" stroke-width="8" stroke-linejoin="round"/><path d="M300 290c30-10 70 0 80 30 8 30-30 70-60 60-30-10-30-60-20-90z" fill="#43c47c" stroke="#1b1b1b" stroke-width="8" stroke-linejoin="round"/><path d="M330 150c20-10 50 0 50 20s-30 30-50 20-10-30 0-40z" fill="#43c47c" stroke="#1b1b1b" stroke-width="8" stroke-linejoin="round"/></svg>`;

function defS() {
  return { pts: 0, st: {}, t: {}, th: {}, bad: {}, mine: [], err: [], sel: [UN[0]],
           set: { mode: "auto", color: "blau" } };
}
let S = null;
try { S = JSON.parse(localStorage.getItem(K)); } catch (e) {}
S = Object.assign(defS(), S || {});
S.set = Object.assign(defS().set, S.set || {});
if (!S.sel || !S.sel.length) S.sel = [UN[0]];
function save() { try { localStorage.setItem(K, JSON.stringify(S)); } catch (e) {} }

/* ---------- 2. Daten & Auswahl (Units + Seitenzahlen) ---------- */
const tkey = t => t.u + "|" + t.q;                          // eindeutiger Schlüssel eines Begriffs
const allT = () => C.terms.concat(S.mine);                  // Begriffe aus content.js + eigene
const inSel = x => S.sel.includes(x.u) && (!x.s || !S.th[x.u] || S.th[x.u].includes(x.s));   // Bereich + Themen-Häkchen
const T = () => allT().filter(inSel), QZ = () => C.quiz.filter(inSel), FL = () => C.fill.filter(inSel);
function themesOf(u) { const t = new Set(); allT().concat(C.quiz, C.fill).forEach(x => { if (x.u == u && x.s) t.add(x.s); }); Object.values(window.MAPS || {}).forEach(m => { if (m.u == u && m.s) t.add(m.s); }); return [...t]; }
const ws = k => S.bad[k] || (S.bad[k] = { box: 0, ok: 0, bad: 0 });   // Lernstand je Begriff (Leitner-Fach)

/* Antworten prüfen: Groß/Klein, Umlaute (ä=ae), ß=ss, Satzzeichen und Artikel egal. Alternativen mit | */
const norm = t => String(t).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
  .replace(/[’`´]/g, "'").replace(/[.,!?;:"„“()]/g, "").replace(/\s+/g, " ").trim();
const alts = a => String(a).split("|").map(s => s.trim()).filter(Boolean);
const noArt = s => s.replace(/^(der|die|das|ein|eine) /, "");
function accepts(list, v) {
  const L = list.map(norm), n = norm(v);
  return L.includes(n) || L.map(noArt).includes(noArt(n));
}

/* ---------- 3. Quiz-Motor (MC + Eingabe), Fehlerliste, Punkte ---------- */
let Q = null, V = { unit: "all", w: null, res: null, last: null };
function rec(keys, g) {                                     // Statistik je Unit/Thema + Punkte
  [].concat(keys).forEach(k => { S.st[k] = S.st[k] || [0, 0]; S.st[k][g ? 0 : 1]++; });
  if (g) S.pts += 10;
  save();
}
const mcQ = x => ({ q: x.q, a: x.a, opts: sh([x.a].concat(x.wrong || [])), e: x.e || "",
  k: [x.u, "t:" + (x.topic || "Quiz")], vis: x.ctx ? `<div class="txt">${x.ctx}</div>` : "", sp: x.q });
const fillQ = f => { const L = alts(f.a).concat(f.alt || []);
  return { q: f.q, ty: 1, a: L[0], acc: L, opts: [], e: `Richtig: ${L[0]}. ${f.e || ""}`, k: [f.u, "t:Lückentexte"], sp: f.q }; };
const termQ = t => { const L = alts(t.a).concat(t.alt || []);
  return { q: t.q, ty: 1, a: L[0], acc: L, opts: [], e: `Richtig: ${L[0]}. ${t.e || ""}`, k: [t.u, "t:Begriffe"], spA: L[0] }; };
function termMC(t, pool) {
  const c = alts(t.a)[0], wr = [...new Set(sh(pool.filter(x => x !== t)).map(x => alts(x.a)[0]))].filter(x => x != c).slice(0, 3);
  return { q: t.q, a: c, opts: sh([c].concat(wr)), e: t.e || "", k: [t.u, "t:Begriffe"], spA: c };
}
function start(qs, t, er) {
  if (!qs.length) {
    $("#app").innerHTML = `<h1>${esc(t)}</h1><div class="card">Dafür gibt es in der gewählten Auswahl noch keine Aufgaben.</div><a class="btn p" href="#home">Auswahl ändern</a>`;
    return;
  }
  Q = { qs, t, i: 0, ok: 0, sel: null, er: !!er };
  location.hash = "#quiz"; render();
  
}
function quiz() {
  if (!Q) return home();
  const q = Q.qs[Q.i];
  if (!q) return `<h1>Fertig! 🎉</h1><div class="card"><div class="big">${Q.ok} von ${Q.qs.length} richtig</div><p>${Q.ok == Q.qs.length ? "Perfekt!" : Q.ok >= Q.qs.length * .7 ? "Sehr gut gemacht!" : "Übung hilft – versuch es gleich noch einmal."}</p><a class="btn p" href="#home">Zur Startseite</a></div>`;
  let h = `<h1>${esc(Q.t)}</h1><p class="mu">Frage ${Q.i + 1} von ${Q.qs.length}</p><div class="card">${q.vis || ""}<div class="big">${esc(q.q)}</div>${q.map ? mapSvg(q.map, { tap: Q.sel == null, ok: Q.sel != null ? q.tg : null, bad: Q.sel == "✗" ? Q.tap : null }) : ""}`;
  q.opts.forEach((o, i) => {
    const c = Q.sel == null ? "" : o == q.a ? "ok" : o == Q.sel ? "bad" : "";
    h += `<button class="opt ${c}" onclick="ans(${i})">${esc(o)}</button>`;
  });
  if (q.ty && Q.sel == null) h += `<input id="qa" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Antwort schreiben" onkeydown="if(event.key=='Enter')tans()"><button class="p" onclick="tans()">Prüfen</button>`;
  if (Q.sel != null) h += `<p class="${Q.sel == q.a ? "good" : "badc"}">${Q.sel == q.a ? "Richtig! ✅" : "Nicht ganz."} ${esc(q.e || "")}</p><button class="p" onclick="nxt()">Weiter</button>`;
  return h + `</div>`;
}
function ans(i) {
  const q = Q.qs[Q.i]; if (Q.sel != null) return;
  Q.sel = q.opts[i]; const g = Q.sel == q.a; if (g) Q.ok++;
  rec(q.k, g); errRec(q, g); render();
}
function tans() {
  const q = Q.qs[Q.i]; if (Q.sel != null) return;
  const r = $("#qa").value; if (!norm(r)) return;
  const g = accepts(q.acc, r); Q.sel = g ? q.a : "✗"; if (g) Q.ok++;
  rec(q.k, g); errRec(q, g); render();
}
function nxt() { Q.i++; Q.sel = null; Q.tap = null; render(); }
/* Karten: Region antippen oder markierte Region benennen (Karten stehen in maps.js) */
function mapSvg(m, o) { o = o || {}; const M = MAPS[m];
  return `<svg viewBox="${M.vb}" class="map${M.img ? " im" : ""}">` + (M.img ? `<image href="${M.img}" width="${M.w}" height="${M.h}"/>` : "") + Object.entries(M.r).map(([id, r]) => r.c ? `<path d="${r.d}" class="rg ctx"/>` : (r.h && o.tap ? `<path d="${r.d}" class="hit" onclick="tapMap('${id}')"/>` : "") + `<path d="${r.d}" class="rg${o.hi == id ? " hi" : ""}${o.ok == id ? " ok" : ""}${o.bad == id ? " bad" : ""}"${o.tap ? ` onclick="tapMap('${id}')"` : ""}/>`).join("") + (M.x || "") + `</svg>`; }
function tapMap(id) { const q = Q.qs[Q.i]; if (Q.sel != null) return; Q.tap = id; const g = id == q.tg; Q.sel = g ? q.a : "✗"; if (g) Q.ok++; rec(q.k, g); errRec(q, g); render(); }
const maps = () => Object.keys(window.MAPS || {}).filter(m => inSel(MAPS[m]));
function mapGo(m, kind) {
  const M = MAPS[m], ids = Object.keys(M.r).filter(k => !M.r[k].c);
  start(sh(ids).slice(0, 10).map(id => { const n = M.r[id].n, k = [M.u, "t:Karte"];
    if (kind == "tap") return { q: "Tippe auf der Karte: " + n, a: n, opts: [], map: m, tg: id, e: "Gesucht war: " + n, k };
    const wr = sh(ids.filter(x => x != id)).slice(0, 3).map(x => M.r[x].n);
    return { q: "Wie heißt das markierte Gebiet?", a: n, opts: sh([n].concat(wr)), vis: mapSvg(m, { hi: id }), e: "", k }; }), M.title);
}

/* Meine Fehler: falsch beantwortete Fragen merken, nach 2 richtigen Wiederholungen entfernen */
function errRec(q, g) {
  S.err = S.err || [];
  const key = (q.q || "") + "|" + q.a; const it = S.err.find(x => x.key == key);
  if (it) { if (g) { it.ok = (it.ok || 0) + 1; if (it.ok >= 2) S.err = S.err.filter(x => x !== it); } else it.ok = 0; }
  else if (!g && !Q.er) {
    S.err.push({ key, q: q.q, a: q.a, o: q.opts, e: q.e, k: q.k, ty: q.ty, acc: q.acc, vis: q.vis, sp: q.sp, spA: q.spA, map: q.map, tg: q.tg, ok: 0 });
    if (S.err.length > 150) S.err.shift();
  }
  save();
}
function errGo(n) { start(sh(S.err || []).slice(0, n).map(it => ({ ...it, opts: it.ty ? [] : sh(it.o || []) })), "Meine Fehler", 1); }

/* ---------- 4. Ansichten ---------- */
const NAV = [["home", "Start"]].concat(C.units.map(u => ["b-" + u.id, u.name]), [["test", "Test"], ["fortschritt", "Fortschritt"], ["fehler", "Fehler"], ["einstellungen", "Einstellungen"]]);
function render() {
  const v = location.hash.slice(1) || "home";
  $("#nav").innerHTML = NAV.map(n => `<a href="#${n[0]}" class="${n[0] == v ? "on" : ""}">${n[1]}</a>`).join("");
  const f = v.indexOf("b-") == 0 ? () => bereich(v.slice(2)) : ({ home, begriffe, quizwahl, luecken, test, fortschritt, fehler, einstellungen, quiz }[v] || home);
  $("#app").innerHTML = f();
  const a = $("#ans") || $("#qa"); if (a && (a.id == "qa" || !V.res)) a.focus();
}
window.addEventListener("hashchange", render);

/* Start: Begrüßung, Unit-/Seitenauswahl, Kacheln, Lernzeit, Fußnote */
function toggleUnit(u) { S.sel = S.sel.includes(u) ? S.sel.filter(x => x != u) : [...S.sel, u]; if (!S.sel.length) S.sel = [u]; V.w = null; save(); render(); }
function toggleTh(u, t) { const all = themesOf(u); let a = S.th[u] || all.slice(); a = a.includes(t) ? a.filter(x => x != t) : [...a, t]; if (!a.length) a = all.slice(); S.th[u] = a; V.w = null; save(); render(); }
const chk = (on, oc, label) => `<label class="chk"><input type="checkbox" ${on ? "checked" : ""} onchange="${oc}"><span>${esc(label)}</span></label>`;
function unitBox() { return `<div class="card"><b>Welche Bereiche?</b>` + UN.map(u => chk(S.sel.includes(u), `toggleUnit('${u}')`, UNAME[u])).join("") + `</div>`; }
function bereich(u) {
  if (!UNAME[u]) return home();
  S.sel = [u]; V.w = null; const th = themesOf(u), a = S.th[u] || th;
  return `<h1>${esc(UNAME[u])}</h1><p class="mu">${T().length} Begriffe · ${QZ().length} Quizfragen · ${FL().length} Lückentexte</p>` +
    (th.length ? `<div class="card"><b>Was möchtest du üben?</b>${th.map(t => chk(a.includes(t), `toggleTh('${u}','${t}')`, t)).join("")}</div>` : "") +
    `<button class="p" onclick="location.hash='#begriffe'">📚 Begriffe</button><button class="p" onclick="location.hash='#quizwahl'">✅ Quiz</button><button class="p" onclick="location.hash='#luecken'">📝 Lückentexte</button>` + (u == "de" ? `<button class="p" onclick="bundGo()">🏙️ Bundesländer und Hauptstädte</button>` : "") +
    maps().map(m => `<div class="card"><b>🗺️ ${esc(MAPS[m].title)}</b><br><button class="p" onclick="mapGo('${m}','tap')">Auf der Karte antippen</button><button class="p" onclick="mapGo('${m}','ask')">Markiertes benennen</button></div>`).join("");
}
const dk = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
function tm(w) {
  S.t = S.t || {}; const n = new Date();
  if (!w) return S.t[dk(n)] || 0;
  const m = new Date(n); m.setDate(n.getDate() - ((n.getDay() + 6) % 7)); let s = 0;
  for (let i = 0; i < 7; i++) { const d = new Date(m); d.setDate(m.getDate() + i); s += S.t[dk(d)] || 0; }
  return s;
}
const ttxt = () => `Heute: <b>${Math.floor(tm(0) / 60)} min</b> &nbsp;·&nbsp; Woche: <b>${Math.floor(tm(1) / 60)} min</b>`;
function home() {
  const h = new Date().getHours(), g = h < 11 ? "Guten Morgen" : h < 18 ? "Hallo" : "Guten Abend";
  const hard = allT().filter(t => ws(tkey(t)).bad > ws(tkey(t)).ok).length;
  return `<div style="display:flex;align-items:center;gap:12px"><span class="logo">${LOGO}</span><h1 style="margin:0">${g} ${esc(A.child)}! 👋</h1></div>
  <p class="mu">${esc(A.line)} · <b>${S.pts}</b> Punkte · ${T().length} Begriffe${hard ? ` · ${hard} schwierige` : ""}</p>
  <div class="grid">${C.units.map(u => `<a class="tile" href="#b-${u.id}"><span>${u.icon || "📍"}</span>${esc(u.name)}</a>`).join("")}</div><h2>Mehr</h2><div class="grid"><a class="tile" href="#test"><span>🏆</span>Test</a><a class="tile" href="#fortschritt"><span>📈</span>Fortschritt</a><a class="tile" href="#fehler"><span>🔁</span>Meine Fehler</a></div>
  <p id="tt" class="mu" style="text-align:center;margin-top:24px">${ttxt()}</p>
  <p class="mu" style="text-align:center;font-size:13px;margin-top:12px">${esc(A.version)}<br>${esc(A.copyright)}</p>`;
}

/* Begriffe-Trainer (Eingabe, Leitner-Fächer: falsche Begriffe kommen öfter) */
function pool() { const p = V.unit == "hardall" ? allT() : T(); return p.filter(t => V.unit.indexOf("hard") < 0 || ws(tkey(t)).bad > ws(tkey(t)).ok); }
function pick() {
  const p = pool(); if (!p.length) { V.w = null; return; }
  const wt = p.map(t => p.length > 1 && tkey(t) == V.last ? 0 : 5 - Math.min(ws(tkey(t)).box, 4));
  let r = Math.random() * wt.reduce((a, b) => a + b, 0), i = 0;
  while (i < p.length - 1 && r >= wt[i]) { r -= wt[i]; i++; }
  V.w = p[i]; V.res = null;
}
function begriffe() {
  if (!V.w || !allT().includes(V.w) || (V.unit != "hardall" && !inSel(V.w))) pick();
  let h = `<h1>Begriffe</h1><select onchange="V.unit=this.value;pick();render()"><option value="all">Alle gewählten Begriffe</option><option value="hard"${V.unit == "hard" ? " selected" : ""}>Schwierige Begriffe</option><option value="hardall"${V.unit == "hardall" ? " selected" : ""}>Meine Fehler (alle Bereiche)</option></select>`;
  const w = V.w; if (!w) return h + `<div class="card">Hier gibt es noch keine Begriffe.</div>`;
  h += `<div class="card"><div class="big">${esc(w.q)}</div>
  <input id="ans" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Antwort schreiben" ${V.res ? "disabled" : ""} onkeydown="if(event.key=='Enter')${V.res ? "nextT()" : "checkT()"}">`;
  h += V.res ? `<p class="${V.res.good ? "good" : "badc"}">${V.res.good ? "Richtig! ✅" : "Leider falsch. Richtig ist: " + esc(alts(w.a)[0])} ${esc(w.e || "")}</p><button class="p" onclick="nextT()">Weiter</button>` : `<button class="p" onclick="checkT()">Prüfen</button>`;
  return h + `</div>`;
}
function checkT() {
  const t = V.w, v = $("#ans").value; if (!norm(v)) return;
  const good = accepts(alts(t.a).concat(t.alt || []), v), s = ws(tkey(t));
  s.box = good ? Math.min(s.box + 1, 4) : 0; good ? s.ok++ : s.bad++;
  rec([t.u, "t:Begriffe"], good); V.res = { good }; render();
}
function nextT() { V.last = tkey(V.w); pick(); render(); }

/* Quiz (Multiple Choice) – nach Thema wählbar */
function quizwahl() {
  const topics = [...new Set(QZ().map(x => x.topic || "Quiz"))];
  if (!topics.length) return `<h1>Quiz</h1><div class="card">Für die gewählte Auswahl gibt es noch keine Quizfragen.</div>`;
  return `<h1>Quiz</h1><p class="mu">Wähle ein Thema:</p><button class="opt p" onclick="quizGo('*')">Alle Themen mischen</button>` +
    topics.map(t => { const s = S.st["t:" + t] || [0, 0]; return `<button class="opt" onclick="quizGo(${JSON.stringify(t).replace(/"/g, "&quot;")})">${esc(t)} <span class="mu">· ${s[0]} richtig, ${s[1]} falsch</span></button>`; }).join("");
}
function quizGo(t) { start(sh(QZ().filter(x => t == "*" || (x.topic || "Quiz") == t)).slice(0, 15).map(mcQ), t == "*" ? "Quiz" : t); }
function luecken() {
  return `<h1>Lückentexte</h1><p class="mu">Schreibe das fehlende Wort. 10 Aufgaben pro Runde.</p><button class="p" onclick="start(sh(FL()).slice(0,10).map(fillQ),'Lückentexte')">Starten</button>`;
}

/* Test: gemischt aus Quiz, Lückentexte und Begriffen */
function test() {
  return `<h1>Test</h1>${unitBox()}<p class="mu">Gemischte Fragen aus der gewählten Auswahl.</p><button class="p" onclick="startTest(10)">Kurz (10)</button><button class="p" onclick="startTest(20)">Groß (20)</button>`;
}
function startTest(n) {
  const a = Math.ceil(n * .4), b = Math.ceil(n * .3), c = n - a - b, tt = T();
  const qs = sh([...sh(QZ()).slice(0, a).map(mcQ), ...sh(FL()).slice(0, b).map(fillQ), ...sh(tt).slice(0, c).map((t, i) => i % 2 ? termQ(t) : termMC(t, tt))]);
  start(qs, "Test");
}

/* Fortschritt & Meine Fehler */
function fortschritt() {
  const rows = Object.entries(S.st).sort();
  const hard = allT().filter(t => ws(tkey(t)).bad > ws(tkey(t)).ok).sort((a, b) => (ws(tkey(b)).bad - ws(tkey(b)).ok) - (ws(tkey(a)).bad - ws(tkey(a)).ok)).slice(0, 10);
  let h = `<h1>Fortschritt</h1><div class="card"><div class="big">${S.pts} Punkte</div></div><h2>Pro Bereich / Thema</h2>`;
  if (!rows.length) h += `<p class="mu">Noch nichts geübt – los geht’s!</p>`;
  rows.forEach(([k, [o, b]]) => {
    const p = Math.round(o / (o + b) * 100), name = k.indexOf("t:") == 0 ? "Thema: " + k.slice(2) : (UNAME[k] || k);
    h += `<div class="card"><div class="row" style="border:0"><b>${esc(name)}</b><span>${o} richtig · ${b} falsch</span></div><div class="bar"><i style="width:${p}%"></i></div></div>`;
  });
  h += `<h2>Schwierige Begriffe</h2>`;
  h += hard.length ? hard.map(t => `<div class="row"><span>${esc(t.q)} – ${esc(alts(t.a)[0])}</span><span class="badc">${ws(tkey(t)).bad}× falsch</span></div>`).join("") : `<p class="mu">Keine schwierigen Begriffe. Super!</p>`;
  return h;
}
function fehler() {
  const n = (S.err || []).length, hw = allT().filter(t => ws(tkey(t)).bad > ws(tkey(t)).ok).length;
  let h = `<h1>Meine Fehler 🔁</h1>`;
  if (!n && !hw) return h + `<div class="card">Keine Fehler – super gemacht! 🎉<br><span class="mu">Sobald etwas falsch war, taucht es hier auf. Nach zwei richtigen Antworten verschwindet es wieder.</span></div>`;
  h += `<div class="card"><b>Fragen</b><p class="mu">${n ? n + " Frage(n) zum Wiederholen" : "Keine Fragen offen."}</p>${n ? `<button class="p" onclick="errGo(10)">10 üben</button><button onclick="errGo(30)">30 üben</button>` : ""}</div>`;
  h += `<div class="card"><b>Begriffe</b><p class="mu">${hw ? hw + " Begriffe, die noch nicht sicher sind" : "Keine unsicheren Begriffe."}</p>${hw ? `<button class="p" onclick="V.unit='hardall';V.w=null;location.hash='#begriffe'">Begriffe üben</button>` : ""}</div>`;
  return h;
}

/* ---------- 6. Einstellungen: Aussehen, Vorlesen, Sicherung, eigene Begriffe ---------- */
function setSet(k, v, nr) { S.set[k] = k == "rate" ? parseFloat(v) : v; save(); applyTheme(); if (!nr) render(); }
function applyTheme() {
  const s = S.set || {}, r = document.documentElement, dm = matchMedia("(prefers-color-scheme: dark)").matches, m = s.mode || "auto", dark = m == "dark" || (m == "auto" && dm);
  if (m == "light" || m == "dark") r.setAttribute("data-theme", m); else r.removeAttribute("data-theme");
  const c = COL[s.color] || COL.blau; r.style.setProperty("--pr", dark ? c[1] : c[0]);
  const mt = document.querySelector('meta[name=theme-color]'); if (mt) mt.content = dark ? "#10141d" : "#f4f7fc";
}
function ausseh() {
  const s = S.set;
  return `<h2>Aussehen</h2><div class="card"><b>Helligkeit</b><br>` + [["auto", "Automatisch"], ["light", "Hell"], ["dark", "Dunkel"]].map(a => `<button class="${s.mode == a[0] ? "on" : ""}" onclick="setSet('mode','${a[0]}')">${a[1]}</button>`).join("") +
    `<br><b>Farbe</b><br>` + Object.keys(COL).map(k => `<button class="colb ${s.color == k ? "on" : ""}" style="border-color:${COL[k][0]}" onclick="setSet('color','${k}')"><i style="background:${COL[k][0]}"></i>${COL[k][2]}</button>`).join("") + `</div>`;
}
function sicherung() {
  return `<h2>Sicherung</h2><div class="card"><b>Daten sichern</b><p class="mu">Der Lernstand liegt nur auf diesem Gerät. Text kopieren und z. B. in einer Notiz speichern.</p><textarea id="ex" readonly>${esc(JSON.stringify(S))}</textarea><button class="p" onclick="cp()">Kopieren</button></div>
  <div class="card"><b>Wiederherstellen</b><textarea id="im" placeholder="Gesicherten Text hier einfügen"></textarea><button class="p" onclick="imp()">Wiederherstellen</button><p id="msg"></p></div>`;
}
function cp() { const t = $("#ex"); t.select(); try { navigator.clipboard.writeText(t.value); } catch (e) { try { document.execCommand("copy"); } catch (x) {} } }
function imp() {
  try { const d = JSON.parse($("#im").value); if (!d || typeof d != "object" || !d.st) throw 0; S = Object.assign(defS(), d); S.set = Object.assign(defS().set, S.set || {}); V.w = null; save(); applyTheme(); $("#msg").textContent = "Wiederhergestellt ✅"; }
  catch (e) { $("#msg").textContent = "Das hat nicht geklappt. Ist der ganze Text eingefügt?"; }
}
function eigene() {
  const opts = UN.map(u => `<option value="${u}">${esc(UNAME[u])}</option>`).join("");
  return `<h2>Eigene Begriffe</h2><div class="card"><b>Neuer Begriff</b><select id="nu">${opts}</select><input id="nq" placeholder="Frage / Begriff"><input id="na" placeholder="Antwort (Alternativen mit | trennen)"><button class="p" onclick="addT()">Hinzufügen</button></div>
  <div class="card"><b>Viele auf einmal</b><p class="mu">Eine Zeile pro Begriff: Frage = Antwort</p><textarea id="bulk" placeholder="Hauptstadt von Spanien = Madrid"></textarea><select id="bu">${opts}</select><button class="p" onclick="bulkT()">Importieren</button></div>
  <h3>Meine eigenen Begriffe (${S.mine.length})</h3>` + S.mine.map((t, i) => `<div class="row"><span>${esc(t.q)} – ${esc(t.a)} <span class="mu">· ${esc(UNAME[t.u] || t.u)}</span></span><button onclick="delT(${i})" aria-label="Löschen">🗑</button></div>`).join("");
}
function addT() { const q = $("#nq").value.trim(), a = $("#na").value.trim(); if (!q || !a) return; S.mine.push({ u: $("#nu").value, q, a }); save(); render(); }
function bulkT() { const u = $("#bu").value; $("#bulk").value.split("\n").forEach(l => { const p = l.split(/\s*=\s*/); if (p.length >= 2 && p[0] && p[1]) S.mine.push({ u, q: p[0].trim(), a: p[1].trim() }); }); save(); render(); }
function delT(i) { S.mine.splice(i, 1); V.w = null; save(); render(); }
function einstellungen() { return `<h1>Einstellungen</h1>` + ausseh() + sicherung() + eigene(); }

/* ---------- 7. Lernzeit (zählt nur bei sichtbarer App und Bedienung in den letzten 2 Minuten) ---------- */
let LA = Date.now(), TS = 0;
["click", "keydown", "touchstart", "scroll", "mousemove"].forEach(e => addEventListener(e, () => { LA = Date.now(); }, { passive: true }));
setInterval(() => {
  if (document.visibilityState !== "visible" || Date.now() - LA > 120000) return;
  S.t = S.t || {}; const k = dk(new Date()); S.t[k] = (S.t[k] || 0) + 5;
  if (++TS % 6 == 0) save();
  const el = document.getElementById("tt"); if (el) el.innerHTML = ttxt();
}, 5000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") save(); });

applyTheme();
try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme); } catch (e) {}
render();

/* Übung: Bundesländer und Hauptstädte */
function bundGo() {
  const caps = C.caps, M = MAPS.de, ids = Object.keys(caps), k = ["de", "t:Hauptstädte"], n = id => M.r[id].n, oth = id => sh(ids.filter(x => x != id)).slice(0, 3);
  const mc = id => ({ q: "Hauptstadt von " + n(id) + "?", a: caps[id], opts: sh([caps[id]].concat(oth(id).map(x => caps[x]))), e: "", k });
  const rv = id => ({ q: caps[id] + " ist die Hauptstadt von …", a: n(id), opts: sh([n(id)].concat(oth(id).map(n))), e: "", k });
  const tp = id => ({ q: "Tippe auf das Bundesland mit der Hauptstadt " + caps[id], a: n(id), opts: [], map: "de", tg: id, e: "Gesucht: " + n(id), k });
  const p = sh(ids);
  start(sh(p.slice(0, 4).map(mc).concat(p.slice(4, 8).map(rv), p.slice(8, 12).map(tp))), "Bundesländer und Hauptstädte");
}
