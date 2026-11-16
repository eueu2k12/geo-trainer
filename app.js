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
  return { pts: 0, st: {}, t: {}, pg: {}, bad: {}, mine: [], err: [], sel: [UN[0]],
           set: { mode: "auto", color: "blau", voice: "", rate: 0.9, auto: false } };
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
const inSel = x => {                                        // gehört Eintrag zur aktuellen Auswahl?
  if (!S.sel.includes(x.u)) return false;
  const a = S.pg[x.u] || ["Alle"];
  return a.includes("Alle") || (x.p != null && a.includes(x.p));
};
const T = () => allT().filter(inSel), QZ = () => C.quiz.filter(inSel), FL = () => C.fill.filter(inSel);
function pagesOf(u) {
  const s = new Set();
  allT().concat(C.quiz, C.fill).forEach(x => { if (x.u == u && x.p != null) s.add(x.p); });
  return [...s].sort((a, b) => a - b);
}
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
  const q0 = qs[0]; if (q0 && (q0.dict || q0.listen)) say(q0.say);
}
function quiz() {
  if (!Q) return home();
  const q = Q.qs[Q.i];
  if (!q) return `<h1>Fertig! 🎉</h1><div class="card"><div class="big">${Q.ok} von ${Q.qs.length} richtig</div><p>${Q.ok == Q.qs.length ? "Perfekt!" : Q.ok >= Q.qs.length * .7 ? "Sehr gut gemacht!" : "Übung hilft – versuch es gleich noch einmal."}</p><a class="btn p" href="#home">Zur Startseite</a></div>`;
  let h = `<h1>${esc(Q.t)}</h1><p class="mu">Frage ${Q.i + 1} von ${Q.qs.length}</p><div class="card">${q.vis || ""}<div class="big">${esc(q.q)}${spkBtn(q)}</div>${listenRow(q)}`;
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
  rec(q.k, g); errRec(q, g); render(); if (S.set.auto) sayQ();
}
function tans() {
  const q = Q.qs[Q.i]; if (Q.sel != null) return;
  const r = $("#qa").value; if (!norm(r)) return;
  const g = accepts(q.acc, r); Q.sel = g ? q.a : "✗"; if (g) Q.ok++;
  rec(q.k, g); errRec(q, g); render(); if (S.set.auto) sayQ();
}
function nxt() { Q.i++; Q.sel = null; Q.h = 0; render(); const q = Q.qs[Q.i]; if (q && (q.dict || q.listen)) say(q.say); }

/* Meine Fehler: falsch beantwortete Fragen merken, nach 2 richtigen Wiederholungen entfernen */
function errRec(q, g) {
  S.err = S.err || [];
  const key = (q.q || "") + "|" + q.a; const it = S.err.find(x => x.key == key);
  if (it) { if (g) { it.ok = (it.ok || 0) + 1; if (it.ok >= 2) S.err = S.err.filter(x => x !== it); } else it.ok = 0; }
  else if (!g && !Q.er) {
    S.err.push({ key, q: q.q, a: q.a, o: q.opts, e: q.e, k: q.k, ty: q.ty, acc: q.acc, vis: q.vis, sp: q.sp, spA: q.spA, say: q.say, dict: q.dict, listen: q.listen, ok: 0 });
    if (S.err.length > 150) S.err.shift();
  }
  save();
}
function errGo(n) { start(sh(S.err || []).slice(0, n).map(it => ({ ...it, opts: it.ty ? [] : sh(it.o || []) })), "Meine Fehler", 1); }

/* ---------- 4. Ansichten ---------- */
const NAV = [["home", "Start"], ["begriffe", "Begriffe"], ["quiz", "Quiz"], ["luecken", "Lückentexte"], ["hoeren", "Hören"],
             ["test", "Test"], ["fortschritt", "Fortschritt"], ["fehler", "Fehler"], ["einstellungen", "Einstellungen"]];
function render() {
  const v = location.hash.slice(1) || "home";
  $("#nav").innerHTML = NAV.map(n => `<a href="#${n[0]}" class="${n[0] == v ? "on" : ""}">${n[1]}</a>`).join("");
  const f = { home, begriffe, quizwahl, luecken, hoeren, test, fortschritt, fehler, einstellungen, quiz }[v] || home;
  $("#app").innerHTML = f();
  const a = $("#ans") || $("#qa"); if (a && (a.id == "qa" || !V.res)) a.focus();
}
window.addEventListener("hashchange", render);

/* Start: Begrüßung, Unit-/Seitenauswahl, Kacheln, Lernzeit, Fußnote */
function toggleUnit(u) { S.sel = S.sel.includes(u) ? S.sel.filter(x => x != u) : [...S.sel, u]; if (!S.sel.length) S.sel = [u]; V.w = null; save(); render(); }
function togglePage(u, p) {
  let a = S.pg[u] || ["Alle"];
  if (p == "Alle") a = ["Alle"];
  else { a = a.filter(x => x != "Alle"); a = a.includes(p) ? a.filter(x => x != p) : [...a, p]; if (!a.length) a = ["Alle"]; }
  S.pg[u] = a; V.w = null; save(); render();
}
function unitBox() {
  const cnt = u => allT().filter(t => t.u == u).length;
  const row = (label, extra, oc, on) => `<label class="chk"><input type="checkbox" ${on ? "checked" : ""} onchange="${oc}"><span>${label}</span><span class="mu">${extra}</span></label>`;
  let h = `<div class="card"><b>Was möchtest du üben?</b>`;
  UN.forEach(u => {
    h += row(esc(UNAME[u]), cnt(u) + " Begriffe", `toggleUnit('${u}')`, S.sel.includes(u));
    const pl = pagesOf(u);
    if (S.sel.includes(u) && pl.length) {
      const a = S.pg[u] || ["Alle"];
      h += `<div class="sub">` + pl.map(p => row(String(p), "", `togglePage('${u}',${p})`, a.includes(p))).join("") + row("Alle", "", `togglePage('${u}','Alle')`, a.includes("Alle")) + `</div>`;
    }
  });
  return h + `</div>`;
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
  ${unitBox()}
  <div class="grid"><a class="tile" href="#begriffe"><span>📚</span>Begriffe</a><a class="tile" href="#quiz"><span>✅</span>Quiz</a><a class="tile" href="#luecken"><span>📝</span>Lückentexte</a><a class="tile" href="#hoeren"><span>🎧</span>Hören</a><a class="tile" href="#test"><span>🏆</span>Test</a><a class="tile" href="#fortschritt"><span>📈</span>Fortschritt</a><a class="tile" href="#fehler"><span>🔁</span>Meine Fehler</a></div>
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
  let h = `<h1>Begriffe</h1><select onchange="V.unit=this.value;pick();render()"><option value="all">Alle gewählten Begriffe</option><option value="hard"${V.unit == "hard" ? " selected" : ""}>Schwierige Begriffe</option><option value="hardall"${V.unit == "hardall" ? " selected" : ""}>Meine Fehler (alle Units)</option></select>`;
  const w = V.w; if (!w) return h + `<div class="card">Hier gibt es noch keine Begriffe.</div>`;
  h += `<div class="card"><div class="big">${esc(w.q)}<button class="spk" onclick="say(V.w.q)" aria-label="Vorlesen">🔊</button></div>
  <input id="ans" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Antwort schreiben" ${V.res ? "disabled" : ""} onkeydown="if(event.key=='Enter')${V.res ? "nextT()" : "checkT()"}">`;
  h += V.res ? `<p class="${V.res.good ? "good" : "badc"}">${V.res.good ? "Richtig! ✅" : "Leider falsch. Richtig ist: " + esc(alts(w.a)[0])} ${esc(w.e || "")}</p><button class="p" onclick="nextT()">Weiter</button>` : `<button class="p" onclick="checkT()">Prüfen</button>`;
  return h + `</div>`;
}
function checkT() {
  const t = V.w, v = $("#ans").value; if (!norm(v)) return;
  const good = accepts(alts(t.a).concat(t.alt || []), v), s = ws(tkey(t));
  s.box = good ? Math.min(s.box + 1, 4) : 0; good ? s.ok++ : s.bad++;
  rec([t.u, "t:Begriffe"], good); V.res = { good }; render(); if (S.set.auto) say(alts(t.a)[0]);
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
  return `<h1>Test</h1><p class="mu">Gemischte Fragen aus der gewählten Auswahl.</p><button class="p" onclick="startTest(10)">Kurz (10)</button><button class="p" onclick="startTest(20)">Groß (20)</button>`;
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
  let h = `<h1>Fortschritt</h1><div class="card"><div class="big">${S.pts} Punkte</div></div><h2>Pro Unit / Thema</h2>`;
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

/* ---------- 5. Vorlesen (Sprachausgabe des Geräts, Sprache in content.js: speechLang) ---------- */
const TTS = { ok: "speechSynthesis" in window && "SpeechSynthesisUtterance" in window };
const SL = (A.speechLang || "de-DE");
let VOICES = [];
function loadVoices() { if (!TTS.ok) return; try { VOICES = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().indexOf(SL.slice(0, 2).toLowerCase()) == 0); } catch (e) {} }
if (TTS.ok) { loadVoices(); try { speechSynthesis.onvoiceschanged = () => { loadVoices(); if (location.hash == "#einstellungen") render(); }; } catch (e) {} }
function bestVoice() {
  const n = S.set.voice; if (n) { const v = VOICES.find(x => x.name == n); if (v) return v; }
  const sc = v => (v.lang.replace("_", "-").toLowerCase() == SL.toLowerCase() ? 100 : 10) + (/premium|enhanced|erweitert|siri/i.test(v.name) ? 20 : 0) + (v.localService ? 1 : 0);
  return [...VOICES].sort((a, b) => sc(b) - sc(a))[0] || null;
}
const spk = t => String(t).replace(/\([^)]*\)/g, " ").replace(/___+/g, " … ").replace(/\s+/g, " ").trim();
function say(t, slow) {
  if (!TTS.ok || !t) return;
  try {
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(spk(t)), v = bestVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = SL;
    u.rate = Math.max(0.3, (S.set.rate || 0.9) * (slow ? 0.65 : 1)); speechSynthesis.resume(); speechSynthesis.speak(u);
  } catch (e) {}
}
function sayQ() {
  const q = Q.qs[Q.i]; if (!q) return; const done = Q.sel != null;
  const t = q.say || (done && q.spA) || (q.sp ? q.sp.replace(/___+/g, done ? q.a : "…") : "");
  if (t) say(t);
}
function spkBtn(q) { const done = Q.sel != null; return (!q.dict && !q.listen && (q.sp || (done && q.spA))) ? ` <button class="spk" onclick="sayQ()" aria-label="Vorlesen">🔊</button>` : ""; }
function listenRow(q) {
  if (q.dict && Q.sel != null) return `<div style="margin:8px 0"><button onclick="sayQ()">🔊 Nochmal hören</button></div>`;
  if (q.listen || q.dict) {
    const n = String(q.a).split(" ").length;
    return `<div style="margin:8px 0"><button class="p" onclick="sayQ()">🔊 Anhören</button><button onclick="say(Q.qs[Q.i].say,1)">🐢 Langsam</button>${q.dict ? `<button onclick="Q.h=1;render()">💡 Tipp</button>` : ""}</div>${q.dict && Q.h ? `<p class="mu">Tipp: ${esc(String(q.a).slice(0, 1))} … (${n} ${n > 1 ? "Wörter" : "Wort"}, ${String(q.a).length} Zeichen)</p>` : ""}`;
  }
  return "";
}
const dq = (t, e) => ({ q: "Höre zu und schreibe auf.", say: t, dict: 1, ty: 1, a: t, acc: [t], opts: [], e, k: ["t:Hören"] });
function hrGo(kind, n) {
  const W = T().filter(t => alts(t.a)[0].length <= 30); let qs = [];
  if (kind == "dw") qs = sh(W).slice(0, n).map(t => dq(alts(t.a)[0], `Richtig: ${alts(t.a)[0]}`));
  else qs = sh(W).slice(0, n).map(t => {
    const c = alts(t.a)[0], wr = [...new Set(sh(W.filter(x => x !== t)).map(x => alts(x.a)[0]))].filter(x => x != c).slice(0, 3);
    return { q: "Welches Wort hörst du?", a: c, opts: sh([c].concat(wr)), e: `${c}`, k: ["t:Hören"], say: c, listen: 1 };
  });
  start(qs, "Hören");
}
function hoeren() {
  if (!TTS.ok) return `<h1>Hören 🎧</h1><div class="card">Dieses Gerät kann leider nicht vorlesen.</div>`;
  return `<h1>Hören 🎧</h1><p class="mu">Ton am Gerät anmachen, Stummschalter aus. Die Inhalte richten sich nach deiner Auswahl.</p>
  <h2>Hören und schreiben</h2><button class="p" onclick="hrGo('dw',10)">10 Wörter</button>
  <h2>Hören und auswählen</h2><button class="p" onclick="hrGo('mc',10)">10 Fragen</button>
  <h2>Stimme testen</h2><button onclick="say('${esc(A.testSatz || "Hallo! Das ist meine Stimme.")}')">🔊 Probe</button>`;
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
  let h = `<h2>Aussehen</h2><div class="card"><b>Helligkeit</b><br>` + [["auto", "Automatisch"], ["light", "Hell"], ["dark", "Dunkel"]].map(a => `<button class="${s.mode == a[0] ? "on" : ""}" onclick="setSet('mode','${a[0]}')">${a[1]}</button>`).join("") +
    `<br><b>Farbe</b><br>` + Object.keys(COL).map(k => `<button class="colb ${s.color == k ? "on" : ""}" style="border-color:${COL[k][0]}" onclick="setSet('color','${k}')"><i style="background:${COL[k][0]}"></i>${COL[k][2]}</button>`).join("") + `</div><h2>Vorlesen</h2><div class="card">`;
  if (!TTS.ok) return h + `Dieses Gerät kann leider nicht vorlesen.</div>`;
  const vo = VOICES.map(v => `<option value="${esc(v.name)}"${s.voice == v.name ? " selected" : ""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("");
  return h + `<b>Stimme</b><select onchange="setSet('voice',this.value)"><option value="">Automatisch (beste Stimme)</option>${vo}</select><b>Tempo</b><input type="range" min="0.5" max="1.2" step="0.05" value="${s.rate}" oninput="setSet('rate',this.value,1)"><label class="chk"><input type="checkbox" ${s.auto ? "checked" : ""} onchange="setSet('auto',this.checked)"><span>Automatisch vorlesen</span></label><button class="p" onclick="say('${esc(A.testSatz || "Hallo! Das ist meine Stimme.")}')">🔊 Probe</button><button onclick="loadVoices();render()">Stimmen neu laden</button><p class="mu">Bessere Stimmen: iOS-Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen.</p></div>`;
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
